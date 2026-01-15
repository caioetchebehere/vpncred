// Arquivo de teste para verificar se o Vercel está detectando as funções
module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ 
        message: 'API funcionando!',
        timestamp: new Date().toISOString()
    });
};
