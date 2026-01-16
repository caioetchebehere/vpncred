# Como Verificar e Corrigir a Configuração do JSONBin

## Problema Identificado

Os logs do Vercel mostram:
```
Error saving to JSONBin: { status: 404, statusText: 'Not Found' }
```

Isso indica que o JSONBin está configurado, mas o **Bin ID está incorreto** ou o Bin não existe.

## Passos para Corrigir

### 1. Verificar o Bin ID no JSONBin.io

1. Acesse https://jsonbin.io e faça login
2. Vá em "My Bins" (Meus Bins)
3. Encontre o Bin que você criou
4. O **Bin ID** aparece na URL ou no dashboard
   - Exemplo de URL: `https://jsonbin.io/app/bins/65a1b2c3d4e5f6g7h8i9j0`
   - O Bin ID seria: `65a1b2c3d4e5f6g7h8i9j0` (apenas o ID, sem a URL completa)

### 2. Verificar as Variáveis de Ambiente no Vercel

1. Acesse o dashboard do Vercel: https://vercel.com
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Verifique cada variável:

   **JSONBIN_API_KEY:**
   - Deve ser sua X-Master-Key do JSONBin.io
   - Formato: `$2b$10$...` (começa com `$2b$`)
   - Não deve ter espaços no início ou fim

   **JSONBIN_BIN_ID:**
   - Deve ser APENAS o ID do Bin
   - Exemplo correto: `65a1b2c3d4e5f6g7h8i9j0`
   - Exemplo ERRADO: `https://jsonbin.io/app/bins/65a1b2c3d4e5f6g7h8i9j0`
   - Não deve ter espaços no início ou fim
   - Não deve começar com `http://` ou `https://`

   **JSONBIN_API_URL:**
   - Deve ser exatamente: `https://api.jsonbin.io/v3/b`
   - Sem barra no final
   - Sem espaços

### 3. Criar um Novo Bin (se necessário)

Se o Bin não existe ou você não tem certeza do ID:

1. No JSONBin.io, clique em "Create Bin"
2. Adicione esta estrutura inicial:
   ```json
   {
     "availableCredentials": [],
     "usedCredentials": []
   }
   ```
3. Clique em "Save"
4. Copie o **Bin ID** da URL (apenas o ID, não a URL completa)
5. Atualize a variável `JSONBIN_BIN_ID` no Vercel

### 4. Verificar a API Key

1. No JSONBin.io, vá em "API Keys"
2. Certifique-se de que está usando a **X-Master-Key** (não a Access Key)
3. Copie a chave completa
4. Atualize a variável `JSONBIN_API_KEY` no Vercel

### 5. Fazer Redeploy

Após corrigir as variáveis:

1. No Vercel, vá em **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Aguarde o deploy completar

### 6. Testar

1. Faça upload de credenciais
2. Verifique os logs do Vercel - não deve mais aparecer erro 404
3. Tente gerar uma credencial - deve funcionar agora

## Exemplo de Configuração Correta

**No Vercel Environment Variables:**

```
JSONBIN_API_KEY = $2b$10$abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
JSONBIN_BIN_ID = 65a1b2c3d4e5f6g7h8i9j0
JSONBIN_API_URL = https://api.jsonbin.io/v3/b
```

**Importante:**
- Sem aspas nas variáveis
- Sem espaços extras
- Bin ID deve ser apenas o ID, não a URL completa
