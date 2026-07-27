// (Student Portal)
// Feature: Global Utilities and Authentication Control
function isNumericString(str) {
    if (!str || str.length === 0) return false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] < '0' || str[i] > '9') return false;
    }
    return true;
}

const API_BASE_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const userId = localStorage.getItem("user_id");

if (!token || role !== "student") {
    alert("Access Denied.");
    window.location.href = "../login_frontend/login.html";
}

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// Feature: Dynamic Student Profile Configuration and Custom Avatars
async function fetchProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/student/profile`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        
        if (data.user) {
            const name = data.user.name || "Student";
            const roll = data.user.roll_number || "";
            const email = data.user.email || ""; 
            
            const avatarStyle = "bottts"; 
            const avatarUrl = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent&scale=75`;
            
            document.querySelectorAll('.admin-avatar, .profile-avatar-large').forEach(el => {
                const paddingAmount = el.classList.contains('admin-avatar') ? '2px' : '8px';
                
                el.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; border-radius: inherit; object-fit: contain; padding: ${paddingAmount};">`;
                el.style.background = 'var(--bg3)'; 
                el.style.border = '1px solid var(--border)';
            });
            
            if (document.getElementById("welcomeMessage")) document.getElementById("welcomeMessage").textContent = `Welcome, ${name} 👋`;
            if (document.getElementById("sidebarStudentName")) document.getElementById("sidebarStudentName").textContent = name;
            if (document.getElementById("settingStudentName")) document.getElementById("settingStudentName").textContent = name;
            
            if (document.getElementById("settingInputName")) document.getElementById("settingInputName").value = name;
            if (document.getElementById("settingInputEmail")) document.getElementById("settingInputEmail").value = email; 
            
            if (document.getElementById("settingRollDisplay")) document.getElementById("settingRollDisplay").value = roll || "Not Assigned";
        }
    } catch (err) { console.error("Profile Fetch Error:", err); }
}

