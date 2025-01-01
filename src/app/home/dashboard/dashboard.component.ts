import { CommonModule } from '@angular/common';
import { Component,  OnInit  } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {

  totalAuctions: number | undefined;
  upcomingAuctions: number | undefined;
  ongoingAuctions: number | undefined;
  completedAuctions: number | undefined;
  totalRevenue: number | undefined;
  auctionProgress: number | undefined;

  constructor() { }

  ngOnInit(): void {
    // Sample data or fetch from an API
    this.totalAuctions = 20;
    this.upcomingAuctions = 5;
    this.ongoingAuctions = 10;
    this.completedAuctions = 5;
    this.totalRevenue = 50000;
    this.auctionProgress = (this.completedAuctions / this.totalAuctions) * 100;
  }

}
