import { FormStepsComponent, FormStep } from './form-steps.component';

// Mock signal function
const signal = (initialValue: any) => {
  let value = initialValue;
  const signalFn = () => value;
  signalFn.set = (newValue: any) => { value = newValue; };
  signalFn.update = (updateFn: (current: any) => any) => { value = updateFn(value); };
  return signalFn;
};

// Mock EventEmitter
class MockEventEmitter {
  private listeners: ((value?: any) => void)[] = [];
  
  emit(value?: any) {
    this.listeners.forEach(listener => listener(value));
  }
  
  subscribe(listener: (value?: any) => void) {
    this.listeners.push(listener);
    return { unsubscribe: () => {} };
  }
}

describe('FormStepsComponent (Truly Isolated)', () => {
  let component: FormStepsComponent;

  const mockSteps: FormStep[] = [
    {
      key: 'step1',
      title: 'Step 1',
      description: 'First step',
    },
    {
      key: 'step2',
      title: 'Step 2',
      description: 'Second step',
    },
    {
      key: 'step3',
      title: 'Step 3',
      description: 'Third step',
      disabled: true,
    },
  ];

  beforeEach(() => {
    component = new FormStepsComponent();
    // Mock dos EventEmitters
    component.stepChange = new MockEventEmitter() as any;
    component.cancelAction = new MockEventEmitter() as any;
    component.back = new MockEventEmitter() as any;
    component.next = new MockEventEmitter() as any;
    
    // Mock do signal activeKey
    (component as any).activeKey = signal('basic');
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default steps', () => {
      expect(component.steps).toBeDefined();
      expect(component.steps.length).toBe(5);
      expect(component.steps[0].key).toBe('basic');
    });

    it('should initialize activeKey with first step', () => {
      expect(component['activeKey']()).toBe('basic');
    });
  });

  describe('Input Properties', () => {
    it('should accept custom steps input', () => {
      component.steps = mockSteps;

      expect(component.steps).toEqual(mockSteps);
      expect(component.steps.length).toBe(3);
    });

    it('should set activeKey when activeKeyInput is provided', () => {
      component.steps = mockSteps;
      component.activeKeyInput = 'step2';

      expect(component['activeKey']()).toBe('step2');
    });

    it('should not change activeKey when activeKeyInput is undefined', () => {
      const initialKey = component['activeKey']();
      component.activeKeyInput = undefined;

      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should not change activeKey when activeKeyInput is empty string', () => {
      const initialKey = component['activeKey']();
      component.activeKeyInput = '';

      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should not change activeKey when activeKeyInput is null', () => {
      const initialKey = component['activeKey']();
      component.activeKeyInput = null as any;

      expect(component['activeKey']()).toBe(initialKey);
    });
  });

  describe('Output Events', () => {
    it('should emit stepChange when onSelect is called', () => {
      let emittedValue: string | undefined;
      component.stepChange.subscribe(value => emittedValue = value);
      component.steps = mockSteps;
      
      component.onSelect('step2');

      expect(emittedValue).toBe('step2');
    });

    it('should emit back event when onBack is called', () => {
      let emittedValue: string | undefined;
      component.back.subscribe(value => emittedValue = value);
      component.steps = mockSteps;
      component['activeKey'].set('step2');
      
      component.onBack();

      expect(emittedValue).toBe('step1');
    });

    it('should emit next event when onNext is called', () => {
      let emittedValue: string | undefined;
      component.next.subscribe(value => emittedValue = value);
      component.steps = mockSteps;
      component['activeKey'].set('step1');
      
      component.onNext();

      expect(emittedValue).toBe('step2');
    });
  });

  describe('activeStep Method', () => {
    it('should return the current active step', () => {
      component.steps = mockSteps;
      component['activeKey'].set('step2');

      const activeStep = component['activeStep']();

      expect(activeStep).toEqual(mockSteps[1]);
    });

    it('should return undefined when no step matches activeKey', () => {
      component.steps = mockSteps;
      component['activeKey'].set('nonexistent');

      const activeStep = component['activeStep']();

      expect(activeStep).toBeUndefined();
    });

    it('should return first matching step when multiple steps have same key', () => {
      const duplicateKeySteps: FormStep[] = [
        { key: 'same', title: 'Step 1', description: 'First step' },
        { key: 'same', title: 'Step 2', description: 'Second step' },
      ];
      component.steps = duplicateKeySteps;
      component['activeKey'].set('same');

      const activeStep = component['activeStep']();

      expect(activeStep).toEqual(duplicateKeySteps[0]);
    });
  });

  describe('onSelect Method', () => {
    beforeEach(() => {
      component.steps = mockSteps;
    });

    it('should change activeKey when selecting valid step', () => {
      component.onSelect('step2');

      expect(component['activeKey']()).toBe('step2');
    });

    it('should not change activeKey when selecting disabled step', () => {
      const initialKey = component['activeKey']();
      component.onSelect('step3');

      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should not change activeKey when selecting nonexistent step', () => {
      const initialKey = component['activeKey']();
      component.onSelect('nonexistent');

      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should not emit stepChange when selecting disabled step', () => {
      let emittedValue: string | undefined;
      component.stepChange.subscribe(value => emittedValue = value);
      component.onSelect('step3');

      expect(emittedValue).toBeUndefined();
    });

    it('should not emit stepChange when selecting nonexistent step', () => {
      let emittedValue: string | undefined;
      component.stepChange.subscribe(value => emittedValue = value);
      component.onSelect('nonexistent');

      expect(emittedValue).toBeUndefined();
    });

    it('should handle undefined step key', () => {
      const initialKey = component['activeKey']();
      component.onSelect(undefined as any);

      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should handle null step key', () => {
      const initialKey = component['activeKey']();
      component.onSelect(null as any);

      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should handle empty string step key', () => {
      const initialKey = component['activeKey']();
      component.onSelect('');

      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should emit stepChange for valid enabled step', () => {
      let emittedValue: string | undefined;
      component.stepChange.subscribe(value => emittedValue = value);
      component.onSelect('step1');

      expect(emittedValue).toBe('step1');
    });
  });

  describe('onBack Method', () => {
    beforeEach(() => {
      component.steps = mockSteps;
    });

    it('should navigate to previous step', () => {
      component['activeKey'].set('step2');
      
      component.onBack();

      expect(component['activeKey']()).toBe('step1');
    });

    it('should skip disabled steps when going back', () => {
      const stepsWithDisabled: FormStep[] = [
        { key: 'step1', title: 'Step 1', description: 'First step' },
        { key: 'step2', title: 'Step 2', description: 'Second step', disabled: true },
        { key: 'step3', title: 'Step 3', description: 'Third step' },
      ];
      component.steps = stepsWithDisabled;
      component['activeKey'].set('step3');
      
      component.onBack();

      expect(component['activeKey']()).toBe('step1');
    });

    it('should not change activeKey when already at first step', () => {
      component['activeKey'].set('step1');
      
      component.onBack();

      expect(component['activeKey']()).toBe('step1');
    });

    it('should not emit back event when no previous step available', () => {
      let emittedValue: string | undefined;
      component.back.subscribe(value => emittedValue = value);
      component['activeKey'].set('step1');
      
      component.onBack();

      expect(emittedValue).toBeUndefined();
    });

    it('should handle empty steps array', () => {
      component.steps = [];
      component['activeKey'].set('any');
      
      component.onBack();

      expect(component['activeKey']()).toBe('any');
    });

    it('should handle all previous steps disabled', () => {
      const allPreviousDisabled: FormStep[] = [
        { key: 'step1', title: 'Step 1', description: 'First step', disabled: true },
        { key: 'step2', title: 'Step 2', description: 'Second step', disabled: true },
        { key: 'step3', title: 'Step 3', description: 'Third step' },
      ];
      component.steps = allPreviousDisabled;
      component['activeKey'].set('step3');
      
      component.onBack();

      expect(component['activeKey']()).toBe('step3');
    });
  });

  describe('onNext Method', () => {
    beforeEach(() => {
      component.steps = mockSteps;
    });

    it('should navigate to next step', () => {
      component['activeKey'].set('step1');
      
      component.onNext();

      expect(component['activeKey']()).toBe('step2');
    });

    it('should skip disabled steps when going forward', () => {
      const stepsWithDisabled: FormStep[] = [
        { key: 'step1', title: 'Step 1', description: 'First step' },
        { key: 'step2', title: 'Step 2', description: 'Second step', disabled: true },
        { key: 'step3', title: 'Step 3', description: 'Third step' },
      ];
      component.steps = stepsWithDisabled;
      component['activeKey'].set('step1');
      
      component.onNext();

      expect(component['activeKey']()).toBe('step3');
    });

    it('should not change activeKey when already at last step', () => {
      component['activeKey'].set('step2');
      
      component.onNext();

      expect(component['activeKey']()).toBe('step2');
    });

    it('should not emit next event when no next step available', () => {
      let emittedValue: string | undefined;
      component.next.subscribe(value => emittedValue = value);
      component['activeKey'].set('step2');
      
      component.onNext();

      expect(emittedValue).toBeUndefined();
    });

    it('should handle empty steps array', () => {
      component.steps = [];
      component['activeKey'].set('any');
      
      component.onNext();

      expect(component['activeKey']()).toBe('any');
    });

    it('should handle all next steps disabled', () => {
      const allNextDisabled: FormStep[] = [
        { key: 'step1', title: 'Step 1', description: 'First step' },
        { key: 'step2', title: 'Step 2', description: 'Second step', disabled: true },
        { key: 'step3', title: 'Step 3', description: 'Third step', disabled: true },
      ];
      component.steps = allNextDisabled;
      component['activeKey'].set('step1');
      
      component.onNext();

      expect(component['activeKey']()).toBe('step1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      component.steps = [];

      expect(component['activeStep']()).toBeUndefined();
    });

    it('should handle all steps disabled', () => {
      const allDisabledSteps: FormStep[] = [
        { key: 'step1', title: 'Step 1', description: 'First step', disabled: true },
        { key: 'step2', title: 'Step 2', description: 'Second step', disabled: true },
      ];
      component.steps = allDisabledSteps;
      component['activeKey'].set('step1');
      
      component.onNext();
      expect(component['activeKey']()).toBe('step1');
      
      component.onBack();
      expect(component['activeKey']()).toBe('step1');
    });

    it('should handle single step', () => {
      const singleStep: FormStep[] = [
        { key: 'only', title: 'Only Step', description: 'The only step' },
      ];
      component.steps = singleStep;
      component['activeKey'].set('only');
      
      component.onNext();
      expect(component['activeKey']()).toBe('only');
      
      component.onBack();
      expect(component['activeKey']()).toBe('only');
    });

    it('should handle steps with same key', () => {
      const duplicateKeySteps: FormStep[] = [
        { key: 'same', title: 'Step 1', description: 'First step' },
        { key: 'same', title: 'Step 2', description: 'Second step' },
      ];
      component.steps = duplicateKeySteps;
      component['activeKey'].set('same');
      
      const activeStep = component['activeStep']();
      expect(activeStep).toEqual(duplicateKeySteps[0]);
    });

    it('should handle steps with undefined properties', () => {
      const stepsWithUndefined: FormStep[] = [
        { key: 'step1', title: 'Step 1', description: 'First step' },
        { key: 'step2', title: 'Step 2', description: 'Second step', disabled: undefined },
      ];
      component.steps = stepsWithUndefined;
      
      component.onSelect('step2');
      expect(component['activeKey']()).toBe('step2');
    });
  });

  describe('Signal Behavior', () => {
    it('should update activeKey signal correctly', () => {
      const initialValue = component['activeKey']();
      
      component['activeKey'].set('newValue');
      
      expect(component['activeKey']()).toBe('newValue');
      expect(component['activeKey']()).not.toBe(initialValue);
    });

    it('should maintain signal reactivity', () => {
      const subscription = component['activeKey'];
      
      component['activeKey'].set('changed');
      
      expect(subscription()).toBe('changed');
    });

    it('should handle multiple signal updates', () => {
      component['activeKey'].set('first');
      expect(component['activeKey']()).toBe('first');
      
      component['activeKey'].set('second');
      expect(component['activeKey']()).toBe('second');
      
      component['activeKey'].set('third');
      expect(component['activeKey']()).toBe('third');
    });
  });

  describe('Default Steps Configuration', () => {
    it('should have correct default step keys', () => {
      const expectedKeys = ['basic', 'collateral', 'credits', 'documents', 'review'];
      const actualKeys = component.steps.map(step => step.key);
      
      expect(actualKeys).toEqual(expectedKeys);
    });

    it('should have all default steps enabled', () => {
      const disabledSteps = component.steps.filter(step => step.disabled);
      
      expect(disabledSteps.length).toBe(0);
    });

    it('should have titles and descriptions for all default steps', () => {
      component.steps.forEach(step => {
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(typeof step.title).toBe('string');
        expect(typeof step.description).toBe('string');
      });
    });

    it('should have unique keys for default steps', () => {
      const keys = component.steps.map(step => step.key);
      const uniqueKeys = [...new Set(keys)];
      
      expect(keys.length).toBe(uniqueKeys.length);
    });
  });

  describe('Method Coverage', () => {
    it('should cover activeStep method with various scenarios', () => {
      // Test with valid key
      component.steps = mockSteps;
      component['activeKey'].set('step1');
      expect(component['activeStep']()).toBeDefined();
      
      // Test with invalid key
      component['activeKey'].set('invalid');
      expect(component['activeStep']()).toBeUndefined();
      
      // Test with empty steps
      component.steps = [];
      expect(component['activeStep']()).toBeUndefined();
    });

    it('should cover all branches in onSelect', () => {
      component.steps = mockSteps;
      
      // Valid step
      component.onSelect('step1');
      expect(component['activeKey']()).toBe('step1');
      
      // Disabled step
      const initialKey = component['activeKey']();
      component.onSelect('step3');
      expect(component['activeKey']()).toBe(initialKey);
      
      // Nonexistent step
      component.onSelect('nonexistent');
      expect(component['activeKey']()).toBe(initialKey);
    });

    it('should cover all branches in onBack', () => {
      component.steps = mockSteps;
      
      // Has previous step
      component['activeKey'].set('step2');
      component.onBack();
      expect(component['activeKey']()).toBe('step1');
      
      // No previous step
      component['activeKey'].set('step1');
      component.onBack();
      expect(component['activeKey']()).toBe('step1');
    });

    it('should cover all branches in onNext', () => {
      component.steps = mockSteps;
      
      // Has next step
      component['activeKey'].set('step1');
      component.onNext();
      expect(component['activeKey']()).toBe('step2');
      
      // No next step
      component['activeKey'].set('step2');
      component.onNext();
      expect(component['activeKey']()).toBe('step2');
    });
  });
});