// Feature: Settings Persistence Interface Handler
async function saveSettings() {
    const nameInput = document.getElementById("settingInputName").value.trim();
    const emailInput = document.getElementById("settingInputEmail").value.trim();

    if (!nameInput) {
        alert("Name cannot be empty.");
        return;
    }
    
    if (!emailInput || !emailInput.includes("@")) {
        alert("Please enter a valid email address.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/student/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                name: nameInput,
                email: emailInput 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.detail || "Failed to update profile");

        alert("Profile updated successfully!");
        fetchProfile(); 
        
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// Feature: System Activity and State Extractors
async function fetchMyComplaints() {
    try {
        const response = await fetch(`${API_BASE_URL}/complaints`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        
        const complaintsList = data.complaints || data || [];
        renderComplaints(complaintsList);
        updateChart(complaintsList); 
    } catch (err) { console.error("Complaints Fetch Error:", err); }
}

async function fetchMyBookings() {
    try {
        const fetchUrl = userId ? `${API_BASE_URL}/users/${userId}/bookings` : `${API_BASE_URL}/bookings`;
        
        const response = await fetch(fetchUrl, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error("Failed to fetch bookings");
        
        const data = await response.json();
        const bookingsList = data.bookings || data || [];
        
        renderBookings(bookingsList);
    } catch (err) { 
        console.error("Bookings Fetch Error:", err); 
    }
}

async function fetchResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/resources`);
        if (!response.ok) return;
        const data = await response.json();
        
        const resourceList = data.resources || data.Resources || [];
        const select = document.getElementById("bookResourceSelect");
        
        if (select) {
            if (resourceList.length === 0) {
                select.innerHTML = `<option value="">No resources available</option>`;
            } else {
                select.innerHTML = resourceList.map(r => `
                    <option value="${r.id}">${r.name} (${r.available_quantity} available)</option>
                `).join('');
            }
        }
    } catch (err) { console.error("Resources Fetch Error:", err); }
}

async function fetchNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        renderNotifications(data.notifications || []);
    } catch (err) { console.error("Notifications Fetch Error:", err); }
}

async function fetchActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/activities`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        renderActivity(data.activities || []);
    } catch (err) { console.error("Activities Fetch Error:", err); }
}

// Feature: Dynamic Data Visualization Updaters
function renderComplaints(complaints) {
    const total = complaints.length;
    const pending = complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
    const resolved = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;

    const totalEl = document.getElementById('student-stat-total');
    const pendingEl = document.getElementById('student-stat-pending');
    const resolvedEl = document.getElementById('student-stat-resolved');

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (resolvedEl) resolvedEl.textContent = resolved;

    const dashBody = document.getElementById("dash-complaints-tbody");
    if (dashBody) {
        dashBody.innerHTML = complaints.slice(0, 5).map(c => `
            <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;color:var(--cyan)">CMP-${c.id}</span></td>
                <td>${c.title}</td>
                <td>${c.category || 'General'}</td>
                <td><span class="status-pill status-${(c.status || 'pending').toLowerCase()}">${c.status || 'Pending'}</span></td>
            </tr>
        `).join('');
    }

    const fullBody = document.getElementById("my-complaints-tbody");
    if (fullBody) {
        fullBody.innerHTML = complaints.map(c => `
            <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;color:var(--cyan)">CMP-${c.id}</span></td>
                <td><strong>${c.title}</strong></td>
                <td>${c.category || 'N/A'}</td>
                <td>${c.created_at ? c.created_at.split('T')[0] : 'N/A'}</td>
                <td>${c.priority || 'Medium'}</td>
                <td><span class="status-pill status-${(c.status || 'pending').toLowerCase()}">${c.status || 'Pending'}</span></td>
            </tr>
        `).join('');
    }
}

function renderBookings(bookings) {
    const totalBookingsEl = document.getElementById('student-stat-bookings'); 
    if (totalBookingsEl) totalBookingsEl.textContent = bookings.length;

    const body = document.getElementById("my-bookings-tbody");
    if (body) {
        body.innerHTML = bookings.map(b => `
            <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;color:var(--cyan)">BKG-${b.id}</span></td>
                <td>Resource #${b.resource_id}</td>
                <td>${b.booking_date}</td>
                <td>${b.time_slot}</td>
                <td>${b.purpose}</td>
                <td><span class="status-pill status-${(b.status || '').toLowerCase() === 'approved' ? 'resolved' : 'pending'}">${b.status || 'Pending'}</span></td>
            </tr>
        `).join('');
    }
}

// Feature: Interactive Student Chart Component Constructor
let complaintChartInstance = null;
function updateChart(complaints) {
    const ctx = document.getElementById('studentComplaintChart');
    if (!ctx) return;

    const pending = complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
    const resolved = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
    const assigned = complaints.filter(c => (c.status || '').toLowerCase() === 'assigned').length;

    if (complaintChartInstance) complaintChartInstance.destroy();

    complaintChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Resolved', 'Assigned'],
            datasets: [{
                data: [pending, resolved, assigned],
                backgroundColor: ['#fbbf24', '#4ade80', '#6366f1'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            cutout: '75%',
            plugins: {
                legend: { 
                    position: 'right', 
                    labels: { 
                        color: '#94a3b8', 
                        font: { family: 'Inter', size: 11 }, 
                        boxWidth: 12 
                    } 
                }
            }
        }
    });
}

// Feature: Global Top-Level Search Controller Router
document.getElementById('global-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (term.includes('setting') || term.includes('profile')) {
        showPage('settings', document.querySelector('[onclick*="settings"]'));
    } else if (term.includes('complaint') || term.includes('history')) {
        showPage('myComplaints', document.querySelector('[onclick*="myComplaints"]'));
    } else if (term.includes('book') || term.includes('reserve')) {
        showPage('myBookings', document.querySelector('[onclick*="myBookings"]'));
    } else if (term.includes('dash') || term.includes('home')) {
        showPage('dashboard', document.querySelector('[onclick*="dashboard"]'));
    }

    const rows = document.querySelectorAll('#my-complaints-tbody tr, #dash-complaints-tbody tr, #my-bookings-tbody tr');
    rows.forEach(row => {
        if (!term) {
            row.style.display = '';
        } else {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        }
    });
});

