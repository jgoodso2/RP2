import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { ResourcePlanUserStateService } from '../../../app/services/resource-plan-user-state.service'
import { ResPlan, Resource } from '../../../app/ResourcePlans/res-plan.model'
import { AppStateService } from '../../../app/services/app-state.service'

@Component({
  selector: 'fw-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  constructor(public menuService: MenuService, private _resPlanSvc: ResourcePlanUserStateService, private _appSvc: AppStateService) { }

  ngOnInit() {
    //refactor this code to move to a seperate component
    this._resPlanSvc.getAllTimesheetData(this._appSvc.queryParams.workunits)
      .subscribe();
  }
}
