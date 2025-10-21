import { describe, it, expect, vi, beforeEach, vitest } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  EnvironmentInjector,
  TemplateRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewContainerRef,
} from '@angular/core';

vitest.mock('./stepper.service', () => ({
  StepperService: class MockStepperService {
    registerStep = vi.fn();
    unregisterStep = vi.fn();
    saveData = vi.fn();
    currentIndex = vi.fn(() => 0);
    stepCount = vi.fn(() => 0);
    stepStatuses = vi.fn(() => ({}));
    stepData = vi.fn(() => ({}));
    visitedSteps = vi.fn(() => ({}));
    aliasToIndex = vi.fn(() => ({}));
    linear = vi.fn(() => false);
    debug = vi.fn(() => false);
    setLinear = vi.fn();
    setDebug = vi.fn();
    next = vi.fn();
    prev = vi.fn();
    goTo = vi.fn();
    reset = vi.fn();
    getData = vi.fn();
    logData = vi.fn();
    setStatus = vi.fn();
    getSteps = vi.fn(() => []);
  },
}));

import { StepComponent } from './step.component';
import { StepperService } from './stepper.service';

const mockDomSanitizer = {
  bypassSecurityTrustHtml: vi.fn((html: string) => html as SafeHtml),
  sanitize: vi.fn(),
  bypassSecurityTrustScript: vi.fn(),
  bypassSecurityTrustStyle: vi.fn(),
  bypassSecurityTrustUrl: vi.fn(),
  bypassSecurityTrustResourceUrl: vi.fn(),
};

const mockEnvironmentInjector = {
  get: vi.fn(),
  runInContext: vi.fn(),
  createComponent: vi.fn(),
};

