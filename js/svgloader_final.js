// SVG loader and manager module - ENHANCED FOR BETTER VIEW HANDLING
class SVGManager {
    constructor() {
        this.svgData = {
            view1: null,
            view2: null
        };
        this.currentView = 1;
        this.isLoaded = false;
        this.selectedShapeId = null;
        this.debugMode = true;
        this.viewApartmentCounts = { view1: 0, view2: 0 };
    }

    // Load SVG files with enhanced error handling
    async loadSVGs() {
        try {
            Utils.log('📄 Loading SVG files...');
            
            // Load both SVG files with timeout
            const loadPromises = [
                this.loadSVGFile(CONFIG.SVG_PATHS.view1, 'view1'),
                this.loadSVGFile(CONFIG.SVG_PATHS.view2, 'view2')
            ];
            
            const results = await Promise.allSettled(loadPromises);
            
            let successCount = 0;
            results.forEach((result, index) => {
                const viewName = index === 0 ? 'view1' : 'view2';
                if (result.status === 'fulfilled') {
                    this.svgData[viewName] = result.value;
                    successCount++;
                    Utils.log(`✅ Loaded ${viewName} SVG successfully`);
                } else {
                    Utils.error(`❌ Failed to load ${viewName} SVG:`, result.reason);
                }
            });
            
            if (successCount === 0) {
                throw new Error('Failed to load any SVG files');
            }
            
            // Initialize SVG overlays
            this.initializeSVGOverlays();
            this.isLoaded = true;
            
            Utils.log(`✅ SVG loading complete: ${successCount}/2 files loaded`);
            return true;
            
        } catch (error) {
            Utils.error('❌ Error loading SVG files:', error);
            return false;
        }
    }

