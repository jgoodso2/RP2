import { BrowserModule } from '@angular/platform-browser';
import { NgModule,NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA,APP_INITIALIZER } from '@angular/core';

import { AppComponent } from './app.component';

import { RouterModule } from '@angular/router'
import { appRoutes } from './routes'
import { HttpModule } from '@angular/http';
import {HttpClientModule} from '@angular/common/http';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { Daterangepicker, DaterangepickerConfig } from 'ng2-daterangepicker'


import {Config} from './resourcePlans/res-plan.model'
import { ModalCommunicator } from  './resourcePlans/modal-communicator.service'
import { ResourcesModalCommunicatorService } from  './resourcePlans/resources-modal-communicator.service'

import {ResPlanDetailsComponent} from './resourcePlans/res-plan-detail.component';



import { InMemoryWebApiModule } from 'angular-in-memory-web-api';

import { CollapsibleWellComponent} from './common/collapsible-well.component'
import { HeaderRowComponent} from './common/header-row.component'
//import { JQ_TOKEN }    from './common/jquery.service'
import { ReactiveFormsModule } from '@angular/forms'
import { ResPlanListComponent} from './resourcePlans/res-plan-list.component'
import { SimpleModalComponent} from './common/simple-modal.component';
import { ProjectListComponent } from './resourcePlans/project-list/project-list.component';


import {ProjectService} from './services/project-service.service'
import { ResourcePlanService } from './services/resource-plan.service'
import {ResourcePlanUserStateService} from './services/resource-plan-user-state.service';
import {ResourceService} from './services/resource.service'
import {ConfigService} from './services/config-service.service'
import { ProjectListFilterPipe } from './common/project-list-filter.pipe'

import { ResourcePlansResolverService } from './services/resource-plans-resolver.service';
import { ResourceListComponent } from './resourcePlans/resource-list/resource-list.component'
import { SPListService } from './services/sp-list.service';
import { ResPlanHomeComponent } from './resourcePlans/res-plan-home/res-plan-home.component';
import { ResPlanHeaderRowComponent } from './resourcePlans/res-plan-header-row/res-plan-header-row.component';
import { ResPlanTimescaleComponent } from './res-plan-timescale/res-plan-timescale.component';
import { DateRangePickerComponent } from './resourcePlans/date-range-picker/date-range-picker.component';
import { ResPlanWorkunitsComponent } from './resourcePlans/res-plan-workunits/res-plan-workunits.component'
//let jQuery : Object;
// Add this function
export function initConfig(configSvc: ConfigService){
  return () => configSvc.ReadConfig() 
 }

@NgModule({
  declarations: [
    AppComponent,
    ResPlanDetailsComponent,
  
    CollapsibleWellComponent,
    HeaderRowComponent,
    ResPlanListComponent, 
    SimpleModalComponent,
    ProjectListComponent,
    ProjectListFilterPipe,
    ResourceListComponent,
    ResPlanHomeComponent,
    ResPlanHeaderRowComponent,
    ResPlanTimescaleComponent,
    DateRangePickerComponent,
    ResPlanWorkunitsComponent,
  ],

  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes) ,
          HttpModule, 
          ReactiveFormsModule ,
          Daterangepicker,
          HttpClientModule,
          Ng2SmartTableModule
         // InMemoryWebApiModule.forRoot(ResPlanData),
         
          
  ],
  
  providers: [    ModalCommunicator, ResourcesModalCommunicatorService,ProjectService, ResourcePlanService
    , ResourcePlanUserStateService
    , ResourcePlansResolverService
    ,ResourceService, SPListService
  ,ConfigService , 
  { provide: APP_INITIALIZER,
     useFactory: initConfig, // And use it here
     deps: [ConfigService], 
     multi: true }   ],
  bootstrap: [AppComponent]
  
})

export class AppModule { }
