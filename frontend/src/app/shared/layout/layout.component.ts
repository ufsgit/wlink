import { Component } from '@angular/core';
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

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
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
    return last.charAt(0).toUpperCase() + last.slice(1);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