    // Load individual SVG file with timeout
    async loadSVGFile(path, viewName) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch(path, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // Initialize SVG overlays with enhanced apartment detection
    initializeSVGOverlays() {
        const overlay1 = document.getElementById('svgOverlay1');
        const overlay2 = document.getElementById('svgOverlay2');
        
        if (overlay1 && this.svgData.view1) {
            overlay1.innerHTML = this.svgData.view1;
            // FIXED: Set SVG to match background image scaling and positioning
            const svg1 = overlay1.querySelector('svg');
            if (svg1) {
                svg1.setAttribute('preserveAspectRatio', 'xMidYMin meet');
                svg1.style.width = '100%';
                svg1.style.height = '100%';
                console.log('✅ Applied preserveAspectRatio to View 1 SVG');
            }
            this.viewApartmentCounts.view1 = this.setupApartmentShapes(overlay1, 1);
            this.setupEmptySpaceClick(overlay1);
            Utils.log(`🏠 View 1: ${this.viewApartmentCounts.view1} apartment shapes configured`);
        }
        
        if (overlay2 && this.svgData.view2) {
            overlay2.innerHTML = this.svgData.view2;
            // FIXED: Set SVG to match background image scaling and positioning
            const svg2 = overlay2.querySelector('svg');
            if (svg2) {
                svg2.setAttribute('preserveAspectRatio', 'xMidYMin meet');
                svg2.style.width = '100%';
                svg2.style.height = '100%';
                console.log('✅ Applied preserveAspectRatio to View 2 SVG');
            }
            this.viewApartmentCounts.view2 = this.setupApartmentShapes(overlay2, 2);
            this.setupEmptySpaceClick(overlay2);
            Utils.log(`🏠 View 2: ${this.viewApartmentCounts.view2} apartment shapes configured`);
        }
        
        // Log apartment distribution
        console.log('📊 Apartment distribution:', this.viewApartmentCounts);
    }

    // Setup empty space click detection
    setupEmptySpaceClick(overlay) {
        const svg = overlay.querySelector('svg');
        if (svg) {
            svg.addEventListener('click', (e) => {
                // Check if click target is the SVG itself (empty space)
                if (e.target === svg || e.target.tagName.toLowerCase() === 'svg') {
                    if (this.debugMode) {
                        Utils.log('🖱️ Clicked on empty space, clearing selection');
                    }
                    this.clearSelectedState();
                    apartmentDetailsManager.hideDetails();
                }
            });
        }
    }

    // ENHANCED: Setup apartment shapes with better detection and event handling
// REPLACE the setupApartmentShapes function in svgloader_final.js with this FIXED version:

setupApartmentShapes(overlay, viewNumber) {
    const shapes = overlay.querySelectorAll('[data-name]');
    let apartmentCount = 0;
    
    if (this.debugMode) {
        Utils.log(`🔧 Setting up ${shapes.length} shapes for view ${viewNumber}`);
    }
    
    shapes.forEach(shape => {
        const apartmentId = shape.getAttribute('data-name');
        
        // Enhanced filtering for valid apartment shapes
        if (!this.isValidApartmentShape(apartmentId)) {
            if (this.debugMode && apartmentId) {
                console.log(`⏭️ Skipping non-apartment shape: ${apartmentId}`);
            }
            return;
        }
        
        apartmentCount++;
        
        // CRITICAL: Remove any existing status classes first
        shape.classList.remove('available', 'reserved', 'sold');
        
        // Add apartment-shape class
        shape.classList.add('apartment-shape');
        
        // OFFICE SPACE DETECTION: Check if apartment ID starts with "ДП"
        const isOfficeSpace = apartmentId.startsWith('ДП');
        if (isOfficeSpace) {
            shape.classList.add('office-space');
            console.log(`🏢 Office space detected: ${apartmentId}`);
        }
        
        // CRITICAL: Prevent any transform/position changes
        shape.style.transformOrigin = 'center';
        shape.style.transform = 'none';
        
        // FIXED: Enhanced apartment data handling with status application
        const apartment = googleSheetsManager.getApartmentById(apartmentId);
        if (apartment) {
            // CRITICAL FIX: Force status class application
            const status = apartment.status || 'available';
            shape.classList.add(status);
            
            // Add data attributes for easier debugging
            shape.setAttribute('data-bedrooms', apartment.bedrooms || '');
            shape.setAttribute('data-floor', apartment.floor || '');
            shape.setAttribute('data-area', apartment.area || '');
            shape.setAttribute('data-status', status);
            
            // FORCE style application for immediate visual feedback - RESTORED for office spaces
            setTimeout(() => {
                // Don't remove office-space class
                if (!isOfficeSpace) {
                    shape.classList.remove('available', 'reserved', 'sold');
                }
                shape.classList.add(status);
                console.log(`🎨 Applied status '${status}' to shape ${apartmentId}${isOfficeSpace ? ' (office space)' : ''}`);
            }, 100);
            
            if (this.debugMode) {
                console.log(`✅ Configured ${apartmentId}: ${apartment.bedrooms}BR, Floor ${apartment.floor}, ${apartment.area}m², ${status}`);
            }
        } else {
            // For shapes without data, apply default styling with random status for demo
            const randomStatuses = ['available', 'reserved', 'sold'];
            const randomStatus = randomStatuses[Math.floor(Math.random() * randomStatuses.length)];
            shape.classList.add(randomStatus);
            
            // RESTORED: Apply delayed styling for shapes without data too
            setTimeout(() => {
                if (!isOfficeSpace) {
                    shape.classList.remove('available', 'reserved', 'sold');
                }
                shape.classList.add(randomStatus);
                console.log(`🎨 Applied random status '${randomStatus}' to shape ${apartmentId}${isOfficeSpace ? ' (office space)' : ''}`);
            }, 100);
            
            if (this.debugMode) {
                console.log(`⚠️ No data for ${apartmentId}, using random status: ${randomStatus}`);
            }
        }
        
        // Enhanced event listeners
        this.addApartmentEventListeners(shape, apartmentId);
    });
    
    return apartmentCount;
}

    // Enhanced validation for apartment shapes
    isValidApartmentShape(apartmentId) {
        if (!apartmentId) return false;
        
        // Skip obvious non-apartment elements
        const skipPatterns = [
            'layer', 'background', 'text', 'label', 'legend',
            'title', 'border', 'frame', 'outline', 'guide'
        ];
        
        const lowerCaseId = apartmentId.toLowerCase();
        return !skipPatterns.some(pattern => lowerCaseId.includes(pattern));
    }

    // Add comprehensive event listeners to apartment shapes
    addApartmentEventListeners(shape, apartmentId) {
        // Click event
        shape.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleApartmentClick(apartmentId);
        });
        
