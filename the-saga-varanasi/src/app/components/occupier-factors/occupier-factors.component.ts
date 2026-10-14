import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RevealService } from '../../services/reveal.service';
import { CONTENT } from '../../config/content.config';

@Component({
  selector: 'app-occupier-factors',
  templateUrl: './occupier-factors.component.html',
  styleUrls: ['./occupier-factors.component.scss'],
})
export class OccupierFactorsComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;
  factors = CONTENT.occupierFactors;

  constructor(private reveal: RevealService) {}
  ngAfterViewInit() { this.io = this.reveal.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }
}
