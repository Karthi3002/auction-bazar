import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc, collection, getDocs  } from '@angular/fire/firestore';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  [x: string]: any;
  currentSection = 'dashboard';
  adminData: any = {};
  totalUsers = 0;
  totalAuctioneers = 0;
  totalBidders = 0;
  totalProducts = 0;
  activeProducts = 0;
  soldProducts = 0;
  upcomingProducts = 0;
pendingAuctions: any;
resolvedDisputes: any;
auctionProducts: any[] = [];
filteredAuctionProducts: any[] = [];
searchQuery: string = '';
statusFilter: string = '';
categoryFilter: string = '';
expandedAuctioneerUID: string | null = null;
allAuctioneers: any[] = [];
allBidders: any[] = [];
filteredBidders: any[] = [];
expandedBidderUID: string | null = null;

filteredAuctioneers: any[] = []; // this will hold filtered result
allProducts: any[] = [];
allBids: any[] = [];

filteredProducts: any[] = [];
filteredBids: any[] = [];

selectedTab: string = 'all'; // 'all' or 'bids'

productStatus = ['Upcoming', 'Active', 'Sold'];
bidStatus = ['Pending', 'Won', 'Outbid'];
categories = ['electronics', 'fashion', 'books', 'furniture', 'vehicles', 'others'];


startDate = '';
endDate = '';

  isLoading: boolean = false;

  constructor(private firestore: Firestore, private authService: AuthService) {}

async ngOnInit() {
  const isMobileOrTablet = window.innerWidth < 1024; // typically < 1024px is tablet/mobile

  if (isMobileOrTablet) {
    alert('❌ Admin page cannot be accessed on mobile or tablet devices. Please use a desktop browser.');
    window.location.href = '/'; // redirect to home or login (adjust path as needed)
    return;
  }

  await this.loadAdminData();
  await this.loadUserStats();
  await this.loadProductStats();
  await this.loadAuctioneerDetails();
  await this.loadBidderDetails();
  await this.loadAuctionProducts();
  await this.loadAllProducts();
  await this.loadAllBids();
  this.applyFilters();
}


  navigate(section: string) {
    this.currentSection = section;
  }

  logout() {
    this.authService.logout();
  }

  async loadAdminData() {
        this.isLoading = true;
    const uid = this.authService.getUserId();
    const adminRef = doc(this.firestore, `admins/${uid}`);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      this.adminData = adminSnap.data();
      if (this.adminData.profileImage) {
        this.adminData.profileImage = atob(this.adminData.profileImage); // decode if stored encrypted
      }
    }this.isLoading = false;
  }

  async loadUserStats() {
        this.isLoading = true;
    const auctioneersSnap = await getDocs(collection(this.firestore, 'auctioneers'));
    const biddersSnap = await getDocs(collection(this.firestore, 'bidders'));

    this.totalAuctioneers = auctioneersSnap.size;
    this.totalBidders = biddersSnap.size;
    this.totalUsers = this.totalAuctioneers + this.totalBidders; // ✅ Sum of both
    this.isLoading = false;
  }


  async loadProductStats() {
        this.isLoading = true;
    let total = 0, active = 0, sold = 0, upcoming = 0;
    const auctioneersSnap = await getDocs(collection(this.firestore, 'auctioneers'));
    for (const docSnap of auctioneersSnap.docs) {
      const uid = docSnap.id;
      const productSnap = await getDocs(collection(this.firestore, `auctioneers/${uid}/products`));
      productSnap.forEach(doc => {
        total++;
        const data = doc.data();
        const status = data['status'];
        if (status === 'Active') active++;
        else if (status === 'Sold') sold++;
        else if (status === 'Upcoming') upcoming++;
      });
    }
    this.totalProducts = total;
    this.activeProducts = active;
    this.soldProducts = sold;
    this.upcomingProducts = upcoming;
    this.isLoading = false;
  }
  
