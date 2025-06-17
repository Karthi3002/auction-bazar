import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class PasswordRecoveryComponent {
  recoveryForm: FormGroup;
  auth: Auth = inject(Auth);
  firestore: Firestore = inject(Firestore);
  isLoading: boolean = false;


  constructor(private fb: FormBuilder, private router: Router) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

async onSubmit(): Promise<void> {
  this.isLoading = true;
  if (!this.recoveryForm.valid) return;

  const email = this.recoveryForm.get('email')?.value.trim();
  const collections = ['bidders', 'admins', 'auctioneers'];
  let foundUser = null;
  let foundCollection = '';

  try {
    // Search the user in all collections
    for (const collectionName of collections) {
      const docRef = doc(this.firestore, `${collectionName}/${email}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        foundUser = docSnap.data();
        foundCollection = collectionName;
        break;
      }
    }

    if (!foundUser) {
      alert(`No user found with the email: ${email}`);
      return;
    }

    const username = foundUser['username'] || 'User';

    // Validate if email is in Firebase Auth
    const isAuthEmail = await this.checkEmailInFirebaseAuth(email);
    if (!isAuthEmail) {
      alert(`Email ${email} is not registered in the system. Please contact support.`);
      return;
    }

    // Send recovery email
    await sendPasswordResetEmail(this.auth, email);
    alert(`Hi ${username}, a recovery email was sent to ${email} (${foundCollection}).`);
    this.router.navigate(['/login']);
  } catch (error: any) {
    alert(`Error sending recovery email: ${error.message}`);
  }finally {
    this.isLoading = false;
  }
}

private async checkEmailInFirebaseAuth(email: string): Promise<boolean> {
  this.isLoading = true;
  try {
    // Fake password attempt
    await signInWithEmailAndPassword(this.auth, email, 'dummy_wrong_password');
    return true; // This shouldn't succeed
  } catch (error: any) {
    // If the error is "auth/user-not-found", the email isn't registered in Firebase Auth
    return error.code !== 'auth/user-not-found';
  }finally {
    this.isLoading = false;
  }
}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}


