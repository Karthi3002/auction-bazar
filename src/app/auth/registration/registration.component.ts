import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent {
  registrationForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', Validators.required],
      role: ['', Validators.required],
      
    });
  }


  onSubmit(): void {
    if (this.registrationForm.valid) {
      console.log('Login Successful', this.registrationForm.value);
      alert('Registration successful!');
      this.router.navigate(['/login']);
    } else {
      console.log('Form is invalid');
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']); // Navigate to Login page
  }
}
