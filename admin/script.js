// Trigger app initialization on page load
window.addEventListener("DOMContentLoaded", () => {
    initApp();
});
const API_BASE_URL = "http://127.0.0.1:8000";
// ══════════════════════════════════
//   DATA
// ══════════════════════════════════
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) {
    window.location.href = "../login_frontend/login.html";
}
if (role !== "admin") {
    alert("Access denied.");
    window.location.href = "../login_frontend/login.html";
}
let allComplaints = [];
let allBookings = [];

// This function pushes our real numbers into the HTML IDs
function updateAdminStats() {
    const totalComplaints = allComplaints.length;
    
    // Count complaints that are pending or open
    const pendingComplaints = allComplaints.filter(c => (c.status || '').toLowerCase() === 'pending' || (c.status || '').toLowerCase() === 'open').length;
    
    // Count resolved complaints
    const resolvedComplaints = allComplaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
    
    // Count active (approved) bookings
    const activeBookings = allBookings.filter(b => (b.status || '').toLowerCase() === 'approved').length;

    // Push to Stat Cards
    document.getElementById('admin-stat-total').textContent = totalComplaints;
    document.getElementById('admin-stat-pending').textContent = pendingComplaints;
    document.getElementById('admin-stat-resolved').textContent = resolvedComplaints;
    document.getElementById('admin-stat-bookings').textContent = activeBookings;

    // Push to Sidebar Badge
    const compBadge = document.getElementById('admin-sidebar-complaint-badge');
    if (compBadge) {
        compBadge.textContent = pendingComplaints;
        compBadge.style.display = pendingComplaints > 0 ? 'inline-block' : 'none';
    }
}




// Fetch all complaints for Admin
async function fetchAllComplaints() {
    try {
        const response = await fetch(`${API_BASE_URL}/complaints`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        
        allComplaints = data.complaints || []; 
        renderComplaintsTable(allComplaints);
        updateAdminStats(); // Trigger the stat update
    } catch (err) {
        console.error("Complaints Fetch Error:", err);
    }
}

async function fetchAllBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        
        allBookings = data.bookings || []; 
        renderApprovals(allBookings);
        updateAdminStats(); // Trigger the stat update
    } catch (err) {
        console.error("Bookings Fetch Error:", err);
    }
}

// Fetch all users for Admin
async function fetchAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        renderUsers(data.users || []);
    } catch (err) {
        console.error("Users Fetch Error:", err);
    }
}

// ══════════════════════════════════
//   STARS
// ══════════════════════════════════
(function createStars() {
    const c = document.getElementById("stars");
    if (!c) return;
    for (let i = 0; i < 120; i++) {
        const s = document.createElement("div");
        s.className = "star";
        s.style.cssText = `width:${Math.random() * 2.5 + 0.5}px;height:${Math.random() * 2.5 + 0.5}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${Math.random() * 3 + 2}s;--del:${Math.random() * 4}s;--op:${Math.random() * 0.7 + 0.2}`;
        c.appendChild(s);
    }
})();


// ══════════════════════════════════
//   THEME
// ══════════════════════════════════
let isDark = true;
function toggleTheme() {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').textContent = isDark ? '🌙' : '☀️';
    document.getElementById('theme-label').textContent = isDark ? 'Dark' : 'Light';
    const track = document.getElementById('toggle-track');
    isDark ? track.classList.remove('on') : track.classList.add('on');
}

// ══════════════════════════════════
//   NAVIGATION
// ══════════════════════════════════
const pageTitles = {
    dashboard: "DASHBOARD",
    complaints: "COMPLAINT MANAGEMENT",
    resources: "RESOURCE MANAGEMENT",
    approvals: "BOOKING APPROVAL",
    statistics: "STATISTICS & ANALYTICS",
    notifications: "NOTIFICATIONS",
    users: "USER MANAGEMENT",
    settings: "SETTINGS"
}
function showPage(page, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    if (el) el.classList.add('active');
    document.getElementById('header-title').textContent = pageTitles[page] || page.toUpperCase();
}

// ══════════════════════════════════
//   MODALS
// ══════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ══════════════════════════════════
//   INIT APP
// ══════════════════════════════════

