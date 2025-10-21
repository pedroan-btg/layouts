import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StepperService } from './stepper.service';

describe('StepperService', () => {
  let service: StepperService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [StepperService],
    }).compileComponents();
    service = TestBed.inject(StepperService);
  });

  it('registra passos e mapeia alias corretamente', () => {
    service.registerStep(0, 'inicio');
    service.registerStep(1, 'meio');
    service.registerStep(2, 'fim');

    expect(service.stepCount()).toBe(3);
    expect(service.aliasToIndex()['inicio']).toBe(0);
    expect(service.aliasToIndex()['meio']).toBe(1);
    expect(service.aliasToIndex()['fim']).toBe(2);
  });

  it('lança erro ao registrar alias duplicado', () => {
    service.registerStep(0, 'dup');
    expect(() => service.registerStep(1, 'dup')).toThrowError();
  });

  it('navega com goTo e atualiza statuses (salto aplica erro sintético)', async () => {
    service.registerStep(0, 's0');
    service.registerStep(1, 's1');
    service.registerStep(2, 's2');
    // inicializa estados explicitamente no índice 0
    service.reset({ index: 0 });

    // índice inicial ativo é 0
    expect(service.currentIndex()).toBe(0);
    expect(service.stepStatuses()[0]).toBe('active');

    // saltar para o índice 2
    const ok = await service.goTo(2);
    expect(ok).toBe(true);
    expect(service.currentIndex()).toBe(2);

    const statuses = service.stepStatuses();
    // passo 0 foi visitado, torna-se finished
    expect(statuses[0]).toBe('finished');
    // passo 1 não visitado, deve ser marcado como error
    expect(statuses[1]).toBe('error');
    // destino ativo
    expect(statuses[2]).toBe('active');

    // voltando um passo, o atual active vira finished
    const back = await service.goTo(1);
    expect(back).toBe(true);
    const statuses2 = service.stepStatuses();
    expect(service.currentIndex()).toBe(1);
    expect(statuses2[2]).toBe('finished');
    // ao voltar, destino mantém 'error' se já estava com erro (não força 'active')
    expect(statuses2[1]).toBe('error');
  });

  it('prev/next respeitam limites e retornam boolean', async () => {
    service.registerStep(0);
    service.registerStep(1);
    service.registerStep(2);

    // posição inicial
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

  it('setStatus por índice e alias', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.setStatus(0, 'finished');
    service.setStatus('b', 'error');

    const st = service.stepStatuses();
    expect(st[0]).toBe('finished');
    expect(st[1]).toBe('error');
  });

  it('reset controla visited, statuses e dados', () => {
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

    // apenas índice inicial está marcado como visitado
    const visited = service.visitedSteps();
    expect(visited[1]).toBe(true);
    expect(visited[0]).toBeUndefined();
    expect(visited[2]).toBeUndefined();

    // dados foram limpos
    expect(service.getData('a')).toBeUndefined();
  });

  // Removido: teste de console, já que o serviço não loga mais diretamente

  it('linear e debug signals podem ser configurados', () => {
    // Os sinais são funções; configuramos via set
    service.linear.set(true);
    service.debug.set(true);
    expect(service.linear()).toBe(true);
    expect(service.debug()).toBe(true);
  });

  it('setLinear e setDebug atualizam sinais', () => {
    service.setLinear(true);
    service.setDebug(true);
    expect(service.linear()).toBe(true);
    expect(service.debug()).toBe(true);
  });

  it('bloqueia navegação quando canExit retorna false', async () => {
    service.registerStep(0, 'a', { canExit: () => false });
    service.registerStep(1, 'b');
    service.reset({ index: 0 });
    const res = await service.goTo(1);
    expect(res).toBe(false);
    expect(service.currentIndex()).toBe(0);
    expect(service.stepStatuses()[0]).toBe('active');
  });

  it('prossegue navegação quando canExit lança erro', async () => {
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

  it('atualiza registro existente com registerStep novamente', () => {
    service.registerStep(0, 'x', { title: 'A' });
    service.registerStep(0, undefined, { tooltip: 'T' });
    const s0 = service.getSteps()[0];
    expect(s0.title).toBe('A');
    expect(s0.tooltip).toBe('T');
  });

  it('registerStep update cobre overrides de ícones, títulos e tooltips', () => {
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

  it('unregisterStep remove passo e ajusta currentIndex', () => {
    service.registerStep(0);
    service.registerStep(1);
    service.registerStep(2);
    service.reset({ index: 2 });
    service.unregisterStep(2);
    expect(service.stepCount()).toBe(2);
    expect(service.currentIndex()).toBe(1);
  });

  it('ao pular, passo visitado torna-se finished (mesmo com canExit)', async () => {
    service.registerStep(0, 'a', { canExit: () => true });
    service.registerStep(1, 'b');
    service.registerStep(2, 'c');
    service.reset({ index: 0 });
    await service.goTo(2);
    const st = service.stepStatuses();
    expect(st[0]).toBe('finished');
  });

  it('reset com keepData=true preserva dados', () => {
    service.registerStep(0, 'a');
    service.saveData('a', { ok: 1 });
    service.reset({ keepData: true, index: 0 });
    expect(service.getData('a')).toEqual({ ok: 1 });
  });

  it('reset com keepData=false limpa dados e visita apenas índice inicial', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.saveData('a', { ok: 1 });
    service.saveData('b', { ok: 2 });
    service.reset({ keepData: false, index: 1 });
    expect(service.getData('a')).toBeUndefined();
    expect(service.getData('b')).toBeUndefined();
    const visited = service.visitedSteps();
    expect(visited[1]).toBe(true);
    expect(visited[0]).toBeUndefined();
  });

  it('ao visitar erro sintético com canExit, mantém erro e percorre ramo', async () => {
    service.registerStep(0, 's0');
    service.registerStep(1, 's1');
    service.registerStep(2, 's2');
    service.registerStep(3, 's3');
    service.reset({ index: 0 });
    // Pula para 3 para criar erro sintético em 1
    await service.goTo(3);
    expect(service.stepStatuses()[1]).toBe('error');
    // Atualiza registro 1 para possuir canExit
    service.registerStep(1, undefined, { canExit: () => true });
    // Visita 1
    await service.goTo(1);
    // Avança novamente para 3 para percorrer ramo de erro sintético com canExit
    await service.goTo(3);
    expect(service.stepStatuses()[1]).toBe('error');
  });

  it('erro sintético é removido após visitar e não bloquear novamente', async () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.registerStep(2, 'c');
    // Pula 0->2, gerando erro sintético em 1
    await service.goTo(2);
    expect(service.stepStatuses()[1]).toBe('error');
    // Visita 1 e volta para 2, erro deve virar finished
    await service.goTo(1);
    await service.goTo(2);
    expect(service.stepStatuses()[1]).toBe('finished');
  });

  it('debug logging cobre canExit retornando false e erro lançado', async () => {
    service.setDebug(true);
    service.registerStep(0, 'a', { canExit: () => false });
    service.registerStep(1, 'b');
    // bloqueio por canExit=false
    expect(await service.goTo(1)).toBe(false);
    // agora lança erro
    service.registerStep(0, undefined, {
      canExit: () => {
        throw new Error('boom');
      },
    });
    expect(await service.goTo(1)).toBe(true);
  });

  it('logData imprime payload salvo sem lançar', () => {
    service.registerStep(0, 'a');
    service.saveData('a', { x: 1 });
    service.logData('a');
    expect(service.getData('a')).toEqual({ x: 1 });
  });

  it('navegar para trás finaliza passo atual', async () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.registerStep(2, 'c');
    await service.goTo(2);
    expect(service.stepStatuses()[2]).toBe('active');
    await service.goTo(1);
    expect(service.stepStatuses()[2]).toBe('finished');
    expect(service.currentIndex()).toBe(1);
    expect(service.stepStatuses()[1]).toBe('error'); // erro persistente ao visitar step marcado como não visitado
  });

  it('goTo inválido retorna false e não altera índice', async () => {
    service.registerStep(0, 's0');
    service.registerStep(1, 's1');
    const start = service.currentIndex();
    expect(await service.goTo(-1)).toBe(false);
    expect(await service.goTo(99)).toBe(false);
    expect(await service.goTo('nope')).toBe(false);
    expect(service.currentIndex()).toBe(start);
  });

  it('setStatus por alias atualiza status corretamente', () => {
    service.registerStep(0, 'a');
    service.registerStep(1, 'b');
    service.setStatus('b', 'error');
    expect(service.stepStatuses()[1]).toBe('error');
  });
});
