import {
    Component, OnInit, OnDestroy, Inject, DoCheck, AfterViewInit, ViewChild,
    AfterViewChecked, Output, EventEmitter
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName, } from '@angular/forms';
import { IntervalPipe } from "../common/interval.pipe"
import { CellWorkUnitsPipe } from "../common/cell-work-units.pipe"
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/mergeMap';
// import 'rxjs/add/operator/mergeMap';
import { PercentPipe } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material';
import { IResPlan, IProject, IInterval, ProjectActiveStatus, IResource, Resource, Timescale, WorkUnits, Result } from './res-plan.model'
import { ConfirmDialogComponent } from '../common/confirm-dialog/confirm-dialog.component'
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { ResPlan, Project, Interval } from './res-plan.model';
import { SimpleModalComponent } from '../common/simple-modal.component'
import { ModalCommunicator } from '../resourcePlans/modal-communicator.service';
import { ProjectService } from '../services/project-service.service'
import { ResourcePlanService } from '../services/resource-plan.service'
import { ResourcePlansResolverService } from '../services/resource-plans-resolver.service';
import { ResourcePlanUserStateService } from '../services/resource-plan-user-state.service'
import { ResourcesModalCommunicatorService } from '../resourcePlans/resources-modal-communicator.service'
import { AppUtilService } from '../common/app-util.service'
import { ResPlanHeaderRowComponent } from "../resourcePlans/res-plan-header-row/res-plan-header-row.component"
import { AppStateService } from '../services/app-state.service'
import { MenuService } from '../../fw/services/menu.service';
import { ExportExcelService } from '../services/export-excel.service';
import { elementAt } from 'rxjs/operators/elementAt';
import { Subscription } from 'rxjs/Subscription'
import { Subscriber } from 'rxjs/Subscriber'
import { isMoment } from 'moment';
import { element } from 'protractor';
import { ReadyState } from '@angular/http';



declare const $: any
declare const window: Window;


@Component({
    selector: 'resplan-list',
    templateUrl: './res-plan-list.component.html',
    styleUrls: ['./res-plan-list.component.css']
})


export class ResPlanListComponent implements OnInit, OnDestroy {
    

    

   
    
  
    @ViewChild('modalProjects', { static: false }) modalProjects: SimpleModalComponent;
    @ViewChild('modalResources', { static: false }) modalResources: SimpleModalComponent;
    @ViewChild('header', { static: false }) header: ResPlanHeaderRowComponent;


    mainForm: FormGroup;
    resPlanData: IResPlan[] = [];
    projData: IProject[];
    currentFormGroup: FormGroup;
    errorMessage: string;
    _intervalCount: number = 0;
  
    
    projectsWithDetails: IProject[] = [];
    resultsAreIn: Result[] = [];
    savableResPlans: ResPlan[] = [];
    projectsWithPMAllocationsList: any[];
    PMAllocationCandidates: any[] = [];
    maxIntervalProject: IProject[];
    maxToDate: any;
    pmAllocationCounter: number = 0;
    numberOfSelectedProjects: number;
    runItBack: number = 0;
    projectsSelectedForAddition: IProject[] = [];
    isPMAllocationEnabled: Boolean = false;
    validPMAllocationProjectExists: Boolean;



    resPlanUserState: IResPlan[];
    fromDate: Date;
    toDate: Date;
    timescale: Timescale;
    workunits: WorkUnits;
    confirmDialogResult: string;
    showTimesheetData: boolean = false;

    formValueChangesSub: Subscription;
    valuesSavedSub: Subscription;
    resourceAddedSub: Subscription;
    resourceDeletedSub: Subscription;
    resourceHiddenSub: Subscription;
    utilizePMAllocationSub: Subscription;
    resourceActualsShowHide: Subscription;
    appExitSub: Subscription;
    exportPrintSub: Subscription;
    exportExcelSub: Subscription;
    appExitToBISub: Subscription
    routeDataChangedSub: Subscription
    projModalSubmission: Subscription
    resModalSubmission: Subscription
    projModalEmit: Subscription
    resModalEmit: Subscription
    matDlgSub: Subscription
    resPlanGroupChangesSub: Subscription
    getCurrentUserSub: Subscription
    getResPlansFromResSub: Subscription
    addResToMgrSub: Subscription
    addProjectsSub: Subscription
    getResPlansFromProjectsSub: Subscription
    saveResPlansSub: Subscription
    delResPlansSub: Subscription


    get resPlans(): FormArray {  //this getter should return all instances.
        return <FormArray>this.mainForm.get('resPlans');
    }

    @Output() onLoading = new EventEmitter<boolean>();
    loading = false

    load(val: boolean) {
        this.onLoading.emit(true)
        this.loading = true
    }


    constructor(private fb: FormBuilder, private _modalSvc: ModalCommunicator
        , private router: Router,
        private _resourcePlanSvc: ResourcePlanService
        , private _resPlanUserStateSvc: ResourcePlanUserStateService
        , private _resourcePlansResolverService: ResourcePlansResolverService
        , private _projectService: ProjectService
        , private menuService: MenuService
        , private _exportExcelService: ExportExcelService
        , private _resModalSvc: ResourcesModalCommunicatorService
        , public _appSvc: AppStateService
        , private _appUtilSvc: AppUtilService
        , private _route: ActivatedRoute, private dialog: MatDialog) { }
        

    ngOnInit(): void {
        this.mainForm = this.fb.group({
            resPlans: this.fb.array([])
        });
        // this.formValueChangesSub = this.mainForm.valueChanges.subscribe(t => {
        //     //app state service emit this.mainForm.dirty
        //     this._appSvc.setFormDirty(this.mainForm.dirty);
        // })

        this._appSvc.mainFormDirty = false;
        this.valuesSavedSub = this._appSvc.save$.subscribe(() => this.savePlans(this.fromDate, this.toDate, this.timescale, this.workunits))
        this.resourceAddedSub = this._appSvc.addResources$.subscribe(() => this.addResources())
        this.resourceDeletedSub = this._appSvc.delete$.subscribe(() => this.openDeleteResPlanDialog())
        this.utilizePMAllocationSub = this._appSvc.pmAllocation$.subscribe(() => this.openPMAllocationDialog()) 
        this.resourceHiddenSub = this._appSvc.hide$.subscribe(() => this.deleteResPlans(this.fromDate, this.toDate, this.timescale, this.workunits, true))
        this.resourceActualsShowHide = this._appSvc.showActuals$.subscribe(() => this.toggleTimesheetDisplay())
        this.appExitSub = this._appSvc.exitToPerview$.subscribe(() => { console.log(''); this.exitToPerView(this._appSvc.mainFormDirty) })

        this.exportPrintSub = this._appSvc.printToPDF$.subscribe(() => { this.printFunction() });
        this.exportExcelSub = this._appSvc.exportToExcel$.subscribe(() => { this.excelExportFunction() });

        this.appExitToBISub = this._appSvc.exitToBI$.subscribe(() => this.exitToBI(this._appSvc.mainFormDirty))



        this.fromDate = this._appSvc.queryParams.fromDate
        this.toDate = this._appSvc.queryParams.toDate
        this.timescale = this._appSvc.queryParams.timescale
        this.workunits = this._appSvc.queryParams.workunits
        this.showTimesheetData = this._appSvc.queryParams.showTimesheetData;
        this.routeDataChangedSub = this._route.data.subscribe(values => {
            console.log('family',values)
            
            this.resPlanData = values.resPlans;
            //this.resPlans = values.resPlans;
            if (values.resPlans && values.resPlans.length > 0)
                this.setIntervalLength((<IResPlan[]>values.resPlans).map(t => t.projects).reduce((a, b) => a.concat(b)))
            this.buildResPlans(values.resPlans);
            //console.log(JSON.stringify(values.resPlans))
        }, (error) => console.log(error))

        console.log("=========multi subscribe")



        //this.modalResources.modalSubmitted$.subscribe(() => this._resModalSvc.modalSubmitClicked(), (error) => console.log(error));
        //this.modalProjects.modalSubmitted$.subscribe(() => this._modalSvc.modalSubmitClicked(), (error) => console.log(error));
        //what is this below??

    }


    ngAfterViewChecked(): void {
        //console.log('ng after view checke fired.')
        this.resModalEmit = this.modalResources.modalSubmitted$.subscribe(() => { this._resModalSvc.modalSubmitClicked() }, (error) => console.log(error));
        this.projModalEmit = this.modalProjects.modalSubmitted$.subscribe(() => { this._modalSvc.modalSubmitClicked() }, (error) => console.log(error));
    }

    ngOnDestroy() {
        this._appUtilSvc.safeUnSubscribe(this.formValueChangesSub)
        this._appUtilSvc.safeUnSubscribe(this.valuesSavedSub)
        this._appUtilSvc.safeUnSubscribe(this.resourceAddedSub)
        this._appUtilSvc.safeUnSubscribe(this.resourceDeletedSub)
        this._appUtilSvc.safeUnSubscribe(this.resourceHiddenSub)
        this._appUtilSvc.safeUnSubscribe(this.resourceActualsShowHide)
        this._appUtilSvc.safeUnSubscribe(this.appExitSub)
        this._appUtilSvc.safeUnSubscribe(this.appExitToBISub)
        this._appUtilSvc.safeUnSubscribe(this.routeDataChangedSub)
        this._appUtilSvc.safeUnSubscribe(this.projModalSubmission)
        this._appUtilSvc.safeUnSubscribe(this.resModalSubmission)
        this._appUtilSvc.safeUnSubscribe(this.exportPrintSub)
        this._appUtilSvc.safeUnSubscribe(this.exportExcelSub)
        this._appUtilSvc.safeUnSubscribe(this.resModalEmit)
        this._appUtilSvc.safeUnSubscribe(this.projModalEmit)
        this._appUtilSvc.safeUnSubscribe(this.matDlgSub)
        this._appUtilSvc.safeUnSubscribe(this.resPlanGroupChangesSub)
        this._appUtilSvc.safeUnSubscribe(this.getCurrentUserSub)
        this._appUtilSvc.safeUnSubscribe(this.getResPlansFromResSub)
        this._appUtilSvc.safeUnSubscribe(this.addResToMgrSub)
        this._appUtilSvc.safeUnSubscribe(this.addProjectsSub)
        this._appUtilSvc.safeUnSubscribe(this.getResPlansFromProjectsSub)
        this._appUtilSvc.safeUnSubscribe(this.saveResPlansSub)
        this._appUtilSvc.safeUnSubscribe(this.delResPlansSub)
        this._appUtilSvc.safeUnSubscribe(this.utilizePMAllocationSub)
        

        
    }
    safeUnSubscrbe(sub: Subscription) {
        if (sub) {
            sub.unsubscribe();
        }
    }


