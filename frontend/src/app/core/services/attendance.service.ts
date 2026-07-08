import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  totalHours: string;
  module?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly STORAGE_KEY = 'attendance_records';
  
  private initialRecords: AttendanceRecord[] = [
    { id: 'ATT-101', date: new Date().toISOString().split('T')[0], employeeName: 'John Doe', module: 'Leads', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present', totalHours: '9h 0m' },
    { id: 'ATT-102', date: new Date().toISOString().split('T')[0], employeeName: 'Jane Smith', module: 'CRM', checkIn: '09:30 AM', checkOut: '06:15 PM', status: 'Late', totalHours: '8h 45m' },
    { id: 'ATT-103', date: new Date().toISOString().split('T')[0], employeeName: 'Michael Brown', module: 'Operation', checkIn: '-', checkOut: '-', status: 'Absent', totalHours: '0h 0m' },
    { id: 'ATT-104', date: new Date().toISOString().split('T')[0], employeeName: 'Sarah Connor', module: 'HR', checkIn: '08:45 AM', checkOut: '05:30 PM', status: 'Present', totalHours: '8h 45m' },
    { id: 'ATT-105', date: new Date().toISOString().split('T')[0], employeeName: 'David Lee', module: 'Leads', checkIn: '-', checkOut: '-', status: 'On Leave', totalHours: '0h 0m' }
  ];

  private recordsSubject = new BehaviorSubject<AttendanceRecord[]>([]);
  public records$ = this.recordsSubject.asObservable();

  constructor() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.recordsSubject.next(JSON.parse(stored));
    } else {
      this.recordsSubject.next(this.initialRecords);
      this.saveRecords(this.initialRecords);
    }
  }

  private saveRecords(records: AttendanceRecord[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    this.recordsSubject.next(records);
  }

  getRecords(): AttendanceRecord[] {
    return this.recordsSubject.value;
  }

  addCheckIn(employeeName: string, moduleName: string = 'Leads') {
    const records = this.getRecords();
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isLate = now.getHours() >= 9 && now.getMinutes() > 15;
    
    // Check if user already checked in today for this module
    const today = now.toISOString().split('T')[0];
    const existingRecord = records.find(r => r.employeeName === employeeName && r.date === today && (r.module === moduleName || !r.module));
    
    if (existingRecord) {
      return { success: false, message: `Already checked in today for ${moduleName}` };
    }

    const newRecord: AttendanceRecord = {
      id: `ATT-${100 + records.length + 1}`,
      date: today,
      employeeName: employeeName,
      module: moduleName,
      checkIn: timeString,
      checkOut: '-',
      status: isLate ? 'Late' : 'Present',
      totalHours: '-'
    };

    records.unshift(newRecord);
    this.saveRecords(records);
    return { success: true, message: `Checked in at ${timeString}`, record: newRecord };
  }

  addCheckOut(employeeName: string, moduleName: string = 'Leads') {
    const records = this.getRecords();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const recordIndex = records.findIndex(r => r.employeeName === employeeName && r.date === today && (r.module === moduleName || !r.module));
    
    if (recordIndex === -1) {
      return { success: false, message: `No check-in found for today in ${moduleName}` };
    }

    if (records[recordIndex].checkOut !== '-') {
      return { success: false, message: 'Already checked out today' };
    }

    records[recordIndex] = {
      ...records[recordIndex],
      checkOut: timeString
    };

    // Very basic hours calculation
    try {
      const checkInDate = new Date(`${today} ${records[recordIndex].checkIn}`);
      const checkOutDate = new Date(`${today} ${timeString}`);
      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        records[recordIndex].totalHours = `${diffHrs}h ${diffMins}m`;
      }
    } catch(e) {}

    this.saveRecords(records);
    return { success: true, message: `Checked out at ${timeString}` };
  }
}