let chartsInit = false;
function initApp() {
    
    renderProgressBars();
    startLiveFeed();
    
    
    fetchAllComplaints();
    fetchAllBookings();
    fetchAllUsers();
    fetchAllResources();
    
    
    fetchActivities();
    fetchNotifications();
    
    buildCalendar();
    animateCounters();
    if (!chartsInit) { chartsInit = true; setTimeout(initCharts, 100); }
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

    // Calculate unread
    const unreadCount = data.filter(n => !n.is_read).length;
    
    // Grab badges by our new IDs
    const headerBadge = document.getElementById('header-notif-badge');
    const sidebarBadge = document.getElementById('admin-sidebar-notif-badge');

    // Update visibility and text dynamically
    if (headerBadge) {
        headerBadge.textContent = unreadCount;
        headerBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    if (sidebarBadge) {
        sidebarBadge.textContent = unreadCount;
        sidebarBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    // Render the list
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

// ══════════════════════════════════
//   COUNTER ANIMATION
// ══════════════════════════════════
function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        let cur = 0;
        const step = Math.ceil(target / 30);
        const t = setInterval(() => {
            cur = Math.min(cur + step, target);
            el.textContent = cur;
            if (cur >= target) clearInterval(t);
        }, 40);
    });
}
// ══════════════════════════════════
//  ADMIN BOOKING ACTIONS
// ══════════════════════════════════
async function updateBookingStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to update booking");
        
        // Refresh the table to show the new status
        fetchAllBookings(); 
    } catch (err) {
        alert("Error: " + err.message);
    }
}

function approveBooking(id) {
    updateBookingStatus(id, "approved");
}

function rejectBooking(id) {
    updateBookingStatus(id, "rejected");
}

// ══════════════════════════════════
//  ADMIN COMPLAINT ACTIONS
// ══════════════════════════════════
async function updateComplaintStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to update complaint");
        
        // Refresh the table to show the new status
        fetchAllComplaints(); 
    } catch (err) {
        alert("Error: " + err.message);
    }
}




// ══════════════════════════════════
//   PROGRESS BARS
// ══════════════════════════════════
const progressData = [
    { label: 'System Animation', pct: 40, color: 'linear-gradient(90deg,var(--accent),var(--cyan))' },
    { label: 'Step 1 — Database Sync', pct: 65, color: 'linear-gradient(90deg,var(--cyan),var(--green))' },
    { label: 'Step Animation', pct: 55, color: 'linear-gradient(90deg,var(--yellow),var(--pink))' },
    { label: 'Step 2 — Module Update', pct: 80, color: 'linear-gradient(90deg,var(--pink),var(--accent))' },
];
function renderProgressBars() {
    const c = document.getElementById('progress-bars');
    c.innerHTML = progressData.map(p => `
    <div class="progress-container">
      <div class="progress-label"><span>${p.label}</span><span style="color:var(--accent2)">${p.pct}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:0%;background:${p.color}" data-w="${p.pct}"></div></div>
    </div>`).join('');
    setTimeout(() => {
        document.querySelectorAll('.progress-fill[data-w]').forEach(el => {
            el.style.width = el.getAttribute('data-w') + '%';
        });
    }, 300);
}

// ══════════════════════════════════
//   LIVE FEED TYPE ANIMATION
// ══════════════════════════════════
const liveMessages = [
    'CMP-009 assigned to maintenance team → Status: Assigned',
    'New booking request: Computer Lab 1 — Rahul Sharma',
    'CMP-007 escalated — 48h resolution breach',
    'Resource sync complete — 12 assets updated',
    'User USR-005 registration verified',
    'Monthly report generated — June 2026',
    'Lab 3 availability refreshed — 3 slots open',
];
let liveIdx = 0, charIdx = 0;
function startLiveFeed() {
    const el = document.getElementById('live-text');
    if (!el) return;
    function type() {
        const msg = liveMessages[liveIdx % liveMessages.length];
        if (charIdx <= msg.length) {
            el.innerHTML = msg.slice(0, charIdx) + '<span class="type-cursor"></span>';
            charIdx++;
            setTimeout(type, 45);
        } else {
            setTimeout(() => {
                charIdx = 0; liveIdx++;
                type();
            }, 2800);
        }
    }
    type();
}

