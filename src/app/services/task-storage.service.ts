import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import {
  PerfectDayTask,
  CreateTaskRequest,
  TaskFrequency,
  CompletionType,
} from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskStorageService {
  private readonly FILE_NAME = 'tasks.json';
  private tasks: PerfectDayTask[] = [];
  private nextId = 1;

  constructor() {
    this.loadTasks();
  }

  async loadTasks(): Promise<PerfectDayTask[]> {
    try {
      // Fallback na localStorage dla trybu web
      if (this.isWeb()) {
        const data = localStorage.getItem('perfectday_tasks');
        if (data) {
          this.tasks = JSON.parse(data);
          this.nextId =
            this.tasks.length > 0
              ? Math.max(...this.tasks.map((t) => t.id)) + 1
              : 1;
          return this.tasks;
        }
      } else {
        const result = await Filesystem.readFile({
          path: this.FILE_NAME,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });

        this.tasks = JSON.parse(result.data as string);
        this.nextId =
          this.tasks.length > 0
            ? Math.max(...this.tasks.map((t) => t.id)) + 1
            : 1;
        return this.tasks;
      }
    } catch (error) {
      console.log('No tasks file found, creating default tasks...', error);
      await this.createDefaultTasks();
    }

    return this.tasks;
  }

  private async createDefaultTasks() {
    const today = new Date();
    today.setHours(8, 0, 0, 0);

    this.tasks = [
      {
        id: 1,
        title: 'Kawa ☕',
        startTime: new Date(today.setHours(8, 0, 0, 0)).toISOString(),
        duration: '00:30:00',
        frequency: TaskFrequency.Daily,
        completionType: CompletionType.Auto,
        done: false,
      },
      {
        id: 2,
        title: 'Standup',
        startTime: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
        duration: '00:15:00',
        frequency: TaskFrequency.Daily,
        completionType: CompletionType.Manual,
        done: false,
      },
      {
        id: 3,
        title: 'Kodowanie NppLegal',
        startTime: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        duration: '02:00:00',
        frequency: TaskFrequency.Daily,
        completionType: CompletionType.Manual,
        done: false,
      },
      {
        id: 4,
        title: 'Code review',
        startTime: new Date(today.setDate(today.getDate() + 4)).toISOString(),
        duration: '01:00:00',
        frequency: TaskFrequency.Weekly,
        completionType: CompletionType.Manual,
        done: false,
      },
    ];

    this.nextId = 5;
    await this.saveTasks();
  }

  private async saveTasks(): Promise<void> {
    try {
      if (this.isWeb()) {
        localStorage.setItem(
          'perfectday_tasks',
          JSON.stringify(this.tasks, null, 2)
        );
        console.log('Saved tasks to localStorage:', this.tasks.length);
      } else {
        await Filesystem.writeFile({
          path: this.FILE_NAME,
          data: JSON.stringify(this.tasks, null, 2),
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  private isWeb(): boolean {
    return !!(typeof window !== 'undefined' && window.localStorage);
  }

  getTasks(): PerfectDayTask[] {
    return this.tasks;
  }

  getTaskById(id: number): PerfectDayTask | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  async addTask(request: CreateTaskRequest): Promise<PerfectDayTask> {
    const newTask: PerfectDayTask = {
      id: this.nextId++,
      title: request.title,
      startTime: request.startTime,
      duration: request.duration,
      frequency: request.frequency,
      completionType: request.completionType,
      done: false,
    };

    this.tasks.push(newTask);
    await this.saveTasks();
    return newTask;
  }

  async updateTask(
    id: number,
    updated: PerfectDayTask
  ): Promise<PerfectDayTask | null> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.tasks[index] = updated;
    await this.saveTasks();
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;

    this.tasks.splice(index, 1);
    await this.saveTasks();
    return true;
  }

  async resetDailyTasks(): Promise<void> {
    this.tasks.forEach((task) => {
      if (task.frequency === TaskFrequency.Daily) {
        task.done = false;
      }
    });
    await this.saveTasks();
  }
}
