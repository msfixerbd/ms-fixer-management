
// =====================================
// MS FIXER MANAGEMENT SYSTEM
// Supabase Connected Application
// =====================================

const SUPABASE_URL = "https://usflivnclpeaqiqrakqd.supabase.co";

const SUPABASE_KEY = "sb_publishable_CyKrvOTCoDJ7ubGoRbg_Sg_2alzW4FZ";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;
let currentPage = "dashboard";

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(value) {
  return "৳ " + Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

// =====================================
// LOGIN
// =====================================

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  $("loginMessage").textContent = "Logging in...";

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("loginMessage").textContent = error.message;
    return;
  }

  currentUser = data.user;
  await startApp();
});

async function startApp() {
  if (!currentUser) return;

  const { data: owner, error } = await db
    .rpc("is_ms_fixer_owner");

  if (error || owner !== true) {
    await db.auth.signOut();
    $("loginMessage").textContent =
      "This account is not authorized as MS Fixer owner.";
    $("loginScreen").classList.remove("hidden");
    $("appScreen").classList.add("hidden");
    return;
  }

  $("loginScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  await showPage("dashboard");
}

db.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user || null;

  if (event === "SIGNED_IN" && currentUser) {
    setTimeout(() => startApp(), 0);
  }

  if (event === "SIGNED_OUT") {
    $("appScreen").classList.add("hidden");
    $("loginScreen").classList.remove("hidden");
  }
});

$("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  currentUser = null;
});

// =====================================
// NAVIGATION
// =====================================

$("navigation").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-page]");
  if (!button) return;

  await showPage(button.dataset.page);
  $("sidebar").classList.remove("open");
});

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

async function showPage(page) {
  currentPage = page;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  const titles = {
    dashboard: "Dashboard",
    products: "Products",
    customers: "Customers",
    suppliers: "Suppliers",
    sales: "Sales",
    expenses: "Expenses"
  };

  $("pageTitle").textContent = titles[page] || "MS Fixer";

  if (page === "dashboard") {
    await renderDashboard();
  } else {
    await renderModule(page);
  }
}

// =====================================
// DASHBOARD
// =====================================

