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

  normalizeView() {
    let cv = this.currentView;
    console.log('normalizing, what is currentView?', this.currentView)
    console.log('normalizing, what is isVertical?', this.isVertical)
    this.isVertical = cv;
    console.log("normalizing now for true", this.isVertical)
    return this.isVertical;
  }

  printerFunction() {
       let windowWidth = window.innerWidth;
       let windowHeight = window.innerHeight;
       let windowClientWidth = document.body.clientWidth;//tried
       let windowClientHeight = document.body.clientHeight;//tried
      //  let windowScrollHeight = window.innerHeight;
      //  window.innerHeight = 9999999999999;
       window.name = 'currentWindow';
    window.open('', window.name, 'top=0,left=0,height=9999999999,width=auto'
    )
    window.print();
    window.close();
    //this.normalizeView();
  }

  getCurrentView(){
    console.log(this.isVertical, "status of window f is ");
    this.currentView = this.isVertical;
    console.log('currentView capture', this.currentView)
    return this.currentView;
  }
  

}//end of MenuService Class
