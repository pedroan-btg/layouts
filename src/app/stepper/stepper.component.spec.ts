import { describe, it, expect, vi, beforeEach, vitest } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ElementRef, Renderer2, QueryList } from '@angular/core';

const mockRenderer2 = {
  listen: vi.fn(() => vi.fn()),
  setStyle: vi.fn(),
};
const mockElementRef = {
  nativeElement: {
    getBoundingClientRect: vi.fn(() => ({ width: 300, height: 100 })),
  },
};
function createMockQueryList(items: any[] = []) {
  return {
    toArray: vi.fn(() => items),
    length: items.length,
    first: items[0],
    last: items[items.length - 1],
    get: vi.fn((index: number) => items[index]),
    forEach: vi.fn((fn: any) => items.forEach(fn)),
  } as unknown as QueryList<any>;
}

let mockService: any;
vitest.mock('./stepper.service', () => {
  const createMock = () => ({
    _currentIndex: 0,
    _stepCount: 3,
    _stepStatuses: {},
    _stepData: {},
    _visitedSteps: {},
    _aliasToIndex: {},
    _linear: false,
    _debug: false,
    currentIndex() {
      return this._currentIndex;
    },
    stepCount() {
      return this.getSteps().length;
    },
    stepStatuses() {
      return this._stepStatuses;
    },
    stepData() {
      return this._stepData;
    },
    visitedSteps() {
      return this._visitedSteps;
    },
    aliasToIndex() {
      return this._aliasToIndex;
    },
    linear() {
      return this._linear;
    },
    debug() {
      return this._debug;
    },
    registerStep: vi.fn(),
    unregisterStep: vi.fn(),
    saveData: vi.fn(),
    setLinear: vi.fn(function (this: any, value: boolean) {
      this._linear = value;
    }),
    setDebug: vi.fn(function (this: any, value: boolean) {
      this._debug = value;
    }),
    next: vi.fn(),
    prev: vi.fn(),
    goTo: vi.fn(),
    reset: vi.fn(),
    getData: vi.fn(),
    logData: vi.fn(),
    setStatus: vi.fn(),
    getSteps: vi.fn(() => [
      { index: 0, alias: 'a', title: 'A', tooltip: null, cssClass: null },
      { index: 1, alias: 'b', title: 'B', tooltip: null, cssClass: null },
      { index: 2, alias: 'c', title: 'C', tooltip: null, cssClass: null },
    ]),
    __setCurrentIndex(value: number) {
      this._currentIndex = value;
    },
    __setStepCount(value: number) {
      this.getSteps.mockReturnValue(
        Array.from({ length: value }, (_, i) => ({
          index: i,
          alias: String.fromCharCode(97 + i),
          title: String.fromCharCode(65 + i),
          tooltip: null,
          cssClass: null,
        })),
      );
    },
    __setStepStatuses(value: any) {
      this._stepStatuses = value;
    },
    __setStepData(value: any) {
      this._stepData = value;
    },
    __setVisitedSteps(value: any) {
      this._visitedSteps = value;
    },
    __setAliasToIndex(value: any) {
      this._aliasToIndex = value;
    },
  });
  return { StepperService: vi.fn(() => (mockService = createMock())) };
});
vitest.mock('./step.component', () => ({
  StepComponent: vi.fn().mockImplementation(() => ({
    __assignIndex: vi.fn(),
    __registerWithService: vi.fn(),
    renderContent: vi.fn(),
    index: 0,
    alias: undefined,
    title: '',
  })),
}));

import { StepperComponent } from './stepper.component';

