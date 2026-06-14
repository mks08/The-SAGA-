import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

// Layout
import { NavbarComponent } from './components/navbar/navbar.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';

// Page Sections
import { HeroComponent } from './components/hero/hero.component';
import { HighlightsComponent } from './components/highlights/highlights.component';
import { IdealForComponent } from './components/ideal-for/ideal-for.component';
import { LocationComponent } from './components/location/location.component';
import { ContactComponent } from './components/contact/contact.component';

// New Sections
import { BookingPopupComponent } from './components/booking-popup/booking-popup.component';
import { SagaStoryComponent } from './components/saga-story/saga-story.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { ConnectivityComponent } from './components/connectivity/connectivity.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MainLayoutComponent,
    HeroComponent,
    HighlightsComponent,
    IdealForComponent,
    LocationComponent,
    ContactComponent,
    BookingPopupComponent,
    SagaStoryComponent,
    GalleryComponent,
    ConnectivityComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    CoreModule,
    SharedModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
