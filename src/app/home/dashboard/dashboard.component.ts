import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Firestore, collection, query, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  auctioneerEmail: string | null = null;
  auctioneerUsername: string | null = null;
  auctioneerPassword: string | null = null;
  auctioneerAddress: string | null = null;
  profileImageUrl: string | null = null;
  products: any[] = [];
  filteredProducts: any[] = [];
  totalProducts: number = 0;
  activeProducts: number = 0;
  soldProducts: number = 0;
  upcomingProducts: number = 0;
  auctionProgress: number = 0;
  passwordVisible: boolean = false;
  uid: string | null = null;
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

    if (uid && role === 'Auctioner') {
      this.auctioneerEmail = this.authService.getUserEmail();
      await this.loadAuctioneerProfile(uid);
      await this.loadProducts(uid);
    } else {
      this.router.navigate(['/login']);
    }
  }


  async loadAuctioneerProfile(uid: string) {
    this.isLoading = true;
    try {
      const auctioneerRef = doc(this.firestore, `auctioneers/${uid}`);
      const auctioneerDoc = await getDoc(auctioneerRef);

      if (auctioneerDoc.exists()) {
        const auctioneerData = auctioneerDoc.data();
        this.auctioneerUsername = auctioneerData?.['username'] || 'Auctioneer';
        this.auctioneerPassword = auctioneerData?.['password'] || '********';
        this.auctioneerAddress = auctioneerData?.['address'] || 'Not Provided';
        const encryptedProfileImage = auctioneerData?.['profileImage'] || null;
        if (encryptedProfileImage) {
          this.profileImageUrl = this.decryptImage(encryptedProfileImage);
        }
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error getting auctioneer profile:", error);
    }  this.isLoading = false;
  }

async loadProducts(uid: string) {
  this.isLoading = true;
  try {
    const productsQuery = query(collection(this.firestore, `auctioneers/${uid}/products`));
    const querySnapshot = await getDocs(productsQuery);
    this.products = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        productImage: this.decryptImage(data['productImage']),
        currentHighestBid: data['currentHighestBid'] || null,
        currentHighestBidderName: data['currentHighestBidderName'] || null,
      };
    });

    this.filteredProducts = [...this.products];

    this.totalProducts = this.filteredProducts.length;
    this.activeProducts = this.filteredProducts.filter(p => this.getProductStatus(p) === 'Active').length;
    this.soldProducts = this.filteredProducts.filter(p => this.getProductStatus(p) === 'Sold').length;
    this.upcomingProducts = this.filteredProducts.filter(p => this.getProductStatus(p) === 'Upcoming').length;

    this.auctionProgress = (this.soldProducts / this.totalProducts) * 100;
  } catch (error) {
    console.error('Error loading products:', error);
  }  this.isLoading = false;
}

calculateProfit(minimumPrice: number, currentBid: number): string {
  if (!currentBid || !minimumPrice || currentBid <= minimumPrice) return '0';
  const profit = ((currentBid - minimumPrice) / minimumPrice) * 100;
  return profit.toFixed(1); // e.g., 12.5%
}



  decryptImage(encryptedImage: string): string {
    return atob(encryptedImage); // Base64 decode
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  getProductStatus(product: any): string {
    const currentDate = new Date();
    const productStartDate = new Date(product.sessionDate + 'T' + product.sessionTime);
    const productEndDate = new Date(product.endDate + 'T' + product.endTime);

    if (currentDate >= productStartDate && currentDate <= productEndDate) {
      return 'Active';
    }
    if (currentDate > productEndDate) {
      return 'Sold';
    }
    if (currentDate < productStartDate) {
      return 'Upcoming';
    }
    return 'Not Started';
  }

  viewProductDetails(product: any): void {
    console.log(product);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
  scrollTable(direction: 'left' | 'right') {
  const wrapper = document.querySelector('.table-scroll-wrapper') as HTMLElement;
  if (wrapper) {
    const scrollAmount = 300;
    wrapper.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }
}


  goBack(): void {
    this.location.back();
  }
}
