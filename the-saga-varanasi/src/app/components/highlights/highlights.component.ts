import { Component } from '@angular/core';

@Component({
  selector: 'app-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
})
export class HighlightsComponent {

  // Key commercial highlights — shown as full cards
  highlights = [
    {
      icon: '🏢',
      num: '01',
      title: '3,500 Sq Ft Per Floor',
      desc: 'Each of the 5 floors offers 3,500 sq ft of premium, column-free space — adaptable for any commercial use.',
      points: ['Open plan layouts', 'Floor-to-ceiling heights', 'Natural light all sides'],
    },
    {
      icon: '📍',
      num: '02',
      title: 'Prime Location — Bada Lalpur',
      desc: 'Directly opposite the 400-bed Apollo Hospital & diagonal to NIFT — Varanasi\'s fastest-growing commercial corridor.',
      points: ['Max footfall zone', 'Opposite Apollo Hospital', 'Diagonal to NIFT Campus'],
    },
    {
      icon: '🔧',
      num: '03',
      title: 'Custom Fit-Out Ready',
      desc: 'Bare-shell handover so you design your space from scratch — layouts, partitions, interiors fully customisable.',
      points: ['Bare-shell delivery', 'Modify before Oct 2026', 'Design assistance available'],
    },
    {
      icon: '☕',
      num: '04',
      title: 'Rooftop Café & Terrace',
      desc: 'A stunning rooftop terrace with panoramic Varanasi skyline views — ideal for café, dining, corporate events.',
      points: ['Panoramic city views', 'Event-ready terrace', 'Hospitality provisioned'],
    },
    {
      icon: '📋',
      num: '05',
      title: 'VDA Approved',
      desc: 'Fully compliant with Varanasi Development Authority norms — clear title, all approvals in place, zero legal risk.',
      points: ['VDA clearance obtained', 'RERA compliant', 'Zero encumbrance'],
    },
  ];

  // Services & Infrastructure — displayed as a compact icon grid
  services = [
    { icon: '🛗', label: 'Passenger Lift' },
    { icon: '🔥', label: 'Fire Fighting System' },
    { icon: '🚗', label: 'Dedicated Parking' },
    { icon: '⚡', label: '24×7 Power Backup' },
    { icon: '🔒', label: 'CCTV & Security' },
    { icon: '🌐', label: 'Fiber Connectivity' },
    { icon: '💧', label: 'Water Supply & STP' },
    { icon: '♿', label: 'Accessible Design' },
    { icon: '🎨', label: 'Premium Finishes' },
    { icon: '📡', label: 'Telecom Ready' },
    { icon: '🏗️', label: 'Seismic-Safe Structure' },
    { icon: '🌿', label: 'Landscaped Entrance' },
  ];

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
