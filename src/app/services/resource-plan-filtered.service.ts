import { Injectable } from '@angular/core';
import { catchError, filter, map, mergeMap, scan, shareReplay, tap, toArray, switchMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, EMPTY, from, merge, Subject, throwError, of, Observable } from 'rxjs';
import { IResPlan, ResPlan, IProject, Project, WorkUnits, Timescale, IInterval, Interval, IResource, Resource, Config, Result, IResPlanUserWorkSpaceItem } from '../resourcePlans/res-plan.model'
@Injectable({
  providedIn: 'root'
})
export class ResourcePlanFilteredService {

  constructor() { }

  getResourcePlansFiltered(resPlans: Observable<IResPlan[]>, workSpaceResources:Observable<IResource[]>)
    {
        return combineLatest(
          resPlans,
          workSpaceResources
      )
      .pipe(
        map(([resplans, wsResources]) =>
        {
        resplans.forEach(resPlan=>
          {
            //pick the workspace item  that matches the resource manager uid
            if(wsResources)
            {
            //pick the resoure from within the workspace item to get to hidden projects for the  resource that belongs to current resource plan
            let resourceWorkSpaceItem :IResource = wsResources.find(w=>w.resUid == resPlan.resource.resUid);
              if (resourceWorkSpaceItem)
            //weed out hidden projects
            resPlan.projects = resPlan.projects.filter(p=>resourceWorkSpaceItem.hiddenProjects.map(r=>r.projectUID).findIndex(h=>p.projUid == h) < 0);
            }
          })
          return resPlans;
        }))
}
}
