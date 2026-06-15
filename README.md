# Sistema de Gerenciamento de Credenciais VPN

Sistema web para gerenciamento de credenciais VPN com controle de acesso, upload de credenciais e geração de relatórios. Deployado no Vercel com armazenamento em Vercel Blob.

## 🚀 Deploy no Vercel

### Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Node.js instalado (para desenvolvimento local)

### Passo a Passo

1. **Criar Blob Store no Vercel:**
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Vá em "Storage" → "Create Database" → Selecione "Blob"
   - Crie um novo Blob Store
   - Copie o token de leitura/escrita (BLOB_READ_WRITE_TOKEN)

2. **Configurar Variáveis de Ambiente:**
   - No projeto Vercel, vá em "Settings" → "Environment Variables"
   - Adicione a variável:
     - `BLOB_READ_WRITE_TOKEN`: Cole o token copiado do Blob Store

3. **Fazer Deploy:**
   ```bash
   # Instalar Vercel CLI (se ainda não tiver)
   npm i -g vercel
   
   # Fazer login
   vercel login
   
   # Deploy
   vercel
   ```

   Ou simplesmente conecte seu repositório GitHub ao Vercel e faça push do código.

## 🔐 Autenticação

### Usuário Admin
- **Usuário:** `admin`
- **Senha:** `essilor@lux`
- Apenas administradores podem fazer upload de credenciais

### Usuários Permitidos

N/A

## 📋 Funcionalidades

### 1. Upload de Credenciais (Admin)
- Upload de arquivo TXT com credenciais (apenas para admin)
- Cada linha do arquivo representa uma credencial
- Credenciais duplicadas são ignoradas
- Dados armazenados no Vercel Blob

### 2. Geração de Credenciais
- Seleção de usuário pré-cadastrado
- Validação de senha do usuário
- Geração automática de credencial disponível
- Registro automático de uso

### 3. Alertas
- Alerta automático quando restam menos de 50 credenciais disponíveis

### 4. Relatório Excel
- Exportação de relatório em Excel com duas abas:
  - **Credenciais Utilizadas:** Credencial, Usuário, Filial, Data/Hora de Uso
  - **Credenciais Não Utilizadas:** Lista de credenciais disponíveis

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
.
├── api/
│   ├── auth.js          # API de autenticação
│   └── credentials.js   # API de gerenciamento de credenciais
├── index.html           # Página principal
├── app.js               # Lógica do frontend
├── styles.css           # Estilos
├── package.json         # Dependências
├── vercel.json          # Configuração do Vercel
└── README.md            # Este arquivo
```

## 🔧 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Vercel Serverless Functions
- **Armazenamento:** Vercel Blob Storage
- **Exportação:** SheetJS (xlsx.js)

## 📝 Formato do Arquivo TXT

O arquivo TXT deve conter uma credencial por linha:

```
VPN001
VPN002
VPN003
```

## 🔒 Segurança

- Autenticação obrigatória para acesso
- Validação de usuários permitidos
- Dados armazenados de forma segura no Vercel Blob
- CORS configurado para permitir requisições do frontend

## 📝 Notas

- Os dados são armazenados no Vercel Blob (não mais no LocalStorage)
- O sistema funciona online e requer conexão com a internet
- As credenciais são compartilhadas entre todos os usuários autorizados
