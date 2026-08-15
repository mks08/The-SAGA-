import { Component, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnInit, AfterViewInit {
  loaded = false;

  stats = [
    { value: 'G+4',    label: 'Floors' },
    { value: '3,500',  label: 'Sq Ft / Floor' },
    { value: 'Oct\'26', label: 'Possession' },
    { value: 'VDA',    label: 'Approved' },
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    // Trigger reveal after slight delay (ensures fonts loaded)
    setTimeout(() => { this.loaded = true; }, 120);
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
