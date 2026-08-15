import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RevealService } from '../../services/reveal.service';

@Component({
  selector: 'app-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
})
export class HighlightsComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;

  services = [
    { icon: '🛗', label: 'High-Speed Lifts' },
    { icon: '🔥', label: 'Fire Safety System' },
    { icon: '⚡', label: '100% Power Backup' },
    { icon: '📡', label: 'High-Speed Fiber' },
    { icon: '📹', label: '24/7 CCTV' },
    { icon: '🔐', label: 'Managed Security' },
    { icon: '🌊', label: 'Sprinkler System' },
    { icon: '♿', label: 'Accessibility Ready' },
  ];

  constructor(private revealService: RevealService) {}

  ngAfterViewInit() {
    this.io = this.revealService.observe();
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
