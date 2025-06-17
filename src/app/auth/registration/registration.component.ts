import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth'; // Import this
import { AuthService } from '../../../auth.service'; // Import the AuthService

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  selectedProfileImage: string | null = null;
  isSubmitDisabled: boolean = true;
  isLoading: boolean = false;

constructor(
  private fb: FormBuilder,
  private router: Router,
  private firestore: Firestore,
  private authService: AuthService,
  private auth: Auth) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // Phone number field
      role: ['', Validators.required],
      profileImage: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  // Check if the user is authenticated using AuthService (you can add logic if needed)
  checkAuthentication() {
    const email = this.authService.getUserEmail(); // Get email from AuthService if implemented
    if (email) {
      this.router.navigate(['/dashboard']); // Navigate to dashboard if already authenticated
    }
  }

  // Handle profile image selection
onSelectProfileImage(event: any): void {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64Image = e.target.result;
      this.registrationForm.get('profileImage')?.setValue(base64Image); // ✅ Set in form
      this.selectedProfileImage = base64Image;
      this.checkFormValidity();
    };
    reader.readAsDataURL(file);
  }
}
  // Encrypt image using Base64 encoding
  encryptImage(image: string): string {
    return btoa(image); // Base64 encoding for the image
  }

  // Decrypt image using Base64 decoding
  decryptImage(encryptedImage: string): string {
    return atob(encryptedImage); // Base64 decoding to get the original image string
  }

  // Handle form submission and store user data in Firestore
async onSubmit(): Promise<void> {
  this.isLoading = true;
  if (this.registrationForm.valid) {
    const { username, email, password, address, phoneNumber, role, profileImage } = this.registrationForm.value;

    try {
      // ✅ Step 1: Register user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = userCredential.user.uid;

      // ✅ Step 2: Save user data in Firestore using UID
      const collectionName = role === 'Auctioner' ? 'auctioneers' : (role === 'Bidder' ? 'bidders' : 'admins');
      const userDocRef = doc(this.firestore, `${collectionName}/${uid}`);
      await setDoc(userDocRef, {
        username,
        email,
        password, // Note: Storing passwords in plain text is not recommended; consider using Firebase Authentication's built-in methods
        address,
        phoneNumber,
        role,
        profileImage: this.encryptImage(profileImage), // Still encrypting the image if needed
        uid,
        createdAt: new Date(),
      });

      alert('Registration successful!');
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert(error.message || 'An error occurred during registration.');
    }
  } else {
    alert('Please fill all fields correctly.');
  }
  this.isLoading = false;
}



  // Check form validity and enable/disable the submit button
  checkFormValidity(): void {
    this.isSubmitDisabled = !this.registrationForm.valid || !this.selectedProfileImage;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']); // Navigate to Login page
  }
}