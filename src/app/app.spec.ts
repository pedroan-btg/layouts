import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ENV_CONFIG } from 'fts-frontui/env';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: ENV_CONFIG,
          useValue: { environment: 'test', version: 'test', logDisabled: true },
        },
      ],
      teardown: { destroyAfterEach: true },
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the form steps container', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[fts-form-steps]')).toBeTruthy();
  });
});
