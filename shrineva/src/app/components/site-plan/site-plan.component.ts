import { Component } from '@angular/core';
import { PLAN } from '../../config/property.config';

/** Feet and inches from a decimal number of feet, e.g. 15.6667 -> 15′-8″. */
const fi = (ft: number): string => {
  const total = Math.round(ft * 24) / 2; // nearest half inch
  const feet = Math.floor(total / 12);
  const inch = total - feet * 12;
  const whole = Math.floor(inch);
  return `${feet}′-${whole}${inch - whole ? '½' : ''}″`;
};

/**
 * Site plan: the plot, the building footprint and the 24 m road, drawn from the architect's dimensions (property.config.ts, PLAN)
 * as a vector drawing, north at the top. Ground structure is solid; the upper floors (which project 5 ft towards the road and
 * start 4 ft from the west boundary) are dashed. It is a marketing drawing: dimensions as marked, not for construction.
 */
@Component({
  selector: 'app-site-plan',
  templateUrl: './site-plan.component.html',
})
export class SitePlanComponent {
  plan = PLAN;

  /** Pixels per foot, plot origin (top-left) in drawing units. */
  readonly s = 4.4;
  readonly ox = 175;
  readonly oy = 144;
  readonly W = 49 + 5.5 / 12;      // 49'-5½"
  readonly L = 115 + 6.5 / 12;     // 115'-6½"
  readonly N = 15 + 8 / 12;        // front setback, 15'-8"
  readonly S = 15 + 4.5 / 12;      // rear setback
  readonly E = 8 + 11.5 / 12;      // east setback
  readonly Wst = 5;                // west setback
  readonly gw = 35.5;              // ground structure width
  readonly gl = 84.5;              // ground structure length
  readonly uw = 40.5;              // upper floor width
  readonly ul = 89.5;              // upper floor length
  readonly coreW = 12.75;
  readonly coreL = 27.75;
  /** Middle of the strip between the upper floors' east edge (44.5 ft) and the east boundary. */
  readonly eastMid = (4 + 40.5 + (49 + 5.5 / 12)) / 2;
  readonly coreTop = 43.8;         // from the north boundary, read from the architect's plan

  x(ft: number): number { return +(this.ox + ft * this.s).toFixed(1); }
  y(ft: number): number { return +(this.oy + ft * this.s).toFixed(1); }
  len(ft: number): number { return +(ft * this.s).toFixed(1); }
  label = fi;

  get plot() { return { x: this.x(0), y: this.y(0), w: this.len(this.W), h: this.len(this.L) }; }
  get ground() { return { x: this.x(this.Wst), y: this.y(this.N), w: this.len(this.gw), h: this.len(this.gl) }; }
  get upper() { return { x: this.x(4), y: this.y(this.N - 5), w: this.len(this.uw), h: this.len(this.ul) }; }
  get core() {
    const gx = this.Wst + this.gw;
    return { x: this.x(gx - this.coreW), y: this.y(this.coreTop), w: this.len(this.coreW), h: this.len(this.coreL) };
  }

  /** Setback dimensions: the four numbers a reader checks first. */
  get setbacks() {
    return [
      { side: 'Front (north)', value: fi(this.N) },
      { side: 'Rear (south)', value: fi(this.S) },
      { side: 'East', value: fi(this.E) },
      { side: 'West', value: fi(this.Wst) },
    ];
  }
}
