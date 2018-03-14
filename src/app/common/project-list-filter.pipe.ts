import { Pipe, PipeTransform } from '@angular/core';
import {IProject,IResPlan} from "../ResourcePlans/res-plan.model"
import { FormGroup,FormControl, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray, FormGroupName } from '@angular/forms';
@Pipe({
  name: 'projectListFilter'
})
export class ProjectListFilterPipe implements PipeTransform {

  transform(projects: FormControl[],resPlan:FormGroup): FormControl[] {
     projects = projects.filter(val => {
       
       if(resPlan.value.projects.map(t=>t.projUid.toUpperCase()).indexOf(val.value.projUid.toUpperCase())< 0)
       return val;
    })
      return projects;
      
    }
}

