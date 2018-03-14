
import { Injectable, OnInit } from '@angular/core';
//import { Http, Response, Headers, RequestOptions, HttpModule } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http'

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap'
import { Observable } from 'rxjs';

import {
    IResPlan, ResPlan, IProject, Project, WorkUnits, Timescale
    , IInterval, Interval, IResource, Resource
} from '../ResourcePlans/res-plan.model'

declare var jquery:any;
declare var $ :any;

@Injectable()
export class SPListService {

    constructor(private http: HttpClient) { }
}

    // test2() {
    //     var call = $.ajax({
    //         url: "http://foo.wingtip.com/PWA/_api/Web/lists/GetByTitle('Test1')/items(2)",
    //         type: "POST",
    //         dataType: "json",
            
    //         data: JSON.stringify({
    //             "__metadata": { type: "SP.Data.Test1ListItem" },
    //             Title: "In Progress"
    //         }),

    //         //{"__metadata":{"type":"SP.Data.Test1ListItem"},"Title": "Hello World"}
    //         headers: {
    //             Accept: "application/json;odata=verbose",
    //             "Content-Type": "application/json;odata=verbose",
    //             "X-RequestDigest": "0x3AEF231987597435867B2DD9BF10A6552914FD221EED4465C9EE42C69E0A0D885A423AC092026667346EED341C08DFF9E0315C799B222E31116002F3612941EB,14 Sep 2017 15:27:54 -0000",
    //             "IF-MATCH": "*",
    //             "X-Http-Method": "PATCH"
    //         }
    //     });
    //     call.done(function (data, textStatus, jqXHR) {
    //         console.log('ok')
    //     });
    //     call.fail(function (jqXHR, textStatus, errorThrown) {
    //         console.log('nope')
    //     });


    // }







//     getFormDigestValue(): Observable<any> {

//         let context = new SPListContextInfo()
//         context.resourcePath = "/contextinfo/"
//         let url = context.location + context.service + context.resourcePath

//         let _headers = new Headers();
//         _headers.append('Authorization', 'Bearer ' + "");
//         _headers.append('accept', 'application/json;odata=verbose')
//         _headers.append('Content-Type', 'application/json;odata=verbose')



//         console.log(_headers)
//         // _headers.append('message', 'my neck hurts')

//         let foo = new HttpHeaders({
//             'Content-Type': 'application/json'
//             , 'accept': 'application/json;odata=verbose'
//         });

//         let body = '"{ hey ... this is some data }"'
// //                'accept': 'application/json;odata=verbose',
//        
//         let zoo: HttpHeaders = new HttpHeaders(
//             {
//                 'accept': 'application/json;odata=verbose'
//                 ,'Content-Type': 'text/plain'
           
//             })
           
//         console.log(zoo)

//         return this.http
//         .post(url, body, {
//           headers: zoo
          
//           ,withCredentials: true,
          
//         })



