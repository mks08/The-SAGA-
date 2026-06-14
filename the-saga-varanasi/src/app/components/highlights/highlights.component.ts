import { Component } from '@angular/core';

@Component({
  selector: 'app-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
})
export class HighlightsComponent {
  cards = [
    {
      icon: '🏢',
      title: 'Massive 3,500 Sq Ft Floors',
      description: 'Each floor offers 3,500 sq. ft. of premium space — ideal for retail stores, offices, clinics, banks, and 1 BHK studios.',
      points: ['Open plan layouts', 'Floor-to-ceiling heights', 'Natural light on all sides'],
    },
    {
      icon: '📍',
      title: 'Unmatched Visibility',
      description: 'Positioned opposite the 400-bed Apollo Hospital and diagonal to NIFT in Bada Lalpur — Varanasi\'s fastest-growing business corridor.',
      points: ['High footfall area', 'Opposite Apollo Hospital', 'Adjacent to NIFT'],
    },
    {
      icon: '🚗',
      title: 'Dedicated Parking',
      description: 'Purpose-built dedicated parking facility ensuring hassle-free access for tenants, employees, and customers at all times.',
      points: ['Multi-level parking', 'Visitor parking bays', 'EV charging ready'],
    },
    {
      icon: '☕',
      title: 'Rooftop Café',
      description: 'A premium rooftop café with panoramic views of Varanasi — perfect for business lunches, client meetings, and team downtime.',
      points: ['360° city views', 'Premium F&B setup', 'Event hosting capability'],
    },
    {
      icon: '🔧',
      title: 'Custom Builds',
      description: 'Structure ready by October 2026. Modify layouts before possession to perfectly suit your brand identity and operational needs.',
      points: ['Flexible floor plans', 'Brand-specific fitouts', 'Early bird advantage'],
    },
    {
      icon: '⚡',
      title: 'Smart Infrastructure',
      description: 'State-of-the-art infrastructure including high-speed fiber connectivity, 24/7 power backup, and modern security systems.',
      points: ['100% power backup', 'High-speed internet', 'CCTV security'],
    },
  ];

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
