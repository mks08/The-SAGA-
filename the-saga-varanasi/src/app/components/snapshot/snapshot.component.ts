import { Component } from '@angular/core';
import { CONTENT } from '../../config/content.config';

@Component({
  selector: 'app-snapshot',
  templateUrl: './snapshot.component.html',
  styleUrls: ['./snapshot.component.scss'],
})
export class SnapshotComponent {
  stats = CONTENT.snapshot;
}