describe('StepperComponent (isolated)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperComponent],
      providers: [
        { provide: Renderer2, useValue: mockRenderer2 },
        { provide: ElementRef, useValue: mockElementRef },
      ],
    }).compileComponents();
    vi.clearAllMocks();
  });

  function createStepper() {
    const fixture = TestBed.createComponent(StepperComponent);
    const cmp = fixture.componentInstance;
    const mockSteps = [
      {
        __assignIndex: vi.fn(),
        __registerWithService: vi.fn(),
        renderContent: vi.fn(),
      },
      {
        __assignIndex: vi.fn(),
        __registerWithService: vi.fn(),
        renderContent: vi.fn(),
      },
      {
        __assignIndex: vi.fn(),
        __registerWithService: vi.fn(),
        renderContent: vi.fn(),
      },
    ];
    Object.defineProperty(cmp, 'projectedSteps', {
      value: createMockQueryList(mockSteps),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(cmp, 'progressWrapper', {
      value: {
        nativeElement: { getBoundingClientRect: () => ({ width: 300 }) },
      },
      writable: true,
    });
    Object.defineProperty(cmp, 'iconsRef', {
      value: { nativeElement: { style: {} } },
      writable: true,
    });
    Object.defineProperty(cmp, 'titlesRef', {
      value: { nativeElement: { style: {} } },
      writable: true,
    });
    Object.defineProperty(cmp, 'separatorsRef', {
      value: { nativeElement: { style: { setProperty: vi.fn() } } },
      writable: true,
    });
    return { fixture, cmp, mockSteps };
  }

  it('should create', () => {
    expect(createStepper().cmp).toBeTruthy();
  });

  it('should calculate progress percent correctly', () => {
    const { cmp } = createStepper();
    mockService.__setStepCount(3);
    mockService.__setCurrentIndex(1);
    (cmp.service as any)._currentIndex = 1;
    expect(cmp.progressPercent()).toBeCloseTo(66.67, 1);
  });

  it('should calculate progress percent with custom segments', () => {
    const { cmp } = createStepper();
    cmp.segments = 5;
    mockService.__setCurrentIndex(2);
    (cmp.service as any)._currentIndex = 2;
    expect(cmp.progressPercent()).toBe(60);
  });

  it('should return 0 progress when no steps', () => {
    const { cmp } = createStepper();
    mockService.__setStepCount(0);
    (cmp.service as any).getSteps.mockReturnValue([]);
    expect(cmp.progressPercent()).toBe(0);
  });

  it('should get steps from service', () => {
    const { cmp } = createStepper();
    const mockSteps = [{ index: 0, title: 'Test' }];
    vi.spyOn(mockService, 'getSteps').mockReturnValue(mockSteps);
    (cmp.service as any).getSteps.mockReturnValue(mockSteps);
    expect(cmp.steps).toBe(mockSteps);
  });

  it('should sync linear flag to service in ngAfterContentInit', () => {
    const { cmp, mockSteps } = createStepper();
    vi.spyOn(mockService, 'setLinear');
    (cmp.service as any).setLinear = mockService.setLinear;
    cmp.linear = true;
    cmp.ngAfterContentInit();
    expect(mockService.setLinear).toHaveBeenCalledWith(true);
    mockSteps.forEach((step, i) => {
      expect(step.__assignIndex).toHaveBeenCalledWith(i);
      expect(step.__registerWithService).toHaveBeenCalled();
    });
  });

  it('should update grid columns in ngAfterViewInit', () => {
    const { cmp } = createStepper();
    (cmp as any).renderer = mockRenderer2;
    cmp.ngAfterViewInit();
    expect(mockRenderer2.listen).toHaveBeenCalledWith('window', 'resize', expect.any(Function));
    expect(mockRenderer2.setStyle).toHaveBeenCalled();
  });

  it('should update grid columns with correct calculations', () => {
    const { cmp } = createStepper();
    (cmp as any).renderer = mockRenderer2;
    mockService.__setStepCount(3);
    (cmp as any).updateGridColumns();
    expect(mockRenderer2.setStyle).toHaveBeenCalledWith(
      (cmp as any).iconsRef.nativeElement,
      'gridTemplateColumns',
      'repeat(3, 100px)',
    );
    expect(mockRenderer2.setStyle).toHaveBeenCalledWith(
      (cmp as any).titlesRef.nativeElement,
      'gridTemplateColumns',
      'repeat(3, 100px)',
    );
  });

  it('should handle updateGridColumns with segments <= 0', () => {
    const { cmp } = createStepper();
    (cmp as any).renderer = mockRenderer2;
    cmp.segments = 0;
    (cmp as any).updateGridColumns();
    expect(mockRenderer2.setStyle).not.toHaveBeenCalled();
  });

  it('should sync linear flag in ngOnChanges', () => {
    const { cmp } = createStepper();
    vi.spyOn(mockService, 'setLinear');
    (cmp.service as any).setLinear = mockService.setLinear;
    cmp.linear = false;
    cmp.ngOnChanges();
    expect(mockService.setLinear).toHaveBeenCalledWith(false);
  });

  it('should cleanup resize listener in ngOnDestroy', () => {
    const { cmp } = createStepper();
    const unlistenMock = vi.fn();
    (cmp as any).resizeUnlisten = unlistenMock;
    cmp.ngOnDestroy();
    expect(unlistenMock).toHaveBeenCalled();
    expect((cmp as any).resizeUnlisten).toBeUndefined();
  });

  it('should handle step click when navigable', async () => {
    const { cmp } = createStepper();
    vi.spyOn(mockService, 'goTo');
    (cmp.service as any).goTo = mockService.goTo;
    cmp.navigable = true;
    await cmp.onStepClick(2);
    expect(mockService.goTo).toHaveBeenCalledWith(2);
  });

  it('should not handle step click when not navigable', async () => {
    const { cmp } = createStepper();
    vi.spyOn(mockService, 'goTo');
    cmp.navigable = false;
    await cmp.onStepClick(2);
    expect(mockService.goTo).not.toHaveBeenCalled();
  });

  it('should get step classes correctly', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished' });
    (cmp.service as any)._stepStatuses = { 0: 'finished' };
    cmp.stepItemClass = 'custom-item';
    const step = { index: 0, cssClass: 'step-custom' } as any;
    expect(cmp.getStepClasses(step)).toEqual([
      'step',
      'step-status-finished',
      'custom-item',
      'step-custom',
    ]);
  });

  it('should get title classes with status overrides', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished', 1: 'error' });
    (cmp.service as any)._stepStatuses = { 0: 'finished', 1: 'error' };
    cmp.stepTitleClass = 'base-title';
    const finishedStep = {
      index: 0,
      successTitleClass: 'success-title',
    } as any;
    const errorStep = { index: 1, errorTitleClass: 'error-title' } as any;
    expect(cmp.getTitleClasses(finishedStep)).toEqual(['base-title', 'success-title']);
    expect(cmp.getTitleClasses(errorStep)).toEqual(['base-title', 'error-title']);
  });

  it('should get title colors by status', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished', 1: 'error' });
    (cmp.service as any)._stepStatuses = { 0: 'finished', 1: 'error' };
    const finishedStep = { index: 0, successTitleColor: 'green' } as any;
    const errorStep = { index: 1, errorTitleColor: 'red' } as any;
    const pendingStep = { index: 2 } as any;
    expect(cmp.getTitleColor(finishedStep)).toBe('green');
    expect(cmp.getTitleColor(errorStep)).toBe('red');
    expect(cmp.getTitleColor(pendingStep)).toBeNull();
  });

  it('should get icon class with custom icons and classes', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished', 1: 'error' });
    (cmp.service as any)._stepStatuses = { 0: 'finished', 1: 'error' };
    const finishedStep = {
      index: 0,
      successIcon: 'bi bi-star',
      successIconClass: 'big',
    } as any;
    const errorStep = {
      index: 1,
      errorIcon: 'bi bi-bug',
      errorIconClass: 'small',
    } as any;
    const pendingStep = { index: 2 } as any;
    expect(cmp.getIconClass(finishedStep)).toBe('bi bi-star big');
    expect(cmp.getIconClass(errorStep)).toBe('bi bi-bug small');
    expect(cmp.getIconClass(pendingStep)).toBeNull();
  });

  it('should handle shouldShowIcon flags', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished', 1: 'error' });
    (cmp.service as any)._stepStatuses = { 0: 'finished', 1: 'error' };
    const showStep = { index: 0, showIconOnFinished: true } as any;
    const hideStep = { index: 1, showIconOnError: false } as any;
    const defaultStep = { index: 2 } as any;
    expect(cmp.shouldShowIcon(showStep)).toBe(true);
    expect(cmp.shouldShowIcon(hideStep)).toBe(false);
    expect(cmp.shouldShowIcon(defaultStep)).toBe(false);
  });

  it('should return true in shouldShowIcon for finished step with showIconOnFinished undefined', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished' });
    (cmp.service as any)._stepStatuses = { 0: 'finished' };
    expect(cmp.shouldShowIcon({ index: 0 })).toBe(true);
  });

  it('should return true in shouldShowIcon for error step with showIconOnError undefined', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 1: 'error' });
    (cmp.service as any)._stepStatuses = { 1: 'error' };
    expect(cmp.shouldShowIcon({ index: 1 })).toBe(true);
  });

  it('should get icon colors by status', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished', 1: 'error' });
    (cmp.service as any)._stepStatuses = { 0: 'finished', 1: 'error' };
    const finishedStep = { index: 0, successIconColor: 'green' } as any;
    const errorStep = { index: 1, errorIconColor: 'red' } as any;
    const pendingStep = { index: 2 } as any;
    expect(cmp.getIconColor(finishedStep)).toBe('green');
    expect(cmp.getIconColor(errorStep)).toBe('red');
    expect(cmp.getIconColor(pendingStep)).toBeNull();
  });

  it('should get tooltips with status overrides', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished', 1: 'error' });
    (cmp.service as any)._stepStatuses = { 0: 'finished', 1: 'error' };
    const finishedStep = {
      index: 0,
      successTooltip: 'Success!',
      tooltip: 'Base',
    } as any;
    const errorStep = {
      index: 1,
      errorTooltip: 'Error!',
      tooltip: 'Base',
    } as any;
    const pendingStep = { index: 2, tooltip: 'Pending' } as any;
    const defaultStep = { index: 3 } as any;
    expect(cmp.getTooltip(finishedStep)).toBe('Success!');
    expect(cmp.getTooltip(errorStep)).toBe('Error!');
    expect(cmp.getTooltip(pendingStep)).toBe('Pending');
    expect(cmp.getTooltip(defaultStep)).toBe('STEPPER_STEP_TOOLTIP');
  });

  it('should return correct progress aria label', () => {
    const { cmp } = createStepper();
    expect(cmp.getProgressAriaLabel()).toBe('STEPPER_PROGRESS_LABEL');
  });

  it('should check isFirst and isLast correctly', () => {
    const { cmp } = createStepper();
    mockService.__setCurrentIndex(0);
    mockService.__setStepCount(3);
    (cmp.service as any)._currentIndex = 0;
    expect(cmp.isFirst()).toBe(true);
    expect(cmp.isLast()).toBe(false);
    mockService.__setCurrentIndex(2);
    (cmp.service as any)._currentIndex = 2;
    expect(cmp.isFirst()).toBe(false);
    expect(cmp.isLast()).toBe(true);
  });

  it('should handle fallback for getTitleColor, getIconClass, getIconColor, getTooltip', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 0: 'finished', 1: 'error', 2: 'pending' });
    (cmp.service as any)._stepStatuses = {
      0: 'finished',
      1: 'error',
      2: 'pending',
    };
    expect(cmp.getTitleColor({ index: 0 })).toBeNull();
    expect(cmp.getTitleColor({ index: 1 })).toBeNull();
    expect(cmp.getIconClass({ index: 0 })).toBe('bi bi-check-circle-fill');
    expect(cmp.getIconClass({ index: 1 })).toBe('bi bi-exclamation-circle-fill');
    expect(cmp.getIconClass({ index: 2 })).toBeNull();
    expect(cmp.getIconColor({ index: 0 })).toBeNull();
    expect(cmp.getIconColor({ index: 1 })).toBeNull();
    expect(cmp.getTooltip({ index: 0 })).toBe('STEPPER_SUCCESS_TOOLTIP');
    expect(cmp.getTooltip({ index: 1 })).toBe('STEPPER_ERROR_TOOLTIP');
    expect(cmp.getTooltip({ index: 2 })).toBe('STEPPER_STEP_TOOLTIP');
  });

  it('should handle getStepClasses and getTitleClasses for pending/undefined status', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({});
    (cmp.service as any)._stepStatuses = {};
    cmp.stepTitleClass = 'base-title';
    const step = { index: 99 };
    expect(cmp.getStepClasses(step)).toContain('step-status-pending');
    expect(cmp.getTitleClasses(step)).toEqual(['base-title']);
  });

  it('should handle getTooltip with only base tooltip', () => {
    const { cmp } = createStepper();
    mockService.__setStepStatuses({ 2: 'pending' });
    (cmp.service as any)._stepStatuses = { 2: 'pending' };
    expect(cmp.getTooltip({ index: 2, tooltip: 'BaseTooltip' })).toBe('BaseTooltip');
  });

  it('should early return in updateGridColumns when width is 0', () => {
    const { cmp } = createStepper();
    (cmp as any).renderer = mockRenderer2;
    (cmp as any).iconsRef = { nativeElement: { style: {} } };
    (cmp as any).titlesRef = { nativeElement: { style: {} } };
    (cmp as any).progressWrapper = undefined;
    (cmp as any).segments = 3;
    mockService.__setStepCount(3);
    (cmp as any).host.nativeElement.getBoundingClientRect = () => ({
      width: 0,
    });
    (cmp as any).updateGridColumns();
    expect(mockRenderer2.setStyle).not.toHaveBeenCalled();
  });

  it('should handle keyboard navigation (ArrowRight, ArrowLeft, Home, End) and not handle if not navigable', () => {
    const { cmp } = createStepper();
    vi.spyOn(mockService, 'goTo');
    (cmp.service as any).goTo = mockService.goTo;
    cmp.navigable = true;
    mockService.__setStepCount(5);
    (cmp.service as any).getSteps.mockReturnValue(
      Array.from({ length: 5 }, (_, i) => ({
        index: i,
        alias: String.fromCharCode(97 + i),
        title: String.fromCharCode(65 + i),
        tooltip: null,
        cssClass: null,
      })),
    );

    const cases = [
      { key: 'ArrowRight', idx: 1, expected: 2 },
      { key: 'ArrowLeft', idx: 1, expected: 0 },
      { key: 'Home', idx: 2, expected: 0 },
      { key: 'End', idx: 2, expected: 4 },
    ];

    cases.forEach(({ key, idx, expected }) => {
      const event = { key, preventDefault: vi.fn() } as any;
      cmp.onStepKeydown(event, idx);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockService.goTo).toHaveBeenCalledWith(expected);
    });

    mockService.goTo.mockClear();

    cmp.navigable = false;
    const eventNoNav = { key: 'ArrowRight', preventDefault: vi.fn() } as any;
    cmp.onStepKeydown(eventNoNav, 1);
    expect(eventNoNav.preventDefault).not.toHaveBeenCalled();
    expect(mockService.goTo).not.toHaveBeenCalledWith(2);
  });
});
