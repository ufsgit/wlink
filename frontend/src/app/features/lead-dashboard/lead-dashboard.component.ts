import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-lead-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lead-dashboard.component.html',
  styleUrls: ['./lead-dashboard.component.css']
})
export class LeadDashboardComponent implements OnInit {
  stats: any = {
    totalContacts: 0,
    openConversations: 0,
    messagesToday: 0,
    broadcastReadRate: 0,
    recentConversations: []
  };
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.api.get('/analytics/dashboard').subscribe({
      next: (res: any) => {
        this.stats = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
