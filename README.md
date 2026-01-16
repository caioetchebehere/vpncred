# Sistema de Gerenciamento de Credenciais VPN

Sistema web para gerenciamento de credenciais VPN com controle de acesso, upload de credenciais e geração de relatórios. **Configurado para funcionar no Vercel com armazenamento compartilhado.**

## Funcionalidades

### 1. Autenticação
- **Usuário Admin:** `admin`
- **Senha Admin:** `essilor@lux`
- Apenas administradores podem fazer upload de credenciais

### 2. Upload de Credenciais
- Upload de arquivo TXT com credenciais (apenas para admin)
- Cada linha do arquivo representa uma credencial
- Credenciais duplicadas são ignoradas
- **As credenciais são compartilhadas entre todos os usuários** (armazenadas no Vercel KV)

### 3. Geração de Credenciais
- Seleção de usuário pré-cadastrado
- Número da filial é preenchido automaticamente
- Informação de senha do usuário
- Geração automática de credencial disponível
- **Qualquer usuário com acesso ao site pode gerar credenciais**

### Usuários Cadastrados
- Caio - Filial: 9011
- Isadora - Filial: 9012
- Vanessa - Filial: 9013
- Brasil - Filial: 9014
- Tiago - Filial: 9015
- Aurelio - Filial: 9016
- Joathan - Filial: 9017
- Maicon - Filial: 9018
- Daniel - Filial: 9019
- Wagner - Filial: 9020

### 4. Alertas
- Alerta automático quando restam menos de 50 credenciais disponíveis

### 5. Relatório Excel
- Exportação de relatório em Excel com duas abas:
  - **Credenciais Utilizadas:** Credencial, Usuário, Filial, Data/Hora de Uso
  - **Credenciais Não Utilizadas:** Lista de credenciais disponíveis

## Deploy no Vercel

### Pré-requisitos
1. Conta no [Vercel](https://vercel.com)
2. Git instalado (para fazer push do código)

### Passo a Passo

1. **Instalar dependências localmente (opcional, para testar):**
   ```bash
   npm install
   ```

2. **Configurar Vercel KV:**
   - Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
   - Vá em **Storage** → **Create Database** → Selecione **KV**
   - Crie um banco KV (pode usar o plano gratuito)
   - Anote o nome do banco criado

3. **Fazer deploy:**
   - Opção 1: Via CLI do Vercel
     ```bash
     npm i -g vercel
     vercel
     ```
   - Opção 2: Via GitHub/GitLab
     - Faça push do código para um repositório
     - No Vercel, clique em **Add New Project**
     - Conecte seu repositório
     - O Vercel detectará automaticamente as configurações

4. **Conectar Vercel KV ao projeto:**
   - No dashboard do Vercel, vá em **Settings** → **Storage**
   - Clique em **Connect** no banco KV criado
   - Isso criará automaticamente as variáveis de ambiente necessárias

5. **Testar o deploy:**
   - Acesse a URL fornecida pelo Vercel
   - Faça login como admin e teste o upload de credenciais
   - Teste a geração de credenciais

### Variáveis de Ambiente

O Vercel KV será configurado automaticamente quando você conectar o banco ao projeto. As seguintes variáveis serão criadas automaticamente:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Não é necessário configurar manualmente!**

## Como Usar

1. Acesse o site publicado no Vercel
2. Faça login com as credenciais de administrador (`admin` / `essilor@lux`)
3. Faça upload de um arquivo TXT com credenciais (uma por linha)
4. Para gerar uma credencial:
   - Selecione o usuário
   - Informe a senha (número da filial)
   - Clique em "Gerar Credencial"
5. Exporte relatórios clicando em "Exportar Relatório Excel"

## Formato do Arquivo TXT

O arquivo TXT deve conter uma credencial por linha:

```
credential1
credential2
credential3
```

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- SheetJS (xlsx.js) para exportação Excel
- **Vercel Functions** para API serverless
- **Vercel KV** para armazenamento compartilhado

## Estrutura do Projeto

```
.
├── api/
│   └── credentials.js      # API serverless para gerenciar credenciais
├── index.html              # Interface principal
├── app.js                  # Lógica do frontend
├── styles.css              # Estilos
├── package.json            # Dependências
├── vercel.json             # Configuração do Vercel
└── README.md               # Este arquivo
```

## Notas Importantes

- ✅ **As credenciais são compartilhadas entre todos os usuários** - quando um admin faz upload, todos podem ver e usar
- ✅ **Funciona completamente no Vercel** - não precisa de serviços externos
- ✅ **Armazenamento persistente** - dados salvos no Vercel KV
- ✅ **Multi-usuário** - vários usuários podem acessar simultaneamente
- ⚠️ O tema escuro e estado de admin são salvos localmente (LocalStorage) por usuário
- ⚠️ Para produção, considere alterar as credenciais de admin padrão

## Suporte

Em caso de problemas:
1. Verifique se o Vercel KV está conectado ao projeto
2. Verifique os logs no dashboard do Vercel
3. Teste a API diretamente: `https://seu-projeto.vercel.app/api/credentials?action=stats`
