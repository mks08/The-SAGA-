import { Component } from '@angular/core';

@Component({
  selector: 'app-ideal-for',
  templateUrl: './ideal-for.component.html',
  styleUrls: ['./ideal-for.component.scss'],
})
export class IdealForComponent {
  useCases = [
    { icon: '🛍️',  label: 'Retail Stores',            color: '#D4AF37' },
    { icon: '🏥',  label: 'Clinics & Hospitals',       color: '#10b981' },
    { icon: '💊',  label: 'Medical & Pharma Stores',   color: '#06b6d4' },
    { icon: '🔬',  label: 'Pathology Labs',            color: '#8b5cf6' },
    { icon: '🏦',  label: 'Banks & NBFCs',             color: '#3b82f6' },
    { icon: '💼',  label: 'Corporate Offices',         color: '#f59e0b' },
    { icon: '🍽️', label: 'Restaurant Chains',         color: '#ef4444' },
    { icon: '☕',  label: 'Cafés & Food Outlets',     color: '#d97706' },
    { icon: '🎓',  label: 'Coaching & Institutes',     color: '#a78bfa' },
    { icon: '🏠',  label: '1 BHK Studio Apartments',  color: '#34d399' },
    { icon: '💇',  label: 'Salons & Wellness',         color: '#f472b6' },
    { icon: '🖥️', label: 'IT & Tech Offices',         color: '#60a5fa' },
    { icon: '🏪',  label: 'Showrooms & Boutiques',    color: '#fbbf24' },
    { icon: '📦',  label: 'Logistics & Warehousing',  color: '#a3e635' },
    { icon: '❓',  label: 'Something Else?',           color: '#94a3b8', isOther: true },
  ];

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
