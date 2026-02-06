import {
    fetchExpenses,
    createExpense,
    deleteExpenseById,
    fetchSummary,
    fetchSummaryByCategory,
    fetchSummaryByMonth,
    login,
    signup,
    setToken,
    getToken,
    logout
} from "./api.js";

let isAuthenticated = false;

// Auth
window.doLogin = async function () {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");

    errorEl.textContent = "";

    try {
        const data = await login(email, password);
        setToken(data.access_token);

        isAuthenticated = true;
        showApp();
        reloadAll();
    } catch (err) {
        errorEl.textContent = "Forkert email eller password";
    }
};

window.doSignup = async function () {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const errorEl = document.getElementById("signup-error");

    errorEl.textContent = "";

    try {
        await signup(email, password);
        // Auto login after signup
        const data = await login(email, password);
        setToken(data.access_token);

        isAuthenticated = true;
        showApp();
        reloadAll();
    } catch (err) {
        errorEl.textContent = err.message || "Kunne ikke oprette bruger";
    }
};

window.showLogin = function () {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("signup-section").style.display = "none";
    document.getElementById("app-section").style.display = "none";
}

window.showSignup = function () {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("signup-section").style.display = "block";
    document.getElementById("app-section").style.display = "none";
}

function showApp() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("signup-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
}

// Post liste
let selectedMonth = null;

async function loadExpenses() {
    const data = await fetchExpenses(selectedMonth);

    const container = document.getElementById("expenses");
    container.innerHTML = "";

    data.forEach(e => {
        const div = document.createElement("div");
        div.className = "transaction-item";

        // Determine icon based on category (simple mock logic)
        let icon = "🧾";
        if (e.category.toLowerCase().includes("mad")) icon = "🍔";
        if (e.category.toLowerCase().includes("transport")) icon = "🚌";
        if (e.category.toLowerCase().includes("løn")) icon = "💰";
        if (e.category.toLowerCase().includes("bolig")) icon = "🏠";

        const isIncome = e.type === "income";
        const amountClass = isIncome ? "income" : "expense";
        const sign = isIncome ? "+" : "-";

        div.innerHTML = `
            <div class="t-left">
                <div class="t-icon">${icon}</div>
                <div class="t-details">
                    <span class="t-category">${e.category}</span>
                    <span class="t-date">${e.date} &bull; ${e.description || ""}</span>
                </div>
            </div>
            <div class="t-right">
                <div class="t-amount ${amountClass}">${sign} ${e.amount.toLocaleString()} kr.</div>
                <button class="delete-btn" onclick="window.deleteExpense(${e.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;

        container.appendChild(div);
    });
}

// Overblik
async function loadSummary() {
    const data = await fetchSummary(selectedMonth);

    // Update specific ID elements instead of innerHTML
    document.getElementById("income-display").textContent = `${data.total_income.toLocaleString()} kr.`;
    document.getElementById("expense-display").textContent = `${data.total_expense.toLocaleString()} kr.`;
    document.getElementById("balance-display").textContent = `${data.balance.toLocaleString()} kr.`;
}

// Opret post
document
    .getElementById("expense-form")
    .addEventListener("submit", async (e) => {
        e.preventDefault();

        const expense = {
            amount: parseFloat(document.getElementById("amount").value),
            category: document.getElementById("category").value,
            description: document.getElementById("description").value,
            date: document.getElementById("date").value,
            type: document.getElementById("type").value
        };

        await createExpense(expense);
        e.target.reset();

        // Close modal if it exists
        if (typeof closeModal === 'function') closeModal();
        // Fallback if defined in HTML script context vs module
        const modal = document.getElementById('add-modal');
        if (modal) modal.classList.remove('active');

        reloadAll();
    });

// Slet post
window.deleteExpense = async function (id) {
    await deleteExpenseById(id);
    reloadAll();
};

// Chart - kategori
let categoryChart;

async function loadCategoryChart() {
    const data = await fetchSummaryByCategory(selectedMonth);

    const ctx = document.getElementById("categoryChart").getContext("2d");
    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(data),
            datasets: [{ data: Object.values(data) }]
        }
    });
}

// Chart - måned
let monthChart;

async function loadMonthChart() {
    const data = await fetchSummaryByMonth();

    const ctx = document.getElementById("monthChart").getContext("2d");
    if (monthChart) monthChart.destroy();

    monthChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: "Udgifter",
                data: Object.values(data)
            }]
        }
    });
}

// Chart - indtægt vs udgift
let incomeExpenseChart;

async function loadIncomeExpenseChart() {
    const data = await fetchSummary(selectedMonth);

    const ctx = document.getElementById("incomeExpenseChart").getContext("2d");
    if (incomeExpenseChart) incomeExpenseChart.destroy();

    incomeExpenseChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Indtægt", "Udgift"],
            datasets: [{
                label: "Beløb (kr.)",
                data: [data.total_income, data.total_expense]
            }]
        }
    });
}

// Chart - balance over tid
let balanceChart;

async function loadBalanceChart() {
    const expenses = await fetchExpenses(selectedMonth);

    const monthly = {};
    expenses.forEach(e => {
        const m = e.date.slice(0, 7);
        monthly[m] = (monthly[m] || 0) + (e.type === "income" ? e.amount : -e.amount);
    });

    const labels = Object.keys(monthly).sort();
    let running = 0;
    const balances = labels.map(m => (running += monthly[m]));

    const ctx = document.getElementById("balanceChart").getContext("2d");
    if (balanceChart) balanceChart.destroy();

    balanceChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Balance (kr.)",
                data: balances,
                tension: 0.2
            }]
        }
    });
}

// Filter
window.applyMonthFilter = function () {
    selectedMonth = document.getElementById("monthFilter").value;
    reloadAll();
};

window.clearMonthFilter = function () {
    selectedMonth = null;
    document.getElementById("monthFilter").value = "";
    reloadAll();
};

// Reload
function reloadAll() {
    loadExpenses();
    loadSummary();
    loadCategoryChart();
    loadMonthChart();
    loadIncomeExpenseChart();
    loadBalanceChart();
}

// Logout
window.doLogout = function () {
    logout();
    isAuthenticated = false;
    showLogin();
};

// Check for existing session
if (getToken()) {
    isAuthenticated = true;
    showApp();
    reloadAll();
} else {
    showLogin();
}
