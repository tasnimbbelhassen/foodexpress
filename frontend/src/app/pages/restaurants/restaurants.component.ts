import { Component, ElementRef, OnInit, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Restaurant, RestaurantService } from '../../core/services/restaurant.service';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-restaurants',
  imports: [FormsModule, RouterLink, FooterComponent],
  template: `
    <!-- Section d'accueil avec recherche de restaurants -->
    <section class="fx-hero">
      <div class="fx-hero__text">
        <div class="fx-loc"><svg width="28" height="28"><use href="#i-pin" /></svg>Livraison en Tunisie</div>
        <h1>Les restaurants qui livrent près de chez vous</h1>
        <div class="fx-search">
          <input placeholder="Rechercher un restaurant…" aria-label="Rechercher un restaurant"
                 [(ngModel)]="search" (keyup.enter)="applyFilters(); liste.scrollIntoView({ behavior: 'smooth' })" />
          <button class="fx-ok" (click)="applyFilters(); liste.scrollIntoView({ behavior: 'smooth' })">
            <svg width="22" height="22"><use href="#i-check" /></svg>Ok
          </button>
        </div>
        <div class="fx-meta">
          <span><i><svg width="18" height="18"><use href="#i-clock" /></svg></i>Prêt en 25 min</span>
          <span><i><svg width="18" height="18"><use href="#i-truck" /></svg></i>Livraison dès 3 DT</span>
        </div>
      </div>

      <!-- Illustrations décoratives de la page -->
      <div class="fx-comp" aria-hidden="true">
        <svg class="fx-lemon fx-lemon--a"><use href="#lemon" /></svg>
        <svg class="fx-lemon fx-lemon--b"><use href="#lemon" /></svg>
        <div class="fx-c fx-c--big"><img src="burger-hero.png" alt="" /></div>
        <div class="fx-c fx-c--pizza"><svg viewBox="0 0 200 200"><use href="#pizza" /></svg></div>
        <div class="fx-c fx-c--bowl"><svg viewBox="0 0 200 200"><use href="#bowl" /></svg></div>
        <svg class="fx-lemon fx-lemon--c"><use href="#lemon" /></svg>
      </div>
    </section>

    <!-- Catégories avec défilement horizontal contrôlé par le scroll vertical -->
    <div #hsOuter class="fx-hs" (window:scroll)="hscroll(hsOuter)" (window:resize)="hscroll(hsOuter)">
      <div class="fx-hs__pin">
        <div class="fx-hs__view">
          <div class="fx-hs__track">

            <div class="fx-hs__text">
              <h2>Qu'avez-vous envie de manger&nbsp;?</h2>
              <p>Pizza, burgers, cuisine tunisienne… Choisissez une envie et découvrez les restaurants qui livrent près de chez vous.</p>
              <div class="fx-hs__hint">Continuez à défiler <svg width="20" height="20"><use href="#i-arrow" /></svg></div>
            </div>

            @for (c of categories; track c.label) {
              <button type="button" class="fx-ar" [class.on]="cuisine === c.cuisine"
                      (click)="pickCuisine(c.cuisine); liste.scrollIntoView({ behavior: 'smooth' })">
                <img [src]="c.img" alt="" (load)="hscroll(hsOuter)"
                     (error)="$any($event.target).style.display = 'none'; hscroll(hsOuter)" />
                <span class="fx-ar__lab">{{ c.label }}<i><svg width="16" height="16"><use href="#i-arrow" /></svg></i></span>
              </button>
            }

          </div>
        </div>
        <div class="fx-hs__bar"><i></i></div>
      </div>
    </div>

    <!-- Présentation des étapes de commande -->
    <section #how id="comment-ca-marche" class="fx-how" (window:scroll)="howScroll(how)" (window:resize)="howScroll(how)">
      <div class="fx-how__intro">
        <h2>Comment ça<br />marche.</h2>
        <p>De l'envie à la livraison, tout se fait en quelques clics : vous choisissez, le restaurant prépare, on vous livre.</p>
        <button type="button" class="fx-btn" (click)="liste.scrollIntoView({ behavior: 'smooth' })">
          Voir les restaurants<svg width="18" height="18"><use href="#i-arrow" /></svg>
        </button>
      </div>

      <!-- Timeline des différentes étapes -->
      <div class="fx-how__steps">
        <div class="fx-how__rail" aria-hidden="true"><i></i></div>
        @for (s of howSteps; track s.title) {
          <article class="fx-step">
            <span class="fx-step__dot" aria-hidden="true"></span>
            <div class="fx-step__head">
              <i>
                @switch (s.icon) {
                  @case ('search') { <svg width="20" height="20"><use href="#i-search" /></svg> }
                  @case ('bag') { <svg width="20" height="20"><use href="#i-bag" /></svg> }
                  @case ('check') { <svg width="20" height="20"><use href="#i-check" /></svg> }
                  @default { <svg width="20" height="20"><use href="#i-truck" /></svg> }
                }
              </i>
              <span>{{ s.label }}</span>
            </div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.text }}</p>
          </article>
        }
      </div>
    </section>

    <!-- Liste des restaurants avec filtres et pagination -->
    <section #liste class="fx-list">
      <h2 class="fx-h2">Ouverts près de vous</h2>

      <div class="fx-filters">
        <button class="fx-pill" [class.on]="cuisine === ''" (click)="pickCuisine('')">Toutes les cuisines</button>
        @for (c of cuisines; track c) {
          <button class="fx-pill" [class.on]="cuisine === c" (click)="pickCuisine(c)">{{ c }}</button>
        }
        <label class="fx-pill fx-pill--check" for="open">
          <input class="form-check-input" type="checkbox" id="open" [(ngModel)]="open" (ngModelChange)="applyFilters()" />
          Ouverts
        </label>
        <select class="form-select fx-sort" aria-label="Trier" [(ngModel)]="sort" (ngModelChange)="applyFilters()">
          <option value="nom">A → Z</option>
          <option value="-nom">Z → A</option>
        </select>
      </div>

      <!-- Affichage des états de chargement et des résultats -->
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (loading()) { <p class="text-muted">Chargement...</p> }

      @if (!loading() && restaurants().length === 0 && !error()) {
        <div class="alert alert-info">Aucun restaurant trouvé.</div>
      }

      <!-- Cartes des restaurants -->
      <div class="fx-grid">
        @for (r of restaurants(); track r._id) {
          <article class="fx-card" [class.closed]="!r.isOpen">
            <div class="fx-cover" [attr.data-art]="art(r)">
              @if (r.image && r.image.startsWith('http')) {
                <img class="fx-cover__img" [src]="r.image" [alt]="r.nom" />
              } @else {
                @switch (art(r)) {
                  @case ('burger') { <img class="fx-cover__img" src="burger-wide.jpg" alt="" /> }
                  @case ('pizza') { <svg class="fx-cover__art" viewBox="0 0 200 200"><use href="#pizza" /></svg> }
                  @case ('tajine') { <svg class="fx-cover__art" viewBox="0 0 240 200"><use href="#tajine" /></svg> }
                  @default { <svg class="fx-cover__art" viewBox="0 0 200 200"><use href="#bowl" /></svg> }
                }
              }
              <span class="fx-badge" [class.off]="!r.isOpen">{{ r.isOpen ? 'Ouvert' : 'Fermé' }}</span>
              <span class="fx-fee"><svg width="16" height="16"><use href="#i-truck" /></svg>{{ r.fraisLivraison }} DT</span>
            </div>
            <div class="fx-body">
              <h3>{{ r.nom }}</h3>
              <div class="fx-tag">{{ r.typeCuisine }}</div>
              <p>{{ r.description }}</p>
              <div class="fx-info">
                <span><svg width="16" height="16"><use href="#i-pin" /></svg>{{ r.adresse }}</span>
                <span><svg width="16" height="16"><use href="#i-clock" /></svg>{{ r.horaires }}</span>
              </div>
              <a class="fx-cta" [routerLink]="['/restaurants', r._id]">
                Voir le menu<i><svg width="16" height="16"><use href="#i-arrow" /></svg></i>
              </a>
            </div>
          </article>
        }
      </div>

      <!-- Navigation entre les pages de résultats -->
      @if (totalPages() > 1) {
        <nav class="d-flex justify-content-center align-items-center gap-3 mt-4">
          <button class="btn btn-outline-primary" [disabled]="page() <= 1" (click)="goTo(page() - 1)">Précédent</button>
          <span>Page {{ page() }} / {{ totalPages() }} ({{ total() }} résultats)</span>
          <button class="btn btn-outline-primary" [disabled]="page() >= totalPages()" (click)="goTo(page() + 1)">Suivant</button>
        </nav>
      }
    </section>
    <app-footer />
  `,

})
export class RestaurantsComponent implements OnInit {
  // Images et filtres des catégories de restaurants
  // Mets tes photos dans public/categories/
  // "cuisine" doit être exactement le nom de cuisine de tes restaurants ('' = tout voir)
  categories = [
    { label: 'Pizza', cuisine: 'Pizza', img: 'categories/pizza.jpg' },
    { label: 'Tunisienne', cuisine: 'Tunisienne', img: 'categories/tunisienne.jpg' },
    { label: 'Fast-food', cuisine: 'Fast-food', img: 'categories/fast-food.jpg' },
    { label: 'Italienne', cuisine: 'Italienne', img: 'categories/italienne.jpg' },
    { label: 'Healthy', cuisine: 'Healthy', img: 'categories/healthy.jpg' },
    { label: 'Desserts', cuisine: 'Desserts', img: 'categories/desserts.jpg' },
  ];

