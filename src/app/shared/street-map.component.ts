import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';

const DEFAULT_LAT = 12.6392;
const DEFAULT_LNG = -8.0029;

@Component({
  selector: 'app-street-map',
  standalone: true,
  template: `
    <div class="map-wrap">
      <p class="map-hint">Carte OpenStreetMap. L’adresse et le pays déplacent le point. Vous pouvez aussi cliquer sur la carte.</p>
      <div #mapHost class="street-map"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      grid-column: 1 / -1;
      width: 100%;
    }
    .map-wrap {
      width: 100%;
    }
    .map-hint { margin: 0 0 0.55rem; color: var(--cx-muted); font-size: 0.85rem; }
    .street-map {
      width: 100%;
      height: 280px;
      min-height: 280px;
      border-radius: 16px;
      border: 1px solid #ece6f3;
      overflow: hidden;
      background: #efeaf6;
      box-shadow: 0 10px 28px rgba(46, 16, 82, 0.08);
    }
    :host ::ng-deep .leaflet-container {
      width: 100%;
      height: 100%;
      background: #efeaf6;
    }
  `]
})
export class StreetMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() zoom = 13;
  @Output() readonly coordinatesChange = new EventEmitter<{ latitude: number; longitude: number }>();

  private map?: L.Map;
  private marker?: L.Marker;
  private resize?: ResizeObserver;
  private readonly icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  ngAfterViewInit(): void {
    const lat = this.latitude ?? DEFAULT_LAT;
    const lng = this.longitude ?? DEFAULT_LNG;
    this.map = L.map(this.mapHost.nativeElement, {
      scrollWheelZoom: false,
      attributionControl: true
    }).setView([lat, lng], this.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);
    this.marker = L.marker([lat, lng], { icon: this.icon, draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => {
      const pos = this.marker?.getLatLng();
      if (pos) {
        this.coordinatesChange.emit({ latitude: round(pos.lat), longitude: round(pos.lng) });
      }
    });
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.coordinatesChange.emit({ latitude: round(event.latlng.lat), longitude: round(event.latlng.lng) });
    });
    this.resize = new ResizeObserver(() => this.refresh());
    this.resize.observe(this.mapHost.nativeElement);
    [50, 200, 400, 800, 1400].forEach((ms) => setTimeout(() => this.refresh(), ms));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map || !this.marker) {
      return;
    }
    if (changes['latitude'] || changes['longitude'] || changes['zoom']) {
      this.moveTo(this.latitude ?? DEFAULT_LAT, this.longitude ?? DEFAULT_LNG, this.zoom);
    }
  }

  moveTo(latitude: number, longitude: number, zoom = 15): void {
    if (!this.map || !this.marker) {
      return;
    }
    const next = L.latLng(latitude, longitude);
    this.marker.setLatLng(next);
    this.map.setView(next, zoom);
    this.refresh();
  }

  ngOnDestroy(): void {
    this.resize?.disconnect();
    this.map?.remove();
  }

  private refresh(): void {
    this.map?.invalidateSize({ animate: false });
  }
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
