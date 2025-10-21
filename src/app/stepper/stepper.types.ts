import { TemplateRef, Type } from '@angular/core';

export type StepStatus = 'pending' | 'active' | 'finished' | 'error';
export type StepKey = number | string;

export interface StepGuards {
  canEnter?: (ctx: unknown) => boolean | Promise<boolean>;
  canExit?: (ctx: unknown) => boolean | Promise<boolean>;
}

export interface StepRegistration extends StepGuards {
  index: number;
  alias?: string;
  title?: string;
  tooltip?: string;
  cssClass?: string;
  componentType?: Type<unknown> | null;
  lazyLoader?: (() => Promise<Type<unknown>>) | null;
  contentTemplate?: TemplateRef<unknown> | null;
  contentHtml?: string | null;
  // Overrides por status (sucesso/falha)
  successIcon?: string;
  errorIcon?: string;
  successIconClass?: string;
  errorIconClass?: string;
  successIconColor?: string;
  errorIconColor?: string;
  successTitleClass?: string;
  errorTitleClass?: string;
  successTitleColor?: string;
  errorTitleColor?: string;
  successTooltip?: string;
  errorTooltip?: string;
  // Controle de exibição de ícones por status
  showIconOnFinished?: boolean;
  showIconOnError?: boolean;
}

export interface StepChangeEvent {
  from: StepKey;
  to: StepKey;
}
