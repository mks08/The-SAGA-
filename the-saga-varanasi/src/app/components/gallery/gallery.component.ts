import { Component } from '@angular/core';

interface GalleryItem {
  id: string;
  title: string;
  tag: string;
  coming: boolean;
  src?: string;
}

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent {
  activeTab = 'renders';
  lightboxOpen = false;
  lightboxSrc = '';
  lightboxTitle = '';

  tabs = [
    { id: 'renders',      label: 'Design Renders',     icon: '🎨' },
    { id: 'floorplans',   label: 'Floor Plans',         icon: '📐' },
    { id: 'construction', label: 'Under Construction',  icon: '🏗️' },
    { id: 'photos',       label: 'Site Photos',         icon: '📷' },
  ];

  gallery: Record<string, GalleryItem[]> = {
    renders: [
      { id: 'r1', title: 'Main Façade — Day View',      tag: 'Exterior',  coming: true },
      { id: 'r2', title: 'Rooftop Café Render',         tag: 'Interior',  coming: true },
      { id: 'r3', title: 'Ground Floor Retail View',    tag: 'Retail',    coming: true },
      { id: 'r4', title: 'Office Floor Layout',         tag: 'Office',    coming: true },
      { id: 'r5', title: 'Night Illumination',          tag: 'Exterior',  coming: true },
      { id: 'r6', title: 'Parking Area',                tag: 'Amenity',   coming: true },
    ],
    floorplans: [
      { id: 'f1', title: 'Ground Floor Plan',           tag: 'G Floor',   coming: true },
      { id: 'f2', title: 'First Floor Plan',            tag: '1st Floor', coming: true },
      { id: 'f3', title: 'Second Floor Plan',           tag: '2nd Floor', coming: true },
      { id: 'f4', title: 'Third Floor Plan',            tag: '3rd Floor', coming: true },
      { id: 'f5', title: 'Fourth Floor / Rooftop',      tag: '4th Floor', coming: true },
      { id: 'f6', title: 'Parking Level Plan',          tag: 'Parking',   coming: true },
    ],
    construction: [
      { id: 'c1', title: 'Foundation Work',             tag: 'Phase 1',   coming: true },
      { id: 'c2', title: 'Column Rising',               tag: 'Phase 2',   coming: true },
      { id: 'c3', title: 'Structure Progress',          tag: 'Phase 3',   coming: true },
      { id: 'c4', title: 'Brickwork & Plaster',        tag: 'Phase 4',   coming: true },
      { id: 'c5', title: 'Façade Work',                 tag: 'Phase 5',   coming: true },
      { id: 'c6', title: 'Interior Finishing',          tag: 'Phase 6',   coming: true },
    ],
    photos: [
      { id: 'p1', title: 'Project Site Aerial',         tag: 'Location',  coming: true },
      { id: 'p2', title: 'Apollo Hospital Proximity',   tag: 'Landmark',  coming: true },
      { id: 'p3', title: 'NIFT — Diagonal View',       tag: 'Landmark',  coming: true },
      { id: 'p4', title: 'Street Frontage',             tag: 'Site',      coming: true },
      { id: 'p5', title: 'Surrounding Infrastructure', tag: 'Area',      coming: true },
      { id: 'p6', title: 'VDA Approval Document',       tag: 'Legal',     coming: true },
    ],
  };

  get currentItems(): GalleryItem[] {
    return this.gallery[this.activeTab] || [];
  }

  selectTab(id: string) {
    this.activeTab = id;
  }

  openLightbox(item: GalleryItem) {
    if (item.src) {
      this.lightboxSrc = item.src;
      this.lightboxTitle = item.title;
      this.lightboxOpen = true;
    }
  }

  closeLightbox() {
    this.lightboxOpen = false;
  }

  notifyMe() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
  }
}
