import { Component, OnInit, Renderer2, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCheckbox,
  ModalController,
  GestureController,
  NavController,
  AnimationController,
} from '@ionic/angular/standalone';
import { TaskStorageService } from '../../services/task-storage.service';
import { PerfectDayTask, TaskFrequency } from '../../models/task.model';
import { SwipeableTabPage } from '../base/swipeable-tab.page';
import { FooterComponent } from '../../components/footer/footer.component';
import { FabButtonComponent } from '../../components/fab-button/fab-button.component';

@Component({
  selector: 'app-month',
  templateUrl: 'month.page.html',
  styleUrls: ['month.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCheckbox,
    FooterComponent,
    FabButtonComponent,
  ],
})
export class MonthPage extends SwipeableTabPage implements OnInit {
  protected currentTabIndex = 2;
  protected defaultFrequency = TaskFrequency.Monthly;
  tasks: PerfectDayTask[] = [];

  constructor(
    taskStorage: TaskStorageService,
    modalCtrl: ModalController,
    renderer: Renderer2,
    gestureCtrl: GestureController,
    navCtrl: NavController,
    animationCtrl: AnimationController,
    router: Router,
    cdr: ChangeDetectorRef
  ) {
    super(gestureCtrl, navCtrl, animationCtrl, renderer, router, cdr, modalCtrl, taskStorage);
  }

  async ngOnInit() {
    await this.loadTasks();
  }

  async ionViewWillEnter() {
    await this.loadTasks();
  }

  protected async loadTasks() {
    const allTasks = await this.taskStorage.loadTasks();
    this.tasks = allTasks.filter((t) => t.frequency === TaskFrequency.Monthly);
  }

  getTaskTime(task: PerfectDayTask): string {
    const start = new Date(task.startTime);
    const day = start.getDate();
    const month = (start.getMonth() + 1).toString().padStart(2, '0');
    const time = `${start.getHours().toString().padStart(2, '0')}:${start
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    return `${day}.${month} ${time}`;
  }

  getTaskDuration(task: PerfectDayTask): string {
    const [hours, minutes] = task.duration.split(':').map(Number);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}min`;
  }

  async toggleTask(task: PerfectDayTask) {
    task.done = !task.done;
    await this.taskStorage.updateTask(task.id, task);
  }
}