async loadAuctioneerDetails() {
      this.isLoading = true;
  const auctioneersRef = collection(this.firestore, 'auctioneers');
  const auctioneerDocs = await getDocs(auctioneersRef);

  const auctioneerList: any[] = [];

  for (const docSnap of auctioneerDocs.docs) {
    const auctioneerId = docSnap.id;
    const data = docSnap.data();

    const productRef = collection(this.firestore, `auctioneers/${auctioneerId}/products`);
    const productDocs = await getDocs(productRef);

    const products: any[] = [];
    productDocs.forEach(doc => {
      const product = doc.data();
      if (product['productImage']) {
        product['productImage'] = atob(product['productImage']);
      }
      products.push(product);
    });

    auctioneerList.push({
      uid: auctioneerId,
      name: data['username'] || 'N/A',
      email: data['email'] || '',
      password: data['password'] || '',
      phoneNumber: data['phoneNumber'] || '',
      address: data['address'] || '',
      role: data['role'] || 'auctioneer',
      createdAt: data['createdAt'] || '',
      profileImage: data['profileImage'] ? atob(data['profileImage']) : '',
      products
    });
  }

  this.allAuctioneers = auctioneerList;
  this.filteredAuctioneers = [...auctioneerList]; // display all by default
  this.isLoading = false;
}


async loadAuctionProducts() {
      this.isLoading = true;
  const auctioneersRef = collection(this.firestore, 'auctioneers');
  const auctioneerDocs = await getDocs(auctioneersRef);

  const products: any[] = [];

  for (const docSnap of auctioneerDocs.docs) {
    const auctioneerId = docSnap.id;
    const auctioneerData = docSnap.data();
    const productsRef = collection(this.firestore, `auctioneers/${auctioneerId}/products`);
    const productDocs = await getDocs(productsRef);

    productDocs.forEach((productDoc) => {
      const data = productDoc.data();
      products.push({
        ...data,
        auctioneerName: auctioneerData['username'] || 'N/A',
      });
    });
  }

  this.auctionProducts = products;
  this.filteredAuctionProducts = [...products];
  this.isLoading = false;
}



applyAuctioneerFilters() {
      this.isLoading = true;
  const query = this.searchQuery.toLowerCase();

  this.filteredAuctioneers = this.allAuctioneers
    .map(auctioneer => {
      const matchesSearch =
        !this.searchQuery ||
        auctioneer.name.toLowerCase().includes(query) ||
        auctioneer.email.toLowerCase().includes(query) ||
        auctioneer.uid.toLowerCase().includes(query);

      const filteredProducts = auctioneer.products.filter((product: { productCategory: string; }) => {
        const matchesStatus =
          !this.statusFilter || this.getProductStatus(product) === this.statusFilter;
        const matchesCategory =
          !this.categoryFilter || product.productCategory === this.categoryFilter;
        return matchesStatus && matchesCategory;
      });

      return matchesSearch && filteredProducts.length > 0
        ? {
            ...auctioneer,
            products: filteredProducts,
          }
        : null;
    })
    .filter(Boolean); // remove nulls
    this.isLoading = false;
}

toggleProductDetails(uid: string) {
      this.isLoading = true;
  this.expandedAuctioneerUID = this.expandedAuctioneerUID === uid ? null : uid;
  this.isLoading = false;
}

async loadBidderDetails() {
      this.isLoading = true;
  const bidderSnap = await getDocs(collection(this.firestore, 'bidders'));
  const result: any[] = [];

  for (const bidderDoc of bidderSnap.docs) {
    const bidderId = bidderDoc.id;
    const bidderData = bidderDoc.data();

    const bidSnap = await getDocs(collection(this.firestore, `bidders/${bidderId}/bids`));
    const bids: any[] = [];

    for (const bidDoc of bidSnap.docs) {
      const bidData = bidDoc.data();

      // 🔍 Get Auctioneer Info
      const auctioneerUID = bidData['auctioneerUID'];
      let auctioneerName = 'N/A';
      let auctioneerEmail = '';
      let auctioneerPhone = '';
      let minimumPrice = 0;
      let productImage = '';
      let productCategory = '';
      try {
        const productRef = doc(this.firestore, `auctioneers/${auctioneerUID}/products/${bidData['productId']}`);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          productCategory = productData['productCategory'] || 'others';
        }
      } catch (e) {
        console.warn('Product not found or category missing:', bidData['productId']);
      }

      if (auctioneerUID) {
        const auctioneerRef = doc(this.firestore, `auctioneers/${auctioneerUID}`);
        const auctioneerSnap = await getDoc(auctioneerRef);
        if (auctioneerSnap.exists()) {
          const auctioneer = auctioneerSnap.data();
          auctioneerName = auctioneer['username'] || 'N/A';
          auctioneerEmail = auctioneer['email'] || '';
          auctioneerPhone = auctioneer['phoneNumber'] || '';
        }

        // 🔍 Get Product Info if needed
        if (bidData['productId']) {
          const productRef = doc(this.firestore, `auctioneers/${auctioneerUID}/products/${bidData['productId']}`);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            minimumPrice = productData['minimumPrice'] || 0;
            if (productData['productImage']) {
              productImage = atob(productData['productImage']);
            }
          }
        }
      }

      bids.push({
        bidId: bidDoc.id, // ✅ Bid ID from document
        productName: bidData['productName'] || '',
        productId: bidData['productId'] || '',
        biddedPrice: bidData['bidAmount'] || 0,
        status: bidData['status'] || 'Pending',
        statusMessage: bidData['statusMessage'] || '',
        auctioneerId: auctioneerUID,
        auctioneerName,
        auctioneerEmail,
        auctioneerPhone,
        minimumPrice,
        productImage,
        productCategory,
        profit: (bidData['bidAmount'] || 0) - minimumPrice,
      });
    }

    result.push({
      uid: bidderId,
      name: bidderData['username'] || '',
      email: bidderData['email'] || '',
      password: bidderData['password'] || '',
      phoneNumber: bidderData['phoneNumber'] || '',
      address: bidderData['address'] || '',
      createdAt: bidderData['createdAt'] || '',
      profileImage: bidderData['profileImage'] ? atob(bidderData['profileImage']) : '',
      bids
    });
  }

  this.allBidders = result;
  this.filteredBidders = [...result];
  this.isLoading = false;
}


