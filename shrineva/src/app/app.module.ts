import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { NavbarComponent } from './components/navbar/navbar.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { BrandLogoComponent } from './components/brand-logo/brand-logo.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { FinalCtaComponent } from './components/final-cta/final-cta.component';
import { ContactComponent } from './components/contact/contact.component';
import { BookingPopupComponent } from './components/booking-popup/booking-popup.component';
import { WhatsappFabComponent } from './components/whatsapp-fab/whatsapp-fab.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { MobileCtaComponent } from './components/mobile-cta/mobile-cta.component';
import { ChaixComponent } from './components/chaix/chaix.component';

import { FloorPlansPageComponent } from './pages/floor-plans-page/floor-plans-page.component';
import { LeasingPageComponent } from './pages/leasing-page/leasing-page.component';
import { TermsPageComponent } from './pages/terms-page/terms-page.component';
import { PlansComponent } from './components/plans/plans.component';
import { HomeHeroComponent } from './components/home-hero/home-hero.component';
import { BrochureCardComponent } from './components/brochure-card/brochure-card.component';
import { GuidedTourComponent } from './components/guided-tour/guided-tour.component';
import { ProjectTimelineComponent } from './components/project-timeline/project-timeline.component';
import { PlaceMapComponent } from './components/place-map/place-map.component';
import { SectionRailComponent } from './components/section-rail/section-rail.component';
import { WalkthroughPageComponent } from './pages/walkthrough-page/walkthrough-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LocationContactPageComponent } from './pages/location-contact-page/location-contact-page.component';
import { PrivacyDisclaimerPageComponent } from './pages/privacy-disclaimer-page/privacy-disclaimer-page.component';
import { FaqComponent } from './components/faq/faq.component';
import { LeadFormComponent } from './components/lead-form/lead-form.component';
import { BuildingExplorerComponent } from './components/building-explorer/building-explorer.component';
import { BuildingSpecsComponent } from './components/building-specs/building-specs.component';
import { SitePlanComponent } from './components/site-plan/site-plan.component';
import { HindiPageComponent } from './pages/hindi-page/hindi-page.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MainLayoutComponent,
    BrandLogoComponent,
    GalleryComponent,
    FinalCtaComponent,
    ContactComponent,
    BookingPopupComponent,
    WhatsappFabComponent,
    SiteFooterComponent,
    MobileCtaComponent,
    ChaixComponent,
    FloorPlansPageComponent,
    LeasingPageComponent,
    TermsPageComponent,
    PlansComponent,
    HomeHeroComponent,
    BrochureCardComponent,
    GuidedTourComponent,
    ProjectTimelineComponent,
    PlaceMapComponent,
    SectionRailComponent,
    WalkthroughPageComponent,
    LandingPageComponent,
    LocationContactPageComponent,
    PrivacyDisclaimerPageComponent,
    FaqComponent,
    LeadFormComponent,
    BuildingExplorerComponent,
    HindiPageComponent,
    SitePlanComponent,
    BuildingSpecsComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
  ],
  // Reuses the pre-rendered HTML on the visitor's device instead of building the page a second time.
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
