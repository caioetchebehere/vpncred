# Guia Rápido de Deploy no Vercel

## Passo a Passo Simplificado

### 1. Preparar o Código
Certifique-se de que todos os arquivos estão no repositório:
- ✅ `api/credentials.js`
- ✅ `index.html`
- ✅ `app.js`
- ✅ `styles.css`
- ✅ `package.json`
- ✅ `vercel.json`

### 2. Criar Conta no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub, GitLab ou email

### 3. Criar Vercel KV (Banco de Dados)
1. No dashboard do Vercel, vá em **Storage**
2. Clique em **Create Database**
3. Selecione **KV** (Redis)
4. Escolha um nome (ex: `vpn-credentials-kv`)
5. Selecione o plano gratuito (Hobby)
6. Clique em **Create**

### 4. Fazer Deploy do Projeto

#### Opção A: Via GitHub/GitLab (Recomendado)
1. Faça push do código para um repositório Git
2. No Vercel, clique em **Add New Project**
3. Conecte seu repositório
4. O Vercel detectará automaticamente as configurações
5. Clique em **Deploy**

#### Opção B: Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel

# Seguir as instruções na tela
```

### 5. Conectar Vercel KV ao Projeto
1. Após o deploy, vá em **Settings** → **Storage**
2. Clique em **Connect** no banco KV criado
3. Isso criará automaticamente as variáveis de ambiente necessárias

### 6. Testar
1. Acesse a URL do projeto (ex: `https://seu-projeto.vercel.app`)
2. Faça login como admin:
   - Usuário: `admin`
   - Senha: `essilor@lux`
3. Faça upload de um arquivo TXT com credenciais
4. Teste gerar uma credencial

## Verificação de Funcionamento

### Testar API diretamente:
```bash
# Obter estatísticas
curl https://seu-projeto.vercel.app/api/credentials?action=stats

# Deve retornar:
# {"availableCount":0,"usedCount":0,"totalCount":0}
```

### Se houver erros:
1. Verifique os logs em **Deployments** → Seu deploy → **Functions**
2. Verifique se o Vercel KV está conectado em **Settings** → **Storage**
3. Verifique se as variáveis de ambiente estão configuradas

## Variáveis de Ambiente

O Vercel KV cria automaticamente estas variáveis quando conectado:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Não é necessário configurar manualmente!**

## Próximos Passos

Após o deploy bem-sucedido:
- ✅ Compartilhe a URL com os usuários
- ✅ Todos podem gerar credenciais
- ✅ Apenas admins podem fazer upload
- ✅ Dados são compartilhados entre todos os usuários

## Troubleshooting

### Erro: "Cannot find module '@vercel/kv'"
- Execute `npm install` localmente e faça commit do `package.json`

### Erro: "KV connection failed"
- Verifique se o Vercel KV está conectado ao projeto
- Verifique se as variáveis de ambiente foram criadas

### Erro: "Function timeout"
- Verifique os logs no dashboard do Vercel
- Pode ser necessário aumentar o timeout (plano pago)

### API não responde
- Verifique se a função está em `api/credentials.js`
- Verifique os logs em **Deployments** → **Functions**
