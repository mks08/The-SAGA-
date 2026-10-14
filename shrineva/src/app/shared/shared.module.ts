import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PageHeaderComponent } from './components/page-header/page-header.component';
import { LightboxComponent } from './components/lightbox/lightbox.component';

@NgModule({
  declarations: [PageHeaderComponent, LightboxComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  exports: [PageHeaderComponent, LightboxComponent, CommonModule, ReactiveFormsModule, RouterModule],
})
export class SharedModule {}