// ══════════════════════════════════
//   COMPLAINTS TABLE
// ══════════════════════════════════
function statusPill(s) {
    const map = { Open: 'status-open', Assigned: 'status-assigned', Resolved: 'status-resolved', Escalated: 'status-escalated', Closed: 'status-closed' };
    return `<span class="status-pill ${map[s] || ''}">${s}</span>`;
}
function priorityBadge(p) {
    return `<span class="priority-${p.toLowerCase()}">${p === 'High' ? '▲' : p === 'Medium' ? '● ' : '▼'} ${p}</span>`;
}
function renderComplaintsTable(data) {
    const tbody = document.getElementById('complaints-tbody');
    const cc = document.getElementById('complaint-count');
    if (cc) cc.textContent = `Showing 1–${Math.min(data.length, 10)} of ${data.length} complaints`;
    
    tbody.innerHTML = data.slice(0, 10).map(c => `
    <tr>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cyan)">CMP-${c.id}</span></td>
      <td style="font-size:11px">${c.created_at ? c.created_at.split('T')[0] : 'N/A'}</td>
      <td>${c.category || 'General'}</td>
      <td>${c.title}</td>
      <td>User ID: ${c.user_id}</td>
      <td>${priorityBadge(c.priority || 'Medium')}</td>
      <td>${statusPill(c.status || 'Open')}</td>
<td>
        <div style="display:flex;gap:5px">
          <button class="btn btn-secondary btn-sm" onclick="updateComplaintStatus(${c.id}, 'in_progress')">Investigate</button>
          <button class="btn btn-secondary btn-sm" onclick="updateComplaintStatus(${c.id}, 'resolved')">✓ Resolve</button>
          <button class="btn btn-danger btn-sm" onclick="updateComplaintStatus(${c.id}, 'rejected')">✕ Reject</button>
        </div>
      </td>
    </tr>`).join('');
}

// ══════════════════════════════════
//   USERS
// ══════════════════════════════════

function renderUsers(data) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = data.map(u => `
    <tr>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cyan)">USR-${u.id}</span></td>
      <td><strong style="color:var(--text)">${u.name}</strong></td>
      <td style="font-size:12px;color:var(--text3)">${u.email}</td>
      <td><span class="status-pill ${u.role === 'admin' ? 'status-resolved' : 'status-open'}">${u.role}</span></td>
      <td style="font-size:12px">N/A</td>
      <td><span class="status-pill status-resolved">Active</span></td>
      <td><button class="btn btn-secondary btn-sm">Edit</button></td>
      </tr>`).join('');
    }
    
function filterComplaints() {
    const search = document.getElementById('complaint-search').value.toLowerCase();
    const cat = document.getElementById('filter-category').value;
    const status = document.getElementById('filter-status').value;
    const priority = document.getElementById('filter-priority').value;
    const filtered = complaints.filter(c => {
        return (!search || c.id.toLowerCase().includes(search) || c.resource.toLowerCase().includes(search))
            && (!cat || c.type.includes(cat) || c.resource.includes(cat))
            && (!status || c.status === status)
            && (!priority || c.priority === priority);
        });
        renderComplaintsTable(filtered);
        document.getElementById('complaint-type-text').textContent = `Showing ${filtered.length} result(s)`;
    }
function resetFilters() {
    document.getElementById('complaint-search').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-priority').value = '';
    filterComplaints();
}
function escalateComplaint(id) {
    const c = complaints.find(x => x.id === id);
    if (c) { c.status = 'Escalated'; renderComplaintsTable(complaints); renderActivity(); }
}
function closeComplaint(id) {
    const c = complaints.find(x => x.id === id);
    if (c && confirm(`Close complaint ${id}?`)) { c.status = 'Closed'; renderComplaintsTable(complaints); }
}

function changePage(dir) {
    alert(dir > 0 ? 'Next page' : 'Previous page');
}

