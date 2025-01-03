import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent {
  registrationForm: FormGroup;
  selectedProfileImage: File | null = null;

  constructor(private fb: FormBuilder, private router: Router, private firestore: Firestore, private storage: Storage) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', Validators.required],
      role: ['', Validators.required],
    });
  }

  // Handle profile image file selection
  onFileSelected(event: any): void {
    this.selectedProfileImage = event.target.files[0];
  }

  async onSubmit(): Promise<void> {
    if (this.registrationForm.valid && this.selectedProfileImage) {
      console.log('Form is valid:', this.registrationForm.value);
  
      const { username, email, password, address, role } = this.registrationForm.value;
  
      try {
        // Upload Profile Image to Firebase Storage
        console.log('Uploading profile image...');
        const imageRef = ref(
          this.storage,
          `profileImages/${Date.now()}_${this.selectedProfileImage.name}`
        );
        const uploadResult = await uploadBytes(imageRef, this.selectedProfileImage);
        const imageUrl = await getDownloadURL(uploadResult.ref);
        console.log('Profile image uploaded:', imageUrl);
  
        // Determine the correct collection based on the role
        const collectionName = role === 'Auctioner' ? 'auctioneers' : 'bidders';
  
        // Create the document in Firestore for the correct collection
        console.log('Saving user data to Firestore...');
        const userDocRef = doc(this.firestore, `${collectionName}/${email}`);
        await setDoc(userDocRef, {
          username,
          email,
          password,
          address,
          role,
          profileImage: imageUrl,
        });
        console.log('User data saved to Firestore successfully.');
  
        alert('Registration successful!');
        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred during registration. Please try again.');
      }
    } else {
      console.log('Form is invalid or no profile image selected');
      alert('Please fill all fields and select a profile image.');
    }
  }
  
  
  navigateToLogin(): void {
    this.router.navigate(['/login']); // Navigate to Login page
  }
}
