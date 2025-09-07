// Filters management module - UPDATED: Button state logic
class FiltersManager {
    constructor() {
        this.currentFilters = {
            bedrooms: [],
            floors: [1, 24],
            area: [30, 200],
            status: ['available', 'reserved', 'sold']
        };
        this.isInitialized = false;
        this.clearAllState = 'active'; // CHANGED: Start as active
        this.savedFilters = null;
        this.allAvailableBedrooms = [];
        this.allAvailableFloors = [1, 24];
        this.allAvailableAreas = [30, 200];
        this.slidersCreated = false;
    }

    // Better keyword matching for different languages/formats
    matchesKeyword(keyword, targetType) {
        if (!keyword) return false;
        
        const lowerKeyword = keyword.toLowerCase().trim();
        
        switch (targetType) {
            case 'bedrooms':
                return lowerKeyword.includes('bedroom') || 
                       lowerKeyword.includes('спални') || 
                       lowerKeyword === 'bedrooms';
                       
            case 'floors':
                return lowerKeyword.includes('floor') || 
                       lowerKeyword.includes('спрат') || 
                       lowerKeyword === 'floors' ||
                       lowerKeyword === 'floor';
                       
            case 'area':
                return lowerKeyword.includes('area') || 
                       lowerKeyword.includes('вкупно') || 
                       lowerKeyword.includes('м²') ||
                       lowerKeyword === 'net area' ||
                       lowerKeyword === 'area';
                       
            case 'status':
                return lowerKeyword.includes('status') || 
                       lowerKeyword.includes('статус') ||
                       lowerKeyword === 'status';
                       
            default:
                return false;
        }
    }

    // Initialize filters
    initialize() {
        if (this.isInitialized) return;
        
        Utils.log('🎛️ Initializing filters...');
        
        this.loadFilterLabelsFromSheets();
        
        if (googleSheetsManager.isLoaded) {
            this.initializeBedroomFilters();
            this.initializeSliders();
            this.updateFiltersFromData();
        }
        
        // ADDED: Initialize clear button state
        this.initializeClearButtonState();
        
        this.isInitialized = true;
        Utils.log('✅ Filters initialized');
    }

    // NEW: Initialize clear button state
    initializeClearButtonState() {
        const clearBtn = document.querySelector('.filter-btn.clear');
        if (clearBtn) {
            // Start as active (all filters shown)
            clearBtn.classList.remove('inactive');
            this.clearAllState = 'active';
        }
    }

    // Load filter labels from Google Sheets
    loadFilterLabelsFromSheets() {
        console.log('🔍 Loading filter labels from Google Sheets...');
        
        if (googleSheetsManager.columnConfig && googleSheetsManager.columnConfig.length > 0) {
            // Filter labels are now handled by i18n system
            console.log('✅ Filter labels managed by i18n system');
        }
    }

    // Update filter labels in the UI
    updateFilterLabelsInUI() {
        // Labels are now updated by i18n system automatically
        i18nManager.updateAllTranslations();
    }

    // Initialize bedroom filters
    initializeBedroomFilters() {
        const container = document.getElementById('bedroomFilters');
        if (!container) return;
        
        const visibleApartments = this.getVisibleApartmentsForCurrentView();
        console.log('🏠 Visible apartments for bedroom filter:', visibleApartments.length);
        
        if (visibleApartments.length === 0) {
            console.warn('⚠️ No visible apartments for bedroom filters');
            return;
        }
        
        const bedroomCounts = new Set();
        
        visibleApartments.forEach((apt) => {
            const bedroomCount = parseInt(apt.bedrooms);
            if (!isNaN(bedroomCount) && bedroomCount > 0 && !apt.isOfficeSpace) {
                bedroomCounts.add(bedroomCount);
                console.log(`📋 Found bedrooms for ${apt.id}: ${bedroomCount}`);
            }
        });
        
        const sortedBedroomCounts = [...bedroomCounts].sort((a, b) => a - b);
        console.log('✅ Available bedroom counts for current view:', sortedBedroomCounts);
        
        this.allAvailableBedrooms = [...sortedBedroomCounts];
        
        container.innerHTML = '';
        
        sortedBedroomCounts.forEach(count => {
            const button = document.createElement('button');
            button.className = 'bedroom-btn active';
            button.textContent = count;
            button.onclick = () => this.toggleBedroomFilter(count);
            container.appendChild(button);
        });
        
        this.currentFilters.bedrooms = [...sortedBedroomCounts];
    }

