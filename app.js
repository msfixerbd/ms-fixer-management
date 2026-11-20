
/* =========================================
   MS FIXER MANAGEMENT SYSTEM
   Supabase Connected - Owner Only
   ========================================= */

const SUPABASE_URL = "https://usflivnclpeaqiqrakqd.supabase.co";
const SUPABASE_KEY = "sb_publishable_CyKrvOTCoDJ7ubGoRbg_Sg_2alzW4FZ";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentPage = "dashboard";
let appStarted = false;
let editingId = null;

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function money(value) {
  return "৳ " + Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function notify(message, error = false) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.background = error ? "#b42318" : "#16794b";
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 3000);
}

function showError(error) {
  console.error(error);
  notify(error?.message || "কাজটি সম্পন্ন হয়নি", true);
}

/* =========================================
   MODULE CONFIGURATION
   ========================================= */

const modules = {
  products: {
    title: "Product Management",
    table: "products",
    columns: ["name", "sku", "category", "purchase_price", "selling_price", "stock"],
    fields: [
      ["name", "Product Name", "text", true],
      ["sku", "Product Code / SKU", "text"],
      ["category", "Category", "text"],
      ["purchase_price", "Purchase Price", "number"],
      ["selling_price", "Selling Price", "number"],
      ["stock", "Opening Stock", "number"]
    ]
  },

  categories: {
    title: "Categories",
    table: "categories",
    columns: ["name", "description"],
    fields: [
      ["name", "Category Name", "text", true],
      ["description", "Description", "text", true]
    ]
  },

  customers: {
    title: "Customers",
    table: "customers",
    columns: ["name", "phone", "address"],
    fields: [
      ["name", "Customer Name", "text", true],
      ["phone", "Phone", "tel"],
      ["address", "Address", "text"]
    ]
  },

  suppliers: {
    title: "Suppliers",
    table: "suppliers",
    columns: ["name", "phone", "address"],
    fields: [
      ["name", "Supplier Name", "text", true],
      ["phone", "Phone", "tel"],
      ["address", "Address", "text"]
    ]
  },

  branches: {
    title: "Branch Management",
    table: "branches",
    columns: ["branch_code", "name", "phone", "address", "status"],
    fields: [
      ["branch_code", "Branch Code", "text", true],
      ["name", "Branch Name", "text", true],
      ["phone", "Phone", "tel"],
      ["address", "Address", "text"],
      ["status", "Status", "select", false, ["active", "inactive"]]
    ]
  },

  employees: {
    title: "Employee Management",
    table: "employees",
    columns: ["employee_code", "full_name", "phone", "department", "role", "status"],
    fields: [
      ["employee_code", "Employee Code", "text", true],
      ["full_name", "Full Name", "text", true],
      ["phone", "Phone", "tel"],
      ["email", "Email", "email"],
      ["department", "Department", "text"],
      ["role", "Role", "select", false, ["staff", "manager", "admin"]],
      ["branch_id", "Branch", "relation", false, "branches"],
      ["status", "Status", "select", false, ["active", "inactive"]]
    ]
  },

  sales: {
    title: "Sales & POS",
    table: "sales",
    columns: ["invoice_no", "customer_id", "total", "paid", "due", "created_at"],
    fields: [
      ["invoice_no", "Invoice Number", "text"],
      ["customer_id", "Customer", "relation", false, "customers"],
      ["total", "Total Amount", "number", true],
      ["paid", "Paid Amount", "number"],
      ["branch_id", "Branch", "relation", false, "branches"]
    ]
  },

  sales_items: {
    title: "Sales Items",
    table: "sales_items",
    columns: ["sale_id", "product_id", "quantity", "unit_price", "discount", "line_total"],
    fields: [
      ["sale_id", "Sale Invoice", "relation", true, "sales"],
      ["product_id", "Product", "relation", true, "products"],
      ["quantity", "Quantity", "number", true],
      ["unit_price", "Unit Price", "number", true],
      ["discount", "Discount", "number"],
      ["line_total", "Line Total", "number", true]
    ]
  },

  purchases: {
    title: "Purchase Management",
    table: "purchases",
    columns: ["invoice_no", "supplier_id", "total", "paid", "due", "purchase_date"],
    fields: [
      ["invoice_no", "Purchase Invoice", "text", true],
      ["supplier_id", "Supplier", "relation", false, "suppliers"],
      ["branch_id", "Branch", "relation", false, "branches"],
      ["subtotal", "Subtotal", "number"],
      ["discount", "Discount", "number"],
      ["total", "Total", "number", true],
      ["paid", "Paid", "number"],
      ["notes", "Notes", "text"]
    ]
  },

  purchase_items: {
    title: "Purchase Items",
    table: "purchase_items",
    columns: ["purchase_id", "product_id", "quantity", "unit_cost", "line_total"],
    fields: [
      ["purchase_id", "Purchase Invoice", "relation", true, "purchases"],
      ["product_id", "Product", "relation", true, "products"],
      ["quantity", "Quantity", "number", true],
      ["unit_cost", "Unit Cost", "number", true],
      ["line_total", "Line Total", "number", true]
    ]
  },

  inventory: {
    title: "Inventory / Stock Movement",
    table: "stock_movements",
    columns: ["product_id", "movement_type", "quantity", "branch_id", "notes"],
    fields: [
      ["product_id", "Product", "relation", true, "products"],
      ["movement_type", "Movement Type", "select", true,
        ["opening", "purchase", "sale", "return", "adjustment", "damage"]],
      ["quantity", "Quantity (+/-)", "number", true],
      ["branch_id", "Branch", "relation", false, "branches"],
      ["notes", "Notes", "text"]
    ]
  },

  expenses: {
    title: "Expenses",
    table: "expenses",
    columns: ["title", "amount", "created_at"],
    fields: [
      ["title", "Expense Title", "text", true],
      ["amount", "Amount", "number", true]
    ]
  },

  accounts: {
    title: "Accounts & Transactions",
    table: "financial_transactions",
    columns: ["transaction_type", "category", "amount", "description", "transaction_date"],
    fields: [
      ["transaction_type", "Transaction Type", "select", true,
        ["income", "expense", "transfer"]],
      ["category", "Category", "text"],
      ["amount", "Amount", "number", true],
      ["description", "Description", "text"],
      ["branch_id", "Branch", "relation", false, "branches"]
    ]
  },

  payments: {
    title: "Payment Management",
    table: "payments",
    columns: ["amount", "payment_method", "payment_date", "reference_no", "notes"],
    fields: [
      ["sale_id", "Sales Invoice", "relation", false, "sales"],
      ["purchase_id", "Purchase Invoice", "relation", false, "purchases"],
      ["customer_id", "Customer", "relation", false, "customers"],
      ["supplier_id", "Supplier", "relation", false, "suppliers"],
      ["amount", "Payment Amount", "number", true],
      ["payment_method", "Payment Method", "select", false,
        ["cash", "bank", "bkash", "nagad", "card", "other"]],
      ["reference_no", "Reference Number", "text"],
      ["notes", "Notes", "text"]
    ]
  },

  service: {
    title: "Service & Repair",
    table: "service_jobs",
    columns: ["job_no", "customer_id", "device_name", "device_model", "repair_cost", "status"],
    fields: [
      ["job_no", "Job Card Number", "text", true],
      ["customer_id", "Customer", "relation", false, "customers"],
      ["branch_id", "Branch", "relation", false, "branches"],
      ["device_name", "Device Name", "text"],
      ["device_model", "Device Model", "text"],
      ["serial_number", "Serial Number", "text"],
      ["problem_description", "Customer Problem", "text"],
      ["diagnosis", "Diagnosis", "text"],
      ["repair_cost", "Repair Cost", "number"],
      ["status", "Job Status", "select", false,
        ["received", "checking", "waiting_parts", "repairing", "completed", "delivered"]],
      ["delivery_date", "Delivery Date", "date"],
      ["notes", "Notes", "text"]
    ]
  },

  warranty: {
    title: "Warranty Management",
    table: "warranty_cards",
    columns: ["warranty_no", "product_id", "customer_id", "serial_number", "start_date", "end_date", "status"],
    fields: [
      ["warranty_no", "Warranty Number", "text", true],
      ["product_id", "Product", "relation", false, "products"],
      ["sale_id", "Sales Invoice", "relation", false, "sales"],
      ["customer_id", "Customer", "relation", false, "customers"],
      ["serial_number", "Serial Number", "text"],
      ["start_date", "Start Date", "date", true],
      ["end_date", "End Date", "date", true],
      ["warranty_terms", "Warranty Terms", "text"],
      ["status", "Status", "select", false, ["active", "expired", "claimed"]]
    ]
  }
};

