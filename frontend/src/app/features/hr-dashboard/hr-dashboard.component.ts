import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container" style="display: flex; flex-direction: column; gap: 32px;">
      
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-2" style="color: #1e293b;">HR Dashboard</h2>
          <p class="text-muted mb-0" style="font-size: 0.95rem;">Overview of human resources, attendance, and employees</p>
        </div>
        
        <div class="flex items-center" style="gap: 16px; flex-wrap: wrap;">
          <div style="position: relative;">
            <select class="form-select" style="appearance: none; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 40px 10px 16px; font-weight: 600; color: #475569; font-size: 0.95rem; cursor: pointer; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;" onmouseover="this.style.borderColor='#cbd5e1'; this.style.backgroundColor='#f1f5f9';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.backgroundColor='#f8fafc';" [(ngModel)]="dateRange" (change)="onFilterChange()">
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <i class="bi bi-chevron-down" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; font-size: 0.85rem; font-weight: bold;"></i>
          </div>
          <button class="btn btn-primary" style="padding: 10px 20px; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); border: none; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);" (click)="onFilterChange()">
            <i class="bi bi-arrow-clockwise me-2"></i> Sync Data
          </button>
        </div>
      </div>

      <!-- KPI Cards (6 Cards) -->
      <div class="stats-grid">
        
        <div class="stat-card">
          <div class="stat-icon icon-orange"><i class="bi bi-calendar-event"></i></div>
          <div class="stat-info">
            <label>Leave Requests</label>
            <h3>{{ leaveRequests | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-blue"><i class="bi bi-currency-dollar"></i></div>
          <div class="stat-info">
            <label>Expense Approvals</label>
            <h3>{{ expenseApprovals | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green"><i class="bi bi-person-check-fill"></i></div>
          <div class="stat-info">
            <label>Attendance Today</label>
            <h3>{{ attendanceToday | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-red"><i class="bi bi-alarm-fill"></i></div>
          <div class="stat-info">
            <label>Late Employees</label>
            <h3>{{ lateEmployees | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-purple"><i class="bi bi-calendar-heart-fill"></i></div>
          <div class="stat-info">
            <label>Holiday Calendar</label>
            <h3>{{ upcomingHolidays | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-slate"><i class="bi bi-star-fill"></i></div>
          <div class="stat-info">
            <label>Performance Reviews</label>
            <h3>{{ performanceReviews | number }}</h3>
          </div>
        </div>

      </div>

      <!-- Charts Row -->
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 24px;">
        
        <!-- Attendance Chart -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Daily Attendance Status</h5>
          </div>
          <div style="padding: 24px; position: relative; height: 350px; width: 100%; display: flex; align-items: center; justify-content: center; flex-grow: 1;">
            <canvas #attendanceCanvas id="attendanceChart" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>
        
        <!-- Location Tracker (Live Map Mockup) -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Employee Location / GPS</h5>
            <span style="font-size: 0.85rem; font-weight: 600; color: #10b981; background: #d1fae5; padding: 4px 10px; border-radius: 12px;"><i class="bi bi-broadcast"></i> Live Map</span>
          </div>
          <div style="padding: 24px; flex-grow: 1; background: #f8fafc; position: relative;">
             <!-- Minimalist Map Mockup -->
             <div class="map-grid-bg"></div>
             
             <div style="position: relative; z-index: 10; display: flex; flex-direction: column; gap: 12px;">
                <div *ngFor="let loc of recentLocations" style="background: white; padding: 16px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 16px; transition: transform 0.2s;" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='translateX(0)'">
                  <div class="avatar-circle" [ngStyle]="{'background': loc.color}">{{ loc.name.charAt(0) }}</div>
                  <div style="flex-grow: 1;">
                    <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">{{ loc.name }}</div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;"><i class="bi bi-geo-alt-fill text-danger me-1"></i> {{ loc.address }}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #0f172a;">{{ loc.time }}</div>
                    <div style="font-size: 0.75rem; color: #3b82f6; font-weight: 600;">{{ loc.distance }}</div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      <!-- Actionable Table Row (Recent HR Requests) -->
      <div class="chart-card" style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden;">
        <div class="flex justify-between items-center" style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
          <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Pending HR Approvals</h5>
          <button class="btn btn-sm" style="background: #eff6ff; color: #3b82f6; font-weight: 600; border: none; padding: 8px 16px; border-radius: 8px;">View All</button>
        </div>
        <div class="p-0">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 30%;">Employee</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 20%;">Request Type</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 20%;">Dates / Amount</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 15%;">Status</th>
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 15%; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let req of hrRequests; let last = last" [ngStyle]="{'border-bottom': last ? 'none' : '1px solid #f1f5f9'}" style="transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 20px 32px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="avatar-circle" [ngStyle]="{'background': req.color}">{{ req.employee.charAt(0) }}</div>
                    <div>
                        <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">{{ req.employee }}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">{{ req.department }}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 20px 20px;">
                  <span style="padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: {{ req.type === 'Leave' ? '#fffbeb' : '#e0f2fe' }}; color: {{ req.type === 'Leave' ? '#d97706' : '#0369a1' }};">
                    {{ req.type }}
                  </span>
                </td>
                <td style="padding: 20px 20px; font-weight: 600; color: #334155; font-size: 0.9rem;">
                  {{ req.details }}
                </td>
                <td style="padding: 20px 20px;">
                  <span style="padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background: #fef2f2; color: #ef4444;">
                    {{ req.status }}
                  </span>
                </td>
                <td style="padding: 20px 32px; text-align: right;">
                  <button style="background: #10b981; border: none; color: white; font-weight: 600; padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                    Approve
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .map-grid-bg {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23e2e8f0' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E");
      opacity: 0.8;
    }
    
    /* 3D Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      perspective: 1200px;
    }
    .stat-card {
      background: #fff;
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 24px;
      padding: 32px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05);
      transform-style: preserve-3d;
      transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 6px;
      background: transparent;
      transition: all 0.4s ease;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      transition: all 0.65s cubic-bezier(0.25, 0.8, 0.25, 1);
      pointer-events: none;
      transform: skewX(-20deg) translateZ(5px);
    }
    .stat-card:hover {
      transform: perspective(1000px) translateY(-8px) rotateX(6deg) rotateY(-6deg) translateZ(12px);
      box-shadow: 0 24px 38px -8px rgba(17, 24, 39, 0.12), 0 10px 18px -10px rgba(17, 24, 39, 0.08);
      border-color: transparent;
    }
    .stat-card:hover::after {
      left: 200%;
    }
    
    .stat-card:nth-child(1) { background: linear-gradient(145deg, #fffbeb 0%, #ffffff 100%); border-color: #fef3c7; }
    .stat-card:nth-child(2) { background: linear-gradient(145deg, #eff6ff 0%, #ffffff 100%); border-color: #dbeafe; }
    .stat-card:nth-child(3) { background: linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%); border-color: #dcfce7; }
    .stat-card:nth-child(4) { background: linear-gradient(145deg, #fff1f2 0%, #ffffff 100%); border-color: #ffe4e6; }
    .stat-card:nth-child(5) { background: linear-gradient(145deg, #faf5ff 0%, #ffffff 100%); border-color: #f3e8ff; }
    .stat-card:nth-child(6) { background: linear-gradient(145deg, #f8fafc 0%, #ffffff 100%); border-color: #f1f5f9; }
    
    .stat-card:nth-child(1):hover { box-shadow: 0 20px 32px -10px rgba(245, 158, 11, 0.28); border-color: #fde68a; }
    .stat-card:nth-child(2):hover { box-shadow: 0 20px 32px -10px rgba(59, 130, 246, 0.28); border-color: #bfdbfe; }
    .stat-card:nth-child(3):hover { box-shadow: 0 20px 32px -10px rgba(16, 185, 129, 0.28); border-color: #bbf7d0; }
    .stat-card:nth-child(4):hover { box-shadow: 0 20px 32px -10px rgba(225, 29, 72, 0.28); border-color: #fecdd3; }
    .stat-card:nth-child(5):hover { box-shadow: 0 20px 32px -10px rgba(168, 85, 247, 0.28); border-color: #e9d5ff; }
    .stat-card:nth-child(6):hover { box-shadow: 0 20px 32px -10px rgba(100, 116, 139, 0.28); border-color: #cbd5e1; }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      transform: translateZ(0px);
      flex-shrink: 0;
    }
    .stat-card:hover .stat-icon {
      transform: translateZ(42px) scale(1.08);
      box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.2);
    }
    
    .icon-orange { background: linear-gradient(135deg, #FFEAA7 0%, #FDCB6E 100%); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .icon-blue { background: linear-gradient(135deg, #74B9FF 0%, #0984E3 100%); color: #fff; }
    .icon-green { background: linear-gradient(135deg, #55EFC4 0%, #00B894 100%); color: #fff; }
    .icon-red { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: #e11d48; text-shadow: 0 1px 2px rgba(255,255,255,0.5); }
    .icon-purple { background: linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%); color: #fff; }
    .icon-slate { background: linear-gradient(135deg, #cbd5e1 0%, #64748b 100%); color: #fff; }

    .stat-info {
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      transform: translateZ(0px);
    }
    .stat-card:hover .stat-info {
      transform: translateZ(28px);
    }
    .stat-info label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 4px;
    }
    .stat-info h3 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.1;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class HrDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('attendanceCanvas') attendanceCanvas!: ElementRef<HTMLCanvasElement>;
  
  dateRange: string = 'this_month';

  // KPI Data
  leaveRequests = 12;
  expenseApprovals = 8;
  attendanceToday = 85;
  lateEmployees = 5;
  upcomingHolidays = 3;
  performanceReviews = 14;

  attendanceChart: any;

  // Mock HR Requests Data
  hrRequests = [
    { employee: 'Michael Scott', department: 'Management', type: 'Leave', details: 'Oct 15 - Oct 20', status: 'Pending', color: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    { employee: 'Pam Beesly', department: 'Administration', type: 'Expense', details: '$125.00 (Office Supplies)', status: 'Pending', color: 'linear-gradient(135deg, #ec4899, #db2777)' },
    { employee: 'Jim Halpert', department: 'Sales', type: 'Leave', details: 'Oct 12 (Half Day)', status: 'Pending', color: 'linear-gradient(135deg, #10b981, #059669)' },
    { employee: 'Dwight Schrute', department: 'Sales', type: 'Expense', details: '$450.00 (Travel)', status: 'Pending', color: 'linear-gradient(135deg, #f59e0b, #d97706)' }
  ];

  // Mock GPS Data
  recentLocations = [
    { name: 'Stanley Hudson', address: '124 Regional Road, Scranton', time: 'Checked in 5m ago', distance: '12.4 km away', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    { name: 'Phyllis Vance', address: 'Client Site B, Industrial Park', time: 'Checked in 22m ago', distance: '8.1 km away', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { name: 'Ryan Howard', address: 'Downtown Branch HQ', time: 'Checked in 1h ago', distance: '3.5 km away', color: 'linear-gradient(135deg, #f43f5e, #e11d48)' }
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.initAttendanceChart();
    }, 200);
  }

  onFilterChange() {
    this.leaveRequests = Math.floor(Math.random() * 20);
    this.expenseApprovals = Math.floor(Math.random() * 15);
    this.attendanceToday = Math.floor(Math.random() * 20) + 80;
    this.lateEmployees = Math.floor(Math.random() * 10);
    this.upcomingHolidays = Math.floor(Math.random() * 5);
    this.performanceReviews = Math.floor(Math.random() * 20);

    if (this.attendanceChart) {
      this.attendanceChart.data.datasets[0].data = [
        this.attendanceToday, 
        this.lateEmployees, 
        100 - this.attendanceToday - this.lateEmployees
      ];
      this.attendanceChart.update();
    }
  }

  initAttendanceChart() {
    if (!this.attendanceCanvas) return;
    const ctx = this.attendanceCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.attendanceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present (On Time)', 'Late', 'Absent / Leave'],
        datasets: [{
          data: [85, 5, 10],
          backgroundColor: [
            '#10b981', // Green
            '#f59e0b', // Yellow
            '#ef4444'  // Red
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        layout: {
          padding: 20
        },
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            bodyFont: { size: 14, weight: 'bold' },
            cornerRadius: 8
          }
        }
      }
    });
  }
}
