import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { IResPlan, Timescale, WorkUnits, IInterval,Interval } from '../../ResourcePlans/res-plan.model';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment'
import { AppUtilService } from '../../common/app-util.service'
import { Subscription } from 'Rxjs'

@Component({
  selector: 'res-plan-header-row',
  templateUrl: './res-plan-header-row.component.html',
  styleUrls: ['./res-plan-header-row.component.css']
})
export class ResPlanHeaderRowComponent implements OnInit {
  visible: boolean = true;
  _resPlans: IResPlan[];
  _intervals: IInterval[];
  routeSub: Subscription;

  constructor(private router: Router, private _route: ActivatedRoute, private _appUtilSvc: AppUtilService) { }
  @Output() onselectAllChanged = new EventEmitter<boolean>();
  ngOnInit() {
    this._route.data.subscribe(values => {
      this._resPlans = values.resPlans;

      this.setIntervals(this._resPlans)
      //console.log('header component data=' + JSON.stringify(values.resPlans))
    }, (error) => console.log(error));
  }

  ngOnDestroy(){
    this._appUtilSvc.safeUnSubscribe(this.routeSub);
  }

  selectAllChange(value: boolean) {
    this.onselectAllChanged.emit(value);
  }

  public setIntervals(resPlans: IResPlan[]) {
    let projectWithIntervals = []
      for(var i=0;i<resPlans.length;i++)
      {
           if(resPlans[i].projects && resPlans[i].projects.length > 0 && resPlans[i].projects[0].intervals && resPlans[i].projects[0].intervals.length > 0)
           {
            projectWithIntervals = resPlans[i].projects[0].intervals;
            break;
           }
      }

 
      if (projectWithIntervals) {
        this._intervals = [];
        projectWithIntervals.forEach(interval => {
          var intervalStart = moment(interval.start).toDate()
          var intervalEnd = moment(interval.end).add(-1, 'days').toDate();
          this._intervals.push(new Interval('','',intervalStart,intervalEnd))
        })

        //TODO how to break out of for loop when intervals already found
      }

    
  }

}
