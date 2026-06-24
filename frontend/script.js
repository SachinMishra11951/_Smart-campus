const toast = document.getElementById("toast");
const savedTheme = localStorage.getItem("smartCampusTheme") || "dark";
document.body.dataset.theme = savedTheme;

function updateThemeButtons() {
  const isLight = document.body.dataset.theme === "light";
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.textContent = isLight ? "Switch to Dark" : "Switch to Light";
    button.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  });
}

document.querySelectorAll(".theme-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
    document.body.dataset.theme = nextTheme;
    localStorage.setItem("smartCampusTheme", nextTheme);
    updateThemeButtons();
  });
});

updateThemeButtons();

function typeHeroTitle() {
  const title = document.querySelector(".hero h1");
  if (!title) return;

  const lines = [
    { text: "Smart Campus", className: "typing-line" },
    { text: "Complaint & Resource Management System", className: "typing-line gradient-text" }
  ];

  title.textContent = "";
  let delay = 0;

  lines.forEach((line) => {
    const lineElement = document.createElement("span");
    lineElement.className = line.className;

    [...line.text].forEach((char) => {
      const charElement = document.createElement("span");
      charElement.className = "typing-char";
      charElement.textContent = char === " " ? "\u00A0" : char;
      charElement.style.animationDelay = `${delay}ms`;
      delay += 72;
      lineElement.appendChild(charElement);
    });

    title.appendChild(lineElement);
    delay += 260;
  });
}

function setupScrollReveal() {
  const animatedItems = document.querySelectorAll(".feature-card, .benefit, .panel, .resource-card, .stat-card");
  if (!animatedItems.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  animatedItems.forEach((item) => observer.observe(item));
}

typeHeroTitle();
setupScrollReveal();

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

document.querySelector(".nav-toggle")?.addEventListener("click", () => {
  document.querySelector(".main-nav")?.classList.toggle("open");
});

document.querySelectorAll("[data-toast]").forEach((button) => {
  button.addEventListener("click", () => showToast(button.dataset.toast));
});

document.querySelectorAll(".js-demo-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("Request submitted successfully.");
    form.reset();
  });
});

document.querySelector(".js-complaint-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("title").value.trim();
  const priority = document.getElementById("priority").value;
  const id = `CMP-${Math.floor(2300 + Math.random() * 700)}`;
  const item = document.createElement("div");
  item.className = "list-item";
  item.innerHTML = `<div><strong>${id}</strong><br><span>${title}</span></div><span class="tag ${priority === "High" ? "pink" : "gold"}">${priority}</span>`;
  document.getElementById("complaintList")?.prepend(item);
  showToast(`Complaint created: ${id}`);
  event.target.reset();
});

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.hidden = true);
    button.classList.add("active");
    document.getElementById(button.dataset.tab).hidden = false;
  });
});

const records = [
  { id: "CMP-2301", category: "IT", subject: "Projector issue in Room A-204", status: "Pending", date: "20 Jun" },
  { id: "CMP-2286", category: "Library", subject: "Library AC maintenance", status: "Resolved", date: "18 Jun" },
  { id: "RES-1182", category: "Resource", subject: "Computer Lab booking", status: "Approved", date: "21 Jun" },
  { id: "CMP-2278", category: "Hostel", subject: "Water supply delay", status: "High", date: "17 Jun" },
  { id: "RES-1176", category: "Resource", subject: "Projector kit request", status: "Pending", date: "16 Jun" }
];

function statusClass(status) {
  if (status === "Resolved" || status === "Approved") return "green";
  if (status === "High") return "pink";
  if (status === "Pending") return "gold";
  return "";
}

function renderRecords() {
  const table = document.getElementById("recordsTable");
  if (!table) return;

  const query = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = records.filter((record) => {
    const matchesText = `${record.id} ${record.subject}`.toLowerCase().includes(query);
    const matchesCategory = category === "all" || record.category === category;
    const matchesStatus = status === "all" || record.status === status;
    return matchesText && matchesCategory && matchesStatus;
  });

  table.innerHTML = filtered.map((record) => `
    <tr>
      <td>${record.id}</td>
      <td>${record.category}</td>
      <td>${record.subject}</td>
      <td><span class="tag ${statusClass(record.status)}">${record.status}</span></td>
      <td>${record.date}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">No matching records found.</td></tr>`;
}

["searchInput", "categoryFilter", "statusFilter"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", renderRecords);
  document.getElementById(id)?.addEventListener("change", renderRecords);
});

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    document.getElementById("statusFilter").value = chip.dataset.status;
    renderRecords();
  });
});

renderRecords();
