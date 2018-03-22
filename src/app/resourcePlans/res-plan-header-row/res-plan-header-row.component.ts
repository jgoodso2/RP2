import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { IResPlan, Timescale, WorkUnits, IInterval, Interval, IProjectPlan, PlanMode } from '../../ResourcePlans/res-plan.model';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment'
import { AppUtilService } from '../../common/app-util.service'
import { Subscription } from 'Rxjs'
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'res-plan-header-row',
  templateUrl: './res-plan-header-row.component.html',
  styleUrls: ['./res-plan-header-row.component.css']
})
export class ResPlanHeaderRowComponent implements OnInit {
  visible: boolean = true;
  _resPlans: IResPlan[];
  _projPlans: IProjectPlan[];
  _intervals: IInterval[];
  routeSub: Subscription;

  constructor(private router: Router, private _route: ActivatedRoute, private _appUtilSvc: AppUtilService, private _appStateSvc: AppStateService) { }
  @Output() onselectAllChanged = new EventEmitter<boolean>();
  ngOnInit() {
    this._route.data.subscribe(values => {
      if (this._appStateSvc.queryParams.planMode == PlanMode.ResourcePlan) {
        this._resPlans = values.resPlans;
        debugger;
        this.setIntervalsFromresPlans(this._resPlans)
      }
      else{
        this._projPlans = values.projPlans;
        debugger;
        this.setIntervalsFromProjPlans(this._projPlans)
      }
      //console.log('header component data=' + JSON.stringify(values.resPlans))
    }, (error) => console.log(error));
  }

  ngOnDestroy() {
    this._appUtilSvc.safeUnSubscribe(this.routeSub);
  }

  selectAllChange(value: boolean) {
    this.onselectAllChanged.emit(value);
  }

  public setIntervalsFromresPlans(resPlans: IResPlan[]) {
    let projectWithIntervals = []
    for (var i = 0; i < resPlans.length; i++) {
      if (resPlans[i].projects && resPlans[i].projects.length > 0 && resPlans[i].projects[0].intervals && resPlans[i].projects[0].intervals.length > 0) {
        projectWithIntervals = resPlans[i].projects[0].intervals;
        break;
      }
    }


    if (projectWithIntervals) {
      this._intervals = [];
      projectWithIntervals.forEach(interval => {
        var intervalStart = moment(interval.start).toDate()
        var intervalEnd = moment(interval.end).add(-1, 'days').toDate();
        this._intervals.push(new Interval('', '', intervalStart, intervalEnd))
      })

      //TODO how to break out of for loop when intervals already found
    }


  }

  public setIntervalsFromProjPlans(projPlans: IProjectPlan[]) {
    let projectWithIntervals = []
    for (var i = 0; i < projPlans.length; i++) {
      if (projPlans[i].resources && projPlans[i].resources.length > 0 && projPlans[i].resources[0].intervals && projPlans[i].resources[0].intervals.length > 0) {
        projectWithIntervals = projPlans[i].resources[0].intervals;
        break;
      }
    }


    if (projectWithIntervals) {
      this._intervals = [];
      projectWithIntervals.forEach(interval => {
        var intervalStart = moment(interval.start).toDate()
        var intervalEnd = moment(interval.end).add(-1, 'days').toDate();
        this._intervals.push(new Interval('', '', intervalStart, intervalEnd))
      })

      //TODO how to break out of for loop when intervals already found
    }


  }

}
