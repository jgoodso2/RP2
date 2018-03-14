import { Component, OnInit,EventEmitter,Output } from '@angular/core';
import {IResPlan,Timescale,WorkUnits} from '../../ResourcePlans/res-plan.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {ActivatedRoute} from '@angular/router'
declare var $:any;
@Component({
  selector: 'res-plan-workunits',
  templateUrl: './res-plan-workunits.component.html',
  styleUrls: ['./res-plan-workunits.component.css']
})
export class ResPlanWorkunitsComponent implements OnInit {
  @Output() onWorkUnitsChanged = new EventEmitter<Timescale>();
  constructor(private _route: ActivatedRoute) { }
workunits:WorkUnits;
  ngOnInit() {
    $('#workunits').val(this._route.snapshot.params["workunits"] || '3');
  }

  workunitsChange(value:number)
  {
   this.onWorkUnitsChanged.emit(value);
  }

}
