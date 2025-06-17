import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../../auth.service';

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
  isLoading: boolean = false;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firestore: Firestore,
    private authService: AuthService,
    private auth: Auth
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onPasswordFocus() {
    this.showPasswordDescription = true;
  }

  onPasswordInput() {
    const passwordValue = this.loginForm.get('password')?.value || '';
    this.isPasswordValid = passwordValue.length >= 6;
    this.showPasswordDescription = !this.isPasswordValid;
  }

  onPasswordBlur() {
    this.showPasswordDescription = !this.isPasswordValid;
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;
    if (this.loginForm.valid) {
      const { email, password, role } = this.loginForm.value;

      try {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        const uid = userCredential.user.uid;

        const collectionName =
          role === 'Auctioner' ? 'auctioneers' :
          role === 'Bidder' ? 'bidders' :
          role === 'Admin' ? 'admins' : '';

        if (!collectionName) {
          alert('Invalid role selected.');
          return;
        }

        const userDocRef = doc(this.firestore, `${collectionName}/${uid}`);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // ✅ Save user session in AuthService (uses localStorage internally)
          this.authService.setUserId(uid);
          this.authService.setUserEmail(email);
          this.authService.setUserRole(role);

          alert('Login successful!');

          setTimeout(() => {
            if (role === 'Auctioner') {
              this.router.navigate(['/auctioner']);
            } else if (role === 'Bidder') {
              this.router.navigate(['/bidder']);
            } else if (role === 'Admin') {
              this.router.navigate(['/admin']);
            }
          }, 100);
        } else {
          alert('User not found in Firestore. Please register again.');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        alert(error.message || 'Login failed. Please check your credentials.');
      }
    } else {
      alert('Please fill out all fields correctly.');
    }
    this.isLoading = false;
  }

  navigateToRegister(): void {
    console.log("Navigating to registration page..."); // Debug log
    this.router.navigate(['/registration']);
  }

  navigateToPasswordRecovery(): void {
    this.router.navigate(['/password-recovery']);
  }
}
