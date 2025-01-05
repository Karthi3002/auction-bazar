import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

@Component({
  selector: 'app-bidder-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bidder.component.html',
  styleUrls: ['./bidder.component.css']
})
export class BidderComponent {
  products = [
    { name: 'Smartphone', price: 299, image: 'assets/products/smartphone.jpg' },
    { name: 'Laptop', price: 799, image: 'assets/products/laptop.jpg' },
    { name: 'Sneakers', price: 59, image: 'assets/products/sneakers.jpg' },
    { name: 'Wristwatch', price: 150, image: 'assets/products/wristwatch.jpg' }
  ];
  filteredProducts = [...this.products];
  yourBids: { productName: string; amount: string; status: string }[] = [];
  showProducts = true;
  showBids = false;
  router: any;

  constructor() {}

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