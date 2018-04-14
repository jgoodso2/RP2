import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IProjectPlan, IResource, IInterval, IProject, Project, Timescale, WorkUnits, Lookup, ProjectPlan, Result } from '../res-plan.model'
import { SimpleModalComponent } from '../../common/simple-modal.component'
import { Observable, Subscription, Subject } from 'rxjs'
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName, } from '@angular/forms';
import { AppStateService } from '../../services/app-state.service'
import { IntervalPipe } from '../../common/interval.pipe'
import { ChargebackModalCommunicatorService } from '../chargeback-modal-communicator.service'
import { ResourcesModalCommunicatorService } from '../resources-modal-communicator.service'
import { ProjectPlanService } from '../../services/project-plan.service'
import { ConfirmDialogComponent } from '../../common/confirm-dialog/confirm-dialog.component'
import { MatDialog, MatDialogRef } from '@angular/material';
import { CellWorkUnitsPipe } from "../../common/cell-work-units.pipe"
@Component({
  selector: 'app-proj-plan-list',
  templateUrl: './proj-plan-list.component.html',
  styleUrls: ['./proj-plan-list.component.scss']
})
export class ProjPlanListComponent implements OnInit {
  @ViewChild('modalChargebacks') private modalChargebacks: SimpleModalComponent;
  @ViewChild('modalresources') private modalResources: SimpleModalComponent;
  //dataSub : Subject<any>  = Observable.from(this.projPlanData)
  dataSub: Subscription
  ///
  mainForm: FormGroup;
  _intervalCount: number = 0;
  projPlanData: IProjectPlan[];
  confirmDialogResult: string;
  errorMessage: any;
  currentFormGroup: FormGroup;
  get chargeBacks(): FormArray {  //this getter should return all instances.
    return <FormArray>this.mainForm.get('chargeBacks');
  }


  constructor(private fb: FormBuilder, private _appSvc: AppStateService, private _route: ActivatedRoute,
    private _chargebackSvc: ChargebackModalCommunicatorService, private _projSvc: ProjectPlanService
    , private router: Router,
    private dialog: MatDialog,
    private _resModalSvc: ResourcesModalCommunicatorService) { }


  ngOnInit() {
    debugger;
    this._appSvc.delete$.subscribe(() => this.openDeleteProjPlanDialog())
    this._appSvc.hide$.subscribe(() => this.deleteProjPlans(this._appSvc.queryParams.fromDate, this._appSvc.queryParams.toDate,
      this._appSvc.queryParams.timescale, this._appSvc.queryParams.workunits, true))
    this._appSvc.save$.subscribe(() => this.savePlans(this._appSvc.queryParams.fromDate, this._appSvc.queryParams.toDate,
      this._appSvc.queryParams.timescale, this._appSvc.queryParams.workunits))
    this._appSvc.showActuals$.subscribe(() => this.toggleTimesheetDisplay())
    this._appSvc.exitToPerview$.subscribe(() => { console.log(''); this.exitToPerView(this._appSvc.mainFormDirty) })
    this._appSvc.exitToBI$.subscribe(() => this.exitToBI(this._appSvc.mainFormDirty))
    this.mainForm = this.fb.group({
      chargeBacks: this.fb.array([]),
    })

    this._appSvc.addChargebacks$.subscribe(() => this.addChargebacks())
    this._route.data.subscribe(values => {
      this.projPlanData = values.projPlans;
      debugger;
      if (this.projPlanData.length > 0) {
        this.setIntervalLength(this.projPlanData.map(t => t.resources).reduce((a, b) => a.concat(b)))
      }
      debugger;
      this.buildProjPlans(this.projPlanData)
    }, (error) => console.log(error))
    // this.projModalSubmission = this._modalSvc.modalSubmitted$.subscribe(() => {
    //     this.addSelectedProjects(this.fromDate, this.toDate, this.timescale, this.workunits, this.showTimesheetData);
    // }, (error) => console.log(error))
    console.log("=========multi subscribe")
    this._chargebackSvc.modalSubmitted$.subscribe(() => {
      debugger;
      this.addSelectedChargebacks()

    }, (error) => console.log(error));
    this._resModalSvc.modalSubmitted$.subscribe(() => {
      this.addSelectedResources(this._appSvc.queryParams.fromDate, this._appSvc.queryParams.toDate,
        this._appSvc.queryParams.timescale, this._appSvc.queryParams.workunits, this._appSvc.queryParams.showTimesheetData);
    }, (error) => console.log(error))
    this.modalChargebacks.modalSubmitted$.subscribe(() => { this._chargebackSvc.modalSubmitClicked() }, (error) => console.log(error));
    this.modalResources.modalSubmitted$.subscribe(() => { this._resModalSvc.modalSubmitClicked() }, (error) => console.log(error));
  }

