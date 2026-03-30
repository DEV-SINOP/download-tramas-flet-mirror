// Path do arquivo update.json
const updateJsonPath = 'update.json';

// Configuração do repositório GitHub (substitua pelo seu nome/repo)
const GITHUB_REPO = 'DEV-SINOP/download-tramas-flet-mirror';

// Função para injetar o widget Utterances na página
function loadUtterances() {
  const container = document.getElementById('utterances-container');
  if (!container) return;

  const script = document.createElement('script');
  script.src = 'https://utteranc.es/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('repo', GITHUB_REPO);
  script.setAttribute('issue-term', 'pathname');
  script.setAttribute('label', 'feedback');
  script.setAttribute('theme', 'github-light');

  container.innerHTML = '';
  container.appendChild(script);
}

// Função para carregar dados sobre a atualização
async function loadUpdateInfo() {
  try {
    const response = await fetch(updateJsonPath);
    if (!response.ok) {
      throw new Error(`Erro ao carregar arquivo: ${response.status}`);
    }
    const updateData = await response.json();

    // Atualizar a página com informações do JSON
    document.getElementById('current-version').textContent = updateData.version || 'Informação não disponível';
    // JSON real usa updated_at (e também aceitaremos lastUpdate por compatibilidade)
    const lastUpdateRaw = updateData.updated_at || updateData.lastUpdate;
    let lastUpdateText = 'Informação não disponível';
    if (lastUpdateRaw) {
      const parsedDate = new Date(lastUpdateRaw);
      lastUpdateText = !isNaN(parsedDate) ? parsedDate.toLocaleString('pt-BR') : lastUpdateRaw;
    }
    document.getElementById('last-update').textContent = lastUpdateText;
    document.getElementById('recommended-compiler').textContent = updateData.compiler || 'Não especificado';
    // Preferência para novos campos de download por bundle
    const pyinstallerUrl = updateData.pyinstaller_download_url || updateData.pyinstallerDownloadUrl || updateData.download_url || '#';
    const nuitkaUrl = updateData.nuitka_download_url || updateData.nuitkaDownloadUrl || '#';

    const pyinstallerLink = document.getElementById('pyinstaller-link');
    const nuitkaLink = document.getElementById('nuitka-link');

    pyinstallerLink.href = pyinstallerUrl;
    nuitkaLink.href = nuitkaUrl;

    if (!pyinstallerUrl || pyinstallerUrl === '#') {
      pyinstallerLink.textContent = 'PyInstaller indisponível';
      pyinstallerLink.classList.add('disabled');
      pyinstallerLink.removeAttribute('download');
      pyinstallerLink.style.pointerEvents = 'none';
      pyinstallerLink.style.opacity = '0.6';
    }

    if (!nuitkaUrl || nuitkaUrl === '#') {
      nuitkaLink.textContent = 'Nuitka indisponível';
      nuitkaLink.classList.add('disabled');
      nuitkaLink.removeAttribute('download');
      nuitkaLink.style.pointerEvents = 'none';
      nuitkaLink.style.opacity = '0.6';
    }
  } catch (error) {
    console.error('Erro ao carregar as informações da atualização:', error);
    document.getElementById('current-version').textContent = 'Erro ao carregar versão';
    document.getElementById('last-update').textContent = 'Erro ao carregar data';
  }
}

// Carregar dados assim que o JavaScript for executado
loadUpdateInfo();
loadNotices();
loadUtterances();
loadRankingSupabase();

