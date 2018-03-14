import { Pipe, PipeTransform } from '@angular/core';
import {WorkUnits} from "../ResourcePlans/res-plan.model"
@Pipe({
  name: 'interval'
})
export class IntervalPipe  {

  transform(value: string, workUnits: WorkUnits): string {
    return this.getValue(value,workUnits);
  }

  getValue(value: string, workUnits: WorkUnits) : string
  {
    if(workUnits == WorkUnits.FTE)
    {
      return (+(value) * 100).toFixed(0)
    }
    return (+(value)).toFixed(0);
  }
  
}
