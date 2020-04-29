import { Routes  } from '@angular/router'
import { ResPlanListComponent } from './resourcePlans/res-plan-list.component'
import { ResPlanHomeComponent } from './resourcePlans/res-plan-home/res-plan-home.component'
import { JumbotronComponent  } from './jumbotron/jumbotron.component'
import { DateRangePicker } from './common/dateRangePicker/dateRangePicker.component'
import { ResPlanEditGuard   }  from './services/resPlanEditGuard.service'

import { ResourcePlansResolverService } from './services/resource-plans-resolver.service'

export const appRoutes: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: ResPlanHomeComponent,  
     children: [
        { path: 'resPlans', component: ResPlanListComponent ,  
          resolve: {resPlans: ResourcePlansResolverService } ,
          canDeactivate: [ResPlanEditGuard],
        
        },
          
        { path: 'customDates', component: DateRangePicker},
        { path: 'perview', redirectTo: "https://perview.app.parallon.com/pwa" ,pathMatch: 'full'},
        { path: '', redirectTo: 'resPlans', pathMatch: 'full' , canDeactivate: [ ResPlanEditGuard ]},
        { path: 'jumbo', component: JumbotronComponent },
      ]
}
]
    
