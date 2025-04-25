// src/services/aiReportService.js
import auth from '../config/netlifyAuth';

class AIReportService {
  constructor() {
    // Base URL for the Netlify serverless function
    this.baseUrl = '/.netlify/functions/ai-report';
    
    // OpenAI API model to use (can be configured based on your preference)
    this.model = 'gpt-4-turbo';
  }
  
  /**
   * Generates a monthly performance report using AI
   * @param {Object} dataContext - The data context for report generation
   * @returns {Promise<Object>} - The generated report
   */
  async generateMonthlyReport(dataContext) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'monthly',
          model: this.model,
          data: dataContext
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate report: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error in AI report generation:', error);
      throw error;
    }
  }
  
  /**
   * Generate a comparison report between websites
   * @param {Array} websitesData - Data for all websites
   * @returns {Promise<Object>} - The generated comparison report
   */
  async generateComparisonReport(websitesData) {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'comparison',
          model: this.model,
          data: { websites: websitesData }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate comparison report: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      return result;
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
}

export default new AIReportService();