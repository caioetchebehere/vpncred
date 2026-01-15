// Configurações
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'essilor@lux';
const LOW_STOCK_THRESHOLD = 50;

// Mapeamento de usuários e filiais
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

// Estado da aplicação
let isAdmin = false;
let availableCredentials = [];
let usedCredentials = [];
let isDarkMode = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateUI();
});

// Event Listeners
function setupEventListeners() {
    // Toggle de tema
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Autenticação Admin
    document.getElementById('adminAuthForm').addEventListener('submit', handleAdminAuth);
    document.getElementById('logoutAdminBtn').addEventListener('click', handleLogoutAdmin);

    // Upload
    document.getElementById('uploadBtn').addEventListener('click', handleUpload);

    // Geração de credenciais
    document.getElementById('generateForm').addEventListener('submit', handleGenerateCredential);

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
}

// Autenticação Admin
function handleAdminAuth(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminAuthError');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isAdmin = true;
        errorDiv.textContent = '';
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('uploadSection').classList.remove('hidden');
        saveData();
    } else {
        errorDiv.textContent = 'Usuário ou senha incorretos!';
        isAdmin = false;
    }
}

function handleLogoutAdmin() {
    isAdmin = false;
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminAuthError').textContent = '';
    document.getElementById('adminAuthSection').classList.remove('hidden');
    document.getElementById('uploadSection').classList.add('hidden');
    saveData();
}


