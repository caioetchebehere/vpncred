# 🔧 Como Configurar o Vercel Blob Storage

## ⚠️ Erro: "BLOB_READ_WRITE_TOKEN não configurado"

Se você está vendo este erro, significa que a variável de ambiente `BLOB_READ_WRITE_TOKEN` não está configurada no Vercel.

## 📋 Passo a Passo para Configurar

### Passo 1: Criar Blob Store no Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. No menu lateral, clique em **"Storage"** (ou "Storage" → "Create Database")
3. Clique em **"Create Database"**
4. Selecione **"Blob"**
5. Dê um nome ao seu Blob Store (ex: `vpn-credentials-store`)
6. Selecione a região (recomendado: mais próxima dos seus usuários)
7. Clique em **"Create"**

### Passo 2: Obter o Token de Leitura/Escrita

1. Após criar o Blob Store, clique nele para abrir
2. Vá na aba **"Settings"** (Configurações)
3. Role até a seção **"Tokens"** ou **"Access Tokens"**
4. Clique em **"Create Token"** ou **"Generate Token"**
5. Selecione **"Read/Write"** como tipo de permissão
6. Copie o token gerado (ele começa com `vercel_blob_rw_...`)
   - ⚠️ **IMPORTANTE:** Copie e salve este token em um local seguro. Você não poderá vê-lo novamente depois!

### Passo 3: Configurar Variável de Ambiente no Projeto

1. No Vercel Dashboard, vá para o seu projeto
2. Clique em **"Settings"** (Configurações)
3. No menu lateral, clique em **"Environment Variables"**
4. Clique em **"Add New"** ou **"Add"**
5. Preencha os campos:
   - **Name (Nome):** `BLOB_READ_WRITE_TOKEN`
   - **Value (Valor):** Cole o token que você copiou no Passo 2
   - **Environments (Ambientes):** Selecione TODOS:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Clique em **"Save"**

### Passo 4: Fazer Novo Deploy

Após adicionar a variável de ambiente, você precisa fazer um novo deploy:

**Opção A: Via GitHub (Automático)**
- Faça um commit e push qualquer (pode ser um commit vazio):
  ```bash
  git commit --allow-empty -m "Trigger redeploy"
  git push
  ```

**Opção B: Via Vercel Dashboard**
1. Vá em **"Deployments"**
2. Clique nos três pontos (⋯) do último deployment
3. Selecione **"Redeploy"**
4. Confirme o redeploy

**Opção C: Via CLI**
```bash
vercel --prod
```

### Passo 5: Verificar se Funcionou

1. Aguarde o deploy terminar
2. Acesse seu site
3. Tente fazer upload de credenciais
4. O erro não deve mais aparecer

## 🔍 Verificando se a Variável Está Configurada

### No Vercel Dashboard:
1. Vá em Settings → Environment Variables
2. Procure por `BLOB_READ_WRITE_TOKEN`
3. Verifique se está listada e se está ativa para todos os ambientes

### Nos Logs do Vercel:
1. Vá em Deployments → Selecione um deployment → Functions
2. Clique na função `/api/credentials`
3. Veja os logs - não deve aparecer o erro sobre token não configurado

## ❌ Problemas Comuns

### "Token inválido"
- Verifique se copiou o token completo
- Certifique-se de que não há espaços extras no início ou fim
- Gere um novo token se necessário

### "Ainda aparece o erro após configurar"
- Certifique-se de ter feito um novo deploy após adicionar a variável
- Verifique se a variável está configurada para o ambiente correto (Production, Preview, Development)
- Limpe o cache do navegador

### "Não consigo encontrar onde criar o Blob Store"
- Certifique-se de estar logado na conta correta do Vercel
- Verifique se sua conta tem acesso ao Vercel Blob (pode ser um plano pago)
- Tente acessar diretamente: https://vercel.com/dashboard/stores

## 📝 Notas Importantes

- ⚠️ **Nunca compartilhe o token publicamente**
- ⚠️ **Não commite o token no código** (ele já está no `.gitignore`)
- ✅ O token é específico para cada Blob Store
- ✅ Você pode ter múltiplos Blob Stores, cada um com seu próprio token

## 🆘 Ainda com Problemas?

Se após seguir todos os passos o erro persistir:

1. Verifique os logs detalhados no Vercel Dashboard
2. Certifique-se de que o Blob Store foi criado corretamente
3. Verifique se o token tem permissões de "Read/Write"
4. Tente criar um novo Blob Store e um novo token

## 📚 Documentação Oficial

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
