if (!window.expenseScriptLoaded) {
    window.expenseScriptLoaded = true;

    // 🔄 Garante persistência entre trocas de tela
    window.categoryMap = window.categoryMap || {};
    window.categoryColorMap = window.categoryColorMap || {};

    const categoryMap = window.categoryMap;
    const categoryColorMap = window.categoryColorMap;

    async function loadExpenses() {
        const tbody = document.getElementById('expense-table-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="7">⌛ Enviando requisição via fila...</td></tr>`;

        try {
            Object.assign(categoryMap, await loadCategoryMap());

            const response = await fetch(API_ROUTES.EXPENSES_EVENT_GETALL, {
                method: 'POST'
            });

            if (!response.ok) throw new Error("Falha ao enviar solicitação para a fila");

            const result = await response.json();
            const messageId = result.id;

            const pollResult = await pollMessagingResult(messageId);

            renderAllExpenseViews(pollResult, API_ROUTES.EXPENSES_EVENT_GETALL);

        } catch (error) {
            console.error("Erro ao carregar despesas via mensageria:", error);
            tbody.innerHTML = `<tr><td colspan="7">❌ Erro: ${error.message}</td></tr>`;
        }
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

    function renderExpenses(expenses, reloadUrl) {
        const tbody = document.getElementById('expense-table-body');
        tbody.innerHTML = '';

        if (!expenses || expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Nenhuma despesa encontrada.</td></tr>';
            return;
        }

        let total = 0;

        expenses.forEach(expense => {
            const name = expense.name || '';
            const description = expense.description || '';
            const amount = isNaN(parseFloat(expense.amount)) ? 0 : parseFloat(expense.amount);
            const dueDate = expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '-';
            const paidAt = expense.paidAt ? new Date(expense.paidAt).toLocaleDateString() : '-';

            total += amount;

            const categoryName = categoryMap[expense.expenseCategoryId] || 'Sem categoria';
            const categoryColor = categoryColorMap[categoryName] || '#6c757d';

            tbody.innerHTML += `
                <tr>
                    <td class="text-center font-size">${name}</td>
                    <td class="text-center font-size">${description}</td>
                    <td class="text-center font-size">
                        <span class="badge" style="background-color: ${categoryColor}; color: #fff;">
                            ${categoryName}
                        </span>
                    </td>
                    <td class="text-center font-size">R$ ${amount.toFixed(2)}</td>
                    <td class="text-center font-size">${dueDate}</td>
                    <td class="text-center font-size">${paidAt}</td>
                    <td class="text-center font-size">
                        <button class="btn btn-warning btn-sm btn-expense-edit" 
                                title="Editar"
                                data-id="${expense.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-expense-delete" 
                                title="Excluir"
                                data-id="${expense.id}" 
                                data-name="${description}"
                                data-reload="${reloadUrl}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML += `
            <tr style="font-weight: bold; background-color: #f8f9fa;">
                <td></td><td></td><td>Total</td><td>R$ ${total.toFixed(2)}</td><td></td><td></td><td></td>
            </tr>
        `;

        document.querySelectorAll('.btn-expense-delete').forEach(button => {
            button.addEventListener('click', async function () {
                const expenseId = this.getAttribute('data-id');
                const expenseName = this.getAttribute('data-name');
                const reloadUrl = this.getAttribute('data-reload');

                const result = await Swal.fire({
                    title: `Você deseja excluir a despesa "${expenseName}"?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim',
                    cancelButtonText: 'Não',
                });

                if (result.isConfirmed) {
                    try {
                        const deleteUrl = API_ROUTES.EXPENSES_EVENT_DELETE(expenseId);
                        const deleteResponse = await fetch(deleteUrl, { method: 'DELETE' });

                        if (!deleteResponse.ok) throw new Error('Erro ao excluir despesa');

                        const responseJson = await deleteResponse.json();
                        const messageId = responseJson.id;

                        const pollResult = await pollMessagingResult(messageId);

                        Swal.fire({
                            icon: 'success',
                            title: 'Despesa excluída com sucesso!',
                            timer: 3000,
                            showConfirmButton: false
                        });

                        loadExpenses();

                    } catch (error) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Erro',
                            text: `Falha ao excluir despesa: ${error.message}`,
                            timer: 4000
                        });
                    }
                }
            });
        });

        document.querySelectorAll('.btn-expense-edit').forEach(button => {
            button.addEventListener('click', function () {
                const expenseId = this.getAttribute('data-id');
                localStorage.setItem('editingExpenseId', expenseId);
                loadContent('expense', 'expense-update');
            });
        });

        document.getElementById('expense-table-body').classList.add('loaded');
    }

    // 🆕 Função com ordenação: recebe a URL da rota ordenada
    async function loadExpensesOrdered(apiUrl) {
        const tbody = document.getElementById('expense-table-body');
        if (!tbody) {
            console.error('Tabela de despesas não encontrada');
            return;
        }

        tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

        try {
            // ✅ Agora carrega as categorias de fato
            categoryMap = await loadCategoryMap(); 

            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error('Erro ao buscar dados ordenados da API');

            const expenses = await response.json();

            renderAllExpenseViews(expenses, API_ROUTES.EXPENSES_ASYNC);

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="6">Erro: ${error.message}</td></tr>`;
            console.error('Erro ao carregar despesas ordenadas:', error);
        }

        document.getElementById('expense-table-body').classList.add('loaded');
    }

    // 🔥 Função carrega as categorias
    async function loadCategoryMap() {
        try {
            const response = await fetch(API_ROUTES.EXPENSE_CATEGORIES_ASYNC);
            if (!response.ok) throw new Error('Erro ao carregar categorias');

            const categories = await response.json();
            const map = {};

            categories.forEach(cat => {
                map[cat.id] = cat.name;
            });

            return map;
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            return {}; // retorna vazio caso falhe
        }
    }

    function parseCurrency(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        return parseFloat(
            value
                .replace(/[R$\s]/g, '')
                .replace('.', '')
                .replace(',', '.')
        ) || 0;
    }

    // 🔥 Função que desenha o gráfico
    function renderExpenseChart(expenses) {
        const container = document.getElementById('expense-chart');
        if (!container) return;

        // Converter para número
        const parsedExpenses = expenses.map(item => ({
            name: item.name,
            amount: typeof item.amount === 'number' ? item.amount : parseCurrency(item.amount)
        }));

        const total = parsedExpenses.reduce((sum, item) => sum + item.amount, 0);
        container.innerHTML = '';

        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'];

        parsedExpenses.forEach((item, index) => {
            const percentage = ((item.amount / total) * 100).toFixed(2);

            const bar = document.createElement('div');
            bar.classList.add('expense-bar');

            bar.innerHTML = `
                <div class="expense-bar-label">${item.name}</div>
                <div style="flex: 1; background-color: #e9ecef; border-radius: 4px;">
                    <div class="expense-bar-fill" style="width: ${percentage}%; background-color: ${colors[index % colors.length]};"></div>
                </div>
                <div class="expense-bar-percentage">${percentage}%</div>
            `;

            container.appendChild(bar);
        });
    }

    // 🔥 Função que desenha o gráfico por categoria.
    function renderExpenseChartByCategory(expenses) {
        const container = document.getElementById('expense-category-chart');
        if (!container) return;

        const categoryTotals = {};

        // Agrupa despesas por categoria
        expenses.forEach(expense => {
            const categoryName = categoryMap[expense.expenseCategoryId] || 'Sem categoria';
            const amount = typeof expense.amount === 'number' ? expense.amount : parseCurrency(expense.amount);
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
        });

        const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
        container.innerHTML = '';

        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'];

        Object.entries(categoryTotals).forEach(([category, amount], index) => {
            const percentage = ((amount / total) * 100).toFixed(2);
            
            // ← salva a cor da categoria
            categoryColorMap[category] = colors[index % colors.length]; 
            
            const bar = document.createElement('div');
            bar.classList.add('expense-bar');

            bar.innerHTML = `
                <div class="expense-bar-label">${category}</div>
                <div style="flex: 1; background-color: #e9ecef; border-radius: 4px;">
                    <div class="expense-bar-fill" style="width: ${percentage}%; background-color: ${colors[index % colors.length]};"></div>
                </div>
                <div class="expense-bar-percentage">${percentage}%</div>
            `;

            container.appendChild(bar);
        });
    }

    //Função para gráfico de rosca (donut)
    function renderExpenseDonutChart(expenses) {
        const canvas = document.getElementById('expense-donut-chart');
        const legend = document.getElementById('expense-donut-legend');
        if (!canvas || !legend) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        legend.innerHTML = '';

        const categoryTotals = {};
        expenses.forEach(exp => {
            const name = categoryMap[exp.expenseCategoryId] || 'Sem categoria';
            const val = typeof exp.amount === 'number' ? exp.amount : parseCurrency(exp.amount);
            categoryTotals[name] = (categoryTotals[name] || 0) + val;
        });

        const entries = Object.entries(categoryTotals);
        const total = entries.reduce((sum, [_, val]) => sum + val, 0);
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14'];

        let startAngle = 0;
        entries.forEach(([label, value], i) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(150, 150);
            ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle);
            ctx.arc(150, 150, 60, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fill();
            startAngle += sliceAngle;

            // ⬅️ Monta a legenda da categoria
            const legendItem = document.createElement('div');
            legendItem.innerHTML = `
                <span class="legend-color" style="background-color: ${colors[i % colors.length]};"></span>
                ${label}
            `;
            legend.appendChild(legendItem);
        });

        canvas.classList.remove('visible');
        setTimeout(() => {
            canvas.classList.add('visible');
        }, 50);
    }


    //Função para desenhar o gráfico de pizza
    function renderExpensePieChart(expenses) {
        const canvas = document.getElementById('expense-pie-chart');
        const legend = document.getElementById('expense-pie-legend');
        if (!canvas || !legend) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        legend.innerHTML = '';

        const parsed = expenses.map(e => ({
            label: e.name,
            value: typeof e.amount === 'number' ? e.amount : parseCurrency(e.amount)
        }));

        const total = parsed.reduce((sum, item) => sum + item.value, 0);
        const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14'];

        let startAngle = 0;
        parsed.forEach((item, i) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(150, 150);
            ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            startAngle += sliceAngle;

            // ⬅️ Monta a legenda
            const legendItem = document.createElement('div');
            legendItem.innerHTML = `
                <span class="legend-color" style="background-color: ${colors[i % colors.length]};"></span>
                ${item.label}
            `;
            legend.appendChild(legendItem);
        });

        canvas.classList.remove('visible');

        setTimeout(() => {
            canvas.classList.add('visible');
        }, 50);
    }

    async function filterExpensesByText() {
    const input = document.getElementById("filterText").value.trim().toLowerCase();
    const filterBy = document.querySelector('input[name="filterType"]:checked').value;

    if (input === "") {
        await loadExpenses(); // carrega tudo
        return;
    }

    try {
        const response = await fetch(API_ROUTES.EXPENSES_ASYNC);
        const data = await response.json();

        const filtered = data.filter(expense => {
        const valueToCheck = (filterBy === "name" ? expense.name : expense.description) || "";
        return valueToCheck.toLowerCase().includes(input);
        });

        renderAllExpenseViews(filtered, API_ROUTES.EXPENSES_ASYNC);
    } catch (error) {
        console.error("Erro ao filtrar despesas:", error);
    }
    }

    // 🔁 Aplica debounce ao filtro de texto
    let debounceTimeout;

    function debounceFilterExpenses(delay = 300) {
    const tbody = document.getElementById("expense-table-body");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Filtrando...</td></tr>`;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        filterExpensesByText(); // ou loadFilteredExpenses()
    }, delay);
    }

    function renderAllExpenseViews(expenses, reloadUrl) {
        
        // ✅ Chama a função para renderizar o gráfico de despesas 
        renderExpenseChart(expenses);
        
        // ✅ Chama a função para renderizar o gráfico de despesas por categoria ← gera o categoryColorMap
        renderExpenseChartByCategory(expenses);

        // ✅ Chama a função para renderizar o gráfico de despesas pizza por nome
        renderExpensePieChart(expenses);

        // ✅ Chama a função para renderizar o gráfico de despesas Donut por categoria
        renderExpenseDonutChart(expenses);

        // ✅ Chama a função para renderizar as despesas ← agora sim, com as cores certas
        renderExpenses(expenses, reloadUrl);
    }

    // Coloque isso DENTRO do if, ao final:
    window.loadExpenses = loadExpenses;
}