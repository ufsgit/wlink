const axios = require('axios');
const pool = require('../db/pool');
require('dotenv').config();

class FacebookService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getCredentials(businessId) {
    const [rows] = await pool.query('SELECT fb_token, fb_page_id FROM businesses WHERE id=?', [businessId]);
    if (rows.length && rows[0].fb_token) {
      return { token: rows[0].fb_token, pageId: rows[0].fb_page_id };
    }
    return { token: null, pageId: null };
  }

  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async sendTextMessage(recipientId, text, businessId) {
    const { token, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Facebook Messenger not configured' };
    const idToUse = pageId || 'me';
    try {
      const res = await axios.post(`${this.baseUrl}/${idToUse}/messages`, {
        recipient: { id: recipientId },
        message: { text: text },
        messaging_type: 'RESPONSE'
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendMediaMessage(recipientId, type, mediaUrl, businessId) {
    const { token, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Facebook Messenger not configured' };
    const idToUse = pageId || 'me';
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
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }
}

module.exports = new FacebookService();
