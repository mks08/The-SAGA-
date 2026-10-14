import { Component } from '@angular/core';
import { PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-brand-story',
  templateUrl: './brand-story.component.html',
})
export class BrandStoryComponent {
  property = PROPERTY;
}
