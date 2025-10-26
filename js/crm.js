class CRMApp {
    constructor() {
        this.currentView = 'info';
    }

    async initialize() {
        console.log('🚀 Initializing ParkLine CRM Redirect...');
        this.showInfoScreen();
    }

    showInfoScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const crmDashboard = document.getElementById('crmDashboard');

        if (loginScreen) {
            loginScreen.style.display = 'none';
        }

        if (crmDashboard) {
            crmDashboard.style.display = 'block';
            crmDashboard.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
                    <div style="max-width: 600px; padding: 3rem; background: rgba(255, 255, 255, 0.05); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
                        <img src="https://stackblitz.com/storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCQU1wYVFFPSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--9bb26cd6dc302105f9107bbc9d0ab7c80d8d60c9/ParkLine-logo.png"
                             alt="ParkLine Logo"
                             style="height: 60px; margin-bottom: 2rem;">
                        <h1 style="color: #f97316; font-size: 2rem; margin-bottom: 1rem;">ParkLine CRM</h1>
                        <p style="color: rgba(255, 255, 255, 0.8); font-size: 1.1rem; margin-bottom: 2rem; line-height: 1.6;">
                            Lead management is now handled through HubSpot CRM.
                            <br>
                            Please access your HubSpot portal to view and manage leads.
                        </p>
                        <a href="https://app.hubspot.com/contacts/147144255"
                           target="_blank"
                           rel="noopener noreferrer"
                           style="display: inline-block; padding: 1rem 2rem; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 1.1rem; transition: all 0.3s ease;"
                           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px rgba(249, 115, 22, 0.4)';"
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            Open HubSpot CRM
                        </a>
                        <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-top: 2rem;">
                            All leads from the contact form are automatically synced to HubSpot
                        </p>
                    </div>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new CRMApp();
    app.initialize();
});
