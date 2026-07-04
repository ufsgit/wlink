import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { InboxComponent } from './features/inbox/inbox.component';
import { ContactsComponent } from './features/contacts/contacts.component';
import { BroadcastsComponent } from './features/broadcasts/broadcasts.component';
import { ChatbotsComponent } from './features/chatbots/chatbots.component';
import { DripComponent } from './features/drip/drip.component';
import { EcommerceComponent } from './features/ecommerce/ecommerce.component';
import { CtwaComponent } from './features/ctwa/ctwa.component';
import { WidgetComponent } from './features/widget/widget.component';
import { RcsComponent } from './features/rcs/rcs.component';
import { SmsComponent } from './features/sms/sms.component';
import { SettingsComponent } from './features/settings/settings.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { AffiliatesComponent } from './features/affiliates/affiliates.component';
import { TemplatesComponent } from './features/templates/templates.component';
import { IvrComponent } from './features/ivr/ivr.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'lead-dashboard', pathMatch: 'full' },
      { path: 'lead-dashboard', loadComponent: () => import('./features/lead-dashboard/lead-dashboard.component').then(m => m.LeadDashboardComponent) },
      { path: 'crm-dashboard', loadComponent: () => import('./features/crm-dashboard/crm-dashboard.component').then(m => m.CrmDashboardComponent) },
      { path: 'operation-dashboard', loadComponent: () => import('./features/operation-dashboard/operation-dashboard.component').then(m => m.OperationDashboardComponent) },
      { path: 'hr-dashboard', loadComponent: () => import('./features/hr-dashboard/hr-dashboard.component').then(m => m.HrDashboardComponent) },
      { path: 'inbox', component: InboxComponent },
      { path: 'contacts', component: ContactsComponent },
      { path: 'broadcasts', component: BroadcastsComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'chatbots', component: ChatbotsComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'chatbots/:id/flow', loadComponent: () => import('./features/chatbots/flow-editor/flow-editor.component').then(m => m.FlowEditorComponent), data: { roles: ['admin', 'superadmin'] } },
      { path: 'drip', component: DripComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'ecommerce', component: EcommerceComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'ctwa', component: CtwaComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'widget', component: WidgetComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'rcs', component: RcsComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'sms', component: SmsComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'settings', component: SettingsComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'analytics', component: AnalyticsComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'affiliates', component: AffiliatesComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'templates', component: TemplatesComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'ivr', component: IvrComponent, data: { roles: ['admin', 'superadmin'] } },
      { path: 'reports/work', loadComponent: () => import('./features/lead-report/work-report/work-report.component').then(m => m.WorkReportComponent) },
      { path: 'reports/conversation', loadComponent: () => import('./features/lead-report/conversation-report/conversation-report.component').then(m => m.ConversationReportComponent) },
      { path: 'reports/employee', loadComponent: () => import('./features/lead-report/employee-report/employee-report.component').then(m => m.EmployeeReportComponent) },
      { path: 'reports/enquiry', loadComponent: () => import('./features/lead-report/enquiry-report/enquiry-report.component').then(m => m.EnquiryReportComponent) },
      { path: 'reports/status', loadComponent: () => import('./features/lead-report/status-report/status-report.component').then(m => m.StatusReportComponent) },
    ]
  },
  { path: '**', redirectTo: 'lead-dashboard' }
];
