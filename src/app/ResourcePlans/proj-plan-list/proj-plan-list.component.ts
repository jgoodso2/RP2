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
  errorMessage: any;
  currentFormGroup: FormGroup;
  get chargeBacks(): FormArray {  //this getter should return all instances.
    return <FormArray>this.mainForm.get('chargeBacks');
  }


  constructor(private fb: FormBuilder, private _appSvc: AppStateService, private _route: ActivatedRoute,
    private _chargebackSvc: ChargebackModalCommunicatorService, private _projSvc: ProjectPlanService
    , private _resModalSvc: ResourcesModalCommunicatorService) { }


  ngOnInit() {

    this._appSvc.save$.subscribe(() => this.savePlans(this._appSvc.queryParams.fromDate, this._appSvc.queryParams.toDate,
      this._appSvc.queryParams.timescale, this._appSvc.queryParams.workunits))

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
      totals: this.initTotals(_totals),
      resources: this.fb.array([]),
      error : this.fb.control(null)
      // selected: this.fb.control(false)
    });
    for (var i = 0; i < projPlan.resources.length; i++) {
      var resource = this.buildResource(projPlan.resources[i]);
      (projPlanGroup.get('resources') as FormArray).push(resource)
    }

    this.calculateProjectPlanTotals(projPlanGroup);
    projPlanGroup.valueChanges.subscribe(value => {
      this.calculateProjectPlanTotals(projPlanGroup)
    }, (error) => console.log(error));
    debugger;
    return projPlanGroup;
  }
  buildResource(resource: IResource): FormGroup {
    var resourceGroup = this.fb.group(
      {
        resUID: resource.resUid,
        resName: [resource.resName],

        intervals: this.fb.array([]),
        //timesheetData: this.fb.array([]),
        //selected: this.fb.control(false) 
      });

    for (var i = 0; i < resource.intervals.length; i++) {
      var interval = this.buildInterval(resource.intervals[i]);
      (resourceGroup.get('intervals') as FormArray).push(interval);
    }

    // if (_project.timesheetData) {
    //     for (var i = 0; i < _project.timesheetData.length; i++) {
    //         var interval = this.buildtimesheetInterval(_project.timesheetData[i]);
    //         (project.get('timesheetData') as FormArray).push(interval);
    //     }
    // }

    //_project.readOnly && project.disable({emitEvent:false})
    return resourceGroup;
  }

  buildInterval(interval: IInterval): FormGroup {

    return this.fb.group({
      intervalName: interval.intervalName,
      //intervalValue:  new PercentPipe(new IntervalPipe().transform(interval.intervalValue, this.workunits)  ).transform(interval.intervalValue)
      intervalValue: interval.intervalValue,
      //Validators.pattern(this.getIntervalValidationPattern())],
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
        this._intervalCount = resources[j].intervals.length;
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
         this._projSvc.addProjects(resMgr, [project],selectedResources ,
          fromDate, toDate, timescale, workunits)
          .subscribe(results => {
              this.updateErrors(results);
              this._resModalSvc.selectedResources = [];
              let successfullProjects = results.filter(r => r.success == true).map(t => t.project);
              //projects.filter(p => results.findIndex(r => r.success == true && r.project.projUid.toUpperCase() == p.projUid.toUpperCase()) > -1)
              console.log("===added projects" + JSON.stringify(successfullProjects))

              if (successfullProjects.length > 0) {
                  this._projSvc.getProjectPlansFromProject(project,  fromDate, toDate, timescale, workunits
                      ).subscribe(resPlans => {
                          this.buildSelectedResources(resPlans.resources
                            .filter(r=>selectedResources.map(t=>t.resUid).indexOf(r.resUid) > -1))//.filter(r=>r.projUid.toUpperCase))
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

      let projPlans:IProjectPlan[] = [].concat.apply([],this.chargeBacks.controls
        .filter(item => item.dirty === true)
        .map(t=>{
          let dirtyProjPlans = (t.get('projPlans') as FormArray).controls.filter(item => item.dirty === true).map(t=>t.value as IProjectPlan).map(p=>{
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
                projPlan.patchValue({error:null});
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

  intervalChanged(input: any, ctrl: AbstractControl) {
    // if (!ctrl.errors) {
    //     if ((event.currentTarget as HTMLInputElement).value && (event.currentTarget as HTMLInputElement).value.trim() != '')
    //         (event.currentTarget as HTMLInputElement).value = new CellWorkUnitsPipe().transform((event.currentTarget as HTMLInputElement).value, this.workunits);
    // }
    // debugger;
    this._appSvc.setFormDirty(true);
}
}
