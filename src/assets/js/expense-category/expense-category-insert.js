// ✅ Utilitários globais
function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function getCheckboxChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function nowIso() {
    return new Date().toISOString();
}

// ✅ Validação para categoria de despesa
function validateExpenseCategoryFormFields() {
    const name = getInputValue('name');

    if (!name || name.trim() === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório!',
            timer: 4000,
            text: 'O campo "Nome" deve ser preenchido.',
        });
        return false;
    }

    return true;
}

// ✅ Função principal do formulário
function setupExpenseCategoryForm() {
    const form = document.getElementById('expenseCategoryForm');
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateExpenseCategoryFormFields()) return;

        const data = {
            id: 0,
            name: getInputValue('name'),
            isActive: getCheckboxChecked('isActive'),
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };

        console.log('Enviando dados para API:', data);

        try {
            const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_SYNC, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`Erro ao salvar a categoria de despesa ${data.name}. Detalhe erro: ${errorDetail}`);
            }

            Swal.fire({
                title: `A categoria de despesa ${data.name} foi cadastrada com sucesso!`,
                icon: "success",
                timer: 4000,
                showConfirmButton: false
            });

            loadContent('expense-category', 'expense-category-list');

        } catch (error) {
            console.error('Erro:', error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                timer: 4000,
                text: `Erro ao cadastrar a categoria de depesta ${data.name}!`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}