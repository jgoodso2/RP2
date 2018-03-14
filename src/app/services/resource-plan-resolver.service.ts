import { Injectable } from '@angular/core';

import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { IResPlan, IProject, IInterval, ResPlan, Interval, Project } from '../ResourcePlans/res-plan.model';
import { ResourcePlanService } from '../services/resource-plan.service'
import { ResourcePlanUserStateService } from '../services/resource-plan-user-state.service'



@Injectable()
export class ResourcePlanResolverService implements Resolve<IResPlan> {

    constructor(private _resPlanSvc: ResourcePlanService
        , private _resPlanUserStateSvc: ResourcePlanUserStateService
        , private router: Router) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {

        let projects = ['proj 1', 'proj 2', 'proj 3']
        return Observable.of(projects)
    }
}





