# Instruções de Deploy no Vercel

## Estrutura de Arquivos

O Vercel detecta automaticamente funções serverless na pasta `api/`. A estrutura deve ser:

```
projeto/
├── api/
│   ├── get-credentials.js
│   ├── upload-credentials.js
│   ├── generate-credential.js
│   └── data.js
├── index.html
├── app.js
├── styles.css
├── package.json
└── vercel.json (opcional)
```

## Verificações

1. **Certifique-se de que os arquivos estão na pasta `api/`**
   - ✅ `api/get-credentials.js`
   - ✅ `api/upload-credentials.js`
   - ✅ `api/generate-credential.js`
   - ✅ `api/data.js`

2. **Verifique o package.json**
   - Deve ter `"engines": { "node": "24.x" }`

3. **Após o deploy, teste as rotas:**
   - `https://seu-projeto.vercel.app/api/get-credentials`
   - `https://seu-projeto.vercel.app/api/upload-credentials`
   - `https://seu-projeto.vercel.app/api/generate-credential`

## Se ainda der 404:

1. Verifique os logs do Vercel no dashboard
2. Certifique-se de que os arquivos foram commitados e enviados
3. Tente fazer um redeploy manual no dashboard do Vercel
4. Verifique se há erros de build nos logs

## Estrutura de Rotas

O Vercel mapeia automaticamente:
- `api/get-credentials.js` → `/api/get-credentials`
- `api/upload-credentials.js` → `/api/upload-credentials`
- `api/generate-credential.js` → `/api/generate-credential`
