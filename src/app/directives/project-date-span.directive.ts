import { Directive , ElementRef , Input } from '@angular/core';

@Directive({
  selector: '[projectDateSpan]'
})
export class ProjectDateSpanDirective {

  @Input() projStart:string
  @Input() projFinish:string
  @Input() intervalStart:string
  @Input() intervalEnd:string

  constructor(private _elementRef: ElementRef ) { 

  }

  ngOnInit() {
    //this._elementRef.nativeElement.style.background = 'red'
    // console.log("project Start: " + this.projStart)
    // console.log("project Finish: " + this.projFinish)
    // console.log("interval Start: " + this.intervalStart)
    // console.log("interval end: " + this.intervalEnd) 
    this.formatCell()



  }

  formatCell() {
    let _intervalStart = new Date(this.intervalStart)
    let _intervalEnd = new Date(this.intervalEnd) 
    let _projStart = new Date(this.projStart)
    let _projFinish = new Date(this.projFinish)

    if ((_intervalStart <= _projStart && _intervalEnd <= _projStart) || (_intervalStart > _projFinish ) )   {
     
      this._elementRef.nativeElement.style.background = '#d6d7d8'
      this._elementRef.nativeElement.style.color = 'gray'
    }
    else {
      this._elementRef.nativeElement.style.background = 'white'
    }

  }

}
