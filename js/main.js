// Main application initialization and coordination - ENHANCED FOR BETTER PERFORMANCE
class ApartmentVisualizationApp {
    constructor() {
        this.isInitialized = false;
        this.loadingStartTime = Date.now();
        this.initializationSteps = [];
        this.debugMode = true;
        this.retryAttempts = 0;
        this.maxRetries = 3;
    }

    // ENHANCED: Initialize the application with better error handling and progress tracking
    async initialize() {
        if (this.isInitialized) {
            Utils.log('⚠️ App already initialized');
            return;
        }
        
        Utils.log('🚀 Initializing ParkLine Residences App...');
        
        try {
            // Initialize i18n system first
            i18nManager.initialize();
            
            // Initialize mobile filter manager
            if (window.mobileFilterManager) {
                window.mobileFilterManager.initialize();
            }
            
            // Show loading state with progress
            this.showLoadingState();
            
            // Initialize with progress tracking
            await this.initializeWithProgress();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup responsive handlers
            this.setupResponsiveHandlers();
            
            // Hide loading state
            this.hideLoadingState();
            
            // Mark as initialized
            this.isInitialized = true;
            
            const loadTime = Date.now() - this.loadingStartTime;
            Utils.log(`✅ ParkLine Residences App initialized successfully in ${loadTime}ms`);
            
            // Log final statistics
            this.logInitializationStats();
            
            // Apply initial filters after everything is loaded
            setTimeout(() => {
                if (filtersManager && filtersManager.isInitialized) {
                    filtersManager.applyFilters();
                }
            }, 100);
            
        } catch (error) {
            Utils.error('❌ Failed to initialize app:', error);
            await this.handleInitializationError(error);
        }
    }

