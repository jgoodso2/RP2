const { of, from, interval, Observable } = require('rxjs');
const { concatMap, delay, tap, mergeMap ,map, forkjoin } = require('rxjs/operators');


function mockHTTPRequest(url) {
    return of(`Response from ${url}`).pipe(
        delay(1000)
    )
        
}
function timestamp() {
    return (new Date()).getTime() - start;
  }

let gets1 = ['get1_1', 'get1_2', 'get1_3', 'get1_4']
let posts = ['url-1', 'url-2', 'url-3', 'url-4'];
let gets2 = ['get2_1', 'get2_2', 'get2_3', 'get2_4']

//all posts must complet before any gets2 can start
 
 

function timestamp() {
  return (new Date()).getTime() - start;
}

var start = (new Date()).getTime();

from(gets1).pipe(
    concatMap(url => {
        console.log(timestamp() + ': Sending request to ' + url);
        return mockHTTPRequest(url);
      }) , 
      tap(response => console.log(timestamp() + ': ' + response)),

      concatMap(response => {
        console.log(timestamp() + ': Sending request to ' + response);
        let newUrl = 'url-' + response.length; // create new requests url
        return mockHTTPRequest(newUrl);
      }) , 
      tap(response => console.log(timestamp() + ': ' + response)),

      concatMap(response => {
        console.log(timestamp() + ': Sending request to ' + response);
        let newUrl = 'url-' + response.length; // create another requests url
        return mockHTTPRequest(newUrl);
      })
)
    

  
  .subscribe(response => console.log(timestamp() + ': ' + response));
