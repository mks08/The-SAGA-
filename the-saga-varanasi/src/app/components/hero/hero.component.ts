import { Component, OnInit } from '@angular/core';

interface Particle {
  left: string;
  duration: string;
  delay: string;
  size: string;
}

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements OnInit {
  particles: Particle[] = [];

  ngOnInit() {
    this.particles = Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      duration: `${6 + Math.random() * 10}s`,
      delay: `${Math.random() * 8}s`,
      size: `${2 + Math.random() * 4}px`,
    }));
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
