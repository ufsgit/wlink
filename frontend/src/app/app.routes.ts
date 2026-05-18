import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
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
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
