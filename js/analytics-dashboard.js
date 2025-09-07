// Analytics Dashboard for ParkLine Residences
let supabase = null;
let dashboardData = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
    await loadDashboardData();
});

// Initialize Supabase client
async function initializeDashboard() {
    const supabaseUrl = window.CONFIG?.SUPABASE_URL;
    const supabaseAnonKey = window.CONFIG?.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Supabase URL or Anon Key is missing in config.js');
        showError('Configuration error: Supabase credentials missing. Please check your configuration.');
        return false;
    }

    try {
        // Import Supabase client dynamically
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase client initialized for dashboard');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        showError('Failed to initialize analytics connection. Please try refreshing the page.');
        return false;
    }
}

// Load and display dashboard data
async function loadDashboardData() {
    if (!supabase) {
        console.error('❌ Supabase client not initialized');
        return;
    }

    try {
        console.log('📊 Loading analytics data...');
        
        // Show loading states
        showLoadingStates();

        // Fetch all events from Supabase
        const { data: events, error: fetchError } = await supabase
            .from('analytics_events')
            .select('*')
            .order('timestamp', { ascending: false });

        if (fetchError) {
            console.error('❌ Error fetching analytics events:', fetchError);
            showError('Error loading analytics data: ' + fetchError.message);
            return;
        }

        if (!events || events.length === 0) {
            console.log('ℹ️ No analytics data found');
            showNoDataMessage();
            return;
        }

        console.log(`✅ Loaded ${events.length} analytics events`);
        dashboardData = events;

        // Process and display data
        displayOverallStats(events);
        displayTopApartments(events);
        displayEventBreakdown(events);
        displayRecentEvents(events);
        displayFilterStats(events);

    } catch (error) {
        console.error('❌ Unhandled error loading dashboard data:', error);
        showError('An unexpected error occurred while loading the dashboard.');
    }
}

// Display overall statistics
function displayOverallStats(events) {
    const totalEvents = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitor_id)).size;
    const apartmentClicks = events.filter(e => e.event_type === 'apartment_click').length;
    const interestedClicks = events.filter(e => e.event_type === 'interested_button_click').length;

    document.getElementById('totalEvents').textContent = totalEvents.toLocaleString();
    document.getElementById('uniqueVisitors').textContent = uniqueVisitors.toLocaleString();
    document.getElementById('totalApartmentClicks').textContent = apartmentClicks.toLocaleString();
    document.getElementById('totalInterestedClicks').textContent = interestedClicks.toLocaleString();

    console.log('📊 Overall stats updated:', { totalEvents, uniqueVisitors, apartmentClicks, interestedClicks });
}