async function getCount(table) {
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

async function renderDashboard() {
  const content = $("pageContent");

  content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <small>Total Products</small>
        <h3 id="statProducts">...</h3>
      </div>
      <div class="stat-card">
        <small>Total Customers</small>
        <h3 id="statCustomers">...</h3>
      </div>
      <div class="stat-card">
        <small>Total Sales</small>
        <h3 id="statSales">...</h3>
      </div>
      <div class="stat-card">
        <small>Total Expenses</small>
        <h3 id="statExpenses">...</h3>
      </div>
    </div>

    <div class="panel">
      <h3>Business Overview</h3>
      <p>Welcome to MS Fixer Management System.</p>
      <p style="margin-top:12px;color:#64748b">
        Your business data is connected to Supabase.
      </p>
    </div>
  `;

  try {
    const [products, customers, sales, expenses] =
      await Promise.all([
        getCount("products"),
        getCount("customers"),
        db.from("sales").select("total"),
        db.from("expenses").select("amount")
      ]);

    if (sales.error) throw sales.error;
    if (expenses.error) throw expenses.error;

    $("statProducts").textContent = products;
    $("statCustomers").textContent = customers;

    const totalSales = (sales.data || [])
      .reduce((sum, row) => sum + Number(row.total || 0), 0);

    const totalExpenses = (expenses.data || [])
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    $("statSales").textContent = money(totalSales);
    $("statExpenses").textContent = money(totalExpenses);

  } catch (error) {
    notify("Dashboard error: " + error.message);
  }
}

// =====================================
// MODULE DEFINITIONS
// =====================================

const modules = {
  products: {
    title: "Products",
    table: "products",
    columns: [
      { key: "name", label: "Product Name", required: true },
      { key: "sku", label: "SKU" },
      { key: "category", label: "Category" },
      { key: "purchase_price", label: "Purchase Price", type: "number" },
      { key: "selling_price", label: "Selling Price", type: "number" },
      { key: "stock", label: "Stock", type: "number" }
    ],
    display: ["name", "sku", "selling_price", "stock"]
  },

  customers: {
    title: "Customers",
    table: "customers",
    columns: [
      { key: "name", label: "Customer Name", required: true },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" }
    ],
    display: ["name", "phone", "address"]
  },

  suppliers: {
    title: "Suppliers",
    table: "suppliers",
    columns: [
      { key: "name", label: "Supplier Name", required: true },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" }
    ],
    display: ["name", "phone", "address"]
  },

  expenses: {
    title: "Expenses",
    table: "expenses",
    columns: [
      { key: "title", label: "Expense Title", required: true },
      { key: "amount", label: "Amount", type: "number", required: true }
    ],
    display: ["title", "amount", "created_at"]
  },

  sales: {
    title: "Sales",
    table: "sales",
    columns: [
      { key: "invoice_no", label: "Invoice Number", required: true },
      { key: "total", label: "Total Amount", type: "number", required: true },
      { key: "paid", label: "Paid Amount", type: "number" },
      { key: "due", label: "Due Amount", type: "number" }
    ],
    display: ["invoice_no", "total", "paid", "due", "created_at"]
  }
};

// =====================================
// MODULE PAGE
// =====================================

async function renderModule(page) {
  const config = modules[page];
  if (!config) return;

  const content = $("pageContent");

  content.innerHTML = `
    <div class="page-heading">
      <h3>${config.title}</h3>
      <button class="primary-small" id="addRecordBtn">
        + Add New
      </button>
    </div>

    <div id="recordFormArea"></div>

    <div class="panel">
      <div id="tableArea" class="empty-state">Loading...</div>
    </div>
  `;

  $("addRecordBtn").addEventListener("click", () => {
    showRecordForm(config);
  });

  await loadRecords(config);
}

// =====================================
// ADD FORM
// =====================================

function showRecordForm(config) {
  const area = $("recordFormArea");

  const fields = config.columns.map(column => `
    <div>
      <label>${escapeHTML(column.label)}</label>
      <input
        name="${escapeHTML(column.key)}"
        type="${column.type || "text"}"
        ${column.required ? "required" : ""}
        ${column.type === "number" ? 'step="0.01" min="0"' : ""}
        placeholder="${escapeHTML(column.label)}"
      >
    </div>
  `).join("");

  area.innerHTML = `
    <div class="form-card">
      <h3>Add ${escapeHTML(config.title)}</h3>
      <form id="recordForm">
        <div class="form-row">${fields}</div>
        <button type="submit" class="primary-btn">
          Save Record
        </button>
        <button type="button" id="cancelForm"
          class="danger-small" style="margin-top:10px;width:100%">
          Cancel
        </button>
      </form>
    </div>
  `;

  $("cancelForm").addEventListener("click", () => {
    area.innerHTML = "";
  });

  $("recordForm").addEventListener("submit", async event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const record = {};

    config.columns.forEach(column => {
      const value = formData.get(column.key);

      if (value === "") {
        record[column.key] = null;
      } else if (column.type === "number") {
        record[column.key] = Number(value);
      } else {
        record[column.key] = value;
      }
    });

    if (config.table === "sales") {
      record.paid = record.paid ?? 0;
      record.due = record.total - record.paid;

      if (record.paid > record.total) {
        notify("Paid amount cannot exceed total.");
        return;
      }
    }

    const { error } = await db
      .from(config.table)
      .insert(record);

    if (error) {
      notify("Save failed: " + error.message);
      return;
    }

    notify("Record saved successfully!");
    area.innerHTML = "";
    await loadRecords(config);
  });
}

// =====================================
// LOAD RECORDS
// =====================================

async function loadRecords(config) {
  const area = $("tableArea");

  const { data, error } = await db
    .from(config.table)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    area.innerHTML = "Error: " + escapeHTML(error.message);
    return;
  }

  if (!data || data.length === 0) {
    area.innerHTML = '<div class="empty-state">No records found.</div>';
    return;
  }

  const headings = config.display.map(key => {
    const column = config.columns.find(item => item.key === key);
    return `<th>${escapeHTML(column?.label || key)}</th>`;
  }).join("");

  const rows = data.map(record => `
    <tr>
      ${config.display.map(key => {
        let value = record[key] ?? "-";

        if (key.includes("price") || key === "amount" ||
            ["total", "paid", "due"].includes(key)) {
          value = money(value);
        }

        if (key === "created_at" && value !== "-") {
          value = new Date(value).toLocaleDateString("en-GB");
        }

        return `<td>${escapeHTML(value)}</td>`;
      }).join("")}
      <td>
        <button class="danger-small delete-record"
          data-id="${escapeHTML(record.id)}">
          Delete
        </button>
      </td>
    </tr>
  `).join("");

  area.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>${headings}<th>Action</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  area.querySelectorAll(".delete-record").forEach(button => {
    button.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this record?")) {
        return;
      }

      const { error } = await db
        .from(config.table)
        .delete()
        .eq("id", button.dataset.id);

      if (error) {
        notify("Delete failed: " + error.message);
        return;
      }

      notify("Record deleted.");
      await loadRecords(config);
    });
  });
}

// =====================================
// INITIAL SESSION CHECK
// =====================================

async function initialize() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    $("loginMessage").textContent = error.message;
    return;
  }

  if (data.session?.user) {
    currentUser = data.session.user;
    await startApp();
  }
}

initialize();
