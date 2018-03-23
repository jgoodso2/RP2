import { Injectable } from '@angular/core';
import { ConfigService, } from './config-service.service'
import { HttpClient, HttpResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Config, Lookup } from '../ResourcePlans/res-plan.model'
import { Observable } from 'rxjs';
@Injectable()
export class ChargebackServiceService {
  config: Config;

  constructor(private _configSvc: ConfigService, private http: HttpClient) {
    this.config = _configSvc.config;
  }

  getChargeBackCustomFieldLookupValues(): Observable<Lookup[]> {
    //console.log("configuration = " + JSON.stringify(this.config))
    let baseUrl = `${this.config.projectServerUrl}/_api/ProjectServer/CustomFields('${this.config.chargebackCustomFieldGuid}')?$expand=LookupEntries`
    //1. get data from SP List UserState 
    let url = baseUrl;
    let headers = new HttpHeaders();
    headers = headers.set('accept', 'application/json;odata=verbose')
      ;
    let options = {
      headers,
      withCredentials: true,
    };
    return this.http.get(url, options)
      .switchMap((data: Response) => {debugger; return data["d"]["LookupEntries"].results}).map(r => {
        debugger;
        let lookup: Lookup = new Lookup();
        lookup.name = r["FullValue"]
        lookup.value = r["Id"];
        return lookup;
      }).toArray();

  }
}
