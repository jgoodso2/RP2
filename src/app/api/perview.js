<script src="jquery-1.9.1.js"></script>
<link  rel="stylesheet" type="text/css" href="bootstrap/Content/bootstrap.css" ></link>
<script src="bootstrap/Scripts/bootstrap.js"></script>
<script src="promise704.js"></script>
<script src="ScoreCard1config.js"></script>
<style>
.col-md-12:nth-child(odd) {
    background-color: #f2f2f2;

}
.col-md-12:nth-child(even) {
    background-color: #fff;
    padding-left:30px;

}
</style>

<script>

var ROWS;
var HEADERROWINDEX;
var HEADERCOLUMNNAMES
var OBJECTMODELDATA;
var LAYOUT;
var HEADERROW;
var FIRST20ROWS;  //used to find worksheet header row
var EXECUTE = true;
var PAGELOAD = true;
var PREVIOUSPOPOVER;

var tempArray = [];


var AddShiftedPropertyToCell = function (ROWS) {  //when we read nglr rows... we set shifted to false...
    //debugger;
    for (var i = 0; i < ROWS.length; i++) {
        var columnsInCurrentRow = $(ROWS[i]).find('.ewr-ca');
        for (var j = 0; j < columnsInCurrentRow.length; j++) {
            $(ROWS[i]).find('.ewr-ca')[j].shifted = false;
        }
    }
}

var BuildRows = function () {
    ROWS = $('.ewr-nglr');
    //AddShiftedPropertyToCell(ROWS);
}

//var mappings = [{
//    'Column': 'Project Name', 'Click': '', 'Hover': ['Project Description','Executive Status', 'Go Live Date', 'Phase', 'Sponsor','Business Owner','Last Published',  'Project Status Report'
//        , 'Project Manager'], Show: true
//}
//    , { 'Column': 'Business Owner', 'Click': '', 'Hover': null, Show: false }

//        , { 'Column': 'Executive Status', 'Click': '', 'Hover': null, Show: false }
//        , { 'Column': 'Go Live Date', 'Click': '', 'Hover': null, Show: false }
//        , { 'Column': 'Last Published', 'Click': '', 'Hover': null, Show: false }
//          , { 'Column': 'Project Modified Last 30 Days', 'Click': '', 'Hover': null, Show: false }
//        , { 'Column': 'PM Assessment', 'Click': '', 'Hover': ['Executive Status'], Show: true }
//         , { 'Column': 'PM Assessment Trend', 'Click': '', 'Hover': null, Show: true }
//         , { 'Column': 'Milestone Hit Rate', 'Click': '', 'Hover': ['Overdue Milestones','e Mail PM'], Show: true }
//         , { 'Column': 'Schedule Health', 'Click': '', 'Hover': ['Overdue Tasks', 'Overdue Milestones', 'e Mail PM'], Show: true }
//         , { 'Column': 'Overall Health', 'Click': '', 'Hover': ['Project Status Report','e Mail PM',], Show: true }
//          , { 'Column': 'Deliverable Hit Rate', 'Click': '', 'Hover': null, Show: true } 
//         , { 'Column': 'e Mail PM', 'Click': '', 'Hover': null, Show: false }

//             //, { 'Column': 'Timesheet Hrs', 'Click': '', 'Hover': null, Show: false }
//                 , { 'Column': 'Overdue Milestones', 'Click': '', 'Hover': null, Show: false }
//                 , { 'Column': 'Overdue Tasks', 'Click': '', 'Hover': null, Show: false }
//                    // , { 'Column': 'Parent Program', 'Click': '', 'Hover': null, Show: false }
//                         , { 'Column': 'Project Chargeback Category', 'Click': '', 'Hover': null, Show: false }
//                             , { 'Column': 'Project Description Text', 'Click': '', 'Hover': null, Show: false }
//                                 , { 'Column': 'Project Duration', 'Click': '', 'Hover': null, Show: false }
//                                    , { 'Column': 'Project Status Report', 'Click': '', 'Hover': null, Show: false }
//                                       //, { 'Column': 'Shell Project', 'Click': '', 'Hover': null, Show: false }
//                                       , { 'Column': 'Phase', 'Click': '', 'Hover': null, Show: false }
//                                       , { 'Column': 'Sponsor', 'Click': '', 'Hover': null, Show: false }
//];

