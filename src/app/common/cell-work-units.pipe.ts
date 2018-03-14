import { Pipe, PipeTransform } from '@angular/core';
import {WorkUnits} from "../ResourcePlans/res-plan.model"
@Pipe({
  name: 'cellWorkUnits'
})
export class CellWorkUnitsPipe implements PipeTransform {

 
  transform(value: string, workUnits: WorkUnits): string {
   
    if(value == "NA")
    {
      return value;
    }
    return this.getValue(value,workUnits);
  }

  getValue(value: string, workUnits: WorkUnits) : string
  {
    if(workUnits == WorkUnits.FTE)
    {
      return value.replace("%","") + "%"
    }
    else if(workUnits == WorkUnits.hours)
    {
      return value.replace("hrs","").replace("hr","").replace("h","") + "hrs"
    }

    else if(workUnits == WorkUnits.days)
    {
      return value.replace("d","") + "d"
    }
    else{
      return value;
    }
    
  }

}
