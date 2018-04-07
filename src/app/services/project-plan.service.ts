import { Injectable, ReflectiveInjector } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { ConfigService } from './config-service.service';
import { ProjectService } from './project-service.service'
import { LastYear, CurrentCalendarYear } from '../common/utilities'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap'
import { Observable } from 'rxjs';
import * as moment from 'moment'
import { IProject, Project, WorkUnits, Timescale, IInterval, Interval, IResource, Resource, Config, Result, IProjectPlan, ProjectPlan, Lookup } from '../ResourcePlans/res-plan.model'

@Injectable()
export class ProjectPlanService {

  config: Config;
  constructor(private http: HttpClient, private _configSvc: ConfigService,private _projectService:ProjectService) {
    this.config = _configSvc.config;
  }

  getProjectIdsFromChargebacks(chargebackValues: string[]): Observable<IProject[]> {
    return this._projectService.getProjects().flatMap(projects => {
      return projects.filter(p => {
        return chargebackValues.indexOf(p.projectChargeBackCategory) > -1
      })
    }).toArray()
  }
  getProjectPlansFromProject(project: IProject, fromDate: Date, toDate: Date,
    timescale: Timescale, workunits: WorkUnits)
    : Observable<IProjectPlan> {
      return this.getProjectPlan(`${this.config.projectServerUrl}`, project, fromDate, toDate, timescale, workunits)
    }
  getProjectPlansFromChargebacks(chargebacks: string[], fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean): Observable<IProjectPlan[]> {

    let emptyProjPlans: IProjectPlan[] = chargebacks.map(r => {
      var pp = new ProjectPlan()
      pp.project = new Project();
      pp.project.projectChargeBackCategory = r;
      return pp;
    })

    let projects = this.getProjectIdsFromChargebacks(chargebacks);
    var uniqueProjects = projects.flatMap(p => Observable.from(p)).distinct(p => p.projUid);

    return uniqueProjects.flatMap((project: IProject) => {
      return this.getProjectPlan(`${this.config.projectServerUrl}`, project, fromDate, toDate, timescale, workunits)


    })
    .toArray()
    .flatMap(t=>t.concat(emptyProjPlans))
    .toArray()
      
      // .flatMap(t => { ; return t; }).
      // groupBy(t => { return t.resource.resUid.toUpperCase() }).flatMap(group => {

      //   return group.reduce(function (a, b) {
      //     // if(group.key === "00000000-0000-0000-0000-000000000000")
      //     // {
      //     //     resProjMap.forEach(resPlan => {
      //     //        resPlan.projects.forEach(project => {
      //     //            if(a.projects.concat(b.projects).map(p=>p.projUid.toUpperCase()).indexOf(project.projUid.toUpperCase()) > -1)
      //     //            {
      //     //               project.readOnly = true;
      //     //            }
      //     //        }); 
      //     //     });
      //     // }
      //     for (var i = 0; i < b.projects.length; i++) {
      //       if (a.projects.findIndex(t => t.projUid.toUpperCase() == b.projects[i].projUid.toUpperCase()) < 0)
      //         a.projects = a.projects.concat(b.projects[i]);
      //     }
      //     return a; // returns object with property x
      //   })

      // })
      // .toArray()
      // //.do(t => console.log("RES PLANS READ =====" + JSON.stringify(t)))
      // .filter(pps => {
      //   return pp
      //   pps.forEach(pp => {

      //     //weed out stale publish projects
      //     rp.projects = rp.projects.filter(p => p.stalePublish == false && p.intervals && p.intervals.length > 0);
      //     rp.projects = rp.projects.sort((a, b) => {
      //       return a.projName.localeCompare(b.projName);
      //     })
      //   })
      //   rps.findIndex(r => r.resource.resUid.toUpperCase() == "00000000-0000-0000-0000-000000000000") > -1 &&
      //     rps.splice(rps.findIndex(r => r.resource.resUid.toUpperCase() == "00000000-0000-0000-0000-000000000000"), 1)
      //   return rps;
      // })
      // .flatMap(pps => {

      //   if (showTimesheetData == true) {
      //     return Observable.forkJoin(pps.map(pp =>{
      //       return this.getTimesheetDataFromResource(pp, workunits)
      //     }));
      //   }
      //   else {
      //     return Observable.of(pps);
      //   }
      // })
      .map(pp => {
        debugger;
        return pp.sort((a, b) => {
          if (a.project.projName < b.project.projName) return -1;
          if (a.project.projName > b.project.projName) return 1;
          return 0;
        })
      })

  }

