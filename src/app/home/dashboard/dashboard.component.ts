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
  totalAuctions: number = 120; // Example value
  upcomingAuctions: number = 15; // Example value
  ongoingAuctions: number = 30; // Example value
  completedAuctions: number = 75; // Example value
  totalRevenue: number = 200000; // Example value
  activeAuctions: number = 8; // Example value
  recentProducts: number = 25; // Example value
  totalProductsSold: number = 150; // Example value

  constructor() { }

  ngOnInit(): void {
    // You can fetch data from a service if needed
  }
}
