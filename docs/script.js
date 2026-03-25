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