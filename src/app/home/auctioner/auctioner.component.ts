import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, doc, setDoc, getDocs, collection, query, getDoc } from '@angular/fire/firestore';
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

  @ViewChild('products') productsSection!: ElementRef;
  isProductSubmitted: boolean | undefined;

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
    this.loadProducts();
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
    const filterValue = (event.target as HTMLSelectElement).value;
    const currentDate = new Date();
  
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
      return true; // Show all for 'all'
    });
  }
  

  // Check if the auctioneer is authenticated using AuthService
  async checkAuthentication() {
    const email = this.authService.getUserEmail(); // Get email from AuthService
    if (email) {
      this.auctioneerEmail = email;
      this.isAuthenticated = true;
      this.loadAuctioneerProfile(); // Load auctioneer profile once authenticated
    } else {
      this.isAuthenticated = false;
      this.router.navigate(['/login']); // Redirect to login if not authenticated
    }
  }


// Load auctioneer profile information (username, email, and profile image URL)
async loadAuctioneerProfile() {
  if (this.auctioneerEmail) {
    try {
      const auctioneerRef = doc(this.firestore, `auctioneers/${this.auctioneerEmail}`);
      const auctioneerDoc = await getDoc(auctioneerRef);

      if (auctioneerDoc.exists()) {
        const auctioneerData = auctioneerDoc.data();
        this.auctioneerUsername = auctioneerData?.['username'] || 'Auctioneer';
        const encryptedProfileImage = auctioneerData?.['profileImage'] || null;
        if (encryptedProfileImage) {
          this.profileImageUrl = this.decryptImage(encryptedProfileImage); // Decrypt profile image
        }
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error getting auctioneer profile:", error);
    }
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
  

  searchProducts(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm) {
      this.filteredProducts = this.products.filter(product =>
        product.productName.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredProducts = [...this.products]; // Reset to all products when search is cleared
    }
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
    if (this.auctionForm.valid && this.selectedImage) {
      const { productName, minimumPrice, productCategory, quantity, condition, warranty, description, sessionDate, sessionTime, endDate, endTime } = this.auctionForm.value;
      const encryptedImage = this.encryptImage(this.selectedImage);
      const productId = uuidv4(); // Generate a unique ID for the product
  
      // Store product in Firestore
      try {
        await setDoc(doc(this.firestore, `auctioneers/${this.auctioneerEmail}/products`, productId), {
          productId, // Store the product ID for reference
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
          productImage: encryptedImage, // Store encrypted image
        });
  
        // Show success message
        this.successMessage = 'Product added successfully!';
        setTimeout(() => this.successMessage = '', 3000); // Clear the message after 3 seconds
  
        // Reset form after successful submission
        this.auctionForm.reset();
        this.selectedImage = null;
        this.isSubmitDisabled = true;
        this.loadProducts(); // Reload the products list
      } catch (error) {
        console.error('Error storing product:', error);
      }
    }
  }
  


  // Retrieve products from Firestore
  async loadProducts(): Promise<void> {
    if (this.auctioneerEmail) {
      try {
        const productsQuery = query(collection(this.firestore, `auctioneers/${this.auctioneerEmail}/products`));
        const querySnapshot = await getDocs(productsQuery);
        this.products = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          productImage: this.decryptImage(doc.data()['productImage']), // Decrypt the image
        }));

        this.filteredProducts = [...this.products];
      } catch (error) {
        console.error('Error loading products:', error);
      }
    }
  }

  viewProductDetails(product: any): void {
    this.selectedProduct = product; // Set the selected product for display
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
}
