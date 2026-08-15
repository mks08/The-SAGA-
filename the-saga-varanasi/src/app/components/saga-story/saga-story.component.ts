import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RevealService } from '../../services/reveal.service';

@Component({
  selector: 'app-saga-story',
  templateUrl: './saga-story.component.html',
  styleUrls: ['./saga-story.component.scss'],
})
export class SagaStoryComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;
  constructor(private revealService: RevealService) {}
  ngAfterViewInit() { this.io = this.revealService.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }
}
