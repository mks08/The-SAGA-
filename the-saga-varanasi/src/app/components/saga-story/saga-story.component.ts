import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';

@Component({
  selector: 'app-saga-story',
  templateUrl: './saga-story.component.html',
  styleUrls: ['./saga-story.component.scss'],
})
export class SagaStoryComponent implements AfterViewInit {
  @ViewChildren('revealEl') revealEls!: QueryList<ElementRef>;

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.15 }
    );
    this.revealEls.forEach(el => observer.observe(el.nativeElement));
  }
}