    // Initialize with progress tracking
    async initializeWithProgress() {
        const steps = [
            { name: 'Loading Google Sheets data', task: () => googleSheetsManager.loadData() },
            { name: 'Loading SVG files', task: () => svgManager.loadSVGs() },
            { name: 'Initializing filters', task: () => this.initializeFilters() },
            { name: 'Setting up UI components', task: () => this.setupUIComponents() }
        ];
        
        this.initializationSteps = [];
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const startTime = Date.now();
            
            try {
                Utils.log(`📋 Step ${i + 1}/${steps.length}: ${step.name}...`);
                
                const result = await step.task();
                const duration = Date.now() - startTime;
                
                this.initializationSteps.push({
                    name: step.name,
                    success: true,
                    duration: duration,
                    result: result
                });
                
                Utils.log(`✅ Step ${i + 1} completed in ${duration}ms`);
                
                // Update progress if UI is available
                this.updateProgress((i + 1) / steps.length * 100);
                
            } catch (error) {
                const duration = Date.now() - startTime;
                
                this.initializationSteps.push({
                    name: step.name,
                    success: false,
                    duration: duration,
                    error: error
                });
                
                Utils.error(`❌ Step ${i + 1} failed after ${duration}ms:`, error);
                
                // Some steps can fail and we can continue
                if (step.name.includes('Google Sheets') || step.name.includes('SVG')) {
                    Utils.warn(`⚠️ Continuing despite ${step.name} failure`);
                    continue;
                } else {
                    throw error;
                }
            }
        }
    }

    // Initialize filters with error handling
    async initializeFilters() {
        return new Promise((resolve) => {
            try {
                filtersManager.initialize();
                resolve(true);
            } catch (error) {
                Utils.error('Filter initialization error:', error);
                resolve(false);
            }
        });
    }

    // Setup UI components
    async setupUIComponents() {
        return new Promise((resolve) => {
            try {
                // Initialize any additional UI components here
                this.setupViewSwitcher();
                this.setupMobileHandlers();
                resolve(true);
            } catch (error) {
                Utils.error('UI setup error:', error);
                resolve(false);
            }
        });
    }

    // Setup view switcher enhancements
    setupViewSwitcher() {
        const viewSwitcher = document.querySelector('.view-switcher');
        if (viewSwitcher) {
            // Add keyboard support for view switching
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab' && e.shiftKey && !apartmentDetailsManager.isVisible) {
                    e.preventDefault();
                    switchView();
                }
            });
            
            // Add touch gesture support for mobile
            this.setupViewSwitcherTouchGestures(viewSwitcher);
        }
    }

    // Setup touch gestures for view switching
    setupViewSwitcherTouchGestures(viewSwitcher) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        const buildingContainer = document.querySelector('.building-container');
        if (buildingContainer) {
            buildingContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            buildingContainer.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipeGesture(touchStartX, touchEndX);
            }, { passive: true });
        }
    }

    // Handle swipe gestures
    handleSwipeGesture(startX, endX) {
        const swipeThreshold = 100; // Minimum swipe distance
        const swipeDistance = Math.abs(endX - startX);
        
        if (swipeDistance > swipeThreshold) {
            // Swipe right = previous view, swipe left = next view
            if (endX > startX && svgManager.currentView === 2) {
                switchView(); // Go to view 1
            } else if (endX < startX && svgManager.currentView === 1) {
                switchView(); // Go to view 2
            }
        }
    }

    // Setup mobile-specific handlers
    setupMobileHandlers() {
        // Prevent zoom on double tap for better UX
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }

    // Handle orientation change
    handleOrientationChange() {
        Utils.log('📱 Orientation changed, adjusting layout...');
        
        // Force layout recalculation
        const buildingContainer = document.querySelector('.building-container');
        if (buildingContainer) {
            buildingContainer.style.height = 'auto';
            setTimeout(() => {
                buildingContainer.style.height = '';
            }, 50);
        }
        
        // Hide apartment details on mobile orientation change
        if (window.innerWidth <= 768 && apartmentDetailsManager.isVisible) {
            apartmentDetailsManager.hideDetails();
        }
    }

    // ENHANCED: Show loading state with progress indicator
    showLoadingState() {
        Utils.log('⏳ Loading ParkLine Residences application...');
        
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('loadingOverlay')) {
            this.createLoadingOverlay();
        }
    }

    // Create loading overlay
    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 1rem; color: #f97316;">🏢</div>
                <h2 style="color: #f97316; margin-bottom: 1rem;" data-i18n="app-title">${i18nManager.t('app-title')}</h2>
                <div style="color: #9ca3af; margin-bottom: 2rem;" data-i18n="loading-data">${i18nManager.t('loading-data')}</div>
                <div id="loadingProgress" style="width: 200px; height: 4px; background: rgba(75, 85, 99, 0.3); border-radius: 2px; overflow: hidden;">
                    <div id="loadingBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #f97316, #ea580c); transition: width 0.3s ease;"></div>
                </div>
                <div id="loadingText" style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;" data-i18n="initializing">${i18nManager.t('initializing')}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    // Update loading progress
    updateProgress(percentage) {
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingBar) {
            loadingBar.style.width = `${percentage}%`;
        }
        
        if (loadingText) {
            const currentStep = this.initializationSteps.length + 1;
            loadingText.textContent = `${i18nManager.t('step')} ${currentStep}/4 (${Math.round(percentage)}%)`;
        }
    }

    // Hide loading state
    hideLoadingState() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
        
        Utils.log('✅ ParkLine Residences loading complete');
    }

    // ENHANCED: Handle initialization errors with retry logic
    async handleInitializationError(error) {
        Utils.error('App initialization failed:', error);
        
        if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            Utils.log(`🔄 Retrying initialization (attempt ${this.retryAttempts}/${this.maxRetries})...`);
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try again
            return this.initialize();
        } else {
            this.showErrorState(error);
        }
    }

    // ENHANCED: Show error state with helpful information
    showErrorState(error) {
        this.hideLoadingState();
        
        Utils.error('ParkLine Residences application error:', error);
        
        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 2rem;
        `;
        
        errorOverlay.innerHTML = `
            <div style="max-width: 500px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2 style="color: #ef4444; margin-bottom: 1rem;" data-i18n="application-error">${i18nManager.t('application-error')}</h2>
                <p style="color: #9ca3af; margin-bottom: 2rem; line-height: 1.6;" data-i18n="error-message">
                    ${i18nManager.t('error-message')}
                </p>
                <button onclick="location.reload()" style="
                    background: linear-gradient(135deg, #f97316, #ea580c);
                    color: white;
                    padding: 1rem 2rem;
                    border: none;
                    border-radius: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    ${i18nManager.t('reload-application')}
                </button>
                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(75, 85, 99, 0.3);">
                    <details style="color: #6b7280; font-size: 0.875rem;" data-i18n="technical-details">
                        <summary style="cursor: pointer; margin-bottom: 0.5rem;">${i18nManager.t('technical-details')}</summary>
                        <pre style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 8px; overflow: auto; text-align: left;">
${i18nManager.t('error')} ${error.message}
${i18nManager.t('retry-attempts')} ${this.retryAttempts}/${this.maxRetries}
${i18nManager.t('load-time')} ${Date.now() - this.loadingStartTime}ms
                        </pre>
                    </details>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
    }

    // ENHANCED: Setup global event listeners with better performance
    setupEventListeners() {
        // Handle window resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Handle escape key for various modal closes
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
        
        // Handle clicks outside modals
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });
        
        // Prevent context menu on apartment shapes
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.apartment-shape')) {
                e.preventDefault();
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Handle before unload
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });
    }

    // Setup responsive handlers
    setupResponsiveHandlers() {
        // Create ResizeObserver for better responsive handling
        if (window.ResizeObserver) {
            const buildingContainer = document.querySelector('.building-container');
            if (buildingContainer) {
                const resizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        this.handleBuildingContainerResize(entry);
                    }
                });
                resizeObserver.observe(buildingContainer);
            }
        }
    }

    // Handle building container resize
    handleBuildingContainerResize(entry) {
        const { width, height } = entry.contentRect;
        
        if (this.debugMode) {
            console.log(`📐 Building container resized: ${Math.round(width)}x${Math.round(height)}`);
        }
        
        // Adjust SVG scaling if needed
        if (svgManager && svgManager.isLoaded) {
            // Future: Could implement dynamic SVG scaling here
        }
    }

    // Handle escape key
    handleEscapeKey() {
        if (apartmentDetailsManager && apartmentDetailsManager.isVisible) {
            apartmentDetailsManager.hideDetails();
        }
    }

    // Handle outside clicks
    handleOutsideClick(e) {
        // Handle outside clicks for apartment details if needed
    }

    // Handle window resize
    handleResize() {
        if (this.debugMode) {
            Utils.log(`📐 Window resized: ${window.innerWidth}x${window.innerHeight}`);
        }
        
        // Handle responsive layout changes
        if (window.innerWidth <= 768) {
            // Mobile layout adjustments
            this.adjustForMobile();
        } else if (window.innerWidth <= 1200) {
            // Tablet layout adjustments
            this.adjustForTablet();
        } else {
            // Desktop layout adjustments
            this.adjustForDesktop();
        }
    }

    // Adjust layout for mobile
    adjustForMobile() {
        // Hide apartment details if visible
        if (apartmentDetailsManager && apartmentDetailsManager.isVisible) {
            apartmentDetailsManager.hideDetails();
        }
    }

    // Adjust layout for tablet
    adjustForTablet() {
        // Tablet-specific adjustments
    }

    // Adjust layout for desktop
    adjustForDesktop() {
        // Desktop-specific adjustments
    }

    // Handle page visibility changes
    handleVisibilityChange() {
        if (document.hidden) {
            if (this.debugMode) {
                Utils.log('📴 ParkLine Residences page hidden');
            }
        } else {
            if (this.debugMode) {
                Utils.log('👁️ ParkLine Residences page visible');
            }
        }
    }

    // Handle before unload
    handleBeforeUnload() {
        if (this.debugMode) {
            Utils.log('👋 ParkLine Residences page unloading');
        }
    }

    // Log initialization statistics
    logInitializationStats() {
        const totalTime = Date.now() - this.loadingStartTime;
        const successfulSteps = this.initializationSteps.filter(step => step.success).length;
        const failedSteps = this.initializationSteps.filter(step => !step.success).length;
        
        console.log('\n📊 INITIALIZATION STATISTICS:');
        console.log(`Total time: ${totalTime}ms`);
        console.log(`Successful steps: ${successfulSteps}/${this.initializationSteps.length}`);
        console.log(`Failed steps: ${failedSteps}`);
        console.log(`Retry attempts: ${this.retryAttempts}`);
        
        if (googleSheetsManager && googleSheetsManager.isLoaded) {
            console.log(`Apartments loaded: ${googleSheetsManager.apartments.length}`);
        }
        
        if (svgManager && svgManager.isLoaded) {
            console.log(`SVG views loaded: ${Object.keys(svgManager.svgData).filter(key => svgManager.svgData[key]).length}/2`);
        }
        
        // Log step details
        this.initializationSteps.forEach((step, index) => {
            const status = step.success ? '✅' : '❌';
            console.log(`${status} Step ${index + 1}: ${step.name} (${step.duration}ms)`);
        });
    }

    // Get application statistics
    getApplicationStats() {
        return {
            isInitialized: this.isInitialized,
            loadTime: Date.now() - this.loadingStartTime,
            initializationSteps: this.initializationSteps,
            retryAttempts: this.retryAttempts,
            components: {
                googleSheets: googleSheetsManager ? googleSheetsManager.isLoaded : false,
                svgManager: svgManager ? svgManager.isLoaded : false,
                filtersManager: filtersManager ? filtersManager.isInitialized : false
            }
        };
    }
}

