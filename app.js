// API Base URL
// Se estiver em localhost, usa a porta 3000 do servidor Node.js
// Caso contrário, usa a mesma origem
const getApiBaseUrl = () => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        // Extrai o hostname e usa porta 3000 para a API
        const hostname = window.location.hostname;
        return `http://${hostname}:3000`;
    }
    return origin;
};

const API_BASE_URL = getApiBaseUrl();

// Log para debug
console.log('API Base URL:', API_BASE_URL);
console.log('Current Origin:', window.location.origin);

// Função auxiliar para fazer requisições com tratamento de erro
const apiRequest = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Servidor não encontrado. Certifique-se de que o servidor Node.js está rodando na porta 3000.`);
            }
            if (response.status === 405) {
                throw new Error(`Método não permitido. Verifique se o servidor está configurado corretamente.`);
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error(`Não foi possível conectar ao servidor em ${API_BASE_URL}. Certifique-se de que o servidor Node.js está rodando (npm start).`);
        }
        throw error;
    }
};

// Gerenciamento de dados via API
const Storage = {
    getCredentials: async () => {
        try {
            return await apiRequest(`${API_BASE_URL}/api/credentials`);
        } catch (error) {
            console.error('Erro ao buscar credenciais:', error);
            return [];
        }
    },
    
    getUsedCredentials: async () => {
        try {
            return await apiRequest(`${API_BASE_URL}/api/used-credentials`);
        } catch (error) {
            console.error('Erro:', error);
            return [];
        }
    },
    
    getGeneratedHistory: async () => {
        try {
            return await apiRequest(`${API_BASE_URL}/api/history`);
        } catch (error) {
            console.error('Erro:', error);
            return [];
        }
    },
    
    uploadCredentials: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            return await apiRequest(`${API_BASE_URL}/api/upload-credentials`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            throw error;
        }
    },
    
    generateCredential: async (userName, branchNumber, userPassword) => {
        return await apiRequest(`${API_BASE_URL}/api/generate-credential`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userName, branchNumber, userPassword })
        });
    },
    
    getStats: async () => {
        try {
            return await apiRequest(`${API_BASE_URL}/api/stats`);
        } catch (error) {
            console.error('Erro:', error);
            return null;
        }
    }
};

// Lista de usuários permitidos
const ALLOWED_USERS = ['Caio', 'Tiago', 'Brasil', 'Aurelio', 'Vanessa', 'Isadora', 'Maicon', 'Wagner', 'Daniel', 'Joathan'];

// Credenciais de Admin
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'essilor@lux';

// Gerenciamento de sessão admin (usa sessionStorage para sessão do navegador)
const AdminSession = {
    isLoggedIn: () => {
        return sessionStorage.getItem('adminLoggedIn') === 'true';
    },
    
    login: () => {
        sessionStorage.setItem('adminLoggedIn', 'true');
    },
    
    logout: () => {
        sessionStorage.removeItem('adminLoggedIn');
    }
};

// Senhas pré-definidas para cada usuário
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

// Gerenciamento de senhas dos usuários
const UserPasswords = {
    validate: (userName, password) => {
        // Valida contra as senhas pré-definidas
        return USER_PASSWORDS[userName] === password;
    }
};


// Gerenciamento de Admin
const adminModal = document.getElementById('adminModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminImportBtn = document.getElementById('adminImportBtn');
const logoutBtn = document.getElementById('logoutBtn');
const uploadSection = document.getElementById('uploadSection');
const closeModal = document.getElementById('closeModal');
const adminError = document.getElementById('adminError');

// Função para mostrar/esconder seção de upload baseado no login
function updateAdminUI() {
    if (AdminSession.isLoggedIn()) {
        uploadSection.classList.remove('hidden');
        adminImportBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        uploadSection.classList.add('hidden');
        adminImportBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

// Abrir modal de login
adminImportBtn.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    adminError.classList.add('hidden');
});

// Fechar modal
closeModal.addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) {
        adminModal.classList.add('hidden');
    }
});

// Login admin
adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPassword').value;
    
    if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
        AdminSession.login();
        adminModal.classList.add('hidden');
        updateAdminUI();
        adminLoginForm.reset();
        adminError.classList.add('hidden');
    } else {
        adminError.textContent = 'Usuário ou senha incorretos!';
        adminError.classList.remove('hidden');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    AdminSession.logout();
    updateAdminUI();
});

// Upload de arquivo
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');

uploadArea.addEventListener('click', () => {
    if (AdminSession.isLoggedIn()) {
        fileInput.click();
    }
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        fileInfo.classList.remove('hidden');
        fileInfo.innerHTML = `<p>Processando arquivo: ${file.name}...</p>`;
        
        const result = await Storage.uploadCredentials(file);
        
        fileInfo.innerHTML = `
            <div class="alert alert-success">
                <strong>✓ Arquivo carregado com sucesso!</strong><br>
                ${result.count} credenciais importadas.<br>
                <small>Histórico de gerações anterior foi zerado.</small>
            </div>
        `;
        
        // Atualiza as estatísticas após zerar
        updateStats();
    } catch (error) {
        fileInfo.innerHTML = `
            <div class="alert alert-error">
                <strong>✗ Erro:</strong> ${error.message}
            </div>
        `;
    }
});

// Geração de credencial
const generateForm = document.getElementById('generateForm');
const resultCard = document.getElementById('resultCard');

generateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userName = document.getElementById('userName').value;
    const branchNumber = document.getElementById('branchNumber').value;
    const userPassword = document.getElementById('userPassword').value;
    
    // Validações
    if (!ALLOWED_USERS.includes(userName)) {
        alert('Usuário não permitido!');
        return;
    }
    
    if (userPassword.length !== 4 || !/^\d+$/.test(userPassword)) {
        alert('A senha deve conter exatamente 4 dígitos numéricos!');
        return;
    }
    
    // Valida senha do usuário
    if (!UserPasswords.validate(userName, userPassword)) {
        alert('Senha incorreta para este usuário!');
        return;
    }
    
    try {
        // Gera credencial via API
        const result = await Storage.generateCredential(userName, branchNumber, userPassword);
        
        if (result.success) {
            const credential = result.credential;
            
            // Exibe resultado
            document.getElementById('resultVpnUser').textContent = credential.vpnUser;
            document.getElementById('resultVpnPassword').textContent = credential.vpnPassword;
            document.getElementById('resultGeneratedBy').textContent = credential.generatedBy;
            document.getElementById('resultBranch').textContent = credential.branch;
            document.getElementById('resultDateTime').textContent = credential.dateTime;
            
            // Exibe o card ANTES de qualquer outra coisa
            resultCard.classList.remove('hidden');
            resultCard.style.display = 'block';
            
            // Limpa formulário
            generateForm.reset();
            
            // Scroll para o card
            setTimeout(() => {
                resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
            
            // Atualiza estatísticas
            await updateStats();
            await checkLowCredentialsWarning();
        }
    } catch (error) {
        alert(error.message || 'Erro ao gerar credencial');
    }
});

// Exportação para Excel
const exportBtn = document.getElementById('exportBtn');

exportBtn.addEventListener('click', async () => {
    try {
        const history = await Storage.getGeneratedHistory();
        
        if (history.length === 0) {
            alert('Nenhum registro encontrado para exportar!');
            return;
        }
        
        // Prepara dados para Excel
        const data = history.map(record => ({
            'Usuário VPN': record.vpnUser,
            'Senha VPN': record.vpnPassword,
            'Gerado por': record.generatedBy,
            'Filial': record.branch,
            'Data/Hora': record.dateTime
        }));
        
        // Cria workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Credenciais VPN');
        
        // Ajusta largura das colunas
        const colWidths = [
            { wch: 15 }, // Usuário VPN
            { wch: 12 }, // Senha VPN
            { wch: 12 }, // Gerado por
            { wch: 10 }, // Filial
            { wch: 20 }  // Data/Hora
        ];
        ws['!cols'] = colWidths;
        
        // Exporta
        const fileName = `relatorio_credenciais_vpn_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        alert(`Relatório exportado com sucesso! ${history.length} registro(s) exportado(s).`);
    } catch (error) {
        alert('Erro ao exportar relatório: ' + error.message);
    }
});

