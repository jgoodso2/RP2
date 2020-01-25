import { TestBed } from '@angular/core/testing';

import { ResourcePlanFilteredService } from './resource-plan-filtered.service';

describe('ResourcePlanFilteredService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ResourcePlanFilteredService = TestBed.get(ResourcePlanFilteredService);
    expect(service).toBeTruthy();
  });
});
