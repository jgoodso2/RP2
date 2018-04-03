import { Injectable } from '@angular/core';
import { ConfigService, } from './config-service.service'
import { HttpClient, HttpResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Config, Lookup } from '../ResourcePlans/res-plan.model'
import { Observable } from 'rxjs';
import {ProjectService} from './project-service.service'
@Injectable()
export class ChargebackServiceService {
  config: Config;

  constructor(private _configSvc: ConfigService, private http: HttpClient,private _projSvc:ProjectService) {
    this.config = _configSvc.config;
  }

  getChargeBackCustomFieldLookupValues(): Observable<Lookup[]> {
    return this._projSvc.getProjects().map(projects=>projects.filter(p=>p.projectChargeBackCategory).map(p=>
      {
        if(p.projectChargeBackCategory){
        var lookup = new Lookup();
        lookup.name = p.projectChargeBackCategory
        lookup.value = p.projectChargeBackCategory
        return lookup;
        }
      })).flatMap(l=>{
        return Observable.from(l).distinct(t=>t.name).toArray()
      })
  }
}
