import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `<span class="app-icon" [attr.data-name]="name"></span>`,
  styles: [`.app-icon{display:inline-block;width:1em;height:1em}`],
})
export class IconComponent {
  @Input() name = '';
}
