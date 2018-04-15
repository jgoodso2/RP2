import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA, APP_INITIALIZER } from '@angular/core';

import { AppComponent } from './app.component';

import { RouterModule, CanDeactivate } from '@angular/router'
import { appRoutes } from './routes'

import { HttpClientModule } from '@angular/common/http';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { DateRangePicker } from './common/dateRangePicker/dateRangePicker.component'

import { Config } from './ResourcePlans/res-plan.model'
import { ModalCommunicator } from './ResourcePlans/modal-communicator.service'
import { ResourcesModalCommunicatorService } from './ResourcePlans/resources-modal-communicator.service'
import { ChargebackModalCommunicatorService } from './ResourcePlans/chargeback-modal-communicator.service'
import { AppStateService } from './services/app-state.service'
import { ResPlanDetailsComponent } from './ResourcePlans/res-plan-detail.component';
import { CollapsibleWellComponent } from './common/collapsible-well.component'
import { HeaderRowComponent } from './common/header-row.component'
import { ReactiveFormsModule } from '@angular/forms'
import { ResPlanListComponent } from './ResourcePlans/res-plan-list.component'
import { SimpleModalComponent } from './common/simple-modal.component';
import { ProjectListComponent } from './ResourcePlans/project-list/project-list.component';

import { MatDatepickerModule, MatInputModule, MatNativeDateModule, MatTableModule, MatButtonModule, MatDialogModule } from '@angular/material';
import { ProjectService } from './services/project-service.service'
import { ProjectPlanService } from './services/project-plan.service'
import { ChargebackServiceService } from './services/chargeback-service.service'
import { ResourcePlanService } from './services/resource-plan.service'
import { ResourcePlanUserStateService } from './services/resource-plan-user-state.service';
import { ResourceService } from './services/resource.service'
import { ConfigService } from './services/config-service.service'
import { HttpCache } from './services/httpCache'
import { CachingInterceptorService } from './services/caching-interceptor.service'
import { AppUtilService } from './common/app-util.service';
import { ResPlanEditGuard } from './services/resPlanEditGuard.service'
import { ProjPlanEditGuard } from './services/proj-plan-edit-guard.service'
import { HTTP_INTERCEPTORS } from '@angular/common/http'

import { ProjectListFilterPipe } from './common/project-list-filter.pipe'

import { ResourcePlansResolverService } from './services/resource-plans-resolver.service';
import { ResourceListComponent } from './ResourcePlans/resource-list/resource-list.component'
import { SPListService } from './services/sp-list.service';
import { ResPlanHomeComponent } from './ResourcePlans/res-plan-home/res-plan-home.component';
import { ResPlanHeaderRowComponent } from './ResourcePlans/res-plan-header-row/res-plan-header-row.component';
import { ResPlanTimescaleComponent } from './res-plan-timescale/res-plan-timescale.component';
import { ResPlanWorkunitsComponent } from './ResourcePlans/res-plan-workunits/res-plan-workunits.component';
import { IntervalPipe } from './common/interval.pipe'
import { MessageComponent } from './ResourcePlans/messageComponent/message.component'
import { ErrorComponent } from './ResourcePlans/errorComponent/error.component'
import { FwModule } from '../fw/fw.module'
import { JumbotronComponent } from './jumbotron/jumbotron.component';
import { ResPlanListTesterComponent } from './ResourcePlans/res-plan-list-tester/res-plan-list-tester.component';
import { IntervalMaskDirective } from './directives/interval-mask.directive';
import { ProjectDateSpanDirective } from './directives/project-date-span.directive';
import { ConfirmDialogComponent } from './common/confirm-dialog/confirm-dialog.component';
import { CellWorkUnitsPipe } from './common/cell-work-units.pipe';
import { ExportExcelService } from 'app/services/export-excel.service';
import { ProjPlanListComponent } from './ResourcePlans/proj-plan-list/proj-plan-list.component';
import { ProjectPlanResolverService } from './services/project-plan-resolver.service';
import { ChargebackListComponent } from './ResourcePlans/chargeback-list/chargeback-list.component';



//let jQuery : Object;// Add this function
export function initConfig(configSvc: ConfigService) {
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
    ProjPlanListComponent,
    ChargebackListComponent,
  ],

  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes, { enableTracing: false }),
    ReactiveFormsModule,
    HttpClientModule,
    Ng2SmartTableModule,
    FwModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule
  ],
  entryComponents: [ConfirmDialogComponent],
  providers: [
    ModalCommunicator,
    ResourcesModalCommunicatorService,
    ChargebackModalCommunicatorService,
    ChargebackServiceService,
    ProjectService,
    ResourcePlanService
    , ProjectPlanService
    , ResourcePlanUserStateService
    , AppUtilService
    , ResourcePlansResolverService
    , ProjectPlanResolverService
    , ResourceService, SPListService
    , AppStateService
    , ResPlanEditGuard
    
    , ProjPlanEditGuard
    , ExportExcelService
    , {
      provide: HTTP_INTERCEPTORS,
      useClass: CachingInterceptorService,
      multi: true
    }
    , ConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig, // And use it here
      deps: [ConfigService],
      multi: true
    }],
  bootstrap: [AppComponent]

})

export class AppModule { }
