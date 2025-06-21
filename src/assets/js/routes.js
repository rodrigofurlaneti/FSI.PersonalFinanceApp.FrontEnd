// Arquivo: assets/js/routes.js

const API_BASE_URL = "https://localhost:7124/api";

const API_ROUTES = {

    // Expenses
    EXPENSES_ASYNC: `${API_BASE_URL}/expenses/async`,
    EXPENSES_ORDERED_ASYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/expenses/async/ordered?orderBy=${orderBy}&direction=${direction}`,
    EXPENSES_ORDERED_SYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/expenses/sync/ordered?orderBy=${orderBy}&direction=${direction}`,
    EXPENSES_FILTERED_ASYNC: (filterBy, value) => `${API_BASE_URL}/expenses/async/filtered?filterBy=${filterBy}&value=${encodeURIComponent(value)}`,
    EXPENSES_GETALL_ORDERBY_EXPENSECATEGORYID_ASC_ASYNC: `${API_BASE_URL}/expenses/async/GetAllOrderByExpenseCategoryIdAsc`,
    EXPENSES_GETALL_ORDERBY_EXPENSECATEGORYID_DESC_ASYNC: `${API_BASE_URL}/expenses/async/GetAllOrderByExpenseCategoryIdDesc`,
    EXPENSES_SYNC: `${API_BASE_URL}/expenses/sync`,
    EXPENSES_GETBYID_ASYNC: `${API_BASE_URL}/expenses/async/{id}`,
    EXPENSES_GETBYID_SYNC: `${API_BASE_URL}/expenses/sync/{id}`,
    EXPENSES_UPDATE_ASYNC: `${API_BASE_URL}/expenses/async/{id}`,
    EXPENSES_UPDATE_SYNC: `${API_BASE_URL}/expenses/sync/{id}`,

    // Expense Categories
    EXPENSE_CATEGORIES_ASYNC: `${API_BASE_URL}/expense-categories/async`,
    EXPENSE_CATEGORIES_SYNC: `${API_BASE_URL}/expense-categories/sync`,
    EXPENSE_CATEGORIES_ORDERED_ASYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/expense-categories/async/ordered?orderBy=${orderBy}&direction=${direction}`,
    EXPENSE_CATEGORIES_ORDERED_SYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/expense-categories/sync/ordered?orderBy=${orderBy}&direction=${direction}`,
    EXPENSE_CATEGORIES_FILTERED_ASYNC: (filterBy, value) => `${API_BASE_URL}/expense-categories/async/filtered?filterBy=${filterBy}&value=${encodeURIComponent(value)}`,
    EXPENSE_CATEGORIES_GETBYID_ASYNC: `${API_BASE_URL}/expense-categories/async/{id}`,
    EXPENSE_CATEGORIES_GETBYID_SYNC: `${API_BASE_URL}/expense-categories/sync/{id}`,
    EXPENSE_CATEGORIES_UPDATE_ASYNC: `${API_BASE_URL}/expense-categories/async/{id}`,
    EXPENSE_CATEGORIES_UPDATE_SYNC: `${API_BASE_URL}/expense-categories/sync/{id}`,

    // Incomes
    INCOMES_ASYNC: `${API_BASE_URL}/incomes/async`,
    INCOMES_SYNC: `${API_BASE_URL}/incomes/sync`,
    INCOMES_ORDERED_ASYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/incomes/async/ordered?orderBy=${orderBy}&direction=${direction}`,
    INCOMES_ORDERED_SYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/incomes/sync/ordered?orderBy=${orderBy}&direction=${direction}`,
    INCOMES_FILTERED_ASYNC: (filterBy, value) => `${API_BASE_URL}/incomes/async/filtered?filterBy=${filterBy}&value=${encodeURIComponent(value)}`,
    INCOMES_GETBYID_ASYNC: `${API_BASE_URL}/incomes/async/{id}`,
    INCOMES_GETBYID_SYNC: `${API_BASE_URL}/incomes/sync/{id}`,
    INCOMES_UPDATE_ASYNC: `${API_BASE_URL}/incomes/async/{id}`,
    INCOMES_UPDATE_SYNC: `${API_BASE_URL}/incomes/sync/{id}`,

    //Income Categories
    INCOME_CATEGORIES_ASYNC: `${API_BASE_URL}/income-categories/async`,
    INCOME_CATEGORIES_SYNC: `${API_BASE_URL}/income-categories/sync`,
    INCOME_CATEGORIES_ORDERED_ASYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/income-categories/async/ordered?orderBy=${orderBy}&direction=${direction}`,
    INCOME_CATEGORIES_ORDERED_SYNC: (orderBy, direction = 'asc') => `${API_BASE_URL}/income-categories/sync/ordered?orderBy=${orderBy}&direction=${direction}`,
    INCOME_CATEGORIES_FILTERED_ASYNC: (filterBy, value) => `${API_BASE_URL}/income-categories/async/filtered?filterBy=${filterBy}&value=${encodeURIComponent(value)}`,
    INCOME_CATEGORIES_GETBYID_ASYNC: `${API_BASE_URL}/income-categories/async/{id}`,
    INCOME_CATEGORIES_GETBYID_SYNC: `${API_BASE_URL}/income-categories/sync/{id}`,
    INCOME_CATEGORIES_UPDATE_ASYNC: `${API_BASE_URL}/income-categories/async/{id}`,
    INCOME_CATEGORIES_UPDATE_SYNC: `${API_BASE_URL}/income-categories/sync/{id}`,

    CONFIG: `${API_BASE_URL}/settings/async`,
};