/* =========================================
   LOGIN & OWNER SECURITY
   ========================================= */

async function startApp() {
  if (appStarted) return;

  appStarted = true;

  try {
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      appStarted = false;
      return showLogin();
    }

    const { data, error } = await db.rpc("is_ms_fixer_owner");

    if (error) throw error;

    if (data !== true) {
      await db.auth.signOut();
      appStarted = false;
      return showLogin("এই অ্যাকাউন্টের Owner Access নেই।");
    }

    currentUser = user;

    $("loginScreen").classList.add("hidden");
    $("appScreen").classList.remove("hidden");

    buildNavigation();
    await loadPage("dashboard");

  } catch (error) {
    appStarted = false;
    showError(error);
    showLogin("Login যাচাই করা যায়নি।");
  }
}

function showLogin(message = "") {
  $("loginScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");

  if ($("loginMessage")) {
    $("loginMessage").textContent = message;
  }
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  $("loginMessage").textContent = "Checking...";

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("loginMessage").textContent = error.message;
    return;
  }

  await startApp();
});

$("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  currentUser = null;
  appStarted = false;
  showLogin();
});

db.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    currentUser = null;
    appStarted = false;
    showLogin();
  }
});

/* =========================================
   NAVIGATION
   ========================================= */

const navigationItems = [
  ["dashboard", "Dashboard"],
  ["products", "Products"],
  ["categories", "Categories"],
  ["sales", "Sales & POS"],
  ["sales_items", "Sales Items"],
  ["purchases", "Purchases"],
  ["purchase_items", "Purchase Items"],
  ["inventory", "Inventory"],
  ["accounts", "Accounts"],
  ["payments", "Payments"],
  ["customers", "Customers"],
  ["suppliers", "Suppliers"],
  ["service", "Service & Repair"],
  ["warranty", "Warranty"],
  ["branches", "Branches"],
  ["employees", "Employees"],
  ["expenses", "Expenses"],
  ["settings", "⚙️ Admin Settings"]
];


