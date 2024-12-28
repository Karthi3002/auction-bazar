import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctioneerComponent } from './auctioner.component';

describe('AuctionerComponent', () => {
  let component: AuctioneerComponent;
  let fixture: ComponentFixture<AuctioneerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctioneerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctioneerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
