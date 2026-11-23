import { Component, input } from '@angular/core';

// Noms des icônes disponibles. Pour en ajouter une : l'ajouter ici ET dans le @switch du template.
export type IconName = 'package' | 'check' | 'check-circle' | 'arrow-left' | 'refresh';

// Petit composant d'icône en SVG (aucune bibliothèque à installer).
// Utilisation dans un template :  <app-icon name="package" [size]="20" />
// L'icône prend la couleur du texte autour (stroke="currentColor").
@Component({
  selector: 'app-icon',
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
         [attr.width]="size()" [attr.height]="size()">
      @switch (name()) {
        @case ('package') {
          <path d="M16.5 9.4l-9-5.19" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        }
        @case ('check') {
          <polyline points="20 6 9 17 4 12" />
        }
        @case ('check-circle') {
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        }
        @case ('arrow-left') {
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        }
        @case ('refresh') {
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        }
      }
    </svg>
  `,
  // Affichage en ligne, aligné avec le texte
  host: { style: 'display:inline-flex;vertical-align:text-bottom' },
})
export class IconComponent {
  // Nom de l'icône (obligatoire)
  name = input.required<IconName>();
  // Taille en pixels (16 par défaut)
  size = input(16);
}