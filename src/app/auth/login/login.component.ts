import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router

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
  showPasswordDescription: boolean = false; // Description visibility flag
  isPasswordValid: boolean = false; // To check if password meets the length criteria

  constructor(private fb: FormBuilder, private router: Router) { // Inject Router
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility() {
    console.log('Function triggered!');
    this.showPassword = !this.showPassword;
  }
  
    // Show description on focus
    onPasswordFocus() {
      this.showPasswordDescription = true;
    }
  
    // Check password length on input
    onPasswordInput() {
      const passwordValue = this.loginForm.get('password')?.value || '';
      this.isPasswordValid = passwordValue.length >= 6;
  
      // Hide description if password is valid
      if (this.isPasswordValid) {
        this.showPasswordDescription = false;
      }
    }
  
    // Hide description when the user leaves the field
    onPasswordBlur() {
      if (!this.isPasswordValid) {
        this.showPasswordDescription = true;
      } else {
        this.showPasswordDescription = false;
      }
    }
  
    onSubmit(): void {
      if (this.loginForm.valid) {
        const formValues = this.loginForm.value;
    
        // Log form values for debugging
        console.log('Login Details:', formValues);
    
        // Check user role and navigate accordingly
        if (formValues.role === 'Auctioner') {
          this.router.navigate(['/auctioner']); // Navigate to Auctioneer page
        } else if (formValues.role === 'bidder') {
          this.router.navigate(['/bidder']); // Navigate to Bidder page (example)
        } else {
          console.log('Invalid role selected!');
        }
      } else {
        console.log('Form is invalid');
      }
    }
    

  navigateToRegister(): void {
    this.router.navigate(['/registration']); // Programmatically navigate to Registration page
  }

  navigateToPasswordRecovery(): void {
    this.router.navigate(['/password-recovery']);
  }
  
}

