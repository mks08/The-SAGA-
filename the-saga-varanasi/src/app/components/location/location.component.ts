import { Component } from '@angular/core';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
})
export class LocationComponent {
  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
