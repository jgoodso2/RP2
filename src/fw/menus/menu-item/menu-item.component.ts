import { Component, ElementRef, HostBinding, HostListener,
         Input, OnInit,OnDestroy ,Renderer,
         trigger, state, style, transition, animate } from '@angular/core';
import { NavigationEnd, Router,ActivatedRoute,Params } from '@angular/router';
import {Timescale,WorkUnits} from '../../../app/ResourcePlans/res-plan.model'
import { MenuItem, MenuService } from '../../services/menu.service';
import {CurrentCalendarYear} from '../../../app/common/utilities'
import { AppUtilService } from '../../../app/common/app-util.service'
import { Subscription } from 'rxjs/Subscription';
@Component({
  selector: 'fw-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.css'],
  animations: [
        trigger('visibilityChanged', [
            transition(':enter', [   // :enter is alias to 'void => *'
                style({opacity:0}),
                animate(250, style({opacity:1})) 
            ]),
            transition(':leave', [   // :leave is alias to '* => void'
                animate(100, style({opacity:0})) 
            ])
        ])
    ]
})
export class MenuItemComponent implements OnInit {
  @Input() item = <MenuItem>null;  // see angular-cli issue #2034
  @HostBinding('class.parent-is-popup')
  @Input() parentIsPopup = true;
  routerEventSub:Subscription
  isActiveRoute = false;

  mouseInItem = false;
  mouseInPopup = false;
  popupLeft = 0;
  popupTop = 34;

  constructor(public router:Router,
              public activatedRoute:ActivatedRoute, 
              public menuService: MenuService,
              public el: ElementRef,
              public renderer: Renderer,
              private _appUtilSvc:AppUtilService
            ) {
  }

  checkActiveRoute(route: string) {
    this.isActiveRoute = (route == '/' + this.item.route);
  }

  ngOnInit() : void {
    this.checkActiveRoute(this.router.url);

   this.routerEventSub = this.router.events
        .subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.checkActiveRoute(event.url);
                //console.log(event.url + ' ' + this.item.route + ' ' + this.isActiveRoute);
            }
        });
  }

  ngOnDestroy()
  {
      this._appUtilSvc.safeUnSubscribe(this.routerEventSub);
  }

  @HostListener('click', ['$event'])
  onClick(event) : void {

    event.stopPropagation();

    if (this.item.submenu) {
      if (this.menuService.isVertical) {
          this.mouseInPopup = !this.mouseInPopup;
      }
    }
    else if (this.item.route) {
      // force horizontal menus to close by sending a mouseleave event
      let newEvent = new MouseEvent('mouseleave', {bubbles: true});
      this.renderer.invokeElementMethod(
          this.el.nativeElement, 'dispatchEvent', [newEvent]);
          let oldConfig = this.router.routeReuseStrategy.shouldReuseRoute;
          this.router.routeReuseStrategy.shouldReuseRoute = function () { return false };
          this.router.isActive = function () { return false; }
          let currentYear = new CurrentCalendarYear()
        //   if(!this.item.params["timescale"])
        //   {
        //     this.item.params["timescale"] = this.activatedRoute.snapshot.queryParams["timescale"] || Timescale.calendarMonths;
        //   }

        //   if(!this.item.params["workunits"])
        //   {
        //     this.item.params["workunits"] = this.activatedRoute.snapshot.queryParams["workunits"] || WorkUnits.FTE;
        //   }

        //   if(!this.item.params["fromDate"])
        //   {
        //     this.item.params["fromDate"] = this.activatedRoute.snapshot.queryParams["fromDate"] || currentYear.startDate
        //   }

        //   if(!this.item.params["toDate"])
        //   {
        //     this.item.params["toDate"] = this.activatedRoute.snapshot.queryParams["toDate"] || currentYear.endDate
        //   }

      this.router.navigate([this.item.route, this.item.params],{ preserveQueryParams:true} );
        
    }
  }

  onPopupMouseEnter(event) : void {
      if (!this.menuService.isVertical) {
          this.mouseInPopup = true;
      }
  }

  onPopupMouseLeave(event) : void {
      if (!this.menuService.isVertical) {
          this.mouseInPopup = false;
      }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event) : void {
      if (!this.menuService.isVertical) {
          this.mouseInItem = false;
      }
  }

  @HostListener('mouseenter') 
  onMouseEnter() : void {
      if (!this.menuService.isVertical) {
          if (this.item.submenu) {
              this.mouseInItem = true;
              if (this.parentIsPopup) {
                  this.popupLeft = 160;
                  this.popupTop = 0;
              }
          }
      }
  }
}