var BuildLayoutMappings = function (headerColumnNames, mappings, _headerRow) {
    //debugger
    layout = [];  //initialize

    var columnsInHeaderRow = $(_headerRow).find('.ewr-ca');
    var offset = 0;

    for (var i = 0; i < Object.keys(headerColumnNames).length; i++) {  //note function to count the keys 

        var layoutRow = { 'colIndex': '', 'colName': '', 'left': 0, 'width': 0, 'show': false, 'offset': 0, 'modifiedLeft': 0 };
        //console.log(headerColumnNames[0][i]);
        layoutRow.colIndex = i;
        //layoutRow.colName = headerColumnNames[0][i];
        layoutRow.colName = headerColumnNames[i];

        try {
            layoutRow.left = parseInt($(columnsInHeaderRow[i]).css('left').replace('px', ''));
            layoutRow.width = parseInt($(columnsInHeaderRow[i]).css('width').replace('px', ''));
        }
        catch (x) {
            console.log(i);
            console.log(columnsInHeaderRow[i])
        }


        //getting show from mappings
        for (var j = 0; j < mappings.length; j++) {
            // debugger;
            if (headerColumnNames[i] == mappings[j].Column) {
                layoutRow.show = mappings[j].Show;
                continue;  //break out of for loop
            }
        }
        //debugger;

        layoutRow.offset = offset;
        layoutRow.modifiedLeft = layoutRow.left - offset;
        if (layoutRow.show == false) {
            layoutRow.modifiedLeft = -1000;  // make a hide row obvious by setting left property to negative
            offset = offset + layoutRow.width;
        }

        layout.push(layoutRow);
    };
    return layout;
}
//var columnCount = $(headerRow).find('.ewr-ca').length;

var ShiftColumns = function (ROWS, layout) {
    //debugger;
    for (var i = parseInt(HEADERROWINDEX) ; i < ROWS.length; i++) {
        var columnsInCurrentRow = $(ROWS[i]).find('.ewr-ca');
        for (var j = 0; j < columnsInCurrentRow.length; j++) {
            var cell = $(ROWS[i]).find('.ewr-ca')[j];

            var cellLeft = parseInt($(cell).css('left').replace('px', '')); // get integer value of css left for cell 
            //debugger;

            for (var k = 0; k < layout.length; k++) {     ///

                if (cellLeft > layout[k].left - 10 && cellLeft < layout[k].left + 10 && cell.shifted == false) {
                    $($(ROWS[i]).find('.ewr-ca')[j]).css('left', layout[k].modifiedLeft + 'px');
                    $(ROWS[i]).find('.ewr-ca')[j].shifted = true;
                }
            }
        }
    }
}

function getRangeValues(asyncResult, fulfill) {
    //debugger
    // Get the value from asyncResult if the asynchronous operation was successful.
    if (asyncResult.getCode() == 0) {
        // Get the array of range values from asyncResult.
        var values = asyncResult.getReturnValue();
        //console.log("values.length: ", values.length);

        fulfill(values);
        //return values;
    }
    else {
        alert('Operation failed with error message ' + asyncResult.getDescription() + '.');
    }
};

function initializeGlobalVars(values) {

    FIRST20ROWS = values;
    HEADERROWINDEX = getHeaderRowIndex(mappings, FIRST20ROWS);   // compare mappings and first 20 rows of data to find header row index  *UNCHANGING*
    var headerColumnNames = FIRST20ROWS[HEADERROWINDEX];  //get the header row column names as they appear on the Excel web part  *UNCHANGING*
    HEADERROW = $('.ewr-nglr')[HEADERROWINDEX];  //get header row with formatting details  *UNCHANGING*
    LAYOUT = BuildLayoutMappings(headerColumnNames, mappings, HEADERROW);  // build cheat sheet for layout   *UNCHANGING*
}

