import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

const FORMATS = [
  'ean_13', 'ean_8', 'code_128', 'code_39', 'codabar',
  'upc_a', 'upc_e', 'itf', 'qr_code', 'data_matrix'
];

@Component({
  selector: 'app-barcode-scan-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>qr_code_scanner</mat-icon></span>
      Scanner le code-barres
    </h2>
    <mat-dialog-content>
      @if (errorMessage) {
        <p class="hint">{{ errorMessage }}</p>
      } @else {
        <div class="stage">
          <video #video autoplay muted playsinline></video>
          <span class="frame" aria-hidden="true"></span>
        </div>
        <p class="hint">Placez le code dans le cadre. Un lecteur USB fonctionne aussi dans le champ SKU.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Annuler</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .stage {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      background: #1d082f;
      aspect-ratio: 4 / 3;
    }
    video { display: block; width: 100%; height: 100%; object-fit: cover; }
    .frame {
      position: absolute;
      inset: 18% 12%;
      border: 2px solid #f1c453;
      border-radius: 12px;
      box-shadow: 0 0 0 999px rgba(29, 8, 47, .35);
      pointer-events: none;
    }
    .hint { margin: .8rem 0 0; color: #6b5d76; font-size: .88rem; line-height: 1.4; }
  `]
})
export class BarcodeScanDialogComponent implements AfterViewInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<BarcodeScanDialogComponent, string>);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('video') private videoRef?: ElementRef<HTMLVideoElement>;
  errorMessage = '';
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = true;

  async ngAfterViewInit(): Promise<void> {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
      this.fail('La caméra n’est pas disponible sur cet appareil. Branchez un lecteur USB dans le champ SKU, ou saisissez le code.');
      return;
    }
    const video = this.videoRef?.nativeElement;
    if (!video) {
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
    } catch {
      this.fail('Autorisez la caméra pour scanner le code-barres, ou saisissez le SKU.');
      return;
    }
    video.srcObject = this.stream;
    try {
      await video.play();
    } catch {
      this.stop();
      this.fail('Impossible de démarrer la caméra. Saisissez le SKU ou utilisez un lecteur USB.');
      return;
    }
    const detector = new BarcodeDetector({ formats: FORMATS });
    const tick = async (): Promise<void> => {
      if (!this.running) {
        return;
      }
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const codes = await detector.detect(video);
          const value = codes.find((code) => code.rawValue?.trim())?.rawValue?.trim();
          if (value) {
            this.dialogRef.close(value);
            return;
          }
        } catch {
          /* frame ignored */
        }
      }
      this.timer = setTimeout(() => void tick(), 180);
    };
    void tick();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private fail(message: string): void {
    this.stop();
    this.errorMessage = message;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  private stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }
}