    // Get visible apartments for current view
    getVisibleApartmentsForCurrentView() {
        const currentView = svgManager ? svgManager.currentView : 1;
        const currentOverlay = currentView === 1 ? 
            document.getElementById('svgOverlay1') : 
            document.getElementById('svgOverlay2');
        
        if (!currentOverlay) {
            return googleSheetsManager.apartments || [];
        }
        
        const shapes = currentOverlay.querySelectorAll('[data-name]');
        const visibleIds = Array.from(shapes)
            .map(shape => shape.getAttribute('data-name'))
            .filter(id => id && !id.includes('Layer'));
        
        return (googleSheetsManager.apartments || []).filter(apt => visibleIds.includes(apt.id));
    }

    // COMPLETELY FIXED: Initialize sliders with proper area detection and range setting
    initializeSliders() {
        if (this.slidersCreated) {
            console.log('🔄 Sliders already exist, updating values...');
            this.updateExistingSliders();
            return;
        }
        
        console.log('🎛️ INITIALIZING SLIDERS - FIXED AREA DETECTION...');
        
        // CRITICAL FIX: Use ALL apartments, not just visible ones
        const allApartments = googleSheetsManager.apartments || [];
        console.log('🏠 Initializing sliders for ALL', allApartments.length, 'apartments (including office spaces)');
        
        if (allApartments.length === 0) {
            console.warn('⚠️ No visible apartments for sliders, using defaults');
            this.createSlider('floor', 1, 24, 1, 24);
            this.createSlider('area', 30, 200, 30, 200);
            this.slidersCreated = true;
            return;
        }
        
        // Extract floor data from ALL apartments (including office spaces on floor 0)
        console.log('🏢 Extracting floor data from ALL apartments...');
        const validFloors = [];
        
        allApartments.forEach(apt => {
            const floor = parseInt(apt.floor);
            if (!isNaN(floor) && floor >= 0) {
                validFloors.push(floor);
                console.log(`🏢 Valid floor for ${apt.id}: ${floor}`);
            }
        });
        
        // Extract area data from ALL apartments
        console.log('📐 EXTRACTING AREA DATA - FIXED VERSION...');
        const validAreas = [];
        
        allApartments.forEach(apt => {
            const area = parseFloat(apt.area);
            if (!isNaN(area) && area > 10) {
                validAreas.push(area);
                console.log(`📐 Valid area for ${apt.id}: ${area} m²`);
            }
        });
        
        console.log('✅ Valid floors found:', validFloors.sort((a, b) => a - b));
        console.log('✅ Valid areas found:', validAreas.sort((a, b) => a - b));
        
        // Create floor slider
        if (validFloors.length > 0) {
            const minFloor = Math.min(...validFloors);
            const maxFloor = Math.max(...validFloors);
            console.log(`🎯 Floor range: ${minFloor} - ${maxFloor}`);
            
            this.allAvailableFloors = [minFloor, maxFloor];
            this.currentFilters.floors = [minFloor, maxFloor];
            this.createSlider('floor', minFloor, maxFloor, minFloor, maxFloor);
        } else {
            console.warn('⚠️ No valid floors found, using defaults');
            this.createSlider('floor', 1, 24, 1, 24);
        }
        
        // Create area slider with proper data and wider range
        if (validAreas.length > 0) {
            const minArea = Math.min(...validAreas);
            const maxArea = Math.max(...validAreas);
            
            // Add buffer to area range to ensure all apartments are included
            const minAreaWithBuffer = Math.max(Math.floor(minArea - 10), 10);
            const maxAreaWithBuffer = Math.ceil(maxArea + 10);
            
            console.log(`🎯 Area range (with buffer): ${minAreaWithBuffer} - ${maxAreaWithBuffer} m²`);
            
            this.allAvailableAreas = [minAreaWithBuffer, maxAreaWithBuffer];
            this.currentFilters.area = [minAreaWithBuffer, maxAreaWithBuffer];
            this.createSlider('area', minAreaWithBuffer, maxAreaWithBuffer, minAreaWithBuffer, maxAreaWithBuffer);
        } else {
            console.warn('⚠️ No valid areas found, using defaults');
            this.allAvailableAreas = [30, 200];
            this.currentFilters.area = [30, 200];
            this.createSlider('area', 30, 200, 30, 200);
        }
        
        this.slidersCreated = true;
        console.log('✅ Sliders created with ranges:', {
            floors: this.allAvailableFloors,
            areas: this.allAvailableAreas
        });
    }

