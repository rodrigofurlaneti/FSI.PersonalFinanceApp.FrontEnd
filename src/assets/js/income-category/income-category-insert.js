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

// ✅ Validação para categoria de renda
function validateIncomeCategoryFormFields() {
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
function setupIncomeCategoryFormUsingMessaging() {
    const form = document.getElementById('incomeCategoryForm');
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!validateIncomeCategoryFormFields()) return;

        const data = {
            id: 0,
            name: getInputValue('name'),
            isActive: getCheckboxChecked('isActive'),
            createdAt: nowIso(),
            updatedAt: nowIso()
        };

        console.log('📩 Enviando para fila via mensageria:', data);

        try {
            const response = await fetch(API_ROUTES.INCOME_CATEGORIES_EVENT_CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`Erro ao enviar categoria para a fila. Detalhe: ${errorDetail}`);
            }

            const result = await response.json();

            Swal.fire({
                icon: 'success',
                title: 'Solicitação enviada!',
                text: `Categoria "${data.name}" enviada para a fila com sucesso.`,
                //footer: `ID da mensagem: ${result.id}`,
                timer: 4000,
                showConfirmButton: false
            });

            loadContent('income-category', 'income-category-list');

        } catch (error) {
            console.error('Erro ao enviar categoria de renda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao enviar!',
                text: `Falha ao processar a solicitação.`,
                footer: `<a href="#">${error.message}</a>`
            });
        }
    });
}
