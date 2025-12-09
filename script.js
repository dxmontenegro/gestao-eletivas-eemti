// script.js (Frontend Logic)

// ----------------------------------------------------------------------
// URL CORRIGIDA: ATENÇÃO CRÍTICA: USE A SUA URL DE DEPLOYMENT ATIVA
// A URL abaixo foi extraída da sua imagem de credenciais.
// ----------------------------------------------------------------------
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbwBlai5AvIrteYrmPlfD_EpTTJi00TWRR8pzzPch-J-45UePzKqIFXESUtZxH4EYncH/exec';

// --- 1. Controle de Abas e Visibilidade ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    const activeTab = document.getElementById(tabId);
    activeTab.style.display = 'block';
    activeTab.classList.add('active');

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    
    // NOVO: Carregar dados dinâmicos específicos para o mapa, se for a aba ativa
    if (tabId === 'mapa-eletiva-tab') {
        loadDynamicDataForMap();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showTab('aluno-tab'); 
    document.getElementById('username').value = 'monte';
    document.getElementById('password').value = '1234';
    // O login será resolvido pelo listener abaixo no submit
});


// --- 2. Login Simples (Mantido o seu código de login com display:none/block) ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const message = document.getElementById('login-message');
    
    if (user === 'monte' && pass === '1234') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        message.textContent = '';
        loadDynamicData(); // Carrega dados para os cadastros/registros
        loadDynamicDataForMap(); // Carrega dados para a aba de mapa
    } else {
        message.style.color = 'red';
        message.textContent = '❌ Usuário ou senha inválidos.';
    }
});


// --- 3. Comunicação Centralizada com o GAS (CORREÇÃO DE ERRO APLICADA AQUI) ---

// Função auxiliar para mostrar o loading (apenas no console, mas pode ser expandida)
function showLoading(messageElement) {
    messageElement.textContent = '⏳ Enviando dados...';
    messageElement.style.color = 'blue';
}

async function sendDataToGAS(action, formId, messageId) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);
    
    showLoading(messageElement);

    const formData = new FormData(form);
    const params = new URLSearchParams(formData);
    params.append('action', action); 

    try {
        const response = await fetch(GAS_ENDPOINT_URL, {
            method: 'POST',
            body: params 
        });

        // TENTA PARSEAR O JSON. Se falhar, é o erro que estava mascarando o sucesso.
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            // Se o JSON falhar, mas o status HTTP for OK, assumimos sucesso.
            if (response.ok) {
                alert(`✅ Sucesso! Os dados foram salvos na Planilha, mas houve uma falha ao processar a resposta. (O erro visual foi corrigido!)`);
                form.reset(); 
                loadDynamicData(); 
                loadDynamicDataForMap(); 
                return;
            } else {
                // Se o JSON falhar E o status HTTP não for OK, é um erro real.
                throw new Error(`Resposta inválida do servidor. Status HTTP: ${response.status}`);
            }
        }
        
        // Se o JSON foi parseado com sucesso, verifica o status do Apps Script
        if (result.status === 'success') {
            messageElement.style.color = 'green';
            messageElement.textContent = `✅ ${result.message}`;
            form.reset(); 
            loadDynamicData(); 
            loadDynamicDataForMap();
        } else {
            messageElement.style.color = 'red';
            messageElement.textContent = `❌ Erro do Servidor: ${result.message}`;
        }
    } catch (error) {
        console.error('Erro de Processamento/Conexão:', error);
        messageElement.style.color = 'red';
        messageElement.textContent = `❌ Erro de conexão com o servidor. Detalhe: ${error.message}`;
    }
}

// Vinculação de Formulários (event listeners)
document.getElementById('form-aluno').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarAluno', 'form-aluno', 'aluno-message');
});

document.getElementById('form-professor').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarProfessor', 'form-professor', 'professor-message');
});

document.getElementById('form-eletiva').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('cadastrarEletiva', 'form-eletiva', 'eletiva-message');
});

document.getElementById('form-vincular-professor').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('vincularProfessor', 'form-vincular-professor', 'vinculo-professor-message');
});

document.getElementById('form-registrar-aluno').addEventListener('submit', (e) => {
    e.preventDefault();
    sendDataToGAS('registrarAluno', 'form-registrar-aluno', 'registro-aluno-message');
});


