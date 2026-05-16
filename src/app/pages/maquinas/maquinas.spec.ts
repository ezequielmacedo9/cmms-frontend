import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { MaquinasComponent } from './maquinas.component';

describe('MaquinasComponent', () => {
  let component: MaquinasComponent;
  let fixture: ComponentFixture<MaquinasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaquinasComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MaquinasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
