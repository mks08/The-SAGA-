import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { LeadService } from './services/lead.service';
import { ScrollService } from './services/scroll.service';

@NgModule({
  imports: [HttpClientModule],
  providers: [LeadService, ScrollService],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule.');
    }
  }
}
