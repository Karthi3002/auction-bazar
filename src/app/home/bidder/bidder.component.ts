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
export class BidderComponent implements OnInit {
  auctions = [
    { id: 1, name: 'Smartphone', currentBid: 350, timeRemaining: '2h 15m', category: 'electronics', image: 'assets/smartphone.jpg' },
    { id: 2, name: 'Laptop', currentBid: 850, timeRemaining: '5h 30m', category: 'electronics', image: 'assets/laptop.jpg' },
    { id: 3, name: 'Designer Bag', currentBid: 120, timeRemaining: '3h 20m', category: 'fashion', image: 'assets/designer-bag.jpg' },
    { id: 4, name: 'Coffee Maker', currentBid: 75, timeRemaining: '1h 45m', category: 'home', image: 'assets/coffee-maker.jpg' },
    // Add more auction data...
  ];

  bidHistory = [
    { productName: 'Smartphone', amount: 300, status: 'Lost' },
    { productName: 'Laptop', amount: 900, status: 'Won' },
    // More data...
  ];

  watchlist = [
    { id: 1, name: 'Sneakers', startingPrice: 60, image: 'assets/sneakers.jpg' },
    // More data...
  ];

  filteredAuctions = [...this.auctions];

  showBidModal = false;
  selectedProduct: any = null;
  newBid: number = 0;

  constructor() {}

  ngOnInit(): void {}

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredAuctions = this.auctions.filter((auction) =>
      auction.name.toLowerCase().includes(query)
    );
  }

  removeFromWatchlist(id: number): void {
    this.watchlist = this.watchlist.filter((item) => item.id !== id);
  }

  filterByCategory(event: Event): void {
    const category = (event.target as HTMLSelectElement).value;
    this.filteredAuctions = category
      ? this.auctions.filter((auction) => auction.category === category)
      : [...this.auctions];
  }

  placeBid(product: any): void {
    this.selectedProduct = product;
    this.showBidModal = true;
  }

  sortAuctions(event: Event): void {
    const sortOption = (event.target as HTMLSelectElement).value;
    if (sortOption === 'endingSoon') {
      this.filteredAuctions.sort((a, b) => parseTime(a.timeRemaining) - parseTime(b.timeRemaining));
    } else if (sortOption === 'highestBid') {
      this.filteredAuctions.sort((a, b) => b.currentBid - a.currentBid);
    } else if (sortOption === 'lowestBid') {
      this.filteredAuctions.sort((a, b) => a.currentBid - b.currentBid);
    }
  }
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split('h ').join('').split('m');
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}

