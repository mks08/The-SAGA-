import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `<button class="app-btn"><ng-content></ng-content></button>`,
  styles: [`.app-btn{padding:0.5rem 1rem;border-radius:4px;border:none;background:var(--primary);color:#fff}`],
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
}
