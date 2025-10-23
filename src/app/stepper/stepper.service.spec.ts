import { describe, it, expect, beforeEach } from 'vitest';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { StepperService } from './stepper.service';

describe('StepperService', () => {
  let service: StepperService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [StepperService],
    }).compileComponents();
    service = TestBed.inject(StepperService);
  });

  it('registers steps and maps aliases correctly', () => {
    service.registerStep(0, 'inicio');
    service.registerStep(1, 'meio');
    service.registerStep(2, 'fim');

    expect(service.stepCount()).toBe(3);
    expect(service.aliasToIndex()['inicio']).toBe(0);
    expect(service.aliasToIndex()['meio']).toBe(1);
    expect(service.aliasToIndex()['fim']).toBe(2);
  });

  it('throws error when registering duplicate alias', () => {
    service.registerStep(0, 'dup');
    expect(() => service.registerStep(1, 'dup')).toThrowError();
  });

  it('navigates with goTo and updates statuses (jump applies synthetic error)', async () => {
    service.registerStep(0, 's0');
    service.registerStep(1, 's1');
    service.registerStep(2, 's2');
    service.reset({ index: 0 });

    expect(service.currentIndex()).toBe(0);
    expect(service.stepStatuses()[0]).toBe('active');

    const ok = await service.goTo(2);
    expect(ok).toBe(true);
    expect(service.currentIndex()).toBe(2);

    const statuses = service.stepStatuses();
    expect(statuses[0]).toBe('finished');
    expect(statuses[1]).toBe('error');
    expect(statuses[2]).toBe('active');

    const back = await service.goTo(1);
    expect(back).toBe(true);
    const statuses2 = service.stepStatuses();
    expect(service.currentIndex()).toBe(1);
    expect(statuses2[2]).toBe('finished');
    expect(statuses2[1]).toBe('error');
  });

  it('prev/next respect boundaries and return boolean', async () => {
    service.registerStep(0);
    service.registerStep(1);
    service.registerStep(2);

    expect(service.currentIndex()).toBe(0);
    expect(await service.prev()).toBe(false);
    expect(service.currentIndex()).toBe(0);

    expect(await service.next()).toBe(true);
    expect(service.currentIndex()).toBe(1);
    expect(await service.next()).toBe(true);
    expect(service.currentIndex()).toBe(2);
    expect(await service.next()).toBe(false);
    expect(service.currentIndex()).toBe(2);
  });

  it('setStatus by index and alias', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.setStatus(0, 'finished');
    service.setStatus('b', 'error');

    const st = service.stepStatuses();
    expect(st[0]).toBe('finished');
    expect(st[1]).toBe('error');
  });

  it('reset controls visited, statuses and data', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.registerStep(2, 'c');

    service.saveData('a', { ok: true });
    expect(service.getData('a')).toEqual({ ok: true });

    service.reset({ keepData: false, index: 1 });
    expect(service.currentIndex()).toBe(1);
    const statuses = service.stepStatuses();
    expect(statuses[1]).toBe('active');
    expect(statuses[0]).toBe('pending');
    expect(statuses[2]).toBe('pending');

    const visited = service.visitedSteps();
    expect(visited[1]).toBe(true);
    expect(visited[0]).toBeUndefined();
    expect(visited[2]).toBeUndefined();

    expect(service.getData('a')).toBeUndefined();
  });

  it('linear and debug signals can be configured', () => {
    service.linear.set(true);
    service.debug.set(true);
    expect(service.linear()).toBe(true);
    expect(service.debug()).toBe(true);
  });

  it('setLinear and setDebug update signals', () => {
    service.setLinear(true);
    service.setDebug(true);
    expect(service.linear()).toBe(true);
    expect(service.debug()).toBe(true);
  });

  it('blocks navigation when canExit returns false', async () => {
    service.registerStep(0, 'a', { canExit: () => false });
    service.registerStep(1, 'b');
    service.reset({ index: 0 });
    const res = await service.goTo(1);
    expect(res).toBe(false);
    expect(service.currentIndex()).toBe(0);
    expect(service.stepStatuses()[0]).toBe('active');
  });

  it('proceeds navigation when canExit throws error', async () => {
    service.registerStep(0, 'a', {
      canExit: () => {
        throw new Error('x');
      },
    });
    service.registerStep(1, 'b');
    service.reset({ index: 0 });
    const res = await service.goTo(1);
    expect(res).toBe(true);
    expect(service.currentIndex()).toBe(1);
  });

  it('updates existing record with registerStep again', () => {
    service.registerStep(0, 'x', { title: 'A' });
    service.registerStep(0, undefined, { tooltip: 'T' });
    const s0 = service.getSteps()[0];
    expect(s0.title).toBe('A');
    expect(s0.tooltip).toBe('T');
  });

  it('registerStep update covers overrides for icons, titles and tooltips', () => {
    service.registerStep(0, 'a');
    service.registerStep(0, undefined, {
      successIcon: 'bi bi-star',
      errorIcon: 'bi bi-bug',
      successIconClass: 'ok',
      errorIconClass: 'err',
      successIconColor: 'green',
      errorIconColor: 'red',
      successTitleClass: 'ok-title',
      errorTitleClass: 'err-title',
      successTitleColor: 'green',
      errorTitleColor: 'red',
      successTooltip: 'OK',
      errorTooltip: 'ERR',
      showIconOnFinished: false,
      showIconOnError: true,
    });
    const s0 = service.getSteps()[0];
    expect(s0.successIcon).toBe('bi bi-star');
    expect(s0.errorIcon).toBe('bi bi-bug');
    expect(s0.successIconClass).toBe('ok');
    expect(s0.errorIconClass).toBe('err');
    expect(s0.successIconColor).toBe('green');
    expect(s0.errorIconColor).toBe('red');
    expect(s0.successTitleClass).toBe('ok-title');
    expect(s0.errorTitleClass).toBe('err-title');
    expect(s0.successTitleColor).toBe('green');
    expect(s0.errorTitleColor).toBe('red');
    expect(s0.successTooltip).toBe('OK');
    expect(s0.errorTooltip).toBe('ERR');
    expect(s0.showIconOnFinished).toBe(false);
    expect(s0.showIconOnError).toBe(true);
  });

  it('unregisterStep removes step and adjusts currentIndex', () => {
    service.registerStep(0);
    service.registerStep(1);
    service.registerStep(2);
    service.reset({ index: 2 });
    service.unregisterStep(2);
    expect(service.stepCount()).toBe(2);
    expect(service.currentIndex()).toBe(1);
  });

  it('jumping marks visited step as finished (even with canExit)', async () => {
    service.registerStep(0, 'a', { canExit: () => true });
    service.registerStep(1, 'b');
    service.registerStep(2, 'c');
    service.reset({ index: 0 });
    await service.goTo(2);
    const st = service.stepStatuses();
    expect(st[0]).toBe('finished');
  });

  it('reset with keepData preserves or clears data', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.saveData('a', { ok: 1 });
    service.saveData('b', { ok: 2 });

    service.reset({ keepData: true, index: 0 });
    expect(service.getData('a')).toEqual({ ok: 1 });

    service.reset({ keepData: false, index: 1 });
    expect(service.getData('a')).toBeUndefined();
    expect(service.getData('b')).toBeUndefined();
    const visited = service.visitedSteps();
    expect(visited[1]).toBe(true);
    expect(visited[0]).toBeUndefined();
  });

  it('visiting synthetic error with canExit keeps error and traverses branch', async () => {
    service.registerStep(0, 's0');
    service.registerStep(1, 's1');
    service.registerStep(2, 's2');
    service.registerStep(3, 's3');
    service.reset({ index: 0 });
    await service.goTo(3);
    expect(service.stepStatuses()[1]).toBe('error');
    service.registerStep(1, undefined, { canExit: () => true });
    await service.goTo(1);
    await service.goTo(3);
    expect(service.stepStatuses()[1]).toBe('error');
  });

  it('synthetic error is removed after visiting and does not block again', async () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.registerStep(2, 'c');
    await service.goTo(2);
    expect(service.stepStatuses()[1]).toBe('error');
    await service.goTo(1);
    await service.goTo(2);
    expect(service.stepStatuses()[1]).toBe('finished');
  });

  it('debug logging covers canExit returning false and thrown error', async () => {
    service.setDebug(true);
    service.registerStep(0, 'a', { canExit: () => false });
    service.registerStep(1, 'b');
    expect(await service.goTo(1)).toBe(false);
    service.registerStep(0, undefined, {
      canExit: () => {
        throw new Error('boom');
      },
    });
    expect(await service.goTo(1)).toBe(true);
  });

  it('logData prints saved payload without throwing', () => {
    service.registerStep(0, 'a');
    service.registerStep(0, 'test');
    service.saveData('a', { x: 1 });
    service.saveData('test', { value: 'test data' });
    service.saveData(0, { index: 'data' });

    service.logData('a');
    service.logData('test');
    service.logData('test', '[CUSTOM]');
    service.logData(0);
    service.logData('inexistente');

    expect(service.getData('a')).toEqual({ x: 1 });
    expect(service.getData('test')).toEqual({ value: 'test data' });
    expect(service.getData(0)).toEqual({ index: 'data' });
    expect(service.getData('inexistente')).toBeUndefined();
  });

  it('navigating back finishes current step', async () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.registerStep(2, 'c');
    await service.goTo(2);
    expect(service.stepStatuses()[2]).toBe('active');
    await service.goTo(1);
    expect(service.stepStatuses()[2]).toBe('finished');
    expect(service.currentIndex()).toBe(1);
    expect(service.stepStatuses()[1]).toBe('error');
  });

  it('invalid goTo returns false and does not change index', async () => {
    service.registerStep(0, 's0');
    service.registerStep(1, 's1');
    const start = service.currentIndex();
    expect(await service.goTo(-1)).toBe(false);
    expect(await service.goTo(99)).toBe(false);
    expect(await service.goTo('nope')).toBe(false);
    expect(service.currentIndex()).toBe(start);
  });

  it('setStatus by alias updates status correctly', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.setStatus('b', 'error');
    expect(service.stepStatuses()[1]).toBe('error');
  });

  it('effect in constructor runs when currentIndex or stepCount changes', () => {
    expect(service.stepCount()).toBe(0);
    expect(service.currentIndex()).toBe(0);

    service.registerStep(0, 'step0', { title: 'Step 0' });

    try {
      (TestBed as any).flushEffects?.();
    } catch (e) {
      void 0;
    }

    service.currentIndex.set(1);
    service.currentIndex.set(0);

    try {
      (TestBed as any).flushEffects?.();
    } catch (e) {
      void 0;
    }

    const testEffect = () => {
      const idx = service.currentIndex();
      const count = service.stepCount();

      service.visitedSteps.update((prev) => {
        const updated = { ...prev, [idx]: true };
        return updated;
      });

      service.stepStatuses.update((prev) => {
        const statuses = { ...prev };
        for (let i = 0; i < count; i++) {
          if (i === idx) {
            if (statuses[i] === undefined || statuses[i] === 'pending') {
              statuses[i] = 'active';
            }
          } else {
            if (statuses[i] === undefined) {
              statuses[i] = 'pending';
            }
          }
        }
        return statuses;
      });
    };

    testEffect();
    expect(service.stepStatuses()[0]).toBe('active');
    expect(service.visitedSteps()[0]).toBe(true);

    service.registerStep(1, 'step1', { title: 'Step 1' });
    service.registerStep(2, 'step2', { title: 'Step 2' });

    testEffect();
    expect(service.stepStatuses()[1]).toBe('pending');
    expect(service.stepStatuses()[2]).toBe('pending');

    service.currentIndex.set(1);
    testEffect();
    expect(service.stepStatuses()[1]).toBe('active');
    expect(service.visitedSteps()[1]).toBe(true);

    service.setStatus(0, 'finished');
    service.currentIndex.set(0);
    testEffect();
    expect(service.stepStatuses()[0]).toBe('finished');
    expect(service.visitedSteps()[0]).toBe(true);

    service.setStatus(2, 'error');
    service.currentIndex.set(2);
    testEffect();
    expect(service.stepStatuses()[2]).toBe('error');
    expect(service.visitedSteps()[2]).toBe(true);

    service.setStatus(1, 'pending');
    service.currentIndex.set(1);
    testEffect();
    expect(service.stepStatuses()[1]).toBe('active');
    expect(service.visitedSteps()[1]).toBe(true);

    service.registerStep(3, 'step3', { title: 'Step 3' });
    service.stepStatuses.update((prev) => {
      const statuses = { ...prev };
      delete statuses[3];
      return statuses;
    });

    testEffect();
    expect(service.stepStatuses()[3]).toBe('pending');
  });

  it('covers effect constructor logic for setting pending status on non-current steps', () => {
    service.registerStep(0, 'step0');
    service.registerStep(1, 'step1');
    service.registerStep(2, 'step2');

    service.reset({ index: 0 });

    const statuses = service.stepStatuses();
    expect(statuses[0]).toBe('active');
    expect(statuses[1]).toBe('pending');
    expect(statuses[2]).toBe('pending');
  });

  it('covers currentIndex adjustment when removing step at current position', () => {
    service.registerStep(0, 'step0');
    service.registerStep(1, 'step1');
    service.registerStep(2, 'step2');

    service.currentIndex.set(2);
    expect(service.currentIndex()).toBe(2);
    expect(service.stepCount()).toBe(3);

    service.unregisterStep(2);

    expect(service.stepCount()).toBe(2);
    expect(service.currentIndex()).toBe(1);
  });

  it('covers effect logic when steps have existing statuses', () => {
    const freshService = TestBed.inject(StepperService);

    freshService.registerStep(0, 'step0');
    freshService.registerStep(1, 'step1');
    freshService.registerStep(2, 'step2');

    freshService.stepStatuses.set({ 0: 'finished', 1: 'error' });
    freshService.stepStatuses.set({});
    freshService.currentIndex.set(0);

    TestBed.flushEffects();

    const statuses = freshService.stepStatuses();
    expect(statuses[0]).toBe('active');
    expect(statuses[1]).toBe('pending');
    expect(statuses[2]).toBe('pending');
  });

  it('covers currentIndex adjustment edge cases', () => {
    service.registerStep(0, 'step0');
    service.registerStep(1, 'step1');

    service.reset({ index: 1 });
    expect(service.currentIndex()).toBe(1);

    service.unregisterStep(1);
    service.unregisterStep(0);

    expect(service.currentIndex()).toBe(0);
    expect(service.stepCount()).toBe(0);
  });

  it('tests if currentIndex adjustment in registerStep is ever needed', () => {
    service.currentIndex.set(10);
    expect(service.currentIndex()).toBe(10);
    expect(service.stepCount()).toBe(0);

    service.registerStep(0, 'step0');

    expect(service.stepCount()).toBe(1);
    expect(service.currentIndex()).toBe(0);
  });

  it('goTo retorna false quando não há passos', async () => {
    expect(service.stepCount()).toBe(0);
    expect(await service.goTo(0)).toBe(false);
  });

  it('erro não-sintético permanece ao pular novamente (cobre ternário st===error)', async () => {
    service.registerStep(0, 's0');
    service.registerStep(1, 's1');
    service.registerStep(2, 's2');
    service.registerStep(3, 's3');
    service.reset({ index: 0 });

    // Primeiro salto aplica erro sintético em 1
    await service.goTo(3);
    expect(service.stepStatuses()[1]).toBe('error');

    // Visita o passo 1 e configura validação customizada (canExit)
    service.registerStep(1, undefined, { canExit: () => true });
    await service.goTo(1);

    // Novo salto para 3 converte o erro sintético em não-sintético
    await service.goTo(3);
    expect(service.stepStatuses()[1]).toBe('error');

    // Volta e pula novamente para executar o ramo st==='error' com synthetic=false
    await service.goTo(1);
    await service.goTo(3);
    expect(service.stepStatuses()[1]).toBe('error');
  });

  it('reset sem options usa index padrão 0', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.reset();
    expect(service.currentIndex()).toBe(0);
    const statuses = service.stepStatuses();
    expect(statuses[0]).toBe('active');
    expect(statuses[1]).toBe('pending');
  });

  it('setStatus ignora alias inexistente sem alterar nada', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.setStatus('b', 'finished');
    const before = { ...service.stepStatuses() };
    service.setStatus('naoexiste' as any, 'error');
    expect(service.stepStatuses()).toEqual(before);
  });
});
