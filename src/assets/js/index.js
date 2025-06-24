function loadContent(model, page) {
    const content = document.getElementById('main-content');
    const route = `pages/${model}/${page}.html`;

    fetch(route)
        .then(response => {
            if (!response.ok) throw new Error('Página não encontrada');
            return response.text();
        })
        .then(html => {
            content.innerHTML = html;

            // Carrega JS específico
            const scriptPath = `assets/js/${model}/${page}.js`;

            // ✅ Remove script anterior se já estiver carregado
            document.querySelectorAll(`script[src="${scriptPath}"]`).forEach(s => s.remove());

            const script = document.createElement('script');
            script.src = scriptPath;
            script.onload = () => handlePageLoad(model, page);
            script.onerror = () => {
                content.innerHTML = `<h2>Erro</h2><p>Script ${scriptPath} não encontrado.</p>`;
            };
            document.body.appendChild(script);

            window.location.hash = `${model}/${page}`;
        })
        .catch(error => {
            content.innerHTML = `<h2>Erro</h2><p>${error.message}</p>`;
        });
}

function handlePageLoad(model, page) {
    switch (`${model}/${page}`) {
        case 'expense/expense-list':
            loadExpenses(); // Essa função deve estar no arquivo JS da página
            break;
        case 'expense/expense-insert':
            setupExpenseForm();
            break;
        case 'expense/expense-update':
            loadExpenseDataToForm();
            setupExpenseEditSubmit();
            break;
        case 'expense-category/expense-category-list':
            loadExpensesCategoriesFromMessaging();
            break;
        case 'expense-category/expense-category-insert':
            setupExpenseCategoryFormUsingMessaging();
            break;
        case 'expense-category/expense-category-update':
            loadExpenseCategoryDataToForm();
            setupExpenseCategoryEditSubmitUsingMessaging();
            break;
        case 'expense/expense-update':
            loadExpenseDataToForm();
            setupExpenseEditSubmit();
            break;
        case 'income/income-list':
            loadIncomes(); // Essa função deve estar no arquivo JS da página
            break;
        case 'income/income-insert':
            setupIncomeForm();
            break;
        case 'income/income-update':
            loadIncomeDataToForm();
            setupIncomeEditSubmit();
            break;
        case 'income-category/income-category-list':
            loadIncomesCategories();
            break;
        case 'income-category/income-category-insert':
            setupIncomeCategoryForm();
            break;
        case 'income-category/income-category-update':
            loadIncomeCategoryDataToForm();
            setupIncomeCategoryEditSubmit();
        default:
            console.warn(`Nenhuma ação definida para ${model}/${page}`);
            break;
    }
}