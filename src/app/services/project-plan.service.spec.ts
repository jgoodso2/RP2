import { TestBed, inject } from '@angular/core/testing';

import { ProjectPlanService } from './project-plan.service';

describe('ProjectPlanService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectPlanService]
    });
  });

  it('should be created', inject([ProjectPlanService], (service: ProjectPlanService) => {
    expect(service).toBeTruthy();
  }));
});
