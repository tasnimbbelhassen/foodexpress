
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FoodSpriteComponent } from './shared/food-sprite/food-sprite.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FoodSpriteComponent],
 template: `
  <app-food-sprite />
  <app-navbar />

  <main class="container py-4">
    <router-outlet />
  </main>
`,
})
export class App {}
