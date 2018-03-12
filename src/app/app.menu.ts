import { MenuItem } from '../fw/services/menu.service';
// import { AppStateService } from './services/app-state.service'

// export let foo: AppStateService
import { CurrentCalendarYear, CurrentFiscalYear, Next12Months, NextYear , LastYear } from './common/utilities'

export let _currentCalYear = new CurrentCalendarYear()
export let _CurrentFiscalYer = new CurrentFiscalYear()
export let _next12Months = new Next12Months()
export let _nextYear = new NextYear()
export let _lastYear = new LastYear()


export let initialMenuItems: Array<MenuItem> = [
  
    {
        text: 'Date Range',
        icon: '	glyphicon-calendar',
        route: null,
        submenu: [
            {
                text: 'This Year',
                icon: 'glyphicon-calendar',
                route: '/home/resPlans',
                params: {
                    fromDate: _currentCalYear.startDate,
                    toDate: _currentCalYear.endDate
                },
                submenu: null
            },
            {
                text: 'Next 12 Months',
                icon: 'glyphicon-calendar',
                route: '/home/resPlans',
                params: {
                    fromDate: _next12Months.startDate,
                    toDate: _next12Months.endDate
                },
                submenu: null
            },
            {
                text: 'Next Year',
                icon: 'glyphicon-calendar',
                route: '/home/resPlans',
                params: {
                    fromDate: _nextYear.startDate,
                    toDate: _nextYear.endDate
                },
                submenu: null
            },
            {
                text: 'Last Year',
                icon: 'glyphicon-calendar',
                route: '/home/resPlans',
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
                route: '/home/resPlans',
                params: {
                    workunits: '3'
                },
                submenu: null
            }
            , {
                text: 'Days',
                icon: '',
                route: '/home/resPlans',
                params: {
                    workunits: '2'
                },
                submenu: null
            },
            {
                text: 'Hours',
                icon: '',
                route: '/home/resPlans',
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
                route: '/home/resPlans',
                params: {
                    timescale: '5'
                },
                submenu: null
            }
            , {
                text: 'Years',
                icon: '',
                route: '/home/resPlans',
                params: {
                    timescale: '7'
                },
                submenu: null
            },
            {
                text: 'Weeks',
                icon: '',
                route: '/home/resPlans',
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
        params: {}
    }
    
    
];