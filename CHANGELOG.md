# Changelog - Configuração para Vercel

## Alterações Realizadas

### ✅ Armazenamento Compartilhado
- **Antes:** Credenciais armazenadas no LocalStorage (específico de cada navegador)
- **Agora:** Credenciais armazenadas no Vercel KV (compartilhadas entre todos os usuários)

### ✅ API Serverless
- Criada API em `api/credentials.js` usando Vercel Functions
- Endpoints disponíveis:
  - `GET /api/credentials?action=all` - Obter todas as credenciais
  - `GET /api/credentials?action=stats` - Obter estatísticas
  - `POST /api/credentials` - Upload ou gerar credenciais

### ✅ Frontend Atualizado
- `app.js` modificado para usar API ao invés de LocalStorage
- Mantido LocalStorage apenas para tema escuro e estado de admin (local)
- Auto-preenchimento do número da filial ao selecionar usuário

### ✅ Configuração do Vercel
- `package.json` criado com dependências necessárias
- `vercel.json` configurado para roteamento
- `.gitignore` criado

### ✅ Documentação
- `README.md` atualizado com instruções de deploy
- `DEPLOY.md` criado com guia passo a passo
- Instruções para configurar Vercel KV

## Funcionalidades Mantidas

✅ Autenticação de administrador  
✅ Upload de credenciais (arquivo TXT)  
✅ Geração de credenciais  
✅ Validação de senhas  
✅ Exportação para Excel  
✅ Alertas de estoque baixo  
✅ Tema escuro/claro  
✅ Interface responsiva  

## Novas Funcionalidades

✅ **Multi-usuário:** Vários usuários podem acessar simultaneamente  
✅ **Dados compartilhados:** Upload de um admin é visível para todos  
✅ **Persistência:** Dados salvos no Vercel KV (não se perdem ao limpar cache)  
✅ **Auto-preenchimento:** Número da filial preenchido automaticamente  

## Como Funciona Agora

1. **Upload de Credenciais:**
   - Admin faz upload → Dados salvos no Vercel KV
   - Todos os usuários veem as credenciais disponíveis

2. **Geração de Credenciais:**
   - Qualquer usuário pode gerar credenciais
   - Credencial é removida do estoque e adicionada às usadas
   - Mudanças são visíveis para todos imediatamente

3. **Armazenamento:**
   - Vercel KV armazena:
     - `vpn:available` - Lista de credenciais disponíveis
     - `vpn:used` - Lista de credenciais utilizadas

## Próximos Passos

1. Fazer deploy no Vercel (ver `DEPLOY.md`)
2. Configurar Vercel KV
3. Testar o sistema
4. Compartilhar URL com usuários
