import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RevealService } from '../../services/reveal.service';

@Component({
  selector: 'app-ideal-for',
  templateUrl: './ideal-for.component.html',
  styleUrls: ['./ideal-for.component.scss'],
})
export class IdealForComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;

  accommodations = [
    { icon: '🛍️', label: 'Retail Stores', description: 'Fashion, electronics, FMCG, cosmetics — maximum footfall visibility on every floor.' },
    { icon: '🍽️', label: 'Restaurants & Cafés', description: 'QSR, dine-in, cloud kitchens, bakeries — captive audience from Apollo Hospital footfall.' },
    { icon: '🏥', label: 'Clinics & Healthcare', description: 'Speciality clinics, OPDs, consultation rooms — in the city\'s primary medical zone.' },
    { icon: '💊', label: 'Pharmacy / Medical Store', description: 'High-volume prescription and retail pharmacy in a medical high-footfall corridor.' },
    { icon: '🔬', label: 'Pathology / Diagnostics', description: 'Labs, diagnostic centers — proximity to Apollo Hospital drives referrals.' },
    { icon: '💼', label: 'Corporate Offices', description: 'Headquarters, IT offices, co-working — full infrastructure with fiber and backup power.' },
    { icon: '🏦', label: 'Banks & NBFCs', description: 'Branch banking, ATMs, investment advisory — premium ground floor options.' },
    { icon: '🎓', label: 'Coaching Institutes', description: 'Tuition centers, test prep, skill academies — near NIFT and student corridors.' },
    { icon: '🏠', label: '1 BHK Studios', description: 'Furnished apartments for professionals and medical residents — high rental yield location.' },
    { icon: '🏪', label: 'Showrooms & Boutiques', description: 'Auto showrooms, designer boutiques, luxury brand outlets — high-visibility frontage.' },
  ];

  constructor(private revealService: RevealService) {}
  ngAfterViewInit() { this.io = this.revealService.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
