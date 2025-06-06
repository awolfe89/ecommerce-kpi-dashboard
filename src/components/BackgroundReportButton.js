// src/components/BackgroundReportButton.js
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import aiReportService from '../services/aiReportService';

const BackgroundReportButton = ({ 
  selectedWebsite, 
  websiteName, 
  selectedYear, 
  data, 
  prevYearData,
  requirePassword = true,
  reportPassword = 'analyzer2025' // Default password, should be configured in .env
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Status polling
  const [reportId, setReportId] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const pollingRef = useRef(null);
  
  // Report history
  const [lastCompletedReport, setLastCompletedReport] = useState(null);
  const [hasCheckedHistory, setHasCheckedHistory] = useState(false);
  
  // Check for existing reports on mount
  useEffect(() => {
    checkReportHistory();
  }, [selectedWebsite, selectedYear]); // Re-check when website or year changes
  
  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);
  
  // Check report history to find the most recent completed report
  const checkReportHistory = async () => {
    try {
      const history = await aiReportService.fetchReportHistory(5, true);
      
      if (history.mostRecentCompleted) {
        // Check if this report matches current website/year
        const reportMatches = 
          history.mostRecentCompleted.website?.id === selectedWebsite &&
          history.mostRecentCompleted.timePeriod?.year === selectedYear;
        
        if (reportMatches) {
          setLastCompletedReport(history.mostRecentCompleted);
        }
      }
      
      // Check if there's any report currently processing
      const processingReport = history.reports.find(
        r => (r.status === 'pending' || r.status === 'processing') &&
             r.website?.id === selectedWebsite &&
             r.timePeriod?.year === selectedYear
      );
      
      if (processingReport) {
        setReportId(processingReport.reportId);
        setReportStatus(processingReport.status);
        setLoading(true);
        startPolling(processingReport.reportId);
      }
      
      setHasCheckedHistory(true);
    } catch (err) {
      console.error('Error checking report history:', err);
      setHasCheckedHistory(true);
    }
  };
  
  // Prepare data for report generation
  const prepareDataContext = () => {
    // Get the current month (or the last month with data)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentMonthData = data.find(item => item.month === currentMonth);
    const previousMonthData = data.find(item => item.month === (currentMonth === 1 ? 12 : currentMonth - 1));
    const sameMonthLastYear = prevYearData.find(item => item.month === currentMonth);
    
    return {
      website: {
        id: selectedWebsite,
        name: websiteName
      },
      time: {
        year: selectedYear,
        month: currentMonth,
        currentMonthName: getMonthName(currentMonth)
      },
      metrics: {
        currentMonth: currentMonthData || null,
        previousMonth: previousMonthData || null,
        sameMonthLastYear: sameMonthLastYear || null,
        allMonthsThisYear: data || [],
      }
    };
  };
  
  // Initialize a report request
  const requestReport = async () => {
    setLoading(true);
    setError(null);
    setLastCompletedReport(null); // Clear any existing completed report
    
    try {
      const dataContext = prepareDataContext();
      
      // Request a report to be generated in the background
      const result = await aiReportService.requestReport('monthly', dataContext);
      
      // Store the report ID for polling
      const newReportId = result.reportId;
      setReportId(newReportId);
      setReportStatus(result.status);
      
      // Trigger the processor to start processing immediately
      try {
        await aiReportService.triggerProcessor();
        console.log('Report processor triggered successfully');
      } catch (processorError) {
        console.error('Failed to trigger processor, report will be processed on next scheduled run:', processorError);
      }
      
      // Start polling for report status
      startPolling(newReportId);
      
    } catch (err) {
      console.error('Error requesting report:', err);
      setError('Failed to initiate report generation. Please try again later.');
      setLoading(false);
    }
  };
  
  // Start polling for report status
  const startPolling = (id) => {
    // Clear any existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    // Start with a short interval that gradually increases
    let interval = 2000; // 2 seconds
    let pollCount = 0;
    
    const poll = async () => {
      try {
        // Check the status of the report
        const status = await aiReportService.checkReportStatus(id);
        setReportStatus(status.status);
        
        // If the report is completed, fetch the full report
        if (status.status === 'completed' && status.report) {
          setReport(status.report);
          setShowModal(true);
          setLoading(false);
          setReportId(null);
          
          // Update last completed report
          setLastCompletedReport({
            reportId: id,
            report: status.report,
            completedAt: status.completedAt || new Date().toISOString()
          });
          
          // Stop polling
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        } 
        // If the report failed, show an error
        else if (status.status === 'failed') {
          setError(`Report generation failed: ${status.error || 'Unknown error'}`);
          setLoading(false);
          setReportId(null);
          
          // Stop polling
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        // Otherwise, continue polling with increased interval
        else {
          pollCount++;
          
          // Increase interval after several attempts (up to a reasonable maximum)
          if (pollCount === 5) interval = 5000; // 5 seconds
          if (pollCount === 10) interval = 10000; // 10 seconds
          if (pollCount === 15) interval = 30000; // 30 seconds
          
          // If we've been polling for too long (over 5 minutes), stop and show an error
          if (pollCount > 20) {
            setError('The report is still processing in the background. It will be available when you return.');
            setLoading(false);
            
            // Stop polling
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error polling report status:', err);
        setError('Error checking report status. Please try again later.');
        setLoading(false);
        
        // Stop polling
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    
    // Start polling immediately and then on the interval
    poll();
    pollingRef.current = setInterval(poll, interval);
  };
  
  // Handle the report generation button click
  const handleGenerateReport = () => {
    if (requirePassword) {
      setShowPasswordModal(true);
    } else {
      requestReport();
    }
  };
  
  // Verify password and generate report
  const verifyPasswordAndGenerate = () => {
    if (passwordInput === reportPassword) {
      setShowPasswordModal(false);
      setPasswordInput('');
      requestReport();
    } else {
      setError('Incorrect password');
    }
  };
  
  // Fetch the last completed report
  const fetchLastReport = () => {
    if (lastCompletedReport?.report) {
      setReport(lastCompletedReport.report);
      setShowModal(true);
    }
  };
  
  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthNum - 1];
  };

  // Get status message based on current status
  const getStatusMessage = () => {
    switch (reportStatus) {
      case 'pending':
        return 'Report queued. Processing will begin shortly...';
      case 'processing':
        return 'AI is analyzing your data and generating insights...';
      default:
        return 'Initializing report generation...';
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Don't render anything until we've checked history
  if (!hasCheckedHistory) {
    return <div className="text-gray-500">Loading report status...</div>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Main Generate Report Button */}
        {!loading && (
          <button
            onClick={handleGenerateReport}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            Generate Performance Report
          </button>
        )}
        
        {/* Status while processing */}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 dark:text-gray-300">{getStatusMessage()}</span>
          </div>
        )}
        
        {/* Fetch Last Report button - only show when there's a completed report and not currently processing */}
        {!loading && lastCompletedReport && !showModal && (
          <button
            onClick={fetchLastReport}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            View Last Report
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({formatDate(lastCompletedReport.completedAt)})
            </span>
          </button>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Enter Report Password</h3>
            
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter password"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  verifyPasswordAndGenerate();
                }
              }}
              autoFocus
            />
            
            {error && (
              <div className="mt-2 text-red-600 text-sm">{error}</div>
            )}
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setError(null);
                }}
                className="px-4 py-2 border rounded-md dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={verifyPasswordAndGenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Modal */}
      {showModal && report && (
        <Modal 
          title={report.title || `Performance Report - ${websiteName}`}
          onClose={() => setShowModal(false)}
          size="lg"
        >
          <div className="prose dark:prose-invert max-w-none">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2">Executive Summary</h3>
              <p>{report.summary}</p>
            </div>
            
            {report.sections.map((section, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-medium mb-2">{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))}
            
            {report.recommendations && (
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md text-blue-800 dark:text-blue-200 mt-4">
                <h3 className="font-medium mb-2">Recommendations</h3>
                <ul className="list-disc list-inside">
                  {report.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Report generated at {formatDate(report.generatedAt)}
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => {
                // Create a printable version and print
                const printContent = document.createElement('div');
                printContent.innerHTML = document.querySelector('.prose').innerHTML;
                printContent.classList.add('p-8');
                
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>${report.title}</title>
                      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                      <style>
                        body { font-family: Arial, sans-serif; }
                        @media print {
                          .no-print { display: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="max-w-4xl mx-auto">
                        <h1 class="text-2xl font-bold mb-4">${report.title}</h1>
                        ${printContent.outerHTML}
                      </div>
                      <div class="mt-8 no-print">
                        <button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded">Print Report</button>
                      </div>
                    </body>
                  </html>
                `);
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
            >
              Print Report
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default BackgroundReportButton;