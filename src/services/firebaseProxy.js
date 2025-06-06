import auth from '../config/netlifyAuth';

class FirebaseProxyService {
  async callFunction(action, collection, options = {}) {
    try {
      const user = auth.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      const token = await auth.getAuthToken();
      
      const response = await fetch('/.netlify/functions/firebase-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          collection,
          document: options.document || null,
          data: options.data || null,
          query: options.query || null
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase proxy error: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Firebase proxy error:', error);
      throw error;
    }
  }
  
  // Helper methods
  async getDocuments(collection, query) {
    return await this.callFunction('get', collection, { query });
  }
  
  async getDocument(collection, document) {
    return await this.callFunction('get', collection, { document });
  }
  
  async addDocument(collection, data) {
    return await this.callFunction('add', collection, { data });
  }
  
  async updateDocument(collection, document, data) {
    return await this.callFunction('update', collection, { document, data });
  }
  
  async deleteDocument(collection, document) {
    return await this.callFunction('delete', collection, { document });
  }
}

const firebaseProxyService = new FirebaseProxyService();
export default firebaseProxyService;