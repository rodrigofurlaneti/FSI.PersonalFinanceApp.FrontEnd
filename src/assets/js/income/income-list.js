const categoryColorMap = {};
let categoryMap = {}; // id → nome

// 🔁 Função padrão: carrega rendas sem ordenação
async function loadIncomes() {
    const tbody = document.getElementById('income-table-body');
    if (!tbody) {
        console.error('Tabela de rendas não encontrada');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        
        // ✅ agora carrega as categorias de fato
        categoryMap = await loadCategoryMap(); 

        const response = await fetch(API_ROUTES.INCOMES_ASYNC);

        if (!response.ok) throw new Error('Erro ao buscar dados da API');

        const incomes = await response.json();

        renderAllIncomeViews(incomes, API_ROUTES.INCOMES_ASYNC);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar rendas: ${error.message}</td></tr>`;
        console.error('Erro ao buscar rendas:', error);
    }
}

// 🆕 Função com ordenação: recebe a URL da rota ordenada
async function loadIncomesOrdered(apiUrl) {
    const tbody = document.getElementById('income-table-body');
    if (!tbody) {
        console.error('Tabela de rendas não encontrada');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        // ✅ Agora carrega as categorias de fato
        categoryMap = await loadCategoryMap(); 

        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error('Erro ao buscar dados ordenados da API');

        const incomes = await response.json();

        renderAllIncomeViews(incomes, API_ROUTES.INCOMES_ASYNC);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Erro: ${error.message}</td></tr>`;
        console.error('Erro ao carregar rendas ordenadas:', error);
    }

    document.getElementById('income-table-body').classList.add('loaded');
}

// ♻️ Função reutilizável para renderizar rendas
function renderIncomes(incomes, reloadUrl) {

    const tbody = document.getElementById('income-table-body');

    tbody.innerHTML = '';

    if (!incomes || incomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhuma renda encontrada.</td></tr>';
        return;
    }

    let total = 0;

    incomes.forEach(income => {
        total += income.amount;

        const categoryName = categoryMap[income.incomeCategoryId] || 'Sem categoria';
        
        // Cor padrão se não tiver no gráfico
        const categoryColor = categoryColorMap[categoryName] || '#6c757d'; 

        tbody.innerHTML += `
            <tr>
                <td class="text-center font-size">${income.name}</td>
                <td class="text-center font-size">${income.description}</td>
                <td class="text-center font-size">
                    <span class="badge" style="background-color: ${categoryColor}; color: #fff;">
                        ${categoryName}
                    </span>
                </td>
                <td class="text-center font-size">R$ ${income.amount.toFixed(2)}</td>
                <td class="text-center font-size">${new Date(income.incomeDate).toLocaleDateString()}</td>
                <td class="text-center font-size">${new Date(income.receivedAt).toLocaleDateString()}</td>
                <td class="text-center font-size">
                    <button class="btn btn-warning btn-sm btn-income-edit" 
                            title="Editar"
                            data-id="${income.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-income-delete" 
                            title="Excluir"
                            data-id="${income.id}" 
                            data-name="${income.description}"
                            data-reload="${reloadUrl}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML += `
        <tr style="font-weight: bold; background-color: #f8f9fa;">
            <td></td>
            <td></td>
            <td>Total</td>
            <td>R$ ${total.toFixed(2)}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    `;

    document.querySelectorAll('.btn-income-delete').forEach(button => {
        button.addEventListener('click', async function () {
            const incomeId = this.getAttribute('data-id');
            const incomeName = this.getAttribute('data-name');
            const reloadUrl = this.getAttribute('data-reload');

            const result = await Swal.fire({
                title: `Você deseja excluir a renda "${incomeName}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim',
                cancelButtonText: 'Não',
            });

            if (result.isConfirmed) {
                try {
                    const deleteResponse = await fetch(`${API_ROUTES.INCOMES_ASYNC}/${incomeId}`, {
                        method: 'DELETE',
                    });

                    if (!deleteResponse.ok) throw new Error('Erro ao excluir renda');

                    Swal.fire({
                        icon: 'success',
                        title: 'Excluído!',
                        text: `A renda ${incomeName} foi excluída com sucesso.`,
                        timer: 4500,
                        showConfirmButton: false,
                    });

                    // Recarrega a partir da rota usada (ordenada ou não)
                    if (reloadUrl === API_ROUTES.INCOMES_ASYNC) {
                        loadIncomes();
                    } else {
                        loadIncomesOrdered(reloadUrl);
                    }

                } catch (error) {
                    Swal.fire({
                        timer: 4000,
                        icon: 'error',
                        title: 'Erro',
                        text: `Falha ao excluir a renda ${incomeName}, Erro: ${error.message}`,
                    });
                }
            }
        });
    });

    // ✅ Adicione isso dentro da função renderIncomes
    document.querySelectorAll('.btn-income-edit').forEach(button => {
        button.addEventListener('click', function () {
            const incomeId = this.getAttribute('data-id');
            localStorage.setItem('editingIncomeId', incomeId);
            loadContent('income', 'income-update');
        });
    });

    document.getElementById('income-table-body').classList.add('loaded');
}