    exitToPerView(mainFormIsDirty) {

        this.checkForUnsavedChanges(mainFormIsDirty, "https://perview.app.parallon.com/PWA")

    }

    checkForUnsavedChanges(mainFormDirty, navigateUrl) {
        if (mainFormDirty === true) {
            let dialogRef = this.openDialog({ title: "Are You Sure?", content: "You have unsaved changes" })
            this.matDlgSub = dialogRef.afterClosed().subscribe(result => {
                this.confirmDialogResult = result;
                if (result == "yes")
                    window.location.href = navigateUrl
                //window.location.href = "http://foo.wingtip.com/PWA"
            });
        }
        else {

            window.location.href = navigateUrl
        }
    }

    exitToBI(mainFormIsDirty) {

        this.checkForUnsavedChanges(mainFormIsDirty, "https://perview.app.parallon.com/PWA/ProjectBICenter/All%20Reports/Forms/Resource%20Mgmt%20Reports.aspx")

    }




    calculateTotals(fg: FormGroup): void {

        var value = fg.value;

        if (value.readOnly == true)
            return
        for (var i = 0; i < value["totals"].length; i++) {
            var sum = 0;
            for (var j = 0; j < value["projects"].length; j++) {
                if (value["projects"][j]["intervals"].length < 1)
                    continue;
                var val = parseFloat(value["projects"][j]["intervals"][i]["intervalValue"]);

                if (!val) {
                    val = 0;
                }

                sum += val;

            }
            if (this._appSvc.queryParams.workunits == WorkUnits.FTE) {
                sum = sum / 100;
            }
            value["totals"][i]['intervalValue'] = new IntervalPipe().transform(sum.toString(), this.workunits) + this.getWorkUnitChar(this._appSvc.queryParams.workunits);

        }
        fg.patchValue({totals :value["totals"] },{ emitEvent: false });
        //console.log('Totals... ' + JSON.stringify(value) + "      stop....")

    }
    calculateTimesheetTotals(fg: FormGroup): void {

        let value = fg.value;
        //for each interval in the timesheet total row
        for (var i = 0; i < value["timesheetTotals"].length; i++) {
            var sum = 0;
            //sum up the timesheet data for each project for the interval column
            for (var j = 0; j < value["projects"].length; j++) {
                if (value["projects"][j]["timesheetData"].length < 1)
                    continue;
                var val = parseFloat(value["projects"][j]["timesheetData"][i]["intervalValue"]);

                if (!val) {
                    val = 0;
                }

                sum += val;

            }
            if (this._appSvc.queryParams.workunits == WorkUnits.FTE) {
                sum = sum / 100;
            }
            //update the sum for the column
            value["timesheetTotals"][i]['intervalValue'] = new IntervalPipe().transform(sum.toString(), this.workunits) + this.getWorkUnitChar(this._appSvc.queryParams.workunits);

        }
        fg.patchValue({timesheetTotals :value["timesheetTotals"] }, { emitEvent: false });
        //console.log('Totals... ' + JSON.stringify(value) + "      stop....")

    }
    formatTimesheetTotals(value:string)
    {
        if(value && value.toUpperCase() != "NA"){
        if(this.workunits == WorkUnits.hours)
        {
          return parseFloat(value).toFixed(0);
        }
        else if(this.workunits == WorkUnits.days){
            return parseFloat(value).toFixed(1);
        }
        else{
            return parseFloat(value).toFixed(0);
        }
    }
    return value;

    }
    getWorkUnitChar(workUnits: WorkUnits): string {
        switch (+(workUnits)) {
            case WorkUnits.days: return 'd';
            case WorkUnits.hours: return 'hrs';
            case WorkUnits.FTE: return '%';
            default: return '';
        }
    }
    checkTotal(val: string) {
        ;
        if (this._appSvc.queryParams.workunits == WorkUnits.FTE) {
            if (parseInt(val) > 100) {
                return "totalRed"
            }
            else return "totalGreen"
        }
        else return ""

    }

    buildResPlans(plans: IResPlan[]) {
        console.log('running buildResPlans')
        if (plans) {
            //let resPlansGrp :FormGroup[] = [];
            //console.log('add resources ==========================================' + JSON.stringify(plans));
            for (var i = 0; i < plans.length; i++) {
                var resPlan = this.buildResPlan(plans[i]);
                this.resPlans.push(resPlan);
            }
        }
        //this.resPlans.push.apply(resPlansGrp)
    }

    buildResPlan(_resplan: IResPlan): FormGroup {
        var _totals = this.fb.array([]);
        var _timesheetTotals = this.fb.array([]);
        var resPlanGroup = this.fb.group({
            resUid: _resplan.resource.resUid.toLowerCase(),
            resName: _resplan.resource.resName,
            totals: this.initTotals(_totals, _resplan.projects),
            timesheetTotals: this.initTotals(_timesheetTotals, _resplan.projects),
            projects: this.fb.array([]),
            selected: this.fb.control(false)
        });
        for (var i = 0; i < _resplan.projects.length; i++) {
            var project = this.buildProject(_resplan.projects[i],[_resplan]);
            (resPlanGroup.get('projects') as FormArray).push(project)
        }

        this.calculateTotals(resPlanGroup);
        this.calculateTimesheetTotals(resPlanGroup);
        this.resPlanGroupChangesSub = resPlanGroup.valueChanges.subscribe(value => {
            this.calculateTotals(resPlanGroup);
            this.calculateTimesheetTotals(resPlanGroup);
        }, (error) => console.log(error));
        return resPlanGroup;
    }

    buildProject(_project: IProject,resPlans: IResPlan[],) {
        console.log(_project, "which project and when?")
        var project = this.fb.group(
            {
                projUid: _project.projUid,
                projName: _project.projName,
                readOnly: _project.readOnly,
                error: null,
                readOnlyReason: this.fb.control(_project.readOnlyReason),
                intervals: this.fb.array([]),
                timesheetData: this.fb.array([]),
                selected: this.fb.control(false),
                startDate: _project.startDate,
                finishDate: _project.finishDate
            });
        for (var i = 0; i < _project.intervals.length; i++) {
            var interval = this.buildInterval(_project.intervals[i], _project, resPlans);
            (project.get('intervals') as FormArray).push(interval);
        }

        if (_project.timesheetData) {
            for (var i = 0; i < _project.timesheetData.length; i++) {
                var interval = this.buildtimesheetInterval(_project.timesheetData[i]);
                (project.get('timesheetData') as FormArray).push(interval);
            }
        }

        //_project.readOnly && project.disable({emitEvent:false})
        return project;
    }

    buildInterval(interval: IInterval, _project, resPlans: IResPlan[]): FormGroup {
    
        console.log('not object',interval, interval.intervalValue)
        return this.fb.group({
            intervalName: interval.intervalName,
            //intervalValue:  new PercentPipe(new IntervalPipe().transform(interval.intervalValue, this.workunits)  ).transform(interval.intervalValue)
            intervalValue: [new CellWorkUnitsPipe().transform(new IntervalPipe().transform(interval.intervalValue, this.workunits), this.workunits), //beers
            Validators.pattern(this.getIntervalValidationPattern())],
            intervalStart: interval.start,
            intervalEnd: interval.end

        });
    }

    getIntervalValidationPattern(): string {
        switch (+(this.workunits)) {
            case WorkUnits.FTE:
                return "^[0-9]+(%)?";
            case WorkUnits.hours:

                return "^[0-9]+(hrs)?";
            case WorkUnits.days:
                return "^[0-9]+([,.][0-9])?(d)?";
        }
        return "";
    }

    getIntervalValidationMessage(): string {
        switch (+(this.workunits)) {
            case WorkUnits.FTE:
            case WorkUnits.hours:
                return "'Please enter a numeric value'";
            case WorkUnits.days:
                return "'Please enter a numeric value or a decimal value with one decimal place'";
        }

    }


    buildtimesheetInterval(interval: IInterval): FormGroup {
     
        return this.fb.group({
            intervalName: interval.intervalName,
            //intervalValue:  new PercentPipe(new IntervalPipe().transform(interval.intervalValue, this.workunits)  ).transform(interval.intervalValue)
            intervalValue: interval.intervalValue,
            intervalStart: interval.start,
            end: interval.end

        });
    }

    initTotals(totals: FormArray, _projects: IProject[]): FormArray {
      console.log('what projects can i use here? court', _projects)
        if (totals.controls.length < 1) {

            var intervalLen = this.getIntervalLength();
            for (var i = 0; i < intervalLen; i++) {

                var total = this.fb.group({
                    intervalName: '',
                    intervalValue: new IntervalPipe().transform('0', this.workunits)
                });
                totals.push(total);
            }
        }
        return totals;
    }

