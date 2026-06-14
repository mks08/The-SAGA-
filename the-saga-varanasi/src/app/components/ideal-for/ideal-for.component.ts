import { Component } from '@angular/core';

interface TabContent {
  title: string;
  description: string;
  points: string[];
}

@Component({
  selector: 'app-ideal-for',
  templateUrl: './ideal-for.component.html',
  styleUrls: ['./ideal-for.component.scss'],
})
export class IdealForComponent {
  activeTab = 'businesses';

  tabContent: { [key: string]: TabContent } = {
    businesses: {
      title: 'Perfect for Established Businesses',
      description: 'Large, flexible commercial spaces designed to accommodate growing teams and operations. Features include:',
      points: [
        'Customizable floor plans',
        'High-speed connectivity',
        'Professional conference facilities',
        'Ample parking and logistics support',
      ],
    },
    startups: {
      title: 'Ideal for Dynamic Startups',
      description: 'Collaborative spaces that foster innovation and growth with cost-effective solutions:',
      points: [
        'Flexible lease terms',
        'Shared common areas',
        'Networking opportunities',
        'Scalable infrastructure',
      ],
    },
    professionals: {
      title: 'Great for Professionals',
      description: 'Premium spaces for individual practitioners, consultants, and professional services:',
      points: [
        'Prestigious business address',
        'Meeting rooms on-demand',
        'Client reception areas',
        'Professional atmosphere',
      ],
    },
    retail: {
      title: 'Excellent for Retail',
      description: 'High-traffic locations with excellent visibility and foot traffic potential:',
      points: [
        'Strategic visibility',
        'Customer parking',
        'Modern retail setup',
        'Integrated shopping experience',
      ],
    },
  };

  selectTab(tab: string) {
    this.activeTab = tab;
  }
}
