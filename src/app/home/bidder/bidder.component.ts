import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, query, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../auth.service'; // Import the AuthService for authentication checks
import { addDoc, updateDoc } from '@angular/fire/firestore';
import { runTransaction } from '@angular/fire/firestore';

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
  yourBids: {
  showDetails: any;
  productImage: any;
  startTime: string|number|Date;
  endTime: string|number|Date;
  remainingTime: any;
  auctioneerName: any;
  auctioneerEmail: any;
  auctioneerPhone: any;
  statusMessage: any;
  productId: any; productName: string; amount: string; status: string 
    }[] = [];
  showProducts = true;
  showBids = false;
  selectedProduct: any = null;
  selectedProductStatus: string = ''; // To hold the product status
  timeRemaining: string = ''; // To display time remaining for active products
  bidderEmail: string | null = null;
  bidderUID: string | null = null;
  isAuthenticated = false;
  bidderUsername: string | null = null;
  bidderProfileImage: string | null = null;
  mobileMenuOpen = false;
  isDropdownOpen = false;
  allBids: any[] = []; // Store the original complete bid list
  filteredBids: any[] = []; // Store the filtered list to render in the template
  bidCountdownIntervals: { [productId: string]: any } = {};
  isLoading: boolean = false;


  constructor(private fb: FormBuilder, private router: Router,private firestore: Firestore, private authService: AuthService) {}
  ngOnInit(): void {
    this.checkAuthentication();
    this.loadProducts();
  }

  // Check if the bidder is authenticated using AuthService
  // Check if the auctioneer is authenticated using AuthService
  async checkAuthentication() {
    const uid = this.authService.getUserId();
    if (uid) {
      this.bidderUID = uid;
      this.isAuthenticated = true;
      await this.loadBidderProfile();
    await this.loadYourBids();     // ✅ Load bids first
    await this.loadProducts();  // <-- load existing bids here
    } else {
      this.isAuthenticated = false;
      this.router.navigate(['/login']);
    }
  }

  // Load bidder profile information (username, email, and profile image URL)
  async loadBidderProfile() {
    if (this.bidderUID) {
      try {
        const bidderRef = doc(this.firestore, `bidders/${this.bidderUID}`);
        const bidderDoc = await getDoc(bidderRef);
        if (bidderDoc.exists()) {
          const bidderData = bidderDoc.data();
          this.bidderUsername = bidderData?.['username'] || 'Bidder';
          const encryptedProfileImage = bidderData?.['profileImage'] || null;
          if (encryptedProfileImage) {
            this.bidderProfileImage = this.decryptImage(encryptedProfileImage);
          }
        } else {
          console.log("No such bidder document!");
        }
      } catch (error) {
        console.error("Error fetching bidder profile:", error);
      }
    }
  }

  // Filter products based on category
  filterCategory(category: string): void {
    if (category === 'all') {
    // Display all products
      this.filteredProducts = [...this.products]; // Clone the original product list
    } else {
      // Filter products by category
      this.filteredProducts = this.products.filter(
        (product) => product.productCategory === category
      );
    }
  }

  // Format time from 24-hour to 12-hour format with AM/PM
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 24-hour format to 12-hour format
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
    this.isLoading = true;
    try {
      this.products = []; // ✅ clear before loading
      const auctioneersCollection = collection(this.firestore, 'auctioneers');
      const auctioneersSnapshot = await getDocs(auctioneersCollection);
      for (const auctioneerDoc of auctioneersSnapshot.docs) {
        const auctioneerUID = auctioneerDoc.id;
        const auctioneerData = auctioneerDoc.data();
        const auctioneerName = auctioneerData?.['username'] || 'Unknown';
        const auctioneerEmail = auctioneerData?.['email'] || 'N/A';
        const auctioneerPhone = auctioneerData?.['phoneNumber'] || 'N/A';
        const productsQuery = query(collection(this.firestore, `auctioneers/${auctioneerUID}/products`));
        const productsSnapshot = await getDocs(productsQuery);
        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const productId = productDoc.id;
          const hasBid = this.yourBids.some(bid => bid.productId === productId);
          this.products.push({
            ...productData,
            productId,
            auctioneer: auctioneerUID,
            auctioneerName,
            auctioneerEmail,
            auctioneerPhone,
            productImage: this.decryptImage(productData['productImage']),
            currentHighestBid: productData['currentHighestBid'] || productData['minimumPrice'],
            alreadyBidded: hasBid, // ✅ This will help UI
          });
        }
      }
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error('Error loading products:', error);
    }finally {
    this.isLoading = false;
  }
  }

  // Search products by product name
  searchProducts(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProducts = this.products.filter((product) =>
      product.productName?.toLowerCase().includes(query)
    );
  }

  viewProductDetails(product: any) {
    this.selectedProduct = product;
    this.updateProductStatus();
  }

  closeProductDetails() {
    this.selectedProduct = null;
    this.selectedProductStatus = '';
    this.timeRemaining = '';
  }

  updateProductStatus() {
    if (!this.selectedProduct) return;
    const currentTime = new Date();
    const startTime = new Date(`${this.selectedProduct.sessionDate}T${this.selectedProduct.sessionTime}`);
    const endTime = new Date(`${this.selectedProduct.endDate}T${this.selectedProduct.endTime}`);
    if (currentTime > endTime) {
      this.selectedProductStatus = 'sold';
    } else if (currentTime < startTime) {
      this.selectedProductStatus = 'upcoming';
    } else {
      this.selectedProductStatus = 'active';
      this.calculateTimeRemaining(endTime);
    }
  }

  calculateTimeRemaining(endTime: Date) {
    const currentTime = new Date();
    const diffMs = endTime.getTime() - currentTime.getTime();
    if (diffMs <= 0) {
      this.timeRemaining = '00:00:00';
      return;
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    this.timeRemaining = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    setTimeout(() => this.calculateTimeRemaining(endTime), 1000); // Update every second
  }

  filterByStatus(event: Event) {
    const selectedStatus = (event.target as HTMLSelectElement).value;
    if (selectedStatus === '') {
      this.filteredProducts = [...this.products]; // Show all products
    } else {
      this.filteredProducts = this.products.filter(product => {
        const currentTime = new Date();
        const startTime = new Date(`${product.sessionDate}T${product.sessionTime}`);
        const endTime = new Date(`${product.endDate}T${product.endTime}`);
        let status = '';
        if (currentTime > endTime) {
          status = 'sold';
        } else if (currentTime < startTime) {
          status = 'upcoming';
        } else {
          status = 'active';
        }
        return status === selectedStatus;
      });
    }
  }

  getProductStatus(product: any): string {
    const currentTime = new Date();
    const startTime = new Date(`${product.sessionDate}T${product.sessionTime}`);
    const endTime = new Date(`${product.endDate}T${product.endTime}`);
    if (currentTime > endTime) {
      return 'sold';
    } else if (currentTime < startTime) {
      return 'upcoming';
    } else {
      return 'active';
    }
  }
  
  getBidStatusForProduct(productId: string): { status: string; message: string } {
    const bid = this.yourBids.find((b) => b.productId === productId);
    if (bid) {
      return { status: bid.status, message: bid.statusMessage };
    }
    return { status: 'NotBidded', message: '' };
  }

  getButtonLabel(product: any): string {
    const status = this.getProductStatus(product);
    if (status === 'sold') {
      return 'Sold Out';
    } else if (status === 'upcoming') {
      return 'Coming Soon';
    } else if (product.alreadyBidded) {
      return 'Already Bidded';
    } else {
      return 'Place Bid';
    }
  }
  
  getBidStatusLabel(bid: any): string {
    if (bid.status === 'Pending') {
      return 'Update Bid';
    } else if (bid.status === 'Won') {
      return 'Won';
    } else if (bid.status === 'Outbid') {
      return 'Outbid';
    }
    return '';
  }

  handleBidButtonClick(product: any): void {
    const status = this.getProductStatus(product);
    // Check if the user already placed a bid on this product
    const alreadyBidded = this.yourBids.some(
      (bid) => bid.productId === product.productId
    );
    if (product.alreadyBidded) {
    alert('The selected product is already bidded. Please visit your Bids section to place the bid again.');
    return; 
  }
    if (status === 'sold') {
      alert('This product is sold out!');
      } else if (status === 'upcoming') {
        const startTime = new Date(`${product.sessionDate}T${product.sessionTime}`);
        const currentTime = new Date();
        const timeUntilActive = Math.max(0, startTime.getTime() - currentTime.getTime());
        const hours = Math.floor(timeUntilActive / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilActive % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilActive % (1000 * 60)) / 1000);
        alert(
          `This product is not active yet. Time remaining: ${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else if (status === 'active') {
      this.placeBid(product);
    }
  }

  async placeBid(product: any) {
    this.isLoading = true;

    if (!product.auctioneer) {
      alert('Internal error: Product data is incomplete.');
      return;
    }
    if (!this.bidderUID) {
      alert('User not authenticated.');
      return;
    }
    const status = this.getProductStatus(product);
    if (status !== 'active') {
      alert(`Bidding not allowed. Product is ${status}.`);
      return;
    }
    const productDocRef = doc(this.firestore, `auctioneers/${product.auctioneer}/products/${product.productId}`);
    const productDocSnap = await getDoc(productDocRef);
    if (!productDocSnap.exists()) {
      alert('Product does not exist.');
      return;
    }
    const productData = productDocSnap.data();
    const currentHighestBid = parseFloat(productData?.['currentHighestBid'] || product.minimumPrice);
    // Check if this bidder has already placed a bid
    const bidsCollectionRef = collection(this.firestore, `bidders/${this.bidderUID}/bids`);
    const bidsSnapshot = await getDocs(bidsCollectionRef);
    const existingBidDoc = bidsSnapshot.docs.find(doc => doc.data()['productId'] === product.productId);
    let message = '';
    let existingAmount = 0;
    if (existingBidDoc) {
      existingAmount = parseFloat(existingBidDoc.data()?.['bidAmount'] || '0');
      message = `Current Highest Bid: ₹${currentHighestBid}. Your Previous Bid: ₹${existingAmount}\nEnter a new bid:`;
    } else if (currentHighestBid > product.minimumPrice) {
      message = `Current Highest Bid: ₹${currentHighestBid}\nEnter your bid for ${product.productName}:`;
    } else {
      message = `Enter your bid for ${product.productName} (Minimum: ₹${product.minimumPrice}):`;
    }
    const bidInput = prompt(message);
    if (!bidInput) return;

    const bidValue = parseFloat(bidInput);
    if (isNaN(bidValue)) {
      alert('Invalid bid amount.');
      return;
    }
    if (bidValue < product.minimumPrice) {
      alert(`Bid must be at least the minimum price of ₹${product.minimumPrice}`);
      return;
    }
    if (bidValue <= currentHighestBid) {
      alert(`Your bid must be higher than the current highest bid of ₹${currentHighestBid}`);
      return;
    }
    if (existingBidDoc && bidValue <= existingAmount) {
      alert(`New bid must be higher than your previous bid of ₹${existingAmount}`);
      return;
    }
    try {
      // Save/update bid in bidder's collection
      if (existingBidDoc) {
        await updateDoc(existingBidDoc.ref, {
          bidAmount: bidValue,
          timestamp: new Date(),
          status: 'Pending',
        });
      } else {
        const bidData = {
          productId: product.productId,
          productName: product.productName,
          auctioneerUID: product.auctioneer,
          bidAmount: bidValue,
          timestamp: new Date(),
          status: 'Pending',
        };
        await addDoc(bidsCollectionRef, bidData);
      }
      // ✅ Ensure bidder profile is fetched just before transaction
      const bidderDocRef = doc(this.firestore, `bidders/${this.bidderUID}`);
      const bidderDocSnap = await getDoc(bidderDocRef);

      let bidderName = 'Unknown';
      let bidderEmail = 'N/A';
      let bidderPhone = 'N/A';

      if (bidderDocSnap.exists()) {
        const data = bidderDocSnap.data();
        bidderName = data['username'] || 'Unknown';
        bidderEmail = data['email'] || 'N/A';
        bidderPhone = data['phoneNumber'] || 'N/A';
      }

      // ✅ Run the transaction
      await runTransaction(this.firestore, async (transaction) => {
        const prodDoc = await transaction.get(productDocRef);
        if (!prodDoc.exists()) throw new Error('Product not found.');
        const prodData = prodDoc.data();

        const latestHighest = parseFloat(prodData?.['currentHighestBid'] || '0');
        if (bidValue > latestHighest) {
          transaction.update(productDocRef, {
            currentHighestBid: bidValue,
            currentHighestBidder: this.bidderUID,
            currentHighestBidderName: bidderName,
            currentHighestBidderEmail: bidderEmail,
            currentHighestBidderPhone: bidderPhone
          });
        }
      });
      alert(existingBidDoc ? 'Your bid has been updated successfully!' : 'Your bid has been placed successfully!');
      await this.loadYourBids();
      this.products = this.products.map(p => {
        if (p.productId === product.productId) {
          return { ...p, alreadyBidded: true };
        }
        return p;
      });
      this.filteredProducts = [...this.products]; // To reflect UI change

    } catch (error) {
      console.error('Error placing/updating bid:', error);
      alert('Failed to place or update the bid. Please try again.');
    }finally {
    this.isLoading = false;
  }
  }

  async loadYourBids() {
    this.isLoading = true;
    if (!this.bidderUID) return;
    try {
      const bidsCollectionRef = collection(this.firestore, `bidders/${this.bidderUID}/bids`);
      const bidsSnapshot = await getDocs(bidsCollectionRef);
      const bidsWithStatus = [];

      for (const bidDoc of bidsSnapshot.docs) {
        const bidData = bidDoc.data();
        const productId = bidData['productId'];
        const auctioneerUID = bidData['auctioneerUID'];

        const productDocRef = doc(this.firestore, `auctioneers/${auctioneerUID}/products/${productId}`);
        const productDocSnap = await getDoc(productDocRef);

        let finalStatus = bidData['status'] || 'Pending';
        let statusMessage = finalStatus;
        let formattedStartTime = '';
        let formattedEndTime = '';
        let timeRemaining = '';

        if (productDocSnap.exists()) {
          const productData = productDocSnap.data();
          const currentTime = new Date();
          const startTime = new Date(`${productData['sessionDate']}T${productData['sessionTime']}`);
          const endTime = new Date(`${productData['endDate']}T${productData['endTime']}`);

          // ✅ Always show start and end time
          formattedStartTime = this.formatTime(productData['sessionTime']);
          formattedEndTime = this.formatTime(productData['endTime']);

          if (currentTime > endTime) {
            const highestBidderUID = productData['currentHighestBidder'] || null;
            if (highestBidderUID === this.bidderUID) {
              statusMessage = 'You won the bid! The product is yours.';
              finalStatus = 'Won';
            } else {
              statusMessage = 'Thanks for bidding. Product won by another bidder.';
              finalStatus = 'Outbid';
            }

            await updateDoc(bidDoc.ref, {
              status: finalStatus,
              statusMessage: statusMessage,
            });

            timeRemaining = 'Auction Finished'; // ✅ Always show this after auction ends
          } else {
            // ⏳ Show live time remaining if auction is ongoing
            const diffMs = endTime.getTime() - currentTime.getTime();
            if (diffMs > 0) {
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
              timeRemaining = `${hours.toString().padStart(2, '0')}:${minutes
                .toString()
                .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
              timeRemaining = 'Auction Finished';
            }
          }
        }

        // ✅ Always fetch auctioneer info
        let auctioneerName = 'Unknown';
        let auctioneerEmail = 'N/A';
        let auctioneerPhone = 'N/A';
        try {
          const auctioneerDocRef = doc(this.firestore, `auctioneers/${auctioneerUID}`);
          const auctioneerDocSnap = await getDoc(auctioneerDocRef);
          if (auctioneerDocSnap.exists()) {
            const auctioneerData = auctioneerDocSnap.data();
            auctioneerName = auctioneerData?.['username'] || 'Unknown';
            auctioneerEmail = auctioneerData?.['email'] || 'N/A';
            auctioneerPhone = auctioneerData?.['phoneNumber'] || 'N/A';
          }
        } catch (e) {
          console.error(`Error fetching auctioneer data for UID ${auctioneerUID}`, e);
        }

        // ✅ Always push time info regardless of bid status
        bidsWithStatus.push({      
          productImage: productDocSnap.exists() ? this.decryptImage(productDocSnap.data()['productImage']) : null,
          productId,
          productName: bidData['productName'],
          amount: Number(bidData['bidAmount']).toFixed(2),
          status: finalStatus,
          statusMessage,
          auctioneerName,
          auctioneerEmail,
          auctioneerPhone,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          remainingTime: timeRemaining,
          auctioneer: auctioneerUID,
          showDetails: false,
        });

        // Start a live countdown
if (finalStatus === 'Pending' && productDocSnap.exists()) {
  const endTime = new Date(`${productDocSnap.data()['endDate']}T${productDocSnap.data()['endTime']}`);
  this.startCountdown(productId, endTime);
      }
    }
      this.yourBids = bidsWithStatus;
      this.allBids = bidsWithStatus;
      this.filteredBids = [...bidsWithStatus];

    } catch (error) {
      console.error('Error loading your bids:', error);
    }finally {
    this.isLoading = false;
  }
  }

  startCountdown(productId: string, endTime: Date) {
  if (this.bidCountdownIntervals[productId]) {
    clearInterval(this.bidCountdownIntervals[productId]);
  }

  this.bidCountdownIntervals[productId] = setInterval(() => {
    const now = new Date().getTime();
    const distance = endTime.getTime() - now;

    if (distance <= 0) {
      clearInterval(this.bidCountdownIntervals[productId]);
      const bid = this.yourBids.find(b => b.productId === productId);
      if (bid) bid.remainingTime = 'Auction Finished';
    } else {
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      const bid = this.yourBids.find(b => b.productId === productId);
      if (bid) bid.remainingTime = `${hours.toString().padStart(2, '0')}:${minutes
        .toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}
  

  filterYourBids(event: Event) {
    const selectedStatus = (event.target as HTMLSelectElement).value;
    if (selectedStatus === '') {
      this.filteredBids = [...this.allBids];
    } else {
      this.filteredBids = this.allBids.filter(bid => bid.status === selectedStatus);
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

  navigateToDashboard(): void {
    this.router.navigate(['/bidder-dashboard']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  goBackToProducts(): void {
    this.showBids = false;
    this.showProducts = true;
  }

toggleBidDetails(index: number): void {
  this.filteredBids.forEach((bid, i) => {
    bid.showDetails = i === index ? !bid.showDetails : false;
  });
}


  logout(): void {
    this.authService.logout();         // Clear session
    this.router.navigate(['/login']);  // Redirect to login page
  }
}