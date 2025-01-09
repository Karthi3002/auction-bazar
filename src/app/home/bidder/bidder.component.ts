import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../../auth.service'; // Import the AuthService for authentication checks

@Component({
  selector: 'app-bidder-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bidder.component.html',
  styleUrls: ['./bidder.component.css']
})
export class BidderComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  yourBids: { productName: string; amount: string; status: string }[] = [];
  showProducts = true;
  showBids = false;
  bidderEmail: string | null = null; // To track the bidder's email
  isAuthenticated = false; // To check if the bidder is authenticated
  router: any;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    this.checkAuthentication();
    if (this.isAuthenticated) {
      await this.loadProducts();
    }
  }

  // Check if the bidder is authenticated using AuthService
  checkAuthentication() {
    this.bidderEmail = this.authService.getUserEmail(); // Get the logged-in user's email
    this.isAuthenticated = !!this.bidderEmail; // Set authentication status
    if (!this.isAuthenticated) {
      alert('You need to log in to access this page.');
      // Redirect logic can be added here
    }
  }

  // Encrypt Image: Use base64 encoding for this example
  encryptImage(image: string): string {
    return btoa(image); // Base64 encoding for the image string
  }

  // Decrypt Image: Decode base64 encoded image
  decryptImage(encryptedImage: string): string {
    return atob(encryptedImage); // Base64 decoding to get original image string
  }

  // Load all products from auctioneers in Firestore
  async loadProducts(): Promise<void> {
    try {
      const auctioneersCollection = collection(this.firestore, 'auctioneers');
      const auctioneersSnapshot = await getDocs(auctioneersCollection);

      for (const auctioneerDoc of auctioneersSnapshot.docs) {
        const auctioneerProductsQuery = query(collection(this.firestore, `auctioneers/${auctioneerDoc.id}/products`));
        const productsSnapshot = await getDocs(auctioneerProductsQuery);

        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          this.products.push({
            ...productData,
            auctioneer: auctioneerDoc.id, // Add auctioneer email for reference
            productImage: this.decryptImage(productData['productImage']), // Decrypt the image
          });
        }
      }

      this.filteredProducts = [...this.products]; // Initialize filtered products
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  searchProducts(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProducts = this.products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }
  placeBid(product: any) {
    const bidAmount = prompt(`Enter your bid for ${product.name}:`);
    if (bidAmount) {
      this.yourBids.push({
        productName: product.name,
        amount: bidAmount,
        status: 'Pending'
      });
      alert('Your bid has been placed successfully!');
    }
  }
  viewProducts() {
    this.showProducts = true;
    this.showBids = false;
  }
  viewYourBids() {
    this.showProducts = false;
    this.showBids = true;
  }
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}