import { Component, OnInit } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonIcon,
  ModalController,
  GestureController,
  NavController,
  AnimationController,
} from '@ionic/angular/standalone';
import { TaskStorageService } from '../../services/task-storage.service';
import { PerfectDayTask, TaskFrequency } from '../../models/task.model';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { EditTaskModalComponent } from '../../components/edit-task-modal/edit-task-modal.component';
import { SwipeableTabPage } from '../base/swipeable-tab.page';

@Component({
  selector: 'app-week',
  templateUrl: 'week.page.html',
  styleUrls: ['week.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonFab,
    IonFabButton,
    IonIcon,
  ],
})
export class WeekPage extends SwipeableTabPage implements OnInit {
  protected currentTabIndex = 1;
  tasks: PerfectDayTask[] = [];

  constructor(
    private taskStorage: TaskStorageService,
    private modalCtrl: ModalController,
    renderer: Renderer2,
    gestureCtrl: GestureController,
    navCtrl: NavController,
    animationCtrl: AnimationController
  ) {
    super(gestureCtrl, navCtrl, animationCtrl, renderer);
    addIcons({ add });
  }

  async ngOnInit() {
    await this.loadTasks();
  }

  async ionViewWillEnter() {
    await this.loadTasks();
  }

  private async loadTasks() {
    const allTasks = await this.taskStorage.loadTasks();
    this.tasks = allTasks.filter((t) => t.frequency === TaskFrequency.Weekly);
  }

  getTaskTime(task: PerfectDayTask): string {
    const start = new Date(task.startTime);
    const dayNames = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
    const dayName = dayNames[start.getDay()];
    const time = `${start.getHours().toString().padStart(2, '0')}:${start
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    return `${dayName} ${time}`;
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

  openAddModal() {
    console.log('Open add modal');
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
