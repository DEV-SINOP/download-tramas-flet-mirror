// Path do arquivo update.json
const updateJsonPath = 'update.json';

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
    // JSON real usa download_url (e também aceitaremos downloadUrl por compatibilidade)
    document.getElementById('download-link').href = updateData.download_url || updateData.downloadUrl || '#';
  } catch (error) {
    console.error('Erro ao carregar as informações da atualização:', error);
    document.getElementById('current-version').textContent = 'Erro ao carregar versão';
    document.getElementById('last-update').textContent = 'Erro ao carregar data';
  }
}

// Carregar dados assim que o JavaScript for executado
loadUpdateInfo();
loadNotices();

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

    let currentActiveIndex = 0;

    const renderActiveNotice = index => {
      if (!activeNotices.length) {
        activeTextEl.textContent = 'Nenhum aviso ativo';
        detailsEl.style.display = 'none';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }
      const notice = activeNotices[index];
      activeTextEl.textContent = `${index + 1} / ${activeNotices.length} • ${notice.title || 'Aviso ativo'}`;
      titleEl.textContent = notice.title || '-';
      messageEl.textContent = notice.message || '-';
      dateEl.textContent = notice.updated_at ? new Date(notice.updated_at).toLocaleString('pt-BR') : '-';
      detailsEl.style.display = 'block';
      prevBtn.disabled = activeNotices.length <= 1;
      nextBtn.disabled = activeNotices.length <= 1;
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