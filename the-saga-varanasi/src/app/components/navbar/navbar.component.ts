import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  active = 'hero';
  sub!: Subscription;
  constructor(private scroll: ScrollService) {}
  ngOnInit() {
    this.sub = this.scroll.activeSection$.subscribe(s => (this.active = s));
  }
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
