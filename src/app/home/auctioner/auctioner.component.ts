import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, doc, setDoc, getDocs, collection, query, getDoc, writeBatch } from '@angular/fire/firestore';
import { AuthService } from '../../../auth.service'; // Import the AuthService

@Component({
  selector: 'app-auctioner',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './auctioner.component.html',
  styleUrls: ['./auctioner.component.css'],
})
export class AuctioneerComponent implements OnInit {
  auctionForm: FormGroup;
  selectedImage: string | null = null;
  showAddProduct = false;
  isSubmitDisabled: boolean = true;
  isAuthenticated: boolean = false;
  products: any[] = [];
  auctioneerEmail: string | null = null;
  auctioneerUsername: string | null = null; // New variable for username
  successMessage: string = '';  // New variable for success message
  filteredProducts = [...this.products];
  profileImageUrl: string | null = null; 
  selectedProduct: any = null; 
  isDashboardVisible = false; // New variable to toggle dashboard visibility
  totalProducts = 0;
  activeAuctions = 0;
  upcomingAuctions = 0;
  soldProducts = 0;
  auctioneerUID: string | null = null; // Store UID
  isMenuOpen: boolean = false;
  isSubMenuOpen: boolean = false;
  searchTerm: string = '';
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';
  isLoading: boolean = false; // For initial loading and filtering
  noProductsFound: boolean = false; // Show if filtered results are empty


  @ViewChild('products') productsSection!: ElementRef;
  isProductSubmitted: boolean | undefined;
  uid: any;

