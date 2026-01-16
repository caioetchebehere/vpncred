import { put, list, get } from '@vercel/blob';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const CREDENTIALS_FILE = 'vpn-credentials.json';
const USED_CREDENTIALS_FILE = 'vpn-used-credentials.json';

// Helper para ler dados do Blob
async function readBlobData(filename) {
  try {
    // Listar blobs com o prefixo do nome do arquivo
    const blobs = await list({
      token: BLOB_TOKEN,
      prefix: filename,
    });
    
    // Procurar o blob exato pelo pathname
    if (blobs.blobs && blobs.blobs.length > 0) {
      const blob = blobs.blobs.find(b => b.pathname === filename || b.pathname.endsWith(filename));
      if (blob) {
        // Buscar o conteúdo do blob
        const response = await fetch(blob.url);
        if (response.ok) {
          const text = await response.text();
          return JSON.parse(text);
        }
      }
    }
  } catch (error) {
    // Arquivo não existe ainda ou erro ao buscar
    console.log(`Arquivo ${filename} não encontrado:`, error.message);
    return null;
  }
  return null;
}

// Helper para escrever dados no Blob
async function writeBlobData(filename, data) {
  const blob = await put(filename, JSON.stringify(data), {
    access: 'public',
    token: BLOB_TOKEN,
    contentType: 'application/json',
  });
  return blob;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Listar credenciais disponíveis e usadas
      const available = await readBlobData(CREDENTIALS_FILE) || [];
      const used = await readBlobData(USED_CREDENTIALS_FILE) || [];
      
      return res.status(200).json({
        available: available,
        used: used,
        availableCount: available.length,
        usedCount: used.length,
        totalCount: available.length + used.length
      });
    }

    if (req.method === 'POST') {
      const { action, credentials, userName, branchNumber } = req.body;

      if (action === 'upload') {
        // Upload de credenciais (admin only - validação deve ser feita no frontend também)
        if (!credentials || !Array.isArray(credentials)) {
          return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const existing = await readBlobData(CREDENTIALS_FILE) || [];
        const newCredentials = credentials.filter(c => c.trim() && !existing.includes(c.trim()));
        const updated = [...existing, ...newCredentials];

        await writeBlobData(CREDENTIALS_FILE, updated);

        return res.status(200).json({
          success: true,
          added: newCredentials.length,
          total: updated.length,
          message: `${newCredentials.length} credenciais adicionadas`
        });
      }

      if (action === 'generate') {
        // Gerar credencial para usuário
        const available = await readBlobData(CREDENTIALS_FILE) || [];
        
        if (available.length === 0) {
          return res.status(400).json({ message: 'Não há credenciais disponíveis' });
        }

        // Pegar primeira credencial
        const credential = available[0];
        const updatedAvailable = available.slice(1);

        // Registrar como usada
        const used = await readBlobData(USED_CREDENTIALS_FILE) || [];
        const usedCredential = {
          credential: credential,
          userName: userName,
          branchNumber: branchNumber,
          timestamp: new Date().toISOString()
        };
        used.push(usedCredential);

        // Salvar ambos
        await writeBlobData(CREDENTIALS_FILE, updatedAvailable);
        await writeBlobData(USED_CREDENTIALS_FILE, used);

        return res.status(200).json({
          success: true,
          credential: credential,
          usedCredential: usedCredential
        });
      }
    }

    return res.status(400).json({ message: 'Ação inválida' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}