  getUniqueChargebacksForResManager(resUid: string): Observable<string[]> {
    let baseUrl = `${this.config.ResPlanUserStateUrl}/Items`

    //remember to change UID0 to UID
    let select = '$select=Chargebacks'  //dev
    //let select = '$select=ResourceUID'  //qa
    let filter = `$filter=ResourceManagerUID eq '${resUid}'`;
    //1. get data from SP List UserState 
    let url = baseUrl + '?' + filter + '&' + select;
    let headers = new HttpHeaders();
    headers = headers.set('accept', 'application/json;odata=verbose')

        ;
    let options = {
        headers
    };
    return this.http.get(url, options)
        .map((data: Response) => {
            if (data["d"].results && data["d"].results.length > 0 && data["d"].results[0].Chargebacks){
                return eval(data["d"].results[0].Chargebacks)
            }
            //.map(r=>r["ResourceUID"])) as IResource[] //qa
            else {
                return []
            }
        })
}

  getProjectPlans(resMgrUid: string, fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean): Observable<IProjectPlan[]> {
    let chargebacksForResMgr = this.getUniqueChargebacksForResManager(resMgrUid);
    return chargebacksForResMgr.flatMap(chargebacks => this.getProjectPlansFromChargebacks(chargebacks,fromDate, toDate, timescale, workunits, showTimesheetData));
}

  getProjectPlan(projectUrl: string = `${this.config.projectServerUrl}/`, project: IProject, start: Date, end: Date,
    timescale: Timescale, workunits: WorkUnits)
    : Observable<IProjectPlan> {
    console.log('entering getProjectPlan method');
    let headers = new HttpHeaders();
    headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

    const body = `method=PwaGetProjectPlansCommand&puid=${project.projUid}&projname=${project.projName}&fromDate=${this.getDateFormatString(start)}&toDate=${this.getDateFormatString(end)}&timeScale=${this.getTimeScaleString(timescale)}&workScale=${WorkUnits[workunits]}`
    let options = {
      headers,
      withCredentials: true
    };

    let adapterPath = `${this.config.adapterUrl}`

    console.log("====================================Hitting Adapter Get Project Plan for project = " + project.projName)
    return this.http.post(
      adapterPath, body, options

    ).map((r: ProjectPlan) => {
      debugger;
      r.project.projectChargeBackCategory = project.projectChargeBackCategory;
      return r;
    })
  }

  //   getTimesheetDataFromResource(projPlan: IProjectPlan, workUnits: WorkUnits): Observable<IProjectPlan> {

  //     return Observable.forkJoin(projPlan.resources.map(resource=>{

  //      return this.getTimesheetData(projPlan, workUnits).flatMap(timesheetData => {


  //             resource.timesheetData = [];

  //             resource.intervals.forEach(interval => {
  //                 let timesheetInterval = moment(interval.start).toDate();
  //                 let actualTotal = 0, capacityTotal = 0;

  //                 while (timesheetInterval < moment(interval.end).toDate()) {
  //                     //if project has timesheet data
  //                     if (timesheetData.hasOwnProperty(this.getDateFormatString(timesheetInterval))) {
  //                         //if interval date has timesheet data
  //                         capacityTotal += +(timesheetData[this.getDateFormatString(timesheetInterval)].Capacity);
  //                         if (timesheetData[this.getDateFormatString(timesheetInterval)].TimesheetData.hasOwnProperty(projPlan.project.projUid)) {
  //                             actualTotal += +(timesheetData[this.getDateFormatString(timesheetInterval)].TimesheetData[projPlan.project.projUid])

  //                         }
  //                     }

