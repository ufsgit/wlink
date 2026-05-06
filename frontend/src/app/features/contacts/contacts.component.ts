import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  
  newContact: any = {
    name: '',
    phone: '',
    email: '',
    tags: '',
    channel_preference: 'whatsapp'
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.loading = true;
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    
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

  onSearch() {
    this.loadContacts();
  }

  openAddModal() {
    this.newContact = { name: '', phone: '', email: '', tags: '', channel_preference: 'whatsapp' };
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

    this.api.post('/contacts', payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadContacts();
          this.showModal = false;
        }
      },
      error: (err) => alert(err.error?.message || 'Error saving contact')
    });
  }

  deleteContact(id: number) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    this.api.delete(`/contacts/${id}`).subscribe({
      next: () => this.loadContacts()
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
      },
      error: (err) => alert(err.error?.message || 'Error importing contacts')
    });
  }
}
