import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { PropertyPageComponent } from './pages/property-page/property-page.component';
import { SpacesPageComponent } from './pages/spaces-page/spaces-page.component';
import { FloorDetailPageComponent } from './pages/floor-detail-page/floor-detail-page.component';
import { GrowthPageComponent } from './pages/growth-page/growth-page.component';
import { BusinessFitPageComponent } from './pages/business-fit-page/business-fit-page.component';
import { InfrastructurePageComponent } from './pages/infrastructure-page/infrastructure-page.component';
import { FloorPlansPageComponent } from './pages/floor-plans-page/floor-plans-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';
import { LeasingPageComponent } from './pages/leasing-page/leasing-page.component';
import { BrokersPageComponent } from './pages/brokers-page/brokers-page.component';
import { TermsPageComponent } from './pages/terms-page/terms-page.component';
import { WalkthroughPageComponent } from './pages/walkthrough-page/walkthrough-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LocationContactPageComponent } from './pages/location-contact-page/location-contact-page.component';
import { PrivacyDisclaimerPageComponent } from './pages/privacy-disclaimer-page/privacy-disclaimer-page.component';

const routes: Routes = [
  { path: '', component: MainLayoutComponent },
  { path: 'property', component: PropertyPageComponent },
  { path: 'walkthrough', component: WalkthroughPageComponent },
  { path: 'spaces', component: SpacesPageComponent },
  { path: 'spaces/:floorId', component: FloorDetailPageComponent },
  { path: 'healthcare-diagnostic-space', component: LandingPageComponent, data: { landing: 'healthcare' } },
  { path: 'office-bank-coaching-space', component: LandingPageComponent, data: { landing: 'office' } },
  { path: 'retail-showroom-cafe-space', component: LandingPageComponent, data: { landing: 'retail' } },
  { path: 'location-contact', component: LocationContactPageComponent },
  { path: 'growth', component: GrowthPageComponent },
  { path: 'business-fit', component: BusinessFitPageComponent },
  { path: 'infrastructure', component: InfrastructurePageComponent },
  { path: 'floor-plans', component: FloorPlansPageComponent },
  { path: 'gallery', component: GalleryPageComponent },
  { path: 'leasing', component: LeasingPageComponent },
  { path: 'brokers', component: BrokersPageComponent },
  { path: 'privacy-disclaimer', component: PrivacyDisclaimerPageComponent },
  { path: 'terms', component: TermsPageComponent },
  // Old URLs from earlier versions of the site. .htaccess sends the same permanent (301) redirects for first-time visitors.
  { path: 'location', redirectTo: 'location-contact', pathMatch: 'full' },
  { path: 'contact', redirectTo: 'location-contact', pathMatch: 'full' },
  { path: 'privacy', redirectTo: 'privacy-disclaimer', pathMatch: 'full' },
  { path: 'disclaimer', redirectTo: 'privacy-disclaimer', pathMatch: 'full' },
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
