import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import {ProjPlanListComponent} from '../ResourcePlans/proj-plan-list/proj-plan-list.component'
@Injectable()
export class ProjPlanEditGuard implements CanDeactivate<ProjPlanListComponent> {

    canDeactivate(component: ProjPlanListComponent): boolean {
       debugger;
        if (component._appSvc.mainFormDirty == true) {
            return confirm(`You have unsaved changes.  Continue without saving? `);
        }
        return true;
    }
}

