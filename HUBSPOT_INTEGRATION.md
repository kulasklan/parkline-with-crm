# HubSpot Integration Guide

## Overview
ParkLine Residences now uses HubSpot for CRM and analytics instead of Supabase.

## What Changed

### Removed
- ❌ Supabase npm package and all dependencies
- ❌ Supabase configuration from .env and config.js
- ❌ All Supabase database migrations
- ❌ Custom analytics tracking system (js/analytics.js)
- ❌ Analytics dashboard implementation (js/analytics-dashboard.js)
- ❌ Supabase-based CRM authentication and lead management
- ❌ All analytics event tracking calls throughout the application

### Added
- ✅ HubSpot tracking script on all pages (index.html, crm.html, analytics.html)
- ✅ HubSpot integration module (js/hubspot.js)
- ✅ HubSpot configuration in js/config.js (Portal ID: 147144255)
- ✅ Lead form submission to HubSpot
- ✅ CRM redirect page to HubSpot portal
- ✅ Analytics redirect to HubSpot analytics

## HubSpot Configuration

### Portal ID
`147144255`

### Tracking Script
```html
<script type="text/javascript" id="hs-script-loader" async defer src="//js-eu1.hs-scripts.com/147144255.js"></script>
```

### Form Submission
The contact form now submits leads to HubSpot using two methods:
1. **HubSpot Forms API** - If you configure a Form GUID in config.js
2. **HubSpot Tracking Code** - Falls back to tracking code identification if no Form GUID

## Setting Up HubSpot Form (Optional)

To enable direct form submission via HubSpot Forms API:

1. Go to your HubSpot portal: https://app.hubspot.com
2. Navigate to Marketing > Lead Capture > Forms
3. Create a new form with the following fields:
   - First Name (firstname)
   - Last Name (lastname)
   - Email (email)
   - Phone (phone)
   - Message (message)
   - Apartment ID (apartment_id) - create as custom property
4. Copy the Form GUID from the form settings
5. Update `js/config.js`:
   ```javascript
   HUBSPOT_FORM_GUID: 'your-form-guid-here'
   ```

## Access Points

### CRM Dashboard
- **URL**: `/crm.html`
- **Redirects to**: https://app.hubspot.com/contacts/147144255
- All leads from the contact form are automatically synced to HubSpot

### Analytics Dashboard
- **URL**: `/analytics.html`
- **Links to**: https://app.hubspot.com/analytics/147144255
- HubSpot automatically tracks all page views and interactions

## How Lead Submission Works

1. User fills out the contact form on index.html
2. Form data is validated on the client side
3. HubSpot Integration module processes the submission:
   - If Form GUID is configured: Submits via HubSpot Forms API
   - Otherwise: Uses HubSpot tracking code to identify and track the lead
4. HubSpot automatically creates a contact record
5. All form data is stored in the contact's properties
6. HubSpot tracking associates all visitor activity with the contact

## Viewing Leads in HubSpot

1. Log in to HubSpot: https://app.hubspot.com
2. Go to Contacts > Contacts
3. View all leads submitted through the form
4. Filter by properties like "Apartment ID" to see which apartments are getting interest

## Benefits of HubSpot Integration

- ✅ No slow CLI installation (was causing the delay you experienced)
- ✅ Professional CRM with built-in features
- ✅ Automatic visitor tracking and identification
- ✅ Email marketing capabilities
- ✅ Sales pipeline management
- ✅ Advanced analytics and reporting
- ✅ Mobile app for managing leads on-the-go
- ✅ Integration with other marketing tools

## Technical Notes

- HubSpot tracking script loads asynchronously (won't block page load)
- Form submissions are sent directly to HubSpot servers (secure)
- No database needed for lead management
- All data stored in HubSpot's cloud infrastructure
- GDPR compliant data handling

## Support

For HubSpot support and documentation:
- https://knowledge.hubspot.com
- https://developers.hubspot.com
