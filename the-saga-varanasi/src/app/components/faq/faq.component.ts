import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RevealService } from '../../services/reveal.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;
  open: number | null = 0;

  faqs = [
    {
      q: 'Where exactly is The SAGA Varanasi located?',
      a: 'The SAGA is located in Bada Lalpur, Varanasi — directly opposite the 400-bed Apollo Hospital and diagonally across from NIFT. It is 15 km from Lal Bahadur Shastri International Airport, 1 km from the Ring Road, and well-connected to all parts of the city.',
    },
    {
      q: 'What is the size of commercial space available?',
      a: 'Each floor offers 3,500 sq ft of premium open-plan commercial space. With G+4 floors, you can lease individual floors or discuss multi-floor options to suit your business needs.',
    },
    {
      q: 'Is The SAGA VDA approved?',
      a: 'Yes. The SAGA Varanasi is fully VDA (Varanasi Development Authority) approved with all government clearances and certifications in place. It is a 100% legal and compliant project.',
    },
    {
      q: 'When will The SAGA be ready for possession?',
      a: 'The structure is expected to be ready by October 2026. Pre-leasing is currently open on a first-come, first-serve basis. Early lessees benefit from the ability to customize their layout before possession.',
    },
    {
      q: 'What types of businesses can operate here?',
      a: 'The SAGA is ideal for: retail stores, restaurants and cafés, medical clinics and OPDs, pharmacies, pathology and diagnostic labs, corporate offices, bank branches and NBFCs, coaching institutes, showrooms, boutiques, and 1 BHK residential studios for professionals.',
    },
    {
      q: 'What amenities does The SAGA provide?',
      a: 'The SAGA offers: multi-level dedicated parking, high-speed passenger lifts with backup power, advanced fire safety and sprinkler systems, 100% DG power backup, high-speed fiber internet, 24/7 CCTV surveillance, professional building management, and a rooftop café.',
    },
    {
      q: 'Can I customize my space before possession?',
      a: 'Yes! That is one of the key advantages of pre-leasing. Since the structure will be ready in October 2026, early lessees can modify floor plans, partition layouts, and fitouts to match their brand identity and operational needs.',
    },
    {
      q: 'How do I book or enquire about leasing?',
      a: 'Call us at 073557 70378 (Mon–Sat, 10am–7pm), WhatsApp us, or fill the enquiry form on this page. Pre-leasing is strictly on a first-come, first-serve basis with limited spaces available.',
    },
  ];

  constructor(private revealService: RevealService) {}
  ngAfterViewInit() { this.io = this.revealService.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }

  toggle(i: number) {
    this.open = this.open === i ? null : i;
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
