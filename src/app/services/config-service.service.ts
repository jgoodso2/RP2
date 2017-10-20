import { Injectable,APP_INITIALIZER } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Config } from '../resourcePlans/res-plan.model'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap'

@Injectable()
export class ConfigService {
  public config:Config;
  constructor(private http: Http) { 
      
  }

  ReadConfig()
  {
    return new Promise((resolve, reject) => {
     return this.http.get("assets/configuration/main-config.jso").subscribe(t=>{
      console.log("configuration map= " + JSON.stringify(t.json()))
        this.config = t.json() as Config
        resolve(true);
      })
      
    })
  }
  }


