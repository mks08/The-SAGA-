import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RevealService } from '../../services/reveal.service';

@Component({
  selector: 'app-connectivity',
  templateUrl: './connectivity.component.html',
  styleUrls: ['./connectivity.component.scss'],
})
export class ConnectivityComponent implements AfterViewInit, OnDestroy {
  private io?: IntersectionObserver;

  connections = [
    { icon: '🏥', distance: 'Opposite', name: 'Apollo Hospital', desc: '400-bed multi-speciality hospital — daily patient & visitor footfall' },
    { icon: '🎓', distance: 'Diagonal', name: 'NIFT Varanasi', desc: 'National Institute of Fashion Technology — student & faculty footfall' },
    { icon: '🔵', distance: '1 km', name: 'Ring Road', desc: 'Direct connectivity to all parts of Varanasi — high vehicle traffic' },
    { icon: '✈️', distance: '15 km', name: 'Airport', desc: 'Lal Bahadur Shastri International Airport — national & international access' },
    { icon: '🛤️', distance: 'Nearby', name: 'Varanasi Cantt. Station', desc: 'One of India\'s busiest railway junctions — massive transit crowd' },
    { icon: '🛣️', distance: 'Prime', name: 'Bada Lalpur Corridor', desc: 'Fastest growing commercial micro-market in new Varanasi' },
  ];

  whyPoints = [
    '400-bed Apollo Hospital across the street = thousands of daily visitors',
    'NIFT student corridor drives F&B and retail demand',
    '1 km Ring Road access = catchment from all city zones',
    'Medical zone = pharmacy, clinic, diagnostics demand is structural',
    'Zero competition at this scale in the immediate vicinity',
    'Early lessees get the lowest rates before market appreciation',
  ];

  constructor(private revealService: RevealService) {}
  ngAfterViewInit() { this.io = this.revealService.observe(); }
  ngOnDestroy() { this.io?.disconnect(); }
}
