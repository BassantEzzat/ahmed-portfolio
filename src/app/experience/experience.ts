import { Component, computed, signal } from '@angular/core';
import { Reveal } from '../reveal';

interface Job {
  role: string;
  company: string;
  location: string;
  points: string[];
}

@Component({
  selector: 'app-experience',
  imports: [Reveal],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class Experience {
  jobs: Job[] = [
    {
      role: 'Senior 3D Artist',
      company: 'Red Designs',
      location: 'Cairo, Egypt',
      points: [
        'Creating high-quality architectural renders and animations for residential, commercial, and mixed-use projects.',
        'Focusing on realistic lighting, materials, composition, and fine details to bring architectural designs to life.',
      ],
    },
    {
      role: '3D Artist',
      company: 'Vanilla Studio',
      location: '5th Settlement',
      points: [
        'Producing realistic architectural renders and animations for interior and exterior projects.',
        'Working on lighting, materials, scene composition, and post-production to achieve high-quality visuals.',
      ],
    },
    {
      role: 'Architect, Interior Designer & 3D Artist',
      company: 'ADCON',
      location: 'Nasr City',
      points: [
        'Designed residential and commercial interiors and exteriors, from initial concepts and sketches to 3D models and final renders.',
        'Developed architectural drawings and visual presentations to communicate design ideas clearly.',
      ],
    },
    {
      role: 'Freelance Architect & Interior Designer',
      company: 'MAH Architects',
      location: 'KSA',
      points: [
        'Worked on architectural and interior design projects, developing design concepts and space layouts.',
        'Prepared design drawings and visual solutions based on project requirements.',
      ],
    },
  ];

  index = signal(0);
  dir = signal(0);
  current = computed(() => [this.jobs[this.index()]]);

  private startX = 0;

  num(i: number) {
    return String(i + 1).padStart(2, '0');
  }

  go(step: number) {
    const n = this.jobs.length;
    this.dir.set(step);
    this.index.set((this.index() + step + n) % n);
  }

  set(i: number) {
    if (i === this.index()) return;
    this.dir.set(i > this.index() ? 1 : -1);
    this.index.set(i);
  }

  onDown(e: PointerEvent) {
    this.startX = e.clientX;
  }

  onUp(e: PointerEvent) {
    const dx = e.clientX - this.startX;
    if (Math.abs(dx) > 50) this.go(dx < 0 ? 1 : -1);
  }
}