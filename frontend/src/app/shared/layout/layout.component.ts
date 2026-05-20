import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Observable, filter } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  user$: Observable<any>;
  pageTitle = 'Dashboard';
  isCollapsed = false;

  // Support & Notification States
  showSupportModal = false;
  showNotificationDropdown = false;

  notifications = [
    { id: 1, title: 'Campaign Completed', message: 'Your "Summer Promo" WhatsApp campaign has completed successfully.', time: '10m ago', unread: true, icon: 'bi-megaphone', type: 'success' },
    { id: 2, title: 'Low Credits Warning', message: 'Your SMS account balance is running low (under $5.00).', time: '1h ago', unread: true, icon: 'bi-exclamation-triangle', type: 'warning' },
    { id: 3, title: 'New Contact Synced', message: 'Contact "Test Instagram User" was imported from Instagram.', time: '2h ago', unread: false, icon: 'bi-person-plus', type: 'info' }
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper')) {
      this.showNotificationDropdown = false;
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleSupportModal() {
    this.showSupportModal = !this.showSupportModal;
  }

  toggleNotificationDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => n.unread).length;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.unread = false);
  }

  readNotification(n: any) {
    n.unread = false;
  }

  clearAllNotifications() {
    this.notifications = [];
  }

  openLiveChat() {
    alert('Initiating live chat with a WLink support engineer...');
  }

  submitQuickSupport(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea.value.trim()) {
      alert('Support Ticket Submitted!\n\nThank you for reaching out. A WLink support representative will contact you shortly.');
      textarea.value = '';
      this.showSupportModal = false;
    }
  }

  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.currentUser$;
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.pageTitle = this.getTitle(url);
    });
  }

  private getTitle(url: string): string {
    const segments = url.split('/');
    const last = segments[segments.length - 1].split('?')[0]; // Remove query params
    if (!last || last === 'dashboard') return 'Dashboard Overview';
    if (last === 'sms') return 'SMS Campaigns';
    if (last === 'ivr') return 'IVR Flows';
    if (last === 'rcs') return 'RCS Business';
    if (last === 'ctwa') return 'Click to WhatsApp';
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
