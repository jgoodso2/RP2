import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargebackListComponent } from './chargeback-list.component';

describe('ChargebackListComponent', () => {
  let component: ChargebackListComponent;
  let fixture: ComponentFixture<ChargebackListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChargebackListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChargebackListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
