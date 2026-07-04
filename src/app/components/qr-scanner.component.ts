import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  OnDestroy, OnInit, Output, ViewChild, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * In-app QR scanner: opens the device camera and decodes frames with jsQR
 * (loaded lazily so the library never lands in the initial bundle).
 *
 * Emits `scanned` with the raw QR text once, then stops the camera.
 * Emits `closed` when the user dismisses the overlay.
 */
@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scan-overlay" (click)="close()">
      <div class="scan-panel" (click)="$event.stopPropagation()">
        <div class="scan-head">
          <div class="scan-title"><mat-icon>qr_code_scanner</mat-icon> Escanear QR code</div>
          <button mat-icon-button class="scan-close" (click)="close()" aria-label="Fechar scanner">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="scan-body">
          <video #video class="scan-video" playsinline muted></video>
          <div class="scan-frame" aria-hidden="true"></div>
        </div>
        <div class="scan-hint" *ngIf="!error()">Aponte a câmera para o QR code da máquina.</div>
        <div class="scan-error" *ngIf="error()">
          <mat-icon>videocam_off</mat-icon> {{ error() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scan-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1100;
      display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .scan-panel { background: #12122a; border: 1px solid rgba(139,92,246,0.25); border-radius: 12px;
      width: min(440px, 95vw); overflow: hidden; }
    .scan-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px;
      border-bottom: 1px solid rgba(139,92,246,0.12); }
    .scan-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #fafafa; }
    .scan-title mat-icon { color: #a78bfa; }
    .scan-close { color: rgba(255,255,255,0.35) !important; }
    .scan-body { position: relative; aspect-ratio: 1 / 1; background: #000; }
    .scan-video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .scan-frame { position: absolute; inset: 12%; border: 2px solid rgba(167,139,250,0.85);
      border-radius: 12px; pointer-events: none;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.35); }
    .scan-hint { padding: 12px 16px; font-size: 12px; color: rgba(255,255,255,0.45); text-align: center; }
    .scan-error { display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px 16px; font-size: 13px; color: #fca5a5; }
  `]
})
export class QrScannerComponent implements OnInit, OnDestroy {

  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  @Output() scanned = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  readonly error = signal('');

  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private done = false;

  async ngOnInit() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set('Câmera não suportada neste dispositivo/navegador.');
      return;
    }
    try {
      // jsQR only loads when the scanner actually opens (separate lazy chunk).
      const { default: jsQR } = await import('jsqr');
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { this.error.set('Falha ao inicializar o scanner.'); return; }

      const tick = () => {
        if (this.done) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (result?.data) {
            this.done = true;
            this.stopCamera();
            this.scanned.emit(result.data);
            return;
          }
        }
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    } catch {
      this.error.set('Não foi possível acessar a câmera. Verifique a permissão.');
    }
  }

  ngOnDestroy() { this.stopCamera(); }

  close() {
    this.stopCamera();
    this.closed.emit();
  }

  private stopCamera() {
    this.done = true;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }
}
