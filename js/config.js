// Configuration file for the apartment visualization website
window.CONFIG = {
    // Google Sheets CSV URL - IMPORTANT: Verify this URL is correct and sheet is published
    // To publish: File > Share > Publish to web > Select sheet > CSV format > Publish
    GOOGLE_SHEETS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbcdn1I9Swtzrf7bfK_pueLsF2HPNj5ZTMSZ8vA1KDRnASBlvtIhzUQ8D8zEoQ66Fvd8_lPf38sg2S/pub?gid=1454799765&single=true&output=csv',
    
    // SVG file paths
    SVG_PATHS: {
        view1: './src/data/background.svg',
        view2: './src/data/background2.svg'
    },
    
    // Background image paths
    BACKGROUND_PATHS: {
        view1: 'public/background.png',
        view2: 'public/background2.png'
    },
    
    // Status mappings
    STATUS_MAPPINGS: {
        '1': 'available',
        '2': 'reserved', 
        '3': 'sold',
        'free': 'available',
        'reserved': 'reserved',
        'sold': 'sold'
    },
    
    // Filter configuration
    FILTERS: {
        bedrooms: {
            min: 1,
            max: 5,
            default: [2, 3, 4]
        },
        floors: {
            min: 1,
            max: 24,
            default: [1, 24]
        },
        area: {
            min: 50,
            max: 200,
            default: [50, 200]
        }
    },
    
    // Animation settings
    ANIMATIONS: {
        viewTransition: 800,
        fadeInOut: 400,
        hoverDelay: 200
    },
    
    // Debug mode
    DEBUG: true,
    
    // Supabase Configuration for Analytics
    SUPABASE_URL: 'https://pznmasitmormnbwvuktb.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bm1hc2l0bW9ybW5id3Z1a3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTAyOTIsImV4cCI6MjA3MjQyNjI5Mn0.IgmAQ8mJNxMIf9uWtoGg69alCK8MmP12Roi4xaEcNEw'
};

// Utility functions
window.Utils = {
    log: (message, ...args) => {
        if (CONFIG.DEBUG) {
            console.log(`[PARKLINE-RESIDENCES] ${message}`, ...args);
        }
    },
    
    error: (message, ...args) => {
        console.error(`[PARKLINE-RESIDENCES ERROR] ${message}`, ...args);
    },
    
    warn: (message, ...args) => {
        console.warn(`[PARKLINE-RESIDENCES WARNING] ${message}`, ...args);
    }
};