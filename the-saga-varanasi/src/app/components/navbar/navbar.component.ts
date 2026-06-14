import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  active = 'hero';
  scrolled = false;
  menuOpen = false;
  scrollProgress = 0;

  private observer!: IntersectionObserver;

  readonly navLinks = [
    { id: 'hero',         label: 'Home' },
    { id: 'highlights',   label: 'Amenities' },
    { id: 'ideal-for',    label: 'Use Cases' },
    { id: 'gallery',      label: 'Gallery' },
    { id: 'connectivity', label: 'Connectivity' },
    { id: 'location',     label: 'Location' },
    { id: 'contact',      label: 'Contact' },
  ];

  ngOnInit() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            this.active = entry.target.id;
          }
        });
      },
      { threshold: [0.3, 0.5], rootMargin: '-80px 0px -40% 0px' }
    );

    this.navLinks.forEach(link => {
      const el = document.getElementById(link.id);
      if (el) this.observer.observe(el);
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 60;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    this.menuOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  openPopup() {
    window.dispatchEvent(new CustomEvent('open-booking-popup'));
    this.menuOpen = false;
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
