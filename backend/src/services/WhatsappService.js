const axios = require('axios');
const pool = require('../db/pool');
require('dotenv').config();

class WhatsappService {
  constructor() {
    this.baseUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
  }

  // Get credentials for a specific business from DB, fallback to env
  async getCredentials(businessId) {
    if (businessId) {
      const [rows] = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM businesses WHERE id=?', [businessId]);
      if (rows.length && rows[0].whatsapp_token && rows[0].whatsapp_phone_id) {
        return { token: rows[0].whatsapp_token, phoneId: rows[0].whatsapp_phone_id };
      }
    }
    // Fallback to env vars
    return {
      token: process.env.WHATSAPP_TOKEN || '',
      phoneId: process.env.WHATSAPP_PHONE_ID || ''
    };
  }

  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // Test connection by calling the Meta Graph API
  async testConnection(businessId) {
    try {
      const { token, phoneId } = await this.getCredentials(businessId);
      if (!token || !phoneId) return { success: false, message: 'WhatsApp API credentials not configured' };

      const res = await axios.get(`${this.baseUrl}/${phoneId}`, {
        headers: this.getHeaders(token),
        params: { fields: 'verified_name,display_phone_number,quality_rating' }
      });

      return {
        success: true,
        data: {
          verified_name: res.data.verified_name,
          display_phone_number: res.data.display_phone_number,
          quality_rating: res.data.quality_rating,
          phone_number_id: phoneId
        },
        message: 'Connection successful'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error?.message || err.message
      };
    }
  }

  async sendTextMessage(to, text, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'text', text: { body: text }
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendTemplateMessage(to, templateName, languageCode = 'en', components = [], businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'template',
        template: { name: templateName, language: { code: languageCode }, components }
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption = '', businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type,
        [type]: { link: mediaUrl, caption }
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendInteractiveMessage(to, interactive, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'interactive', interactive
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async submitTemplate(template, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'WhatsApp not configured' };
    try {
      const payload = {
        name: template.name, category: template.category,
        language: template.language, components: []
      };
      if (template.header_type !== 'none') {
        payload.components.push({ type: 'HEADER', format: template.header_type.toUpperCase(), text: template.header_content });
      }
      if (template.body) payload.components.push({ type: 'BODY', text: template.body });
      if (template.footer) payload.components.push({ type: 'FOOTER', text: template.footer });
      if (template.buttons) payload.components.push({ type: 'BUTTONS', buttons: template.buttons });

      const res = await axios.post(`${this.baseUrl}/${phoneId}/message_templates`, payload, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async getBusinessProfile(businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.get(`${this.baseUrl}/${phoneId}/whatsapp_business_profile`, {
        headers: this.getHeaders(token),
        params: { fields: 'about,address,description,email,profile_picture_url,websites,vertical' }
      });
      return { success: true, data: res.data.data?.[0] || res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async markAsRead(messageId, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', status: 'read', message_id: messageId
      }, { headers: this.getHeaders(token) });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }
}

module.exports = new WhatsappService();
