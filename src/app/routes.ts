import { Routes } from '@angular/router'
import { ResPlanListComponent } from './resourcePlans/res-plan-list.component'
import {ResPlanHomeComponent} from './resourcePlans/res-plan-home/res-plan-home.component'
import { JumbotronComponent  } from './jumbotron/jumbotron.component'



import { ResourcePlansResolverService } from './services/resource-plans-resolver.service'

export const appRoutes: Routes = [

 
  {
    path: 'resPlans',
    component: ResPlanHomeComponent,
    children: [
      { path: '', component: ResPlanListComponent },
      { path: 'jumbotron', component: JumbotronComponent}
      // { path: 'resPlans', component: ResPlanListComponent },
    ],
    resolve: {resPlans: ResourcePlansResolverService }
  },
  {path:'',redirectTo:'resPlans',pathMatch:'full'}

  
  // { path: '', component: ResPlanHomeComponent },
  // { path: '**', component: ResPlanHomeComponent }


]