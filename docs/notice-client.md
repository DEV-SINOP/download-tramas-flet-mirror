# Sync de avisos no App

Esta é uma sugestão de arquitetura para o app desktop/CLI tratar avisos com histórico e controle de leitura.

## 1) Estrutura no servidor / launcher web

- `docs/notices.json` (ou equivalente via API): lista de avisos.
- Cada aviso deve ter campos:
  - `id` (string única)
  - `title` (string)
  - `message` (string)
  - `updated_at` (string ISO) 
  - `active` (bool)

## 2) Página HTML (docs/index.html)

- Exibe aviso atual (ativo) e histórico (todos ordenados por `updated_at`).

## 3) App local (inicialização)

- Tem arquivo de config local (ex: `config.json`) contendo lista de ids lidos:
  - `read_notices: ["notice-2026-03-10-1"]`

- Ao iniciar, app baixa `notices.json` e encontra `activeNotice`.
- Se `activeNotice.id` não está em `read_notices`:
  - exibe aviso para usuário
  - adiciona `activeNotice.id` em `read_notices` e salva config

- Se já estiver lido, ignora exibição.
