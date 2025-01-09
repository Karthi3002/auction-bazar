import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';

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