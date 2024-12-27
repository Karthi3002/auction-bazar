import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionerComponent } from './auctioner.component';

describe('AuctionerComponent', () => {
  let component: AuctionerComponent;
  let fixture: ComponentFixture<AuctionerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