function renderActivity(data) {
    const list = document.getElementById('student-activity-list');
    if (!list) return;

    list.innerHTML = data.map(a => {
        let dotColor = "cyan"; 
        if (a.type === 'complaint') dotColor = "red";
        if (a.type === 'resolve') dotColor = "green";
        if (a.type === 'booking') dotColor = "yellow";

        return `
        <div class="activity-item">
          <div class="activity-dot" style="background: var(--${dotColor})"></div>
          <div>
            <div class="activity-text">${a.description}</div>
            <div class="activity-time">${a.created_at ? a.created_at.split('T')[0] : 'Just now'}</div>
          </div>
        </div>`;
    }).join('');
}

function renderNotifications(data) {
    const list = document.getElementById('student-notif-list');
    if (!list) return;

    const unreadCount = data.filter(n => !n.is_read).length;
    const badge = document.getElementById('header-notif-badge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    list.innerHTML = data.map(n => {
        let icon = "🔔"; let color = "rgba(99,102,241,0.15)";
        if (n.type === 'complaint') { icon = "⚠️"; color = "rgba(248,113,113,0.15)"; }
        else if (n.type === 'booking') { icon = "📅"; color = "rgba(251,191,36,0.15)"; }

        return `
        <div class="notif-item ${!n.is_read ? 'unread' : ''}">
          <div class="notif-icon" style="background:${color}">${icon}</div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message}</div>
          </div>
        </div>`;
    }).join('');
}

// Feature: Interactive Submissions and API Post Bridges
async function submitComplaint() {
    const titleEl = document.getElementById("compTitle");
    const categoryEl = document.getElementById("compCategory");
    const descEl = document.getElementById("compDesc");

    const title = titleEl ? titleEl.value.trim() : "";
    const category = categoryEl ? categoryEl.value : "Other";
    const desc = descEl ? descEl.value.trim() : "";

    if (!title || !desc) { alert("Please enter both title and description."); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/complaints`, {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({ title, description: desc, category, suggested_solution: null })
        });
        if (!response.ok) throw new Error("Submission failed");

        alert("Complaint filed successfully!");
        closeModal("raise-complaint-modal");
        
        if (titleEl) titleEl.value = "";
        if (descEl) descEl.value = "";
        fetchMyComplaints();
    } catch (err) { alert("Error: " + err.message); }
}

async function submitBooking() {
    const selectEl = document.getElementById("bookResourceSelect");
    const dateEl = document.getElementById("bookDate");
    const slotEl = document.getElementById("bookSlot");

    if (!selectEl.value || !dateEl.value) { alert("Please fill out all booking details."); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({
                resource_id: parseInt(selectEl.value),
                purpose: "Academic / Lab Use",
                remark: "Submitted from Student Portal",
                booking_date: dateEl.value,
                time_slot: slotEl ? slotEl.value : "08:00–10:00"
            })
        });
        if (!response.ok) throw new Error("Booking failed");

        alert("Booking request submitted successfully!");
        closeModal("book-resource-modal");
        fetchMyBookings();
    } catch (err) { alert("Error: " + err.message); }
}

// Feature: DOM State Management Implementations
function showPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function doLogout() {
    localStorage.clear();
    window.location.href = "../login_frontend/login.html";
}

document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

window.addEventListener("DOMContentLoaded", () => {
    fetchProfile();
    fetchMyComplaints();
    fetchMyBookings();
    fetchResources();
    fetchActivities();
    fetchNotifications();
});

const themeToggleBtn = document.getElementById('theme-toggle');
const toggleTrack = document.getElementById('toggle-track');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'light') toggleTrack?.classList.add('on');
    else toggleTrack?.classList.remove('on');
}

themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

document.addEventListener('DOMContentLoaded', () => {
    setTheme(localStorage.getItem('theme') || 'dark');
});