import { Component } from '@angular/core';
import { GarmentComponent } from './garment.component';

@Component({
  selector: 'app-catalogue-hero',
  standalone: true,
  imports: [GarmentComponent],
  templateUrl: './catalogue-hero.component.html',
  styleUrl: './catalogue-hero.component.scss'
})
export class CatalogueHeroComponent {}
