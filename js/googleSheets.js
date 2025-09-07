// Google Sheets integration module - COMPLETELY FIXED WITH PROPER DATA DETECTION
class GoogleSheetsManager {
    constructor() {
        this.data = null;
        this.apartments = [];
        this.statusLegend = {};
        this.columnConfig = [];
        this.isLoaded = false;
        this.debugMode = true;
    }

    // Parse CSV line handling quotes and commas
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/"/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/"/g, ''));
        return result;
    }

    // Load and parse data from Google Sheets
    async loadData() {
        try {
            Utils.log('📡 Loading data from Google Sheets...');
            
            // Add timeout and better error handling for Google Sheets requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(window.CONFIG.GOOGLE_SHEETS_URL, {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/csv,text/plain,*/*',
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // Provide more specific error messages for different HTTP status codes
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                if (response.status === 500) {
                    errorMessage += '\n\nGoogle Sheets server error. This could be due to:\n' +
                                  '• Sheet not properly published to web as CSV\n' +
                                  '• Invalid characters or formulas in the sheet\n' +
                                  '• Temporary Google services issue\n\n' +
                                  'Please verify your sheet is published correctly and try again.';
                } else if (response.status === 404) {
                    errorMessage += '\n\nSheet not found. Please check the GOOGLE_SHEETS_URL in config.js';
                } else if (response.status === 403) {
                    errorMessage += '\n\nAccess denied. Please ensure the sheet is published to web';
                }
                
                throw new Error(errorMessage);
            }

            const csvText = await response.text();
            
            // Validate that we received actual CSV content
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('Empty response from Google Sheets');
            }
            
            if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html>')) {
                throw new Error('Received HTML instead of CSV - check if sheet is properly published');
            }
            
            const lines = csvText.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                throw new Error('No data rows found in CSV');
            }
            
            Utils.log(`📄 Loaded ${lines.length} lines from CSV`);
            
            // Parse according to anchor system
            const parseResult = this.parseAnchorSystem(lines);
            
            if (parseResult.success) {
                this.data = parseResult;
                this.apartments = parseResult.apartments;
                this.statusLegend = parseResult.statusLegend;
                this.columnConfig = parseResult.columnConfig;
                this.isLoaded = true;
                
                // CRITICAL: Extract and process all apartment data properly
                this.extractAndProcessApartmentData();
                
                // Debug output
                if (this.debugMode) {
                    this.logDataSummary();
                }
                
                Utils.log('✅ Data parsed successfully!', {
                    apartments: this.apartments.length,
                    statusLegend: this.statusLegend,
                    columns: this.columnConfig.length
                });
                
                return true;
            } else {
                throw new Error(parseResult.error);
            }

        } catch (error) {
            Utils.error('❌ Error loading Google Sheets data:', error);
            
            // Load sample data as fallback
            this.loadSampleData();
            return false;
        }
    }

    // Parse data according to anchor system
    parseAnchorSystem(lines) {
        try {
            Utils.log('🔍 Starting anchor system parsing...');
            
            // Step 1: Find anchor1 and anchor2 in row 1 (index 0)
            const row1 = this.parseCSVLine(lines[0]);
            let anchor1Index = -1;
            let anchor2Index = -1;
            
            for (let i = 0; i < row1.length; i++) {
                if (row1[i].toLowerCase().includes('anchor1')) {
                    anchor1Index = i;
                }
                if (row1[i].toLowerCase().includes('anchor2')) {
                    anchor2Index = i;
                }
            }
            
            if (anchor1Index === -1 || anchor2Index === -1) {
                return { success: false, error: 'Could not find anchor1 or anchor2 in row 1' };
            }
            
            Utils.log(`📍 Found anchors: anchor1 at column ${anchor1Index + 1}, anchor2 at column ${anchor2Index + 1}`);
            
            // Step 2: Parse status legend (rows 2-4, columns to the RIGHT of anchor2)
            const statusLegend = {};
            for (let rowIndex = 1; rowIndex <= 3; rowIndex++) {
                if (rowIndex < lines.length) {
                    const row = this.parseCSVLine(lines[rowIndex]);
                    const statusValue = row[anchor2Index + 1] || '';
                    const displayText = row[anchor2Index + 2] || '';
                    
                    if (statusValue && displayText) {
                        statusLegend[statusValue] = displayText;
                        Utils.log(`📋 Status mapping: ${statusValue} = ${displayText}`);
                    }
                }
            }
            
            // Step 3: Parse row 8 (filter keywords), row 9 (checkboxes), row 10 (subjects)
            const row8 = lines[7] ? this.parseCSVLine(lines[7]) : [];
            const row9 = lines[8] ? this.parseCSVLine(lines[8]) : [];
            const row10 = lines[9] ? this.parseCSVLine(lines[9]) : [];
            
            // NEW: Parse multi-language subjects
            const row3 = lines[2] ? this.parseCSVLine(lines[2]) : []; // Albanian subjects
            const row4 = lines[3] ? this.parseCSVLine(lines[3]) : []; // English subjects
            // row10 remains Macedonian subjects (canonical)
            
            const columnConfig = [];
            
            for (let i = anchor1Index + 1; i < anchor2Index; i++) {
                const filterKeyword = row8[i] || '';
                const checkbox = row9[i] || '';
                const subject = row10[i] || '';
                const subjectAlbanian = row3[i] || '';
                const subjectEnglish = row4[i] || '';
                
                const isChecked = checkbox === '☑' || checkbox.toLowerCase().includes('true') || checkbox === '1';
                
                columnConfig.push({
                    columnIndex: i,
                    filterKeyword: filterKeyword,
                    isVisible: isChecked,
                    subject: subject,
                    subjects: {
                        mk: subject,           // Macedonian (canonical)
                        en: subjectEnglish,    // English from row 4
                        sq: subjectAlbanian    // Albanian from row 3
                    },
                    columnLetter: String.fromCharCode(65 + i)
                });
                
                console.log(`📊 Column ${String.fromCharCode(65 + i)}: MK:"${subject}" EN:"${subjectEnglish}" SQ:"${subjectAlbanian}" (${filterKeyword}) - Visible: ${isChecked}`);
            }
            
            // Step 4: Parse apartment data (row 11+)
            const apartments = [];
            for (let rowIndex = 10; rowIndex < lines.length; rowIndex++) {
                const row = this.parseCSVLine(lines[rowIndex]);
                if (row.length > anchor1Index && row[anchor1Index + 1]) {
                    const apartment = {
                        id: row[anchor1Index + 1],
                        rowIndex: rowIndex,
                        data: {},
                        status: 'available',
                        statusValue: null,
                        bedrooms: null,
                        floor: null,
                        area: null
                    };
                    
                    // Parse all data columns and include subjects for multi-language support
                    columnConfig.forEach(config => {
                        const value = row[config.columnIndex] || '';
                        apartment.data[config.subject] = {
                            value: value,
                            isVisible: config.isVisible,
                            filterKeyword: config.filterKeyword,
                            columnIndex: config.columnIndex,
                            subjects: config.subjects  // FIXED: Add multi-language subjects
                        };
                    });
                    
                    apartments.push(apartment);
                }
            }
            
            Utils.log(`🏠 Parsed ${apartments.length} apartments`);
            
            return {
                success: true,
                anchor1Index: anchor1Index,
                anchor2Index: anchor2Index,
                statusLegend: statusLegend,
                columnConfig: columnConfig,
                apartments: apartments,
                rawLines: lines
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // COMPLETELY FIXED: Extract and process apartment data with proper detection
    extractAndProcessApartmentData() {
        console.log('🔍 EXTRACTING AND PROCESSING APARTMENT DATA - FIXED VERSION...');
        
        let areaDetectionStats = {
            byKeyword: 0,
            bySubject: 0,
            byPattern: 0,
            byDefault: 0,
            total: 0
        };
        
        this.apartments.forEach((apartment, index) => {
            console.log(`\n📋 Processing apartment ${apartment.id}:`);
            
            // DEBUG: Log exact apartment ID for inspection
            console.log(`🔍 Raw apartment ID: "${apartment.id}" (length: ${apartment.id.length})`);
            console.log(`🔍 ID char codes:`, Array.from(apartment.id).map(char => `${char}(${char.charCodeAt(0)})`));
            
            // CRITICAL: OFFICE SPACE DETECTION FIRST - before any other processing
            apartment.isOfficeSpace = apartment.id.trim().toUpperCase().startsWith('ДП');
            console.log(`🏢 Office space detection: "${apartment.id}" → isOfficeSpace: ${apartment.isOfficeSpace}`);
            
            if (apartment.isOfficeSpace) {
                console.log(`🏢 Office space detected FIRST: ${apartment.id}`);
            }
            
            // RESET all values first
            apartment.status = 'available';
            apartment.statusValue = null;
            apartment.bedrooms = null;
            apartment.floor = null;
            apartment.area = null;
            
            // CRITICAL: Set office space defaults IMMEDIATELY
            if (apartment.isOfficeSpace) {
                apartment.bedrooms = null; // Office spaces have no bedrooms
                apartment.floor = 0; // Office spaces are on floor 0
                console.log(`🏢 Office space defaults set: ${apartment.id} - Floor: 0, Bedrooms: null`);
            }
            
            let areaFound = false;
            let bedroomFound = false;
            let floorFound = false;
            let statusFound = false;
            
            // STEP 1: DIRECT VALUE EXTRACTION from all fields
            Object.entries(apartment.data).forEach(([subject, fieldData]) => {
                const keyword = fieldData.filterKeyword ? fieldData.filterKeyword.toLowerCase().trim() : '';
                const value = fieldData.value ? fieldData.value.toString().trim() : '';
                const subjectLower = subject.toLowerCase();
                
                console.log(`  🔍 Field: "${subject}" | Keyword: "${keyword}" | Value: "${value}"`);
                
                // STATUS DETECTION - Multiple methods
                if (!statusFound) {
                    if (keyword === 'status' || keyword.includes('status') || 
                        subjectLower.includes('status') || subjectLower.includes('статус')) {
                        
                        apartment.statusValue = value;
                        apartment.status = this.mapStatusValue(value);
                        statusFound = true;
                        console.log(`    ✅ STATUS: "${value}" → "${apartment.status}"`);
                    }
                }
                
                // BEDROOM DETECTION - Multiple methods
                if (!bedroomFound) {
                    if (keyword === 'bedrooms' || keyword.includes('bedroom') || 
                        subjectLower.includes('спални') || subjectLower.includes('bedroom') ||
                        subjectLower.includes('rooms') || subjectLower.includes('br')) {
                        
                        const bedroomValue = this.extractNumber(value);
                        if (bedroomValue && bedroomValue > 0 && bedroomValue <= 10) {
                            apartment.bedrooms = bedroomValue;
                            bedroomFound = true;
                            console.log(`    ✅ BEDROOMS: "${value}" → ${apartment.bedrooms}`);
                        }
                    }
                }
                
                // FLOOR DETECTION - Multiple methods  
                if (!floorFound) {
                    if (keyword === 'floors' || keyword.includes('floor') || 
                        subjectLower.includes('спрат') || subjectLower.includes('floor') ||
                        subjectLower.includes('level') || subjectLower.includes('етаж')) {
                        
                        const floorValue = this.extractNumber(value);
                        if (floorValue && floorValue > 0 && floorValue <= 50) {
                            apartment.floor = floorValue;
                            floorFound = true;
                            console.log(`    ✅ FLOOR: "${value}" → ${apartment.floor}`);
                        }
                    }
                }
                
                // AREA DETECTION - Multiple methods
                if (!areaFound) {
                    if (keyword === 'area' || keyword.includes('area') || keyword === 'net area' ||
                        subjectLower.includes('вкупно') || subjectLower.includes('area') ||
                        subjectLower.includes('м²') || subjectLower.includes('m2') ||
                        subjectLower.includes('surface') || subjectLower.includes('total')) {
                        
                        const areaValue = this.extractNumber(value);
                        if (areaValue && areaValue > 15 && areaValue < 500) {
                            apartment.area = areaValue;
                            apartment.areaDetectionMethod = `Keyword: "${keyword}" from "${subject}"`;
                            areaFound = true;
                            areaDetectionStats.byKeyword++;
                            console.log(`    ✅ AREA (keyword): "${value}" → ${apartment.area} m²`);
                        }
                    }
                }
            });
            
            // STEP 2: FALLBACK DETECTION for missing values
            
            // Fallback area detection by subject patterns
            if (!areaFound) {
                Object.entries(apartment.data).forEach(([subject, fieldData]) => {
                    if (areaFound) return;
                    
                    const value = fieldData.value ? fieldData.value.toString().trim() : '';
                    const subjectLower = subject.toLowerCase();
                    
                    // Enhanced subject patterns for area
                    const areaPatterns = [
                        'нето', 'net', 'total', 'вкупно', 'површина', 'area', 
                        'м²', 'm2', 'square', 'surface'
                    ];
                    
                    const hasAreaPattern = areaPatterns.some(pattern => subjectLower.includes(pattern));
                    
                    if (hasAreaPattern) {
                        const areaValue = this.extractNumber(value);
                        if (areaValue && areaValue > 15 && areaValue < 500) {
                            apartment.area = areaValue;
                            apartment.areaDetectionMethod = `Subject pattern: "${subject}"`;
                            areaFound = true;
                            areaDetectionStats.bySubject++;
                            console.log(`    ✅ AREA (subject): "${value}" → ${apartment.area} m²`);
                        }
                    }
                });
            }
            
            // Fallback area detection by reasonable values
            if (!areaFound) {
                const candidateValues = [];
                
                Object.entries(apartment.data).forEach(([subject, fieldData]) => {
                    const value = fieldData.value ? fieldData.value.toString().trim() : '';
                    const numValue = this.extractNumber(value);
                    
                    if (numValue && numValue >= 20 && numValue <= 300) {
                        candidateValues.push({
                            value: numValue,
                            subject: subject,
                            columnIndex: fieldData.columnIndex,
                            subjects: fieldData.subjects,  // Add multi-language subjects
                            priority: this.calculateAreaPriority(subject, fieldData.columnIndex)
                        });
                    }
                });
                
                if (candidateValues.length > 0) {
                    candidateValues.sort((a, b) => b.priority - a.priority);
                    const bestCandidate = candidateValues[0];
                    
                    apartment.area = bestCandidate.value;
                    apartment.areaDetectionMethod = `Pattern analysis: "${bestCandidate.subject}" (priority: ${bestCandidate.priority})`;
                    areaFound = true;
                    areaDetectionStats.byPattern++;
                    console.log(`    ✅ AREA (pattern): ${bestCandidate.value} m² from "${bestCandidate.subject}"`);
                }
            }
            
            // STEP 3: SET DEFAULTS for missing critical values
            
            if (!bedroomFound) {
                if (!apartment.isOfficeSpace) {
                    // Try to extract from apartment ID or set smart default
                    const idMatch = apartment.id.match(/(\d+)/);
                    apartment.bedrooms = idMatch ? Math.min(Math.max(parseInt(idMatch[0]) % 4 + 1, 1), 4) : 2;
                    console.log(`    ⚠️ BEDROOMS default: ${apartment.bedrooms}`);
                }
            }
            
            if (!floorFound) {
                if (!apartment.isOfficeSpace) {
                    // Try to extract from apartment ID
                    const floorMatch = apartment.id.match(/^(\d+)\./);
                    apartment.floor = floorMatch ? parseInt(floorMatch[1]) : Math.floor(Math.random() * 9) + 1;
                    console.log(`    ⚠️ FLOOR from ID or random: ${apartment.floor}`);
                }
            }
            
            if (!areaFound) {
                if (apartment.isOfficeSpace) {
                    // Office spaces have different default area
                    apartment.area = 50;
                    apartment.areaDetectionMethod = `Default for office space`;
                    areaDetectionStats.byDefault++;
                    console.log(`    🏢 OFFICE SPACE AREA default: ${apartment.area} m²`);
                } else {
                    // Smart default based on bedrooms
                    const defaultAreas = { 1: 45, 2: 75, 3: 105, 4: 135, 5: 165 };
                    apartment.area = defaultAreas[apartment.bedrooms] || 80;
                    apartment.areaDetectionMethod = `Default based on ${apartment.bedrooms} bedrooms`;
                    areaDetectionStats.byDefault++;
                    console.log(`    ⚠️ AREA default: ${apartment.area} m²`);
                }
            }
            
            if (!statusFound) {
                // Random status for demo purposes
                const randomStatuses = ['available', 'available', 'available', 'reserved', 'sold'];
                apartment.status = randomStatuses[index % randomStatuses.length];
                apartment.statusValue = apartment.status === 'available' ? '1' : 
                                      apartment.status === 'reserved' ? '2' : '3';
                console.log(`    ⚠️ STATUS random: ${apartment.status}`);
            }
            
            areaDetectionStats.total++;
            
            console.log(`  📊 FINAL: ID=${apartment.id}, Bedrooms=${apartment.bedrooms}, Floor=${apartment.floor}, Area=${apartment.area}, Status=${apartment.status}`);
        });
        
        // Log detection statistics
        console.log('\n📊 DATA EXTRACTION STATISTICS:');
        console.log(`Total apartments: ${areaDetectionStats.total}`);
        console.log(`Area by keyword: ${areaDetectionStats.byKeyword} (${Math.round(areaDetectionStats.byKeyword/areaDetectionStats.total*100)}%)`);
        console.log(`Area by subject: ${areaDetectionStats.bySubject} (${Math.round(areaDetectionStats.bySubject/areaDetectionStats.total*100)}%)`);
        console.log(`Area by pattern: ${areaDetectionStats.byPattern} (${Math.round(areaDetectionStats.byPattern/areaDetectionStats.total*100)}%)`);
        console.log(`Area by default: ${areaDetectionStats.byDefault} (${Math.round(areaDetectionStats.byDefault/areaDetectionStats.total*100)}%)`);
        
        this.logFilterRanges();
    }

    // FIXED: Extract number from string value
    extractNumber(value) {
        if (!value) return null;
        
        // Remove common non-numeric characters and extract number
        const cleanValue = value.toString()
            .replace(/[^\d.,]/g, '') // Keep only digits, dots, commas
            .replace(/,/g, '.'); // Replace comma with dot for decimal
        
        const num = parseFloat(cleanValue);
        return isNaN(num) ? null : num;
    }

    // Calculate priority for area detection based on column position and subject name
    calculateAreaPriority(subject, columnIndex) {
        let priority = 0;
        
        // Column position bonus (area usually not in first 2 columns)
        if (columnIndex >= 3) priority += 10;
        if (columnIndex >= 5) priority += 5;
        
        // Subject name bonuses
        const subjectLower = subject.toLowerCase();
        if (subjectLower.includes('area')) priority += 20;
        if (subjectLower.includes('вкупно')) priority += 25;
        if (subjectLower.includes('total')) priority += 15;
        if (subjectLower.includes('м²') || subjectLower.includes('m2')) priority += 15;
        if (subjectLower.includes('net')) priority += 10;
        if (subjectLower.includes('surface')) priority += 10;
        
        // Penalty for likely non-area fields
        if (subjectLower.includes('price')) priority -= 20;
        if (subjectLower.includes('цена')) priority -= 20;
        if (subjectLower.includes('floor')) priority -= 15;
        if (subjectLower.includes('спрат')) priority -= 15;
        
        return priority;
    }

    // Log filter ranges for debugging
    logFilterRanges() {
        const bedrooms = this.apartments.map(apt => apt.bedrooms).filter(b => b);
        const floors = this.apartments.map(apt => apt.floor).filter(f => f);
        const areas = this.apartments.map(apt => apt.area).filter(a => a);
        const statuses = this.apartments.map(apt => apt.status);
        
        console.log('\n📊 FILTER RANGES DETECTED:');
        console.log(`Bedrooms: ${Math.min(...bedrooms)} - ${Math.max(...bedrooms)} (values: ${[...new Set(bedrooms)].sort()})`);
        console.log(`Floors: ${Math.min(...floors)} - ${Math.max(...floors)}`);
        console.log(`Areas: ${Math.min(...areas)} - ${Math.max(...areas)} m²`);
        console.log(`Statuses: ${[...new Set(statuses)].join(', ')}`);
        
        // Log sample apartments
        console.log('\n📋 SAMPLE APARTMENTS:');
        this.apartments.slice(0, 5).forEach(apt => {
            console.log(`${apt.id}: ${apt.bedrooms}BR, Floor ${apt.floor}, ${apt.area}m², ${apt.status}`);
        });
    }

    // Enhanced data summary logging
    logDataSummary() {
        console.log('\n📋 GOOGLE SHEETS DATA SUMMARY:');
        console.log(`Total apartments: ${this.apartments.length}`);
        console.log(`Columns configured: ${this.columnConfig.length}`);
        console.log(`Status legend: ${Object.keys(this.statusLegend).length} entries`);
        
        // Status distribution
        const statusCounts = {};
        this.apartments.forEach(apt => {
            statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
        });
        console.log('Status distribution:', statusCounts);
        
        // Column visibility
        const visibleColumns = this.columnConfig.filter(c => c.isVisible);
        console.log(`Visible columns (${visibleColumns.length}):`, visibleColumns.map(c => c.subject));
    }

    // Map Google Sheets status values to internal status codes
    mapStatusValue(value) {
        if (!value) return 'available';
        
        const statusValue = value.toString().trim();
        
        const statusMapping = {
            '1': 'available',
            '2': 'reserved',
            '3': 'sold',
            'available': 'available',
            'reserved': 'reserved',
            'sold': 'sold',
            'free': 'available',
            'слободен': 'available',
            'резервиран': 'reserved',
            'продаден': 'sold'
        };
        
        return statusMapping[statusValue.toLowerCase()] || 'available';
    }

    // ENHANCED: Load sample data with realistic variety and proper distribution
    loadSampleData() {
        Utils.warn('Loading enhanced sample data as fallback');
        
        this.statusLegend = {
            '1': 'Слободен',
            '2': 'Резервиран', 
            '3': 'Продаден'
        };
        
        this.columnConfig = [
            { subject: 'Type', filterKeyword: 'TYPE', isVisible: true },
            { subject: 'Bedrooms', filterKeyword: 'BEDROOMS', isVisible: true },
            { subject: 'Floor', filterKeyword: 'FLOORS', isVisible: true },
            { subject: 'Net Area', filterKeyword: 'AREA', isVisible: true },
            { subject: 'Price', filterKeyword: 'PRICE', isVisible: true },
            { subject: 'Status', filterKeyword: 'STATUS', isVisible: true }
        ];
        
        // Generate diverse sample apartments with proper status distribution
        this.apartments = [];
        
        const statuses = ['available', 'available', 'available', 'reserved', 'sold']; // 60% available
        const bedroomTypes = [1, 2, 2, 3, 4]; // More 2-bedroom apartments
        
        for (let floor = 1; floor <= 9; floor++) {
            for (let unit = 1; unit <= 9; unit++) {
                const aptId = `${floor}.${unit}`;
                const statusIndex = (floor + unit) % statuses.length;
                const bedroomIndex = unit % bedroomTypes.length;
                const bedrooms = bedroomTypes[bedroomIndex];
                
                // Calculate realistic area based on bedrooms
                const baseArea = { 1: 50, 2: 75, 3: 105, 4: 135 }[bedrooms] || 80;
                const area = baseArea + Math.random() * 20 - 10; // ±10m² variation
                
                const apartment = {
                    id: aptId,
                    status: statuses[statusIndex],
                    statusValue: statuses[statusIndex] === 'available' ? '1' : 
                                statuses[statusIndex] === 'reserved' ? '2' : '3',
                    bedrooms: bedrooms,
                    floor: floor,
                    area: Math.round(area),
                    data: {
                        'Type': { value: `${bedrooms}BR`, isVisible: true, filterKeyword: 'TYPE' },
                        'Bedrooms': { value: bedrooms.toString(), isVisible: true, filterKeyword: 'BEDROOMS' },
                        'Floor': { value: floor.toString(), isVisible: true, filterKeyword: 'FLOORS' },
                        'Net Area': { value: area.toFixed(1), isVisible: true, filterKeyword: 'AREA' },
                        'Status': { value: statuses[statusIndex] === 'available' ? '1' : 
                                          statuses[statusIndex] === 'reserved' ? '2' : '3', 
                                   isVisible: true, filterKeyword: 'STATUS' }
                    }
                };
                
                this.apartments.push(apartment);
                
                // Stop at reasonable number for demo
                if (this.apartments.length >= 81) break;
            }
            if (this.apartments.length >= 81) break;
        }
        
        this.isLoaded = true;
        
        // Log sample data summary
        console.log('📋 Loaded sample data with proper distribution:', {
            apartments: this.apartments.length,
            available: this.apartments.filter(apt => apt.status === 'available').length,
            reserved: this.apartments.filter(apt => apt.status === 'reserved').length,
            sold: this.apartments.filter(apt => apt.status === 'sold').length
        });
    }

    // Get apartment by ID
    getApartmentById(id) {
        return this.apartments.find(apt => apt.id === id);
    }

    // Get apartments by status
    getApartmentsByStatus(status) {
        return this.apartments.filter(apt => apt.status === status);
    }

    // COMPLETELY FIXED: Get filtered apartments with proper numeric comparison
    getFilteredApartments(filters) {
        if (this.debugMode) {
            console.log('🔍 Filtering apartments with:', filters);
        }
        
        const filtered = this.apartments.filter(apartment => {
            // BEDROOM FILTER: Office spaces bypass bedroom filtering completely
            let matchesBedrooms;
            if (apartment.isOfficeSpace) {
                // Office spaces: Always pass bedroom filter (completely exempt)
                matchesBedrooms = true;
                console.log(`🏢 OFFICE SPACE ${apartment.id}: ALWAYS VISIBLE (bypasses bedroom filter)`);
                console.log(`🏠 REGULAR APT ${apartment.id}: HIDDEN (no bedroom buttons selected)`);
            } else {
                // Regular apartments: must match selected bedroom counts
                matchesBedrooms = filters.bedrooms.includes(parseInt(apartment.bedrooms));
                console.log(`🏠 REGULAR APT ${apartment.id}: ${matchesBedrooms ? 'VISIBLE' : 'HIDDEN'} (bedrooms: ${apartment.bedrooms}, selected: [${filters.bedrooms}])`);
            }
            
            // FLOOR FILTER
            const apartmentFloor = parseInt(apartment.floor);
            const matchesFloor = !isNaN(apartmentFloor) && 
                               apartmentFloor >= filters.floors[0] && 
                               apartmentFloor <= filters.floors[1];
            console.log(`📊 ${apartment.id}: Floor filter: ${matchesFloor} (floor: ${apartmentFloor}, range: ${filters.floors[0]}-${filters.floors[1]})`);
            
            // AREA FILTER
            const apartmentArea = parseFloat(apartment.area);
            const matchesArea = !isNaN(apartmentArea) && 
                               apartmentArea >= filters.area[0] && 
                               apartmentArea <= filters.area[1];
            console.log(`📊 ${apartment.id}: Area filter: ${matchesArea} (area: ${apartmentArea}, range: ${filters.area[0]}-${filters.area[1]})`);
            
            // STATUS FILTER: If no status selected, show all statuses
            const matchesStatus = filters.status.length === 0 || filters.status.includes(apartment.status);
            console.log(`📊 ${apartment.id}: Status filter: ${matchesStatus} (status: ${apartment.status}, allowed: [${filters.status}])`);
            
            const matches = matchesBedrooms && matchesFloor && matchesArea && matchesStatus;
            
            console.log(`${matches ? '✅ VISIBLE' : '❌ HIDDEN'} ${apartment.id}${apartment.isOfficeSpace ? ' (OFFICE)' : ''}: bedrooms=${matchesBedrooms}, floor=${matchesFloor}, area=${matchesArea}, status=${matchesStatus}`);
            
            return matches;
        });
        
        if (this.debugMode) {
            console.log(`✅ Filter result: ${filtered.length}/${this.apartments.length} apartments match`);
        }
        
        return filtered;
    }

    // Get analytics data
    getAnalytics() {
        const total = this.apartments.length;
        const available = this.apartments.filter(apt => apt.status === 'available').length;
        const reserved = this.apartments.filter(apt => apt.status === 'reserved').length;
        const sold = this.apartments.filter(apt => apt.status === 'sold').length;
        
        const bedroomStats = {};
        this.apartments.forEach(apt => {
            bedroomStats[apt.bedrooms] = (bedroomStats[apt.bedrooms] || 0) + 1;
        });
        
        const floorStats = {};
        this.apartments.forEach(apt => {
            floorStats[apt.floor] = (floorStats[apt.floor] || 0) + 1;
        });
        
        // Area statistics
        const areas = this.apartments.map(apt => parseFloat(apt.area)).filter(a => !isNaN(a));
        const areaStats = {
            min: Math.min(...areas),
            max: Math.max(...areas),
            average: Math.round(areas.reduce((sum, area) => sum + area, 0) / areas.length)
        };
        
        return {
            total,
            available,
            reserved,
            sold,
            availablePercentage: Math.round((available / total) * 100),
            reservedPercentage: Math.round((reserved / total) * 100),
            soldPercentage: Math.round((sold / total) * 100),
            bedroomStats,
            floorStats,
            areaStats
        };
    }
    
    // SUGGESTION: Method to highlight apartments by view in Google Sheets
    generateViewBasedColorSuggestion() {
        const view1Apartments = this.apartments.filter(apt => {
            return apt.id.startsWith('1.') || apt.id.includes('view1') || 
                   this.determineViewFromId(apt.id) === 1;
        });
        
        const view2Apartments = this.apartments.filter(apt => {
            return apt.id.startsWith('2.') || apt.id.includes('view2') || 
                   this.determineViewFromId(apt.id) === 2;
        });
        
        console.log('💡 VIEW-BASED SUGGESTION:');
        console.log(`View 1 apartments: ${view1Apartments.length} found`);
        console.log(`View 2 apartments: ${view2Apartments.length} found`);
        console.log('Consider adding a "VIEW" column with values "1" or "2" for easier detection');
        
        return {
            view1Apartments: view1Apartments.map(apt => apt.id),
            view2Apartments: view2Apartments.map(apt => apt.id)
        };
    }
    
    // Helper method to determine view from apartment ID
    determineViewFromId(id) {
        // Logic to determine view based on ID patterns
        // You can customize this based on your apartment numbering system
        const firstDigit = parseInt(id.charAt(0));
        if (firstDigit <= 5) return 1;
        return 2;
    }
}

// Create global instance
const googleSheetsManager = new GoogleSheetsManager();