import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Store UID
  setUserId(uid: string): void {
    sessionStorage.setItem('userUID', uid);
  }

  getUserId(): string | null {
    return sessionStorage.getItem('userUID');
  }

  // Store Email
  setUserEmail(email: string): void {
    sessionStorage.setItem('userEmail', email);
  }

  getUserEmail(): string | null {
    return sessionStorage.getItem('userEmail');
  }

  // Store Role
  setUserRole(role: string): void {
    sessionStorage.setItem('userRole', role);
  }

  getUserRole(): string | null {
    return sessionStorage.getItem('userRole');
  }

  // Clear session (on logout)
  clearUserData(): void {
    sessionStorage.removeItem('userUID');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userRole');
  }

  isAuthenticated(): boolean {
    return !!this.getUserId() && !!this.getUserEmail();
  }

  logout(): void {
  sessionStorage.clear();  // ✅ clear tab-specific session data
}

}
