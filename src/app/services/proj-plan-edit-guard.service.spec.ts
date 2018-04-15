import { TestBed, inject } from '@angular/core/testing';

import { ProjPlanEditGuardService } from './proj-plan-edit-guard.service';

describe('ProjPlanEditGuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjPlanEditGuardService]
    });
  });

  it('should be created', inject([ProjPlanEditGuardService], (service: ProjPlanEditGuardService) => {
    expect(service).toBeTruthy();
  }));
});
