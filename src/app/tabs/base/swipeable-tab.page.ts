import {
  AfterViewInit,
  ViewChild,
  ElementRef,
  Directive,
  Renderer2,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  GestureController,
  NavController,
  AnimationController,
  ModalController,
} from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TaskStorageService } from '../../services/task-storage.service';
import { TaskFrequency, PerfectDayTask } from '../../models/task.model';
import { AddTaskModalComponent } from '../../components/add-task-modal/add-task-modal.component';
import { EditTaskModalComponent } from '../../components/edit-task-modal/edit-task-modal.component';

@Directive()
export abstract class SwipeableTabPage implements AfterViewInit {
  @ViewChild(IonContent, { read: ElementRef }) content!: ElementRef;

  protected readonly tabRoutes = ['/day', '/week', '/month'];
  protected readonly tabNames = ['day', 'week', 'month'];
  protected abstract currentTabIndex: number;
  protected abstract defaultFrequency: TaskFrequency;
  protected abstract loadTasks(): Promise<void>;

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
    protected renderer: Renderer2,
    protected router: Router,
    protected cdr: ChangeDetectorRef,
    protected modalCtrl: ModalController,
    protected taskStorage: TaskStorageService
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
        this.swipeState.isActive = true;
        this.swipeState.startX = ev.currentX;
        this.swipeState.threshold = window.innerWidth * 0.3; // 30% szerokości ekranu
      },

      onMove: (ev) => {
        if (!this.swipeState.isActive) return;

        const deltaX = ev.deltaX;

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

        // Szybki ruch = flick gesture (velocity > 0.2)
        const isFlick = Math.abs(velocityX) > 0.2;
        const exceedsThreshold = Math.abs(deltaX) > this.swipeState.threshold;

        // Zmień tab jeśli: szybki ruch ALBO przekroczono threshold
        if (isFlick || exceedsThreshold) {
          this.completeTransition(deltaX);
        } else {
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

    // Fallback: jeśli scroll-host nie istnieje, użyj ion-content
    const targetEl = scrollEl || contentEl;

    if (targetEl) {
      this.renderer.setStyle(targetEl, 'transform', `translateX(${deltaX}px)`);
      this.renderer.setStyle(targetEl, 'transition', 'none');
      this.renderer.setStyle(targetEl, 'will-change', 'transform');
    }
  }

  private async completeTransition(deltaX: number) {
    // Wyczyść transform
    this.clearTransform();

    let targetTabName: string | null = null;

    if (deltaX < 0 && this.canSwipeLeft()) {
      targetTabName = this.tabNames[this.currentTabIndex + 1];
    } else if (deltaX > 0 && this.canSwipeRight()) {
      targetTabName = this.tabNames[this.currentTabIndex - 1];
    }

    if (targetTabName) {
      // Prosta nawigacja przez Router - tab bar sam się zaktualizuje
      const targetRoute = this.tabRoutes[this.tabNames.indexOf(targetTabName)];
      await this.router.navigateByUrl(targetRoute);
    }
  }

  private springBack() {
    const contentEl = this.content.nativeElement;
    const scrollEl = contentEl.querySelector('.ion-content-scroll-host');
    const targetEl = scrollEl || contentEl;

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

  async openAddModal() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('Wibracja nie działa lub nie jest wspierana.', e);
    }

    const modal = await this.modalCtrl.create({
      component: AddTaskModalComponent,
      componentProps: { defaultFrequency: this.defaultFrequency },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      await this.loadTasks();
    }
  }

  async openEditModal(task: PerfectDayTask) {
    const modal = await this.modalCtrl.create({
      component: EditTaskModalComponent,
      componentProps: { task },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      await this.loadTasks();
    }
  }
}
