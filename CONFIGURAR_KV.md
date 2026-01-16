# 🔧 Como Configurar o Vercel KV - Solução do Erro

## ⚠️ Erro Atual
```
Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN
```

Este erro ocorre porque o **Vercel KV não está conectado ao seu projeto**.

## ✅ Solução Passo a Passo

### Passo 1: Acessar o Dashboard do Vercel
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Faça login na sua conta

### Passo 2: Verificar se o Vercel KV Existe
1. No menu lateral, clique em **Storage**
2. Verifique se existe um banco KV criado
   - ✅ **Se existe:** Pule para o Passo 4
   - ❌ **Se não existe:** Continue no Passo 3

### Passo 3: Criar o Vercel KV (se não existir)
1. Em **Storage**, clique em **Create Database**
2. Selecione **KV** (Redis)
3. Escolha um nome (ex: `vpn-credentials-kv`)
4. Selecione o plano **Hobby** (gratuito)
5. Escolha a região mais próxima
6. Clique em **Create**

### Passo 4: Conectar o KV ao Projeto
1. No dashboard do Vercel, vá para o seu projeto (ex: `vpncred`)
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Storage**
4. Você verá a lista de bancos KV disponíveis
5. Encontre o banco KV que você criou (ou precisa criar)
6. Clique no botão **Connect** ao lado do banco KV
7. Aguarde a confirmação de conexão

### Passo 5: Verificar Variáveis de Ambiente
Após conectar, o Vercel criará automaticamente estas variáveis:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

Para verificar:
1. Vá em **Settings** → **Environment Variables**
2. Você deve ver as 3 variáveis listadas acima

### Passo 6: Fazer Novo Deploy (Importante!)
Após conectar o KV, você precisa fazer um novo deploy:
1. Vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do último deploy
3. Selecione **Redeploy**
4. Ou faça um novo commit e push (se usar Git)

### Passo 7: Testar
1. Acesse sua aplicação
2. Tente fazer upload novamente
3. O erro deve desaparecer!

## 📸 Guia Visual

### Onde encontrar Storage:
```
Dashboard → [Seu Projeto] → Settings → Storage
```

### Onde conectar:
```
Settings → Storage → [Lista de KV] → Botão "Connect"
```

## ❓ Problemas Comuns

### "Não vejo a opção Storage"
- Certifique-se de estar logado na conta correta
- Verifique se está no projeto correto
- A opção Storage pode estar no menu lateral esquerdo

### "O botão Connect não aparece"
- Verifique se você tem permissões de administrador no projeto
- Tente criar um novo banco KV

### "As variáveis não aparecem após conectar"
- Faça um novo deploy (Redeploy)
- Aguarde alguns minutos e verifique novamente
- Tente desconectar e reconectar o KV

### "Ainda dá erro após conectar"
1. Verifique se fez um novo deploy após conectar
2. Verifique os logs em **Deployments** → **Functions**
3. Certifique-se de que as variáveis estão nas variáveis de ambiente

## 🎯 Checklist Rápido

- [ ] Vercel KV criado em Storage
- [ ] KV conectado ao projeto (Settings → Storage → Connect)
- [ ] Variáveis de ambiente criadas automaticamente
- [ ] Novo deploy realizado após conectar
- [ ] Teste o upload novamente

## 💡 Dica

Se você ainda tiver problemas, verifique os logs em tempo real:
1. Vá em **Deployments** → Seu último deploy
2. Clique em **Functions**
3. Veja os logs da função `api/credentials.js`
4. Isso mostrará exatamente qual é o problema

## 📞 Ainda com Problemas?

Se após seguir todos os passos o erro persistir:
1. Verifique se o `package.json` tem `@vercel/kv` nas dependências
2. Verifique se o arquivo `api/credentials.js` existe
3. Verifique os logs detalhados no dashboard do Vercel
