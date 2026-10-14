import { Component, Input } from '@angular/core';
import { NavigationMemoryService } from '../../../core/services/navigation-memory.service';

/**
 * Consistent page-level H1 banner used by every routed page so each route
 * ships a unique, semantic heading (see SEO requirements in seo.config.ts).
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';

  constructor(private navigation: NavigationMemoryService) {}

  goBack(): void {
    this.navigation.goBack();
  }
}
