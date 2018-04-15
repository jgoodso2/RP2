import { Routes  } from '@angular/router'
import { ResPlanListComponent } from './ResourcePlans/res-plan-list.component'
import { ResPlanHomeComponent } from './ResourcePlans/res-plan-home/res-plan-home.component'
import { JumbotronComponent  } from './jumbotron/jumbotron.component'
import { DateRangePicker } from './common/dateRangePicker/dateRangePicker.component'
import { ResPlanEditGuard   }  from './services/resPlanEditGuard.service' 
import { ProjPlanEditGuard   }  from './services/proj-plan-edit-guard.service' 
import { ProjPlanListComponent }  from './ResourcePlans/proj-plan-list/proj-plan-list.component'

import { ResourcePlansResolverService } from './services/resource-plans-resolver.service'
import { ProjectPlanResolverService } from './services/project-plan-resolver.service'

export const appRoutes: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: ResPlanHomeComponent,  
     children: [
        { path: 'resPlans', component: ResPlanListComponent ,  
          resolve: {resPlans: ResourcePlansResolverService } ,
          canDeactivate: [ResPlanEditGuard],
        
        },
          
        { path: 'customDates', component: DateRangePicker},
        { path: 'perview', redirectTo: "https://perviewqa.app.parallon.com/pwa" ,pathMatch: 'full'},
        { path: '', redirectTo: 'resPlans', pathMatch: 'full' , canDeactivate: [ ResPlanEditGuard ]},
        { path: 'jumbo', component: JumbotronComponent },
        { path: 'pivot', component: ProjPlanListComponent,
          resolve: {projPlans: ProjectPlanResolverService},canDeactivate: [ProjPlanEditGuard] }
      ]
}
]
    
