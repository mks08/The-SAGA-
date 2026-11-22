import { Component, Input } from '@angular/core';

/**
 * The SHRINEVA logo, always drawn from the designed artwork (never typed in a site font):
 *  - lockup: the SG monogram beside the SHRINEVA wordmark, optional "Commercial space · Varanasi" line (navbar, footer)
 *  - wordmark: the lettering alone, large (home headline)
 * The lettering is an image, so it carries the accessible name "SHRINEVA".
 */
@Component({
  selector: 'app-brand-logo',
  template: `
    <ng-container *ngIf="variant === 'wordmark'; else lockup">
      <img src="assets/images/logo-wordmark-md.webp" srcset="assets/images/logo-wordmark-sm.webp 320w, assets/images/logo-wordmark-md.webp 640w, assets/images/logo-wordmark.webp 908w" sizes="(min-width: 1024px) 23rem, 15rem"
           [alt]="decorative ? '' : 'SHRINEVA'" width="908" height="232" loading="eager" decoding="async" class="block h-auto w-full select-none">
    </ng-container>
    <ng-template #lockup>
      <span class="flex items-center gap-3">
        <img src="assets/images/logo-mark.webp" alt="" width="120" height="116" loading="eager" decoding="async" class="h-11 w-auto select-none">
        <span class="flex flex-col">
          <img src="assets/images/logo-wordmark-sm.webp" alt="SHRINEVA" width="320" height="82" loading="eager" decoding="async" class="h-[1.85rem] w-auto select-none">
          <span *ngIf="tagline" class="brand-tagline mt-1 whitespace-nowrap font-mono text-[0.56rem] uppercase leading-none tracking-[0.2em] text-brass-soft">Commercial space · Varanasi</span>
        </span>
      </span>
    </ng-template>
  `,
  // On a 320 px phone the tagline would push the menu button over the wordmark, so it steps out below 360 px.
  styles: [':host { display: inline-block; } @media (max-width: 359.98px) { .brand-tagline { display: none; } }'],
})
export class BrandLogoComponent {
  @Input() variant: 'lockup' | 'wordmark' = 'lockup';
  @Input() tagline = false;
  /** Set when the brand name is already announced by neighbouring text (e.g. inside the page H1). */
  @Input() decorative = false;
}
