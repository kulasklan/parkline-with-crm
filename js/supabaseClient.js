import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

class SupabaseClient {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.debugMode = window.CONFIG?.DEBUG || false;
    }

    initialize() {
        try {
            const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || window.ENV?.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.ENV?.VITE_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Supabase credentials not found in environment variables');
            }

            this.client = createClient(supabaseUrl, supabaseAnonKey);
            this.isInitialized = true;

            if (this.debugMode) {
                Utils.log('✅ Supabase client initialized');
                Utils.log(`📊 Supabase URL: ${supabaseUrl}`);
            }

            return true;
        } catch (error) {
            Utils.error('❌ Failed to initialize Supabase client:', error);
            this.isInitialized = false;
            return false;
        }
    }

    async submitLead(leadData) {
        if (!this.isInitialized) {
            Utils.error('❌ Supabase client not initialized');
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            if (this.debugMode) {
                Utils.log('📤 Submitting lead to Supabase:', leadData);
            }

            const { data, error } = await this.client
                .from('leads')
                .insert([{
                    name: leadData.name,
                    email: leadData.email,
                    phone: leadData.phone || null,
                    message: leadData.message,
                    apartment_id: leadData.apartment_id || null,
                    status: leadData.status || 'new'
                }])
                .select()
                .single();

            if (error) {
                Utils.error('❌ Supabase insert error:', error);
                return { success: false, error: error.message };
            }

            if (this.debugMode) {
                Utils.log('✅ Lead submitted successfully to Supabase:', data);
            }

            return { success: true, data: data };
        } catch (error) {
            Utils.error('❌ Error submitting lead to Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeads(filters = {}) {
        if (!this.isInitialized) {
            Utils.error('❌ Supabase client not initialized');
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            let query = this.client
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.apartment_id) {
                query = query.eq('apartment_id', filters.apartment_id);
            }

            const { data, error } = await query;

            if (error) {
                Utils.error('❌ Supabase query error:', error);
                return { success: false, error: error.message };
            }

            if (this.debugMode) {
                Utils.log(`✅ Retrieved ${data.length} leads from Supabase`);
            }

            return { success: true, data: data };
        } catch (error) {
            Utils.error('❌ Error fetching leads from Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadStatus(leadId, newStatus) {
        if (!this.isInitialized) {
            Utils.error('❌ Supabase client not initialized');
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            const { data, error } = await this.client
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId)
                .select()
                .single();

            if (error) {
                Utils.error('❌ Supabase update error:', error);
                return { success: false, error: error.message };
            }

            if (this.debugMode) {
                Utils.log('✅ Lead status updated successfully:', data);
            }

            return { success: true, data: data };
        } catch (error) {
            Utils.error('❌ Error updating lead status:', error);
            return { success: false, error: error.message };
        }
    }

    getClientInfo() {
        return {
            isInitialized: this.isInitialized,
            debugMode: this.debugMode
        };
    }
}

window.SupabaseClient = new SupabaseClient();
