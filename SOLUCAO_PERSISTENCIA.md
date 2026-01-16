# Solução para Persistência de Dados

## Problema Identificado

O sistema está funcionando, mas os dados não persistem entre requisições porque o **Vercel Serverless Functions não mantém estado em memória** entre diferentes invocações. Cada requisição pode estar em uma instância diferente do servidor.

## Sintomas

- ✅ Upload funciona e processa as credenciais
- ✅ Os números atualizam no frontend após upload
- ❌ Ao tentar gerar uma credencial, aparece "Não há credenciais disponíveis"
- ❌ Os dados são perdidos quando a função serverless é reiniciada

## Solução: Usar Vercel KV (Recomendado)

O sistema agora usa **Vercel KV** (Redis nativo do Vercel) para persistência de dados. É gratuito, nativo e muito mais simples de configurar.

Consulte `CONFIGURAR_VERCEL_KV.md` para instruções detalhadas.

## Solução Alternativa: JSONBin.io (Descontinuada)

### Passo 1: Criar conta no JSONBin.io

1. Acesse https://jsonbin.io
2. Crie uma conta gratuita (não requer cartão de crédito)
3. Faça login

### Passo 2: Criar um Bin

1. No dashboard, clique em "Create Bin"
2. Deixe o bin vazio ou adicione esta estrutura inicial:
   ```json
   {
     "availableCredentials": [],
     "usedCredentials": []
   }
   ```
3. Copie o **Bin ID** (aparece na URL ou no dashboard)
4. Vá em "API Keys" e copie sua **X-Master-Key**

### Passo 3: Configurar no Vercel

1. Acesse o dashboard do Vercel: https://vercel.com
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione as seguintes variáveis:

   **Nome:** `JSONBIN_API_KEY`  
   **Valor:** Sua X-Master-Key do JSONBin.io  
   **Environment:** Production, Preview, Development (marque todos)

   **Nome:** `JSONBIN_BIN_ID`  
   **Valor:** O ID do Bin criado  
   **Environment:** Production, Preview, Development (marque todos)

   **Nome:** `JSONBIN_API_URL`  
   **Valor:** `https://api.jsonbin.io/v3/b`  
   **Environment:** Production, Preview, Development (marque todos)

5. Clique em **Save**

### Passo 4: Fazer Redeploy

1. No Vercel, vá em **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Aguarde o deploy completar

## Verificação

Após configurar:

1. Faça upload de credenciais
2. Tente gerar uma credencial
3. Os dados devem persistir mesmo após reiniciar as funções

## Limites do Plano Gratuito do JSONBin.io

- 10.000 requisições/mês
- Dados ilimitados
- Perfeito para uso em produção pequeno/médio

## Alternativas

Se preferir não usar JSONBin.io, você pode usar:
- Vercel KV (Redis) - Requer upgrade do plano
- MongoDB Atlas - Gratuito até 512MB
- Supabase - Gratuito com limite generoso

Mas o JSONBin.io é a solução mais simples e rápida para este caso.
