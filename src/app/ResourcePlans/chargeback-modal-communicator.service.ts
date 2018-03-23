import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import {Lookup} from "./res-plan.model"
 import { Observable} from  'rxjs'
@Injectable()
export class ChargebackModalCommunicatorService {

  constructor() { }
 
  // Observable string sources
  public selectedChargebacks:Lookup[];
  private modalSubmittedSource = new Subject<string>();
  private modalCancelledSource = new Subject<string>(); 
  private chargebackSelectedSource = new Subject<Lookup[]>();
  // Observable string streams
  //projectIdArray$ = this.projectIdArraySource.asObservable();
  modalSubmitted$ = this.modalSubmittedSource.asObservable();
  modalCancelled$ = this.modalCancelledSource.asObservable();
  chargebackSelected$ = this.chargebackSelectedSource.asObservable();
 chargebacksSelected(chargebackSelected:Lookup[])
 {
   this.chargebackSelectedSource.next(chargebackSelected);
 }
  
  modalSubmitClicked() {
    //; 
    this.modalSubmittedSource.next();
  }

  modalCancelClicked() {
    
    this.modalCancelledSource.next();
  }

  
}