    usePMAllocation(intervalValue,_project, resPlans: IResPlan[]) {

        console.log(_project, 'what is this nonsense??? Does this run every time??')
        return intervalValue
    }

    openDialog(data: any) // the second argument is a callback argument definition in typescript
        : MatDialogRef<any> {
        return this.dialog.open(ConfirmDialogComponent, {
            width: '250px',
            data: data
        });


    }

    openDeleteResPlanDialog() {
        //if form is dirty
        if (this._appSvc.mainFormDirty) {
            let dialogRef = this.openDialog({
                title: "Can't Delete - Unsaved Changes On Page",
                content: "Click Cancel and then save your changes.   Click OK to erase all changes"
            });
            this.matDlgSub = dialogRef.afterClosed().subscribe(result => {
                this.confirmDialogResult = result;

                if (result == "yes") {
                    
                    this._appSvc.mainFormDirty = false;
                    this.router.routeReuseStrategy.shouldReuseRoute = function () { return false };
                    this.router.isActive = function () { return false; }
                    this.router.navigate(['/home/resPlans', this._appSvc.queryParams]);
                }
            });
        }
        //if form is not dirty
        else {
            let dialogRef = this.openDialog({ title: "Are You Sure?", content: "This action will permanently delete resource plan assignments from the selected project(s)." })
            this.matDlgSub = dialogRef.afterClosed().subscribe(result => {
                this.confirmDialogResult = result;
                if (result == "yes")
                    this.deleteResPlans(this.fromDate, this.toDate, this.timescale, this.workunits, false)
            });
        }



    }

    openPMAllocationDialog() {
        //form dirty:
        //curt
        debugger;
        //form not dirty:
        let dialogRef = this.openDialog({ title: "Are You Sure?", content: "This action will permanently add default PM Allocations to the selected project(s)." })
        this.matDlgSub = dialogRef.afterClosed().subscribe(result => {
            this.confirmDialogResult = result;
            if (result == "yes") {
                debugger;
                // const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
                this.setPMAllocationCandidates().subscribe( (data) => {
                       console.log('what is data post set pm allocation candidates in subscribe', data, this.PMAllocationCandidates);
                       this.getProjectPMAllocations(this.PMAllocationCandidates)
                       .subscribe( (data) => {
                            console.log('what is the data for getProjectPMAllocations...in subscribe  [project, pmAllocation,ProjectManager]', data);
                            this.projectsWithPMAllocationsList = data;
                            console.log('just do it here: projectsWithPMAllocationsList', this.projectsWithPMAllocationsList)
                            debugger
                            this.pmAllocationProtocol().subscribe(
                                (data) => { this.ikeProtocol();}
                            );
                            debugger;
                            console.log('about to run ike protocol in this.openPMAllocationDialog for first time I invoke')
                            // this.ikeProtocol();
                            console.log('this is the end of the road before race me');
                            this.raceMe();
                    })//end ge projectpmallocation.subscribe()
             })//end setpmallocationcandidates.subscrib
                 
            }
        });
    }

    raceMe(): void {
        console.log('async purgatory, this is a test to see if this runs before the completion of pm allocation protocol, which would explain a lot...mainly that I need to make pm allocation protocol a observable to make this work.');
        debugger;
        this.informPMAllocationDoesNotApply();
    }

    addResPlan(): void {
        this.resPlans.push(this.buildResPlan(new ResPlan()));
    }

    get foo(): FormGroup {
        return <FormGroup>this.resPlans.get('projects');
    }

    getIntervalLength() {
        //toDo... thinking about putting interval count in data service
        return this._intervalCount;
    }
    setIntervalLength(projects: IProject[]) {

        if (this._intervalCount < 1) {
            for (var j = 0; j < projects.length; j++) {
                this._intervalCount = projects[j].intervals.length;
                return;
            }
        }

    }

    toggleSelectAll(value: boolean) {
        ;
        this.resPlans.controls.forEach((_resPlan: FormGroup) => {
            _resPlan.controls['selected'].setValue(value, { emitEvent: false });
            (_resPlan.controls['projects'] as FormArray).controls.forEach(element => {
                (element as FormGroup).controls['selected'].setValue(value, { emitEvent: false })
            });
        });
    }
    toggleResPlanSelection(_resPlan: FormGroup, selected: boolean) {
       
        _resPlan.controls['selected'].setValue(selected, { emitEvent: false });
        (_resPlan.controls['projects'] as FormArray).controls.forEach(element => {
            (element as FormGroup).controls['selected'].setValue(selected, { emitEvent: false })
        });
        this._appSvc.resourceOrProjectsSelected(this.AnyResPlanSelectedForDeleteOrHide());
        this._appSvc.resourceSelected(this.AnyResPlanSelectedForDeleteOrHide());
    }
    toggleProjectSelection(_resPlan: FormGroup, _proj: FormGroup, selected: boolean) {
        console.log('congrats you have been selected', _resPlan, _proj);
        
        _proj.controls["selected"].setValue(selected, { emitEvent: false });
        this.DeselectGroupOnUncheck(_resPlan, _proj, selected)
    }
    DeselectGroupOnUncheck(_resPlan: FormGroup, _proj: FormGroup, value: boolean) {
        _proj.controls['selected'].setValue(value, { emitEvent: false });
        if (value == false) {
            _resPlan.controls['selected'].setValue(false, { emitEvent: false });
        }

        this._appSvc.resourceOrProjectsSelected(this.AnyResPlanSelectedForDeleteOrHide());
        this._appSvc.resourceSelected(this.AnyResPlanSelectedForDeleteOrHide());
    }
    addProject(_resPlan: FormGroup): void {
        //get IProjects[] array from current formgroup

        var data = _resPlan.value.resUid;
        this._modalSvc.projectsAssigned(_resPlan.value.projects);
        this.projModalSubmission = this._modalSvc.modalSubmitted$.subscribe(() => {
            this.addSelectedProjects(this.fromDate, this.toDate, this.timescale, this.workunits, this.showTimesheetData);
            this.projModalSubmission && this.projModalSubmission.unsubscribe();
        }, (error) => console.log(error))
        this.modalProjects.showModal(data);
        var _projects: [IProject];
        var project = new Project();
        this.currentFormGroup = _resPlan;
    }

    addResources() {
        console.log("add resources fired");
        let resourcesSelected: IResource[] = this.resPlans.value.map(res => { return new Resource(res.resUid, res.resName) })
        //console.log('resources selected=' + JSON.stringify(resourcesSelected))

        this._resModalSvc.ResourcesSelected(resourcesSelected)
        this.resModalSubmission = this._resModalSvc.modalSubmitted$.subscribe(() => {
            this.addSelectedResources()
            this.resModalSubmission && this.resModalSubmission.unsubscribe();
        }, (error) => console.log(error));
        this.modalResources.showModal('');
    }

    addSelectedResources() {
        ;
        //console.log("add resource fired" + JSON.stringify(this._resModalSvc.selectedResources));
        ///EMIT HERE
        let selectedResources = this._resModalSvc.selectedResources;
        this._appSvc.loading(true);
        this.getCurrentUserSub = this._resPlanUserStateSvc.getCurrentUserId().subscribe(resMgr => {

            console.log('selected resources=' + JSON.stringify(this._resModalSvc.selectedResources))
            this.getResPlansFromResSub = this._resPlanUserStateSvc.getResPlansFromResources(resMgr, this._resModalSvc.selectedResources, this.fromDate, this.toDate, this.timescale, this.workunits, this.showTimesheetData)
                .subscribe(plans => {
                    this.addResToMgrSub = this._resPlanUserStateSvc.AddResourceToManager(resMgr, plans).subscribe(r => {
                        if (r.success == true) {
                            console.log('added resplans=' + JSON.stringify(plans))
                            this.setIntervalLength((<IResPlan[]>plans).map(t => t.projects).reduce((a, b) => a.concat(b)))
                            //filter resplan on the resource who got updated in SP list successfully
                            this.buildResPlans(plans)
                            this._resModalSvc.selectedResources = [];
                            this._appSvc.loading(false);
                            this.updateTimeSheetDataForResources();
                        }
                        else {
                            this._resModalSvc.selectedResources = [];
                            this._appSvc.loading(false);
                        }
                    }, (error) => {
                        console.log(error); this._appSvc.loading(false);
                    })
                        , (error) => { console.log(error); this._appSvc.loading(false); }
                })
        }, (error) => { console.log(error); this._appSvc.loading(false); })
    }

    updateTimeSheetDataForResources() {
        this._resPlanUserStateSvc.getAllTimesheetData(this._appSvc.queryParams.workunits)
            .subscribe();
    }

