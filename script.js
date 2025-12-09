// script.js - Versão Firestore (compatível com seu HTML original)
// Requisitos: index.html deve inicializar Firebase e expor "db" globalmente.

// -----------------------------
// 1. Controle de Abas e Inicial
// -----------------------------
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => {
    t.style.display = 'none';
    t.classList.remove('active');
  });
  const active = document.getElementById(tabId);
  if (active) {
    active.style.display = 'block';
    active.classList.add('active');
  }
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  if (tabId === 'mapa-eletiva-tab') {
    loadDynamicDataForMap();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  showTab('aluno-tab');
  const u = document.getElementById('username');
  const p = document.getElementById('password');
  if (u) u.value = 'monte';
  if (p) p.value = '1234';
  loadDynamicData();
});

// -----------------------------
// 2. Login simples
// -----------------------------
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value.trim();
    const msg = document.getElementById('login-message');
    if (user === 'monte' && pass === '1234') {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main-system').style.display = 'block';
      if (msg) msg.textContent = '';
      loadDynamicData();
    } else {
      if (msg) {
        msg.style.color = 'red';
        msg.textContent = 'Usuário ou senha inválidos.';
      }
    }
  });
}

// -----------------------------
// Helpers Firestore
// -----------------------------
async function docByField(collectionName, field, value) {
  const q = await db.collection(collectionName).where(field, '==', value).limit(1).get();
  if (!q.empty) return { id: q.docs[0].id, data: q.docs[0].data(), ref: q.docs[0].ref };
  return null;
}

function setMessage(id, text, color = 'black') {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color = color;
  el.textContent = text;
}

// -----------------------------
// 3. Cadastrar Aluno (sem matrícula manual)
// -----------------------------
const formAluno = document.getElementById('form-aluno');
if (formAluno) {
  formAluno.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('aluno-nome').value.trim();
    const turma = document.getElementById('aluno-turma').value.trim();
    const msgId = 'aluno-message';

    if (!nome || !turma) {
      setMessage(msgId, 'Preencha nome e turma.', 'red'); return;
    }

    try {
      const docRef = await db.collection('alunos').add({
        nome,
        turma,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setMessage(msgId, 'Aluno cadastrado com sucesso.', 'green');
      e.target.reset();
      loadDynamicData(); // atualiza selects
    } catch (err) {
      console.error(err);
      setMessage(msgId, 'Erro ao cadastrar aluno.', 'red');
    }
  });
}

// -----------------------------
// 4. Cadastrar Professor
// -----------------------------
const formProfessor = document.getElementById('form-professor');
if (formProfessor) {
  formProfessor.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('professor-nome').value.trim();
    const msgId = 'professor-message';
    if (!nome) { setMessage(msgId, 'Informe o nome do professor.', 'red'); return; }

    try {
      // Salva documento com id gerado; campo nome permite buscas
      await db.collection('professores').add({
        nome,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setMessage(msgId, 'Professor cadastrado.', 'green');
      e.target.reset();
      loadDynamicData();
    } catch (err) {
      console.error(err);
      setMessage(msgId, 'Erro ao cadastrar professor.', 'red');
    }
  });
}

// -----------------------------
// 5. Cadastrar Eletiva
// -----------------------------
const formEletiva = document.getElementById('form-eletiva');
if (formEletiva) {
  formEletiva.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('eletiva-nome').value.trim();
    const vagas = Number(document.getElementById('eletiva-vagas').value);
    const msgId = 'eletiva-message';
    if (!nome || !vagas) { setMessage(msgId, 'Informe nome e vagas.', 'red'); return; }

    try {
      // salva eletiva com id próprio (nome) para facilitar buscas; normaliza removendo espaços
      const id = nome.trim();
      await db.collection('eletivas').doc(id).set({
        nome,
        vagas,
        professor: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setMessage(msgId, 'Eletiva cadastrada.', 'green');
      e.target.reset();
      loadDynamicData();
    } catch (err) {
      console.error(err);
      setMessage(msgId, 'Erro ao cadastrar eletiva.', 'red');
    }
  });
}

