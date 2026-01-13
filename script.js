// Array of colors in order
const colors = ['#EF4538', '#891951', '#FAB01B', '#007A6F', '#EB4781', '#293990'];

// Array of words for each color (matching colors array order)
// כתום- shape, סגול- sound, צהוב- letter, ירוק- number, ורוד- emotion, כחול- color
const colorWords = ['shape', 'sound', 'letter', 'number', 'emotion', 'color'];

// Color constants for visibility check
const ORANGE_COLOR = '#EF4538';  // shape (index 0)
const PURPLE_COLOR = '#891951';  // sound (index 1)
const YELLOW_COLOR = '#FAB01B';  // letter (index 2)

// ==================
// SINGLE SOURCE OF TRUTH FOR SELECTED COLORS
// ==================
// Centralized state for selected color indices (0-5, wrapping for infinite scroll)
let selectedLeftIndex = 0;  // Index of currently selected color in left column
let selectedRightIndex = 0; // Index of currently selected color in right column
let pendingGradientUpdate = false; // Flag to prevent multiple simultaneous updates

// Tracking for intro text progression
let leftColumnScrolled = false;
let rightColumnScrolled = false;
let uniqueColorsSeen = new Set(); // Track unique colors that have been selected (only after user interaction)
let introTextChanged = false; // Prevent multiple changes
let hasUserInteracted = false; // Track if user has started scrolling (prevents counting initial colors)
let isProgrammaticScroll = false; // Flag to track programmatic scrolls (should not trigger interaction)
let isInitializing = true; // Flag to track initialization phase (prevents initial scroll events from counting)
let introPhase = 'entering'; // Track intro phase: 'entering' (initial full-bleed), 'active' (default), or 'closing' (after START is clicked)
let introReady = false; // Gate: true when START text is visible, false otherwise
let introTriggered = false; // Gate: true after intro transition has been triggered
let introProgress = 0; // Persistent progress value p in [0..1] for intro closing
let introCompleted = false; // Lock: true when progress reaches 1, prevents reversing
let horizontalExpansionStarted = false; // Track if horizontal expansion has started
let hasExpandedToScrollbars = false; // Track when gradients have fully expanded to scrollbar edges (UI becomes visible only after this)
const SCROLL_THRESHOLD = 3000; // Threshold for full collapse (3x slower: requires ~3 scroll gestures to complete collapse)
let autoScrollDemoRun = false; // Track if the auto-scroll demo has already run (only run once per page load)
let autoScrollDemoActive = false; // Track if auto-scroll demo is currently running

// Initialize columns
document.addEventListener('DOMContentLoaded', () => {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    // Initialize both columns (while isInitializing is true)
    initializeColumn(leftColumn, 'left');
    initializeColumn(rightColumn, 'right');
    
    // Initialize selected indices from initial scroll positions
    selectedLeftIndex = getSelectedColorIndex(leftColumn);
    selectedRightIndex = getSelectedColorIndex(rightColumn);
    
    // Initialize word text with initial combination
    updateWordText();
    
    // Initialize active page ID from initial color selection
    const initialPageId = getPageIdFromColors(selectedLeftIndex, selectedRightIndex);
    activePageId = initialPageId;
    
    // Initialize canvas text box with initial page content
    updateCanvasTextBox(initialPageId);
    
    // Initialize SHAPE & LETTER text box visibility
    updateLetterSoundTextBox(initialPageId);
    
    // Initialize SOUND & SHAPE instruction text visibility
    updateSoundShapeInstructionText(initialPageId);
    
    // Initialize p5.js sketch
    initializeP5Sketch();
    
    // Set initial pageId in p5 instance after it's created
    // Use a small delay to ensure p5 instance is ready
    setTimeout(() => {
        if (p5Instance) {
            p5Instance._currentPageId = initialPageId;
        }
    }, 200);
    
    // Initialize about text hover effect
    initializeAboutHoverEffect();
    
    // Initialize color key click effect
    initializeColorKeyClickEffect();
    
    // Initialize per-line text highlights
    initializePerLineHighlights();
    
    // Initialize gradient intro
    initializeGradientIntro();
    
    // Initialize logo click handler to restart intro
    initializeLogoClickHandler();
    
    // Initialize main gradient header (persistent header on main screen)
    initializeMainGradientHeader();
    
    // Initialize center scroll trigger for intro
    initializeCenterScrollTrigger();
    
    // Initialize UI visibility (hidden by default during entering phase)
    updateUIVisibility();
    
    // Initialize canvas cover visibility (visible by default during intro)
    updateCanvasCoverVisibility();
    
    // Align ABOUT and COLOR KEY rectangles with ESTHESIA text center
    // Wait for layout to stabilize (fonts loaded, DOM ready)
    alignRectanglesWithEsthesia();
    
    // Mark initialization as complete (after all scroll positions are set)
    // Use a small delay to ensure any pending scroll events from initialization are processed
    setTimeout(() => {
        isInitializing = false;
        console.log('INITIALIZATION_COMPLETE', {
            timestamp: new Date().toISOString()
        });
    }, 100);
    
    // DEBUG: Log initial state on page load
    const initialLeftColor = getSnappedTileColor(leftColumn);
    const initialRightColor = getSnappedTileColor(rightColumn);
    const introText = document.getElementById('gradient-intro-text');
    console.log('=== INTRO INITIAL STATE ===', {
        currentIntroText: introText ? introText.textContent : 'NOT FOUND',
        leftSelectedColor: initialLeftColor,
        rightSelectedColor: initialRightColor,
        leftHasScrolled: leftColumnScrolled,
        rightHasScrolled: rightColumnScrolled,
        uniqueColorCount: uniqueColorsSeen.size,
        uniqueColors: [...uniqueColorsSeen],
        hasUserInteracted: hasUserInteracted,
        introTextChanged: introTextChanged,
        isInitializing: isInitializing,
        timestamp: new Date().toISOString()
    });
    
    // Note: Do NOT check initial state - text should only change after user interaction
    
    // Initialize canvas text box resize and font load handlers
    initializeCanvasTextBoxHandlers();
});

// Initialize resize and font load handlers for canvas text box
function initializeCanvasTextBoxHandlers() {
    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            rerenderCanvasTextBox();
        }, 150);
    });
    
    // Re-render when fonts are loaded (ensures accurate measurements)
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            // Small delay to ensure fonts are fully applied
            setTimeout(() => {
                rerenderCanvasTextBox();
            }, 100);
        });
    }
}

