import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit {
  contacts: any[] = [];
  loading = false;
  showModal = false;
  searchQuery = '';
  activeTag = '';
  activeChannel = '';
  allTags: string[] = [];
  editingContactId: number | null = null;
  
  newContact: any = {
    name: '',
    phone: '',
    email: '',
    tags: 'lead',
    channel_preference: 'whatsapp'
  };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadContacts();
    this.loadTags();
  }

  loadContacts() {
    this.loading = true;
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.activeTag) params.tags = this.activeTag;
    if (this.activeChannel) params.channel = this.activeChannel;
    
    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        this.contacts = res.data.map((c: any) => ({
          ...c,
          tags: Array.isArray(c.tags) ? c.tags : JSON.parse(c.tags || '[]')
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadTags() {
    this.api.get('/contacts/tags').subscribe({
      next: (res: any) => this.allTags = res.data
    });
  }

  onSearch() {
    this.loadContacts();
  }

  openAddModal() {
    this.editingContactId = null;
    this.newContact = { name: '', phone: '', email: '', tags: 'lead', channel_preference: 'whatsapp' };
    this.showModal = true;
  }

  openEditModal(contact: any) {
    this.editingContactId = contact.id;
    const tagsArray = Array.isArray(contact.tags) ? contact.tags : [];
    this.newContact = {
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      tags: tagsArray.join(', '),
      channel_preference: contact.channel_preference || 'whatsapp'
    };
    this.showModal = true;
  }

  saveContact() {
    if (!this.newContact.name || !this.newContact.phone) {
      alert('Name and Phone are required');
      return;
    }

    const payload = {
      ...this.newContact,
      tags: this.newContact.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    };

    const request = this.editingContactId 
      ? this.api.put(`/contacts/${this.editingContactId}`, payload)
      : this.api.post('/contacts', payload);

    request.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadContacts();
          this.loadTags();
          this.showModal = false;
        }
      },
      error: (err) => alert(err.error?.message || 'Error saving contact')
    });
  }

  deleteContact(id: number) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    this.api.delete(`/contacts/${id}`).subscribe({
      next: () => {
        this.loadContacts();
        this.loadTags();
      }
    });
  }

  exportContacts() {
    window.open(`${this.api.apiUrl}/contacts/export`, '_blank');
  }

  importContacts(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.api.post('/contacts/import', formData).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.loadContacts();
        this.loadTags();
      },
      error: (err) => alert(err.error?.message || 'Error importing contacts')
    });
  }

  goToChat(contact: any) {
    this.api.post('/conversations', { 
      contact_id: contact.id, 
      channel: contact.channel_preference || 'whatsapp' 
    }).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.router.navigate(['/inbox'], { queryParams: { convoId: res.data.id } });
        }
      },
      error: (err) => alert(err.error?.message || 'Error opening chat')
    });
  }
}