applyBidderFilters() {
      this.isLoading = true;
  const query = this.searchQuery.toLowerCase();

  this.filteredBidders = this.allBidders
    .map(bidder => {
      // Filter bids inside this bidder
      const filteredBids = bidder.bids.filter((b: any) => {
        const matchesSearch = !query ||
          b.productName?.toLowerCase().includes(query) ||
          b.bidId?.toLowerCase().includes(query) ||
          b.auctioneerName?.toLowerCase().includes(query) ||
          bidder.name?.toLowerCase().includes(query) ||
          bidder.email?.toLowerCase().includes(query) ||
          bidder.uid?.toLowerCase().includes(query);

        const matchesStatus = !this.statusFilter || b.status === this.statusFilter;
        const matchesCategory = !this.categoryFilter || b.productCategory === this.categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      });

      return {
        ...bidder,
        bids: filteredBids
      };
    })
    .filter(bidder => bidder.bids.length > 0); // Only include bidders with matching bids
    this.isLoading = false;
}


toggleBidDetails(uid: string) {
      this.isLoading = true;
  this.expandedBidderUID = this.expandedBidderUID === uid ? null : uid;
  this.isLoading = false;
}

async loadAllProducts() {
      this.isLoading = true;
  const auctioneerSnap = await getDocs(collection(this.firestore, 'auctioneers'));
  const allProducts: any[] = [];

  for (const docSnap of auctioneerSnap.docs) {
    const auctioneerId = docSnap.id;
    const auctioneerData = docSnap.data();

    const productsSnap = await getDocs(collection(this.firestore, `auctioneers/${auctioneerId}/products`));
    for (const productDoc of productsSnap.docs) {
      const data = productDoc.data();
      allProducts.push({
        id: productDoc.id,
        image: data['productImage'] ? atob(data['productImage']) : '',
        name: data['productName'],
        description: data['description'],
        category: data['productCategory'],
        condition: data['condition'],
        auctioneerId,
        auctioneerName: auctioneerData['username'],
        startDate: data['sessionDate'],
        startTime: data['sessionTime'],
        endDate: data['endDate'],
        endTime: data['endTime'],
        minPrice: data['minimumPrice'],
        bidPrice: data['currentHighestBid'] || null,
        status: this.getProductStatus(data)
      });
    }
  }

  this.allProducts = allProducts;
  this.filteredProducts = [...allProducts];
  this.isLoading = false;
}