  constructor(private fb: FormBuilder, private router: Router, private firestore: Firestore, private authService: AuthService) {
    this.auctionForm = this.fb.group({
      productName: ['', Validators.required],
      minimumPrice: ['', [Validators.required, Validators.min(1)]],
      productCategory: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      condition: ['', Validators.required],
      warranty: [''],
      description: [''],
      sessionDate: ['', Validators.required],
      sessionTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required],
    });    
  }

  ngOnInit(): void {
    this.checkAuthentication();
    setInterval(() => this.updateProductStatuses(), 60000); // Update statuses every 60 seconds
  }
  
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 24-hour format to 12-hour format
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  getProductStatus(product: any): string {
    const currentDate = new Date();
    const productStartDate = new Date(product.sessionDate + 'T' + product.sessionTime);
    const productEndDate = new Date(product.sessionDate + 'T' + product.endTime);
  
    // Case 1: Active
    if (currentDate >= productStartDate && currentDate <= productEndDate) {
      return 'Active';
    }
  
    // Case 2: Upcoming (Same Day)
    if (currentDate < productStartDate && currentDate.toDateString() === productStartDate.toDateString()) {
      const remainingTime = Math.ceil((productStartDate.getTime() - currentDate.getTime()) / (1000 * 60));
      if (remainingTime <= 60) {
        return `Upcoming: ${remainingTime} minutes remaining`;
      }
      return `Upcoming: In ${Math.ceil(remainingTime / 60)} hours`;
    }
  
    // Case 3: Upcoming (Future Date)
    if (currentDate < productStartDate) {
      const isTomorrow = productStartDate.getDate() === currentDate.getDate() + 1;
      if (isTomorrow) {
        return 'Upcoming: Tomorrow';
      }
      const diffInDays = Math.ceil((productStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      return `Upcoming: In ${diffInDays} days`;
    }
  
    // Case 4: Sold
    if (currentDate > productEndDate) {
      return 'Sold';
    }
  
    return 'Unknown Status'; // Fallback
  }
  
  
filterProductsByStatus(event: Event): void {
  this.isLoading = true;
  const filterValue = (event.target as HTMLSelectElement).value;
  const currentDate = new Date();

  setTimeout(() => { // Simulate loading
    this.filteredProducts = this.products.filter(product => {
      const startDate = new Date(product.sessionDate + 'T' + product.sessionTime);
      const endDate = new Date(product.endDate + 'T' + product.endTime);

      if (filterValue === 'active') {
        return currentDate >= startDate && currentDate <= endDate;
      } else if (filterValue === 'upcoming') {
        return currentDate < startDate;
      } else if (filterValue === 'sold-out') {
        return currentDate > endDate;
      }
      return true;
    });

    this.noProductsFound = this.filteredProducts.length === 0;
    this.isLoading = false;
  }, 500);
}


  getStatusClass(product: any): string {
    const status = this.getProductStatus(product).toLowerCase();
  
    if (status.startsWith('upcoming')) {
      return 'upcoming';
    } else if (status.includes('active')) {
      return 'active';
    } else if (status.includes('sold')) {
      return 'sold';
    } else {
      return 'unknown';
    }
  }
  
  

  // Check if the auctioneer is authenticated using AuthService
async checkAuthentication() {
  const uid = this.authService.getUserId(); // Get UID from AuthService
  if (uid) {
    this.isAuthenticated = true;
    this.auctioneerUID = uid; // Store UID
    await this.loadAuctioneerProfile(uid); // Load profile using UID
    await this.loadProducts(uid);          // Load products using UID
  } else {
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }
}


// Load auctioneer profile information (username, email, and profile image URL)
async loadAuctioneerProfile(uid: string) {
  try {
    const auctioneerRef = doc(this.firestore, `auctioneers/${uid}`);
    const auctioneerDoc = await getDoc(auctioneerRef);

    if (auctioneerDoc.exists()) {
      const auctioneerData = auctioneerDoc.data();
      this.auctioneerUsername = auctioneerData['username'];
      this.profileImageUrl = atob(auctioneerData['profileImage']); // decrypt image
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}



  // Handle file selection for image
  onSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
        this.checkFormValidity();
      };
      reader.readAsDataURL(file);
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

  // Filter products based on category
  filterCategory(category: string): void {
    this.isLoading = true;
    setTimeout(() => {
      if (category === 'all') {
        this.filteredProducts = [...this.products];
      } else {
        this.filteredProducts = this.products.filter(
          (product) => product.productCategory === category
        );
      }

      this.noProductsFound = this.filteredProducts.length === 0;
      this.isLoading = false;
      this.isSubMenuOpen = false;
    }, 500);
  }

  

  searchProducts(event: Event): void {
    this.isLoading = true;
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    setTimeout(() => {
      if (searchTerm) {
        this.filteredProducts = this.products.filter(product =>
          product.productName.toLowerCase().includes(searchTerm)
        );
      } else {
        this.filteredProducts = [...this.products];
      }

      this.noProductsFound = this.filteredProducts.length === 0;
      this.isLoading = false;
    }, 500);
  }


  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
  toggleAddProduct() {
    this.showAddProduct = !this.showAddProduct;
  }

  // Handle form submission and store the product
async submitProduct(): Promise<void> {
  this.isLoading = true;
  if (this.auctionForm.valid && this.selectedImage && this.auctioneerUID) {
    const {
      productName,
      minimumPrice,
      productCategory,
      quantity,
      condition,
      warranty,
      description,
      sessionDate,
      sessionTime,
      endDate,
      endTime
    } = this.auctionForm.value;

    const encryptedImage = this.encryptImage(this.selectedImage);
    const productId = uuidv4();

    const currentDate = new Date();
    const productStartDate = new Date(sessionDate + 'T' + sessionTime);
    const productEndDate = new Date(endDate + 'T' + endTime);

    let status: string;
    if (currentDate < productStartDate) {
      status = 'Upcoming';
    } else if (currentDate >= productStartDate && currentDate <= productEndDate) {
      status = 'Active';
    } else {
      status = 'Sold';
    }

    try {
      // ✅ Store under UID instead of email
      await setDoc(doc(this.firestore, `auctioneers/${this.auctioneerUID}/products`, productId), {
        productId,
        productName,
        minimumPrice,
        productCategory,
        quantity,
        condition,
        warranty,
        description,
        sessionDate,
        sessionTime,
        endDate,
        endTime,
        productImage: encryptedImage,
        status
      });

      this.successMessage = 'Product added successfully!';
      setTimeout(() => this.successMessage = '', 3000);

      this.auctionForm.reset();
      this.selectedImage = null;
      this.isSubmitDisabled = true;
      this.loadProducts(this.auctioneerUID);
    } catch (error) {
      console.error('Error storing product:', error);
    }finally {
    this.isLoading = false;
  }
  }
}

  
  // Function to periodically update product statuses in the database
// Complete this inside your component
async updateProductStatuses(): Promise<void> {
  if (this.auctioneerUID) {
    try {
      const productsQuery = query(collection(this.firestore, `auctioneers/${this.auctioneerUID}/products`));
      const querySnapshot = await getDocs(productsQuery);

      const batch = writeBatch(this.firestore);
      const currentDate = new Date();

      querySnapshot.forEach(docSnapshot => {
        const product = docSnapshot.data();
        const docRef = doc(this.firestore, `auctioneers/${this.auctioneerUID}/products/${docSnapshot.id}`);

        const productStart = new Date(product['sessionDate'] + 'T' + product['sessionTime']);
        const productEnd = new Date(product['endDate'] + 'T' + product['endTime']);

        let newStatus = product['status'];

        if (currentDate < productStart) {
          newStatus = 'Upcoming';
        } else if (currentDate >= productStart && currentDate <= productEnd) {
          newStatus = 'Active';
        } else if (currentDate > productEnd) {
          newStatus = 'Sold';
        }

        if (newStatus !== product['status']) {
          batch.update(docRef, { status: newStatus });
        }
      });

      await batch.commit();
      this.loadProducts(this.auctioneerUID); // Refresh products
    } catch (error) {
      console.error('Error updating product statuses:', error);
    }
  }
}



  // Retrieve products from Firestore
async loadProducts(uid: string) {
  this.isLoading = true; // Start loading
  this.noProductsFound = false;

  try {
    const productsRef = collection(this.firestore, `auctioneers/${uid}/products`);
    const querySnapshot = await getDocs(productsRef);
    this.products = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
        if (data['productImage']) {
    data['productImage'] = this.decryptImage(data['productImage']); // ✅ Decode base64 image
  }
      this.products.push(data); // No need to check UID again here
    });

    this.filteredProducts = [...this.products];
    this.totalProducts = this.products.length; // This also needs UID fix (see below)
  } catch (error) {
    console.error('Error loading products:', error);
  }
  finally {
  this.isLoading = false;
  } // Stop loading
}

async viewProductDetails(product: any) {
  this.selectedProduct = product;
}

  
  closeProductDetails(): void {
    this.selectedProduct = null; // Clear the selected product to hide the modal
  }
  

  // Check form validity and enable/disable the button
  checkFormValidity(): void {
    this.isSubmitDisabled = !this.auctionForm.valid || !this.selectedImage;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  
    // Function to load the dashboard stats
    loadDashboardStats(): void {
      this.activeAuctions = this.products.filter(product => {
        const currentDate = new Date();
        const startDate = new Date(product.sessionDate + 'T' + product.sessionTime);
        const endDate = new Date(product.endDate + 'T' + product.endTime);
        return currentDate >= startDate && currentDate <= endDate;
      }).length;
  
      this.upcomingAuctions = this.products.filter(product => {
        const currentDate = new Date();
        const startDate = new Date(product.sessionDate + 'T' + product.sessionTime);
        return currentDate < startDate;
      }).length;
  
      this.soldProducts = this.products.filter(product => {
        const currentDate = new Date();
        const endDate = new Date(product.endDate + 'T' + product.endTime);
        return currentDate > endDate;
      }).length;
    }

  oncancel(): void {
    this.auctionForm.reset();
    this.showAddProduct = false;
    this.selectedImage = null;
    this.isSubmitDisabled = true;
  }
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  toggleSubMenu(): void {
    this.isSubMenuOpen = !this.isSubMenuOpen;
  }

  logout(): void {
  this.authService.logout();         // Clear session
  this.router.navigate(['/login']);  // Redirect to login page
}


}
