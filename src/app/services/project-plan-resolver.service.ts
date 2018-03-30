import { Injectable } from '@angular/core';

import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { IProjectPlan, IProject, IInterval, ResPlan, Interval, Project, Timescale, WorkUnits, PlanMode } from '../ResourcePlans/res-plan.model';
import { ResourcePlanService } from '../services/resource-plan.service'
import { ResourcePlanUserStateService } from '../services/resource-plan-user-state.service'
import { CurrentCalendarYear}  from '../common/utilities'
import { AppStateService } from './app-state.service'
import {ProjectPlanService} from '../services/project-plan.service'

@Injectable()
export class ProjectPlanResolverService implements Resolve<IProjectPlan[]> {
  boo: any[]

  constructor(private _resPlanSvc: ResourcePlanService
    , private _resPlanUserStateSvc: ResourcePlanUserStateService
    , private router: Router
    , private _appState: AppStateService
    , private _projPlanSvc:ProjectPlanService
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IProjectPlan[]> {
   console.log("====HEY...resolver fired with route = " + JSON.stringify(route.params)) 


    //set up the default parameters needed by res-plan-list component
    //let currentYear = new CurrentCalendarYear()
    //if find on route, use it
    let fromDate = route.params["fromDate"] && new Date(route.params["fromDate"]) || this._appState.queryParams.fromDate 
    let toDate = route.params["toDate"] && new Date(route.params["toDate"]) || this._appState.queryParams.toDate;
    let timescale = route.params["timescale"] || this._appState.queryParams.timescale;
    let workunits = route.params["workunits"] || this._appState.queryParams.workunits;
    let planMode = PlanMode.ProjectPlan
    
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
    this._appState.queryParams.planMode = planMode
    return this._projPlanSvc.getCurrentUserId().flatMap(resMgr=>{
      return this._projPlanSvc.getProjectPlans(resMgr,fromDate, toDate, timescale, workunits,showTimesheetData)
        .map(projPlans => {
          if (projPlans) {
            console.log('Projplans from resolver: ')
            return projPlans
          }
        })
      })
  }

  projPlanData: IProjectPlan[] = [
    {
      project: {
        projUid: '1',
        projName: 'Test Project 1',
        projectChargeBackCategory : 'Category 1'
      },
      resources: [
        {
          resUid: '0',
          resName: 'John Goodson',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '1',
          resName: 'Nishant',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '20h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '20h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '2',
          resName: 'Christina Wheeler',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
      ]
    },
    {
      project: {
        projUid: '2',
        projName: 'Test Project 2',
        projectChargeBackCategory : 'Category 2'
      },
      resources: [
        {
          resUid: '1',
          resName: 'Nishant Jahagirdar',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '1',
          resName: 'Nishant',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '20h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '20h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '2',
          resName: 'Christina Wheeler',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
      ]
    }
  ];
}
