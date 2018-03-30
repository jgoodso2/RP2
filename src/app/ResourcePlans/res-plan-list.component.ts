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
import { ModalCommunicator } from '../ResourcePlans/modal-communicator.service';
import { ProjectService } from '../services/project-service.service'
import { ResourcePlanService } from '../services/resource-plan.service'
import { ResourcePlanUserStateService } from '../services/resource-plan-user-state.service'
import { ResourcesModalCommunicatorService } from '../ResourcePlans/resources-modal-communicator.service'
import { AppUtilService } from '../common/app-util.service'
import { ResPlanHeaderRowComponent } from "../ResourcePlans/res-plan-header-row/res-plan-header-row.component"
import { AppStateService } from '../services/app-state.service'
import { MenuService } from '../../fw/services/menu.service';
import { ExportExcelService } from '../services/export-excel.service';
import { elementAt } from 'rxjs/operators/elementAt';
import { Subscription } from 'rxjs/Subscription'
import { Subscriber } from 'rxjs/Subscriber'


declare const $: any
declare const window: Window;


@Component({
    selector: 'resplan-list',
    templateUrl: './res-plan-list.component.html',
    styleUrls: ['./res-plan-list.component.css']
})


export class ResPlanListComponent implements OnInit {

    @ViewChild('modalProjects') private modalProjects: SimpleModalComponent;
    @ViewChild('modalResources') private modalResources: SimpleModalComponent;
    @ViewChild('header') private header: ResPlanHeaderRowComponent;


