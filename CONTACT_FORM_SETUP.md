# Contact Form Setup - Supabase Integration

## Overview
Your contact form now successfully submits data to a Supabase database instead of HubSpot. All leads are stored securely and can be viewed in the CRM dashboard.

## What Was Implemented

### 1. Database Setup
- Created a `leads` table in Supabase with the following fields:
  - `id` - Unique identifier
  - `name` - Contact's full name
  - `email` - Contact's email address
  - `phone` - Contact's phone number (optional)
  - `message` - Their inquiry message
  - `apartment_id` - Apartment they're interested in (optional)
  - `status` - Lead status (new, contacted, qualified, closed)
  - `created_at` - Submission timestamp
  - `updated_at` - Last update timestamp

### 2. Security
- Enabled Row Level Security (RLS) on the leads table
- Anonymous users can submit leads via the form
- Only authenticated CRM users can view and manage leads

### 3. Contact Form
- Updated the form on your main page to submit to Supabase
- Form validates all inputs before submission
- Shows success/error messages to users
- Auto-fills apartment ID when user clicks on an apartment

### 4. CRM Dashboard
- Updated `/crm.html` to display all leads from Supabase
- Real-time search across all lead fields
- Filter leads by status (new, contacted, qualified, closed)
- Update lead status directly from the dashboard
- Statistics showing:
  - New Leads count
  - Active Leads count (contacted + qualified)
  - Closed Deals count

## How to Use

### Submitting Leads (Customer Side)
1. Fill out the contact form on your main page
2. Click "Send Inquiry"
3. Lead is instantly saved to Supabase database
4. Customer receives confirmation message

### Viewing Leads (CRM Dashboard)
1. Go to `/crm.html`
2. All leads are displayed in a table
3. Use the global search to find specific leads
4. Click on status dropdown to update lead status
5. Stats are updated automatically

### Viewing Leads in Supabase
1. You can also view leads directly in Supabase:
   - Go to: https://0ec90b57d6e95fcbda19832f.supabase.co
   - Navigate to Table Editor
   - Select the `leads` table

## Files Modified/Created

### New Files
- `js/supabaseClient.js` - Supabase database client
- `js/crmLeads.js` - CRM leads management logic

### Modified Files
- `index.html` - Added Supabase client script
- `crm.html` - Added Supabase client and CRM leads scripts
- `js/leadsForm.js` - Updated to submit to Supabase instead of HubSpot
- `js/crm.js` - Updated to initialize Supabase and CRM leads manager
- `css/crm.css` - Added toast notifications and lead table styles

### Database
- Created `leads` table with RLS policies in Supabase

## Testing
A test lead has been added to verify everything works:
- Name: John Doe
- Email: john.doe@example.com
- Phone: +389 70 123 456
- Message: I am interested in apartment 1.5
- Apartment ID: 1.5
- Status: new

You can view this in the CRM dashboard or delete it from Supabase.

## Next Steps
1. Fill out the contact form on your website to test
2. Check the CRM dashboard to see the lead appear
3. Try updating the lead status
4. Use the search feature to find specific leads

All your contact form submissions will now be saved to Supabase and accessible through the CRM!
