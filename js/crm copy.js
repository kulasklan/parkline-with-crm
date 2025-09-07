// ParkLine CRM System - Main Application
class CRMApp {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.currentView = 'dashboard';
        this.leads = [];
        this.crmUsers = [];
        this.currentLead = null;
        this.isLoading = false;
    }

    // Initialize the CRM application
    async initialize() {
        console.log('🚀 Initializing ParkLine CRM...');
        
        try {
            // Initialize Supabase client
            await this.initializeSupabase();
            
            // Check if user is already logged in
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                await this.handleAuthenticatedUser(session.user);
            } else {
                this.showLoginScreen();
            }
            
            // Setup auth state listener
            this.setupAuthListener();
            
        } catch (error) {
            console.error('❌ Failed to initialize CRM:', error);
            this.showError('Failed to initialize CRM system');
        }
    }

    // Initialize Supabase client
    async initializeSupabase() {
        if (!window.CONFIG?.SUPABASE_URL || !window.CONFIG?.SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing');
        }

        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        this.supabase = createClient(
            window.CONFIG.SUPABASE_URL,
            window.CONFIG.SUPABASE_ANON_KEY
        );
        
        console.log('✅ Supabase client initialized');
    }

    // Setup authentication state listener
    setupAuthListener() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                await this.handleAuthenticatedUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            }
        });
    }

    // Handle authenticated user
    async handleAuthenticatedUser(user) {
        console.log('👤 User authenticated:', user.email);
        
        // Get CRM user profile
        const { data: crmUser, error } = await this.supabase
            .from('crm_users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (error || !crmUser) {
            console.error('❌ CRM user not found:', error);
            await this.supabase.auth.signOut();
            this.showError('Access denied. Your account is not authorized for CRM access.');
            return;
        }

        if (!crmUser.is_active) {
            console.error('❌ CRM user is inactive');
            await this.supabase.auth.signOut();
            this.showError('Your account has been deactivated. Please contact an administrator.');
            return;
        }

        this.currentUser = crmUser;
        
        // Update last login
        await this.supabase
            .from('crm_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', crmUser.id);

        this.showDashboard();
        await this.loadInitialData();
    }

    // Handle sign out
    handleSignOut() {
        this.currentUser = null;
        this.leads = [];
        this.crmUsers = [];
        this.showLoginScreen();
    }

    // Show login screen
    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('crmDashboard').style.display = 'none';
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Setup login form
        this.setupLoginForm();
    }

    // Show dashboard
    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('crmDashboard').style.display = 'block';
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Update user info in header
        document.getElementById('currentUserName').textContent = this.currentUser.full_name;
    }

    // Setup login form
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const loginMessage = document.getElementById('loginMessage');
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                this.showLoginMessage('Please enter both email and password', 'error');
                return;
            }
            
            try {
                this.showLoading('Signing in...');
                
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    throw error;
                }
                
                this.showLoginMessage('Login successful!', 'success');
                
            } catch (error) {
                console.error('❌ Login error:', error);
                this.hideLoading();
                
                let errorMessage = 'Login failed. Please check your credentials.';
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Invalid email or password. Please try again.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Please confirm your email address before signing in.';
                }
                
                this.showLoginMessage(errorMessage, 'error');
            }
        });
    }

    // Show login message
    showLoginMessage(message, type) {
        const loginMessage = document.getElementById('loginMessage');
        loginMessage.textContent = message;
        loginMessage.className = `login-message ${type}`;
    }

    // Load initial data for dashboard
    async loadInitialData() {
        try {
            this.showLoading('Loading CRM data...');
            
            // Load leads
            await this.loadLeads();
            
            // Load CRM users
            await this.loadCRMUsers();
            
            // Update dashboard
            this.updateDashboard();
            
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.hideLoading();
            this.showError('Failed to load CRM data');
        }
    }

    // Load all leads
    async loadLeads() {
        const { data: leads, error } = await this.supabase
            .from('leads')
            .select(`
                *,
                assigned_user:assigned_to(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        this.leads = leads || [];
        console.log(`✅ Loaded ${this.leads.length} leads`);
    }

    // Load CRM users
    async loadCRMUsers() {
        const { data: users, error } = await this.supabase
            .from('crm_users')
            .select('*')
            .eq('is_active', true)
            .order('full_name');

        if (error) {
            throw error;
        }

        this.crmUsers = users || [];
        console.log(`✅ Loaded ${this.crmUsers.length} CRM users`);
        
        // Populate assignee filters
        this.populateAssigneeFilters();
    }

    // Update dashboard statistics
    updateDashboard() {
        const newLeads = this.leads.filter(lead => lead.status === 'new').length;
        const activeLeads = this.leads.filter(lead => 
            !['closed_won', 'closed_lost'].includes(lead.status)
        ).length;
        const closedDeals = this.leads.filter(lead => lead.status === 'closed_won').length;
        const conversionRate = this.leads.length > 0 ? 
            Math.round((closedDeals / this.leads.length) * 100) : 0;

        document.getElementById('newLeadsCount').textContent = newLeads;
        document.getElementById('activeLeadsCount').textContent = activeLeads;
        document.getElementById('closedDealsCount').textContent = closedDeals;
        document.getElementById('conversionRate').textContent = `${conversionRate}%`;
        
        // Update navigation badges
        document.getElementById('newLeadsBadge').textContent = newLeads;
        
        // Update recent leads
        this.updateRecentLeads();
        
        // Update follow-up reminders
        this.updateFollowUpReminders();
    }

    // Update recent leads list
    updateRecentLeads() {
        const recentLeads = this.leads.slice(0, 5);
        const container = document.getElementById('recentLeadsList');
        
        if (recentLeads.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center;">No recent leads</p>';
            return;
        }
        
        container.innerHTML = recentLeads.map(lead => `
            <div class="recent-lead-item" onclick="showLeadDetail('${lead.id}')">
                <div class="lead-info">
                    <strong>${lead.name}</strong>
                    <span class="lead-email">${lead.email}</span>
                    ${lead.apartment_id ? `<span class="apartment-tag">Apt: ${lead.apartment_id}</span>` : ''}
                </div>
                <div class="lead-status">
                    <span class="status-badge ${lead.status}">${lead.status.replace('_', ' ')}</span>
                    <span class="lead-time">${this.formatTimeAgo(lead.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    // Update follow-up reminders
    updateFollowUpReminders() {
        const followUps = this.leads.filter(lead => 
            lead.follow_up_date && new Date(lead.follow_up_date) <= new Date()
        );
        
        const container = document.getElementById('followUpList');
        
        if (followUps.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center;">No pending follow-ups</p>';
            return;
        }
        
        container.innerHTML = followUps.map(lead => `
            <div class="follow-up-item" onclick="showLeadDetail('${lead.id}')">
                <div class="follow-up-info">
                    <strong>${lead.name}</strong>
                    <span class="follow-up-date">Due: ${this.formatDate(lead.follow_up_date)}</span>
                </div>
                <span class="priority-badge ${lead.priority}">${lead.priority}</span>
            </div>
        `).join('');
    }

    // Show specific view
    showView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');
        
        this.currentView = viewName;
        
        // Load view-specific data
        if (viewName === 'leads') {
            this.updateLeadsTable();
        }
    }

    // Update leads table
    updateLeadsTable() {
        const tbody = document.getElementById('leadsTableBody');
        
        if (this.leads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #9ca3af; padding: 2rem;">
                        No leads found
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.leads.map(lead => `
            <tr onclick="showLeadDetail('${lead.id}')" style="cursor: pointer;">
                <td>
                    <div class="lead-name">${lead.name}</div>
                    <div class="lead-email">${lead.email}</div>
                </td>
                <td>
                    ${lead.phone ? `<div>${lead.phone}</div>` : ''}
                    <div class="lead-email">${lead.email}</div>
                </td>
                <td>
                    ${lead.apartment_id ? `<span class="apartment-tag">${lead.apartment_id}</span>` : '-'}
                </td>
                <td>
                    <span class="status-badge ${lead.status}">${lead.status.replace('_', ' ')}</span>
                </td>
                <td>
                    <span class="priority-badge ${lead.priority}">${lead.priority}</span>
                </td>
                <td>
                    ${lead.assigned_user ? lead.assigned_user.full_name : 'Unassigned'}
                </td>
                <td>
                    ${this.formatDate(lead.created_at)}
                </td>
                <td>
                    <button class="action-btn" onclick="event.stopPropagation(); showLeadDetail('${lead.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="event.stopPropagation(); editLead('${lead.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Show lead detail modal
    async showLeadDetail(leadId) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;
        
        this.currentLead = lead;
        
        // Update modal title
        document.getElementById('leadDetailTitle').textContent = `Lead: ${lead.name}`;
        
        // Update contact info
        document.getElementById('leadContactInfo').innerHTML = `
            <div class="contact-info-grid">
                <div class="info-item">
                    <label>Name:</label>
                    <span>${lead.name}</span>
                </div>
                <div class="info-item">
                    <label>Email:</label>
                    <span>${lead.email}</span>
                </div>
                <div class="info-item">
                    <label>Phone:</label>
                    <span>${lead.phone || 'Not provided'}</span>
                </div>
                <div class="info-item">
                    <label>Apartment:</label>
                    <span>${lead.apartment_id || 'Not specified'}</span>
                </div>
                <div class="info-item full-width">
                    <label>Message:</label>
                    <div class="message-content">${lead.message}</div>
                </div>
            </div>
        `;
        
        // Update management controls
        document.getElementById('leadStatus').value = lead.status;
        document.getElementById('leadPriority').value = lead.priority;
        document.getElementById('leadAssignee').value = lead.assigned_to || '';
        
        if (lead.follow_up_date) {
            const date = new Date(lead.follow_up_date);
            document.getElementById('followUpDate').value = date.toISOString().slice(0, 16);
        }
        
        // Load notes and activities
        await this.loadNotesAndActivities(leadId);
        
        // Show modal
        document.getElementById('leadDetailModal').classList.add('show');
    }

    // Load notes and activities for a lead
    async loadNotesAndActivities(leadId) {
        try {
            // Load notes
            const { data: notes, error: notesError } = await this.supabase
                .from('lead_notes')
                .select(`
                    *,
                    user:user_id(full_name)
                `)
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            // Load activities
            const { data: activities, error: activitiesError } = await this.supabase
                .from('lead_activities')
                .select(`
                    *,
                    user:user_id(full_name)
                `)
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (notesError) throw notesError;
            if (activitiesError) throw activitiesError;

            // Combine and sort by date
            const combined = [
                ...(notes || []).map(note => ({ ...note, type: 'note' })),
                ...(activities || []).map(activity => ({ ...activity, type: 'activity' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Display in UI
            const container = document.getElementById('notesAndActivities');
            
            if (combined.length === 0) {
                container.innerHTML = '<p style="color: #9ca3af; text-align: center;">No notes or activities yet</p>';
                return;
            }
            
            container.innerHTML = combined.map(item => {
                if (item.type === 'note') {
                    return `
                        <div class="note-item">
                            <div class="note-header">
                                <span class="note-type">${item.note_type}</span>
                                <span class="note-meta">${item.user?.full_name || 'System'} • ${this.formatDate(item.created_at)}</span>
                            </div>
                            <div class="note-content">${item.note_text}</div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="activity-item">
                            <div class="activity-header">
                                <span class="activity-type">${item.activity_type.replace('_', ' ')}</span>
                                <span class="activity-meta">${item.user?.full_name || 'System'} • ${this.formatDate(item.created_at)}</span>
                            </div>
                            <div class="activity-content">${item.description}</div>
                        </div>
                    `;
                }
            }).join('');
            
        } catch (error) {
            console.error('❌ Error loading notes and activities:', error);
        }
    }

    // Add note to lead
    async addNote() {
        const noteText = document.getElementById('newNoteText').value.trim();
        const noteType = document.getElementById('noteType').value;
        
        if (!noteText || !this.currentLead) return;
        
        try {
            const { error } = await this.supabase
                .from('lead_notes')
                .insert([{
                    lead_id: this.currentLead.id,
                    user_id: this.currentUser.id,
                    note_text: noteText,
                    note_type: noteType
                }]);

            if (error) throw error;
            
            // Clear form
            document.getElementById('newNoteText').value = '';
            document.getElementById('noteType').value = 'general';
            
            // Reload notes and activities
            await this.loadNotesAndActivities(this.currentLead.id);
            
        } catch (error) {
            console.error('❌ Error adding note:', error);
            this.showError('Failed to add note');
        }
    }

    // Update lead field
    async updateLeadField(field, value) {
        if (!this.currentLead) return;
        
        try {
            const updateData = { [field]: value };
            
            const { error } = await this.supabase
                .from('leads')
                .update(updateData)
                .eq('id', this.currentLead.id);

            if (error) throw error;
            
            // Update local data
            this.currentLead[field] = value;
            const leadIndex = this.leads.findIndex(l => l.id === this.currentLead.id);
            if (leadIndex !== -1) {
                this.leads[leadIndex][field] = value;
            }
            
            // Refresh displays
            this.updateDashboard();
            if (this.currentView === 'leads') {
                this.updateLeadsTable();
            }
            
            console.log(`✅ Updated lead ${field}: ${value}`);
            
        } catch (error) {
            console.error(`❌ Error updating lead ${field}:`, error);
            this.showError(`Failed to update ${field}`);
        }
    }

    // Populate assignee filters
    populateAssigneeFilters() {
        const assigneeFilter = document.getElementById('assigneeFilter');
        const createLeadAssignee = document.getElementById('createLeadAssignee');
        const leadAssignee = document.getElementById('leadAssignee');
        
        const userOptions = this.crmUsers.map(user => 
            `<option value="${user.id}">${user.full_name}</option>`
        ).join('');
        
        if (assigneeFilter) {
            assigneeFilter.innerHTML = '<option value="">All Assignees</option>' + userOptions;
        }
        
        if (createLeadAssignee) {
            createLeadAssignee.innerHTML = '<option value="">Auto-assign</option>' + userOptions;
        }
        
        if (leadAssignee) {
            leadAssignee.innerHTML = '<option value="">Unassigned</option>' + userOptions;
        }
    }

    // Filter leads
    filterLeads() {
        const statusFilter = document.getElementById('statusFilter').value;
        const assigneeFilter = document.getElementById('assigneeFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        
        // Apply filters (simplified for now)
        this.updateLeadsTable();
    }

    // Utility functions
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }

    // Show loading overlay
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        if (text) text.textContent = message;
        overlay.style.display = 'flex';
    }

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    // Show error message
    showError(message) {
        alert(message); // Simple for now, could be enhanced with a toast system
    }

    // Logout
    async logout() {
        try {
            await this.supabase.auth.signOut();
        } catch (error) {
            console.error('❌ Logout error:', error);
        }
    }
}

// Global CRM app instance
let crmApp;

// Global functions for HTML onclick handlers
function showView(viewName) {
    crmApp.showView(viewName);
}

function showLeadDetail(leadId) {
    crmApp.showLeadDetail(leadId);
}

function closeLeadDetailModal() {
    document.getElementById('leadDetailModal').classList.remove('show');
}

function updateLeadField(field, value) {
    crmApp.updateLeadField(field, value);
}

function addNote() {
    crmApp.addNote();
}

function filterLeads() {
    crmApp.filterLeads();
}

function refreshDashboard() {
    crmApp.loadInitialData();
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function logout() {
    crmApp.logout();
}

function showNotifications() {
    alert('Notifications feature coming soon!');
}

function showProfile() {
    alert('Profile management coming soon!');
}

function showSettings() {
    crmApp.showView('settings');
}

function exportLeads() {
    alert('Export feature coming soon!');
}

function showCreateLeadModal() {
    alert('Create lead modal coming soon!');
}

function closeCreateLeadModal() {
    document.getElementById('createLeadModal').classList.remove('show');
}

function showCreateUserModal() {
    alert('Create user modal coming soon!');
}

// Initialize CRM when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    crmApp = new CRMApp();
    await crmApp.initialize();
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById('userDropdown').classList.remove('show');
    }
});