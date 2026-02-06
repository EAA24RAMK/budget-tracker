const API_URL = "http://127.0.0.1:8000";

let token = localStorage.getItem("token");

// Auth
export function setToken(newToken) {
    token = newToken;
    if (token) {
        localStorage.setItem("token", token);
    } else {
        localStorage.removeItem("token");
    }
}

export function getToken() {
    return token;
}

export function logout() {
    setToken(null);
}

function authHeaders() {
    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}

export async function login(email, password) {
    const body = new URLSearchParams({
        username: email,
        password: password
    });

    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    if (!res.ok) {
        throw new Error("Login failed");
    }

    return res.json(); // { access_token, token_type }
}

export async function signup(email, password) {
    const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Signup failed");
    }

    return res.json();
}

// Expenses
export async function fetchExpenses(month = null) {
    let url = `${API_URL}/expenses`;
    if (month) url += `?month=${month}`;

    const res = await fetch(url, {
        headers: authHeaders()
    });
    if (res.status === 401) {
        logout();
        window.location.reload();
    }
    return res.json();
}

export async function createExpense(expense) {
    const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders()
        },
        body: JSON.stringify(expense)
    });
    if (res.status === 401) {
        logout();
        window.location.reload();
    }
}

export async function deleteExpenseById(id) {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    if (res.status === 401) {
        logout();
        window.location.reload();
    }
}

// Grafer
export async function fetchSummary(month = null) {
    let url = `${API_URL}/summary`;
    if (month) url += `?month=${month}`;

    const res = await fetch(url, {
        headers: authHeaders()
    });
    if (res.status === 401) {
        logout();
        window.location.reload();
    }
    return res.json();
}

export async function fetchSummaryByCategory(month = null) {
    let url = `${API_URL}/summary/category`;
    if (month) url += `?month=${month}`;

    const res = await fetch(url, {
        headers: authHeaders()
    });
    if (res.status === 401) {
        logout();
        window.location.reload();
    }
    return res.json();
}

export async function fetchSummaryByMonth() {
    const res = await fetch(`${API_URL}/summary/month`, {
        headers: authHeaders()
    });
    if (res.status === 401) {
        logout();
        window.location.reload();
    }
    return res.json();
}
