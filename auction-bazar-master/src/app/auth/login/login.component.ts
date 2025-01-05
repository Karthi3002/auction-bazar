import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

  constructor(private fb: FormBuilder, private router: Router) { 
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
  
    onSubmit(): void {
      if (this.loginForm.valid) {
        const formValues = this.loginForm.value;
    

        console.log('Login Details:', formValues);
    

        if (formValues.role === 'Auctioner') {
          this.router.navigate(['/auctioner']); 
        } else if (formValues.role === 'Bidder') {
          this.router.navigate(['/bidder']);
        } else {
          console.log('Invalid role selected!');
        }
      } else {
        console.log('Form is invalid');
      }
    }
    

  navigateToRegister(): void {
    this.router.navigate(['/registration']); 
  }

  navigateToPasswordRecovery(): void {
    this.router.navigate(['/password-recovery']);
  }
  
}

