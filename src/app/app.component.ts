import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // Ensure this is included if you are using a standalone component
  imports: [RouterOutlet], // Include RouterOutlet for routing
  template: `<router-outlet></router-outlet>`, // Use inline template for routing
  styleUrls: ['./app.component.css'], // Fix the typo from `styleUrl` to `styleUrls`
})
export class AppComponent {
  title = 'auction-bazar';
}
