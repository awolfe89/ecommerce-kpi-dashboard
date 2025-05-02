// netlify/functions/report-processor.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
let app, db;

function initializeFirebase() {
  if (app) return; // Already initialized

  try {
    // Get Firebase service account credentials from environment variable
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      console.error("Error parsing Firebase service account JSON:", error);
      throw new Error("Invalid Firebase credentials format");
    }

    // Initialize the app with credentials
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    
    // Initialize Firestore
    db = getFirestore();
    
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// This function is triggered by a scheduled event or webhook
exports.handler = async (event, context) => {
  console.log('Started report processor');
  
  // Ensure Firebase is initialized
  try {
    initializeFirebase();
  } catch (error) {
    console.error(`Firebase initialization failed: ${error.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Firebase initialization failed: ${error.message}` })
    };
  }

  try {
    // Find pending report requests
    const pendingReportsSnapshot = await db.collection('reportRequests')
      .where('status', '==', 'pending')
      .orderBy('createdAt')
      .limit(5) // Process a few at a time to avoid overloading
      .get();
    
    if (pendingReportsSnapshot.empty) {
      console.log('No pending reports found');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No pending reports to process' })
      };
    }
    
    console.log(`Found ${pendingReportsSnapshot.size} pending reports`);
    
    // Process each pending report
    const processingPromises = [];
    
    pendingReportsSnapshot.forEach(doc => {
      const reportRequest = { id: doc.id, ...doc.data() };
      processingPromises.push(processReport(reportRequest));
    });
    
    // Wait for all processing to complete
    await Promise.all(processingPromises);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: `Processed ${pendingReportsSnapshot.size} reports` 
      })
    };
  } catch (error) {
    console.error('Report processor error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Process a single report
async function processReport(reportRequest) {
  console.log(`Processing report ${reportRequest.id}`);
  
  const reportRef = db.collection('reportRequests').doc(reportRequest.id);
  
  try {
    // Update status to processing
    await reportRef.update({
      status: 'processing',
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Generate the appropriate prompt based on report type
    let prompt = '';
    if (reportRequest.type === 'monthly') {
      prompt = generateMonthlyReportPrompt(reportRequest.data);
    } else if (reportRequest.type === 'comparison') {
      prompt = generateComparisonReportPrompt(reportRequest.data);
    } else {
      throw new Error('Invalid report type');
    }
    
    // Call OpenAI API to generate the report
    console.log(`Calling OpenAI API for report ${reportRequest.id}`);
    const openaiResponse = await callOpenAI(prompt, 'gpt-4-turbo');
    
    // Process and format the response
    const formattedReport = formatReport(openaiResponse, reportRequest.data, reportRequest.type);
    
    // Store the completed report
    await reportRef.update({
      status: 'completed',
      report: formattedReport,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`Report ${reportRequest.id} completed successfully`);
  } catch (error) {
    console.error(`Error processing report ${reportRequest.id}:`, error);
    
    // Check if we should retry
    const retryCount = reportRequest.retryCount || 0;
    const maxRetries = reportRequest.maxRetries || 3;
    
    if (retryCount < maxRetries) {
      // Update for retry
      await reportRef.update({
        status: 'pending',
        error: error.message,
        retryCount: retryCount + 1,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      console.log(`Scheduled report ${reportRequest.id} for retry (${retryCount + 1}/${maxRetries})`);
    } else {
      // Mark as failed after max retries
      await reportRef.update({
        status: 'failed',
        error: error.message,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      console.log(`Report ${reportRequest.id} failed after ${maxRetries} attempts`);
    }
  }
}

// Generate a prompt for the monthly report
function generateMonthlyReportPrompt(data) {
  const { website, time, metrics } = data;
  
  // Format the current month data
  const currentMonth = metrics.currentMonth || { sales: 0, users: 0, sessionDuration: 0, bounceRate: 0 };
  const previousMonth = metrics.previousMonth || { sales: 0, users: 0, sessionDuration: 0, bounceRate: 0 };
  const sameMonthLastYear = metrics.sameMonthLastYear || { sales: 0, users: 0, sessionDuration: 0, bounceRate: 0 };
  
  // Calculate changes
  const vsLastMonth = {
    sales: currentMonth.sales - previousMonth.sales,
    salesPercent: previousMonth.sales ? ((currentMonth.sales - previousMonth.sales) / previousMonth.sales * 100).toFixed(2) : 'N/A',
    users: currentMonth.users - previousMonth.users,
    usersPercent: previousMonth.users ? ((currentMonth.users - previousMonth.users) / previousMonth.users * 100).toFixed(2) : 'N/A'
  };
  
  const vsLastYear = {
    sales: currentMonth.sales - sameMonthLastYear.sales,
    salesPercent: sameMonthLastYear.sales ? ((currentMonth.sales - sameMonthLastYear.sales) / sameMonthLastYear.sales * 100).toFixed(2) : 'N/A',
    users: currentMonth.users - sameMonthLastYear.users,
    usersPercent: sameMonthLastYear.users ? ((currentMonth.users - sameMonthLastYear.users) / sameMonthLastYear.users * 100).toFixed(2) : 'N/A'
  };
  
  // Calculate yearly context
  const yearToDate = {
    sales: metrics.allMonthsThisYear.reduce((sum, month) => sum + (month.sales || 0), 0),
    users: metrics.allMonthsThisYear.reduce((sum, month) => sum + (month.users || 0), 0)
  };
  
  // Format the yearly trend
  const yearlyTrend = metrics.allMonthsThisYear.map(month => ({
    month: month.month,
    sales: month.sales || 0
  }));
  
  return `
You are an expert eCommerce analyst. Generate a comprehensive performance report for ${website.name} (ID: ${website.id}) for ${time.currentMonthName} ${time.year}.

CURRENT MONTH METRICS:
- Sales: $${currentMonth.sales?.toLocaleString() || 0}
- Users: ${currentMonth.users?.toLocaleString() || 0}
- Avg. Session Duration: ${currentMonth.sessionDuration || 0} seconds
- Bounce Rate: ${currentMonth.bounceRate || 0}%

COMPARISON WITH PREVIOUS MONTH:
- Sales: ${vsLastMonth.salesPercent}% (${vsLastMonth.sales >= 0 ? '+' : ''}$${vsLastMonth.sales?.toLocaleString() || 0})
- Users: ${vsLastMonth.usersPercent}% (${vsLastMonth.users >= 0 ? '+' : ''}${vsLastMonth.users?.toLocaleString() || 0})

COMPARISON WITH SAME MONTH LAST YEAR:
- Sales: ${vsLastYear.salesPercent}% (${vsLastYear.sales >= 0 ? '+' : ''}$${vsLastYear.sales?.toLocaleString() || 0})
- Users: ${vsLastYear.usersPercent}% (${vsLastYear.users >= 0 ? '+' : ''}${vsLastYear.users?.toLocaleString() || 0})

YEAR-TO-DATE CONTEXT:
- Total Sales: $${yearToDate.sales?.toLocaleString() || 0}
- Total Users: ${yearToDate.users?.toLocaleString() || 0}
- Monthly Sales Trend: ${JSON.stringify(yearlyTrend)}

Based on this data, please generate a detailed monthly performance report that includes:
1. An executive summary (2-3 sentences)
2. Key performance insights section
3. Month-over-month analysis section
4. Year-over-year comparison section
5. Position within yearly context section
6. 3-4 actionable recommendations based on the data

Format your response as a JSON object with the following structure:
{
  "title": "Monthly Performance Report - [Website Name] - [Month] [Year]",
  "summary": "Executive summary text here",
  "sections": [
    { "title": "Key Performance Metrics", "content": "Content here" },
    { "title": "Month-over-Month Analysis", "content": "Content here" },
    { "title": "Year-over-Year Comparison", "content": "Content here" },
    { "title": "Yearly Context", "content": "Content here" }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3",
    "Recommendation 4"
  ]
}

IMPORTANT: Your analysis should be data-driven, insightful, and professional. Include both achievements and areas of concern. Keep each section concise but informative.
IMPORTANT: **Respond with raw JSON only**, without any markdown formatting or code fences.
+IMPORTANT: **Do not mention or include any metric whose value is zero or null.** Omit any commentary on metrics that are 0.  
`;
}

// Generate a prompt for the comparison report
function generateComparisonReportPrompt(data) {
  const { websites } = data;
  
  let websiteComparisons = '';
  websites.forEach(site => {
    const yearToDate = {
      sales: site.metrics.allMonthsThisYear.reduce((sum, month) => sum + (month.sales || 0), 0),
      users: site.metrics.allMonthsThisYear.reduce((sum, month) => sum + (month.users || 0), 0)
    };
    
    websiteComparisons += `
WEBSITE: ${site.name} (ID: ${site.id})
- Current Month Sales: $${site.metrics.currentMonth?.sales?.toLocaleString() || 0}
- Current Month Users: ${site.metrics.currentMonth?.users?.toLocaleString() || 0}
- Year-to-Date Sales: $${yearToDate.sales?.toLocaleString() || 0}
- Year-to-Date Users: ${yearToDate.users?.toLocaleString() || 0}
    `;
  });
  
  return `
You are an expert eCommerce analyst. Generate a comprehensive comparison report for ${websites.length} websites for ${websites[0].time.currentMonthName} ${websites[0].time.year}.

${websiteComparisons}

Based on this data, please generate a detailed comparison report that includes:
1. An executive summary comparing all websites (2-3 sentences)
2. Performance ranking section (ranking websites by sales and growth)
3. Strengths and weaknesses of each website
4. Market share analysis (percentage of total sales for each website)
5. 3-4 actionable recommendations to improve overall performance across all websites

Format your response as a JSON object with the following structure:
{
  "title": "Website Comparison Report - [Month] [Year]",
  "summary": "Executive summary text here",
  "sections": [
    { "title": "Performance Rankings", "content": "Content here" },
    { "title": "Website Analysis", "content": "Content here" },
    { "title": "Market Share", "content": "Content here" }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3",
    "Recommendation 4"
  ]
}

IMPORTANT: Your analysis should be data-driven, insightful, and professional. Compare and contrast the websites in a meaningful way to extract actionable insights.
IMPORTANT: **Respond with raw JSON only**, without any markdown formatting or code fences.
+IMPORTANT: **Do not mention or include any metric whose value is zero or null.** Omit any commentary on metrics that are 0.  
`;
}

// Call the OpenAI API
async function callOpenAI(prompt, model) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are an expert eCommerce analyst producing detailed data-driven reports.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
}

// Format the OpenAI response into a structured report
function formatReport(response, data, type) {
  try {
    // Extract the response content
        let content = response.choices[0].message.content.trim();
    
        // Remove Markdown code-fences or stray backticks, if any slipped through
        if (content.startsWith('```')) {
         content = content
            .replace(/^```(?:json)?\s*/, '')  // opening fence
            .replace(/```$/, '')              // closing fence
            .trim();
        }
        if (content.startsWith('`') && content.endsWith('`')) {
          content = content.slice(1, -1).trim();
        }
    
    // Parse the JSON response
    const reportData = JSON.parse(content);
    
    // Add additional metadata
    return {
      ...reportData,
      generatedAt: new Date().toISOString(),
      month: type === 'monthly' ? data.time.month : data.websites[0].time.month,
      year: type === 'monthly' ? data.time.year : data.websites[0].time.year,
      type: type
    };
  } catch (error) {
    console.error('Error formatting AI response:', error);
    
    // Return a fallback report if parsing fails
    return {
      title: type === 'monthly' 
        ? `Monthly Report for ${data.website.name}` 
        : 'Website Comparison Report',
      summary: "We were unable to generate a detailed report at this time.",
      sections: [
        { 
          title: "Error Notice", 
          content: "There was an error generating the full report. Please try again later." 
        }
      ],
      recommendations: [
        "Try generating the report again"
      ],
      generatedAt: new Date().toISOString(),
      month: type === 'monthly' ? data.time.month : data.websites[0].time.month,
      year: type === 'monthly' ? data.time.year : data.websites[0].time.year,
      type: type,
      error: error.message
    };
  }
}