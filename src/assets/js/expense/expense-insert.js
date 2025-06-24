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
        select.innerHTML = `<option value="">⌛ Carregando categorias...</option>`;

        const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_EVENT_GETALL, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Erro ao solicitar categorias via fila.');

        const { id: messageId } = await response.json();

        const categories = await pollMessagingResult(messageId);

        select.innerHTML = '<option value="">Selecione uma categoria</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar categorias via fila:', error);
        select.innerHTML = '<option value="">❌ Erro ao carregar</option>';
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

        try {
            const response = await fetch(API_ROUTES.EXPENSES_EVENT_CREATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error("Erro ao enviar despesa para a fila.");

            const responseJson = await response.json();
            const messageId = responseJson.id;

            const result = await pollMessagingResult(messageId);

            Swal.fire({
                title: `A despesa "${getInputValue('name')}" foi cadastrada com sucesso!`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });

            loadContent('expense', 'expense-list');

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                icon: "error",
                timer: 4000,
                title: "Oops...",
                text: `Erro ao cadastrar a despesa!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}

async function pollMessagingResult(messageId, retries = 15, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        const res = await fetch(API_ROUTES.EXPENSES_EVENT_RESULT(messageId));
        const data = await res.json();

        if (res.status === 200 && data.processed) {
            return data.response;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error("Tempo de espera excedido para resposta da fila.");
}


