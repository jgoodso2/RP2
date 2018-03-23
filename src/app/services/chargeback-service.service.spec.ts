import { TestBed, inject } from '@angular/core/testing';

import { ChargebackServiceService } from './chargeback-service.service';

describe('ChargebackServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChargebackServiceService]
    });
  });

  it('should be created', inject([ChargebackServiceService], (service: ChargebackServiceService) => {
    expect(service).toBeTruthy();
  }));
});
