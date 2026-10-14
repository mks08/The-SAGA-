import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { PLAN, PROPERTY, FloorDefinition } from '../../config/property.config';
import { PLAN_LEVELS } from '../../config/media.config';

@Component({
  selector: 'app-floor-detail-page',
  templateUrl: './floor-detail-page.component.html',
})
export class FloorDetailPageComponent implements OnInit {
  property = PROPERTY;
  plan = PLAN;
  typicalPlan = PLAN_LEVELS[1].views[0].item;
  typical3d = PLAN_LEVELS[1].views[1].item;
  floor!: FloorDefinition;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('floorId');
      const match = PROPERTY.floors.find((f) => f.id === id);
      if (!match) {
        void this.router.navigate(['/spaces']);
        return;
      }
      this.floor = match;
      this.seo.apply(`spaces/${this.floor.id}`);
    });
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