//     }

    // getListMetaData(listName): Observable<string> {

    //     //http://foo.wingtip.com/pwa/_api/web/lists/GetByTitle('Test1')
    //     let context = new SPListContextInfo()
    //     context.resourcePath = "/web/lists/GetByTitle"
    //     let url = context.location + context.service + context.resourcePath + "('" + listName + "')"

    //     let headers = new Headers();
    //     headers.append('accept', 'application/json;odata=verbose')
    //     let options = new RequestOptions({
    //         withCredentials: true,
    //         headers
    //     })
    //     return this.http.get(url, options)
    //         .map(data => {
    //             console.log('ListItemEntityTypeFullName: ' + data.json().d.ListItemEntityTypeFullName)
    //             return data.json().d.ListItemEntityTypeFullName
    //         })
    // }


    // updateUserStateProjects(listName, id): Observable<any> {

    //     let context = new SPListContextInfo()
    //     let obs1 = this.getFormDigestValue()
    //     let obs2 = this.getListMetaData(listName)
    //     return obs1.merge(obs2).toArray().flatMap((vals: string[]) => {
    //         context.entityTypeName = vals[1]
    //         context.formDigest = vals[0]
    //         context.resourcePath = `/web/lists/GetByTitle('${listName}')/items(${id}) `
    //         let url = context.location + context.service + context.resourcePath
    //         console.log('==============================' + vals[0], vals[1])

    //         let headers = new Headers(
    //             {
    //                 "Content-Type": "application/json;odata=verbose",
    //                 "X-Http-Method": "PATCH",
    //                 "X-RequestDigest": context.formDigest,
    //                 "IF-MATCH": "*"
    //             }
    //         );
    //         //headers.append('accept', 'application/json;odata=verbose')
    //         //headers.append('X-RequestDigest', context.formDigest)
    //         console.log('----form digest ----' + context.formDigest)
    //         console.log('----entity type name----' + context.entityTypeName)
    //         let options = new RequestOptions({
    //             withCredentials: true,
    //             headers
    //         })
    //         let body = `{"__metadata": { "type": "${context.entityTypeName}" }, "Title": "Test item added from Fiddler" }`
    //         console.log('------------body -------------', body)
    //         console.log('listEntityType before call: ' + context.entityTypeName)
    //         return this.http.post(url, body, options)
    //             .map(data => { return data.json().d })

    //     })
    // }

    // test(): Observable<any> {

    //     let context = new SPListContextInfo()
    //     context.formDigest = "0xE101F24D9D0092ECE632A3254F5331F2316B075AC445E3E4D46708F47566B231812702209A9576FFA3B50C48E390E7ABAA66F647CD86A88F6221FC9812E9DFEF,14 Sep 2017 14:26:00 -0000"
    //     context.resourcePath = `/web/lists/GetByTitle('Test1')/items(2) `
    //     let url = context.location + context.service + context.resourcePath
    //     let _headers = new HttpHeaders({ 
    //         // 'Accept': 'application/json;odata=verbose' 
    //         // ,'X-RequestDigest': context.formDigest
    //         // , 'Content-Type': 'text/plain'
    //         // ,'IF-MATCH': '*'
    //         // ,'X-HTTP-Method':'PATCH'
    //         'X-Http-Method': 'PATCH'
    //         ,'Content-Type': 'application/json;odata=verbose'
    //         ,'Accept': 'application/json;odata=verbose'
    //         ,'IF-MATCH': '*'
    //         ,'X-RequestDigest': '0xE38439B627BB08A28897525402A040065EB98019D3C8FFE2C48550F3DB234498B65F2A2E4354E26191D33C452E80053305F1D69BEB109A160AFD4BE1401D1F02,14 Sep 2017 14:34:17 -0000'
            
          
            
            

    //         // Accept: "application/json;odata=verbose",
    //         // "Content-Type": "application/json;odata=verbose",
    //         // "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
    //         // "IF-MATCH": item.__metadata.etag,
    //         // "X-Http-Method": "PATCH"
            
            
    //     });
        
    //     let body = '{"__metadata": { "type": "SP.Data.Test1ListItem" }, "Title": "Test item added from Fiddler" }'
    //     //let body = ""
    //     //this.http.

       
    //     return this.http.post(url, body, {
    //         headers: _headers
    //         })
    // }

    // // saveProduct(product: any): Observable<any> {
    // //     let headers = new Headers({ 'Content-Type': 'application/json' });
    // //     let options = new RequestOptions({ headers: headers });

    // //     if (product.id === 0) {
    // //         return 
    // //     }
    // //     return this.updateProduct(product, options);
    // // }


    // // private updateProduct(product: any, options: RequestOptions): Observable<any> {
    // //     const url = `${this.baseUrl}/${product.id}`;
    // //     return this.http.put(url, product, options)
    // //         .map(() => product)
    // //         .do(data => console.log('updateProduct: ' + JSON.stringify(data)))

    // // }




