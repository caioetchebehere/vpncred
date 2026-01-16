import { kv } from '@vercel/kv';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'essilor@lux';

// Chaves no KV
const KEY_AVAILABLE = 'vpn:available';
const KEY_USED = 'vpn:used';

// Verificar se o Vercel KV está configurado
function checkKVConfig() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return {
      error: true,
      message: 'Vercel KV não está configurado. Por favor, conecte o Vercel KV ao projeto em Settings → Storage no dashboard do Vercel.'
    };
  }
  return { error: false };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar configuração do KV
  const kvCheck = checkKVConfig();
  if (kvCheck.error) {
    return res.status(503).json({ 
      error: kvCheck.message,
      setupRequired: true,
      instructions: 'Acesse o dashboard do Vercel → Seu Projeto → Settings → Storage → Connect no banco KV criado'
    });
  }

  try {
    // GET - Obter credenciais disponíveis e utilizadas
    if (req.method === 'GET') {
      const action = req.query.action || 'all';

      if (action === 'available') {
        const available = await kv.get(KEY_AVAILABLE) || [];
        return res.status(200).json({ available });
      }

      if (action === 'used') {
        const used = await kv.get(KEY_USED) || [];
        return res.status(200).json({ used });
      }

      if (action === 'stats') {
        const available = await kv.get(KEY_AVAILABLE) || [];
        const used = await kv.get(KEY_USED) || [];
        return res.status(200).json({
          availableCount: available.length,
          usedCount: used.length,
          totalCount: available.length + used.length
        });
      }

      // Retornar tudo
      const available = await kv.get(KEY_AVAILABLE) || [];
      const used = await kv.get(KEY_USED) || [];
      return res.status(200).json({ available, used });
    }

    // POST - Upload de credenciais ou gerar credencial
    if (req.method === 'POST') {
      const { action, credentials, adminUsername, adminPassword, userName, branchNumber, userPassword } = req.body;

      // Upload de credenciais
      if (action === 'upload') {
        // Verificar autenticação admin
        if (adminUsername !== ADMIN_USERNAME || adminPassword !== ADMIN_PASSWORD) {
          return res.status(401).json({ error: 'Credenciais de administrador inválidas' });
        }

        if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
          return res.status(400).json({ error: 'Lista de credenciais inválida' });
        }

        // Obter credenciais existentes
        const existing = await kv.get(KEY_AVAILABLE) || [];
        const existingSet = new Set(existing);

        // Adicionar novas credenciais (sem duplicatas)
        let added = 0;
        credentials.forEach(cred => {
          const trimmed = cred.trim();
          if (trimmed && !existingSet.has(trimmed)) {
            existing.push(trimmed);
            existingSet.add(trimmed);
            added++;
          }
        });

        // Salvar no KV
        await kv.set(KEY_AVAILABLE, existing);

        return res.status(200).json({ 
          success: true, 
          message: `${added} credenciais adicionadas com sucesso!`,
          total: existing.length
        });
      }

      // Gerar credencial
      if (action === 'generate') {
        if (!userName || !branchNumber || !userPassword) {
          return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        // Mapeamento de senhas dos usuários (senha = número da filial)
        const USER_PASSWORDS = {
          'Caio': '9011',
          'Isadora': '9012',
          'Vanessa': '9013',
          'Brasil': '9014',
          'Tiago': '9015',
          'Aurelio': '9016',
          'Joathan': '9017',
          'Maicon': '9018',
          'Daniel': '9019',
          'Wagner': '9020'
        };

        // Validar senha do usuário
        const correctPassword = USER_PASSWORDS[userName];
        if (!correctPassword || userPassword !== correctPassword) {
          return res.status(401).json({ error: 'Senha incorreta para este usuário' });
        }

        // Validar se o número da filial corresponde ao usuário
        const USER_BRANCHES = {
          'Caio': '9011',
          'Isadora': '9012',
          'Vanessa': '9013',
          'Brasil': '9014',
          'Tiago': '9015',
          'Aurelio': '9016',
          'Joathan': '9017',
          'Maicon': '9018',
          'Daniel': '9019',
          'Wagner': '9020'
        };

        if (USER_BRANCHES[userName] !== branchNumber) {
          return res.status(400).json({ error: 'Número da filial não corresponde ao usuário selecionado' });
        }

        // Obter credenciais disponíveis
        const available = await kv.get(KEY_AVAILABLE) || [];

        if (available.length === 0) {
          return res.status(400).json({ error: 'Não há credenciais disponíveis' });
        }

        // Remover primeira credencial disponível
        const credential = available.shift();
        await kv.set(KEY_AVAILABLE, available);

        // Adicionar às credenciais usadas
        const used = await kv.get(KEY_USED) || [];
        const usedCredential = {
          credential,
          userName,
          branchNumber,
          timestamp: new Date().toLocaleString('pt-BR')
        };
        used.push(usedCredential);
        await kv.set(KEY_USED, used);

        return res.status(200).json({
          success: true,
          credential,
          userName,
          branchNumber,
          timestamp: usedCredential.timestamp
        });
      }

      return res.status(400).json({ error: 'Ação inválida' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
  }
}