function buildNavigation() {
  const nav = $("navigation");
  nav.innerHTML = "";

  navigationItems.forEach(([page, label]) => {
    const button = document.createElement("button");
    button.className = "nav-item";
    button.dataset.page = page;
    button.textContent = label;

    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(item =>
        item.classList.remove("active")
      );

      button.classList.add("active");
      loadPage(page);

      $("sidebar").classList.remove("open");
    });

    nav.appendChild(button);
  });
}

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

/* =========================================
   PAGE LOADER
   ========================================= */
async function loadPage(page) {
  currentPage = page;
  editingId = null;

  if (page === "dashboard") {
    $("pageTitle").textContent = "Dashboard";
    await loadDashboard();
    return;
  }

  if (page === "settings") {
    $("pageTitle").textContent = "Admin Settings";
    await loadAdminSettings();
    return;
  }

  const config = modules[page];
  if (!config) return;

  $("pageTitle").textContent = config.title;
  await renderModule(page);
}
/* =========================================
   DASHBOARD
   ========================================= */

async function getCount(table) {
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

async function getSum(table, column) {
  const { data, error } = await db.from(table).select(column);
  if (error) throw error;

  return (data || []).reduce(
    (sum, item) => sum + Number(item[column] || 0), 0
  );
}

async function loadDashboard() {
  const content = $("pageContent");
  content.innerHTML = "<p>Loading Dashboard...</p>";

  try {
    const [
      products,
      customers,
      salesCount,
      expensesCount,
      salesTotal,
      expensesTotal,
      stockTotal,
      salesDue
    ] = await Promise.all([
      getCount("products"),
      getCount("customers"),
      getCount("sales"),
      getCount("expenses"),
      getSum("sales", "total"),
      getSum("expenses", "amount"),
      getSum("products", "stock"),
      getSum("sales", "due")
    ]);

    content.innerHTML = `
      <div class="stats-grid">
        ${statCard("Total Products", products)}
        ${statCard("Total Customers", customers)}
        ${statCard("Total Sales", salesCount)}
        ${statCard("Total Expenses", expensesCount)}
        ${statCard("Sales Amount", money(salesTotal))}
        ${statCard("Expenses Amount", money(expensesTotal))}
        ${statCard("Total Stock", stockTotal)}
        ${statCard("Customer Due", money(salesDue))}
      </div>

      <div class="panel">
        <h3>Business Overview</h3>
        <p>Sales Amount: <strong>${money(salesTotal)}</strong></p>
        <p>Expenses: <strong>${money(expensesTotal)}</strong></p>
        <p>Sales less recorded expenses:
          <strong>${money(salesTotal - expensesTotal)}</strong>
        </p>
        <small>
          এটি প্রাথমিক হিসাব। পণ্যের ক্রয়মূল্য, Purchase, Returns,
          Payments ও অন্যান্য খরচ যুক্ত না হওয়া পর্যন্ত এটিকে
          প্রকৃত Net Profit হিসেবে ধরবে না।
        </small>
      </div>
    `;
   } catch (error) {
    showError(error);
    content.innerHTML = "<p>Dashboard load করা যায়নি।</p>";
  }
}

function statCard(title, value) {
  return `
    <div class="stat-card">
      <h3>${escapeHTML(title)}</h3>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

/* =========================================
   MODULE FORM
   ========================================= */

async function getRelationOptions(table) {
  const { data, error } = await db.from(table).select("*").limit(500);
  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    label:
      item.name ||
      item.full_name ||
      item.invoice_no ||
      item.job_no ||
      item.warranty_no ||
      item.branch_code ||
      item.id
  }));
}

async function makeField(field, existing = {}) {
  const [name, label, type, required, options] = field;
  const value = existing[name] ?? "";

  if (type === "relation") {
    const records = await getRelationOptions(options);

    return `
      <label>${escapeHTML(label)}</label>
      <select name="${name}" ${required ? "required" : ""}>
        <option value="">Select ${escapeHTML(label)}</option>
        ${records.map(record => `
          <option value="${escapeHTML(record.id)}"
            ${String(value) === String(record.id) ? "selected" : ""}>
            ${escapeHTML(record.label)}
          </option>
        `).join("")}
      </select>
    `;
  }

  if (type === "select") {
    return `
      <label>${escapeHTML(label)}</label>
      <select name="${name}" ${required ? "required" : ""}>
        <option value="">Select</option>
        ${options.map(option => `
          <option value="${escapeHTML(option)}"
            ${String(value) === option ? "selected" : ""}>
            ${escapeHTML(option)}
          </option>
        `).join("")}
      </select>
    `;
  }

  return `
    <label>${escapeHTML(label)}</label>
    <input
      name="${name}"
      type="${type}"
      value="${escapeHTML(value)}"
      ${type === "number" ? 'step="any"' : ""}
      ${required ? "required" : ""}
      placeholder="${escapeHTML(label)}"
    >
  `;
}

async function renderModule(page) {
  const config = modules[page];
  const content = $("pageContent");

  content.innerHTML = "<p>Loading...</p>";

  try {
    const fields = await Promise.all(
      config.fields.map(field => makeField(field))
    );

    content.innerHTML = `
      <div class="panel">
        <div class="page-heading">
          <h3>${escapeHTML(config.title)}</h3>
        </div>

        <form id="recordForm" class="form-card">
          <div class="form-row">
            ${fields.map(field => `<div>${field}</div>`).join("")}
          </div>
          <button type="submit" class="primary-btn" id="saveBtn">
            Save Record
          </button>
          <button type="button" id="cancelEdit" class="primary-small">
            Cancel
          </button>
        </form>
      </div>

      <div class="panel">
        <h3>${escapeHTML(config.title)} Records</h3>
        <div id="recordList">Loading records...</div>
      </div>
    `;

    $("recordForm").addEventListener("submit", event =>
      saveRecord(event, page)
    );

    $("cancelEdit").addEventListener("click", () => {
      editingId = null;
      renderModule(page);
    });

    await loadRecords(page);

  } catch (error) {
    showError(error);
    content.innerHTML = "<p>Module load করা যায়নি।</p>";
  }
}

/* =========================================
   SAVE / UPDATE RECORD
   ========================================= */

async function saveRecord(event, page) {
  event.preventDefault();

  const config = modules[page];
  const formData = new FormData(event.target);
  const record = {};

  config.fields.forEach(([name, label, type]) => {
    const value = formData.get(name);

    if (value === "" || value === null) return;

    record[name] = type === "number" ? Number(value) : value;
  });

  if (page === "sales") {
    record.paid = record.paid || 0;
    record.due = Number(record.total || 0) - Number(record.paid || 0);

    if (record.paid > record.total || record.due < 0) {
      return notify("Paid Amount Total-এর বেশি হতে পারবে না।", true);
    }
  }

  if (page === "purchases") {
    record.subtotal = record.subtotal || record.total || 0;
    record.discount = record.discount || 0;
    record.paid = record.paid || 0;
    record.due = Number(record.total || 0) - Number(record.paid || 0);

    if (record.paid > record.total || record.due < 0) {
      return notify("Paid Amount Total-এর বেশি হতে পারবে না।", true);
    }
  }

  if (page === "sales_items" || page === "purchase_items") {
    const quantity = Number(record.quantity || 0);
    const price = Number(record.unit_price ?? record.unit_cost ?? 0);
    const discount = Number(record.discount || 0);

    if (quantity <= 0 || price < 0 || discount < 0) {
      return notify("Quantity, Price বা Discount সঠিক নয়।", true);
    }

    record.line_total = Math.max(0, quantity * price - discount);
  }

  try {
    let result;

    if (editingId) {
      result = await db
        .from(config.table)
        .update(record)
        .eq("id", editingId);
    } else {
      result = await db.from(config.table).insert(record);
    }

    if (result.error) throw result.error;

    notify(editingId ? "Record Updated" : "Record Saved");

    editingId = null;
    await renderModule(page);

  } catch (error) {
    showError(error);
  }
}

/* =========================================
   LOAD RECORDS
   ========================================= */

async function loadRecords(page) {
  const config = modules[page];
  const list = $("recordList");

  let query = db.from(config.table).select("*");

  // categories.created_at is UUID, not a timestamp.
  if (page !== "categories") {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(100);

  if (error) {
    showError(error);
    list.innerHTML = "<p>Records load করা যায়নি।</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<div class="empty-state">No records found.</div>';
    return;
  }

  list.innerHTML = `
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            ${config.columns.map(column =>
              `<th>${escapeHTML(column.replaceAll("_", " "))}</th>`
            ).join("")}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(record => `
            <tr>
              ${config.columns.map(column => `
                <td>${escapeHTML(
                  column.includes("price") ||
                  ["total", "paid", "due", "amount", "repair_cost", "unit_cost", "line_total"].includes(column)
                    ? money(record[column])
                    : record[column] ?? "-"
                )}</td>
              `).join("")}
              <td>
                <button class="primary-small"
                  data-edit="${escapeHTML(record.id)}">Edit</button>
                <button class="danger-small"
                  data-delete="${escapeHTML(record.id)}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  list.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () =>
      editRecord(page, button.dataset.edit)
    );
  });

  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () =>
      deleteRecord(page, button.dataset.delete)
    );
  });
}

/* =========================================
   EDIT RECORD
   ========================================= */

async function editRecord(page, id) {
  const config = modules[page];

  try {
    const { data, error } = await db
      .from(config.table)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    editingId = id;

    const fields = await Promise.all(
      config.fields.map(field => makeField(field, data))
    );

    const content = $("pageContent");

    content.querySelector(".form-card").innerHTML = `
      <div class="form-row">
        ${fields.map(field => `<div>${field}</div>`).join("")}
      </div>
      <button type="submit" class="primary-btn">Update Record</button>
      <button type="button" id="cancelEdit" class="primary-small">Cancel</button>
    `;

    $("cancelEdit").addEventListener("click", () => {
      editingId = null;
      renderModule(page);
    });

    notify("Edit Mode");

  } catch (error) {
    showError(error);
  }
}

/* =========================================
   DELETE RECORD
   ========================================= */

async function deleteRecord(page, id) {
  if (!confirm("তুমি কি এই Record Delete করতে চাও?")) return;

  try {
    const { error } = await db
      .from(modules[page].table)
      .delete()
      .eq("id", id);

    if (error) throw error;

    notify("Record Deleted");
    await renderModule(page);

  } catch (error) {
    showError(error);
  }
}

/* =========================================
   INITIALIZE
   ========================================= */

async function initialize() {
  const { data: { session } } = await db.auth.getSession();

  if (session) {
    await startApp();
  } else {
    showLogin();
  }
}

/* =========================================
   MS FIXER - SUPER ADMIN SETTINGS
   ========================================= */

let appSettings = {};

async function loadAdminSettings() {
  const content = $("pageContent");
  content.innerHTML = "<p>Loading Admin Settings...</p>";

  try {
    const { data, error } = await db
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;

    if (data.owner_id && data.owner_id !== currentUser.id) {
      throw new Error("Settings Owner ID does not match your account.");
    }

    appSettings = data;

    document.body.dataset.theme = data.theme || "light";

    content.innerHTML = `
      <div class="panel">
        <h3>🏢 Company Profile</h3>

        <form id="companySettingsForm" class="form-card">
          <div class="form-row">
            <div>
              <label>Company Name</label>
              <input name="company_name"
                value="${escapeHTML(data.company_name || "MS FIXER")}"
                required>
            </div>

            <div>
              <label>Phone</label>
              <input name="phone"
                value="${escapeHTML(data.phone || "")}">
            </div>

            <div>
              <label>Email</label>
              <input name="email" type="email"
                value="${escapeHTML(data.email || "")}">
            </div>

            <div>
              <label>Address</label>
              <input name="address"
                value="${escapeHTML(data.address || "")}">
            </div>

            <div>
              <label>Company Logo</label>
              <input type="file" id="companyLogoFile"
                accept="image/png,image/jpeg,image/webp">
            </div>
          </div>

          <div id="logoPreview" style="margin:15px 0">
            ${data.company_logo ? `
              <img src="${escapeHTML(data.company_logo)}"
                alt="Company Logo"
                style="max-width:130px;max-height:100px;object-fit:contain">
            ` : "No Logo Uploaded"}
          </div>

          <button type="submit" class="primary-btn">
            Save Company Profile
          </button>
        </form>
      </div>

      <div class="panel">
        <h3>🧾 Invoice Settings</h3>

        <form id="invoiceSettingsForm" class="form-card">
          <div class="form-row">
            <div>
              <label>Invoice Prefix</label>
              <input name="invoice_prefix"
                value="${escapeHTML(data.invoice_prefix || "MSF")}">
            </div>

            <div>
              <label>Currency</label>
              <select name="currency">
                <option value="BDT" ${data.currency === "BDT" ? "selected" : ""}>BDT - Taka</option>
                <option value="USD" ${data.currency === "USD" ? "selected" : ""}>USD</option>
              </select>
            </div>

            <div>
              <label>Invoice Footer</label>
              <input name="invoice_footer"
                value="${escapeHTML(data.invoice_footer || "Thank you for shopping with MS FIXER")}">
            </div>
          </div>

          <button class="primary-btn" type="submit">
            Save Invoice Settings
          </button>
        </form>
      </div>

      <div class="panel">
        <h3>🎨 Appearance Settings</h3>

        <form id="appearanceForm" class="form-card">
          <div class="form-row">
            <div>
              <label>Theme</label>
              <select name="theme">
                <option value="light" ${data.theme === "light" ? "selected" : ""}>Light</option>
                <option value="dark" ${data.theme === "dark" ? "selected" : ""}>Dark</option>
              </select>
            </div>

            <div>
              <label>Language Preference</label>
              <select name="language">
                <option value="en" ${data.language === "en" ? "selected" : ""}>English</option>
                <option value="bn" ${data.language === "bn" ? "selected" : ""}>বাংলা</option>
              </select>
            </div>
          </div>

          <button class="primary-btn" type="submit">
            Save Appearance
          </button>
        </form>
      </div>

      <div class="panel">
        <h3>🔐 Security</h3>

        <form id="passwordChangeForm" class="form-card">
          <div class="form-row">
            <div>
              <label>New Password</label>
              <input name="new_password" type="password"
                minlength="8" required>
            </div>

            <div>
              <label>Confirm New Password</label>
              <input name="confirm_password" type="password"
                minlength="8" required>
            </div>
          </div>

          <button class="primary-btn" type="submit">
            Change Password
          </button>
        </form>
      </div>

      <div class="panel">
        <h3>💾 Data Backup</h3>
        <p>Export available business records as a JSON backup file.</p>
        <button class="primary-btn" id="backupButton">
          Download Data Backup
        </button>
      </div>

      <div class="panel">
        <h3>👑 Super Admin Account</h3>
        <p>Logged in as: <strong>${escapeHTML(currentUser.email || "")}</strong></p>
        <p>Access: <strong>Super Admin / Owner</strong></p>
        <p>Owner ID: <small>${escapeHTML(currentUser.id)}</small></p>
      </div>
    `;

    $("companySettingsForm").addEventListener("submit", saveCompanySettings);
    $("invoiceSettingsForm").addEventListener("submit", saveInvoiceSettings);
    $("appearanceForm").addEventListener("submit", saveAppearanceSettings);
    $("passwordChangeForm").addEventListener("submit", changeAdminPassword);
    $("backupButton").addEventListener("click", downloadDataBackup);
  } catch (error) {
    console.error("Admin Settings Error:", error);

    content.innerHTML = `
      <div class="panel">
        <h3>Settings Error</h3>
        <pre style="white-space:pre-wrap;color:red;">
${escapeHTML(error?.message || String(error))}
        </pre>
      </div>
    `;

    showError(error);
  }
}

/* SAVE SETTINGS HELPER */

async function updateAppSettings(values) {
  const { error } = await db
    .from("app_settings")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id
    })
    .eq("id", 1)
    .eq("owner_id", currentUser.id);

  if (error) throw error;

  appSettings = { ...appSettings, ...values };
}

/* COMPANY PROFILE */

async function saveCompanySettings(event) {
  event.preventDefault();

  try {
    const form = new FormData(event.target);

    const values = {
      company_name: form.get("company_name").trim(),
      phone: form.get("phone").trim(),
      email: form.get("email").trim(),
      address: form.get("address").trim()
    };

    const file = $("companyLogoFile").files[0];

    if (file) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        throw new Error("Only PNG, JPG and WEBP images are allowed.");
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Logo size must be under 2 MB.");
      }

      const extension = file.name.split(".").pop().toLowerCase();
      const path = `company-logo-${currentUser.id}.${extension}`;

      const { error: uploadError } = await db.storage
        .from("ms-fixer-assets")
        .upload(path, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data } = db.storage
        .from("ms-fixer-assets")
        .getPublicUrl(path);

      values.company_logo = data.publicUrl;
    }

    await updateAppSettings(values);

    notify("Company Profile Saved Successfully");
    await loadAdminSettings();

  } catch (error) {
    showError(error);
  }
}

/* INVOICE SETTINGS */

async function saveInvoiceSettings(event) {
  event.preventDefault();

  try {
    const form = new FormData(event.target);

    await updateAppSettings({
      invoice_prefix: form.get("invoice_prefix").trim(),
      invoice_footer: form.get("invoice_footer").trim(),
      currency: form.get("currency")
    });

    notify("Invoice Settings Saved");

  } catch (error) {
    showError(error);
  }
}

/* APPEARANCE SETTINGS */

async function saveAppearanceSettings(event) {
  event.preventDefault();

  try {
    const form = new FormData(event.target);

    const values = {
      theme: form.get("theme"),
      language: form.get("language")
    };

    await updateAppSettings(values);

    document.body.dataset.theme = values.theme;

    notify("Appearance Settings Saved");

  } catch (error) {
    showError(error);
  }
}

/* CHANGE PASSWORD */

async function changeAdminPassword(event) {
  event.preventDefault();

  const form = new FormData(event.target);
  const password = form.get("new_password");
  const confirmPassword = form.get("confirm_password");

  if (password.length < 8) {
    return notify("Password must contain at least 8 characters.", true);
  }

  if (password !== confirmPassword) {
    return notify("Passwords do not match.", true);
  }

  try {
    const { error } = await db.auth.updateUser({
      password: password
    });

    if (error) throw error;

    event.target.reset();
    notify("Password Changed Successfully");

  } catch (error) {
    showError(error);
  }
}

/* BUSINESS DATA EXPORT */

async function downloadDataBackup() {
  const tables = [
    "products", "categories", "customers", "suppliers",
    "branches", "employees", "sales", "sales_items",
    "purchases", "purchase_items", "stock_movements",
    "expenses", "financial_transactions", "payments",
    "service_jobs", "warranty_cards", "app_settings"
  ];

  const backup = {
    company: "MS FIXER",
    exported_at: new Date().toISOString(),
    exported_by: currentUser.id,
    data: {}
  };

  try {
    notify("Preparing Backup...");

    for (const table of tables) {
      const { data, error } = await db.from(table).select("*");

      if (error) {
        throw new Error(`${table}: ${error.message}`);
      }

      backup.data[table] = data || [];
    }

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `MS-FIXER-Backup-${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    notify("Backup Downloaded Successfully");

  } catch (error) {
    showError(error);
  }
}

initialize();
