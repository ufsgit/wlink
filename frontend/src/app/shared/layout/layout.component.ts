import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { Observable, filter } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  user$: Observable<any>;
  pageTitle = 'Dashboard';
  isCollapsed = false;

  // Notification States
  showNotificationDropdown = false;

  notifications: any[] = [];

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
    if (n.convoId) {
      this.router.navigate(['/inbox'], { queryParams: { convoId: n.convoId } });
      this.showNotificationDropdown = false;
    }
  }

  clearAllNotifications() {
    this.notifications = [];
  }



  ngOnInit() {
    this.setupSocketNotifications();
  }

  setupSocketNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    // Ensure socket is initialized FIRST
    this.socket.connect();

    this.user$.subscribe(user => {
      if (user?.businessId) {
        this.socket.joinBusiness(user.businessId);
      }
    });

    this.socket.on('new_message').subscribe((data: any) => {
      if (data && data.message && data.message.direction === 'inbound') {
        const contactName = data.contactName || data.contact?.name || data.conversation?.contact_name || 'Someone';
        const msgText = data.message.content || 'Sent an attachment';
        const convoId = data.conversationId || data.conversation?.id || data.message.conversation_id;

        // Add to dropdown
        this.notifications.unshift({
          id: Date.now(),
          type: 'message',
          icon: 'bi-chat-left-text',
          title: `New message from ${contactName}`,
          message: msgText.substring(0, 50) + (msgText.length > 50 ? '...' : ''),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true,
          convoId: convoId
        });

        // Trigger change detection manually just in case
        this.cdr.detectChanges();

        this.playNotificationSound();

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(`New message from ${contactName}`, {
            body: msgText
          });
          
          notification.onclick = () => {
            window.focus();
            this.router.navigate(['/inbox'], { queryParams: { convoId: convoId } });
            notification.close();
          };
        }
      }
    });
  }

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private socket: SocketService,
    private cdr: ChangeDetectorRef
  ) {
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
