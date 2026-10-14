import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { NavbarComponent } from './components/navbar/navbar.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { HeroComponent } from './components/hero/hero.component';
import { SnapshotComponent } from './components/snapshot/snapshot.component';
import { EcosystemComponent } from './components/ecosystem/ecosystem.component';
import { GrowthComponent } from './components/growth/growth.component';
import { ArchitectureComponent } from './components/architecture/architecture.component';
import { IdealForComponent } from './components/ideal-for/ideal-for.component';
import { OccupierFactorsComponent } from './components/occupier-factors/occupier-factors.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { LeasingTeaserComponent } from './components/leasing-teaser/leasing-teaser.component';
import { LocationComponent } from './components/location/location.component';
import { BrandStoryComponent } from './components/brand-story/brand-story.component';
import { FaqComponent } from './components/faq/faq.component';
import { FinalCtaComponent } from './components/final-cta/final-cta.component';
import { ContactComponent } from './components/contact/contact.component';
import { BookingPopupComponent } from './components/booking-popup/booking-popup.component';
import { WhatsappFabComponent } from './components/whatsapp-fab/whatsapp-fab.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { MobileCtaComponent } from './components/mobile-cta/mobile-cta.component';

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
import { FaqPageComponent } from './pages/faq-page/faq-page.component';
import { PlansComponent } from './components/plans/plans.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MainLayoutComponent,
    HeroComponent,
    SnapshotComponent,
    EcosystemComponent,
    GrowthComponent,
    ArchitectureComponent,
    IdealForComponent,
    OccupierFactorsComponent,
    GalleryComponent,
    LeasingTeaserComponent,
    LocationComponent,
    BrandStoryComponent,
    FaqComponent,
    FinalCtaComponent,
    ContactComponent,
    BookingPopupComponent,
    WhatsappFabComponent,
    SiteFooterComponent,
    MobileCtaComponent,
    PropertyPageComponent,
    SpacesPageComponent,
    FloorDetailPageComponent,
    LocationPageComponent,
    GrowthPageComponent,
    BusinessFitPageComponent,
    InfrastructurePageComponent,
    FloorPlansPageComponent,
    GalleryPageComponent,
    LeasingPageComponent,
    BrokersPageComponent,
    ContactPageComponent,
    PrivacyPageComponent,
    TermsPageComponent,
    DisclaimerPageComponent,
    FaqPageComponent,
    PlansComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
