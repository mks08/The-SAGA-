import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PLAN, PROPERTY } from '../../config/property.config';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
})
export class LocationComponent {
  @Input() showIntro = true;
  property = PROPERTY;
  plan = PLAN;
  mapEmbedUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(PROPERTY.address.embedSrc);
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
