// Client Request Form Management
class LeadsFormManager {
    constructor() {
        this.form = null;
        this.formMessage = null;
        this.isSubmitting = false;
        this.debugMode = window.CONFIG?.DEBUG || false;
        this.isMobile = window.innerWidth <= 768;
        this.isVisible = false;
    }

    // Initialize the form
    initialize() {
        this.form = document.getElementById('leadsForm');
        this.formMessage = document.getElementById('formMessage');
        
        if (!this.form) {
            console.warn('⚠️ Leads form not found in DOM');
            return;
        }

        this.setupEventListeners();
        this.setupMobileHandlers();
        
        if (this.debugMode) {
            Utils.log('✅ Leads form manager initialized');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        if (!this.form) return;

        this.form.addEventListener('submit', (event) => {
            this.handleFormSubmission(event);
        });

        // Auto-fill apartment ID if user clicked on an apartment
        document.addEventListener('apartmentSelected', (event) => {
            this.autoFillApartmentId(event.detail.apartmentId);
        });

        // Listen for language changes to update form labels
        document.addEventListener('languageChanged', () => {
            this.updateFormLabels();
        });
    }

    // Setup mobile-specific handlers
    setupMobileHandlers() {
        if (window.innerWidth <= 768) {
            this.setupMobileToggle();
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                this.handleResponsiveChange();
            }
        });
    }

    // Setup mobile toggle functionality
    setupMobileToggle() {
        // Create mobile toggle button if it doesn't exist
        if (!document.getElementById('formToggleBtn')) {
            this.createMobileToggleButton();
        }

        // Add close button to form on mobile
        this.addMobileCloseButton();
    }

    // Create mobile toggle button
    createMobileToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'formToggleBtn';
        toggleBtn.className = 'form-toggle-btn';
        toggleBtn.innerHTML = '✉️';
        toggleBtn.onclick = () => this.showMobileForm();
        
        document.body.appendChild(toggleBtn);
    }

    // Add close button for mobile form
    addMobileCloseButton() {
        const formContainer = document.querySelector('.form-container');
        if (formContainer && !formContainer.querySelector('.form-close-btn')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'form-close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.onclick = () => this.hideMobileForm();
            
            formContainer.appendChild(closeBtn);
        }
    }

    // Show mobile form
    showMobileForm() {
        const formSection = document.querySelector('.contact-form-section');
        const toggleBtn = document.getElementById('formToggleBtn');
        
        if (formSection) {
            formSection.classList.add('mobile-visible');
            this.isVisible = true;
        }
        
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
        }

        // Hide mobile filters if visible
        if (window.mobileFilterManager && window.mobileFilterManager.areFiltersVisible()) {
            window.mobileFilterManager.hideFilters();
        }

        // Hide apartment details if visible
        if (apartmentDetailsManager && apartmentDetailsManager.isVisible) {
            apartmentDetailsManager.hideDetails();
        }
    }

    // Hide mobile form
    hideMobileForm() {
        const formSection = document.querySelector('.contact-form-section');
        const toggleBtn = document.getElementById('formToggleBtn');
        
        if (formSection) {
            formSection.classList.remove('mobile-visible');
            this.isVisible = false;
        }
        
        if (toggleBtn) {
            toggleBtn.style.display = 'flex';
        }
    }

    // Handle responsive changes
    handleResponsiveChange() {
        if (this.isMobile) {
            this.setupMobileToggle();
        } else {
            // Desktop: Remove mobile-specific elements
            const toggleBtn = document.getElementById('formToggleBtn');
            if (toggleBtn) {
                toggleBtn.remove();
            }
            
            const formSection = document.querySelector('.contact-form-section');
            if (formSection) {
                formSection.classList.remove('mobile-visible');
                this.isVisible = false;
            }
        }
    }

    // Handle form submission
    async handleFormSubmission(event) {
        event.preventDefault();

        if (this.isSubmitting) {
            if (this.debugMode) {
                Utils.log('⚠️ Form submission already in progress');
            }
            return;
        }

        this.clearFormMessage();
        this.setSubmittingState(true);

        // Ensure Supabase client is available
        if (!window.supabase) {
            this.showFormMessage('Error: Database connection not available. Please try again later.', 'error');
            this.setSubmittingState(false);
            Utils.error('❌ Supabase client not found on window object');
            return;
        }

        try {
            // Collect and validate form data
            const formData = this.collectFormData();
            
            if (!this.validateFormData(formData)) {
                this.setSubmittingState(false);
                return;
            }

            if (this.debugMode) {
                Utils.log('📝 Submitting lead data:', formData);
            }

            // Insert data into Supabase
            const { data, error } = await window.supabase
                .from('leads')
                .insert([formData]);

            if (error) {
                Utils.error('❌ Error submitting lead:', error);
                this.showFormMessage(`Error submitting inquiry: ${error.message}`, 'error');
            } else {
                this.showFormMessage('Inquiry submitted successfully! We will get back to you soon.', 'success');
                this.form.reset();
                
                // Track successful submission
                if (window.Analytics && window.Analytics.isInitialized) {
                    window.Analytics.trackEvent('lead_submitted', {
                        apartment_id: formData.apartment_id,
                        has_phone: !!formData.phone,
                        message_length: formData.message.length
                    });
                }
                
                if (this.debugMode) {
                    Utils.log('✅ Lead submitted successfully:', data);
                }

                // Auto-hide mobile form after successful submission
                if (this.isMobile && this.isVisible) {
                    setTimeout(() => {
                        this.hideMobileForm();
                    }, 2000);
                }
            }
        } catch (e) {
            Utils.error('❌ Unexpected error during form submission:', e);
            this.showFormMessage('An unexpected error occurred. Please try again.', 'error');
        } finally {
            this.setSubmittingState(false);
        }
    }

    // Collect form data
    collectFormData() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const message = document.getElementById('message').value.trim();
        const apartment_id = document.getElementById('apartment_id').value.trim();

        return {
            name: name,
            email: email,
            phone: phone || null,
            message: message,
            apartment_id: apartment_id || null,
            status: 'New'
        };
    }

    // Validate form data
    validateFormData(formData) {
        // Check required fields
        if (!formData.name) {
            this.showFormMessage('Please enter your name.', 'error');
            document.getElementById('name').focus();
            return false;
        }

        if (!formData.email) {
            this.showFormMessage('Please enter your email address.', 'error');
            document.getElementById('email').focus();
            return false;
        }

        if (!formData.message) {
            this.showFormMessage('Please enter a message.', 'error');
            document.getElementById('message').focus();
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            this.showFormMessage('Please enter a valid email address.', 'error');
            document.getElementById('email').focus();
            return false;
        }

        // Validate phone format if provided
        if (formData.phone) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
            if (!phoneRegex.test(formData.phone)) {
                this.showFormMessage('Please enter a valid phone number.', 'error');
                document.getElementById('phone').focus();
                return false;
            }
        }

        return true;
    }

    // Set submitting state
    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        const submitBtn = this.form.querySelector('.submit-btn');
        
        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            
            if (isSubmitting) {
                submitBtn.classList.add('loading');
                submitBtn.textContent = 'Sending...';
            } else {
                submitBtn.classList.remove('loading');
                submitBtn.textContent = i18nManager.t('form-submit-button');
            }
        }
    }

    // Show form message
    showFormMessage(message, type) {
        if (this.formMessage) {
            this.formMessage.textContent = message;
            this.formMessage.className = `form-message ${type}`;
            
            // Auto-clear success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    this.clearFormMessage();
                }, 5000);
            }
        }
    }

    // Clear form message
    clearFormMessage() {
        if (this.formMessage) {
            this.formMessage.textContent = '';
            this.formMessage.className = 'form-message';
        }
    }

    // Auto-fill apartment ID
    autoFillApartmentId(apartmentId) {
        const apartmentIdField = document.getElementById('apartment_id');
        if (apartmentIdField && apartmentId) {
            apartmentIdField.value = apartmentId;
            
            if (this.debugMode) {
                Utils.log(`📋 Auto-filled apartment ID: ${apartmentId}`);
            }
        }
    }

    // Update form labels when language changes
    updateFormLabels() {
        // Labels are updated automatically by i18n system via data-i18n attributes
        // Just update the submit button text if it's not in loading state
        if (!this.isSubmitting) {
            const submitBtn = this.form?.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.textContent = i18nManager.t('form-submit-button');
            }
        }
    }

    // Public method to show form (can be called from apartment details)
    showForm(apartmentId = null) {
        if (this.isMobile) {
            this.showMobileForm();
        } else {
            // Desktop: scroll to form
            const formSection = document.querySelector('.contact-form-section');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Auto-fill apartment ID if provided
        if (apartmentId) {
            this.autoFillApartmentId(apartmentId);
        }
    }

    // Get form status
    getFormStatus() {
        return {
            isInitialized: !!this.form,
            isSubmitting: this.isSubmitting,
            isMobile: this.isMobile,
            isVisible: this.isVisible
        };
    }
}

// Global functions for HTML onclick handlers
function showContactForm(apartmentId = null) {
    if (window.leadsFormManager) {
        window.leadsFormManager.showForm(apartmentId);
    }
}

function hideContactForm() {
    if (window.leadsFormManager && window.leadsFormManager.isMobile) {
        window.leadsFormManager.hideMobileForm();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.leadsFormManager = new LeadsFormManager();
    
    // Initialize after a short delay to ensure other components are ready
    setTimeout(() => {
        window.leadsFormManager.initialize();
    }, 100);
});