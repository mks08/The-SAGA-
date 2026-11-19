import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const isHindiUrl = (url: string): boolean => /^\/hi(\/|$|\?|#)/.test(url);

/** Tells shared pieces of the shell (action bar, WhatsApp button) whether the visitor is on the Hindi page (/hi). */
@Injectable({ providedIn: 'root' })
export class PageLangService {
  hindi: boolean;

  constructor(router: Router, location: Location) {
    this.hindi = isHindiUrl(location.path());
    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => { this.hindi = isHindiUrl(e.urlAfterRedirects); });
  }
}