    mainForm: FormGroup;
    resPlanData: IResPlan[] = [];
    projData: IProject[];
    currentFormGroup: FormGroup;
    errorMessage: any;
    _intervalCount: number = 0;
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
            this.resPlanData = values.resPlans;
            //this.resPlans = values.resPlans;
            if (values.resPlans && values.resPlans.length > 0)
                this.setIntervalLength((<IResPlan[]>values.resPlans).map(t => t.projects).reduce((a, b) => a.concat(b)))
            this.buildResPlans(values.resPlans);
            //console.log(JSON.stringify(values.resPlans))
        }, (error) => console.log(error))
        this.projModalSubmission = this._modalSvc.modalSubmitted$.subscribe(() => {
            this.addSelectedProjects(this.fromDate, this.toDate, this.timescale, this.workunits, this.showTimesheetData);
        }, (error) => console.log(error))
        console.log("=========multi subscribe")
        this.resModalSubmission = this._resModalSvc.modalSubmitted$.subscribe(() => {
            this.addSelectedResources()

        }, (error) => console.log(error));


        //this.modalResources.modalSubmitted$.subscribe(() => this._resModalSvc.modalSubmitClicked(), (error) => console.log(error));
        //this.modalProjects.modalSubmitted$.subscribe(() => this._modalSvc.modalSubmitClicked(), (error) => console.log(error));
        //what is this below??
        this.resModalEmit = this.modalResources.modalSubmitted$.subscribe(() => { this._resModalSvc.modalSubmitClicked() }, (error) => console.log(error));
        this.projModalEmit = this.modalProjects.modalSubmitted$.subscribe(() => { this._modalSvc.modalSubmitClicked() }, (error) => console.log(error));
    }


    ngAfterViewChecked(): void {
        //console.log('ng after view checke fired.')
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
    }
    safeUnSubscrbe(sub: Subscription) {
        if (sub) {
            sub.unsubscribe();
        }
    }


    exitToPerView(mainFormIsDirty) {

        this.checkForUnsavedChanges(mainFormIsDirty, "https://perviewqa.app.parallon.com/PWA")

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

        this.checkForUnsavedChanges(mainFormIsDirty, "https://perviewqa.app.parallon.com/PWA/ProjectBICenter/")

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
                var val = parseInt(value["projects"][j]["intervals"][i]["intervalValue"]);

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
        fg.setValue(value, { emitEvent: false });
        //console.log('Totals... ' + JSON.stringify(value) + "      stop....")

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
        //let resPlansGrp :FormGroup[] = [];
        //console.log('add resources ==========================================' + JSON.stringify(plans));
        for (var i = 0; i < plans.length; i++) {
            var resPlan = this.buildResPlan(plans[i]);
            this.resPlans.push(resPlan);
        }
        //this.resPlans.push.apply(resPlansGrp)
    }

    buildResPlan(_resplan: IResPlan): FormGroup {
        var _totals = this.fb.array([]);
        var resPlanGroup = this.fb.group({
            resUid: _resplan.resource.resUid.toLowerCase(),
            resName: _resplan.resource.resName,
            totals: this.initTotals(_totals, _resplan.projects),
            projects: this.fb.array([]),
            selected: this.fb.control(false)
        });
        for (var i = 0; i < _resplan.projects.length; i++) {
            var project = this.buildProject(_resplan.projects[i]);
            (resPlanGroup.get('projects') as FormArray).push(project)
        }

        this.calculateTotals(resPlanGroup);
        this.resPlanGroupChangesSub = resPlanGroup.valueChanges.subscribe(value => {
            this.calculateTotals(resPlanGroup)
        }, (error) => console.log(error));
        return resPlanGroup;
    }

    buildProject(_project: IProject) {
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
            var interval = this.buildInterval(_project.intervals[i]);
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

    buildInterval(interval: IInterval): FormGroup {

        return this.fb.group({
            intervalName: interval.intervalName,
            //intervalValue:  new PercentPipe(new IntervalPipe().transform(interval.intervalValue, this.workunits)  ).transform(interval.intervalValue)
            intervalValue: [new CellWorkUnitsPipe().transform(new IntervalPipe().transform(interval.intervalValue, this.workunits), this.workunits),
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
            intervalEnd: interval.end

        });
    }

    initTotals(totals: FormArray, _projects: IProject[]): FormArray {
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
                debugger;
                if (result == "yes") {
                    debugger
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

        ;
        _resPlan.controls['selected'].setValue(selected, { emitEvent: false });
        (_resPlan.controls['projects'] as FormArray).controls.forEach(element => {
            (element as FormGroup).controls['selected'].setValue(selected, { emitEvent: false })
        });
        this._appSvc.resourceOrProjectsSelected(this.AnyResPlanSelectedForDelete());
        this._appSvc.resourceSelected(this.AnyResPlanSelectedForHide());
    }
    DeselectGroupOnUncheck(_resPlan: FormGroup, _proj: FormGroup, value: boolean) {
        _proj.controls['selected'].setValue(value, { emitEvent: false });
        if (value == false) {
            _resPlan.controls['selected'].setValue(false, { emitEvent: false });
        }

        this._appSvc.resourceOrProjectsSelected(this.AnyResPlanSelectedForDelete());
        this._appSvc.resourceSelected(this.AnyResPlanSelectedForHide());
    }
    addProject(_resPlan: FormGroup): void {
        //get IProjects[] array from current formgroup

        var data = _resPlan.value.resUid;
        this._modalSvc.projectsAssigned(_resPlan.value.projects);
        //console.log('projects in RP = ' + JSON.stringify(_resPlan.value.projects))
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
                    debugger;
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
            this.addProjectsSub = this._resPlanUserStateSvc.addProjects(resMgr, this._modalSvc.selectedProjects, resource,
                fromDate, toDate, timescale, workunits)
                .subscribe(results => {
                    //let projects = this._modalSvc.selectedProjects;
                    this.updateErrors(results);
                    this._modalSvc.selectedProjects = [];
                    ;
                    let successfullProjects = results.filter(r => r.success == true).map(t => t.project);
                    //projects.filter(p => results.findIndex(r => r.success == true && r.project.projUid.toUpperCase() == p.projUid.toUpperCase()) > -1)
                    console.log("===added projects" + JSON.stringify(successfullProjects))

                    if (successfullProjects.length > 0) {
                        this.getResPlansFromProjectsSub = this._resPlanUserStateSvc.getResPlansFromProjects(resource.resUid, [resource],
                            Observable.of([new ResPlan(resource, successfullProjects)]), fromDate, toDate, timescale, workunits
                            , showTimesheetData).subscribe(resPlans => {
                                this.buildSelectedProjects(resPlans[0].projects)//.filter(r=>r.projUid.toUpperCase))
                                this.header && this.header.setIntervalsFromresPlans(resPlans);
                                this.initTotals(this.currentFormGroup.get('totals') as FormArray, resPlans[0].projects)
                                this.calculateTotals(this.currentFormGroup);

                            });

                    }

                    this._appSvc.loading(false);


                })
        }, (error) => { console.log(error); this._appSvc.loading(false); })
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


    buildSelectedProjects(projects: IProject[]): void {
        ;
        this.setIntervalLength(projects)
        var intervalLength = this.getIntervalLength();
        for (var k = 0; k < projects.length; k++) {
            let project: IProject = projects[k];
            // project.intervals = [];
            // for (var i = 0; i < intervalLength; i++) {
            //     project.intervals.push(new Interval('', '0.0'));
            // }

            (this.currentFormGroup.controls['projects'] as FormArray).push(this.buildProject(project));
        }
    }

    savePlans(fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits): void {
        ;
        if (this._appSvc.mainFormDirty && this.mainForm.valid) {

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



            console.log("dirty resPlans" + JSON.stringify(resourceplans))
            this._appSvc.loading(true);
            if (hideOnly == true) {
                this._appSvc.loading(true);
                this.getCurrentUserSub = this._resPlanUserStateSvc.getCurrentUserId().flatMap(resMgr => {
                    return this._resPlanUserStateSvc.HideResPlans(resMgr, resourceplans as IResPlan[]).map(r => {
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
                    (error: any) => {
                        this.errorMessage = <any>error;
                        this._appSvc.loading(false);
                    }
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


                            return this._resPlanUserStateSvc.HideResPlans(resMgr, resourceplans as IResPlan[]).map(r => {
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
                            (error: any) => {
                                this.errorMessage = <any>error;
                                this._appSvc.loading(false);
                            }
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
    AnyResPlanSelectedForDelete(): boolean {
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
        resPlans.forEach(resPlan => {
            //entire res plan selected for delete
            if (resPlan["selected"] == true) {
                let resPlanCtrlIndex = this.resPlans.controls.findIndex(t => ((t as FormGroup).controls['resUid'].value as string).toUpperCase() == resPlan.resource.resUid.toUpperCase());
                this.resPlans.removeAt(resPlanCtrlIndex);
            }
            // one or more projects selected to delete
            else {
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
    }


    updateErrors(errors: Result[]) {
        let resultsWithError = errors.filter(e => e.success == false);

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
        debugger;
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

}