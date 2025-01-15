import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
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

  constructor(private fb: FormBuilder, private router: Router, private firestore: Firestore, private authService: AuthService) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // Phone number field
      role: ['', Validators.required],
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
        this.selectedProfileImage = e.target.result;
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
    if (this.registrationForm.valid && this.selectedProfileImage) {
      const { username, email, password, address, phoneNumber, role } = this.registrationForm.value;
      const encryptedImage = this.encryptImage(this.selectedProfileImage); // Encrypt profile image

      try {
        // Determine the correct collection based on the role
        const collectionName = role === 'Auctioner' ? 'auctioneers' : (role === 'Bidder' ? 'bidders' : 'admins');

        // Create the document in Firestore for the correct collection
        const userDocRef = doc(this.firestore, `${collectionName}/${email}`);
        await setDoc(userDocRef, {
          username,
          email,
          password,
          address,
          phoneNumber, // Storing phone number
          role,
          profileImage: encryptedImage, // Store encrypted profile image
        });
        console.log('User data saved to Firestore successfully.');

        alert('Registration successful!');
        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred during registration. Please try again.');
      }
    } else {
      console.log('Form is invalid');
      alert('Please fill all fields correctly.');
    }
  }

  // Check form validity and enable/disable the submit button
  checkFormValidity(): void {
    this.isSubmitDisabled = !this.registrationForm.valid || !this.selectedProfileImage;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']); // Navigate to Login page
  }
}