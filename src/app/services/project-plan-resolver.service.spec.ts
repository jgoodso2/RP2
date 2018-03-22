import { TestBed, inject } from '@angular/core/testing';

import { ProjectPlanResolverService } from './project-plan-resolver.service';

describe('ProjectPlanResolverService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectPlanResolverService]
    });
  });

  it('should be created', inject([ProjectPlanResolverService], (service: ProjectPlanResolverService) => {
    expect(service).toBeTruthy();
  }));
});
