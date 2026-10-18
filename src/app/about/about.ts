import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  signal,
  viewChild,
} from '@angular/core';
import { Experience } from '../experience/experience';
import { Reveal } from '../reveal';

interface Word {
  t: string;
  em: boolean;
}

@Component({
  selector: 'app-about',
  imports: [Reveal, Experience],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  // مسار الصورة
  image = 'images/about.webp';
  // مكان القص: لو وشه بيتقص خليه 'center 15%'، ولو عايزاه أنزل 'center 40%'
  imagePos = 'center 25%';

  private statementText =
    'I’m a Senior Architectural Visualization Artist with 7 years of experience creating 3D renders and animations, including 3 years in a senior role.';
  private emWords = new Set(['Architectural', 'Visualization']);

  words: Word[] = this.statementText.split(' ').map((t) => ({
    t,
    em: this.emWords.has(t.replace(/[^A-Za-z]/g, '')),
  }));

  // level = طول الخط من الـ CV (من 0 لـ 100)
  software = [
    { name: '3ds Max', level: 100 },
    { name: 'Photoshop', level: 100 },
    { name: 'AutoCAD', level: 57 },
    { name: 'Corona Renderer', level: 80 },
    { name: 'V-Ray', level: 73 },
    { name: 'Grow FX', level: 45 },
    { name: 'Chaos Phoenix', level: 30 },
    { name: 'After Effects', level: 57 },
    { name: 'XYZ Anima', level: 80 },
  ];

  lit = signal(0);
  years = signal(0);
  senior = signal(0);
  studios = signal(0);

  private statement = viewChild<ElementRef<HTMLElement>>('statement');
  private media = viewChild<ElementRef<HTMLElement>>('media');
  private img = viewChild<ElementRef<HTMLImageElement>>('img');
  private ticking = false;
  private counted = false;

  constructor() {
    afterNextRender(() => this.update());
  }

  startCount() {
    if (this.counted) return;
    this.counted = true;

    const t0 = performance.now();
    const duration = 1800;

    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      this.years.set(Math.round(7 * e));
      this.senior.set(Math.round(3 * e));
      this.studios.set(Math.round(4 * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  }

  private update() {
    const vh = window.innerHeight;

    // الجملة بتنوّر كلمة كلمة مع السكرول
    const s = this.statement()?.nativeElement;
    if (s) {
      const r = s.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.25), 0), 1);
      const n = Math.ceil(p * this.words.length);
      if (n !== this.lit()) this.lit.set(n);
    }

    // parallax خفيف للصورة
    const m = this.media()?.nativeElement;
    const im = this.img()?.nativeElement;
    if (m && im) {
      const r = m.getBoundingClientRect();
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      im.style.transform = `translate3d(0, ${(p * -28).toFixed(1)}px, 0) scale(1.12)`;
    }
  }
}