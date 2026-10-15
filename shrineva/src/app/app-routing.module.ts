import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { PropertyPageComponent } from './pages/property-page/property-page.component';
import { SpacesPageComponent } from './pages/spaces-page/spaces-page.component';
import { FloorDetailPageComponent } from './pages/floor-detail-page/floor-detail-page.component';
import { LocationPageComponent } from './pages/location-page/location-page.component';
import { GrowthPageComponent } from './pages/growth-page/growth-page.component';
import { BusinessFitPageComponent } from './pages/business-fit-page/business-fit-page.component';
import { InfrastructurePageComponent } from './pages/infrastructure-page/infrastructure-page.component';
import { FloorPlansPageComponent } from './pages/floor-plans-page/floor-plans-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';
import { LeasingPageComponent } from './pages/leasing-page/leasing-page.component';
import { BrokersPageComponent } from './pages/brokers-page/brokers-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { PrivacyPageComponent } from './pages/privacy-page/privacy-page.component';
import { TermsPageComponent } from './pages/terms-page/terms-page.component';
import { DisclaimerPageComponent } from './pages/disclaimer-page/disclaimer-page.component';
import { WalkthroughPageComponent } from './pages/walkthrough-page/walkthrough-page.component';

const routes: Routes = [
  { path: '', component: MainLayoutComponent },
  { path: 'property', component: PropertyPageComponent },
  { path: 'walkthrough', component: WalkthroughPageComponent },
  { path: 'spaces', component: SpacesPageComponent },
  { path: 'spaces/:floorId', component: FloorDetailPageComponent },
  { path: 'location', component: LocationPageComponent },
  { path: 'growth', component: GrowthPageComponent },
  { path: 'business-fit', component: BusinessFitPageComponent },
  { path: 'infrastructure', component: InfrastructurePageComponent },
  { path: 'floor-plans', component: FloorPlansPageComponent },
  { path: 'gallery', component: GalleryPageComponent },
  { path: 'leasing', component: LeasingPageComponent },
  { path: 'brokers', component: BrokersPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'privacy', component: PrivacyPageComponent },
  { path: 'terms', component: TermsPageComponent },
  { path: 'disclaimer', component: DisclaimerPageComponent },
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
