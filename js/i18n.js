// Internationalization (i18n) system for ParkLine Residences
class I18nManager {
    constructor() {
        this.currentLanguage = 'mk'; // Default to Macedonian
        this.translations = {
            mk: {
                // Header and Navigation
                'view-1': 'Поглед 1',
                'view-2': 'Поглед 2',
                
                // Filters
                'filter-floor': 'СПРАТ:',
                'filter-bedrooms': 'СПАЛНИ СОБИ:',
                'filter-area': 'ВКУПНО (М²):',
                'clear-filters': 'Отстрани маски',
                'restore-filters': 'Врати маски',
                
                // Status
                'status-available': 'СЛОБОДЕН',
                'status-reserved': 'РЕЗЕРВИРАН',
                'status-sold': 'ПРОДАДЕН',
                
                // Apartment Details
                'apartment-details': 'Детали за станот',
                'apartment-no': 'Стан бр.',
                'office-space': 'Деловен простор',
                'bedrooms': 'Спални соби',
                'floor': 'Спрат',
                'area': 'Површина',
                'status': 'Статус',
                'room': 'соба',
                'rooms': 'соби',
                'floor-suffix': '. спрат',
                'link': 'Link',
                'na': 'Н/А',
                
                // Loading and Error Messages
                'app-title': 'ParkLine Residences',
                'loading-data': 'Се вчитуваат податоците за становите...',
                'initializing': 'Се иницијализира...',
                'step': 'Чекор',
                'application-error': 'Грешка во апликацијата',
                'error-message': 'Се случи проблем при вчитувањето на визуелизацијата на становите. Ова може да се должи на проблеми со мрежната врска или вчитувањето на податоците.',
                'reload-application': '🔄 Рестартирај апликација',
                'technical-details': 'Технички детали',
                'error': 'Грешка:',
                'retry-attempts': 'Обиди за повторување:',
                'load-time': 'Време на вчитување:',
                
                // Analytics
                'total-apartments': 'Вкупно станови',
                'units': 'единици',
                'available': 'Слободни',
                'reserved': 'Резервирани',
                'sold': 'Продадени',
                'percent-of-total': '% од вкупно',
                'bedroom-distribution': 'Распределба по спални соби',
                'bedrooms-label': 'Спални соби:',
                'data-status': 'Статус на податоците',
                'source': 'Извор:',
                'last-update': 'Последно ажурирање:',
                'apartments-loaded': 'Вчитани станови:',
                'current-view': 'Тековен поглед:',
                
                // Mobile Filter Toggle
                'show-filters': 'ФИЛТРИ',
                'hide-filters': 'СОКРИЈ ФИЛТРИ',
                
                // Contact Button
                'interested-button': 'Се интересирам',
                'email-subject': 'Се интересирам за стан %ID% - ParkLine Residences',
                
                // Contact Form
                'contact-form-title': 'Контактирајте не',
                'contact-form-description': 'Пополнете ја формата подолу за да се распрашате за стан или за општи прашања.',
                'form-name-label': 'Име:',
                'form-email-label': 'Е-пошта:',
                'form-phone-label': 'Телефон (опционално):',
                'form-message-label': 'Порака:',
                'form-apartment-id-label': 'ID на стан (опционално):',
                'form-submit-button': 'Испрати барање'
            },
            en: {
                // Header and Navigation
                'view-1': 'View 1',
                'view-2': 'View 2',
                
                // Filters
                'filter-floor': 'FLOOR:',
                'filter-bedrooms': 'BEDROOMS:',
                'filter-area': 'TOTAL (M²):',
                'clear-filters': 'Clear Filters',
                'restore-filters': 'Restore Filters',
                
                // Status
                'status-available': 'AVAILABLE',
                'status-reserved': 'RESERVED',
                'status-sold': 'SOLD',
                
                // Apartment Details
                'apartment-details': 'Apartment Details',
                'apartment-no': 'Apartment No.',
                'office-space': 'Office Space',
                'bedrooms': 'Bedrooms',
                'floor': 'Floor',
                'area': 'Area',
                'status': 'Status',
                'room': 'room',
                'rooms': 'rooms',
                'floor-suffix': '. floor',
                'link': 'Link',
                'na': 'N/A',
                
                // Loading and Error Messages
                'app-title': 'ParkLine Residences',
                'loading-data': 'Loading apartment data...',
                'initializing': 'Initializing...',
                'step': 'Step',
                'application-error': 'Application Error',
                'error-message': 'We encountered an issue loading the apartment visualization. This might be due to network connectivity or data loading problems.',
                'reload-application': '🔄 Reload Application',
                'technical-details': 'Technical Details',
                'error': 'Error:',
                'retry-attempts': 'Retry attempts:',
                'load-time': 'Load time:',
                
                // Analytics
                'total-apartments': 'Total Apartments',
                'units': 'units',
                'available': 'Available',
                'reserved': 'Reserved',
                'sold': 'Sold',
                'percent-of-total': '% of total',
                'bedroom-distribution': 'Bedroom Distribution',
                'bedrooms-label': 'Bedrooms:',
                'data-status': 'Data Status',
                'source': 'Source:',
                'last-update': 'Last Update:',
                'apartments-loaded': 'Apartments Loaded:',
                'current-view': 'Current View:',
                
                // Mobile Filter Toggle
                'show-filters': 'FILTERS',
                'hide-filters': 'HIDE FILTERS',
                
                // Contact Button
                'interested-button': 'I am interested',
                'email-subject': 'I am interested in Apartment %ID% - ParkLine Residences',
                
                // Contact Form
                'contact-form-title': 'Contact Us',
                'contact-form-description': 'Fill out the form below to inquire about an apartment or for general questions.',
                'form-name-label': 'Name:',
                'form-email-label': 'Email:',
                'form-phone-label': 'Phone (Optional):',
                'form-message-label': 'Message:',
                'form-apartment-id-label': 'Apartment ID (Optional):',
                'form-submit-button': 'Send Inquiry'
            },
            sq: {
                // Header and Navigation
                'view-1': 'Pamje 1',
                'view-2': 'Pamje 2',
                
                // Filters
                'filter-floor': 'KATI:',
                'filter-bedrooms': 'DHOMA GJUMI:',
                'filter-area': 'TOTAL (M²):',
                'clear-filters': 'Fshij Filtrat',
                'restore-filters': 'Rivendos Filtrat',
                
                // Status
                'status-available': 'I LIRË',
                'status-reserved': 'I REZERVUAR',
                'status-sold': 'I SHITUR',
                
                // Apartment Details
                'apartment-details': 'Detajet e Apartamentit',
                'apartment-no': 'Apartamenti Nr.',
                'office-space': 'Zyrë',
                'bedrooms': 'Dhoma Gjumi',
                'floor': 'Kati',
                'area': 'Sipërfaqja',
                'status': 'Statusi',
                'room': 'dhomë',
                'rooms': 'dhoma',
                'floor-suffix': '. kat',
                'link': 'Lidhje',
                'na': 'N/A',
                
                // Loading and Error Messages
                'app-title': 'ParkLine Residences',
                'loading-data': 'Duke ngarkuar të dhënat e apartamentit...',
                'initializing': 'Duke inicializuar...',
                'step': 'Hapi',
                'application-error': 'Gabim në Aplikacion',
                'error-message': 'Kemi hasur një problem gjatë ngarkimit të vizualizimit të apartamentit. Kjo mund të jetë për shkak të lidhjes së rrjetit ose problemeve me ngarkimin e të dhënave.',
                'reload-application': '🔄 Rindizni Aplikacionin',
                'technical-details': 'Detajet Teknike',
                'error': 'Gabim:',
                'retry-attempts': 'Tentativa të ripërsëritjes:',
                'load-time': 'Koha e ngarkimit:',
                
                // Analytics
                'total-apartments': 'Gjithsej Apartamente',
                'units': 'njësi',
                'available': 'Të Lira',
                'reserved': 'Të Rezervuara',
                'sold': 'Të Shitura',
                'percent-of-total': '% e totalit',
                'bedroom-distribution': 'Shpërndarja e Dhomave të Gjumit',
                'bedrooms-label': 'Dhoma Gjumi:',
                'data-status': 'Statusi i të Dhënave',
                'source': 'Burimi:',
                'last-update': 'Përditësimi i Fundit:',
                'apartments-loaded': 'Apartamente të Ngarkuara:',
                'current-view': 'Pamja Aktuale:',
                
                // Mobile Filter Toggle
                'show-filters': 'FILTRAT',
                'hide-filters': 'FSHIH FILTRAT',
                
                // Contact Button
                'interested-button': 'Jam i interesuar',
                'email-subject': 'Jam i interesuar për Apartamentin %ID% - ParkLine Residences',
                
                // Contact Form
                'contact-form-title': 'Na Kontaktoni',
                'contact-form-description': 'Plotësoni formularin më poshtë për të pyetur për një apartament ose për pyetje të përgjithshme.',
                'form-name-label': 'Emri:',
                'form-email-label': 'Email:',
                'form-phone-label': 'Telefoni (Opsional):',
                'form-message-label': 'Mesazhi:',
                'form-apartment-id-label': 'ID e Apartamentit (Opsional):',
                'form-submit-button': 'Dërgo Kërkesën'
            }
        };
        
        // Load saved language from localStorage
        const savedLanguage = localStorage.getItem('parkline-language');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
    }