function ReadCellData(qtyRows, qtyColumns) {
    var ewa;
    var sheetName;
    var range;

    return new Promise(function (fulfill, reject) {
        ewa = Ewa.EwaControl.getInstances().getItem(0);
        //var wb = ewa.getActiveWorkbook()
        sheetName = ewa.getActiveWorkbook().getActiveSelection().$C7.getName();
        range = ewa.getActiveWorkbook().getRange(sheetName, 0, 0, qtyRows, qtyColumns);
        var values = range.getValuesAsync(1, function (asyncResult) { getRangeValues(asyncResult, fulfill); }, null);

    });
}

var getHeaderRowIndex = function (mappings, data) {
    for (var rowIndex in data) {
        var counter = 0;
        for (var cellIndex in data[rowIndex]) {
            for (var mappingColumnIndex in mappings) {
                if (data[rowIndex][cellIndex] == mappings[mappingColumnIndex].Column) {
                    counter++;  //isColumnFound = true;        
                }
                else {
                    //console.log('non match: ', data[rowIndex][cellIndex], mappings[mappingColumnIndex].Column);
                }
            }
        }

        if (counter > mappings.length * .5) {   // more than half of the mappings found
            console.log('Header Row Index Found at index: ', rowIndex);
            return rowIndex;
        }
    }
}

function synchTheGrid() {

    console.log('synchTheGrid fired');
    BuildRows();  //get ewr-nglr rows 
    AddShiftedPropertyToCell(ROWS);   // add "shifted" property to columns in each nglr row.  Initialize value to false
    ShiftColumns(ROWS, LAYOUT);
    addHoverInfo(ROWS, LAYOUT);

}

function gridSynchronized() {
    if (PAGELOAD == true) {
        //initialize global vars here
        ReadCellData(400, mappings.length)
        .then(function (values) {
            initializeGlobalVars(values);
            OBJECTMODELDATA = values;
            synchTheGrid();   //this doesn't wait.   
        });
        PAGELOAD = false;
    }
    else {
        ReadCellData(400, mappings.length).then(function (values) {
            OBJECTMODELDATA = values;
            console.log('Object Model Data ready');
            synchTheGrid();   //this waits.   

        });

        //addHoverInfo()

    }
}

$(document).ready(function () {
    if (EXECUTE == true) {
        console.log("entering PageLoad function");
        //SP.SOD.loadMultiple(['sp.js', 'callout.js'], function () { });
        Ewa.EwaControl.add_applicationReady(AppReady);  /// get a reference to the collection of Excel Web Access Web Parts on the page and then uses the Ewa.EwaControlCollection.getItem(index) method get a separate reference to each of the two Excel Web Access Web Parts on the page. The code example assumes that you are working with Excel Web Access Web Parts on SharePoint Server 2013.

    }
});

function AppReady() {
    console.log("entering AppReady");
    myEwa = Ewa.EwaControl.getInstances().getItem(0);  // get first instance of excel web part
    if (myEwa) {
        myEwa.add_gridSynchronized(gridSynchronized);  // call SetHyperLinks when grid is fully loaded.  
    }
}