    addSelectedProjects(fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean) {
        this._appSvc.loading(true);
        this.getCurrentUserSub = this._resPlanUserStateSvc.getCurrentUserId().subscribe(resMgr => {
            let resource = new Resource(this.currentFormGroup.value["resUid"],
                this.currentFormGroup.value["resName"]);
            this.addProjectsSub = this._resPlanUserStateSvc.addOrShowProjects(resMgr, this._modalSvc.selectedProjects, resource,
                fromDate, toDate, timescale, workunits)
                .subscribe( (results) => {
                    console.log('this is what i have been missing', results)
                 
                    this.projectsSelectedForAddition = this._modalSvc.selectedProjects;
                    
                    this.updateErrors(results);
                    this._modalSvc.selectedProjects = [];
                    let superSuccessfulProjects: IProject[] = [];
                    let successfullProjectsObjects = results.filter(r => r.success == true)//.map(t => t.project)
                    let successfullProjects = results.filter(r => r.success == true).map(t => t.project)
                  
                    superSuccessfulProjects = this._resPlanUserStateSvc.fillPMAllocationIntervals(this._resPlanUserStateSvc.usePMAllocationDefaults(results));//.map(t => t.project) //givesPM ALLOCATION TO LIBERALLY
            
                    console.log(superSuccessfulProjects, "leggo my egg");
                    console.log('what are pm allocation here in successful projects?', successfullProjects)
                    let modifiedSuccessfulProjects = this._resPlanUserStateSvc.addResourceNameToProjects( superSuccessfulProjects, successfullProjectsObjects)
                    // let modifiedSuccessfulProjects2 = this._resPlanUserStateSvc.addResourceNameToProjects( superSuccessfulProjects, successfullProjectsObjects)
                    // let againModedsuccessfulProjects = this._resPlanUserStateSvc.addResourceNameToProjects( superSuccessfulProjects, successfullProjectsObjects)
                    // console.log('what are mod successful projects',modifiedSuccessfulProjects);
                    // console.log('what are againmoded successful projects',againModedsuccessfulProjects);
                    debugger;
                    //go through supersuccessful projects and change intervals if pm.Allocation is present in project
                    this.projectsSelectedForAddition.filter(p => results.findIndex(r => r.success == true && r.project.projUid.toUpperCase() == p.projUid.toUpperCase()) > -1)
                    console.log("===added projects" + JSON.stringify(successfullProjects))
                  //this.setPmAllocationProjects(modifiedSuccessfulProjects)
                   let goodProjects = this.setPmAllocationProjects(modifiedSuccessfulProjects)
                   debugger
                    if (successfullProjects.length > 0) {
                        this.getResPlansFromProjectsSub = this._resPlanUserStateSvc.getResPlansFromProjects(resource.resUid, [resource],
                            Observable.of([new ResPlan(resource, modifiedSuccessfulProjects)]), fromDate, toDate, timescale, workunits
                            , showTimesheetData).subscribe(resPlans => {
                                
                                console.log(resPlans, 'circles') //i have resourceName and projects, but not projectOwner need to do operations here actually...wow!
                                    
                                    //get all resPlanProjects in a particular order (function needed)
                                   let orderProjects = resPlans[0].projects.sort();
                                   let gotProjects = this.getPmAllocationProjects();
                                   let engagePmAllocation = this.engagePMAllocation(this.getPmAllocationProjects(),resPlans[0].resource.resName)
                                    //need to filter engagePmAllocation for
                                 
                                   let usableProjectsWithPMAllocations =  engagePmAllocation.filter( (element) => element.intervals.length > 0 )

                                    //for each project in resPlan Projects if corresponding project in pmAllocationProjects has resName = projectOwnerName and PM ALlocation does not equal "" 
                                        //then fill intervals with pmAllocation interval value (function needed)

                                  //commonality = a resName and a selected group of projects
                                


                                debugger
                                console.log('useful shot lad.', resPlans, usableProjectsWithPMAllocations);
                              //  this._resPlanUserStateSvc.addResourceNameToProjects( resPlans[0].projects, resPlans) //what's the point of this??
                                this.buildSelectedProjects(resPlans,usableProjectsWithPMAllocations)//.filter(r=>r.projUid.toUpperCase))// before this onnly had projects....
                                this.header && this.header.setIntervals(resPlans);
                                this.initTotals(this.currentFormGroup.get('totals') as FormArray,usableProjectsWithPMAllocations) //CHECK THIS VALUE THOUGH
                                this.calculateTotals(this.currentFormGroup);
                                debugger;
                            });

                    }

                    this._appSvc.loading(false);
                   

                })
        }, (error) => { console.log(error); this._appSvc.loading(false); console.log('Gonzo - ryan gonzalez');  this.setPmAllocationProjects([]); })
    }
    // worksunitsChanged(value: number) {
    //     ;
    //     this.workunits = value;
    //     this.ReloadPage();
    // }
    // timescaleChanged(value: number) {
    //     ;
    //     this.timescale = value;
    //     this.ReloadPage();
    // }
    // dateRangeChanged(value) {
    //     

    //     this.fromDate = new Date(value.start._d)

 
    buildSelectedProjects(resPlans:IResPlan[], projects: IProject[]): void {
        ;
        this.setIntervalLength(projects)
        var intervalLength = this.getIntervalLength();
        for (var k = 0; k < projects.length; k++) {
            let project: IProject = projects[k];
            // project.intervals = [];
            // for (var i = 0; i < intervalLength; i++) {
            //     project.intervals.push(new Interval('', '0.0'));
            // }

            (this.currentFormGroup.controls['projects'] as FormArray).push(this.buildProject(project,resPlans));
        }
    }

    setPmAllocationProjects(projects: IProject[]): void {
        this.projectsWithDetails = projects;
    }

    getPmAllocationProjects(): IProject[] {
        return this.projectsWithDetails;
    }

    orderSuccessfulProjects(projects) {
       return projects.sort(projects)
    }
    engagePMAllocation(projects: IProject[], resName: string): IProject[] { 
       
       let projectsWithPmAllocations = []
        projects.forEach((project) => {
            debugger
              //for each project in resPlan Projects if corresponding project in pmAllocationProjects has resName = projectOwnerName and PM ALlocation does not equal "" 
                                        //then fill intervals with pmAllocation interval value (function needed)
            let checkedProject =  this.checkForPMAllocationCases(project,this.getPmAllocationProjects(), resName)
             projectsWithPmAllocations.push(checkedProject);
        })
        return projectsWithPmAllocations;
    }

    checkForPMAllocationCases(projectToCheck: IProject,projectsWithDetails: IProject[], resName:string): any {
        debugger;
       let foundProject = projectsWithDetails.find(project => (project.projName === projectToCheck.projName  && project.resName === resName && (project.pmAllocation !== "" || project.pmAllocation !== undefined)))// && project.resName = resName
       if ( foundProject) {
           debugger;
           console.log('maria taylor', foundProject)
         let projectWithPMAllocationIntervals =  this.insertPMAllocationIntervalValueForAddedProject(foundProject,projectToCheck)
         return projectWithPMAllocationIntervals;
       }
       return projectToCheck;
    }


    insertPMAllocationIntervalValueForAddedProject(detailedProject: IProject, projectToAddPMAllocation: IProject) {
        let referenceProject = this.projectsSelectedForAddition.find((project) => project.projUid == detailedProject.projUid);
        debugger;
        let copyOfIntervals: Interval[] = [...projectToAddPMAllocation.intervals]
        console.log('here is a copy of intervals...,detailedProject, projectoaddpmallocation',copyOfIntervals, detailedProject,projectToAddPMAllocation);
        let newIntervalsWithPmAllocation: Interval[] = []
        newIntervalsWithPmAllocation = copyOfIntervals.map(interval => this.applyConditionalPMAllocationValue(detailedProject,referenceProject, interval)) //which project do i need to pass on....
             //  `.${detailedProject.pmAllocation.slice(0,slicePosition)}`; 
        console.log('is shift still needed?', newIntervalsWithPmAllocation)
        newIntervalsWithPmAllocation.shift();
         //for each interval...set interval value to pmAllocation push into newIntervals...project.intervals = project.newIntervals.
        let projectWithPMAllocationIntervals = projectToAddPMAllocation;
        projectWithPMAllocationIntervals.intervals = newIntervalsWithPmAllocation
        debugger
        console.log('extra extra??', projectWithPMAllocationIntervals)
        return projectWithPMAllocationIntervals;

    }

    applyConditionalPMAllocationValue(detailedProject, referenceProject, interval): Interval {
        debugger;
        console.log('interval,detailedproject,referenceproject', interval,detailedProject, referenceProject);
        let _intervalStart = new Date(interval.start)
        let _intervalEnd = new Date(interval.end) 
        let _projStart = new Date(referenceProject.startDate)
        let _projFinish = new Date(referenceProject.finishDate)
    
        if ((_intervalStart <= _projStart && _intervalEnd <= _projStart) || (_intervalStart > _projFinish ) )   {
         interval.intervalValue = "0";
         debugger;
          return interval;
        }
        else {
          interval.intervalValue = `.${detailedProject.pmAllocation}`;
          debugger;
          return interval;
        }
    
    }


/* EXHIBIT A
  const projectDuration = [ 1,2,3,4,5 ];
const sequences = [1,2,3,4,5,6,7,8,9,10,11,12];

console.log('project duration length =', projectDuration.length);
console.log('project duration last interval value =', projectDuration[projectDuration.length -1]);
console.log('sequences length =', sequences.length)

if (sequences.length > projectDuration.length) { 
  let seqdifference = sequences.length - projectDuration.length
  console.log('need to adjust for intervals...');
  console.log(sequences[0], sequences[sequences.length -1], sequences[sequences.length -2])
  console.log('simple as dat',[...projectDuration,...sequences.slice(-seqdifference)]);
}

  
  

*/
    setPMAllocationCandidates(): Observable<any[]> {
     
        let resourcePlans = this.getSelectedProjects();
        let localCandidates: any[] = [];
        resourcePlans.forEach( (resourcePlan) => {
            resourcePlan.projects.forEach( (project) => {
                this.PMAllocationCandidates.push(project);
                localCandidates.push(project)
            })

        })
        console.log('just do it here', this.PMAllocationCandidates);
        debugger;
        return Observable.from(localCandidates);
     
}

    getProjectPMAllocations(projects): Observable<any> {
        debugger;
        let localCandidates = this.PMAllocationCandidates
       
        return this._projectService.getProjectPMAllocations(projects);
    }
  
  

