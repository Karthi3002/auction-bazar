import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import for *ngIf
import { ReactiveFormsModule } from '@angular/forms'; // Import for formGroup

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.css'],
  imports: [CommonModule, ReactiveFormsModule], // Include required modules
})
export class PasswordRecoveryComponent {
  recoveryForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.recoveryForm.valid) {
      const email = this.recoveryForm.get('email')?.value;
      console.log('Recovery email sent to:', email);
      alert(`A recovery email has been sent to ${email}`);
      this.router.navigate(['/login']);
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
