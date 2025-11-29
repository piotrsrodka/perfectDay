import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'day',
    loadComponent: () => import('./tabs/day/day.page').then((m) => m.DayPage),
    data: { animation: 'none' },
  },
  {
    path: 'week',
    loadComponent: () => import('./tabs/week/week.page').then((m) => m.WeekPage),
    data: { animation: 'none' },
  },
  {
    path: 'month',
    loadComponent: () => import('./tabs/month/month.page').then((m) => m.MonthPage),
    data: { animation: 'none' },
  },
  {
    path: '',
    redirectTo: '/day',
    pathMatch: 'full',
  },
];
