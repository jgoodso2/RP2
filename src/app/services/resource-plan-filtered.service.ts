import { Injectable } from '@angular/core';
import { catchError, filter, map, mergeMap, scan, shareReplay, tap, toArray, switchMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, EMPTY, from, merge, Subject, throwError, of, Observable } from 'rxjs';
import { IResPlan, ResPlan, IProject, Project, WorkUnits, Timescale, IInterval, Interval, IResource, Resource, Config, Result, IResPlanUserWorkSpaceItem } from '../resourcePlans/res-plan.model'
@Injectable({
  providedIn: 'root'
})
export class ResourcePlanFilteredService {

  constructor() { }

  getResourcePlansFiltered(resPlans: Observable<IResPlan[]>, workSpaceResources:Observable<IResource[]>) : Observable<IResPlan[]>
    {
        return combineLatest(
          resPlans,
          workSpaceResources
      )
      .pipe(
        tap(data => console.log("hey...this is the filtered data: " + JSON.stringify(data)))
        ,map(([resplans, workspaceResources]) =>
        {
        resplans.forEach(resPlan=>
          {
            //pick the workspace item  that matches the resource manager uid
            
            //pick the resoure from within the workspace item to get to hidden projects for the  resource that belongs to current resource plan
            let resourceWorkSpaceItem :IResource = workspaceResources.find(w=>w.resUid == resPlan.resource.resUid);
            debugger;
            if(resourceWorkSpaceItem && resourceWorkSpaceItem.hiddenProjects)
            //weed out hidden projects
            resPlan.projects = resPlan.projects.filter(p=>resourceWorkSpaceItem.hiddenProjects.map(r=>r.projectUID.toUpperCase()).findIndex(h=>p.projUid.toUpperCase() == h.toUpperCase()) < 0);
            
          })
          debugger;
          console.log("filtered data =" + JSON.stringify(resPlans))
         return resplans;
        })
        
        
        ,
        catchError(err => {
          //this.errorMessageSubject.next(err);
          return EMPTY;
        })
      );
  
}
}
