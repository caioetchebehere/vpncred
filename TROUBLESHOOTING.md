# 🔧 Troubleshooting - Erro 404 no Vercel

## Problema: Erro 404 ao acessar o site

### Soluções:

#### 1. Verificar se os arquivos estão na raiz do projeto
Certifique-se de que os seguintes arquivos estão na raiz do repositório:
- `index.html`
- `app.js`
- `styles.css`
- `package.json`
- `vercel.json`
- Pasta `api/` com `auth.js` e `credentials.js`

#### 2. Verificar estrutura do repositório
A estrutura deve ser:
```
projeto/
├── api/
│   ├── auth.js
│   └── credentials.js
├── index.html
├── app.js
├── styles.css
├── package.json
├── vercel.json
└── ...
```

#### 3. Verificar se o index.html está sendo detectado
- O Vercel deve detectar automaticamente o `index.html` na raiz
- Se não detectar, verifique se o arquivo está realmente na raiz (não em uma subpasta)

#### 4. Fazer novo deploy
Após fazer alterações:
```bash
# Via CLI
vercel --prod

# Ou faça um novo commit e push se estiver usando GitHub
git add .
git commit -m "Fix: Corrigir configuração Vercel"
git push
```

#### 5. Verificar logs do Vercel
1. Acesse o Vercel Dashboard
2. Vá em seu projeto → "Deployments"
3. Clique no deployment mais recente
4. Verifique os logs para erros

#### 6. Verificar variáveis de ambiente
Certifique-se de que `BLOB_READ_WRITE_TOKEN` está configurado:
1. Vercel Dashboard → Seu Projeto → Settings → Environment Variables
2. Verifique se a variável existe e está configurada para todos os ambientes

#### 7. Testar localmente
```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev
# ou
vercel dev
```

#### 8. Verificar se o projeto está configurado como Static Site
No Vercel Dashboard:
1. Settings → General
2. Verifique se "Framework Preset" está como "Other" ou vazio
3. O Vercel deve detectar automaticamente como site estático

#### 9. Limpar cache e fazer novo deploy
1. No Vercel Dashboard, vá em "Deployments"
2. Clique nos três pontos do deployment → "Redeploy"
3. Ou delete o deployment e faça um novo

#### 10. Verificar URL de acesso
- Certifique-se de estar acessando a URL correta do projeto
- A URL deve ser algo como: `https://seu-projeto.vercel.app`
- Não acesse `/api/` diretamente, acesse a raiz do site

## Se nada funcionar:

1. **Remova o vercel.json temporariamente** e faça um novo deploy
2. **Verifique se todos os arquivos foram commitados** no Git
3. **Crie um novo projeto no Vercel** e conecte o repositório novamente

## Contato
Se o problema persistir, verifique os logs detalhados no Vercel Dashboard.