// 🔥 Função carrega as categorias
async function loadCategoryMap() {
    try {
        const response = await fetch(API_ROUTES.INCOME_CATEGORIES_ASYNC);
        if (!response.ok) throw new Error('Erro ao carregar categorias');

        const categories = await response.json();
        const map = {};

        categories.forEach(cat => {
            map[cat.id] = cat.name;
        });

        return map;
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        return {}; // retorna vazio caso falhe
    }
}

// 🔥 Função que desenha o gráfico
function renderIncomeChart(incomes) {
    const container = document.getElementById('income-chart');
    if (!container) return;

    // Converter para número
    const parsedIncomes = incomes.map(item => ({
        name: item.name,
        amount: typeof item.amount === 'number' ? item.amount : parseCurrency(item.amount)
    }));

    const total = parsedIncomes.reduce((sum, item) => sum + item.amount, 0);
    container.innerHTML = '';

    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'];

    parsedIncomes.forEach((item, index) => {
        const percentage = ((item.amount / total) * 100).toFixed(2);

        const bar = document.createElement('div');
        bar.classList.add('income-bar');

        bar.innerHTML = `
            <div class="income-bar-label">${item.name}</div>
            <div style="flex: 1; background-color: #e9ecef; border-radius: 4px;">
                <div class="income-bar-fill" style="width: ${percentage}%; background-color: ${colors[index % colors.length]};"></div>
            </div>
            <div class="income-bar-percentage">${percentage}%</div>
        `;

        container.appendChild(bar);
    });
}

// 🔥 Função que desenha o gráfico por categoria.
function renderIncomeChartByCategory(incomes) {
    const container = document.getElementById('income-category-chart');
    if (!container) return;

    const categoryTotals = {};

    // Agrupa rendas por categoria
    incomes.forEach(income => {
        const categoryName = categoryMap[income.incomeCategoryId] || 'Sem categoria';
        const amount = typeof income.amount === 'number' ? income.amount : parseCurrency(income.amount);
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
    });

    const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    container.innerHTML = '';

    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'];

    Object.entries(categoryTotals).forEach(([category, amount], index) => {
        const percentage = ((amount / total) * 100).toFixed(2);
        
        // ← salva a cor da categoria
        categoryColorMap[category] = colors[index % colors.length]; 
        
        const bar = document.createElement('div');
        bar.classList.add('income-bar');

        bar.innerHTML = `
            <div class="income-bar-label">${category}</div>
            <div style="flex: 1; background-color: #e9ecef; border-radius: 4px;">
                <div class="income-bar-fill" style="width: ${percentage}%; background-color: ${colors[index % colors.length]};"></div>
            </div>
            <div class="income-bar-percentage">${percentage}%</div>
        `;

        container.appendChild(bar);
    });
}

