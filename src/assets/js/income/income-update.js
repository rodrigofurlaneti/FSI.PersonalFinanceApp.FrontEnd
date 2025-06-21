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
function validateIncomeFormFields() {
    const requiredFields = [
        { id: 'name', label: 'Nome' },
        { id: 'description', label: 'Descrição' },
        { id: 'amount', label: 'Valor' },
        { id: 'incomeDate', label: 'Vencimento' },
        { id: 'receivedAt', label: 'Pagamento' },
        { id: 'incomeCategory', label: 'Categoria' }
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

    const incomeDateInput = document.getElementById('incomeDate');
    const receivedAtInput = document.getElementById('receivedAt');

    if (incomeDateInput) incomeDateInput.value = today;
    if (receivedAtInput) receivedAtInput.value = today;
}

// 🔥 Carrega categorias no select
async function loadIncomeCategories() {
    const select = document.getElementById('incomeCategory');
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
        console.error('Erro ao buscar categorias de renda:', error);
        alert('Erro ao carregar categorias de renda.');
    }
}

// 🔥 Função que configura o formulário de cadastro
function setupIncomeForm() {
    const form = document.getElementById('incomeForm');
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    setTodayDate();
    loadIncomeCategories();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Valida os campos obrigatórios
        if (!validateIncomeFormFields()) return;

        const data = {
            id: 0,
            name: getInputValue('name'),
            description: getInputValue('description'),
            amount: parseCurrency(getInputValue('amount')),
            incomeDate: toIsoDate(getInputValue('incomeDate')),
            receivedAt: toIsoDate(getInputValue('receivedAt')),
            incomeCategoryId: parseInt(getInputValue('incomeCategory')) || 0,
            isActive: getCheckboxChecked('isActive'),
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };

        console.log('Enviando dados para API:', data);

        try {
            const response = await fetch(API_ROUTES.INCOMES_ASYNC, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`Erro ao salvar renda. Detalhe: ${errorDetail}`);
            }

            Swal.fire({
                timer: 4000,
                title: `A renda ${data.name} foi cadastrada com sucesso!`,
                icon: "success",
                draggable: true
            });

            loadContent('income', 'income-list'); // Volta para a lista de rendas

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                timer: 4000,
                icon: "error",
                title: "Oops...",
                text: `Erro ao cadastrar a renda ${data.name}!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}

// 🔥 Função que configura o formulário de edição
async function loadIncomeDataToForm() {
    const id = localStorage.getItem('editingIncomeId');
    if (!id) {
        alert('ID da renda não encontrado.');
        return;
    }

    try {
        const url = API_ROUTES.INCOMES_GETBYID_ASYNC.replace('{id}', id);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar renda');

        const income = await response.json();

        // Preenche campos
        document.getElementById('name').value = income.name;
        document.getElementById('description').value = income.description;
        document.getElementById('amount').value = parseFloat(income.amount).toFixed(2).replace('.', ',');
        document.getElementById('incomeDate').value = income.incomeDate.split('T')[0];
        document.getElementById('receivedAt').value = income.receivedAt ? income.receivedAt.split('T')[0] : '';
        document.getElementById('isActive').checked = income.isActive;

        // Carrega categorias
        const categorySelect = document.getElementById('incomeCategory');
        const catResponse = await fetch(API_ROUTES.EXPENSE_CATEGORIES_ASYNC);
        const categories = await catResponse.json();

        categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.text = cat.name;
            if (cat.id === income.incomeCategoryId) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });

        // Salva no localStorage para manter o createdAt
        localStorage.setItem('editingIncomeCreatedAt', income.createdAt);

    } catch (error) {
        console.error('Erro ao carregar renda:', error);
        alert('Erro ao carregar renda para edição.');
    }
}

function setupIncomeEditSubmit() {
    const form = document.getElementById('incomeFormUpdate');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = localStorage.getItem('editingIncomeId');
        const createdAt = localStorage.getItem('editingIncomeCreatedAt') || new Date().toISOString();

        if (!id || !validateIncomeFormFields()) return;

        const updatedIncome = {
            id: parseInt(id),
            name: getInputValue('name'),
            description: getInputValue('description'),
            amount: parseCurrency(getInputValue('amount')),
            incomeDate: toIsoDate(getInputValue('incomeDate')),
            receivedAt: toIsoDate(getInputValue('receivedAt')),
            incomeCategoryId: parseInt(getInputValue('incomeCategory')) || 0,
            isActive: getCheckboxChecked('isActive'),
            createdAt,
            updatedAt: new Date().toISOString()
        };

        try {
            const url = API_ROUTES.INCOMES_UPDATE_ASYNC.replace('{id}', id);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedIncome)
            });

            if (!response.ok) throw new Error(await response.text());

            Swal.fire({
                icon: 'success',
                title: `A renda ${updatedIncome.name} foi atualizada com sucesso!`,
                timer: 4000,
                showConfirmButton: false
            });

            localStorage.removeItem('editingIncomeId');
            localStorage.removeItem('editingIncomeCreatedAt');
            loadContent('income', 'income-list');

        } catch (error) {
            console.error('Erro ao atualizar:', error);
            Swal.fire({
                timer: 4000,
                icon: 'error',
                title: 'Erro ao atualizar renda',
                text: error.message
            });
        }
    });
}

