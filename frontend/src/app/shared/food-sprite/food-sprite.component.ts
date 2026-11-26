import { Component } from '@angular/core';

// Planche de dessins SVG (pizza, salade, tajine, citron + petites icônes).
// Elle est affichée une seule fois dans app.ts ; les autres composants
// la réutilisent avec  <svg><use href="#pizza" /></svg>
@Component({
  selector: 'app-food-sprite',
  template: `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <symbol id="pizza" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="98" fill="#dfa04a"/>
      <circle cx="100" cy="100" r="88" fill="#d5412b"/>
      <circle cx="100" cy="100" r="82" fill="#f6cd68"/>
      <g fill="#fbe39a" opacity=".85"><circle cx="70" cy="45" r="16"/><circle cx="142" cy="70" r="18"/><circle cx="150" cy="140" r="14"/><circle cx="60" cy="150" r="17"/><circle cx="104" cy="104" r="20"/></g>
      <g fill="#e5a540" opacity=".7"><circle cx="90" cy="70" r="6"/><circle cx="128" cy="116" r="7"/><circle cx="72" cy="104" r="5"/><circle cx="112" cy="160" r="6"/></g>
      <g fill="#c4282f">
        <circle cx="62" cy="62" r="16"/><circle cx="118" cy="46" r="15"/><circle cx="150" cy="96" r="16"/>
        <circle cx="124" cy="140" r="16"/><circle cx="70" cy="128" r="15"/><circle cx="100" cy="94" r="14"/><circle cx="46" cy="100" r="11"/><circle cx="148" cy="52" r="9"/>
      </g>
      <g fill="#9f1c24"><circle cx="58" cy="58" r="2.4"/><circle cx="68" cy="66" r="2.4"/><circle cx="114" cy="42" r="2.4"/><circle cx="124" cy="50" r="2.4"/><circle cx="146" cy="92" r="2.4"/><circle cx="156" cy="100" r="2.4"/><circle cx="120" cy="136" r="2.4"/><circle cx="130" cy="144" r="2.4"/><circle cx="66" cy="124" r="2.4"/><circle cx="76" cy="132" r="2.4"/><circle cx="96" cy="90" r="2.4"/><circle cx="106" cy="98" r="2.4"/></g>
      <g fill="#3f9140">
        <ellipse cx="88" cy="40" rx="11" ry="5.5" transform="rotate(-30 88 40)"/>
        <ellipse cx="156" cy="124" rx="11" ry="5.5" transform="rotate(40 156 124)"/>
        <ellipse cx="94" cy="152" rx="11" ry="5.5" transform="rotate(15 94 152)"/>
        <ellipse cx="42" cy="128" rx="10" ry="5" transform="rotate(-60 42 128)"/>
        <ellipse cx="128" cy="86" rx="10" ry="5" transform="rotate(20 128 86)"/>
      </g>
      <g stroke="#c27d28" stroke-width="1.6" opacity=".35"><path d="M100 100 L100 6M100 100 L100 194M100 100 L6 100M100 100 L194 100M100 100 L34 34M100 100 L166 166M100 100 L166 34M100 100 L34 166"/></g>
    </symbol>
    <symbol id="bowl" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="98" fill="#ffffff"/>
      <circle cx="100" cy="100" r="88" fill="#ece4d8"/>
      <circle cx="100" cy="100" r="80" fill="#79c05c"/>
      <g fill="#5ea845"><ellipse cx="60" cy="64" rx="22" ry="10" transform="rotate(-35 60 64)"/><ellipse cx="140" cy="60" rx="22" ry="10" transform="rotate(30 140 60)"/><ellipse cx="150" cy="140" rx="22" ry="10" transform="rotate(-25 150 140)"/><ellipse cx="54" cy="138" rx="22" ry="10" transform="rotate(35 54 138)"/></g>
      <path d="M100 100 L100 22 A78 78 0 0 1 168 62 Z" fill="#f2c75a"/>
      <path d="M100 100 L168 138 A78 78 0 0 1 100 178 Z" fill="#7a2f6e" opacity=".92"/>
      <g fill="#fff3c6" opacity=".9"><circle cx="112" cy="46" r="4"/><circle cx="126" cy="54" r="4"/><circle cx="140" cy="62" r="4"/><circle cx="118" cy="62" r="4"/><circle cx="132" cy="72" r="4"/><circle cx="108" cy="72" r="4"/><circle cx="146" cy="78" r="4"/><circle cx="122" cy="84" r="4"/></g>
      <g fill="#e5382f"><circle cx="62" cy="96" r="12"/><circle cx="84" cy="124" r="11"/><circle cx="50" cy="118" r="10"/></g>
      <g fill="#fff" opacity=".55"><circle cx="58" cy="92" r="3"/><circle cx="80" cy="120" r="3"/><circle cx="46" cy="114" r="3"/></g>
      <path d="M100 100 Q130 118 150 108 Q142 134 112 134 Z" fill="#b6d85e"/>
      <path d="M104 106 Q128 120 144 112" stroke="#5d8a2c" stroke-width="3" fill="none"/>
      <g fill="#f08a2c"><rect x="108" y="146" width="22" height="9" rx="4" transform="rotate(-30 108 146)"/><rect x="126" y="136" width="22" height="9" rx="4" transform="rotate(20 126 136)"/></g>
    </symbol>
    <symbol id="tajine" viewBox="0 0 240 200">
      <ellipse cx="120" cy="176" rx="112" ry="20" fill="#a8431d"/>
      <ellipse cx="120" cy="170" rx="106" ry="18" fill="#2b8c97"/>
      <ellipse cx="120" cy="166" rx="98" ry="14" fill="#f4e6cf"/>
      <path d="M30 150 C30 138 70 130 120 130 C170 130 210 138 210 150 L206 160 C190 172 50 172 34 160 Z" fill="#df7038"/>
      <g fill="#f4e6cf"><circle cx="52" cy="154" r="4"/><circle cx="76" cy="160" r="4"/><circle cx="100" cy="163" r="4"/><circle cx="124" cy="164" r="4"/><circle cx="148" cy="163" r="4"/><circle cx="172" cy="160" r="4"/><circle cx="196" cy="153" r="4"/></g>
      <path d="M48 134 C58 100 92 62 108 40 Q120 24 132 40 C148 62 182 100 192 134 Q120 150 48 134 Z" fill="#e8793c"/>
      <path d="M48 134 C58 100 92 62 108 40 Q114 32 120 30 C112 70 96 112 90 140 Q66 138 48 134 Z" fill="#c9602b" opacity=".55"/>
      <path d="M62 112 Q120 128 178 112" stroke="#f4e6cf" stroke-width="3.5" fill="none"/>
      <path d="M76 86 Q120 100 164 86" stroke="#f4e6cf" stroke-width="3.5" fill="none"/>
      <path d="M94 62 Q120 72 146 62" stroke="#f4e6cf" stroke-width="3.5" fill="none"/>
      <circle cx="120" cy="26" r="12" fill="#2b8c97"/><circle cx="120" cy="26" r="5" fill="#f4e6cf"/>
      <g stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"><path d="M96 10 q-8 -9 0 -17"/><path d="M144 10 q8 -9 0 -17"/></g>
    </symbol>
    <symbol id="lemon" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#f4cf36"/>
      <circle cx="50" cy="50" r="42" fill="#fff6c8"/>
      <circle cx="50" cy="50" r="38" fill="#f9dd57"/>
      <g stroke="#fff6c8" stroke-width="3" stroke-linecap="round"><path d="M50 50 L50 14M50 50 L50 86M50 50 L14 50M50 50 L86 50M50 50 L24 24M50 50 L76 76M50 50 L76 24M50 50 L24 76"/></g>
      <circle cx="50" cy="50" r="4" fill="#fff6c8"/>
      <path d="M20 34 A34 34 0 0 1 40 18" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
    </symbol>
    <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
    <symbol id="i-truck" viewBox="0 0 24 24"><path d="M2 7h11v9H2zM13 10h4l3 3v3h-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7" cy="17.5" r="2" fill="#fff" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="17.5" r="2" fill="#fff" stroke="currentColor" stroke-width="2"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
    <symbol id="i-pizza" viewBox="0 0 24 24"><path d="M3 7a15 15 0 0 1 18 0l-9 15L3 7Z" fill="currentColor"/><circle cx="10" cy="10" r="1.6" fill="#fff"/><circle cx="14.5" cy="11.5" r="1.4" fill="#fff"/><circle cx="12" cy="15" r="1.3" fill="#fff"/></symbol>
    <symbol id="i-burger" viewBox="0 0 24 24"><path d="M3 11a9 7 0 0 1 18 0H3Z" fill="currentColor"/><rect x="3" y="12.5" width="18" height="3" rx="1.5" fill="currentColor"/><path d="M4 17h16a0 0 0 0 1 0 0 3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" fill="currentColor"/></symbol>
    <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15l-1-1Z" fill="currentColor"/><path d="M5 19c3-5 6-8 10-10" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-pot" viewBox="0 0 24 24"><path d="M5 17 10.5 6q1.5-3 3 0L19 17H5Z" fill="currentColor"/><rect x="3" y="17.5" width="18" height="3" rx="1.5" fill="currentColor"/></symbol>
  </defs>
</svg>
  `,
})
export class FoodSpriteComponent {}
