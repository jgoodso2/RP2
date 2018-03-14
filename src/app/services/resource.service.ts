import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IResource, Resource,Config } from '../ResourcePlans/res-plan.model'
//import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { HttpClient, HttpHeaders, HttpInterceptor } from '@angular/common/http'
import {ConfigService} from "./config-service.service"
declare var $: any;
@Injectable()
export class ResourceService {
 
  constructor(private http: HttpClient,private _configSvc:ConfigService) {
      this.config = _configSvc.config;
   }
  config: Config;
  getResources() : Observable<IResource[]>
  {
    let headers = new HttpHeaders();
    //headers.append('accept', 'application/json;odata=verbose')
    //Accept: application/json, text/javascript,
    //Content-Type: application/x-www-form-urlencoded;
    headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type','application/x-www-form-urlencoded')

    let adapterPath = `${this.config.adapterUrl}`;
    // let body = new URLSearchParams();
    
    const body =  `method=PwaGetResourcesCommand&viewguid=${this.config.resourcePickerViewGuid}`  

    console.log('body of resource picker request: ' + body)



    // body.set("method","PwaGetResourcesCommand");
    let options = {
        headers 
        ,cache:true
    };
    console.log("====================================Hitting Adapter get resources = ")
    return this.http.post(
         adapterPath,body,options
        
    ) .map((result: Object[]) => {
        var resources: IResource[] = [];
        for (var i = 0; i < result.length; i++) {
            var newResource = new Resource(result[i]["resUid"], result[i]["resName"]); 

            newResource.timesheetMgr = result[i]["CustomFields"] && result[i]["CustomFields"].find(p=>p.Name == "Timesheet Manager").Value;
           
            resources.push(newResource);
        }
        return resources;
    })
    
            
  }


}
