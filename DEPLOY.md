# Guia de Deploy no Vercel

## Opção 1: Deploy via Interface Web (Mais Fácil)

1. **Acesse o Vercel:**
   - Vá para [https://vercel.com](https://vercel.com)
   - Faça login ou crie uma conta (pode usar GitHub, GitLab, Bitbucket ou email)

2. **Crie um novo projeto:**
   - Clique em "Add New..." → "Project"
   - Se você tem o código no GitHub/GitLab/Bitbucket, importe o repositório
   - OU use a opção "Upload" para fazer upload direto dos arquivos

3. **Configure o projeto:**
   - Framework Preset: **Other** ou **Static Site**
   - Root Directory: `.` (raiz)
   - Build Command: deixe em branco (não precisa de build)
   - Output Directory: `.` (raiz)

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde alguns segundos
   - Seu site estará online!

## Opção 2: Deploy via CLI (Linha de Comando)

### Pré-requisitos:
- Node.js instalado
- Conta no Vercel

### Passos:

1. **Instale o Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Faça login:**
   ```bash
   vercel login
   ```

3. **Navegue até a pasta do projeto:**
   ```bash
   cd "C:\Users\AlexandreCEC\OneDrive - Luxottica Group S.p.A\Área de Trabalho\Python\VPN"
   ```

4. **Faça o deploy:**
   ```bash
   vercel
   ```
   
   - Na primeira vez, responda às perguntas:
     - Set up and deploy? **Yes**
     - Which scope? (escolha sua conta)
     - Link to existing project? **No**
     - Project name? (pressione Enter para usar o padrão)
     - Directory? (pressione Enter para usar `.`)

5. **Para fazer deploy em produção:**
   ```bash
   vercel --prod
   ```

## Opção 3: Deploy via GitHub (Recomendado)

1. **Crie um repositório no GitHub:**
   - Vá para [https://github.com/new](https://github.com/new)
   - Crie um novo repositório (ex: `sistema-vpn-credenciais`)

2. **Envie o código para o GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/sistema-vpn-credenciais.git
   git push -u origin main
   ```

3. **Conecte no Vercel:**
   - No Vercel, clique em "Add New..." → "Project"
   - Importe o repositório do GitHub
   - Configure (mesmo que Opção 1)
   - Deploy automático a cada push!

## Arquivos Importantes

- ✅ `index.html` - Página principal
- ✅ `app.js` - Lógica da aplicação
- ✅ `styles.css` - Estilos
- ✅ `vercel.json` - Configuração do Vercel
- ✅ `package.json` - Metadados do projeto

## Notas Importantes

⚠️ **LocalStorage:** Os dados são salvos no navegador do usuário, não no servidor. Cada usuário terá seus próprios dados localmente.

⚠️ **Segurança:** As credenciais de admin estão no código JavaScript. Para produção, considere usar variáveis de ambiente ou um backend.

## Após o Deploy

Após o deploy, você receberá uma URL como:
- `https://seu-projeto.vercel.app`

Você pode:
- Compartilhar essa URL
- Configurar um domínio personalizado nas configurações do projeto
- Ativar deploy automático conectando ao GitHub

## Suporte

Se tiver problemas, consulte a documentação do Vercel:
- [Documentação Vercel](https://vercel.com/docs)
