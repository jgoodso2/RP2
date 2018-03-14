import { Component,ViewChild, OnInit, Inject, Input, Output, EventEmitter, OnDestroy, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { IResPlan, IProject, IInterval } from '../res-plan.model'
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName } from '@angular/forms';


import { Resource, IResource } from '../res-plan.model';
import { SimpleModalComponent } from '../../common/simple-modal.component';
import { ResourcesModalCommunicatorService } from '../../ResourcePlans/resources-modal-communicator.service';
import 'rxjs/add/operator/filter';

import { ResourceService } from '../../services/resource.service'
import {AppStateService} from '../../services/app-state.service'
import { AppUtilService  } from '../../common/app-util.service'
import { Observable,Subscription } from 'Rxjs'

@Component({
  selector: 'resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss']
})
export class ResourceListComponent implements OnInit {
  resData: IResource[];
  selectedResources: IResource[] = [];
  getResourcesSub:Subscription
  resourcesSelectedSub:Subscription
  mdlSubmitSub:Subscription
  resourceList = [];
      settings = {
    selectMode: 'multi',
    actions :{
      edit:false,
      delete:false,
      add:false
    },
    pager:{
      display:true,
      perPage:12
    },
  columns: {
    
    resName: {
      title: 'Resource Name'
    },
    timesheetMgr:
    {
     title:'Timesheet Manager'
    }
  }
  
};
data:IResource[];

  constructor(private fb: FormBuilder, private _resSvc: ResourceService, 
    private _modalResSvc: ResourcesModalCommunicatorService,private _appSvc:AppStateService,private _apputilSvc:AppUtilService) { 
    
  }

  ngOnInit() {
    //
    this.resourcesSelectedSub  = this._modalResSvc.ResourcesSelected$.subscribe((resourcesPicked: IResource[]) => {
      this._appSvc.loading(true);
     this.getResourcesSub =this._resSvc.getResources().subscribe(resources => {
        this.resData = resources
        let filteredResources = this.resData.filter(val => {
       
       if(resourcesPicked.map(t=>t.resName.toUpperCase()).indexOf(val.resName.toUpperCase())< 0)
       return val;
     }) 
        console.log('filtered resources to pick=' + filteredResources.map(t => t.resUid).toString())
        this.resourceList = filteredResources;
        this.data = this.resourceList;
        this._appSvc.loading(false);
      },(error)=>console.log(error))
    },(error)=>{ console.log(error);this._appSvc.loading(false);})

   this.mdlSubmitSub = this._modalResSvc.modalSubmitted$.subscribe(success => this.clear(),
            error => console.log('error'));
  }


     rowClick(event) {
       this.selectResource(event.data.resUid);
    }

  clear() {
    //this._modalResSvc.selectedResources = [];
    this.selectedResources = [];
  }

  

  selectResource(id: string) {
    //;
    //uncheck use case
    if (this.selectedResources.map(t=>t.resUid).indexOf(id) > -1) {
      this.selectedResources.splice(this.selectedResources.map(t=>t.resUid).indexOf(id),1)
   }
    else {
      this.selectedResources.push(this.resData.filter(t => t.resUid == id)[0]);
    }
    this._modalResSvc.selectedResources = this.selectedResources;

  }

  ngOnDestroy()
  {
    this._apputilSvc.safeUnSubscribe(this.getResourcesSub)
    this._apputilSvc.safeUnSubscribe(this.resourcesSelectedSub)
    this._apputilSvc.safeUnSubscribe(this.mdlSubmitSub)
  }

}