// ══════════════════════════════════
//   APPROVALS
// ══════════════════════════════════
function renderApprovals(data) {
    const tbody = document.getElementById('approvals-tbody');
    tbody.innerHTML = data.map(b => `
    <tr>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cyan)">BKG-${b.id}</span></td>
      <td>User ID: ${b.user_id}</td>
      <td>Resource ID: ${b.resource_id}</td>
      <td style="font-size:12px">${b.booking_date}</td>
      <td style="font-size:12px">${b.time_slot}</td>
      <td style="font-size:12px">${b.purpose}</td>
      <td>${statusPill(b.status || 'Pending')}</td>
      <td>
        <div style="display:flex;gap:5px">
          ${(b.status || '').toLowerCase() === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="approveBooking('${b.id}')">✓ Approve</button><button class="btn btn-danger btn-sm" onclick="rejectBooking('${b.id}')">✕ Reject</button>` : `<button class="btn btn-secondary btn-sm">View</button>`}
        </div>
      </td>
    </tr>`).join('');
}







// ══════════════════════════════════
//   CALENDAR
// ══════════════════════════════════
let calDate = new Date(2026, 5, 1);
const bookingDays = new Set([3, 7, 12, 15, 18, 22, 27]);
const fullyBooked = new Set([8, 19, 25]);
function buildCalendar() {
    const grid = document.getElementById('cal-grid');
    const ym = document.getElementById('cal-month-year');
    if (!grid) return;
    ym.textContent = calDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = days.map(d => `<div class="cal-day-label">${d}</div>`).join('');
    const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
    const total = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
    const today = new Date(); const isThisMonth = today.getMonth() === calDate.getMonth() && today.getFullYear() === calDate.getFullYear();
    for (let i = 0; i < first; i++) html += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= total; d++) {
        const isToday = isThisMonth && d === today.getDate();
        const hasBook = bookingDays.has(d);
        const isBusy = fullyBooked.has(d);
        html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasBook ? 'has-booking' : ''} ${isBusy ? 'booked' : ''}">${d}</div>`;
    }
    grid.innerHTML = html;
}
function calNav(dir) { calDate.setMonth(calDate.getMonth() + dir); buildCalendar(); }

// ══════════════════════════════════
//   CHARTS (no external lib)
// ══════════════════════════════════
function initCharts() {
    drawTrendChart();
    drawTransmissionChart();
    drawPdfPreview();
    drawStatsBar();
    drawStatsPie();
}

function getColors() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
        grid: isDarkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)',
        text: isDarkMode ? '#64748b' : '#6366f1',
        bg: isDarkMode ? '#131630' : '#ffffff',
    };
}

function drawTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400; const H = 130;
    canvas.width = W; canvas.height = H;
    const data = [20, 35, 28, 45, 38, 52, 40, 48, 35, 60, 55, 48];
    const data2 = [10, 18, 15, 28, 20, 35, 25, 30, 18, 40, 38, 30];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const C = getColors();
    ctx.clearRect(0, 0, W, H);
    const pad = { t: 10, r: 10, b: 24, l: 30 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const max = Math.max(...data, 60);
    // Grid
    for (let i = 0; i <= 4; i++) {
        const y = pad.t + ch - (ch * i / 4);
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = '10px Inter'; ctx.textAlign = 'right';
        ctx.fillText(Math.round(max * i / 4), pad.l - 4, y + 3);
    }
    // Lines
    function drawLine(d, color, gStart, gEnd) {
        const pts = d.map((v, i) => ({ x: pad.l + i * (cw / (d.length - 1)), y: pad.t + ch - (v / max * ch) }));
        // Fill
        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
        grad.addColorStop(0, gStart); grad.addColorStop(1, gEnd);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pad.t + ch);
        pts.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(pts[pts.length - 1].x, pad.t + ch);
        ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
        // Line
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.stroke();
        // Dots
        pts.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
        });
    }
    drawLine(data, '#6366f1', 'rgba(99,102,241,0.3)', 'rgba(99,102,241,0)');
    drawLine(data2, '#22d3ee', 'rgba(34,211,238,0.2)', 'rgba(34,211,238,0)');
    // Labels
    ctx.fillStyle = C.text; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    labels.forEach((l, i) => ctx.fillText(l, pad.l + i * (cw / (labels.length - 1)), H - 4));
}