     pmAllocationProtocol(): Observable <any[]> {
         // list of projects = [project,pmAllocation,ProjectManager]
       
         console.log('why hello pmALlocation protocol')
         this.pmAllocationCounter++
         this.numberOfSelectedProjects = this.PMAllocationCandidates.length;
         //bryson
         debugger;
        let updatedResourcePlans = [];
        let resourcePlans = this.getSelectedProjects();
        let maxResPlanDate = this.determineResPlanMaxDate(resourcePlans)
        this.maxToDate = maxResPlanDate; 
        console.log('winner', this.maxToDate);
        
        resourcePlans.forEach((resPlan,index) => {
            if (this.pmAllocationPrerequisiteCheck(resPlan) == true) {
                resPlan.projects.forEach( (project,index) => {
                    //let projectData =  this.getPMAllocationDetails(project.projName).toPromise().then( (projectData) => {
                        let referenceProject = this.projectsWithPMAllocationsList.find((projectInList) => projectInList[0].projUid == project.projUid);
                        debugger;
                        console.log(referenceProject);


                        if (this.startAndFinishDatesValid(project) == true && this.projectManagerResourceNameEqual(referenceProject[2],resPlan.resource.resName) == true && this.pmAllocationExistsInProject(referenceProject) == true && this.projectIsOngoing(project) ) {
                            console.log('valid start and finish dates and projectOwnerName is resourcename in form and pmAllocation has a value...', project);
                            this.validPMAllocationProjectExists = true;
                            debugger;
                            
                            debugger
                            let updatedProject =  this.insertPMAllocationIntervalValueforSelectedProject(project,referenceProject, this.maxIntervalProject)
                   
                           project.intervals = updatedProject.intervals; //return a project.  then change project project.intervals = newProject.intervals and always add to list.
                          let replacementIndex =  updatedResourcePlans.findIndex( element => element.resource.resUid == resPlan.resource.resUid);
                           if (replacementIndex === -1 ) { updatedResourcePlans.push(resPlan);} if (replacementIndex !== -1) { updatedResourcePlans[replacementIndex] = resPlan; }
                          debugger;
                        }

                       // console.log('cmon eileen', updatedResourcePlans.filter(resplans => resplans.projects.length > 0));
        
                        let resPlansToSave: ResPlan[] = updatedResourcePlans.filter(resplans => resplans.projects.length > 0);
                        this.savableResPlans = updatedResourcePlans;
                      //  console.log('nightmoves', resPlansToSave);
                        // eileen.forEach( (resPlan => {
                
                        // }))
                        console.log('garbage in: updatedResourcePlans, savableResPlans, resPlansToSave', updatedResourcePlans, this.savableResPlans, resPlansToSave);
                       
                        debugger;
                                       
                     
                      // this.katrinaProtocol(resPlansToSave);

                     })
                     
           
            }//after this.
                      
            
         //   console.log('should be every resPlan I thought...', resPlan);
          //  console.log('garbage in ', updatedResourcePlans);
          
            
        })
        //add PM Allocations to list of selected Projects: addPMALlocationsToProjects(selectedProjects) forEach project make project GET, and add pm allocation to project return enhanced Projects
            //forEachEnhancedProject: this.insertPMAllocationInvervalValue(project, project)
    
        // HOPEFULLY THIS WORKS AT WITS END ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
       /*  this._resPlanUserStateSvc.saveResPlans(resPlansToSave, this.fromDate, this.toDate, this.timescale, this.workunits)
                .subscribe(
                    (results: Result[]) => this.onSaveComplete(results),
                    (error: any) => {
                        this.errorMessage = <any>error
                        this._appSvc.loading(false);
                    }); */
         debugger;
         console.log('you a dog');   
         console.log('[kat meow?]',this.savableResPlans); 
        return Observable.from(updatedResourcePlans);
       }

        ikeProtocol() {
         
            let readyStatus:Boolean = this.ikeProtocolCheck();
            debugger;
            this._appSvc.loading(true);
            let readyForSave = this.ikeProtocolCheck();
            if (readyStatus == true) {
                this.saveResPlansSub = this._resPlanUserStateSvc.exsaveResPlans(this.savableResPlans, this.fromDate, this.maxToDate, this.timescale, this.workunits,readyStatus)
                .subscribe(
                    (results: Result[]) =>{ debugger; console.log('ready status is: + results',readyStatus, '+' ,  results   );
                    //if results does not equal [] then on save complete otherwise do nothing.
                    this.onSaveComplete(results);
                    this._appSvc.resourceOrProjectsSelected(this.AnyResPlanSelectedForDeleteOrHide());
                    this._appSvc.resourceSelected(this.AnyResPlanSelectedForDeleteOrHide());
                   
                    this.refreshStatus(readyStatus);
                    if (results == []) {
                        console.log('open sesame for non pm allocation projects', results), this.savableResPlans;
                    }
                   
                    debugger;
                    /* this.toggleProjectSelection(this.getSelectedProjects()) *///for each selected resplan (getseleceProjects() execute toggleProjectSelection())
                    } ,
                    (error: any) => {
                        this.errorMessage = <any>error
                        this._appSvc.loading(false);
                    });
            }
            else {
                this.pmAllocationProtocol();
            }
 
            
        }

        ikeProtocolCheck(): Boolean {
            debugger;
            if(this.pmAllocationCounter == this.numberOfSelectedProjects || this.isPMAllocationEnabled == true) {
                this.isPMAllocationEnabled = true;
                return true;
            }
            return false;
        }
       // return updatedResourcePlans

       refreshStatus(readyStatus: Boolean): any {
     /*    this._appSvc.resourceOrProjectsSelected(this.AnyResPlanSelectedForDeleteOrHide());
        this._appSvc.resourceSelected(this.AnyResPlanSelectedForDeleteOrHide());
        this.PMAllocationCandidates = []; */
      
        if (readyStatus == true) {
        this.mainForm = this.fb.group({
            resPlans: this.fb.array([])
        });
        // this.formValueChangesSub = this.mainForm.valueChanges.subscribe(t => {
        //     //app state service emit this.mainForm.dirty
        //     this._appSvc.setFormDirty(this.mainForm.dirty);
        // })
        
        this._appSvc.mainFormDirty = false;
        this.valuesSavedSub = this._appSvc.save$.subscribe(() => this.savePlans(this.fromDate, this.toDate, this.timescale, this.workunits))
        this.resourceAddedSub = this._appSvc.addResources$.subscribe(() => this.addResources())
        this.resourceDeletedSub = this._appSvc.delete$.subscribe(() => this.openDeleteResPlanDialog())
        this.utilizePMAllocationSub = this._appSvc.pmAllocation$.subscribe(() => this.openPMAllocationDialog()) 
        this.resourceHiddenSub = this._appSvc.hide$.subscribe(() => this.deleteResPlans(this.fromDate, this.toDate, this.timescale, this.workunits, true))
        this.resourceActualsShowHide = this._appSvc.showActuals$.subscribe(() => this.toggleTimesheetDisplay())
        this.appExitSub = this._appSvc.exitToPerview$.subscribe(() => { console.log(''); this.exitToPerView(this._appSvc.mainFormDirty) })

        this.exportPrintSub = this._appSvc.printToPDF$.subscribe(() => { this.printFunction() });
        this.exportExcelSub = this._appSvc.exportToExcel$.subscribe(() => { this.excelExportFunction() });

        this.appExitToBISub = this._appSvc.exitToBI$.subscribe(() => this.exitToBI(this._appSvc.mainFormDirty))



        this.fromDate = this._appSvc.queryParams.fromDate
        this.toDate = this._appSvc.queryParams.toDate
        this.timescale = this._appSvc.queryParams.timescale
        this.workunits = this._appSvc.queryParams.workunits
        this.showTimesheetData = this._appSvc.queryParams.showTimesheetData;
        //this.informPMAllocationDoesNotApply();
        this.routeDataChangedSub = this._route.data.subscribe(values => {
            this.resPlanData = values.resPlans;
            //this.resPlans = values.resPlans;
            if (values.resPlans && values.resPlans.length > 0)
                this.setIntervalLength((<IResPlan[]>values.resPlans).map(t => t.projects).reduce((a, b) => a.concat(b)))
            this.refreshResPlans();
          console.log(JSON.stringify(values.resPlans))
        // }, (error) => console.log(error))
        console.log("=========multi getting")
       
       
        })
         }//ready status true
       }

       refreshResPlans(): any {
        // let resourceplans = this.fb.array(this.resPlans.controls
        //     ).controls
        //     .map(t => {
        //         var _resPlan: IResPlan;
        //         var _projects: [IProject];
        //         var projects = Object.assign([], _projects, this.fb.array(((t as FormGroup).controls['projects'] as FormArray).controls.filter(s => s.value.selected == true || s.value.selected == false)).value)
        //         let resPlan = new ResPlan();
        //         resPlan.resource = new Resource(t.value.resUid, t.value.resName);
        //         resPlan.projects = projects;
        //         resPlan["selected"] = (t as FormGroup).controls['selected'].value;
        //         console.log(JSON.stringify(resPlan))
        //         //resPlan["selected"] = _resPlan["selected"]
        //         return resPlan;
        //     });
        //     return resourceplans;
        debugger;
        this._resourcePlansResolverService.resolve(this._route.snapshot,this.router.routerState.snapshot).subscribe( (resPlansData) => {
       
            this.buildResPlans(resPlansData);
            //this.mainForm.get('resPlans');
            this.pmAllocationCounter = 0;
            this.numberOfSelectedProjects = 0; 
           
            // this.validPMAllocationProjectExists = false;
            return resPlansData
        })
      
       }