  exitToPerView(mainFormIsDirty) {
    this.checkForUnsavedChanges(mainFormIsDirty, "https://perviewqa.app.parallon.com/PWA")
  }

  exitToBI(mainFormIsDirty) {
    this.checkForUnsavedChanges(mainFormIsDirty, "https://perviewqa.app.parallon.com/PWA/ProjectBICenter/")
  }

  checkForUnsavedChanges(mainFormDirty, navigateUrl) {
    if (mainFormDirty === true) {
      let dialogRef = this.openDialog({ title: "Are You Sure?", content: "You have unsaved changes" })
      dialogRef.afterClosed().subscribe(result => {
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

  buildProjPlans(projPlans: IProjectPlan[]) {
    debugger;
    //group by charge back
    let groupedChargeBack = this.groupBy(projPlans, 'project', 'projectChargeBackCategory')
    debugger;
    for (var key in groupedChargeBack) {
      let chargeBackGroup = this.buildChargeBack(key, groupedChargeBack[key]);
      this.chargeBacks.push(chargeBackGroup)
    }
  }

  //a group by function to group by second level of hierarcial property on object
  //key is just used to navigate to sub property
  //subKey is the one used for grouping
  groupBy(xs, key, subKey) {
    return xs.reduce(function (rv, x) {
      debugger;
      (rv[x[key][subKey]] = rv[x[key][subKey]] || []).push(x);
      return rv;
    }, {});
  };

  buildChargeBack(chargeBack: string, projPlans: IProjectPlan[]): FormGroup {
    var _totals = this.fb.array([]);
    var chargeBackGroup = this.fb.group({
      chargeBack: chargeBack,
      projPlans: this.fb.array([]),
      totals: this.initTotals(_totals),
      selected: this.fb.control(false)
    })
    for (var i = 0; i < projPlans.length; i++) {
      if (projPlans[i].project.projUid != '') {
        var projPlan = this.buildProjPlan(projPlans[i]);
        (chargeBackGroup.get('projPlans') as FormArray).push(projPlan);
      }
    }

    this.calculateChargebackTotals(chargeBackGroup);
    chargeBackGroup.valueChanges.subscribe(value => {
      this.calculateChargebackTotals(chargeBackGroup)
    }, (error) => console.log(error));
    return chargeBackGroup;
  }

  buildProjPlan(projPlan: IProjectPlan): FormGroup {
    var _totals = this.fb.array([]);
    var projPlanGroup = this.fb.group({
      projUid: projPlan.project.projUid.toLowerCase(),
      projName: projPlan.project.projName,
      startDate: projPlan.project.startDate || '',
      finishDate: projPlan.project.finishDate || '',
      totals: this.initTotals(_totals),
      resources: this.fb.array([]),
      error: this.fb.control(null),
      selected: this.fb.control(false)
    });
    if (projPlan.resources) {
      for (var i = 0; i < projPlan.resources.length; i++) {
        var resource = this.buildResource(projPlan.resources[i]);
        (projPlanGroup.get('resources') as FormArray).push(resource)
      }
    }

    this.calculateProjectPlanTotals(projPlanGroup);
    projPlanGroup.valueChanges.subscribe(value => {
      this.calculateProjectPlanTotals(projPlanGroup)
    }, (error) => console.log(error));
    debugger;
    return projPlanGroup;
  }
  buildResource(resource: IResource): FormGroup {
    debugger;
    var resourceGroup = this.fb.group(
      {
        resUID: resource.resUid,
        resName: [resource.resName],

        intervals: this.fb.array([]),
        timesheetData: this.fb.array([]),
        selected: this.fb.control(false)
      });
    if (resource.intervals) {
      for (var i = 0; i < resource.intervals.length; i++) {
        var interval = this.buildInterval(resource.intervals[i]);
        (resourceGroup.get('intervals') as FormArray).push(interval);
      }
    }

    if (resource.timesheetData) {
      for (var i = 0; i < resource.timesheetData.length; i++) {
        var interval = this.buildtimesheetInterval(resource.timesheetData[i]);
        (resourceGroup.get('timesheetData') as FormArray).push(interval);
      }
    }

    //_project.readOnly && project.disable({emitEvent:false})
    return resourceGroup;
  }

  buildInterval(interval: IInterval): FormGroup {

    return this.fb.group({
      intervalName: interval.intervalName,
      //intervalValue:  new PercentPipe(new IntervalPipe().transform(interval.intervalValue, this.workunits)  ).transform(interval.intervalValue)
      intervalValue: [new CellWorkUnitsPipe().transform(new IntervalPipe().transform(interval.intervalValue, this._appSvc.queryParams.workunits), this._appSvc.queryParams.workunits),
      Validators.pattern(this.getIntervalValidationPattern())],
      intervalStart: interval.start,
      intervalEnd: interval.end

    });
  }

  getIntervalValidationPattern(): string {
    switch (+(this._appSvc.queryParams.workunits)) {
      case WorkUnits.FTE:
        return "^[0-9]+(%)?";
      case WorkUnits.hours:

        return "^[0-9]+(hrs)?";
      case WorkUnits.days:
        return "^[0-9]+([,.][0-9])?(d)?";
    }
    return "";
  }

  checkTotal(val: string) {
    if (this._appSvc.queryParams.workunits == WorkUnits.FTE) {
        if (parseInt(val) > 100) {
            return "totalRed"
        }
        else return "totalGreen"
    }
    else {
      
    }
}

  buildtimesheetInterval(interval: IInterval): FormGroup {

    return this.fb.group({
      intervalName: interval.intervalName,
      //intervalValue:  new PercentPipe(new IntervalPipe().transform(interval.intervalValue, this.workunits)  ).transform(interval.intervalValue)
      intervalValue: new CellWorkUnitsPipe().transform(interval.intervalValue, this._appSvc.queryParams.workunits),
      intervalStart: interval.start,
      intervalEnd: interval.end

    });
  }

  initTotals(totals: FormArray): FormArray {
    if (totals.controls.length < 1) {
      debugger;
      var intervalLen = this.getIntervalLength();
      for (var i = 0; i < intervalLen; i++) {

        var total = this.fb.group({
          intervalName: '',
          intervalValue: new IntervalPipe().transform('0', this._appSvc.queryParams.workunits)
        });
        totals.push(total);
      }
    }
    return totals;
  }

  calculateProjectPlanTotals(fg: FormGroup): void {

    var value = fg.value;

    if (value.readOnly == true)
      return
    for (var i = 0; i < value["totals"].length; i++) {
      var sum = 0;
      for (var j = 0; j < value["resources"].length; j++) {
        if (value["resources"][j]["intervals"].length < 1)
          continue;
        var val = parseInt(value["resources"][j]["intervals"][i]["intervalValue"]);

        if (!val) {
          val = 0;
        }

        sum += val;

      }
      if (this._appSvc.queryParams.workunits == WorkUnits.FTE) {
        sum = sum / 100;
      }
      value["totals"][i]['intervalValue'] = new IntervalPipe().transform(sum.toString()
        , this._appSvc.queryParams.workunits)

    }
    fg.setValue(value, { emitEvent: false });
    //console.log('Totals... ' + JSON.stringify(value) + "      stop....")

  }

  calculateChargebackTotals(fg: FormGroup): void {

    var value = fg.value;

    if (value.readOnly == true)
      return
    for (var i = 0; i < value["totals"].length; i++) {
      var sum = 0;
      for (var k = 0; k < value["projPlans"].length; k++) {
        for (var j = 0; j < value["projPlans"][k]["resources"].length; j++) {
          if (value["projPlans"][k].resources[j]["intervals"].length < 1)
            continue;
          var val = parseInt(value["projPlans"][k].resources[j]["intervals"][i]["intervalValue"]);

          if (!val) {
            val = 0;
          }

          sum += val;

        }
      }
      if (this._appSvc.queryParams.workunits == WorkUnits.FTE) {
        sum = sum / 100;
      }
      value["totals"][i]['intervalValue'] = new IntervalPipe().transform(sum.toString()
        , this._appSvc.queryParams.workunits)

    }
    fg.setValue(value, { emitEvent: false });
    //console.log('Totals... ' + JSON.stringify(value) + "      stop....")

  }
  getIntervalLength() {
    //toDo... thinking about putting interval count in data service
    return this._intervalCount;
  }
  setIntervalLength(resources: IResource[]) {
    debugger;
    if (this._intervalCount < 1) {
      for (var j = 0; j < resources.length; j++) {
        if (resources[j].intervals) {
          this._intervalCount = resources[j].intervals.length;
        }
        return;
      }
    }

  }
  addChargebacks() {
    console.log("add resources fired");
    let chargebacksSelected: Lookup[] = this.chargeBacks.value.map(c => {
      var lookup = new Lookup();
      lookup.name = c.chargeBack;
      lookup.value = c.value;
      return lookup
    })
    //console.log('resources selected=' + JSON.stringify(resourcesSelected))
    debugger;
    this._chargebackSvc.chargebacksSelected(chargebacksSelected)
    this.modalChargebacks.showModal('');
  }

  addSelectedChargebacks() {
    debugger;
    let selectedChargebacks = this._chargebackSvc.selectedChargebacks;
    this._appSvc.loading(true);
    this._projSvc.getCurrentUserId().subscribe(resMgr => {

      console.log('selected chargebacks=' + JSON.stringify(this._chargebackSvc.selectedChargebacks))
      this._projSvc.getProjectPlansFromChargebacks(selectedChargebacks.map(t => t.name), this._appSvc.queryParams.fromDate,
        this._appSvc.queryParams.toDate, this._appSvc.queryParams.timescale, this._appSvc.queryParams.workunits, this._appSvc.queryParams.showTimesheetData)
        .subscribe(plans => {
          debugger;
          this._projSvc.AddChagebacksToManager(resMgr, selectedChargebacks).subscribe(r => {
            if (r.success == true) {
              console.log('added resplans=' + JSON.stringify(plans))
              this.setIntervalLength(plans.map(t => t.resources).reduce((a, b) => a.concat(b)))
              //filter resplan on the resource who got updated in SP list successfully
              this.buildProjPlans(plans)
              this._chargebackSvc.selectedChargebacks = [];
              this._appSvc.loading(false);
              //this.updateTimeSheetDataForResources();
            }
            else {
              this._chargebackSvc.selectedChargebacks = [];
              this._appSvc.loading(false);
            }
          }, (error) => {
            console.log(error); this._appSvc.loading(false);
          })
            , (error) => { console.log(error); this._appSvc.loading(false); }
        })
    }, (error) => { console.log(error); this._appSvc.loading(false); })
  }

  addResources(_projPlan: FormGroup): void {
    //get IResource[] array from current formgroup
    var data = _projPlan.value.projUid;
    this._resModalSvc.ResourcesSelected(_projPlan.value.resources);
    this.modalResources.showModal(data);
    this.currentFormGroup = _projPlan;
  }

  addSelectedResources(fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean) {
    this._appSvc.loading(true);
    let selectedResources = this._resModalSvc.selectedResources;
    this._projSvc.getCurrentUserId().subscribe(resMgr => {
      let project = new Project(this.currentFormGroup.value["projUid"],
        this.currentFormGroup.value["projName"]);
      this._projSvc.addProjects(resMgr, [project], selectedResources,
        fromDate, toDate, timescale, workunits)
        .subscribe(results => {
          this.updateErrors(results);
          this._resModalSvc.selectedResources = [];
          let successfullProjects = results.filter(r => r.success == true).map(t => t.project);
          //projects.filter(p => results.findIndex(r => r.success == true && r.project.projUid.toUpperCase() == p.projUid.toUpperCase()) > -1)
          console.log("===added projects" + JSON.stringify(successfullProjects))

          if (successfullProjects.length > 0) {
            this._projSvc.getProjectPlansFromProject(project, fromDate, toDate, timescale, workunits
            ).subscribe(resPlans => {
              this.buildSelectedResources(resPlans.resources
                .filter(r => selectedResources.map(t => t.resUid).indexOf(r.resUid) > -1))//.filter(r=>r.projUid.toUpperCase))
              //this.header && this.header.setIntervalsFromresPlans(resPlans);
              this.initTotals(this.currentFormGroup.get('totals') as FormArray)
              this.calculateProjectPlanTotals(this.currentFormGroup);
              this.calculateChargebackTotals(this.currentFormGroup.parent as FormGroup);
            });

          }

          this._appSvc.loading(false);
          ``

        })
    }, (error) => { console.log(error); this._appSvc.loading(false); })

  }

  buildSelectedResources(resources: IResource[]): void {
    this.setIntervalLength(resources)
    var intervalLength = this.getIntervalLength();
    for (var k = 0; k < resources.length; k++) {
      let resource: IResource = resources[k];
      // project.intervals = [];
      // for (var i = 0; i < intervalLength; i++) {
      //     project.intervals.push(new Interval('', '0.0'));
      // }

      (this.currentFormGroup.controls['resources'] as FormArray).push(this.buildResource(resource));
    }
  }

  savePlans(fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits): void {
    if (this._appSvc.mainFormDirty && this.mainForm.valid) {

      let projPlans: IProjectPlan[] = [].concat.apply([], this.chargeBacks.controls
        .filter(item => item.dirty === true)
        .map(t => {
          let dirtyProjPlans = (t.get('projPlans') as FormArray).controls.filter(item => item.dirty === true).map(t => t.value as IProjectPlan).map(p => {
            var resources = p.resources;

            let resPlan = new ProjectPlan();
            resPlan.project = new Project(p["projUid"], p["projName"]);
            //deep clone resources
            resPlan.resources = JSON.parse(JSON.stringify(resources));

            resPlan.resources.forEach(p => {
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
          return dirtyProjPlans;
        }))


      console.log("dirty resPlans" + JSON.stringify(projPlans))
      this._appSvc.loading(true);
      this._projSvc.saveProjPlans(projPlans, fromDate, toDate, timescale, workunits)
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

  deleteProjPlans(fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, hideOnly: boolean): void {
    if (this.mainForm.valid) {
      let chargeBacksToDelete: string[] = this.chargeBacks.controls
        .filter(item =>
          // chargeback marked for delete or 
          item.value.selected == true
        )
        .map(t => {
          //deep clone Project Plans 
          return t.value.chargeBack as string;
        });
      let projplans: IProjectPlan[] = [].concat.apply([], this.chargeBacks.controls
        .filter(item =>
          // chargeback marked for delete or 
          (item.value.selected == true
            // or atleast one resource in atleast one project plan in chageback marked for delete
            || item.value.projPlans.filter(p => {
              debugger;
              return p.resources.findIndex(r => r.selected == true) > -1
            }).length > 0

          )
        )
        .map(t => {
          //deep clone Project Plans 
          var projPlans: IProjectPlan[] = JSON.parse(JSON.stringify(t.value.projPlans as IProjectPlan[]))
          projPlans.forEach(projPlan => {
            projPlan.project = new Project(projPlan['projUid'], projPlan['projName']);
            projPlan.project.projectChargeBackCategory = t.value.chargeBack;
            projPlan.resources = projPlan.resources.filter(r => r['selected'] == true);
          });
          return projPlans;
          // var _projPlans :[IProjectPlan];
          // var projPlans = Object.assign([], _projPlans, this.fb.array(((t as FormGroup).controls['projPlans'] as FormArray).controls.filter(s => s.value.resources.map(r=>r.selected == true).length > 0)).value)
          // projPlans.forEach(element => {
          //   let projPlan = new ProjectPlan();
          //   projPlan.project = new Project(t.value.projUid, t.value.projName);
          //   projPlan.resources = resources;
          // });

          // //projPlan["selected"] = (t as FormGroup).controls['selected'].value;
          // console.log(JSON.stringify(resPlan))
          // //resPlan["selected"] = _resPlan["selected"]
          // return resPlan;
        }));



      console.log("dirty projPlans" + JSON.stringify(projplans))
      this._appSvc.loading(true);
      if (hideOnly == true) {
        this._appSvc.loading(true);
        this._projSvc.getCurrentUserId().flatMap(resMgr => {
          return this._projSvc.HideResPlans(resMgr, projplans).map(r => {
            if (r.success == true) {

              this.deleteProjectPlans(projplans, chargeBacksToDelete)
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
        this._projSvc.deleteResPlans(projplans, fromDate, toDate, timescale, workunits)
          .flatMap(
            (results: Result[]) => {
              this.updateErrors(results);
              return this._projSvc.getCurrentUserId().flatMap(resMgr => {
                //grab successful projects
                projplans = projplans.filter(function (p) {
                  return results.findIndex(function (r) {
                    return r.success == true && r.project.projUid.toUpperCase() == p.project.projUid.toUpperCase();
                  }) > -1;
                });




                return this._projSvc.HideResPlans(resMgr, projplans).map(r => {
                  if (r.success == true) {
                    this.deleteProjectPlans(projplans, chargeBacksToDelete)
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

  deleteProjectPlans(projPlans: IProjectPlan[], chargeBacksToDelete: string[]) {
    chargeBacksToDelete.forEach(chargeback => {
      //entire res plan selected for delete

      let chargeBackCtrlIndex = this.chargeBacks.controls
        .findIndex(t => ((t as FormGroup).controls['chargeBack'].value == chargeback));
      this.chargeBacks.removeAt(chargeBackCtrlIndex);
    });
    this.chargeBacks.controls.forEach(chargeback => {

      projPlans.forEach(projPlan => {
        //if chargeback has proj Plan
        let index = (chargeback.get('projPlans') as FormArray).controls.findIndex(t => t.value.projUid == projPlan.project.projUid);
        if (index > -1) {
          // projplan selected for delee
          if (projPlan["seleced"] == true) {
            (chargeback.get('projPlans') as FormArray).removeAt(index)
          }
          //delete resources selected for delete
          else {
            let deletedresUids = projPlan.resources.filter(p => p["selected"] == true).map(p => p.resUid)
            let projPlanCtrl = (chargeback.get('projPlans') as FormArray).controls.find(t => t.value.projUid == projPlan.project.projUid) as FormGroup;
            // // let allProjects = resPlanCtrl.value['projects'];
            // // let newProjects = allProjects.filter(a=> deletedProjectUids.indexOf(a["projUid"]) > -1);
            deletedresUids.forEach(deletedResource => {
              let index = (projPlanCtrl.controls['resources'] as FormArray).controls.findIndex(t => t.value.resUid == deletedResource);
              (projPlanCtrl.controls['resources'] as FormArray).removeAt(index);
            })
          }
        }
      })
    })
  }

  onSaveComplete(results: Result[]): void {
    // Reset the form to clear the flags
    //this.mainForm.reset();  
    this.updateErrors(results);

    //here we are looking for projects that saved successfully and then clearing the state
    results.forEach(result => {
      if (result.success == true) {
        var projectUid = result.project.projUid;
        this.chargeBacks.controls.forEach(chargeback => {
          (chargeback.get('projPlans') as FormArray).controls.forEach(projPlan => {
            if (projPlan.get('projUid').value == projectUid) {
              projPlan.patchValue({ error: null });
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

  updateErrors(errors: Result[]) {
    let resultsWithError = errors.filter(e => e.success == false);
    //reset errors to null before update
    this.chargeBacks.controls.forEach(chargeback => {
      (chargeback.get('projPlans') as FormArray).controls.forEach(projPlan => {
        debugger;
        projPlan.patchValue({ error: null })
      });
    });

    this.chargeBacks.controls.forEach(chargeback => {
      (chargeback.get('projPlans') as FormArray).controls.forEach(projPlan => {
        if (resultsWithError && resultsWithError.length > 0 && resultsWithError.findIndex(e => e.project.projUid.toUpperCase() == projPlan.get('projUid').value.toUpperCase()) > -1) {
          projPlan.patchValue({ error: resultsWithError.find(e => e.project.projUid.toUpperCase() == projPlan.get('projUid').value.toUpperCase()).error })
        }

      });
    });
  }

  toggleTimesheetDisplay() {
    debugger;
    this.router.routeReuseStrategy.shouldReuseRoute = function () { return false };
    this.router.isActive = function () { return false; }
    this.router.navigate(['/home/pivot', { showTimesheetData: true }], { preserveQueryParams: true });
  }

  intervalChanged(input: any, ctrl: AbstractControl) {
    if (!ctrl.errors) {
      if ((event.currentTarget as HTMLInputElement).value && (event.currentTarget as HTMLInputElement).value.trim() != '')
        (event.currentTarget as HTMLInputElement).value = new CellWorkUnitsPipe().transform((event.currentTarget as HTMLInputElement).value
          , this._appSvc.queryParams.workunits);
    }
    this._appSvc.setFormDirty(true);
  }

  DeselectGroupOnUncheck(_chargeBack: FormGroup, _projPlan: FormGroup, _res: FormGroup, value: boolean) {
    _res.controls['selected'].setValue(value, { emitEvent: false });
    if (value == false) {
      _projPlan.controls['selected'].setValue(false, { emitEvent: false });
      _chargeBack.controls['selected'].setValue(false, { emitEvent: false });
    }

    this._appSvc.resourceOrProjectsSelected(this.AnyChargebackSelectedForDelete());
    this._appSvc.resourceSelected(this.AnyProjPlanSelectedForHide());
  }

  toggleChargebackSelection(_chargeback: FormGroup, selected: boolean) {
    _chargeback.controls['selected'].setValue(selected, { emitEvent: false });
    (_chargeback.controls['projPlans'] as FormArray).controls.forEach(projPlan => {
      (projPlan as FormGroup).controls['selected'].setValue(selected, { emitEvent: false });
      ((projPlan as FormGroup).controls['resources'] as FormArray).controls.forEach(resource => {
        (resource as FormGroup).controls['selected'].setValue(selected, { emitEvent: false });
      })
    });
    this._appSvc.resourceOrProjectsSelected(this.AnyChargebackSelectedForDelete());
    this._appSvc.resourceSelected(this.AnyProjPlanSelectedForHide());
  }

  toggleProjPlanSelection(_projPlan: FormGroup, selected: boolean) {
    _projPlan.controls['selected'].setValue(selected, { emitEvent: false });
    (_projPlan.controls['resources'] as FormArray).controls.forEach(resource => {
      (resource as FormGroup).controls['selected'].setValue(selected, { emitEvent: false });
    });
    this._appSvc.resourceOrProjectsSelected(this.AnyChargebackSelectedForDelete());
    this._appSvc.resourceSelected(this.AnyProjPlanSelectedForHide());
  }

  AnyChargebackSelectedForDelete(): boolean {
    let selected: boolean = false;
    this.chargeBacks.controls.forEach(chargeback => {
      if ((chargeback as FormGroup).controls['selected'].value == true) {
        selected = true;
      }
      ((chargeback as FormGroup).controls['projPlans'] as FormArray).controls.forEach(projPlan => {
        if ((projPlan as FormGroup).controls['selected'].value == true) {
          selected = true;
        }
        ((projPlan as FormGroup).controls['resources'] as FormArray).controls.forEach(resource => {
          if ((resource as FormGroup).controls['selected'].value == true) {
            selected = true;
          }
        })
      });
    });
    return selected;
  }

  AnyProjPlanSelectedForHide(): boolean {
    let selected: boolean = false;
    this.chargeBacks.controls.forEach(chargeback => {
      if ((chargeback as FormGroup).controls['selected'].value == true) {
        selected = true;
      }
    });
    return selected;
  }

  openDeleteProjPlanDialog() {
    //if form is dirty
    if (this._appSvc.mainFormDirty) {
      let dialogRef = this.openDialog({
        title: "Can't Delete - Unsaved Changes On Page",
        content: "Click Cancel and then save your changes.   Click OK to erase all changes"
      });
      dialogRef.afterClosed().subscribe(result => {
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
      dialogRef.afterClosed().subscribe(result => {
        this.confirmDialogResult = result;
        if (result == "yes")
          this.deleteProjPlans(this._appSvc.queryParams.fromDate, this._appSvc.queryParams.toDate, this._appSvc.queryParams.timescale,
            this._appSvc.queryParams.workunits, false)
      });
    }
  }

  openDialog(data: any) // the second argument is a callback argument definition in typescript
    : MatDialogRef<any> {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '250px',
      data: data
    });


  }
}
