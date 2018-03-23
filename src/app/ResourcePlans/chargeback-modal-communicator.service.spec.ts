import { TestBed, inject } from '@angular/core/testing';

import { ChargebackModalCommunicatorService } from './chargeback-modal-communicator.service';

describe('ChargebackModalCommunicatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChargebackModalCommunicatorService]
    });
  });

  it('should be created', inject([ChargebackModalCommunicatorService], (service: ChargebackModalCommunicatorService) => {
    expect(service).toBeTruthy();
  }));
});
