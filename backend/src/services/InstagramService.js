const axios = require('axios');
const pool = require('../db/pool');
require('dotenv').config();

class InstagramService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getCredentials(businessId) {
    const [rows] = await pool.query('SELECT ig_token, ig_account_id, fb_page_id FROM businesses WHERE id=?', [businessId]);
    if (rows.length && rows[0].ig_token) {
      return { token: rows[0].ig_token, accountId: rows[0].ig_account_id, pageId: rows[0].fb_page_id };
    }
    return { token: null, accountId: null, pageId: null };
  }

  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async sendTextMessage(recipientId, text, businessId) {
    const { token, accountId, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Instagram not configured (Token missing)' };
    
    // Using 'me' is the most universal way to send messages via a Page Access Token
    const idToUse = 'me';
    
    console.log(`🚀 Instagram Sending via 'me' (Linked to IG:${accountId}, Page:${pageId}), Recipient=${recipientId}`);
    
    try {
      const payload = {
        recipient: { id: recipientId },
        message: { text: text },
        messaging_type: 'RESPONSE'
      };

      const res = await axios.post(`${this.baseUrl}/${idToUse}/messages`, payload, { 
        headers: this.getHeaders(token) 
      });
      return { success: true, data: res.data };
    } catch (err) {
      const errorData = err.response?.data?.error;
      console.error('❌ Instagram Send Error:', JSON.stringify(err.response?.data || err.message, null, 2));
      
      let errorMessage = errorData?.message || errorData?.error_user_msg || err.message || 'Unknown Error';
      
      if (idToUse === 'me' && (errorMessage.includes('me') || errorMessage.includes('Object with ID') || errorMessage.includes('Unsupported post request'))) {
        errorMessage = 'Facebook Page ID is missing or incorrect in settings. Instagram Messaging requires a valid linked Facebook Page ID (not "me").';
      }
      
      return { success: false, message: errorMessage };
    }
  }

  async sendMediaMessage(recipientId, type, mediaUrl, businessId) {
    const { token, accountId, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Instagram not configured' };
    
    const idToUse = 'me';
    console.log(`🚀 Instagram Sending Media (${type}) via 'me' (Linked to IG:${accountId}, Page:${pageId}), Recipient=${recipientId}`);

    try {
      const res = await axios.post(`${this.baseUrl}/${idToUse}/messages`, {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: type === 'image' ? 'image' : (type === 'video' ? 'video' : 'file'),
            payload: { url: mediaUrl }
          }
        },
        messaging_type: 'RESPONSE'
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      const errorData = err.response?.data?.error;
      console.error('❌ Instagram Media Send Error:', JSON.stringify(err.response?.data || err.message, null, 2));
      
      let errorMessage = errorData?.message || errorData?.error_user_msg || err.message || 'Unknown Error';
      
      if (idToUse === 'me' && (errorMessage.includes('me') || errorMessage.includes('Object with ID') || errorMessage.includes('Unsupported post request'))) {
        errorMessage = 'Facebook Page ID is missing or incorrect in settings. Instagram Messaging requires a valid linked Facebook Page ID (not "me").';
      }

      return { success: false, message: errorMessage };
    }
  }

  async getUserProfile(igSid, businessId) {
    const { token } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Instagram not configured' };
    try {
      const res = await axios.get(`${this.baseUrl}/${igSid}`, {
        headers: this.getHeaders(token),
        params: { fields: 'name,profile_pic' }
      });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async testConnection(businessId) {
    try {
      const { token, accountId } = await this.getCredentials(businessId);
      if (!token || !accountId) return { success: false, message: 'Instagram credentials not configured' };

      const res = await axios.get(`${this.baseUrl}/${accountId}`, {
        headers: this.getHeaders(token),
        params: { fields: 'username,name,profile_picture_url' }
      });

      return {
        success: true,
        data: res.data,
        message: 'Connection successful'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error?.message || err.message
      };
    }
  }
}

module.exports = new InstagramService();
