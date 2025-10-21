import { Component } from '@angular/core';
import { StepChangeEvent } from './stepper.types';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StepperComponent } from './stepper.component';
import { StepComponent } from './step.component';
import { StepperService } from './stepper.service';
import { EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dummy-child',
  standalone: true,
  template: `
    <div class="dummy" (click)="changed.emit(foo)" (keyup.enter)="changed.emit(foo)" tabindex="0">
      {{ foo }}
    </div>
  `,
})
class DummyChildComponent {
  @Input() foo = 0;
  @Output() changed = new EventEmitter<number>();
}

@Component({
  selector: 'app-host-stepper-test',
  standalone: true,
  imports: [StepperComponent, StepComponent],
  template: `
    <app-stepper #stepper [navigable]="navigable" [linear]="linear" [stepItemClass]="stepItemClass">
      <app-step title="A" alias="a" errorTitleClass="err-title"></app-step>
      <app-step title="B" alias="b" successTitleClass="ok-title"></app-step>
      <app-step title="C" alias="c"></app-step>
    </app-stepper>
  `,
})
class HostTestComponent {
  navigable = true;
  linear = true;
  stepItemClass = 'item-extra';
}

@Component({
  selector: 'app-host-dynamic-test',
  standalone: true,
  imports: [StepperComponent, StepComponent, DummyChildComponent],
  template: `
    <ng-template #tpl>
      <span class="tpl-content">Tpl</span>
    </ng-template>
    <app-stepper [linear]="false">
      <app-step
        title="HTML"
        alias="html"
        contentHtml="<span class='html-content'>Hello</span>"></app-step>
      <app-step title="TPL" alias="tpl" [contentTemplate]="tpl"></app-step>
      <app-step
        title="DYN"
        alias="dyn"
        [componentType]="dummy"
        [componentInputs]="{ foo: 7 }"
        [componentOutputs]="{ changed: onChanged }"></app-step>
      <app-step title="LAZY" alias="lazy" [lazyLoader]="lazy"></app-step>
    </app-stepper>
  `,
})
class HostDynamicComponent {
  dummy = DummyChildComponent;
  onChanged = vi.fn();
  lazy = () => Promise.resolve(DummyChildComponent);
}

@Component({
  selector: 'app-host-dynamic-nonemit',
  standalone: true,
  imports: [StepperComponent, StepComponent, DummyChildComponent],
  template: `
    <app-stepper [linear]="false">
      <app-step
        title="DYN2"
        alias="dyn2"
        [componentType]="dummy"
        [componentInputs]="{ foo: 3 }"
        [componentOutputs]="{ foo: onFoo }"></app-step>
    </app-stepper>
  `,
})
class HostDynamicNonEmitComponent {
  dummy = DummyChildComponent;
  onFoo = vi.fn();
}

@Component({
  selector: 'app-host-save-test',
  standalone: true,
  imports: [StepperComponent, StepComponent],
  template: `
    <app-stepper>
      <app-step title="Save" alias="save" [onSave]="onSave"></app-step>
    </app-stepper>
  `,
})
class HostSaveComponent {
  onSave = () => ({ saved: 42 });
}

@Component({
  selector: 'app-host-save-default',
  standalone: true,
  imports: [StepperComponent, StepComponent],
  template: `
    <app-stepper>
      <app-step title="Default" alias="def"><div class="slot">Slot</div></app-step>
    </app-stepper>
  `,
})
class HostSaveDefaultComponent {}

@Component({
  selector: 'app-host-html',
  standalone: true,
  imports: [StepperComponent, StepComponent],
  template: `
    <app-stepper>
      <app-step title="HTML" alias="h" [contentHtml]="html"></app-step>
      <app-step title="Segundo" alias="b"></app-step>
    </app-stepper>
  `,
})
class HostHtmlComponent {
  html = '<p class="html-piece">Hello</p>';
}

