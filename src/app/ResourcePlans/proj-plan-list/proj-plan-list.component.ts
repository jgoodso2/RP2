import { Component, OnInit } from '@angular/core';
import { IProjectPlan, IResource,IInterval,IProject,WorkUnits} from '../res-plan.model'
import { Observable, Subscription, Subject } from 'rxjs'
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName, } from '@angular/forms';
import {AppStateService} from '../../services/app-state.service'
import {IntervalPipe} from '../../common/interval.pipe'
@Component({
  selector: 'app-proj-plan-list',
  templateUrl: './proj-plan-list.component.html',
  styleUrls: ['./proj-plan-list.component.scss']
})
export class ProjPlanListComponent implements OnInit {

  //dataSub : Subject<any>  = Observable.from(this.projPlanData)
  tempData: IProjectPlan[]
  dataSub: Subscription
  ///
  mainForm: FormGroup;
  _intervalCount :number=0;

  

  get chargeBacks(): FormArray {  //this getter should return all instances.
    return <FormArray>this.mainForm.get('chargeBacks');
  }


  constructor(private fb: FormBuilder,private _appSvc:AppStateService) { }


  ngOnInit() {

    let obs1 = Observable.from(this.projPlanData)
    this.dataSub = obs1.subscribe((x) => console.log(JSON.stringify(x)))
    this.mainForm = this.fb.group({
      chargeBacks: this.fb.array([]),
    })
    this.setIntervalLength(this.projPlanData.map(t => t.resources).reduce((a, b) => a.concat(b)))
    this.buildProjPlans(this.projPlanData)
    
  }

  buildProjPlans(projPlans: IProjectPlan[]) {
    debugger;
    //group by charge back
     let groupedChargeBack = this.groupBy(projPlans,'project[projectChargeBackCategory]')
     debugger;
     for(var key in groupedChargeBack){
    let chargeBackGroup = this.buildChargeBack(key,groupedChargeBack[key]);
    this.chargeBacks.push(chargeBackGroup)
     }
  }

  groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
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



  



  projPlanData: IProjectPlan[] = [
    {
      project: {
        projUid: '1',
        projName: 'Test Project 1',
        projectChargeBackCategory : 'Category 1'
      },
      resources: [
        {
          resUid: '0',
          resName: 'John Goodson',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '1',
          resName: 'Nishant',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '20h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '20h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '2',
          resName: 'Christina Wheeler',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
      ]
    },
    {
      project: {
        projUid: '2',
        projName: 'Test Project 2',
        projectChargeBackCategory : 'Category 2'
      },
      resources: [
        {
          resUid: '1',
          resName: 'Nishant Jahagirdar',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '1',
          resName: 'Nishant',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '20h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '20h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
        {
          resUid: '2',
          resName: 'Christina Wheeler',
          intervals: [
            {
              intervalName: 'interval0',
              intervalValue: '40h',
              start: new Date('1/1/2018'),
              end: new Date('1/31/2018')
            },
            {
              intervalName: 'interval1',
              intervalValue: '32h',
              start: new Date('2/1/2018'),
              end: new Date('2/28/2018')
            },
            {
              intervalName: 'interval2',
              intervalValue: '24h',
              start: new Date('3/1/2018'),
              end: new Date('3/31/2018')
            },
            {
              intervalName: 'interval3',
              intervalValue: '124h',
              start: new Date('4/1/2018'),
              end: new Date('4/30/2018')
            },
            {
              intervalName: 'interval4',
              intervalValue: '40h',
              start: new Date('5/1/2018'),
              end: new Date('5/31/2018')
            },
            {
              intervalName: 'interval5',
              intervalValue: '40h',
              start: new Date('6/1/2018'),
              end: new Date('6/30/2018')
            },
            {
              intervalName: 'interval6',
              intervalValue: '40h',
              start: new Date('7/1/2018'),
              end: new Date('7/30/2018')
            },
            {
              intervalName: 'interval7',
              intervalValue: '40h',
              start: new Date('8/1/2018'),
              end: new Date('8/30/2018')
            },
            {
              intervalName: 'interval8',
              intervalValue: '40h',
              start: new Date('9/1/2018'),
              end: new Date('9/30/2018')
            },
            {
              intervalName: 'interval9',
              intervalValue: '40h',
              start: new Date('10/1/2018'),
              end: new Date('10/31/2018')
            },
            {
              intervalName: 'interval10',
              intervalValue: '40h',
              start: new Date('11/1/2018'),
              end: new Date('11/31/2018')
            },
            {
              intervalName: 'interval11',
              intervalValue: '40h',
              start: new Date('12/1/2018'),
              end: new Date('12/31/2018')
            },
          ]
        },
      ]
    }
  ];

}