function initializeColumn(column, side) {
    if (!column) return; // Safety check
    
    // Track initial snapped color for this column (but don't add to set yet - wait for user interaction)
    let previousSnappedColor = getSnappedTileColor(column);
    
    const items = column.querySelectorAll('.color-item');
    if (!items || items.length === 0) return; // Safety check
    
    const itemHeight = window.innerHeight / 6;
    const singleSetHeight = 6 * itemHeight; // Height of one complete set of 6 colors
    
    // Set initial colors and add labels
    items.forEach((item, index) => {
        const colorIndex = index % colors.length;
        item.style.backgroundColor = colors[colorIndex];
        
        // Set data-color attribute for matching
        item.setAttribute('data-color', colors[colorIndex]);
        
        // Add label element if it doesn't exist
        if (!item.querySelector('.label')) {
            // Create wrapper anchor for stable positioning
            const labelWrapper = document.createElement('div');
            labelWrapper.className = 'label-wrapper';
            
            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = `[${colorWords[colorIndex]}]`;
            
            labelWrapper.appendChild(label);
            item.appendChild(labelWrapper);
        }
    });
    
    // Add hover event listeners to sync opposite column rectangles
    items.forEach((item, index) => {
        const itemColor = item.getAttribute('data-color');
        const relativeIndex = index % colors.length; // Position within the 6-color cycle
        
        // Find the opposite column
        const oppositeColumn = side === 'left' 
            ? document.querySelector('.right-column')
            : document.querySelector('.left-column');
        
        if (!oppositeColumn) return;
        
        // Function to find matching color item in opposite column
        // Chooses the copy that is closest to the current viewport (active set)
        const findMatchingItem = () => {
            const oppositeItems = oppositeColumn.querySelectorAll('.color-item');
            const itemHeight = window.innerHeight / 6;
            const viewportHeight = window.innerHeight;
            
            // Calculate the absolute position of the hovered item in the viewport
            const columnScrollTop = column.scrollTop;
            const itemTop = item.offsetTop;
            const itemViewportTop = itemTop - columnScrollTop; // Position relative to viewport top
            
            // Find the center of the viewport for better matching
            const viewportCenter = viewportHeight / 2;
            const itemDistanceFromCenter = Math.abs(itemViewportTop + itemHeight / 2 - viewportCenter);
            
            // Get scroll position of opposite column
            const oppositeColumnScrollTop = oppositeColumn.scrollTop;
            
            let bestMatch = null;
            let minDistance = Infinity;
            let bestMatchIndex = -1;
            let copyNumber = 0;
            
            // Collect all matching color items and their distances from viewport
            const matchingItems = [];
            Array.from(oppositeItems).forEach((oppositeItem, oppIndex) => {
                const oppositeColor = oppositeItem.getAttribute('data-color');
                if (oppositeColor === itemColor) {
                    const oppositeTop = oppositeItem.offsetTop;
                    const oppositeViewportTop = oppositeTop - oppositeColumnScrollTop;
                    
                    // Calculate distance from viewport center (prioritize items in viewport)
                    const oppositeCenter = oppositeViewportTop + itemHeight / 2;
                    const distanceFromViewportCenter = Math.abs(oppositeCenter - viewportCenter);
                    
                    // Also check if item is in viewport (bonus for visible items)
                    const isInViewport = oppositeViewportTop >= -itemHeight && 
                                        oppositeViewportTop <= viewportHeight;
                    
                    // Calculate final distance: prioritize items in viewport
                    let finalDistance = distanceFromViewportCenter;
                    if (!isInViewport) {
                        // Penalize items outside viewport
                        finalDistance += viewportHeight * 2;
                    }
                    
                    matchingItems.push({
                        item: oppositeItem,
                        index: oppIndex,
                        distance: finalDistance,
                        viewportTop: oppositeViewportTop,
                        isInViewport: isInViewport
                    });
                }
            });
            
            // Find the best match (closest to viewport center, preferably in viewport)
            matchingItems.forEach((match, idx) => {
                if (match.distance < minDistance) {
                    minDistance = match.distance;
                    bestMatch = match.item;
                    bestMatchIndex = match.index;
                    // Calculate which copy this is (0-based: first, second, or third)
                    copyNumber = Math.floor(match.index / colors.length);
                }
            });
            
            return { item: bestMatch, index: bestMatchIndex, copyNumber: copyNumber, distance: minDistance };
        };
        
        // On hover enter: add class to matching item in opposite column
        item.addEventListener('mouseenter', () => {
            // Only sync if not scrolling
            if (!column.classList.contains('scrolling')) {
                const itemHeight = window.innerHeight / 6;
                const columnScrollTop = column.scrollTop;
                const itemTop = item.offsetTop;
                const itemIndexInColumn = Math.round(itemTop / itemHeight);
                
                // Calculate which copy this item belongs to (0-based: first, second, or third)
                const currentCopyNumber = Math.floor(itemIndexInColumn / colors.length);
                
                // Get data-color for logging
                const itemColorId = item.getAttribute('data-color');
                
                // Log hover information for side A
                console.log('🟦 HOVER START - Side:', side === 'left' ? 'A (Left)' : 'B (Right)');
                console.log('  📍 Color:', itemColorId);
                console.log('  📊 Item index in column:', itemIndexInColumn);
                console.log('  🔢 Copy number:', currentCopyNumber + 1, '(out of 3)');
                console.log('  📏 ScrollTop:', columnScrollTop.toFixed(2));
                console.log('  📐 Item top position:', itemTop.toFixed(2));
                console.log('  👁️  Item viewport position:', (itemTop - columnScrollTop).toFixed(2));
                
                const matchResult = findMatchingItem();
                const oppositeColumnScrollTop = oppositeColumn.scrollTop;
                
                if (matchResult && matchResult.item) {
                    // Log information about the selected match in opposite column
                    console.log('🟩 MATCH FOUND - Side:', side === 'left' ? 'B (Right)' : 'A (Left)');
                    console.log('  📍 Selected color:', itemColorId);
                    console.log('  📊 Selected item index:', matchResult.index);
                    console.log('  🔢 Selected copy number:', matchResult.copyNumber + 1, '(out of 3)');
                    console.log('  📏 Opposite ScrollTop:', oppositeColumnScrollTop.toFixed(2));
                    console.log('  📐 Selected item top position:', matchResult.item.offsetTop.toFixed(2));
                    console.log('  👁️  Selected item viewport position:', (matchResult.item.offsetTop - oppositeColumnScrollTop).toFixed(2));
                    console.log('  📏 Distance score:', matchResult.distance.toFixed(2));
                    console.log('  ✅ Applying opposite-hovered class');
                    
                    matchResult.item.classList.add('opposite-hovered');
                } else {
                    console.log('  ❌ NO MATCH FOUND - Could not find matching item in opposite column');
                    console.log('  📏 Opposite ScrollTop:', oppositeColumnScrollTop.toFixed(2));
                }
                console.log('─'.repeat(50));
            }
        });
        
        // On hover leave: remove class from matching item in opposite column
        item.addEventListener('mouseleave', () => {
            const matchResult = findMatchingItem();
            if (matchResult && matchResult.item) {
                matchResult.item.classList.remove('opposite-hovered');
                console.log('🟦 HOVER END - Removed opposite-hovered from copy', matchResult.copyNumber + 1);
            }
        });
    });
    
    // Start scroll position at the beginning of the middle set (2nd copy), snapped to a tile
    // This positions us in the middle of 3 copies for stable infinite scroll
    isProgrammaticScroll = true; // Mark as programmatic
    column.scrollTop = singleSetHeight;
    isProgrammaticScroll = false;
    
    // Function to snap scroll position to nearest tile boundary
    function snapToTile(scrollTop) {
        const tileIndex = Math.round(scrollTop / itemHeight);
        return tileIndex * itemHeight;
    }
    
    // Handle scroll event for infinite looping
    let isAdjusting = false;
    let scrollTimeout = null;
    let isScrolling = false;
    let scrollEndTimeout = null;
    
    // Function to enable/disable hover expansion
    function setHoverEnabled(enabled) {
        if (enabled) {
            column.classList.remove('scrolling');
        } else {
            column.classList.add('scrolling');
            // Remove opposite-hovered class from all items when scrolling starts
            const allItems = document.querySelectorAll('.color-item');
            allItems.forEach(item => {
                item.classList.remove('opposite-hovered');
            });
        }
    }
    
    column.addEventListener('scroll', () => {
        // DEBUG: Log programmatic scrolls and initialization scrolls
        // CRITICAL: During auto-scroll demo, we still need to update gradients
        // So we allow updateSelectedIndices() to run even during programmatic scrolls
        const isAutoScrollDemo = autoScrollDemoActive && isProgrammaticScroll;
        
        // CRITICAL: Ignore user interaction tracking during initialization or programmatic adjustments
        // BUT: During auto-scroll demo, we still update gradients
        if (isProgrammaticScroll || isAdjusting || isInitializing) {
            console.log(`PROGRAMMATIC_SCROLL [${side.toUpperCase()}]`, {
                isProgrammaticScroll,
                isAdjusting,
                isInitializing,
                isAutoScrollDemo,
                scrollTop: column.scrollTop,
                timestamp: new Date().toISOString()
            });
            
            // During auto-scroll demo, update gradients even though scroll is programmatic
            if (isAutoScrollDemo) {
                updateSelectedIndices();
            }
            
            // Skip user interaction tracking
            return;
        }
        
        // CRITICAL: Only process user interactions AFTER initialization is complete
        if (isInitializing) {
            console.log(`SCROLL_IGNORED_DURING_INIT [${side.toUpperCase()}]`, {
                scrollTop: column.scrollTop,
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        // Mark that user has started interacting (first scroll event)
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            // Add the current color when user first starts scrolling (not the initial one)
            const currentColor = getSnappedTileColor(column);
            uniqueColorsSeen.add(currentColor);
            previousSnappedColor = currentColor;
            console.log(`USER_FIRST_INTERACTION [${side.toUpperCase()}]`, {
                color: currentColor,
                timestamp: new Date().toISOString()
            });
        }
        
        // Track that this column has been scrolled
        if (side === 'left' && !leftColumnScrolled) {
            leftColumnScrolled = true;
            console.log('USER_SCROLL_LEFT', {
                timestamp: new Date().toISOString(),
                currentColor: getSnappedTileColor(column)
            });
            checkAndUpdateIntroText();
        } else if (side === 'right' && !rightColumnScrolled) {
            rightColumnScrolled = true;
            console.log('USER_SCROLL_RIGHT', {
                timestamp: new Date().toISOString(),
                currentColor: getSnappedTileColor(column)
            });
            checkAndUpdateIntroText();
        }
        
        // Track color changes (only after user has started interacting)
        if (hasUserInteracted) {
            const currentSnappedColor = getSnappedTileColor(column);
            if (currentSnappedColor !== previousSnappedColor) {
                const oldColor = previousSnappedColor; // Capture old value before updating
                uniqueColorsSeen.add(currentSnappedColor);
                previousSnappedColor = currentSnappedColor;
                console.log(`COLOR_CHANGED [${side.toUpperCase()}]`, {
                    from: oldColor,
                    to: currentSnappedColor,
                    uniqueColorsCount: uniqueColorsSeen.size,
                    uniqueColors: [...uniqueColorsSeen],
                    timestamp: new Date().toISOString()
                });
                checkAndUpdateIntroText();
            }
        }
        
        // Mark as scrolling and disable hover expansion
        if (!isScrolling) {
            isScrolling = true;
            setHoverEnabled(false);
        }
        
        // Clear any pending scroll-end timeout
        if (scrollEndTimeout) {
            clearTimeout(scrollEndTimeout);
        }
        
        // Debounce: re-enable hover after scrolling stops
        scrollEndTimeout = setTimeout(() => {
            isScrolling = false;
            setHoverEnabled(true);
        }, 150); // Same debounce time as snap timeout
        
        const scrollTop = column.scrollTop;
        
        // Middle-set infinite scroll: keep user always in the middle copy (2nd set)
        // Boundaries: topBoundary = 0.5 * singleSetHeight, bottomBoundary = 1.5 * singleSetHeight
        // This keeps scrollTop between the start of 1st set and end of 2nd set
        const topBoundary = singleSetHeight * 0.5;
        const bottomBoundary = singleSetHeight * 1.5;
        
        // Recenter into middle set if we've drifted too far
        if (scrollTop < topBoundary) {
            // Scrolled too far up: jump forward by one set to recenter in middle
            isAdjusting = true;
            isProgrammaticScroll = true; // Mark as programmatic
            const newScrollTop = scrollTop + singleSetHeight;
            column.scrollTop = snapToTile(newScrollTop);
            isProgrammaticScroll = false;
            isAdjusting = false;
            // Update selected indices after scroll position changes
            updateSelectedIndices();
        } else if (scrollTop > bottomBoundary) {
            // Scrolled too far down: jump backward by one set to recenter in middle
            isAdjusting = true;
            isProgrammaticScroll = true; // Mark as programmatic
            const newScrollTop = scrollTop - singleSetHeight;
            column.scrollTop = snapToTile(newScrollTop);
            isProgrammaticScroll = false;
            isAdjusting = false;
            // Update selected indices after scroll position changes
            updateSelectedIndices();
        }
        
        // Clear any pending snap timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // After scroll ends, ensure we're snapped to a tile (backup for CSS snap)
        scrollTimeout = setTimeout(() => {
            if (!isAdjusting) {
                const currentScroll = column.scrollTop;
                const snappedScroll = snapToTile(currentScroll);
                
                // Only adjust if we're significantly off (more than 2px)
                if (Math.abs(currentScroll - snappedScroll) > 2) {
                    isAdjusting = true;
                    isProgrammaticScroll = true; // Mark as programmatic
                    column.scrollTop = snappedScroll;
                    isProgrammaticScroll = false;
                    isAdjusting = false;
                }
                
                // Update selected indices after snap completes (this will trigger gradient update)
                updateSelectedIndices();
            }
        }, 150);
        
        // Update selected indices during scroll (for real-time updates)
        // This will schedule a gradient update via requestAnimationFrame
        updateSelectedIndices();
        
        // DEBUG: Log when scroll happens post-intro to confirm introCompleted state
        if (introCompleted) {
            console.log(`POST_INTRO_SCROLL [${side.toUpperCase()}]`, {
                introCompleted: introCompleted,
                scrollTop: column.scrollTop,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Detect real user wheel interaction
    column.addEventListener('wheel', (e) => {
        // This is a real user interaction
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            const currentColor = getSnappedTileColor(column);
            uniqueColorsSeen.add(currentColor);
            previousSnappedColor = currentColor;
            console.log(`USER_WHEEL_EVENT [${side.toUpperCase()}]`, {
                timestamp: new Date().toISOString(),
                currentColor: currentColor,
                deltaY: e.deltaY
            });
        }
        e.stopPropagation();
    }, { passive: false });
    
    // Detect real user touch interaction
    column.addEventListener('touchmove', (e) => {
        // This is a real user interaction
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            const currentColor = getSnappedTileColor(column);
            uniqueColorsSeen.add(currentColor);
            previousSnappedColor = currentColor;
            console.log(`USER_TOUCH_EVENT [${side.toUpperCase()}]`, {
                timestamp: new Date().toISOString(),
                currentColor: currentColor
            });
        }
    }, { passive: true });
}

// Prevent page scrolling with mouse wheel when not over a column
document.addEventListener('wheel', (e) => {
    const target = e.target;
    const isInColumn = target.closest('.column-container');
    
    if (!isInColumn) {
        e.preventDefault();
    }
}, { passive: false });

// ==================
// CENTRALIZED COLOR SELECTION FUNCTIONS
// ==================

// Function to calculate the selected color index from scroll position
// Returns an index 0-5 (wrapping for infinite scroll)
function getSelectedColorIndex(column) {
    const itemHeight = window.innerHeight / 6;
    const scrollTop = column.scrollTop;
    
    // Calculate which tile is currently at the top (snapped)
    const tileIndex = Math.round(scrollTop / itemHeight);
    
    // Map to color index (0-5) since colors repeat every 6 items
    // Handle negative indices (shouldn't happen, but safety check)
    const colorIndex = ((tileIndex % colors.length) + colors.length) % colors.length;
    
    return colorIndex;
}

// Function to get the color value from an index
function getColorFromIndex(index) {
    // Ensure index is in valid range (0-5)
    const safeIndex = ((index % colors.length) + colors.length) % colors.length;
    return colors[safeIndex];
}

// Current active page ID (based on color combination)
let activePageId = null;

// Function to generate a stable page ID from color indices
function getPageIdFromColors(leftIndex, rightIndex) {
    // Create a stable key: ${leftIndex}-${rightIndex}
    return `${leftIndex}-${rightIndex}`;
}

// ==================
// CANVAS TEXT BOX CONTENT MAPPING
// ==================
// Map page IDs to text content for the canvas text box
// Page ID format: "leftIndex-rightIndex" (e.g., "0-1" for shape-sound combination)
// Parameter indices: 0=shape, 1=sound, 2=letter, 3=number, 4=emotion, 5=color
const canvasTextBoxContent = {
    // Default/fallback text (can be customized per page)
    'default': 'Canvas text content',
    
    // 1. Sound + Color (סאונד + צבע) - sound=1, color=5
    '1-5': '"For me, music is a visual explosion. Every instrument has its own color. I was listening to a jazz piece yesterday and the trumpet was a vibrant, piercing yellow, almost like a laser beam. The bass guitar, on the other hand, was a deep, velvet purple that filled the bottom of my vision. When they played together, the colors didn\'t mix like paint, they layered on top of each other like transparent sheets of colored glass."',
    '5-1': '"For me, music is a visual explosion. Every instrument has its own color. I was listening to a jazz piece yesterday and the trumpet was a vibrant, piercing yellow, almost like a laser beam. The bass guitar, on the other hand, was a deep, velvet purple that filled the bottom of my vision. When they played together, the colors didn\'t mix like paint, they layered on top of each other like transparent sheets of colored glass."',
    
    // 2. Sound + Shape (סאונד + צורה) - sound=1, shape=0
    '1-0': '"I don\'t just hear sounds, I see their geometry. A sharp, sudden noise like a glass breaking looks like a jagged, silver zig-zag that flashes for a split second. A constant hum, like a refrigerator, looks like a long, translucent cylinder stretching out into the distance. People\'s voices are the most interesting; some are perfectly round bubbles, while others are like thin, vibrating wires."',
    '0-1': '"I don\'t just hear sounds, I see their geometry. A sharp, sudden noise like a glass breaking looks like a jagged, silver zig-zag that flashes for a split second. A constant hum, like a refrigerator, looks like a long, translucent cylinder stretching out into the distance. People\'s voices are the most interesting; some are perfectly round bubbles, while others are like thin, vibrating wires."',
    
    // 3. Sound + Emotion (סאונד + רגש) - sound=1, emotion=4
    '1-4': '"Certain sounds trigger intense emotional responses that have nothing to do with the context. The sound of a cello makes me feel a sense of overwhelming security and warmth, like being wrapped in a heavy blanket. Conversely, the sound of crinkling plastic causes a feeling of sudden, irrational anger and panic. It\'s not just that I dislike the sound; it\'s an immediate emotional shift that I can\'t control."',
    '4-1': '"Certain sounds trigger intense emotional responses that have nothing to do with the context. The sound of a cello makes me feel a sense of overwhelming security and warmth, like being wrapped in a heavy blanket. Conversely, the sound of crinkling plastic causes a feeling of sudden, irrational anger and panic. It\'s not just that I dislike the sound; it\'s an immediate emotional shift that I can\'t control."',
    
    // 4. Letter + Color (אותיות + צבע) - letter=2, color=5
    '2-5': '"I\'ve always seen letters in color. To me, it\'s impossible to think of the letter \'A\' without seeing it as a bright, primary red. \'B\' is a royal blue, and \'C\' is a sunny yellow. When I read a book, the pages aren\'t black and white; they are a flickering rainbow of colors. If a word is written in the \'wrong\' color on a sign, it feels physically uncomfortable to look at, like a spelling error that hurts my eyes."',
    '5-2': '"I\'ve always seen letters in color. To me, it\'s impossible to think of the letter \'A\' without seeing it as a bright, primary red. \'B\' is a royal blue, and \'C\' is a sunny yellow. When I read a book, the pages aren\'t black and white; they are a flickering rainbow of colors. If a word is written in the \'wrong\' color on a sign, it feels physically uncomfortable to look at, like a spelling error that hurts my eyes."',
    
    // 5. Letter + Emotion (אותיות + רגש) - letter=2, emotion=4
    '2-4': '"Letters have very distinct personalities to me. \'H\' is a very dependable, stoic male figure who doesn\'t say much but is always there. \'S\' is a flamboyant, slightly gossipy woman who likes to be the center of attention. When I see words, it\'s like watching a social interaction. For example, the word \'The\' looks like a very serious conversation between a leader (T) and two followers (h and e)."',
    '4-2': '"Letters have very distinct personalities to me. \'H\' is a very dependable, stoic male figure who doesn\'t say much but is always there. \'S\' is a flamboyant, slightly gossipy woman who likes to be the center of attention. When I see words, it\'s like watching a social interaction. For example, the word \'The\' looks like a very serious conversation between a leader (T) and two followers (h and e)."',
    
    // 6. Number + Color (ספרות + צבע) - number=3, color=5
    '3-5': '"Numbers have had colors since I was a toddler. 1 is white, 2 is a pale yellow, 3 is pink, 4 is a dark blood-red, and 5 is grass green. Math was always easy for me because I didn\'t see equations; I saw color patterns. Adding 2 and 3 was like watching yellow and pink come together to create the green of 5. It makes the world of data feel very aesthetic and organized."',
    '5-3': '"Numbers have had colors since I was a toddler. 1 is white, 2 is a pale yellow, 3 is pink, 4 is a dark blood-red, and 5 is grass green. Math was always easy for me because I didn\'t see equations; I saw color patterns. Adding 2 and 3 was like watching yellow and pink come together to create the green of 5. It makes the world of data feel very aesthetic and organized."',
    
    // 7. Number + Emotion (ספרות + רגש) - number=3, emotion=4
    '3-4': '"Numbers have social lives. 1 is very lonely and a bit of an elitist. 2 is kind and motherly, always looking after 1. 3 is a bratty child, and 4 is a grumpy old man who is tired of 3\'s antics. 7 is the \'cool\' teenager of the group, very aloof and mysterious. When I see a phone number, I don\'t just see digits; I see a whole family dynamic playing out in a row."',
    
    // 8. Number + Shape (ספרות + צורה) - number=3, shape=0
    '3-0': '"When I think of numbers, they exist on a physical path in space around me. Numbers 1 through 20 go in a straight line directly in front of my chest. At 21, the line takes a sharp 90-degree turn to the left and starts climbing upwards until it reaches 100. From 100 onwards, the numbers disappear into a vast spiral that goes behind my head. I have to physically \'look\' to the left in my mind to remember dates or do mental math."',
    '0-3': '"When I think of numbers, they exist on a physical path in space around me. Numbers 1 through 20 go in a straight line directly in front of my chest. At 21, the line takes a sharp 90-degree turn to the left and starts climbing upwards until it reaches 100. From 100 onwards, the numbers disappear into a vast spiral that goes behind my head. I have to physically \'look\' to the left in my mind to remember dates or do mental math."',
    
    // 9. Shape + Color (צורה + צבע) - shape=0, color=5
    '0-5': '"Shapes have inherent colors that can never be changed. A circle is always a deep, ocean blue. A square is a solid, opaque orange. Triangles are always a sharp, acidic lemon yellow. When I see a black-and-white drawing of geometric patterns, my brain automatically fills them in with these colors. A star shape is especially vivid; it\'s always a shimmering metallic silver with a hint of violet at the edges."',
    '5-0': '"Shapes have inherent colors that can never be changed. A circle is always a deep, ocean blue. A square is a solid, opaque orange. Triangles are always a sharp, acidic lemon yellow. When I see a black-and-white drawing of geometric patterns, my brain automatically fills them in with these colors. A star shape is especially vivid; it\'s always a shimmering metallic silver with a hint of violet at the edges."',
    
    // 10. Shape + Emotion (צורה + רגש) - shape=0, emotion=4
    '0-4': '"I have a strange reaction to certain shapes. Perfectly smooth, rounded surfaces give me a feeling of immense relief and calm. However, seeing a cluster of small, irregular triangles or jagged shapes makes me feel extremely anxious and \'itchy\' inside. It\'s a visceral emotional reaction to the geometry of objects. Looking at a clear, rectangular building makes me feel organized and \'correct,\' while complex, messy shapes make me feel depressed."',
    '4-0': '"I have a strange reaction to certain shapes. Perfectly smooth, rounded surfaces give me a feeling of immense relief and calm. However, seeing a cluster of small, irregular triangles or jagged shapes makes me feel extremely anxious and \'itchy\' inside. It\'s a visceral emotional reaction to the geometry of objects. Looking at a clear, rectangular building makes me feel organized and \'correct,\' while complex, messy shapes make me feel depressed."',
    
    // 11. Letter + Shape (אותיות + צורה) - letter=2, shape=0
    '2-0': '"Letters don\'t appear to me as signs; they appear as forms. Each letter has a physical presence of its own, independent of sound or meaning. Some feel narrow and tense, others wide and relaxed. The letter W feels sharp to me, pointed and angular, while G is broader and rounded, heavier in its curve. When I read, my attention moves from one form to another, sensing their edges and weight."',
    '0-2': '"Letters don\'t appear to me as signs; they appear as forms. Each letter has a physical presence of its own, independent of sound or meaning. Some feel narrow and tense, others wide and relaxed. The letter W feels sharp to me, pointed and angular, while G is broader and rounded, heavier in its curve. When I read, my attention moves from one form to another, sensing their edges and weight."',
    
    // 12. Color + Emotion (צבע + רגש) - color=5, emotion=4
    '5-4': '"Colors are the primary way I experience emotions. If I\'m feeling happy, the world actually looks brighter, as if someone turned up the saturation, and I see flashes of gold in my peripheral vision. Grief is not just a feeling; it\'s a heavy, oppressive charcoal grey that seems to coat everything I look at. When I\'m angry, I see sparks of a very specific, dirty orange-red that clouds my vision."',
    '4-5': '"Colors are the primary way I experience emotions. If I\'m feeling happy, the world actually looks brighter, as if someone turned up the saturation, and I see flashes of gold in my peripheral vision. Grief is not just a feeling; it\'s a heavy, oppressive charcoal grey that seems to coat everything I look at. When I\'m angry, I see sparks of a very specific, dirty orange-red that clouds my vision."',
    
    // 13. Letter + Number (אותיות + ספרות) - letter=2, number=3
    '2-3': '"My mind organizes all sequences together. Letters and numbers share the same physical \'track\' in my head. The letters A-Z occupy the first half of a great circle, and as soon as Z ends, the number 1 starts and continues the circle. They are made of the same \'material\' in my mind. It\'s like they belong to the same family of objects, arranged on a continuous, rotating ring."',
    '3-2': '"My mind organizes all sequences together. Letters and numbers share the same physical \'track\' in my head. The letters A-Z occupy the first half of a great circle, and as soon as Z ends, the number 1 starts and continues the circle. They are made of the same \'material\' in my mind. It\'s like they belong to the same family of objects, arranged on a continuous, rotating ring."',
    
    // 14. Sound + Letter (סאונד + אותיות) - sound=1, letter=2
    '1-2': '"When I hear people speak, I see the letters of the words they are saying scrolling across a screen in my mind, like closed captions. But the letters are influenced by the sound; if someone has a gravelly, deep voice, the letters look blocky and made of stone. If someone has a high-pitched, melodic voice, the letters appear in a flowing, cursive script that glows slightly."',
    '2-1': '"When I hear people speak, I see the letters of the words they are saying scrolling across a screen in my mind, like closed captions. But the letters are influenced by the sound; if someone has a gravelly, deep voice, the letters look blocky and made of stone. If someone has a high-pitched, melodic voice, the letters appear in a flowing, cursive script that glows slightly."',
    
    // 15. Emotion + Number (רגש + ספרות) - emotion=4, number=3
    '4-3': '"Whenever I feel a strong emotion, a number pops into my head. Pure joy is always the number 7. Anxiety is a constant, flickering 9. When I\'m bored, I feel like the number 0 is expanding to fill the room. It\'s not that I\'m counting, it\'s that the feeling itself has a numerical value. I can describe my day to my partner by saying \'I feel like a 4 today,\' and for me, that perfectly describes a specific type of dull, heavy sadness."'
};

// Function to get text content for a specific page ID
function getCanvasTextBoxContent(pageId) {
    // Return page-specific content if available, otherwise use default
    return canvasTextBoxContent[pageId] || canvasTextBoxContent['default'] || '';
}

// Canvas context for measuring text (created once, reused)
let textMeasureCanvas = null;
let textMeasureCtx = null;

// Initialize canvas for text measurement
function initTextMeasureCanvas() {
    if (!textMeasureCanvas) {
        textMeasureCanvas = document.createElement('canvas');
        textMeasureCtx = textMeasureCanvas.getContext('2d');
        // Set font to match canvas-text-box styling: Helvetica, bold, 29px
        textMeasureCtx.font = 'bold 29px Helvetica, sans-serif';
    }
}

// Helper function to count words in a line (excluding spaces)
function countWords(line) {
    return line.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to get words from a line
function getWordsFromLine(line) {
    return line.trim().split(/\s+/).filter(word => word.length > 0);
}

// Manual line wrapping algorithm using canvas measurement
function wrapTextIntoLines(text, maxWidth) {
    if (!text || text.length === 0) return [];
    
    // Ensure canvas is initialized
    initTextMeasureCanvas();
    
    // Set font (in case it changed or wasn't set)
    textMeasureCtx.font = 'bold 29px Helvetica, sans-serif';
    
    // Split text into words (preserve spaces)
    const words = text.split(/(\s+)/); // Split but keep spaces
    const lines = [];
    let currentLine = '';
    
    // First pass: wrap based on width
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + word;
        const testWidth = textMeasureCtx.measureText(testLine).width;
        
        // Check if adding this word would exceed max width
        // If currentLine has content (after trimming), wrap to new line
        // If currentLine is empty/only spaces, we must add the word even if it exceeds (single long word)
        const hasContent = currentLine.trim().length > 0;
        
        if (testWidth > maxWidth && hasContent) {
            // Current line is full, start a new line
            // Store trimmed version (trailing spaces removed for display)
            lines.push(currentLine.trim());
            // Start new line with current word (could be a space or actual word)
            currentLine = word;
        } else {
            // Add word to current line (even if it exceeds maxWidth for single long words)
            currentLine = testLine;
        }
    }
    
    // Add the last line if it has content (trimmed for display)
    const lastLine = currentLine.trim();
    if (lastLine.length > 0) {
        lines.push(lastLine);
    }
    
    // Second pass: enforce minimum 3 words per line rule
    // Process from the end backwards to avoid breaking earlier lines
    for (let i = lines.length - 1; i > 0; i--) {
        const currentLineWords = countWords(lines[i]);
        
        // If current line has fewer than 3 words, move words from previous line
        if (currentLineWords < 3) {
            const prevLineWords = getWordsFromLine(lines[i - 1]);
            const wordsNeeded = 3 - currentLineWords;
            
            // Only move words if previous line has enough words to spare
            // (we want to keep at least 3 words in previous line if possible)
            if (prevLineWords.length > 3) {
                // Move words from previous line to current line
                const wordsToMove = Math.min(wordsNeeded, prevLineWords.length - 3);
                const wordsToKeep = prevLineWords.slice(0, prevLineWords.length - wordsToMove);
                const wordsToAdd = prevLineWords.slice(prevLineWords.length - wordsToMove);
                
                // Update previous line
                lines[i - 1] = wordsToKeep.join(' ');
                
                // Update current line (prepend moved words)
                const currentWords = getWordsFromLine(lines[i]);
                lines[i] = [...wordsToAdd, ...currentWords].join(' ');
            } else if (prevLineWords.length >= wordsNeeded) {
                // Previous line has exactly 3 words or just enough, but we need to move some
                // This might leave previous line with less than 3, but we'll handle it in next iteration
                const wordsToMove = wordsNeeded;
                const wordsToKeep = prevLineWords.slice(0, prevLineWords.length - wordsToMove);
                const wordsToAdd = prevLineWords.slice(prevLineWords.length - wordsToMove);
                
                // Update previous line
                lines[i - 1] = wordsToKeep.join(' ');
                
                // Update current line (prepend moved words)
                const currentWords = getWordsFromLine(lines[i]);
                lines[i] = [...wordsToAdd, ...currentWords].join(' ');
            }
            // If previous line doesn't have enough words, we can't fix it
            // (this handles edge cases like very short text)
        }
    }
    
    // Note: After word adjustments, some lines may exceed maxWidth
    // This is acceptable - the 3-word minimum rule takes priority over width constraints
    return lines;
}

// Render text with per-line grey background blocks
function renderTextWithLineBackgrounds(textBox, text, maxWidth = 1035, backgroundColor = '#E0E0E0') {
    if (!textBox) return;
    
    // Clear existing content
    textBox.innerHTML = '';
    
    if (!text || text.length === 0) return;
    
    // Use provided maxWidth or default to 1035px
    
    // Wrap text into lines
    const lines = wrapTextIntoLines(text, maxWidth);
    
    // Create container for all lines
    const lineContainer = document.createElement('div');
    lineContainer.style.position = 'relative';
    lineContainer.style.width = '100%';
    
    // Line height: 29px (as specified)
    const lineHeight = 29;
    // Background rectangle height: 35px (as specified)
    const bgHeight = 35;
    
    // Render each line
    lines.forEach((lineText, index) => {
        // Measure the actual width of this line
        initTextMeasureCanvas();
        textMeasureCtx.font = 'bold 29px Helvetica, sans-serif';
        const lineWidth = textMeasureCtx.measureText(lineText).width;
        
        // Create a row container for this line
        const lineRow = document.createElement('div');
        lineRow.style.position = 'relative';
        lineRow.style.width = '100%';
        lineRow.style.height = `${lineHeight}px`;
        lineRow.style.display = 'flex';
        lineRow.style.alignItems = 'center'; // Vertically center content
        
        // Check if this is the last line - extend background by 2px for ABOUT overlay
        const isLastLine = index === lines.length - 1;
        const extendedBgHeight = isLastLine && backgroundColor === '#2C2C2C' ? bgHeight + 2 : bgHeight;
        
        // Create background block
        const bgBlock = document.createElement('div');
        bgBlock.className = 'canvas-line-bg';
        bgBlock.style.position = 'absolute';
        bgBlock.style.left = '-35px'; // Start 35px before the text
        bgBlock.style.width = `${lineWidth + 35}px`; // 35px left + lineWidth (ends exactly at text end)
        bgBlock.style.height = `${extendedBgHeight}px`;
        bgBlock.style.backgroundColor = backgroundColor; // Use provided background color or default to light grey
        bgBlock.style.zIndex = '-1'; // Behind text
        bgBlock.style.pointerEvents = 'none'; // Don't interfere with text
        
        // Vertically center the background block on the line
        // Line center is at lineHeight/2, background center should be at extendedBgHeight/2
        // So top offset = (lineHeight - extendedBgHeight) / 2
        const topOffset = (lineHeight - extendedBgHeight) / 2;
        bgBlock.style.top = `${topOffset}px`;
        
        // Create text element
        const textElement = document.createElement('span');
        textElement.textContent = lineText;
        textElement.style.fontFamily = 'Helvetica, sans-serif';
        textElement.style.fontSize = '29px';
        textElement.style.fontWeight = 'bold';
        textElement.style.lineHeight = '29px';
        // Color is inherited from parent container CSS
        textElement.style.whiteSpace = 'nowrap'; // Prevent text from wrapping
        
        // Add background and text to row
        lineRow.appendChild(bgBlock);
        lineRow.appendChild(textElement);
        
        // Add row to container
        lineContainer.appendChild(lineRow);
    });
    
    // Add container to text box
    textBox.appendChild(lineContainer);
}

// Function to update canvas text box content based on active page
function updateCanvasTextBox(pageId) {
    const textBox = document.getElementById('canvas-text-box');
    if (!textBox) return;
    
    const content = getCanvasTextBoxContent(pageId);
    
    // Render text with per-line grey backgrounds
    renderTextWithLineBackgrounds(textBox, content);
    
    // DEBUG: Log text box update
    console.log('CANVAS_TEXT_BOX_UPDATE', {
        pageId: pageId,
        content: content,
        timestamp: new Date().toISOString()
    });
}

// Function to wrap text letters in spans for hover interaction
// ==================
// LETTER → SHAPE MAPPING
// ==================
// Mapping object: uppercase letter (A-Z) → shape specification
const LETTER_SHAPES = {
    'A': { type: 'triangle', points: '22.5,5 40,40 5,40' },
    'B': { type: 'roundedRect', width: 35, height: 35, rx: 8 },
    'C': { type: 'polygon', points: '22.5,3 27.5,13.5 39,13.5 30,19.5 34.5,30.5 22.5,24.5 10.5,30.5 15,19.5 6,13.5 17.5,13.5' },
    'D': { type: 'diamond', points: '22.5,5 40,22.5 22.5,40 5,22.5' },
    'E': { type: 'ellipse', rx: 18, ry: 12, strokeWidth: 5 },
    'F': { type: 'triangle', points: '5,5 40,5 5,40' },
    'G': { type: 'roundedRect', width: 38, height: 30, rx: 5, strokeWidth: 5 },
    'H': { type: 'rect', width: 8, height: 35 },
    'I': { type: 'path', d: 'M 22.5,5 Q 28,11.25 22.5,17.5 Q 17,23.75 22.5,30 Q 28,36.25 22.5,40', strokeWidth: 5 },
    'J': { type: 'arc', startAngle: 90, endAngle: 270, largeArc: 0 },
    'K': { type: 'polygon', points: '5,5 5,40 22.5,22.5 40,5 40,15' },
    'L': { type: 'polygon', points: '22.5,5 5,40 40,40', strokeWidth: 5 },
    'M': { type: 'polygon', points: '5,40 15,10 22.5,25 30,10 40,40' },
    'N': { type: 'polygon', points: '5,40 5,5 35,40 35,5' },
    'O': { type: 'circle', cx: 22.5, cy: 22.5, r: 18 },
    'P': { type: 'roundedRect', width: 12, height: 35, rx: 6 },
    'Q': { type: 'circle', cx: 22.5, cy: 22.5, r: 15 },
    'R': { type: 'polygon', points: '5,5 5,40 25,40 35,25 25,5', strokeWidth: 5 },
    'S': { type: 'arc', startAngle: 180, endAngle: 0, largeArc: 1 },
    'T': { type: 'polygon', points: '5,5 40,5 22.5,5 22.5,40' },
    'U': { type: 'arc', startAngle: 180, endAngle: 360, largeArc: 0 },
    'V': { type: 'triangle', points: '5,5 22.5,40 40,5' },
    'W': { type: 'polygon', points: '5,5 12.5,40 22.5,20 32.5,40 40,5' },
    'X': { type: 'polygon', points: '5,5 40,40 22.5,22.5 40,5 5,40' },
    'Y': { type: 'polygon', points: '22.5,5 15,20 5,20 22.5,40 40,20 30,20' },
    'Z': { type: 'polygon', points: '5,5 40,5 5,40 40,40' }
};

// ==================
// SHAPE RENDERER
// ==================
// Single reusable function to render any shape spec as SVG
function renderShape(shapeSpec, color = '#2C2C2C') {
    if (!shapeSpec) return null;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 45 45');
    svg.setAttribute('width', '45');
    svg.setAttribute('height', '45');
    svg.setAttribute('class', 'letter-shape');
    // CSS handles positioning, opacity, transform, and transitions
    
    const shape = document.createElementNS('http://www.w3.org/2000/svg', shapeSpec.type === 'circle' ? 'circle' :
        shapeSpec.type === 'ellipse' ? 'ellipse' :
        shapeSpec.type === 'rect' || shapeSpec.type === 'roundedRect' ? 'rect' :
        shapeSpec.type === 'line' ? 'line' :
        shapeSpec.type === 'polygon' ? 'polygon' :
        shapeSpec.type === 'arc' ? 'path' :
        shapeSpec.type === 'path' ? 'path' : 'polygon');
    
    // Check if shape should use stroke instead of fill
    if (shapeSpec.strokeWidth) {
        shape.setAttribute('fill', 'none');
        shape.setAttribute('stroke', color);
        shape.setAttribute('stroke-width', shapeSpec.strokeWidth.toString());
        // Add rounded corners for polygons and triangles when using stroke
        if (shapeSpec.type === 'polygon' || shapeSpec.type === 'triangle' || shapeSpec.type === 'diamond') {
            shape.setAttribute('stroke-linejoin', 'round');
            shape.setAttribute('stroke-linecap', 'round');
        }
    } else {
        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', 'none');
    }
    
    // Render based on shape type
    switch (shapeSpec.type) {
        case 'circle':
            shape.setAttribute('cx', shapeSpec.cx || '22.5');
            shape.setAttribute('cy', shapeSpec.cy || '22.5');
            shape.setAttribute('r', shapeSpec.r || '18');
            break;
            
        case 'ellipse':
            shape.setAttribute('cx', '22.5');
            shape.setAttribute('cy', '22.5');
            shape.setAttribute('rx', shapeSpec.rx || '18');
            shape.setAttribute('ry', shapeSpec.ry || '12');
            break;
            
        case 'rect':
            const rectX = (45 - shapeSpec.width) / 2;
            const rectY = (45 - shapeSpec.height) / 2;
            shape.setAttribute('x', rectX.toString());
            shape.setAttribute('y', rectY.toString());
            shape.setAttribute('width', shapeSpec.width.toString());
            shape.setAttribute('height', shapeSpec.height.toString());
            break;
            
        case 'roundedRect':
            const roundedX = (45 - shapeSpec.width) / 2;
            const roundedY = (45 - shapeSpec.height) / 2;
            shape.setAttribute('x', roundedX.toString());
            shape.setAttribute('y', roundedY.toString());
            shape.setAttribute('width', shapeSpec.width.toString());
            shape.setAttribute('height', shapeSpec.height.toString());
            shape.setAttribute('rx', shapeSpec.rx.toString());
            // If ry is not specified, use rx value (SVG standard behavior)
            shape.setAttribute('ry', (shapeSpec.ry || shapeSpec.rx).toString());
            break;
            
        case 'triangle':
        case 'diamond':
        case 'polygon':
            shape.setAttribute('points', shapeSpec.points);
            break;
            
        case 'line':
            shape.setAttribute('x1', shapeSpec.x1.toString());
            shape.setAttribute('y1', shapeSpec.y1.toString());
            shape.setAttribute('x2', shapeSpec.x2.toString());
            shape.setAttribute('y2', shapeSpec.y2.toString());
            shape.setAttribute('stroke', color);
            shape.setAttribute('stroke-width', (shapeSpec.strokeWidth || '3').toString());
            shape.setAttribute('fill', 'none');
            break;
            
        case 'path':
            // Direct path specification (for wavy lines, custom paths, etc.)
            shape.setAttribute('d', shapeSpec.d);
            shape.setAttribute('stroke', color);
            shape.setAttribute('stroke-width', (shapeSpec.strokeWidth || '3').toString());
            shape.setAttribute('fill', 'none');
            break;
            
        case 'arc':
            // Convert arc angles to SVG path
            const centerX = 22.5;
            const centerY = 22.5;
            const radius = 18;
            const startRad = (shapeSpec.startAngle * Math.PI) / 180;
            const endRad = (shapeSpec.endAngle * Math.PI) / 180;
            const startX = centerX + radius * Math.cos(startRad);
            const startY = centerY + radius * Math.sin(startRad);
            const endX = centerX + radius * Math.cos(endRad);
            const endY = centerY + radius * Math.sin(endRad);
            const largeArc = shapeSpec.largeArc || 0;
            const sweep = endRad > startRad ? 1 : 0;
            const pathData = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY} Z`;
            shape.setAttribute('d', pathData);
            break;
            
        default:
            // Fallback to circle
            shape.setAttribute('cx', '22.5');
            shape.setAttribute('cy', '22.5');
            shape.setAttribute('r', '18');
    }
    
    svg.appendChild(shape);
    return svg;
}

function initializeLetterHoverInteraction() {
    const letterSoundTextBox = document.getElementById('canvas-text-box-letter-sound');
    if (!letterSoundTextBox) {
        console.log('textBox: not found');
        return;
    }
    
    console.log('textBox:', letterSoundTextBox);
    
    const paragraph = letterSoundTextBox.querySelector('p');
    if (!paragraph) {
        console.log('paragraph: not found');
        return;
    }
    
    // Check if already initialized (has letter spans)
    if (paragraph.querySelector('.letter-span')) {
        console.log('Already initialized, skipping');
        return;
    }
    
    // Get the text content - use textContent as source of truth
    const originalText = paragraph.textContent;
    console.log('originalText length:', originalText.length);
    
    // Split text into individual characters and wrap each in a span
    // Define punctuation marks that should remain static (no animation, no shape)
    const punctuationMarks = /[.,;:!?'"()[\]{}—–\-…]/;
    
    let lastProcessedIndex = -1;
    const wrappedText = originalText.split('').map((char, i) => {
        lastProcessedIndex = i;
        
        // Handle spaces, punctuation marks, and special characters
        if (char === ' ') {
            return '<span class="letter-span space" data-letter=" "> </span>';
        } else if (char === '\n') {
            return '<br>';
        } else if (punctuationMarks.test(char)) {
            // Punctuation marks remain static - no animation, no shape
            const escapedChar = char
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            return `<span class="letter-span space" data-letter="${escapedChar}">${escapedChar}</span>`;
        } else {
            // Escape HTML special characters
            const escapedChar = char
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            return `<span class="letter-span" data-letter="${escapedChar}">${escapedChar}</span>`;
        }
    }).join('');
    
    console.log('lastProcessed:', { index: lastProcessedIndex, char: originalText[lastProcessedIndex] });
    
    // Replace paragraph content with wrapped letters
    paragraph.innerHTML = wrappedText;
    
    // Count created spans - verify we wrapped all characters
    const allSpans = paragraph.querySelectorAll('.letter-span');
    console.log('chars created:', allSpans.length);
    
    // Verify we processed all characters (accounting for spaces and newlines)
    const nonSpaceChars = originalText.split('').filter(c => c !== ' ' && c !== '\n').length;
    console.log('expected non-space chars:', nonSpaceChars);
    console.log('actual spans created:', allSpans.length);
    
    // Inject SVG shapes for each letter - MUST use querySelectorAll to get ALL spans
    const letterSpans = paragraph.querySelectorAll('.letter-span:not(.space)');
    console.log('letter spans found (non-space):', letterSpans.length);
    
    let shapesInjected = 0;
    let lastInjectedIndex = -1;
    
    // Process ALL spans - use for loop to ensure we don't stop early
    for (let index = 0; index < letterSpans.length; index++) {
        const span = letterSpans[index];
        
        try {
            const letter = span.getAttribute('data-letter');
            if (!letter) {
                console.warn('Span at index', index, 'has no data-letter attribute');
                continue; // Skip this span but continue with others
            }
            
            const upperLetter = letter.toUpperCase();
            const shapeSpec = LETTER_SHAPES[upperLetter];
            
            // Debug specific letters that are having issues
            if (upperLetter === 'P' || upperLetter === 'G') {
                console.log('Processing letter:', upperLetter, { 
                    hasShapeSpec: !!shapeSpec, 
                    shapeSpec: shapeSpec,
                    spanIndex: index 
                });
            }
            
            // Create and inject SVG shape (or fallback to circle) with gray color for shape & letter canvas (same as line-bg color)
            const svg = shapeSpec ? renderShape(shapeSpec, '#E0E0E0') : renderShape({ type: 'circle', cx: 22.5, cy: 22.5, r: 18 }, '#E0E0E0');
            if (svg) {
                span.appendChild(svg);
                shapesInjected++;
                lastInjectedIndex = index;
                
                // Debug specific letters after injection
                if (upperLetter === 'P' || upperLetter === 'G') {
                    const injectedShape = span.querySelector('.letter-shape, svg');
                    console.log('After injection for', upperLetter, ':', {
                        svgCreated: !!svg,
                        svgInSpan: !!injectedShape,
                        svgHTML: injectedShape ? injectedShape.outerHTML.substring(0, 100) : 'none'
                    });
                }
                
                // Log every 50th character to track progress
                if (index % 50 === 0 || index === letterSpans.length - 1) {
                    console.log('Progress:', { index, letter, total: letterSpans.length });
                }
            } else {
                console.warn('Failed to create SVG for letter at index', index, ':', letter);
                if (upperLetter === 'P' || upperLetter === 'G') {
                    console.error('SVG creation failed for', upperLetter, 'with shapeSpec:', shapeSpec);
                }
            }
        } catch (error) {
            console.error('Error injecting shape at index', index, ':', error);
            // Continue processing other spans even if one fails
        }
    }
    
    console.log('shapes injected:', shapesInjected);
    console.log('last injected index:', lastInjectedIndex);
    
    // Verify final count - check for SVG elements
    const finalShapes = paragraph.querySelectorAll('.letter-span .letter-shape, .letter-span svg');
    console.log('final shapes count:', finalShapes.length);
    
    // Additional verification: check if all letter spans have shapes
    const spansWithoutShapes = Array.from(letterSpans).filter(span => !span.querySelector('.letter-shape, svg'));
    if (spansWithoutShapes.length > 0) {
        console.warn('Spans without shapes:', spansWithoutShapes.length);
        const problematicSpans = spansWithoutShapes.slice(0, 10).map(s => {
            const letter = s.getAttribute('data-letter');
            const upperLetter = letter ? letter.toUpperCase() : '?';
            return {
                letter: letter,
                upperLetter: upperLetter,
                text: s.textContent,
                hasShapeSpec: !!LETTER_SHAPES[upperLetter],
                shapeSpec: LETTER_SHAPES[upperLetter]
            };
        });
        console.warn('Spans without shapes (details):', problematicSpans);
        
        // Try to inject shapes for spans that are missing them
        problematicSpans.forEach((info, idx) => {
            const span = spansWithoutShapes[idx];
            if (span && info.hasShapeSpec) {
                console.log('Attempting to inject shape for', info.upperLetter);
                try {
                    const svg = renderShape(info.shapeSpec, '#E0E0E0');
                    if (svg) {
                        span.appendChild(svg);
                        console.log('Successfully injected shape for', info.upperLetter);
                    }
                } catch (error) {
                    console.error('Failed to inject shape for', info.upperLetter, ':', error);
                }
            }
        });
    }
    
    // Final verification: count shapes again after potential fixes
    const finalShapesAfterFix = paragraph.querySelectorAll('.letter-span .letter-shape, .letter-span svg');
    console.log('final shapes count (after fix):', finalShapesAfterFix.length);
    
    // Restructure: wrap each letter-span in a letter-slot container
    // Create static glyph for layout and sliding glyph inside mask
    const allLetterSpans = paragraph.querySelectorAll('.letter-span:not(.space)');
    allLetterSpans.forEach(span => {
        // Get the text content (exclude SVG by getting only text nodes)
        let textContent = '';
        for (let node of span.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                textContent += node.textContent;
            }
        }
        textContent = textContent.trim();
        
        // Get the shape (SVG)
        const shape = span.querySelector('.letter-shape, svg');
        
        // Create letter-slot container (natural size, no clipping)
        const slot = document.createElement('span');
        slot.className = 'letter-slot';
        slot.setAttribute('data-letter', span.getAttribute('data-letter') || '');
        
        // Create static glyph for normal layout (visible by default)
        const staticGlyph = document.createElement('span');
        staticGlyph.className = 'letter-glyph-static';
        staticGlyph.textContent = textContent;
        
        // Create letter-mask (45×45px clipping area, centered)
        const mask = document.createElement('span');
        mask.className = 'letter-mask';
        
        // Create sliding glyph inside mask (hidden by default, slides on hover)
        const slidingGlyph = document.createElement('span');
        slidingGlyph.className = 'letter-glyph';
        slidingGlyph.textContent = textContent;
        
        // Add sliding glyph to mask
        mask.appendChild(slidingGlyph);
        
        // Add shape to mask if it exists (inside mask, so it's clipped with the letter)
        // This ensures both letter and shape use the same mask for the continuous push transition
        if (shape) {
            mask.appendChild(shape);
        }
        
        // Add static glyph to slot (for layout)
        slot.appendChild(staticGlyph);
        
        // Add mask to slot
        slot.appendChild(mask);
        
        // Replace the original span with the new slot
        span.parentNode.replaceChild(slot, span);
    });
    
    // Add robust hover state management to prevent blank states during rapid hover
    const allSlots = paragraph.querySelectorAll('.letter-slot');
    allSlots.forEach(slot => {
        let hoverOutTimeout = null;
        let isHovered = false;
        
        // Mouse enter: immediately activate hover state, cancel any pending hover-out
        slot.addEventListener('mouseenter', () => {
            isHovered = true;
            
            // Cancel any pending hover-out timeout
            if (hoverOutTimeout) {
                clearTimeout(hoverOutTimeout);
                hoverOutTimeout = null;
            }
            
            // Remove hover-leaving class if present
            slot.classList.remove('hover-leaving');
            
            // Immediately add hover-active class to force hover-in state
            // This cancels any in-progress hover-out transitions
            slot.classList.add('hover-active');
        });
        
        // Mouse leave: start delayed hover-out sequence
        slot.addEventListener('mouseleave', () => {
            isHovered = false;
            
            // Cancel any existing timeout
            if (hoverOutTimeout) {
                clearTimeout(hoverOutTimeout);
            }
            
            // Wait for delay before starting hover-out animation
            // This allows the shape to stay visible during the pause
            hoverOutTimeout = setTimeout(() => {
                // Double-check we're still not hovered (user might have re-entered)
                if (!isHovered) {
                    // Add hover-leaving class to trigger push-up animation
                    slot.classList.add('hover-leaving');
                    
                    // Remove hover-active class to trigger hover-out transitions
                    slot.classList.remove('hover-active');
                    
                    // After animation completes, remove hover-leaving class so shape can return to default
                    setTimeout(() => {
                        if (!isHovered && !slot.classList.contains('hover-active')) {
                            slot.classList.remove('hover-leaving');
                        }
                    }, 315); // 105ms delay + 300ms animation = 315ms total (reduced by 30%)
                }
                hoverOutTimeout = null;
            }, 105); // 105ms delay (reduced by 30% from 150ms) matches CSS delay before hover-out transition starts
        });
    });
    
    // Debug: Log left offsets to identify alignment issues
    debugTextAlignment(letterSoundTextBox, paragraph);
}

// Debug function to log left offsets and identify alignment issues
function debugTextAlignment(container, paragraph) {
    if (!container || !paragraph) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerLeft = containerRect.left;
    
    // Get computed styles of the text container
    const containerStyles = window.getComputedStyle(container);
    const paragraphStyles = window.getComputedStyle(paragraph);
    
    // Get all letter spans
    const letterSpans = paragraph.querySelectorAll('.letter-span');
    if (letterSpans.length === 0) return;
    
    // Check computed styles of first few letter spans to verify inheritance
    const sampleSpanStyles = Array.from(letterSpans.slice(0, 3)).map(span => {
        const styles = window.getComputedStyle(span);
        return {
            letterSpacing: styles.letterSpacing,
            wordSpacing: styles.wordSpacing,
            display: styles.display,
            textAlign: styles.textAlign
        };
    });
    
    // Find first character of each line by checking Y positions
    const lineFirstChars = [];
    let lastTop = null;
    
    letterSpans.forEach((span, index) => {
        const rect = span.getBoundingClientRect();
        const currentTop = rect.top;
        
        // If this is the first span or top position changed, it's a new line
        if (lastTop === null || Math.abs(currentTop - lastTop) > 5) {
            lineFirstChars.push({
                index: index,
                char: span.textContent.trim() || span.textContent,
                left: rect.left,
                top: rect.top,
                offset: rect.left - containerLeft
            });
            lastTop = currentTop;
        }
    });
    
    // Log results with computed styles and alignment verification
    console.log('TEXT_ALIGNMENT_DEBUG', {
        // Computed styles of text container
        containerComputedStyles: {
            textAlign: containerStyles.textAlign,
            textJustify: containerStyles.textJustify || 'not supported',
            letterSpacing: containerStyles.letterSpacing,
            wordSpacing: containerStyles.wordSpacing,
            whiteSpace: containerStyles.whiteSpace,
            display: containerStyles.display,
            // Direct getComputedStyle values
            letterSpacingDirect: window.getComputedStyle(container).letterSpacing,
            wordSpacingDirect: window.getComputedStyle(container).wordSpacing
        },
        // Paragraph computed styles (the actual text element)
        paragraphComputedStyles: {
            textAlign: paragraphStyles.textAlign,
            textJustify: paragraphStyles.textJustify || 'not supported',
            letterSpacing: paragraphStyles.letterSpacing,
            wordSpacing: paragraphStyles.wordSpacing,
            whiteSpace: paragraphStyles.whiteSpace,
            display: paragraphStyles.display,
            // Direct getComputedStyle values
            letterSpacingDirect: window.getComputedStyle(paragraph).letterSpacing,
            wordSpacingDirect: window.getComputedStyle(paragraph).wordSpacing,
            textIndent: paragraphStyles.textIndent,
            paddingLeft: paragraphStyles.paddingLeft,
            marginLeft: paragraphStyles.marginLeft,
            transform: paragraphStyles.transform
        },
        // Sample letter span computed styles (to verify inheritance)
        sampleSpanStyles: sampleSpanStyles,
        // Container position info
        containerLeft: containerLeft,
        containerWidth: containerRect.width,
        // Line alignment info
        totalLines: lineFirstChars.length,
        firstCharOffset: lineFirstChars[0]?.offset || 0,
        lineOffsets: lineFirstChars.map(line => ({
            char: line.char,
            leftX: line.left,
            offset: line.offset,
            isAligned: Math.abs(line.offset - (lineFirstChars[0]?.offset || 0)) < 1
        })),
        allAligned: lineFirstChars.every(line => 
            Math.abs(line.offset - (lineFirstChars[0]?.offset || 0)) < 1
        )
    });
}

// Function to update visibility of SHAPE & LETTER text box
function updateLetterSoundTextBox(pageId) {
    const letterSoundTextBox = document.getElementById('canvas-text-box-letter-sound');
    if (!letterSoundTextBox) return;
    
    // Show text box only for SHAPE & LETTER pages (pageId "0-2" or "2-0")
    // Parameter indices: 0=shape, 1=sound, 2=letter, 3=number, 4=emotion, 5=color
    // So "0-2" = shape-letter, "2-0" = letter-shape
    const isShapeLetterPage = pageId === '0-2' || pageId === '2-0';
    
    if (isShapeLetterPage) {
        letterSoundTextBox.classList.add('visible');
        // Initialize letter hover interaction when text box becomes visible
        // Use a small delay to ensure the element is rendered
        setTimeout(() => {
            initializeLetterHoverInteraction();
        }, 50);
    } else {
        letterSoundTextBox.classList.remove('visible');
    }
}

// Function to update visibility of SOUND & SHAPE instruction text
function updateSoundShapeInstructionText(pageId) {
    const instructionText = document.getElementById('canvas-instruction-text');
    if (!instructionText) return;
    
    // Show instruction text only for SOUND & SHAPE pages (pageId "1-0" or "0-1")
    // Parameter indices: 0=shape, 1=sound, 2=letter, 3=number, 4=emotion, 5=color
    // So "1-0" = sound-shape, "0-1" = shape-sound
    const isSoundShapePage = pageId === '1-0' || pageId === '0-1';
    
    if (isSoundShapePage) {
        instructionText.classList.add('visible');
    } else {
        instructionText.classList.remove('visible');
    }
}

// Function to hide SOUND & SHAPE instruction text (called when user starts drawing)
function hideSoundShapeInstructionText() {
    const instructionText = document.getElementById('canvas-instruction-text');
    if (!instructionText) return;
    
    instructionText.classList.remove('visible');
}

// Function to re-render canvas text box (for resize/font load)
function rerenderCanvasTextBox() {
    const textBox = document.getElementById('canvas-text-box');
    if (!textBox) return;
    
    // Get current page content
    const content = getCanvasTextBoxContent(activePageId || 'default');
    
    // Re-render with updated measurements
    renderTextWithLineBackgrounds(textBox, content);
}

// Function to update the active page/canvas based on color selection
function updateActivePage(pageId, reason) {
    // DEBUG: Log page switch
    console.log('PAGE_SWITCH', {
        pageId: pageId,
        reason: reason,
        introPhase: introPhase,
        introCompleted: introCompleted,
        timestamp: new Date().toISOString()
    });
    
    // CRITICAL: Page switching should work after intro is completed
    // But we should still track the page state even during intro
    const previousPageId = activePageId;
    activePageId = pageId;
    
    // Update canvas text box content for the new page
    updateCanvasTextBox(pageId);
    
    // Update LETTER & SOUND text box visibility
    updateLetterSoundTextBox(pageId);
    
    // Update SOUND & SHAPE instruction text visibility
    updateSoundShapeInstructionText(pageId);
    
    // Update p5 sketch to use the new pageId for state storage
    if (p5Instance) {
        // Save current state before switching (if we had a previous page and p5 is ready)
        if (previousPageId !== null && previousPageId !== pageId && typeof p5Instance.saveState === 'function') {
            // Store the previous pageId temporarily so saveState can use it
            p5Instance._currentPageId = previousPageId;
            p5Instance.saveState();
        }
        
        // Update the current pageId in the p5 instance
        // The sketch's saveState/restoreState will use this pageId instead of cellId
        p5Instance._currentPageId = pageId;
        
        // Restore state for the new page (if it exists)
        if (typeof p5Instance.restoreState === 'function') {
            const restored = p5Instance.restoreState();
            // If no state was restored (new page), the canvas will be empty (which is correct)
            // The restoreState function handles image loading asynchronously, so it should redraw automatically
            // If we need to clear the canvas for a new page, restoreState should handle it
            // But since brushLayer is per-sketch, switching pages should show the correct state
        }
    }
    
    // Also update visibility based on colors (for orange+yellow combination)
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    updateVisibilityBasedOnColors(leftColor, rightColor);
}

// Function to update the word text based on current parameter combination
function updateWordText() {
    const wordTextElement = document.getElementById('word-text');
    if (!wordTextElement) return;
    
    // Get the words for the current indices
    const leftWord = colorWords[selectedLeftIndex];
    const rightWord = colorWords[selectedRightIndex];
    
    // Format: "SHAPE & COLOR" (uppercase, with " & " separator)
    const combinationText = `${leftWord} & ${rightWord}`;
    
    // Clear existing content
    wordTextElement.innerHTML = '';
    
    // Create a span for each character (including spaces and &)
    for (let i = 0; i < combinationText.length; i++) {
        const span = document.createElement('span');
        const char = combinationText[i];
        span.textContent = char;
        
        // Check if this is a space around "&"
        if (char === ' ') {
            const prevChar = i > 0 ? combinationText[i - 1] : '';
            const nextChar = i < combinationText.length - 1 ? combinationText[i + 1] : '';
            if (nextChar === '&' || prevChar === '&') {
                // This is a space before or after "&"
                span.className = 'word-letter word-space-around-ampersand';
            } else {
                span.className = 'word-letter';
            }
        } else {
            span.className = 'word-letter';
        }
        
        wordTextElement.appendChild(span);
    }
    
    // Add info marker [i] after the parameter text
    const infoMarker = document.createElement('span');
    infoMarker.className = 'parameter-info-marker';
    infoMarker.textContent = '[i]';
    wordTextElement.appendChild(infoMarker);
}

// Function to update selected indices from both columns
// This is the single source of truth update point
function updateSelectedIndices() {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) return;
    
    const newLeftIndex = getSelectedColorIndex(leftColumn);
    const newRightIndex = getSelectedColorIndex(rightColumn);
    
    // Only update if indices actually changed
    if (newLeftIndex !== selectedLeftIndex || newRightIndex !== selectedRightIndex) {
        const oldLeftIndex = selectedLeftIndex;
        const oldRightIndex = selectedRightIndex;
        
        selectedLeftIndex = newLeftIndex;
        selectedRightIndex = newRightIndex;
        
        const leftColor = getColorFromIndex(selectedLeftIndex);
        const rightColor = getColorFromIndex(selectedRightIndex);
        
        // Update word text with new combination
        updateWordText();
        
        // DEBUG: Log left scrollbar selection change
        if (newLeftIndex !== oldLeftIndex) {
            console.log('LEFT_SELECTED', {
                selectedLeftIndex: selectedLeftIndex,
                selectedLeftColor: leftColor,
                introPhase: introPhase,
                introCompleted: introCompleted,
                timestamp: new Date().toISOString()
            });
        }
        
        // DEBUG: Log right scrollbar selection change
        if (newRightIndex !== oldRightIndex) {
            console.log('RIGHT_SELECTED', {
                selectedRightIndex: selectedRightIndex,
                selectedRightColor: rightColor,
                introPhase: introPhase,
                introCompleted: introCompleted,
                timestamp: new Date().toISOString()
            });
        }
        
        // Generate page ID from color combination
        const pageId = getPageIdFromColors(selectedLeftIndex, selectedRightIndex);
        
        // Update active page (this switches the canvas/page)
        // CRITICAL: Page switching should work even during intro, but only after intro is completed
        // However, we should still update the page state so it's ready when intro completes
        updateActivePage(pageId, 'color_selection_changed');
        
        // Trigger gradient update
        scheduleGradientUpdate();
    }
}

// Function to schedule gradient update (prevents race conditions)
function scheduleGradientUpdate() {
    if (pendingGradientUpdate) return;
    
    pendingGradientUpdate = true;
    
    // Use requestAnimationFrame to ensure updates happen after scroll settles
    requestAnimationFrame(() => {
        updateAllGradients();
        pendingGradientUpdate = false;
    });
}

// Single function to update all gradients based on selected indices
function updateAllGradients() {
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    
    // DEBUG: Log when applying gradients
    console.log('APPLYING_GRADIENTS', {
        leftIndex: selectedLeftIndex,
        rightIndex: selectedRightIndex,
        leftColor: leftColor,
        rightColor: rightColor,
        timestamp: new Date().toISOString()
    });
    
    // Update gradient intro (first rectangle at index 0 serves as the header)
    updateGradientIntroFromColors(leftColor, rightColor);
    
    // Update main gradient header (persistent header on main screen)
    updateMainGradientHeader(leftColor, rightColor);
}

// Legacy function to get the color of the currently snapped tile in a column
// (kept for backward compatibility with other parts of the code)
function getSnappedTileColor(column) {
    const index = getSelectedColorIndex(column);
    return getColorFromIndex(index);
}

// Note: The gradient header is now the first rectangle (index 0) in the gradient intro container
// No separate header element exists - it's unified with the intro rectangles

// Function to check if the current color combination is shape + sound (orange + purple)
// This triggers the "Letter Shape" page content
function isOrangeBlueCombination(leftColor, rightColor) {
    // Check if one is orange (shape) and the other is purple (sound) (order doesn't matter)
    const hasOrange = leftColor === ORANGE_COLOR || rightColor === ORANGE_COLOR;
    const hasPurple = leftColor === PURPLE_COLOR || rightColor === PURPLE_COLOR;
    return hasOrange && hasPurple;
}

// Function to update visibility of text box and p5.js sketch based on color combination
function updateVisibilityBasedOnColors(leftColor, rightColor) {
    const textBox = document.getElementById('text-box');
    const p5Container = document.getElementById('p5-container');
    
    if (!textBox || !p5Container) return;
    
    const shouldBeVisible = isOrangeBlueCombination(leftColor, rightColor);
    
    // DEBUG: Log the active combo and resolved page
    const leftIndex = colors.indexOf(leftColor);
    const rightIndex = colors.indexOf(rightColor);
    const pageKey = getPageIdFromColors(leftIndex, rightIndex);
    console.log('PAGE_ROUTING', {
        leftIndex: leftIndex,
        rightIndex: rightIndex,
        leftColor: leftColor,
        rightColor: rightColor,
        leftWord: colorWords[leftIndex],
        rightWord: colorWords[rightIndex],
        pageKey: pageKey,
        shouldShowLetterShape: shouldBeVisible,
        timestamp: new Date().toISOString()
    });
    
    // Update text box visibility
    // Text box is always hidden - only interaction is shown for Shape Sound page
    // Use display: none to remove it from layout flow so it doesn't take up space
    textBox.style.display = 'none';
    textBox.style.visibility = 'hidden';
    textBox.style.opacity = '0';
    
    // Update p5.js sketch visibility and activity
    if (shouldBeVisible) {
        // Make the container visible
        p5Container.style.visibility = 'visible';
        p5Container.style.opacity = '1';
        p5Container.style.pointerEvents = 'auto';
        
        // Activate the sketch
        if (p5SketchActive) {
            p5SketchActive.value = true;
        }
        
        // Resize canvas - use requestAnimationFrame to ensure layout is complete
        requestAnimationFrame(() => {
            resizeP5Canvas();
            
            // Ensure canvas element is visible and properly styled
            const canvas = p5Container.querySelector('canvas');
            if (canvas) {
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
                canvas.style.opacity = '1';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.zIndex = '11';
            }
            
            // Force a redraw by triggering window resize if p5 instance exists
            if (p5Instance && typeof p5Instance.windowResized === 'function') {
                p5Instance.windowResized();
            }
        });
    } else {
        // Hide but keep dimensions (don't use display: none)
        p5Container.style.visibility = 'hidden';
        p5Container.style.opacity = '0';
        p5Container.style.pointerEvents = 'none';
        
        // Deactivate the sketch to stop rendering (but don't destroy it)
        if (p5SketchActive) {
            p5SketchActive.value = false;
        }
    }
}


// p5.js sketch instance (will be set when sketch is created)
let p5Instance = null;

// State management for p5 sketch
let p5SketchActive = { value: true };
let p5StateStorage = {};

// ==================
// P5 CELL 01 SKETCH FACTORY
// ==================
// Interactive drawing sketch with shape stamps and sound
function createP5Cell01Sketch(containerElement, containerWidth, containerHeight, p5SketchActive, cellId, stateStorage) {
    return function(p) {
        // Verify p is valid
        if (!p || typeof p.createCanvas !== 'function') {
            console.error('Invalid p5 instance');
            return;
        }
        
        // Store container element and dimensions for use in the sketch
        const container = containerElement;
        let containerW = containerWidth;
        let containerH = containerHeight;
        let cnv;
        
        // ==================
        // CONFIG
        // ==================
        let shapeSize = 26;        // בסיס לעיגול
        let stepDist = 14;         // מרחק בין חותמות
        let outlinePx = 3;         // עובי קו מתאר
        let easing = 0.25;         // קינטיות

        // shape modes: 0=circle, 1=square, 2=triangle
        let currentShape = 0;

        // colors
        const bgHex = "#E0E0E0";
        const fillHex = "#FFFFFF";
        const strokeHex = "#000000";

        // ==================
        // STATE
        // ==================
        let brushX, brushY, prevX, prevY;
        let drawing = false;

        // layers
        let brushLayer;

        // playback
        let recordedPoints = []; // {x,y,shape}
        let isReplaying = false;
        let replayIndex = 0;

        // UI
        let panel, toggleButton;
        let circleBtn, squareBtn, triangleBtn;
        let ellipseBtn, starBtn, pentagonBtn;
        let playButton, stopButton, resetButton;

        // ==================
        // SOUND (Web Audio, no p5.sound)
        // ==================
        let audioCtx = null;
        let masterGain = null;
        let lastSoundTime = 0;

        function ensureAudio() {
          if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.9;
            masterGain.connect(audioCtx.destination);
          }
          if (audioCtx.state === "suspended") {
            // Must be called inside a user gesture (mouse press / button click)
            audioCtx.resume();
          }
        }

        function midiToFreqLocal(midi) {
          return 440 * Math.pow(2, (midi - 69) / 12);
        }

        function triggerSound(x, y, shapeType) {
          const nowMs = p.millis();
          if (nowMs - lastSoundTime < 70) return;
          lastSoundTime = nowMs;

          ensureAudio();
          if (!audioCtx || audioCtx.state !== "running") return;

          // pitch לפי Y
          const midiNote = Math.floor(p.map(y, p.height, 0, 48, 84));
          let freq = midiToFreqLocal(midiNote);

          // shape "character" - כל צורה עם צליל שונה מאוד
          let oscType = "sine";
          let amp = 0.30;
          let dur = 0.14;
          let attackTime = 0.01;
          let decayTime = 0.13;
          let filterFreq = null; // אם null, אין פילטר

          if (shapeType === 0) {
            // Circle - גל סינוס רך ונמוך
            oscType = "sine";
            freq = freq * 0.85; // נמוך יותר
            amp = 0.50; // הוגדל מ-0.25 ל-0.50 - חזק יותר לצליל נמוך
            dur = 0.20; // ארוך יותר
            attackTime = 0.02; // התקפה רכה
            decayTime = 0.18;
          } else if (shapeType === 1) {
            // Square - גל מרובע חד וחזק
            oscType = "square";
            freq = freq * 1.15; // גבוה יותר
            amp = 0.45;
            dur = 0.08; // קצר וחד
            attackTime = 0.005; // התקפה מהירה
            decayTime = 0.075;
          } else if (shapeType === 2) {
            // Triangle - גל משולש בינוני
            oscType = "triangle";
            freq = freq * 1.25; // גבוה יותר
            amp = 0.32;
            dur = 0.15;
            attackTime = 0.01;
            decayTime = 0.14;
          } else if (shapeType === 3) {
            // Ellipse - גל סינוס רחב עם פילטר
            oscType = "sine";
            freq = freq * 0.75; // נמוך יותר מהעיגול
            amp = 0.55; // הוגדל מ-0.28 ל-0.55 - חזק מאוד לצליל הנמוך ביותר
            dur = 0.25; // ארוך מאוד
            attackTime = 0.03; // התקפה רכה מאוד
            decayTime = 0.22;
            filterFreq = freq * 0.5; // פילטר נמוך לעומק
          } else if (shapeType === 4) {
            // Star - גל משור (sawtooth) חד וחזק
            oscType = "sawtooth";
            freq = freq * 1.35; // גבוה מאוד
            amp = 0.50; // חזק מאוד
            dur = 0.06; // קצר מאוד
            attackTime = 0.002; // התקפה מהירה מאוד
            decayTime = 0.058;
          } else if (shapeType === 5) {
            // Pentagon - גל מרובע עם תדירות בינונית
            oscType = "square";
            freq = freq * 0.95; // נמוך יותר מהמרובע
            amp = 0.48; // הוגדל מ-0.38 ל-0.48 - חזק יותר לצליל נמוך-בינוני
            dur = 0.12;
            attackTime = 0.008;
            decayTime = 0.112;
            filterFreq = freq * 1.5; // פילטר גבוה לחדות
          }

          const t0 = audioCtx.currentTime;

          const osc = audioCtx.createOscillator();
          osc.type = oscType;
          osc.frequency.setValueAtTime(freq, t0);

          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.0001, t0);

          // envelope מותאם לכל צורה
          g.gain.linearRampToValueAtTime(amp, t0 + attackTime);
          g.gain.linearRampToValueAtTime(0.0001, t0 + attackTime + decayTime);

          // חיבור עם פילטר אם יש
          let filter = null;
          if (filterFreq !== null) {
            filter = audioCtx.createBiquadFilter();
            filter.type = shapeType === 3 ? "lowpass" : "highpass";
            filter.frequency.setValueAtTime(filterFreq, t0);
            filter.Q.setValueAtTime(1, t0);
            
            osc.connect(g);
            g.connect(filter);
            filter.connect(masterGain);
          } else {
            osc.connect(g);
            g.connect(masterGain);
          }

          osc.start(t0);
          osc.stop(t0 + dur + 0.02);

          osc.onended = () => {
            try { osc.disconnect(); } catch {}
            try { g.disconnect(); } catch {}
            if (filter !== null) {
              try { filter.disconnect(); } catch {}
            }
          };
        }

        // ==================
        // STATE PERSISTENCE
        // ==================
        // Save current canvas state to storage
        function saveState() {
            // Use pageId if available (for dynamic page switching), otherwise use cellId
            const storageKey = p._currentPageId !== undefined ? p._currentPageId : (cellId !== null && cellId !== undefined ? cellId : null);
            if (!stateStorage || storageKey === null || storageKey === undefined) return;
            
            try {
                // Save brushLayer as image data URL
                let imageData = null;
                if (brushLayer && brushLayer.canvas) {
                    imageData = brushLayer.canvas.toDataURL('image/png');
                }
                
                // Save both image and recorded points
                stateStorage[storageKey] = {
                    imageData: imageData,
                    recordedPoints: recordedPoints ? [...recordedPoints] : []
                };
            } catch (e) {
                console.warn('Failed to save cell state:', e);
            }
        }
        
        // Restore canvas state from storage
        function restoreState() {
            // Use pageId if available (for dynamic page switching), otherwise use cellId
            const storageKey = p._currentPageId !== undefined ? p._currentPageId : (cellId !== null && cellId !== undefined ? cellId : null);
            if (!stateStorage || storageKey === null || storageKey === undefined) {
                // No storage key - clear canvas for new page
                if (brushLayer) {
                    clearVisualOnly();
                }
                recordedPoints = [];
                return false;
            }
            
            const savedState = stateStorage[storageKey];
            if (!savedState) {
                // No saved state for this page - clear canvas
                if (brushLayer) {
                    clearVisualOnly();
                }
                recordedPoints = [];
                return false;
            }
            
            try {
                // Clear current state first
                if (brushLayer) {
                    clearVisualOnly();
                }
                recordedPoints = [];
                
                // Restore recorded points
                if (savedState.recordedPoints && savedState.recordedPoints.length > 0) {
                    recordedPoints = [...savedState.recordedPoints];
                }
                
                // Restore brushLayer image if available
                if (savedState.imageData && brushLayer) {
                    // Use p5's loadImage which works with data URLs
                    p.loadImage(savedState.imageData, 
                        (loadedImg) => {
                            // Success callback: draw the image to brushLayer
                            if (loadedImg && brushLayer) {
                                brushLayer.image(loadedImg, 0, 0, brushLayer.width, brushLayer.height);
                            }
                        },
                        (error) => {
                            // Error callback
                            console.warn('Failed to restore image state:', error);
                        }
                    );
                }
                
                return true;
            } catch (e) {
                console.warn('Failed to restore cell state:', e);
                // On error, clear canvas
                if (brushLayer) {
                    clearVisualOnly();
                }
                recordedPoints = [];
                return false;
            }
        }
        
        // Expose saveState function to p5 instance for external access
        p.saveState = saveState;

        // ==================
        // SETUP
        // ==================
        p.setup = function() {
            // Safety check: ensure p5 is valid
            if (!p || typeof p.createCanvas !== 'function') {
                return;
            }
            
            // Get container dimensions - use offsetWidth/offsetHeight as fallback
            // These work even when visibility is hidden
            let w = container.clientWidth || container.offsetWidth || containerW;
            let h = container.clientHeight || container.offsetHeight || containerH;
            
            // Ensure minimum dimensions (at least 1px to avoid p5 errors)
            if (w <= 0) w = Math.max(1, containerW || 400);
            if (h <= 0) h = Math.max(1, containerH || 300);
            
        // Create canvas matching container size (not fullscreen)
        cnv = p.createCanvas(w, h);
        // Attach canvas to the container element
        cnv.parent(container);
        
        // Ensure canvas is visible and properly styled
        if (cnv && cnv.elt) {
            cnv.elt.style.display = 'block';
            cnv.elt.style.visibility = 'visible';
            cnv.elt.style.opacity = '1';
            cnv.elt.style.position = 'absolute';
            cnv.elt.style.top = '0';
            cnv.elt.style.left = '0';
            cnv.elt.style.zIndex = '11';
            cnv.elt.style.pointerEvents = 'auto';
            // Ensure canvas doesn't get clipped
            cnv.elt.style.maxWidth = '100%';
            cnv.elt.style.maxHeight = '100%';
        }
            
            // Store reference for resizing (already set globally, but ensure it's set)
            if (!p5Instance) {
                p5Instance = p;
            }
            
            brushLayer = p.createGraphics(w, h);
            brushLayer.clear();

            paintBackground();
            
            // Restore saved state if available (after creating brushLayer)
            restoreState();
            
            createUI();
        };

        // ==================
        // DRAW
        // ==================
        p.draw = function() {
            // Safety check: exit if sketch is no longer active
            if (!p5SketchActive.value || !p || typeof p.background !== 'function') {
                return;
            }
            
            if (isReplaying) {
                replayDrawing();
                p.image(brushLayer, 0, 0);
                drawDivider();
                return;
            }

            let isDrawingNow = p.mouseIsPressed && p.mouseX < p.width / 2;

            if (isDrawingNow) {
                if (!drawing) {
                    brushX = p.mouseX;
                    brushY = p.mouseY;
                    prevX = brushX;
                    prevY = brushY;
                    drawing = true;
                    // Hide instruction text when user starts drawing
                    hideSoundShapeInstructionText();
                    return;
                }

                brushX += (p.mouseX - brushX) * easing;
                brushY += (p.mouseY - brushY) * easing;

                // שמאל: ציור + הקלטה
                stampShape(prevX, prevY, brushX, brushY, true);

                // ימין: מראה בלבד
                stampShape(p.width - prevX, prevY, p.width - brushX, brushY, false);

                prevX = brushX;
                prevY = brushY;
            } else {
                drawing = false;
            }

            p.image(brushLayer, 0, 0);
            drawDivider();
        };

        // ==================
        // BRUSH STAMP
        // ==================
        function stampShape(x1, y1, x2, y2, recordIt) {
            let dx = x2 - x1;
            let dy = y2 - y1;
            let distSeg = p.sqrt(dx * dx + dy * dy);
            if (distSeg === 0) return;

            let steps = p.max(1, p.floor(distSeg / stepDist));

            for (let i = 0; i <= steps; i++) {
                let f = i / steps;
                let x = p.lerp(x1, x2, f);
                let y = p.lerp(y1, y2, f);

                drawShape(brushLayer, x, y, shapeSize, currentShape);

                if (recordIt) {
                    recordedPoints.push({ x, y, shape: currentShape });
                }
            }

            // סאונד רק בציור המקורי (לא במראה)
            if (recordIt) triggerSound(x2, y2, currentShape);
        }

        // ==================
        // DRAW SHAPE (גדלים שונים)
        // ==================
        function drawShape(g, x, y, baseS, shapeType) {
            let mult = 1.0;
            if (shapeType === 1) mult = 1.5; // ריבוע
            if (shapeType === 2) mult = 2.0; // משולש
            if (shapeType === 3) mult = 1.8; // אליפסה (מוגדלת)
            if (shapeType === 4) mult = 1.3; // כוכב
            if (shapeType === 5) mult = 1.4; // מחומש

            let s = baseS * mult;

            g.push();
            g.translate(x, y);
            g.fill(fillHex);
            g.stroke(strokeHex);
            g.strokeWeight(outlinePx);

            if (shapeType === 0) {
                // Circle
                g.circle(0, 0, s);
            } else if (shapeType === 1) {
                // Square
                g.rectMode(p.CENTER);
                g.rect(0, 0, s, s);
            } else if (shapeType === 2) {
                // Triangle
                let h = s * 0.9;
                g.triangle(
                    0, -h / 2,
                    -h / 2, h / 2,
                    h / 2, h / 2
                );
            } else if (shapeType === 3) {
                // Ellipse (larger)
                g.ellipse(0, 0, s * 1.6, s * 1.0);
            } else if (shapeType === 4) {
                // Star (5-pointed)
                g.beginShape();
                for (let i = 0; i < 10; i++) {
                    let angle = (i * p.PI) / 5 - p.PI / 2;
                    let r = (i % 2 === 0) ? s / 2 : s / 4;
                    let px = p.cos(angle) * r;
                    let py = p.sin(angle) * r;
                    g.vertex(px, py);
                }
                g.endShape(p.CLOSE);
            } else if (shapeType === 5) {
                // Pentagon
                g.beginShape();
                for (let i = 0; i < 5; i++) {
                    let angle = (i * p.TWO_PI) / 5 - p.PI / 2;
                    let px = p.cos(angle) * (s / 2);
                    let py = p.sin(angle) * (s / 2);
                    g.vertex(px, py);
                }
                g.endShape(p.CLOSE);
            }

            g.pop();
        }

        // ==================
        // PLAYBACK
        // ==================
        function replayDrawing() {
            if (!recordedPoints.length) return;

            let pointsPerFrame = 10;

            for (let i = 0; i < pointsPerFrame; i++) {
                let point = recordedPoints[replayIndex];

                if (!point) {
                    // לופ: מתחילים מחדש (מנקה רק ויזואלית)
                    replayIndex = 0;
                    clearVisualOnly();
                    return;
                }

                drawShape(brushLayer, point.x, point.y, shapeSize, point.shape);
                drawShape(brushLayer, p.width - point.x, point.y, shapeSize, point.shape);

                // בסאונד של פלייבק — משתמשים בצורה שהוקלטה
                triggerSound(point.x, point.y, point.shape);

                replayIndex++;
            }
        }

        // ==================
        // UI
        // ==================
        function createUI() {
            // Create toggle button as DOM element, positioned absolutely in container
            toggleButton = document.createElement("button");
            toggleButton.textContent = "▾";
            toggleButton.style.position = "absolute";
            toggleButton.style.right = "10px";
            toggleButton.style.top = "10px";
            toggleButton.style.width = "24px";
            toggleButton.style.height = "24px";
            toggleButton.style.fontFamily = "'JetBrains Mono NL', monospace";
            toggleButton.style.fontSize = "15px";
            toggleButton.style.letterSpacing = "0.03em";
            toggleButton.style.lineHeight = "0.8";
            toggleButton.style.borderRadius = "0";
            toggleButton.style.border = "none";
            toggleButton.style.background = "transparent";
            toggleButton.style.color = "#ffffff";
            toggleButton.style.cursor = "pointer";
            toggleButton.style.zIndex = "1000";
            container.appendChild(toggleButton);

            toggleButton.addEventListener("click", () => {
                let hidden = panel.style.display === "none";
                panel.style.display = hidden ? "block" : "none";
                toggleButton.textContent = hidden ? "▾" : "▸";
            });

            // Create panel as DOM element, positioned absolutely in container
            panel = document.createElement("div");
            panel.style.position = "absolute";
            panel.style.right = "0px";
            panel.style.bottom = "40px"; // Position so bottom edge touches top of parameter text (40px height)
            panel.style.width = "auto";
            panel.style.paddingRight = "10px";
            panel.style.paddingTop = "10px";
            panel.style.paddingBottom = "10px";
            panel.style.paddingLeft = "10px";
            panel.style.display = "flex";
            panel.style.flexDirection = "row";
            panel.style.gap = "10px";
            panel.style.alignItems = "flex-start";
            panel.style.background = "#2C2C2C";
            panel.style.borderRadius = "0";
            panel.style.zIndex = "1000";
            container.appendChild(panel);
            
            // Create columns container - 2 columns for 6 shapes (3 per column)
            const leftColumn = document.createElement("div");
            leftColumn.style.display = "flex";
            leftColumn.style.flexDirection = "column";
            leftColumn.style.alignItems = "center";
            
            const rightColumn = document.createElement("div");
            rightColumn.style.display = "flex";
            rightColumn.style.flexDirection = "column";
            rightColumn.style.alignItems = "center";
            
            panel.appendChild(leftColumn);
            panel.appendChild(rightColumn);

            // Create shape buttons - Left column
            circleBtn = document.createElement("button");
            circleBtn.dataset.shapeType = "circle";
            circleBtn.dataset.shapeIndex = "0";
            circleBtn.appendChild(createShapeSVG("circle", false));
            
            squareBtn = document.createElement("button");
            squareBtn.dataset.shapeType = "square";
            squareBtn.dataset.shapeIndex = "1";
            squareBtn.appendChild(createShapeSVG("square", false));
            
            triangleBtn = document.createElement("button");
            triangleBtn.dataset.shapeType = "triangle";
            triangleBtn.dataset.shapeIndex = "2";
            triangleBtn.appendChild(createShapeSVG("triangle", false));

            leftColumn.appendChild(circleBtn);
            leftColumn.appendChild(squareBtn);
            leftColumn.appendChild(triangleBtn);

            styleShapeBtn(circleBtn);
            styleShapeBtn(squareBtn);
            styleShapeBtn(triangleBtn);

            circleBtn.addEventListener("click", () => setShape(0));
            squareBtn.addEventListener("click", () => setShape(1));
            triangleBtn.addEventListener("click", () => setShape(2));
            
            // Create shape buttons - Right column
            ellipseBtn = document.createElement("button");
            ellipseBtn.dataset.shapeType = "ellipse";
            ellipseBtn.dataset.shapeIndex = "3";
            ellipseBtn.appendChild(createShapeSVG("ellipse", false));
            
            starBtn = document.createElement("button");
            starBtn.dataset.shapeType = "star";
            starBtn.dataset.shapeIndex = "4";
            starBtn.appendChild(createShapeSVG("star", false));
            
            pentagonBtn = document.createElement("button");
            pentagonBtn.dataset.shapeType = "pentagon";
            pentagonBtn.dataset.shapeIndex = "5";
            pentagonBtn.appendChild(createShapeSVG("pentagon", false));
            
            rightColumn.appendChild(ellipseBtn);
            rightColumn.appendChild(starBtn);
            rightColumn.appendChild(pentagonBtn);
            
            styleShapeBtn(ellipseBtn);
            styleShapeBtn(starBtn);
            styleShapeBtn(pentagonBtn);
            
            ellipseBtn.addEventListener("click", () => setShape(3));
            starBtn.addEventListener("click", () => setShape(4));
            pentagonBtn.addEventListener("click", () => setShape(5));
            
            highlightShape(circleBtn);

            // Create control buttons as DOM elements
            playButton = document.createElement("button");
            playButton.textContent = "[play]";
            stopButton = document.createElement("button");
            stopButton.textContent = "[stop]";
            resetButton = document.createElement("button");
            resetButton.textContent = "[reset]";

            // Create control buttons container
            const controlsColumn = document.createElement("div");
            controlsColumn.style.display = "flex";
            controlsColumn.style.flexDirection = "column";
            controlsColumn.style.alignItems = "flex-end";
            controlsColumn.style.marginLeft = "10px";
            
            controlsColumn.appendChild(playButton);
            controlsColumn.appendChild(stopButton);
            controlsColumn.appendChild(resetButton);
            
            panel.appendChild(controlsColumn);

            stylePanelButton(playButton);
            stylePanelButton(stopButton);
            stylePanelButton(resetButton);

            playButton.addEventListener("click", () => {
                if (!recordedPoints.length) return;

                // Start audio safely (no p5.sound)
                ensureAudio();

                clearVisualOnly();   // לא מוחק recordedPoints
                replayIndex = 0;
                lastSoundTime = 0;
                isReplaying = true;
            });

            stopButton.addEventListener("click", () => {
                isReplaying = false;
            });

            resetButton.addEventListener("click", resetCanvas);
        }

        function styleShapeBtn(btn) {
            btn.style.width = "100%";
            btn.style.margin = "4px 0";
            btn.style.fontSize = "20px";
            btn.style.fontFamily = "'JetBrains Mono NL', monospace";
            btn.style.letterSpacing = "0.03em";
            btn.style.lineHeight = "0.8";
            btn.style.textTransform = "none";
            btn.style.borderRadius = "0";
            btn.style.border = "none";
            btn.style.background = "transparent";
            btn.style.color = "#ffffff";
            btn.style.cursor = "pointer";
            btn.style.textAlign = "center";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.justifyContent = "center";
        }
        
        // Function to create SVG shape for panel buttons
        function createShapeSVG(shapeType, isSelected, size = 20) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", size);
            svg.setAttribute("height", size);
            svg.setAttribute("viewBox", `-${size/2} -${size/2} ${size} ${size}`);
            svg.style.display = "block";
            
            const fillColor = isSelected ? "#ffffff" : "none";
            const strokeColor = "#ffffff";
            const strokeWidth = 2;
            
            if (shapeType === "circle") {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", "0");
                circle.setAttribute("cy", "0");
                circle.setAttribute("r", size * 0.4);
                circle.setAttribute("fill", fillColor);
                circle.setAttribute("stroke", strokeColor);
                circle.setAttribute("stroke-width", strokeWidth);
                svg.appendChild(circle);
            } else if (shapeType === "square") {
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                const s = size * 0.5;
                rect.setAttribute("x", -s/2);
                rect.setAttribute("y", -s/2);
                rect.setAttribute("width", s);
                rect.setAttribute("height", s);
                rect.setAttribute("fill", fillColor);
                rect.setAttribute("stroke", strokeColor);
                rect.setAttribute("stroke-width", strokeWidth);
                svg.appendChild(rect);
            } else if (shapeType === "triangle") {
                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                const h = size * 0.45;
                const points = `0,${-h/2} ${-h/2},${h/2} ${h/2},${h/2}`;
                polygon.setAttribute("points", points);
                polygon.setAttribute("fill", fillColor);
                polygon.setAttribute("stroke", strokeColor);
                polygon.setAttribute("stroke-width", strokeWidth);
                svg.appendChild(polygon);
            } else if (shapeType === "ellipse") {
                const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                ellipse.setAttribute("cx", "0");
                ellipse.setAttribute("cy", "0");
                ellipse.setAttribute("rx", size * 0.5);
                ellipse.setAttribute("ry", size * 0.3);
                ellipse.setAttribute("fill", fillColor);
                ellipse.setAttribute("stroke", strokeColor);
                ellipse.setAttribute("stroke-width", strokeWidth);
                svg.appendChild(ellipse);
            } else if (shapeType === "star") {
                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                let points = "";
                for (let i = 0; i < 10; i++) {
                    const angle = (i * Math.PI) / 5 - Math.PI / 2;
                    const r = (i % 2 === 0) ? size * 0.4 : size * 0.2;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    points += `${x},${y} `;
                }
                polygon.setAttribute("points", points.trim());
                polygon.setAttribute("fill", fillColor);
                polygon.setAttribute("stroke", strokeColor);
                polygon.setAttribute("stroke-width", strokeWidth);
                svg.appendChild(polygon);
            } else if (shapeType === "pentagon") {
                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                let points = "";
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    const r = size * 0.4;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    points += `${x},${y} `;
                }
                polygon.setAttribute("points", points.trim());
                polygon.setAttribute("fill", fillColor);
                polygon.setAttribute("stroke", strokeColor);
                polygon.setAttribute("stroke-width", strokeWidth);
                svg.appendChild(polygon);
            }
            
            return svg;
        }

        function stylePanelButton(btn) {
            btn.style.width = "auto";
            btn.style.margin = "4px 0";
            btn.style.padding = "6px 8px";
            btn.style.fontFamily = "'JetBrains Mono NL', monospace";
            btn.style.fontSize = "15px";
            btn.style.letterSpacing = "0.03em";
            btn.style.lineHeight = "0.8";
            btn.style.textTransform = "none";
            btn.style.borderRadius = "0";
            btn.style.border = "none";
            btn.style.background = "transparent";
            btn.style.color = "#ffffff";
            btn.style.cursor = "pointer";
            btn.style.fontWeight = "normal";
        }

        function setShape(i) {
            currentShape = i;
            const allShapeButtons = [circleBtn, squareBtn, triangleBtn, ellipseBtn, starBtn, pentagonBtn];
            if (i >= 0 && i < allShapeButtons.length) {
                highlightShape(allShapeButtons[i]);
            }
        }

        function highlightShape(btn) {
            // Set all buttons to unselected state (outline only)
            const allShapeButtons = [circleBtn, squareBtn, triangleBtn, ellipseBtn, starBtn, pentagonBtn];
            allShapeButtons.forEach(b => {
                if (!b) return;
                b.style.outline = "none";
                b.style.opacity = "1";
                const shapeType = b.dataset.shapeType;
                // Remove existing SVG and create new one with unselected state
                const existingSVG = b.querySelector("svg");
                if (existingSVG) {
                    b.removeChild(existingSVG);
                }
                b.appendChild(createShapeSVG(shapeType, false));
            });
            // Set selected button to filled state
            const shapeType = btn.dataset.shapeType;
            const existingSVG = btn.querySelector("svg");
            if (existingSVG) {
                btn.removeChild(existingSVG);
            }
            btn.appendChild(createShapeSVG(shapeType, true));
        }

        // ==================
        // BACKGROUND & DIVIDER
        // ==================
        function paintBackground() {
            // Background removed - canvas is transparent to show page background
            // Only draw the divider line
            if (p) {
                drawDivider();
            }
        }

        function drawDivider() {
            p.push();
            p.stroke(255);
            p.strokeWeight(3);
            p.line(p.width / 2, 0, p.width / 2, p.height);
            p.pop();
        }

        // ==================
        // RESET / CLEAR / RESIZE
        // ==================
        function clearVisualOnly() {
            // Properly clear the brushLayer by recreating it
            if (brushLayer && p) {
                // Get current dimensions
                const w = brushLayer.width;
                const h = brushLayer.height;
                // Create a new empty graphics layer
                brushLayer = p.createGraphics(w, h);
                brushLayer.clear();
            }
            // Redraw the background/divider on main canvas
            paintBackground();
        }

        function resetCanvas() {
            // Clear saved state FIRST before clearing visual
            // Use pageId if available (for dynamic page switching), otherwise use cellId
            const storageKey = p._currentPageId !== undefined ? p._currentPageId : (cellId !== null && cellId !== undefined ? cellId : null);
            if (stateStorage && storageKey !== null && storageKey !== undefined) {
                delete stateStorage[storageKey];
            }
            
            // Now clear the visual canvas
            clearVisualOnly();
            recordedPoints = [];
            isReplaying = false;
            replayIndex = 0;
            
            // Reset drawing state to allow new drawing after reset
            drawing = false;
            brushX = undefined;
            brushY = undefined;
            prevX = undefined;
            prevY = undefined;
        }

        p.keyPressed = function() {
            if (p.key === "c" || p.key === "C") resetCanvas();
        };

        // Mouse press handler to ensure audio on first user gesture
        p.mousePressed = function() {
            ensureAudio();
        };
        
        // Window resize handler - resize to container size
        p.windowResized = function() {
            // Safety check: ensure p5 is valid (don't check p5SketchActive here - canvas should always be resizable)
            if (!p || typeof p.resizeCanvas !== 'function') {
                return;
            }
            
            // Get updated container dimensions directly from container
            let updatedWidth = container.clientWidth || container.offsetWidth || containerW;
            let updatedHeight = container.clientHeight || container.offsetHeight || containerH;
            
            // Fallback to white region dimensions if container dimensions are 0
            if (updatedWidth <= 0 || updatedHeight <= 0) {
                const whiteRegion = document.getElementById('white-region');
                if (whiteRegion) {
                    updatedWidth = whiteRegion.offsetWidth || whiteRegion.clientWidth || containerW;
                    updatedHeight = whiteRegion.offsetHeight || whiteRegion.clientHeight || containerH;
                }
            }
            
            // Ensure minimum dimensions
            if (updatedWidth <= 0) updatedWidth = Math.max(1, containerW || 400);
            if (updatedHeight <= 0) updatedHeight = Math.max(1, containerH || 300);
            
            containerW = updatedWidth;
            containerH = updatedHeight;
            p.resizeCanvas(containerW, containerH);
            
            // Recreate brushLayer with new dimensions
            if (brushLayer) {
                brushLayer = p.createGraphics(containerW, containerH);
                brushLayer.clear();
                paintBackground();
            }

            // Panel positions are now CSS-based (right-aligned in container)
            // No need to update positions - they stay aligned automatically
        };
    };
}

// Function to get p5 container dimensions
function getP5ContainerDimensions() {
    const container = document.getElementById('p5-container');
    if (!container) return { width: 0, height: 0 };
    
    return {
        width: container.offsetWidth,
        height: container.offsetHeight
    };
}

// Function to resize p5 canvas
function resizeP5Canvas() {
    if (!p5Instance) return;
    
    const container = document.getElementById('p5-container');
    const whiteRegion = document.getElementById('white-region');
    
    if (!container || !whiteRegion) return;
    
    // Get dimensions from p5 container itself
    // offsetWidth/offsetHeight work even when visibility is hidden
    let width = container.offsetWidth || container.clientWidth || 0;
    let height = container.offsetHeight || container.clientHeight || 0;
    
    // Fallback to white region dimensions if container dimensions are 0
    if (width <= 0 || height <= 0) {
        width = whiteRegion.offsetWidth || whiteRegion.clientWidth || 0;
        height = whiteRegion.offsetHeight || whiteRegion.clientHeight || 0;
    }
    
    // Ensure minimum dimensions (p5 needs non-zero dimensions)
    if (width <= 0) width = 400;
    if (height <= 0) height = 300;
    
    // Only resize if dimensions have actually changed
    const canvas = container.querySelector('canvas');
    if (canvas && (canvas.width !== width || canvas.height !== height)) {
        // Resize the canvas using p5's resizeCanvas method
        if (p5Instance.resizeCanvas) {
            p5Instance.resizeCanvas(width, height);
        }
        
        // Ensure canvas is properly styled and visible
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '11';
        canvas.style.pointerEvents = 'auto';
    }
}

// Function to initialize p5.js sketch
function initializeP5Sketch() {
    const container = document.getElementById('p5-container');
    const whiteRegion = document.getElementById('white-region');
    
    if (!container || !whiteRegion) return;
    
    // Wait for layout to be ready, then create sketch
    // Use requestAnimationFrame for better timing with layout
    requestAnimationFrame(() => {
        // Get dimensions from container itself - offsetWidth/offsetHeight work even when hidden
        let width = container.offsetWidth || container.clientWidth || 0;
        let height = container.offsetHeight || container.clientHeight || 0;
        
        // Fallback to white region dimensions
        if (width <= 0 || height <= 0) {
            width = whiteRegion.offsetWidth || whiteRegion.clientWidth || 0;
            height = whiteRegion.offsetHeight || whiteRegion.clientHeight || 0;
        }
        
        // Ensure minimum dimensions (p5 needs non-zero dimensions)
        // Use reasonable defaults based on viewport
        if (width <= 0) {
            const viewportWidth = window.innerWidth;
            const leftBoundary = 50;
            const rightBoundary = viewportWidth - 50;
            width = Math.max(400, rightBoundary - leftBoundary);
        }
        if (height <= 0) {
            height = Math.max(300, (window.innerHeight - 50));
        }
        
        // Create p5 sketch using the factory function
        // Parameters: container, width, height, active flag, cellId, state storage
        const sketch = createP5Cell01Sketch(
            container,
            width,
            height,
            p5SketchActive,
            0, // cellId (using 0 for single sketch)
            p5StateStorage // state storage object
        );
        
        // Create p5 instance - always create it once, even if initially hidden
        // Store the instance globally for later access
        p5Instance = new p5(sketch, container);
    });
}

// Function to initialize about text hover effect
function initializeAboutHoverEffect() {
    const whiteRegion = document.getElementById('white-region');
    if (!whiteRegion) return;
    
    // Add class to body when hovering over white region
    whiteRegion.addEventListener('mouseenter', () => {
        document.body.classList.add('white-region-hovered');
    });
    
    whiteRegion.addEventListener('mouseleave', () => {
        document.body.classList.remove('white-region-hovered');
    });
    
    // Initialize ABOUT hover overlay
    const aboutElement = document.querySelector('.black-middle-rectangle');
    const aboutOverlay = document.getElementById('canvas-text-box-about-overlay');
    const aboutBacking = document.getElementById('canvas-text-box-about-backing');
    
    if (aboutElement && aboutOverlay && aboutBacking) {
        // Render overlay text with line backgrounds to match main text box styling
        // Use same width as main text box (1035px) for the ABOUT overlay
        // Use black background color (#2C2C2C) for line backgrounds to match UI black
        const aboutText = 'syn-ethesia is a perceptual phenomenon in which the stimulation of one sense automatically triggers experiences in another. A sound may appear as a color, a letter may carry a specific hue, or a number may feel spatial or textured. These cross-sensory connections happen naturally and consistently, forming a unique inner world for each person who experiences them.';
        renderTextWithLineBackgrounds(aboutOverlay, aboutText, 1035, '#2C2C2C');
        
        // Show overlay and backing layer on hover
        aboutElement.addEventListener('mouseenter', () => {
            aboutBacking.classList.add('visible');
            aboutOverlay.classList.add('visible');
        });
        
        // Hide overlay and backing layer when hover ends
        aboutElement.addEventListener('mouseleave', () => {
            aboutBacking.classList.remove('visible');
            aboutOverlay.classList.remove('visible');
        });
    }
}

// Function to initialize per-line text highlights
function initializePerLineHighlights() {
    const textBox = document.getElementById('text-box');
    if (!textBox) return;
    
    // Function to get all line rectangles for a paragraph
    function getLineRects(paragraph) {
        const range = document.createRange();
        const lines = [];
        const paragraphRect = paragraph.getBoundingClientRect();
        
        // Get all text nodes in the paragraph
        const walker = document.createTreeWalker(
            paragraph,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let textNode = walker.nextNode();
        if (!textNode) return lines;
        
        const text = textNode.textContent;
        if (!text || text.length === 0) return lines;
        
        let lineStart = 0;
        let lastTop = null;
        
        // Iterate through text to find line breaks
        for (let i = 1; i <= text.length; i++) {
            range.setStart(textNode, lineStart);
            range.setEnd(textNode, i);
            
            const rect = range.getBoundingClientRect();
            const currentTop = rect.top;
            
            // Check if we've moved to a new line (top position changed significantly)
            // Or if we've reached the end of the text
            const isNewLine = lastTop !== null && Math.abs(currentTop - lastTop) > 2;
            const isEndOfText = i === text.length;
            
            if (isNewLine || isEndOfText) {
                // Get the previous line (up to i-1 for new line, or i for end)
                const lineEnd = isNewLine ? i - 1 : i;
                
                if (lineEnd > lineStart) {
                    range.setStart(textNode, lineStart);
                    range.setEnd(textNode, lineEnd);
                    const lineRect = range.getBoundingClientRect();
                    
                    if (lineRect.width > 0 && lineRect.height > 0) {
                        // Convert to paragraph-relative coordinates
                        lines.push({
                            left: lineRect.left - paragraphRect.left,
                            top: lineRect.top - paragraphRect.top,
                            width: lineRect.width,
                            height: lineRect.height
                        });
                    }
                }
                
                if (isNewLine) {
                    lineStart = i; // New line starts at the character that caused the wrap
                    lastTop = currentTop; // Update lastTop to current line
                } else {
                    // End of text, we're done
                    break;
                }
            } else {
                // Still on the same line
                lastTop = currentTop;
            }
        }
        
        return lines;
    }
    
    // Function to update line backgrounds for all paragraphs
    function updateLineBackgrounds() {
        const paragraphs = textBox.querySelectorAll('p');
        
        paragraphs.forEach((paragraph) => {
            // Remove existing line backgrounds for this paragraph
            const existingBgs = paragraph.querySelectorAll('.line-bg');
            existingBgs.forEach(bg => bg.remove());
            
            // Get line rectangles (already in paragraph-relative coordinates)
            const lineRects = getLineRects(paragraph);
            
            // Create background divs for each line
            lineRects.forEach((lineRect, index) => {
                const bgDiv = document.createElement('div');
                bgDiv.className = 'line-bg';
                
                // Calculate position and size with padding
                const paddingX = 8; // Horizontal padding (6-10px range, using 8px)
                const paddingY = 5; // Vertical padding (4-6px range, using 5px)
                const lineGap = 2; // Gap between lines (2px)
                
                // Position relative to paragraph (lineRect is already paragraph-relative)
                bgDiv.style.left = `${lineRect.left - paddingX}px`;
                bgDiv.style.top = `${lineRect.top - paddingY}px`;
                bgDiv.style.width = `${lineRect.width + (paddingX * 2)}px`;
                bgDiv.style.height = `${lineRect.height + (paddingY * 2)}px`;
                
                // Add gap between consecutive lines
                if (index > 0) {
                    const prevRect = lineRects[index - 1];
                    const actualGap = lineRect.top - (prevRect.top + prevRect.height);
                    if (actualGap > 0) {
                        // Adjust top to add visual gap
                        bgDiv.style.top = `${parseFloat(bgDiv.style.top) + lineGap}px`;
                    }
                }
                
                paragraph.appendChild(bgDiv);
            });
        });
    }
    
    // Initial update
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
        setTimeout(() => {
            updateLineBackgrounds();
        }, 100);
    });
    
    // Update on window resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateLineBackgrounds();
        }, 150);
    });
    
    // Also update when fonts load (in case fonts affect line breaks)
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            setTimeout(() => {
                updateLineBackgrounds();
            }, 100);
        });
    }
}

// Function to initialize color key hover effect
function initializeColorKeyClickEffect() {
    const colorKeyRect = document.querySelector('.black-corner-rectangle');
    const rightColumn = document.querySelector('.right-column');
    
    if (!colorKeyRect || !rightColumn) return;
    
    // Get all color items from both columns
    const allColorItems = document.querySelectorAll('.color-item');
    
    // Handle hover in - expand all items
    colorKeyRect.addEventListener('mouseenter', () => {
        // Add color-key-expanded class for letter spacing effect
        colorKeyRect.classList.add('color-key-expanded');
        
        // Add legend-expanded class to ALL items (both columns) for bulk hover effect (key expansion)
        allColorItems.forEach(item => {
            item.classList.add('legend-expanded');
        });
    });
    
    // Handle hover out - collapse all items
    colorKeyRect.addEventListener('mouseleave', () => {
        // Remove color-key-expanded class
        colorKeyRect.classList.remove('color-key-expanded');
        
        // Remove legend-expanded class from all items (key expansion)
        allColorItems.forEach(item => {
            item.classList.remove('legend-expanded');
        });
    });
}

// Function to align PARAMETER TEXT-BOX and COLOR KEY rectangles with logo bottom edge
function alignRectanglesWithEsthesia() {
    // Wait for fonts to load if available, then wait for layout to stabilize
    const waitForLayout = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const logoRect = document.querySelector('.black-rectangle');
                const parameterRect = document.querySelector('.black-bottom-rectangle');
                const colorKeyRect = document.querySelector('.black-corner-rectangle');
                
                if (!logoRect || !parameterRect || !colorKeyRect) {
                    console.warn('Logo alignment: Missing elements', {
                        logoRect: !!logoRect,
                        parameterRect: !!parameterRect,
                        colorKeyRect: !!colorKeyRect
                    });
                    return;
                }
                
                // Measure the logo rectangle using getBoundingClientRect()
                const logoRectBounds = logoRect.getBoundingClientRect();
                const logoBottom = logoRectBounds.bottom;
                
                // Get rectangle heights
                const parameterRectHeight = parameterRect.offsetHeight || 40;
                const colorKeyRectHeight = colorKeyRect.offsetHeight || 40;
                
                // Calculate top positions so rectangle bottoms align with logo bottom
                // top = logoBottom - rectangleHeight
                const parameterTop = logoBottom - parameterRectHeight;
                const colorKeyTop = logoBottom - colorKeyRectHeight;
                
                // Apply positions
                parameterRect.style.top = `${parameterTop}px`;
                colorKeyRect.style.top = `${colorKeyTop}px`;
                
                console.log('LOGO_BOTTOM_ALIGNMENT', {
                    logoBottom: logoBottom,
                    parameterTop: parameterTop,
                    colorKeyTop: colorKeyTop,
                    logoRect: {
                        top: logoRectBounds.top,
                        bottom: logoRectBounds.bottom,
                        height: logoRectBounds.height
                    }
                });
            });
        });
    };
    
    // Wait for fonts to load if the API is available
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(waitForLayout);
    } else {
        // Fallback: just wait for layout
        waitForLayout();
    }
}

// ==================
// GRADIENT INTRO FUNCTIONS
// ==================

// Function to get the color of a color item at a specific vertical position in viewport
function getColorAtViewportPosition(column, viewportY) {
    const itemHeight = window.innerHeight / 6;
    const scrollTop = column.scrollTop;
    
    // Calculate which item is at this viewport position
    // viewportY is the Y position in the viewport (0 to window.innerHeight)
    // We need to find which item's top edge is closest to (scrollTop + viewportY)
    const absoluteY = scrollTop + viewportY;
    const itemIndex = Math.floor(absoluteY / itemHeight);
    
    const items = column.querySelectorAll('.color-item');
    if (itemIndex >= 0 && itemIndex < items.length) {
        const item = items[itemIndex];
        return item.getAttribute('data-color') || 
               window.getComputedStyle(item).backgroundColor;
    }
    
    // Fallback: return first color
    return colors[0];
}

// Function to update UI layer visibility based on intro phase
function updateUIVisibility() {
    const uiLayer = document.querySelector('.ui-layer');
    if (!uiLayer) return;
    
    // UI is visible ONLY after gradients have fully expanded to scrollbar edges
    // OR when intro is completed (after closing phase)
    const show = hasExpandedToScrollbars || introCompleted;
    
    uiLayer.classList.toggle('ui-visible', show);
    
    // Also update UI mask visibility when UI visibility changes
    updateUIMaskVisibility();
    
    // Debug logging as specified
    console.log("UI_VIS", {
        show,
        hasExpandedToScrollbars,
        introCompleted,
        introPhase
    });
}

// Function to update canvas cover visibility based on intro phase
function updateCanvasCoverVisibility() {
    const canvasCover = document.getElementById('canvas-cover');
    if (!canvasCover) return;
    
    // Hide canvas cover when gradients have fully expanded to scrollbar edges
    // OR when intro is completed
    // This reveals the canvas content below
    const shouldHide = hasExpandedToScrollbars || introCompleted;
    canvasCover.classList.toggle('hidden', shouldHide);
}

// Function to update UI mask visibility during transition state
// UI mask appears when there's a gap between scrollbars and gradients (active or closing phase)
function updateUIMaskVisibility() {
    const uiMask = document.getElementById('ui-mask');
    if (!uiMask) return;
    
    // Show UI mask when there's a visible gap between scrollbars and gradients:
    // - During 'active' phase with gap (gradients centered with 35px gaps on each side)
    //   Either during transition (!hasExpandedToScrollbars) OR at START checkpoint (hasExpandedToScrollbars && introReady)
    // - OR during 'closing' phase (scrollbars detaching with gap)
    // - AND only if intro is not completed
    // This masks UI elements in the gap areas while keeping canvas and gradients visible
    const isAtStartCheckpoint = introPhase === 'active' && hasExpandedToScrollbars && !introCompleted && introReady;
    const hasGapDuringTransition = (introPhase === 'active' || introPhase === 'closing') && !hasExpandedToScrollbars && !introCompleted;
    const shouldShow = hasGapDuringTransition || isAtStartCheckpoint;
    
    uiMask.classList.toggle('visible', shouldShow);
    
    // Debug logging
    console.log("UI_MASK", {
        shouldShow,
        hasGapDuringTransition,
        isAtStartCheckpoint,
        introPhase,
        hasExpandedToScrollbars,
        introCompleted,
        introReady,
        timestamp: new Date().toISOString()
    });
}

// Note: Header visibility is now controlled by the intro container visibility
// The first rectangle (index 0) serves as the header and is part of the intro container

// Function to start entry animation (transitions from 'entering' to 'active')
function startEntryAnimation() {
    // Only proceed if we're still in entering phase
    if (introPhase !== 'entering') return;
    
    const container = document.getElementById('gradient-intro-container');
    if (!container) return;
    
    // Transition to active phase - this will trigger CSS transition to narrow state
    introPhase = 'active';
    
    // Update container classes
    container.classList.remove('intro-entering');
    container.classList.add('intro-active');
    
    // Update gradients to active state (will animate via CSS transition)
    updateGradientIntro();
    
    // Update UI mask visibility - mask should appear when gaps are visible
    updateUIMaskVisibility();
    
    // DO NOT show UI yet - wait for EXPAND-to-scrollbars to complete
    // UI visibility is NOT updated here - it stays hidden until EXPAND happens
    
    // After animation completes (2000ms), entry animation is done
    // But UI must STAY HIDDEN - it only becomes visible after EXPAND-to-scrollbars
    setTimeout(() => {
        // Entry animation complete - but UI stays hidden
        // hasExpandedToScrollbars remains false until EXPAND happens
        console.log('ENTRY_ANIMATION_COMPLETE', {
            introPhase: introPhase,
            hasExpandedToScrollbars: hasExpandedToScrollbars,
            timestamp: new Date().toISOString()
        });
        
        // Verify UI is still hidden after entry animation
        updateUIVisibility();
        
        // Trigger auto-scroll demo when intro text is visible
        triggerAutoScrollDemo();
        
        // Note: Header (first rectangle at index 0) visibility is controlled by intro container visibility
    }, 2000);
}

// Function to initialize gradient intro
function initializeGradientIntro() {
    const container = document.getElementById('gradient-intro-container');
    if (!container) return;
    
    // Add entering phase class to container
    container.classList.add('intro-entering');
    
    // Create 6 gradient rectangles (one for each visible position)
    const itemHeight = window.innerHeight / 6;
    for (let i = 0; i < 6; i++) {
        const rect = document.createElement('div');
        rect.className = 'gradient-intro-rectangle';
        rect.style.top = `${i * itemHeight}px`;
        rect.setAttribute('data-bar-index', i); // Store index for staggered delay calculation
        container.appendChild(rect);
    }
    
    // Create instructional text for the 5th gradient rectangle (index 4)
    const introText = document.createElement('div');
    introText.className = 'gradient-intro-text';
    introText.textContent = '[scroll the right and left bars]';
    introText.id = 'gradient-intro-text';
    // Ensure text starts hidden (opacity 0) - will fade in during entry animation
    // CSS will handle the transition, but we set initial state explicitly
    introText.style.opacity = '0';
    container.appendChild(introText);
    
    // Create downward arrow element below START text
    const arrowElement = document.createElement('div');
    arrowElement.className = 'gradient-intro-arrow';
    arrowElement.id = 'gradient-intro-arrow';
    arrowElement.textContent = '↓';
    // Hide arrow by default (only show when START text is visible)
    arrowElement.style.display = 'none';
    arrowElement.style.visibility = 'hidden';
    arrowElement.style.opacity = '0';
    container.appendChild(arrowElement);
    
    // Initial update (will set full-bleed state for 'entering' phase)
    updateGradientIntro();
    
    // Start entry animation after a delay to ensure layout is ready and add extra delay for better UX
    requestAnimationFrame(() => {
        setTimeout(() => {
            startEntryAnimation();
        }, 500); // Delay to allow initial state to render and add extra delay before animation starts
    });
}

// Function to update gradient intro rectangles (internal - uses centralized state)
function updateGradientIntroFromColors(baseLeftColor, baseRightColor) {
    // CRITICAL: Early return if intro is completed - prevent any intro layout updates
    if (introCompleted) {
        console.log('INTRO_UPDATE_BLOCKED', {
            reason: 'introCompleted === true',
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    const container = document.getElementById('gradient-intro-container');
    if (!container) return;
    
    const rectangles = container.querySelectorAll('.gradient-intro-rectangle');
    const itemHeight = window.innerHeight / 6;
    
    // Calculate gradient rectangle dimensions based on intro phase
    // Reference: scrollbar items have default/collapsed width of 50px (not the expanded 85px)
    const SCROLLBAR_COLLAPSED_WIDTH = 50; // Default width of color items
    const SCROLLBAR_EXPANDED_WIDTH = 85; // Expanded width of color items on hover
    const GRADIENT_GAP = SCROLLBAR_EXPANDED_WIDTH - SCROLLBAR_COLLAPSED_WIDTH; // 35px gap (expansion delta)
    let leftEdge, rightEdge, width;
    
    if (introPhase === 'entering') {
        // Entry phase: full-bleed across entire viewport
        leftEdge = 0;
        width = window.innerWidth;
    } else if (introPhase === 'closing') {
        // Expanded state: use real DOM geometry to calculate inner edges
        const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
        const containerRect = container.getBoundingClientRect();
        
        // Convert page coordinates to container-local coordinates
        leftEdge = leftInnerX - containerRect.left;
        width = rightInnerX - leftInnerX;
    } else {
        // Active state: with 35px gap on each side (matching expansion delta)
        // - Left edge of gradient: inner edge of left scrollbar + 35px = 50px + 35px = 85px
        // - Right edge of gradient: inner edge of right scrollbar - 35px = (window.innerWidth - 50px) - 35px = window.innerWidth - 85px
        leftEdge = SCROLLBAR_COLLAPSED_WIDTH + GRADIENT_GAP; // 85px from left
        rightEdge = window.innerWidth - SCROLLBAR_COLLAPSED_WIDTH - GRADIENT_GAP; // window.innerWidth - 85px from left
        width = rightEdge - leftEdge; // window.innerWidth - 170px
    }
    
    // Update each gradient rectangle
    // Row 0 shows the selected colors, row 1 shows the next colors, etc.
    rectangles.forEach((rect, index) => {
        // Calculate color index for this row: base index + row offset
        const leftColorIndex = (selectedLeftIndex + index) % colors.length;
        const rightColorIndex = (selectedRightIndex + index) % colors.length;
        
        // Get colors from indices
        const leftColor = getColorFromIndex(leftColorIndex);
        const rightColor = getColorFromIndex(rightColorIndex);
        
        // DEBUG: Log which gradient row is being set
        if (index === 0 || index === 4) { // Log first and 5th row (where START text is)
            console.log(`GRADIENT_ROW_${index}`, {
                leftColorIndex: leftColorIndex,
                rightColorIndex: rightColorIndex,
                leftColor: leftColor,
                rightColor: rightColor,
                baseLeftIndex: selectedLeftIndex,
                baseRightIndex: selectedRightIndex,
                timestamp: new Date().toISOString()
            });
        }
        
        // Set gradient: starts with left color (left edge), ends with right color (right edge)
        // This ensures: left scrollbar → left edge of gradient, right scrollbar → right edge of gradient
        rect.style.background = `linear-gradient(to right, ${leftColor}, ${rightColor})`;
        rect.style.left = `${leftEdge}px`;
        rect.style.width = `${width}px`;
        rect.style.height = `${itemHeight}px`;
    });
    
    // Position instructional text in the 5th gradient rectangle (index 4)
    // Text fades in during entry animation (synced with gradient shrink)
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        const fifthRectIndex = 4; // 5th rectangle (0-indexed)
        const fifthRectTop = fifthRectIndex * itemHeight;
        
        // Position text in the 5th rectangle (positioned even during entering phase for fade-in)
        introText.style.left = `${leftEdge}px`;
        introText.style.width = `${width}px`;
        introText.style.top = `${fifthRectTop}px`;
        introText.style.height = `${itemHeight}px`;
        introText.style.display = 'flex';
        introText.style.alignItems = 'center';
        introText.style.justifyContent = 'center';
        introText.style.visibility = 'visible';
        // DO NOT set opacity inline - let CSS classes control it for smooth transition
        // Opacity is controlled by CSS classes (intro-entering = 0, intro-active = 1)
        // This allows the fade-in to sync with the gradient shrink animation
    }
    
    // Position arrow element below START text (only when START is visible and not entering)
    const arrowElement = document.getElementById('gradient-intro-arrow');
    if (arrowElement) {
        if (introPhase === 'entering') {
            // Hide arrow during entry animation
            arrowElement.style.display = 'none';
            arrowElement.style.visibility = 'hidden';
            arrowElement.style.opacity = '0';
        } else if (introText && introText.textContent === '[start]') {
            const fifthRectIndex = 4; // 5th rectangle (0-indexed)
            const fifthRectTop = fifthRectIndex * itemHeight;
            
            // Position arrow centered below START text
            // Calculate vertical offset: START text is centered, so we add some spacing below it
            const arrowTop = fifthRectTop + (itemHeight / 2) + 30; // 30px below center of START text
            
            arrowElement.style.left = `${leftEdge}px`;
            arrowElement.style.width = `${width}px`;
            arrowElement.style.top = `${arrowTop}px`;
            arrowElement.style.display = 'flex';
            arrowElement.style.alignItems = 'center';
            arrowElement.style.justifyContent = 'center';
        }
    }
}

// Legacy function for backward compatibility (now uses centralized state)
function updateGradientIntro() {
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    updateGradientIntroFromColors(leftColor, rightColor);
}

// Update gradient intro on window resize
window.addEventListener('resize', () => {
    updateGradientIntro();
    // Also update main gradient header on resize
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    updateMainGradientHeader(leftColor, rightColor);
    // Re-align rectangles with ESTHESIA after resize
    alignRectanglesWithEsthesia();
});

// Function to get the inner edges of scrollbars in closed state
function getClosedScrollbarInnerEdges() {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) {
        return { leftInnerX: 0, rightInnerX: 0 };
    }
    
    // Get bounding rects for both columns
    const leftColumnRect = leftColumn.getBoundingClientRect();
    const rightColumnRect = rightColumn.getBoundingClientRect();
    
    // Closed state scrollbar item width is 50px
    const SCROLLBAR_CLOSED_WIDTH = 50;
    
    // Left scrollbar is anchored to left side, so inner edge = left + 50
    const leftInnerX = leftColumnRect.left + SCROLLBAR_CLOSED_WIDTH;
    
    // Right scrollbar is anchored to right side, so inner edge = right - 50
    const rightInnerX = rightColumnRect.right - SCROLLBAR_CLOSED_WIDTH;
    
    return { leftInnerX, rightInnerX };
}

// Function to get the outer edges of scrollbars in closed state
// Used for main gradient header positioning
function getClosedScrollbarOuterEdges() {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) {
        return { leftOuterX: 0, rightOuterX: window.innerWidth };
    }
    
    // Get bounding rects for both columns
    const leftColumnRect = leftColumn.getBoundingClientRect();
    const rightColumnRect = rightColumn.getBoundingClientRect();
    
    // Left scrollbar outer edge is at the left edge of the viewport (left: 0)
    const leftOuterX = leftColumnRect.left; // Should be 0
    
    // Right scrollbar outer edge is at the right edge of the viewport
    const rightOuterX = rightColumnRect.right; // Should be window.innerWidth
    
    return { leftOuterX, rightOuterX };
}

// ==================
// MAIN GRADIENT HEADER FUNCTIONS (persistent header on main screen)
// ==================

// Function to initialize main gradient header
function initializeMainGradientHeader() {
    const header = document.getElementById('main-gradient-header');
    if (!header) return;
    
    // Header starts hidden (will be shown when intro completes)
    header.classList.remove('visible');
    
    // Initial update with current colors
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    updateMainGradientHeader(leftColor, rightColor);
}

// Function to update main gradient header with colors and positioning
function updateMainGradientHeader(leftColor, rightColor) {
    const header = document.getElementById('main-gradient-header');
    if (!header) return;
    
    // Get scrollbar inner edges - gradient rectangle should span the visible area
    // This ensures the left color starts at the left edge of the visible gradient
    // and the right color ends at the right edge of the visible gradient
    const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
    const itemHeight = window.innerHeight / 6;
    
    // Set gradient: starts with left color (left edge of rectangle), ends with right color (right edge of rectangle)
    // The gradient interpolation is computed only across the rectangle's width
    header.style.background = `linear-gradient(to right, ${leftColor}, ${rightColor})`;
    header.style.left = `${leftInnerX}px`;
    header.style.width = `${rightInnerX - leftInnerX}px`;
    header.style.height = `${itemHeight}px`;
}

// Function to show main gradient header (called when horizontal expansion starts, so it appears while intro gradients collapse)
function showMainGradientHeader() {
    const header = document.getElementById('main-gradient-header');
    if (!header) return;
    
    // Add visible class to show the header
    header.classList.add('visible');
    
    // Update with current colors
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    updateMainGradientHeader(leftColor, rightColor);
    
    console.log('MAIN_GRADIENT_HEADER_SHOWN', {
        leftColor: leftColor,
        rightColor: rightColor,
        timestamp: new Date().toISOString()
    });
}

// Function to trigger final intro cleanup (called when progress reaches 1)
function triggerIntroTransition() {
    // Safety check: only allow if intro is ready and not already triggered
    if (!introReady || introTriggered) {
        return;
    }
    
    // Mark as triggered immediately to prevent multiple triggers
    introTriggered = true;
    
    // Get intro text and hide it immediately
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        introText.style.display = 'none';
        introText.style.visibility = 'hidden';
        introText.style.opacity = '0';
        introText.style.pointerEvents = 'none';
    }
    
    // Hide arrow when intro is triggered
    const arrowElement = document.getElementById('gradient-intro-arrow');
    if (arrowElement) {
        arrowElement.style.display = 'none';
        arrowElement.style.visibility = 'hidden';
        arrowElement.style.opacity = '0';
        arrowElement.style.pointerEvents = 'none';
    }
    
    // Get gradient container
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer) {
        console.error('Gradient container not found');
        return;
    }
    
    // Log to console
    console.log('INTRO_FULLY_CLOSED_BY_CENTER_SCROLL');
    
    // Heights are already at 0 (progress = 1), so we can set final state immediately
    // Wait for horizontal expansion to complete (400ms) before setting final state
    setTimeout(() => {
        // Set final collapsed state
        gradientContainer.classList.add('intro-collapsed');
        gradientContainer.classList.remove('intro-closing');
        
        // CRITICAL: Disable intro container after completion
        // Hide it completely and disable pointer events
        // The wheel event listener will early-return due to introCompleted check, so no need to remove it
        gradientContainer.style.display = 'none';
        gradientContainer.style.visibility = 'hidden';
        gradientContainer.style.opacity = '0';
        gradientContainer.style.pointerEvents = 'none';
        
        console.log('INTRO_COMPLETED', {
            introCompleted: introCompleted,
            timestamp: new Date().toISOString()
        });
        
        console.log('INTRO_FINAL_STATE_SET', {
            timestamp: new Date().toISOString()
        });
        
        // Show main gradient header when intro completes
        showMainGradientHeader();
        
        // Hide canvas cover to reveal canvas content
        updateCanvasCoverVisibility();
        
        // Hide UI mask when intro completes
        updateUIMaskVisibility();
    }, 400); // Match CSS transition duration for horizontal expansion
}

// Function to start horizontal expansion (called once when scrolling begins)
function startHorizontalExpansion() {
    // CRITICAL: Early return if intro is completed - prevent expansion from restarting
    if (introCompleted) {
        console.log('HORIZONTAL_EXPANSION_BLOCKED', {
            reason: 'introCompleted === true',
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    if (horizontalExpansionStarted) return;
    horizontalExpansionStarted = true;
    
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer) return;
    
    // Set closing state and add intro-closing class
    introPhase = 'closing';
    gradientContainer.classList.add('intro-active');
    gradientContainer.classList.add('intro-closing');
    
    // Get inner edges of scrollbars in closed state
    const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
    const targetWidth = rightInnerX - leftInnerX;
    
    const containerRect = gradientContainer.getBoundingClientRect();
    const gradientBars = document.querySelectorAll('.gradient-intro-rectangle');
    
    // Set target left/width for horizontal expansion (CSS transition will animate)
    gradientBars.forEach((bar) => {
        const containerLocalLeft = leftInnerX - containerRect.left;
        bar.style.left = containerLocalLeft + 'px';
        bar.style.width = targetWidth + 'px';
        bar.style.outline = 'none';
        bar.style.border = 'none';
        bar.style.boxShadow = 'none';
    });
    
    // Update gradient intro to trigger expansion animation and update colors
    updateGradientIntro();
    
    // Show main gradient header immediately when horizontal expansion starts
    // This ensures the menu gradient appears while intro gradients are collapsing
    showMainGradientHeader();
    
    // Update UI mask visibility immediately when transition starts
    // This shows the white background layer to mask UI elements
    updateUIMaskVisibility();
    
    // Wait for horizontal expansion animation to complete (400ms) before showing UI
    // UI becomes visible ONLY AFTER gradients have expanded to reach the scrollbars
    setTimeout(() => {
        hasExpandedToScrollbars = true;
        updateUIVisibility();
        // Hide canvas cover to reveal canvas content when gradients fully expand
        updateCanvasCoverVisibility();
        // Hide UI mask when transition completes
        updateUIMaskVisibility();
    }, 400); // Match CSS transition duration for horizontal expansion
}

// Function to update gradient bar heights based on progress
function updateGradientBarHeights(progress) {
    // CRITICAL: Early return if intro is completed - prevent height updates
    if (introCompleted) {
        console.log('GRADIENT_BAR_HEIGHT_UPDATE_BLOCKED', {
            reason: 'introCompleted === true',
            progress: progress,
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    const gradientBars = document.querySelectorAll('.gradient-intro-rectangle');
    const itemHeight = window.innerHeight / 6; // Initial height of each bar
    const initialHeight = itemHeight;
    const totalBars = gradientBars.length;
    
    // Use one global scrollProgress (0 → 1) driven by user's scroll
    const scrollProgress = progress;
    
    // Linear interpolation helper function
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    // Clamp helper function
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    gradientBars.forEach((bar) => {
        // Get bar index from data attribute (0 = top, N-1 = bottom)
        const index = parseInt(bar.getAttribute('data-bar-index'), 10);
        
        // Calculate speed multiplier per row: bottom (highest index) has highest speed
        // Widened range for more pronounced cascade effect
        // speed(i) = lerp(0.4, 2.2, i/(N-1))
        // Top bar (i=0): speed = 0.4 (slowest - visibly lags behind)
        // Bottom bar (i=5): speed = 2.2 (fastest - rushes to disappearance)
        const speed = lerp(0.4, 2.2, index / (totalBars - 1));
        
        // FIXED: Remap progress to prevent asymptotic flattening near the end
        // Problem: With rowProgress = clamp(scrollProgress * speed, 0, 1),
        // blocks with lower speeds (e.g., 0.76) only reach ~0.76 when scrollProgress = 1.0,
        // causing a visual plateau where height changes become imperceptibly small.
        // Solution: Calculate base progress with speed multiplier (maintains cascade),
        // apply easing for consistent visual change rate, then boost to ensure completion.
        
        // Step 1: Calculate base progress with speed multiplier (maintains cascade effect)
        // This creates the staggered collapse effect where different blocks progress at different rates
        const baseProgress = clamp(scrollProgress * speed, 0, 1);
        
        // Step 2: Apply easing to base progress to ensure consistent visual change rate
        // Use easeInOut cubic to prevent flat sections and ensure smooth acceleration throughout
        // This is critical for blocks with lower speeds to maintain visible change at all stages
        let easedProgress = baseProgress < 0.5
            ? 4 * baseProgress * baseProgress * baseProgress
            : 1 - Math.pow(-2 * baseProgress + 2, 3) / 2;
        easedProgress = clamp(easedProgress, 0, 1);
        
        // Step 3: Apply completion boost to ensure all blocks reach 1.0 when scrollProgress = 1.0
        // The boost starts gradually around scrollProgress = 0.65 and becomes stronger near 1.0
        // This prevents the "plateau and snap" effect by smoothly accelerating blocks to completion
        const boostStart = 0.65; // Start boosting when 65% of scroll is complete
        const boostStrength = scrollProgress > boostStart
            ? Math.pow((scrollProgress - boostStart) / (1.0 - boostStart), 1.8) // Smooth power curve
            : 0;
        
        // Step 4: Interpolate between eased progress and full completion based on boost
        // This ensures blocks with lower speeds are smoothly accelerated to completion
        // while maintaining the cascade effect during early/mid scroll
        const rowProgress = clamp(lerp(easedProgress, 1.0, boostStrength), 0, 1);
        
        // Apply shrink based on rowProgress: height = baseHeight * (1 - rowProgress)
        const newHeight = initialHeight * (1 - rowProgress);
        
        // Update height (no delays - all bars respond to same scroll input at different speeds)
        bar.style.height = `${newHeight}px`;
    });
}

// Function to initialize center scroll trigger for intro
function initializeCenterScrollTrigger() {
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer) return;
    
    // Attach wheel event listener to the center gradient container
    gradientContainer.addEventListener('wheel', (e) => {
        // CRITICAL: Check if intro is completed - if so, ignore all wheel events
        if (introCompleted) {
            console.log('CENTER_SCROLL_BLOCKED', {
                reason: 'introCompleted === true',
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        // CRITICAL: Block center scroll during entry animation
        if (introPhase === 'entering') {
            return;
        }
        
        // Check gating: if intro is not ready or already triggered, ignore
        if (!introReady || introTriggered) {
            return;
        }
        
        // CRITICAL: Check if the event originated from a scrollbar column
        // If the target or any parent is a column-container, let it propagate normally
        const target = e.target;
        const isInScrollbar = target.closest('.column-container');
        if (isInScrollbar) {
            // This is a scrollbar scroll - let it work normally
            return;
        }
        
        // Check if the wheel event is in the center area (not over scrollbars)
        const mouseX = e.clientX;
        const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
        
        // Only process if mouse is in the center area (between scrollbars)
        if (mouseX >= leftInnerX && mouseX <= rightInnerX) {
            // Prevent default scrolling behavior
            e.preventDefault();
            
            // Calculate delta progress: deltaY / threshold
            const deltaProgress = e.deltaY / SCROLL_THRESHOLD;
            
            // Update progress based on scroll direction
            if (e.deltaY > 0) {
                // Scrolling down: increase progress
                introProgress = Math.min(1, introProgress + Math.abs(deltaProgress));
            } else if (e.deltaY < 0) {
                // Scrolling up: decrease progress (only if not completed)
                // Reopening is allowed only if p < 1 and intro is not completed
                if (!introCompleted && introProgress < 1) {
                    introProgress = Math.max(0, introProgress - Math.abs(deltaProgress));
                }
                // If introCompleted is true, ignore upward scroll (do nothing)
            }
            
            // Clamp progress to [0, 1]
            introProgress = Math.min(1, Math.max(0, introProgress));
            
            // Start horizontal expansion when scrolling begins (progress > 0)
            if (introProgress > 0 && !horizontalExpansionStarted) {
                startHorizontalExpansion();
            }
            
            // Update gradient bar heights progressively
            updateGradientBarHeights(introProgress);
            
            // When progress reaches 1 for the first time, lock it
            if (introProgress >= 1 && !introCompleted) {
                introCompleted = true;
                console.log('INTRO_COMPLETED', {
                    introProgress: introProgress,
                    introCompleted: introCompleted,
                    timestamp: new Date().toISOString()
                });
                // Update UI visibility - UI remains visible after intro is done
                updateUIVisibility();
                
                // Hide canvas cover to reveal canvas content
                updateCanvasCoverVisibility();
                
                // Note: Header (first rectangle at index 0) visibility is controlled by intro container visibility
                
                // Trigger final cleanup
                if (!introTriggered) {
                    triggerIntroTransition();
                }
            }
        }
        // If mouse is over scrollbars, let the event propagate normally (don't preventDefault)
    }, { passive: false });
}

// Function to reverse the intro transition (main → intro)
// Reuses the existing scroll-driven collapse logic, animating progress from 1 → 0
function reverseIntroTransition() {
    // Only allow reverse if intro is completed (we're on main screen)
    if (!introCompleted) {
        console.log('REVERSE_TRANSITION_BLOCKED', {
            reason: 'introCompleted === false',
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    console.log('REVERSE_INTRO_TRANSITION_START', {
        timestamp: new Date().toISOString()
    });
    
    // Keep main gradient header visible - don't hide it during reverse transition
    // The intro gradient rectangles will animate on top of it (higher z-index)
    
    // Hide UI immediately
    updateUIVisibility();
    
    // Show canvas cover
    updateCanvasCoverVisibility();
    
    // Get gradient container
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer) {
        console.error('Gradient container not found');
        return;
    }
    
    // Show and prepare container
    gradientContainer.style.display = '';
    gradientContainer.style.visibility = 'visible';
    gradientContainer.style.opacity = '1';
    gradientContainer.style.pointerEvents = 'auto';
    
    // Remove collapsed class if present
    gradientContainer.classList.remove('intro-collapsed');
    
    // Get or create gradient rectangles
    let rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
    const itemHeight = window.innerHeight / 6;
    
    // If rectangles don't exist, create them
    if (rectangles.length === 0) {
        for (let i = 0; i < 6; i++) {
            const rect = document.createElement('div');
            rect.className = 'gradient-intro-rectangle';
            rect.style.top = `${i * itemHeight}px`;
            rect.setAttribute('data-bar-index', i);
            gradientContainer.appendChild(rect);
        }
        rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
    }
    
    // Temporarily allow updates (bypass introCompleted check)
    const wasIntroCompleted = introCompleted;
    const wasHorizontalExpansionStarted = horizontalExpansionStarted;
    introCompleted = false;
    horizontalExpansionStarted = false; // Allow reversing horizontal expansion
    
    // Ensure we're in closing phase (rectangles at scrollbar edges)
    introPhase = 'closing';
    gradientContainer.classList.add('intro-active');
    gradientContainer.classList.add('intro-closing');
    
    // Set up initial state: rectangles at scrollbar edges (like closing phase)
    // This matches the state when progress = 1
    const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
    const containerRect = gradientContainer.getBoundingClientRect();
    const containerLocalLeft = leftInnerX - containerRect.left;
    const targetWidth = rightInnerX - leftInnerX;
    
    rectangles.forEach((bar) => {
        bar.style.left = containerLocalLeft + 'px';
        bar.style.width = targetWidth + 'px';
    });
    
    // Update colors for closing phase
    updateGradientIntro();
    
    // Get or create intro text element
    let introText = document.getElementById('gradient-intro-text');
    if (!introText) {
        introText = document.createElement('div');
        introText.className = 'gradient-intro-text';
        introText.id = 'gradient-intro-text';
        gradientContainer.appendChild(introText);
    }
    
    // Get or create arrow element
    let arrowElement = document.getElementById('gradient-intro-arrow');
    if (!arrowElement) {
        arrowElement = document.createElement('div');
        arrowElement.className = 'gradient-intro-arrow';
        arrowElement.id = 'gradient-intro-arrow';
        arrowElement.textContent = '↓';
        gradientContainer.appendChild(arrowElement);
    }
    
    // Hide text and arrow during reverse animation (CSS will also hide them in intro-closing phase)
    introText.style.display = 'none';
    introText.style.visibility = 'hidden';
    introText.style.opacity = '0';
    arrowElement.style.display = 'none';
    arrowElement.style.visibility = 'hidden';
    arrowElement.style.opacity = '0';
    
    // Start with progress = 1 (fully collapsed state)
    introProgress = 1;
    
    // Set initial heights to 0 (collapsed state)
    updateGradientBarHeights(introProgress);
    
    // Animation parameters
    const duration = 2000; // 2 seconds for the reverse animation
    const startTime = performance.now();
    const startProgress = 1;
    const endProgress = 0;
    
    // Easing function (easeInOutCubic for smooth animation)
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Animation loop
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing
        const easedProgress = easeInOutCubic(progress);
        
        // Interpolate progress from 1 → 0
        const currentProgress = startProgress + (endProgress - startProgress) * easedProgress;
        introProgress = currentProgress;
        
        // Update gradient bar heights using existing collapse logic
        updateGradientBarHeights(introProgress);
        
        // Handle phase transitions based on progress
        // When progress is low enough (< 0.2), transition from closing → active (contract horizontally)
        // This happens while heights are still expanding, creating a smooth combined effect
        if (introProgress < 0.2 && introPhase === 'closing') {
            introPhase = 'active';
            gradientContainer.classList.remove('intro-closing');
            gradientContainer.classList.add('intro-active');
            
            // Update to active state (narrowed with gap) - this will contract horizontally
            // CSS transition (400ms) will animate the horizontal contraction smoothly
            updateGradientIntro();
        }
        
        // Continue animation until progress reaches 0
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete - ensure progress is exactly 0
            introProgress = 0;
            updateGradientBarHeights(0);
            
            // Ensure we're in active phase (should already be set above, but double-check)
            if (introPhase !== 'active') {
                introPhase = 'active';
                gradientContainer.classList.remove('intro-closing');
                gradientContainer.classList.add('intro-active');
                updateGradientIntro();
            }
            
            // Wait for horizontal contraction to complete (400ms), then transition to entering phase
            setTimeout(() => {
                introPhase = 'entering';
                gradientContainer.classList.remove('intro-active');
                gradientContainer.classList.add('intro-entering');
                
                // Update to entering state (full-bleed) - this will expand to full width
                // CSS transition (2000ms) will animate the expansion smoothly
                updateGradientIntro();
                
                // Once full-bleed expansion completes, reset state and restart intro
                setTimeout(() => {
                    // Restore flags
                    introCompleted = wasIntroCompleted;
                    horizontalExpansionStarted = wasHorizontalExpansionStarted;
                    
                    // Now restart intro (which will reset everything properly)
                    restartIntro();
                }, 2000); // Match CSS transition duration for entering phase
            }, 400); // Match CSS transition duration for closing → active
        }
    }
    
    // Start animation
    requestAnimationFrame(animate);
}

// Function to go to START checkpoint (main → expand → START, no intro restart)
// This is used when clicking the logo to return to START without replaying intro/demo
function goToStartCheckpoint() {
    // Only allow if intro is completed (we're on main screen)
    if (!introCompleted) {
        console.log('GO_TO_START_BLOCKED', {
            reason: 'introCompleted === false',
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    console.log('GO_TO_START_CHECKPOINT_START', {
        timestamp: new Date().toISOString()
    });
    
    // Hide UI immediately
    updateUIVisibility();
    
    // Show canvas cover
    updateCanvasCoverVisibility();
    
    // CRITICAL: Keep main gradient header visible at all times
    // It should remain visible during reverse transition and in START state
    // The intro gradient rectangles will animate on top of it (higher z-index)
    showMainGradientHeader();
    
    // Get gradient container
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer) {
        console.error('Gradient container not found');
        return;
    }
    
    // Show and prepare container
    gradientContainer.style.display = '';
    gradientContainer.style.visibility = 'visible';
    gradientContainer.style.opacity = '1';
    gradientContainer.style.pointerEvents = 'auto';
    
    // Remove collapsed class if present
    gradientContainer.classList.remove('intro-collapsed');
    
    // Get or create gradient rectangles
    let rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
    const itemHeight = window.innerHeight / 6;
    
    // If rectangles don't exist, create them
    if (rectangles.length === 0) {
        for (let i = 0; i < 6; i++) {
            const rect = document.createElement('div');
            rect.className = 'gradient-intro-rectangle';
            rect.style.top = `${i * itemHeight}px`;
            rect.setAttribute('data-bar-index', i);
            gradientContainer.appendChild(rect);
        }
        rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
    }
    
    // Temporarily allow updates (bypass introCompleted check during animation)
    const wasIntroCompleted = introCompleted;
    introCompleted = false;
    
    // Ensure we're in closing phase initially (rectangles at scrollbar edges)
    introPhase = 'closing';
    gradientContainer.classList.add('intro-active');
    gradientContainer.classList.add('intro-closing');
    
    // Set up initial state: rectangles at scrollbar edges (like closing phase)
    const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
    const containerRect = gradientContainer.getBoundingClientRect();
    const containerLocalLeft = leftInnerX - containerRect.left;
    const targetWidth = rightInnerX - leftInnerX;
    
    rectangles.forEach((bar) => {
        bar.style.left = containerLocalLeft + 'px';
        bar.style.width = targetWidth + 'px';
    });
    
    // Update colors for closing phase
    updateGradientIntro();
    
    // Start with progress = 1 (fully collapsed state)
    introProgress = 1;
    
    // Set initial heights to 0 (collapsed state)
    updateGradientBarHeights(introProgress);
    
    // Animation parameters
    const duration = 2000; // 2 seconds for the reverse animation
    const startTime = performance.now();
    const startProgress = 1;
    const endProgress = 0;
    
    // Easing function (easeInOutCubic for smooth animation)
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Animation loop
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing
        const easedProgress = easeInOutCubic(progress);
        
        // Interpolate progress from 1 → 0
        const currentProgress = startProgress + (endProgress - startProgress) * easedProgress;
        introProgress = currentProgress;
        
        // Update gradient bar heights using existing collapse logic
        updateGradientBarHeights(introProgress);
        
        // Handle phase transitions based on progress
        // When progress is low enough (< 0.2), transition from closing → active (contract horizontally)
        if (introProgress < 0.2 && introPhase === 'closing') {
            introPhase = 'active';
            gradientContainer.classList.remove('intro-closing');
            gradientContainer.classList.add('intro-active');
            
            // Update to active state (narrowed with gap) - this will contract horizontally
            updateGradientIntro();
            
            // Update UI mask visibility - mask should appear when gap is visible
            updateUIMaskVisibility();
        }
        
        // Continue animation until progress reaches 0
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete - ensure progress is exactly 0
            introProgress = 0;
            updateGradientBarHeights(0);
            
            // Ensure we're in active phase (should already be set above, but double-check)
            if (introPhase !== 'active') {
                introPhase = 'active';
                gradientContainer.classList.remove('intro-closing');
                gradientContainer.classList.add('intro-active');
                updateGradientIntro();
            }
            
            // Wait for horizontal contraction to complete (400ms), then set START checkpoint state
            setTimeout(() => {
                // Set START checkpoint state variables
                introCompleted = false; // Keep false so scrolling works
                horizontalExpansionStarted = false; // Reset so it can start again when scrolling
                hasExpandedToScrollbars = true; // Scrollbars are visible at START
                introReady = true; // Enable center scroll trigger
                introTriggered = false; // Not yet triggered
                introTextChanged = true; // Text is "[start]"
                
                // Set START text (CSS will handle opacity since we're in intro-active phase)
                introText.textContent = '[start]';
                // Remove any inline styles that might override CSS
                introText.style.display = '';
                introText.style.visibility = '';
                introText.style.opacity = '';
                
                // Update gradient intro to position text and arrow correctly
                // This must be called after setting text content to '[start]' so arrow positioning works
                updateGradientIntro();
                
                // Show arrow (positioning is handled by updateGradientIntro, but visibility needs to be set)
                arrowElement.style.display = 'flex';
                arrowElement.style.visibility = 'visible';
                arrowElement.style.opacity = '0.7';
                
                // UI stays hidden (we're in START state, not main screen)
                updateUIVisibility();
                
                // Canvas cover stays visible (we're in START state)
                updateCanvasCoverVisibility();
                
                // Update UI mask visibility - should be visible at START checkpoint with gap
                updateUIMaskVisibility();
                
                // CRITICAL: Ensure main gradient header stays visible in START state
                // It should remain visible under the UI at all times
                showMainGradientHeader();
                
                console.log('START_CHECKPOINT_REACHED', {
                    introPhase: introPhase,
                    introProgress: introProgress,
                    introReady: introReady,
                    introCompleted: introCompleted,
                    hasExpandedToScrollbars: hasExpandedToScrollbars,
                    timestamp: new Date().toISOString()
                });
            }, 400); // Match CSS transition duration for closing → active
        }
    }
    
    // Start animation
    requestAnimationFrame(animate);
}

// Function to restart the intro sequence
// Resets all intro-related state and replays the intro from the beginning
function restartIntro() {
    console.log('INTRO_RESTART', {
        timestamp: new Date().toISOString()
    });
    
    // Reset all intro-related state variables
    introPhase = 'entering';
    introReady = false;
    introTriggered = false;
    introProgress = 0;
    introCompleted = false;
    horizontalExpansionStarted = false;
    hasExpandedToScrollbars = false;
    autoScrollDemoRun = false;
    autoScrollDemoActive = false;
    
    // Reset intro text state
    introTextChanged = false;
    leftColumnScrolled = false;
    rightColumnScrolled = false;
    uniqueColorsSeen.clear();
    hasUserInteracted = false;
    
    // Get gradient container and clean up existing DOM elements
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (gradientContainer) {
        // Remove all existing gradient rectangles
        const rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
        rectangles.forEach(rect => rect.remove());
        
        // Remove intro text if it exists
        const introText = document.getElementById('gradient-intro-text');
        if (introText) {
            introText.remove();
        }
        
        // Remove arrow element if it exists
        const arrowElement = document.getElementById('gradient-intro-arrow');
        if (arrowElement) {
            arrowElement.remove();
        }
        
        // Reset container classes and styles
        gradientContainer.classList.remove('intro-active', 'intro-closing', 'intro-collapsed');
        gradientContainer.classList.add('intro-entering');
        gradientContainer.style.display = '';
        gradientContainer.style.visibility = '';
        gradientContainer.style.opacity = '';
        gradientContainer.style.pointerEvents = 'auto';
    }
    
    // Hide main gradient header
    const mainHeader = document.getElementById('main-gradient-header');
    if (mainHeader) {
        mainHeader.classList.remove('visible');
    }
    
    // Reset UI visibility (will be hidden during entering phase)
    updateUIVisibility();
    
    // Reset canvas cover visibility (will be visible during intro)
    updateCanvasCoverVisibility();
    
    // Ensure logo remains clickable after restart
    const logoElement = document.querySelector('.black-rectangle');
    if (logoElement) {
        logoElement.style.pointerEvents = 'auto';
        logoElement.style.cursor = 'pointer';
    }
    
    // Re-initialize the gradient intro (this will create new rectangles and start the animation)
    initializeGradientIntro();
    
    console.log('INTRO_RESTART_COMPLETE', {
        introPhase: introPhase,
        introCompleted: introCompleted,
        timestamp: new Date().toISOString()
    });
}

// Function to initialize logo click handler
function initializeLogoClickHandler() {
    const logoElement = document.querySelector('.black-rectangle');
    if (!logoElement) {
        console.warn('Logo element (.black-rectangle) not found');
        return;
    }
    
    // CRITICAL: Enable pointer events (CSS has pointer-events: none by default)
    // This allows the logo to receive click events
    logoElement.style.pointerEvents = 'auto';
    
    // Add cursor pointer style to indicate it's clickable
    logoElement.style.cursor = 'pointer';
    
    // Add click handler to go to START checkpoint
    logoElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('LOGO_CLICKED', {
            timestamp: new Date().toISOString()
        });
        
        // If intro is completed, go to START checkpoint (no intro restart)
        if (introCompleted) {
            goToStartCheckpoint();
        } else {
            // If intro is not completed, just restart (shouldn't happen normally)
            restartIntro();
        }
    });
    
    console.log('LOGO_CLICK_HANDLER_INITIALIZED', {
        timestamp: new Date().toISOString()
    });
}

// Function to check if intro text should be updated
function checkAndUpdateIntroText() {
    // Don't change if already changed
    if (introTextChanged) return;
    
    // Check conditions: either scrollbar scrolled OR 5+ unique colors seen
    const oneScrolled = leftColumnScrolled || rightColumnScrolled;
    const fiveColorsSeen = uniqueColorsSeen.size >= 5;
    
    // DEBUG: Log every check (even if conditions not met)
    const introText = document.getElementById('gradient-intro-text');
    const currentText = introText ? introText.textContent : 'NOT FOUND';
    
    console.log('CHECK_INTRO_TEXT', {
        currentText: currentText,
        oneScrolled: oneScrolled,
        fiveColorsSeen: fiveColorsSeen,
        leftHasScrolled: leftColumnScrolled,
        rightHasScrolled: rightColumnScrolled,
        uniqueColorCount: uniqueColorsSeen.size,
        uniqueColors: [...uniqueColorsSeen],
        hasUserInteracted: hasUserInteracted,
        willChange: oneScrolled || fiveColorsSeen,
        timestamp: new Date().toISOString()
    });
    
    if (oneScrolled || fiveColorsSeen) {
        if (introText) {
            const fromText = introText.textContent;
            introText.textContent = '[start]';
            introTextChanged = true;
            
            // Enable center scroll trigger (START is no longer clickable)
            introReady = true;
            
            // Show arrow when START text appears
            const arrowElement = document.getElementById('gradient-intro-arrow');
            if (arrowElement) {
                arrowElement.style.display = 'flex';
                arrowElement.style.visibility = 'visible';
                arrowElement.style.opacity = '0.7';
            }
            
            // Update arrow position after showing it
            updateGradientIntro();
            
            // DEBUG: Log the actual text change
            console.log('INTRO_TEXT_CHANGED', {
                from: fromText,
                to: 'START',
                reason: oneScrolled ? 'ONE_SCROLLED' : 'FIVE_COLORS_SEEN',
                leftHasScrolled: leftColumnScrolled,
                rightHasScrolled: rightColumnScrolled,
                uniqueColors: [...uniqueColorsSeen],
                uniqueColorCount: uniqueColorsSeen.size,
                hasUserInteracted: hasUserInteracted,
                introReady: introReady,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// ==================
// AUTO-SCROLL DEMO FUNCTION
// ==================

// Function to trigger auto-scroll demo when intro text becomes visible
function triggerAutoScrollDemo() {
    // Only run once per page load
    if (autoScrollDemoRun) {
        return;
    }
    
    // Check if intro text is visible and says "[scroll the right and left bars]"
    const introText = document.getElementById('gradient-intro-text');
    if (!introText) {
        return;
    }
    
    // Check if text is the instruction text (not "[start]")
    // The text should be "[scroll the right and left bars]" (case-insensitive check)
    const currentText = introText.textContent.trim().toLowerCase();
    if (currentText !== '[scroll the right and left bars]') {
        // Text has changed to "[start]" or something else - don't trigger demo
        return;
    }
    
    // Check if text is visible (opacity > 0)
    const computedStyle = window.getComputedStyle(introText);
    const opacity = parseFloat(computedStyle.opacity);
    if (opacity <= 0) {
        return;
    }
    
    // Check if gradients have collapsed (intro-active phase)
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer || !gradientContainer.classList.contains('intro-active')) {
        return;
    }
    
    // Mark demo as run and active
    autoScrollDemoRun = true;
    autoScrollDemoActive = true;
    
    console.log('AUTO_SCROLL_DEMO_STARTING', {
        timestamp: new Date().toISOString()
    });
    
    // Start the auto-scroll demo
    startAutoScrollDemo();
}

// Function to perform auto-scroll demo on both columns
function startAutoScrollDemo() {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) {
        autoScrollDemoActive = false;
        return;
    }
    
    const itemHeight = window.innerHeight / 6;
    const singleSetHeight = 6 * itemHeight; // Height of one complete set of 6 colors
    const demoDuration = 3000; // 3 seconds
    const startTime = Date.now();
    
    // Function to snap scroll position to nearest tile boundary
    function snapToTile(scrollTop) {
        const tileIndex = Math.round(scrollTop / itemHeight);
        return tileIndex * itemHeight;
    }
    
    // Function to get the color index from a scroll position
    // Used to check if a target position would result in a specific color
    function getColorIndexFromScrollPosition(scrollPosition) {
        const tileIndex = Math.round(scrollPosition / itemHeight);
        // Map to color index (0-5) since colors repeat every 6 items
        const colorIndex = ((tileIndex % colors.length) + colors.length) % colors.length;
        return colorIndex;
    }
    
    // Function to get a random scroll position (snapped to item boundaries)
    // Returns a position that's within the valid scroll range
    // Optionally avoids a specific color index to prevent matching
    // GUARANTEES: The returned position is always different from current position (ensures movement)
    function getRandomScrollPosition(column, avoidColorIndex = null) {
        const currentScroll = column.scrollTop;
        const currentIndex = Math.round(currentScroll / itemHeight);
        
        let attempts = 0;
        const maxAttempts = 50; // Prevent infinite loops
        
        while (attempts < maxAttempts) {
            // Choose a direction: -2, -1, 1, or 2 items away (avoid 0 to ensure movement)
            const direction = Math.random() < 0.5 ? -1 : 1;
            const distance = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
            const newIndex = currentIndex + (direction * distance);
            
            // Ensure we stay within reasonable bounds (0 to 11, wrapping handled by infinite scroll)
            const clampedIndex = Math.max(0, Math.min(11, newIndex));
            const targetPosition = clampedIndex * itemHeight;
            
            // CRITICAL: Ensure the target is actually different from current position
            // (handles edge case where clamping might result in same position)
            if (clampedIndex === currentIndex) {
                // Try the opposite direction or different distance
                attempts++;
                continue;
            }
            
            // If we need to avoid a specific color index, check if this target would match it
            if (avoidColorIndex !== null) {
                const targetColorIndex = getColorIndexFromScrollPosition(targetPosition);
                if (targetColorIndex === avoidColorIndex) {
                    // This target would result in the avoided color - try again
                    attempts++;
                    continue;
                }
            }
            
            // Valid target found that guarantees movement
            return targetPosition;
        }
        
        // Fallback: if we couldn't find a valid position after max attempts,
        // try all possible positions systematically to find one that works
        // This ensures we always return a position that's different from current
        for (let testDistance = 1; testDistance <= 3; testDistance++) {
            for (let testDirection of [-1, 1]) {
                const testIndex = currentIndex + (testDirection * testDistance);
                const testClamped = Math.max(0, Math.min(11, testIndex));
                
                // Must be different from current
                if (testClamped === currentIndex) continue;
                
                const testPosition = testClamped * itemHeight;
                
                // Check avoidColorIndex constraint if needed
                if (avoidColorIndex !== null) {
                    const testColorIndex = getColorIndexFromScrollPosition(testPosition);
                    if (testColorIndex === avoidColorIndex) continue;
                }
                
                // Found a valid position
                return testPosition;
            }
        }
        
        // Last resort: move at least 1 item in any valid direction
        // (should never reach here, but ensures we always return something)
        if (currentIndex > 0) {
            return (currentIndex - 1) * itemHeight;
        } else {
            return (currentIndex + 1) * itemHeight;
        }
    }
    
    // Function to smoothly scroll to a position using the same logic as user scrolling
    function smoothScrollTo(column, targetPosition, duration) {
        // Only proceed if demo is still active
        if (!autoScrollDemoActive) {
            return;
        }
        
        const startPosition = column.scrollTop;
        const snappedTarget = snapToTile(targetPosition); // Ensure target is snapped
        const distance = snappedTarget - startPosition;
        
        // During auto-scroll demo, we guarantee movement, so only skip if distance is truly 0
        // (This should never happen during demo, but we keep the check for safety)
        if (Math.abs(distance) < itemHeight * 0.1) {
            // During demo, log a warning if this happens (shouldn't occur)
            if (autoScrollDemoActive) {
                console.warn('Auto-scroll demo: Attempted to scroll with minimal distance', {
                    startPosition,
                    targetPosition,
                    snappedTarget,
                    distance
                });
            }
            return;
        }
        
        const animationStartTime = Date.now();
        
        // Set programmatic scroll flag to prevent user interaction tracking
        isProgrammaticScroll = true;
        
        function animate() {
            // Check if demo is still active before continuing
            if (!autoScrollDemoActive) {
                isProgrammaticScroll = false;
                return;
            }
            
            const elapsed = Date.now() - animationStartTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function (ease-in-out)
            const ease = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Update scroll position
            const newScrollTop = startPosition + distance * ease;
            column.scrollTop = newScrollTop;
            
            // Update gradients during scroll (this will be called via scroll event)
            // The scroll event handler will call updateSelectedIndices() because isAutoScrollDemo is true
            
            if (progress < 1 && autoScrollDemoActive) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - ensure we're snapped to tile
                column.scrollTop = snapToTile(column.scrollTop);
                
                // Update gradients one final time
                updateSelectedIndices();
                
                // Reset flag after a small delay
                setTimeout(() => {
                    if (!autoScrollDemoActive) {
                        isProgrammaticScroll = false;
                    }
                }, 50);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Track scroll positions for each column independently
    let leftScrollIndex = 0;
    let rightScrollIndex = 0;
    
    // Perform slower, more readable scrolls during the 3-second demo
    const scrollInterval = 800; // 800ms between scroll changes (slower, more readable)
    const scrollAnimationDuration = 600; // 600ms for each scroll animation (smooth)
    
    function performNextScroll() {
        // Check if demo should stop
        if (!autoScrollDemoActive) {
            // Demo complete - ensure final snap and gradient update
            isProgrammaticScroll = true;
            leftColumn.scrollTop = snapToTile(leftColumn.scrollTop);
            rightColumn.scrollTop = snapToTile(rightColumn.scrollTop);
            updateSelectedIndices();
            setTimeout(() => {
                isProgrammaticScroll = false;
            }, 100);
            console.log('AUTO_SCROLL_DEMO_COMPLETE', {
                finalLeftScroll: leftColumn.scrollTop,
                finalRightScroll: rightColumn.scrollTop,
                finalLeftIndex: getSelectedColorIndex(leftColumn),
                finalRightIndex: getSelectedColorIndex(rightColumn),
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        // Check if demo duration has elapsed
        const elapsed = Date.now() - startTime;
        if (elapsed >= demoDuration) {
            autoScrollDemoActive = false;
            // Ensure final snap and gradient update
            isProgrammaticScroll = true;
            leftColumn.scrollTop = snapToTile(leftColumn.scrollTop);
            rightColumn.scrollTop = snapToTile(rightColumn.scrollTop);
            updateSelectedIndices();
            setTimeout(() => {
                isProgrammaticScroll = false;
            }, 100);
            console.log('AUTO_SCROLL_DEMO_COMPLETE', {
                finalLeftScroll: leftColumn.scrollTop,
                finalRightScroll: rightColumn.scrollTop,
                finalLeftIndex: getSelectedColorIndex(leftColumn),
                finalRightIndex: getSelectedColorIndex(rightColumn),
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        // Get current color indices to enforce constraint: leftSelected !== rightSelected
        const currentLeftColorIndex = getSelectedColorIndex(leftColumn);
        const currentRightColorIndex = getSelectedColorIndex(rightColumn);
        
        // Get current scroll positions to ensure both scrollbars will move
        const currentLeftScroll = leftColumn.scrollTop;
        const currentRightScroll = rightColumn.scrollTop;
        
        // Get random scroll positions for both columns, ensuring they never match
        // Strategy: pick left target first (avoiding right's current color),
        // then pick right target (avoiding left's new target color)
        const leftTarget = getRandomScrollPosition(leftColumn, currentRightColorIndex);
        const leftTargetColorIndex = getColorIndexFromScrollPosition(leftTarget);
        
        // Right target must avoid the left's target color to prevent matching
        const rightTarget = getRandomScrollPosition(rightColumn, leftTargetColorIndex);
        
        // VALIDATION: Ensure both scrollbars will actually move (not just potentially move)
        // This is a safety check - getRandomScrollPosition should already guarantee movement
        const leftWillMove = Math.abs(leftTarget - currentLeftScroll) >= itemHeight * 0.5;
        const rightWillMove = Math.abs(rightTarget - currentRightScroll) >= itemHeight * 0.5;
        
        // If either scrollbar wouldn't move, regenerate targets (should be rare)
        if (!leftWillMove || !rightWillMove) {
            // Retry with fresh random targets
            const retryLeftTarget = getRandomScrollPosition(leftColumn, currentRightColorIndex);
            const retryLeftTargetColorIndex = getColorIndexFromScrollPosition(retryLeftTarget);
            const retryRightTarget = getRandomScrollPosition(rightColumn, retryLeftTargetColorIndex);
            
            // Use retry targets if they're valid, otherwise use original (shouldn't happen)
            const finalLeftTarget = (Math.abs(retryLeftTarget - currentLeftScroll) >= itemHeight * 0.5) 
                ? retryLeftTarget : leftTarget;
            const finalRightTarget = (Math.abs(retryRightTarget - currentRightScroll) >= itemHeight * 0.5)
                ? retryRightTarget : rightTarget;
        
        // Smoothly scroll both columns independently
            smoothScrollTo(leftColumn, finalLeftTarget, scrollAnimationDuration);
            smoothScrollTo(rightColumn, finalRightTarget, scrollAnimationDuration);
        } else {
            // Both will move - proceed normally
        smoothScrollTo(leftColumn, leftTarget, scrollAnimationDuration);
        smoothScrollTo(rightColumn, rightTarget, scrollAnimationDuration);
        }
        
        // Schedule next scroll
        setTimeout(performNextScroll, scrollInterval);
    }
    
    // Start the first scroll immediately
    performNextScroll();
}
