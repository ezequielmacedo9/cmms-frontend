import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Maquinas } from './maquinas';

describe('Maquinas', () => {
  let component: Maquinas;
  let fixture: ComponentFixture<Maquinas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maquinas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Maquinas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
