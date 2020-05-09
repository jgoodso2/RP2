import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptor } from '@angular/common/http'

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter'
import { Observable } from 'rxjs/Rx';

import { IProject, Project, Config } from '../resourcePlans/res-plan.model'
import { ConfigService } from "./config-service.service"
declare var $: any;
@Injectable()
export class ProjectService {

    private url: string = 'api/dataservice/';
    public projects: IProject[];
    config: Config;
    constructor(private http: HttpClient, private _configSvc: ConfigService) {
        //let observer = this.getProjects().subscribe(values => this.projects = values);
        this.config = this._configSvc.config;
    }

    handleError(error: any) {
        console.error(error);
        return Observable.throw(error.json().error || 'Server error');
    }


    getProjects(): Observable<IProject[]> {
        console.log('getProjects method called')
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

        let adapterPath = `${this.config.adapterUrl}`
        // let body = new URLSearchParams();

        const body = `method=PwaGetProjectsForEditCommand&viewguid=${this.config.projectPickerViewGuid}`
        let options = {
            headers
        };
        console.log("====================================Hitting Adapter get projects = ")
        return this.http.post(
            adapterPath, body, options

        ).map((project: Object[]) => {
            var projects: IProject[] = [];
            for (var i = 0; i < project.length; i++) {
                var newProject = new Project(project[i]["projUid"], project[i]["projName"]);
                newProject.owner = project[i]["CustomFields"] && project[i]["CustomFields"].find(p => p.Name == "Owner")
                    && project[i]["CustomFields"].find(p => p.Name == "Owner").Value;
                newProject.projectChargeBackCategory = project[i]["CustomFields"] && project[i]["CustomFields"].find(p => p.Name == "Project Chargeback Category") && project[i]["CustomFields"] && project[i]["CustomFields"]
                    .find(p => p.Name == "Project Chargeback Category").Value
                newProject.departments = project[i]["CustomFields"] && project[i]["CustomFields"].find(p => p.Name == "Project Departments") && project[i]["CustomFields"] && project[i]["CustomFields"]
                    .find(p => p.Name == "Project Departments").Value
                newProject.startDate = new Date(project[i]["CustomFields"] && project[i]["CustomFields"].find(p => p.Name == "Start") && project[i]["CustomFields"] && project[i]["CustomFields"]
                    .find(p => p.Name == "Start").Value).toDateString();
                newProject.finishDate = new Date(project[i]["CustomFields"] && project[i]["CustomFields"].find(p => p.Name == "Finish") && project[i]["CustomFields"] && project[i]["CustomFields"]
                    .find(p => p.Name == "Finish").Value).toDateString();
                    //lets check for null first
                newProject.projActiveStatus = project[i]["CustomFields"].find(p => p.Name == "Project Active Status").Value
                newProject.pmAllocation = project[i]["CustomFields"].find(p => p.Name == "PM Allocation").Value

            
                projects.push(newProject);
            }

            return projects;
        })
            .catch(this.handleError);
    }
}