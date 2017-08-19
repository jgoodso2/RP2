import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RxjsComponentComponent } from './rxjs-component.component';

describe('RxjsComponentComponent', () => {
  let component: RxjsComponentComponent;
  let fixture: ComponentFixture<RxjsComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RxjsComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RxjsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
