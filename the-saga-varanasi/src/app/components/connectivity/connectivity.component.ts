import { Component } from '@angular/core';

@Component({
  selector: 'app-connectivity',
  templateUrl: './connectivity.component.html',
  styleUrls: ['./connectivity.component.scss'],
})
export class ConnectivityComponent {
  connections = [
    {
      icon: '✈️',
      name: 'Lal Bahadur Shastri International Airport',
      distance: '~18 km',
      time: '~35 min',
      tag: 'Airport',
      highlight: false,
    },
    {
      icon: '🚂',
      name: 'Varanasi Junction Railway Station',
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
      icon: '🏥',
      name: 'Apollo Hospital (400 Beds)',
      distance: 'Directly Opposite',
      time: 'Walking',
      tag: 'Landmark',
      highlight: true,
    },
    {
      icon: '🎓',
      name: 'NIFT — National Institute of Fashion Technology',
      distance: 'Diagonal',
      time: 'Walking',
      tag: 'Institution',
      highlight: true,
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
      name: 'Kashi Vishwanath Temple / Godaulia',
      distance: '~7 km',
      time: '~18 min',
      tag: 'City Centre',
      highlight: false,
    },
    {
      icon: '🏢',
      name: 'Varanasi Development Authority (VDA)',
      distance: '~5 km',
      time: '~12 min',
      tag: 'Govt. Office',
      highlight: false,
    },
  ];
}
