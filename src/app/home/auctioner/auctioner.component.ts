import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auctioneer',
  templateUrl: './auctioner.component.html',
  styleUrls: ['./auctioner.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AuctioneerComponent {
  auctionForm: FormGroup;
  selectedImage: string | null = null;
  showAddProduct = false;
  isSubmitDisabled : boolean = true;

  products = [
    {
      name: 'Smartphone',
      price: 299,
      category: 'electronics',
      image: 'assets/products/smartphone.jpg'
    },
    {
      name: 'Laptop',
      price: 799,
      category: 'electronics',
      image: 'assets/products/laptop.jpg'
    },
    {
      name: 'Sneakers',
      price: 59,
      category: 'fashion',
      image: 'assets/products/sneakers.jpg'
    },
    {
      name: 'Jacket',
      price: 99,
      category: 'fashion',
      image: 'assets/products/jacket.jpg'
    },
    {
      name: 'Wristwatch',
      price: 150,
      category: 'fashion',
      image: 'assets/products/wristwatch.jpg'
    },
    {
      name: 'Headphones',
      price: 199,
      category: 'electronics',
      image: 'assets/products/headphones.jpg'
    },
    {
      name: 'Dining Table',
      price: 250,
      category: 'others',
      image: 'assets/products/dining-table.jpg'
    },
    {
      name: 'Blender',
      price: 50,
      category: 'electronics',
      image: 'assets/products/blender.jpg'
    },
    {
      name: 'Handbag',
      price: 70,
      category: 'fashion',
      image: 'assets/products/handbag.jpg'
    },
    {
      name: 'Wall Art',
      price: 80,
      category: 'others',
      image: 'assets/products/wall-art.jpg'
    }
  ];
  filteredProducts = [...this.products];

  @ViewChild('products') productsSection!: ElementRef;
  isProductSubmitted: boolean | undefined;

  constructor(private fb: FormBuilder) {
    this.auctionForm = this.fb.group({
      productName: ['', Validators.required],
      minimumPrice: ['', [Validators.required, Validators.min(1)]],
      productCategory: ['', Validators.required],
      sessionDate: ['', Validators.required],
      sessionTime: ['', Validators.required],
      });
    }

    ngOnInit(): void {
      // Watch form changes to update button state
      this.auctionForm.valueChanges.subscribe(() => {
        this.checkFormValidity();
      });
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

  filterProducts(category: string) {
    this.filteredProducts = category === 'all'
      ? [...this.products]
      : this.products.filter((product) => product.category === category);
  }

  searchProducts(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProducts = this.products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
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

  // Handle form submission
  submitProduct(): void {
    if (this.auctionForm.valid && this.selectedImage) {
      // Process the form submission
      console.log('Form Submitted:', this.auctionForm.value);

      this.isProductSubmitted = true;

      // Reset form after submission
      setTimeout(() => {
        this.isProductSubmitted = false;
        this.auctionForm.reset();
        this.selectedImage = null;
      }, 3000);
    }
  }
  
  // Check form validity and enable/disable the button
  checkFormValidity(): void {
    this.isSubmitDisabled = !this.auctionForm.valid || !this.selectedImage;
  }

  oncancel(): void {
    this.auctionForm.reset();
    this.showAddProduct = false;
    this.selectedImage = null;
    this.isSubmitDisabled = true;
  }
}
