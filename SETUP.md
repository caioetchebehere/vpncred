# Configuração do Sistema de Credenciais VPN

## Problema Resolvido

O sistema agora usa uma API backend em vez de LocalStorage, permitindo que as credenciais sejam compartilhadas entre todos os usuários, independente do navegador.

## Configuração do Armazenamento

O sistema suporta duas formas de armazenamento:

### Opção 1: Armazenamento em Memória (Temporário)

Por padrão, o sistema funciona com armazenamento em memória. **IMPORTANTE**: Este armazenamento é temporário e os dados podem ser perdidos quando as funções serverless são reiniciadas.

### Opção 2: JSONBin.io (Recomendado - Persistente)

Para armazenamento persistente, configure o JSONBin.io:

1. Acesse [https://jsonbin.io](https://jsonbin.io) e crie uma conta gratuita
2. Crie um novo "Bin" (container de dados)
3. Copie o Bin ID e a API Key
4. No Vercel, vá em Settings > Environment Variables e adicione:
   - `JSONBIN_API_KEY`: Sua API Key do JSONBin.io
   - `JSONBIN_BIN_ID`: O ID do Bin criado
   - `JSONBIN_API_URL`: `https://api.jsonbin.io/v3/b` (padrão)

## Estrutura da API

O sistema possui os seguintes endpoints:

- `GET /api/get-credentials` - Busca todas as credenciais (disponíveis e utilizadas)
- `POST /api/upload-credentials` - Faz upload de novas credenciais
- `POST /api/generate-credential` - Gera/atribui uma credencial a um usuário

## Deploy no Vercel

1. Faça commit das alterações
2. Faça push para o repositório
3. O Vercel fará o deploy automaticamente
4. Configure as variáveis de ambiente se estiver usando JSONBin.io

## Notas

- As credenciais agora são compartilhadas entre todos os usuários
- O estado de admin (login) ainda é armazenado localmente no navegador (apenas para a sessão)
- A preferência de tema (dark/light mode) também é armazenada localmente
