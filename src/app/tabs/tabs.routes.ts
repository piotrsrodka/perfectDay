import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'day',
        loadComponent: () => import('./day/day.page').then((m) => m.DayPage),
      },
      {
        path: 'week',
        loadComponent: () => import('./week/week.page').then((m) => m.WeekPage),
      },
      {
        path: 'month',
        loadComponent: () =>
          import('./month/month.page').then((m) => m.MonthPage),
      },
      {
        path: '',
        redirectTo: '/tabs/day',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/day',
    pathMatch: 'full',
  },
];