// Display top clicked apartments
function displayTopApartments(events) {
    const apartmentClickEvents = events.filter(e => 
        e.event_type === 'apartment_click' && 
        e.event_data && 
        e.event_data.apartment_id
    );

    if (apartmentClickEvents.length === 0) {
        document.getElementById('topApartments').innerHTML = '<div class="no-data">No apartment click data available yet.</div>';
        return;
    }

    // Count clicks per apartment
    const apartmentClickCounts = apartmentClickEvents.reduce((acc, event) => {
        const id = event.event_data.apartment_id;
        if (!acc[id]) {
            acc[id] = {
                count: 0,
                apartment_id: id,
                status: event.event_data.status || 'unknown',
                bedrooms: event.event_data.bedrooms || 'N/A',
                floor: event.event_data.floor || 'N/A',
                area: event.event_data.area || 'N/A',
                is_office_space: event.event_data.is_office_space || false
            };
        }
        acc[id].count++;
        return acc;
    }, {});

    // Sort by click count and take top 10
    const sortedApartments = Object.values(apartmentClickCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Apartment ID</th>
                    <th>Clicks</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedApartments.forEach((apt, index) => {
        const typeLabel = apt.is_office_space ? '🏢 Office' : '🏠 Apartment';
        const statusColor = apt.status === 'available' ? '#10b981' : 
                           apt.status === 'reserved' ? '#3b82f6' : '#ef4444';
        
        html += `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td><span class="apartment-id">${apt.apartment_id}</span></td>
                <td><strong>${apt.count}</strong></td>
                <td>${typeLabel}</td>
                <td><span style="color: ${statusColor};">${apt.status.toUpperCase()}</span></td>
                <td>${apt.bedrooms}BR • Floor ${apt.floor} • ${apt.area}m²</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.getElementById('topApartments').innerHTML = html;
}

// Display event type breakdown
function displayEventBreakdown(events) {
    const eventTypeCounts = events.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
    }, {});

    const sortedEventTypes = Object.entries(eventTypeCounts)
        .sort(([, countA], [, countB]) => countB - countA);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Event Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
    `;

    const totalEvents = events.length;
    sortedEventTypes.forEach(([type, count]) => {
        const percentage = ((count / totalEvents) * 100).toFixed(1);
        html += `
            <tr>
                <td><span class="event-type">${type.replace(/_/g, ' ')}</span></td>
                <td><strong>${count}</strong></td>
                <td>${percentage}%</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.getElementById('eventBreakdown').innerHTML = html;
}

// Display recent events
function displayRecentEvents(events) {
    const recentEvents = events.slice(0, 20);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Details</th>
                    <th>Session</th>
                </tr>
            </thead>
            <tbody>
    `;

    recentEvents.forEach(event => {
        const timestamp = new Date(event.timestamp).toLocaleString();
        const eventType = event.event_type.replace(/_/g, ' ');
        
        let details = '-';
        if (event.event_data) {
            if (event.event_data.apartment_id) {
                details = `Apartment: ${event.event_data.apartment_id}`;
                if (event.event_data.view) {
                    details += ` (View ${event.event_data.view})`;
                }
            } else if (event.event_data.old_view && event.event_data.new_view) {
                details = `${event.event_data.old_view} → ${event.event_data.new_view}`;
            } else if (event.event_data.action) {
                details = event.event_data.action;
            }
        }

        const sessionShort = event.session_id.substring(0, 8) + '...';

        html += `
            <tr>
                <td><span class="timestamp">${timestamp}</span></td>
                <td><span class="event-type">${eventType}</span></td>
                <td>${details}</td>
                <td><code>${sessionShort}</code></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.getElementById('recentEvents').innerHTML = html;
}

// Display filter usage statistics
function displayFilterStats(events) {
    const filterEvents = events.filter(e => 
        e.event_type.includes('filter') || 
        e.event_type === 'filters_applied'
    );

    if (filterEvents.length === 0) {
        document.getElementById('filterStats').innerHTML = '<div class="no-data">No filter usage data available yet.</div>';
        return;
    }

    const filterStats = {
        total_filter_changes: filterEvents.length,
        bedroom_toggles: filterEvents.filter(e => e.event_type === 'filter_change' && e.event_data?.filter_type === 'bedroom_toggle').length,
        filters_applied: filterEvents.filter(e => e.event_type === 'filters_applied').length,
        filters_cleared: filterEvents.filter(e => e.event_type === 'filters_clear_restore').length
    };

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Filter Action</th>
                    <th>Count</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Filter Interactions</td>
                    <td><strong>${filterStats.total_filter_changes}</strong></td>
                </tr>
                <tr>
                    <td>Bedroom Filter Toggles</td>
                    <td><strong>${filterStats.bedroom_toggles}</strong></td>
                </tr>
                <tr>
                    <td>Filters Applied</td>
                    <td><strong>${filterStats.filters_applied}</strong></td>
                </tr>
                <tr>
                    <td>Clear/Restore Actions</td>
                    <td><strong>${filterStats.filters_cleared}</strong></td>
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('filterStats').innerHTML = html;
}

// Show loading states
function showLoadingStates() {
    const loadingMessage = '<div class="loading-message">Loading data...</div>';
    document.getElementById('topApartments').innerHTML = loadingMessage;
    document.getElementById('eventBreakdown').innerHTML = loadingMessage;
    document.getElementById('recentEvents').innerHTML = loadingMessage;
    document.getElementById('filterStats').innerHTML = loadingMessage;
    
    // Reset stats
    document.getElementById('totalEvents').textContent = '-';
    document.getElementById('uniqueVisitors').textContent = '-';
    document.getElementById('totalApartmentClicks').textContent = '-';
    document.getElementById('totalInterestedClicks').textContent = '-';
}

// Show error message
function showError(message) {
    const errorHtml = `<div class="error-message">❌ ${message}</div>`;
    document.getElementById('topApartments').innerHTML = errorHtml;
    document.getElementById('eventBreakdown').innerHTML = errorHtml;
    document.getElementById('recentEvents').innerHTML = errorHtml;
    document.getElementById('filterStats').innerHTML = errorHtml;
}

// Show no data message
function showNoDataMessage() {
    const noDataMessage = `
        <div class="no-data">
            <h3>📊 No Analytics Data Yet</h3>
            <p>Start using the main application to generate analytics data.</p>
            <p>Data will appear here as users interact with apartments, filters, and other features.</p>
        </div>
    `;
    
    document.getElementById('topApartments').innerHTML = noDataMessage;
    document.getElementById('eventBreakdown').innerHTML = noDataMessage;
    document.getElementById('recentEvents').innerHTML = noDataMessage;
    document.getElementById('filterStats').innerHTML = noDataMessage;
    
    // Set stats to 0
    document.getElementById('totalEvents').textContent = '0';
    document.getElementById('uniqueVisitors').textContent = '0';
    document.getElementById('totalApartmentClicks').textContent = '0';
    document.getElementById('totalInterestedClicks').textContent = '0';
}

// Global function for refresh button
window.loadDashboardData = loadDashboardData;