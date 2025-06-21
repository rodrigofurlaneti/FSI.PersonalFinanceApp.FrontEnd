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
        const response = await fetch(API_ROUTES.INCOME_CATEGORIES_ASYNC);
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
                throw new Error(`Erro ao salvar renda ${data.name}. Detalhe: ${errorDetail}`);
            }

            Swal.fire({
                title: `A renda ${data.name} foi cadastrada com sucesso!`,
                timer: 4000,
                icon: "success",
                draggable: true
            });

            loadContent('income', 'income-list'); // Volta para a lista de rendas

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                icon: "error",
                timer: 4000,
                title: "Oops...",
                text: `Erro ao cadastrar a renda ${data.name}!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}


