import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjPlanListComponent } from './proj-plan-list.component';

describe('ProjPlanListComponent', () => {
  let component: ProjPlanListComponent;
  let fixture: ComponentFixture<ProjPlanListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjPlanListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjPlanListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
