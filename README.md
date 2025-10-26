# ParkLine Residences - Interactive Apartment Visualization

An interactive web application for visualizing and exploring apartments at ParkLine Residences.

## Features

- Interactive apartment visualization with two building views
- Dynamic filtering by floor, bedrooms, and area
- Real-time apartment availability status
- Multi-language support (Macedonian/English)
- Mobile-responsive design
- Contact form with HubSpot CRM integration
- Analytics tracking via HubSpot

## Tech Stack

- Pure HTML/CSS/JavaScript (no build tools required)
- Google Sheets for apartment data management
- HubSpot for CRM and analytics
- SVG-based interactive building visualization

## Setup

1. Clone the repository
2. Run `npm install` (for local server only)
3. Run `npm start` to start local server
4. Open `http://localhost:3000` in your browser

## HubSpot Integration

This application uses **HubSpot for lead management and analytics**. No database setup required.

### Contact Form
- Custom form design submits directly to HubSpot API
- No HubSpot form creation needed
- Portal ID: 147144255

### CRM Dashboard
- Access at `/crm.html` (redirects to HubSpot CRM)
- All form submissions automatically appear in HubSpot

### Analytics
- Access at `/analytics.html` (links to HubSpot Analytics)
- Automatic page view and event tracking

## Configuration

Edit `js/config.js` to configure:
- Google Sheets data source URL
- HubSpot Portal ID
- SVG and background image paths
- Filter ranges and defaults

## File Structure

```
/
├── index.html              # Main application page
├── crm.html               # CRM redirect page
├── analytics.html         # Analytics page
├── css/                   # Stylesheets
├── js/                    # JavaScript modules
│   ├── config.js         # Configuration
│   ├── hubspot.js        # HubSpot integration
│   ├── leadsForm.js      # Contact form management
│   ├── main.js           # Application initialization
│   └── ...               # Other modules
├── public/               # Images and assets
└── src/data/             # SVG data files
```

## Documentation

See `HUBSPOT_INTEGRATION.md` for detailed HubSpot setup instructions.
