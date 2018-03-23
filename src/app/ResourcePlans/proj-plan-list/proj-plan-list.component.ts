import { Component, OnInit ,ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IProjectPlan, IResource,IInterval,IProject,WorkUnits, Lookup} from '../res-plan.model'
import { SimpleModalComponent } from '../../common/simple-modal.component'
import { Observable, Subscription, Subject } from 'rxjs'
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName, } from '@angular/forms';
import {AppStateService} from '../../services/app-state.service'
import {IntervalPipe} from '../../common/interval.pipe'
import {ChargebackModalCommunicatorService} from '../chargeback-modal-communicator.service'
@Component({
  selector: 'app-proj-plan-list',
  templateUrl: './proj-plan-list.component.html',
  styleUrls: ['./proj-plan-list.component.scss']
})
export class ProjPlanListComponent implements OnInit {
  @ViewChild('modalChargebacks') private modalChargebacks: SimpleModalComponent;
  //dataSub : Subject<any>  = Observable.from(this.projPlanData)
  dataSub: Subscription
  ///
  mainForm: FormGroup;
  _intervalCount :number=0;
  projPlanData : IProjectPlan[];
  

  get chargeBacks(): FormArray {  //this getter should return all instances.
    return <FormArray>this.mainForm.get('chargeBacks');
  }


  constructor(private fb: FormBuilder,private _appSvc:AppStateService , private _route: ActivatedRoute,
  private _chargebackSvc:ChargebackModalCommunicatorService) { }


  ngOnInit() {

    
    
    this.mainForm = this.fb.group({
      chargeBacks: this.fb.array([]),
    })

    this._appSvc.addChargebacks$.subscribe(() => this.addChargebacks())
    this._route.data.subscribe(values => {
      this.projPlanData = values.projPlans;
    this.setIntervalLength(this.projPlanData.map(t => t.resources).reduce((a, b) => a.concat(b)))
    this.buildProjPlans(this.projPlanData)
    });
    
  }

  buildProjPlans(projPlans: IProjectPlan[]) {
    debugger;
    //group by charge back
     let groupedChargeBack = this.groupBy(projPlans,'project','projectChargeBackCategory')
     debugger;
     for(var key in groupedChargeBack){
    let chargeBackGroup = this.buildChargeBack(key,groupedChargeBack[key]);
    this.chargeBacks.push(chargeBackGroup)
     }
  }

  //a group by function to group by second level of hierarcial property on object
  //key is just used to navigate to sub property
  //subKey is the one used for grouping
  groupBy(xs, key,subKey) {
    return xs.reduce(function(rv, x) {
      debugger;
      (rv[x[key][subKey]] = rv[x[key][subKey]] || []).push(x);
      return rv;
    }, {});
  };

  buildChargeBack(chargeBack:string,projPlans:IProjectPlan[]) : FormGroup
  {
      var chargeBackGroup = this.fb.group({
        chargeBack:chargeBack,
        projPlans : this.fb.array([])
      })
          for (var i = 0; i < projPlans.length; i++) {
          var projPlan = this.buildProjPlan(projPlans[i]);
          (chargeBackGroup.get('projPlans') as FormArray).push(projPlan);
        }
   return chargeBackGroup;
  }

    buildProjPlan(projPlan: IProjectPlan): FormGroup {
       var _totals = this.fb.array([]);
      var projPlanGroup = this.fb.group({
        projUid: projPlan.project.projUid.toLowerCase(),
        projName: projPlan.project.projName,
        totals: this.initTotals(_totals, projPlan.resources),
        resources: this.fb.array([]),
        // selected: this.fb.control(false)
      });
      for (var i = 0; i < projPlan.resources.length; i++) {
        var resource = this.buildResource(projPlan.resources[i]);
        (projPlanGroup.get('resources') as FormArray).push(resource)
      }

      this.calculateTotals(projPlanGroup);
       projPlanGroup.valueChanges.subscribe(value => {
          this.calculateTotals(projPlanGroup)
      }, (error) => console.log(error));
      debugger;
      return projPlanGroup;
    }
    buildResource(resource: IResource) : FormGroup {
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

    initTotals(totals: FormArray, _projects: IResource[]): FormArray {
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

    calculateTotals(fg: FormGroup): void {
      
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
}