  // Défilement horizontal des catégories
  hscroll(outer: HTMLElement) {
    const pin = outer.firstElementChild as HTMLElement;
    const view = pin.querySelector('.fx-hs__view') as HTMLElement;
    const track = pin.querySelector('.fx-hs__track') as HTMLElement;
    const bar = pin.querySelector('.fx-hs__bar i') as HTMLElement;
    const dist = Math.max(0, track.scrollWidth - view.clientWidth + 12); // distance à parcourir
    const run = dist * 1.1;                                               // 1.1 = vitesse (plus grand = plus lent)
    outer.style.height = `${pin.offsetHeight + run}px`;
    const pinTop = parseFloat(getComputedStyle(pin).top) || 0;
    const p = run ? Math.min(1, Math.max(0, (pinTop - outer.getBoundingClientRect().top) / run)) : 0;
    track.style.transform = `translate3d(${-p * dist}px, 0, 0)`;
    bar.style.transform = `scaleX(${p})`;
  }

  // Référence à la section "Comment ça marche"
  howRef = viewChild<ElementRef<HTMLElement>>('how');

  // Contenu des quatre étapes de commande
  howSteps = [
    { icon: 'search', label: 'Étape 1', title: 'Choisissez votre restaurant',
      text: "Cherchez par nom, filtrez par cuisine ou affichez seulement les restaurants ouverts. Chaque fiche indique les horaires et les frais de livraison." },
    { icon: 'bag', label: 'Étape 2', title: 'Composez votre panier',
      text: "Ouvrez le menu, ajoutez vos plats et ajustez les quantités. Le total, frais de livraison compris, est visible dans votre panier." },
    { icon: 'check', label: 'Étape 3', title: 'Confirmez la commande',
      text: "Indiquez votre adresse de livraison et validez. Le paiement se fait en espèces à la livraison, sans carte bancaire." },
    { icon: 'truck', label: 'Étape 4', title: 'Suivez et savourez',
      text: "Le restaurant accepte votre commande et vous suivez son statut depuis « Mes commandes », jusqu'à la livraison à votre porte." },
  ];

