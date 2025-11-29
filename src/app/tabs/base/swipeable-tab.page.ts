import {
  AfterViewInit,
  ViewChild,
  ElementRef,
  Directive,
  Renderer2,
} from '@angular/core';
import {
  IonContent,
  GestureController,
  NavController,
  AnimationController,
} from '@ionic/angular/standalone';

@Directive()
export abstract class SwipeableTabPage implements AfterViewInit {
  @ViewChild(IonContent, { read: ElementRef }) content!: ElementRef;

  protected readonly tabRoutes = ['/tabs/day', '/tabs/week', '/tabs/month'];
  protected abstract currentTabIndex: number;

  private swipeState = {
    isActive: false,
    startX: 0,
    currentTranslate: 0,
    threshold: 0,
  };

  constructor(
    protected gestureCtrl: GestureController,
    protected navCtrl: NavController,
    protected animationCtrl: AnimationController,
    protected renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    this.setupSwipeGesture();
  }

  private setupSwipeGesture() {
    const gesture = this.gestureCtrl.create({
      el: this.content.nativeElement,
      gestureName: 'swipe-tab',
      direction: 'x',

      onStart: (ev) => {
        console.log('👆 onStart:', ev.currentX);
        this.swipeState.isActive = true;
        this.swipeState.startX = ev.currentX;
        this.swipeState.threshold = window.innerWidth * 0.3; // 30% szerokości ekranu
      },

      onMove: (ev) => {
        if (!this.swipeState.isActive) return;

        const deltaX = ev.deltaX;
        console.log('🔄 onMove:', {
          deltaX,
          canLeft: this.canSwipeLeft(),
          canRight: this.canSwipeRight(),
        });

        // Ogranicz przesunięcie gdy nie ma sąsiedniego taba
        if (deltaX < 0 && !this.canSwipeLeft()) return;
        if (deltaX > 0 && !this.canSwipeRight()) return;

        // Zastosuj transform do contentu
        this.applyTransform(deltaX);
      },

      onEnd: (ev) => {
        this.swipeState.isActive = false;
        const deltaX = ev.deltaX;
        const velocityX = ev.velocityX || 0;

        // Szybki ruch = flick gesture (velocity > 0.3)
        const isFlick = Math.abs(velocityX) > 0.2;
        const exceedsThreshold = Math.abs(deltaX) > this.swipeState.threshold;

        console.log('🛑 onEnd:', {
          deltaX,
          velocityX,
          threshold: this.swipeState.threshold,
          isFlick,
          exceedsThreshold,
        });

        // Zmień tab jeśli: szybki ruch ALBO przekroczono threshold
        if (isFlick || exceedsThreshold) {
          console.log('➡️ completeTransition (flick:', isFlick, ')');
          this.completeTransition(deltaX);
        } else {
          console.log('⬅️ springBack');
          this.springBack();
        }
      },
    });
    gesture.enable();
  }

  private canSwipeLeft(): boolean {
    return this.currentTabIndex < this.tabRoutes.length - 1;
  }

  private canSwipeRight(): boolean {
    return this.currentTabIndex > 0;
  }

  private applyTransform(deltaX: number) {
    const contentEl = this.content.nativeElement;
    const scrollEl = contentEl.querySelector('.ion-content-scroll-host');

    console.log('🔍 applyTransform:', { deltaX, contentEl, scrollEl });

    // Fallback: jeśli scroll-host nie istnieje, użyj ion-content
    const targetEl = scrollEl || contentEl;

    if (targetEl) {
      this.renderer.setStyle(targetEl, 'transform', `translateX(${deltaX}px)`);
      this.renderer.setStyle(targetEl, 'transition', 'none');
      this.renderer.setStyle(targetEl, 'will-change', 'transform');
      console.log('✅ Transform applied to:', targetEl);
    } else {
      console.error('❌ No target element found!');
    }
  }

  private completeTransition(deltaX: number) {
    // Wyczyść transform
    this.clearTransform();

    // Wykonaj nawigację z animacją
    if (deltaX < 0 && this.canSwipeLeft()) {
      this.navCtrl.navigateForward(this.tabRoutes[this.currentTabIndex + 1], {
        animation: this.slideLeftAnimation.bind(this),
      });
    } else if (deltaX > 0 && this.canSwipeRight()) {
      this.navCtrl.navigateBack(this.tabRoutes[this.currentTabIndex - 1], {
        animation: this.slideRightAnimation.bind(this),
      });
    }
  }

  private springBack() {
    const contentEl = this.content.nativeElement;
    const scrollEl = contentEl.querySelector('.ion-content-scroll-host');
    const targetEl = scrollEl || contentEl;

    console.log('🔙 springBack to targetEl:', targetEl);

    if (targetEl) {
      // Dodaj transition dla smooth spring-back
      this.renderer.setStyle(
        targetEl,
        'transition',
        'transform 200ms ease-out'
      );
      this.renderer.setStyle(targetEl, 'transform', 'translateX(0)');

      // Wyczyść po zakończeniu
      setTimeout(() => {
        this.renderer.removeStyle(targetEl, 'transition');
        this.renderer.removeStyle(targetEl, 'transform');
        this.renderer.removeStyle(targetEl, 'will-change');
      }, 200);
    }
  }

  private clearTransform() {
    const contentEl = this.content.nativeElement;
    const scrollEl = contentEl.querySelector('.ion-content-scroll-host');
    const targetEl = scrollEl || contentEl;

    if (targetEl) {
      this.renderer.removeStyle(targetEl, 'transform');
      this.renderer.removeStyle(targetEl, 'transition');
      this.renderer.removeStyle(targetEl, 'will-change');
    }
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
