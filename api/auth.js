// Configurações de usuários permitidos
const ALLOWED_USERS = {
  'Caio': { password: '9011', branch: '9011' },
  'Isadora': { password: '9012', branch: '9012' },
  'Vanessa': { password: '9013', branch: '9013' },
  'Brasil': { password: '9014', branch: '9014' },
  'Tiago': { password: '9015', branch: '9015' },
  'Aurelio': { password: '9016', branch: '9016' },
  'Joathan': { password: '9017', branch: '9017' },
  'Maicon': { password: '9018', branch: '9018' },
  'Daniel': { password: '9019', branch: '9019' },
  'Wagner': { password: '9020', branch: '9020' }
};

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'essilor@lux';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { username, password, type } = req.body;

    if (type === 'admin') {
      // Autenticação admin
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return res.status(200).json({ 
          success: true, 
          isAdmin: true,
          message: 'Autenticação admin bem-sucedida'
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais admin inválidas' 
        });
      }
    } else {
      // Autenticação usuário
      const user = ALLOWED_USERS[username];
      if (user && user.password === password) {
        return res.status(200).json({ 
          success: true, 
          isAdmin: false,
          username: username,
          branch: user.branch,
          message: 'Autenticação bem-sucedida'
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
