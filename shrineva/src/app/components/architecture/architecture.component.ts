import { Component, Input } from '@angular/core';
import { PLAN, PROPERTY } from '../../config/property.config';
import { CONTENT } from '../../config/content.config';

@Component({
  selector: 'app-architecture',
  templateUrl: './architecture.component.html',
  styleUrls: ['./architecture.component.scss'],
})
export class ArchitectureComponent {
  @Input() showIntro = true;
  @Input() showPageLink = true;
  property = PROPERTY;
  plan = PLAN;
  levels = CONTENT.architectureLevels;

}
