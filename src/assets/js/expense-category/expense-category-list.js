// 🔁 Função padrão: carrega as categorias das despesas sem ordenação
async function loadExpensesCategoriesFromMessaging() {
    const tbody = document.getElementById('expense-category-table-body');
    if (!tbody) {
        console.error('Tabela de categoria de despesas não encontrada');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
       
        const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_ASYNC);

        if (!response.ok) throw new Error('Erro ao buscar dados da API');

        const expenseCategories = await response.json();

        renderAllExpenseCategoryViews(expenseCategories, API_ROUTES.EXPENSE_CATEGORIES_ASYNC);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar categoria despesas: ${error.message}</td></tr>`;
        console.error('Erro ao buscar categoria de despesas:', error);
    }
}

// 🆕 Função com ordenação: recebe a URL da rota ordenada
async function loadExpensesCategoriesOrdered(apiUrl) {
    const tbody = document.getElementById('expense-category-table-body');
    if (!tbody) {
        console.error('Tabela de categoria despesas não encontrada');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error('Erro ao buscar dados ordenados da API');

        const expenseCategories = await response.json();
        
        console.log('Categoria de despesas ordenadas:', expenseCategories);

        renderAllExpenseCategoryViews(expenseCategories, API_ROUTES.EXPENSE_CATEGORIES_ASYNC);

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Erro: ${error.message}</td></tr>`;
        console.error('Erro ao carregar categoria de despesas ordenadas:', error);
    }

    document.getElementById('expense-category-table-body').classList.add('loaded');
}

// ♻️ Função reutilizável para renderizar despesas
function renderExpensesCategories(expenseCategories, reloadUrl) {

    const tbody = document.getElementById('expense-category-table-body');

    tbody.innerHTML = '';

    if (!expenseCategories || expenseCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhuma categoria de despesa encontrada.</td></tr>';
        return;
    }

    expenseCategories.forEach(expenseCategory => {

        tbody.innerHTML += `
            <tr>
                <td class="text-center font-size">${expenseCategory.name}</td>
                <td class="text-center font-size">
                    <button class="btn btn-warning btn-sm btn-expense-category-edit" 
                            title="Editar"
                            data-id="${expenseCategory.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-expense-category-delete" 
                            title="Excluir"
                            data-id="${expenseCategory.id}" 
                            data-name="${expenseCategory.name}"
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

    document.querySelectorAll('.btn-expense-category-delete').forEach(button => {
        button.addEventListener('click', async function () {
            const expenseCategoryId = this.getAttribute('data-id');
            const expenseCategoryName = this.getAttribute('data-name');
            const reloadUrl = this.getAttribute('data-reload');

            const result = await Swal.fire({
                title: `Você deseja excluir a categoria de despesa "${expenseCategoryName}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim',
                cancelButtonText: 'Não',
            });

            if (result.isConfirmed) {
                try {
                        const deleteUrl = API_ROUTES.EXPENSE_CATEGORIES_EVENT_DELETE(expenseCategoryId);
                        
                        const deleteResponse = await fetch(deleteUrl, {
                            method: 'DELETE'
                        });

                        if (!deleteResponse.ok) throw new Error('Erro ao excluir a categoria de despesa');

                        Swal.fire({
                            icon: 'success',
                            title: 'Excluído!',
                            text: 'Categoria de despesa excluída com sucesso.',
                            timer: 4500,
                            showConfirmButton: false,
                        });

                    loadContent('expense-category', 'expense-category-list'); // 🔁 Redireciona para lista atualizada

                    // Recarrega a partir da rota usada (ordenada ou não)
                    if (reloadUrl === API_ROUTES.EXPENSE_CATEGORIES_ASYNC) {
                        loadExpensesCategoriesFromMessaging();
                    } else {
                        loadExpensesCategoriesOrdered(reloadUrl);
                    }

                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        timer: 4000,
                        text: `Falha ao excluir categoria despesa: ${error.message}`,
                    });
                }
            }
        });
    });

    // ✅ Adicione isso dentro da função renderExpenses
    document.querySelectorAll('.btn-expense-category-edit').forEach(button => {
        button.addEventListener('click', function () {
            const expenseCategoryId = this.getAttribute('data-id');
            console.log(`Editando categoria de despesa ID: ${expenseCategoryId}`);
            localStorage.setItem('editingExpenseCategoryId', expenseCategoryId);
            loadContent('expense-category', 'expense-category-update');
        });
    });

    document.getElementById('expense-category-table-body').classList.add('loaded');
}

// 🔍 Filtro de categoria da despesas por texto
async function filterExpensesCategoriesByText() {
  const input = document.getElementById("filterText").value.trim().toLowerCase();
  const filterBy = document.querySelector('input[name="filterType"]:checked').value;

  if (input === "") {
    await loadExpensesCategoriesFromMessaging(); // carrega tudo
    return;
  }

  try {
    const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_ASYNC);
    const data = await response.json();

    const filtered = data.filter(expenseCategory => {
      const valueToCheck = (filterBy === "name" ? expenseCategory.name : expenseCategory.name) || "";
      return valueToCheck.toLowerCase().includes(input);
    });

    renderAllExpenseCategoryViews(filtered, API_ROUTES.EXPENSE_CATEGORIES_ASYNC);
  } catch (error) {
    console.error("Erro ao filtrar categoria despesas:", error);
  }
}

// 🔁 Aplica debounce ao filtro de texto
if (typeof window.debounceTimeout === "undefined") {
    window.debounceTimeout = null;
}

function debounceFilterExpensesCategories(delay = 300) {
  const tbody = document.getElementById("expense-category-table-body");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Filtrando...</td></tr>`;
  }

  clearTimeout(debounceTimeout);
  window.debounceTimeout = setTimeout(() => {
    filterExpensesCategoriesByText();
    }, delay);
}

function renderAllExpenseCategoryViews(expensesCategories, reloadUrl) {
 
    // ✅ Chama a função para renderizar as despesas ← agora sim, com as cores certas
    renderExpensesCategories(expensesCategories, reloadUrl);
}

async function loadExpensesCategoriesFromMessaging() {
    const tbody = document.getElementById('expense-category-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6">⌛ Enviando requisição via fila...</td></tr>`;

    try {
        // Etapa 1: Dispara requisição para a fila
        const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_EVENT_GETALL, {
            method: 'POST'
        });

        if (!response.ok) throw new Error("Falha ao enviar solicitação para a fila");

        const result = await response.json();
        const messageId = result.id;

        // Etapa 2: Aguarda polling da resposta
        const pollResult = await pollMessagingResult(messageId);

        // Etapa 3: Renderiza as categorias
        renderAllExpenseCategoryViews(pollResult, API_ROUTES.EXPENSE_CATEGORIES_EVENT_GETALL);

    } catch (error) {
        console.error("Erro ao carregar categorias via mensageria:", error);
        tbody.innerHTML = `<tr><td colspan="6">❌ Erro: ${error.message}</td></tr>`;
    }
}

async function pollMessagingResult(messageId, retries = 15, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        const res = await fetch(API_ROUTES.EXPENSE_CATEGORIES_EVENT_RESULT(messageId));
        const data = await res.json();

        if (res.status === 200 && data.processed) {
            return data.response;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error("Tempo de espera excedido para resposta da fila.");
}
