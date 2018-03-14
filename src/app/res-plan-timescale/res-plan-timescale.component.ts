import { Component, OnInit,EventEmitter,Output } from '@angular/core';
import {IResPlan,Timescale,WorkUnits} from '../ResourcePlans/res-plan.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {ActivatedRoute} from '@angular/router'
declare var $:any;
@Component({
  selector: 'res-plan-timescale',
  templateUrl: './res-plan-timescale.component.html',
  styleUrls: ['./res-plan-timescale.component.css']
})
export class ResPlanTimescaleComponent implements OnInit {
 @Output() onTimescaleChanged = new EventEmitter<Timescale>();
  constructor(private _route: ActivatedRoute) { }
timescale:Timescale;
  ngOnInit() {
    $('#timescale').val(this._route.snapshot.params["timescale"] || '5');
  }

  timescaleChange(value:number)
  {
   this.onTimescaleChanged.emit(value);
  }

}
