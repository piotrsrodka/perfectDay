import { Component, OnInit } from '@angular/core';
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
  selector: 'app-month',
  templateUrl: 'month.page.html',
  styleUrls: ['month.page.scss'],
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
export class MonthPage extends SwipeableTabPage implements OnInit {
  protected currentTabIndex = 2;
  tasks: PerfectDayTask[] = [];

  constructor(
    private taskStorage: TaskStorageService,
    private modalCtrl: ModalController,
    gestureCtrl: GestureController,
    navCtrl: NavController,
    animationCtrl: AnimationController
  ) {
    super(gestureCtrl, navCtrl, animationCtrl);
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
