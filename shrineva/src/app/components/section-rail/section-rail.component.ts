import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface RailItem { id: string; label: string; }

/**
 * A slim dot rail on the right edge of the home page: shows where you are and jumps to a section.
 * Built from the `data-rail` attributes in the page, so a new section only needs that attribute. Desktop only.
 */
@Component({
  selector: 'app-section-rail',
  template: `
    <nav *ngIf="items.length > 1 && visible" class="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 xl:block" aria-label="Page sections">
      <ul class="flex flex-col items-end gap-1">
        <li *ngFor="let it of items">
          <a [href]="'#' + it.id" (click)="go($event, it.id)" class="group flex min-h-[28px] items-center gap-3" [attr.aria-current]="active === it.id ? 'true' : null">
            <span class="rounded-full bg-ink/80 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">{{ it.label }}</span>
            <span class="block rounded-full border border-brass/70 transition-all duration-300"
                  [ngClass]="active === it.id ? 'h-6 w-2 bg-brass' : 'size-2 bg-ink/30 group-hover:bg-brass/70'"></span>
          </a>
        </li>
      </ul>
    </nav>`,
})
export class SectionRailComponent implements AfterViewInit, OnDestroy {
  items: RailItem[] = [];
  active = '';
  visible = true;
  private io?: IntersectionObserver;
  private sub: Subscription;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone, private cdr: ChangeDetectorRef, router: Router) {
    this.sub = router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => setTimeout(() => this.scan()));
  }

  ngAfterViewInit(): void { setTimeout(() => this.scan()); }

  ngOnDestroy(): void { this.io?.disconnect(); this.sub.unsubscribe(); }

  go(ev: Event, id: string): void {
    ev.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  private scan(): void {
    this.io?.disconnect();
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-rail][id]'));
    this.items = nodes.map((n) => ({ id: n.id, label: n.dataset['rail'] ?? n.id }));
    this.active = this.items[0]?.id ?? '';
    this.cdr.markForCheck();
    if (typeof IntersectionObserver === 'undefined' || nodes.length < 2) return;
    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver((entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit && hit.target.id !== this.active) this.zone.run(() => { this.active = hit.target.id; this.cdr.markForCheck(); });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 0.5] });
      nodes.forEach((n) => this.io?.observe(n));
    });
  }
}
