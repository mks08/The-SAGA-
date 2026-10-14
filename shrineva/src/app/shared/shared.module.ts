import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PageHeaderComponent } from './components/page-header/page-header.component';
import { LightboxComponent } from './components/lightbox/lightbox.component';
import { RevealDirective } from './directives/reveal.directive';
import { CountUpDirective } from './directives/count-up.directive';
import { TiltDirective } from './directives/tilt.directive';
import { SpotlightDirective } from './directives/spotlight.directive';
import { ParallaxDirective } from './directives/parallax.directive';

const DIRECTIVES = [RevealDirective, CountUpDirective, TiltDirective, SpotlightDirective, ParallaxDirective];

@NgModule({
  declarations: [PageHeaderComponent, LightboxComponent, ...DIRECTIVES],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  exports: [PageHeaderComponent, LightboxComponent, ...DIRECTIVES, CommonModule, ReactiveFormsModule, RouterModule],
})
export class SharedModule {}
