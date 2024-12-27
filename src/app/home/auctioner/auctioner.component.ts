import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import for *ngIf
import { ReactiveFormsModule } from '@angular/forms'; // Import for formGroup

@Component({
  selector: 'app-auctioneer',
  templateUrl: './auctioner.component.html',
  styleUrls: ['./auctioner.component.css'],
  imports: [CommonModule, ReactiveFormsModule], // Include required modules
})
export class AuctioneerComponent {
  auctionForm: FormGroup;
  selectedImage: string | ArrayBuffer | null = null;
  showAddProduct = false;

  products = [
    { name: 'ASUS X750 17-Inch', price: 8500, category: 'electronics', image: 'assets/sample-product.jpg' },
    { name: 'Black Adidas', price: 2400, category: 'fashion', image: 'assets/sample-product2.jpg' },
    { name: 'Sony Headphones', price: 1200, category: 'electronics', image: 'assets/sample-product3.jpg' },
    // Add more products as needed
  ];
  filteredProducts = [...this.products];

  @ViewChild('products') productsSection!: ElementRef; // Reference for the products section

  constructor(private fb: FormBuilder) {
    this.auctionForm = this.fb.group({
      productName: ['', Validators.required],
      minimumPrice: ['', [Validators.required, Validators.min(1)]],
      productCategory: ['', Validators.required],
      sessionDate: ['', Validators.required],
      sessionTime: ['', Validators.required],
    });
  }

    // Handle file selection
    onFileSelect(event: Event) {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedImage = reader.result; // Preview the image
        };
        reader.readAsDataURL(file);
      }
    }


      // Filter products by category
  filterProducts(category: string) {
    if (category === 'all') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter((product) => product.category === category);
    }
  }

  // Search products by name
  searchProducts(event: Event) {
    const inputElement = event.target as HTMLInputElement; // Cast to HTMLInputElement
    const query = inputElement.value.toLowerCase();
    this.filteredProducts = this.products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }
  
  
    scrollToSection(sectionId: string) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' }); // Smooth scroll to the section
      }
    }
    
    toggleAddProduct() {
      this.showAddProduct = !this.showAddProduct;
    }

  submitProduct() {
    if (this.auctionForm.valid) {
      console.log('Submitted:', this.auctionForm.value);
      alert('Product Submitted!');
      this.showAddProduct = false;
    }
  }

  cancel() {
    this.auctionForm.reset();
    this.showAddProduct = false;
  }
}
