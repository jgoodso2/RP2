import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpEvent, HttpResponse } from '@angular/common/http'
//import { HttpCache } from './httpCache' 
import { Observable } from 'rxjs'

@Injectable()
export class CachingInterceptorService implements HttpInterceptor {
  constructor() { }

  private cache = [];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({
      withCredentials: true
    });

    let requestsToCache = ["PwaGetProjectsForEditCommand","PwaGetResourcesCommand","PwaGetResourcePlansCommand","PwaGetTimsheetsCommand"];
    // requests that won't be deleted from cache
    let isRequestToCache : boolean = false;
    // Before doing anything, it's important to only cache GET requests.
    // Skip this interceptor if the request method isn't GET.


    //If Request body has parameter method = PwaupdateResourcePlanCommand
    //Save called and hence intercept the call to invalidate the cache for all the projects that get saved
    if ((req && req.body && (typeof req.body == typeof "")) && 
    ((req.body.indexOf('method=PwaupdateResourcePlanCommand') > -1)
    ||  (req.body.indexOf('method=PwaAddResourcePlanCommand') > -1)
    || (req.body.indexOf('method=PwaDeleteResourcePlanCommand') > -1)
  
  )
    ) {
    
      var projectsToInvalidateCache = this.getCacheDataToRemove(req);
      //this.cache = this.cache.map(c=>c.indexOf(`puid=${}`))
      projectsToInvalidateCache.forEach(project => {
        //weed out cache keys tht contain as part of its key as "puid = projectUid"
        this.removeCachedData(project)
      });
      //this.cache = [];

    }


    //If Request body has parameter method = PwaGetProjectsForEditCommand or PwaGetResourcesCommand or PwaGetTimsheetsCommand or PwaGetResourcePlansCommand 
    if (req && req.body && (typeof req.body == typeof "") && 
    requestsToCache.find(r=>req.body.indexOf('method=' + r) > -1)

    ) {
     
      isRequestToCache = true;
      // First, check the cache to see if this request exists.
      const cachedResponse = this.cache[req.urlWithParams + req.body] || null;
      if (cachedResponse) {
        // A cached response exists. Serve it instead of forwarding
        // the request to the next handler.

        console.log('******************************* ')
        
        console.log('YO....i\'m returning cached data for key=' + req.body + '\nvalue=' + JSON.stringify(cachedResponse))
        console.log('******************************* ')
        return Observable.of(cachedResponse);
      }
    }

    // No cached response exists. Go to the network, and cache
    // the response when it arrives.
    return next.handle(req).do(event => {
      // Remember, there may be other events besides just the response.

      console.log('******************************* ')
      console.log('YO....i\'m returning new data from server....  ')
      console.log('******************************* ')
      if (event instanceof HttpResponse) {
        // Update the cache.
        if(isRequestToCache == true){
        this.cache[req.urlWithParams + req.body] = event;
        }
      }
    });
  }
  getCacheDataToRemove(req) : Array<string>{
    var allProjects:any;
 //invalidate resource plan command cache
 var t = req.body.toString();
 //strip off every thing from beginning of array
 //if update called
 if(t.indexOf('method=PwaupdateResourcePlanCommand') > -1 || t.indexOf('method=PwaDeleteResourcePlanCommand') > -1){
  allProjects = JSON.parse(this.parseObjectFromUrlEncodedBody(req.body).resourceplan)
  .map(i => i.projects.map(p => p.projUid));
 }
 else if(t.indexOf('method=PwaAddResourcePlanCommand') > -1)
 {
 
  var puids = this.parseObjectFromUrlEncodedBody(req.body).puid
  allProjects = puids.split(',');
 }
 else{

 }
 
 var projectsToInvalidateCache = [].concat.apply([], allProjects);
 return projectsToInvalidateCache;
 
  }
  removeCachedData(project) {
    for (var key in this.cache) {
      if (key.indexOf(`puid=${project}`) > -1) {
        delete this.cache[key]
      }
    }
  }

  parseObjectFromUrlEncodedBody(body:string) : any{
    return JSON.parse('{"' + body.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
  }
}