    // Update existing sliders when switching views
    updateExistingSliders() {
        // CRITICAL FIX: Don't recalculate ranges - just reset to full range
        console.log('🔄 Resetting sliders to full range (including floor 0 for office spaces)');
        
        // Reset current filters to full available ranges
        this.currentFilters.floors = [...this.allAvailableFloors];
        this.currentFilters.area = [...this.allAvailableAreas];
        
        // Reset slider positions to full range
        this.resetSlider('floor');
        this.resetSlider('area');
        
        console.log(`🔄 Sliders reset to: floors ${this.allAvailableFloors[0]}-${this.allAvailableFloors[1]}, area ${this.allAvailableAreas[0]}-${this.allAvailableAreas[1]}`);
    }

    // COMPLETELY FIXED: Create working dual slider using div-based approach (like the working example)
    createSlider(type, min, max, valueMin, valueMax) {
        const isFloor = type === 'floor';
        const containerId = isFloor ? 'floorSliderContainer' : 'areaSliderContainer';
        const valuesId = isFloor ? 'floorValues' : 'areaValues';
        
        const container = document.getElementById(containerId);
        const valuesDiv = document.getElementById(valuesId);
        
        if (!container || !valuesDiv) {
            console.error(`❌ Could not find container for ${type} slider`);
            return;
        }
        
        console.log(`🎛️ Creating ${type} slider: ${min}-${max} (values: ${valueMin}-${valueMax})`);
        
        // FIXED: Create div-based dual slider (like the working example)
        container.innerHTML = `
            <div class="dual-slider" data-type="${type}">
                <div class="slider-track-custom">
                    <div class="slider-range-custom" id="${type}SliderRange"></div>
                    <div class="slider-handle-custom" id="${type}HandleMin" data-handle="min"></div>
                    <div class="slider-handle-custom" id="${type}HandleMax" data-handle="max"></div>
                </div>
            </div>
        `;
        
        // Store slider data
        const sliderData = {
            type: type,
            min: min,
            max: max,
            minValue: valueMin,
            maxValue: valueMax,
            minGap: 1,
            isDragging: false,
            currentHandle: null
        };
        
        // Store in global object for access
        if (!window.sliderInstances) window.sliderInstances = {};
        window.sliderInstances[type] = sliderData;
        
        // Get elements
        const track = document.querySelector(`[data-type="${type}"] .slider-track-custom`);
        const range = document.getElementById(`${type}SliderRange`);
        const minHandle = document.getElementById(`${type}HandleMin`);
        const maxHandle = document.getElementById(`${type}HandleMax`);
        
        // FIXED: Add event listeners using the working approach
        this.setupSliderEvents(type, track, minHandle, maxHandle, sliderData);
        
        // Initial update
        this.updateSliderPosition(type);
        this.updateSliderDisplay(type);
        
        console.log(`✅ Created working ${type} slider with custom handles`);
    }

