import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userEmail: string = '';
  private userId: string = '';  // Store user ID for fetching related auction data
  getCurrentUserEmail: any;
  firestore: any;
  storage: any;

  // Set user email
  setUserEmail(email: string): void {
    this.userEmail = email;
  }

  // Get user email
  getUserEmail(): string {
    return this.userEmail;
  }

  // Clear user email
  clearUserEmail(): void {
    this.userEmail = '';
  }

  // Check if the user is authenticated
  isAuthenticated(): boolean {
    return this.userEmail !== '';
  }

  // Set user ID (e.g., fetched after login)
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Get user ID
  getUserId(): string {
    return this.userId;
  }

  // Get auctioner details from Firestore
  getAuctionerDetails(): Observable<any> {
    const userId = this.getUserId();
    return this.firestore.collection('auctioners').doc(userId).valueChanges();
  }

  // Get auctioner product stats from Firestore
  getProductStats(): Observable<any> {
    const userId = this.getUserId();
    return this.firestore.collection('auctioners').doc(userId).collection('products').valueChanges();
  }

  // Get auction progress data from Firestore
  getAuctionProgress(): Observable<any> {
    const userId = this.getUserId();
    return this.firestore.collection('auctioners').doc(userId).collection('auctionProgress').valueChanges();
  }

  // Get profile picture from Firebase Storage
  getProfilePicture(): Observable<any> {
    const userId = this.getUserId();
    return this.storage.ref(`profile-pictures/${userId}`).getDownloadURL();
  }
}