# 🚀 Guia Rápido de Deploy no Vercel

## Passo 1: Criar Blob Store

1. Acesse https://vercel.com/dashboard
2. Clique em **"Storage"** no menu lateral
3. Clique em **"Create Database"**
4. Selecione **"Blob"**
5. Dê um nome ao seu Blob Store (ex: `vpn-credentials`)
6. Clique em **"Create"**
7. Após criar, vá em **"Settings"** do Blob Store
8. Copie o **"Read/Write Token"** (começa com `vercel_blob_rw_...`)

## Passo 2: Configurar Variáveis de Ambiente

1. No seu projeto Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Adicione uma nova variável:
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Cole o token copiado no Passo 1
   - **Environments:** Selecione Production, Preview e Development
3. Clique em **"Save"**

## Passo 3: Fazer Deploy

### Opção A: Via GitHub (Recomendado)

1. Faça push do código para um repositório GitHub
2. No Vercel Dashboard, clique em **"Add New Project"**
3. Conecte seu repositório GitHub
4. O Vercel detectará automaticamente as configurações
5. Clique em **"Deploy"**

### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# No diretório do projeto
vercel

# Siga as instruções na tela
```

## Passo 4: Verificar Deploy

Após o deploy, acesse a URL fornecida pelo Vercel. O sistema deve estar funcionando!

## 🔧 Troubleshooting

### Erro: "BLOB_READ_WRITE_TOKEN is not defined"
- Verifique se a variável de ambiente foi configurada corretamente
- Certifique-se de que o token está correto
- Faça um novo deploy após adicionar a variável

### Erro ao ler/escrever no Blob
- Verifique se o Blob Store foi criado
- Verifique se o token tem permissões de leitura/escrita
- Verifique os logs no Vercel Dashboard → Functions

### Dados não persistem
- Verifique se o token está configurado em todos os ambientes (Production, Preview, Development)
- Verifique os logs da função para erros

## 📝 Notas Importantes

- O token do Blob é sensível - nunca o compartilhe publicamente
- Cada ambiente (Production, Preview, Development) pode usar o mesmo token ou tokens diferentes
- Os dados são armazenados no Blob Store criado, não no LocalStorage do navegador