//Função para gráfico de rosca (donut)
function renderIncomeDonutChart(incomes) {
    const canvas = document.getElementById('income-donut-chart');
    const legend = document.getElementById('income-donut-legend');
    if (!canvas || !legend) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    legend.innerHTML = '';

    const categoryTotals = {};
    incomes.forEach(exp => {
        const name = categoryMap[exp.incomeCategoryId] || 'Sem categoria';
        const val = typeof exp.amount === 'number' ? exp.amount : parseCurrency(exp.amount);
        categoryTotals[name] = (categoryTotals[name] || 0) + val;
    });

    const entries = Object.entries(categoryTotals);
    const total = entries.reduce((sum, [_, val]) => sum + val, 0);
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14'];

    let startAngle = 0;
    entries.forEach(([label, value], i) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle);
        ctx.arc(150, 150, 60, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();
        startAngle += sliceAngle;

        // ⬅️ Monta a legenda da categoria
        const legendItem = document.createElement('div');
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${colors[i % colors.length]};"></span>
            ${label}
        `;
        legend.appendChild(legendItem);
    });

    canvas.classList.remove('visible');
    setTimeout(() => {
        canvas.classList.add('visible');
    }, 50);
}


//Função para desenhar o gráfico de pizza
function renderIncomePieChart(incomes) {
    const canvas = document.getElementById('income-pie-chart');
    const legend = document.getElementById('income-pie-legend');
    if (!canvas || !legend) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    legend.innerHTML = '';

    const parsed = incomes.map(e => ({
        label: e.name,
        value: typeof e.amount === 'number' ? e.amount : parseCurrency(e.amount)
    }));

    const total = parsed.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14'];

    let startAngle = 0;
    parsed.forEach((item, i) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        startAngle += sliceAngle;

        // ⬅️ Monta a legenda
        const legendItem = document.createElement('div');
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${colors[i % colors.length]};"></span>
            ${item.label}
        `;
        legend.appendChild(legendItem);
    });

    canvas.classList.remove('visible');

    setTimeout(() => {
        canvas.classList.add('visible');
    }, 50);
}

async function filterIncomesByText() {
  const input = document.getElementById("filterText").value.trim().toLowerCase();
  const filterBy = document.querySelector('input[name="filterType"]:checked').value;

  if (input === "") {
    await loadIncomes(); // carrega tudo
    return;
  }

  try {
    const response = await fetch(API_ROUTES.INCOMES_ASYNC);
    const data = await response.json();

    const filtered = data.filter(income => {
      const valueToCheck = (filterBy === "name" ? income.name : income.description) || "";
      return valueToCheck.toLowerCase().includes(input);
    });

    renderAllIncomeViews(filtered, API_ROUTES.INCOMES_ASYNC);
  } catch (error) {
    console.error("Erro ao filtrar rendas:", error);
  }
}

// 🔁 Aplica debounce ao filtro de texto
let debounceTimeout;

function debounceFilterIncomes(delay = 300) {
  const tbody = document.getElementById("income-table-body");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Filtrando...</td></tr>`;
  }

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    filterIncomesByText(); // ou loadFilteredIncomes()
  }, delay);
}

function renderAllIncomeViews(incomes, reloadUrl) {
    
    // ✅ Chama a função para renderizar o gráfico de rendas 
    renderIncomeChart(incomes);
    
    // ✅ Chama a função para renderizar o gráfico de rendas por categoria ← gera o categoryColorMap
    renderIncomeChartByCategory(incomes);

    // ✅ Chama a função para renderizar o gráfico de rendas pizza por nome
    renderIncomePieChart(incomes);

    // ✅ Chama a função para renderizar o gráfico de rendas Donut por categoria
    renderIncomeDonutChart(incomes);

    // ✅ Chama a função para renderizar as rendas ← agora sim, com as cores certas
    renderIncomes(incomes, reloadUrl);
}
