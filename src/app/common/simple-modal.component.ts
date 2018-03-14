import { Component, Input, ViewChild, ElementRef, OnInit} from '@angular/core';
import { ModalCommunicator} from '../ResourcePlans/modal-communicator.service';
import { Subject }    from 'rxjs/Subject';
 import { Observable} from  'rxjs'

declare var jquery:any;
declare var $ :any;



@Component({
  selector: 'simple-modal',
  template: `
  <div id="{{elementId}}" #modalcontainer class="modal fade" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
        <h4 class="modal-title">{{title}}</h4>
      </div>
      <div class="modal-body">
        <ng-content></ng-content>

      </div>
      <div class = "modal-footer">
      <button type="button" (click) = "submit()" class="btn btn-primary">{{primaryBtnText}} </button>
      <button type="button" class="btn btn-cancel" (click)="closeModal()">Cancel</button>
      </div>
    </div>
  </div>
</div>

  `,
  styles: [`
    .modal-body { height: auto; overflow-y: scroll;width:auto; }, 
    .modal-dialog { position: absolute; margin-left: 200px; height: 400px; width: auto;}

  `]
})
export class SimpleModalComponent {
  @Input() title: string;   // passed in from the parent component's markup
  @Input() elementId: string;  //ditto
  @Input() closeOnBodyClick: string;
  @Input() primaryBtnText: string; 
  @ViewChild('modalcontainer') containerEl: ElementRef;
  modalId:string;

  private modalSubmittedSource = new Subject<string>();
  modalSubmitted$ = this.modalSubmittedSource.asObservable();
  
  constructor( ) {}

  closeModal() {
    if(this.closeOnBodyClick.toLocaleLowerCase() === "true") {
      $(this.containerEl.nativeElement).modal('hide');
    }
  }

  showModal(data) {
    //; 
    //console.log("data passed to modal: " + data); 
    this.modalId = data;
    $(this.containerEl.nativeElement).modal('show');
    
  }

  submit() {
    this.modalSubmittedSource.next();
    this.closeModal();
  }





  

}