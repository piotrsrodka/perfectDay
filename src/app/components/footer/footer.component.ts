import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonFooter, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, IonFooter, IonToolbar],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  @Input() currentTab: 'day' | 'week' | 'month' = 'day';

  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigateByUrl(route, {
      skipLocationChange: false,
      replaceUrl: false,
      state: { animation: 'none' },
    });
  }
}
