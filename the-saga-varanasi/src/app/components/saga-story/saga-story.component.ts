import { Component, OnInit, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-saga-story',
  templateUrl: './saga-story.component.html',
  styleUrls: ['./saga-story.component.scss'],
})
export class SagaStoryComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealEl') revealEls!: QueryList<ElementRef>;

  letters = [
    { char: 'S', word: 'Strength',    from: "Mother's Initial" },
    { char: 'A', word: 'Aspiration',  from: "Father's Initial" },
    { char: 'G', word: 'Grace',       from: "Mother's Initial" },
    { char: 'A', word: 'Ambition',    from: "Father's Initial" },
  ];

  values = [
    { icon: '❤️',  text: 'Built with love for Varanasi' },
    { icon: '🏛️', text: 'Rooted in family legacy' },
    { icon: '⭐',  text: 'Committed to excellence' },
    { icon: '🌱',  text: 'Investing in the city\'s future' },
  ];

  milestones = [
    {
      year: 'The Name',
      icon: '✦',
      title: 'Born from Family',
      text: 'SAGA is an acronym lovingly derived from the initials of the founders\' parents. Every letter carries the weight of a lifetime of sacrifice, values, and an unwavering belief in a brighter tomorrow for Varanasi.',
    },
    {
      year: 'The Vision',
      icon: '🌅',
      title: 'A Legacy for Varanasi',
      text: 'Born in this sacred city, our founders grew up watching Varanasi evolve. The SAGA is their way of giving back — creating a world-class commercial landmark that puts Varanasi firmly on the national investment map.',
    },
    {
      year: 'The Mission',
      icon: '🏗️',
      title: 'Building Ambition',
      text: 'The SAGA complex is more than bricks and concrete. It is the materialisation of decades of hard work and a deep-rooted belief that Varanasi deserves the very best in modern commercial infrastructure.',
    },
    {
      year: 'The Promise',
      icon: '🤝',
      title: 'Your Success, Our Purpose',
      text: 'Every business that opens within The SAGA becomes part of this story. We are not just leasing space — we are inviting you to co-author the next chapter of Varanasi\'s commercial renaissance.',
    },
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    this.setupObserver();
  }

  private setupObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.12 }
    );

    this.revealEls.forEach(el => observer.observe(el.nativeElement));
  }
}
