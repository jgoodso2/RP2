import { Injectable } from '@angular/core';

import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { IResPlan, IProject, IInterval, ResPlan, Interval, Project, Timescale, WorkUnits } from '../ResourcePlans/res-plan.model';
import { ResourcePlanService } from '../services/resource-plan.service'
import { ResourcePlanUserStateService } from '../services/resource-plan-user-state.service'
import { CurrentCalendarYear}  from '../common/utilities'
import { AppStateService } from './app-state.service'



@Injectable()
export class ResourcePlansResolverService implements Resolve<IResPlan[]> {
  boo: any[]

  constructor(private _resPlanSvc: ResourcePlanService
    , private _resPlanUserStateSvc: ResourcePlanUserStateService
    , private router: Router
    , private _appState: AppStateService
  
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IResPlan[]> {
   console.log("====HEY...resolver fired with route = " + JSON.stringify(route.params)) 


    //set up the default parameters needed by res-plan-list component
    //let currentYear = new CurrentCalendarYear()
    //if find on route, use it
    let fromDate = route.params["fromDate"] && new Date(route.params["fromDate"]) || this._appState.queryParams.fromDate 
    let toDate = route.params["toDate"] && new Date(route.params["toDate"]) || this._appState.queryParams.toDate;
    let timescale = route.params["timescale"] || this._appState.queryParams.timescale;
    let workunits = route.params["workunits"] || this._appState.queryParams.workunits;
    
    let showTimesheetData:boolean;
    if(route.params["showTimesheetData"])
    {
      showTimesheetData =  route.params["showTimesheetData"] == "true";
    }
    else{
      showTimesheetData = this._appState.queryParams.showTimesheetData
    }
 
    this._appState.queryParams.fromDate = fromDate
    this._appState.queryParams.toDate = toDate
    this._appState.queryParams.timescale = timescale
    this._appState.queryParams.workunits = workunits 
    this._appState.queryParams.showTimesheetData = showTimesheetData

    return this._resPlanUserStateSvc.getCurrentUserId().flatMap(resMgr=>{
    return this._resPlanUserStateSvc.getResPlans(resMgr,fromDate, toDate, timescale, workunits,showTimesheetData)
      .map(resPlans => {
        if (resPlans) {
          console.log('Resplans from resolver: ')
          return resPlans
        }
      })
    })

  }
}