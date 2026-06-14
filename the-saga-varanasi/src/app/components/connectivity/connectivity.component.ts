import { Component } from '@angular/core';

@Component({
  selector: 'app-connectivity',
  templateUrl: './connectivity.component.html',
  styleUrls: ['./connectivity.component.scss'],
})
export class ConnectivityComponent {
  connections = [
    {
      icon: '🏥',
      name: 'Apollo Hospital (400 Beds)',
      distance: 'Directly Opposite',
      time: 'Walking distance',
      tag: 'Prime Landmark',
      highlight: true,
    },
    {
      icon: '🎓',
      name: 'NIFT — Natl. Institute of Fashion Technology',
      distance: 'Diagonal',
      time: 'Walking distance',
      tag: 'Institution',
      highlight: true,
    },
    {
      icon: '🛣️',
      name: 'Varanasi Ring Road',
      distance: '~1 km',
      time: '~2–3 min',
      tag: 'Highway',
      highlight: true,
    },
    {
      icon: '✈️',
      name: 'Lal Bahadur Shastri International Airport',
      distance: '~15 km',
      time: '~30 min',
      tag: 'Airport',
      highlight: false,
    },
    {
      icon: '🚂',
      name: 'Varanasi Junction (Main Railway Station)',
      distance: '~8 km',
      time: '~20 min',
      tag: 'Railway',
      highlight: false,
    },
    {
      icon: '🚉',
      name: 'Varanasi Cantt Railway Station',
      distance: '~6 km',
      time: '~15 min',
      tag: 'Railway',
      highlight: false,
    },
    {
      icon: '🏛️',
      name: 'BHU — Banaras Hindu University',
      distance: '~10 km',
      time: '~25 min',
      tag: 'University',
      highlight: false,
    },
    {
      icon: '🛕',
      name: 'Kashi Vishwanath / Godaulia City Centre',
      distance: '~7 km',
      time: '~18 min',
      tag: 'City Centre',
      highlight: false,
    },
  ];
}
