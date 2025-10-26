class CRMApp {
    constructor() {
        this.currentView = 'leads';
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🚀 Initializing ParkLine CRM...');

        if (window.SupabaseClient) {
            const initialized = window.SupabaseClient.initialize();
            if (!initialized) {
                this.showError('Failed to initialize database connection');
                return;
            }
        }

        const loginScreen = document.getElementById('loginScreen');
        const crmDashboard = document.getElementById('crmDashboard');

        if (loginScreen) {
            loginScreen.style.display = 'none';
        }

        if (crmDashboard) {
            crmDashboard.style.display = 'block';
        }

        if (window.crmLeadsManager) {
            await window.crmLeadsManager.initialize();
        }

        this.isInitialized = true;
        console.log('✅ ParkLine CRM initialized successfully');
    }

    showError(message) {
        console.error('CRM Error:', message);
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new CRMApp();
    app.initialize();
});
