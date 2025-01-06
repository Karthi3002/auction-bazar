import { CommonModule } from '@angular/common';
import { Component,  OnInit  } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {

  totalAuctions: number | undefined;
  upcomingAuctions: number | undefined;
  ongoingAuctions: number | undefined;
  completedAuctions: number | undefined;
  totalRevenue: number | undefined;
  auctionProgress: number | undefined;

  auctioneerDetails: any = null; // Object to store auctioneer details
  profileImageUrl: string | null = null; // Store decrypted profile image

  constructor(private firestore: Firestore) { }

  ngOnInit(): void {
    // Sample data or fetch from an API
    this.totalAuctions = 20;
    this.upcomingAuctions = 5;
    this.ongoingAuctions = 10;
    this.completedAuctions = 5;
    this.totalRevenue = 50000;
    this.auctionProgress = (this.completedAuctions / this.totalAuctions) * 100;

    // Load auctioneer details
    this.loadAuctioneerDetails('auctioneer@example.com'); // Replace with dynamic email fetching logic
  }

  // Load auctioneer details from Firestore
  async loadAuctioneerDetails(email: string) {
    try {
      const auctioneerRef = doc(this.firestore, `auctioneers/${email}`);
      const auctioneerDoc = await getDoc(auctioneerRef);

      if (auctioneerDoc.exists()) {
        const auctioneerData = auctioneerDoc.data();
        this.auctioneerDetails = {
          username: auctioneerData?.['username'] || 'Not Provided',
          password: auctioneerData?.['password'] || 'Not Provided',
          address: auctioneerData?.['address'] || 'Not Provided',
          role: auctioneerData?.['role'] || 'Not Provided',
          email: auctioneerData?.['email'] || 'Not Provided',
        };

        // Handle profile image
        const encryptedProfileImage = auctioneerData?.['profileImage'] || null;
        if (encryptedProfileImage) {
          this.profileImageUrl = this.decryptImage(encryptedProfileImage);
        }
      } else {
        console.error('No auctioneer details found for this email!');
      }
    } catch (error) {
      console.error('Error fetching auctioneer details:', error);
    }
  }

  // Decrypt profile image
  decryptImage(encryptedImage: string): string {
    return atob(encryptedImage); // Base64 decoding
  }
}
