import { Component, ViewChild, OnInit, Inject, Input, Output, EventEmitter, OnDestroy, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { IResPlan, IProject, IInterval } from '../res-plan.model'
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName } from '@angular/forms';


import { ResPlan, Project, Interval, ProjectActiveStatus } from '../res-plan.model';
import { SimpleModalComponent } from '../../common/simple-modal.component';
import { ModalCommunicator } from '../../ResourcePlans/modal-communicator.service';
import 'rxjs/add/operator/filter';

import { ProjectService } from '../../services/project-service.service'
import{ AppStateService} from '../../services/app-state.service'
import { AppUtilService  } from '../../common/app-util.service'
import { ProjectListFilterPipe } from '../../common/project-list-filter.pipe'
import { Observable,Subscription } from 'Rxjs'

@Component({
  selector: 'project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})


export class ProjectListComponent implements OnInit {

  @Input() projData: IProject[];
  selectedProjects: IProject[] = [];
  @Input() resPlan: FormGroup

  getProjectsSub:Subscription
  projectsAssngdToResSub:Subscription
  mdlSubmitSub:Subscription
  projectList = [];
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
    // id: {
    //   projUid: 'Project UID',
    //   title:'id'
    // },
    projName: {
      title: 'Project Name',
      width: '250px'
    }
    ,
    owner :
    {
       title:'Project Manager',
       width: '200px'
    },

    projActiveStatus :
    {
       title:'Project Status',
       width: '100px'
    },

    projectChargeBackCategory :
    {
      title:'Chargeback Category',
      width: '200px'
    }
    // ,departments:
    // {
    //   title:'Departments'
    // }
    
    
  }
  
};
data:IProject[];

  constructor(private fb: FormBuilder, private _modalSvc: ModalCommunicator, private _projSvc: ProjectService
    ,private _appSvc:AppStateService, private _appUtilSvc: AppUtilService
  ) { }


  ngOnInit(): void {
    
    console.log('project list component created'); 

   this.projectsAssngdToResSub = this._modalSvc.projectsAssignedToResource$.subscribe((projectsInRP: IProject[]) => {
      this._appSvc.loading(true);
    this.getProjectsSub = this._projSvc.getProjects().subscribe(projects => {

        this.projData = projects
        console.log('OBSERVABLE FIRED ON PROJECT LIST')
        let filteredProjects = this.projData.filter(val => {
          if (projectsInRP.map(t => t.projUid.toUpperCase()).indexOf(val.projUid.toUpperCase()) < 0)
            return val;
        }, (error) => console.log(error))
        //console.log('all projects in RP=' + projectsInRP.map(t => t.projUid).toString())
        //console.log('projects to show on modal=' + filteredProjects.map(t => t.projUid).toString())
        this.projectList = filteredProjects;
        this.data =filteredProjects;
        this._appSvc.loading(false);
      })

    }, (error) => {console.log(error);this._appSvc.loading(false);})
    this.mdlSubmitSub = this._modalSvc.modalSubmitted$.subscribe(success => this.clear(),
      error => console.log('error'));
  }

  rowClick(event) {
    this.selectProject(event.data.projUid);
  }

  clear() {
    //this._modalSvc.selectedProjects = [];
    this.selectedProjects = [];
  }

  selectProject(id: string) {
    //;
    //uncheck use case
   
    if (this.selectedProjects.map(t=>t.projUid).indexOf(id) > -1) {
       this.selectedProjects.splice(this.selectedProjects.map(t=>t.projUid).indexOf(id),1)
    }
    else {
      this.selectedProjects.push(this.projData.filter(t => t.projUid == id)[0]);
    }
    this._modalSvc.selectedProjects = this.selectedProjects;

  }


  ngOnDestroy() {
   // console.log("hey its gone")
   this._appUtilSvc.safeUnSubscribe(this.getProjectsSub)
   this._appUtilSvc.safeUnSubscribe(this.projectsAssngdToResSub)
   this._appUtilSvc.safeUnSubscribe(this.mdlSubmitSub)
  

  }


}

