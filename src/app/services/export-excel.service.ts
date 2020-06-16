import { Injectable } from  '@angular/core';
//import { debug } from 'util';
import * as moment from 'moment';

@Injectable()
export class ExportExcelService {

excelObject = {
    _fallbacktoCSV: true,  
    toXLS: function(tableId, filename) {   
      this._filename = (typeof filename == 'undefined') ? tableId : filename;
      
      //var ieVersion = this._getMsieVersion();
      //Fallback to CSV for IE & Edge
      if ((this._getMsieVersion() || this._isFirefox()) && this._fallbacktoCSV) {
        return this.toCSV(tableId);
      } else if (this._getMsieVersion() || this._isFirefox()) {
        alert("Not supported browser");
      }
  
      //Other Browser can download xls
      var htmltable = document.getElementById(tableId);
      var html = htmltable.outerHTML;
      this._downloadAnchor("data:application/vnd.ms-excel" + encodeURIComponent(html), 'xls'); 
    },
    toCSV: function(resPlans, filename) {
      
      this._filename = (typeof filename === 'undefined') ? resPlans : filename;
      // Generate our CSV string from out HTML Table
      // var csv = this._tableToCSV(document.getElementById(tableId));
      // console.log(csv, "this is the csv if it exists");
      // Create a CSV Blob
      
      let planArray = resPlans;
      let flatResplanData = [];
      console.log('this is the planArray', planArray);
      //plan is an Object
      let  plan = planArray.forEach((plan) => {
        console.log(plan);
        let flatResPlan = [];
        flatResPlan.push(plan.resource.resName); //at this point the resource name is in the flatResPlan.
        


        if (plan.projects.length < 1){
          flatResplanData.push(plan.resource.resName);
          flatResPlan = [];
        }
        else {
           plan.projects.forEach( (project) =>{ //plan.projects is an Array
            flatResPlan.push([project.projName +", "+ project.intervals.map(function(intervalObj){return [intervalObj.intervalValue]})]);
            // console.log("this is a test", project.intervals.map(function(intervalObj){ return intervalObj['intervalValue']}));
            // console.log("this is a test for project.intervals array:", project.intervals);
            flatResplanData.push(flatResPlan);
            flatResPlan = [];
          })

        }
                
      });

      let flatterResPlanData = [];
      //flatResplanData is an "array of arrays of resPlanData."
      console.log(flatResplanData, "this is flat resplan data Johnny");
      flatResplanData.forEach((rowArray: any) => {
        try {
          flatterResPlanData.push(rowArray.split(","));
        }
        catch {
          flatterResPlanData.push(rowArray);
        }
      })
      console.log(flatterResPlanData, "flatterResPlanData here.......");
      let standardizeFlatData = flatterResPlanData.join(",").split(",").join("\r\n");
      // let yeahBudd = flatResplanData[2].join();
      // console.log("this is yeahBuddy", yeahBudd.split(","));
      // let pretty = flatResplanData;
      // console.log("quick Look", pretty[0],"the length is: ", pretty[0].length,"this is quick look again after name:" ,pretty[1], "pretty 1 length", pretty[1].length);
      // let reallyPretty = pretty.map((array) => {
      //   if(array.length == 2) {
      //     return array.splice(1,0,"\r\n");
      //   }
      //   else{
      //     return array;
      //   }
               
      // });
      // console.log("is this reallyPretty", reallyPretty);
      // console.log(flatResplanData, "flat res plan data geez");
      // let flatterCSV = [];
      // let flatCSV = flatResplanData.forEach((rowArray) =>{
      //     flatterCSV.push(rowArray.join(','));
      //     //  let delimiter = rowArray.join(",");
      //     //  let spacing = delimiter.join("\r\n");
      //     //  console.log(spacing, "what is the spacing....");
      //     //  return spacing;
      // })
      // let formTwo = flatResplanData.forEach((rArray) =>{
      //   rArray[2].join(",")
      // })
      // console.log(flatterCSV, "this is the flatter csv...");
      // console.log(flatResplanData, "this is flat ResPlanData");
      // console.log("this is the flat CSV", flatCSV);
      // let csv = flatCSV;
      let csv = standardizeFlatData;
      var blob = new Blob([csv], { type: "text/csv" });
  
      // Determine which approach to take for the download
      if (navigator.msSaveOrOpenBlob) {
      // Works for Internet Explorer and Microsoft Edge
        navigator.msSaveOrOpenBlob(blob, this._filename + ".csv");
      } else {      
        this._downloadAnchor(URL.createObjectURL(blob), 'csv');      
      }
    },
    transformToCSX: function(resplanData, filename) {
      let excelString: string = ',,';
      console.log(resplanData, "this is the resPlan....")
      for (var i=0; i < resplanData.length; i++) {
        if (resplanData[i].projects.length > 0) {
          console.log(resplanData[i].resource.resName, "this person!");

          break;
        }
        else {
          continue
        }
      }//end for block
    },

    transformToCSV: function(resPlanData, filename) {
       //build the first row (dates) - only 1 please
   
      let excelData: string = ',,';

      for (var i = 0; i < resPlanData.length; i++ ) {
        if (resPlanData[i].projects.length > 0) {
          resPlanData[i].projects[0].intervals.forEach(interval=> {
            excelData +=  moment(interval.start).format('MM/DD/YY') +' - ' + moment(interval.end).format('MM/DD/YY') + ',' 
          })   
          excelData += '\r\n' 
          break
        }
        else {
          
          continue
        }  
        
      }

      resPlanData.forEach(resPlan => {
        
          let resourcename = resPlan.resource.resName;
          let intervalNames : string[];
          
          if (resPlan.projects.length > 0) {
              resPlan.projects.forEach(project=>{
                excelData += resourcename +',';
                excelData += project.projName + ','
                project.intervals.forEach(interval => {
                  excelData += interval.intervalValue.toString() + ','
               })
               excelData += '\r\n'
          
               if (project.timesheetData !== null) {
                 excelData += 'Actuals,,'
                 project.timesheetData.forEach((timesheetInterval) => {
                   excelData += timesheetInterval.intervalValue.toString() + ','
                 })
                 excelData += '\r\n'
                 
               }//end if statement testing whether timesheet data is available
              
              });//end of single project instance
          }
          else {
              excelData += resourcename + ','  + '\r\n'
          }   
      }); //end of data collection
      console.log('excelData works:', excelData);
      let csv = excelData;  
      var blob = new Blob([csv], { type: "text/csv" });
  
      // Determine which approach to take for the download
      if (navigator.msSaveOrOpenBlob) {
      // Works for Internet Explorer and Microsoft Edge
        navigator.msSaveOrOpenBlob(blob, this._filename + ".csv");
      } else {      
        this._downloadAnchor(URL.createObjectURL(blob), 'csv');      
      }

  },



    _getMsieVersion: function() {
      var ua = window.navigator.userAgent;
  
      var msie = ua.indexOf("MSIE ");
      if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
      }
  
      var trident = ua.indexOf("Trident/");
      if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf("rv:");
        return parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
      }
  
      var edge = ua.indexOf("Edge/");
      if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
      }
  
      // other browser
      return false;
    },
    _isFirefox: function(){
      if (navigator.userAgent.indexOf("Firefox") > 0) {
        return 1;
      }
      
      return 0;
    },
    _downloadAnchor: function(content, ext) {
        var anchor = document.createElement("a");
        // anchor.style= "display:none !important";
        anchor.id = "downloadanchor";
        document.body.appendChild(anchor);
  
        // If the [download] attribute is supported, try to use it
        if ("download" in anchor) {
          anchor.download = this._filename + "." + ext;
        }
        anchor.href = content;
        anchor.click();
        anchor.remove();
    },
    _tableToCSV: function(table) {
      // We'll be co-opting `slice` to create arrays
      var slice = Array.prototype.slice;
      let tableRows = slice.call(table.getElementsByTagName("tr"));
      console.log("trs",tableRows);
      tableRows.map(function(row) {
       console.log(row.cells, "ProjectNames");
      //  console.log(body.cells)
      //  console.log()
      })

    }
};//end of excelObject
    
}//end of Class
