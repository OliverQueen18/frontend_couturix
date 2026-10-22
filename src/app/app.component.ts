import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssistantComponent } from './shared/assistant.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AssistantComponent],
  template: '<router-outlet /><app-assistant />',
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AppComponent {}
