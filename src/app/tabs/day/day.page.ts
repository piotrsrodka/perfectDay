import { AfterContentInit, Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCheckbox,
  ModalController,
  GestureController,
  NavController,
  AnimationController,
} from '@ionic/angular/standalone';
import { TaskStorageService } from '../../services/task-storage.service';
import {
  PerfectDayTask,
  TaskFrequency,
  CompletionType,
} from '../../models/task.model';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AddTaskModalComponent } from '../../components/add-task-modal/add-task-modal.component';
import { EditTaskModalComponent } from '../../components/edit-task-modal/edit-task-modal.component';
import { SwipeableTabPage } from '../base/swipeable-tab.page';

@Component({
  selector: 'app-day',
  templateUrl: 'day.page.html',
  styleUrls: ['day.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonCheckbox,
  ],
})
export class DayPage extends SwipeableTabPage implements OnInit {
  protected currentTabIndex = 0;

  tasks: PerfectDayTask[] = [];
  currentTimeLabel = '';
  currentTimePosition = 0;

  readonly TASK_HEIGHT_PER_HOUR = 40; // Wysokość zadania na godzinę
  readonly TASK_GAP = 15; // Przerwa między zadaniami w px

  constructor(
    private taskStorage: TaskStorageService,
    private modalCtrl: ModalController,
    private renderer: Renderer2,
    gestureCtrl: GestureController,
    navCtrl: NavController,
    animationCtrl: AnimationController
  ) {
    super(gestureCtrl, navCtrl, animationCtrl);
    addIcons({ add });
  }

  async ngOnInit() {
    await this.loadTasks();
    setInterval(() => this.updateCurrentTime(), 6000);
  }

  async ionViewWillEnter() {
    await this.checkDailyReset();
    await this.loadTasks();
  }

  private async checkDailyReset() {
    const lastReset = localStorage.getItem('lastDailyReset');
    const today = new Date().toDateString();

    if (lastReset !== today) {
      await this.taskStorage.resetDailyTasks();
      localStorage.setItem('lastDailyReset', today);
    }
  }

  private async loadTasks() {
    const allTasks = await this.taskStorage.loadTasks();

    this.tasks = allTasks
      .filter((t) => t.frequency === TaskFrequency.Daily)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    this.autoCompleteTasks();

    setTimeout(() => this.updateCurrentTime(), 100);
  }

  private autoCompleteTasks() {
    const now = new Date();
    this.tasks.forEach((task) => {
      if (task.completionType === CompletionType.Auto) {
        const taskEnd = this.getTaskEndTime(task);
        if (now > taskEnd && !task.done) {
          task.done = true;
        }
      }
    });
  }

  private getTaskEndTime(task: PerfectDayTask): Date {
    const start = new Date(task.startTime);
    const [hours, minutes] = task.duration.split(':').map(Number);
    const end = new Date(start);
    end.setHours(end.getHours() + hours);
    end.setMinutes(end.getMinutes() + minutes);
    return end;
  }

  private updateCurrentTime() {
    const now = new Date();
    this.currentTimeLabel =
      now.getHours().toString().padStart(2, '0') +
      ':' +
      now.getMinutes().toString().padStart(2, '0');

    const headerOffset = 0;
    this.currentTimePosition =
      this.calculateCurrentTimePosition(now) + headerOffset;
    const line = document.getElementById('current-time-line');
    if (line) {
      this.renderer.setStyle(line, 'top', this.currentTimePosition + 'px');
    }
  }

  private calculateCurrentTimePosition(now: Date): number {
    let position = 0;
    const currentTime = now.getTime();

    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      const taskStart = new Date(task.startTime);
      const taskEnd = this.getTaskEndTime(task);
      const taskHeight = this.getTaskHeight(task);

      // Jeśli czas jest przed tym zadaniem
      if (currentTime < taskStart.getTime()) {
        console.log(
          'Przed zadaniem ' + task.title + ', zwracam: ' + position + 'px'
        );
        return position;
      }

      // Jeśli czas jest w trakcie tego zadania
      if (
        currentTime >= taskStart.getTime() &&
        currentTime <= taskEnd.getTime()
      ) {
        const taskDuration = taskEnd.getTime() - taskStart.getTime();
        const elapsed = currentTime - taskStart.getTime();
        const progress = elapsed / taskDuration;
        const finalPos = position + taskHeight * progress;
        console.log(
          '  -> Czas W TRAKCIE tego zadania, progress: ' +
            (progress * 100).toFixed(1) +
            '%, pozycja: ' +
            finalPos +
            'px'
        );
        return finalPos;
      }

      const taskElementId = 'task-' + task.id;
      const taskElement = document.getElementById(taskElementId);
      if (taskElement) {
        position = taskElement.getBoundingClientRect().y;
      }
      console.log(
        '  -> Po zadaniu ' + task.title + ', pozycja: ' + position + 'px'
      );
    }

    console.log('Po wszystkich zadaniach, zwracam: ' + position + 'px');
    return position;
  }

  getTaskPosition(task: PerfectDayTask): number {
    const index = this.tasks.indexOf(task);
    let totalHeight = 0;

    for (let i = 0; i < index; i++) {
      totalHeight += this.getTaskHeight(this.tasks[i]) + this.TASK_GAP;
    }

    return totalHeight;
  }

  getTaskHeight(task: PerfectDayTask): number {
    const [hours, minutes] = task.duration.split(':').map(Number);
    const durationHours = hours + minutes / 60;
    return durationHours * this.TASK_HEIGHT_PER_HOUR;
  }

  getTaskTime(task: PerfectDayTask): string {
    const start = new Date(task.startTime);
    return (
      start.getHours().toString().padStart(2, '0') +
      ':' +
      start.getMinutes().toString().padStart(2, '0')
    );
  }

  getTaskDuration(task: PerfectDayTask): string {
    const [hours, minutes] = task.duration.split(':').map(Number);
    if (hours > 0 && minutes > 0) return hours + 'h ' + minutes + 'min';
    if (hours > 0) return hours + 'h';
    return minutes + 'min';
  }

  isTaskInProgress(task: PerfectDayTask): boolean {
    const now = new Date();
    const start = new Date(task.startTime);
    const end = this.getTaskEndTime(task);
    return now >= start && now <= end && !task.done;
  }

  async toggleTask(task: PerfectDayTask) {
    task.done = !task.done;
    await this.taskStorage.updateTask(task.id, task);
  }

  async openAddModal() {
    try {
      // 1. Wywołanie lekkiej wibracji.
      //   Capacitor sam sprawdza, czy urządzenie to wspiera.
      await Haptics.impact({ style: ImpactStyle.Light });

      console.log('Wibracja wywołana pomyślnie.');
    } catch (e) {
      // 2. Jeśli urządzenie tego nie wspiera, złapiemy błąd (w trybie webowym)
      //    lub po prostu nic się nie wydarzy (na telefonie).
      console.warn('Wibracja nie działa lub nie jest wspierana.', e);
    }

    const modal = await this.modalCtrl.create({
      component: AddTaskModalComponent,
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