// Mobile Filter Panel Toggle System
class MobileFilterManager {
    constructor() {
        this.isVisible = false;
        this.showButton = null;
        this.hideButton = null;
        this.filtersPanel = null;
        this.statusLegend = null;
    }

    initialize() {
        this.showButton = document.getElementById('filterToggleButtonShow');
        this.hideButton = document.getElementById('filterToggleButtonHide');
        this.filtersPanel = document.getElementById('filtersPanel');
        this.statusLegend = document.getElementById('statusLegend');
        
        if (this.showButton && this.hideButton && this.filtersPanel && this.statusLegend) {
            // Set initial state for mobile
            if (window.innerWidth <= 768) {
                this.hideFilters();
            }
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    // Desktop: Show filters, hide toggle button
                    this.showFiltersDesktop();
                } else {
                    // Mobile: Use toggle system
                    this.initializeMobileState();
                }
            });
            
            Utils.log('✅ Mobile filter manager initialized');
        }
    }

    toggleFilters() {
        if (this.isVisible) {
            this.hideFilters();
        } else {
            this.showFilters();
        }
    }

    showFilters() {
        if (!this.filtersPanel || !this.showButton || !this.hideButton || !this.statusLegend) return;
        
        // Hide apartment details if visible
        if (apartmentDetailsManager && apartmentDetailsManager.isVisible) {
            apartmentDetailsManager.hideDetails();
        }
        
        // Show filters panel
        this.filtersPanel.classList.add('mobile-visible');
        
        // CRITICAL: Hide status legend when filters are shown
        this.statusLegend.style.display = 'none';
        this.statusLegend.style.visibility = 'hidden';
        this.statusLegend.style.opacity = '0';
        
        // Hide SHOW button, show HIDE button
        this.showButton.style.display = 'none';
        this.hideButton.style.display = 'flex';
        
        // Update HIDE button text
        const hideText = this.hideButton.querySelector('.filter-toggle-text');
        const hideIcon = this.hideButton.querySelector('.filter-toggle-icon');
        
        if (hideText) {
            hideText.textContent = i18nManager.t('hide-filters');
            hideText.setAttribute('data-i18n', 'hide-filters');
        }
        if (hideIcon) {
            hideIcon.textContent = '▼';
        }
        
        this.isVisible = true;
        Utils.log('📱 Mobile filters shown');
    }

    hideFilters() {
        if (!this.filtersPanel || !this.showButton || !this.hideButton || !this.statusLegend) return;
        
        // Hide filters panel
        this.filtersPanel.classList.remove('mobile-visible');
        
        // CRITICAL: Show status legend when filters are hidden
        this.statusLegend.style.display = 'flex';
        this.statusLegend.style.visibility = 'visible';
        this.statusLegend.style.opacity = '1';
        
        // Show SHOW button, hide HIDE button
        this.showButton.style.display = 'flex';
        this.hideButton.style.display = 'none';
        
        // Update SHOW button text
        const showText = this.showButton.querySelector('.filter-toggle-text');
        const showIcon = this.showButton.querySelector('.filter-toggle-icon');
        
        if (showText) {
            showText.textContent = i18nManager.t('show-filters');
            showText.setAttribute('data-i18n', 'show-filters');
        }
        if (showIcon) {
            showIcon.textContent = '▲';
        }
        
        this.isVisible = false;
        Utils.log('📱 Mobile filters hidden');
    }

    showFiltersDesktop() {
        if (!this.filtersPanel || !this.showButton || !this.hideButton || !this.statusLegend) return;
        
        // Desktop: Always show filters, hide both toggle buttons
        this.filtersPanel.classList.remove('mobile-visible');
        this.filtersPanel.style.transform = '';
        this.showButton.style.display = 'none';
        this.hideButton.style.display = 'none';
        
        // CRITICAL: Hide status legend on desktop
        this.statusLegend.style.display = 'none';
        this.statusLegend.style.visibility = 'hidden';
        this.statusLegend.style.opacity = '0';
    }

    initializeMobileState() {
        if (!this.filtersPanel || !this.showButton || !this.hideButton || !this.statusLegend) return;
        
        // Mobile: Show SHOW button, hide HIDE button and filters initially
        this.showButton.style.display = 'flex';
        this.hideButton.style.display = 'none';
        this.hideFilters();
    }

    // Check if filters are visible
    areFiltersVisible() {
        return this.isVisible;
    }
}