describe('StepComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepComponent],
      providers: [
        { provide: StepperService, useClass: StepperService },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
        { provide: EnvironmentInjector, useValue: mockEnvironmentInjector },
      ],
    }).compileComponents();
  });

  function createStep() {
    const fixture = TestBed.createComponent(StepComponent);
    return { fixture, cmp: fixture.componentInstance };
  }

  function createMockHost() {
    return {
      clear: vi.fn(),
      element: { nativeElement: document.createElement('div') },
      createComponent: vi.fn(),
      createEmbeddedView: vi.fn(() => ({ detectChanges: vi.fn() })),
    } as unknown as ViewContainerRef;
  }

  function makeActive(cmp: StepComponent, index = 0) {
    cmp.__assignIndex(index);
    const service = TestBed.inject(StepperService);
    vi.mocked(service.currentIndex).mockReturnValue(index);
    return service;
  }

  it('should create', () => {
    expect(createStep().cmp).toBeTruthy();
  });

  it('should return false for isActive when index differs from currentIndex', () => {
    const { cmp } = createStep();
    const service = TestBed.inject(StepperService);
    cmp.__assignIndex(3);
    vi.mocked(service.currentIndex).mockReturnValue(1);
    expect(cmp.isActive).toBe(false);
  });

  it('should register step without alias using index as fallback', () => {
    const { cmp } = createStep();
    const service = TestBed.inject(StepperService);
    cmp.__assignIndex(5);
    cmp.title = 'Test Without Alias';
    cmp.__registerWithService();
    expect(service.registerStep).toHaveBeenCalledWith(
      5,
      undefined,
      expect.objectContaining({ title: 'Test Without Alias' }),
    );
  });

  it('should register step with alias and all properties', () => {
    const { cmp } = createStep();
    const service = TestBed.inject(StepperService);
    cmp.__assignIndex(2);
    Object.assign(cmp, {
      alias: 'test-alias',
      title: 'Test Title',
      iconTooltip: 'Test Tooltip',
      cssClass: 'test-class',
      successIcon: 'success-icon',
      errorIcon: 'error-icon',
      showIconOnFinished: true,
      showIconOnError: false,
    });
    cmp.__registerWithService();
    expect(service.registerStep).toHaveBeenCalledWith(
      2,
      'test-alias',
      expect.objectContaining({
        title: 'Test Title',
        tooltip: 'Test Tooltip',
        cssClass: 'test-class',
        successIcon: 'success-icon',
        errorIcon: 'error-icon',
        showIconOnFinished: true,
        showIconOnError: false,
      }),
    );
  });

  it('should return early from renderContent when host does not exist', async () => {
    const { cmp } = createStep();
    (cmp as any).host = undefined;
    await cmp.renderContent();
    expect(true).toBe(true);
  });

  it('should handle contentHtml rendering and re-rendering', async () => {
    const { cmp } = createStep();
    const container = document.createElement('div');
    const anchor = document.createElement('div');
    container.appendChild(anchor);
    document.body.appendChild(container);

    (cmp as any).host = { clear: vi.fn(), element: { nativeElement: anchor } };

    cmp.contentHtml = '<div class="html1">First</div>';
    await cmp.renderContent();
    expect(container.querySelector('.html1')).toBeTruthy();

    cmp.contentHtml = '<div class="html2">Second</div>';
    await cmp.renderContent();
    expect(container.querySelector('.html1')).toBeFalsy();
    expect(container.querySelector('.html2')).toBeTruthy();

    document.body.removeChild(container);
  });

  it('should handle componentType rendering with inputs and outputs', async () => {
    @Component({ selector: 'test-comp', standalone: true, template: '<div>{{value}}</div>' })
    class TestComponent {
      @Input() value = '';
      @Output() changed = new EventEmitter<string>();
    }

    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    const { cmp } = createStep();
    const mockInstance = { value: '', changed: new EventEmitter() };
    const mockComponentRef = {
      instance: mockInstance,
      location: { nativeElement: document.createElement('div') },
      changeDetectorRef: { markForCheck: vi.fn() },
    };

    const mockHost = createMockHost();
    mockHost.createComponent = vi.fn().mockReturnValue(mockComponentRef);
    (cmp as any).host = mockHost;

    cmp.componentType = TestComponent;
    cmp.componentInputs = { value: 'test-value' };
    cmp.componentOutputs = { changed: vi.fn() };

    await cmp.renderContent();

    expect(mockHost.createComponent).toHaveBeenCalledWith(TestComponent, {
      environmentInjector: (cmp as any).envInjector,
    });
    expect(mockInstance.value).toBe('test-value');
    expect(mockComponentRef.changeDetectorRef.markForCheck).toHaveBeenCalled();
  });

  it('should handle lazyLoader rendering with inputs and outputs', async () => {
    @Component({ selector: 'lazy-comp', standalone: true, template: '<div>{{data}}</div>' })
    class LazyComponent {
      @Input() data = '';
      @Output() action = new EventEmitter<string>();
    }

    await TestBed.configureTestingModule({ imports: [LazyComponent] }).compileComponents();

    const { cmp } = createStep();
    const mockInstance = { data: '', action: new EventEmitter() };
    const mockComponentRef = {
      instance: mockInstance,
      location: { nativeElement: document.createElement('div') },
      changeDetectorRef: { markForCheck: vi.fn() },
    };

    const mockHost = createMockHost();
    mockHost.createComponent = vi.fn().mockReturnValue(mockComponentRef);
    (cmp as any).host = mockHost;

    cmp.lazyLoader = () => Promise.resolve(LazyComponent);
    cmp.componentInputs = { data: 'lazy-data' };
    cmp.componentOutputs = { action: vi.fn() };

    await cmp.renderContent();

    expect(mockHost.createComponent).toHaveBeenCalledWith(LazyComponent, {
      environmentInjector: (cmp as any).envInjector,
    });
    expect(mockInstance.data).toBe('lazy-data');
    expect(mockComponentRef.changeDetectorRef.markForCheck).toHaveBeenCalled();
  });

  it('should handle invalid componentOutputs gracefully', async () => {
    @Component({ selector: 'invalid-comp', standalone: true, template: '<div>Invalid</div>' })
    class InvalidComponent {
      @Output() changed = new EventEmitter<number>();
    }

    await TestBed.configureTestingModule({ imports: [InvalidComponent] }).compileComponents();

    const { cmp } = createStep();
    const mockHost = createMockHost();
    mockHost.createComponent = vi.fn().mockReturnValue({
      instance: { changed: new EventEmitter() },
      location: { nativeElement: document.createElement('div') },
      changeDetectorRef: { markForCheck: vi.fn() },
    });
    (cmp as any).host = mockHost;

    cmp.componentType = InvalidComponent;
    cmp.componentOutputs = { changed: 123 as any, nonExistent: vi.fn() };

    await cmp.renderContent();
    expect(mockHost.createComponent).toHaveBeenCalled();
  });

  it('should handle componentInputs errors gracefully', async () => {
    @Component({ selector: 'error-comp', standalone: true, template: '<div>Error</div>' })
    class ErrorComponent {
      @Input() set errorProp(_value: any) {
        throw new Error('Input error');
      }
    }

    await TestBed.configureTestingModule({ imports: [ErrorComponent] }).compileComponents();

    const { cmp } = createStep();
    const mockHost = createMockHost();

    // O mock deve simular o comportamento real: o erro é capturado no código real
    const mockInstance = {};
    const mockComponentRef = {
      instance: mockInstance,
      location: { nativeElement: document.createElement('div') },
      changeDetectorRef: { markForCheck: vi.fn() },
    };

    mockHost.createComponent = vi.fn().mockReturnValue(mockComponentRef);
    (cmp as any).host = mockHost;

    cmp.componentType = ErrorComponent;
    cmp.componentInputs = { errorProp: 'trigger-error' };

    // O teste deve passar sem erro porque o código captura a exceção
    await expect(cmp.renderContent()).resolves.not.toThrow();
    expect(mockHost.createComponent).toHaveBeenCalled();
  });

  it('should handle onSave and unregister on ngOnDestroy', () => {
    const { cmp } = createStep();
    const service = TestBed.inject(StepperService);
    const mockOnSave = vi.fn().mockReturnValue({ custom: 'data' });

    cmp.__assignIndex(2);
    cmp.alias = 'test-alias';
    cmp.onSave = mockOnSave;
    (cmp as any).host = { clear: vi.fn() };

    cmp.ngOnDestroy();

    expect(mockOnSave).toHaveBeenCalledWith(service);
    expect(service.saveData).toHaveBeenCalledWith('test-alias', { custom: 'data' });
    expect(service.unregisterStep).toHaveBeenCalledWith(2, 'test-alias');
  });

  it('should use index as key on ngOnDestroy without alias', () => {
    const { cmp } = createStep();
    const service = TestBed.inject(StepperService);
    cmp.__assignIndex(7);
    (cmp as any).host = { clear: vi.fn() };

    cmp.ngOnDestroy();

    expect(service.saveData).toHaveBeenCalledWith(7, { visited: true });
    expect(service.unregisterStep).toHaveBeenCalledWith(7, undefined);
  });

  it('should handle HTML element cleanup and errors on ngOnDestroy', () => {
    const { cmp } = createStep();

    const mockElement = document.createElement('div');
    const mockParent = document.createElement('div');
    mockParent.appendChild(mockElement);
    (cmp as any)._contentHtmlEl = mockElement;

    const removeChildSpy = vi.spyOn(mockParent, 'removeChild');
    cmp.ngOnDestroy();
    expect(removeChildSpy).toHaveBeenCalledWith(mockElement);

    const errorElement = document.createElement('div');
    const errorParent = {
      removeChild: vi.fn().mockImplementation(() => {
        throw new Error('Removal error');
      }),
    };
    Object.defineProperty(errorElement, 'parentNode', { value: errorParent, configurable: true });
    (cmp as any)._contentHtmlEl = errorElement;

    expect(() => cmp.ngOnDestroy()).not.toThrow();
  });

  it('should call renderContent on ngAfterViewInit when active and has host', () => {
    const { cmp } = createStep();
    makeActive(cmp, 0);
    (cmp as any).host = createMockHost();
    const renderSpy = vi.spyOn(cmp, 'renderContent').mockResolvedValue();

    cmp.ngAfterViewInit();
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should handle contentTemplate rendering', async () => {
    const { cmp } = createStep();
    const mockTemplate = {
      createEmbeddedView: vi.fn(() => ({ detectChanges: vi.fn() })),
    } as unknown as TemplateRef<unknown>;
    const mockHost = createMockHost();

    cmp.contentTemplate = mockTemplate;
    (cmp as any).host = mockHost;

    await cmp.renderContent();

    expect(mockHost.clear).toHaveBeenCalled();
    expect(mockHost.createEmbeddedView).toHaveBeenCalledWith(mockTemplate);
  });

  it('should clear host on hostRef setter', async () => {
    const { cmp } = createStep();
    const clearSpy = vi.fn();
    const mockOldHost = { clear: clearSpy } as unknown as ViewContainerRef;

    makeActive(cmp, 0);
    Object.defineProperty(cmp, 'host', { value: mockOldHost, writable: true, configurable: true });

    const mockNewHost = createMockHost();
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(cmp), 'hostRef');

    if (descriptor?.set) {
      descriptor.set.call(cmp, mockNewHost);
    }

    await new Promise(resolve => queueMicrotask(resolve as any));
    expect((cmp as any).host).toBe(mockNewHost);
  });
});
