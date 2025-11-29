import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { TaskStorageService } from '../../services/task-storage.service';
import {
  PerfectDayTask,
  TaskFrequency,
  CompletionType,
} from '../../models/task.model';

@Component({
  selector: 'app-edit-task-modal',
  templateUrl: './edit-task-modal.component.html',
  styleUrls: ['./edit-task-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
})
export class EditTaskModalComponent implements OnInit {
  @Input() task!: PerfectDayTask;

  title = '';
  startHour = '09';
  startMinute = '00';
  durationMinutes = 30;
  frequency = TaskFrequency.Daily;
  completionType = CompletionType.Manual;

  readonly TaskFrequency = TaskFrequency;
  readonly CompletionType = CompletionType;

  constructor(
    private modalCtrl: ModalController,
    private taskStorage: TaskStorageService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    // Załaduj dane z przekazanego task
    this.title = this.task.title;
    this.frequency = this.task.frequency;
    this.completionType = this.task.completionType;

    // Parsuj startTime
    const start = new Date(this.task.startTime);
    this.startHour = start.getHours().toString().padStart(2, '0');
    this.startMinute = start.getMinutes().toString().padStart(2, '0');

    // Parsuj duration (format HH:MM:SS)
    const [hours, minutes] = this.task.duration.split(':').map(Number);
    this.durationMinutes = hours * 60 + minutes;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (!this.title.trim()) {
      return;
    }

    // Tworzenie ISO string z zachowaniem oryginalnej daty + nowa godzina
    const originalDate = new Date(this.task.startTime);
    originalDate.setHours(
      parseInt(this.startHour),
      parseInt(this.startMinute),
      0,
      0
    );
    const startTime = originalDate.toISOString();

    // Konwersja minut na format HH:MM:SS
    const hours = Math.floor(this.durationMinutes / 60);
    const minutes = this.durationMinutes % 60;
    const duration =
      hours.toString().padStart(2, '0') +
      ':' +
      minutes.toString().padStart(2, '0') +
      ':00';

    const updatedTask: PerfectDayTask = {
      ...this.task,
      title: this.title,
      startTime,
      duration,
      frequency: this.frequency,
      completionType: this.completionType,
    };

    await this.taskStorage.updateTask(this.task.id, updatedTask);
    this.modalCtrl.dismiss(updatedTask);
  }

  async delete() {
    const alert = await this.alertCtrl.create({
      header: 'Usuń zadanie',
      message: 'Czy na pewno chcesz usunąć "' + this.task.title + '"?',
      buttons: [
        {
          text: 'Anuluj',
          role: 'cancel',
        },
        {
          text: 'Usuń',
          role: 'destructive',
          handler: async () => {
            await this.taskStorage.deleteTask(this.task.id);
            this.modalCtrl.dismiss({ deleted: true });
          },
        },
      ],
    });

    await alert.present();
  }
}
