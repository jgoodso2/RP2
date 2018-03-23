import { Component, ViewChild, OnInit, Inject, Input, Output, EventEmitter, OnDestroy, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { IResPlan, IProject, IInterval } from '../res-plan.model'
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName } from '@angular/forms';


import { Lookup } from '../res-plan.model';
import { SimpleModalComponent } from '../../common/simple-modal.component';
import { ChargebackModalCommunicatorService } from '../../ResourcePlans/chargeback-modal-communicator.service';
import 'rxjs/add/operator/filter';

import { ChargebackServiceService } from '../../services/chargeback-service.service'
import{ AppStateService} from '../../services/app-state.service'
import { AppUtilService  } from '../../common/app-util.service'
import { Observable,Subscription } from 'Rxjs'

@Component({
  selector: 'chargeback-list',
  templateUrl: './chargeback-list.component.html',
  styleUrls: ['./chargeback-list.component.scss']
})
export class ChargebackListComponent implements OnInit {

  @Input() lookupData: Lookup[];
  selectedLookups: Lookup[] = [];
  @Input() projPlan: FormGroup

  getLookupSub:Subscription
  lookupAssngdToResSub:Subscription
  mdlSubmitSub:Subscription
  lookupList = [];
  settings = {
    selectMode: 'multi',
    actions :{
      edit:false,
      delete:false,
      add:false
    },
    pager:{
      display:true,
      perPage:10
    },
  columns: {
    name: {
      title: 'Chargeback',
      width: '100%'
    }
  }
  
};
data:Lookup[];

  constructor(private fb: FormBuilder, private _modalSvc: ChargebackModalCommunicatorService, private _chargebackSvc: ChargebackServiceService
    ,private _appSvc:AppStateService, private _appUtilSvc: AppUtilService
  ) { }


  ngOnInit(): void {
    
    console.log('chargeback list component created'); 

   this.lookupAssngdToResSub = this._modalSvc.chargebackSelected$.subscribe((lookupsInPP: Lookup[]) => {
      this._appSvc.loading(true);
    this.getLookupSub = this._chargebackSvc.getChargeBackCustomFieldLookupValues().subscribe(lookups => {

        this.lookupData = lookups
        console.log('OBSERVABLE FIRED ON PROJECT LIST')
        let filteredLookups = this.lookupData.filter(val => {
          if (lookupsInPP.map(t => t.name.toUpperCase()).indexOf(val.name.toUpperCase()) < 0)
            return val;
        }, (error) => console.log(error))
        //console.log('all projects in RP=' + projectsInRP.map(t => t.projUid).toString())
        //console.log('projects to show on modal=' + filteredProjects.map(t => t.projUid).toString())
        this.lookupList = filteredLookups;
        this.data =filteredLookups;
        this._appSvc.loading(false);
      })

    }, (error) => {console.log(error);this._appSvc.loading(false);})
    this.mdlSubmitSub = this._modalSvc.modalSubmitted$.subscribe(success => this.clear(),
      error => console.log('error'));
  }

  rowClick(event) {
    this.selectLookup(event.data.value);
  }

  clear() {
    //this._modalSvc.selectedProjects = [];
    this.selectedLookups = [];
  }

  selectLookup(id: string) {
    //;
    //uncheck use case
   
    if (this.selectedLookups.map(t=>t.value).indexOf(id) > -1) {
       this.selectedLookups.splice(this.selectedLookups.map(t=>t.value).indexOf(id),1)
    }
    else {
      this.selectedLookups.push(this.lookupData.filter(t => t.value == id)[0]);
    }
    this._modalSvc.selectedChargebacks = this.selectedLookups;

  }


  ngOnDestroy() {
   // console.log("hey its gone")
   this._appUtilSvc.safeUnSubscribe(this.getLookupSub)
   this._appUtilSvc.safeUnSubscribe(this.lookupAssngdToResSub)
   this._appUtilSvc.safeUnSubscribe(this.mdlSubmitSub)
  

  }


}
