import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AttendanceRecord {
  id: string;
  date: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  totalHours: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit {
  // KPIs
  totalEmployees = 150;
  presentToday = 135;
  lateToday = 8;
  absentToday = 2;
  onLeaveToday = 5;

  searchTerm: string = '';

  attendanceRecords: AttendanceRecord[] = [
    { id: 'ATT-101', date: new Date().toISOString().split('T')[0], employeeName: 'John Doe', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present', totalHours: '9h 0m' },
    { id: 'ATT-102', date: new Date().toISOString().split('T')[0], employeeName: 'Jane Smith', checkIn: '09:30 AM', checkOut: '06:15 PM', status: 'Late', totalHours: '8h 45m' },
    { id: 'ATT-103', date: new Date().toISOString().split('T')[0], employeeName: 'Michael Brown', checkIn: '-', checkOut: '-', status: 'Absent', totalHours: '0h 0m' },
    { id: 'ATT-104', date: new Date().toISOString().split('T')[0], employeeName: 'Sarah Connor', checkIn: '08:45 AM', checkOut: '05:30 PM', status: 'Present', totalHours: '8h 45m' },
    { id: 'ATT-105', date: new Date().toISOString().split('T')[0], employeeName: 'David Lee', checkIn: '-', checkOut: '-', status: 'On Leave', totalHours: '0h 0m' }
  ];

  toastMessage: string | null = null;
  toastTimeout: any;
  hasMarkedAttendanceToday = false;

  ngOnInit(): void {}

  get filteredRecords(): AttendanceRecord[] {
    if (!this.searchTerm.trim()) return this.attendanceRecords;
    const term = this.searchTerm.toLowerCase();
    return this.attendanceRecords.filter(r => 
      r.employeeName.toLowerCase().includes(term) ||
      r.status.toLowerCase().includes(term) ||
      r.date.includes(term)
    );
  }

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  markAttendance() {
    if (this.hasMarkedAttendanceToday) {
      this.showToast('You have already marked your attendance today.');
      return;
    }
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
    
    this.attendanceRecords.unshift({
      id: `ATT-${100 + this.attendanceRecords.length + 1}`,
      date: now.toISOString().split('T')[0],
      employeeName: 'Current User', // Mock current user
      checkIn: timeString,
      checkOut: '-',
      status: isLate ? 'Late' : 'Present',
      totalHours: '-'
    });

    if (isLate) {
      this.lateToday++;
      this.presentToday--;
    } else {
      this.presentToday++;
    }

    this.hasMarkedAttendanceToday = true;
    this.showToast(`Attendance marked successfully at ${timeString}`);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Present': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'Late': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Absent': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      case 'On Leave': return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
    }
  }
}
