import { Directive, ElementRef, OnDestroy, OnInit, inject, input, output } from '@angular/core';

/** أي عنصر عليه appReveal بيظهر بأنيميشن لما يدخل الشاشة، وبيتضاف له class "in" */
@Directive({ selector: '[appReveal]' })
export class Reveal implements OnInit, OnDestroy {
  delay = input(0, { alias: 'revealDelay' });
  revealed = output<void>();

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private io?: IntersectionObserver;

  ngOnInit() {
    const node = this.el.nativeElement;
    node.style.setProperty('--d', `${this.delay()}ms`);

    this.io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('in');
          this.revealed.emit();
          this.io?.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    this.io.observe(node);
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }
}