       informPMAllocationDoesNotApply(): void {
           debugger;
            if ((this.ikeProtocolCheck() == true && this.validPMAllocationProjectExists == false) && this.savableResPlans.length == 0) {
                debugger;
                let dialogRef = this.openDialog({ title: "There are no projects that PM Allocation can be applied to. (PM Allocations are applied if the resource manager and the project owner are the same individual) "
                , content: "This action will permanently add default PM Allocations to the selected project(s)." });

                
                console.log('ok it does kind of work...')
             
               
            }   
            debugger; 
              
            this._appSvc.resourceOrProjectsSelected(this.AnyResPlanSelectedForDeleteOrHide());
            this._appSvc.resourceSelected(this.AnyResPlanSelectedForDeleteOrHide());
            this.refreshStatus(this.ikeProtocolCheck());
            debugger;
            let dialogRef = this.openDialog({ title: "There are no projects that PM Allocation can be applied to. (PM Allocations are applied if the resource manager and the project owner are the same individual) "
            , content: "This action will permanently add default PM Allocations to the selected project(s)." });

            
            console.log('ok it does kind of work...')
       }

       PMAllocationApplicableCheck() {
           
       }

       determineResPlanMaxDate(resourcePlans: IResPlan[]): Date {
        debugger;
        let allProjectsOnResourcePlans: any[] = []; //resourcePlans[0].projects[0];
        let allPotentialToDates: any[] = [this.toDate];
        console.log('all podates',allPotentialToDates);
        let  resPlanMaxDate: Date;
        resourcePlans.forEach( (resourcePlan) => {
         resourcePlan.projects.forEach( (project) => {
             debugger;
             if (project.finishDate !== null || project.finishDate !== undefined || project.finishDate) {
                 let end = this._resPlanUserStateSvc.transformToDate(project.finishDate)
                 //if (finishDate > this.toDate) { 
                     console.log('why error out here?',allPotentialToDates,allProjectsOnResourcePlans)
                     allPotentialToDates.push(end);
                     allProjectsOnResourcePlans.push(project);
                // }
             }
         })
       })
        
        let sortedDates =this.maxDateSort(allPotentialToDates);
        console.log('you get in the mood sortedDates = ',sortedDates, sortedDates[0]);
         resPlanMaxDate = sortedDates[sortedDates.length - 1];
         this.maxIntervalProject = allProjectsOnResourcePlans[0];
         debugger

         let maxIntervalProjectIndex = allProjectsOnResourcePlans.findIndex((project) => this._resPlanUserStateSvc.exgetDateFormatString(this._resPlanUserStateSvc.transformToDate(project.finishDate )) == this._resPlanUserStateSvc.exgetDateFormatString(resPlanMaxDate));
         if (maxIntervalProjectIndex !== -1) {
             this.maxIntervalProject = allProjectsOnResourcePlans[maxIntervalProjectIndex];
         }
         console.log('maximus:  index, project, and date...', maxIntervalProjectIndex, this.maxIntervalProject, resPlanMaxDate)
         debugger;
         return resPlanMaxDate
     }

     maxDateSort(allPotentialDates: any[]) {
        let ComparableDates: Date[] = allPotentialDates.map((dateOfDifferingType) => this._resPlanUserStateSvc.transformToDate( dateOfDifferingType));
        return ComparableDates.sort((b,a)=>b.getTime()-a.getTime());
    }

    projectIsOngoing(project) {
        if(this._resPlanUserStateSvc.transformToDate(project.finishDate) < this._resPlanUserStateSvc.getCurrentDate()) {
            console.log('does not count', project);
            return false;
        }
        console.log('good if it goes');
        return true;
    }    


    pmAllocationPrerequisiteCheck(resPlan: IResPlan) {
        console.log('inside PMAllocationPrequisite Check',resPlan);
        if(resPlan.projects.length > 0) {
            console.log('resplan projects length is greater than 0');
            if(resPlan.projects.find(project => project.startDate && project.finishDate !== null) !== undefined) {
                console.log('getting serious');
                this.validPMAllocationProjectExists = true;
                return true;
            }
        }
        console.log('not getting serious...broken up');
        return false;
    }

    startAndFinishDatesValid(project: IProject): Boolean {
        if(project.startDate !== null && project.finishDate !== null) {
            return true;
        }
        return false;
    }

    projectManagerResourceNameEqual(projectManager,appResourceName): Boolean {
        console.log('projectManagerNameEqual?? resourceName??')
        if(projectManager == appResourceName) {
            console.log('projmanager does equal resource name')
            return true;
        }
        console.log('project manager name does not equal resourcename');
        return false;
    }

    pmAllocationExistsInProject(referenceProject: any){
        console.log('referenceProjectbulldogs');
        let pmAllocation = referenceProject[1];
        if(pmAllocation !== null) {
            return true;
        }
        return false;
    }

    
    getPMAllocationDetails(projectName): any {
       return this._projectService.getPMAllocationDetails(projectName)
    }

    insertPMAllocationIntervalValueforSelectedProject(projectToAddPMAllocation: IProject, referenceProject: any, maxIntervalProject: any): IProject {
        console.log('ronez be quiet insertPMAloe', projectToAddPMAllocation, 'these invervals?', projectToAddPMAllocation.intervals);
        let updatedIntervals: IInterval[] = [];
        let intervalsForDurationOfProject = this.exbuildIntervals(projectToAddPMAllocation, referenceProject); //need to build better intervals to align with months.
        intervalsForDurationOfProject.forEach( (interval,index) => {
             
            let pmAllocation = referenceProject[1]; //referenceProject = [{IProject}, PMAllocation, ProjectManagerName]
            let slicePosition = referenceProject[1].indexOf('.');
            interval.intervalName = `Interval${index}`;
            interval.intervalValue = `.${pmAllocation.slice(0,slicePosition)}`;
            // interval.intervalValue = `${pmAllocation.slice(0,slicePosition)}`;
            debugger;
            updatedIntervals.push(interval);
        })
      
        let updatedProjectWithIntervals = projectToAddPMAllocation;

        if(maxIntervalProject.intervals.length > updatedIntervals.length) {
            let seqDiff = maxIntervalProject.intervals.length - updatedIntervals.length;
            console.log('need to adjust for intervals....projectToAddPMAllocation.intervals = ',projectToAddPMAllocation.intervals );
            let replacementIntervals = projectToAddPMAllocation.intervals.slice(-seqDiff);
            replacementIntervals.map( (interval) => this.useDefaultInterval(interval))
            updatedIntervals = [...updatedIntervals,...replacementIntervals];
            console.log('now we are cooking with oil', updatedIntervals)
        }

        updatedProjectWithIntervals.intervals = updatedIntervals;
        console.log(updatedProjectWithIntervals, 'K be quiet')
        debugger;
        return updatedProjectWithIntervals;    


      /*   const projectDuration = [ 1,2,3,4,5 ];
        const sequences = [1,2,3,4,5,6,7,8,9,10,11,12];
        
        console.log('project duration length =', projectDuration.length);
        console.log('project duration last interval value =', projectDuration[projectDuration.length -1]);
        console.log('sequences length =', sequences.length)
        
        if (sequences.length > projectDuration.length) { 
          let seqdifference = sequences.length - projectDuration.length
          console.log('need to adjust for intervals...');
          console.log(sequences[0], sequences[sequences.length -1], sequences[sequences.length -2])
          console.log('simple as dat',[...projectDuration,...sequences.slice(-seqdifference)]); */





       /*  INITIAL THOUGHTS::::::
       let intervalRange =  this.getPMAllocationIntervalRange(projectToAddPMAllocation,projectData)
       if(this.projectDurationOutOfRange(intervalRange)) {
           return projectToAddPMAllocation;
       }
       let intervalStartIndex = intervalRange[0];
       let intervalEndIndex = intervalRange[1];
       if (intervalStartIndex === undefined && intervalEndIndex !== undefined) {
           //fill PM Allocation from beginning of interval
       }
       INITIAL THOUGHTS OVER :::::::::: */

       //: return array (start index, end index) of project.intervals
        //make copy of intervals
        //new intervals 
        //traverse intervals of copy 
// FOR REFERENCE THE OTHER ONE IS LIKE SO::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // let copyOfIntervals: Interval[] = [...projectToAddPMAllocation.intervals]
        // let newIntervalsWithPmAllocation: Interval[] = []
        // copyOfIntervals.forEach(interval => {
        //     interval.intervalValue = detailedProject.pmAllocation;
        //     newIntervalsWithPmAllocation.push(interval);
        // })
        // newIntervalsWithPmAllocation.shift();
        // //for each interval...set interval value to pmAllocation push into newIntervals...project.intervals = project.newIntervals.
        // let projectWithPMAllocationIntervals = projectToAddPMAllocation;
        // projectWithPMAllocationIntervals.intervals = newIntervalsWithPmAllocation
        // debugger
     
    }

    useDefaultInterval(interval: any) {
        delete interval.start;
        delete interval.end;
        let copyOfOfInterval = Object.assign({}, interval);
        delete copyOfOfInterval.start;
        delete copyOfOfInterval.end;
        copyOfOfInterval.intervalValue = "0";
        console.log('copy of Interval = ', copyOfOfInterval,'interval = ', interval);
        debugger;
        return copyOfOfInterval
    }
    



    buildIntervals(projectToAddPMAllocation: IProject, referenceProject: any[]) {
       console.log('inside buildINteravls()...returning intervals I thought...' ,this._resPlanUserStateSvc.buildIntervals(projectToAddPMAllocation.startDate, projectToAddPMAllocation.finishDate,Timescale.calendarMonths));
       let projectDurationIntervals: IInterval[] = [];
       let formattedStartDate = this.PmAllocationStartDate(projectToAddPMAllocation);//this._resPlanUserStateSvc.getModifiedStartDate(projectToAddPMAllocation.startDate);
       let formattedEndDate =  this.PmAllocationEndDate(projectToAddPMAllocation);//this._resPlanUserStateSvc.getModifiedEndDate(projectToAddPMAllocation.finishDate);
       projectDurationIntervals = this._resPlanUserStateSvc.exbuildIntervals(formattedStartDate,formattedEndDate,Timescale.calendarMonths);
       console.log('looking for forrester intervals', projectDurationIntervals);
       return projectDurationIntervals;
    }

