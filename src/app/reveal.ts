import {
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import gsap from 'gsap';

/** أي عنصر عليه appReveal بيطلع بأنيميشن GSAP لما يدخل الشاشة */
@Directive({
  selector: '[appReveal]',
  host: { style: 'opacity: 0' },
})
export class Reveal {
  delay = input(0, { alias: 'revealDelay' });
  revealed = output<void>();

  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement;

      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          io.disconnect();

          // الـ class "in" لسه مطلوب عشان أنيميشن الصورة وخطوط الـ Software في الـ CSS
          node.classList.add('in');
          this.revealed.emit();

          gsap.fromTo(
            node,
            { opacity: 0, y: 70 },
            {
              opacity: 1,
              y: 0,
              duration: 1.2,
              delay: this.delay() / 1000,
              ease: 'power3.out',
              clearProps: 'transform',
            },
          );
        },
        { rootMargin: '0px 0px -10% 0px' },
      );

      io.observe(node);
    });
  }
}