    // FIXED: Setup slider events with proper mobile touch support
    setupSliderEvents(type, track, minHandle, maxHandle, sliderData) {
        const self = this;
        let isDragging = false;
        let currentHandle = null;
        
        // DESKTOP: Mouse events for min handle
        minHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            sliderData.isDragging = true;
            sliderData.currentHandle = 'min';
            isDragging = true;
            currentHandle = 'min';
            console.log(`👆 Started dragging ${type} min handle (mouse)`);
        });
        
        // DESKTOP: Mouse events for max handle
        maxHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            sliderData.isDragging = true;
            sliderData.currentHandle = 'max';
            isDragging = true;
            currentHandle = 'max';
            console.log(`👆 Started dragging ${type} max handle (mouse)`);
        });
        
        // MOBILE: Touch events for min handle
        minHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            sliderData.isDragging = true;
            sliderData.currentHandle = 'min';
            isDragging = true;
            currentHandle = 'min';
            console.log(`👆 Started dragging ${type} min handle (touch)`);
        }, { passive: false });
        
        // MOBILE: Touch events for max handle
        maxHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            sliderData.isDragging = true;
            sliderData.currentHandle = 'max';
            isDragging = true;
            currentHandle = 'max';
            console.log(`👆 Started dragging ${type} max handle (touch)`);
        }, { passive: false });
        
        // SHARED FUNCTION: Handle movement (mouse or touch)
        const handleMovement = (clientX) => {
            if (!sliderData.isDragging && !isDragging) return;
            
            const trackRect = track.getBoundingClientRect();
            let newPercent = ((clientX - trackRect.left) / trackRect.width) * 100;
            newPercent = Math.max(0, Math.min(100, newPercent)); // Clamp 0-100%
            
            // Convert percent to value
            let newValue = sliderData.min + (newPercent / 100) * (sliderData.max - sliderData.min);
            newValue = Math.round(newValue);
            
            // Handle collision detection
            const currentHandleType = sliderData.currentHandle || currentHandle;
            if (currentHandleType === 'min') {
                if (newValue <= sliderData.maxValue - sliderData.minGap) {
                    sliderData.minValue = newValue;
                } else {
                    sliderData.minValue = sliderData.maxValue - sliderData.minGap;
                }
            } else if (currentHandleType === 'max') {
                if (newValue >= sliderData.minValue + sliderData.minGap) {
                    sliderData.maxValue = newValue;
                } else {
                    sliderData.maxValue = sliderData.minValue + sliderData.minGap;
                }
            }
            
            // Update UI and filters
            self.updateSliderPosition(type);
            self.updateSliderDisplay(type);
            self.updateFiltersFromSlider(type, sliderData.minValue, sliderData.maxValue);
        };
        
        // DESKTOP: Global mouse move handler
        document.addEventListener('mousemove', (e) => {
            handleMovement(e.clientX);
        });
        
        // MOBILE: Global touch move handler
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) { // Single finger only
                e.preventDefault(); // Prevent scrolling while dragging
                handleMovement(e.touches[0].clientX);
            }
        }, { passive: false });
        
        // SHARED FUNCTION: Stop dragging
        const stopDragging = () => {
            if (sliderData.isDragging || isDragging) {
                console.log(`✋ Stopped dragging ${type} handle`);
                sliderData.isDragging = false;
                sliderData.currentHandle = null;
                isDragging = false;
                currentHandle = null;
            }
        };
        
        // DESKTOP: Global mouse up handler
        document.addEventListener('mouseup', stopDragging);
        
        // MOBILE: Global touch end handler
        document.addEventListener('touchend', stopDragging);
        document.addEventListener('touchcancel', stopDragging); // Handle touch cancellation
        
        // Track click/tap to move nearest handle
        const handleTrackClick = (clientX) => {
            if (sliderData.isDragging || isDragging) return;
            
            const trackRect = track.getBoundingClientRect();
            const clickPercent = ((clientX - trackRect.left) / trackRect.width) * 100;
            const clickValue = sliderData.min + (clickPercent / 100) * (sliderData.max - sliderData.min);
            
            // Move the nearest handle
            const distToMin = Math.abs(clickValue - sliderData.minValue);
            const distToMax = Math.abs(clickValue - sliderData.maxValue);
            
            if (distToMin < distToMax) {
                sliderData.minValue = Math.max(sliderData.min, Math.min(Math.round(clickValue), sliderData.maxValue - sliderData.minGap));
            } else {
                sliderData.maxValue = Math.max(sliderData.minValue + sliderData.minGap, Math.min(Math.round(clickValue), sliderData.max));
            }
            
            self.updateSliderPosition(type);
            self.updateSliderDisplay(type);
            self.updateFiltersFromSlider(type, sliderData.minValue, sliderData.maxValue);
        };
        
        // DESKTOP: Track click
        track.addEventListener('click', (e) => {
            handleTrackClick(e.clientX);
        });
        
        // MOBILE: Track tap
        track.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && !isDragging) {
                // Only handle tap if not already dragging a handle
                setTimeout(() => {
                    if (!isDragging) { // Double check we're not dragging
                        handleTrackClick(e.touches[0].clientX);
                    }
                }, 50); // Small delay to differentiate from handle drag
            }
        }, { passive: false });
    }

    // FIXED: Update slider visual position
    updateSliderPosition(type) {
        const sliderData = window.sliderInstances[type];
        if (!sliderData) return;
        
        const range = document.getElementById(`${type}SliderRange`);
        const minHandle = document.getElementById(`${type}HandleMin`);
        const maxHandle = document.getElementById(`${type}HandleMax`);
        
        if (!range || !minHandle || !maxHandle) return;
        
        const minPercent = ((sliderData.minValue - sliderData.min) / (sliderData.max - sliderData.min)) * 100;
        const maxPercent = ((sliderData.maxValue - sliderData.min) / (sliderData.max - sliderData.min)) * 100;
        
        // Position handles
        minHandle.style.left = `${minPercent}%`;
        maxHandle.style.left = `${maxPercent}%`;
        
        // Position and size range
        range.style.left = `${minPercent}%`;
        range.style.width = `${maxPercent - minPercent}%`;
        
        console.log(`📊 Updated ${type} slider: ${sliderData.minValue}-${sliderData.maxValue} (${minPercent.toFixed(1)}%-${maxPercent.toFixed(1)}%)`);
    }

    // FIXED: Update filters from slider values
    updateFiltersFromSlider(type, minVal, maxVal) {
        if (type === 'floor') {
            this.currentFilters.floors = [minVal, maxVal];
        } else {
            this.currentFilters.area = [minVal, maxVal];
        }
        
        console.log(`🎛️ ${type} filter updated: ${minVal} - ${maxVal}`);
        this.applyFilters();
    }

    // UPDATED: Fixed position display like in footer design
    updateSliderDisplay(type) {
        const sliderData = window.sliderInstances[type];
        if (!sliderData) return;
        
        const valuesDiv = document.getElementById(type === 'floor' ? 'floorValues' : 'areaValues');
        if (valuesDiv) {
            const unit = type === 'floor' ? '' : ' m²';
            
            // FOOTER DESIGN: Create fixed position display like in footer
            valuesDiv.innerHTML = `
                <span>${sliderData.minValue}${unit}</span>
                <span>${sliderData.maxValue}${unit}</span>
            `;
            
            // Ensure the container has proper flex styling for fixed positioning
            valuesDiv.style.display = 'flex';
            valuesDiv.style.justifyContent = 'space-between';
        }
    }

    // Update slider range (min/max values)
    updateSliderRange(type, newMin, newMax) {
        const sliderData = window.sliderInstances[type];
        if (!sliderData) return;
        
        sliderData.min = newMin;
        sliderData.max = newMax;
        sliderData.minValue = newMin;
        sliderData.maxValue = newMax;
        
        // Update filter values
        if (type === 'floor') {
            this.currentFilters.floors = [newMin, newMax];
        } else {
            this.currentFilters.area = [newMin, newMax];
        }
        
        this.updateSliderPosition(type);
        this.updateSliderDisplay(type);
        
        console.log(`🔄 Updated ${type} slider range: ${newMin}-${newMax}`);
    }

    // Update filters based on available data
    updateFiltersFromData() {
        if (googleSheetsManager.isLoaded) {
            console.log('🔄 Updating filters from loaded data...');
            this.loadFilterLabelsFromSheets();
            this.initializeBedroomFilters();
            this.initializeSliders();
            this.applyFilters();
        }
    }

    // Update filters for specific view - IMPROVED
    updateFiltersForView(viewNumber) {
        console.log(`🔄 Updating filters for view ${viewNumber}`);
        
        // Update bedroom filters for new view
        this.initializeBedroomFilters();
        
        // Update slider ranges for new view
        if (this.slidersCreated) {
            this.updateExistingSliders();
        } else {
            this.initializeSliders();
        }
        
        this.applyFilters();
    }

    // Toggle bedroom filter
    toggleBedroomFilter(count) {
        const button = event.target;
        const index = this.currentFilters.bedrooms.indexOf(count);
        
        if (index > -1) {
            this.currentFilters.bedrooms.splice(index, 1);
            button.classList.remove('active');
            console.log(`❌ Removed bedroom ${count} from filter`);
        } else {
            this.currentFilters.bedrooms.push(count);
            button.classList.add('active');
            console.log(`✅ Added bedroom ${count} to filter`);
        }
        
        // Track event with Analytics module
        if (window.Analytics && window.Analytics.isInitialized) {
            window.Analytics.trackFilterChange('bedroom_toggle', {
                bedroom_count: count,
                action: index > -1 ? 'removed' : 'added',
                current_bedrooms: this.currentFilters.bedrooms
            });
        }
        
        this.applyFilters();
    }

    // Apply current filters
    applyFilters() {
        if (!googleSheetsManager.isLoaded) {
            console.warn('⚠️ Cannot apply filters: data not loaded');
            return;
        }
        
        console.log('🔍 Applying filters with current settings:', this.currentFilters);
        
        const filteredApartments = googleSheetsManager.getFilteredApartments(this.currentFilters);
        
        console.log('🔍 Filter application result:', {
            filters: this.currentFilters,
            resultCount: filteredApartments.length,
            totalApartments: googleSheetsManager.apartments.length
        });
        
        // Track event with Analytics module
        if (window.Analytics && window.Analytics.isInitialized) {
            window.Analytics.trackFiltersApplied(
                this.currentFilters, 
                svgManager ? svgManager.currentView : 1
            );
        }
        
        if (svgManager) {
            svgManager.applyFilters(filteredApartments);
        }
    }

    // FIXED: Reset slider (update for new approach)
    resetSlider(type) {
        const sliderData = window.sliderInstances[type];
        if (!sliderData) return;
        
        const values = type === 'floor' ? this.allAvailableFloors : this.allAvailableAreas;
        sliderData.minValue = values[0];
        sliderData.maxValue = values[1];
        
        if (type === 'floor') {
            this.currentFilters.floors = [...values];
        } else {
            this.currentFilters.area = [...values];
        }
        
        this.updateSliderPosition(type);
        this.updateSliderDisplay(type);
        
        console.log(`🔄 Reset ${type} slider to ${values[0]}-${values[1]}`);
    }

    // UPDATED: Clear all filters with button state toggle
    clearAllFilters() {
        const clearBtn = document.querySelector('.filter-btn.clear');
        let actionType = '';
        
        if (this.clearAllState === 'active') {
            console.log('🧹 Clearing all filters - HIDING ALL SHAPES (apartments AND office spaces)');
            
            this.savedFilters = {
                bedrooms: [...this.currentFilters.bedrooms],
                floors: [...this.currentFilters.floors],
                area: [...this.currentFilters.area],
                status: [...this.currentFilters.status]
            };
            
            // CLEAR ALL FILTERS - Hide ALL shapes by setting impossible ranges
            const bedroomButtons = document.querySelectorAll('.bedroom-btn');
            bedroomButtons.forEach(button => button.classList.remove('active'));
            this.currentFilters.bedrooms = [];
            this.currentFilters.floors = [999, 999]; // Impossible range
            this.currentFilters.area = [999, 999]; // Impossible range  
            this.currentFilters.status = []; // Empty status array
            
            this.clearAllState = 'inactive';
            actionType = 'cleared_all';
            if (clearBtn) {
                clearBtn.classList.add('inactive');
                clearBtn.textContent = i18nManager.t('restore-filters');
                clearBtn.setAttribute('data-i18n', 'restore-filters');
            }
            
        } else {
            console.log('🔄 Restoring filters - SHOWING ALL SHAPES');
            
            // Restore all available filters
            this.currentFilters.bedrooms = [...this.allAvailableBedrooms];
            this.currentFilters.floors = [...this.allAvailableFloors];
            this.currentFilters.area = [...this.allAvailableAreas];
            this.currentFilters.status = ['available', 'reserved', 'sold'];
            
            const bedroomButtons = document.querySelectorAll('.bedroom-btn');
            bedroomButtons.forEach(button => button.classList.add('active'));
            
            this.resetSlider('floor');
            this.resetSlider('area');
            
            this.clearAllState = 'active';
            actionType = 'restored_all';
            if (clearBtn) {
                clearBtn.classList.remove('inactive');
                clearBtn.textContent = i18nManager.t('clear-filters');
                clearBtn.setAttribute('data-i18n', 'clear-filters');
            }
        }
        
        // Track event with Analytics module
        if (window.Analytics && window.Analytics.isInitialized) {
            window.Analytics.trackFiltersClearRestore(actionType, this.currentFilters);
        }
        
        this.applyFilters();
    }
}

// Global function for HTML onclick handler
function clearAllFilters() {
    filtersManager.clearAllFilters();
}

// Create global instance
const filtersManager = new FiltersManager();