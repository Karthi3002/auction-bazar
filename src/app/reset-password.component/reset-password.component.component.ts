import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, confirmPasswordReset } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.component.html',
  styleUrls: ['./reset-password.component.component.css'],

  // ✅ FIX: Ensure CommonModule and ReactiveFormsModule are imported here
  imports: [CommonModule, ReactiveFormsModule]
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  auth: Auth = inject(Auth);
  oobCode: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordsMatchValidator() }
    );
  }

  ngOnInit(): void {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode') || '';
  }

  async onReset(): Promise<void> {
    if (this.resetForm.invalid) return;

    const password = this.resetForm.get('password')?.value;

    try {
      await confirmPasswordReset(this.auth, this.oobCode, password);
      alert('Password reset successful. You can now log in.');
      this.router.navigate(['/login']);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      return password && confirmPassword && password !== confirmPassword
        ? { passwordMismatch: true }
        : null;
    };
  }
}