// Global functions for HTML onclick handlers
function switchView() {
    if (svgManager && svgManager.isLoaded) {
        svgManager.switchView();
    } else {
        Utils.warn('SVG Manager not ready for view switching');
    }
}

// Global function for mobile filter toggle
function toggleFilterPanel() {
    if (window.mobileFilterManager) {
        window.mobileFilterManager.toggleFilters();
    }
}

// ENHANCED: Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Utils.log('📄 DOM loaded, initializing ParkLine Residences app...');
    
    // Create global app instance
    window.apartmentApp = new ApartmentVisualizationApp();
    
    // Create mobile filter manager
    window.mobileFilterManager = new MobileFilterManager();
    
    // Initialize analytics
    if (window.Analytics) {
        window.Analytics.initialize().then(success => {
            if (success) {
                Utils.log('📊 Analytics initialized successfully');
            } else {
                Utils.warn('⚠️ Analytics initialization failed');
            }
        });
    }
    
    // Initialize the app
    window.apartmentApp.initialize().catch(error => {
        Utils.error('Failed to initialize application:', error);
    });
});

// Add global error handler
window.addEventListener('error', (e) => {
    Utils.error('Global error caught:', e.error);
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    Utils.error('Unhandled promise rejection:', e.reason);
    e.preventDefault(); // Prevent default browser error handling
});