    // Get translation for a key
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    }

    // Get status display text
    getStatusDisplay(status) {
        const statusKey = `status-${status}`;
        return this.t(statusKey);
    }

    // Get bedroom text (singular/plural)
    getBedroomText(count) {
        return count === 1 ? this.t('room') : this.t('rooms');
    }

    // Get floor text with suffix
    getFloorText(floor) {
        if (this.currentLanguage === 'mk') {
            return `${floor}${this.t('floor-suffix')}`;
        } else if (this.currentLanguage === 'en') {
            const suffix = floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th';
            return `${floor}${suffix} floor`;
        } else { // Albanian
            return `${floor}${this.t('floor-suffix')}`;
        }
    }

    // Get email subject with apartment ID
    getEmailSubject(apartmentId) {
        const template = this.t('email-subject');
        return template.replace('%ID%', apartmentId);
    }

    // Switch language
    switchLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`Language ${language} not supported`);
            return;
        }

        this.currentLanguage = language;
        localStorage.setItem('parkline-language', language);
        
        // Update all translatable elements
        this.updateAllTranslations();
        
        // Update language switcher buttons
        this.updateLanguageSwitcher();
        
        // Trigger custom event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: language }
        }));
        
        console.log(`🌐 Language switched to: ${language}`);
    }

    // Update all elements with data-i18n attributes
    updateAllTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'button') {
                element.value = translation;
            } else if (element.tagName === 'BUTTON') {
                element.textContent = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // NEW: Trigger apartment details refresh if visible
        if (apartmentDetailsManager && apartmentDetailsManager.isVisible && apartmentDetailsManager.currentApartment) {
            apartmentDetailsManager.showDetails(apartmentDetailsManager.currentApartment);
        }
    }

    // Update language switcher button visibility
    updateLanguageSwitcher() {
        const buttons = document.querySelectorAll('.language-btn');
        buttons.forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            if (lang === this.currentLanguage) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'inline-block';
            }
        });
    }

    // Initialize the i18n system
    initialize() {
        console.log('🌐 Initializing i18n system...');
        
        // Create language switcher
        this.createLanguageSwitcher();
        
        // Update all translations
        this.updateAllTranslations();
        
        // Update language switcher visibility
        this.updateLanguageSwitcher();
        
        console.log(`✅ i18n initialized with language: ${this.currentLanguage}`);
    }

    // Create language switcher buttons
    createLanguageSwitcher() {
        const buildingContainer = document.querySelector('.building-container');
        if (!buildingContainer) return;

        // Check if language switcher already exists
        if (document.querySelector('.language-switcher')) return;

        const languageSwitcher = document.createElement('div');
        languageSwitcher.className = 'language-switcher language-switcher-image-top-right';
        
        const languages = [
            { code: 'mk', label: 'MK' },
            { code: 'en', label: 'EN' },
            { code: 'sq', label: 'SHQ' }
        ];

        languages.forEach(lang => {
            const button = document.createElement('button');
            button.className = 'language-btn';
            button.setAttribute('data-lang', lang.code);
            button.textContent = lang.label;
            button.onclick = () => this.switchLanguage(lang.code);
            languageSwitcher.appendChild(button);
        });

        buildingContainer.appendChild(languageSwitcher);
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Create global instance
const i18nManager = new I18nManager();

// Global function for easy access
function t(key) {
    return i18nManager.t(key);
}