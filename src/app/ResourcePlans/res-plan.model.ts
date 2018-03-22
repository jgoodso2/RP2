export interface IResPlan {
  resource: IResource
  projects?: IProject[];
}

export interface IProjectPlan
{
  project :IProject
  resources? : IResource[]
}

export interface IResource {
  resUid: string;
  resName?: string;
  rbs?: string
  timeSheetMgr?: string
  org?: {
    location: string;
    title: string;
    manager: string;
  };
  intervals?: IInterval[];
  timesheetData?: IInterval[];
}

export interface IProject {
  projUid: string;
  projName: string;
  readOnly?: boolean;
  stalePublish?: boolean;
  readOnlyReason?: string;
  owner?: string,
  projectChargeBackCategory?: string,
  startDate?: Date;
  finishDate?: Date;
  projActiveStatus?: ProjectActiveStatus;
  departments?: string;

  intervals?: IInterval[];
  timesheetData?: IInterval[];
}
export interface IInterval {

  intervalName: string;
  intervalValue: string;
  start?: Date
  end?: Date
}

export interface IQueryParams {
  fromDate: Date;
  toDate: Date;
  timescale: Timescale
  workunits: WorkUnits
  showTimesheetData: boolean
  planMode : PlanMode
}


export class ResPlan implements IResPlan {

  constructor(public resource: IResource = new Resource('0', ''),

    public projects: IProject[] = []) { }
}


export class Project implements IProject {

  constructor(public projUid = '', 
    public projName = '',
    public readOnly = false,
    public intervals: IInterval[] = [],
    public owner = '',
    public projectChargeBackCategory = '',
    public departments = '',
    public startDate = null, public finishDate = null,
    public projActiveStatus = ProjectActiveStatus.inProgress

  ) { }
}

export class Interval implements IInterval {

  constructor(public intervalName = '',
    public intervalValue = '', public start = new Date(), public end = new Date()
  ) { }

}

export class Resource implements IResource {
  constructor(public resUid = '0', public resName = '', public rbs = '', public timesheetMgr = '') { }
}

export enum PlanMode{
  ResourcePlan=1,
  ProjectPlan=2
}

export enum ProjectActiveStatus {
  inProgress = 1,
  completed = 2,
  cancelled = 3
}
export enum Timescale {
  days = 3,
  weeks = 4,
  calendarMonths = 5,
  quarters = 6,
  years = 7,
  financialMonths = 8
}
export enum WorkUnits {
  hours = 1,
  days = 2,
  FTE = 3
}

export interface IDept {
  deptName: string;
}



export class Config {
  projectServerUrl: string;
  ResPlanUserStateUrl: string;
  adapterUrl: string;
  projectPickerViewGuid: string;
  resourcePickerViewGuid: string;
}

export class Result {
  project: IProject;
  success: boolean;
  error: string;
  debugError: string;
  resUid: string;
}

