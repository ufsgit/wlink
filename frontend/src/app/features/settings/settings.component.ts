import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  activeTab = 'whatsapp';
  showToken = false;
  showFbToken = false;
  showIgToken = false;
  showIgSecret = false;
  saving = false;
  testing = false;
  saveSuccess = '';
  saveError = '';

  business: any = {};
  team: any[] = [];
  billingData: any = null;
  showInvite = false;
  newAgent = { name: '', email: '', role: 'agent' };

  webhookUrl = '';
  fbWebhookUrl = '';
  igWebhookUrl = '';

  billingPlans = [
    { key: 'starter', name: 'Starter', price: 999, contacts: 1000, broadcasts: 5, agents: 1 },
    { key: 'pro', name: 'Pro', price: 2999, contacts: 10000, broadcasts: 50, agents: 5 },
    { key: 'enterprise', name: 'Enterprise', price: 9999, contacts: 100000, broadcasts: 500, agents: 25 },
  ];

  integrations = [
    { key: 'whatsapp', name: 'WhatsApp Business', desc: 'Official WhatsApp Business API integration', icon: 'bi-whatsapp', color: '#25D366' },
    { key: 'instagram', name: 'Instagram DM', desc: 'Connect your Instagram Business account', icon: 'bi-instagram', color: '#E1306C' },
    { key: 'facebook', name: 'Facebook Messenger', desc: 'Chat with customers on your Facebook Page', icon: 'bi-messenger', color: '#0084FF' },
    { key: 'openai', name: 'OpenAI (GPT-4)', desc: 'Power your chatbots with AI intelligence', icon: 'bi-robot', color: '#10b981' },
    { key: 'woocommerce', name: 'WooCommerce', desc: 'Sync products and orders automatically', icon: 'bi-cart3', color: '#9333ea' },
    { key: 'shopify', name: 'Shopify', desc: 'Import your Shopify catalog', icon: 'bi-bag', color: '#95BF47' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBusiness();
    const base = window.location.origin.replace('4200', '3000') + '/api/webhooks';
    this.webhookUrl = `${base}/whatsapp`;
    this.fbWebhookUrl = `${base}/facebook`;
    this.igWebhookUrl = `${base}/instagram`;
  }

  loadBusiness() {
    this.api.get('/settings/business').subscribe({
      next: (res: any) => {
        if (res.success) this.business = res.data;
      },
      error: () => {
        // Use default empty object
        this.business = { name: '', whatsapp_number: '', whatsapp_token: '', whatsapp_phone_id: '', fb_page_id: '', fb_token: '', ig_account_id: '', ig_token: '', ig_app_id: '', ig_app_secret: '', fb_verify_token: 'wlink_fb_verify_token', waba_id: '' };
      }
    });
  }

  loadTeam() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) this.team = res.data;
      }
    });
  }

  loadBilling() {
    this.api.get('/settings/billing').subscribe({
      next: (res: any) => {
        if (res.success) this.billingData = res.data;
      }
    });
  }

  saveWhatsAppConfig() {
    this.saving = true;
    this.saveSuccess = '';
    this.saveError = '';

    this.api.put('/settings/business', {
      name: this.business.name,
      whatsapp_number: this.business.whatsapp_number,
      whatsapp_token: this.business.whatsapp_token,
      whatsapp_phone_id: this.business.whatsapp_phone_id,
      waba_id: this.business.waba_id,
      fb_page_id: this.business.fb_page_id,
      fb_token: this.business.fb_token,
      ig_account_id: this.business.ig_account_id,
      ig_token: this.business.ig_token,
      ig_app_id: this.business.ig_app_id,
      ig_app_secret: this.business.ig_app_secret,
      fb_verify_token: this.business.fb_verify_token
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.success) {
          this.saveSuccess = 'Meta API credentials saved successfully!';
          this.business = res.data;
          setTimeout(() => this.saveSuccess = '', 5000);
        }
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.message || 'Failed to save. Please try again.';
        setTimeout(() => this.saveError = '', 5000);
      }
    });
  }

  testConnection() {
    this.testing = true;
    this.saveSuccess = '';
    this.saveError = '';

    if (!this.business.whatsapp_token || !this.business.whatsapp_phone_id) {
      this.saveError = 'Please enter and save your Access Token and Phone Number ID first.';
      this.testing = false;
      return;
    }

    this.api.post('/settings/whatsapp/test', {}).subscribe({
      next: (res: any) => {
        this.testing = false;
        if (res.success) {
          this.saveSuccess = `✅ Connection successful! Business: ${res.data.verified_name} (${res.data.display_phone_number})`;
          setTimeout(() => this.saveSuccess = '', 7000);
        } else {
          this.saveError = `❌ Connection failed: ${res.message}`;
          setTimeout(() => this.saveError = '', 7000);
        }
      },
      error: (err) => {
        this.testing = false;
        this.saveError = err.error?.message || 'Failed to connect to the Meta API. Check your credentials.';
        setTimeout(() => this.saveError = '', 7000);
      }
    });
  }

  testInstagramConnection() {
    this.testing = true;
    this.saveSuccess = '';
    this.saveError = '';

    if (!this.business.ig_token || !this.business.ig_account_id) {
      this.saveError = 'Please enter and save your Instagram Token and Account ID first.';
      this.testing = false;
      return;
    }

    this.api.post('/settings/instagram/test', {}).subscribe({
      next: (res: any) => {
        this.testing = false;
        if (res.success) {
          this.saveSuccess = `✅ Instagram Connected! Account: @${res.data.username}`;
          setTimeout(() => this.saveSuccess = '', 7000);
        } else {
          this.saveError = `❌ Instagram Failed: ${res.message}`;
          setTimeout(() => this.saveError = '', 7000);
        }
      },
      error: (err) => {
        this.testing = false;
        this.saveError = err.error?.message || 'Failed to connect to the Instagram API.';
        setTimeout(() => this.saveError = '', 7000);
      }
    });
  }

  inviteAgent() {
    if (!this.newAgent.name || !this.newAgent.email) return;
    this.api.post('/settings/team', this.newAgent).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.team.push(res.data);
          this.newAgent = { name: '', email: '', role: 'agent' };
          this.showInvite = false;
        }
      }
    });
  }

  removeAgent(id: number) {
    this.api.delete(`/settings/team/${id}`).subscribe({
      next: () => {
        this.team = this.team.filter(t => t.id !== id);
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text || '');
    this.saveSuccess = 'Copied to clipboard!';
    setTimeout(() => this.saveSuccess = '', 2000);
  }

  isIntegrated(key: string): boolean {
    if (!this.business) return false;
    switch(key) {
      case 'whatsapp': return !!this.business.whatsapp_token;
      case 'instagram': return !!this.business.ig_account_id;
      case 'facebook': return !!this.business.fb_page_id;
      case 'openai': return true; // Mocked for now
      default: return false;
    }
  }

  connectIntegration(key: string) {
    if (['whatsapp', 'instagram', 'facebook'].includes(key)) {
      this.activeTab = 'whatsapp';
      // Smooth scroll to credentials
      setTimeout(() => {
        const el = document.querySelector('.api-form-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
}