var addHoverInfo = function (ROWS, layout) {
    
    //var k = 0;
    for (var m = 0; m < mappings.length; m++) {
        //debugger;
        for (var i = parseInt(HEADERROWINDEX) + 1; i < ROWS.length; i++) {
            var title = $($(ROWS[i]).find('.cv-nwl')[0]).text();
            if (mappings[m].Hover && mappings[m].Hover.length > 0) {
                var currentCell = getCellByColumnName(ROWS[i], mappings[m].Column);
                var hoverCellBuilder = "";
                var emailMarkups =[];
                for (var j = 0; j < mappings[m].Hover.length; j++) {
                    try {
                        var isEmailLink = { value:false};

                        var hoverColumnIndex = getColumnIndexByColumnName(mappings[m].Hover[j]);
                        var hoverCellContent = getCellValueByColumnName(i, hoverColumnIndex);
                        
                        hoverCellContent = contentPreProcessor.checkForInvalidDate(hoverCellContent);
                        hoverCellContent = contentPreProcessor.checkForNull(hoverCellContent);
                        hoverCellContent = contentPreProcessor.convertToList(hoverCellContent);
                        hoverCellContent = contentPreProcessor.convertURLtoFriendlyURL(hoverCellContent);
                        hoverCellContent = contentPreProcessor.convertEmailToLink(hoverCellContent,isEmailLink);
                        //hoverCellContent = contentPreProcessor.convertEmailToLink(hoverCellContent);
                        var bootstrapRowContent =  buildHoverCellContent(mappings[m].Hover[j], hoverCellContent);  // a single row in hover eg (OverDue Milestones + list of overdue milestones)
                        if(isEmailLink.value === true)
                        {
                            
                            emailMarkups.push(bootstrapRowContent);
                        }
                        hoverCellBuilder += bootstrapRowContent; // 
                    }
                    catch (ex) {
                        console.log('Exception: ', i + hoverColumnIndex);
                        //debugger;
                    }
                }
                ///CONVERT HERE BEFORE CALLING MAKEHOVER
       
                var re = /[@]/;
                var li = /[li]/;
                var subject;
                var body = 'hello world';
                if (re.test(hoverCellBuilder) && li.test(hoverCellBuilder)) {
                    subject = title + " - " + mappings[m].Column;
                    var htmlChars = /(<([^>]+)>)/;
                    //replace(/(<([^>]+)>),'');
                    body = hoverCellBuilder;
                    for(var index in emailMarkups)
                    {
                        body = body.replace(emailMarkups[index],"");
                    }
                    //body = $(hoverCellBuilder).text();
                    body = body.replace(/<style([\s\S]*?)<\/style>/gi, '');
                    body = body.replace(/<script([\s\S]*?)<\/script>/gi, '');
                    body = body.replace(/<\/div>/ig, '\f');
                    body = body.replace(/<\/li>/ig, '\f');
                    body = body.replace(/<li>/ig, '  *  ');
                    body = body.replace(/<\/ul>/ig, '\f');
                    body = body.replace(/<\/p>/ig, '\f');
                    body = body.replace(/<br\s*[\/]?>/gi, "\f");
                    body = body.replace(/<[^>]+>/ig, '');
                    body = body.replace(/\&/ig, "and");
                


                    hoverCellBuilder = hoverCellBuilder.replace('_eMailsubject_', subject);    
                    hoverCellBuilder =  hoverCellBuilder.replace('_eMailBody_', body);
                    debugger;  
                }
  
                makeHover(currentCell, hoverCellBuilder, title);
       
            }
        }
    }
}