  //                     //incremment by 1 day until interval end is reached
  //                     timesheetInterval = moment(timesheetInterval).add(1, 'day').toDate();
  //                 }
  //                 let timesheetTotal = 0;
  //                 if (workUnits == WorkUnits.hours) {
  //                     timesheetTotal = actualTotal;
  //                 }
  //                 else if (workUnits == WorkUnits.days) {
  //                     timesheetTotal = actualTotal / 8;
  //                 }
  //                 else if (workUnits == WorkUnits.FTE) {
  //                     if (capacityTotal < 1) {
  //                         timesheetTotal = -100;
  //                     }
  //                     else {
  //                         timesheetTotal = Math.round((actualTotal / capacityTotal * 100));
  //                     }
  //                 }
  //                 if (timesheetTotal < 0) {
  //                   resource.timesheetData.push(new Interval(interval.intervalName, 'NA', interval.start, interval.end))
  //                 }
  //                 else {
  //                   resource.timesheetData.push(new Interval(interval.intervalName, timesheetTotal.toString(), interval.start, interval.end))
  //                 }
  //             })
  //         })
  //         return projPlan;
  //     })

  // )

  // }

  // getTimesheetData(projPlan: IProjectPlan, workunits: WorkUnits): Observable<object> {
  //   let headers = new HttpHeaders();
  //   //let start: Date = new LastYear().startDate;
  //   //let end: Date = moment(new LastYear().startDate).add(3,'month').toDate()
  //   let start: Date = moment(new LastYear().startDate).toDate();
  //   let end: Date = new Date();
  //   headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

  //   console.log('--------------------')
  //   console.log('-----   START  -------' + start)
  //   console.log('--------------------')

  //   const body = `method=PwaGetTimsheetsCommand&resuid=${resPlan.resource.resUid}&start=${start.toDateString()}&end=${end.toDateString()}`;
  //   let adapterPath = `${this.config.adapterUrl}`
  //   let options = {
  //       headers
  //   };
  //   return this.http.post(
  //       adapterPath, body, options

