// 🔥 Utilitários reutilizáveis
function maskMoney(input) {
    let value = input.value.replace(/\D/g, '');
    value = (value / 100).toFixed(2) + '';
    value = value.replace('.', ',');
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = 'R$ ' + value;
}

function parseCurrency(value) {
    return parseFloat(value.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
}

function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function getCheckboxChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function toIsoDate(value) {
    return value ? new Date(value).toISOString() : null;
}

function nowIso() {
    return new Date().toISOString();
}

// 🔥 Define a validação de todos os campos
function validateExpenseFormFields() {
    const requiredFields = [
        { id: 'name', label: 'Nome' },
        { id: 'description', label: 'Descrição' },
        { id: 'amount', label: 'Valor' },
        { id: 'dueDate', label: 'Vencimento' },
        { id: 'paidAt', label: 'Pagamento' },
        { id: 'expenseCategory', label: 'Categoria' }
    ];

    for (const field of requiredFields) {
        const value = getInputValue(field.id);
        if (!value || value.trim() === '') {
            Swal.fire({
                timer: 4000,
                icon: 'warning',
                title: 'Campo obrigatório!',
                text: `O campo "${field.label}" deve ser preenchido.`,
            });
            return false;
        }
    }

    return true;
}

// 🔥 Define a data de hoje nos campos de data
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];

    const dueDateInput = document.getElementById('dueDate');
    const paidAtInput = document.getElementById('paidAt');

    if (dueDateInput) dueDateInput.value = today;
    if (paidAtInput) paidAtInput.value = today;
}

// 🔥 Carrega categorias no select
async function loadExpenseCategories() {
    const select = document.getElementById('expenseCategory');
    if (!select) return;

    try {
        const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_ASYNC);
        if (!response.ok) throw new Error('Erro ao carregar categorias.');

        const categories = await response.json();

        select.innerHTML = '<option value="">Selecione uma categoria</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao buscar categorias de despesa:', error);
        alert('Erro ao carregar categorias de despesa.');
    }
}

// 🔥 Função que configura o formulário de cadastro
function setupExpenseForm() {
    const form = document.getElementById('expenseForm');
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    setTodayDate();
    loadExpenseCategories();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Valida os campos obrigatórios
        if (!validateExpenseFormFields()) return;

        const data = {
            id: 0,
            name: getInputValue('name'),
            description: getInputValue('description'),
            amount: parseCurrency(getInputValue('amount')),
            dueDate: toIsoDate(getInputValue('dueDate')),
            paidAt: toIsoDate(getInputValue('paidAt')),
            expenseCategoryId: parseInt(getInputValue('expenseCategory')) || 0,
            isActive: getCheckboxChecked('isActive'),
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };

        console.log('Enviando dados para API:', data);

        try {
            const response = await fetch(API_ROUTES.EXPENSES_ASYNC, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`Erro ao salvar despesa. Detalhe: ${errorDetail}`);
            }

            Swal.fire({
                timer: 4000,
                title: `A despesa ${data.name} foi cadastrada com sucesso!`,
                icon: "success",
                draggable: true
            });

            loadContent('expense', 'expense-list'); // Volta para a lista de despesas

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                timer: 4000,
                icon: "error",
                title: "Oops...",
                text: `Erro ao cadastrar a despesa ${data.name}!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}

// 🔥 Função que configura o formulário de edição
async function loadExpenseDataToForm() {
    const id = localStorage.getItem('editingExpenseId');
    if (!id) {
        alert('ID da despesa não encontrado.');
        return;
    }

    try {
        const url = API_ROUTES.EXPENSES_GETBYID_ASYNC.replace('{id}', id);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar despesa');

        const expense = await response.json();

        // Preenche campos
        document.getElementById('name').value = expense.name;
        document.getElementById('description').value = expense.description;
        document.getElementById('amount').value = parseFloat(expense.amount).toFixed(2).replace('.', ',');
        document.getElementById('dueDate').value = expense.dueDate.split('T')[0];
        document.getElementById('paidAt').value = expense.paidAt ? expense.paidAt.split('T')[0] : '';
        document.getElementById('isActive').checked = expense.isActive;

        // Carrega categorias
        const categorySelect = document.getElementById('expenseCategory');
        const catResponse = await fetch(API_ROUTES.EXPENSE_CATEGORIES_ASYNC);
        const categories = await catResponse.json();

        categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.text = cat.name;
            if (cat.id === expense.expenseCategoryId) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });

        // Salva no localStorage para manter o createdAt
        localStorage.setItem('editingExpenseCreatedAt', expense.createdAt);

    } catch (error) {
        console.error('Erro ao carregar despesa:', error);
        alert('Erro ao carregar despesa para edição.');
    }
}

function setupExpenseEditSubmit() {
    const form = document.getElementById('expenseFormUpdate');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = localStorage.getItem('editingExpenseId');
        const createdAt = localStorage.getItem('editingExpenseCreatedAt') || new Date().toISOString();

        if (!id || !validateExpenseFormFields()) return;

        const updatedExpense = {
            id: parseInt(id),
            name: getInputValue('name'),
            description: getInputValue('description'),
            amount: parseCurrency(getInputValue('amount')),
            dueDate: toIsoDate(getInputValue('dueDate')),
            paidAt: toIsoDate(getInputValue('paidAt')),
            expenseCategoryId: parseInt(getInputValue('expenseCategory')) || 0,
            isActive: getCheckboxChecked('isActive'),
            createdAt,
            updatedAt: new Date().toISOString()
        };

        try {
            const url = API_ROUTES.EXPENSES_UPDATE_ASYNC.replace('{id}', id);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedExpense)
            });

            if (!response.ok) throw new Error(await response.text());

            Swal.fire({
                icon: 'success',
                title: `A despesa ${updatedExpense.name} foi atualizada com sucesso!`,
                timer: 4000,
                showConfirmButton: false
            });

            localStorage.removeItem('editingExpenseId');
            localStorage.removeItem('editingExpenseCreatedAt');
            loadContent('expense', 'expense-list');

        } catch (error) {
            console.error('Erro ao atualizar:', error);
            Swal.fire({
                timer: 4000,
                icon: 'error',
                title: 'Erro ao atualizar despesa',
                text: error.message
            });
        }
    });
}

