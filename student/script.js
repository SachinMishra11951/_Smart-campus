function isNumericString(str) {
    if (!str || str.length === 0) return false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] < '0' || str[i] > '9') return false;
    }
    return true;
}
// ══════════════════════════════════
//   CONFIG & SESSION CHECK
// ══════════════════════════════════
const API_BASE_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const userId = localStorage.getItem("user_id");

// Redirect immediately if not authenticated as a student
if (!token || role !== "student") {
    alert("Access Denied.");
    window.location.href = "../login_frontend/login.html";
}

// Bearer Token Helper
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ══════════════════════════════════
//   API FETCHING
// ══════════════════════════════════

// 1. Load Student Profile
async function fetchProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/student/profile`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.user) {
            const name = data.user.name || "Student";
            const welcomeEl = document.getElementById("welcomeMessage");
            const sideNameEl = document.getElementById("sidebarStudentName");
            const setNavEl = document.getElementById("settingStudentName");
            const setInpEl = document.getElementById("settingInputName");

            if (welcomeEl) welcomeEl.textContent = `Welcome, ${name} 👋`;
            if (sideNameEl) sideNameEl.textContent = name;
            if (setNavEl) setNavEl.textContent = name;
            if (setInpEl) setInpEl.value = name;
        }
    } catch (err) {
        console.error("Profile Fetch Error:", err);
    }
}

// 2. Fetch Student's Complaints
async function fetchProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/student/profile`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        if (data.user) {
            const name = data.user.name || "Student";
            const roll = data.user.roll_number || "";
            
            if (document.getElementById("welcomeMessage")) document.getElementById("welcomeMessage").textContent = `Welcome, ${name} 👋`;
            if (document.getElementById("sidebarStudentName")) document.getElementById("sidebarStudentName").textContent = name;
            if (document.getElementById("settingStudentName")) document.getElementById("settingStudentName").textContent = name;
            if (document.getElementById("settingInputName")) document.getElementById("settingInputName").value = name;

            // Extract Branch, Year, and ID manually (No Regex)
            if (roll && roll.length >= 5) {
                const branchStr = roll.substring(0, 2);
                const numStr = roll.substring(2);
                
                const branchSelect = document.getElementById("settingBranch");
                if (branchSelect) branchSelect.value = branchStr;
                
                const yearInput = document.getElementById("settingYear");
                if (yearInput) yearInput.value = numStr.substring(0, 2);
                
                const rollInput = document.getElementById("settingRollId");
                if (rollInput) rollInput.value = numStr.substring(2);
            }
        }
    } catch (err) { console.error("Profile Fetch Error:", err); }
}
async function saveSettings() {
    const nameInput = document.getElementById("settingInputName").value.trim();
    const branch = document.getElementById("settingBranch").value;
    const year = document.getElementById("settingYear").value.trim();
    const rollId = document.getElementById("settingRollId").value.trim();

    if (!nameInput) { alert("Name cannot be empty."); return; }
    
    if (year || rollId) {
        if (year.length !== 2 || !isNumericString(year)) {
            alert("Year must be exactly 2 digits (e.g., 25).");
            return;
        }
        if (rollId.length < 1 || rollId.length > 3 || !isNumericString(rollId)) {
            alert("Roll Number suffix must be between 1 and 3 digits.");
            return;
        }
    }

    const finalRollNumber = (year && rollId) ? `${branch}${year}${rollId}` : null;

    try {
        const bodyData = { name: nameInput };
        if (finalRollNumber) bodyData.roll_number = finalRollNumber;

        const response = await fetch(`${API_BASE_URL}/student/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.detail || "Failed to update profile");

        alert("Profile updated successfully!");
        fetchProfile(); 
        
    } catch (err) {
        if (Array.isArray(err.message)) alert("Error: " + err.message[0].msg);
        else alert("Error: " + err.message);
    }
}
// 3. Fetch Student's Bookings
async function fetchMyBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/bookings`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) return;
        const data = await response.json();
        renderBookings(data.bookings || []);
    } catch (err) {
        console.error("Bookings Fetch Error:", err);
    }
}

