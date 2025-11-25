export enum TaskFrequency {
  Daily = 0,
  Weekly = 1,
  Monthly = 2
}

export enum CompletionType {
  Auto = 0,
  Manual = 1
}

export interface PerfectDayTask {
  id: number;
  title: string;
  startTime: string; // ISO string
  duration: string; // "HH:MM:SS"
  frequency: TaskFrequency;
  completionType: CompletionType;
  done: boolean;
}

export interface CreateTaskRequest {
  title: string;
  startTime: string;
  duration: string;
  frequency: TaskFrequency;
  completionType: CompletionType;
}