// Ranking Supabase
async function loadRankingSupabase() {
  const endpoint = 'https://dkuhjwwgsusqvgrdwmej.supabase.co/rest/v1/ranking?select=*';
  const key = 'sb_publishable_IbXpH_lmqpxYXUtoanDYjA_XUEE7Um9';
  const msg = document.getElementById('ranking-error');
  const tbody = document.querySelector('#ranking-table tbody');

  if (!msg || !tbody) return;
  msg.style.display = 'none';
  msg.textContent = '';
  tbody.innerHTML = '';

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Resposta inválida do ranking.');
    }

    const sorted = data.slice().sort((a, b) => (b.total_mb || 0) - (a.total_mb || 0));
    const top10 = sorted.slice(0, 10);

    top10.forEach((item, index) => {
      const rank = index + 1;
      const user = item.usuario || item.user || item.nome || 'Desconhecido';
      const totalMb = Number(item.total_mb || 0);
      const totalDisplay = totalMb >= 1000 ? `${(totalMb / 1024).toFixed(1)} GB` : `${totalMb.toFixed(0)} MB`;
      let medal = '';
      if (rank === 1) medal = ' 🥇';
      if (rank === 2) medal = ' 🥈';
      if (rank === 3) medal = ' 🥉';

      const createdAtRaw = item.created_at || item.updated_at || null;
      const createdAtText = createdAtRaw ? new Date(createdAtRaw).toLocaleString('pt-BR') : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${rank}${medal}</td><td>${user}</td><td>${totalDisplay}</td><td>${createdAtText}</td>`;
      tbody.appendChild(tr);
    });

    if (!top10.length) {
      msg.style.display = 'block';
      msg.textContent = 'Nenhum registro encontrado no ranking.';
    }
  } catch (error) {
    msg.style.display = 'block';
    msg.textContent = 'Não foi possível carregar o ranking. Verifique conexão e tente novamente.';
    console.error(error);
  }
}


// Função para carregar avisos (notices.json)
async function loadNotices() {
  const noticesPath = 'notices.json';
  try {
    const response = await fetch(noticesPath);
    if (!response.ok) {
      throw new Error(`Erro ao carregar notices: ${response.status}`);
    }
    const noticesData = await response.json();

    if (!Array.isArray(noticesData)) {
      throw new Error('Formato inválido do notices.json: deve ser um array.');
    }

    const activeNotices = noticesData.filter(n => n.active);
    const activeTextEl = document.getElementById('active-notice');
    const titleEl = document.getElementById('notice-title');
    const messageEl = document.getElementById('notice-message');
    const dateEl = document.getElementById('notice-date');
    const detailsEl = document.getElementById('notice-details');
    const historyEl = document.getElementById('notice-history');
    const prevBtn = document.getElementById('prev-notice');
    const nextBtn = document.getElementById('next-notice');
    const counterEl = document.getElementById('notice-counter');
    const controlsEl = document.getElementById('notice-controls');

    let currentActiveIndex = 0;

    const renderActiveNotice = index => {
      if (!activeNotices.length) {
        activeTextEl.textContent = 'Nenhum aviso ativo';
        detailsEl.style.display = 'none';
        controlsEl.style.display = 'none';
        return;
      }

      const notice = activeNotices[index];
      activeTextEl.textContent = `${notice.title || 'Aviso ativo'}`;
      titleEl.textContent = notice.title || '-';
      messageEl.textContent = notice.message || '-';
      dateEl.textContent = notice.updated_at ? new Date(notice.updated_at).toLocaleString('pt-BR') : '-';
      detailsEl.style.display = 'block';

      if (activeNotices.length > 1) {
        controlsEl.style.display = 'flex';
        counterEl.textContent = `${index + 1} de ${activeNotices.length}`;
      } else {
        controlsEl.style.display = 'none';
      }
    };

    prevBtn.addEventListener('click', () => {
      if (!activeNotices.length) return;
      currentActiveIndex = (currentActiveIndex - 1 + activeNotices.length) % activeNotices.length;
      renderActiveNotice(currentActiveIndex);
    });

    nextBtn.addEventListener('click', () => {
      if (!activeNotices.length) return;
      currentActiveIndex = (currentActiveIndex + 1) % activeNotices.length;
      renderActiveNotice(currentActiveIndex);
    });

    renderActiveNotice(currentActiveIndex);

    historyEl.innerHTML = ''; // limpar histórico
    const sorted = noticesData.slice().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    sorted.forEach(notice => {
      const item = document.createElement('li');
      const date = notice.updated_at ? new Date(notice.updated_at).toLocaleString('pt-BR') : 'Data desconhecida';
      item.textContent = `${date} · ${notice.title || 'sem título'} ${notice.active ? '(ativo)' : ''}`;
      historyEl.appendChild(item);
    });
  } catch (error) {
    console.error('Erro ao carregar notices:', error);
    document.getElementById('active-notice').textContent = 'Erro ao carregar avisos';
  }
}