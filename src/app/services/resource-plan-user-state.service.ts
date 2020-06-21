import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { ConfigService, } from './config-service.service'
import { LastYear, CurrentCalendarYear } from '../common/utilities'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap';
import { Observable } from 'rxjs';
import * as moment from 'moment'


import { IResPlan, ResPlan, IProject, Project,IHiddenProject, WorkUnits, Timescale, IInterval, Interval, IResource, Resource, Config, Result, IResPlanUserWorkSpaceItem } from '../resourcePlans/res-plan.model'
import { combineLatest } from 'rxjs/operators';
import { ResourcePlanFilteredService } from './resource-plan-filtered.service';
declare var $: any;

@Injectable()
export class ResourcePlanUserStateService {
    savePlansCounter: number;
    config: Config;
    constructor(private http: HttpClient, private _configSvc: ConfigService, private resourcePlanFilteredSvc:ResourcePlanFilteredService) {
        this.config = _configSvc.config;
    }


    getResourcePlansFiltered(resMgrUid: string, fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean) : Observable<IResPlan[]>
    {
       let resPlan$ = this.getResPlans(resMgrUid,fromDate,toDate,timescale,workunits,showTimesheetData);
       let workSpaceResources$ = this.getWorkspaceResourcesForResourceManager(resMgrUid);
       return this.resourcePlanFilteredSvc.getResourcePlansFiltered(resPlan$,workSpaceResources$);
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
    
    getWorkspaceResourcesForResourceManager(resMgrUid: string): Observable<IResource[]> {
        let baseUrl = `${this.config.ResPlanUserStateUrl}/Items`

        //remember to change UID0 to UID
        let select = '$select=ResourceUID'  //dev
        //let select = '$select=ResourceUID'  //qa
        let filter = `$filter=ResourceManagerUID eq '${resMgrUid}'`;
        //1. get data from SP List UserState 
        let url = baseUrl + '?' + filter + '&' + select;
        let headers = new HttpHeaders();
        headers = headers.set('accept', 'application/json;odata=verbose')

            ;
        let options = {
            headers
        };
        return this.http.get<IResource[]>(url, options).pluck('d').pluck('results').map((d:Array<any>)=>{
            if(d && d.length)
           return JSON.parse(d[0]['ResourceUID']);
           else
          return [];
        })
            
    }

    getProjectIdsFromAssignmentsForResources(resources: IResource[]): Observable<IResPlan[]> {
         
        let baseUrl = `${this.config.projectServerUrl}/_api/ProjectData/Assignments`;
        let select = "$select=ProjectId,ProjectName";
        let headers = new HttpHeaders();
        headers = headers.set('accept', 'application/json;odata=verbose')
        let options = {
            headers
        };
        let resourceProjectsMap: IResPlan[] = []
        resources.forEach(resource => {
            resourceProjectsMap.push(new ResPlan(resource))
        })
            ;
        //console.log('=======================hitting project server for assigments')
        return Observable.from(resources).flatMap(t => {
            let filter = `$filter=ResourceName eq '${t.resName.replace("'","''")}' and AssignmentType eq 101`
            let url = baseUrl + '?' + filter + '&' + select;
          
            // get unique project Uids from PS where the current resource has access to
            //and project has resource plan assignments

            //Project Active Status != "Cancelled" OR "Complete"

            return this.http.get(url, options)
                .switchMap((data: Response) => data["d"].results)
                .map(p => new Project(p["ProjectId"], p["ProjectName"], false, []))
                .distinct(x => x.projUid)
                .toArray()
                .flatMap(projects => {
                    resourceProjectsMap.find(r => r.resource.resUid.toUpperCase() == t.resUid.toUpperCase()).projects = projects;
                    return resourceProjectsMap;
                }
                ).toArray()
                .do(r => {
                    console.log("RES PLANS READ ROM ASSIGNMENTS=" + JSON.stringify(r))
                })
        })

        //.do(t => console.log('projects user has access on=' + JSON.stringify(t)))


    }
    // getResorcePlansFiltered(resMgrUid: string, fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean)
    // {
    //     return combineLatest(
    //         this.getResPlans(resMgrUid, fromDate,toDate ,timescale,workunits,showTimesheetData),
    //         this.getWorkspaceResourcesForResourceManager(resMgrUid)
    //     )
    //         .pipe(
    //             //scan((acc: Product[], value: Product) => [...acc, value]),
    //             tap(data => console.log('CombineLatest Observable: ', JSON.stringify(data))),
    //             catchError(err => {
    //                 console.error(err);
    //                 return throwError(err);
    //             })
    //         );
    // }
    getResPlans(resMgrUid: string, fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean): Observable<IResPlan[]> {
        //let uniqueProjectsForResMgr = this.getUniqueProjectsForResManager(resMgrUid);
        let resourcesForResMgr = this.getWorkspaceResourcesForResourceManager(resMgrUid)


        //let uniqueProjectsForAllResMgr = resourceForResMgr.flatMap(resources => this.getUniqueProjectsAcrossResMgrs(resMgrUid, resources));
        let resProjMap: [IResPlan];
        let uniqueProjectsResMgrHasAccessOn = resourcesForResMgr.flatMap(resources => this.getProjectIdsFromAssignmentsForResources(resources));
        //let mergedProjects = uniqueProjectsForResMgr.merge(uniqueProjectsForAllResMgr)

    


        return resourcesForResMgr.flatMap(resources => {


            return this.getResPlansFromProjects(resMgrUid, resources, uniqueProjectsResMgrHasAccessOn, fromDate, toDate, timescale, workunits, showTimesheetData)
            // .do(t => {
            //     //console.log('resource plans read from add resource =' + JSON.stringify(t))
            // })

            // .do(t => {
            //     //console.log('projects passed in =' + JSON.stringify(t))
            // })
        })

    }

    ///Add Resource Plan use case
    getResPlansFromResources(resMgrUid: string, resources: IResource[], fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean): Observable<IResPlan[]> {
        let projectsThatUserHasAccessOn = this.getProjectIdsFromAssignmentsForResources(resources);
        return this.getResPlansFromProjects(resMgrUid, resources, projectsThatUserHasAccessOn, fromDate, toDate, timescale, workunits, showTimesheetData)
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
    public AddResourceToManager(resMgrUid: string, resourcePlans: IResPlan[]): Observable<Result> {
        let existingResources: IResource[];

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
                let resources = [];
                resources = resources.concat(resourcePlans.map(r => r.resource));
                if (data["d"].results.length > 0) {
                    existingResources = JSON.parse(data["d"].results[0]["ResourceUID"]).map(resource => { return new Resource(resource.resUid, resource.resName) }) //dev
                    //existingResources = JSON.parse(data.json().d.results[0]["ResourceUID"]).map(resource => { return new Resource(resource.resUid, resource.resName) }) //qa
                    existingResources = existingResources
                        .filter(e => resources.map(r => r.resUid.toUpperCase()).indexOf(e.resUid.toUpperCase()) < 0)
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
                        resources = existingResources.concat(resources);
                    }
                    
                    // note that we escape any apostrophe's with a double escape
                    let resourcesJSON = `'[${resources.map(t => '{"resUid":"' + t.resUid + '","resName":"' + t.resName.replace("'","\\'") + '"}').join(",")}]'`
                    let body = `{"__metadata": { "type": "SP.Data.ResourcePlanUserStateListItem" },"ResourceManagerUID": "${resMgrUid}"
                ,"ResourceUID":${resourcesJSON}}`;
                    return this.http.post(url, body, options)
                        .map(r => {
                            let result = new Result();
                            result.success = true;
                            return result;
                        })
                })
            })
    }

    getResPlansFromProjects(resUid: string, resources: IResource[], resPlans: Observable<IResPlan[]>, fromDate: Date, toDate: Date, timescale: Timescale, workunits: WorkUnits, showTimesheetData: boolean): Observable<IResPlan[]> {

        let emptyResPlans = Observable.of(resources.map(r => new ResPlan(r, [])))
        var uniqueProjects = resPlans.flatMap(r => Observable.from(r).flatMap(r => r.projects)).distinct(x => x.projUid);
        console.log('these are the unique projects exactly: ', uniqueProjects);
        return uniqueProjects.flatMap((project: IProject) => {
            return this.getResPlan(resources, `${this.config.projectServerUrl}`, project, fromDate, toDate, timescale, workunits)

        }).toArray() .map(r=>{console.log('r is this exactly:', r);return r})


            .concat(emptyResPlans)
            .concat(resPlans)
            .flatMap(t => { ; return t; }).
            groupBy(t => { return t.resource.resUid.toUpperCase() }).flatMap(group => {
                
                return group.reduce(function (a, b) {
                    // if(group.key === "00000000-0000-0000-0000-000000000000")
                    // {
                    //     resProjMap.forEach(resPlan => {
                    //        resPlan.projects.forEach(project => {
                    //            if(a.projects.concat(b.projects).map(p=>p.projUid.toUpperCase()).indexOf(project.projUid.toUpperCase()) > -1)
                    //            {
                    //               project.readOnly = true;
                    //            }
                    //        }); 
                    //     });
                    // }
                    for (var i = 0; i < b.projects.length; i++) {
                        if (a.projects.findIndex(t => t.projUid.toUpperCase() == b.projects[i].projUid.toUpperCase()) < 0)
                            a.projects = a.projects.concat(b.projects[i]);
                    }
                    return a; // returns object with property x
                })

            })
            .toArray()
            //.do(t => console.log("RES PLANS READ =====" + JSON.stringify(t)))
            .map(rps => {
                
                rps.forEach(rp => {
                    var allReadOnlyProjects = rps.find(r => r.resource.resUid.toUpperCase() == "00000000-0000-0000-0000-000000000000") && rps.find(r => r.resource.resUid.toUpperCase() == "00000000-0000-0000-0000-000000000000").projects.filter(p => p.readOnly == true)
                    if (allReadOnlyProjects) {
                        var readOnlyProjectsInRP = rp.projects.filter(p => allReadOnlyProjects.map(r => r.projUid.toUpperCase()).indexOf(p.projUid.toUpperCase()) > -1)
                        readOnlyProjectsInRP.forEach(project => {
                            project.readOnly = true;
                            project.readOnlyReason = allReadOnlyProjects.find(x => x.projUid.toUpperCase() == project.projUid.toUpperCase()).readOnlyReason
                            project.intervals = this.buildIntervals(fromDate, toDate, timescale);
                        });
                    }
                    //weed out stale publish projects
                    rp.projects = rp.projects.filter(p => p.stalePublish == false && p.intervals && p.intervals.length > 0);
                    rp.projects = rp.projects.sort((a, b) => {
                        return a.projName.localeCompare(b.projName);
                    })
                })
                rps.findIndex(r => r.resource.resUid.toUpperCase() == "00000000-0000-0000-0000-000000000000") > -1 &&
                    rps.splice(rps.findIndex(r => r.resource.resUid.toUpperCase() == "00000000-0000-0000-0000-000000000000"), 1)
                return rps;
            })
            .flatMap(resPlans => {
               
                if (showTimesheetData == true) {
                    return Observable.forkJoin(resPlans.map(r => {
                        return this.getTimesheetDataFromResource(r, workunits)
                    }))
                }
                else {
                    return Observable.of(resPlans);
                }
            })
            .map(resPlans=>{
                return resPlans.sort((a,b)=>{
                    if(a.resource.resName < b.resource.resName) return -1;
                    if(a.resource.resName > b.resource.resName) return 1;
                    return 0;
                
                })
            })

    }

    getDateFormatString(date: Date): string {
        var NowMoment = moment(date)
        return NowMoment.format('YYYY-MM-DD');
    }

    exgetDateFormatString(date: Date): string {
        var NowMoment = moment(date)
        return NowMoment.format('l');
    }


    getCurrentDate() {
        return moment().toDate();
    }

    getModifiedStartDate(date: Date) {
       return moment(date).startOf('month').toDate();
    }
    
    getModifiedEndDate(date: Date) {
       return moment(date).endOf('month').toDate();
    }

    transformToDate(date: any) {
        return moment(date).toDate();
    }

   
    buildIntervals(_startDate: Date, _endDate: Date, _timeScale: Timescale): IInterval[] {
        console.log('times up', _startDate,_endDate );
        
        let intervals: Interval[] = []
        let firstInterval = new Interval()
        if (_timeScale == Timescale.weeks) {
            if (moment(_startDate).day() === 0) {  //sunday
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = moment(_startDate).toDate()
            }
            else {
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = new Date(moment(_startDate).add(1, 'day').isoWeekday(7).format('MM-DD-YYYY'))
                // console.log(firstInterval)
            }


            let lastInterval = new Interval()
            if (moment(_endDate).day() === 1) {   //monday
                lastInterval.start = moment(_endDate).toDate()
                lastInterval.end = moment(_endDate).toDate()
            }
            else {
                lastInterval.start = moment(_endDate).subtract(1, 'day').isoWeekday(1).toDate()
                lastInterval.end = moment(_endDate).toDate()
            }

            intervals.push(firstInterval)

            let weeksToGenerate = moment(lastInterval.end).diff(moment(firstInterval.start), 'weeks')

            for (var i = 0; i < weeksToGenerate; i++) {
                let interval = new Interval()
                interval.start = moment(intervals[i].end).add(1, 'days').toDate()
                interval.end = moment(intervals[i].end).add(1, 'weeks').toDate()
                intervals.push(interval)
            }

            if (lastInterval.start > intervals[weeksToGenerate].end) {
                intervals.push(lastInterval)
            }
        }

        if (_timeScale == Timescale.calendarMonths) {
            ;
            if (moment(_startDate).endOf('month').date() === moment(_startDate).date()) {  //end of month
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = moment(_startDate).toDate()
            }
            else {
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = new Date(moment(_startDate).endOf('month').add(1, 'days').format('MM-DD-YYYY'))
                console.log(firstInterval)
            }


            let lastInterval = new Interval()
            if (moment(_endDate).date() === 1) {   //beginning of the month
                lastInterval.start = moment(_endDate).toDate()
                lastInterval.end = moment(_endDate).toDate()
            }
            else {
                lastInterval.start = moment(_endDate).startOf('month').toDate()
                lastInterval.end = moment(_endDate).toDate()
            }

            intervals.push(firstInterval)

            let monthsToGenerate = moment(lastInterval.end).diff(moment(firstInterval.start), 'month')

            for (var i = 0; i < monthsToGenerate; i++) {
                let interval = new Interval()
                interval.start = moment(intervals[i].end).add(1, 'days').toDate()
                interval.end = moment(interval.start).endOf('month').add(1, 'days').toDate()
                intervals.push(interval)
            }

            if (lastInterval.start > intervals[monthsToGenerate].end) {
                intervals.push(lastInterval)
            }
        }

        if (_timeScale == Timescale.years) {
            ;
            if (moment(_startDate).endOf('year').month() === moment(_startDate).month()) {  //end of month
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = moment(_startDate).toDate()
            }
            else {
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = new Date(moment(_startDate).endOf('year').format('MM-DD-YYYY'))
                console.log(firstInterval)
            }


            let lastInterval = new Interval()
            if (moment(_endDate).month() === 0) {   //beginning of the month
                lastInterval.start = moment(_endDate).toDate()
                lastInterval.end = moment(_endDate).toDate()
            }
            else {
                lastInterval.start = moment(_endDate).startOf('year').toDate()
                lastInterval.end = moment(_endDate).toDate()
            }

            intervals.push(firstInterval)

            let yearsToGenerate = moment(lastInterval.end).diff(moment(firstInterval.start), 'year')

            for (var i = 0; i < yearsToGenerate; i++) {
                let interval = new Interval()
                interval.start = moment(intervals[i].end).add(1, 'days').toDate()
                interval.end = moment(intervals[i].end).add(1, 'years').toDate()
                intervals.push(interval)
            }

            if (lastInterval.start > intervals[yearsToGenerate].end) {
                intervals.push(lastInterval)
            }
        }
        return intervals;
    }


    exbuildIntervals(_startDate: Date, _endDate: Date, _timeScale: Timescale): IInterval[] {
        console.log('times up', _startDate,_endDate );
        
        let intervals: Interval[] = []
        let firstInterval = new Interval()
        if (_timeScale == Timescale.weeks) {
            if (moment(_startDate).day() === 0) {  //sunday
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = moment(_startDate).toDate()
            }
            else {
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = new Date(moment(_startDate).add(1, 'day').isoWeekday(7).format('MM-DD-YYYY'))
                // console.log(firstInterval)
            }


            let lastInterval = new Interval()
            if (moment(_endDate).day() === 1) {   //monday
                lastInterval.start = moment(_endDate).toDate()
                lastInterval.end = moment(_endDate).toDate()
            }
            else {
                lastInterval.start = moment(_endDate).subtract(1, 'day').isoWeekday(1).toDate()
                lastInterval.end = moment(_endDate).toDate()
            }

            intervals.push(firstInterval)

            let weeksToGenerate = moment(lastInterval.end).diff(moment(firstInterval.start), 'weeks')

            for (var i = 0; i < weeksToGenerate; i++) {
                let interval = new Interval()
                interval.start = moment(intervals[i].end).add(1, 'days').toDate()
                interval.end = moment(intervals[i].end).add(1, 'weeks').toDate()
                intervals.push(interval)
            }

            if (lastInterval.start > intervals[weeksToGenerate].end) {
                intervals.push(lastInterval)
            }
        }

        if (_timeScale == Timescale.calendarMonths) { //ex
            ;
            if (moment(_startDate).endOf('month').date() === moment(_startDate).date()) {  //end of month
                firstInterval.start = new Date ( moment(_startDate).format('l'))
                firstInterval.end = new Date (moment(_startDate).format('l'))
            }
            else {
                firstInterval.start = new Date(moment(_startDate).format('l'));
                firstInterval.end = new Date(moment(_startDate).endOf('month').format('l'))
                console.log(firstInterval)
            }


            let lastInterval = new Interval()
            if (moment(_endDate).date() === 1) {   //beginning of the month
                lastInterval.start = new Date (moment(_endDate).format('l'))
                lastInterval.end = new Date (moment(_endDate).format('l'))
            }
            else {
                lastInterval.start = new Date(moment(_endDate).startOf('month').format('l'))
                lastInterval.end = new Date( moment(_endDate).format('l'))
            }

            intervals.push(firstInterval)

            let monthsToGenerate = moment(lastInterval.end).diff(moment(firstInterval.start), 'month')

            for (var i = 0; i < monthsToGenerate; i++) {
                let interval = new Interval()
                interval.start = new Date(moment(intervals[i].end).add(1, 'days').format('l'))
                interval.end = new Date (moment(interval.start).endOf('month').format('l'))
                intervals.push(interval)
            }

            if (lastInterval.start > intervals[monthsToGenerate].end) {
                intervals.push(lastInterval)
            }
        }

        if (_timeScale == Timescale.years) {
            ;
            if (moment(_startDate).endOf('year').month() === moment(_startDate).month()) {  //end of month
                firstInterval.start = new Date(moment(_startDate).format('l'))
                firstInterval.end = new Date(moment(_startDate).format('l'))
            }
            else {
                firstInterval.start = moment(_startDate).toDate()
                firstInterval.end = new Date(moment(_startDate).endOf('year').format('l'))
                console.log(firstInterval)
            }


            let lastInterval = new Interval()
            if (moment(_endDate).month() === 0) {   //beginning of the month
                lastInterval.start = moment(_endDate).toDate()
                lastInterval.end = moment(_endDate).toDate()
            }
            else {
                lastInterval.start = moment(_endDate).startOf('year').toDate()
                lastInterval.end = moment(_endDate).toDate()
            }

            intervals.push(firstInterval)

            let yearsToGenerate = moment(lastInterval.end).diff(moment(firstInterval.start), 'year')

            for (var i = 0; i < yearsToGenerate; i++) {
                let interval = new Interval()
                interval.start = moment(intervals[i].end).add(1, 'days').toDate()
                interval.end = moment(intervals[i].end).add(1, 'years').toDate()
                intervals.push(interval)
            }

            if (lastInterval.start > intervals[yearsToGenerate].end) {
                intervals.push(lastInterval)
            }
        }
        return intervals;
    }

    
    getResPlan(resources: IResource[], projectUrl: string = `${this.config.projectServerUrl}/`, project: IProject, start: Date, end: Date,
        timescale: Timescale, workunits: WorkUnits)
        : Observable<IResPlan> {
        console.log('entering getResPlans method');
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')


        // let body = new URLSearchParams();

        const body = `method=PwaGetResourcePlansCommand&puid=${project.projUid}&projname=${project.projName}&fromDate=${this.getDateFormatString(start)}&toDate=${this.getDateFormatString(end)}&timeScale=${this.getTimeScaleString(timescale)}&workScale=${WorkUnits[workunits]}`
        let options = {
            headers,
            withCredentials: true
        };

        let adapterPath = `${this.config.adapterUrl}`
        
        console.log("====================================Hitting Adapter Get Res Plan for project = " + project.projName)
        return this.http.post(
            adapterPath, body, options

        ).flatMap((r: ResPlan[]) => {
            // let resPlans : IResPlan
            // ;
            // console.log("++++++++++++++++++++++++++++++++++++++++")
            // Object.assign({}, resPlans, r)
            console.log('what is r exactly??',r.values, "r values" );
            return r;

        })
            .merge(
            Observable.from(resources).flatMap((r: IResource) => {
                return Observable.of(new ResPlan(new Resource(r.resUid, r.resName)))
            })
            )
            .filter((t: IResPlan) => {
                
                return resources.find(k => t.resource.resUid === "00000000-0000-0000-0000-000000000000" || k.resUid.toUpperCase() == t.resource.resUid.toUpperCase()) != null
            })

    }

    addOrShowProjects(resMgrUid: string, projects: IProject[], resource: IResource, fromDate: Date, toDate: Date, timeScale: Timescale, workScale: WorkUnits): Observable<Result[]> {
         //get projects with assignments for current resource
         let projectsWithResPlans = this.getProjectIdsFromAssignmentsForResources([resource]).map(rp=>{
             console.log('what is rp exactly', rp)
             if(rp)
             {
                return rp[0].projects.map(p=>p.projUid.toUpperCase());
             }
             else 
             {
                 return [];
             }
            })
         
        
         let projectsToAdd$ =projectsWithResPlans.map(pa=>{
             if(pa){
              return projects.filter(p=>p.projUid.toUpperCase()).filter(p=> pa.indexOf(p.projUid.toUpperCase()) < 0);
             }
             else
             return projects; //return all projects since 
         })

          let projectsToUnHide$ = projectsWithResPlans.map(pa=>{
              console.log('pa excatly:', pa);
              
            if(pa){
             return projects.filter(p=>p.projUid.toUpperCase()).filter(p=> pa.indexOf(p.projUid.toUpperCase()) > -1);
            }
            else
            return [];
         })

        let results$ = projectsToAdd$.flatMap(projToAdd=>
            {
             return this.addProjects(resMgrUid,projToAdd,resource,fromDate,toDate,timeScale,workScale).flatMap(results=>{
             
                 console.log('get it done: weird', results) //this is the good spot right here
                 
                
                 this.unHideProjects(resMgrUid,projects,resource).subscribe();
                 return projectsToUnHide$.flatMap(projectForunHideProjects=>{
                    let resultsForUnHideProjects: Result[]= [];
                    projectForunHideProjects.forEach(up=>{
                        let result = new Result();
                        result.project = up;
                        result.resUid = resource.resUid;
                        result.success = true;
                        result.resourceName = resource.resName;
                        result.projUid = result.project.projUid
                        resultsForUnHideProjects.push(result);
                    })
                    console.log('before debug results', results);
                    
                    results = results.concat(resultsForUnHideProjects)
                    
                    return results;
                 }).toArray()
             })
        })
       // let modifiedResults$ = results$.flatMap( (results) => { console.log('ha these results man', results); return this.usePMAllocationDefaults(results);}).toArray();
         //results = this.usePMAllocationDefaults(results);

       // return modifiedResults$;
       debugger
       return results$;
    }
    //Result returns error or success
    addProjects(resMgrUid: string, projects: IProject[], resource: IResource, fromDate: Date, toDate: Date, timeScale: Timescale, workScale: WorkUnits): Observable<Result[]> {
        

        //old code
        let ob = Observable.from(projects).flatMap(p => {
            // return r.filter(project=>{
            //     let val = true;
            return this.addProject(resMgrUid, p, resource, this.getDateFormatString(fromDate), this.getDateFormatString(toDate), timeScale, workScale)
            // })
        }).toArray()
        console.log('this is it huhh', ob.subscribe(data => console.log(data)));
        

        return ob;
    }

     usePMAllocationDefaults(results: Result[]):any[] { //why didn't the model work??
     console.log('real weird', results);
        let newResults = [];
        let filteredResults = results.filter((result) => result.resUid != undefined )
        console.log('single-filtered', filteredResults);
        debugger
        let defaultResults = filteredResults.map( (result) => {
            console.log('weird single result', result);
            
             this.applyProjectManagerAllocation(result)
         }) 

         results.forEach(  (result) => {
            newResults.push(this.applyProjectManagerAllocation(result))
         })
        //PM Check(): filter projects based on owner and resName being equal or not. RETURNS ARRAY
            //if empty array then do nothing /  alert 'no projects selected apply'

            //if array has lentgh then for each result take PM allocation and spread through interval array.
            //applyPMAllocation RETURNS modified result
        //
        
        console.log('better now', defaultResults);
        console.log('post malone', newResults);
        
        // return defaultResults;
        debugger;
        return newResults;
     }

     addResourceNameToProjects(projects: IProject[], successfulResult: any[] ): IProject[] { //successfulREesult has the correct PM Allocation
       let projectsWithResourceNames: IProject[] = []
       projects.forEach((project, index) => {
           debugger
         let usableAllocation = (successfulResult[index].pmAllocation === undefined || typeof successfulResult[index].pmAllocation  === 'undefined') ? "0" : successfulResult[index].pmAllocation;
         project.resName = successfulResult[0].resourceName
         project.pmAllocation = usableAllocation;
         projectsWithResourceNames.push(project);
       })
       console.log(projectsWithResourceNames)
       return projectsWithResourceNames;
     }

     fillPMAllocationIntervals(projects: IProject[]): IProject[] {
        let projectsWithIntervals: IProject[] = []
        projects.forEach((project) => {
            if (project.pmAllocation !== ""){ project.intervals.map((interval) => {
                interval.intervalValue = project.pmAllocation;
            } )}
            projectsWithIntervals.push(project);
        })
        console.log(projectsWithIntervals)
        return projectsWithIntervals;
     }

     applyProjectManagerAllocation(result: Result): Result {
         console.log('passed in weird into applyProjectManagerAllocation', result);
         
        if (this.pmCheck(result) === true) {
            result.pmAllocation = result.project.pmAllocation;
            console.log('changed PMALLOCATION', result);
            
        }
        
        return  result; //[result, this.pmCheck(result)];
    }

     pmCheck(result: Result): Boolean {
        console.log('passed in weird into PMCHECK', result);
        if (result.project.owner === result.resourceName) { console.log('truthy value on weird owner');; return true;}
        else {
              console.log('nope muahaha');
            
               return false;
        }
     
     }

    

    unHideProjects(resMgrUid: string,projects: IProject[], resource: IResource) :Observable<Result>
    {
        projects.forEach(p=>p["selected"] = false);
           let resPlan:IResPlan = new ResPlan(resource,projects);
           return this.UnHideResourceProjects(resMgrUid,[resPlan]); // this update is an array of 1 resPlan
    }

    addProject(resMgrUid: string, project: IProject, resource: IResource, fromDate: string, toDate: string, timeScale: Timescale, workScale: WorkUnits): Observable<Result> {
        var success;
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')


        // let body = new URLSearchParams();

        console.log('what is project exactly / does it have what I need??', project);
        console.log('this is the spot huh');
        //change here in resName to make the request happy when there are apostrophe's in the resName... here we simply delete the apostrophe.
        const body = `method=PwaAddResourcePlanCommand&puid=${project.projUid}&resuid=${resource.resUid}&resName=${resource.resName.replace("'","")}&projname=${project.projName}&fromDate=${this.getDateFormatString(new Date(fromDate))}&toDate=${this.getDateFormatString(new Date(toDate))}&timeScale=${this.getTimeScaleString(timeScale)}&workScale=${WorkUnits[workScale]}`
        let options = {
            headers,
            withCredentials: true
        };

        let adapterPath = `${this.config.adapterUrl}`
        
        console.log("====================================Hitting Adapter Get Res Plan for project = " + project.projName)
        return this.http.post(
            adapterPath, body, options

        ).map(r => {
            console.log('right spot for the reight result?', r);
            var pmAllocationAdditions = {resourceName: resource.resName, pmAllocation: project.pmAllocation, projectOwner: project.owner}
            var newResult = Object.assign({}, r) as Result
            newResult.resourceName = resource.resName
            newResult.pmAllocation = project.pmAllocation
            newResult.owner = project.owner

            return newResult as Result
        })
        // return this.http.post(adapterPath,body,options).flatMap(r=>
        //     {
        //         return Observable.of(project);
        //     })
    }


    getTimeScaleString(value: Timescale): string {
        ;
        switch (value.toString()) {
            case Timescale.calendarMonths.toString(): return "Calendar Months";
            case Timescale.financialMonths.toString(): return "Financial Months";
            case Timescale.weeks.toString(): return "Weeks";
            case Timescale.years.toString(): return "Years";
            default: return "";

        }
    }


    saveResPlans(resPlan: IResPlan[], fromDate: Date, toDate: Date, timeScale: Timescale, workScale: WorkUnits): Observable<Result[]> {
      
        var success;
        //TODO
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

        let adapterPath = `${this.config.adapterUrl}`
        // let body = new URLSearchParams();

        const body = `method=PwaupdateResourcePlanCommand&resourceplan=${JSON.stringify(resPlan)}&fromDate=${this.getDateFormatString(fromDate)}&toDate=${this.getDateFormatString(toDate)}&timeScale=${this.getTimeScaleString(timeScale)}&workScale=${WorkUnits[workScale]}`
        let options = {
            headers
        };
        console.log('nice body', body);
        debugger;
        return this.http.post(
            adapterPath, body, options
        ).map(r => {
            return r as Result[];
        })
    }

    transformResPlanDatesToString(resPlans: any[]): any[] {
        let changedFormatResPlan = resPlans.map( (resPlan) => {
            resPlan.projects.map( (project) => {
                project.intervals.map( (interval) => {
                    interval.start = this.exgetDateFormatString(interval.start);
                    interval.end =  this.exgetDateFormatString(interval.end);
                })
            })
        })
        
        console.log('what is change?', changedFormatResPlan);
        return changedFormatResPlan;
    }

    
    exsaveResPlans(resPlan: IResPlan[], fromDate: Date, toDate: Date, timeScale: Timescale, workScale: WorkUnits, readyToExecuteSave:Boolean): Observable<Result[]> {
        console.log('array of ResPlans...in saveResPlans and startDate, greatSuccess', resPlan, typeof(fromDate));
        console.log('seriously wrong format??',this.exgetDateFormatString(fromDate));
        console.log('what is dat?', this.transformResPlanDatesToString(resPlan));
        if(readyToExecuteSave == false) {
            return Observable.from([]);
        }
        let fromDated = this.getEarliestDate(resPlan);
       let  transformedResPlan = this.transformResPlanDatesToString(resPlan);
        var success;
        //TODO
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

        let adapterPath = `${this.config.adapterUrl}`
        // let body = new URLSearchParams();
        let resPlanForBody = JSON.stringify(resPlan);
        const regexStart = /(start")/gm;
        const regexEnd = /(end")/gm;
        let resPlanForBodyWithStart = resPlanForBody.replace(regexStart, 'intervalStart"');
        let resPlanForBodyFinal = resPlanForBodyWithStart.replace(regexEnd, 'intervalEnd"');
        let fromDateString = this.exgetDateFormatString(fromDate);
        let toDateString = this.exgetDateFormatString(toDate);
        console.log('from date as string and to date as string:', fromDateString, toDateString);
        const body = `method=PwaupdateResourcePlanCommand&resourceplan=${resPlanForBodyFinal}&fromDate=${fromDateString}&toDate=${toDateString}&timeScale=${this.getTimeScaleString(timeScale)}&workScale=${WorkUnits[workScale]}`
        let options = {
            headers
        };
        console.log('nice body', resPlanForBodyFinal);
        console.log('original resPlan looking for start:', resPlan)
        debugger;
        return this.http.post(
            adapterPath, body, options
        ).map(r => {
            console.log('loser result', r);
            debugger;
            return r as Result[];
        })
        
    }

    getLastestDate(resPlan) {
        let lateDate = this.getCurrentDate();
        resPlan.forEach( (resPlan) => {
          resPlan.projects.forEach((project) => {
            
                let lastInterval = project.intervals[project.intervals.length -1]
                if (this.transformToDate(lastInterval.end) > lateDate) {lateDate = lastInterval.end}
                debugger;
            })
         
              
    
         })
         console.log('late date:', lateDate);
         return lateDate;

    }

    getEarliestDate(resPlan) {
        let today = this.getCurrentDate();
        let earliestDate:Date;
        resPlan.forEach( (resPlan) => {
          resPlan.projects.forEach((project) => {
             
                let firstInterval = project.intervals[0]
                if (this.transformToDate(firstInterval.start) > today) {console.log('start date is in future, use future date'); earliestDate = firstInterval.start; return firstInterval.start;}
            })
         
              
    
         })
         console.log('earliest date:', earliestDate);
         return today;
    }

   


    deleteResPlans(resPlan: IResPlan[], fromDate: Date, toDate: Date, timeScale: Timescale, workScale: WorkUnits): Observable<Result[]> {
        var success;
        resPlan.forEach(r => {
            r.projects = r.projects.filter(p => p.readOnly == false)
        })
        let headers = new HttpHeaders();
        //let start: Date = new LastYear().startDate;
        //let end: Date = moment(new LastYear().startDate).add(3,'month').toDate()
        let start: Date = moment(new LastYear().startDate).toDate();
        let end: Date = new Date();
        headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

        console.log('--------------------')
        console.log('-----   START  -------' + start)
        console.log('--------------------')

        const body = `method=PwaDeleteResourcePlanCommand&resourceplan=${JSON.stringify(resPlan)}&fromDate=${this.getDateFormatString(fromDate)}&toDate=${this.getDateFormatString(toDate)}&timeScale=${this.getTimeScaleString(timeScale)}&workScale=${WorkUnits[workScale]}`;
        let adapterPath = `${this.config.adapterUrl}`
        let options = {
            headers
        };
        return this.http.post(
            adapterPath, body, options

        ).map((r) => {
            return r as Result[];
        })

        // return this.http.post(adapterPath,body,options).flatMap(r=>
        //     {
        //         return Observable.of(project);
        //     })
    }
    HideResourcesOrProjects(resMgrUid: string, resPlans: IResPlan[]): Observable<Result> {
        let headers = new HttpHeaders();
        headers = headers.set('accept', 'application/json;odata=verbose')
        let options = {
            withCredentials: true,
            headers
        }
        let url = `${this.config.ResPlanUserStateUrl}/Items`
        let filter = `?$filter=ResourceManagerUID eq '${resMgrUid}'`
        //resPlans = resPlans.filter(r => r["selected"] == true)
        //1. get data from SP List UserState  
        return this.http.get(url + filter, options)

            .flatMap((data: Response) => {
                let resources = <IResource[]>JSON.parse(data["d"].results[0]["ResourceUID"]) //dev
                    //let resources = <IResource[]>JSON.parse(data.json().d.results[0]["ResourceUID"]) //qa
                    .map(resource => { 
                        let r  = new Resource(resource.resUid, resource.resName);
                        r.hiddenProjects = resource.hiddenProjects || []; //assign hidden projects read from SharePoint List
                        return r;
                     }) 

                let resourcesNotSelectedForHide = resources.filter(r=>resPlans.filter(rp=>rp['selected'] == false).map(rp=>rp.resource.resUid.toUpperCase()).indexOf(r.resUid.toUpperCase()) > -1)
                //for every resource update hidden projects from form model
                resourcesNotSelectedForHide .forEach(resource=>{
                    //get resource plan from form model
                    let resPlan = resPlans.filter(r=>r.resource.resUid.toUpperCase() == resource.resUid.toUpperCase())[0];
                    resource.hiddenProjects = resource.hiddenProjects.concat(resPlan.projects.filter(p=>p["selected"] == true).map(h=>{
                        let hiddenProject :IHiddenProject = {
                            projectUID : h.projUid,
                            projectName : h.projName
                        }
                        return hiddenProject;
                    }))
                })

                return this.getRequestDigestToken().flatMap(digest => {

                    let headers = new HttpHeaders();
                    headers = headers.set('Accept', 'application/json;odata=verbose')
                    headers = headers.set('Content-Type', 'application/json;odata=verbose')
                    headers = headers.set('X-RequestDigest', digest)


                    let resourcesJSON = `'${JSON.stringify(resourcesNotSelectedForHide)}'`;
                    headers = headers.set('IF-MATCH', '*')
                    headers = headers.set('X-HTTP-Method', 'MERGE')
                    let options = {
                        headers: headers
                    }

                    let body = `{"__metadata": { "type": "SP.Data.ResourcePlanUserStateListItem" },"ResourceUID":${resourcesJSON}}"}` //dev
                    //let body = `{"__metadata": { "type": "SP.Data.ResourcePlanUserStateListItem" },"ResourceUID":${resourcesJSON}}"}` //qa
                    return this.http.post(data["d"].results[0].__metadata.uri, body, options)
                        .map((response: Response) => {
                            var result = new Result();
                            result.success = true;
                            return result;
                        })
                })
            })

    }
    UnHideResourceProjects(resMgrUid: string, resPlans: IResPlan[]): Observable<Result> {
        let headers = new HttpHeaders();
        headers = headers.set('accept', 'application/json;odata=verbose')
        let options = {
            withCredentials: true,
            headers
        }
        let url = `${this.config.ResPlanUserStateUrl}/Items`
        let filter = `?$filter=ResourceManagerUID eq '${resMgrUid}'`
        //1. get data from SP List UserState  
        return this.http.get(url + filter, options)

            .flatMap((data: Response) => {
                let resources = <IResource[]>JSON.parse(data["d"].results[0]["ResourceUID"]) //dev
                    //let resources = <IResource[]>JSON.parse(data.json().d.results[0]["ResourceUID"]) //qa
                    .map(resource => { 
                         let r = new Resource(resource.resUid, resource.resName);
                         r.hiddenProjects = resource.hiddenProjects || []  //get resources from Sharepoint list
                         return r;
                        })

                //for every resource passed in as argument , unhide projects from projects found in each resPlan
                resources.forEach(resource=>{
                    //get resource plan from res Plan argument
                    let resPlan = resPlans.filter(r=>r.resource.resUid.toUpperCase() == resource.resUid.toUpperCase())[0];
                    if(resPlan){ //if resource found in the input
                    resource.hiddenProjects = resource.hiddenProjects.filter(r=>resPlan.projects.map(p=>p.projUid.toUpperCase())
                                           .indexOf(r.projectUID.toUpperCase()) < 0)
                    }
                })

                return this.getRequestDigestToken().flatMap(digest => {

                    let headers = new HttpHeaders();
                    headers = headers.set('Accept', 'application/json;odata=verbose')
                    headers = headers.set('Content-Type', 'application/json;odata=verbose')
                    headers = headers.set('X-RequestDigest', digest)


                    let resourcesJSON = `'${JSON.stringify(resources)}'`;
                    headers = headers.set('IF-MATCH', '*')
                    headers = headers.set('X-HTTP-Method', 'MERGE')
                    let options = {
                        headers: headers
                    }

                    let body = `{"__metadata": { "type": "SP.Data.ResourcePlanUserStateListItem" },"ResourceUID":${resourcesJSON}}"}` //dev
                    //let body = `{"__metadata": { "type": "SP.Data.ResourcePlanUserStateListItem" },"ResourceUID":${resourcesJSON}}"}` //qa
                    return this.http.post(data["d"].results[0].__metadata.uri, body, options)
                        .map((response: Response) => {
                            var result = new Result();
                            result.success = true;
                            return result;
                        })
                })
            })
    }
    getTimesheetDataFromResource(resPlan: IResPlan, workUnits: WorkUnits): Observable<IResPlan> {

        return this.getTimesheetData(resPlan, workUnits).map(timesheetData => {

            resPlan.projects.forEach(project => {
                project.timesheetData = [];

                project.intervals.forEach(interval => {
                    let timesheetInterval = moment(interval.start).toDate();
                    let actualTotal = 0, capacityTotal = 0;

                    while (timesheetInterval < moment(interval.end).toDate()) {
                        //if project has timesheet data
                        if (timesheetData.hasOwnProperty(this.getDateFormatString(timesheetInterval))) {
                            //if interval date has timesheet data
                            capacityTotal += +(timesheetData[this.getDateFormatString(timesheetInterval)].Capacity);
                            if (timesheetData[this.getDateFormatString(timesheetInterval)].TimesheetData.hasOwnProperty(project.projUid)) {
                                actualTotal += +(timesheetData[this.getDateFormatString(timesheetInterval)].TimesheetData[project.projUid])

                            }
                        }

                        //incremment by 1 day until interval end is reached
                        timesheetInterval = moment(timesheetInterval).add(1, 'day').toDate();
                    }
                    let timesheetTotal = 0;
                    if (workUnits == WorkUnits.hours) {
                        timesheetTotal = actualTotal;
                    }
                    else if (workUnits == WorkUnits.days) {
                        timesheetTotal = actualTotal / 8;
                    }
                    else if (workUnits == WorkUnits.FTE) {
                        if (capacityTotal < 1) {
                            timesheetTotal = -100;
                        }
                        else {
                            timesheetTotal = Math.round((actualTotal / capacityTotal * 100));
                        }
                    }
                    if (timesheetTotal < 0) {
                        project.timesheetData.push(new Interval(interval.intervalName, 'NA', interval.start, interval.end))
                    }
                    else {
                        project.timesheetData.push(new Interval(interval.intervalName, timesheetTotal.toString(), interval.start, interval.end))
                    }
                })
            })
            return resPlan
        })
    }
    getTimesheetData(resPlan: IResPlan, workunits: WorkUnits): Observable<object> {
        let headers = new HttpHeaders();
        //let start: Date = new LastYear().startDate;
        //let end: Date = moment(new LastYear().startDate).add(3,'month').toDate()
        let start: Date = moment(new LastYear().startDate).toDate();
        let end: Date = new Date();
        headers = headers.set('Accept', 'application/json;odata=verbose').set('Content-Type', 'application/x-www-form-urlencoded')

        console.log('--------------------')
        console.log('-----   START  -------' + start)
        console.log('--------------------')

        const body = `method=PwaGetTimsheetsCommand&resuid=${resPlan.resource.resUid}&start=${start.toDateString()}&end=${end.toDateString()}`;
        let adapterPath = `${this.config.adapterUrl}`
        let options = {
            headers
        };
        return this.http.post(
            adapterPath, body, options

        ).map((r) => {
            return r;
        })
    }

    getAllTimesheetData(workunits:WorkUnits) : Observable<IResPlan>
    {
        return this.getCurrentUserId().flatMap(resMgrUid=>{
        let resourcesForResMgr = this.getWorkspaceResourcesForResourceManager(resMgrUid)
        return resourcesForResMgr.flatMap(resources=>
        {
            return Observable.from(resources).flatMap(resource=>{
              return this.getTimesheetDataFromResource(new ResPlan(resource,[]),workunits)
            })
        })
    })
}


}
