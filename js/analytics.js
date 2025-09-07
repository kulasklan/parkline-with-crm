// Analytics module for ParkLine Residences - Supabase Integration
class Analytics {
    constructor() {
        this.supabase = null;
        this.sessionId = this.getOrCreateSessionId();
        this.visitorId = this.getOrCreateVisitorId();
        this.debugMode = window.CONFIG?.DEBUG || false;
        this.isInitialized = false;
    }

    // Initialize Supabase client
    async initialize() {
        if (!window.CONFIG?.SUPABASE_URL || !window.CONFIG?.SUPABASE_ANON_KEY) {
            Utils.error('❌ Supabase URL or Anon Key is missing in config.js. Analytics will not be initialized.');
            return false;
        }

        try {
            // Import Supabase client dynamically
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            
            this.supabase = createClient(
                window.CONFIG.SUPABASE_URL, 
                window.CONFIG.SUPABASE_ANON_KEY
            );
            
            // Make Supabase client globally accessible for forms
            window.supabase = this.supabase;
            
            this.isInitialized = true;
            
            if (this.debugMode) {
                Utils.log('✅ Supabase client initialized for analytics');
                Utils.log(`📊 Session ID: ${this.sessionId}`);
                Utils.log(`👤 Visitor ID: ${this.visitorId}`);
            }
            
            // Track page load event
            await this.trackEvent('page_load', {
                url: window.location.href,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`
            });
            
            return true;
        } catch (error) {
            Utils.error('❌ Failed to initialize Supabase client:', error);
            return false;
        }
    }

    // Generate or retrieve session ID (per browser session)
    getOrCreateSessionId() {
        let id = sessionStorage.getItem('parkline_session_id');
        if (!id) {
            id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('parkline_session_id', id);
        }
        return id;
    }

    // Generate or retrieve visitor ID (persistent across sessions)
    getOrCreateVisitorId() {
        let id = localStorage.getItem('parkline_visitor_id');
        if (!id) {
            id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('parkline_visitor_id', id);
        }
        return id;
    }

    // Track an event to Supabase
    async trackEvent(eventType, eventData = {}) {
        if (!this.isInitialized || !this.supabase) {
            if (this.debugMode) {
                Utils.warn(`⚠️ Analytics event '${eventType}' not tracked: Supabase client not initialized`);
            }
            return false;
        }

        const event = {
            event_type: eventType,
            session_id: this.sessionId,
            visitor_id: this.visitorId,
            event_data: eventData
        };

        if (this.debugMode) {
            Utils.log(`📊 Tracking event: ${eventType}`, event);
        }

        try {
            const { data, error } = await this.supabase
                .from('analytics_events')
                .insert([event]);

            if (error) {
                Utils.error(`❌ Error tracking event '${eventType}':`, error);
                return false;
            } else {
                if (this.debugMode) {
                    Utils.log(`✅ Event '${eventType}' tracked successfully`);
                }
                return true;
            }
        } catch (e) {
            Utils.error(`❌ Exception during event tracking '${eventType}':`, e);
            return false;
        }
    }

    // Convenience methods for common events
    async trackApartmentClick(apartmentId, view, apartment = null) {
        const eventData = {
            apartment_id: apartmentId,
            view: view
        };

        if (apartment) {
            eventData.status = apartment.status;
            eventData.bedrooms = apartment.bedrooms;
            eventData.floor = apartment.floor;
            eventData.area = apartment.area;
            eventData.is_office_space = apartment.isOfficeSpace || false;
        }

        return await this.trackEvent('apartment_click', eventData);
    }

    async trackInterestedButtonClick(apartment) {
        const eventData = {
            apartment_id: apartment.id,
            apartment_status: apartment.status,
            apartment_bedrooms: apartment.bedrooms,
            apartment_floor: apartment.floor,
            apartment_area: apartment.area,
            is_office_space: apartment.isOfficeSpace || false
        };

        return await this.trackEvent('interested_button_click', eventData);
    }

    async trackViewSwitch(oldView, newView) {
        return await this.trackEvent('view_switch', {
            old_view: oldView,
            new_view: newView
        });
    }

    async trackFilterChange(filterType, filterData) {
        return await this.trackEvent('filter_change', {
            filter_type: filterType,
            ...filterData
        });
    }

    async trackFiltersApplied(currentFilters, view) {
        return await this.trackEvent('filters_applied', {
            filters: currentFilters,
            view: view,
            visible_apartments_count: this.getVisibleApartmentsCount()
        });
    }

    async trackFiltersClearRestore(action, currentFilters) {
        return await this.trackEvent('filters_clear_restore', {
            action: action,
            current_filters: currentFilters
        });
    }

    async trackLeadSubmitted(leadData) {
        return await this.trackEvent('lead_submitted', {
            apartment_id: leadData.apartment_id,
            has_phone: !!leadData.phone,
            message_length: leadData.message ? leadData.message.length : 0
        });
    }

    // Helper method to get visible apartments count
    getVisibleApartmentsCount() {
        try {
            if (window.svgManager && window.svgManager.getVisibleApartments) {
                return window.svgManager.getVisibleApartments().length;
            }
        } catch (error) {
            // Ignore errors
        }
        return 0;
    }

    // Get analytics statistics (for debugging)
    getAnalyticsInfo() {
        return {
            isInitialized: this.isInitialized,
            sessionId: this.sessionId,
            visitorId: this.visitorId,
            debugMode: this.debugMode
        };
    }
}

// Create global instance
window.Analytics = new Analytics();