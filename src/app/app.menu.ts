import { MenuItem } from '../fw/services/menu.service';
import { AppStateService } from './services/app-state.service'
import {ReflectiveInjector} from '@angular/core';
// export let foo: AppStateService
import { CurrentCalendarYear, CurrentFiscalYear, Next12Months, NextYear , LastYear } from './common/utilities'

export let _currentCalYear = new CurrentCalendarYear()
export let _CurrentFiscalYer = new CurrentFiscalYear()
export let _next12Months = new Next12Months()
export let _nextYear = new NextYear()
export let _lastYear = new LastYear()
let injector = ReflectiveInjector.resolveAndCreate([AppStateService]); 
let _appStateSvc = injector.get(AppStateService);

export let initialMenuItems: Array<MenuItem> = [
    {
        
        text: 'Date Range',
        icon: '	glyphicon-calendar',
        route: null,
        submenu: [
            {
                text: 'This Year',
                icon: 'glyphicon-calendar',
                route: '',
                params: {
                    fromDate: _currentCalYear.startDate,
                    toDate: _currentCalYear.endDate
                },
                submenu: null
            },
            {
                text: 'Next 12 Months',
                icon: 'glyphicon-calendar',
                route: '',
                params: {
                    fromDate: _next12Months.startDate,
                    toDate: _next12Months.endDate
                },
                submenu: null
            },
            {
                text: 'Next Year',
                icon: 'glyphicon-calendar',
                route: '',
                params: {
                    fromDate: _nextYear.startDate,
                    toDate: _nextYear.endDate
                },
                submenu: null
            },
            {
                text: 'Last Year',
                icon: 'glyphicon-calendar',
                route: '',
                params: {
                    fromDate: _lastYear.startDate,
                    toDate: _lastYear.endDate
                },
                submenu: null
            },

            {
                text: 'Custom Dates',
                icon: 'glyphicon-calendar',
                route: '/home/customDates',
                submenu: null,
                params: {}
            }, 
            
        ],
    }
    ,
    {
        text: 'Work Scale',
        icon: 'glyphicon-dashboard',
        route: null,
        submenu: [
            {
                text: 'Percentage',
                icon: '',
                route: '',
                params: {
                    workunits: '3'
                },
                submenu: null
            }
            , {
                text: 'Days',
                icon: '',
                route: '',
                params: {
                    workunits: '2'
                },
                submenu: null
            },
            {
                text: 'Hours',
                icon: '',
                route: '',
                params: {
                    workunits: '1'
                },
                submenu: null
            }
            
        ]
    },
    {
        text: 'Time Scale',
        icon: 'glyphicon-dashboard',
        route: null,
        submenu: [
            {
                text: 'Months',
                icon: '',
                route: '',
                params: {
                    timescale: '5'
                },
                submenu: null
            }
            , {
                text: 'Years',
                icon: '',
                route: '',
                params: {
                    timescale: '7'
                },
                submenu: null
            },
            {
                text: 'Weeks',
                icon: '',
                route: '',
                params: {
                    timescale: '4'
                },
                submenu: null
            }
            
        ]
    }, 
    {
        text: 'pivot',
        icon: 'glyphicon-calendar',
        route: '/home/pivot',
        submenu: null,
        params: {
            planMode : '2'
        }
    }
    
    
];