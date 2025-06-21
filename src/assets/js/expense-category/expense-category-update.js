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
function validateExpenseCategoryFormFields() {
    const requiredFields = [
        { id: 'name', label: 'Nome' }
    ];

    for (const field of requiredFields) {
        const value = getInputValue(field.id);
        if (!value || value.trim() === '') {
            Swal.fire({
                icon: 'warning',
                title: 'Campo obrigatório!',
                text: `O campo "${field.label}" deve ser preenchido.`,
            });
            return false;
        }
    }

    return true;
}

// 🔥 Função que configura o formulário de cadastro
function setupExpenseCategoryForm() {
    const form = document.getElementById('expenseCategoryFormUpdate');
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    setTodayDate();

    loadExpenseCategory();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Valida os campos obrigatórios
        if (!validateExpenseCategoryFormFields()) return;

        const data = {
            id: 0,
            name: getInputValue('name'),
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };

        console.log('Enviando dados para API:', data);

        try {
            const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_ASYNC, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`Erro ao salvar a categoria de renda ${data.name}. Detalhe erro: ${errorDetail}`);
            }

            Swal.fire({
                title: `A categoria de despesa ${data.name} foi atualizada com sucesso!`,
                icon: "success",
                draggable: true
            });

            loadContent('expense-category', 'expense-category-list'); // Volta para a lista de despesas

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: `Erro ao atualizar a categoria de despesa ${data.name}!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}

// 🔥 Função que configura o formulário de edição
async function loadExpenseCategoryDataToForm() {
    const id = localStorage.getItem('editingExpenseCategoryId');
    if (!id) {
        alert('ID da categoria de despesa não encontrado.');
        return;
    }

    try {
        const url = API_ROUTES.EXPENSE_CATEGORIES_GETBYID_ASYNC.replace('{id}', id);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar categoria de despesa');

        const expensecategory = await response.json();

        // Preenche campos
        document.getElementById('name').value = expensecategory.name;
        document.getElementById('isActive').checked = expensecategory.isActive;

        // Salva no localStorage para manter o createdAt
        localStorage.setItem('editingExpenseCategoryCreatedAt', expensecategory.createdAt);

    } catch (error) {
        console.error('Erro ao carregar a categoria de despesa:', error);
        alert('Erro ao carregar a categoria de despesa para edição.');
    }
}

function setupExpenseCategoryEditSubmit() {
    const form = document.getElementById('expenseCategoryFormUpdate');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = localStorage.getItem('editingExpenseCategoryId');
        const createdAt = localStorage.getItem('editingExpenseCategoryCreatedAt') || new Date().toISOString();

        if (!id || !validateExpenseCategoryFormFields()) return;

        const updatedExpenseCategory = {
            id: parseInt(id),
            name: getInputValue('name'),
            isActive: getCheckboxChecked('isActive'),
            createdAt,
            updatedAt: new Date().toISOString()
        };

        try {
            const url = API_ROUTES.EXPENSE_CATEGORIES_UPDATE_ASYNC.replace('{id}', id);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedExpenseCategory)
            });

            if (!response.ok) throw new Error(await response.text());

            Swal.fire({
                icon: 'success',
                title: `A categoria de despesa ${updatedExpenseCategory.name} atualizada com sucesso!`,
                timer: 4000,
                showConfirmButton: false
            });

            localStorage.removeItem('editingExpenseCategoryId');
            localStorage.removeItem('editingExpenseCategoryCreatedAt');
            loadContent('expense-category', 'expense-category-list');

        } catch (error) {
            console.error('Erro ao atualizar:', error);
            Swal.fire({
                icon: 'error',
                timer: 4000,
                title: `Erro ao atualizar categoria de despesa ${updatedExpenseCategory.name}`,
                text: error.message
            });
        }
    });
}