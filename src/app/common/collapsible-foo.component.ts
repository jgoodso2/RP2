import { Component, Input } from '@angular/core';

@Component({
  selector: 'collapsible-foo',
  template: `
<div (click)="toggleContent()" class="well pointable" style="width:100%">

    <ng-content select="[foo-title]"></ng-content> 

  <ng-content *ngIf="visible" select="[foo-body]"></ng-content>
  </div>

  `
})
export class CollapsibleFooComponent {
  visible: boolean = true;

  toggleContent() {
    this.visible = !this.visible;
  }
}