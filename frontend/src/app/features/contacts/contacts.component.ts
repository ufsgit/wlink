import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

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
  activeStatus = '';
  activeAgent = '';
  allTags: string[] = [];
  editingContactId: number | null = null;
  agents: any[] = [];
  isAdmin = false;
  openDropdownId: number | null = null;
  showImportExportDropdown = false;

  // Quick Status Modal
  showQuickStatusModal = false;
  quickStatusLoading = false;
  quickStatusContactId: number | null = null;
  quickStatusData = {
    status: '',
    remark: '',
    follow_up_date: ''
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalContacts = 0;
  totalPages = 1;

  toggleDropdown(contactId: number, event: Event) {
    event.stopPropagation();
    this.showImportExportDropdown = false;
    if (this.openDropdownId === contactId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = contactId;
    }
  }

  toggleImportExportDropdown(event: Event) {
    event.stopPropagation();
    this.openDropdownId = null;
    this.showImportExportDropdown = !this.showImportExportDropdown;
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.openDropdownId = null;
    this.showImportExportDropdown = false;
  }

  // Lead Details Panel
  showDetailPanel = false;
  selectedContact: any = null;
  detailLoading = false;

  // Custom fields from Settings
  leadFields: any[] = [];

  newContact: any = {
    name: '',
    phone: '',
    email: '',
    address: '',
    status: '',
    remark: '',
    follow_up_date: '',
    tags: 'lead',
    channel_preference: 'whatsapp',
    assigned_to: '',
    custom_field_values: {} as Record<string, string>
  };

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(private api: ApiService, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.auth.hasRole('admin', 'superadmin');
    this.loadContacts();
    this.loadTags();
    this.loadLeadFields();
    if (this.isAdmin) this.loadAgents();
  }

  loadAgents() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => this.agents = res.data.filter((u: any) => u.role === 'agent')
    });
  }

  loadLeadFields() {
    this.api.get('/settings/lead-fields').subscribe({
      next: (res: any) => {
        if (res.success) this.leadFields = res.data;
      }
    });
  }

  loadContacts() {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.activeTag) params.tags = this.activeTag;
    if (this.activeChannel) params.channel = this.activeChannel;
    if (this.activeStatus) params.status = this.activeStatus;
    if (this.activeAgent) params.agent = this.activeAgent;
    
    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        this.contacts = res.data.map((c: any) => ({
          ...c,
          tags: Array.isArray(c.tags) ? c.tags : JSON.parse(c.tags || '[]')
        }));
        this.totalContacts = res.total || 0;
        this.totalPages = Math.max(1, Math.ceil(this.totalContacts / this.pageSize));
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
    this.currentPage = 1;
    this.loadContacts();
  }

  // Pagination methods
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadContacts();
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalContacts);
  }

  // ── Lead Detail Panel ──────────────────────────────────────────────────────

  openDetailPanel(contact: any) {
    this.showDetailPanel = true;
    this.detailLoading = true;
    this.selectedContact = null;
    this.api.get(`/contacts/${contact.id}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.selectedContact = {
            ...res.data,
            tags: Array.isArray(res.data.tags) ? res.data.tags : JSON.parse(res.data.tags || '[]')
          };
        }
        this.detailLoading = false;
      },
      error: () => this.detailLoading = false
    });
  }

  closeDetailPanel() {
    this.showDetailPanel = false;
    this.selectedContact = null;
  }

  openEditFromDetail() {
    if (this.selectedContact) {
      this.closeDetailPanel();
      this.openEditModal(this.selectedContact);
    }
  }

  goToChatFromDetail() {
    if (this.selectedContact) {
      this.closeDetailPanel();
      this.goToChat(this.selectedContact);
    }
  }

  // ── History Modal ──────────────────────────────────────────────────────────

  showHistoryModal = false;
  contactHistory: any[] = [];
  historyLoading = false;

  openHistoryModal(contact: any) {
    this.showHistoryModal = true;
    this.historyLoading = true;
    this.contactHistory = [];
    this.api.get(`/contacts/${contact.id}/history`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.contactHistory = res.data;
        }
        this.historyLoading = false;
      },
      error: () => this.historyLoading = false
    });
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
    this.contactHistory = [];
  }

  getFieldTypeIcon(fieldType: string): string {
    const icons: Record<string, string> = {
      text: 'bi-type',
      number: 'bi-123',
      dropdown: 'bi-chevron-down',
      date: 'bi-calendar3',
      dob: 'bi-cake2',
      email: 'bi-envelope',
      phone: 'bi-telephone',
      textarea: 'bi-textarea-t'
    };
    return icons[fieldType] || 'bi-type';
  }

  formatFieldValue(field: any): string {
    if (!field.value) return '—';
    if (field.field_type === 'dob' || field.field_type === 'date') {
      try {
        const d = new Date(field.value);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch { return field.value; }
    }
    return field.value;
  }

  // ── Add / Edit Modal ───────────────────────────────────────────────────────

  openAddModal() {
    this.editingContactId = null;
    this.newContact = {
      name: '', phone: '', email: '', address: '',
      status: '', remark: '', follow_up_date: '',
      tags: 'lead', channel_preference: 'whatsapp', assigned_to: '',
      custom_field_values: {}
    };
    // Pre-init custom fields
    this.leadFields.forEach(f => {
      this.newContact.custom_field_values[f.id] = '';
    });
    this.showModal = true;
  }

  openEditModal(contact: any) {
    this.editingContactId = contact.id;
    const tagsArray = Array.isArray(contact.tags) ? contact.tags : [];
    this.newContact = {
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      status: contact.status || '',
      remark: contact.remark || '',
      follow_up_date: contact.follow_up_date ? new Date(contact.follow_up_date).toISOString().split('T')[0] : '',
      tags: tagsArray.join(', '),
      channel_preference: contact.channel_preference || 'whatsapp',
      assigned_to: contact.assigned_to || '',
      custom_field_values: {}
    };

    // Populate custom field values from the detailed contact
    if (contact.custom_fields && Array.isArray(contact.custom_fields)) {
      contact.custom_fields.forEach((f: any) => {
        this.newContact.custom_field_values[f.field_id] = f.value || '';
      });
    } else {
      // If we don't have custom_fields yet, fetch them
      this.leadFields.forEach(f => {
        this.newContact.custom_field_values[f.id] = '';
      });
      this.api.get(`/contacts/${contact.id}`).subscribe({
        next: (res: any) => {
          if (res.success && res.data.custom_fields) {
            res.data.custom_fields.forEach((f: any) => {
              this.newContact.custom_field_values[f.field_id] = f.value || '';
            });
          }
        }
      });
    }

    this.showModal = true;
  }

  saveContact() {
    if (!this.newContact.name || !this.newContact.phone) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Name and Phone are required',
        confirmButtonColor: '#10B981'
      });
      return;
    }

    const payload = {
      ...this.newContact,
      tags: this.newContact.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
      custom_field_values: this.newContact.custom_field_values
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
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error saving contact',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  deleteContact(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`/contacts/${id}`).subscribe({
          next: () => {
            this.loadContacts();
            this.loadTags();
            Swal.fire('Deleted!', 'Contact has been deleted.', 'success');
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete contact', 'error');
          }
        });
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
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message,
          confirmButtonColor: '#10B981',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadContacts();
        this.loadTags();
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Import Failed',
          text: err.error?.message || 'Error importing contacts',
          confirmButtonColor: '#ef4444'
        });
      }
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
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error opening chat',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  // ═══════════════════ QUICK STATUS MODAL ═══════════════════

  openQuickStatusModal(contact: any) {
    this.quickStatusContactId = contact.id;
    this.quickStatusData = {
      status: contact.status || '',
      remark: contact.remark || '',
      follow_up_date: contact.follow_up_date ? new Date(contact.follow_up_date).toISOString().split('T')[0] : ''
    };
    this.showQuickStatusModal = true;
  }

  closeQuickStatusModal() {
    this.showQuickStatusModal = false;
    this.quickStatusContactId = null;
  }

  saveQuickStatus() {
    if (!this.quickStatusContactId) return;
    this.quickStatusLoading = true;

    // We can use the existing update API endpoint. We only pass the fields we want to update.
    const updateData = {
      status: this.quickStatusData.status,
      remark: this.quickStatusData.remark,
      follow_up_date: this.quickStatusData.status === 'Interested' ? this.quickStatusData.follow_up_date : null
    };

    this.api.put(`/contacts/${this.quickStatusContactId}`, updateData).subscribe({
      next: (res: any) => {
        this.quickStatusLoading = false;
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Status Updated',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
          this.closeQuickStatusModal();
          this.loadContacts();
        } else {
          Swal.fire('Error', res.message || 'Failed to update status', 'error');
        }
      },
      error: () => {
        this.quickStatusLoading = false;
        Swal.fire('Error', 'Failed to update status', 'error');
      }
    });
  }
}
