import { Component, HostListener, computed, input, signal } from '@angular/core';
import { WorkItem } from '../data/work.model';

const MAX_ZOOM = 4;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

@Component({
  selector: 'app-lightbox',
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss',
})
export class Lightbox {
  items = input.required<WorkItem[]>();

  isOpen = signal(false);
  closing = signal(false);
  index = signal(0);
  dir = signal(0);
  fullReady = signal(false);

  scale = signal(1);
  tx = signal(0);
  ty = signal(0);
  smooth = signal(false);
  flip = signal(false);
  vw = signal(window.innerWidth);
  vh = signal(window.innerHeight);

  item = computed(() => this.items()[this.index()]);
  current = computed(() => {
    const it = this.item();
    return it ? [it] : [];
  });
  total = computed(() => this.items().length);
  zoomed = computed(() => this.scale() > 1.001);
  zoomPct = computed(() => Math.round(this.scale() * 100));
  transform = computed(
    () => `translate3d(${this.tx()}px, ${this.ty()}px, 0) scale(${this.scale()})`
  );

  // حجم الصورة وهي "fit" على الشاشة
  fit = computed(() => {
    const it = this.item();
    if (!it) return { w: 0, h: 0 };
    const small = this.vw() < 700;
    const maxW = this.vw() - (small ? 32 : 180);
    const maxH = this.vh() - (small ? 170 : 160);
    const ratio = it.width / it.height;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { w, h };
  });

  private pointers = new Map<number, { x: number; y: number }>();
  private startPan = { x: 0, y: 0, tx: 0, ty: 0 };
  private pinch = { dist: 1, scale: 1 };
  private moved = false;
  private pinched = false;
  private downOnImage = false;
  private lastTap = 0;

  pad(n: number) {
    return String(n).padStart(3, '0');
  }