    exbuildIntervals(projectToAddPMAllocation: IProject, referenceProject: any[]) {
        console.log('dear year...returning intervals I thought...' ,this._resPlanUserStateSvc.exbuildIntervals(projectToAddPMAllocation.startDate, projectToAddPMAllocation.finishDate,this.timescale));
        let projectDurationIntervals: IInterval[] = [];
        let formattedStartDate = this.PmAllocationStartDate(projectToAddPMAllocation);//this._resPlanUserStateSvc.getModifiedStartDate(projectToAddPMAllocation.startDate);
        let formattedEndDate =  this.PmAllocationEndDate(projectToAddPMAllocation);//this._resPlanUserStateSvc.getModifiedEndDate(projectToAddPMAllocation.finishDate);
        projectDurationIntervals = this._resPlanUserStateSvc.exbuildIntervals(formattedStartDate,formattedEndDate,Timescale.calendarMonths);
        console.log('looking for forrester intervals', projectDurationIntervals);
        return projectDurationIntervals;
     }

 

   determineMaxDate(toDate: Date, projectFinishDate: Date): Date {
       if(toDate > projectFinishDate) {
           console.log('in determineMaxDate()...to date is max...')
           return toDate;
       }
       console.log('project finish date is max in determineMaxDate')
       return projectFinishDate;
   }

   filterOutStableProjects(resPlans: ResPlan[]): ResPlan[] {
       debugger;
       console.log('coffee filter: what are resplans?', resPlans, this.savableResPlans)
       let filteredResPlans: ResPlan[] = [];
       if (resPlans.length > 0) {
        resPlans.forEach((resPlan) => {
            resPlan.projects =  this.checkProjectsForUpdates(resPlan)
            filteredResPlans.push(resPlan);
       })
       console.log('venus', filteredResPlans);
       return filteredResPlans;
       }
       if(this.runItBack < 6) {
        this.runItBack++;
        this.pmAllocationProtocol();
       }
       
       return [];
      
   }

   checkProjectsForUpdates(resPlan: ResPlan): IProject[] {
       debugger;
       let validProjects: IProject[] = resPlan.projects.filter(project => project.intervals[0].start !== undefined );
       console.log('serena', validProjects);
       return validProjects;
   }
    

    PmAllocationStartDate(project: IProject) {
        debugger;
        let todayDate = this._resPlanUserStateSvc.getCurrentDate();
        let projectStartDate = this._resPlanUserStateSvc.transformToDate(project.startDate);
        console.log("the meaning of time: projectstartdate,typeof,projectstartdatetransofrmedtostring", project.startDate, typeof(project.startDate), this._resPlanUserStateSvc.getDateFormatString(project.startDate));
        if(projectStartDate < todayDate) {
            console.log('use today date because todays date is more current than project start date: start date, today dates', project.startDate, todayDate)
            return this._resPlanUserStateSvc.getModifiedStartDate(todayDate);
        }
        console.log('use project start date bc project has  not started as of etalready: startdate, today date', projectStartDate, todayDate);
        return  this._resPlanUserStateSvc.getModifiedStartDate(projectStartDate);
    }

    PmAllocationEndDate(project: IProject) {
        let todayDate = this._resPlanUserStateSvc.getCurrentDate();
        let projectEndDate = this._resPlanUserStateSvc.transformToDate(project.finishDate);
        console.log("the meaning of time: projectenddate,typeof,projectenddatetransofrmedtostring", project.finishDate, typeof(project.finishDate), this._resPlanUserStateSvc.getDateFormatString(project.finishDate));
        // if(project.finishDate < todayDate) {
        //     console.log('use today date because todays date is more current than project end date: end date, today dates', project.finishDate, todayDate)
        //     return this._resPlanUserStateSvc.getModifiedEndDate(todayDate);
        // }
        console.log('use project end date bc project has  not ended as of etalready: enddate, today date', projectEndDate, todayDate);
        return  this._resPlanUserStateSvc.getModifiedEndDate(projectEndDate);
    }

    getPMAllocationIntervalRange(projectToAddPMAllocation: IProject, projectData): any[] {
        let indexStart =  projectToAddPMAllocation.intervals.findIndex(interval => interval.start == projectToAddPMAllocation.startDate);
        let indexEnd =  projectToAddPMAllocation.intervals.findIndex(interval => interval.end == projectToAddPMAllocation.finishDate)

        //this.transformDateForm(projectData)
        return [indexStart,indexEnd];
    }

    projectDurationOutOfRange(intervalRange:any[]) {
        let startIndex = intervalRange[0];
        let endIndex = intervalRange[1];
        if (startIndex === undefined && endIndex === undefined) {
            console.log('note - the project duration out of interval range')
            return true;
        }
        return false;
    }

    // transformDateForm(projectData: any[]): any[] {
        
    //     return [];
    // }
    



    getSelectedProjects(): IResPlan[] {
        


            let resourceplans = this.fb.array(this.resPlans.controls
                .filter(item =>
                    (item.value.selected || item.value.projects.map(p => p.selected == true).length > 0) // res Plan marked for delete or atleast one project in ResPlan marked for delete
                )).controls
                .map(t => {
                    var _resPlan: IResPlan;
                    var _projects: [IProject];
                    var projects = Object.assign([], _projects, this.fb.array(((t as FormGroup).controls['projects'] as FormArray).controls.filter(s => s.value.selected == true)).value)
                    let resPlan = new ResPlan();
                    resPlan.resource = new Resource(t.value.resUid, t.value.resName);
                    resPlan.projects = projects;
                    resPlan["selected"] = (t as FormGroup).controls['selected'].value;
                    console.log(JSON.stringify(resPlan))
                    //resPlan["selected"] = _resPlan["selected"]
                    return resPlan;
                });


            console.log("blocked resPlans" + JSON.stringify(resourceplans));
            console.log('choosen ones? in getSelectedProjects', resourceplans); // this is us.resourceplans for each resource plan.projects (shuffle through projects and do stuff.)
            return resourceplans;
    



    //https://stackoverflow.com/questions/24241462/how-to-search-for-multiple-indexes-of-same-values-in-javascript-array?noredirect=1&lq=1  need for later when doing the select part and multiple projects??
//     var array = [1, 2, 3, 4, 2, 8, 5],
//     value = 2,
//     i = -1,
//     indizes = [];

// while((i = array.indexOf(value, i + 1)) !== -1) {
//     indizes.push(i);
// }
    //
    }

    savePlans(fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits): void {
        ;
        if (this._appSvc.mainFormDirty && this.mainForm.valid) {
            console.log('you best not be runnig)');
            let resourceplans = this.resPlans.controls
                .filter(item => item.dirty === true)
                .map(t => {
                    var _resPlan: IResPlan;
                    var _projects: [IProject];
                    var projects =
                        ((t as FormGroup).controls['projects'] as FormArray).controls.filter(p => p.dirty == true)
                            .map(v => JSON.parse(JSON.stringify(v.value)) as IProject)

                    let resPlan = new ResPlan();
                    resPlan.resource = new Resource(t.value.resUid, t.value.resName);

                    resPlan.projects = projects

                    resPlan.projects.forEach(p => {
                        p.intervals.forEach(i => {
                            if (this._appSvc.queryParams.workunits == WorkUnits.FTE) {
                                i.intervalValue = (+(i.intervalValue.replace('%', '')) / 100).toString()
                            }
                            else if (this._appSvc.queryParams.workunits == WorkUnits.hours) {
                                i.intervalValue = (+(i.intervalValue.replace('hrs', ''))).toString()
                            }
                            else if (this._appSvc.queryParams.workunits == WorkUnits.days) {
                                i.intervalValue = (+(i.intervalValue.replace('d', ''))).toString()
                            }
                        })
                    })

                    return resPlan;
                })



            console.log("dirty resPlans" + JSON.stringify(resourceplans))
            debugger;
            this._appSvc.loading(true);
            this.saveResPlansSub = this._resPlanUserStateSvc.saveResPlans(resourceplans, fromDate, toDate, timescale, workunits)
                .subscribe(
                    (results: Result[]) => this.onSaveComplete(results),
                    (error: any) => {
                        this.errorMessage = <any>error
                        this._appSvc.loading(false);
                    });
        }
        //()
        else if (!this._appSvc.mainFormDirty) {
            //this.onSaveComplete();
        }
    }

