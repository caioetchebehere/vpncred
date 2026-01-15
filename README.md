# Sistema de Gerenciamento de Credenciais VPN

Sistema web para gerenciamento de credenciais VPN com controle de acesso, upload de credenciais e geração de relatórios.

## Funcionalidades

### 1. Autenticação
- **Usuário Admin:** `admin`
- **Senha Admin:** `essilor@lux`
- Apenas administradores podem fazer upload de credenciais

### 2. Upload de Credenciais
- Upload de arquivo TXT com credenciais (apenas para admin)
- Cada linha do arquivo representa uma credencial
- Credenciais duplicadas são ignoradas

### 3. Geração de Credenciais
- Seleção de usuário pré-cadastrado
- Número da filial é preenchido automaticamente
- Informação de senha do usuário
- Geração automática de credencial disponível

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

## Como Usar

1. Abra o arquivo `index.html` em um navegador web moderno
2. Faça login com as credenciais de administrador
3. Faça upload de um arquivo TXT com credenciais (uma por linha)
4. Para gerar uma credencial:
   - Selecione o usuário
   - Informe a senha
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
- LocalStorage para persistência de dados

## Notas

- Os dados são armazenados no navegador (LocalStorage)
- Para limpar os dados, limpe o cache do navegador
- O sistema funciona completamente offline após o carregamento inicial