// -----------------------------
// 6. Vincular Professor à Eletiva
// -----------------------------
const formVinculo = document.getElementById('form-vincular-professor');
if (formVinculo) {
  formVinculo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const professor = document.getElementById('vinculo-professor').value;
    const eletiva = document.getElementById('vinculo-eletiva').value;
    const msgId = 'vinculo-professor-message';
    if (!professor || !eletiva) { setMessage(msgId, 'Selecione professor e eletiva.', 'red'); return; }

    try {
      // Atualiza eletiva.doc -> professor
      await db.collection('eletivas').doc(eletiva).update({ professor });
      // Opcional: atualiza professor document para referência (procura doc do professor pelo nome)
      const profDoc = await docByField('professores', 'nome', professor);
      if (profDoc) {
        await profDoc.ref.update({ eletiva });
      }
      setMessage(msgId, 'Professor vinculado à eletiva.', 'green');
      loadDynamicData();
    } catch (err) {
      console.error(err);
      setMessage(msgId, 'Erro ao vincular professor.', 'red');
    }
  });
}

// -----------------------------
// 7. Registrar Aluno na Eletiva (busca por NOME)
// -----------------------------
const formRegistrar = document.getElementById('form-registrar-aluno');
if (formRegistrar) {
  formRegistrar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const busca = document.getElementById('registro-matricula').value.trim(); // nome do aluno (campo reaproveitado)
    const eletiva = document.getElementById('registro-eletiva').value;
    const msgId = 'registro-aluno-message';
    if (!busca || !eletiva) { setMessage(msgId, 'Informe o nome do aluno e a eletiva.', 'red'); return; }

    try {
      // tenta achar aluno pelo nome exato (case-sensitive igual ao cadastro)
      const alunoQuery = await db.collection('alunos').where('nome', '==', busca).limit(1).get();
      if (alunoQuery.empty) {
        setMessage(msgId, 'Aluno não encontrado. Cadastre-o antes ou verifique o nome exato.', 'red');
        return;
      }
      const alunoDoc = alunoQuery.docs[0];
      // grava no registro: usamos studentId (doc id), eletiva e timestamp
      await db.collection('registro').add({
        studentId: alunoDoc.id,
        eletiva,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setMessage(msgId, 'Aluno registrado na eletiva.', 'green');
      e.target.reset();
    } catch (err) {
      console.error(err);
      setMessage(msgId, 'Erro ao registrar aluno.', 'red');
    }
  });
}

// -----------------------------
// 8. Carregar dados dinâmicos (selects)
// -----------------------------
async function loadDynamicData() {
  try {
    // professores
    const profSnap = await db.collection('professores').orderBy('nome').get();
    const profs = profSnap.docs.map(d => d.data().nome);

    // eletivas
    const eletSnap = await db.collection('eletivas').orderBy('nome').get();
    const eletivas = eletSnap.docs.map(d => d.data().nome);

    fillSelect('vinculo-professor', profs, 'Selecione o Professor');
    fillSelect('vinculo-eletiva', eletivas, 'Selecione a Eletiva');
    fillSelect('registro-eletiva', eletivas, 'Selecione a Eletiva');
    fillSelect('mapa-eletiva-select', eletivas, 'Selecione a Eletiva');
  } catch (err) {
    console.error('Erro ao carregar dados dinâmicos', err);
  }
}

function fillSelect(id, arr, placeholder = 'Selecione...') {
  const s = document.getElementById(id);
  if (!s) return;
  s.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
  if (!arr || arr.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = '— Nenhum registro —';
    s.appendChild(opt);
    return;
  }
  arr.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    s.appendChild(opt);
  });
}

