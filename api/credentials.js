import { put, list } from '@vercel/blob';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const CREDENTIALS_FILE = 'vpn-credentials.json';
const USED_CREDENTIALS_FILE = 'vpn-used-credentials.json';

// Helper para ler dados do Blob
async function readBlobData(filename) {
  try {
    if (!BLOB_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN não está configurado');
      return null;
    }

    // Listar blobs com o prefixo do nome do arquivo
    const blobs = await list({
      token: BLOB_TOKEN,
      prefix: filename,
    });
    
    // Procurar o blob exato pelo pathname
    if (blobs && blobs.blobs && blobs.blobs.length > 0) {
      // Tentar encontrar o blob exato
      let blob = blobs.blobs.find(b => b.pathname === filename);
      
      // Se não encontrar exato, tentar encontrar por nome
      if (!blob) {
        blob = blobs.blobs.find(b => b.pathname.includes(filename));
      }
      
      if (blob && blob.url) {
        // Buscar o conteúdo do blob
        const response = await fetch(blob.url);
        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch (parseError) {
            console.error(`Erro ao fazer parse do JSON de ${filename}:`, parseError);
            return null;
          }
        }
      }
    }
  } catch (error) {
    // Arquivo não existe ainda ou erro ao buscar - isso é normal na primeira vez
    console.log(`Arquivo ${filename} não encontrado (isso é normal na primeira vez):`, error.message);
    return null;
  }
  return null;
}

// Helper para escrever dados no Blob
async function writeBlobData(filename, data) {
  try {
    if (!BLOB_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN não está configurado');
    }

    const blob = await put(filename, JSON.stringify(data), {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob;
  } catch (error) {
    console.error(`Erro ao escrever ${filename}:`, error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar se o token está configurado
  if (!BLOB_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN não está configurado nas variáveis de ambiente');
    return res.status(500).json({ 
      message: '⚠️ BLOB_READ_WRITE_TOKEN não configurado. Acesse o Vercel Dashboard → Settings → Environment Variables e adicione a variável BLOB_READ_WRITE_TOKEN com o token do seu Blob Store. Veja o arquivo CONFIGURAR_BLOB.md para instruções detalhadas.',
      error: 'BLOB_READ_WRITE_TOKEN não configurado',
      help: 'https://vercel.com/docs/storage/vercel-blob'
    });
  }

  try {
    if (req.method === 'GET') {
      // Listar credenciais disponíveis e usadas
      const available = await readBlobData(CREDENTIALS_FILE) || [];
      const used = await readBlobData(USED_CREDENTIALS_FILE) || [];
      
      const availableArray = Array.isArray(available) ? available : [];
      const usedArray = Array.isArray(used) ? used : [];
      
      return res.status(200).json({
        available: availableArray,
        used: usedArray,
        availableCount: availableArray.length,
        usedCount: usedArray.length,
        totalCount: availableArray.length + usedArray.length
      });
    }

    if (req.method === 'POST') {
      const { action, credentials, userName, branchNumber } = req.body;

      if (action === 'upload') {
        // Upload de credenciais (admin only - validação deve ser feita no frontend também)
        if (!credentials || !Array.isArray(credentials)) {
          return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        if (credentials.length === 0) {
          return res.status(400).json({ message: 'Nenhuma credencial fornecida' });
        }

        try {
          const existing = await readBlobData(CREDENTIALS_FILE) || [];
          const existingArray = Array.isArray(existing) ? existing : [];
          
          // Filtrar credenciais duplicadas (comparar por usuário VPN)
          const existingUsernames = new Set(
            existingArray
              .map(c => typeof c === 'object' && c !== null ? c.vpnUsername : (typeof c === 'string' ? c : ''))
              .filter(u => u)
          );
          
          const newCredentials = credentials.filter(c => {
            if (typeof c === 'object' && c !== null && c.vpnUsername) {
              return !existingUsernames.has(c.vpnUsername);
            }
            return false;
          });
          
          const updated = [...existingArray, ...newCredentials];

          await writeBlobData(CREDENTIALS_FILE, updated);

          return res.status(200).json({
            success: true,
            added: newCredentials.length,
            total: updated.length,
            message: `${newCredentials.length} credenciais adicionadas`
          });
        } catch (writeError) {
          console.error('Erro ao escrever credenciais:', writeError);
          return res.status(500).json({ 
            message: 'Erro ao salvar credenciais no servidor',
            error: writeError.message 
          });
        }
      }

      if (action === 'generate') {
        // Gerar credencial para usuário
        const available = await readBlobData(CREDENTIALS_FILE) || [];
        const availableArray = Array.isArray(available) ? available : [];
        
        if (availableArray.length === 0) {
          return res.status(400).json({ message: 'Não há credenciais disponíveis' });
        }

        // Pegar primeira credencial e remover das disponíveis
        const credential = availableArray[0];
        // Remover a credencial das disponíveis (usar filter para garantir remoção correta)
        const credentialUsername = typeof credential === 'object' && credential !== null
          ? credential.vpnUsername
          : String(credential);
        
        const updatedAvailable = availableArray.filter(c => {
          const cUsername = typeof c === 'object' && c !== null ? c.vpnUsername : String(c);
          return cUsername !== credentialUsername;
        });

        // Verificar se realmente removeu
        if (updatedAvailable.length === availableArray.length) {
          console.warn('Aviso: Credencial não foi removida corretamente das disponíveis');
          // Forçar remoção do primeiro elemento
          updatedAvailable.shift();
        }

        // Normalizar credencial (pode ser string antiga ou objeto novo)
        const credentialData = typeof credential === 'object' && credential !== null
          ? credential
          : { vpnUsername: String(credential), vpnPassword: '' };

        // Verificar se já não está nas usadas (evitar duplicatas)
        const used = await readBlobData(USED_CREDENTIALS_FILE) || [];
        const usedArray = Array.isArray(used) ? used : [];
        
        // Verificar se a credencial já foi usada
        const alreadyUsed = usedArray.some(u => {
          const uUsername = u.vpnUsername || u.credential || '';
          return uUsername === credentialData.vpnUsername;
        });

        if (alreadyUsed) {
          return res.status(400).json({ 
            message: 'Esta credencial já foi utilizada anteriormente' 
          });
        }

        const usedCredential = {
          vpnUsername: credentialData.vpnUsername,
          vpnPassword: credentialData.vpnPassword,
          systemUser: userName || 'Desconhecido',
          branchNumber: branchNumber || 'N/A',
          timestamp: new Date().toISOString()
        };
        usedArray.push(usedCredential);

        // Salvar ambos
        try {
          await writeBlobData(CREDENTIALS_FILE, updatedAvailable);
          await writeBlobData(USED_CREDENTIALS_FILE, usedArray);

          return res.status(200).json({
            success: true,
            credential: credentialData,
            usedCredential: usedCredential,
            stats: {
              availableCount: updatedAvailable.length,
              usedCount: usedArray.length,
              totalCount: updatedAvailable.length + usedArray.length
            }
          });
        } catch (writeError) {
          console.error('Erro ao salvar credenciais:', writeError);
          return res.status(500).json({ 
            message: 'Erro ao salvar alterações no servidor',
            error: writeError.message 
          });
        }
      }

      return res.status(400).json({ message: 'Ação inválida. Use "upload" ou "generate"' });
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
