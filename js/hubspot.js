class HubSpotIntegration {
    constructor() {
        this.portalId = window.CONFIG?.HUBSPOT_PORTAL_ID || '147144255';
        this.formGuid = window.CONFIG?.HUBSPOT_FORM_GUID || null;
        this.debugMode = window.CONFIG?.DEBUG || false;
        this.isInitialized = false;
    }

    initialize() {
        if (this.debugMode) {
            Utils.log('✅ HubSpot Integration initialized');
            Utils.log(`📊 Portal ID: ${this.portalId}`);
            Utils.log(`📋 Form GUID: ${this.formGuid || 'Not configured (using tracking code method)'}`);
        }
        this.isInitialized = true;

        // Wait for HubSpot tracking script to load
        this.waitForHubSpotScript();

        return true;
    }

    waitForHubSpotScript() {
        const maxAttempts = 50; // 5 seconds max wait
        let attempts = 0;

        const checkInterval = setInterval(() => {
            attempts++;

            if (typeof window._hsq !== 'undefined') {
                clearInterval(checkInterval);
                if (this.debugMode) {
                    Utils.log('✅ HubSpot tracking script loaded successfully');
                }
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                Utils.warn('⚠️ HubSpot tracking script did not load within 5 seconds');
            }
        }, 100);
    }

    async submitFormToHubSpot(formData) {
        if (!this.isInitialized) {
            Utils.error('❌ HubSpot Integration not initialized');
            return { success: false, error: 'HubSpot not initialized' };
        }

        if (!this.formGuid) {
            Utils.warn('⚠️ HubSpot Form GUID not configured. Using direct submission method.');
            return await this.submitDirectToHubSpot(formData);
        }

        try {
            const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${this.portalId}/${this.formGuid}`;

            const fields = [
                { name: 'firstname', value: this.extractFirstName(formData.name) },
                { name: 'lastname', value: this.extractLastName(formData.name) },
                { name: 'email', value: formData.email },
                { name: 'phone', value: formData.phone || '' },
                { name: 'message', value: formData.message }
            ];

            if (formData.apartment_id) {
                fields.push({ name: 'apartment_id', value: formData.apartment_id });
            }

            const payload = {
                fields: fields,
                context: {
                    pageUri: window.location.href,
                    pageName: document.title
                }
            };

            if (this.debugMode) {
                Utils.log('📤 Submitting to HubSpot:', payload);
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                if (this.debugMode) {
                    Utils.log('✅ HubSpot submission successful:', result);
                }
                return { success: true, data: result };
            } else {
                const errorText = await response.text();
                Utils.error('❌ HubSpot submission failed:', errorText);
                return { success: false, error: errorText };
            }
        } catch (error) {
            Utils.error('❌ Error submitting to HubSpot:', error);
            return { success: false, error: error.message };
        }
    }

    async submitDirectToHubSpot(formData) {
        try {
            // Wait for HubSpot tracking script if needed
            if (typeof window._hsq === 'undefined') {
                Utils.warn('⚠️ HubSpot tracking code not loaded yet, waiting...');
                await this.waitForTrackingScript();
            }

            if (typeof window._hsq !== 'undefined') {
                // Identify the contact
                window._hsq.push(['identify', {
                    email: formData.email,
                    firstname: this.extractFirstName(formData.name),
                    lastname: this.extractLastName(formData.name),
                    phone: formData.phone || ''
                }]);

                // Track the lead submission event
                window._hsq.push(['trackEvent', {
                    id: 'Lead Submitted',
                    value: {
                        apartment_id: formData.apartment_id || 'Not specified',
                        message: formData.message
                    }
                }]);

                if (this.debugMode) {
                    Utils.log('✅ Lead tracked via HubSpot tracking code');
                    Utils.log('📧 Contact identified:', formData.email);
                    Utils.log('🏢 Apartment ID:', formData.apartment_id || 'Not specified');
                }

                return { success: true, method: 'tracking_code' };
            } else {
                Utils.error('❌ HubSpot tracking code failed to load');
                return {
                    success: false,
                    error: 'HubSpot tracking script not available. Please refresh the page and try again.'
                };
            }
        } catch (error) {
            Utils.error('❌ Error with direct HubSpot submission:', error);
            return { success: false, error: error.message };
        }
    }

    async waitForTrackingScript() {
        return new Promise((resolve) => {
            const maxWait = 5000; // 5 seconds
            const startTime = Date.now();

            const checkInterval = setInterval(() => {
                if (typeof window._hsq !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (Date.now() - startTime > maxWait) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 100);
        });
    }

    extractFirstName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        return parts[0] || '';
    }

    extractLastName(fullName) {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        return parts.slice(1).join(' ') || parts[0];
    }

    getIntegrationInfo() {
        return {
            isInitialized: this.isInitialized,
            portalId: this.portalId,
            hasFormGuid: !!this.formGuid,
            debugMode: this.debugMode
        };
    }
}

window.HubSpotIntegration = new HubSpotIntegration();
