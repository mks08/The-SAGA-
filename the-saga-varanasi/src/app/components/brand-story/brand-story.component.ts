import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RevealService } from '../../services/reveal.service';
import { PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-brand-story',
  templateUrl: './brand-story.component.html',
  styleUrls: ['./brand-story.component.scss'],
})
export class BrandStoryComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;
  property = PROPERTY;
  constructor(private revealService: RevealService) {}
  ngAfterViewInit() { this.io = this.revealService.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }
}
