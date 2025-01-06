import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userEmail: string = '';

  setUserEmail(email: string): void {
    this.userEmail = email;
  }

  getUserEmail(): string {
    return this.userEmail;
  }

  clearUserEmail(): void {
    this.userEmail = '';
  }

  isAuthenticated(): boolean {
    return this.userEmail !== '';
  }
}
