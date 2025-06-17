import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, query, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../auth.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-bidder-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bidder-dashboard.component.html',
  styleUrls: ['./bidder-dashboard.component.css']
})
export class BidderDashboardComponent implements OnInit {
  bidderEmail: string | null = null;
  bidderUsername: string | null = null;
  bidderPassword: string | null = null;
  bidderAddress: string | null = null;
  profileImageUrl: string | null = null;
  yourBids: any[] = [];
  filteredBids: any[] = [];

  totalBids = 0;
  pendingBids = 0;
  outbidBids = 0;
  wonBids = 0;
  bidProgress = 0;

  passwordVisible = false;
  isLoading: boolean = false;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private location: Location,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
  }
  async checkAuthentication() {
    const uid = this.authService.getUserId();
    const role = this.authService.getUserRole();

    if (uid && role === 'Bidder') {
      this.bidderEmail = this.authService.getUserEmail();
      await this.loadBidderProfile(uid);
      await this.loadYourBidsData(uid);
    } else {
      this.router.navigate(['/login']);
    }
  }


  async loadBidderProfile(uid: string) {
    this.isLoading = true;
    try {
      const bidderRef = doc(this.firestore, `bidders/${uid}`);
      const bidderDoc = await getDoc(bidderRef);
      if (bidderDoc.exists()) {
        const data = bidderDoc.data();
        this.bidderUsername = data?.['username'] || 'Bidder';
        this.bidderPassword = data?.['password'] || '********';
        this.bidderAddress = data?.['address'] || 'Not Provided';
        const encryptedImage = data?.['profileImage'];
        this.profileImageUrl = encryptedImage ? this.decryptImage(encryptedImage) : null;
      }
    } catch (error) {
      console.error('Error fetching bidder profile:', error);
    }  this.isLoading = false;
  }

async loadYourBidsData(uid: string) {
      this.isLoading = true;
  const bidsRef = collection(this.firestore, `bidders/${uid}/bids`);
  const bidsSnap = await getDocs(bidsRef);
  const bids: any[] = [];

  for (const bidDoc of bidsSnap.docs) {
    const bid = bidDoc.data();
    const auctioneerUID = bid['auctioneerUID'];
    const productId = bid['productId'];
    const bidderBidAmount = parseFloat(bid['bidAmount']) || 0;

    const productRef = doc(this.firestore, `auctioneers/${auctioneerUID}/products/${productId}`);
    const productSnap = await getDoc(productRef);

    let startDate = 'N/A', startTime = 'N/A', endDate = 'N/A', endTime = 'N/A';
    let status = 'Pending';
    let minimumPrice = 0;
    let currentHighestBid = 0;
    let product: any = null;

    if (productSnap.exists()) {
      product = productSnap.data();
      startDate = product['sessionDate'];
      startTime = product['sessionTime'];
      endDate = product['endDate'];
      endTime = product['endTime'];
      minimumPrice = parseFloat(product['minimumPrice']) || 0;
      currentHighestBid = parseFloat(product['currentHighestBid']) || 0;

      const now = new Date();
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);

      if (now < start) {
        status = 'Pending';
      } else if (now >= start && now <= end) {
        status = 'Pending';
      } else if (now > end && product['currentHighestBidder'] === uid) {
        status = 'Won';
      } else {
        status = 'Outbid';
      }
    }

    const bidderLastBid = bidderBidAmount.toFixed(2);
    const highestBid = currentHighestBid.toFixed(2);
    const profitFromBidderBid = (bidderBidAmount - minimumPrice).toFixed(2);
    const profitFromHighestBid = (currentHighestBid - minimumPrice).toFixed(2);

    bids.push({
      ...bid,
      status,
      productName: bid['productName'],
      startDate,
      startTime,
      endDate,
      endTime,
      productImage: product?.productImage ? this.decryptImage(product.productImage) : null,
      minimumPrice: minimumPrice.toFixed(2),
      bidderLastBid,
      highestBid,
      profitFromBidderBid,
      profitFromHighestBid,
    });
  }

  this.yourBids = bids;
  this.filteredBids = bids;
  this.calculateStats();
  this.isLoading = false;
}

  calculateStats() {
    this.totalBids = this.yourBids.length;
    this.pendingBids = this.yourBids.filter(b => b.status === 'Pending').length;
    this.outbidBids = this.yourBids.filter(b => b.status === 'Outbid').length;
    this.wonBids = this.yourBids.filter(b => b.status === 'Won').length;

    const completed = this.wonBids;
    const total = this.totalBids;
    this.bidProgress = total > 0 ? Math.floor((completed / total) * 100) : 0;
  }

  getBidStatusLabel(bid: any): string {
    if (bid.status === 'Won') return 'Won';
    if (bid.status === 'Outbid') return 'Outbid';
    if (bid.status === 'Pending') return 'Update Bid';
    return 'Pending';
  }

  scrollTable(direction: 'left' | 'right') {
    const container = document.querySelector('.scrollable-table') as HTMLElement;
    if (container) {
      const scrollAmount = 300; // Adjust based on how far to scroll
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }



  decryptImage(encryptedImage: string): string {
    return atob(encryptedImage);
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  goBack() {
    this.location.back();
  }
}
