import { Component, OnInit,Input,Output,EventEmitter, } from '@angular/core';
import {IResPlan,Timescale,WorkUnits,IInterval} from '../../resourcePlans/res-plan.model';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment'
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'res-plan-header-row',
  templateUrl: './res-plan-header-row.component.html',
  styleUrls: ['./res-plan-header-row.component.css']
})
export class ResPlanHeaderRowComponent implements OnInit {
visible: boolean = true;
 _resPlans: IResPlan[];
 _intervals: IInterval[];
 
  
 constructor(private router: Router,private _route: ActivatedRoute) { }
  @Output() onselectAllChanged = new EventEmitter<boolean>();
  ngOnInit() {
  this._route.data.subscribe(values =>{
    this._resPlans = values.resPlans; 
    
    this.setIntervals(this._resPlans)
    //console.log('header component data=' + JSON.stringify(values.resPlans))
  },(error)=>console.log(error));
  }

  selectAllChange(value:boolean)
  {
   this.onselectAllChanged.emit(value);
  }

  public setIntervals(resPlans:IResPlan[]) 
  {
    
   resPlans.forEach(resPlan=>{
     let projectWithIntervals = resPlan.projects.find(t=>t.intervals.length > 0);
     if(projectWithIntervals)
     {
       this._intervals = projectWithIntervals.intervals;
       this._intervals.forEach(interval=>{
        interval.start = moment(interval.start).toDate()
        interval.end = moment(interval.end).add(-1,'days').toDate();
       })
       
       //TODO how to break out of for loop when intervals already found
     }

   })
  }

   horizontalScroll (event) {
  //  let dateRow =  document.getElementById('hscroll');
  //  console.log(event.target, "the event target is ___", event.target.value);
  //  let width = dateRow.style.width;
  //  let scrollAdjust = dateRow.scrollLeft;
  //  width = width + scrollAdjust;
  //  console.log(width, "with scroll adjust");
  //  dateRow.width
  }

}
