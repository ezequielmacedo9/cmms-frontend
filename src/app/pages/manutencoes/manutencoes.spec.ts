import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ManutencoesComponent } from './manutencoes.component';

describe('ManutencoesComponent', () => {
  let component: ManutencoesComponent;
  let fixture: ComponentFixture<ManutencoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManutencoesComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ManutencoesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
