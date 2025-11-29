import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  ModalController,
} from '@ionic/angular/standalone';
import { TaskStorageService } from '../../services/task-storage.service';
import {
  TaskFrequency,
  CompletionType,
  CreateTaskRequest,
} from '../../models/task.model';

@Component({
  selector: 'app-add-task-modal',
  templateUrl: './add-task-modal.component.html',
  styleUrls: ['./add-task-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
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
export class AddTaskModalComponent {
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
    private taskStorage: TaskStorageService
  ) {
    const now = new Date();
    this.startHour = now.getHours().toString().padStart(2, '0');
    this.startMinute = now.getMinutes().toString().padStart(2, '0');
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async save() {
    if (!this.title.trim()) {
      return;
    }

    // Tworzenie ISO string z dzisiejszą datą + wybrana godzina
    const today = new Date();
    today.setHours(parseInt(this.startHour), parseInt(this.startMinute), 0, 0);
    const startTime = today.toISOString();

    // Konwersja minut na format HH:MM:SS
    const hours = Math.floor(this.durationMinutes / 60);
    const minutes = this.durationMinutes % 60;
    const duration =
      hours.toString().padStart(2, '0') +
      ':' +
      minutes.toString().padStart(2, '0') +
      ':00';

    const request: CreateTaskRequest = {
      title: this.title,
      startTime,
      duration,
      frequency: this.frequency,
      completionType: this.completionType,
    };

    const newTask = await this.taskStorage.addTask(request);
    this.modalCtrl.dismiss(newTask);
  }
}
