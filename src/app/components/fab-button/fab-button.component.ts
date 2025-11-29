import { Component, Output, EventEmitter } from '@angular/core';
import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-fab-button',
  standalone: true,
  imports: [IonFab, IonFabButton, IonIcon],
  template: `
    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button (click)="onAdd()">
        <ion-icon name="add"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  `,
  styles: [],
})
export class FabButtonComponent {
  @Output() add = new EventEmitter<void>();

  constructor() {
    addIcons({ add });
  }

  onAdd() {
    this.add.emit();
  }
}
