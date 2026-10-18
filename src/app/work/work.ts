import { Component, HostListener, computed, signal, viewChild } from '@angular/core';
import raw from '../data/work.json';
import { WorkItem } from '../data/work.model';
import { Lightbox } from '../lightbox/lightbox';
import { Reveal } from '../reveal';

// صور شكلها مكررة من الدرايف (34(1) و42(1) و48(1) و56(1) و62(1)).
// لو طلعوا صور مختلفة فعلًا، شيلي الرقم بتاعهم من هنا.
const HIDDEN = ['035', '044', '051', '060', '067'];

interface Tile {
  item: WorkItem;
  index: number; // مكانها في القايمة (للـ lightbox)
}

@Component({
  selector: 'app-work',
  imports: [Reveal, Lightbox],
  templateUrl: './work.html',
  styleUrl: './work.scss',
})
export class Work {
  items: WorkItem[] = (raw as unknown as WorkItem[]).filter((i) => !HIDDEN.includes(i.id));

  cols = signal(this.calcCols());
  lb = viewChild(Lightbox);

  // نوزّع الصور على الأعمدة: كل صورة تروح لأقصر عمود
  columns = computed(() => {
    const n = this.cols();
    const cols: Tile[][] = Array.from({ length: n }, () => []);
    const heights = new Array<number>(n).fill(0);

    this.items.forEach((item, index) => {
      const k = heights.indexOf(Math.min(...heights));
      cols[k].push({ item, index });
      heights[k] += item.height / item.width + 0.04;
    });

    return cols;
  });

  pad(n: number) {
    return String(n).padStart(3, '0');
  }

  openAt(index: number, ev: Event) {
    const ph = (ev.currentTarget as HTMLElement).querySelector<HTMLElement>('.ph');
    this.lb()?.open(index, ph?.getBoundingClientRect());
  }

  @HostListener('window:resize')
  onResize() {
    const c = this.calcCols();
    if (c !== this.cols()) this.cols.set(c);
  }

  private calcCols() {
    const w = window.innerWidth;
    return w < 560 ? 1 : w < 1000 ? 2 : 3;
  }
}