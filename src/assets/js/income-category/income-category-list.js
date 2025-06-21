// 🔁 Função padrão: carrega as categorias das rendas sem ordenação
async function loadIncomesCategories() {

    const tbody = document.getElementById('income-category-table-body');
    if (!tbody) {
        console.error('Tabela de categoria de rendas não encontrada');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
       
        const response = await fetch(API_ROUTES.INCOME_CATEGORIES_ASYNC);

        if (!response.ok) throw new Error('Erro ao buscar dados da API');

        const incomeCategories = await response.json();

        renderAllIncomeCategoryViews(incomeCategories, API_ROUTES.INCOME_CATEGORIES_ASYNC);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar a categoria de renda: ${error.message}</td></tr>`;

        console.error('Erro ao buscar a categoria de rendas:', error);
    }
}

// 🆕 Função com ordenação: recebe a URL da rota ordenada
async function loadIncomesCategoriesOrdered(apiUrl) {
    const tbody = document.getElementById('income-category-table-body');
    if (!tbody) {
        console.error('Tabela de categoria de rendas não encontrada');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error('Erro ao buscar dados ordenados da API');

        const incomeCategories = await response.json();
        
        console.log('Categoria de rendas ordenadas:', incomeCategories);

        renderAllIncomeCategoryViews(incomeCategories, API_ROUTES.INCOME_CATEGORIES_ASYNC);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Erro: ${error.message}</td></tr>`;
        console.error('Erro ao carregar categoria de rendas ordenadas:', error);
    }

    document.getElementById('income-category-table-body').classList.add('loaded');
}

// ♻️ Função reutilizável para renderizar rendas
function renderIncomesCategories(incomeCategories, reloadUrl) {

    const tbody = document.getElementById('income-category-table-body');

    tbody.innerHTML = '';

    if (!incomeCategories || incomeCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhuma categoria de renda encontrada.</td></tr>';
        return;
    }

    incomeCategories.forEach(incomeCategory => {

        tbody.innerHTML += `
            <tr>
                <td class="text-center font-size">${incomeCategory.name}</td>
                <td class="text-center font-size">
                    <button class="btn btn-warning btn-sm btn-income-category-edit" 
                            title="Editar"
                            data-id="${incomeCategory.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-income-category-delete" 
                            title="Excluir"
                            data-id="${incomeCategory.id}" 
                            data-name="${incomeCategory.name}"
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
        </tr>
    `;

    document.querySelectorAll('.btn-income-category-delete').forEach(button => {
        button.addEventListener('click', async function () {
            const incomeCategoryId = this.getAttribute('data-id');
            const incomeCategoryName = this.getAttribute('data-name');
            const reloadUrl = this.getAttribute('data-reload');

            const result = await Swal.fire({
                title: `Você deseja excluir a categoria de renda "${incomeCategoryName}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim',
                cancelButtonText: 'Não',
            });

            if (result.isConfirmed) {
                try {
                    const deleteResponse = await fetch(`${API_ROUTES.INCOME_CATEGORIES_ASYNC}/${incomeCategoryId}`, {
                        method: 'DELETE',
                    });

                    if (!deleteResponse.ok) throw new Error('Erro ao excluir a categoria de renda');

                    Swal.fire({
                        icon: 'success',
                        title: 'Excluído!',
                        text: `A categoria de renda "${incomeCategoryName}" foi excluída com sucesso.`,
                        timer: 4500,
                        showConfirmButton: false,
                    });

                    // Recarrega a partir da rota usada (ordenada ou não)
                    if (reloadUrl === API_ROUTES.INCOME_CATEGORIES_ASYNC) {
                        loadIncomesCategories();
                    } else {
                        loadIncomesCategoriesOrdered(reloadUrl);
                    }

                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        timer: 4000,
                        text: `Falha ao excluir a categoria de renda "${incomeCategoryName}" Erro: ${error.message}`,
                    });
                }
            }
        });
    });

    // ✅ Adicione isso dentro da função renderIncomes
    document.querySelectorAll('.btn-income-category-edit').forEach(button => {
        button.addEventListener('click', function () {
            const incomeCategoryId = this.getAttribute('data-id');
            console.log(`Editando categoria de renda ID: ${incomeCategoryId}`);
            localStorage.setItem('editingIncomeCategoryId', incomeCategoryId);
            loadContent('income-category', 'income-category-update');
        });
    });

    document.getElementById('income-category-table-body').classList.add('loaded');
}

// 🔍 Filtro de categoria da rendas por texto
async function filterIncomesCategoriesByText() {
  const input = document.getElementById("filterText").value.trim().toLowerCase();
  const filterBy = document.querySelector('input[name="filterType"]:checked').value;

  if (input === "") {
    await loadIncomesCategories(); // carrega tudo
    return;
  }

  try {
    const response = await fetch(API_ROUTES.INCOME_CATEGORIES_ASYNC);
    const data = await response.json();

    const filtered = data.filter(incomeCategory => {
      const valueToCheck = (filterBy === "name" ? incomeCategory.name : incomeCategory.name) || "";
      return valueToCheck.toLowerCase().includes(input);
    });

    renderAllIncomeCategoryViews(filtered, API_ROUTES.INCOME_CATEGORIES_ASYNC);
  } catch (error) {
    console.error(`Erro ao filtrar a categoria de renda ${input}. Detalhe erro:`, error);
  }
}

// 🔁 Aplica debounce ao filtro de texto
if (typeof window.debounceTimeout === "undefined") {
    window.debounceTimeout = null;
}

function debounceFilterIncomesCategories(delay = 300) {
  const tbody = document.getElementById("income-category-table-body");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Filtrando...</td></tr>`;
  }

  clearTimeout(debounceTimeout);
  window.debounceTimeout = setTimeout(() => {
    filterIncomesCategoriesByText();
    }, delay);
}

function renderAllIncomeCategoryViews(incomesCategories, reloadUrl) {
 
    // ✅ Chama a função para renderizar as rendas ← agora sim, com as cores certas
    renderIncomesCategories(incomesCategories, reloadUrl);
}
