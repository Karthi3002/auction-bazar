import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { PasswordRecoveryComponent } from './auth/password-recovery/password-recovery.component';
import { AuctioneerComponent } from './home/auctioner/auctioner.component';
import { DashboardComponent } from './home/dashboard/dashboard.component';
import { BidderComponent } from './home/bidder/bidder.component';
import { AdminComponent } from './home/admin/admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'password-recovery', component: PasswordRecoveryComponent },
  { path: 'auctioner', component: AuctioneerComponent},
  { path: 'dashboard', component: DashboardComponent},
  { path: 'bidder', component: BidderComponent},
  { path: 'admin', component: AdminComponent},
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Default route
  { path: '**', redirectTo: 'login' }, // Fallback route
];
