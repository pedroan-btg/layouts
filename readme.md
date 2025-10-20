# Layouts

Projeto Angular (CLI 20.x) com foco em layouts e componentes de interface utilizando `fts-frontui`, `Bootstrap` e `ng-bootstrap`. Inclui um fluxo de passos (FormSteps) com seções como informações básicas, colaterais, créditos, documentos e revisão.

## Visão Geral
- Framework: Angular (standalone components)
- UI/UX: `fts-frontui` + `Bootstrap` + `ng-bootstrap`
- Porta de desenvolvimento: `4337` (configurada no `angular.json`)
- Build de produção: saída em `dist/layouts`
- Testes: Karma + Jasmine
- Lint: ESLint com regras Angular e Prettier
- Mock de API: Interceptor para dados de contratos em `src/app/core/mocks`

## Requisitos
- Node.js `>= 18.19` (recomendado LTS recente)
- NPM `>= 9` (ou Yarn, caso prefira)

## Instalação
```bash
npm install
```

## Scripts
Os principais scripts estão definidos em `package.json`:
- `npm start` — inicia o servidor de desenvolvimento (porta `4337`)
- `npm run build` — compila para produção
- `npm run test` — executa testes unitários com Karma
- `npm run watch` — build contínuo no modo desenvolvimento

## Desenvolvimento
```bash
npm start
# Abra http://localhost:4337/
```
- O servidor recarrega automaticamente ao salvar arquivos.
- O prefixo dos seletores é `fts` (ver regras em `eslint.config.js`).

## Estrutura Principal
- `src/app/app.ts` — componente raiz standalone (`App`).
- `src/app/FormStepsComponent/form-steps.component.*` — fluxo de passos (FormSteps):
  - `contents/basic-info` — listagem e paginação de contratos com tabela e formulário.
  - `contents/collateral` — gestão de colaterais (inclui modal e serviço).
  - `contents/credits` — conteúdo de créditos.
  - `contents/documents` — conteúdo de documentos.
  - `contents/review` — revisão das informações.

## Mock de API
- Interceptor: `src/app/core/mocks/interceptor/contratos.interceptor.ts`
- Dados: `src/app/core/mocks/json/contracts.json`
- Configuração de providers: `src/app/app.config.ts` (inclui `provideHttpClient` com interceptor)

## Build
```bash
npm run build
# artefatos em dist/layouts/
```
- Produção aplica otimizações e hashing conforme `angular.json`.

## Testes
```bash
npm run test
```
- Testes em Jasmine/Karma (ex.: `src/app/app.spec.ts`).

## Lint e Formatação
- ESLint: `eslint.config.js` com presets Angular e TypeScript.
- Prettier: `.prettierrc` e overrides para HTML via `package.json`.
- Executar (se tiver script): `npx eslint ./src --ext .ts,.html` e `npx prettier --write .`.

## Convenções
- `strict` TypeScript e Angular habilitados em `tsconfig.json`.
- Seletores e prefixos seguindo padrões definidos (ver ESLint).

## Dicas
- Se alterar a porta, ajuste em `angular.json > serve.options.port`.
- Verifique `ENV_CONFIG` em `app.config.ts` para ambiente e flags de log.

## Recursos
- Angular CLI: https://angular.dev/tools/cli
- Ng Bootstrap: https://ng-bootstrap.github.io/
- Bootstrap: https://getbootstrap.com/
- RxJS: https://rxjs.dev/
