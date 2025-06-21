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
function validateIncomeCategoryFormFields() {
    const requiredFields = [
        { id: 'name', label: 'Nome' }
    ];

    for (const field of requiredFields) {
        const value = getInputValue(field.id);
        if (!value || value.trim() === '') {
            Swal.fire({
                icon: 'warning',
                title: 'Campo obrigatório!',
                timer: 4000,
                text: `O campo "${field.label}" deve ser preenchido.`,
            });
            return false;
        }
    }

    return true;
}

// 🔥 Função que configura o formulário de cadastro
function setupIncomeCategoryForm() {
    const form = document.getElementById('incomeCategoryFormUpdate');
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    setTodayDate();

    loadIncomeCategory();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Valida os campos obrigatórios
        if (!validateIncomeCategoryFormFields()) return;

        const data = {
            id: 0,
            name: getInputValue('name'),
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };

        console.log('Enviando dados para API:', data);

        try {
            const response = await fetch(API_ROUTES.INCOME_CATEGORIES_ASYNC, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`Erro ao atualizar a categoria de renda ${data.name}. Detalhe: ${errorDetail}`);
            }

            Swal.fire({
                title: `A categoria de renda ${data.name} foi atualizada com sucesso!`,
                icon: "success",
                timer: 4000,
                draggable: true
            });

            loadContent('income-category', 'income-category-list'); // Volta para a lista de rendas

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                timer: 4000,
                text: `Erro ao atualizar a categoria de renda ${data.name}!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}

// 🔥 Função que configura o formulário de edição
async function loadIncomeCategoryDataToForm() {
    const id = localStorage.getItem('editingIncomeCategoryId');
    if (!id) {
        alert('ID da categoria de renda não encontrado.');
        return;
    }

    try {
        const url = API_ROUTES.INCOME_CATEGORIES_GETBYID_ASYNC.replace('{id}', id);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar categoria de renda');

        const incomecategory = await response.json();

        // Preenche campos
        document.getElementById('name').value = incomecategory.name;
        document.getElementById('isActive').checked = incomecategory.isActive;

        // Salva no localStorage para manter o createdAt
        localStorage.setItem('editingIncomeCategoryCreatedAt', incomecategory.createdAt);

    } catch (error) {
        console.error('Erro ao carregar a categoria de renda:', error);
        alert('Erro ao carregar a categoria de renda para edição.');
    }
}

function setupIncomeCategoryEditSubmit() {
    const form = document.getElementById('incomeCategoryFormUpdate');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = localStorage.getItem('editingIncomeCategoryId');
        const createdAt = localStorage.getItem('editingIncomeCategoryCreatedAt') || new Date().toISOString();

        if (!id || !validateIncomeCategoryFormFields()) return;

        const updatedIncomeCategory = {
            id: parseInt(id),
            name: getInputValue('name'),
            isActive: getCheckboxChecked('isActive'),
            createdAt,
            updatedAt: new Date().toISOString()
        };

        try {
            const url = API_ROUTES.INCOME_CATEGORIES_UPDATE_ASYNC.replace('{id}', id);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedIncomeCategory)
            });

            if (!response.ok) throw new Error(await response.text());

            Swal.fire({
                icon: 'success',
                title: `A categoria de renda ${updatedIncomeCategory.name} atualizada com sucesso!`,
                timer: 2000,
                showConfirmButton: false
            });

            localStorage.removeItem('editingIncomeCategoryId');
            localStorage.removeItem('editingIncomeCategoryCreatedAt');
            loadContent('income-category', 'income-category-list');

        } catch (error) {
            console.error('Erro ao atualizar:', error);
            Swal.fire({
                icon: 'error',
                timer: 4000,
                title: `Erro ao atualizar a categoria de renda ${updatedIncomeCategory.name}`,
                text: error.message
            });
        }
    });
}