  constructor() {
    // Initialise la timeline après l'affichage de la page
    afterNextRender(() => {
      const el = this.howRef()?.nativeElement;
      if (el) this.howScroll(el);
    });
  }

  // Animation de la timeline selon la position du scroll
  howScroll(sec: HTMLElement) {
    const list = sec.querySelector('.fx-how__steps') as HTMLElement | null;
    const rail = list?.querySelector('.fx-how__rail') as HTMLElement | null;
    if (!list || !rail) return;
    const steps = Array.from(list.querySelectorAll<HTMLElement>('.fx-step'));
    if (steps.length < 2) return;
    const fill = rail.firstElementChild as HTMLElement;
    const box = list.getBoundingClientRect();
    // Position verticale du centre de chaque point par rapport au haut de la liste
    const c = steps.map((s) => {
      const r = (s.querySelector('.fx-step__dot') as HTMLElement).getBoundingClientRect();
      return r.top + r.height / 2 - box.top;
    });
    const total = c[c.length - 1] - c[0];
    rail.style.top = `${c[0]}px`;
    rail.style.height = `${total}px`;
    const line = window.innerHeight * 0.6 - box.top;
    const p = total > 0 ? Math.min(1, Math.max(0, (line - c[0]) / total)) : 0;
    fill.style.transform = `scaleY(${p})`;
    steps.forEach((s, i) => s.classList.toggle('on', i === 0 || line >= c[i]));
  }

  // Service de gestion des restaurants
  private service = inject(RestaurantService);

  // Paramètres des filtres et de la pagination
  cuisines = ['Italienne', 'Tunisienne', 'Fast-food', 'Pizza'];

  search = '';
  cuisine = '';
  open = false;
  sort = 'nom';
  limit = 6;

  // Données et états de la liste des restaurants
  page = signal(1);
  restaurants = signal<Restaurant[]>([]);
  total = signal(0);
  totalPages = signal(1);
  loading = signal(false);
  error = signal('');

  // Chargement initial des restaurants
  ngOnInit() {
    this.load();
  }

  // Choisit l'illustration selon le type de cuisine
  art(r: Restaurant): 'pizza' | 'burger' | 'tajine' | 'bowl' {
    const t = (r.typeCuisine || '').toLowerCase();
    if (t.includes('pizza') || t.includes('ital')) return 'pizza';
    if (t.includes('fast') || t.includes('burger')) return 'burger';
    if (t.includes('tunis')) return 'tajine';
    return 'bowl';
  }

  // Sélectionne une cuisine et actualise les résultats
  pickCuisine(c: string) {
    this.cuisine = c;
    this.applyFilters();
  }

  // Applique les filtres en revenant à la première page
  applyFilters() {
    this.page.set(1);
    this.load();
  }

  // Change la page des résultats
  goTo(p: number) {
    this.page.set(p);
    this.load();
  }

  // Récupère les restaurants selon les filtres sélectionnés
  load() {
    this.loading.set(true);
    this.error.set('');
    this.service
      .getAll({
        search: this.search,
        cuisine: this.cuisine,
        open: this.open,
        sort: this.sort,
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.restaurants.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les restaurants (le serveur tourne-t-il ?)');
          this.loading.set(false);
        },
      });
  }
}