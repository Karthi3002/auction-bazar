import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../auth.service'; // Import the AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword: boolean = false;
  showPasswordDescription: boolean = false; 
  isPasswordValid: boolean = false; 

  constructor(private fb: FormBuilder, private router: Router, private firestore: Firestore,   private authService: AuthService ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
    });
  }

  togglePasswordVisibility() {
    console.log('Function triggered!');
    this.showPassword = !this.showPassword;
  }
  

    onPasswordFocus() {
      this.showPasswordDescription = true;
    }
  

    onPasswordInput() {
      const passwordValue = this.loginForm.get('password')?.value || '';
      this.isPasswordValid = passwordValue.length >= 6;
  

      if (this.isPasswordValid) {
        this.showPasswordDescription = false;
      }
    }
  

    onPasswordBlur() {
      if (!this.isPasswordValid) {
        this.showPasswordDescription = true;
      } else {
        this.showPasswordDescription = false;
      }
    }
  
    async onSubmit(): Promise<void> {
      if (this.loginForm.valid) {
        const { email, password, role } = this.loginForm.value;
  
        try {
          // Determine the correct collection based on the role
          const collectionName = role === 'Auctioner' ? 'auctioneers' : 'bidders';
  
          // Reference the user document in Firestore
          const userDocRef = doc(this.firestore, `${collectionName}/${email}`);
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            const userData = userDoc.data();
  
            // Validate password
            if (userData && userData['password'] === password) {
              alert('Login successful!');
              this.authService.setUserEmail(email); // Store email in AuthService
              console.log('User data:', userData);
  
              // Navigate to the respective role's dashboard
              if (role === 'Auctioner') {
                this.router.navigate(['/auctioner']);
              } else if (role === 'Bidder') {
                this.router.navigate(['/bidder']);
              }
            } else {
              alert('Invalid password. Please try again.');
            }
          } else {
            alert('User not found. Please register first.');
          }
        } catch (error) {
          console.error('Error during login:', error);
          alert('An error occurred during login. Please try again.');
        }
      } else {
        alert('Please fill out all fields correctly.');
      }
    }
  

  navigateToRegister(): void {
    this.router.navigate(['/registration']); 
  }

  navigateToPasswordRecovery(): void {
    this.router.navigate(['/password-recovery']);
  }
  
}