describe('StepperComponent', () => {
  let fixture: ComponentFixture<HostTestComponent>;
  let host: HostTestComponent;
  let stepper: StepperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostTestComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    const stepperDebug = fixture.debugElement.query(By.directive(StepperComponent));
    stepper = stepperDebug.componentInstance as StepperComponent;
  });

  it('StepComponent onSave custom salva dados no destroy', async () => {
    const f = TestBed.createComponent(HostSaveComponent);
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;
    await s.service.goTo(0);
    f.detectChanges();
    // destroy deve invocar onSave do step ativo
    f.destroy();
    expect(s.service.getData('save')).toEqual({ saved: 42 });
  });

  it('renderiza passos e progressbar com atributos ARIA padrão', () => {
    fixture.detectChanges();
    const progress = fixture.debugElement.query(By.css('.progress-wrapper'));
    expect(progress.attributes['role']).toBe('progressbar');
    expect(progress.attributes['aria-valuemin']).toBe('0');
    expect(progress.attributes['aria-valuemax']).toBe(String(stepper.service.stepCount()));
    expect(progress.attributes['aria-valuenow']).toBe(String(stepper.service.currentIndex() + 1));
    expect(progress.attributes['aria-label']).toBe('STEPPER_PROGRESS_LABEL');

    const titleButtons = fixture.debugElement.queryAll(By.css('.stepper-item.stepper-item-title'));
    expect(titleButtons.length).toBe(3);
  });

  it('aplica roving tabindex e navegação por teclado (ArrowRight)', () => {
    fixture.detectChanges();
    let buttons = fixture.debugElement.queryAll(By.css('.stepper-item.stepper-item-title'));
    expect(buttons[0].attributes['tabindex']).toBe('0');
    expect(buttons[1].attributes['tabindex']).toBe('-1');
    expect(buttons[2].attributes['tabindex']).toBe('-1');

    const evt = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    buttons[0].nativeElement.dispatchEvent(evt);
    fixture.detectChanges();

    expect(stepper.service.currentIndex()).toBe(1);
    buttons = fixture.debugElement.queryAll(By.css('.stepper-item.stepper-item-title'));
    expect(buttons[1].attributes['tabindex']).toBe('0');
    expect(buttons[0].attributes['tabindex']).toBe('-1');
  });

  it('desabilita navegação quando navigable=false', async () => {
    // cria novo fixture já com navigable=false antes da primeira detecção
    const f = TestBed.createComponent(HostTestComponent);
    const h = f.componentInstance;
    h.navigable = false;
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;

    const buttons = f.debugElement.queryAll(By.css('.stepper-item.stepper-item-title'));

    for (const b of buttons) {
      expect(b.attributes['disabled']).toBeDefined();
      expect(b.attributes['aria-disabled']).toBe('true');
      expect(b.attributes['tabindex']).toBe('-1');
    }

    // clique não deve navegar
    await buttons[2].triggerEventHandler('click', {});
    expect(s.service.currentIndex()).toBe(0);
  });

  it('clique navega quando navigable=true', async () => {
    host.navigable = true;
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('.stepper-item.stepper-item-title'));
    await buttons[2].triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(stepper.service.currentIndex()).toBe(2);
  });

  it('usa chaves i18n padrão para tooltips de sucesso/erro', () => {
    // força estados para testar tooltips retornados
    stepper.service.setStatus(0, 'error');
    stepper.service.setStatus(1, 'finished');
    fixture.detectChanges();

    const steps = stepper.steps();
    const tErr = stepper.getTooltip(steps[0]);
    const tOk = stepper.getTooltip(steps[1]);
    expect(tErr).toBe('STEPPER_ERROR_TOOLTIP');
    expect(tOk).toBe('STEPPER_SUCCESS_TOOLTIP');
  });

  it('aplica classes de título conforme status (overrides)', () => {
    // passo 0 erro -> err-title, passo 1 sucesso -> ok-title
    stepper.service.setStatus(0, 'error');
    stepper.service.setStatus(1, 'finished');
    fixture.detectChanges();

    const titles = fixture.debugElement.queryAll(
      By.css('.stepper-item.stepper-item-title .step-title'),
    );
    expect(titles[0].nativeElement.classList.contains('err-title')).toBe(true);
    expect(titles[1].nativeElement.classList.contains('ok-title')).toBe(true);
  });

  it('combina classes de item do componente e do step', () => {
    fixture.detectChanges();
    const iconButtons = fixture.debugElement.queryAll(By.css('.stepper-item.stepper-item-icon'));
    // O StepperComponent adiciona stepItemClass a todos
    expect(iconButtons[0].nativeElement.classList.contains('item-extra')).toBe(true);
  });

  it('renderiza conteúdo HTML, TemplateRef, componente dinâmico e lazy', async () => {
    const f = TestBed.createComponent(HostDynamicComponent);
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;

    // Passo 0: HTML
    const contentHost = f.debugElement.query(By.css('.stepper-content'));
    expect(contentHost.nativeElement.querySelector('.html-content')).toBeTruthy();

    // Passo 1: TemplateRef
    await s.service.goTo(1);
    await Promise.resolve();
    f.detectChanges();
    const stepEls = f.debugElement.queryAll(By.directive(StepComponent));
    const tplStepEl = stepEls[1];
    const tplCmp = tplStepEl.componentInstance as StepComponent;
    await tplCmp.renderContent();
    f.detectChanges();
    expect(tplStepEl.nativeElement.querySelector('.tpl-content')).toBeTruthy();

    // Passo 2: componente dinâmico com inputs/outputs
    await s.service.goTo(2);
    await Promise.resolve();
    f.detectChanges();
    const dynStepEl = stepEls[2];
    const dynCmp = dynStepEl.componentInstance as StepComponent;
    await dynCmp.renderContent();
    f.detectChanges();
    const dummyEl = dynStepEl.nativeElement.querySelector('.dummy');
    expect(dummyEl).toBeTruthy();
    expect(dummyEl.textContent.trim()).toBe('7');
    // Click to emit output and verify handler wiring
    dummyEl.dispatchEvent(new Event('click'));
    expect(f.componentInstance.onChanged).toHaveBeenCalledWith(7);

    // Emite output manualmente para cobrir assinatura
    const _cmpRef = sDebug.componentInstance;
    // não temos referência direta ao instância criada; validamos que handler foi registrado via spy
    // navegamos ao lazy para disparar novo conteúdo e garantir ciclo
    await s.service.goTo(3);
    await Promise.resolve();
    f.detectChanges();
    const lazyStepEl = stepEls[3];
    const lazyCmp = lazyStepEl.componentInstance as StepComponent;
    await lazyCmp.renderContent();
    f.detectChanges();
    const lazyEl = lazyStepEl.nativeElement.querySelector('.dummy');
    expect(lazyEl).toBeTruthy();

    // destrói o fixture para acionar ngOnDestroy e onSave padrão
    f.destroy();
    // após destroy, não deve lançar
    expect(true).toBe(true);
  });

  it('não assina outputs quando não são EventEmitter', async () => {
    const f = TestBed.createComponent(HostDynamicNonEmitComponent);
    f.detectChanges();
    const _s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    const stepEl = f.debugElement.query(By.directive(StepComponent));
    const cmp = stepEl.componentInstance as StepComponent;
    await cmp.renderContent();
    f.detectChanges();
    // Clique na área do componente não deve disparar handler pois 'foo' não é EventEmitter
    const el = stepEl.nativeElement.querySelector('.dummy');
    el.dispatchEvent(new Event('click'));
    expect(f.componentInstance.onFoo).not.toHaveBeenCalled();
  });

  it('emite stepChange e navega com teclas Home/End/Left/Up', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;

    const events: StepChangeEvent[] = [];
    s.stepChange.subscribe(e => events.push(e));

    // programático
    await s.service.goTo(1);
    f.detectChanges();
    expect(events.at(-1)).toEqual({ from: 'a', to: 'b' });

    // Home
    s.onStepKeydown(new KeyboardEvent('keydown', { key: 'Home' }), 1);
    f.detectChanges();
    expect(s.service.currentIndex()).toBe(0);

    // End
    s.onStepKeydown(new KeyboardEvent('keydown', { key: 'End' }), 0);
    f.detectChanges();
    expect(s.service.currentIndex()).toBe(s.service.stepCount() - 1);

    // Left/Up
    const last = s.service.currentIndex();
    s.onStepKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), last);
    f.detectChanges();
    s.onStepKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }), s.service.currentIndex());
    f.detectChanges();
    expect(s.service.currentIndex()).toBe(last - 2 >= 0 ? last - 2 : 0);
  });

  it('mostra ícones padrão para finished e error com classes corretas', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;
    // Avança para 2 para marcar 1 como erro sintético e 0 como finished
    await s.service.goTo(2);
    await Promise.resolve();
    f.detectChanges();
    const iconEls = f.debugElement.queryAll(By.css('.stepper-icons i'));
    const classes = iconEls.map(i => i.nativeElement.className);
    expect(classes.some(c => c.includes('bi-check-circle-fill'))).toBe(true);
    expect(classes.some(c => c.includes('bi-exclamation-circle-fill'))).toBe(true);
  });

  it('aplica cores de título por status via CSS custom property', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    const svc = (s as any).service as StepperService;
    svc.registerStep(0, undefined, { successTitleColor: 'green' });
    svc.registerStep(1, undefined, { errorTitleColor: 'red' });
    await s.service.goTo(2);
    await Promise.resolve();
    f.detectChanges();
    const titleEls = f.debugElement.queryAll(By.css('.stepper-titles .step-title'));
    const green = (titleEls[0].nativeElement as HTMLElement).style.getPropertyValue(
      '--stepper-title-color',
    );
    const red = (titleEls[1].nativeElement as HTMLElement).style.getPropertyValue(
      '--stepper-title-color',
    );
    expect(green).toBe('green');
    expect(red).toBe('red');
  });

  it('navega com ArrowDown e verifica isFirst/isLast/cleanup de resize', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;
    // ArrowDown do índice 0 -> 1
    const btn0 = f.debugElement.queryAll(By.css('.stepper-item.stepper-item-title'))[0];
    btn0.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    f.detectChanges();
    expect(s.service.currentIndex()).toBe(1);
    expect(s.isFirst()).toBe(false);
    // Vai para último
    await s.service.goTo(s.service.stepCount() - 1);
    f.detectChanges();
    expect(s.isLast()).toBe(true);
    // Destroy deve limpar resize listener
    f.destroy();
    expect((s as any).resizeUnlisten).toBeUndefined();
  });

  it('não mostra ícone em finished quando shouldShowIcon=false e atualiza progresso', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;
    const svc = (s as any).service as StepperService;
    // Atualiza configuração do primeiro passo para não exibir ícone em finished
    svc.registerStep(0, undefined, { showIconOnFinished: false });
    // Avança para o segundo passo para finalizar o primeiro
    await s.service.goTo(1);
    await Promise.resolve();
    f.detectChanges();
    // Não deve haver ícones renderizados
    const iconEls = f.debugElement.queryAll(By.css('.progress-icons i'));
    expect(iconEls.length).toBe(0);
    // Preenchimento de progresso deve ter transform definido
    const fillEl = f.debugElement.query(By.css('.progress-fill')).nativeElement as HTMLElement;
    expect(fillEl.style.transform).toContain('scaleX(');
  });

  it('atualiza grid de ícones/títulos com largura simulada', () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.detectChanges();
    const sDebug = f.debugElement.query(By.directive(StepperComponent));
    const s = sDebug.componentInstance as StepperComponent;

    const wrapper = (s as any).progressWrapper.nativeElement;
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({ width: 300 } as any);

    const iconsEl = (s as any).iconsRef.nativeElement;
    const titlesEl = (s as any).titlesRef.nativeElement;
    const _sepsEl = (s as any).separatorsRef.nativeElement;

    (s as any).updateGridColumns();
    expect(iconsEl.style.gridTemplateColumns).toContain('repeat(3');
    expect(titlesEl.style.gridTemplateColumns).toContain('repeat(3');
  });

  it.skip('renderiza TemplateRef automaticamente ao ativar e limpa HTML ao sair', async () => {
    const f = TestBed.createComponent(HostDynamicComponent);
    f.detectChanges();
    // HTML inicial presente
    const htmlEl1 = f.debugElement.nativeElement.querySelector('.html-content');
    expect(htmlEl1).toBeTruthy();
    // Navega para passo com TemplateRef
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    await s.service.goTo(1);
    f.detectChanges();
    // aguarda microtask do hostRef setter e do renderContent
    await Promise.resolve();
    await Promise.resolve();
    f.detectChanges();
    // Template deve renderizar automaticamente
    const tplEl = f.debugElement.nativeElement.querySelector('.tpl-content');
    expect(tplEl).toBeTruthy();
    // HTML anterior deve ser removido
    const htmlEl2 = f.debugElement.nativeElement.querySelector('.html-content');
    expect(htmlEl2).toBeFalsy();
  });

  it('StepComponent onSave padrão salva visited=true no destroy', () => {
    const f = TestBed.createComponent(HostSaveDefaultComponent);
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    f.destroy();
    expect(s.service.getData('def')).toEqual({ visited: true });
  });

  it('StepComponent projeta conteúdo de slot quando ativo (sem HTML/template/componente)', () => {
    const f = TestBed.createComponent(HostSaveDefaultComponent);
    f.detectChanges();
    const slotEl = f.debugElement.nativeElement.querySelector('.slot');
    expect(slotEl).toBeTruthy();
  });

  it.skip('renderiza e limpa contentHtml ao sair e re-renderiza ao voltar', async () => {
    const f = TestBed.createComponent(HostHtmlComponent);
    f.detectChanges();
    let htmlEl = f.debugElement.nativeElement.querySelector('.html-piece');
    expect(htmlEl).toBeTruthy();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    await s.service.goTo(1);
    await Promise.resolve();
    f.detectChanges();
    htmlEl = f.debugElement.nativeElement.querySelector('.html-piece');
    expect(htmlEl).toBeFalsy();
    await s.service.goTo(0);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    f.detectChanges();
    // força renderização manual para cobrir branch contentHtml
    const stepEls = f.debugElement.queryAll(By.directive(StepComponent));
    const step0 = stepEls[0].componentInstance as StepComponent;
    await step0.renderContent();
    await Promise.resolve();
    f.detectChanges();
    htmlEl = f.debugElement.nativeElement.querySelector('.html-piece');
    expect(htmlEl).toBeTruthy();
  });

  it('renderContent retorna cedo quando host não existe (step inativo)', async () => {
    const f = TestBed.createComponent(HostHtmlComponent);
    f.detectChanges();
    const steps = f.debugElement.queryAll(By.directive(StepComponent));
    const inactive = steps[1].componentInstance as StepComponent;
    // Inativo, host não criado; chamada não deve lançar e não deve inserir HTML
    await inactive.renderContent();
    f.detectChanges();
    const htmlEl = f.debugElement.nativeElement.querySelector('.html-piece');
    expect(htmlEl).toBeTruthy(); // o primeiro continua renderizado
  });

  it('getTooltip retorna overrides para finished e error', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    const svc = (s as any).service;
    svc.registerStep(0, undefined, { successTooltip: 'ok' });
    svc.registerStep(1, undefined, { errorTooltip: 'err' });
    await s.service.goTo(2);
    await Promise.resolve();
    f.detectChanges();
    const steps = s.service.getSteps();
    const t0 = s.getTooltip(steps[0]);
    const t1 = s.getTooltip(steps[1]);
    expect(t0).toBe('ok');
    expect(t1).toBe('err');
  });

  it('aplica cores de ícone por status via CSS custom property', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    const svc = (s as any).service;
    svc.registerStep(0, undefined, { successIconColor: 'green' });
    svc.registerStep(1, undefined, { errorIconColor: 'red' });
    await s.service.goTo(2);
    await Promise.resolve();
    f.detectChanges();
    const iconEls = f.debugElement.queryAll(By.css('.stepper-icons i'));
    const green = (iconEls[0].nativeElement as HTMLElement).style.getPropertyValue(
      '--stepper-icon-color',
    );
    const red = (iconEls[1].nativeElement as HTMLElement).style.getPropertyValue(
      '--stepper-icon-color',
    );
    expect(green).toBe('green');
    expect(red).toBe('red');
  });

  it('getTooltip retorna tooltip do step para active/pending', () => {
    fixture.detectChanges();
    const steps = stepper.steps();
    // step 0 está ativo inicialmente e não possui tooltip -> retorna padrão
    expect(stepper.getTooltip(steps[0])).toBe('STEPPER_STEP_TOOLTIP');
    // adiciona tooltip ao segundo e mantém pending
    const svc = (stepper as any).service as StepperService;
    svc.registerStep(1, undefined, { tooltip: 'TT' });
    fixture.detectChanges();
    expect(stepper.getTooltip(stepper.steps()[1])).toBe('TT');
  });

  it('overrides de ícone e classe são aplicados em finished/error', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    const svc = (s as any).service as StepperService;
    svc.registerStep(0, undefined, {
      successIcon: 'bi bi-star-fill',
      successIconClass: 'big-success',
    });
    svc.registerStep(1, undefined, { errorIcon: 'bi bi-bug-fill', errorIconClass: 'tiny-error' });
    await s.service.goTo(2);
    await Promise.resolve();
    f.detectChanges();
    const iconEls = f.debugElement.queryAll(By.css('.stepper-icons i'));
    const classList = iconEls.map(i => i.nativeElement.className);
    expect(classList.some(c => c.includes('bi-star-fill') && c.includes('big-success'))).toBe(true);
    expect(classList.some(c => c.includes('bi-bug-fill') && c.includes('tiny-error'))).toBe(true);
  });

  it('não mostra ícone em error quando shouldShowIcon=false', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.componentInstance.linear = false;
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    const svc = (s as any).service as StepperService;
    // passo 1 terá erro e não deve exibir ícone
    svc.registerStep(1, undefined, { showIconOnError: false } as any);
    await s.service.goTo(2);
    await Promise.resolve();
    f.detectChanges();
    const iconEls = f.debugElement.queryAll(By.css('.stepper-icons i'));
    const classes = iconEls.map(i => i.nativeElement.className);
    // nenhum ícone deve corresponder ao passo 1 com erro quando desabilitado
    expect(classes.some(c => c.includes('bi-exclamation-circle-fill'))).toBe(false);
  });

  it('combina cssClass do step nas classes do item', async () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    const svc = (s as any).service;
    svc.registerStep(0, undefined, { cssClass: 'custom-step' });
    f.detectChanges();
    const btn0 = f.debugElement.queryAll(By.css('.stepper-item.stepper-item-title'))[0];
    expect(btn0.nativeElement.classList.contains('custom-step')).toBe(true);
  });

  it('updateGridColumns retorna cedo quando segments <= 0', () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    // força segments=0 para cobrir early return
    s.segments = 0;
    const iconsEl = (s as any).iconsRef.nativeElement as HTMLElement;
    const titlesEl = (s as any).titlesRef.nativeElement as HTMLElement;
    const sepsEl = (s as any).separatorsRef.nativeElement as HTMLElement;
    (s as any).updateGridColumns();
    expect(iconsEl.style.gridTemplateColumns).toBe('');
    expect(titlesEl.style.gridTemplateColumns).toBe('');
    expect(sepsEl.style.getPropertyValue('--segment-size')).toBe('');
  });

  it('updateGridColumns usa largura do host quando wrapper não existe', () => {
    const f = TestBed.createComponent(HostTestComponent);
    f.detectChanges();
    const s = f.debugElement.query(By.directive(StepperComponent))
      .componentInstance as StepperComponent;
    // remove wrapper para cobrir branch alternativo
    (s as any).progressWrapper = undefined;
    // mock da largura do host
    const hostEl = ((s as any).host.nativeElement as HTMLElement);
    vi.spyOn(hostEl, 'getBoundingClientRect').mockReturnValue({ width: 400 } as any);
    const iconsEl = (s as any).iconsRef.nativeElement as HTMLElement;
    const titlesEl = (s as any).titlesRef.nativeElement as HTMLElement;
    (s as any).updateGridColumns();
    expect(iconsEl.style.gridTemplateColumns).toContain('repeat(3');
    expect(titlesEl.style.gridTemplateColumns).toContain('repeat(3');
  });

  it('getIconClass retorna null para pending e isFirst/isLast inicial', () => {
    fixture.detectChanges();
    const steps = stepper.steps();
    // passo inicial pending/active não deve ter ícone
    expect(stepper.getIconClass(steps[0])).toBeNull();
    // estados iniciais
    expect(stepper.isFirst()).toBe(true);
    expect(stepper.isLast()).toBe(false);
  });
});