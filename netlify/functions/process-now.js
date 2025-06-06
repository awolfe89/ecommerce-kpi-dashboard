// netlify/functions/process-now.js
// Simple endpoint to manually process a specific report
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
let app, db;

function initializeFirebase() {
  if (app) return; // Already initialized

  try {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      console.error("Error parsing Firebase service account JSON:", error);
      throw new Error("Invalid Firebase credentials format");
    }

    app = initializeApp({
      credential: cert(serviceAccount)
    });
    
    db = getFirestore();
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert eCommerce analytics consultant. Generate concise, actionable insights from KPI data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    initializeFirebase();

    const { reportId } = JSON.parse(event.body || '{}');
    
    if (!reportId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing reportId' })
      };
    }

    // Get the specific report
    const reportRef = db.collection('reportRequests').doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found' })
      };
    }

    const report = reportDoc.data();

    if (report.status !== 'pending') {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Report already processed',
          status: report.status 
        })
      };
    }

    // Update status to processing
    await reportRef.update({
      status: 'processing',
      updatedAt: FieldValue.serverTimestamp()
    });

    // Generate the report content
    const prompt = `Generate a monthly performance report for ${report.data.website.name} for ${report.data.time.currentMonthName} ${report.data.time.year}.

Current month metrics: ${JSON.stringify(report.data.metrics.currentMonth)}
Previous month metrics: ${JSON.stringify(report.data.metrics.previousMonth)}
Same month last year: ${JSON.stringify(report.data.metrics.sameMonthLastYear)}

Provide:
1. Executive summary (2-3 sentences)
2. Key performance highlights
3. Areas of concern
4. Month-over-month analysis
5. Year-over-year comparison
6. 3-5 actionable recommendations`;

    const aiContent = await callOpenAI(prompt);

    // Parse the AI response into structured sections
    const sections = aiContent.split('\n\n').filter(s => s.trim());
    
    const reportContent = {
      title: `${report.data.website.name} - ${report.data.time.currentMonthName} ${report.data.time.year} Performance Report`,
      summary: sections[0] || 'Monthly performance analysis',
      sections: sections.slice(1).map((section, index) => ({
        title: section.split('\n')[0].replace(/^\d+\.\s*/, '').replace(':', ''),
        content: section.split('\n').slice(1).join('\n').trim()
      })).filter(s => s.content),
      recommendations: [],
      generatedAt: new Date().toISOString(),
      metadata: report.data
    };

    // Extract recommendations if present
    const recSection = sections.find(s => s.toLowerCase().includes('recommendation'));
    if (recSection) {
      reportContent.recommendations = recSection
        .split('\n')
        .filter(line => line.match(/^[-•]\s+/))
        .map(line => line.replace(/^[-•]\s+/, ''));
    }

    // Update the report with completed status
    await reportRef.update({
      status: 'completed',
      report: reportContent,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Report processed successfully',
        reportId: reportId
      })
    };

  } catch (error) {
    console.error('Processing error:', error);
    
    // Update report status to failed if we have a reportId
    if (event.body) {
      const { reportId } = JSON.parse(event.body);
      if (reportId && db) {
        try {
          await db.collection('reportRequests').doc(reportId).update({
            status: 'failed',
            error: error.message,
            updatedAt: FieldValue.serverTimestamp()
          });
        } catch (updateError) {
          console.error('Failed to update report status:', updateError);
        }
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process report',
        details: error.message 
      })
    };
  }
};