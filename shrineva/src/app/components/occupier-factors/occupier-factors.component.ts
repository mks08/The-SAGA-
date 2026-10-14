import { Component } from '@angular/core';
import { CONTENT } from '../../config/content.config';

@Component({
  selector: 'app-occupier-factors',
  templateUrl: './occupier-factors.component.html',
})
export class OccupierFactorsComponent {
  factors = CONTENT.occupierFactors;
}
