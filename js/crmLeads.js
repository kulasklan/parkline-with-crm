class CRMLeadsManager {
    constructor() {
        this.leads = [];
        this.filteredLeads = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        this.debugMode = true;
    }

    async initialize() {
        if (!window.SupabaseClient || !window.SupabaseClient.isInitialized) {
            console.error('Supabase client not initialized');
            return false;
        }

        await this.loadLeads();
        this.setupEventListeners();
        return true;
    }

    setupEventListeners() {
        const searchInputs = [
            document.getElementById('leadsSearch'),
            document.getElementById('globalSearch')
        ];

        searchInputs.forEach(searchInput => {
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchQuery = e.target.value.toLowerCase();
                    this.filterLeads();
                });
            }
        });

        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.status || 'all';
                this.filterLeads();
            });
        });

        const refreshBtn = document.getElementById('refreshLeadsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadLeads());
        }
    }

    async loadLeads() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            const result = await window.SupabaseClient.getLeads();

            if (result.success) {
                this.leads = result.data;
                this.filterLeads();
                this.updateStats();

                if (this.debugMode) {
                    console.log(`Loaded ${this.leads.length} leads from Supabase`);
                }
            } else {
                console.error('Failed to load leads:', result.error);
                this.showError('Failed to load leads. Please try again.');
            }
        } catch (error) {
            console.error('Error loading leads:', error);
            this.showError('An error occurred while loading leads.');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    filterLeads() {
        this.filteredLeads = this.leads.filter(lead => {
            const matchesStatus = this.currentFilter === 'all' || lead.status === this.currentFilter;

            const matchesSearch = !this.searchQuery ||
                lead.name.toLowerCase().includes(this.searchQuery) ||
                lead.email.toLowerCase().includes(this.searchQuery) ||
                (lead.phone && lead.phone.includes(this.searchQuery)) ||
                (lead.apartment_id && lead.apartment_id.toLowerCase().includes(this.searchQuery)) ||
                lead.message.toLowerCase().includes(this.searchQuery);

            return matchesStatus && matchesSearch;
        });

        this.renderLeads();
    }

    renderLeads() {
        const leadsTableBody = document.getElementById('leadsTableBody');
        if (!leadsTableBody) return;

        if (this.filteredLeads.length === 0) {
            leadsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: #9ca3af;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p>No leads found</p>
                    </td>
                </tr>
            `;
            return;
        }

        leadsTableBody.innerHTML = this.filteredLeads.map(lead => `
            <tr data-lead-id="${lead.id}">
                <td>
                    <div class="lead-name">
                        <strong>${this.escapeHtml(lead.name)}</strong>
                    </div>
                </td>
                <td>
                    <a href="mailto:${this.escapeHtml(lead.email)}" class="lead-email">
                        ${this.escapeHtml(lead.email)}
                    </a>
                </td>
                <td>
                    ${lead.phone ? `<a href="tel:${this.escapeHtml(lead.phone)}">${this.escapeHtml(lead.phone)}</a>` : '-'}
                </td>
                <td>
                    ${lead.apartment_id ? `<span class="apartment-tag">${this.escapeHtml(lead.apartment_id)}</span>` : '-'}
                </td>
                <td>
                    <div class="lead-message">${this.escapeHtml(lead.message)}</div>
                </td>
                <td>
                    <select class="status-select status-${lead.status}"
                            onchange="window.crmLeadsManager.updateLeadStatus('${lead.id}', this.value)"
                            data-lead-id="${lead.id}">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </td>
                <td>
                    <div class="lead-date">${this.formatDate(lead.created_at)}</div>
                </td>
            </tr>
        `).join('');
    }

    async updateLeadStatus(leadId, newStatus) {
        try {
            const result = await window.SupabaseClient.updateLeadStatus(leadId, newStatus);

            if (result.success) {
                const leadIndex = this.leads.findIndex(l => l.id === leadId);
                if (leadIndex !== -1) {
                    this.leads[leadIndex].status = newStatus;
                    this.filterLeads();
                    this.updateStats();
                }

                this.showSuccess('Lead status updated successfully');
            } else {
                console.error('Failed to update lead status:', result.error);
                this.showError('Failed to update lead status');
            }
        } catch (error) {
            console.error('Error updating lead status:', error);
            this.showError('An error occurred while updating lead status');
        }
    }

    updateStats() {
        const newLeads = this.leads.filter(l => l.status === 'new').length;
        const activeLeads = this.leads.filter(l => l.status === 'contacted' || l.status === 'qualified').length;
        const closedDeals = this.leads.filter(l => l.status === 'closed').length;

        const newLeadsEl = document.getElementById('newLeadsCount');
        const activeLeadsEl = document.getElementById('activeLeadsCount');
        const closedDealsEl = document.getElementById('closedDealsCount');
        const newLeadsBadgeEl = document.getElementById('newLeadsBadge');

        if (newLeadsEl) newLeadsEl.textContent = newLeads;
        if (activeLeadsEl) activeLeadsEl.textContent = activeLeads;
        if (closedDealsEl) closedDealsEl.textContent = closedDeals;
        if (newLeadsBadgeEl) newLeadsBadgeEl.textContent = newLeads;
    }

    showLoadingState() {
        const leadsTableBody = document.getElementById('leadsTableBody');
        if (leadsTableBody) {
            leadsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #f97316;"></i>
                        <p style="margin-top: 1rem; color: #9ca3af;">Loading leads...</p>
                    </td>
                </tr>
            `;
        }
    }

    hideLoadingState() {
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.crmLeadsManager = new CRMLeadsManager();