function drawTransmissionChart() {
    const canvas = document.getElementById('transmissionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 300, H = 180;
    canvas.width = W; canvas.height = H;
    const C = getColors();
    // Draw nodes
    const nodes = [
        { x: 0.15, y: 0.2, label: 'Node A' }, { x: 0.5, y: 0.1, label: 'Node B' },
        { x: 0.85, y: 0.2, label: 'Node C' }, { x: 0.1, y: 0.6, label: 'Node D' },
        { x: 0.5, y: 0.5, label: 'Hub' }, { x: 0.9, y: 0.6, label: 'Node E' },
        { x: 0.3, y: 0.85, label: 'Node F' }, { x: 0.7, y: 0.85, label: 'Node G' },
    ];
    const edges = [[0, 4], [1, 4], [2, 4], [3, 4], [5, 4], [6, 4], [7, 4], [0, 1], [1, 2], [3, 6], [5, 7]];
    const pad = 16;
    const nx = n => pad + n.x * (W - pad * 2), ny = n => pad + n.y * (H - pad * 2);
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(nx(nodes[a]), ny(nodes[a]), nx(nodes[b]), ny(nodes[b]));
        grad.addColorStop(0, 'rgba(99,102,241,0.5)'); grad.addColorStop(1, 'rgba(34,211,238,0.5)');
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5;
        ctx.moveTo(nx(nodes[a]), ny(nodes[a])); ctx.lineTo(nx(nodes[b]), ny(nodes[b])); ctx.stroke();
    });
    nodes.forEach((n, i) => {
        const x = nx(n), y = ny(n);
        ctx.beginPath();
        ctx.arc(x, y, i === 4 ? 10 : 6, 0, Math.PI * 2);
        ctx.fillStyle = i === 4 ? '#6366f1' : 'rgba(34,211,238,0.8)';
        ctx.shadowBlur = i === 4 ? 15 : 8; ctx.shadowColor = i === 4 ? '#6366f1' : '#22d3ee';
        ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = C.text; ctx.font = '8px Inter'; ctx.textAlign = 'center';
        ctx.fillText(n.label, x, y + (i === 4 ? 20 : 16));
    });
}

function drawPdfPreview() {
    const canvas = document.getElementById('pdfPreviewChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 300, H = 100;
    canvas.width = W; canvas.height = H;
    const bars = [{ v: 60, c: '#6366f1' }, { v: 80, c: '#22d3ee' }, { v: 70, c: '#4ade80' }, { v: 90, c: '#fbbf24' }, { v: 55, c: '#f472b6' }];
    const bw = 20, gap = 12, total = bars.length * (bw + gap) - gap;
    const startX = (W - total) / 2;
    const maxH = H - 20;
    bars.forEach((b, i) => {
        const x = startX + i * (bw + gap);
        const bh = b.v / 100 * maxH;
        const y = H - 10 - bh;
        const grad = ctx.createLinearGradient(0, y, 0, H - 10);
        grad.addColorStop(0, b.c); grad.addColorStop(1, b.c + '33');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw, bh, 4) : ctx.rect(x, y, bw, bh); ctx.fill();
    });
}

function drawStatsBar() {
    const canvas = document.getElementById('statsBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400, H = 180;
    canvas.width = W; canvas.height = H;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const open = [12, 18, 10, 22, 15, 20], resolved = [8, 14, 9, 18, 12, 17];
    const C = getColors();
    const pad = { t: 10, r: 10, b: 24, l: 30 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const max = 25, bw = 14, gap = 8;
    const groupW = months.length * (bw * 2 + gap + 10);
    const gw = cw / months.length;
    for (let i = 0; i <= 5; i++) {
        const y = pad.t + ch - (ch * i / 5);
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    }
    months.forEach((m, i) => {
        const cx = pad.l + (i + 0.5) * gw;
        const hO = open[i] / max * ch, hR = resolved[i] / max * ch;
        ctx.fillStyle = 'rgba(99,102,241,0.8)';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cx - bw - 2, pad.t + ch - hO, bw, hO, 3); else ctx.rect(cx - bw - 2, pad.t + ch - hO, bw, hO); ctx.fill();
        ctx.fillStyle = 'rgba(74,222,128,0.8)';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cx + 2, pad.t + ch - hR, bw, hR, 3); else ctx.rect(cx + 2, pad.t + ch - hR, bw, hR); ctx.fill();
        ctx.fillStyle = C.text; ctx.font = '10px Inter'; ctx.textAlign = 'center';
        ctx.fillText(m, cx, H - 6);
    });
}

function drawStatsPie() {
    const canvas = document.getElementById('statsPieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 300, H = 180;
    canvas.width = W; canvas.height = H;
    const slices = [{ v: 35, c: '#6366f1', l: 'Computer' }, { v: 25, c: '#22d3ee', l: 'Lab' }, { v: 20, c: '#fbbf24', l: 'Classroom' }, { v: 20, c: '#f472b6', l: 'Projector' }];
    const cx = W * 0.38, cy = H / 2, r = 65, inner = 35;
    let angle = -Math.PI / 2;
    slices.forEach(s => {
        const a = s.v / 100 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + a); ctx.closePath();
        ctx.fillStyle = s.c; ctx.shadowBlur = 8; ctx.shadowColor = s.c; ctx.fill(); ctx.shadowBlur = 0;
        angle += a;
    });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = getColors().bg; ctx.fill();
    const lx = W * 0.68; let ly = H * 0.2;
    slices.forEach(s => {
        ctx.fillStyle = s.c; ctx.beginPath(); ctx.rect(lx, ly, 10, 10); ctx.fill();
        ctx.fillStyle = getColors().text; ctx.font = '11px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`${s.l} ${s.v}%`, lx + 14, ly + 9);
        ly += 22;
    });
}