// Atualiza estatísticas
async function updateStats() {
    try {
        const statsData = await Storage.getStats();
        const stats = document.getElementById('stats');
        
        if (statsData && statsData.totalGenerated > 0) {
            stats.innerHTML = `
                <p><strong>Total de credenciais geradas:</strong> ${statsData.totalGenerated}</p>
                <p><strong>Credenciais disponíveis:</strong> ${statsData.availableCredentials} de ${statsData.totalCredentials}</p>
                <p><strong>Última geração:</strong> ${statsData.lastGeneration || 'N/A'}</p>
            `;
        } else {
            stats.innerHTML = '<p>Nenhuma credencial gerada ainda.</p>';
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        const stats = document.getElementById('stats');
        stats.innerHTML = '<p>Erro ao carregar estatísticas.</p>';
    }
}

// Verifica e exibe aviso de credenciais baixas
async function checkLowCredentialsWarning() {
    try {
        const statsData = await Storage.getStats();
        const warningCard = document.getElementById('warningCard');
        const availableCount = document.getElementById('availableCount');
        
        if (statsData && statsData.availableCredentials <= 50) {
            availableCount.textContent = statsData.availableCredentials;
            warningCard.classList.remove('hidden');
            warningCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            warningCard.classList.add('hidden');
        }
    } catch (error) {
        console.error('Erro ao verificar aviso de credenciais:', error);
    }
}

// Gerenciamento de Modo Escuro
const DarkMode = {
    init: () => {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeBtn').querySelector('.dark-mode-icon').textContent = '😎';
        } else {
            document.getElementById('darkModeBtn').querySelector('.dark-mode-icon').textContent = '😊';
        }
    },
    
    toggle: () => {
        const body = document.body;
        const isDark = body.classList.contains('dark-mode');
        const icon = document.getElementById('darkModeBtn').querySelector('.dark-mode-icon');
        
        if (isDark) {
            body.classList.remove('dark-mode');
            icon.textContent = '😊';
            localStorage.setItem('darkMode', 'false');
        } else {
            body.classList.add('dark-mode');
            icon.textContent = '😎';
            localStorage.setItem('darkMode', 'true');
        }
    }
};

// Botão de modo escuro
const darkModeBtn = document.getElementById('darkModeBtn');
if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
        DarkMode.toggle();
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    DarkMode.init();
    await updateStats();
    updateAdminUI();
    await checkLowCredentialsWarning();
});
