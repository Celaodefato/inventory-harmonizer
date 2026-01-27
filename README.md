# Inventory Harmonizer

Uma ferramenta para reconciliação de inventário de segurança entre múltiplas fontes.

## Objetivo
Garantir a conformidade de endpoints cruzando dados de 5 fontes principais:
- **Vicarius** (Vulnerability Management)
- **Cortex** (XDR)
- **Warp** (Zero Trust)
- **PAM - Senha Segura** (Privileged Access)
- **JumpCloud** (Directory/MDM)

A aplicação também cruza esses dados com uma lista de **Colaboradores Desligados** para identificar riscos de segurança (ex: usuário desligado com máquina ativa).

## Tecnologias
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Lucide React (Ícones)
- Vitest (Testes)

## Como Executar

### Pré-requisitos
- Node.js (v18+)
- npm ou bun

### Instalação
1. Clone o repositório
2. Instale as dependências:
   ```sh
   npm install
   ```

### Desenvolvimento
Inicie o servidor local:
```sh
npm run dev
```
A aplicação estará disponível em `http://localhost:8080`.

### Build
Para gerar a versão de produção:
```sh
npm run build
```
Os arquivos serão gerados na pasta `dist/`.

## Configuração
A aplicação pode funcionar em **Modo Demonstração** (com dados mockados) ou conectada às **APIs Reais**.

Para configurar as APIs:
1. Acesse a página **Configurar APIs** no menu lateral.
2. Insira as credenciais de cada ferramenta.
3. Ou faça upload de um arquivo **CSV** para cada ferramenta.

> [!NOTE]
> Nenhum dado sensível ou configuração de API é versionado no Git. Todas as configurações são armazenadas localmente no navegador (`localStorage`).

## Testes
Para rodar a suíte de testes:
```sh
npm test
```