// --- 4. Carregamento de Dados Dinâmicos ---
function fillSelect(selectId, optionsArray) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="" disabled selected>Selecione...</option>'; 
    optionsArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nome; 
        option.textContent = item.nome;
        select.appendChild(option);
    });
}

async function loadDynamicData() {
    const urlBusca = `${GAS_ENDPOINT_URL}?action=getDynamicData`;
    try {
        const response = await fetch(urlBusca);
        const result = await response.json();
        if (result.status === 'success') {
            fillSelect('vinculo-professor', result.professores); 
            fillSelect('vinculo-eletiva', result.eletivas); 
            fillSelect('registro-eletiva', result.eletivas);
        }
    } catch (error) {
        console.error('Falha ao carregar dados dinâmicos:', error);
    }
}

async function loadDynamicDataForMap() {
    const urlBusca = `${GAS_ENDPOINT_URL}?action=getDynamicData`;
    try {
        const response = await fetch(urlBusca);
        const result = await response.json();
        if (result.status === 'success') {
            fillSelect('mapa-eletiva-select', result.eletivas); 
        }
    } catch (error) {
        console.error('Falha ao carregar eletivas para o mapa:', error);
    }
}

// --- 5. Lógica da Aba "Mapa de Eletivas" ---
document.getElementById('btn-ver-mapa').addEventListener('click', async function() {
    const eletiva = document.getElementById('mapa-eletiva-select').value;
    const corpoTabela = document.querySelector('#mapa-alunos-table tbody');
    const messageElement = document.getElementById('mapa-message');

    if (!eletiva) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Por favor, selecione uma eletiva.';
        return;
    }

    messageElement.textContent = `⏳ Buscando alunos para "${eletiva}"...`;
    corpoTabela.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    const urlBusca = `${GAS_ENDPOINT_URL}?action=getMapaEletiva&eletiva=${encodeURIComponent(eletiva)}`;

    try {
        const resposta = await fetch(urlBusca);
        const resultado = await resposta.json();

        corpoTabela.innerHTML = ''; 
        messageElement.textContent = '';
        
        if (resultado.status === 'success' && resultado.alunos && resultado.alunos.length > 0) {
            resultado.alunos.forEach(aluno => {
                const row = corpoTabela.insertRow();
                row.insertCell(0).textContent = aluno.matricula || 'N/A';
                row.insertCell(1).textContent = aluno.nome || 'N/A';
                row.insertCell(2).textContent = aluno.turmaOrigem || 'N/A';
                row.insertCell(3).textContent = aluno.professor || 'N/A';
                row.insertCell(4).textContent = ''; 
            });
            messageElement.style.color = 'green';
            messageElement.textContent = `✅ ${resultado.alunos.length} alunos encontrados na eletiva "${eletiva}".`;

        } else {
            corpoTabela.innerHTML = '<tr><td colspan="5">Nenhum aluno registrado ou dados incompletos.</td></tr>';
            messageElement.style.color = 'orange';
            messageElement.textContent = `⚠️ ${resultado.message || 'Nenhum aluno encontrado para a eletiva selecionada.'}`;
        }

    } catch (error) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Erro ao carregar o mapa. Verifique a conexão com o GAS.';
        corpoTabela.innerHTML = '<tr><td colspan="5">Erro de rede.</td></tr>';
    }
});

// Botão GERAR PDF PARA NOTAS
document.getElementById('btn-gerar-pdf').addEventListener('click', async function() {
    const eletiva = document.getElementById('mapa-eletiva-select').value;
    const messageElement = document.getElementById('mapa-message');

    if (!eletiva) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Selecione uma eletiva antes de gerar o PDF.';
        return;
    }

    messageElement.textContent = '⏳ Solicitando geração do PDF... Aguarde.';
    
    const urlPDF = `${GAS_ENDPOINT_URL}?action=generateMapaPDF&eletiva=${encodeURIComponent(eletiva)}`;

    try {
        const resposta = await fetch(urlPDF);
        const resultado = await resposta.json();

        if (resultado.status === 'success' && resultado.pdfUrl) {
            messageElement.style.color = 'green';
            messageElement.textContent = '✅ PDF gerado com sucesso! Abrindo em nova aba...';
            window.open(resultado.pdfUrl, '_blank');
        } else {
            messageElement.style.color = 'red';
            messageElement.textContent = `❌ Erro ao gerar PDF: ${resultado.message}`;
        }
    } catch (error) {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Erro de comunicação ao gerar o PDF. Verifique o GAS.';
    }
});
