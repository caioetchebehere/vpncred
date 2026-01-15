# Troubleshooting - Solução de Problemas

## Erro: "Unexpected token 'T', "The page c"... is not valid JSON"

Este erro ocorre quando a API retorna uma resposta que não é JSON (geralmente HTML de uma página de erro).

### Possíveis Causas e Soluções:

1. **API não encontrada (404)**
   - Verifique se as funções serverless foram deployadas corretamente no Vercel
   - Confirme que a pasta `api/` está na raiz do projeto
   - Verifique se o `vercel.json` está configurado corretamente

2. **Erro no servidor (500)**
   - Verifique os logs do Vercel para ver erros específicos
   - Confirme que o Node.js está configurado (versão 18+)
   - Verifique se há erros de sintaxe nos arquivos da API

3. **Problema de CORS**
   - As APIs já estão configuradas com CORS, mas verifique se não há bloqueios adicionais

4. **Body não parseado corretamente**
   - O Vercel faz parse automático do JSON, mas verifique se o Content-Type está correto

### Como Verificar:

1. Abra o Console do navegador (F12) e verifique:
   - Se há erros de rede
   - Qual é a resposta exata da API
   - O status HTTP da resposta

2. Teste a API diretamente:
   ```
   GET https://seu-dominio.vercel.app/api/get-credentials
   ```

3. Verifique os logs do Vercel:
   - Acesse o dashboard do Vercel
   - Vá em "Functions" > "Logs"
   - Procure por erros relacionados às APIs

### Solução Rápida:

Se o erro persistir, verifique:
- ✅ As funções estão na pasta `api/`?
- ✅ O `vercel.json` está configurado?
- ✅ O deploy foi feito corretamente?
- ✅ As variáveis de ambiente estão configuradas (se usar JSONBin.io)?