// 4. Fetch Resources for Booking Modal Dropdown
async function fetchResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/resources`);
        if (!response.ok) return;
        const data = await response.json();
        
        // Handles both "Resources" and "resources" key safely
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
    } catch (err) {
        console.error("Resources Fetch Error:", err);
    }
}
// Fetch Notifications
async function fetchNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        renderNotifications(data.notifications || []);
    } catch (err) {
        console.error("Notifications Fetch Error:", err);
    }
}

// Fetch Activities
async function fetchActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/activities`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        renderActivity(data.activities || []);
    } catch (err) {
        console.error("Activities Fetch Error:", err);
    }
}

// Update the Mark All Read function to hit the backend
async function markAllRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/read`, {
            method: 'PUT',
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
            fetchNotifications(); // Refresh the list
            const badge = document.querySelector('.header-btn .badge');
            if (badge) badge.textContent = '0';
        }
    } catch (err) {
        console.error("Mark Read Error:", err);
    }
}
// ══════════════════════════════════
//   DOM RENDERING & COUNTERS
// ══════════════════════════════════
function renderActivity(data) {
    const list = document.getElementById('activity-list') || document.getElementById('student-activity-list');
    if (!list) return;

    list.innerHTML = data.map(a => {
        let dotColor = "cyan"; // default
        if (a.type === 'complaint') dotColor = "red";
        if (a.type === 'resolve') dotColor = "green";
        if (a.type === 'booking') dotColor = "yellow";

        return `
        <div class="activity-item">
          <div class="activity-dot ${dotColor}"></div>
          <div>
            <div class="activity-text">${a.description}</div>
            <div class="activity-time">${a.created_at ? a.created_at.split('T')[0] : 'Just now'}</div>
          </div>
        </div>`;
    }).join('');
}

function renderNotifications(data) {
    const list = document.getElementById('notif-list') || document.getElementById('student-notif-list');
    if (!list) return;

    // Update the notification badge count
    const unreadCount = data.filter(n => !n.is_read).length;
    const badge = document.querySelector('.header-btn .badge');
    if (badge) badge.textContent = unreadCount;

    list.innerHTML = data.map((n, i) => {
        let icon = "🔔";
        let color = "rgba(99,102,241,0.15)";
        
        if (n.type === 'complaint') { icon = "⚠️"; color = "rgba(248,113,113,0.15)"; }
        else if (n.type === 'booking') { icon = "📅"; color = "rgba(251,191,36,0.15)"; }
        else if (n.type === 'system') { icon = "⚙️"; color = "rgba(34,211,238,0.15)"; }

        return `
        <div class="notif-item ${!n.is_read ? 'unread' : ''}" id="notif-${n.id}">
          <div class="notif-icon" style="background:${color}">${icon}</div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${n.created_at ? n.created_at.split('T')[0] : 'Just now'}</div>
            </div>
          ${!n.is_read ? '<div class="notif-unread-badge"></div>' : ''}
        </div>`;
    }).join('');
}
function renderComplaints(complaints) {
    // Metric Counters
    const total = complaints.length;
    const pending = complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
    const resolved = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;

    const totalEl = document.querySelector('[data-count="12"], #totalComplaints');
    const pendingEl = document.querySelector('[data-count="4"], #pendingComplaints');
    const resolvedEl = document.querySelector('[data-count="8"], #resolvedComplaints');

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (resolvedEl) resolvedEl.textContent = resolved;

    // Mini Table on Dashboard
    const dashBody = document.getElementById("dash-complaints-tbody");
    if (dashBody) {
        dashBody.innerHTML = complaints.slice(0, 5).map(c => `
            <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;color:var(--cyan)">CMP-${c.id}</span></td>
                <td>${c.title}</td>
                <td>${c.category || 'General'}</td>
                <td><span class="status-pill status-${(c.status || 'open').toLowerCase()}">${c.status || 'Pending'}</span></td>
            </tr>
        `).join('');
    }

    // Full Complaints Page Table
    const fullBody = document.getElementById("my-complaints-tbody");
    if (fullBody) {
        fullBody.innerHTML = complaints.map(c => `
            <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;color:var(--cyan)">CMP-${c.id}</span></td>
                <td><strong>${c.title}</strong></td>
                <td>${c.category || 'N/A'}</td>
                <td>${c.created_at ? c.created_at.split('T')[0] : 'N/A'}</td>
                <td>${c.priority || 'Medium'}</td>
                <td><span class="status-pill status-${(c.status || 'open').toLowerCase()}">${c.status || 'Pending'}</span></td>
            </tr>
        `).join('');
    }
}

function renderBookings(bookings) {
    const totalBookingsEl = document.querySelector('[data-count="3"], #totalBookings');
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
                <td><span class="status-pill status-${(b.status || '').toLowerCase() === 'approved' ? 'resolved' : 'open'}">${b.status}</span></td>
            </tr>
        `).join('');
    }
}

