# Gerenciador de Credenciais VPN

Sistema web para gerenciamento de credenciais VPN com acesso compartilhado entre múltiplos usuários.

## Características

- ✅ Upload de credenciais via arquivo (CSV, TXT, XLSX)
- ✅ Geração sequencial de credenciais VPN
- ✅ Controle de acesso por usuário e senha
- ✅ Área administrativa para importação
- ✅ Exportação de relatórios para Excel
- ✅ Interface com cores corporativas EssilorLuxottica

## Requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com Node.js)

## Instalação

1. Instale as dependências:
```bash
npm install
```

## Execução

1. **IMPORTANTE**: Inicie o servidor Node.js primeiro:
```bash
npm start
```
O servidor ficará rodando em `http://localhost:3000`

2. Acesse a aplicação no navegador:
   - Se estiver usando Live Server ou similar na porta 5500, a aplicação detectará automaticamente e usará a API na porta 3000
   - Ou acesse diretamente: `http://localhost:3000` (o servidor também serve os arquivos estáticos)

**Nota**: O servidor Node.js DEVE estar rodando para que a aplicação funcione. Sem ele, você verá erros 404/405 ao tentar fazer upload ou gerar credenciais.

## Estrutura do Projeto

- `index.html` - Interface principal
- `app.js` - Lógica do frontend
- `styles.css` - Estilos da aplicação
- `server.js` - Servidor backend (Node.js/Express)
- `package.json` - Dependências do projeto
- `data.json` - Armazenamento de dados (criado automaticamente)

## Uso

### Como Admin

1. Clique em "Importar Credenciais (Admin)"
2. Faça login com:
   - Usuário: `admin`
   - Senha: `essilor@lux`
3. Faça upload do arquivo com credenciais (formato: usuário,senha por linha)

### Como Usuário

1. Digite seu nome (deve estar na lista de usuários permitidos)
2. Digite o número da filial
3. Digite sua senha de 4 dígitos
4. Clique em "Gerar Credencial VPN"
5. A credencial será exibida e marcada como utilizada

### Exportar Relatório

Clique em "Exportar Relatório para Excel" para baixar um arquivo com todas as credenciais geradas.

## Usuários Permitidos

- Caio (senha: 9011)
- Isadora (senha: 9012)
- Vanessa (senha: 9013)
- Brasil (senha: 9014)
- Tiago (senha: 9015)
- Aurelio (senha: 9016)
- Joathan (senha: 9017)
- Maicon (senha: 9018)
- Daniel (senha: 9019)
- Wagner (senha: 9020)

## Notas Importantes

- As credenciais são armazenadas em `data.json` no servidor
- Todas as credenciais são compartilhadas entre todos os usuários
- Ao fazer upload de um novo arquivo, o histórico anterior é zerado
- As credenciais são geradas sequencialmente, sempre a partir da última utilizada
