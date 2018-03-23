import { Component, OnInit,ViewChild , OnDestroy } from '@angular/core';
import { AppStateService} from '../../app/services/app-state.service'
import { MatMenu} from '@angular/material'
import { PlanMode } from 'app/ResourcePlans/res-plan.model';

@Component({
  selector: 'actions-menu',
  templateUrl: './actions-menu.component.html',
  styleUrls: ['./actions-menu.component.css']
})
export class ActionsMenuComponent implements OnInit {
  
  constructor(public _appStateSvc:AppStateService) { }
  disableSave: boolean;
  disableDelete:boolean = true;
  disableHide:boolean =true;

  ngOnInit() {
    this._appStateSvc.formDirtyState$.subscribe(value=>this.disableSave = !value)
     this._appStateSvc.deleteState$.subscribe(value=>{this.disableDelete = !value})
     this._appStateSvc.hideState$.subscribe(value=>{this.disableHide= !value})
  }

  ngOnDestroy() {
//
  }

  submit()
  {
  
    this._appStateSvc.saveClick();
  }

  addResources()
  {
    debugger;
    this._appStateSvc.addResourcesClick();
  }

  addChargebacks()
  {
    debugger;
    this._appStateSvc.addChargebacksClick();
  }

  delete()
  {
 
    this._appStateSvc.deleteClick();
  }

  hide()
  {
    
    this._appStateSvc.hideClick();
  }

  exitToPerview()
  {
    this._appStateSvc.exitToPerviewClick()
  }

  exitToBI()
  {
    this._appStateSvc.exitToBIClick()
  }


  printToPdf() {
    this._appStateSvc.printToPdfClick();
  }

  toExcel() {
    this._appStateSvc.exportToExcelClick();
  }


  toggleText(event:Event)
  {
   
  //  if(event.srcElement.textContent == 'Show Actuals')
  //  {
  //   event.srcElement.textContent= 'Hide Actuals';
  //  }
  //  else{
  //   event.srcElement.textContent = 'Show Actuals';
  //  }
   this._appStateSvc.queryParams.showTimesheetData = !this._appStateSvc.queryParams.showTimesheetData;
   this._appStateSvc.showOrHideActuals(this._appStateSvc.queryParams.showTimesheetData);
  }

  getShowActualsText() : string
  {
    if(this._appStateSvc.queryParams.showTimesheetData == true)
    {
      return "Hide Actuals"
    }
    else
    {
      return "Show Actuals"
    }
  
  }

  getaddResourceOrChargebackText() : string
  {
    if(this._appStateSvc.queryParams.planMode == PlanMode.ResourcePlan)
    {
      return "Add Resources"
    }
    else
    {
      return "Add Chargeback"
    }
  
  }
}