function doLogout() {
    localStorage.clear();
    window.location.href = "../login_frontend/login.html";
}

// ══════════════════════════════════
//   GLOBAL SEARCH
// ══════════════════════════════════
document.getElementById('global-search').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    if (!q) return;
    if (q.includes('complaint')) { showPage('complaints', document.querySelector('[onclick*="complaints"]')); }
    else if (q.includes('book')) { showPage('bookings', document.querySelector('[onclick*="bookings"]')); }
    else if (q.includes('user')) { showPage('users', document.querySelector('[onclick*="users"]')); }
    else if (q.includes('stat')) { showPage('statistics', document.querySelector('[onclick*="statistics"]')); }
});

// ══════════════════════════════════
//   RESOURCES & LOGOUT
// ══════════════════════════════════

// Fetch all resources for Admin
async function fetchAllResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/resources`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        renderAdminResources(data.resources || []);
    } catch (err) {
        console.error("Resources Fetch Error:", err);
    }
}

// Render dynamic resource cards
function renderAdminResources(resources) {
    const container = document.getElementById('admin-resources-container');
    if (!container) return;

    container.innerHTML = resources.map(r => `
        <div class="card">
            <div class="card-title" style="margin-bottom:14px">${r.name} — ${r.type}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div>
                    <div style="font-size:12px;color:var(--text3);margin-bottom:6px">RESOURCE DETAILS</div>
                    <div style="font-size:13px;color:var(--text2);line-height:2">
                        <div>ID: <span style="color:var(--cyan)">RES-${r.id}</span></div>
                        <div>Type: <span style="color:var(--text)">${r.type}</span></div>
                        <div>Available Qty: <span style="color:var(--green);font-weight:bold">${r.available_quantity}</span></div>
                    </div>
                </div>
                <div>
                    <div style="font-size:12px;color:var(--text3);margin-bottom:8px">ACTIONS</div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-secondary btn-sm">Edit Resource</button>
                        <button class="btn btn-danger btn-sm">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}
// Helper for strict numeric checking
function isNumericString(str) {
    if (!str || str.length === 0) return false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] < '0' || str[i] > '9') return false;
    }
    return true;
}

// User Creation Logic
async function submitNewUser() {
    const name = document.getElementById("newUserName").value.trim();
    const email = document.getElementById("newUserEmail").value.trim();
    const branch = document.getElementById("newUserBranch").value;
    const year = document.getElementById("newUserYear").value.trim();
    const rollId = document.getElementById("newUserRollId").value.trim();
    const password = document.getElementById("newUserPassword").value.trim();

    if (!name || !email || !year || !rollId || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (year.length !== 2 || !isNumericString(year)) {
        alert("Year must be exactly 2 digits (e.g., 25).");
        return;
    }
    if (rollId.length < 1 || rollId.length > 3 || !isNumericString(rollId)) {
        alert("Roll Number suffix must be between 1 and 3 digits.");
        return;
    }

    const finalRollNumber = `${branch}${year}${rollId}`;

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({
                name: name,
                roll_number: finalRollNumber,
                email: email,
                password: password
            })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.detail || "Failed to create user");

        alert(`User created! Roll Number: ${finalRollNumber}`);
        closeModal("add-user-modal");
        
        // Clear inputs
        ["newUserName", "newUserEmail", "newUserYear", "newUserRollId", "newUserPassword"].forEach(id => document.getElementById(id).value = "");
        
        fetchAllUsers();

    } catch (err) {
        if (Array.isArray(err.message)) alert("Error: " + err.message[0].msg);
        else alert("Error: " + err.message);
    }
}
function doLogout() {
    localStorage.clear();
    window.location.href = "../login_frontend/login.html";
}
// Toggle Password Visibility Helper
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text";
        icon.textContent = "🙈"; // Change to closed eye
    } else {
        input.type = "password";
        icon.textContent = "👁️"; // Change to open eye
    }
}