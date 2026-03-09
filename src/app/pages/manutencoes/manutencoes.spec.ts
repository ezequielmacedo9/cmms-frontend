import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Manutencoes } from './manutencoes';

describe('Manutencoes', () => {
  let component: Manutencoes;
  let fixture: ComponentFixture<Manutencoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Manutencoes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Manutencoes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
