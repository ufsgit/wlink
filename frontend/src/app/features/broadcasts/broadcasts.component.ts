import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-broadcasts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broadcasts.component.html',
  styleUrls: ['./broadcasts.component.css']
})
export class BroadcastsComponent implements OnInit {
  broadcasts: any[] = [];
  loading = false;
  showModal = false;
  activeChannel = 'whatsapp';

  templates: any[] = [];
  
  newBroadcast: any = {
    name: '',
    template_id: '',
    target_tags: '',
    channel: 'whatsapp',
    scheduled_at: null
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBroadcasts();
    this.loadTemplates();
  }

  loadBroadcasts() {
    this.loading = true;
    this.api.get('/broadcasts').subscribe({
      next: (res: any) => {
        this.broadcasts = res.data.map((b: any) => ({
          ...b,
          progress: b.total_sent ? Math.round((b.total_sent / b.total_contacts) * 100) : 0,
          readRate: b.total_read ? Math.round((b.total_read / b.total_sent) * 100) : 0
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadTemplates() {
    this.api.get('/templates').subscribe({
      next: (res: any) => this.templates = res.data
    });
  }

  saveBroadcast() {
    if (!this.newBroadcast.name || !this.newBroadcast.template_id) return;

    const payload = {
      ...this.newBroadcast,
      target_tags: this.newBroadcast.target_tags ? this.newBroadcast.target_tags.split(',').map((t: string) => t.trim()) : []
    };

    this.api.post('/broadcasts', payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Send immediately if not scheduled
          if (!this.newBroadcast.scheduled_at) {
            this.api.post(`/broadcasts/${res.data.id}/send`, {}).subscribe({
              next: () => {
                this.loadBroadcasts();
                this.showModal = false;
              }
            });
          } else {
            this.loadBroadcasts();
            this.showModal = false;
          }
        }
      },
      error: (err) => alert(err.error?.message || 'Error creating broadcast')
    });
  }

  deleteBroadcast(id: number) {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;
    this.api.delete(`/broadcasts/${id}`).subscribe({
      next: () => this.loadBroadcasts()
    });
  }

  setChannel(channel: string) {
    this.activeChannel = channel;
    this.newBroadcast.channel = channel;
  }
}