var contentPreProcessor = {

    checkForInvalidDate: function(str) {
        //regex to fix bad date
        //var regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        //if (regex.test(str)) {
        //    return str
        //}
        //else { return ''; }
        if (str !== '12:00:00 AM') {
            return str;
        }
        else { return ''; }
    },

    checkForNull: function (str) {
        if (str && str.length > 0) {
            return str;
        }
        else { return '</br>'; }  
    }, 
    convertToList: function (str) {
        if (str.indexOf("|") > -1)
            return '<ul><li>' + str.split('|').join('</li><li>') + '</li></ul>';
        else
            return str;
    },
    convertEmailAddressToAnchor: function (str) {

        return convertedStr;
    },
    convertURLtoFriendlyURL: function (str) {
        //debugger;
        var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if (regex.test(str)) {
            //check for a report...     
            var reportNameExpression = /[^/]*\b.rdl/;
            if (reportNameExpression.test(str)) {
               
                var reportNameMatch = str.match(reportNameExpression);
                var reportName = reportNameMatch[0].replace(".rdl", "").replace("\/", "").replace("%20", ' ');
                return '<div class="ProjectStatusURLRef"><a href="' + str + '" target= "_blank">' + reportName + ' </a></div>';
            }
            else {
                return '<a href="' + str + '" target="_blank">' + str + '</a>';
            }
        }
        else {
            return str;
        }
    }, 
    convertEmailToLink: function (str,isEmail) {
        var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailRegex.test(str)) {
            //var emailPM = 'eMailPlaceholder';
            var emailPM = str; 
            var subject = '_eMailsubject_'; 
            var body = '_eMailBody_';
       
            //body = '%C2%B0item 1\f %C2%B0 item 2\f%E2%80%A2item 3\f%E2%80%A2    item 4\n%E2%80%A2 item 5 ';
            
            var emailLink = '<div><a href="mailto:' + emailPM + '?Body=' + body + '&Subject=' + subject + '">' + 'eMail the PM' + '</a></div>'
            isEmail.value = true;
            return emailLink;
        }
        else { return str; }
    }
}


var getCellValueByColumnName = function (rowIndex, columnIndex) {
    return OBJECTMODELDATA[rowIndex][columnIndex];

}
var getCellByColumnName = function (row, columnName) {

    var layoutItem;
    for (var i = 0; i < LAYOUT.length; i++) {
        if (LAYOUT[i].colName == columnName) {
            layoutItem = LAYOUT[i];
            break;
        }
    }

    var cells = $(row).find(".ewr-ca");
    for (var j = 0; j < cells.length; j++) {
        if ($(cells[j]).css('left').replace('px', '') == layoutItem.modifiedLeft) {
            return cells[j];
        }
    }
    return null;
}
var getColumnIndexByColumnName = function (columnName) {

    var layoutItem;
    for (var i = 0; i < LAYOUT.length; i++) {
        if (LAYOUT[i].colName == columnName) {
            layoutItem = LAYOUT[i];
            break;
        }
    }
    return layoutItem.colIndex;
}
var buildHoverCellContent = function (columnName, content) {
    return "<div class='col-md-12'>" + columnName + "</div><div class='col-md-12'>" + content + "</div>";
}

var makeHover = function (cell, content, title) {
    var launchPoint;
    
    //debugger
    //find content cell within cell to host pop over is called launchPoint--- can be isb or cv-nwl
    if ($(cell).find(".isb").length > 0) {
        //debugger;
        launchPoint = $(cell).find(".isb")[0];
    }
    else {
        launchPoint = $(cell).find(".cv-nwl")[0];
        $(launchPoint).css("width", "auto"); // make it auto width so as pop over can appear right to the left of content
    }
    if (launchPoint) {
        $(launchPoint).popover({
            html: true,
            content: content,
            trigger: "manual",
            animation: false,
            container: 'body',
            //title: 'foo',
            title: '<div class="popover-title" >' + '<strong>' + title + '<strong>' + '</div>',
            template: '<div class="popover container" style="min-width:600px;"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div>'
        }).on("mouseenter", function () {   // custom function so that we can click links inside the popover
            var _this = this;
            if (PREVIOUSPOPOVER) {
                $(PREVIOUSPOPOVER).popover('hide');
            }
            $(this).popover("show");
            $(".popover").on("mouseleave", function () {
                $(_this).popover('hide');
            });
            PREVIOUSPOPOVER = this;
        }).on("mouseleave", function () {
            var _this = this;
            setTimeout(function () {
                if (!$(".popover:hover").length) {
                    $(_this).popover("hide");
                }
            }, 300);
        });
    }
}


//formatting text.... 1) null check, clickify url,eMailify, listify
//formatting Popover.... 1) title
//sticky column header... add css class to header row...



</script>