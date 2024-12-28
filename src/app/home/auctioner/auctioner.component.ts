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
  selectedImage: string | ArrayBuffer | null = null;
  showAddProduct = false;

  products = [
    { name: 'ASUS X750 17-Inch', price: 8500, category: 'electronics', image: 'assets/sample-product.jpg' },
    { name: 'Black Adidas', price: 2400, category: 'fashion', image: 'assets/sample-product2.jpg' },
    { name: 'Sony Headphones', price: 1200, category: 'electronics', image: 'assets/sample-product3.jpg' },
  ];
  filteredProducts = [...this.products];

  @ViewChild('products') productsSection!: ElementRef;

  constructor(private fb: FormBuilder) {
    this.auctionForm = this.fb.group({
      productName: ['', Validators.required],
      minimumPrice: ['', [Validators.required, Validators.min(1)]],
      productCategory: ['', Validators.required],
      sessionDate: ['', Validators.required],
      sessionTime: ['', Validators.required],
    });
  }

  onFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImage = reader.result;
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

  submitProduct() {
    if (this.auctionForm.valid) {
      const newProduct = {
        ...this.auctionForm.value,
        image: this.selectedImage || 'assets/default-image.jpg',
      };
      this.products.push(newProduct);
      this.filteredProducts = [...this.products];
      alert('Product Submitted Successfully!');
      this.auctionForm.reset();
      this.showAddProduct = false;
      this.selectedImage = null;
    }
  }

  cancel() {
    this.auctionForm.reset();
    this.showAddProduct = false;
    this.selectedImage = null;
  }
}
