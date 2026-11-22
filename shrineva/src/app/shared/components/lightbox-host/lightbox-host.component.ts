import { Component, HostListener, OnDestroy } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MediaItem } from '../../../config/media.config';
import { LightboxRequest, OPEN_LIGHTBOX_EVENT } from '../../../core/ui-events';
import { PageLangService } from '../../../core/services/page-lang.service';
import { LightboxLang } from '../lightbox/lightbox.component';

/**
 * One image viewer for the whole site, mounted once at the root (app.component.html) so it always sits above the header,
 * the action bar and ChaiX, whatever the picture's own section does with transforms or stacking. Any button opens it with
 * openLightbox() from core/ui-events.ts; the Hindi page gets Hindi button labels automatically.
 */
@Component({
  selector: 'app-lightbox-host',
  template: `<app-lightbox [items]="items" [index]="index" [disclaimer]="disclaimer" [lang]="lang"
                           (indexChange)="index = $event" (closed)="close()"></app-lightbox>`,
})
export class LightboxHostComponent implements OnDestroy {
  items: MediaItem[] = [];
  index: number | null = null;
  disclaimer = '';
  lang: LightboxLang = 'en';

  private sub: Subscription;

  constructor(router: Router, private pageLang: PageLangService) {
    // Going to another page (browser Back, a link) always closes the viewer.
    this.sub = router.events.pipe(filter((e) => e instanceof NavigationStart)).subscribe(() => this.close());
  }

  @HostListener(`window:${OPEN_LIGHTBOX_EVENT}`, ['$event'])
  onOpen(e: Event): void {
    const req = (e as CustomEvent<LightboxRequest>).detail;
    if (!req || !req.items || !req.items.length) return;
    this.items = req.items;
    this.disclaimer = req.disclaimer ?? '';
    this.lang = this.pageLang.hindi ? 'hi' : 'en';
    this.index = Math.min(Math.max(req.index ?? 0, 0), req.items.length - 1);
  }

  close(): void { this.index = null; }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
