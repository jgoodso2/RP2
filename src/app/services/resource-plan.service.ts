import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';

import { IResPlan,IProject,IInterval,ResPlan,Interval,Project } from '../ResourcePlans/res-plan.model';
import { WorkUnits,Timescale } from '../ResourcePlans/res-plan.model';

@Injectable()
export class ResourcePlanService {



  constructor( private http: Http) { }

  // getResPlan(projectUrl:string='http://foo.wingtip.com/PWA',projectUid: string,start:string='2017-06-01',end:string='2017-08-01',workUnits:WorkUnits,timescale:string): Observable<IResPlan[]> {
  //   console.log('entering getResPlans method');
  //   let headers = new Headers();
  //   headers.append('accept', 'application/json;odata=verbose')
  //   let options = new RequestOptions({
  //     withCredentials: true,
  //     headers
  //   })
  //   let baseUrl = `${projectUrl}/_api/ProjectServer/Projects('${projectUid}')/GetResourcePlanByUrl(start='${start}',end='${end}',scale='${timescale}')/Assignments`;
  //   let select = '$select=ProjectId,ProjectName'
  //   let filter = "$filter=ProjectActiveStatus ne 'Cancelled'";
  //   let resPlans:IResPlan[] = [];
  //      let ob = this.http.get(baseUrl, options);
  //      ob.map(x=>
  //       {
  //          return Observable.from(resPlans); 
  //       }).subscribe ((response:Response)  =>
  //      {
  //         var results = Observable.from(response.json().d.results);
  //         results.subscribe((x:Object) =>
  //         {
  //           var p = new Project("1","Project1");
  //            var resPlan = new ResPlan(x["Id"],x["Name"],[p]);
  //           var uri = x["Intervals"].__deferred.uri;
  //           var innerOb = this.http.get(uri, options);
  //           innerOb.subscribe((intervalresPonse:Response) =>{
  //            x["Intervals"] = response.json().d.results;
  //             var intervals:IInterval[] = [];
  //            x["Intervals"].forEach(element => {
  //              intervals.push(new Interval(element["Name"]),element["Duration"].replace("d",""));
  //             p.intervals = intervals;
  //           })
  //           })
  //         resPlans.push(resPlan);
  //         });
       
  //      })
        
  //      return ob;
  // }

  // getResPlans(resPlans:IResPlan[]):Observable<IResPlan[]>
  // {
  //   var projects:IProject[];
  //   var uniqueProjects = this.getUniqueProjects(resPlans);
  //   uniqueProjects.subscribe((uProjects:IProject[])=> projects=uProjects);
  //   let project = Observable.from(projects);
  //   return Observable.forkJoin(
  //    project.flatMap((p:IProject)=>
  //    {
  //     return this.getResPlan('http://foo.wingtip.com/PWA',p.id,'2017-06-01','2017-08-01',WorkUnits.days,'Months').mergeAll();
  //    })
  //   )

  // }
   
  getUniqueProjects(resPlans:IResPlan[]):Observable<IProject[]>
        {
          return  Observable.from(
          resPlans.
          map((resPlan:IResPlan)=> 
          {
                  return resPlan.projects;
          })).distinct();
        }
}