  /* ---------- فتح وقفل ---------- */
  open(index: number, rect?: DOMRect) {
    this.vw.set(window.innerWidth);
    this.vh.set(window.innerHeight);
    this.index.set(index);
    this.dir.set(0);
    this.fullReady.set(false);
    this.closing.set(false);
    this.smooth.set(false);
    this.flip.set(false);

    // نبدأ من مكان الصورة في الجاليري
    if (rect) {
      this.scale.set(rect.width / this.fit().w);
      this.tx.set(rect.left + rect.width / 2 - this.vw() / 2);
      this.ty.set(rect.top + rect.height / 2 - this.vh() / 2);
    } else {
      this.scale.set(0.92);
      this.tx.set(0);
      this.ty.set(24);
    }

    this.isOpen.set(true);
    this.loadFull();

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        this.flip.set(true);
        this.smooth.set(true);
        this.scale.set(1);
        this.tx.set(0);
        this.ty.set(0);
        setTimeout(() => this.flip.set(false), 900);
      })
    );
  }

  close() {
    if (!this.isOpen() || this.closing()) return;
    this.closing.set(true);
    this.flip.set(true);
    this.smooth.set(true);

    // نرجع الصورة لمكانها في الجاليري لو ظاهر
    const el = document.querySelector<HTMLElement>(`[data-lb="${this.item().id}"] .ph`);
    const r = el?.getBoundingClientRect();
    const visible =
      !!r && r.bottom > 0 && r.top < this.vh() && r.right > 0 && r.left < this.vw();

    if (r && visible) {
      this.scale.set(r.width / this.fit().w);
      this.tx.set(r.left + r.width / 2 - this.vw() / 2);
      this.ty.set(r.top + r.height / 2 - this.vh() / 2);
    } else {
      this.scale.set(0.9);
      this.tx.set(0);
      this.ty.set(30);
    }

    setTimeout(() => {
      this.isOpen.set(false);
      this.closing.set(false);
      this.flip.set(false);
      this.reset();
    }, 700);
  }

  /* ---------- التنقل ---------- */
  go(step: number) {
    if (this.closing()) return;
    const n = this.total();
    this.dir.set(step);
    this.index.set((this.index() + step + n) % n);
    this.smooth.set(false);
    this.reset();
    this.fullReady.set(false);
    this.loadFull();
  }

  private loadFull() {
    const id = this.item().id;
    const img = new Image();
    img.onload = () => {
      if (this.item()?.id === id) this.fullReady.set(true);
    };
    img.src = this.item().full;

    // نحمّل اللي قبلها واللي بعدها مسبقًا
    const n = this.total();
    [1, -1].forEach((d) => {
      const nb = this.items()[(this.index() + d + n) % n];
      new Image().src = nb.full;
    });
  }

  /* ---------- الزوم ---------- */
  private reset() {
    this.scale.set(1);
    this.tx.set(0);
    this.ty.set(0);
  }

  resetZoom() {
    this.smooth.set(true);
    this.reset();
  }

  zoomStep(dir: number) {
    this.smooth.set(true);
    this.zoomTo(this.scale() * (dir > 0 ? 1.5 : 1 / 1.5));
  }

  // الزوم حوالين نقطة (clientX, clientY) بحيث النقطة دي تفضل ثابتة
  private zoomTo(next: number, clientX?: number, clientY?: number) {
    const s = this.scale();
    next = clamp(next, 1, MAX_ZOOM);
    const px = (clientX ?? this.vw() / 2) - this.vw() / 2;
    const py = (clientY ?? this.vh() / 2) - this.vh() / 2;
    const k = next / s;

    this.tx.set(px - (px - this.tx()) * k);
    this.ty.set(py - (py - this.ty()) * k);
    this.scale.set(next);

    if (next <= 1.001) {
      this.tx.set(0);
      this.ty.set(0);
    } else {
      this.clampPan();
    }
  }

  // نمنع الصورة تخرج بره الشاشة
  private clampPan() {
    const f = this.fit();
    const s = this.scale();
    const mx = Math.max(0, (f.w * s - this.vw()) / 2);
    const my = Math.max(0, (f.h * s - this.vh()) / 2);
    this.tx.set(clamp(this.tx(), -mx, mx));
    this.ty.set(clamp(this.ty(), -my, my));
  }

  private toggleZoom(x: number, y: number) {
    this.smooth.set(true);
    if (this.zoomed()) this.reset();
    else this.zoomTo(2.5, x, y);
  }

  /* ---------- Mouse / Touch ---------- */
  onWheel(e: WheelEvent) {
    e.preventDefault();
    this.smooth.set(true);
    const speed = e.ctrlKey ? 0.01 : 0.0022;
    this.zoomTo(this.scale() * Math.exp(-e.deltaY * speed), e.clientX, e.clientY);
  }

  onPointerDown(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.smooth.set(false);

    if (this.pointers.size === 1) {
      this.moved = false;
      this.pinched = false;
      this.downOnImage = (e.target as HTMLElement).classList.contains('lb-img');
      this.startPan = { x: e.clientX, y: e.clientY, tx: this.tx(), ty: this.ty() };
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: this.scale() };
      this.pinched = true;
    }
  }

  onPointerMove(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // pinch بصباعين
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const target = clamp(this.pinch.scale * (dist / this.pinch.dist), 1, MAX_ZOOM);
      this.zoomTo(target, (a.x + b.x) / 2, (a.y + b.y) / 2);
      this.moved = true;
      return;
    }

    const dx = e.clientX - this.startPan.x;
    const dy = e.clientY - this.startPan.y;
    if (Math.hypot(dx, dy) > 4) this.moved = true;
    if (!this.moved) return;

    if (this.zoomed()) {
      this.tx.set(this.startPan.tx + dx);
      this.ty.set(this.startPan.ty + dy);
      this.clampPan();
    } else {
      // وهي مش مكبّرة: الصورة تتبع الصباع شوية
      this.tx.set(dx * 0.6);
      this.ty.set(dy * 0.4);
    }
  }

  onPointerUp(e: PointerEvent) {
    if (!this.pointers.delete(e.pointerId)) return;

    if (this.pointers.size > 0) {
      const [p] = [...this.pointers.values()];
      this.startPan = { x: p.x, y: p.y, tx: this.tx(), ty: this.ty() };
      return;
    }

    this.smooth.set(true);

    if (this.pinched) {
      if (!this.zoomed()) this.reset();
      else this.clampPan();
      return;
    }

    const dx = e.clientX - this.startPan.x;
    const dy = e.clientY - this.startPan.y;

    if (this.moved && !this.zoomed()) {
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) {
        this.go(dx < 0 ? 1 : -1);
      } else if (dy > 110) {
        this.close();
      } else {
        this.tx.set(0);
        this.ty.set(0);
      }
      return;
    }

    if (!this.moved) {
      // كليك برا الصورة بيقفل
      if (!this.downOnImage) {
        if (!this.zoomed()) this.close();
        return;
      }
      // دبل كليك / دبل تاب
      const now = performance.now();
      if (now - this.lastTap < 320) {
        this.lastTap = 0;
        this.toggleZoom(e.clientX, e.clientY);
      } else {
        this.lastTap = now;
      }
    }
  }

  /* ---------- Keyboard / Resize ---------- */
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.isOpen()) return;
    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowRight':
        this.go(1);
        break;
      case 'ArrowLeft':
        this.go(-1);
        break;
      case '+':
      case '=':
        this.zoomStep(1);
        break;
      case '-':
      case '_':
        this.zoomStep(-1);
        break;
      case '0':
        this.resetZoom();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  @HostListener('window:resize')
  onResize() {
    this.vw.set(window.innerWidth);
    this.vh.set(window.innerHeight);
    if (this.isOpen() && this.zoomed()) this.clampPan();
  }
}