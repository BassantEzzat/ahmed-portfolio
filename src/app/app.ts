import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import Lenis from 'lenis';
import { About } from './about/about';
import { Contact } from './contact/contact';
import { Navbar } from './navbar/navbar';
import { Work } from './work/work';

@Component({
  selector: 'app-root',
  imports: [About, Contact, Navbar, Work],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  loaded = signal(false);
  hidePreloader = signal(false);
  hovering = signal(false);
  ready = signal(false);
  current = signal(0);
  prev = signal(-1);

  // pos = مكان القص: 0% فوق، 50% نص، 100% تحت
  heroSlides = [
    { id: '001', pos: 'center 80%' },
    { id: '004', pos: 'center' },
    { id: '009', pos: 'center' },
    { id: '012', pos: 'center' },
    { id: '016', pos: 'center' },
    { id: '026', pos: 'center' },
  ].map((s) => ({ src: `images/work/full/${s.id}.webp`, pos: s.pos }));

  counter = computed(() => String(this.current() + 1).padStart(2, '0'));
  total = String(this.heroSlides.length).padStart(2, '0');

  private ring = viewChild<ElementRef<HTMLDivElement>>('ring');
  private dot = viewChild<ElementRef<HTMLDivElement>>('dot');
  private lenis?: Lenis;
  private raf = 0;
  private timer?: ReturnType<typeof setInterval>;
  private mx = -100;
  private my = -100;
  private rx = -100;
  private ry = -100;

  ngOnInit() {
    this.lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1.2, anchors: true });
    this.lenis.stop();

    const loop = (t: number) => {
      this.lenis?.raf(t);

      this.rx += (this.mx - this.rx) * 0.18;
      this.ry += (this.my - this.ry) * 0.18;

      const ringEl = this.ring()?.nativeElement;
      const dotEl = this.dot()?.nativeElement;
      if (ringEl) ringEl.style.transform = `translate(${this.rx}px, ${this.ry}px)`;
      if (dotEl) dotEl.style.transform = `translate(${this.mx}px, ${this.my}px)`;

      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);

    const first = new Image();
    const minTime = new Promise((r) => setTimeout(r, 1600));
    const firstLoaded = new Promise<void>((r) => {
      first.onload = () => r();
      first.onerror = () => r();
      first.src = this.heroSlides[0].src;
    });

    Promise.all([minTime, firstLoaded]).then(() => {
      this.loaded.set(true);

      this.heroSlides.slice(1).forEach((s) => {
        const i = new Image();
        i.src = s.src;
      });

      setTimeout(() => {
        this.hidePreloader.set(true);
        this.lenis?.start();
      }, 1100);

      this.startTimer();
    });
  }

  show(i: number) {
    if (i === this.current()) return;
    this.prev.set(this.current());
    this.current.set(i);
    this.startTimer();
  }

  private next() {
    this.show((this.current() + 1) % this.heroSlides.length);
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.next(), 6000);
  }

  @HostListener('document:mousemove', ['$event'])
  onMove(e: MouseEvent) {
    if (!this.ready()) {
      this.rx = e.clientX;
      this.ry = e.clientY;
      this.ready.set(true);
    }
    this.mx = e.clientX;
    this.my = e.clientY;
  }

  @HostListener('document:mouseover', ['$event'])
  onOver(e: MouseEvent) {
    const el = e.target as HTMLElement | null;
    this.hovering.set(!!el?.closest('a, button, [data-cursor]'));
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    if (this.timer) clearInterval(this.timer);
    this.lenis?.destroy();
  }
}