// Upload de credenciais (apenas admin)
function handleUpload() {
    if (!isAdmin) {
        showStatus('uploadStatus', 'Acesso negado. Faça a autenticação de administrador primeiro.', 'error');
        return;
    }

    const fileInput = document.getElementById('credentialFile');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('uploadStatus', 'Por favor, selecione um arquivo TXT.', 'error');
        return;
    }

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
        showStatus('uploadStatus', 'Por favor, selecione um arquivo TXT válido.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                showStatus('uploadStatus', 'O arquivo está vazio.', 'error');
                return;
            }

            // Adicionar credenciais ao estoque
            lines.forEach(line => {
                const credential = line.trim();
                if (credential && !availableCredentials.includes(credential)) {
                    availableCredentials.push(credential);
                }
            });

            saveData();
            updateUI();
            showStatus('uploadStatus', `${lines.length} credenciais adicionadas com sucesso!`, 'success');
            fileInput.value = '';
        } catch (error) {
            showStatus('uploadStatus', 'Erro ao processar o arquivo: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Gerar credencial
function handleGenerateCredential(e) {
    e.preventDefault();

    const userName = document.getElementById('userName').value;
    const branchNumber = document.getElementById('branchNumber').value;
    const userPassword = document.getElementById('userPassword').value;

    if (!userName || !branchNumber || !userPassword) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // Validar senha do usuário
    const correctPassword = USER_PASSWORDS[userName];
    if (!correctPassword || userPassword !== correctPassword) {
        alert('Senha incorreta para este usuário. Verifique a senha e tente novamente.');
        return;
    }

    if (availableCredentials.length === 0) {
        alert('Não há credenciais disponíveis. Faça o upload de credenciais primeiro.');
        return;
    }

    // Pegar a primeira credencial disponível
    const credential = availableCredentials.shift();
    
    // Registrar uso
    const usedCredential = {
        credential: credential,
        userName: userName,
        branchNumber: branchNumber,
        timestamp: new Date().toLocaleString('pt-BR')
    };

    usedCredentials.push(usedCredential);
    saveData();
    updateUI();

    // Mostrar credencial gerada no card
    showGeneratedCredential(credential, userName, branchNumber, usedCredential.timestamp);

    // Limpar formulário
    document.getElementById('generateForm').reset();
}

// Atualizar UI
function updateUI() {
    // A seção admin sempre está visível, mas o conteúdo muda baseado na autenticação
    const adminSection = document.getElementById('adminSection');
    adminSection.classList.remove('hidden');
    
    // Se já está autenticado, mostrar seção de upload
    if (isAdmin) {
        document.getElementById('adminAuthSection').classList.add('hidden');
        document.getElementById('uploadSection').classList.remove('hidden');
    } else {
        document.getElementById('adminAuthSection').classList.remove('hidden');
        document.getElementById('uploadSection').classList.add('hidden');
    }

    // Atualizar estatísticas
    const availableCount = availableCredentials.length;
    const usedCount = usedCredentials.length;
    const totalCount = availableCount + usedCount;

    document.getElementById('availableCount').textContent = availableCount;
    document.getElementById('usedCount').textContent = usedCount;
    document.getElementById('totalCount').textContent = totalCount;

    // Alerta de estoque baixo
    const warningDiv = document.getElementById('lowStockWarning');
    if (availableCount < LOW_STOCK_THRESHOLD) {
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }
}

// Mostrar credencial gerada no card
function showGeneratedCredential(credential, userName, branchNumber, timestamp) {
    document.getElementById('generatedCredential').textContent = credential;
    document.getElementById('generatedUser').textContent = userName;
    document.getElementById('generatedBranch').textContent = branchNumber;
    document.getElementById('generatedTimestamp').textContent = timestamp;
    
    const card = document.getElementById('generatedCredentialCard');
    card.classList.remove('hidden');
    
    // Scroll suave até o card
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Exportar para Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // Aba 1: Credenciais Utilizadas
    const usedData = [
        ['Credencial', 'Usuário', 'Filial', 'Data/Hora de Uso']
    ];

    usedCredentials.forEach(item => {
        usedData.push([
            item.credential,
            item.userName,
            item.branchNumber,
            item.timestamp
        ]);
    });

    const wsUsed = XLSX.utils.aoa_to_sheet(usedData);
    XLSX.utils.book_append_sheet(wb, wsUsed, 'Credenciais Utilizadas');

    // Aba 2: Credenciais Não Utilizadas
    const unusedData = [
        ['Credencial']
    ];

    availableCredentials.forEach(credential => {
        unusedData.push([credential]);
    });

    const wsUnused = XLSX.utils.aoa_to_sheet(unusedData);
    XLSX.utils.book_append_sheet(wb, wsUnused, 'Credenciais Não Utilizadas');

    // Gerar nome do arquivo com data
    const date = new Date().toISOString().split('T')[0];
    const fileName = `relatorio_credenciais_vpn_${date}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(wb, fileName);
}

// Funções auxiliares
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'status-message';
    }, 5000);
}

// Toggle de tema
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeIcon();
    saveData();
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = isDarkMode ? '☀️' : '🌙';
}

// Persistência de dados (LocalStorage)
function saveData() {
    localStorage.setItem('vpn_availableCredentials', JSON.stringify(availableCredentials));
    localStorage.setItem('vpn_usedCredentials', JSON.stringify(usedCredentials));
    localStorage.setItem('vpn_isAdmin', JSON.stringify(isAdmin));
    localStorage.setItem('vpn_isDarkMode', JSON.stringify(isDarkMode));
}

function loadData() {
    const savedAvailable = localStorage.getItem('vpn_availableCredentials');
    const savedUsed = localStorage.getItem('vpn_usedCredentials');
    const savedIsAdmin = localStorage.getItem('vpn_isAdmin');
    const savedDarkMode = localStorage.getItem('vpn_isDarkMode');

    if (savedAvailable) {
        availableCredentials = JSON.parse(savedAvailable);
    }

    if (savedUsed) {
        usedCredentials = JSON.parse(savedUsed);
    }

    if (savedIsAdmin) {
        isAdmin = JSON.parse(savedIsAdmin);
    }

    if (savedDarkMode) {
        isDarkMode = JSON.parse(savedDarkMode);
        document.body.classList.toggle('dark-mode', isDarkMode);
        updateThemeIcon();
    }
}
