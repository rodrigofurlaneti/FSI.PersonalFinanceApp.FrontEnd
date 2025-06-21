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
                throw new Error(`Erro ao salvar despesa ${data.name}. Detalhe: ${errorDetail}`);
            }

            Swal.fire({
                title: `A despesa ${data.name} foi cadastrada com sucesso!`,
                timer: 4000,
                icon: "success",
                draggable: true
            });

            loadContent('expense', 'expense-list'); // Volta para a lista de despesas

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                icon: "error",
                timer: 4000,
                title: "Oops...",
                text: `Erro ao cadastrar a despesa ${data.name}!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}


