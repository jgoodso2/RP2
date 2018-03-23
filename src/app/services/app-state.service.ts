import { Injectable } from '@angular/core';
import { Subject } from "rxjs/Subject"
import { IQueryParams, Timescale, WorkUnits,PlanMode} from '../ResourcePlans/res-plan.model'
import { CurrentCalendarYear, CurrentFiscalYear, Next12Months } from '../common/utilities'
import { Subscriber } from 'rxjs/Subscriber';



@Injectable()

export class AppStateService {
  private loadingSource = new Subject<boolean>();
  private formDirtyState = new Subject<boolean>();
  private deleteState = new Subject<boolean>();
  private hideState = new Subject<boolean>();
  private saveSource = new Subject<void>();
  public addResourcesSource = new Subject<void>();
  public addChargebacksSource = new Subject<void>();
  private deleteSource = new Subject<void>();
  private hideSource = new Subject<void>();
  private showActualsSource = new Subject<boolean>();
  private exitToPerviewSource = new Subject<void>(); 
  private printToPDFSource = new Subject<void>();
  private toExcelSource = new Subject<void>();
  private exitToBISource = new Subject<void>() 
  public mainFormDirty : Boolean;


  loading$ = this.loadingSource.asObservable();
  formDirtyState$ = this.formDirtyState.asObservable();
  deleteState$ = this.deleteState.asObservable();
  hideState$ = this.hideState.asObservable();
  save$ = this.saveSource.asObservable();
  addResources$ = this.addResourcesSource.asObservable();
  addChargebacks$ = this.addChargebacksSource.asObservable();
  delete$ = this.deleteSource.asObservable();
  hide$ = this.hideSource.asObservable();
  showActuals$ = this.showActualsSource.asObservable();
  exitToPerview$ = this.exitToPerviewSource.asObservable(); 
  printToPDF$ = this.printToPDFSource.asObservable();
  exportToExcel$ = this.toExcelSource.asObservable();
  exitToBI$ = this.exitToBISource.asObservable()

  public next12Months = new Next12Months()  //default daterange
  public projectsView : boolean = false;

  public queryParams: IQueryParams = {
    fromDate: this.next12Months.startDate,
    toDate: this.next12Months.endDate,
    timescale: Timescale.calendarMonths,
    workunits: WorkUnits.FTE,
    showTimesheetData: false,
    planMode : PlanMode.ResourcePlan
  }


  constructor() {

  }
  loading(value: boolean) {
    this.loadingSource.next(value);
  }
  addResourcesClick() {
    this.addResourcesSource.next();
  }
  addChargebacksClick()
  {
    this.addChargebacksSource.next();
  }
  setFormDirty(value: boolean) {
    this.formDirtyState.next(value);
    this.mainFormDirty = value;
  }

  saveClick() {
    this.saveSource.next();
  }

  deleteClick() {
    this.deleteSource.next();
  }

  hideClick() {
    this.hideSource.next();
  }

  exitToPerviewClick() {
    this.exitToPerviewSource.next()
  }

  exitToBIClick() {
    this.exitToBISource.next() 
  }

  printToPdfClick() {
    this.printToPDFSource.next()
  }

  exportToExcelClick() {
    this.toExcelSource.next();
  }

  resourceOrProjectsSelected(value:boolean)
  {
    this.deleteState.next(value);
  }

  resourceSelected(value:boolean)
  {
    this.hideState.next(value);
  }

  showOrHideActuals(value:boolean)
  {
    this.showActualsSource.next(value);
  }

  //set up the default parameters needed by res-plan-list component
  // let currentYear = new CurrentCalendarYear()
  // let fromDate = route.params["fromDate"] && new Date(route.params["fromDate"]) || currentYear.startDate;
  // let toDate = route.params["toDate"] && new Date(route.params["toDate"]) || currentYear.endDate;
  // let timescale = route.params["timescale"] || Timescale.calendarMonths;
  // let workunits = route.params["workunits"] || WorkUnits.FTE;

  





}