  //   ).map((r) => {
  //       return r;
  //   })
  // }
  //TODO:Refactor  move into common service
  addProjects(resMgrUid: string, projects: IProject[], resources: IResource[], fromDate: Date, toDate: Date, timeScale: Timescale, workScale: WorkUnits): Observable<Result[]> {

    let ob = Observable.from(projects).flatMap(p => {
        // return r.filter(project=>{
        //     let val = true;
        return this.addProject(resMgrUid, p, resources, this.getDateFormatString(fromDate), this.getDateFormatString(toDate), timeScale, workScale)
        // })
    }).toArray()

    return ob;
}

addProject(resMgrUid: string, project: IProject, resources: IResource[], fromDate: string, toDate: string, timeScale: Timescale, workScale: WorkUnits): Observable<Result> {
    var success;
    let headers = new HttpHeaders();
    headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')


    // let body = new URLSearchParams();

    const body = `method=PwaAddResourcesToPlanCommand&puid=${project.projUid}&resuids=${resources.map(r=>r.resUid).join(',')}&projname=${project.projName}&fromDate=${this.getDateFormatString(new Date(fromDate))}&toDate=${this.getDateFormatString(new Date(toDate))}&timeScale=${this.getTimeScaleString(timeScale)}&workScale=${WorkUnits[workScale]}`
    let options = {
        headers,
        withCredentials: true
    };

    let adapterPath = `${this.config.adapterUrl}`
    
    console.log("====================================Hitting Adapter Get Res Plan for project = " + project.projName)
    return this.http.post(
        adapterPath, body, options

    ).map(r => {
        return r as Result
    })
    // return this.http.post(adapterPath,body,options).flatMap(r=>
    //     {
    //         return Observable.of(project);
    //     })
}
  public getRequestDigestToken(): Observable<string> {
    let url = `${this.config.projectServerUrl}/_api/contextinfo`;
    let headers = new HttpHeaders();
    headers = headers.set('accept', 'application/json;odata=verbose')
    let options = {
      headers
    };

    return this.http.post(url, {}, options).map(response => {
      ;
      return response["d"].GetContextWebInformation.FormDigestValue
    })

  }
  getCurrentUserId(): Observable<string> {

    //console.log("configuration = " + JSON.stringify(this.config))
    let baseUrl = `${this.config.projectServerUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties/AccountName`
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
        .flatMap((spData: Response) => {
            ;
            var accountName = spData["d"].AccountName
            url = `${this.config.projectServerUrl}/_api/ProjectData/Resources`
            let filter = "?$filter=ResourceNTAccount eq '" + encodeURIComponent('i:0#.w|' + accountName) + "'"
            return this.http.get(url + filter, options)
                .map((data: Response) => {
                    return data["d"].results[0].ResourceId.toUpperCase();
                })
        })
}
getDateFormatString(date: Date): string {
  var NowMoment = moment(date)
  return NowMoment.format('YYYY-MM-DD');
}

getTimeScaleString(value: Timescale): string {
  switch (value.toString()) {
    case Timescale.calendarMonths.toString(): return "Calendar Months";
    case Timescale.financialMonths.toString(): return "Financial Months";
    case Timescale.weeks.toString(): return "Weeks";
    case Timescale.years.toString(): return "Years";
    default: return "";

  }
}
  public AddChagebacksToManager(resMgrUid: string, lookups: Lookup[]): Observable<Result> {
    let existingChargebacks: string[]=[];

    let headers = new HttpHeaders();
    headers = headers.set('accept', 'application/json;odata=verbose')
    let options = {
      headers
    };
    let url = `${this.config.ResPlanUserStateUrl}/Items`
    let filter = `?$filter=ResourceManagerUID eq '${resMgrUid}'`
    let isNewEntry = false;
    return this.http.get(url + filter, options)
      .flatMap((data: Response) => {
        debugger;
        let chargebacks = [];
        chargebacks = chargebacks.concat(lookups.map(r => r.name));
        if (data["d"].results.length > 0) {
          if(data["d"].results[0]["Chargebacks"]){
          existingChargebacks = eval(data["d"].results[0]["Chargebacks"]) //dev
          }
          //existingResources = JSON.parse(data.json().d.results[0]["ResourceUID"]).map(resource => { return new Resource(resource.resUid, resource.resName) }) //qa
          existingChargebacks = existingChargebacks
            .filter(e => chargebacks.map(r => r.toUpperCase()).indexOf(e.toUpperCase()) < 0)
        }
        else {
          isNewEntry = true;
        }

        return this.getRequestDigestToken().flatMap(digest => {

          let url = `${this.config.ResPlanUserStateUrl}/Items`

          let headers = new HttpHeaders();
          headers = headers.set('Accept', 'application/json;odata=verbose')
          headers = headers.set('Content-Type', 'application/json;odata=verbose')
          headers = headers.set('X-RequestDigest', digest)
          if (isNewEntry == false) {
            headers = headers.set('X-HTTP-Method', 'MERGE')
            headers = headers.set('IF-MATCH', '*')
          }
          let options = {
            headers: headers
          }
          //let resources = `'[${resourcePlans.map(t => 


          if (isNewEntry == false) {
            url = data["d"].results[0].__metadata.uri;
            chargebacks = existingChargebacks.concat(chargebacks);
          }
          let chargebackJSON = `"[${chargebacks.map(c=>"'" + c + "'").toString()}]"`
          let body = `{"__metadata": { "type": "SP.Data.ResourcePlanUserStateListItem" },"ResourceManagerUID": "${resMgrUid}"
          ,"Chargebacks":${chargebackJSON}}`;
          return this.http.post(url, body, options)
            .map(r => {
              let result = new Result();
              result.success = true;
              return result;
            })
        })
      })
  }

  saveProjPlans(projPlan: IProjectPlan[], fromDate: Date, toDate: Date, timeScale: Timescale, workScale: WorkUnits): Observable<Result[]> {
    var success;
    //TODO
    let headers = new HttpHeaders();
    headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

    let adapterPath = `${this.config.adapterUrl}`
    // let body = new URLSearchParams();

    const body = `method=PwaUpdateProjectPlanCommand&resourceplan=${JSON.stringify(projPlan)}&fromDate=${this.getDateFormatString(fromDate)}&toDate=${this.getDateFormatString(toDate)}&timeScale=${this.getTimeScaleString(timeScale)}&workScale=${WorkUnits[workScale]}`
    let options = {
        headers
    };

    return this.http.post(
        adapterPath, body, options
    ).map(r => {
        return r as Result[];
    })
}
  
}