async loadAllBids() {
      this.isLoading = true;
  const bidderSnap = await getDocs(collection(this.firestore, 'bidders'));
  const allBids: any[] = [];

  for (const bidderDoc of bidderSnap.docs) {
    const bidderId = bidderDoc.id;
    const bidderData = bidderDoc.data();

    const bidsSnap = await getDocs(collection(this.firestore, `bidders/${bidderId}/bids`));

    for (const bidDoc of bidsSnap.docs) {
      const bid = bidDoc.data();

      const auctioneerId = bid['auctioneerUID'];
      const productId = bid['productId'];

      // ⛔ Skip if essential IDs are missing
      if (!auctioneerId || !productId) continue;

      // 🔍 Default values
      let productName = 'N/A';
      let productCategory = 'N/A';
      let productCondition = 'N/A';
      let productImage = '';
      let minPrice = 0;

      let auctioneerName = 'N/A';
      let auctioneerEmail = 'N/A';
      let auctioneerPhone = 'N/A';

      try {
        // 🔄 Get Product Details
        const productRef = doc(this.firestore, `auctioneers/${auctioneerId}/products/${productId}`);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const p = productSnap.data();
          productName = p['productName'] || 'N/A';
          productCategory = p['productCategory'] || 'N/A';
          productCondition = p['condition'] || 'N/A';
          minPrice = p['minimumPrice'] || 0;
          if (p['productImage']) {
            productImage = atob(p['productImage']);
          }
        }

        // 👤 Get Auctioneer Info
        const auctioneerRef = doc(this.firestore, `auctioneers/${auctioneerId}`);
        const auctioneerSnap = await getDoc(auctioneerRef);
        if (auctioneerSnap.exists()) {
          const a = auctioneerSnap.data();
          auctioneerName = a['username'] || 'N/A';
          auctioneerEmail = a['email'] || 'N/A';
          auctioneerPhone = a['phoneNumber'] || 'N/A';
        }

        // ✅ Push combined result
        allBids.push({
          id: bidDoc.id,
          image: productImage,
          name: productName,
          category: productCategory,
          condition: productCondition,

          bidderId,
          bidderName: bidderData['username'] || 'N/A',
          bidderEmail: bidderData['email'] || 'N/A',
          bidderPhone: bidderData['phoneNumber'] || 'N/A',

          productId,

          auctioneerId,
          auctioneerName,
          auctioneerEmail,
          auctioneerPhone,

          minPrice,
          bidAmount: bid['bidAmount'] || 0,
          status: bid['status'] || 'Pending',
          profit: (bid['bidAmount'] || 0) - minPrice
        });
      } catch (error) {
        console.error(`❌ Error loading bid ${bidDoc.id}:`, error);
      }
    }
  }

  this.allBids = allBids;
  this.filteredBids = [...allBids]; // Load initially
  this.isLoading = false;
}


applyFilters() {
      this.isLoading = true;
  const query = this.searchQuery.toLowerCase();

  if (this.selectedTab === 'all') {
    this.filteredProducts = this.allProducts.filter(p => {
      const matchesSearch = !query || [
        p.id,
        p.name,
        p.condition,
        p.auctioneerId,
        p.auctioneerName,
        p.description
      ].some(field => field && field.toString().toLowerCase().includes(query));

      const matchesStatus = !this.statusFilter || p.status === this.statusFilter;
      const matchesCategory = !this.categoryFilter || p.category === this.categoryFilter;

      const matchesStartDate = !this.startDate || new Date(p.startDate) >= new Date(this.startDate);
      const matchesEndDate = !this.endDate || new Date(p.endDate) <= new Date(this.endDate);

      return matchesSearch && matchesStatus && matchesCategory && matchesStartDate && matchesEndDate;
    });
  } else {
    this.filteredBids = this.allBids.filter(b => {
      const matchesSearch = !query || [
        b.id,
        b.name,
        b.bidderId,
        b.bidderName,
        b.bidderEmail,
        b.bidderPhone,
        b.productId,
        b.auctioneerId,
        b.auctioneerName,
        b.auctioneerEmail,
        b.auctioneerPhone
      ].some(field => field && field.toString().toLowerCase().includes(query));

      const matchesStatus = !this.statusFilter || b.status === this.statusFilter;
      const matchesCategory = !this.categoryFilter || b.category === this.categoryFilter;

      const matchesStartDate = !this.startDate || new Date(b.startDate || '') >= new Date(this.startDate);
      const matchesEndDate = !this.endDate || new Date(b.endDate || '') <= new Date(this.endDate);

      return matchesSearch && matchesStatus && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }this.isLoading = false;
}


getProductStatus(product: any): string {
      this.isLoading = true;
  const now = new Date();
  const start = new Date(`${product.sessionDate}T${product.sessionTime}`);
  const end = new Date(`${product.endDate}T${product.endTime}`);

  if (now < start) return 'Upcoming';
  if (now > end) return 'Sold';
  return 'Active';
  this.isLoading = false;
}

formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hrs = hours % 12 || 12;
  return `${hrs}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
}