// -----------------------------
// 9. Ver mapa da eletiva (oculta matrícula)
// -----------------------------
document.getElementById('btn-ver-mapa').addEventListener('click', async () => {
  const eletiva = document.getElementById('mapa-eletiva-select').value;
  const msgId = 'mapa-message';
  const tbody = document.querySelector('#mapa-alunos-table tbody');

  if (!eletiva) { setMessage(msgId, 'Selecione uma eletiva.', 'red'); return; }

  try {
    setMessage(msgId, 'Carregando...', 'blue');
    tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    // busca registros da eletiva
    const regsSnap = await db.collection('registro').where('eletiva', '==', eletiva).get();

    // busca professor vinculado na eletiva
    const eletDoc = await db.collection('eletivas').doc(eletiva).get();
    const professor = eletDoc.exists ? (eletDoc.data().professor || 'Não Vinculado') : 'Não Vinculado';

    tbody.innerHTML = '';

    if (regsSnap.empty) {
      tbody.innerHTML = '<tr><td colspan="5">Nenhum aluno registrado.</td></tr>';
      setMessage(msgId, 'Nenhum aluno registrado.', 'orange');
      hideMatriculaColumn(true);
      return;
    }

    // percorre registros e monta tabela
    for (const doc of regsSnap.docs) {
      const r = doc.data();
      // pega aluno pelo studentId
      const studentRef = db.collection('alunos').doc(r.studentId);
      const studentSnap = await studentRef.get();
      if (!studentSnap.exists) continue;
      const aluno = studentSnap.data();

      const tr = document.createElement('tr');
      // coluna Matrícula ficará oculta (opção 2). Para compatibilidade, ainda criamos a célula, mas deixamos vazia.
      tr.innerHTML = `
        <td class="col-matricula"></td>
        <td>${escapeHtml(aluno.nome || '')}</td>
        <td>${escapeHtml(aluno.turma || '')}</td>
        <td>${escapeHtml(professor)}</td>
        <td></td>
      `;
      tbody.appendChild(tr);
    }

    // oculta coluna matrícula no mapa (tanto header quanto células)
    hideMatriculaColumn(true);

    setMessage(msgId, `${regsSnap.size} alunos carregados.`, 'green');
  } catch (err) {
    console.error(err);
    setMessage('mapa-message', 'Erro ao carregar mapa.', 'red');
  }
});

// -----------------------------
// 10. Gerar PDF / Imprimir (abre nova janela com mapa)
// -----------------------------
document.getElementById('btn-gerar-pdf').addEventListener('click', async () => {
  const eletiva = document.getElementById('mapa-eletiva-select').value;
  const msgId = 'mapa-message';
  const tbody = document.querySelector('#mapa-alunos-table tbody');

  if (!eletiva) { setMessage(msgId, 'Selecione uma eletiva antes de gerar PDF.', 'red'); return; }
  if (!tbody || tbody.children.length === 0) { setMessage(msgId, 'Gere o mapa antes de imprimir.', 'red'); return; }

  // Monta HTML do mapa para impressão
  const title = `Mapa - ${eletiva}`;
  const eletDoc = await db.collection('eletivas').doc(eletiva).get();
  const professor = eletDoc.exists ? (eletDoc.data().professor || 'Não Vinculado') : 'Não Vinculado';

  let rowsHtml = '';
  Array.from(tbody.children).forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length < 4) return;
    const nome = tds[1].textContent;
    const turma = tds[2].textContent;
    const prof = tds[3].textContent;
    rowsHtml += `<tr><td>${escapeHtml(nome)}</td><td>${escapeHtml(turma)}</td><td>${escapeHtml(prof)}</td></tr>`;
  });

  const html = `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;padding:18px;}
          h2{margin:0 0 12px 0;}
          table{width:100%;border-collapse:collapse;margin-top:12px;}
          th,td{border:1px solid #ddd;padding:8px;text-align:left;}
          th{background:#f4f6f8;}
          .meta{margin-top:8px;font-size:14px;color:#444;}
        </style>
      </head>
      <body>
        <h2>${escapeHtml(title)}</h2>
        <div class="meta"><strong>Professor:</strong> ${escapeHtml(professor)}</div>
        <table>
          <thead><tr><th>Nome</th><th>Turma</th><th>Professor</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;

  const w = window.open('', '_blank');
  if (!w) {
    setMessage(msgId, 'Impossível abrir nova janela (bloqueador de pop-up?).', 'red');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
});

// -----------------------------
// 11. Esconder/mostrar coluna Matrícula (opção 2)
// -----------------------------
function hideMatriculaColumn(hide) {
  // header
  const ths = document.querySelectorAll('#mapa-alunos-table thead th');
  if (ths && ths.length > 0) {
    // primeira coluna é Matrícula (index 0)
    if (hide) ths[0].style.display = 'none';
    else ths[0].style.display = '';
  }
  // linhas
  document.querySelectorAll('#mapa-alunos-table tbody tr').forEach(tr => {
    const td = tr.querySelector('.col-matricula');
    if (td) td.style.display = hide ? 'none' : '';
  });
}

// -----------------------------
// 12. Utilitários
// -----------------------------
function escapeHtml(s) {
  if (!s && s !== 0) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}





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

















