// ── Configuration ──────────────────────────────────────────
const API_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : '';  // Same origin when deployed

// ── State ──────────────────────────────────────────────────
let allLeads  = [];
let activeFilter = 'ALL';

// ── DOM References ─────────────────────────────────────────
const cityInput      = document.getElementById('city-input');
const searchBtn      = document.getElementById('search-btn');
const statsSection   = document.getElementById('stats-section');
const loadingSection = document.getElementById('loading-section');
const errorSection   = document.getElementById('error-section');
const errorMessage   = document.getElementById('error-message');
const tableSection   = document.getElementById('table-section');
const leadsTbody     = document.getElementById('leads-tbody');
const emptyState     = document.getElementById('empty-state');
const exportBtn      = document.getElementById('export-btn');
const statTotal      = document.getElementById('stat-total');
const statHigh       = document.getElementById('stat-high');
const statMedium     = document.getElementById('stat-medium');
const toastEl        = document.getElementById('toast');
const filterBtns     = document.querySelectorAll('.filter-btn');

// ── Helpers ────────────────────────────────────────────────

/** Show a toast notification */
function showToast(message, duration = 2500) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), duration);
}

/** Copy text to clipboard */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('📋 Copied to clipboard');
    } catch {
        showToast('⚠ Copy failed');
    }
}

/** Generate a star rating string */
function starRating(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/** Get priority badge HTML */
function priorityBadge(priority) {
    const map = {
        HIGH:   { bg: 'bg-priority-high/15',   text: 'text-priority-high',   glow: 'badge-high',   label: 'High' },
        MEDIUM: { bg: 'bg-priority-medium/15',  text: 'text-priority-medium', glow: 'badge-medium', label: 'Medium' },
        LOW:    { bg: 'bg-priority-low/15',     text: 'text-priority-low',    glow: 'badge-low',    label: 'Low' },
    };
    const p = map[priority] || map.LOW;
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${p.bg} ${p.text} ${p.glow}">${p.label}</span>`;
}

// ── Rendering ──────────────────────────────────────────────

function updateStats() {
    const total  = allLeads.length;
    const high   = allLeads.filter(l => l.priority === 'HIGH').length;
    const medium = allLeads.filter(l => l.priority === 'MEDIUM').length;

    statTotal.textContent  = total;
    statHigh.textContent   = high;
    statMedium.textContent = medium;

    statsSection.classList.remove('hidden');
}

function renderTable() {
    const filtered = activeFilter === 'ALL'
        ? allLeads
        : allLeads.filter(l => l.priority === activeFilter);

    if (filtered.length === 0) {
        leadsTbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    leadsTbody.innerHTML = filtered.map((lead, i) => `
        <tr class="lead-row border-b border-white/[0.04] animate-fade-in-up" style="animation-delay:${0.03 * i}s">
            <!-- Name -->
            <td class="px-5 py-3.5">
                <p class="font-medium text-white text-sm">${escapeHtml(lead.name)}</p>
                <p class="text-xs text-surface-200/40 mt-0.5">${escapeHtml(lead.city || '')}</p>
            </td>
            <!-- Phone -->
            <td class="px-5 py-3.5">
                ${lead.phone
                    ? `<button onclick="copyToClipboard('${escapeHtml(lead.phone)}')" class="tooltip inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm transition" data-tip="Copy number">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        ${escapeHtml(lead.phone)}
                       </button>`
                    : '<span class="text-surface-200/25 text-sm">—</span>'
                }
            </td>
            <!-- Google Maps Link -->
            <td class="px-5 py-3.5">
                ${lead.mapUrl
                    ? `<a href="${escapeHtml(lead.mapUrl)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 hover:text-brand-300 text-xs font-medium transition-all duration-200 group">
                        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        View on Maps
                        <svg class="w-3 h-3 opacity-50 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                       </a>`
                    : '<span class="text-surface-200/25 text-sm">—</span>'
                }
            </td>
            <!-- Rating -->
            <td class="px-5 py-3.5 text-center">
                <p class="text-sm font-semibold text-white">${lead.rating || '—'}</p>
                <p class="text-[10px] text-amber-400/60 tracking-wide">${lead.rating ? starRating(lead.rating) : ''}</p>
                <p class="text-[10px] text-surface-200/30 mt-0.5">${lead.reviews ? lead.reviews + ' reviews' : ''}</p>
            </td>
            <!-- Priority -->
            <td class="px-5 py-3.5 text-center">${priorityBadge(lead.priority)}</td>
            <!-- Notes -->
            <td class="px-5 py-3.5 text-xs text-surface-200/50 max-w-[200px]">${escapeHtml(lead.notes || '')}</td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Data Fetching ──────────────────────────────────────────

async function fetchLeads(city) {
    // Show loading
    loadingSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
    tableSection.classList.add('hidden');
    statsSection.classList.add('hidden');
    searchBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/leads?city=${encodeURIComponent(city)}`);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        allLeads = data.leads || data || [];

        // Hide loading, show results
        loadingSection.classList.add('hidden');
        tableSection.classList.remove('hidden');

        updateStats();
        renderTable();

        showToast(`✅ Found ${allLeads.length} leads without websites`);

    } catch (err) {
        loadingSection.classList.add('hidden');
        errorSection.classList.remove('hidden');
        errorMessage.textContent = err.message;
    } finally {
        searchBtn.disabled = false;
    }
}

// ── CSV Export ─────────────────────────────────────────────

function exportCsv() {
    if (allLeads.length === 0) return showToast('⚠ No leads to export');

    const headers = ['Name', 'City', 'Phone', 'Google Maps URL', 'Rating', 'Reviews', 'Priority', 'Notes'];
    const rows = allLeads.map(l => [
        l.name, l.city, l.phone, l.mapUrl, l.rating, l.reviews, l.priority, l.notes
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_no_website_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('📄 CSV downloaded');
}

// ── Event Listeners ────────────────────────────────────────

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) {
        cityInput.focus();
        return showToast('⚠ Please enter a city name');
    }
    fetchLeads(city);
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

exportBtn.addEventListener('click', exportCsv);

// Filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active-filter', 'bg-white/10', '!text-white'));
        btn.classList.add('active-filter', 'bg-white/10', '!text-white');
        activeFilter = btn.dataset.filter;
        renderTable();
    });
});