        // Enhanced hover effects
        shape.addEventListener('mouseenter', (e) => {
            if (this.debugMode) {
                const apartment = googleSheetsManager.getApartmentById(apartmentId);
                if (apartment) {
                    console.log(`🖱️ Hover: ${apartmentId} (${apartment.bedrooms}BR, ${apartment.area}m²)`);
                }
            }
            // CSS handles all visual effects
        });
        
        shape.addEventListener('mouseleave', () => {
            // CSS handles all visual effects
        });
        
        // Double-click for quick details
        shape.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleApartmentDoubleClick(apartmentId);
        });
        
        // Context menu prevention
        shape.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    // Handle apartment shape click
    handleApartmentClick(apartmentId) {
        if (this.debugMode) {
            Utils.log(`🖱️ Apartment clicked: ${apartmentId}`);
        }
        
        const apartment = googleSheetsManager.getApartmentById(apartmentId);
        if (apartment) {
            // Track event with Analytics module
            if (window.Analytics && window.Analytics.isInitialized) {
                window.Analytics.trackApartmentClick(apartmentId, this.currentView, apartment);
            }
            
            // Update selected state
            this.updateSelectedApartment(apartmentId);
            
            // Show apartment details
            apartmentDetailsManager.showDetails(apartment);
        } else {
            // Handle shapes without data
            Utils.warn(`No data found for apartment: ${apartmentId}`);
            
            // Track event for unknown apartment clicks
            if (window.Analytics && window.Analytics.isInitialized) {
                window.Analytics.trackEvent('apartment_click_unknown', {
                    apartment_id: apartmentId,
                    view: this.currentView
                });
            }
            
            // Still show basic info
            const basicInfo = {
                id: apartmentId,
                status: 'unknown',
                data: {
                    'Apartment ID': { value: apartmentId, isVisible: true }
                }
            };
            apartmentDetailsManager.showDetails(basicInfo);
        }
    }

    // Handle apartment double-click (for future features)
    handleApartmentDoubleClick(apartmentId) {
        if (this.debugMode) {
            Utils.log(`🖱️ Apartment double-clicked: ${apartmentId}`);
        }
        
        // Future: Could open full-screen details or gallery
        this.handleApartmentClick(apartmentId);
    }

    // ENHANCED: Update selected apartment visual state
    updateSelectedApartment(selectedId) {
        // Remove selected class from all shapes in current view
        const currentOverlay = this.currentView === 1 ? 
            document.getElementById('svgOverlay1') : 
            document.getElementById('svgOverlay2');
        
        if (currentOverlay) {
            const allShapes = currentOverlay.querySelectorAll('.apartment-shape');
            allShapes.forEach(shape => {
                shape.classList.remove('selected');
                // CRITICAL: Prevent any transform changes
                shape.style.transform = 'none';
            });
        }
        
        // Add selected class to clicked shape
        const selectedShape = document.querySelector(`[data-name="${selectedId}"]`);
        if (selectedShape) {
            selectedShape.classList.add('selected');
            // CRITICAL: NO transform changes - CSS handles everything
            selectedShape.style.transform = 'none';
            this.selectedShapeId = selectedId;
            
            if (this.debugMode) {
                Utils.log(`✅ Selected apartment: ${selectedId}`);
            }
        }
    }

    // ENHANCED: Switch between views with better transition
    switchView() {
        const newView = this.currentView === 1 ? 2 : 1;
        
        Utils.log(`🔄 Switching from view ${this.currentView} to view ${newView}`);
        
        // Track event with Analytics module
        if (window.Analytics && window.Analytics.isInitialized) {
            window.Analytics.trackViewSwitch(this.currentView, newView);
        }
        
        // CRITICAL: Clear selected state when switching views
        this.clearSelectedState();
        
        // Update background images with smooth transition
        this.updateBackgroundImages(newView);
        
        // Update SVG overlays
        this.updateSVGOverlays(newView);
        
        // Update view controls
        this.updateViewControls(newView);
        
        // Update current view
        this.currentView = newView;
        
        // Update filters for new view
        if (filtersManager && filtersManager.isInitialized) {
            filtersManager.updateFiltersForView(newView);
        }
        
        // Close apartment details when switching views
        apartmentDetailsManager.hideDetails();
        
        // Log view statistics
        if (this.debugMode) {
            const apartmentCount = this.viewApartmentCounts[`view${newView}`];
            Utils.log(`📊 View ${newView} active: ${apartmentCount} apartments available`);
        }
    }

    // Update background images
    updateBackgroundImages(newView) {
        const background1 = document.getElementById('background1');
        const background2 = document.getElementById('background2');
        
        if (background1 && background2) {
            if (newView === 2) {
                background1.classList.remove('active');
                background2.classList.add('active');
            } else {
                background2.classList.remove('active');
                background1.classList.add('active');
            }
        }
    }

    // Update SVG overlays
    updateSVGOverlays(newView) {
        const overlay1 = document.getElementById('svgOverlay1');
        const overlay2 = document.getElementById('svgOverlay2');
        
        if (overlay1 && overlay2) {
            if (newView === 2) {
                overlay1.style.display = 'none';
                overlay2.style.display = 'block';
            } else {
                overlay2.style.display = 'none';
                overlay1.style.display = 'block';
            }
        }
    }

    // Update view controls
    updateViewControls(newView) {
        const viewIndicator = document.getElementById('viewIndicator');
        const viewArrow = document.getElementById('viewArrow');
        
        if (viewIndicator) {
            const viewKey = newView === 1 ? 'view-1' : 'view-2';
            viewIndicator.textContent = i18nManager.t(viewKey);
            viewIndicator.setAttribute('data-i18n', viewKey);
        }
        
        if (viewArrow) {
            const arrowIcon = viewArrow.querySelector('.arrow-icon');
            if (arrowIcon) {
                arrowIcon.textContent = newView === 2 ? '←' : '→';
            }
        }
    }

    // Clear selected state from all shapes
    clearSelectedState() {
        // Clear from all views, not just current
        const overlays = [
            document.getElementById('svgOverlay1'),
            document.getElementById('svgOverlay2')
        ];
        
        overlays.forEach(overlay => {
            if (overlay) {
                const allShapes = overlay.querySelectorAll('.apartment-shape');
                allShapes.forEach(shape => {
                    shape.classList.remove('selected');
                    shape.style.transform = 'none';
                });
            }
        });
        
        this.selectedShapeId = null;
        
        if (this.debugMode) {
            Utils.log('🧹 Cleared all selected states');
        }
    }

    // ENHANCED: Apply filters with better performance and debugging
    applyFilters(filteredApartments) {
        const currentOverlay = this.currentView === 1 ? 
            document.getElementById('svgOverlay1') : 
            document.getElementById('svgOverlay2');
        
        if (!currentOverlay) {
            Utils.warn('No current overlay found for filter application');
            return;
        }
        
        const shapes = currentOverlay.querySelectorAll('[data-name]');
        const filteredIds = new Set(filteredApartments.map(apt => apt.id));
        
        let visibleCount = 0;
        let hiddenCount = 0;
        
        shapes.forEach(shape => {
            const apartmentId = shape.getAttribute('data-name');
            
            // Skip non-apartment shapes
            if (!this.isValidApartmentShape(apartmentId)) {
                return;
            }
            
            if (filteredIds.has(apartmentId)) {
                shape.classList.remove('hidden');
                visibleCount++;
            } else {
                shape.classList.add('hidden');
                hiddenCount++;
                
                // Clear selection if hidden apartment was selected
                if (this.selectedShapeId === apartmentId) {
                    this.clearSelectedState();
                    apartmentDetailsManager.hideDetails();
                }
            }
        });
        
        if (this.debugMode) {
            Utils.log(`🔍 Filter applied to view ${this.currentView}: ${visibleCount} visible, ${hiddenCount} hidden`);
        }
        
        // Update filter status in UI
        this.updateFilterStatus(visibleCount, visibleCount + hiddenCount);
    }

    // Update filter status display
    updateFilterStatus(visible, total) {
        // Could add a status indicator to show X/Y apartments visible
        // For now, just log the information
        if (this.debugMode) {
            const percentage = total > 0 ? Math.round((visible / total) * 100) : 0;
            console.log(`📊 View ${this.currentView}: ${visible}/${total} apartments visible (${percentage}%)`);
        }
    }

    // Get visible apartments for current view
    getVisibleApartments() {
        const currentOverlay = this.currentView === 1 ? 
            document.getElementById('svgOverlay1') : 
            document.getElementById('svgOverlay2');
        
        if (!currentOverlay) return [];
        
        const shapes = currentOverlay.querySelectorAll('[data-name]:not(.hidden)');
        const visibleIds = Array.from(shapes)
            .map(shape => shape.getAttribute('data-name'))
            .filter(id => this.isValidApartmentShape(id));
        
        return googleSheetsManager.apartments.filter(apt => visibleIds.includes(apt.id));
    }

    // Get all apartments for current view (visible + hidden)
    getAllApartmentsForCurrentView() {
        const currentOverlay = this.currentView === 1 ? 
            document.getElementById('svgOverlay1') : 
            document.getElementById('svgOverlay2');
        
        if (!currentOverlay) return [];
        
        const shapes = currentOverlay.querySelectorAll('[data-name]');
        const allIds = Array.from(shapes)
            .map(shape => shape.getAttribute('data-name'))
            .filter(id => this.isValidApartmentShape(id));
        
        return googleSheetsManager.apartments.filter(apt => allIds.includes(apt.id));
    }

    // DIAGNOSTIC: Get view statistics
    getViewStatistics() {
        const stats = {
            currentView: this.currentView,
            isLoaded: this.isLoaded,
            selectedShape: this.selectedShapeId,
            apartmentCounts: this.viewApartmentCounts
        };
        
        // Get current view details
        const currentViewApartments = this.getAllApartmentsForCurrentView();
        const visibleApartments = this.getVisibleApartments();
        
        stats.currentViewDetails = {
            totalApartments: currentViewApartments.length,
            visibleApartments: visibleApartments.length,
            hiddenApartments: currentViewApartments.length - visibleApartments.length
        };
        
        // Status breakdown
        const statusBreakdown = {};
        currentViewApartments.forEach(apt => {
            statusBreakdown[apt.status] = (statusBreakdown[apt.status] || 0) + 1;
        });
        stats.currentViewDetails.statusBreakdown = statusBreakdown;
        
        return stats;
    }

    // DIAGNOSTIC: Log current state
    logCurrentState() {
        const stats = this.getViewStatistics();
        console.log('🔍 SVG Manager Current State:', stats);
        return stats;
    }
}

// Create global instance
const svgManager = new SVGManager();