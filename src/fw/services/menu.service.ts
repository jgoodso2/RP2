import { Injectable } from '@angular/core';

export interface MenuItem {
    text: string,
    icon: string,
    route: string,
    params?: object,
    submenu: Array<MenuItem>
}

@Injectable()
export class MenuService {

  items: Array<MenuItem>;
  isVertical = true;
  showingLeftSideMenu = false;
  currentView: boolean;

  toggleLeftSideMenu() : void {
    this.isVertical = true;
    this.showingLeftSideMenu = !this.showingLeftSideMenu;
  }

  toggleMenuOrientation() {
    this.isVertical = !this.isVertical;
  }

  printMode(){//normalize: Boolean){
    this.isVertical = false;
    // this.isVertical == normalize;
  }

  // normalizeView(){
  //   if (this.isVertical = false)
  // }

  normalizeView(viewState: boolean) :void {
     this.isVertical = viewState;
    // console.log('normalizing, what is currentView?', this.currentView)
    // console.log('normalizing, what is isVertical?', this.isVertical)
    // this.isVertical = cv;
    // console.log("normalizing now for true", this.isVertical)
    // return this.isVertical;
    //test
  }

  printerFunction() {
    console.log("printerFunction in menuService is running...");
       let windowWidth = window.innerWidth;
       let windowHeight = window.innerHeight;
       let windowClientWidth = document.body.clientWidth;//tried
       let windowClientHeight = document.body.clientHeight;//tried
      // commented out let windowScrollHeight = window.innerHeight;
      // commented out window.innerHeight = 9999999999999;
       window.name = 'currentWindow';
    window.open('', window.name, 'top=0,left=0,height=9999999999,width=auto'
    )
    window.print();
    window.close();
    console.log('currentView is: ',this.currentView)
    this.normalizeView(this.currentView);
  }

  getCurrentView(): boolean {
    console.log(this.isVertical, "status of window f is ");
    this.currentView = this.isVertical;
    console.log('currentView capture', this.currentView)
    return this.currentView;
  }
  

}//end of MenuService Class
