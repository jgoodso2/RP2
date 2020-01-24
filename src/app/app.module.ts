import { BrowserModule } from '@angular/platform-browser';
import { NgModule,NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA,APP_INITIALIZER } from '@angular/core';

import { AppComponent } from './app.component';

import { RouterModule , CanDeactivate  } from '@angular/router'
import { appRoutes } from './routes'

import {HttpClientModule} from '@angular/common/http';
import { HttpModule } from '@angular/http';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { Ng2CompleterModule} from 'ng2-completer'

import { DateRangePicker } from './common/dateRangePicker/dateRangePicker.component'

import {Config} from './resourcePlans/res-plan.model'
import { ModalCommunicator } from  './resourcePlans/modal-communicator.service'
import { ResourcesModalCommunicatorService } from  './resourcePlans/resources-modal-communicator.service'
import { AppStateService } from  './services/app-state.service'
import {ResPlanDetailsComponent} from './resourcePlans/res-plan-detail.component';
import { CollapsibleWellComponent} from './common/collapsible-well.component'
import { HeaderRowComponent} from './common/header-row.component'
import { ReactiveFormsModule } from '@angular/forms'
import { ResPlanListComponent} from './resourcePlans/res-plan-list.component'
import { SimpleModalComponent} from './common/simple-modal.component';
import { ProjectListComponent } from './resourcePlans/project-list/project-list.component';

import { MatDatepickerModule,MatInputModule,MatNativeDateModule,MatTableModule,MatButtonModule,MatDialogModule, MatMenuModule ,MatIconModule} from '@angular/material';
import { ProjectService} from './services/project-service.service'
import { ResourcePlanService } from './services/resource-plan.service'
import { ResourcePlanUserStateService } from './services/resource-plan-user-state.service';
import { ResourceService } from './services/resource.service'
import { ConfigService } from './services/config-service.service'
import { HttpCache } from './services/httpCache'
import { CachingInterceptorService } from './services/caching-interceptor.service'
import { AppUtilService } from './common/app-util.service';
import { ResPlanEditGuard } from './services/resPlanEditGuard.service'
import { HTTP_INTERCEPTORS } from '@angular/common/http'

import { ProjectListFilterPipe } from './common/project-list-filter.pipe'

import { ResourcePlansResolverService } from './services/resource-plans-resolver.service';
import { ResourceListComponent } from './resourcePlans/resource-list/resource-list.component'
import { SPListService } from './services/sp-list.service';
import { ResPlanHomeComponent } from './resourcePlans/res-plan-home/res-plan-home.component';
import { ResPlanHeaderRowComponent } from './resourcePlans/res-plan-header-row/res-plan-header-row.component';
import { ResPlanTimescaleComponent } from './res-plan-timescale/res-plan-timescale.component';
import { ResPlanWorkunitsComponent } from './resourcePlans/res-plan-workunits/res-plan-workunits.component';
import { IntervalPipe } from './common/interval.pipe'
import { MessageComponent} from './resourcePlans/messageComponent/message.component'
import { ErrorComponent} from './resourcePlans/errorComponent/error.component'
import { FwModule} from '../fw/fw.module'
import { JumbotronComponent} from './jumbotron/jumbotron.component';
import { ResPlanListTesterComponent } from './resourcePlans/res-plan-list-tester/res-plan-list-tester.component';
import { IntervalMaskDirective } from './directives/interval-mask.directive';
import { ProjectDateSpanDirective } from './directives/project-date-span.directive';
import { ConfirmDialogComponent } from './common/confirm-dialog/confirm-dialog.component';
import { CellWorkUnitsPipe } from './common/cell-work-units.pipe';
import { ExportExcelService } from 'app/services/export-excel.service';
import { TestComponent } from './test/test.component';



//let jQuery : Object;// Add this function
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
    ResPlanWorkunitsComponent,
    DateRangePicker,
    MessageComponent,
    ErrorComponent,
    JumbotronComponent,
    IntervalPipe,
    ResPlanListTesterComponent,
    IntervalMaskDirective,
    ProjectDateSpanDirective,
    ConfirmDialogComponent,
    CellWorkUnitsPipe,
    TestComponent,
  ],

  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes ,  { enableTracing: false } )  ,
          ReactiveFormsModule,
          HttpClientModule,
          HttpModule,
          Ng2SmartTableModule,
          Ng2CompleterModule,
          FwModule,
         MatDatepickerModule,
         MatInputModule,
         MatNativeDateModule,
         MatTableModule,
         MatButtonModule,
         MatDialogModule,
         MatMenuModule,
         MatIconModule
  ],
  entryComponents: [ConfirmDialogComponent],
  providers: [  ModalCommunicator, ResourcesModalCommunicatorService,ProjectService, 
    ResourcePlanService
    , ResourcePlanUserStateService
    ,AppUtilService
    , ResourcePlansResolverService
    ,ResourceService, SPListService
    ,AppStateService 
    , ResPlanEditGuard 
    ,ExportExcelService
    , {
      provide: HTTP_INTERCEPTORS,
      useClass: CachingInterceptorService,
      multi: true
    }
  , ConfigService , 
  { provide: APP_INITIALIZER,
     useFactory: initConfig, // And use it here
     deps: [ConfigService], 
     multi: true } ],
  bootstrap: [AppComponent]
  
})

export class AppModule { }
