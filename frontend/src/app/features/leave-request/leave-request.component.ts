import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request.component.html',
  styleUrl: './leave-request.component.css'
})
export class LeaveRequestComponent {
  request = {
    date: '',
    type: 'Full Day',
    reason: ''
  };

  submitted = false;

  isValid(): boolean {
    return !!this.request.date && !!this.request.type && !!this.request.reason.trim();
  }

  submitRequest(): void {
    if (this.isValid()) {
      console.log('Submitting Leave Request:', this.request);
      this.submitted = true;
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        this.submitted = false;
        this.resetForm();
      }, 3000);
    }
  }

  resetForm(): void {
    this.request = {
      date: '',
      type: 'Full Day',
      reason: ''
    };
    this.submitted = false;
  }
}
