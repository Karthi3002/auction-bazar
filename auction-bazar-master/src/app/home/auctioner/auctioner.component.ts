import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc, getDocs, collection, query, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../auth.service'; // Import the AuthService

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

  @ViewChild('products') productsSection!: ElementRef;
  isProductSubmitted: boolean | undefined;

  constructor(private fb: FormBuilder, private router: Router, private firestore: Firestore, private authService: AuthService) {
    this.auctionForm = this.fb.group({
      productName: ['', Validators.required],
      minimumPrice: ['', [Validators.required, Validators.min(1)]],
      productCategory: ['', Validators.required],
      sessionDate: ['', Validators.required],
      sessionTime: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadProducts();
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

  filterProducts(category: string): void {
    if (category === 'all') {
      this.filteredProducts = [...this.products]; // Show all products
    } else {
      this.filteredProducts = this.products.filter(product =>
        product.productCategory === category // Filter by selected category
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
      const { productName, minimumPrice, productCategory, sessionDate, sessionTime } = this.auctionForm.value;
      const encryptedImage = this.encryptImage(this.selectedImage);

      // Store product in Firestore
      try {
        await setDoc(doc(this.firestore, `auctioneers/${this.auctioneerEmail}/products`, productName), {
          productName,
          minimumPrice,
          productCategory,
          sessionDate,
          sessionTime,
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

  // Check form validity and enable/disable the button
  checkFormValidity(): void {
    this.isSubmitDisabled = !this.auctionForm.valid || !this.selectedImage;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  oncancel(): void {
    this.auctionForm.reset();
    this.showAddProduct = false;
    this.selectedImage = null;
    this.isSubmitDisabled = true;
  }
}
