import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent {
  registrationForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private firestore: Firestore) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', Validators.required],
      role: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.registrationForm.valid) {
      console.log('Form is valid:', this.registrationForm.value);

      const { username, email, password, address, role } = this.registrationForm.value;

      try {
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

  navigateToLogin(): void {
    this.router.navigate(['/login']); // Navigate to Login page
  }
}
