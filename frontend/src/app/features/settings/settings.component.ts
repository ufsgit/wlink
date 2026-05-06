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

  billingPlans = [
    { key: 'starter', name: 'Starter', price: 999, contacts: 1000, broadcasts: 5, agents: 1 },
    { key: 'pro', name: 'Pro', price: 2999, contacts: 10000, broadcasts: 50, agents: 5 },
    { key: 'enterprise', name: 'Enterprise', price: 9999, contacts: 100000, broadcasts: 500, agents: 25 },
  ];

  integrations = [
    { name: 'WooCommerce', desc: 'Sync products and orders automatically', icon: 'bi-cart3', color: '#9333ea', connected: false },
    { name: 'Shopify', desc: 'Import your Shopify catalog', icon: 'bi-bag', color: '#95BF47', connected: false },
    { name: 'OpenAI (GPT-4)', desc: 'Power your chatbots with AI intelligence', icon: 'bi-robot', color: '#10b981', connected: true },
    { name: 'Razorpay', desc: 'Accept payments in WhatsApp conversations', icon: 'bi-credit-card', color: '#0066ff', connected: false },
    { name: 'Google Sheets', desc: 'Sync contacts and data to spreadsheets', icon: 'bi-file-earmark-spreadsheet', color: '#34A853', connected: false },
    { name: 'Zapier / Pabbly', desc: 'Connect 5,000+ apps with automation', icon: 'bi-lightning', color: '#FF4A00', connected: false },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBusiness();
    this.webhookUrl = window.location.origin.replace('4200', '3000') + '/api/webhooks/whatsapp';
  }

  loadBusiness() {
    this.api.get('/settings/business').subscribe({
      next: (res: any) => {
        if (res.success) this.business = res.data;
      },
      error: () => {
        // Use default empty object
        this.business = { name: '', whatsapp_number: '', whatsapp_token: '', whatsapp_phone_id: '', fb_page_id: '', ig_account_id: '', fb_verify_token: 'wlink_fb_verify_token', waba_id: '' };
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
      fb_page_id: this.business.fb_page_id,
      ig_account_id: this.business.ig_account_id,
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
}
