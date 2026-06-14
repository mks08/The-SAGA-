import { Component, OnInit } from '@angular/core';

interface Feature {
  icon: string;
  name: string;
  desc: string;
}

interface Metric {
  value: string;
  label: string;
}

interface Tab {
  id: string;
  icon: string;
  label: string;
  title: string;
  description: string;
  features: Feature[];
  metrics: Metric[];
}

@Component({
  selector: 'app-ideal-for',
  templateUrl: './ideal-for.component.html',
  styleUrls: ['./ideal-for.component.scss'],
})
export class IdealForComponent implements OnInit {
  activeTab = 'retail';
  currentTab!: Tab;

  tabs: Tab[] = [
    {
      id: 'retail',
      icon: '🛍️',
      label: 'Retail',
      title: 'Premium Retail Spaces with Maximum Footfall',
      description: 'Located on Varanasi\'s busiest emerging commercial corridor — directly opposite Apollo Hospital, a 400-bed facility with thousands of daily visitors. Capture unrivaled brand visibility.',
      features: [
        { icon: '📊', name: 'High Daily Footfall', desc: 'Thousands of hospital visitors + NIFT students daily' },
        { icon: '🚗', name: 'Dedicated Parking', desc: 'Customer parking included — zero friction for shoppers' },
        { icon: '🏷️', name: 'Brand Storefront', desc: 'Ground + upper floors with prime façade visibility' },
        { icon: '🔧', name: 'Custom Fitout', desc: 'Design your store to match your brand identity' },
      ],
      metrics: [
        { value: '3,500', label: 'Sq ft/floor' },
        { value: 'G+4', label: 'Floors' },
        { value: '2026', label: 'Possession' },
      ],
    },
    {
      id: 'clinics',
      icon: '🏥',
      label: 'Clinics & Medical',
      title: 'Healthcare Hub Adjacent to Apollo Hospital',
      description: 'The SAGA\'s proximity to the 400-bed Apollo Hospital makes it the city\'s premier address for specialist clinics, diagnostic labs, pharmacies, and allied healthcare services.',
      features: [
        { icon: '🏥', name: 'Medical Corridor', desc: 'Directly opposite Apollo Hospital for patient referrals' },
        { icon: '♿', name: 'Accessible Design', desc: 'Lifts, wide corridors & patient-friendly layouts' },
        { icon: '🔬', name: 'Lab-Ready Spaces', desc: 'Plumbing & power provisions for diagnostic centers' },
        { icon: '🅿️', name: 'Patient Parking', desc: 'Dedicated parking for clinic patients' },
      ],
      metrics: [
        { value: '400-bed', label: 'Apollo Hospital' },
        { value: '∞', label: 'Patient Footfall' },
        { value: '< 1 km', label: 'To NIFT' },
      ],
    },
    {
      id: 'offices',
      icon: '💼',
      label: 'Offices',
      title: 'Prestigious Business Address in Varanasi',
      description: 'Establish your corporate headquarters, branch office, or co-working facility in Varanasi\'s most rapidly developing business district — with all modern infrastructure built-in.',
      features: [
        { icon: '🌐', name: 'High-Speed Fiber', desc: '100+ Mbps connectivity for seamless remote work' },
        { icon: '⚡', name: '100% Power Backup', desc: 'Uninterrupted operations with DG backup' },
        { icon: '🎨', name: 'Custom Interiors', desc: 'Design open offices, cabins, or hybrid layouts' },
        { icon: '🤝', name: 'Meeting Facilities', desc: 'Professional conference & client-meeting spaces' },
      ],
      metrics: [
        { value: '3,500', label: 'Sq ft/floor' },
        { value: '24/7', label: 'Power Backup' },
        { value: 'Oct\'26', label: 'Possession' },
      ],
    },
    {
      id: 'banks',
      icon: '🏦',
      label: 'Banks & Finance',
      title: 'The Ideal Financial Services Hub',
      description: 'Capture Varanasi\'s booming financial services market with a branch in the city\'s most active emerging commercial zone. Ground floor spaces ideal for ATMs, branch banking, and NBFCs.',
      features: [
        { icon: '🔒', name: 'Advanced Security', desc: 'CCTV, access control & 24/7 security' },
        { icon: '🏧', name: 'ATM-Ready Ground', desc: 'Ground floor infrastructure for ATM installation' },
        { icon: '🚗', name: 'Drive-Through Possible', desc: 'Wide frontage for customer drive-up access' },
        { icon: '💡', name: 'Smart Infrastructure', desc: 'Structured cabling for banking IT systems' },
      ],
      metrics: [
        { value: 'Ground', label: 'Prime ATM floor' },
        { value: 'VDA', label: 'Approved' },
        { value: 'High', label: 'Footfall Zone' },
      ],
    },
    {
      id: 'studios',
      icon: '🏠',
      label: '1 BHK Studios',
      title: 'Premium 1 BHK Studio Apartments',
      description: 'Invest in or lease fully-equipped 1 BHK studio apartments within The SAGA — designed for medical professionals, NIFT students, and working professionals in this rapidly growing micro-market.',
      features: [
        { icon: '📐', name: 'Optimised Layouts', desc: 'Smart studio designs maximizing every square foot' },
        { icon: '🎓', name: 'NIFT Proximity', desc: 'Walking distance to National Institute of Fashion Technology' },
        { icon: '🏥', name: 'Apollo Adjacency', desc: 'Ideal for resident doctors & medical staff' },
        { icon: '📈', name: 'High Rental Yield', desc: 'Premium location drives strong rental returns' },
      ],
      metrics: [
        { value: '1 BHK', label: 'Studio format' },
        { value: 'High', label: 'Rental yield' },
        { value: 'NIFT', label: 'Diagonal' },
      ],
    },
  ];

  ngOnInit() {
    this.updateCurrentTab();
  }

  selectTab(id: string) {
    this.activeTab = id;
    this.updateCurrentTab();
  }

  updateCurrentTab() {
    this.currentTab = this.tabs.find(t => t.id === this.activeTab)!;
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
