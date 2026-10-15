import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { TOUR_VIDEO } from '../../config/media.config';
import { AnalyticsService } from '../../core/services/analytics.service';

/** Home: one short film (drive-in, then the floors). The video file loads only after the visitor presses play. */
@Component({
  selector: 'app-video-tour',
  templateUrl: './video-tour.component.html',
})
export class VideoTourComponent {
  tour = TOUR_VIDEO;
  playing = false;
  active = 0;

  @ViewChild('player') player?: ElementRef<HTMLVideoElement>;

  constructor(private analytics: AnalyticsService, private cdr: ChangeDetectorRef) {}

  play(chapterIndex = 0) {
    if (!this.playing) {
      this.playing = true;
      this.analytics.event('video_play', { source: 'home' });
      this.cdr.detectChanges();
    }
    this.seek(chapterIndex);
  }

  seek(i: number) {
    const v = this.player?.nativeElement;
    const ch = this.tour.chapters[i];
    if (!v) return;
    this.active = i;
    const go = () => { v.currentTime = ch ? ch.start : 0; void v.play().catch(() => undefined); };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  }

  onTime() {
    const v = this.player?.nativeElement;
    if (!v) return;
    let idx = 0;
    this.tour.chapters.forEach((c, i) => { if (v.currentTime >= c.start - 0.05) idx = i; });
    if (idx !== this.active) { this.active = idx; this.cdr.markForCheck(); }
  }

  fmt(sec: number) { return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`; }
}
