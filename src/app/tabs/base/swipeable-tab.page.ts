import { AfterViewInit, ViewChild, ElementRef, Directive } from '@angular/core';
import { IonContent, GestureController, NavController, AnimationController } from '@ionic/angular/standalone';

@Directive()
export abstract class SwipeableTabPage implements AfterViewInit {
  @ViewChild(IonContent, { read: ElementRef }) content!: ElementRef;

  protected readonly tabRoutes = ['/tabs/day', '/tabs/week', '/tabs/month'];
  protected abstract currentTabIndex: number;

  constructor(
    protected gestureCtrl: GestureController,
    protected navCtrl: NavController,
    protected animationCtrl: AnimationController
  ) {}

  ngAfterViewInit(): void {
    this.setupSwipeGesture();
  }

  private setupSwipeGesture() {
    const gesture = this.gestureCtrl.create({
      el: this.content.nativeElement,
      gestureName: 'swipe-tab',
      direction: 'x',
      onEnd: (ev) => {
        if (ev.deltaX < -50 && this.canSwipeLeft()) {
          // Swipe left -> next tab
          this.navCtrl.navigateForward(this.tabRoutes[this.currentTabIndex + 1], {
            animation: this.slideLeftAnimation.bind(this)
          });
        } else if (ev.deltaX > 50 && this.canSwipeRight()) {
          // Swipe right -> previous tab
          this.navCtrl.navigateBack(this.tabRoutes[this.currentTabIndex - 1], {
            animation: this.slideRightAnimation.bind(this)
          });
        }
      }
    });
    gesture.enable();
  }

  private canSwipeLeft(): boolean {
    return this.currentTabIndex < this.tabRoutes.length - 1;
  }

  private canSwipeRight(): boolean {
    return this.currentTabIndex > 0;
  }

  private slideLeftAnimation(_: HTMLElement, opts: any) {
    const enteringEl = opts.enteringEl;
    const leavingEl = opts.leavingEl;

    const enteringAnimation = this.animationCtrl
      .create()
      .addElement(enteringEl)
      .fromTo('transform', 'translateX(100%)', 'translateX(0)')
      .fromTo('opacity', '0', '1');

    const leavingAnimation = this.animationCtrl
      .create()
      .addElement(leavingEl)
      .fromTo('transform', 'translateX(0)', 'translateX(-100%)')
      .fromTo('opacity', '1', '0');

    return this.animationCtrl
      .create()
      .duration(300)
      .easing('ease-out')
      .addAnimation([enteringAnimation, leavingAnimation]);
  }

  private slideRightAnimation(_: HTMLElement, opts: any) {
    const enteringEl = opts.enteringEl;
    const leavingEl = opts.leavingEl;

    const enteringAnimation = this.animationCtrl
      .create()
      .addElement(enteringEl)
      .fromTo('transform', 'translateX(-100%)', 'translateX(0)')
      .fromTo('opacity', '0', '1');

    const leavingAnimation = this.animationCtrl
      .create()
      .addElement(leavingEl)
      .fromTo('transform', 'translateX(0)', 'translateX(100%)')
      .fromTo('opacity', '1', '0');

    return this.animationCtrl
      .create()
      .duration(300)
      .easing('ease-out')
      .addAnimation([enteringAnimation, leavingAnimation]);
  }
}
