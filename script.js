// script.js (Frontend Logic)

// ----------------------------------------------------------------------
// SUA URL FINAL DE DEPLOYMENT DO APPS SCRIPT
// ----------------------------------------------------------------------
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbwBIai5AvIrteYrmPlfD_EpTTJi00TWRR8pzzPch-J-45UePzKqIFXESUtZxH4EYncH/exec';

// Função auxiliar para mostrar o loading
function showLoading() {
    // Implemente a lógica para mostrar um ícone de carregamento
    console.log("Aguardando resposta do servidor...");
}

// Função auxiliar para esconder o loading
function hideLoading() {
    // Implemente a lógica para esconder o ícone de carregamento
    console.log("Processamento concluído.");
}

// Função para enviar dados
async function sendDataToGAS(action, formData) {
    showLoading();

    const options = {
        method: 'POST',
        body: formData // FormData é usado para requisições com dados de formulário
    };

    try {
        const response = await fetch(GAS_ENDPOINT_URL, options);
        
        // 1. Verifica se a resposta HTTP é 200 OK
        if (!response.ok) {
            throw new Error(`Falha na comunicação HTTP: ${response.status} ${response.statusText}`);
        }
        
        // 2. Tenta parsear o JSON
        const data = await response.json();

        // 3. Verifica o status do Apps Script
        if (data.status === 'success') {
            alert(`✅ Sucesso! ${data.message}`);
            // Recarrega dados dinâmicos se necessário (ex: após cadastro de Eletiva)
            if (action === 'cadastrarEletiva' || action === 'cadastrarProfessor') {
                 loadDynamicData(); 
            }
            return true;
        } else {
            alert(`⚠️ Erro do Servidor: ${data.message}`);
            return false;
        }

    } catch (error) {
        console.error('Erro de Processamento de Resposta/Conexão:', error);
        // Mensagem útil para o erro que estava mascarando o sucesso
        alert('⚠️ Erro no processamento da resposta. Por favor, verifique a Planilha (o cadastro pode ter sido concluído).');
        return false;

    } finally {
        hideLoading();
    }
}

// Função para carregar dados (GET)
async function loadDynamicData() {
    // ... Implementação da função loadDynamicData (que usa doGet)
    const url = `${GAS_ENDPOINT_URL}?action=getDynamicData`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'success' && data.professores && data.eletivas) {
            // Lógica para preencher dropdowns (selects)
            console.log("Dados dinâmicos carregados com sucesso.");
            return data;
        } else {
            console.error("Erro ao carregar dados dinâmicos:", data.message);
        }

    } catch (error) {
        console.error("Falha ao buscar dados dinâmicos:", error);
    }
}

// Listener para o formulário de Cadastro de Aluno (Exemplo)
// document.getElementById('formAluno').addEventListener('submit', async function(e) {
//     e.preventDefault();
//     const formData = new FormData(this);
//     formData.append('action', 'cadastrarAluno');
//     const result = await sendDataToGAS('cadastrarAluno', formData);
//     if (result) this.reset();
// });

// (Continue com os demais listeners de formulário no seu script.js)