// ══════════════════════════════════
//   FORM SUBMISSIONS (POST)
// ══════════════════════════════════

// Post Complaint to POST /complaints
async function submitComplaint() {
    const titleEl = document.getElementById("compTitle");
    const categoryEl = document.getElementById("compCategory");
    const descEl = document.getElementById("compDesc");

    const title = titleEl ? titleEl.value.trim() : "";
    const category = categoryEl ? categoryEl.value : "Other";
    const desc = descEl ? descEl.value.trim() : "";

    if (!title) {
        alert("Please enter a complaint title.");
        return;
    }
    if (!desc) {
        alert("Please describe the issue.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/complaints`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: title,
                description: desc,
                category: category, // Passes the category to the backend
                suggested_solution: null
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Submission failed");

        alert("Complaint filed successfully!");
        closeModal("raise-complaint-modal");
        
        // Clear inputs
        if (titleEl) titleEl.value = "";
        if (descEl) descEl.value = "";
        
        fetchMyComplaints();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// Post Booking to POST /bookings
async function submitBooking() {
    const selectEl = document.getElementById("bookResourceSelect");
    const dateEl = document.getElementById("bookDate");
    const slotEl = document.getElementById("bookSlot");

    if (!selectEl || !selectEl.value) {
        alert("Please select a resource.");
        return;
    }
    if (!dateEl || !dateEl.value) {
        alert("Please select a booking date.");
        return;
    }

    const resourceId = parseInt(selectEl.value);
    const date = dateEl.value;
    const slot = slotEl ? slotEl.value : "08:00–10:00";

    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                resource_id: resourceId,
                purpose: "Academic / Lab Use",
                remark: "Submitted from Student Portal",
                booking_date: date,
                time_slot: slot
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Booking failed");

        alert("Booking request submitted successfully!");
        closeModal("book-resource-modal");
        fetchMyBookings();
    } catch (err) {
        alert("Error: " + err.message);
    }
}
// ══════════════════════════════════
//  STUDENT PROFILE ACTIONS
// ══════════════════════════════════
async function saveSettings() {
    const nameInput = document.getElementById("settingInputName").value.trim();

    if (!nameInput) {
        alert("Name cannot be empty.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/student/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                name: nameInput 
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || "Failed to update profile");
        }

        alert("Profile updated successfully!");
        
        // Refresh the profile to update the name in the sidebar and header
        fetchProfile(); 
        
    } catch (err) {
        alert("Error: " + err.message);
    }
}
// ══════════════════════════════════
//   NAVIGATION & MODALS
// ══════════════════════════════════
function showPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
}

function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("email");
    window.location.href = "../login_frontend/login.html";
}

// Modal Backdrop Click
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { 
        if (e.target === m) m.classList.remove('open'); 
    });
});

// ══════════════════════════════════
//   INITIAL LOAD
// ══════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
    fetchProfile();
    fetchMyComplaints();
    fetchMyBookings();
    fetchResources();
    
    // ADD THE TWO NEW FETCH CALLS HERE:
    fetchActivities();
    fetchNotifications();
});

const themeToggleBtn = document.getElementById('theme-toggle');
const toggleTrack = document.getElementById('toggle-track');
const themeLabel = document.getElementById('theme-label');
const themeIcon = document.getElementById('theme-icon');

function setTheme(theme) {
    // Set the theme attribute on the HTML tag
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update the UI toggle switch visually
    if (theme === 'light') {
        toggleTrack.classList.add('on');
        themeLabel.textContent = 'Light';
        themeIcon.textContent = '☀️';
    } else {
        toggleTrack.classList.remove('on');
        themeLabel.textContent = 'Dark';
        themeIcon.textContent = '🌙';
    }
}

// 1. Toggle event listener
themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

// 2. Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
});