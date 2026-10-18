import { Component, signal } from '@angular/core';
import { Reveal } from '../reveal';

interface Phone {
  label: string;
  url: string;
  type: string;
}

@Component({
  selector: 'app-contact',
  imports: [Reveal],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  email = 'ahmedelnasser12313@gmail.com';
  gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${this.email}`;

  phones: Phone[] = [
    { label: '01110865167', url: 'https://wa.me/201110865167', type: 'WhatsApp' },
    { label: '01018737151', url: 'tel:+201018737151', type: 'Call only' },
  ];

  socials = [
    { label: 'Behance', url: 'https://www.behance.net/arch_ahmed_designs' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ahmed-abd-elnasser-408a59199' },
  ];

  copied = signal(false);
  copiedPhone = signal('');
  year = new Date().getFullYear();

  async copy() {
    try {
      await navigator.clipboard.writeText(this.email);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      window.open(this.gmail, '_blank', 'noopener');
    }
  }

  async onPhone(e: Event, p: Phone) {
    if (p.type === 'WhatsApp') return; // واتساب يفتح عادي

    // على الموبايل نسيب tel: يشتغل
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) return;

    // على الكمبيوتر ننسخ الرقم
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(p.label);
      this.copiedPhone.set(p.label);
      setTimeout(() => this.copiedPhone.set(''), 2000);
    } catch {}
  }
}