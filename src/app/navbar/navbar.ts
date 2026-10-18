import {
  Component,
  DestroyRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  host: { '[class.show]': 'show()' },
})
export class Navbar {
  show = input(false);
  active = signal('top');
  scrolled = signal(false);
  open = signal(false);

  links = [
    { id: 'about', label: 'About' },
    { id: 'work', label: 'Work' },
    { id: 'contact', label: 'Contact' },
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.scrolled.set(window.scrollY > 40);

      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) this.active.set(e.target.id);
          }
        },
        { rootMargin: '-45% 0px -50% 0px' }
      );

      ['top', ...this.links.map((l) => l.id)].forEach((id) => {
        const el = document.getElementById(id);
        if (el) io.observe(el);
      });

      destroyRef.onDestroy(() => io.disconnect());
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 40);
  }

  toggle() {
    this.open.update((v) => !v);
  }

  close() {
    this.open.set(false);
  }
}