import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { FloorPlansPageComponent } from './pages/floor-plans-page/floor-plans-page.component';
import { LeasingPageComponent } from './pages/leasing-page/leasing-page.component';
import { TermsPageComponent } from './pages/terms-page/terms-page.component';
import { WalkthroughPageComponent } from './pages/walkthrough-page/walkthrough-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LocationContactPageComponent } from './pages/location-contact-page/location-contact-page.component';
import { PrivacyDisclaimerPageComponent } from './pages/privacy-disclaimer-page/privacy-disclaimer-page.component';

const routes: Routes = [
  { path: '', component: MainLayoutComponent },
  { path: 'walkthrough', component: WalkthroughPageComponent },
  { path: 'healthcare-diagnostic-space', component: LandingPageComponent, data: { landing: 'healthcare' } },
  { path: 'office-bank-coaching-space', component: LandingPageComponent, data: { landing: 'office' } },
  { path: 'retail-showroom-cafe-space', component: LandingPageComponent, data: { landing: 'retail' } },
  { path: 'location-contact', component: LocationContactPageComponent },
  { path: 'floor-plans', component: FloorPlansPageComponent },
  { path: 'leasing', component: LeasingPageComponent },
  { path: 'privacy-disclaimer', component: PrivacyDisclaimerPageComponent },
  { path: 'terms', component: TermsPageComponent },
  // Old URLs from earlier versions of the site. .htaccess sends the same permanent (301) redirects for first-time visitors.
  { path: 'location', redirectTo: 'location-contact', pathMatch: 'full' },
  { path: 'contact', redirectTo: 'location-contact', pathMatch: 'full' },
  { path: 'privacy', redirectTo: 'privacy-disclaimer', pathMatch: 'full' },
  { path: 'disclaimer', redirectTo: 'privacy-disclaimer', pathMatch: 'full' },
  // Pages folded into the shorter site (19 Nov 2026). Same targets as the 301s in .htaccess and vercel.json.
  { path: 'property', redirectTo: '', pathMatch: 'full' },
  { path: 'business-fit', redirectTo: '', pathMatch: 'full' },
  { path: 'spaces', redirectTo: 'floor-plans', pathMatch: 'full' },
  { path: 'spaces/:floorId', redirectTo: 'floor-plans', pathMatch: 'full' },
  { path: 'infrastructure', redirectTo: 'floor-plans', pathMatch: 'full' },
  { path: 'growth', redirectTo: 'location-contact', pathMatch: 'full' },
  { path: 'gallery', redirectTo: 'walkthrough', pathMatch: 'full' },
  { path: 'brokers', redirectTo: 'leasing', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'disabled',
      anchorScrolling: 'enabled',
      scrollOffset: [0, 80],
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
