import { Component, Input } from '@angular/core';
import { PLAN } from '../../config/property.config';

@Component({
  selector: 'app-ideal-for',
  templateUrl: './ideal-for.component.html',
})
export class IdealForComponent {
  @Input() showIntro = true;
  /** Home shows a compact tile grid; /business-fit shows the full copy. */
  @Input() compact = false;
  @Input() showPageLink = false;

  plan = PLAN;

  categories = [
    {
      label: 'Healthcare & Diagnostics',
      demand: 'Apollo site, 60–70 m',
      short: 'Clinics, diagnostics, pharmacy',
      description: 'Clinics, diagnostics and pharmacies sit about 60–70 m from the planned 400-bed Apollo Medics hospital (under construction; OPD expected to start in 2027).',
      benefit: 'Near a planned 400-bed hospital',
    },
    {
      label: 'Banking, BFSI & Insurance',
      demand: 'Offices, hospital and campus staff',
      short: 'Branches, NBFC, insurance',
      description: 'Branch banking, NBFC and insurance operations benefit from lift access, parking and a professional address on a 24 m road.',
      benefit: 'Lift, parking, signage',
    },
    {
      label: 'Food & Beverage',
      demand: 'Patients, students, delegates',
      short: 'Cafés, restaurants, QSR',
      description: 'Cafés and restaurants can serve patients, students, exhibitors and delegates. F&B provisions are subject to final tenant MEP design.',
      benefit: 'MEP notes on request',
    },
    {
      label: 'Corporate & Professional Offices',
      demand: 'Whole open floor, glass front',
      short: 'One open 3,520 sq ft floor',
      description: 'One whole open floor plate with a glass front, three-phase power, DG backup and internet readiness, divided as the occupier requires.',
      benefit: 'Power, internet, daylight',
    },
    {
      label: 'Education & Training',
      demand: 'NIFT Varanasi, 60–70 m',
      short: 'Institutes, coaching',
      description: 'Training institutes and coaching businesses benefit from proximity to NIFT Varanasi (classes running since July 2024) and the student catchment.',
      benefit: 'Beside NIFT Varanasi',
    },
    {
      label: 'Fashion, Design & Creative',
      demand: 'NIFT and the Trade Centre',
      short: 'Studios, showrooms',
      description: 'Studios and creative businesses can draw on NIFT Varanasi and the Trade Centre, which has 50 marts and a 1,000-seat convention hall.',
      benefit: 'NIFT and the Trade Centre',
    },
    {
      label: 'Fitness, Wellness & Lifestyle',
      demand: 'Residents and campus',
      short: 'Gyms, studios, wellness',
      description: 'Whole-floor formats with parking and HVAC provision suit fitness and wellness operators, subject to structural and MEP confirmation.',
      benefit: 'Whole floor, parking',
    },
    {
      label: 'Retail & Customer-Facing Services',
      demand: 'Road frontage, parking',
      short: 'Showrooms, services',
      description: `High-visibility frontage (${PLAN.plot.frontage} on a ${PLAN.plot.roadWidthM} m road) and parking support customer-facing retail and service formats.`,
      benefit: 'Frontage, visibility, parking',
    },
    {
      label: 'Hotels & Serviced Stay',
      demand: 'Visitors and families',
      short: 'A possibility, not assigned',
      description: 'Boutique hotel and serviced-stay formats can be considered on the whole-floor plates for visitors, families and professionals. This is a business possibility, not an exclusive floor assignment.',
      benefit: 'Possible · subject to approvals',
    },
    {
      label: 'Studio Apartments',
      demand: 'Visitors and professionals',
      short: 'A possibility, not assigned',
      description: 'Studio apartments and compact stay units can be considered as a mixed-use possibility on the same typical floor plate used across Floors 1, 2 and 3.',
      benefit: 'Possible · subject to approvals',
    },
  ];

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
