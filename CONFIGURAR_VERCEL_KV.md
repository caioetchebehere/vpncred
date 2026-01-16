# Configuração do Vercel KV

## O que é Vercel KV?

Vercel KV é um serviço de armazenamento Redis nativo do Vercel, gratuito no plano Hobby e muito mais simples de configurar que JSONBin.io.

## Vantagens

- ✅ Nativo do Vercel (não precisa de serviço externo)
- ✅ Gratuito no plano Hobby
- ✅ Configuração simples
- ✅ Alta performance
- ✅ Persistência garantida

## Como Configurar

### Passo 1: Criar o KV Store no Vercel

1. Acesse o dashboard do Vercel: https://vercel.com
2. Selecione seu projeto
3. Vá em **Storage** (no menu lateral)
4. Clique em **Create Database**
5. Selecione **KV** (Redis)
6. Dê um nome ao store (ex: `vpn-credentials`)
7. Selecione a região mais próxima (ex: `Washington, D.C. (iad1)`)
8. Clique em **Create**

### Passo 2: Conectar ao Projeto

1. Após criar o KV store, clique em **Connect**
2. Selecione seu projeto
3. O Vercel automaticamente adiciona as variáveis de ambiente necessárias:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Passo 3: Instalar a Dependência

A dependência `@vercel/kv` já foi adicionada ao `package.json`. Após fazer push, o Vercel instalará automaticamente.

### Passo 4: Fazer Redeploy

1. No Vercel, vá em **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Aguarde o deploy completar

## Verificação

Após configurar:

1. Faça upload de credenciais
2. Verifique os logs do Vercel - não deve mais aparecer erros de JSONBin
3. Tente gerar uma credencial - deve funcionar agora
4. Os dados devem persistir entre requisições

## Limites do Plano Gratuito

- 256 MB de armazenamento
- 30.000 operações/dia
- Perfeito para este caso de uso

## Notas

- Não é necessário configurar variáveis de ambiente manualmente - o Vercel faz isso automaticamente
- Os dados são armazenados no Redis do Vercel
- Muito mais rápido e confiável que JSONBin.io
- Funciona nativamente com Serverless Functions
