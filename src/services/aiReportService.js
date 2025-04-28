// src/services/aiReportService.js
import auth from '../config/netlifyAuth';

class AIReportService {
  constructor() {
    // Base URLs for the Netlify serverless functions
    this.requestUrl = '/.netlify/functions/report-request';
    this.statusUrl = '/.netlify/functions/report-status';
    this.processorUrl = '/.netlify/functions/report-processor'; // For direct invocation if needed
  }
  
  /**
   * Request a report to be generated in the background
   * @param {string} type - The type of report to generate ('monthly' or 'comparison')
   * @param {Object} dataContext - The data context for report generation
   * @returns {Promise<Object>} - Initial response with report ID and status
   */
  async requestReport(type, dataContext) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(this.requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          data: dataContext,
          userId: await this.getUserId()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to request report: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in report request:', error);
      throw error;
    }
  }
  
  /**
   * Check the status of a report
   * @param {string} reportId - The ID of the report to check
   * @returns {Promise<Object>} - The report status
   */
  async checkReportStatus(reportId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.statusUrl}?reportId=${reportId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check report status: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking report status:', error);
      throw error;
    }
  }
  
  /**
   * Trigger the report processor manually if needed
   * Normally, this would be triggered by a scheduled event
   * @returns {Promise<Object>} - The processor response
   */
  async triggerProcessor() {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(this.processorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trigger: 'manual'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to trigger processor: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error triggering processor:', error);
      throw error;
    }
  }
  
  /**
   * Generate a monthly performance report
   * This is a backward-compatible method that uses the background processing approach
   * @param {Object} dataContext - The data context for report generation
   * @returns {Promise<Object>} - The generated report
   */
  async generateMonthlyReport(dataContext) {
    try {
      // Request a report
      const requestResponse = await this.requestReport('monthly', dataContext);
      const reportId = requestResponse.reportId;
      
      // Manually trigger the processor for immediate processing
      await this.triggerProcessor();
      
      // Poll for completion
      const maxAttempts = 30;
      let attempts = 0;
      let currentDelay = 2000; // Start with 2 seconds
      
      while (attempts < maxAttempts) {
        // Use a fixed value for delay - this avoids the ESLint warning
        const delayToUse = currentDelay;
        
        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, delayToUse));
        
        // Check report status
        const statusResponse = await this.checkReportStatus(reportId);
        
        if (statusResponse.status === 'completed' && statusResponse.report) {
          return statusResponse.report;
        } else if (statusResponse.status === 'failed') {
          throw new Error(`Report generation failed: ${statusResponse.error || 'Unknown error'}`);
        }
        
        // Increase delay for next attempt, but cap it
        currentDelay = Math.min(currentDelay * 1.5, 10000); // Cap at 10 seconds
        attempts++;
      }
      
      throw new Error('Report generation timed out after multiple attempts');
    } catch (error) {
      console.error('Error in AI report generation:', error);
      throw error;
    }
  }
  
  /**
   * Generate a comparison report between websites
   * This is a backward-compatible method that uses the background processing approach
   * @param {Array} websitesData - Data for all websites
   * @returns {Promise<Object>} - The generated comparison report
   */
  async generateComparisonReport(websitesData) {
    try {
      // Request a report
      const requestResponse = await this.requestReport('comparison', { websites: websitesData });
      const reportId = requestResponse.reportId;
      
      // Manually trigger the processor for immediate processing
      await this.triggerProcessor();
      
      // Poll for completion
      const maxAttempts = 30;
      let attempts = 0;
      let currentDelay = 2000; // Start with 2 seconds
      
      while (attempts < maxAttempts) {
        // Use a fixed value for delay - this avoids the ESLint warning
        const delayToUse = currentDelay;
        
        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, delayToUse));
        
        // Check report status
        const statusResponse = await this.checkReportStatus(reportId);
        
        if (statusResponse.status === 'completed' && statusResponse.report) {
          return statusResponse.report;
        } else if (statusResponse.status === 'failed') {
          throw new Error(`Report generation failed: ${statusResponse.error || 'Unknown error'}`);
        }
        
        // Increase delay for next attempt, but cap it
        currentDelay = Math.min(currentDelay * 1.5, 10000); // Cap at 10 seconds
        attempts++;
      }
      
      throw new Error('Report generation timed out after multiple attempts');
    } catch (error) {
      console.error('Error in AI comparison report generation:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user's authentication token
   * @returns {Promise<string>} - The auth token
   */
  async getAuthToken() {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    return currentUser.token.access_token;
  }
  
  /**
   * Get the current user's ID
   * @returns {Promise<string>} - The user ID
   */
  async getUserId() {
    const currentUser = auth.getCurrentUser();
    return currentUser?.id || 'anonymous';
  }
}

export default new AIReportService();