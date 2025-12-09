// script.js - Versão corrigida (compatível com seu HTML original + Firestore)
// Observação: exige que 'db' exista globalmente (inicializado no index.html)

// -----------------------------
// 0. Segurança / helpers
// -----------------------------
function safeQuery(selector) {
  try { return document.querySelector(selector); } catch { return null; }
}
function safeQueryAll(selector) {
  try { return Array.from(document.querySelectorAll(selector)); } catch { return []; }
}
function setMessage(id, text, color = 'black') {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color = color;
  el.textContent = text;
}
function escapeHtml(s) {
  if (!s && s !== 0) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// -----------------------------
// 1. Controle de Abas (robusto)
// -----------------------------
function showTab(tabId) {
  // esconder todas
  safeQueryAll('.tab-content').forEach(t => {
    t.style.display = 'none';
    t.classList.remove('active');
  });

  // mostrar a solicitada
  const active = document.getElementById(tabId);
  if (active) {
    active.style.display = 'block';
    active.classList.add('active');
  } else {
    console.warn('showTab: aba não encontrada ->', tabId);
  }

  // atualizar estado dos botões
  safeQueryAll('.tab-button').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
}

// garante que os botões de aba chamem showTab mesmo que onclick esteja faltando
function bindTabButtons() {
  const buttons = safeQueryAll('.tab-button');
  buttons.forEach(btn => {
    // evita duplicar listeners
    if (!btn.dataset.bound) {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        if (tab) showTab(tab);
      });
      btn.dataset.bound = '1';
    }
  });
}

// -----------------------------
// 2. Inicialização geral
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  bindTabButtons();
  // exibe a aba inicial com segurança
  try {
    showTab('aluno-tab');
  } catch (err) {
    console.error('Erro ao mostrar aba inicial:', err);
  }

  // preencher campos de login (se existirem)
  const u = document.getElementById('username');
  const p = document.getElementById('password');
  if (u) u.value = 'monte';
  if (p) p.value = '1234';

  // se o login já estiver oculto por algum motivo, deixa visível o main-system (proteção)
  const main = document.getElementById('main-system');
  if (main && main.style.display === 'none') {
    // não forçar visibilidade sem login — mantemos comportamento normal
  }

  // Tenta carregar selects (se Firestore estiver disponível)
  try { loadDynamicData().catch(e => console.warn('loadDynamicData falhou:', e)); } catch {}
});

// -----------------------------
// 3. Login simples (mantém comportamento anterior)
// -----------------------------
const loginForm = safeQuery('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const user = (safeQuery('#username')?.value || '').trim().toLowerCase();
    const pass = (safeQuery('#password')?.value || '').trim();
    const msgEl = document.getElementById('login-message');

    if (user === 'monte' && pass === '1234') {
      // mostrar interface principal
      const loginScreen = document.getElementById('login-screen');
      const mainSystem = document.getElementById('main-system');
      if (loginScreen) loginScreen.style.display = 'none';
      if (mainSystem) mainSystem.style.display = 'block';

      // garante que abas estão vinculadas e exibe a inicial
      bindTabButtons();
      showTab('aluno-tab');
      // carrega dados (Firestore)
      if (typeof loadDynamicData === 'function') {
        loadDynamicData().catch(e => console.error('Erro loadDynamicData após login:', e));
      }
      if (msgEl) msgEl.textContent = '';
    } else {
      if (msgEl) {
        msgEl.style.color = 'red';
        msgEl.textContent = 'Usuário ou senha inválidos.';
      }
    }
  });
}

// -----------------------------
// 4. Funções Firestore / Operações (mantidas do script anterior)
// -----------------------------
// (aqui assumimos que você já tem a versão Firestore do script
//  com todas as handlers de formulário: cadastrar aluno, professor, eletiva,
//  vincular professor, registrar aluno, ver mapa, gerar PDF, etc.)
//
// Para evitar duplicação, se você já tem o script completo abaixo (funcional),
// apenas garanta que ele seja carregado após este arquivo OR que as funções
// sejam definidas no mesmo script.js. Caso precise, recoloquerei o script
// completo com as handlers Firestore novamente.
//
// Exemplo: se loadDynamicData não existir, definimos um stub para evitar erro:
if (typeof loadDynamicData !== 'function') {
  async function loadDynamicData() {
    // stub — se seu script Firestore real estiver presente, esta função será substituída
    console.warn('loadDynamicData stub executado — verifique se o script Firestore foi carregado.');
    return;
  }
}

// -----------------------------
// 5. Proteções e logs para debug
// -----------------------------
window.addEventListener('error', (ev) => {
  console.error('Erro de runtime:', ev.message, 'em', ev.filename, 'linha', ev.lineno);
});
console.log('script.js carregado (versão robusta).');




// ... (Restante das funções: btn-ver-mapa, btn-gerar-pdf) ...


/*


// script.js (Frontend Logic)

// ----------------------------------------------------------------------
// URL FINAL E CORRETA (Confirmada pela Implantação)
// ----------------------------------------------------------------------
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbwBIai5AvIrteYrmPlfD_EpTTJi00TWRR8pzzPch-J-45UePzKqIFXESUtZxH4EYncH/exec';

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
    
    if (tabId === 'mapa-eletiva-tab') {
        loadDynamicDataForMap();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showTab('aluno-tab'); 
    document.getElementById('username').value = 'monte';
    document.getElementById('password').value = '1234';
});


// --- 2. Login Simples (CORRIGIDO com .trim() e .toLowerCase()) ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim(); 
    const pass = document.getElementById('password').value.trim(); 
    const message = document.getElementById('login-message');
    
    if (user.toLowerCase() === 'monte' && pass === '1234') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-system').style.display = 'block';
        message.textContent = '';
        loadDynamicData(); 
        loadDynamicDataForMap(); 
    } else {
        message.style.color = 'red';
        message.textContent = '❌ Usuário ou senha inválidos.';
    }
});


// --- 3. Comunicação Centralizada com o GAS (CORREÇÃO DE FORMATO APLICADA) ---

function showLoading(messageElement) {
    messageElement.textContent = '⏳ Enviando dados...';
    messageElement.style.color = 'blue';
}

async function sendDataToGAS(action, formId, messageId) {
    const form = document.getElementById(formId);
    const messageElement = document.getElementById(messageId);
    
    showLoading(messageElement);

    const formData = new FormData(form);
    const params = new URLSearchParams(); 
    
    // Configura os parâmetros no formato esperado pelo Apps Script
    params.append('action', action);
    for (const [key, value] of formData.entries()) {
        params.append(key, value);
    }
    
    try {
        const response = await fetch(GAS_ENDPOINT_URL, {
            method: 'POST',
            body: params,
            headers: {
                // ESSENCIAL para que o Apps Script consiga ler o e.parameter
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        // Tenta parsear o JSON para verificar a resposta do GAS
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            if (response.ok) {
                // Sucesso na Planilha (HTTP 200), mas falha ao ler a resposta
                alert(`✅ Sucesso! Os dados foram salvos na Planilha, mas houve uma falha ao processar a resposta. (Favor verificar a Planilha)`);
                form.reset(); 
                loadDynamicData(); 
                loadDynamicDataForMap(); 
                return;
            } else {
                // Falha HTTP real
                throw new Error(`Resposta inválida do servidor. Status HTTP: ${response.status}`);
            }
        }
        
        // Verifica o status interno do Apps Script
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
        messageElement.textContent = `❌ Erro de conexão com o servidor. Detalhe: ${error.message}.`;
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

*/


