    deleteResPlans(fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, hideOnly: boolean): void {
        ;
        if (this.mainForm.valid) {


            let resourceplans = this.fb.array(this.resPlans.controls
                .filter(item =>
                    (item.value.selected || item.value.projects.map(p => p.selected == true).length > 0) // res Plan marked for delete or atleast one project in ResPlan marked for delete
                )).controls
                .map(t => {
                    var _resPlan: IResPlan;
                    var _projects: [IProject];
                    var projects = Object.assign([], _projects, this.fb.array(((t as FormGroup).controls['projects'] as FormArray).controls.filter(s => s.value.selected == true)).value)
                    let resPlan = new ResPlan();
                    resPlan.resource = new Resource(t.value.resUid, t.value.resName);
                    resPlan.projects = projects;
                    resPlan["selected"] = (t as FormGroup).controls['selected'].value;
                    console.log(JSON.stringify(resPlan))
                    //resPlan["selected"] = _resPlan["selected"]
                    return resPlan;
                });


            console.log("blocked resPlans" + JSON.stringify(resourceplans));
            console.log('choosen ones? in deleteResPlans', resourceplans); // this is us.resourceplans for each resource plan.projects (shuffle through projects and do stuff.)
            this._appSvc.loading(true);
            if (hideOnly == true) {
                this._appSvc.loading(true);
                this.getCurrentUserSub = this._resPlanUserStateSvc.getCurrentUserId().flatMap(resMgr => {
                    return this._resPlanUserStateSvc.HideResourcesOrProjects(resMgr, resourceplans as IResPlan[]).map(r => {
                        if (r.success == true) {

                            this.deleteResourcePlans(resourceplans)
                            this._appSvc.loading(false);
                        }
                        else {
                            this._appSvc.loading(false);
                        }
                    },
                        (error: any) => {
                            this.errorMessage = <any>error
                            this._appSvc.loading(false);
                        }
                    )
                },
                    // (error: any) => {
                    //     this.errorMessage = <any>error;
                    //         this._appSvc.loading(false);
                    //     }
                ).subscribe((r) => {
                    this._appSvc.loading(false)

                }, () => { this._appSvc.loading(false) })
            }
            else {
                this.delResPlansSub = this._resPlanUserStateSvc.deleteResPlans(resourceplans, fromDate, toDate, timescale, workunits)
                    .flatMap(
                        (results: Result[]) => {
                            ;
                            this.updateErrors(results);
                            return this._resPlanUserStateSvc.getCurrentUserId().flatMap(resMgr => {
                                resourceplans.forEach(resPlan => {
                                    //if resource marked for selection check if all projects were successful by comparing count of projects prior to upadte and after
                                    let projectsMarkedForDeleteCount = resPlan.projects.length;

                                    resPlan.projects = resPlan.projects.filter(function (p) { return results.findIndex(function (r) { return r.success == true && r.project.projUid.toUpperCase() == p.projUid.toUpperCase(); }) > -1; });
                                    // if(resPlan["selected"] == true)
                                    // {
                                    //    resPlan["selected"] = (projectsMarkedForDeleteCount == resPlan.projects.length);
                                    // }
                                });


                                return this._resPlanUserStateSvc.HideResourcesOrProjects(resMgr, resourceplans as IResPlan[]).map(r => {
                                    if (r.success == true) {
                                        this.deleteResourcePlans(resourceplans)
                                        this._appSvc.loading(false);
                                    }
                                    else {
                                        this._appSvc.loading(false);
                                    }
                                },
                                    // (error: any) => {
                                    //     this.errorMessage = <any>error
                                    //         this._appSvc.loading(false);
                                    //     }
                                )
                            },
                                // (error: any) => {
                                //     this.errorMessage = <any>error
                                //         this._appSvc.loading(false);
                                //     }
                            )
                        }).subscribe(() => { this._appSvc.loading(false) }, () => { this._appSvc.loading(false) })
            }
        }
        //()
        else if (!this._appSvc.mainFormDirty) {
            //this.onSaveComplete();
        }

    }
    onSaveComplete(results: Result[]): void {
        console.log('onSaveComplete() results = ...', results);
        // Reset the form to clear the flags
        //this.mainForm.reset();  
        this.updateErrors(results);

        //here we are looking for projects that saved successfully and then clearing the state
        results.forEach(result => {
            if (result.success == true) {
                var projectUid = result.project.projUid;
                this.resPlans.controls.forEach(resPlan => {
                    (resPlan.get('projects') as FormArray).controls.forEach(project => {
                        if (project.get('projUid').value == projectUid) {
                            project.reset(project.value);
                        }
                    });
                });
            }
        });
        // let frmState = this.mainForm.value;
        //  this.mainForm.reset(frmState);
        // this.mainForm.setValue(frmState);
        this._appSvc.loading(false);
        this._appSvc.mainFormDirty = false

    }
    AnyResPlanSelectedForDeleteOrHide(): boolean {
        console.log('Goodson...anyResPlanSelectedForDeleteOrHide()')
        let selected: boolean = false;
        this.resPlans.controls.forEach(resPlan => {
            if ((resPlan as FormGroup).controls['selected'].value == true) {
                selected = true;
            }
            ((resPlan as FormGroup).controls['projects'] as FormArray).controls.forEach(resPlan => {
                if ((resPlan as FormGroup).controls['selected'].value == true) {
                    selected = true;
                }
            });
        });
        console.log('the choosen ones:', selected);
        return selected;
    }

    AnyResPlanSelectedForHide(): boolean {
        let selected: boolean = false;
        this.resPlans.controls.forEach(resPlan => {
            if ((resPlan as FormGroup).controls['selected'].value == true) {
                selected = true;
            }
        });
        return selected;
    }
    deleteResourcePlans(resPlans: IResPlan[]) {
        ;
        console.log('delete resPlan')
        resPlans.forEach(resPlan => {
            //entire res plan selected for delete
            if (resPlan["selected"] == true) {
                console.log('entire resplan conditional')
                let resPlanCtrlIndex = this.resPlans.controls.findIndex(t => ((t as FormGroup).controls['resUid'].value as string).toUpperCase() == resPlan.resource.resUid.toUpperCase());
                this.resPlans.removeAt(resPlanCtrlIndex);
            }
            // one or more projects selected to delete
            else {
                console.log('one o rmore projects selected to delete conditional')
                let selectedProjects = resPlan.projects.filter(p => p["selected"] == true);
                console.log('werk',selectedProjects);
                let deletedProjectUids = resPlan.projects.filter(p => p["selected"] == true).map(p => p.projUid.toUpperCase())
                let resPlanCtrl = this.resPlans.controls.find(t => ((t as FormGroup).controls['resUid'].value as string).toUpperCase() == resPlan.resource.resUid.toUpperCase()) as FormGroup;
                // let allProjects = resPlanCtrl.value['projects'];
                // let newProjects = allProjects.filter(a=> deletedProjectUids.indexOf(a["projUid"]) > -1);
                deletedProjectUids.forEach(deletedProject => {
                    let index = (resPlanCtrl.controls['projects'] as FormArray).controls.findIndex(t => t.value.projUid.toUpperCase() == deletedProject.toUpperCase());
                    (resPlanCtrl.controls['projects'] as FormArray).removeAt(index);
                })

            }
        });
    }

    //this function activates a print job by minimizing the
    //side bar and printing the window after enough time has
    //elapsed to reflect a full-screen.
    printFunction(): void {
        console.log('this is printFunction inside res-plan-list-component');

        this.menuService.getCurrentView();
        let resetView = this.menuService.getCurrentView();
        // let resetView = this.menuService.getCurrentView();
        if (this._appSvc.mainFormDirty === true) {

            let dialogRef = this.openDialog({ title: "Are You Sure?", content: "You have unsaved changes" })
            this.matDlgSub = dialogRef.afterClosed().subscribe(result => {
                this.confirmDialogResult = result;
                if (result === "yes") {
                    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
                    $.when(this.menuService.printMode())
                        .then(() => wait(1000))
                        .then(() => this.menuService.printerFunction())
                        .then(() => wait(25))
                        .then(() => this.menuService.normalizeView())
                        .catch('failed');
                }
            });

        }
        else {
            const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
            $.when(this.menuService.printMode())
                .then(() => wait(100))
                .then(() => this.menuService.printerFunction())
                .then(() => wait(25))
                .then(() => this.menuService.normalizeView())
                .catch('failed');
        }
    }

    excelExportFunction() {
        console.log(this.resPlanData, "is resplanData");
        //this._exportExcelService.excelObject.transformToCSV(this.resPlanData, 'RM2');

        if (this._appSvc.mainFormDirty === true) {
            let dialogRef = this.openDialog({ title: "Are You Sure?", content: "You have unsaved changes" })
            this.matDlgSub = dialogRef.afterClosed().subscribe(result => {
                this.confirmDialogResult = result;
                if (result == "yes")
                    this._exportExcelService.excelObject.transformToCSV(this.resPlanData, 'RM2');
            });
        }
        else {
            this._exportExcelService.excelObject.transformToCSV(this.resPlanData, 'RM2');
        }
    }


    updateErrors(errors: Result[]) {
        let resultsWithError = errors.filter(e => e.success == false);
        console.log('so-called errors', resultsWithError);
        //reset errors to null before update
        this.resPlans.controls.forEach(resPlan => {
            (resPlan.get('projects') as FormArray).controls.forEach(project => {
                project.patchValue({ error: null })

            });
        });

        this.resPlans.controls.forEach(resPlan => {
            (resPlan.get('projects') as FormArray).controls.forEach(project => {
                if (resultsWithError && resultsWithError.length > 0 && resultsWithError.findIndex(e => e.project.projUid.toUpperCase() == project.get('projUid').value.toUpperCase()) > -1) {
                    project.patchValue({ error: resultsWithError.find(e => e.project.projUid.toUpperCase() == project.get('projUid').value.toUpperCase()).error })
                }

            });
        });
    }

    toggleTimesheetDisplay() {


        this.router.routeReuseStrategy.shouldReuseRoute = function () { return false };
        this.router.isActive = function () { return false; }
        this.router.navigate(['/home/resPlans', this._appSvc.queryParams]);
    }

    intervalChanged(input: any, ctrl: AbstractControl) {
     
        if (!ctrl.errors) {
            if ((event.currentTarget as HTMLInputElement).value && (event.currentTarget as HTMLInputElement).value.trim() != '')
                (event.currentTarget as HTMLInputElement).value = new CellWorkUnitsPipe().transform((event.currentTarget as HTMLInputElement).value, this.workunits);
        }

        this._appSvc.setFormDirty(true);
    }

    getTimesheetButtonText() {

        if (this.showTimesheetData == true) {
            return 'Hide Timesheet Data';

        }

        else {
            return 'Show timesheet Data';
        }
    }
    selectText(element) {
        var myRegexp = /[0-9]*/g;
        element.setSelectionRange(0, myRegexp.exec(element.value)[0].length); //index of where the number ends
    }
}