// Array of colors in order
const colors = ['#EF4538', '#891951', '#FAB01B', '#007A6F', '#EB4781', '#293990'];

// Array of words for each color (matching colors array order)
// כתום- shape, סגול- sound, צהוב- letter, ירוק- number, ורוד- emotion, כחול- color
const colorWords = ['shape', 'sound', 'letter', 'number', 'emotion', 'color'];

// Initial instruction text content (shown after demo ends, before user scrolls)
const INITIAL_INSTRUCTION_TEXT = 'Synesthesia is a perceptual experience where one sense triggers another,<br>This site explores synesthesia through combinations of two senses at a time.<div style="margin-top: 21px;">Scroll the left and right bars to combine senses</div>';

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
let initialInstructionTextShown = false; // Track if initial instruction text has been shown after demo
let isProgrammaticScroll = false; // Flag to track programmatic scrolls (should not trigger interaction)
let isDemoActive = false; // Flag to track demo/programmatic animation (prevents START text change during demo)
let demoJustEnded = false; // Grace period flag - prevents START from triggering immediately after demo ends
// Store timeout and animation frame IDs for demo cancellation
let demoTimeouts = []; // Array to store all setTimeout IDs from demo
let demoAnimationFrames = []; // Array to store all requestAnimationFrame IDs from demo
let currentAnimationFrame = null; // Current animation frame ID for each column
let userInteracted = false; // Flag to track real user interaction (wheel/touch/pointer events)
let hasScrolledScrollbar = false; // Flag to track if user has actually scrolled a scrollbar (not just moved mouse)
let isInitializing = true; // Flag to track initialization phase (prevents initial scroll events from counting)
let introPhase = 'entering'; // Track intro phase: 'entering' (initial full-bleed), 'active' (default), or 'closing' (after START is clicked)
let introReady = false; // Gate: true when START text is visible, false otherwise
let introTriggered = false; // Gate: true after intro transition has been triggered
let introProgress = 0; // Persistent progress value p in [0..1] for intro closing
let introCompleted = false; // Lock: true when progress reaches 1, prevents reversing
let horizontalExpansionStarted = false; // Track if horizontal expansion has started
let hasExpandedToScrollbars = false; // Track when gradients have fully expanded to scrollbar edges (UI becomes visible only after this)
let startClickTransitionActive = false; // Track if START click transition is active (disables scroll-based trigger)
const SCROLL_THRESHOLD = 3000; // Threshold for full collapse (3x slower: requires ~3 scroll gestures to complete collapse)

// Initialize columns
document.addEventListener('DOMContentLoaded', () => {
    // Verify p5.js is loaded globally
    if (typeof window.p5 === 'undefined') {
        console.error('p5.js is not loaded globally. Make sure p5.js is included before script.js');
    }
    
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
    
    // Initialize LETTER & COLOR text box visibility
    updateLetterColorTextBox(initialPageId);
    
    // Initialize SOUND & SHAPE instruction text visibility
    updateSoundShapeInstructionText(initialPageId);
    
    // Initialize Letter + Letter circle visibility
    updateLetterLetterCircle(initialPageId);
    
    // Initialize Number + Number circle visibility
    updateNumberNumberCircle(initialPageId);
    
    // Initialize Shape + Color circle visibility
    updateShapeColorCircle(initialPageId);
    
    // Initialize MELODY circle visibility (Sound + Letter page)
    updateMelodyCircle(initialPageId);
    
    // Initialize Sound + Color squares visibility
    updateSoundColorSquares(initialPageId);
    
    // Initialize Sound + Sound wave visualization visibility
    updateSoundSoundWave(initialPageId);
    
    // Initialize Letter + Number circle visibility
    updateLetterNumberCircle(initialPageId);
    
    // Initialize Color + Color circle visibility
    updateColorColorCircle(initialPageId);
    
    // Initialize Shape & Emotion canvas visibility
    updateShapeEmotionCanvasVisibility(initialPageId);
    
    // Initialize Shape & Number canvas (not using p5.js)
    initializeShapeNumberCanvas();
    
    // Initialize Shape & Emotion canvas (not using p5.js)
    initializeShapeEmotionCanvas();
    
    // Initialize p5.js sketch
    initializeP5Sketch();
    
    // Set initial pageId in p5 instance after it's created
    // Use a small delay to ensure p5 instance is ready
    setTimeout(() => {
        if (p5Instance) {
            p5Instance._currentPageId = initialPageId;
        }
    }, 200);
    
    // Initialize SYN logo hover effect
    initializeSynHoverEffect();
    
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
    
    // Initialize user interaction detection (wheel/touch/pointer events)
    initializeUserInteractionDetection();
    
    // Initialize UI visibility (hidden by default during entering phase)
    updateUIVisibility();
    
    // Initialize canvas cover visibility (visible by default during intro)
    updateCanvasCoverVisibility();
    
    // Align PANEL and COLOR KEY rectangles with ESTHESIA text center
    // Wait for layout to stabilize (fonts loaded, DOM ready)
    alignRectanglesWithEsthesia();
    
    // Mark initialization as complete (after all scroll positions are set)
    // Use a small delay to ensure any pending scroll events from initialization are processed
    setTimeout(() => {
        isInitializing = false;
    }, 100);
    
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
                
                const matchResult = findMatchingItem();
                const oppositeColumnScrollTop = oppositeColumn.scrollTop;
                
                if (matchResult && matchResult.item) {
                    // Log information about the selected match in opposite column
                    
                    matchResult.item.classList.add('opposite-hovered');
                } else {
                }
            }
        });
        
        // On hover leave: remove class from matching item in opposite column
        item.addEventListener('mouseleave', () => {
            const matchResult = findMatchingItem();
            if (matchResult && matchResult.item) {
                matchResult.item.classList.remove('opposite-hovered');
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
        // CRITICAL: Allow gradient updates during programmatic scrolls (for demo)
        // but skip user interaction tracking during initialization or programmatic adjustments
        if (isProgrammaticScroll || isAdjusting || isInitializing) {
            
            // Update gradients even during programmatic scrolls (demo will use this)
                updateSelectedIndices();
            
            // Skip user interaction tracking
            return;
        }
        
        // CRITICAL: Ignore demo-driven scrolls for START logic
        // Log scroll event for debugging
        
        if (isDemoActive) {
            // Demo is active - update gradients but don't trigger START logic
            updateSelectedIndices();
            return;
        }
        
        // CRITICAL: Only process user interactions AFTER initialization is complete
        if (isInitializing) {
            return;
        }
        
        // Mark that user has started interacting (first scroll event)
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            // Add the current color when user first starts scrolling (not the initial one)
            const currentColor = getSnappedTileColor(column);
            uniqueColorsSeen.add(currentColor);
            previousSnappedColor = currentColor;
        }
        
        // CRITICAL: Ensure userInteracted is set if this is a real user scroll
        // (fallback in case wheel/touch/pointer events didn't fire first)
        if (!userInteracted && !isDemoActive && !isInitializing) {
            userInteracted = true;
        }
        
        // CRITICAL: Mark that user has scrolled a scrollbar (actual scrollbar interaction)
        // Only count real user scrolls, not programmatic ones
        // CRITICAL: Only set hasScrolledScrollbar AFTER initial instruction text has been shown
        // This ensures START only appears on scroll AFTER the 3 intro sentences are visible
        // CRITICAL: Also require userInteracted and check demoJustEnded grace period
        if (!hasScrolledScrollbar && !isDemoActive && !isInitializing && !isProgrammaticScroll && initialInstructionTextShown && userInteracted && !demoJustEnded) {
            hasScrolledScrollbar = true;
        }
        
        // CRITICAL: Trigger START text on first user scroll (after demo ends)
        // Only allow START to appear when:
        // 1. hasScrolledScrollbar === true (user has actually scrolled a scrollbar, not just moved mouse)
        // 2. !isDemoActive (demo has ended)
        // 3. !introTextChanged (hasn't been changed yet)
        // 4. initialInstructionTextShown === true (initial text has been shown after demo)
        // 5. userInteracted === true (real user interaction via wheel/touch/pointer, not scroll-snap)
        // 6. !demoJustEnded (grace period after demo has passed)
        if (hasScrolledScrollbar && !isDemoActive && !introTextChanged && initialInstructionTextShown && !isProgrammaticScroll && userInteracted && !demoJustEnded) {
            // First user scroll detected - immediately switch to START
            
            // Mark that intro text has been changed
            introTextChanged = true;
            
            // Enable center scroll trigger AND make START clickable
            introReady = true;
            
            // Use shared function to set up START button (ensures consistent behavior)
            setupStartButton();
            
        }
        
        // Track that this column has been scrolled (for other tracking purposes)
        if (userInteracted && !isDemoActive) {
            if (side === 'left' && !leftColumnScrolled) {
                leftColumnScrolled = true;
            } else if (side === 'right' && !rightColumnScrolled) {
                rightColumnScrolled = true;
            }
        }
        
        // Track color changes (only after user has started interacting)
        if (hasUserInteracted) {
            const currentSnappedColor = getSnappedTileColor(column);
            if (currentSnappedColor !== previousSnappedColor) {
                const oldColor = previousSnappedColor; // Capture old value before updating
                uniqueColorsSeen.add(currentSnappedColor);
                previousSnappedColor = currentSnappedColor;
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:505',message:'Infinite scroll JUMP UP triggered',data:{side,scrollTop,topBoundary,isDemoActive,isProgrammaticScroll},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:515',message:'Infinite scroll JUMP DOWN triggered',data:{side,scrollTop,bottomBoundary,isDemoActive,isProgrammaticScroll},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
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
        
        if (introCompleted) {
        }
    });
    
    // Detect real user wheel interaction
    column.addEventListener('wheel', (e) => {
        // Check if demo is active - if so, skip it immediately
        if (isDemoActive) {
            skipDemo();
            e.stopPropagation();
            return;
        }
        
        // This is a real user interaction
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            const currentColor = getSnappedTileColor(column);
            uniqueColorsSeen.add(currentColor);
            previousSnappedColor = currentColor;
        }
        
        // CRITICAL: Set userInteracted flag to enable START button
        // Only show START button if:
        // 1. User has interacted (scrolled)
        // 2. Demo has ended (!isDemoActive)
        // 3. Initial instruction text has been shown (initialInstructionTextShown)
        // 4. Text hasn't been changed yet (!introTextChanged)
        if (!userInteracted && !isInitializing) {
            userInteracted = true;
            
            // Only show START button if initial instruction text has been shown after demo
            // Also check demoJustEnded to prevent triggering during grace period
            if (!introTextChanged && initialInstructionTextShown && !isDemoActive && !demoJustEnded) {
                introTextChanged = true;
                introReady = true;
                setupStartButton();
                
                // Remove demo-active class if it exists
                const gradientContainer = document.getElementById('gradient-intro-container');
                if (gradientContainer) {
                    gradientContainer.classList.remove('demo-active');
                    // Ensure intro-active class exists for CSS rules
                    if (!gradientContainer.classList.contains('intro-active')) {
                        gradientContainer.classList.add('intro-active');
                    }
                }
                
                // Ensure text is visible (but don't force opacity - let CSS animation handle it)
                setTimeout(() => {
                    const introText = document.getElementById('gradient-intro-text');
                    if (introText) {
                        // Use 'flex' to match setupStartButton() and updateGradientIntro()
                        introText.style.display = 'flex';
                        introText.style.visibility = 'visible';
                        // Don't set opacity - let CSS animation handle the fade-in
                    }
                }, 0);
                
            }
        }
        
        e.stopPropagation();
    }, { passive: false });
    
    // Detect real user touch interaction
    column.addEventListener('touchmove', (e) => {
        // Check if demo is active - if so, skip it immediately
        if (isDemoActive) {
            skipDemo();
            return;
        }
        
        // This is a real user interaction
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            const currentColor = getSnappedTileColor(column);
            uniqueColorsSeen.add(currentColor);
            previousSnappedColor = currentColor;
        }
        
        // CRITICAL: Set userInteracted flag (for other tracking purposes)
        if (!userInteracted && !isInitializing) {
            userInteracted = true;
        }
        
        // CRITICAL: Mark that user has scrolled a scrollbar (actual scrollbar interaction)
        // Only count real user scrolls, not programmatic ones
        // CRITICAL: Only set hasScrolledScrollbar AFTER initial instruction text has been shown
        // This ensures START only appears on scroll AFTER the 3 intro sentences are visible
        if (!hasScrolledScrollbar && !isDemoActive && !isInitializing && !isProgrammaticScroll && initialInstructionTextShown && !demoJustEnded) {
            hasScrolledScrollbar = true;
            
            // Only show START button if initial instruction text has been shown after demo
            // Also check demoJustEnded to prevent triggering during grace period
            if (!introTextChanged && initialInstructionTextShown && !isDemoActive && !demoJustEnded) {
                introTextChanged = true;
                introReady = true;
                setupStartButton();
                
                // Remove demo-active class if it exists
                const gradientContainer = document.getElementById('gradient-intro-container');
                if (gradientContainer) {
                    gradientContainer.classList.remove('demo-active');
                    // Ensure intro-active class exists for CSS rules
                    if (!gradientContainer.classList.contains('intro-active')) {
                        gradientContainer.classList.add('intro-active');
                    }
                }
                
                // Ensure text is visible (but don't force opacity - let CSS animation handle it)
                setTimeout(() => {
                    const introText = document.getElementById('gradient-intro-text');
                    if (introText) {
                        // Use 'flex' to match setupStartButton() and updateGradientIntro()
                        introText.style.display = 'flex';
                        introText.style.visibility = 'visible';
                        // Don't set opacity - let CSS animation handle the fade-in
                    }
                }, 0);
                
            }
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
    '4-3': '"Whenever I feel a strong emotion, a number pops into my head. Pure joy is always the number 7. Anxiety is a constant, flickering 9. When I\'m bored, I feel like the number 0 is expanding to fill the room. It\'s not that I\'m counting, it\'s that the feeling itself has a numerical value. I can describe my day to my partner by saying \'I feel like a 4 today,\' and for me, that perfectly describes a specific type of dull, heavy sadness."',
    
    // 16. Color + Color (צבע + צבע) - color=5, color=5
    '5-5': '"For me, colors are never static or isolated. Every color I see radiates its essence onto every other color nearby. When I look at a simple rainbow, it\'s not six or seven distinct bands—it\'s a living conversation. The red bleeds into the orange, the orange whispers to the yellow, the yellow embraces the green. Each hue influences and transforms its neighbors, creating an infinite dance of chromatic relationships that never stops moving in my mind."'
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
        
        // Check if this is the last line - extend background by 2px for PANEL overlay
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
// LETTER → COLOR MAPPING
// ==================
// Mapping object: uppercase letter (A-Z) → color hex code
// These are placeholder colors - can be customized later
const LETTER_COLORS = {
    'A': '#E53935',  // Red
    'B': '#1E88E5',  // Blue
    'C': '#FDD835',  // Yellow
    'D': '#43A047',  // Green
    'E': '#8E24AA',  // Purple
    'F': '#FB8C00',  // Orange
    'G': '#00ACC1',  // Cyan
    'H': '#D81B60',  // Pink
    'I': '#5E35B1',  // Deep Purple
    'J': '#039BE5',  // Light Blue
    'K': '#7CB342',  // Light Green
    'L': '#FFB300',  // Amber
    'M': '#3949AB',  // Indigo
    'N': '#00897B',  // Teal
    'O': '#F4511E',  // Deep Orange
    'P': '#C0CA33',  // Lime
    'Q': '#6D4C41',  // Brown
    'R': '#EC407A',  // Pink Light
    'S': '#AB47BC',  // Purple Light
    'T': '#26A69A',  // Teal Light
    'U': '#42A5F5',  // Blue Light
    'V': '#66BB6A',  // Green Light
    'W': '#FFCA28',  // Yellow Light
    'X': '#EF5350',  // Red Light
    'Y': '#7E57C2',  // Deep Purple Light
    'Z': '#78909C'   // Blue Grey
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

// ==================
// COLORED LETTER RENDERER
// ==================
// Function to render a colored letter for the Letter + Color interaction
function renderColoredLetter(letter, color) {
    if (!color || !letter) return null;
    
    const colorSpan = document.createElement('span');
    colorSpan.className = 'letter-color';
    colorSpan.textContent = letter;
    colorSpan.style.color = color;
    // CSS handles positioning, font styling, and transitions
    
    return colorSpan;
}

function initializeLetterHoverInteraction() {
    const letterSoundTextBox = document.getElementById('canvas-text-box-letter-sound');
    if (!letterSoundTextBox) {
        return;
    }
    
    
    const paragraph = letterSoundTextBox.querySelector('p');
    if (!paragraph) {
        return;
    }
    
    // Check if already initialized (has letter spans)
    if (paragraph.querySelector('.letter-span')) {
        return;
    }
    
    // Get the text content - use textContent as source of truth
    const originalText = paragraph.textContent;
    
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
    
    
    // Replace paragraph content with wrapped letters
    paragraph.innerHTML = wrappedText;
    
    // Count created spans - verify we wrapped all characters
    const allSpans = paragraph.querySelectorAll('.letter-span');
    
    // Verify we processed all characters (accounting for spaces and newlines)
    const nonSpaceChars = originalText.split('').filter(c => c !== ' ' && c !== '\n').length;
    
    // Inject SVG shapes for each letter - MUST use querySelectorAll to get ALL spans
    const letterSpans = paragraph.querySelectorAll('.letter-span:not(.space)');
    
    let shapesInjected = 0;
    let lastInjectedIndex = -1;
    
    // Process ALL spans - use for loop to ensure we don't stop early
    for (let index = 0; index < letterSpans.length; index++) {
        const span = letterSpans[index];
        
        try {
            const letter = span.getAttribute('data-letter');
            if (!letter) {
                continue; // Skip this span but continue with others
            }
            
            const upperLetter = letter.toUpperCase();
            const shapeSpec = LETTER_SHAPES[upperLetter];
            
            
            // Create and inject SVG shape (or fallback to circle) with UI black stroke for shape & letter canvas (to match UI style)
            const svg = shapeSpec ? renderShape(shapeSpec, '#2C2C2C') : renderShape({ type: 'circle', cx: 22.5, cy: 22.5, r: 18 }, '#2C2C2C');
            if (svg) {
                span.appendChild(svg);
                shapesInjected++;
                lastInjectedIndex = index;
                
            }
        } catch (error) {
            console.error('Error injecting shape at index', index, ':', error);
            // Continue processing other spans even if one fails
        }
    }
    
    
    // Verify final count - check for SVG elements
    const finalShapes = paragraph.querySelectorAll('.letter-span .letter-shape, .letter-span svg');
    
    // Additional verification: check if all letter spans have shapes
    const spansWithoutShapes = Array.from(letterSpans).filter(span => !span.querySelector('.letter-shape, svg'));
    if (spansWithoutShapes.length > 0) {
        // Try to inject shapes for spans that are missing them
        problematicSpans.forEach((info, idx) => {
            const span = spansWithoutShapes[idx];
            if (span && info.hasShapeSpec) {
                try {
                    const svg = renderShape(info.shapeSpec, '#2C2C2C');
                    if (svg) {
                        span.appendChild(svg);
                    }
                } catch (error) {
                    console.error('Failed to inject shape for', info.upperLetter, ':', error);
                }
            }
        });
    }
    
    // Final verification: count shapes again after potential fixes
    const finalShapesAfterFix = paragraph.querySelectorAll('.letter-span .letter-shape, .letter-span svg');
    
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
    
}

// ==================
// LETTER + COLOR INTERACTION
// ==================
// Initialize hover interaction for Letter + Color page
// Similar to letter-shape but reveals colors instead of shapes
function initializeLetterColorInteraction() {
    const letterColorTextBox = document.getElementById('canvas-text-box-letter-color');
    if (!letterColorTextBox) {
        return;
    }
    
    const paragraph = letterColorTextBox.querySelector('p');
    if (!paragraph) {
        return;
    }
    
    // Check if already initialized (has letter spans)
    if (paragraph.querySelector('.letter-span')) {
        return;
    }
    
    // Get the text content - use textContent as source of truth
    const originalText = paragraph.textContent;
    
    // Split text into individual characters and wrap each in a span
    // Define punctuation marks that should remain static (no animation, no color)
    const punctuationMarks = /[.,;:!?'"()[\]{}—–\-…]/;
    
    const wrappedText = originalText.split('').map((char) => {
        // Handle spaces, punctuation marks, and special characters
        if (char === ' ') {
            return '<span class="letter-span space" data-letter=" "> </span>';
        } else if (char === '\n') {
            return '<br>';
        } else if (punctuationMarks.test(char)) {
            // Punctuation marks remain static - no animation, no color
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
    
    // Replace paragraph content with wrapped letters
    paragraph.innerHTML = wrappedText;
    
    // Inject colored letters for each letter
    const letterSpans = paragraph.querySelectorAll('.letter-span:not(.space)');
    
    for (let index = 0; index < letterSpans.length; index++) {
        const span = letterSpans[index];
        
        try {
            const letter = span.getAttribute('data-letter');
            if (!letter) {
                continue;
            }
            
            const upperLetter = letter.toUpperCase();
            const colorHex = LETTER_COLORS[upperLetter];
            
            // Create and inject colored letter (fallback to grey if letter not mapped)
            const coloredLetter = renderColoredLetter(upperLetter, colorHex || '#9E9E9E');
            if (coloredLetter) {
                span.appendChild(coloredLetter);
            }
        } catch (error) {
            console.error('Error injecting colored letter at index', index, ':', error);
        }
    }
    
    // Restructure: wrap each letter-span in a letter-slot container
    // Create static glyph for layout and sliding glyph inside mask
    const allLetterSpans = paragraph.querySelectorAll('.letter-span:not(.space)');
    allLetterSpans.forEach(span => {
        // Get the text content (exclude color div by getting only text nodes)
        let textContent = '';
        for (let node of span.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                textContent += node.textContent;
            }
        }
        textContent = textContent.trim();
        
        // Get the color square
        const colorSquare = span.querySelector('.letter-color');
        
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
        
        // Add color square to mask if it exists (inside mask, so it's clipped with the letter)
        if (colorSquare) {
            mask.appendChild(colorSquare);
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
            hoverOutTimeout = setTimeout(() => {
                // Double-check we're still not hovered (user might have re-entered)
                if (!isHovered) {
                    // Add hover-leaving class to trigger push-up animation
                    slot.classList.add('hover-leaving');
                    
                    // Remove hover-active class to trigger hover-out transitions
                    slot.classList.remove('hover-active');
                    
                    // After animation completes, remove hover-leaving class
                    setTimeout(() => {
                        if (!isHovered && !slot.classList.contains('hover-active')) {
                            slot.classList.remove('hover-leaving');
                        }
                    }, 315); // 105ms delay + 300ms animation = 315ms total
                }
                hoverOutTimeout = null;
            }, 105); // 105ms delay matches CSS delay before hover-out transition starts
        });
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

// Function to update visibility of LETTER & COLOR text box
function updateLetterColorTextBox(pageId) {
    const letterColorTextBox = document.getElementById('canvas-text-box-letter-color');
    if (!letterColorTextBox) return;
    
    // Show text box only for LETTER & COLOR pages (pageId "2-5" or "5-2")
    // Parameter indices: 0=shape, 1=sound, 2=letter, 3=number, 4=emotion, 5=color
    const isLetterColorPage = pageId === '2-5' || pageId === '5-2';
    
    if (isLetterColorPage) {
        letterColorTextBox.classList.add('visible');
        // Initialize letter color interaction when text box becomes visible
        // Use a small delay to ensure the element is rendered
        setTimeout(() => {
            initializeLetterColorInteraction();
        }, 50);
    } else {
        letterColorTextBox.classList.remove('visible');
    }
}

// Function to update visibility of canvas instruction text
function updateSoundShapeInstructionText(pageId) {
    const instructionText = document.getElementById('canvas-instruction-text');
    if (!instructionText) return;
    
    // Parameter indices: 0=shape, 1=sound, 2=letter, 3=number, 4=emotion, 5=color
    // Check for SHAPE & COLOR pages (pageId "0-5" or "5-0")
    const isShapeColorPage = pageId === '0-5' || pageId === '5-0';
    
    if (isShapeColorPage) {
        // Show instruction text for SHAPE & COLOR pages
        instructionText.textContent = '[click to create shapes]';
        instructionText.classList.add('visible');
    } else {
        // Hide instruction text for all other pages
        instructionText.classList.remove('visible');
    }
}

// ==================
// Function to update Letter + Letter circle visibility
function updateLetterLetterCircle(pageId) {
    const circleContainer = document.getElementById('letter-letter-circle-container');
    if (!circleContainer) return;
    
    // Show circle only for Letter + Letter page (pageId "2-2")
    // Parameter indices: 2=letter
    const isLetterLetterPage = pageId === '2-2';
    
    if (isLetterLetterPage) {
        circleContainer.classList.add('visible');
        // Initialize ring rotation functionality when page becomes visible
        requestAnimationFrame(() => {
            initializeConcentricRings();
        });
    } else {
        circleContainer.classList.remove('visible');
        // Reset ring rotations when leaving the page
        resetConcentricRings();
    }
}

// ==================
// Concentric Rings - Rotation State and Functions
// ==================

// Store rotation angles for each ring (in degrees)
let ringRotations = [0, 0, 0, 0, 0];
// Flag to check if rings are initialized
let ringsInitialized = false;

// Get the center point of the SVG in page coordinates
function getRingsCenterPoint() {
    const svg = document.getElementById('concentric-rings-svg');
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Calculate angle from center to point (in degrees)
function calculateAngle(centerX, centerY, pointX, pointY) {
    const dx = pointX - centerX;
    const dy = pointY - centerY;
    // atan2 returns radians, convert to degrees
    // Note: atan2(y, x) gives angle from positive X axis
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

// Apply rotation to a ring group using SVG transform attribute
// This ensures rotation happens around the SVG center point (0,0)
function applyRingRotation(ringIndex, angle) {
    const ringGroup = document.querySelector(`.ring-group[data-ring="${ringIndex}"]`);
    if (ringGroup) {
        // Use SVG's native transform attribute with explicit center point (0,0)
        // This is the center of our viewBox and where all circles are centered
        ringGroup.setAttribute('transform', `rotate(${angle}, 0, 0)`);
    }
}

// Rotation multipliers for each ring (different speeds create interesting effect)
// Ring 0 (outer) rotates slowest, Ring 4 (inner) rotates fastest
const ringMultipliers = [0.2, 0.4, 0.6, 0.8, 1.0];

// Handle mouse move - all rings rotate based on mouse position
function handleRingMouseMove(e) {
    // Only work when rings container is visible
    const container = document.getElementById('letter-letter-circle-container');
    if (!container || !container.classList.contains('visible')) return;
    
    // Calculate current angle from center to mouse position
    const center = getRingsCenterPoint();
    const mouseAngle = calculateAngle(center.x, center.y, e.clientX, e.clientY);
    
    // Apply rotation to each ring with its own multiplier
    for (let i = 0; i < 5; i++) {
        const rotation = mouseAngle * ringMultipliers[i];
        ringRotations[i] = rotation;
        applyRingRotation(i, rotation);
    }
}

// Initialize the concentric rings interaction
function initializeConcentricRings() {
    if (ringsInitialized) return;
    
    const svg = document.getElementById('concentric-rings-svg');
    if (!svg) return;
    
    // Add mouse move listener to document - rings follow mouse position
    document.addEventListener('mousemove', handleRingMouseMove);
    
    ringsInitialized = true;
}

// Reset all ring rotations to 0
function resetConcentricRings() {
    ringRotations = [0, 0, 0, 0, 0];
    activeRingIndex = null;
    
    // Apply reset rotations to all rings (letter-letter)
    for (let i = 0; i < 5; i++) {
        applyRingRotation(i, 0);
    }
}

// ==================
// Number + Number Concentric Rings State
// ==================
let numberRingRotations = [0, 0, 0, 0, 0];
let numberRingsInitialized = false;

// Function to update Number + Number circle visibility
function updateNumberNumberCircle(pageId) {
    const circleContainer = document.getElementById('number-number-circle-container');
    if (!circleContainer) return;
    
    // Show circle only for Number + Number page (pageId "3-3")
    // Parameter indices: 3=number
    const isNumberNumberPage = pageId === '3-3';
    
    if (isNumberNumberPage) {
        circleContainer.classList.add('visible');
        // Initialize ring rotation functionality when page becomes visible
        requestAnimationFrame(() => {
            initializeNumberRings();
        });
    } else {
        circleContainer.classList.remove('visible');
        // Reset ring rotations when leaving the page
        resetNumberRings();
    }
}

// Get the center point of the Number rings SVG in page coordinates
function getNumberRingsCenterPoint() {
    const svg = document.getElementById('number-number-rings-svg');
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Apply rotation to a number ring group
function applyNumberRingRotation(ringIndex, angle) {
    const ringGroup = document.querySelector(`#number-number-rings-svg .number-ring-group[data-ring="${ringIndex}"]`);
    if (ringGroup) {
        ringGroup.setAttribute('transform', `rotate(${angle}, 0, 0)`);
    }
}

// Handle mouse move for number rings
function handleNumberRingMouseMove(e) {
    // Only work when number rings container is visible
    const container = document.getElementById('number-number-circle-container');
    if (!container || !container.classList.contains('visible')) return;
    
    // Calculate current angle from center to mouse position
    const center = getNumberRingsCenterPoint();
    const mouseAngle = calculateAngle(center.x, center.y, e.clientX, e.clientY);
    
    // Apply rotation to each ring with its own multiplier
    for (let i = 0; i < 5; i++) {
        const rotation = mouseAngle * ringMultipliers[i];
        numberRingRotations[i] = rotation;
        applyNumberRingRotation(i, rotation);
    }
}

// Initialize the number concentric rings interaction
function initializeNumberRings() {
    if (numberRingsInitialized) return;
    
    const svg = document.getElementById('number-number-rings-svg');
    if (!svg) return;
    
    // Add mouse move listener to document - rings follow mouse position
    document.addEventListener('mousemove', handleNumberRingMouseMove);
    
    numberRingsInitialized = true;
}

// Reset all number ring rotations to 0
function resetNumberRings() {
    numberRingRotations = [0, 0, 0, 0, 0];
    
    // Apply reset rotations to all number rings
    for (let i = 0; i < 5; i++) {
        applyNumberRingRotation(i, 0);
    }
}

// ==================
// Function to update MELODY circle visibility (Sound + Letter page)
function updateMelodyCircle(pageId) {
    const melodyContainer = document.getElementById('melody-circle-container');
    if (!melodyContainer) return;
    
    // Show MELODY circle only for Sound + Letter pages (pageId "1-2" or "2-1")
    // Parameter indices: 1=sound, 2=letter
    const isSoundLetterPage = pageId === '1-2' || pageId === '2-1';
    
    if (isSoundLetterPage) {
        melodyContainer.classList.add('visible');
        // Initialize drag functionality when page becomes visible
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            initializeMelodyDrag();
        });
    } else {
        melodyContainer.classList.remove('visible');
    }
}

// ==================
// Function to update Sound + Color squares visibility
function updateSoundColorSquares(pageId) {
    const squaresContainer = document.getElementById('sound-color-squares-container');
    if (!squaresContainer) return;
    
    // Show squares only for Sound + Color pages (pageId "1-5" or "5-1")
    // Parameter indices: 1=sound, 5=color
    const isSoundColorPage = pageId === '1-5' || pageId === '5-1';
    
    if (isSoundColorPage) {
        squaresContainer.classList.add('visible');
        // Reset positions to default when entering the page
        soundColorSquarePositions = null;
        // Initialize squares with positions and drag functionality
        requestAnimationFrame(() => {
            initializeSoundColorSquares();
        });
    } else {
        squaresContainer.classList.remove('visible');
        // Stop all instrument sounds when leaving the page
        stopAllInstrumentLoops();
    }
}

// ==================
// Function to update Sound + Sound wave visualization visibility
function updateSoundSoundWave(pageId) {
    const waveContainer = document.getElementById('sound-sound-wave-container');
    if (!waveContainer) return;
    
    // Show wave only for Sound + Sound pages (pageId "1-1")
    // Parameter indices: 1=sound
    const isSoundSoundPage = pageId === '1-1';
    
    if (isSoundSoundPage) {
        waveContainer.classList.add('visible');
        // Initialize the wave visualization
        requestAnimationFrame(() => {
            initializeSoundSoundWave();
        });
    } else {
        waveContainer.classList.remove('visible');
        // Stop the wave animation and release microphone when leaving the page
        stopSoundSoundWave();
    }
}

// ==================
// SOUND + SOUND Wave Visualization State
// ==================
let soundSoundAudioCtx = null;       // AudioContext for microphone
let soundSoundAnalyser = null;       // AnalyserNode for frequency analysis
let soundSoundDataArray = null;      // Uint8Array to hold waveform data
let soundSoundAnimationId = null;    // requestAnimationFrame ID
let soundSoundMicActive = false;     // Whether microphone is active
let soundSoundMicStream = null;      // MediaStream from microphone
let soundSoundInitialized = false;   // Whether the wave has been initialized

// Wave visualization constants
const SOUND_WAVE_WIDTH = 600;        // Width of the wave in pixels
const SOUND_WAVE_HEIGHT = 100;       // Height of the SVG container
const SOUND_WAVE_POINTS = 50;        // Number of points to sample for the wave
const SOUND_WAVE_SMOOTHING = 0.3;    // Smoothing factor for the analyser (lower = more responsive)
const SOUND_WAVE_SENSITIVITY = 4.0;  // Sensitivity multiplier for quiet sounds (higher = more sensitive)

// Initialize the Sound + Sound wave visualization
function initializeSoundSoundWave() {
    if (soundSoundInitialized) return;
    soundSoundInitialized = true;
    
    const micButton = document.getElementById('sound-wave-mic-btn');
    const wavePath = document.getElementById('sound-wave-path');
    
    if (!micButton || !wavePath) return;
    
    // Draw initial flat line
    drawFlatWaveLine();
    
    // Set up click handler for microphone button
    micButton.addEventListener('click', handleMicButtonClick);
}

// Handle microphone button click
async function handleMicButtonClick() {
    const micButton = document.getElementById('sound-wave-mic-btn');
    
    if (soundSoundMicActive) {
        // If already active, stop the microphone
        stopSoundSoundMicrophone();
        micButton.textContent = '[enable microphone]';
        micButton.classList.remove('active');
    } else {
        // Request microphone access
        try {
            await initializeSoundSoundMicrophone();
            micButton.textContent = '[disable microphone]';
            micButton.classList.add('active');
        } catch (error) {
            console.warn('Microphone access denied:', error);
            micButton.textContent = '[microphone access denied]';
            setTimeout(() => {
                micButton.textContent = '[enable microphone]';
            }, 2000);
        }
    }
}

// Initialize microphone and Web Audio API
async function initializeSoundSoundMicrophone() {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    soundSoundMicStream = stream;
    
    // Create AudioContext
    soundSoundAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Resume AudioContext if suspended (required by some browsers)
    if (soundSoundAudioCtx.state === 'suspended') {
        await soundSoundAudioCtx.resume();
    }
    
    // Create analyser node
    soundSoundAnalyser = soundSoundAudioCtx.createAnalyser();
    soundSoundAnalyser.fftSize = 256; // Small FFT size for quick response
    soundSoundAnalyser.smoothingTimeConstant = SOUND_WAVE_SMOOTHING;
    
    // Create buffer for time domain data
    const bufferLength = soundSoundAnalyser.frequencyBinCount;
    soundSoundDataArray = new Uint8Array(bufferLength);
    
    // Create gain node to boost microphone signal for better sensitivity
    const gainNode = soundSoundAudioCtx.createGain();
    gainNode.gain.value = 2.0; // Boost signal by 2x for better sensitivity to quiet sounds
    
    // Connect microphone -> gain -> analyser
    const source = soundSoundAudioCtx.createMediaStreamSource(stream);
    source.connect(gainNode);
    gainNode.connect(soundSoundAnalyser);
    // Don't connect to destination - we don't want to hear the microphone through speakers
    
    soundSoundMicActive = true;
    
    // Start the animation loop
    drawSoundWave();
}

// Stop microphone and clean up
function stopSoundSoundMicrophone() {
    soundSoundMicActive = false;
    
    // Stop animation
    if (soundSoundAnimationId) {
        cancelAnimationFrame(soundSoundAnimationId);
        soundSoundAnimationId = null;
    }
    
    // Stop microphone stream
    if (soundSoundMicStream) {
        soundSoundMicStream.getTracks().forEach(track => track.stop());
        soundSoundMicStream = null;
    }
    
    // Close AudioContext
    if (soundSoundAudioCtx) {
        soundSoundAudioCtx.close();
        soundSoundAudioCtx = null;
    }
    
    soundSoundAnalyser = null;
    soundSoundDataArray = null;
    
    // Draw flat line when microphone is stopped
    drawFlatWaveLine();
}

// Stop the wave visualization completely (when leaving the page)
function stopSoundSoundWave() {
    stopSoundSoundMicrophone();
    soundSoundInitialized = false;
    
    // Reset button state
    const micButton = document.getElementById('sound-wave-mic-btn');
    if (micButton) {
        micButton.textContent = '[enable microphone]';
        micButton.classList.remove('active');
    }
}

// Draw a flat horizontal line (when no audio)
function drawFlatWaveLine() {
    const wavePath = document.getElementById('sound-wave-path');
    if (!wavePath) return;
    
    const centerY = SOUND_WAVE_HEIGHT / 2;
    wavePath.setAttribute('d', `M 0 ${centerY} L ${SOUND_WAVE_WIDTH} ${centerY}`);
}

// Animation loop to draw the sound wave
function drawSoundWave() {
    if (!soundSoundMicActive || !soundSoundAnalyser || !soundSoundDataArray) {
        return;
    }
    
    // Get time domain data (waveform)
    soundSoundAnalyser.getByteTimeDomainData(soundSoundDataArray);
    
    const wavePath = document.getElementById('sound-wave-path');
    if (!wavePath) return;
    
    // Calculate points for the wave
    const points = [];
    const sliceWidth = SOUND_WAVE_WIDTH / (SOUND_WAVE_POINTS - 1);
    const bufferLength = soundSoundDataArray.length;
    
    for (let i = 0; i < SOUND_WAVE_POINTS; i++) {
        const x = i * sliceWidth;
        
        // Sample from the data array
        const dataIndex = Math.floor((i / SOUND_WAVE_POINTS) * bufferLength);
        const value = soundSoundDataArray[dataIndex];
        
        // Convert from 0-255 to wave amplitude
        // 128 is the center (silence), values deviate from there
        const normalizedValue = (value - 128) / 128; // -1 to 1
        
        // Scale to our wave height with sensitivity boost for quiet sounds
        // Clamp to prevent wave from going outside the SVG bounds
        const rawAmplitude = normalizedValue * (SOUND_WAVE_HEIGHT / 2) * SOUND_WAVE_SENSITIVITY;
        const amplitude = Math.max(-SOUND_WAVE_HEIGHT / 2 + 5, Math.min(SOUND_WAVE_HEIGHT / 2 - 5, rawAmplitude));
        const y = (SOUND_WAVE_HEIGHT / 2) + amplitude;
        
        points.push({ x, y });
    }
    
    // Create a smooth curve using quadratic bezier curves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        
        // Control point is the midpoint
        const cpX = (current.x + next.x) / 2;
        const cpY = (current.y + next.y) / 2;
        
        if (i === 0) {
            // First segment - just line to control point
            pathData += ` L ${cpX} ${cpY}`;
        } else {
            // Quadratic bezier to the midpoint
            pathData += ` Q ${current.x} ${current.y} ${cpX} ${cpY}`;
        }
    }
    
    // Final segment to the last point
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    pathData += ` Q ${secondLastPoint.x} ${secondLastPoint.y} ${lastPoint.x} ${lastPoint.y}`;
    
    wavePath.setAttribute('d', pathData);
    
    // Continue animation
    soundSoundAnimationId = requestAnimationFrame(drawSoundWave);
}

// ==================
// Function to update Letter + Number circle visibility
function updateLetterNumberCircle(pageId) {
    const circleContainer = document.getElementById('letter-number-circle-container');
    if (!circleContainer) return;
    
    // Show circle only for Letter + Number pages (pageId "2-3" or "3-2")
    // Parameter indices: 2=letter, 3=number
    const isLetterNumberPage = pageId === '2-3' || pageId === '3-2';
    
    if (isLetterNumberPage) {
        circleContainer.classList.add('visible');
        // Initialize circle positioning and interactions when page becomes visible
        requestAnimationFrame(() => {
            initializeLetterNumberCircle();
        });
    } else {
        circleContainer.classList.remove('visible');
        // Stop the animation loop when leaving the page
        stopLetterNumberAnimation();
    }
}

// ==================
// LETTER + NUMBER Circle State
// ==================
const LETTER_NUMBER_TOTAL_ITEMS = 35; // A-Z (26) + 1-9 (9)
const LETTER_NUMBER_RADIUS = 280; // Radius of the circle in pixels
const LETTER_NUMBER_ROTATION_SPEED = 0.0005; // Radians per frame (slow rotation)
const LETTER_NUMBER_REPULSION_RADIUS = 200; // Distance at which repulsion starts (increased for larger items)
const LETTER_NUMBER_MAX_DISPLACEMENT = 450; // Maximum displacement in pixels (increased for more movement)
const LETTER_NUMBER_RETURN_SPEED = 0.0008; // How fast elements return to original position (very slow)

let letterNumberRotationOffset = 0; // Current rotation angle
let letterNumberAnimationId = null; // requestAnimationFrame ID
let letterNumberDisplacements = null; // Array of {x, y} displacements for each item
let letterNumberMousePosition = { x: 0, y: 0 }; // Current mouse position relative to container center
let letterNumberInitialized = false;

// Initialize the Letter + Number circle
function initializeLetterNumberCircle() {
    const container = document.getElementById('letter-number-circle-container');
    const canvasContainer = document.getElementById('canvas-container');
    if (!container) return;
    
    // Initialize displacements array (persistent - elements stay displaced)
    // Start with items pushed to their boundary edges (maximum distance from center)
    if (!letterNumberDisplacements) {
        letterNumberDisplacements = [];
        const centerX = 350;
        const centerY = 350;
        const minY = 50;
        const maxY = 630;
        const minX = -350;
        const maxX = 1050;
        
        for (let i = 0; i < LETTER_NUMBER_TOTAL_ITEMS; i++) {
            // Calculate base position on circle
            const angle = (i / LETTER_NUMBER_TOTAL_ITEMS) * 2 * Math.PI;
            const baseX = centerX + LETTER_NUMBER_RADIUS * Math.cos(angle);
            const baseY = centerY + LETTER_NUMBER_RADIUS * Math.sin(angle);
            
            // Calculate direction from center (unit vector)
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            
            // Find how far we can push in this direction before hitting a boundary
            // We need to find the displacement that puts the item at the edge
            let maxDisplacement = LETTER_NUMBER_MAX_DISPLACEMENT;
            
            // Check each boundary and find the limiting one
            if (dirX > 0.01) {
                // Moving right, check right boundary
                const toRight = (maxX - baseX) / dirX;
                maxDisplacement = Math.min(maxDisplacement, toRight);
            } else if (dirX < -0.01) {
                // Moving left, check left boundary
                const toLeft = (minX - baseX) / dirX;
                maxDisplacement = Math.min(maxDisplacement, toLeft);
            }
            
            if (dirY > 0.01) {
                // Moving down, check bottom boundary
                const toBottom = (maxY - baseY) / dirY;
                maxDisplacement = Math.min(maxDisplacement, toBottom);
            } else if (dirY < -0.01) {
                // Moving up, check top boundary
                const toTop = (minY - baseY) / dirY;
                maxDisplacement = Math.min(maxDisplacement, toTop);
            }
            
            // Ensure positive displacement and apply it
            maxDisplacement = Math.max(0, maxDisplacement);
            
            letterNumberDisplacements.push({
                x: dirX * maxDisplacement,
                y: dirY * maxDisplacement
            });
        }
    }
    
    // Set up mouse move listener on canvas-container (larger area for better tracking)
    if (!letterNumberInitialized && canvasContainer) {
        canvasContainer.addEventListener('mousemove', handleLetterNumberMouseMove);
        canvasContainer.addEventListener('mouseleave', handleLetterNumberMouseLeave);
        letterNumberInitialized = true;
    }
    
    // Position all items initially
    updateLetterNumberPositions();
    
    // Start the animation loop
    startLetterNumberAnimation();
}

// Handle mouse movement for repulsion effect
function handleLetterNumberMouseMove(e) {
    const container = document.getElementById('letter-number-circle-container');
    if (!container) return;
    
    // Check if we're on the Letter + Number page
    if (!container.classList.contains('visible')) return;
    
    // Get the actual rendered position of the circle container
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Mouse position relative to container center (in screen coordinates)
    letterNumberMousePosition.x = e.clientX - centerX;
    letterNumberMousePosition.y = e.clientY - centerY;
}

// Handle mouse leaving the canvas area
function handleLetterNumberMouseLeave() {
    // Set mouse position far away so it doesn't affect elements
    letterNumberMousePosition.x = 10000;
    letterNumberMousePosition.y = 10000;
}

// Update positions of all letter/number items
function updateLetterNumberPositions() {
    const container = document.getElementById('letter-number-circle-container');
    if (!container) return;
    
    const items = container.querySelectorAll('.letter-number-item');
    const centerX = 350; // Container is 700x700, center at 350
    const centerY = 350;
    
    // Boundary constraints (in container coordinates)
    // The container is moved up by 80px, so we need to limit how high elements can go
    // Expanded boundaries to allow more movement away from center
    const minY = 50; // Top boundary (expanded by 30px)
    const maxY = 630; // Bottom boundary (expanded by 30px)
    const minX = -350;  // Expanded left boundary
    const maxX = 1050; // Expanded right boundary
    
    items.forEach((item, index) => {
        // Calculate base position on circle
        const angle = (index / LETTER_NUMBER_TOTAL_ITEMS) * 2 * Math.PI + letterNumberRotationOffset;
        const baseX = centerX + LETTER_NUMBER_RADIUS * Math.cos(angle);
        const baseY = centerY + LETTER_NUMBER_RADIUS * Math.sin(angle);
        
        // Apply persistent displacement
        const displacement = letterNumberDisplacements[index];
        let finalX = baseX + displacement.x;
        let finalY = baseY + displacement.y;
        
        // Clamp to boundaries (prevent going above UI/gradient header)
        finalX = Math.max(minX, Math.min(maxX, finalX));
        finalY = Math.max(minY, Math.min(maxY, finalY));
        
        // Calculate distance from center for dynamic font sizing
        const distanceFromCenter = Math.sqrt((finalX - centerX) ** 2 + (finalY - centerY) ** 2);
        
        // Map distance to font size (closer = smaller, farther = larger)
        // Using linear interpolation: minSize at center, scaling up with distance
        const MIN_FONT_SIZE = 16;
        const BASE_FONT_SIZE = 48;
        const MAX_FONT_SIZE = 96;
        const BASE_DISTANCE = 280; // The default circle radius
        const MAX_DISTANCE = 500;  // Maximum expected distance
        
        let fontSize;
        if (distanceFromCenter <= BASE_DISTANCE) {
            // Scale from MIN to BASE as distance goes from 0 to BASE_DISTANCE
            const ratio = distanceFromCenter / BASE_DISTANCE;
            fontSize = MIN_FONT_SIZE + ratio * (BASE_FONT_SIZE - MIN_FONT_SIZE);
        } else {
            // Scale from BASE to MAX as distance goes beyond BASE_DISTANCE
            const ratio = Math.min((distanceFromCenter - BASE_DISTANCE) / (MAX_DISTANCE - BASE_DISTANCE), 1);
            fontSize = BASE_FONT_SIZE + ratio * (MAX_FONT_SIZE - BASE_FONT_SIZE);
        }
        
        // Apply dynamic font size
        item.style.fontSize = `${fontSize}px`;
        
        // Position the item (centered on its position)
        item.style.left = `${finalX - 40}px`; // 40 = half of item width (80px)
        item.style.top = `${finalY - 40}px`;  // 40 = half of item height (80px)
        
        // Update the line from center to this item's inner edge
        updateLetterNumberLine(index, finalX, finalY, centerX, centerY);
    });
}

// Update a single line from center to the inner edge of an item
function updateLetterNumberLine(index, itemX, itemY, centerX, centerY) {
    const line = document.getElementById(`letter-number-line-${index}`);
    if (!line) return;
    
    // Calculate direction from center to item
    const dx = itemX - centerX;
    const dy = itemY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Inner edge of item (closer to center) - offset by ~40px (half of 80px item size)
    const innerEdgeX = itemX - dirX * 40;
    const innerEdgeY = itemY - dirY * 40;
    
    // Set line coordinates (from center to inner edge of item)
    line.setAttribute('x1', centerX);
    line.setAttribute('y1', centerY);
    line.setAttribute('x2', innerEdgeX);
    line.setAttribute('y2', innerEdgeY);
}

// Calculate and apply repulsion from mouse
function applyLetterNumberRepulsion() {
    const container = document.getElementById('letter-number-circle-container');
    if (!container) return;
    
    const centerX = 350;
    const centerY = 350;
    
    // Boundary constraints (same as in updateLetterNumberPositions)
    const minY = 50;
    const maxY = 630;
    const minX = -350;
    const maxX = 1050;
    
    for (let i = 0; i < LETTER_NUMBER_TOTAL_ITEMS; i++) {
        // Calculate current base position on circle
        const angle = (i / LETTER_NUMBER_TOTAL_ITEMS) * 2 * Math.PI + letterNumberRotationOffset;
        const baseX = centerX + LETTER_NUMBER_RADIUS * Math.cos(angle);
        const baseY = centerY + LETTER_NUMBER_RADIUS * Math.sin(angle);
        
        // Current position with displacement
        const currentX = baseX + letterNumberDisplacements[i].x;
        const currentY = baseY + letterNumberDisplacements[i].y;
        
        // Calculate distance from mouse (mouse position is relative to center)
        const mouseAbsX = centerX + letterNumberMousePosition.x;
        const mouseAbsY = centerY + letterNumberMousePosition.y;
        
        const dx = currentX - mouseAbsX;
        const dy = currentY - mouseAbsY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply repulsion if within range
        if (distance < LETTER_NUMBER_REPULSION_RADIUS && distance > 0) {
            // Calculate repulsion force (stronger when closer)
            const force = (LETTER_NUMBER_REPULSION_RADIUS - distance) / LETTER_NUMBER_REPULSION_RADIUS;
            const repulsionStrength = force * 3; // Multiplier for responsiveness
            
            // Push away from mouse
            let pushX = (dx / distance) * repulsionStrength;
            let pushY = (dy / distance) * repulsionStrength;
            
            // Check if pushing would exceed boundaries, if so limit the push
            const newX = baseX + letterNumberDisplacements[i].x + pushX;
            const newY = baseY + letterNumberDisplacements[i].y + pushY;
            
            // Don't push upward if already at top boundary
            if (newY < minY && pushY < 0) pushY = 0;
            // Don't push downward if already at bottom boundary
            if (newY > maxY && pushY > 0) pushY = 0;
            // Don't push left if already at left boundary
            if (newX < minX && pushX < 0) pushX = 0;
            // Don't push right if already at right boundary
            if (newX > maxX && pushX > 0) pushX = 0;
            
            // Apply to displacement (cumulative - stays displaced)
            letterNumberDisplacements[i].x += pushX;
            letterNumberDisplacements[i].y += pushY;
            
            // Clamp displacement to maximum
            const dispMag = Math.sqrt(
                letterNumberDisplacements[i].x * letterNumberDisplacements[i].x +
                letterNumberDisplacements[i].y * letterNumberDisplacements[i].y
            );
            if (dispMag > LETTER_NUMBER_MAX_DISPLACEMENT) {
                const scale = LETTER_NUMBER_MAX_DISPLACEMENT / dispMag;
                letterNumberDisplacements[i].x *= scale;
                letterNumberDisplacements[i].y *= scale;
            }
        }
    }
}

// Slowly return elements to their original position (when not being pushed by mouse)
function applyLetterNumberReturnToOrigin() {
    if (!letterNumberDisplacements) return;
    
    const centerX = 350;
    const centerY = 350;
    
    for (let i = 0; i < LETTER_NUMBER_TOTAL_ITEMS; i++) {
        // Calculate current base position on circle
        const angle = (i / LETTER_NUMBER_TOTAL_ITEMS) * 2 * Math.PI + letterNumberRotationOffset;
        const baseX = centerX + LETTER_NUMBER_RADIUS * Math.cos(angle);
        const baseY = centerY + LETTER_NUMBER_RADIUS * Math.sin(angle);
        
        // Current position with displacement
        const currentX = baseX + letterNumberDisplacements[i].x;
        const currentY = baseY + letterNumberDisplacements[i].y;
        
        // Check distance from mouse
        const mouseAbsX = centerX + letterNumberMousePosition.x;
        const mouseAbsY = centerY + letterNumberMousePosition.y;
        const dx = currentX - mouseAbsX;
        const dy = currentY - mouseAbsY;
        const distanceFromMouse = Math.sqrt(dx * dx + dy * dy);
        
        // Only return to origin if mouse is far enough away
        if (distanceFromMouse > LETTER_NUMBER_REPULSION_RADIUS) {
            // Slowly reduce displacement (move toward 0)
            letterNumberDisplacements[i].x *= (1 - LETTER_NUMBER_RETURN_SPEED);
            letterNumberDisplacements[i].y *= (1 - LETTER_NUMBER_RETURN_SPEED);
            
            // Snap to zero if very small (avoid floating point drift)
            if (Math.abs(letterNumberDisplacements[i].x) < 0.1) {
                letterNumberDisplacements[i].x = 0;
            }
            if (Math.abs(letterNumberDisplacements[i].y) < 0.1) {
                letterNumberDisplacements[i].y = 0;
            }
        }
    }
}

// Animation loop
function animateLetterNumberCircle() {
    // Update rotation
    letterNumberRotationOffset += LETTER_NUMBER_ROTATION_SPEED;
    
    // Apply repulsion effect
    applyLetterNumberRepulsion();
    
    // Return to origin disabled - elements stay in place after being pushed
    // applyLetterNumberReturnToOrigin();
    
    // Update visual positions
    updateLetterNumberPositions();
    
    // Continue animation
    letterNumberAnimationId = requestAnimationFrame(animateLetterNumberCircle);
}

// Start the animation
function startLetterNumberAnimation() {
    if (letterNumberAnimationId !== null) return; // Already running
    letterNumberAnimationId = requestAnimationFrame(animateLetterNumberCircle);
}

// Stop the animation
function stopLetterNumberAnimation() {
    if (letterNumberAnimationId !== null) {
        cancelAnimationFrame(letterNumberAnimationId);
        letterNumberAnimationId = null;
    }
}

// ==================
// COLOR + COLOR Concentric Rings State
// ==================
let colorColorRingRotations = [0, 0, 0, 0, 0];
let colorColorRingsInitialized = false;

// Function to update Color + Color circle visibility
function updateColorColorCircle(pageId) {
    const circleContainer = document.getElementById('color-color-circle-container');
    if (!circleContainer) return;
    
    // Show circle only for Color + Color page (pageId "5-5")
    // Parameter indices: 5=color
    const isColorColorPage = pageId === '5-5';
    
    if (isColorColorPage) {
        circleContainer.classList.add('visible');
        // Initialize ring rotation functionality when page becomes visible
        requestAnimationFrame(() => {
            initializeColorColorRings();
        });
    } else {
        circleContainer.classList.remove('visible');
        // Reset ring rotations when leaving the page
        resetColorColorRings();
    }
}

// Get the center point of the Color + Color rings container in page coordinates
function getColorColorRingsCenterPoint() {
    const container = document.getElementById('color-color-circle-container');
    if (!container) return { x: 0, y: 0 };
    
    const rect = container.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Apply rotation to a color ring using CSS transform
function applyColorColorRingRotation(ringIndex, angle) {
    const ring = document.querySelector(`.color-color-ring[data-ring="${ringIndex}"]`);
    if (ring) {
        // Apply rotation while preserving the centering transform
        ring.style.transform = `rotate(${angle}deg)`;
    }
}

// Rotation multipliers for each ring
// Even rings (0, 2, 4) rotate clockwise, odd rings (1, 3) rotate counterclockwise
// Ring 0 (outer) rotates slowest, Ring 4 (inner) rotates fastest
const colorColorRingMultipliers = [0.2, -0.4, 0.6, -0.8, 1.0];

// Handle mouse move - all rings rotate based on mouse position
function handleColorColorRingMouseMove(e) {
    // Only work when color rings container is visible
    const container = document.getElementById('color-color-circle-container');
    if (!container || !container.classList.contains('visible')) return;
    
    // Calculate current angle from center to mouse position
    const center = getColorColorRingsCenterPoint();
    const mouseAngle = calculateAngle(center.x, center.y, e.clientX, e.clientY);
    
    // Apply rotation to each ring with its own multiplier
    for (let i = 0; i < 5; i++) {
        const rotation = mouseAngle * colorColorRingMultipliers[i];
        colorColorRingRotations[i] = rotation;
        applyColorColorRingRotation(i, rotation);
    }
}

// Initialize the color concentric rings interaction
function initializeColorColorRings() {
    if (colorColorRingsInitialized) return;
    
    const container = document.getElementById('color-color-circle-container');
    if (!container) return;
    
    // Add mouse move listener to document - rings follow mouse position
    document.addEventListener('mousemove', handleColorColorRingMouseMove);
    
    colorColorRingsInitialized = true;
}

// Reset all color ring rotations to 0
function resetColorColorRings() {
    colorColorRingRotations = [0, 0, 0, 0, 0];
    
    // Apply reset rotations to all rings
    for (let i = 0; i < 5; i++) {
        applyColorColorRingRotation(i, 0);
    }
}

// ==================
// SOUND + COLOR Squares State
// ==================
let soundColorSquarePositions = null;
let soundColorDragInitialized = false;

// ==================
// SOUND + COLOR Audio System
// ==================
// Mapping of color index to instrument sound files
// Index corresponds to colors array: 0=Orange, 1=Purple, 2=Yellow, 3=Green, 4=Pink, 5=Blue
const SOUND_COLOR_INSTRUMENTS = {
    0: { name: 'drums', file: 'sounds/756121__hewnmarrow__repeated-drum-beat-002-fx-011-v037.wav' },      // Orange (כתום) - Drums (תופים)
    1: { name: 'bass', file: 'sounds/736935__sirbagel__bass-guitar-single-ga-note.wav' },                 // Purple (סגול) - Bass guitar (גיטרת בס)
    2: { name: 'trumpet', file: 'sounds/194625__harbour11__trumpet1.wav' },                               // Yellow (צהוב) - Trumpet (חצוצרה)
    3: { name: 'violin', file: 'sounds/56197__ldk1609__violin-spiccato-b3.wav' },                         // Green (ירוק) - Violin (כינור)
    4: { name: 'piano', file: 'sounds/148471__neatonk__piano_loud_ab6.wav' },                             // Pink (ורוד) - Piano (פסנתר)
    5: { name: 'triangle', file: 'sounds/31190__acclivity__triangle2.wav' }                               // Blue (כחול) - Triangle (משולש)
};

// Audio elements for each instrument (loaded once, reused)
let soundColorAudioElements = {};
// Track which instruments are currently playing
let soundColorPlayingInstruments = new Set();
// Track which squares are currently touching (as pairs)
let soundColorTouchingPairs = new Set();
// Track which square is currently being dragged (-1 means none)
let soundColorDraggingSquareIndex = -1;

// Initialize and preload all instrument audio files
function initSoundColorAudio() {
    // Only initialize once
    if (Object.keys(soundColorAudioElements).length > 0) return;
    
    // Create Audio elements for each instrument
    for (const [index, instrument] of Object.entries(SOUND_COLOR_INSTRUMENTS)) {
        const audio = new Audio(instrument.file);
        audio.loop = true; // Enable looping
        audio.volume = 0.7; // Set default volume
        audio.preload = 'auto'; // Preload audio
        
        // Store reference
        soundColorAudioElements[index] = audio;
        
        // Log loading status (helpful for debugging)
        audio.addEventListener('canplaythrough', () => {
            console.log(`Sound loaded: ${instrument.name}`);
        });
        
        audio.addEventListener('error', (e) => {
            console.warn(`Failed to load sound: ${instrument.name}`, e);
        });
    }
}

// Start playing an instrument loop
function startInstrumentLoop(index) {
    const audio = soundColorAudioElements[index];
    if (!audio) return;
    
    // Only start if not already playing
    if (!soundColorPlayingInstruments.has(index)) {
        audio.currentTime = 0; // Reset to start
        audio.play().catch(e => {
            // Autoplay might be blocked - this is normal on first interaction
            console.log('Audio play blocked, waiting for user interaction');
        });
        soundColorPlayingInstruments.add(index);
    }
}

// Stop playing an instrument loop
function stopInstrumentLoop(index) {
    const audio = soundColorAudioElements[index];
    if (!audio) return;
    
    if (soundColorPlayingInstruments.has(index)) {
        audio.pause();
        audio.currentTime = 0; // Reset to start
        soundColorPlayingInstruments.delete(index);
    }
}

// Stop all instrument loops
function stopAllInstrumentLoops() {
    for (const index of Object.keys(soundColorAudioElements)) {
        stopInstrumentLoop(parseInt(index));
    }
    soundColorTouchingPairs.clear();
}

// Check if two squares are touching (overlapping)
function areSquaresTouching(square1, square2) {
    const rect1 = square1.getBoundingClientRect();
    const rect2 = square2.getBoundingClientRect();
    
    // Check for overlap (not touching = one is completely outside the other)
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

// Generate a unique key for a pair of indices (order-independent)
function getPairKey(index1, index2) {
    return index1 < index2 ? `${index1}-${index2}` : `${index2}-${index1}`;
}

// Check all square collisions and update sounds accordingly
function checkSquareCollisionsAndUpdateSounds() {
    const container = document.getElementById('sound-color-squares-container');
    if (!container) return;
    
    const squares = container.querySelectorAll('.sound-color-square');
    if (squares.length === 0) return;
    
    // Convert NodeList to Array for easier manipulation
    const squaresArray = Array.from(squares);
    
    // Track current touching pairs
    const currentTouchingPairs = new Set();
    // Track which instruments should be playing
    const shouldBePlaying = new Set();
    
    // If a square is being dragged, its sound should play
    if (soundColorDraggingSquareIndex >= 0) {
        shouldBePlaying.add(soundColorDraggingSquareIndex);
    }
    
    // Check all pairs of squares for collisions
    for (let i = 0; i < squaresArray.length; i++) {
        for (let j = i + 1; j < squaresArray.length; j++) {
            const square1 = squaresArray[i];
            const square2 = squaresArray[j];
            const index1 = parseInt(square1.getAttribute('data-index'));
            const index2 = parseInt(square2.getAttribute('data-index'));
            
            if (areSquaresTouching(square1, square2)) {
                const pairKey = getPairKey(index1, index2);
                currentTouchingPairs.add(pairKey);
                
                // Both instruments should play
                shouldBePlaying.add(index1);
                shouldBePlaying.add(index2);
            }
        }
    }
    
    // Start instruments that should be playing but aren't
    for (const index of shouldBePlaying) {
        if (!soundColorPlayingInstruments.has(index)) {
            startInstrumentLoop(index);
        }
    }
    
    // Stop instruments that are playing but shouldn't be
    for (const index of soundColorPlayingInstruments) {
        if (!shouldBePlaying.has(index)) {
            stopInstrumentLoop(index);
        }
    }
    
    // Update the tracking set
    soundColorTouchingPairs = currentTouchingPairs;
}

// Get initial positions for squares - custom scattered arrangement
// Based on the desired default layout from the design
function getInitialSoundColorPositions() {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        // Fallback positions (custom scattered arrangement)
        return [
            { x: -20, y: -110 },    // 0: Orange - center, slightly up
            { x: 320, y: 300 },     // 1: Purple - bottom right
            { x: 280, y: 30 },      // 2: Yellow - right side, middle
            { x: 350, y: -200 },    // 3: Green - top right
            { x: -220, y: 80 },     // 4: Pink - left side, below center
            { x: -340, y: -180 }    // 5: Blue - top left
        ];
    }
    
    const containerRect = canvasContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate available space
    const padding = 120;
    const squareSize = 100;
    const maxX = (containerWidth / 2) - (squareSize / 2) - padding;
    const maxY = (containerHeight / 2) - (squareSize / 2) - padding;
    
    // Custom scattered positions based on the desired layout
    // Positions are relative to container center
    // These ratios are based on the design screenshot
    const positions = [
        { x: -0.05 * maxX, y: -0.35 * maxY },   // 0: Orange - center, slightly up
        { x: 0.85 * maxX, y: 0.85 * maxY },     // 1: Purple - bottom right
        { x: 0.75 * maxX, y: 0.1 * maxY },      // 2: Yellow - right side, middle
        { x: 0.95 * maxX, y: -0.6 * maxY },     // 3: Green - top right
        { x: -0.55 * maxX, y: 0.25 * maxY },    // 4: Pink - left side, below center
        { x: -0.9 * maxX, y: -0.55 * maxY }     // 5: Blue - top left
    ];
    
    return positions;
}

// Update square position visually
function updateSoundColorSquarePosition(squareElement, index) {
    if (!soundColorSquarePositions || !soundColorSquarePositions[index]) return;
    
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;
    
    const containerRect = canvasContainer.getBoundingClientRect();
    const pos = soundColorSquarePositions[index];
    
    // Container center
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // Square size
    const squareSize = 100;
    
    // Calculate position (center of square at pos.x, pos.y relative to container center)
    const leftPos = centerX + pos.x - squareSize / 2;
    const topPos = centerY + pos.y - squareSize / 2;
    
    // Apply position
    squareElement.style.left = `${leftPos}px`;
    squareElement.style.top = `${topPos}px`;
    
    // Update the line for this square
    updateSoundColorLine(index);
}

// Update the SVG line connecting center to a specific square
function updateSoundColorLine(index) {
    const line = document.getElementById(`sound-color-line-${index}`);
    if (!line || !soundColorSquarePositions || !soundColorSquarePositions[index]) return;
    
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;
    
    const containerRect = canvasContainer.getBoundingClientRect();
    const pos = soundColorSquarePositions[index];
    
    // Container center (where lines originate)
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    // Square center - pos is already relative to container center
    const squareCenterX = centerX + pos.x;
    const squareCenterY = centerY + pos.y;
    
    // Calculate the edge of the square (instead of center)
    // Direction from square center toward container center
    const dx = centerX - squareCenterX;
    const dy = centerY - squareCenterY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    let edgeX = squareCenterX;
    let edgeY = squareCenterY;
    
    if (length > 0) {
        // Normalize direction
        const dirX = dx / length;
        const dirY = dy / length;
        
        const halfSize = 50; // Half of 100px square
        
        // Find intersection with square edge
        // We move from square center toward container center until we hit an edge
        let tX = Infinity, tY = Infinity;
        
        if (Math.abs(dirX) > 0.001) {
            tX = halfSize / Math.abs(dirX);
        }
        if (Math.abs(dirY) > 0.001) {
            tY = halfSize / Math.abs(dirY);
        }
        
        // Take the minimum to find which edge we hit first
        const t = Math.min(tX, tY);
        
        // Calculate edge point
        edgeX = squareCenterX + dirX * t;
        edgeY = squareCenterY + dirY * t;
    }
    
    // Set line coordinates - from container center to square EDGE
    line.setAttribute('x1', centerX);
    line.setAttribute('y1', centerY);
    line.setAttribute('x2', edgeX);
    line.setAttribute('y2', edgeY);
}

// Update all sound-color lines (useful for initial setup and resize)
function updateAllSoundColorLines() {
    for (let i = 0; i < 6; i++) {
        updateSoundColorLine(i);
    }
}

// Initialize the colored squares with positions and drag functionality
function initializeSoundColorSquares() {
    const container = document.getElementById('sound-color-squares-container');
    if (!container) return;
    
    const squares = container.querySelectorAll('.sound-color-square');
    if (squares.length === 0) return;
    
    // Initialize audio system for instrument sounds
    initSoundColorAudio();
    
    // Initialize positions if not already set
    if (!soundColorSquarePositions) {
        soundColorSquarePositions = getInitialSoundColorPositions();
    }
    
    // Apply colors and positions
    squares.forEach((square, index) => {
        // Set background color from data attribute
        const color = square.getAttribute('data-color');
        if (color) {
            square.style.backgroundColor = color;
        }
        // Update visual position
        updateSoundColorSquarePosition(square, index);
    });
    
    // Only add event listeners once
    if (soundColorDragInitialized) return;
    
    const canvasContainer = document.getElementById('canvas-container');
    
    squares.forEach((square, index) => {
        let isDragging = false;
        let startX, startY;
        let startPosX, startPosY;
        
        // Mouse down - start dragging
        square.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            square.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            startPosX = soundColorSquarePositions[index].x;
            startPosY = soundColorSquarePositions[index].y;
            
            // Track which square is being dragged for sound
            soundColorDraggingSquareIndex = index;
            // Start playing this square's sound immediately
            checkSquareCollisionsAndUpdateSounds();
            
            // Add global mouse move and up listeners
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Calculate new position
            let newX = startPosX + dx;
            let newY = startPosY + dy;
            
            // Constrain to canvas bounds
            const canvasRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
            
            if (canvasRect) {
                const padding = 60; // Padding from edges
                const squareSize = 100;
                
                const maxX = (canvasRect.width / 2) - (squareSize / 2) - padding;
                const maxY = (canvasRect.height / 2) - (squareSize / 2) - padding;
                
                // Clamp position
                newX = Math.max(-maxX, Math.min(maxX, newX));
                newY = Math.max(-maxY, Math.min(maxY, newY));
            }
            
            // Update position
            soundColorSquarePositions[index].x = newX;
            soundColorSquarePositions[index].y = newY;
            
            // Update visual position
            updateSoundColorSquarePosition(square, index);
            
            // Check for collisions with other squares and update sounds
            checkSquareCollisionsAndUpdateSounds();
        }
        
        function onMouseUp() {
            isDragging = false;
            square.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Stop tracking dragged square
            soundColorDraggingSquareIndex = -1;
            // Final collision check when drag ends (will stop sound if not touching another square)
            checkSquareCollisionsAndUpdateSounds();
        }
        
        // Touch support for mobile
        square.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            square.classList.add('dragging');
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startPosX = soundColorSquarePositions[index].x;
            startPosY = soundColorSquarePositions[index].y;
            
            // Track which square is being dragged for sound
            soundColorDraggingSquareIndex = index;
            // Start playing this square's sound immediately
            checkSquareCollisionsAndUpdateSounds();
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        });
        
        function onTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            // Calculate new position
            let newX = startPosX + dx;
            let newY = startPosY + dy;
            
            // Constrain to canvas bounds
            const canvasRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
            
            if (canvasRect) {
                const padding = 60;
                const squareSize = 100;
                
                const maxX = (canvasRect.width / 2) - (squareSize / 2) - padding;
                const maxY = (canvasRect.height / 2) - (squareSize / 2) - padding;
                
                newX = Math.max(-maxX, Math.min(maxX, newX));
                newY = Math.max(-maxY, Math.min(maxY, newY));
            }
            
            // Update position
            soundColorSquarePositions[index].x = newX;
            soundColorSquarePositions[index].y = newY;
            
            // Update visual position
            updateSoundColorSquarePosition(square, index);
            
            // Check for collisions with other squares and update sounds
            checkSquareCollisionsAndUpdateSounds();
        }
        
        function onTouchEnd() {
            isDragging = false;
            square.classList.remove('dragging');
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            
            // Stop tracking dragged square
            soundColorDraggingSquareIndex = -1;
            // Final collision check when drag ends (will stop sound if not touching another square)
            checkSquareCollisionsAndUpdateSounds();
        }
    });
    
    soundColorDragInitialized = true;
}

// ==================
// MELODY Letters Drag Functionality
// ==================

// Store current positions of each letter (relative to container center)
let melodyLetterPositions = null;
let melodyDragInitialized = false;
// Store which axis each letter is constrained to ('horizontal' or 'vertical')
let melodyLetterConstraints = null;

// ==================
// MELODY Letters Sound System (Web Audio API)
// ==================
let melodyAudioCtx = null;
let melodyMasterGain = null;
let melodyActiveOscillators = {}; // Track active oscillator nodes per letter index

// Ensure audio context is initialized and running
function ensureMelodyAudio() {
    if (!melodyAudioCtx) {
        melodyAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        melodyMasterGain = melodyAudioCtx.createGain();
        melodyMasterGain.gain.value = 0.5;
        melodyMasterGain.connect(melodyAudioCtx.destination);
    }
    if (melodyAudioCtx.state === "suspended") {
        melodyAudioCtx.resume();
    }
}

// Convert font weight (100-900) to frequency (high to low)
// Light weight = high pitch, Heavy weight = low pitch
function fontWeightToFrequency(fontWeight) {
    const normalized = (fontWeight - 100) / 800; // 0 to 1
    const minFreq = 110;  // A2 (low)
    const maxFreq = 880;  // A5 (high)
    // Invert: light (100) = high freq, heavy (900) = low freq
    return maxFreq - (normalized * (maxFreq - minFreq));
}

// Get unique sound character for each letter
// Returns oscillator type, gain, and filter settings
function getMelodyLetterSoundConfig(letterIndex) {
    const configs = [
        // M (index 0) - Warm, round, bass-friendly (sine)
        { oscType: 'sine', gain: 0.6, filterType: null, filterFreq: null },
        // E (index 1) - Bright, clear, mid-range (triangle)
        { oscType: 'triangle', gain: 0.5, filterType: null, filterFreq: null },
        // L (index 2) - Rich, evolving (sawtooth with lowpass filter)
        { oscType: 'sawtooth', gain: 0.35, filterType: 'lowpass', filterFreq: 2000 },
        // O (index 3) - Open, vowel-like (sine, slightly louder)
        { oscType: 'sine', gain: 0.65, filterType: null, filterFreq: null },
        // D (index 4) - Punchy, percussive (square with lowpass filter)
        { oscType: 'square', gain: 0.3, filterType: 'lowpass', filterFreq: 1500 },
        // Y (index 5) - Soft, airy (triangle with highpass filter)
        { oscType: 'triangle', gain: 0.45, filterType: 'highpass', filterFreq: 300 }
    ];
    return configs[letterIndex] || configs[0];
}

// Start continuous sound for a letter
function startMelodySound(letterIndex, initialFontWeight) {
    ensureMelodyAudio();
    if (!melodyAudioCtx || melodyAudioCtx.state !== "running") return;
    
    // Stop any existing sound for this letter
    stopMelodySound(letterIndex);
    
    const config = getMelodyLetterSoundConfig(letterIndex);
    const initialFreq = fontWeightToFrequency(initialFontWeight || 500);
    
    // Create oscillator
    const osc = melodyAudioCtx.createOscillator();
    osc.type = config.oscType;
    osc.frequency.setValueAtTime(initialFreq, melodyAudioCtx.currentTime);
    
    // Create gain node for this letter
    const gainNode = melodyAudioCtx.createGain();
    gainNode.gain.setValueAtTime(0.0001, melodyAudioCtx.currentTime);
    // Fade in smoothly
    gainNode.gain.linearRampToValueAtTime(config.gain, melodyAudioCtx.currentTime + 0.05);
    
    // Create filter if needed
    let filterNode = null;
    if (config.filterType) {
        filterNode = melodyAudioCtx.createBiquadFilter();
        filterNode.type = config.filterType;
        filterNode.frequency.setValueAtTime(config.filterFreq, melodyAudioCtx.currentTime);
        filterNode.Q.setValueAtTime(1, melodyAudioCtx.currentTime);
        
        osc.connect(gainNode);
        gainNode.connect(filterNode);
        filterNode.connect(melodyMasterGain);
    } else {
        osc.connect(gainNode);
        gainNode.connect(melodyMasterGain);
    }
    
    osc.start();
    
    // Store references for later updates and cleanup
    melodyActiveOscillators[letterIndex] = {
        osc: osc,
        gainNode: gainNode,
        filterNode: filterNode,
        config: config
    };
}

// Update frequency for an active letter sound
function updateMelodyFrequency(letterIndex, fontWeight) {
    const activeSound = melodyActiveOscillators[letterIndex];
    if (!activeSound || !melodyAudioCtx) return;
    
    const newFreq = fontWeightToFrequency(fontWeight);
    // Smooth frequency transition for continuous sound
    activeSound.osc.frequency.linearRampToValueAtTime(
        newFreq, 
        melodyAudioCtx.currentTime + 0.03
    );
}

// Stop sound for a letter with smooth fade-out
function stopMelodySound(letterIndex) {
    const activeSound = melodyActiveOscillators[letterIndex];
    if (!activeSound || !melodyAudioCtx) return;
    
    const { osc, gainNode, filterNode } = activeSound;
    
    // Fade out smoothly
    const fadeOutTime = 0.15;
    gainNode.gain.linearRampToValueAtTime(0.0001, melodyAudioCtx.currentTime + fadeOutTime);
    
    // Stop and disconnect after fade
    setTimeout(() => {
        try { osc.stop(); } catch (e) {}
        try { osc.disconnect(); } catch (e) {}
        try { gainNode.disconnect(); } catch (e) {}
        if (filterNode) {
            try { filterNode.disconnect(); } catch (e) {}
        }
    }, fadeOutTime * 1000 + 50);
    
    // Remove from active oscillators
    delete melodyActiveOscillators[letterIndex];
}

// Calculate font weight based on horizontal position
// Maps x position to font weight (100-900): Left = thin (100), Right = heavy (900)
function calculateFontWeightFromPosition(xPosition, minX, maxX) {
    const normalizedPosition = (xPosition - minX) / (maxX - minX);
    const clampedPosition = Math.max(0, Math.min(1, normalizedPosition));
    const fontWeight = 100 + (clampedPosition * 800);
    return Math.round(fontWeight);
}

// Initialize the positions at canvas edges (not in a circle)
// Letter order: M(0), E(1), L(2), O(3), D(4), Y(5)
// Based on the design: Y-left, M-top, E-right, L-bottom-right, O-bottom, D-bottom-left
function getInitialMelodyPositions() {
    // Get canvas container dimensions to calculate edge positions
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        // Fallback if container not ready - positions based on design image
        return [
            { x: 180, y: -280 },   // M - top right area (heavy weight)
            { x: 280, y: -300 },   // E - right upper (lighter weight)
            { x: 280, y: 220 },    // L - bottom right (heavy weight)
            { x: 340, y: 280 },    // O - bottom, right of center (light weight)
            { x: -280, y: 120 },   // D - left side, lower (heavy weight)
            { x: -280, y: -150 }   // Y - left side, upper (light weight)
        ];
    }
    
    // The melody container is 700x700 and centered in the canvas
    // We need to calculate positions relative to the 700x700 container center (350, 350)
    // But we want letters at the actual canvas edges
    const containerRect = canvasContainer.getBoundingClientRect();
    const melodyContainer = document.getElementById('melody-circle-container');
    const melodyRect = melodyContainer ? melodyContainer.getBoundingClientRect() : null;
    
    // Calculate how far the edges are from the melody container center
    let leftEdge, rightEdge, topEdge, bottomEdge;
    
    if (melodyRect) {
        const melodyCenterX = melodyRect.left + melodyRect.width / 2;
        const melodyCenterY = melodyRect.top + melodyRect.height / 2;
        
        // Distance from melody center to canvas edges (with padding for letter size)
        const letterPadding = 80; // Account for letter size
        leftEdge = -(melodyCenterX - containerRect.left - letterPadding);
        rightEdge = containerRect.right - melodyCenterX - letterPadding;
        topEdge = -(melodyCenterY - containerRect.top - letterPadding);
        bottomEdge = containerRect.bottom - melodyCenterY - letterPadding;
    } else {
        // Fallback values
        leftEdge = -300;
        rightEdge = 300;
        topEdge = -200;
        bottomEdge = 200;
    }
    
    // Position letters based on the design image:
    // M(0) - top right (heavy), E(1) - right middle, L(2) - bottom-right (heavy), 
    // O(3) - bottom slightly left (light), D(4) - left lower (heavy), Y(5) - left upper (light)
    
    // Calculate intermediate positions (not all at edges)
    const rightMid = rightEdge;
    const leftMid = leftEdge;
    const topMid = topEdge;
    const bottomMid = bottomEdge;
    
    // M moves horizontally: position toward right for heavy weight
    const mX = rightEdge * 0.6;  // 60% toward right edge
    
    // O moves horizontally: position right of center for light weight
    const oX = 340;   // 340px right of center
    
    // E moves vertically: upper position for lighter weight
    const eY = -300;  // 300px above center
    
    // L moves vertically: position toward bottom for heavy weight
    const lY = bottomEdge * 0.8;  // 80% toward bottom
    
    // D moves vertically: position lower for heavy weight
    const dY = bottomEdge * 0.5;  // 50% toward bottom
    
    // Y moves vertically: position upper for light weight
    const yY = topEdge * 0.6;    // 60% toward top
    
    return [
        { x: mX, y: topMid },              // M - top, right of center (heavy)
        { x: rightMid, y: eY },            // E - right edge, center height (medium)
        { x: rightMid, y: lY },            // L - right edge, toward bottom (heavy)
        { x: oX, y: bottomMid },           // O - bottom, slightly left (light)
        { x: leftMid, y: dY },             // D - left edge, lower half (heavy)
        { x: leftMid, y: yY }              // Y - left edge, upper area (light)
    ];
}

// Get the movement constraint for each letter based on its edge position
function getLetterConstraints() {
    // M(0) - horizontal only
    // E(1) - vertical only
    // L(2) - vertical only
    // O(3) - horizontal only
    // D(4) - vertical only
    // Y(5) - vertical only
    return [
        'horizontal', // M
        'vertical',   // E
        'vertical',   // L
        'horizontal', // O
        'vertical',   // D
        'vertical'    // Y
    ];
}

// Update letter position visually
function updateMelodyLetterPosition(letterElement, index) {
    if (!melodyLetterPositions || !melodyLetterPositions[index]) return;
    
    const pos = melodyLetterPositions[index];
    
    // Get letter dimensions for centering
    const letterWidth = letterElement.offsetWidth || 150; // Fallback estimate
    const letterHeight = letterElement.offsetHeight || 200; // Fallback estimate
    
    // Container is 700x700, center is at (350, 350)
    // Position the letter so its center is at (350 + pos.x, 350 + pos.y)
    const leftPos = 350 + pos.x - letterWidth / 2;
    const topPos = 350 + pos.y - letterHeight / 2;
    
    // Use absolute positioning
    letterElement.style.left = `${leftPos}px`;
    letterElement.style.top = `${topPos}px`;
    letterElement.style.transform = 'none'; // Remove any transforms
    
    // Update font weight for all letters based on position
    // M(0) and O(3) move horizontally: left = light (100), right = heavy (900)
    // E(1), L(2), D(4), Y(5) move vertically: top = light (100), bottom = heavy (900)
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && melodyLetterConstraints) {
        const canvasRect = canvasContainer.getBoundingClientRect();
        const constraint = melodyLetterConstraints[index];
        let fontWeight;
        
        if (constraint === 'horizontal') {
            // M and O: horizontal movement - left = light, right = heavy
            fontWeight = calculateFontWeightFromPosition(
                pos.x, 
                -(canvasRect.width / 2), 
                canvasRect.width / 2
            );
        } else {
            // E, L, D, Y: vertical movement - top = light, bottom = heavy
            fontWeight = calculateFontWeightFromPosition(
                pos.y, 
                -(canvasRect.height / 2), 
                canvasRect.height / 2
            );
        }
        letterElement.style.fontWeight = fontWeight;
        
        // Update sound frequency if this letter is currently being dragged
        updateMelodyFrequency(index, fontWeight);
    }
    
    // Update the line for this letter
    updateMelodyLine(letterElement, index);
}

// Get the fixed connection point for each letter based on its position
// Each letter has a specific edge where the line connects
// Letter positions: M(0)-top, E(1)-right, L(2)-bottom-right, O(3)-bottom, D(4)-bottom-left, Y(5)-left
function getLetterConnectionPoint(letterElement, index) {
    if (!melodyLetterPositions || !melodyLetterPositions[index]) return null;
    
    const pos = melodyLetterPositions[index];
    
    // Get letter dimensions
    const letterWidth = letterElement.offsetWidth || 150;
    const letterHeight = letterElement.offsetHeight || 200;
    
    // Calculate letter bounds (in container coordinates, where center is 350, 350)
    const letterCenterX = 350 + pos.x;
    const letterCenterY = 350 + pos.y;
    
    // Inward padding to get to the actual letter ink
    // Increased by 20px to bring lines closer to letter center
    const inwardPaddingX = 35;
    const inwardPaddingY = 40;
    
    const letterLeft = letterCenterX - letterWidth / 2 + inwardPaddingX;
    const letterRight = letterCenterX + letterWidth / 2 - inwardPaddingX;
    const letterTop = letterCenterY - letterHeight / 2 + inwardPaddingY;
    const letterBottom = letterCenterY + letterHeight / 2 - inwardPaddingY;
    
    // Define fixed connection point for each letter based on its typical position
    // The line connects to the edge facing the center
    switch (index) {
        case 0: // M - at top, connect to bottom center (extra 8px inward)
            return { x: letterCenterX, y: letterBottom - 8 };
        case 1: // E - at right, connect to left edge center
            return { x: letterLeft, y: letterCenterY };
        case 2: // L - at bottom-right, connect to top-left corner area
            return { x: letterLeft, y: letterTop };
        case 3: // O - at bottom, connect to top center
            return { x: letterCenterX, y: letterTop };
        case 4: // D - at bottom-left, connect to top-right corner area (extra 8px inward)
            return { x: letterRight - 8, y: letterTop + 8 };
        case 5: // Y - at left, connect to right edge center (extra 13px inward)
            return { x: letterRight - 13, y: letterCenterY };
        default:
            return { x: letterCenterX, y: letterCenterY };
    }
}

// Update the SVG line connecting center to a specific letter
function updateMelodyLine(letterElement, index) {
    const line = document.getElementById(`melody-line-${index}`);
    if (!line) return;
    
    // Get the fixed connection point for this letter
    const connectionPoint = getLetterConnectionPoint(letterElement, index);
    if (!connectionPoint) return;
    
    // Center of container (350, 350)
    const centerX = 350;
    const centerY = 350;
    
    // Set line coordinates
    line.setAttribute('x1', centerX);
    line.setAttribute('y1', centerY);
    line.setAttribute('x2', connectionPoint.x);
    line.setAttribute('y2', connectionPoint.y);
}

// Update all melody lines (useful for initial setup and resize)
function updateAllMelodyLines() {
    const container = document.getElementById('melody-circle-container');
    if (!container) return;
    
    const letters = container.querySelectorAll('.melody-letter');
    letters.forEach((letter, index) => {
        updateMelodyLine(letter, index);
    });
}

// Initialize drag functionality for MELODY letters
function initializeMelodyDrag() {
    const container = document.getElementById('melody-circle-container');
    if (!container) return;
    
    const letters = container.querySelectorAll('.melody-letter');
    if (letters.length === 0) return;
    
    // Initialize positions if not already set
    if (!melodyLetterPositions) {
        melodyLetterPositions = getInitialMelodyPositions();
    }
    
    // Initialize constraints if not already set
    if (!melodyLetterConstraints) {
        melodyLetterConstraints = getLetterConstraints();
    }
    
    // Add variable-weight class to all letters for dynamic font weight
    letters.forEach((letter) => {
        letter.classList.add('variable-weight');
    });
    
    // Apply positions via JavaScript
    // This ensures letters and lines are synchronized
    letters.forEach((letter, index) => {
        updateMelodyLetterPosition(letter, index);
    });
    
    // Only add event listeners once
    if (melodyDragInitialized) return;
    
    // Get canvas container bounds for constraining drag
    const canvasContainer = document.getElementById('canvas-container');
    
    letters.forEach((letter, index) => {
        let isDragging = false;
        let startX, startY;
        let startPosX, startPosY;
        
        // Mouse down - start dragging
        letter.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            letter.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            startPosX = melodyLetterPositions[index].x;
            startPosY = melodyLetterPositions[index].y;
            
            // Start sound for this letter (get current font weight from element style)
            const currentFontWeight = parseInt(letter.style.fontWeight) || 500;
            startMelodySound(index, currentFontWeight);
            
            // Add global mouse move and up listeners
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Get the constraint for this letter (horizontal or vertical)
            const constraint = melodyLetterConstraints[index];
            
            // Apply movement only on the allowed axis
            let newX = startPosX;
            let newY = startPosY;
            
            if (constraint === 'horizontal') {
                newX = startPosX + dx;
            } else {
                // vertical
                newY = startPosY + dy;
            }
            
            // Constrain to canvas bounds (accounting for letter size and container position)
            const containerRect = container.getBoundingClientRect();
            const canvasRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
            
            if (canvasRect) {
                const containerCenterX = containerRect.left + containerRect.width / 2;
                const containerCenterY = containerRect.top + containerRect.height / 2;
                
                // Calculate max distances from center (with padding for letter size)
                const letterPadding = 80;
                const maxLeft = -(containerCenterX - canvasRect.left - letterPadding);
                const maxRight = canvasRect.right - containerCenterX - letterPadding;
                const maxTop = -(containerCenterY - canvasRect.top - letterPadding);
                const maxBottom = canvasRect.bottom - containerCenterY - letterPadding;
                
                // Clamp position
                newX = Math.max(maxLeft, Math.min(maxRight, newX));
                newY = Math.max(maxTop, Math.min(maxBottom, newY));
            }
            
            // Update position
            melodyLetterPositions[index].x = newX;
            melodyLetterPositions[index].y = newY;
            
            // Update visual position
            updateMelodyLetterPosition(letter, index);
        }
        
        function onMouseUp() {
            isDragging = false;
            letter.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Stop sound for this letter with fade-out
            stopMelodySound(index);
        }
        
        // Touch support for mobile
        letter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            letter.classList.add('dragging');
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startPosX = melodyLetterPositions[index].x;
            startPosY = melodyLetterPositions[index].y;
            
            // Start sound for this letter (get current font weight from element style)
            const currentFontWeight = parseInt(letter.style.fontWeight) || 500;
            startMelodySound(index, currentFontWeight);
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        });
        
        function onTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            // Get the constraint for this letter (horizontal or vertical)
            const constraint = melodyLetterConstraints[index];
            
            // Apply movement only on the allowed axis
            let newX = startPosX;
            let newY = startPosY;
            
            if (constraint === 'horizontal') {
                newX = startPosX + dx;
            } else {
                // vertical
                newY = startPosY + dy;
            }
            
            // Constrain to canvas bounds
            const containerRect = container.getBoundingClientRect();
            const canvasRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
            
            if (canvasRect) {
                const containerCenterX = containerRect.left + containerRect.width / 2;
                const containerCenterY = containerRect.top + containerRect.height / 2;
                
                const letterPadding = 80;
                const maxLeft = -(containerCenterX - canvasRect.left - letterPadding);
                const maxRight = canvasRect.right - containerCenterX - letterPadding;
                const maxTop = -(containerCenterY - canvasRect.top - letterPadding);
                const maxBottom = canvasRect.bottom - containerCenterY - letterPadding;
                
                newX = Math.max(maxLeft, Math.min(maxRight, newX));
                newY = Math.max(maxTop, Math.min(maxBottom, newY));
            }
            
            melodyLetterPositions[index].x = newX;
            melodyLetterPositions[index].y = newY;
            
            updateMelodyLetterPosition(letter, index);
        }
        
        function onTouchEnd() {
            isDragging = false;
            letter.classList.remove('dragging');
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            // Stop sound for this letter with fade-out
            stopMelodySound(index);
        }
    });
    
    melodyDragInitialized = true;
}

// Reset MELODY positions to edge layout
function resetMelodyPositions() {
    melodyLetterPositions = getInitialMelodyPositions();
    melodyLetterConstraints = getLetterConstraints();
    
    const container = document.getElementById('melody-circle-container');
    if (!container) return;
    
    const letters = container.querySelectorAll('.melody-letter');
    letters.forEach((letter, index) => {
        updateMelodyLetterPosition(letter, index);
    });
}

// Recalculate MELODY positions on window resize (to keep letters at canvas edges)
let melodyResizeTimeout = null;
window.addEventListener('resize', () => {
    if (melodyResizeTimeout) clearTimeout(melodyResizeTimeout);
    melodyResizeTimeout = setTimeout(() => {
        // Only recalculate if positions have been initialized
        if (melodyLetterPositions) {
            // Get new edge positions
            const newPositions = getInitialMelodyPositions();
            
            // Update positions to match new edges while preserving relative positions
            const container = document.getElementById('melody-circle-container');
            if (!container) return;
            
            const melodyContainer = document.getElementById('melody-circle-container');
            if (!melodyContainer || !melodyContainer.classList.contains('visible')) return;
            
            // Update each letter's position to stay at the edge
            const letters = container.querySelectorAll('.melody-letter');
            letters.forEach((letter, index) => {
                // Get the constraint for this letter
                const constraint = melodyLetterConstraints ? melodyLetterConstraints[index] : 'horizontal';
                
                // For edge-constrained letters, update their edge position while preserving the other axis
                if (constraint === 'horizontal') {
                    // Horizontal movement: update Y to match new edge, preserve X position
                    melodyLetterPositions[index].y = newPositions[index].y;
                } else {
                    // Vertical movement: update X to match new edge, preserve Y position
                    melodyLetterPositions[index].x = newPositions[index].x;
                }
                
                updateMelodyLetterPosition(letter, index);
            });
        }
    }, 150);
});

// State for Shape + Color page click interaction
let shapeColorClickHandler = null;
let previousCirclePosition = null; // Store position of previous circle for line drawing
let shapeColorSequence = []; // Array לשמירת סדר הצורות שנוצרו
let shapeColorAnimationInterval = null; // Reference לאנימציית הלופ
let currentAnimationIndex = 0; // Index של הצורה הנוכחית באנימציה
let lastShapeType = null; // Track the last shape type to prevent duplicates
let shapeDistribution = { // Track distribution of each shape type for uniform selection
    'circle': 0,
    'square': 0,
    'ellipse': 0,
    'triangle': 0,
    'pentagon': 0,
    'star': 0
};

// Function to get or create SVG element for drawing lines
function getShapeColorLinesSVG(container) {
    let svg = container.querySelector('.shape-color-lines-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.className = 'shape-color-lines-svg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1'; // Below circles (which are at z-index: 2)
        container.insertBefore(svg, container.firstChild); // Insert before circles
    }
    return svg;
}

// Function to get original color for a shape type
function getShapeOriginalColor(shapeType) {
    switch(shapeType) {
        case 'circle':
            return 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)'; // Deep blue to cyan gradient
        case 'square':
            return '#EF4538'; // Orange color
        case 'ellipse':
            return 'linear-gradient(135deg, #891951 0%, #EB4781 100%)'; // Purple to pink gradient
        case 'triangle':
            return '#FAB01B'; // Yellow color
        case 'pentagon':
            // Return gradient ID pattern - will be replaced with actual gradient ID
            return 'pentagon-gradient';
        case 'star':
            // Return gradient ID pattern - will be replaced with actual gradient ID
            return 'star-gradient';
        default:
            return '#ffffff'; // White as fallback
    }
}

// Function to apply color to a shape element (ensuring no transparency)
function applyShapeColor(shapeEntry, color) {
    const { element, type } = shapeEntry;
    
    if (type === 'circle' || type === 'square' || type === 'ellipse') {
        // CSS shapes - change background (ensure no transparency, instant change)
        // No transition needed - instant color change
        if (color.startsWith('linear-gradient')) {
            element.style.background = color;
            element.style.backgroundColor = 'transparent'; // Allow gradient to show
        } else {
            element.style.backgroundColor = color;
            element.style.background = color; // Also set background for consistency
            element.style.backgroundImage = 'none'; // Remove any gradient
        }
    } else if (type === 'triangle' || type === 'pentagon' || type === 'star') {
        // SVG shapes - change fill attribute (ensure no transparency, instant change)
        const path = element.querySelector('svg path');
        if (path) {
            // No transition needed - instant color change
            path.setAttribute('fill', color);
            path.style.fill = color; // Also set via style for consistency
        }
    }
}

// Function to reset all shapes to white (ensuring no transparency, instant reset)
function resetAllShapesToWhite() {
    shapeColorSequence.forEach(shapeEntry => {
        const { element, type } = shapeEntry;
        
        if (type === 'circle' || type === 'square' || type === 'ellipse') {
            // Disable transition temporarily for instant reset
            element.style.transition = 'none'; // No transition for reset
            
            // Ensure both background and backgroundColor are set to white (no transparency)
            element.style.background = '#ffffff';
            element.style.backgroundColor = '#ffffff';
            element.style.backgroundImage = 'none'; // Remove any gradient
            
            // Restore transition after a brief moment (for next color application)
            setTimeout(() => {
                element.style.transition = '';
            }, 10);
        } else if (type === 'triangle' || type === 'pentagon' || type === 'star') {
            const path = element.querySelector('svg path');
            if (path) {
                // Disable transition temporarily for instant reset
                path.style.transition = 'none'; // No transition for reset
                
                // Set fill to white, ensuring it's not transparent
                path.setAttribute('fill', '#ffffff');
                path.style.fill = '#ffffff'; // Also set via style for consistency
                
                // Restore transition after a brief moment (for next color application)
                setTimeout(() => {
                    path.style.transition = '';
                }, 10);
            }
        }
    });
}

// Function to start shape color animation loop
function startShapeColorAnimation() {
    // Stop existing animation if running
    if (shapeColorAnimationInterval) {
        clearInterval(shapeColorAnimationInterval);
        shapeColorAnimationInterval = null;
    }
    
    // Don't start if no shapes
    if (shapeColorSequence.length === 0) {
        return;
    }
    
    // Reset all shapes to white first (ensure all are white before starting)
    resetAllShapesToWhite();
    currentAnimationIndex = 0;
    
    // Start animation loop - show shapes one by one in sequence, very fast
    // Each shape appears colored for 0.2 seconds, then returns to white
    shapeColorAnimationInterval = setInterval(() => {
        // Ensure we have shapes to animate
        if (shapeColorSequence.length === 0) {
            return;
        }
        
        // Ensure currentAnimationIndex is within bounds (in case sequence changed)
        if (currentAnimationIndex >= shapeColorSequence.length) {
            currentAnimationIndex = 0;
            resetAllShapesToWhite();
        }
        
        // First, reset the previous shape to white (if we're not at the first shape or after reset)
        if (currentAnimationIndex > 0) {
            const previousShape = shapeColorSequence[currentAnimationIndex - 1];
            if (previousShape) {
                resetShapeToWhite(previousShape);
            }
        } else if (currentAnimationIndex === 0 && shapeColorSequence.length > 1) {
            // If we're back at the start, reset the last shape from previous cycle
            const lastShape = shapeColorSequence[shapeColorSequence.length - 1];
            if (lastShape) {
                resetShapeToWhite(lastShape);
            }
        }
        
        // Apply color to current shape (only one shape colored at a time)
        const currentShape = shapeColorSequence[currentAnimationIndex];
        if (currentShape) {
            applyShapeColor(currentShape, currentShape.originalColor);
        }
        
        // Move to next shape
        currentAnimationIndex++;
        
        // If we've shown all shapes, reset all and start over
        // This uses shapeColorSequence.length dynamically, so new shapes are automatically included
        if (currentAnimationIndex >= shapeColorSequence.length) {
            // Reset all shapes to white before starting new cycle
            resetAllShapesToWhite();
            // Start from beginning
            currentAnimationIndex = 0;
        }
    }, 200); // 0.2 seconds = 200ms - very fast, no delay between shapes
}

// Helper function to reset a single shape to white (instant, no transition)
function resetShapeToWhite(shapeEntry) {
    const { element, type } = shapeEntry;
    
    if (type === 'circle' || type === 'square' || type === 'ellipse') {
        // Disable transition temporarily for instant reset
        const originalTransition = element.style.transition;
        element.style.transition = 'none'; // No transition for reset
        
        // Ensure both background and backgroundColor are set to white (no transparency)
        element.style.background = '#ffffff';
        element.style.backgroundColor = '#ffffff';
        element.style.backgroundImage = 'none'; // Remove any gradient
        
        // Restore transition after a brief moment (for next color application)
        setTimeout(() => {
            element.style.transition = originalTransition || '';
        }, 10);
    } else if (type === 'triangle' || type === 'pentagon' || type === 'star') {
        const path = element.querySelector('svg path');
        if (path) {
            // Disable transition temporarily for instant reset
            const originalTransition = path.style.transition;
            path.style.transition = 'none'; // No transition for reset
            
            // Set fill to white, ensuring it's not transparent
            path.setAttribute('fill', '#ffffff');
            path.style.fill = '#ffffff'; // Also set via style for consistency
            
            // Restore transition after a brief moment (for next color application)
            setTimeout(() => {
                path.style.transition = originalTransition || '';
            }, 10);
        }
    }
}

// Function to handle clicks on Shape + Color page and add circles or squares
function handleShapeColorClick(event) {
    const circleContainer = document.getElementById('shape-color-circle-container');
    if (!circleContainer) return;
    
    // Check if click is on an element that should block interaction (UI, columns, text boxes)
    // Use elementFromPoint to check what's actually at the click position
    const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
    if (elementAtPoint && (
        elementAtPoint.closest('.ui-layer') || 
        elementAtPoint.closest('.column-container') || 
        elementAtPoint.closest('.canvas-text-box') ||
        elementAtPoint.closest('.black-corner-rectangle') ||
        elementAtPoint.closest('.black-bottom-rectangle') ||
        elementAtPoint.closest('.black-middle-rectangle') ||
        elementAtPoint.closest('.black-rectangle') ||
        elementAtPoint.closest('.color-item'))) {
        return; // Let the click pass through to those elements
    }
    
    // Hide instruction text after first click on Shape + Color page
    const instructionText = document.getElementById('canvas-instruction-text');
    if (instructionText && instructionText.classList.contains('visible')) {
        // Check if this is the Shape + Color instruction text
        if (instructionText.textContent === '[click to create shapes]') {
            instructionText.classList.remove('visible');
        }
    }
    
    // Get click coordinates relative to the circle container
    const rect = circleContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Draw line from previous shape to new shape (if previous shape exists)
    if (previousCirclePosition) {
        const svg = getShapeColorLinesSVG(circleContainer);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', previousCirclePosition.x);
        line.setAttribute('y1', previousCirclePosition.y);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#2C2C2C'); // Black color matching UI
        line.setAttribute('stroke-width', '3'); // 3 pixels thick
        svg.appendChild(line);
    }
    
    // Update previous shape position for next line
    previousCirclePosition = { x: x, y: y };
    
    // Array of all available shape types
    const shapeTypes = ['circle', 'square', 'ellipse', 'triangle', 'pentagon', 'star'];
    
    // Filter out the last shape type to prevent consecutive duplicates
    const availableShapes = lastShapeType 
        ? shapeTypes.filter(shape => shape !== lastShapeType)
        : shapeTypes;
    
    // Find the minimum count in distribution to maintain uniform distribution
    const minCount = Math.min(...availableShapes.map(shape => shapeDistribution[shape]));
    
    // Filter to only shapes with the minimum count (to maintain uniform distribution)
    const leastUsedShapes = availableShapes.filter(shape => shapeDistribution[shape] === minCount);
    
    // Randomly choose from the least used shapes
    const randomShapeType = leastUsedShapes[Math.floor(Math.random() * leastUsedShapes.length)];
    
    // Update distribution counter and last shape type
    shapeDistribution[randomShapeType]++;
    lastShapeType = randomShapeType;
    
    // Create a new shape element
    const shape = document.createElement('div');
    shape.className = 'shape-color-' + randomShapeType;
    shape.style.left = x + 'px';
    shape.style.top = y + 'px';
    shape.style.transform = 'translate(-50%, -50%)'; // Center the shape on the click point
    
    // Ensure CSS shapes start with white fill (not transparent)
    if (randomShapeType === 'circle' || randomShapeType === 'square' || randomShapeType === 'ellipse') {
        shape.style.background = '#ffffff';
        shape.style.backgroundColor = '#ffffff';
        shape.style.backgroundImage = 'none';
    }
    
    // For complex shapes (triangle, pentagon, star), use SVG instead of clip-path for better border support
    if (randomShapeType === 'triangle' || randomShapeType === 'pentagon' || randomShapeType === 'star') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // Stars are 30% smaller (70% of 135 = 94.5), triangles are 50% smaller (50% of 135 = 67.5), other shapes remain 135
        const svgSize = randomShapeType === 'star' ? '94.5' : (randomShapeType === 'triangle' ? '67.5' : '135');
        svg.setAttribute('width', svgSize);
        svg.setAttribute('height', svgSize);
        svg.setAttribute('viewBox', '-10 -10 155 155');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathData = '';
        let gradientId = null;
        
        // Create gradients for star and pentagon
        if (randomShapeType === 'star' || randomShapeType === 'pentagon') {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            
            if (randomShapeType === 'star') {
                gradientId = 'star-gradient-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                gradient.setAttribute('id', gradientId);
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '100%');
                gradient.setAttribute('y2', '100%');
                
                // Pink at edges
                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%');
                stop1.setAttribute('stop-color', '#EB4781'); // Pink color matching scrollbar rectangles
                gradient.appendChild(stop1);
                
                // Silver in the middle
                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '50%');
                stop2.setAttribute('stop-color', '#C0C0C0'); // Silver
                gradient.appendChild(stop2);
                
                // Pink at edges
                const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop3.setAttribute('offset', '100%');
                stop3.setAttribute('stop-color', '#EB4781'); // Pink color matching scrollbar rectangles
                gradient.appendChild(stop3);
            } else if (randomShapeType === 'pentagon') {
                gradientId = 'pentagon-gradient-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                gradient.setAttribute('id', gradientId);
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '100%');
                gradient.setAttribute('y2', '100%');
                
                // Dark green (from scrollbar)
                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%');
                stop1.setAttribute('stop-color', '#007A6F'); // Green color matching scrollbar rectangles
                gradient.appendChild(stop1);
                
                // Bright green
                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '100%');
                stop2.setAttribute('stop-color', '#00B894'); // Brighter green
                gradient.appendChild(stop2);
            }
            
            defs.appendChild(gradient);
            svg.appendChild(defs);
        }
        
        if (randomShapeType === 'triangle') {
            pathData = 'M 77.5 10 L 10 145 L 145 145 Z';
        } else if (randomShapeType === 'pentagon') {
            pathData = 'M 77.5 10 L 145 61.3 L 120.7 145 L 34.3 145 L 10 61.3 Z';
        } else if (randomShapeType === 'star') {
            pathData = 'M 77.5 10 L 92.35 57.25 L 145 57.25 L 101.8 86.5 L 116.65 133.75 L 77.5 104.5 L 38.35 133.75 L 53.2 86.5 L 10 57.25 L 62.65 57.25 Z';
        }
        
        path.setAttribute('d', pathData);
        // Set fill color to white by default (will change to original color on hover)
        path.setAttribute('fill', '#ffffff'); // White fill by default
        // Store original fill color/gradient as data attribute for hover restoration
        if (randomShapeType === 'triangle') {
            path.setAttribute('data-original-fill', '#FAB01B'); // Yellow color matching scrollbar rectangles
        } else if (randomShapeType === 'star' || randomShapeType === 'pentagon') {
            // Store gradient reference for hover
            path.setAttribute('data-original-fill', 'url(#' + gradientId + ')');
            path.setAttribute('data-gradient-id', gradientId); // Store gradient ID for reference
        }
        path.setAttribute('stroke', '#2C2C2C');
        // Calculate stroke-width in viewBox space to ensure 3px on screen
        // For stars: scale = 94.5/135 = 0.7, so stroke-width = 3/0.7 = 4.286
        // For triangles: scale = 67.5/135 = 0.5, so stroke-width = 3/0.5 = 6
        // For pentagon: scale = 135/135 = 1, so stroke-width = 3
        let strokeWidthInViewBox = '3';
        if (randomShapeType === 'star') {
            strokeWidthInViewBox = '4.286'; // Exact value: 3 / (94.5 / 135) = 4.286
        } else if (randomShapeType === 'triangle') {
            strokeWidthInViewBox = '6'; // Exact value: 3 / (67.5 / 135) = 6
        } else if (randomShapeType === 'pentagon') {
            strokeWidthInViewBox = '3'; // Exact value: 3 / (135 / 135) = 3
        }
        path.setAttribute('stroke-width', strokeWidthInViewBox); // Ensures 3px on screen regardless of shape size
        // Add smooth line joins and caps for consistent outline at corners
        path.setAttribute('stroke-linejoin', 'round'); // Round joins for smooth corners
        path.setAttribute('stroke-linecap', 'round'); // Round caps for smooth line ends
        path.setAttribute('stroke-miterlimit', '10'); // High miter limit for round joins
        // Ensure path is closed properly
        if (!pathData.endsWith('Z') && !pathData.endsWith('z')) {
            pathData += ' Z';
            path.setAttribute('d', pathData);
        }
        path.style.transition = 'fill 0.3s ease'; // Smooth color transition for animation
        // Ensure fill is explicitly set to white (not transparent)
        path.style.fill = '#ffffff';
        svg.appendChild(path);
        
        shape.appendChild(svg);
    }
    
    // Add the shape to the container
    circleContainer.appendChild(shape);
    
    // Determine original color for this shape
    let originalColor;
    if (randomShapeType === 'star' || randomShapeType === 'pentagon') {
        // For gradient shapes, get the gradient URL from the path's data attribute
        const pathElement = shape.querySelector('svg path');
        if (pathElement) {
            originalColor = pathElement.getAttribute('data-original-fill') || getShapeOriginalColor(randomShapeType);
        } else {
            originalColor = getShapeOriginalColor(randomShapeType);
        }
    } else {
        originalColor = getShapeOriginalColor(randomShapeType);
    }
    
    // Add shape to sequence
    const newShapeEntry = {
        element: shape,
        type: randomShapeType,
        originalColor: originalColor
    };
    shapeColorSequence.push(newShapeEntry);
    
    // Ensure the new shape starts white (not colored)
    resetShapeToWhite(newShapeEntry);
    
    // Start animation if this is the first shape
    if (shapeColorSequence.length === 1) {
        currentAnimationIndex = 0;
        startShapeColorAnimation();
    } else if (!shapeColorAnimationInterval) {
        // If animation stopped for some reason, restart it
        currentAnimationIndex = 0;
        startShapeColorAnimation();
    } else {
        // Animation is already running - ensure the new shape will be included
        // The interval callback checks shapeColorSequence.length on each iteration,
        // so the new shape will be included in the next cycle automatically
        // No need to restart - just ensure currentAnimationIndex is valid
        if (currentAnimationIndex >= shapeColorSequence.length) {
            // If we're past the end, reset to start (this includes the new shape)
            currentAnimationIndex = 0;
            resetAllShapesToWhite();
        }
    }
}

// Function to clear all shapes from Shape + Color page
function clearShapeColorCircles() {
    // Stop animation if running
    if (shapeColorAnimationInterval) {
        clearInterval(shapeColorAnimationInterval);
        shapeColorAnimationInterval = null;
    }
    
    // Reset animation state
    currentAnimationIndex = 0;
    shapeColorSequence = [];
    
    // Reset shape selection state
    lastShapeType = null;
    shapeDistribution = {
        'circle': 0,
        'square': 0,
        'ellipse': 0,
        'triangle': 0,
        'pentagon': 0,
        'star': 0
    };
    
    const circleContainer = document.getElementById('shape-color-circle-container');
    if (!circleContainer) return;
    
    // Remove all child elements from the container (this includes all shapes and SVG)
    // This is the most reliable way to clear everything
    while (circleContainer.firstChild) {
        circleContainer.removeChild(circleContainer.firstChild);
    }
    
    // Also explicitly remove SVG elements using querySelector (in case they're not direct children)
    const svgElements = circleContainer.querySelectorAll('.shape-color-lines-svg');
    svgElements.forEach((svg) => {
        svg.remove();
    });
    
    // Remove all shapes explicitly as well (double-check)
    const shapeTypes = ['circle', 'square', 'ellipse', 'triangle', 'pentagon', 'star'];
    shapeTypes.forEach((shapeType) => {
        const shapes = circleContainer.querySelectorAll('.shape-color-' + shapeType);
        shapes.forEach((shape) => {
            shape.remove();
        });
    });
    
    // Reset previous shape position
    previousCirclePosition = null;
}

// Function to update existing shapes' stroke properties and viewBox
function updateExistingShapesStroke() {
    const circleContainer = document.getElementById('shape-color-circle-container');
    if (!circleContainer) return;
    
    // Update all SVG elements in existing shapes
    const svgElements = circleContainer.querySelectorAll('svg');
    svgElements.forEach(svg => {
        // Update viewBox to include stroke area
        svg.setAttribute('viewBox', '-10 -10 155 155');
        
        // Update path coordinates to match new viewBox (shift by 10,10)
        const path = svg.querySelector('path');
        if (path) {
            const pathData = path.getAttribute('d');
            if (pathData) {
                // Identify shape type by checking parent container class
                const container = svg.closest('.shape-color-triangle, .shape-color-pentagon, .shape-color-star');
                let updatedPathData = '';
                
                if (container && container.classList.contains('shape-color-triangle')) {
                    updatedPathData = 'M 77.5 10 L 10 145 L 145 145 Z';
                } else if (container && container.classList.contains('shape-color-pentagon')) {
                    updatedPathData = 'M 77.5 10 L 145 61.3 L 120.7 145 L 34.3 145 L 10 61.3 Z';
                } else if (container && container.classList.contains('shape-color-star')) {
                    updatedPathData = 'M 77.5 10 L 92.35 57.25 L 145 57.25 L 101.8 86.5 L 116.65 133.75 L 77.5 104.5 L 38.35 133.75 L 53.2 86.5 L 10 57.25 L 62.65 57.25 Z';
                } else {
                    // Fallback: try to shift coordinates by 10
                    updatedPathData = pathData.replace(/\b(\d+\.?\d*)\s+(\d+\.?\d*)\b/g, (match, x, y) => {
                        return (parseFloat(x) + 10) + ' ' + (parseFloat(y) + 10);
                    });
                }
                
                if (updatedPathData) {
                    path.setAttribute('d', updatedPathData);
                }
            }
            
            // Update stroke properties for consistent rendering
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-miterlimit', '10');
            // Ensure stroke color is correct
            path.setAttribute('stroke', '#2C2C2C');
        }
    });
}

// Function to update Shape + Color circle visibility
function updateShapeColorCircle(pageId) {
    const circleContainer = document.getElementById('shape-color-circle-container');
    if (!circleContainer) return;
    
    // Show circle only for Shape + Color page (pageId "0-5" or "5-0")
    // Parameter indices: 0=shape, 5=color
    const isShapeColorPage = pageId === '0-5' || pageId === '5-0';
    
    if (isShapeColorPage) {
        circleContainer.classList.add('visible');
        // Update existing shapes when page becomes visible
        updateExistingShapesStroke();
        // Keep pointer-events: none on container, but add click handler to canvas-container
        // This allows clicks to pass through to elements above (UI, columns, text boxes)
        // but still capture clicks in empty areas to create shapes
        circleContainer.style.pointerEvents = 'none';
        
        // Get canvas container to attach click handler
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            // Remove existing click handler if any
            if (shapeColorClickHandler) {
                canvasContainer.removeEventListener('click', shapeColorClickHandler);
            }
            
            // Add click handler to canvas container instead
            shapeColorClickHandler = handleShapeColorClick;
            canvasContainer.addEventListener('click', shapeColorClickHandler);
        }
        
        // Clear any existing circles when entering the page (reset state)
        clearShapeColorCircles();
    } else {
        // When leaving the page, clear everything immediately
        clearShapeColorCircles();
        
        circleContainer.classList.remove('visible');
        // Disable pointer events when not on this page
        circleContainer.style.pointerEvents = 'none';
        
        // Remove click handler from canvas container
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer && shapeColorClickHandler) {
            canvasContainer.removeEventListener('click', shapeColorClickHandler);
            shapeColorClickHandler = null;
        }
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

// Function to update Shape & Number canvas visibility
function updateShapeNumberCanvasVisibility(pageId) {
    const shapeNumberContainer = document.getElementById('shape-number-container');
    const shapeNumberPanel = document.getElementById('shape-number-panel');
    const p5Container = document.getElementById('p5-container');
    
    if (!shapeNumberContainer) return;
    
    // Show Shape & Number canvas only for pageIds "0-3" or "3-0"
    const isShapeNumberPage = pageId === '0-3' || pageId === '3-0';
    
    if (isShapeNumberPage) {
        // Show Shape & Number container, hide p5 container
        shapeNumberContainer.classList.remove('hidden');
        if (p5Container) {
            p5Container.style.opacity = '0';
            p5Container.style.visibility = 'hidden';
            p5Container.style.pointerEvents = 'none';
        }
        // Trigger render and slide in panel after a brief delay to ensure container is visible
        setTimeout(() => {
            if (shapeNumberContainer && !shapeNumberContainer.classList.contains('hidden')) {
                renderShapeNumber();
                // Slide in the panel
                if (shapeNumberPanel) {
                    shapeNumberPanel.classList.add('visible');
                }
            }
        }, 50);
    } else {
        // Slide out the panel first
        if (shapeNumberPanel) {
            shapeNumberPanel.classList.remove('visible');
        }
        // Hide Shape & Number container, show p5 container
        shapeNumberContainer.classList.add('hidden');
        if (p5Container) {
            p5Container.style.opacity = '';
            p5Container.style.visibility = '';
            p5Container.style.pointerEvents = '';
        }
    }
}

// Function to update the active page/canvas based on color selection
function updateActivePage(pageId, reason) {
    
    // CRITICAL: Page switching should work after intro is completed
    // But we should still track the page state even during intro
    const previousPageId = activePageId;
    activePageId = pageId;
    
    // Update canvas text box content for the new page
    updateCanvasTextBox(pageId);
    
    // Update LETTER & SOUND text box visibility
    updateLetterSoundTextBox(pageId);
    
    // Update LETTER & COLOR text box visibility
    updateLetterColorTextBox(pageId);
    
    // Update SOUND & SHAPE instruction text visibility
    updateSoundShapeInstructionText(pageId);
    
    // Update Letter + Letter circle visibility
    updateLetterLetterCircle(pageId);
    
    // Update Number + Number circle visibility
    updateNumberNumberCircle(pageId);
    
    // Update Shape + Color circle visibility
    updateShapeColorCircle(pageId);
    
    // Update MELODY circle visibility (Sound + Letter page)
    updateMelodyCircle(pageId);
    
    // Update Sound + Color squares visibility
    updateSoundColorSquares(pageId);
    
    // Update Sound + Sound wave visualization visibility
    updateSoundSoundWave(pageId);
    
    // Update Letter + Number circle visibility
    updateLetterNumberCircle(pageId);
    
    // Update Color + Color circle visibility
    updateColorColorCircle(pageId);
    
    // Update Shape & Number canvas visibility
    updateShapeNumberCanvasVisibility(pageId);
    
    // Update Shape & Emotion canvas visibility
    updateShapeEmotionCanvasVisibility(pageId);
    
    // Check if we need to switch to a different canvas sketch
    // Skip p5.js canvas creation for Shape & Number pages (0-3, 3-0) - they use native Canvas API
    // Skip p5.js canvas creation for Shape & Emotion pages (0-4, 4-0) - they use native Canvas API
    const isShapeNumberPage = pageId === '0-3' || pageId === '3-0';
    const wasShapeNumberPage = previousPageId === '0-3' || previousPageId === '3-0';
    const isShapeEmotionPage = pageId === '0-4' || pageId === '4-0';
    const wasShapeEmotionPage = previousPageId === '0-4' || previousPageId === '4-0';
    
    let needsNewCanvas = false;
    let newSketchFactory = null;
    
    // If switching to or from Shape & Number page, handle p5.js canvas accordingly
    if (isShapeNumberPage) {
        // Switching to Shape & Number page - unmount p5.js if it exists
        if (p5Instance && !wasShapeNumberPage) {
            unmountP5();
        }
        // Don't create p5.js canvas for Shape & Number pages
    } else if (isShapeEmotionPage) {
        // Switching to Shape & Emotion page - unmount p5.js if it exists
        if (p5Instance && !wasShapeEmotionPage) {
            unmountP5();
        }
        // Don't create p5.js canvas for Shape & Emotion pages
    } else if ((wasShapeNumberPage || wasShapeEmotionPage) && !isShapeNumberPage && !isShapeEmotionPage) {
        // Switching from Shape & Number page to a different page - need to create p5.js canvas
        needsNewCanvas = true;
        // Check if new page has a registered canvas
        if (window.CanvasRegistry && window.CanvasRegistry.has(pageId)) {
            newSketchFactory = window.CanvasRegistry.get(pageId);
        } else {
            newSketchFactory = createP5Cell01Sketch; // Use default sketch factory
        }
    } else if (window.CanvasRegistry && window.CanvasRegistry.has(pageId)) {
        // Regular page with registered canvas
        newSketchFactory = window.CanvasRegistry.get(pageId);
        // Check if we need a new canvas (if the current canvas is not the one for this pageId)
        if (p5Instance) {
            // Determine if current canvas is the default or a registered one
            const currentPageIdForCanvas = p5Instance._currentPageId || previousPageId;
            const currentHasRegisteredCanvas = window.CanvasRegistry.has(currentPageIdForCanvas);
            const newHasRegisteredCanvas = window.CanvasRegistry.has(pageId);
            
            // Need new canvas if:
            // 1. New page has a registered canvas and current doesn't, OR
            // 2. Both have registered canvases but they're different (different factory functions)
            if (newHasRegisteredCanvas && (!currentHasRegisteredCanvas || currentPageIdForCanvas !== pageId)) {
                needsNewCanvas = true;
            }
        } else {
            // No current instance, but we have a registered canvas - create it
            needsNewCanvas = true;
        }
    } else {
        // New page doesn't have a registered canvas
        // But if current page has a registered canvas, we need to switch to default
        if (p5Instance && previousPageId) {
            const currentPageIdForCanvas = p5Instance._currentPageId || previousPageId;
            const currentHasRegisteredCanvas = window.CanvasRegistry && window.CanvasRegistry.has(currentPageIdForCanvas);
            
            // If current page has a registered canvas but new page doesn't, we need to switch to default
            if (currentHasRegisteredCanvas) {
                needsNewCanvas = true;
                newSketchFactory = createP5Cell01Sketch; // Use default sketch factory
            }
        }
    }
    
    // If we need a new canvas, create it
    if (needsNewCanvas && newSketchFactory) {
        // Save current state before switching
        if (p5Instance && previousPageId !== null && previousPageId !== pageId && typeof p5Instance.saveState === 'function') {
            p5Instance._currentPageId = previousPageId;
            p5Instance.saveState();
        }
        
        // Remove old canvas instance using helper
        unmountP5();
        
        // Create new canvas with the registered sketch
        const container = document.getElementById('p5-container');
        const whiteRegion = document.getElementById('white-region');
        
        if (container && whiteRegion) {
            requestAnimationFrame(() => {
                let width = container.offsetWidth || container.clientWidth || 0;
                let height = container.offsetHeight || container.clientHeight || 0;
                
                if (width <= 0 || height <= 0) {
                    width = whiteRegion.offsetWidth || whiteRegion.clientWidth || 0;
                    height = whiteRegion.offsetHeight || whiteRegion.clientHeight || 0;
                }
                
                if (width <= 0) {
                    const viewportWidth = window.innerWidth;
                    const leftBoundary = 50;
                    const rightBoundary = viewportWidth - 50;
                    width = Math.max(400, rightBoundary - leftBoundary);
                }
                if (height <= 0) {
                    height = Math.max(300, (window.innerHeight - 50));
                }
                
                const sketch = newSketchFactory(
                    container,
                    width,
                    height,
                    p5SketchActive,
                    pageId,
                    p5StateStorage
                );
                
                // Create p5 instance (Shape & Number pages don't reach here)
                p5Instance = new p5(sketch, container);
                
                if (p5Instance) {
                    p5Instance._currentPageId = pageId;
                    
                    // Restore state for the new page
                    if (typeof p5Instance.restoreState === 'function') {
                        p5Instance.restoreState();
                    }
                }
                
            });
        }
    } else {
        // Update p5 sketch to use the new pageId for state storage (existing canvas)
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
        
        if (newLeftIndex !== oldLeftIndex) {
        }
        
        if (newRightIndex !== oldRightIndex) {
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
    
    const leftIndex = colors.indexOf(leftColor);
    const rightIndex = colors.indexOf(rightColor);
    const pageKey = getPageIdFromColors(leftIndex, rightIndex);
    
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
// P5 HELPER FUNCTIONS
// ==================
/**
 * Mount a p5.js sketch in a container element
 * @param {Function} sketchFn - The p5 sketch function
 * @param {HTMLElement} containerEl - The container element to mount the sketch in
 * @returns {p5} The p5 instance, or null if p5 is not available
 */
function mountP5(sketchFn, containerEl) {
    // Verify p5 is available globally
    if (typeof window.p5 === 'undefined') {
        console.error('p5.js is not loaded. Make sure p5.js is included before script.js');
        return null;
    }
    
    if (!containerEl) {
        console.error('mountP5: container element is required');
        return null;
    }
    
    // Create new p5 instance in instance mode
    const instance = new p5(sketchFn, containerEl);
    return instance;
}

/**
 * Unmount a p5.js sketch instance
 * @param {p5} instance - The p5 instance to unmount (optional, uses global p5Instance if not provided)
 */
function unmountP5(instance) {
    const targetInstance = instance || p5Instance;
    
    if (targetInstance && typeof targetInstance.remove === 'function') {
        targetInstance.remove();
    }
    
    // Clear global reference if it was the global instance
    if (!instance && p5Instance === targetInstance) {
        p5Instance = null;
    }
}

// ==================
// SHAPE & NUMBER CANVAS
// ==================
// Shape & Number canvas implementation using native Canvas API (not p5.js)

// State variables for Shape & Number canvas
let shapeNumberCanvas = null;
let shapeNumberCtx = null;
let shapeNumberContainer = null;
let shapeNumberResizeObserver = null;

// Config / State
const SHAPE_NUMBER_PANEL_W = 180;
const SHAPE_NUMBER_STROKE_W = 3;

const TOP_ROW = ["1","2","3","4","5"];
const BOTTOM_ROW = ["6","7","8","9","0"];

let numShapes = 2;
let shapeType = "circle";
let shapeSizeFactor = 2.50;

// Initialize Shape & Number canvas
function initializeShapeNumberCanvas() {
    shapeNumberContainer = document.getElementById('shape-number-container');
    if (!shapeNumberContainer) {
        console.error('Shape & Number container not found');
        return;
    }
    
    const canvas = document.getElementById('shape-number-draw-surface');
    if (!canvas) {
        console.error('Shape & Number canvas not found');
        return;
    }
    
    shapeNumberCanvas = canvas;
    shapeNumberCtx = canvas.getContext('2d');
    
    // Get UI elements
    const countSlider = document.getElementById('shape-number-countSlider');
    const sizeSlider = document.getElementById('shape-number-sizeSlider');
    const countLabel = document.getElementById('shape-number-countLabel');
    const sizeLabel = document.getElementById('shape-number-sizeLabel');
    
    // Get shape buttons
    const circleBtn = document.getElementById('shape-number-circle-btn');
    const squareBtn = document.getElementById('shape-number-square-btn');
    const triangleBtn = document.getElementById('shape-number-triangle-btn');
    const ellipseBtn = document.getElementById('shape-number-ellipse-btn');
    const starBtn = document.getElementById('shape-number-star-btn');
    const pentagonBtn = document.getElementById('shape-number-pentagon-btn');
    
    if (!countSlider || !sizeSlider || !countLabel || !sizeLabel) {
        console.error('Shape & Number UI elements not found');
        return;
    }
    
    if (!circleBtn || !squareBtn || !triangleBtn || !ellipseBtn || !starBtn || !pentagonBtn) {
        console.error('Shape & Number shape buttons not found');
        return;
    }
    
    // Helper function to create SVG shape
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
    
    // Initialize shape buttons with SVG
    function initializeShapeButtons() {
        const shapeButtons = [
            { btn: circleBtn, type: "circle" },
            { btn: squareBtn, type: "square" },
            { btn: triangleBtn, type: "triangle" },
            { btn: ellipseBtn, type: "ellipse" },
            { btn: starBtn, type: "star" },
            { btn: pentagonBtn, type: "pentagon" }
        ];
        
        shapeButtons.forEach(({ btn, type }) => {
            const isSelected = shapeType === type;
            btn.appendChild(createShapeSVG(type, isSelected));
        });
    }
    
    // Highlight selected shape
    function highlightShape(selectedType) {
        const shapeButtons = [
            { btn: circleBtn, type: "circle" },
            { btn: squareBtn, type: "square" },
            { btn: triangleBtn, type: "triangle" },
            { btn: ellipseBtn, type: "ellipse" },
            { btn: starBtn, type: "star" },
            { btn: pentagonBtn, type: "pentagon" }
        ];
        
        shapeButtons.forEach(({ btn, type }) => {
            const existingSVG = btn.querySelector("svg");
            if (existingSVG) {
                btn.removeChild(existingSVG);
            }
            const isSelected = selectedType === type;
            btn.appendChild(createShapeSVG(type, isSelected));
        });
    }
    
    // Helper function
    function prettyShapeName(t) {
        return ({
            circle: "Circles",
            ellipse: "Ellipses",
            square: "Squares",
            triangle: "Triangles",
            pentagon: "Pentagons",
            star: "Stars",
        })[t] || t;
    }
    
    // Sync UI state
    function syncFromUI() {
        numShapes = parseInt(countSlider.value, 10);
        shapeSizeFactor = parseFloat(sizeSlider.value);
        
        countLabel.textContent = `Count: ${numShapes}`;
        sizeLabel.textContent = `Size: ${shapeSizeFactor.toFixed(2)}`;
    }
    
    // Update state on input + redraw
    [countSlider, sizeSlider].forEach(el => {
        el.addEventListener('input', () => {
            syncFromUI();
            renderShapeNumber();
        });
    });
    
    // Add click handlers for shape buttons
    circleBtn.addEventListener('click', () => {
        shapeType = 'circle';
        highlightShape('circle');
        syncFromUI();
        renderShapeNumber();
    });
    
    squareBtn.addEventListener('click', () => {
        shapeType = 'square';
        highlightShape('square');
        syncFromUI();
        renderShapeNumber();
    });
    
    triangleBtn.addEventListener('click', () => {
        shapeType = 'triangle';
        highlightShape('triangle');
        syncFromUI();
        renderShapeNumber();
    });
    
    ellipseBtn.addEventListener('click', () => {
        shapeType = 'ellipse';
        highlightShape('ellipse');
        syncFromUI();
        renderShapeNumber();
    });
    
    starBtn.addEventListener('click', () => {
        shapeType = 'star';
        highlightShape('star');
        syncFromUI();
        renderShapeNumber();
    });
    
    pentagonBtn.addEventListener('click', () => {
        shapeType = 'pentagon';
        highlightShape('pentagon');
        syncFromUI();
        renderShapeNumber();
    });
    
    // Initialize shape buttons
    initializeShapeButtons();
    
    // Initial sync
    syncFromUI();
    
    // Resize handler
    function resizeShapeNumber() {
        if (!shapeNumberContainer || !shapeNumberCanvas) return;
        
        const containerRect = shapeNumberContainer.getBoundingClientRect();
        const containerW = containerRect.width;
        const containerH = containerRect.height;
        
        if (containerW <= 0 || containerH <= 0) return;
        
        // Match device pixel ratio for crisp lines
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        shapeNumberCanvas.width = Math.floor(containerW * dpr);
        shapeNumberCanvas.height = Math.floor(containerH * dpr);
        shapeNumberCanvas.style.width = containerW + 'px';
        shapeNumberCanvas.style.height = containerH + 'px';
        shapeNumberCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        renderShapeNumber();
    }
    
    // Use ResizeObserver to watch container size changes
    if (window.ResizeObserver) {
        shapeNumberResizeObserver = new ResizeObserver(() => {
            resizeShapeNumber();
        });
        shapeNumberResizeObserver.observe(shapeNumberContainer);
    } else {
        // Fallback to window resize
        window.addEventListener('resize', resizeShapeNumber);
    }
    
    // Initial resize
    resizeShapeNumber();
}

// Render function
function renderShapeNumber() {
    if (!shapeNumberCanvas || !shapeNumberCtx || !shapeNumberContainer) return;
    
    const containerRect = shapeNumberContainer.getBoundingClientRect();
    const W = containerRect.width;
    const H = containerRect.height;
    
    if (W <= 0 || H <= 0) return;
    
    // Background
    shapeNumberCtx.clearRect(0, 0, W, H);
    shapeNumberCtx.fillStyle = '#ffffff';
    shapeNumberCtx.fillRect(0, 0, W, H);
    
    // Use full width, ignoring panel
    // Spacing between digits: digitSpacing is the gap between each pair of digits
    const cellW = W / 7.5; // Cell width for each digit
    const cellH = H / 2;
    const digitSpacing = 50; // Gap between digits in px (was 15, then 30 – increased to 50 for clearer separation)
    
    // Center the rows horizontally: 5 cells + 4 gaps between them
    const totalWidth = 5 * cellW + 4 * digitSpacing;
    const startX = (W - totalWidth) / 2; // Centered (removed the -10px shift)
    
    // Top row: 1,2,3,4,5 - align left edge of digit 1
    for (let i = 0; i < TOP_ROW.length; i++) {
        drawDigitInCell(TOP_ROW[i], startX + i * (cellW + digitSpacing), -20, cellW, cellH);
    }
    // Bottom row: 6,7,8,9,0 - align left edge of digit 6 with digit 1
    for (let i = 0; i < BOTTOM_ROW.length; i++) {
        drawDigitInCell(BOTTOM_ROW[i], startX + i * (cellW + digitSpacing), cellH - 100 - 40, cellW, cellH);
    }
}

function drawDigitInCell(digit, x, y, w, h) {
    const poly = getDigitGlyph(digit);
    if (!poly) return;
    
    const pts = resamplePolyline(poly, numShapes);
    
    const boxSize = Math.min(w, h) * 0.75;
    const cx = x + w / 2;
    const cy = y + h / 2;
    
    drawChain(pts, cx, cy, boxSize);
}

// Drawing functions
function drawChain(points, cx, cy, boxSize) {
    const left = cx - boxSize / 2;
    const top = cy - boxSize / 2;
    
    const baseSize = boxSize * 0.16;
    const size = baseSize * shapeSizeFactor;
    
    // Path
    shapeNumberCtx.strokeStyle = '#000';
    shapeNumberCtx.lineWidth = SHAPE_NUMBER_STROKE_W;
    shapeNumberCtx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const px = left + p.x * boxSize;
        const py = top + p.y * boxSize;
        if (i === 0) shapeNumberCtx.moveTo(px, py);
        else shapeNumberCtx.lineTo(px, py);
    }
    shapeNumberCtx.stroke();
    
    // Particles
    shapeNumberCtx.fillStyle = '#fff';
    shapeNumberCtx.strokeStyle = '#000';
    shapeNumberCtx.lineWidth = SHAPE_NUMBER_STROKE_W;
    
    for (const p of points) {
        const px = left + p.x * boxSize;
        const py = top + p.y * boxSize;
        drawParticle(px, py, size, shapeType);
    }
}

function drawParticle(x, y, size, type) {
    if (type === 'circle') {
        drawCircle(x, y, size);
    } else if (type === 'ellipse') {
        drawEllipse(x, y, size * 1.4, size * 0.85);
    } else if (type === 'square') {
        drawRectCenter(x, y, size, size);
    } else if (type === 'triangle') {
        drawRegularPolygon(x, y, size * 0.62, 3);
    } else if (type === 'pentagon') {
        drawRegularPolygon(x, y, size * 0.62, 5);
    } else if (type === 'star') {
        drawStar(x, y, size * 0.7, size * 0.32, 5);
    }
}

function drawCircle(cx, cy, d) {
    const r = d / 2;
    shapeNumberCtx.beginPath();
    shapeNumberCtx.arc(cx, cy, r, 0, Math.PI * 2);
    shapeNumberCtx.fill();
    shapeNumberCtx.stroke();
}

function drawEllipse(cx, cy, w, h) {
    shapeNumberCtx.beginPath();
    shapeNumberCtx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
    shapeNumberCtx.fill();
    shapeNumberCtx.stroke();
}

function drawRectCenter(cx, cy, w, h) {
    shapeNumberCtx.beginPath();
    shapeNumberCtx.rect(cx - w / 2, cy - h / 2, w, h);
    shapeNumberCtx.fill();
    shapeNumberCtx.stroke();
}

function drawRegularPolygon(cx, cy, r, sides) {
    shapeNumberCtx.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / sides;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) shapeNumberCtx.moveTo(x, y);
        else shapeNumberCtx.lineTo(x, y);
    }
    shapeNumberCtx.closePath();
    shapeNumberCtx.fill();
    shapeNumberCtx.stroke();
}

function drawStar(cx, cy, rOuter, rInner, points) {
    shapeNumberCtx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const r = (i % 2 === 0) ? rOuter : rInner;
        const a = -Math.PI / 2 + (i * Math.PI) / points;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) shapeNumberCtx.moveTo(x, y);
        else shapeNumberCtx.lineTo(x, y);
    }
    shapeNumberCtx.closePath();
    shapeNumberCtx.fill();
    shapeNumberCtx.stroke();
}

// Geometry functions
function lerp(a, b, t) {
    return a + (b - a) * t;
}

function dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.hypot(dx, dy);
}

function resamplePolyline(poly, n) {
    if (n === 1) return [poly[0]];
    
    const lengths = [];
    let total = 0;
    for (let i = 0; i < poly.length - 1; i++) {
        const d = dist(poly[i].x, poly[i].y, poly[i + 1].x, poly[i + 1].y);
        lengths.push(d);
        total += d;
    }
    
    const out = [];
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const target = t * total;
        
        let acc = 0;
        let j = 0;
        while (j < lengths.length && acc + lengths[j] < target) {
            acc += lengths[j];
            j++;
        }
        
        const a = poly[j];
        const b = poly[Math.min(j + 1, poly.length - 1)];
        const segLen = lengths[j] || 0;
        const u = segLen ? (target - acc) / segLen : 0;
        
        out.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
    }
    return out;
}

// Digit glyphs
function P(x, y) {
    return { x, y };
}

function arcPts(cx, cy, rx, ry, a0, a1, steps) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = lerp(a0, a1, t);
        pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
    }
    return pts;
}

function getDigitGlyph(d) {
    const HALF_PI = Math.PI / 2;
    const TWO_PI = Math.PI * 2;
    
    switch (d) {
        case '0': return arcPts(0.52, 0.52, 0.34, 0.42, -HALF_PI, -HALF_PI + TWO_PI - 0.18, 70);
        case '1': return [P(0.56, 0.12), P(0.46, 0.2), P(0.56, 0.12), P(0.56, 0.9)];
        case '2': return [...arcPts(0.52, 0.3, 0.3, 0.2, 3.9, 6.15, 22), P(0.82, 0.38), P(0.28, 0.9), P(0.84, 0.9)];
        case '3': return [...arcPts(0.52, 0.3, 0.32, 0.22, -1.15, 1.15, 26), P(0.66, 0.5), ...arcPts(0.52, 0.7, 0.32, 0.22, -1.15, 1.15, 26)];
        case '4': return [P(0.72, 0.12), P(0.32, 0.58), P(0.84, 0.58), P(0.72, 0.12), P(0.72, 0.9)];
        case '5': return [P(0.84, 0.14), P(0.3, 0.14), P(0.3, 0.48), P(0.66, 0.48), ...arcPts(0.56, 0.72, 0.32, 0.24, -0.35, 2.75, 32)];
        case '6': return [P(0.72, 0.18), P(0.46, 0.18), P(0.32, 0.34), ...arcPts(0.5, 0.68, 0.32, 0.26, 0.3, TWO_PI + 0.3, 40)];
        case '7': return [P(0.28, 0.16), P(0.84, 0.16), P(0.42, 0.9)];
        case '8': return [...arcPts(0.5, 0.34, 0.28, 0.18, HALF_PI, HALF_PI + TWO_PI - 0.18, 46), P(0.5, 0.52), ...arcPts(0.5, 0.72, 0.32, 0.2, -HALF_PI, -HALF_PI + TWO_PI - 0.18, 52)];
        case '9': return [P(0.72, 0.9), P(0.72, 0.55), ...arcPts(0.52, 0.34, 0.3, 0.23, 0.85, 0.85 + TWO_PI - 0.18, 56)];
        default: return null;
    }
}

// ==================
// SHAPE & EMOTION CANVAS
// ==================
// Shape & Emotion canvas implementation using native Canvas API (not p5.js)

// State variables for Shape & Emotion canvas
let shapeEmotionCanvas = null;
let shapeEmotionCtx = null;
let shapeEmotionContainer = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let prevX = 0;
let prevY = 0; // Previous point for smooth curve calculation

// Initialize Shape & Emotion canvas
function initializeShapeEmotionCanvas() {
    shapeEmotionContainer = document.getElementById('shape-emotion-container');
    if (!shapeEmotionContainer) {
        console.error('Shape & Emotion container not found');
        return;
    }
    
    const canvas = document.getElementById('shape-emotion-draw-surface');
    if (!canvas) {
        console.error('Shape & Emotion canvas not found');
        return;
    }
    
    shapeEmotionCanvas = canvas;
    shapeEmotionCtx = canvas.getContext('2d');
    
    // Set up canvas dimensions
    resizeShapeEmotionCanvas();
    
    // Set up event listeners for mouse
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Set up event listeners for touch (mobile)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeShapeEmotionCanvas();
    });
    
    // Initialize canvas with white background
    clearShapeEmotionCanvas();
}

// Resize canvas to match container dimensions
function resizeShapeEmotionCanvas() {
    if (!shapeEmotionCanvas || !shapeEmotionContainer) return;
    
    const containerRect = shapeEmotionContainer.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    if (width <= 0 || height <= 0) return;
    
    // Set canvas size
    shapeEmotionCanvas.width = width;
    shapeEmotionCanvas.height = height;
    
    // Redraw background
    clearShapeEmotionCanvas();
}

// Clear canvas with white background
function clearShapeEmotionCanvas() {
    if (!shapeEmotionCtx || !shapeEmotionCanvas) return;
    
    shapeEmotionCtx.fillStyle = '#fff';
    shapeEmotionCtx.fillRect(0, 0, shapeEmotionCanvas.width, shapeEmotionCanvas.height);
}

// Get coordinates relative to canvas
function getCanvasCoordinates(e) {
    if (!shapeEmotionCanvas) return { x: 0, y: 0 };
    
    const rect = shapeEmotionCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Get touch coordinates relative to canvas
function getTouchCoordinates(e) {
    if (!shapeEmotionCanvas || !e.touches || e.touches.length === 0) return { x: 0, y: 0 };
    
    const rect = shapeEmotionCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

// Mouse event handlers
function handleMouseDown(e) {
    if (!shapeEmotionCtx) return;
    
    const coords = getCanvasCoordinates(e);
    isDrawing = true;
    lastX = coords.x;
    lastY = coords.y;
    prevX = coords.x;
    prevY = coords.y;
    
    // Start a new path
    shapeEmotionCtx.beginPath();
    shapeEmotionCtx.moveTo(lastX, lastY);
}

function handleMouseMove(e) {
    if (!isDrawing || !shapeEmotionCtx) return;
    
    const coords = getCanvasCoordinates(e);
    drawOnShapeEmotionCanvas(coords.x, coords.y);
}

function handleMouseUp(e) {
    if (!isDrawing) return;
    isDrawing = false;
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault(); // Prevent scrolling
    if (!shapeEmotionCtx) return;
    
    const coords = getTouchCoordinates(e);
    isDrawing = true;
    lastX = coords.x;
    lastY = coords.y;
    prevX = coords.x;
    prevY = coords.y;
    
    // Start a new path
    shapeEmotionCtx.beginPath();
    shapeEmotionCtx.moveTo(lastX, lastY);
}

function handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling
    if (!isDrawing || !shapeEmotionCtx) return;
    
    const coords = getTouchCoordinates(e);
    drawOnShapeEmotionCanvas(coords.x, coords.y);
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!isDrawing) return;
    isDrawing = false;
}

// Drawing function - draws a smooth curve from last point to current point
function drawOnShapeEmotionCanvas(x, y) {
    if (!shapeEmotionCtx) return;
    
    // Set drawing style
    shapeEmotionCtx.strokeStyle = '#2C2C2C'; // Black, same as UI rectangles
    shapeEmotionCtx.lineWidth = 3; // 3 pixels as specified
    shapeEmotionCtx.lineCap = 'round'; // Round line caps for smooth drawing
    shapeEmotionCtx.lineJoin = 'round'; // Round line joins for smooth drawing
    
    // Calculate control point for smooth curve
    // Use the midpoint between previous and last point as control point
    // This creates a smooth, continuous curve
    const controlX = (prevX + lastX) / 2;
    const controlY = (prevY + lastY) / 2;
    
    // Use quadratic curve: from last point, through control point, to current point
    // This creates a smooth, continuous line
    shapeEmotionCtx.quadraticCurveTo(controlX, controlY, x, y);
    shapeEmotionCtx.stroke();
    
    // Update positions: previous becomes last, last becomes current
    prevX = lastX;
    prevY = lastY;
    lastX = x;
    lastY = y;
}

// Function to update Shape & Emotion canvas visibility
function updateShapeEmotionCanvasVisibility(pageId) {
    const shapeEmotionContainer = document.getElementById('shape-emotion-container');
    const p5Container = document.getElementById('p5-container');
    
    if (!shapeEmotionContainer) return;
    
    // Show Shape & Emotion canvas only for pageIds "0-4" or "4-0"
    // Parameter indices: 0=shape, 4=emotion
    const isShapeEmotionPage = pageId === '0-4' || pageId === '4-0';
    
    if (isShapeEmotionPage) {
        // Show Shape & Emotion container, hide p5 container
        shapeEmotionContainer.classList.remove('hidden');
        if (p5Container) {
            p5Container.style.opacity = '0';
            p5Container.style.visibility = 'hidden';
            p5Container.style.pointerEvents = 'none';
        }
        // Resize canvas after a brief delay to ensure container is visible
        setTimeout(() => {
            if (shapeEmotionContainer && !shapeEmotionContainer.classList.contains('hidden')) {
                resizeShapeEmotionCanvas();
            }
        }, 50);
    } else {
        // Hide Shape & Emotion container, show p5 container
        shapeEmotionContainer.classList.add('hidden');
        if (p5Container) {
            p5Container.style.opacity = '';
            p5Container.style.visibility = '';
            p5Container.style.pointerEvents = '';
        }
    }
}

// ==================
// P5 CELL 01 SKETCH FACTORY
// ==================
// Interactive drawing sketch with draggable shape stamps and sound
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
        let shapeSize = 26;        // Base size for shapes (trail stamps)
        let stepDist = 14;         // Distance between stamps
        let outlinePx = 3;         // Stroke weight
        let easing = 0.25;         // Smoothing factor
        
        // Draggable shape config
        const DRAGGABLE_SHAPE_SIZE = 40;  // Size of draggable shapes on canvas
        const SHAPE_SPACING = 70;          // Vertical spacing between shapes
        const SHAPE_TYPES = ['circle', 'square', 'triangle', 'ellipse', 'star', 'pentagon'];

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

        // Draggable shapes state
        // Each shape has: { x, y, shapeType (0-5) }
        let shapePositions = [];
        let draggedShapeIndex = -1;  // -1 means no shape is being dragged
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        // UI
        let playStopButton = null;

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
            
            // Initialize draggable shape positions in centered vertical column
            initializeShapePositions();
            
            // Restore saved state if available (after creating brushLayer)
            restoreState();
            
            createUI();
        };
        
        // ==================
        // INITIALIZE DRAGGABLE SHAPES
        // ==================
        function initializeShapePositions() {
            shapePositions = [];
            
            // Calculate center X position (exact center of canvas - on the divider line)
            const centerX = p.width / 2;  // Exact center
            
            // Calculate total height of all shapes
            const totalHeight = (SHAPE_TYPES.length - 1) * SHAPE_SPACING;
            
            // Calculate starting Y position to center the column vertically (shifted 60px up)
            const startY = (p.height - totalHeight) / 2 - 60;
            
            // Create shape positions: circle, square, triangle, ellipse, star, pentagon
            for (let i = 0; i < SHAPE_TYPES.length; i++) {
                shapePositions.push({
                    x: centerX,
                    y: startY + i * SHAPE_SPACING,
                    shapeType: i
                });
            }
        }

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
                // Draw draggable shapes on top during replay
                drawDraggableShapes();
                return;
            }

            // Handle shape dragging
            if (draggedShapeIndex >= 0 && p.mouseIsPressed) {
                const shape = shapePositions[draggedShapeIndex];
                const newX = p.mouseX - dragOffsetX;
                const newY = p.mouseY - dragOffsetY;
                
                // Apply easing for smooth movement
                const targetX = shape.x + (newX - shape.x) * easing;
                const targetY = shape.y + (newY - shape.y) * easing;
                
                // Calculate movement for stamping
                const dx = targetX - shape.x;
                const dy = targetY - shape.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Only stamp if moved enough distance
                if (dist > 2) {
                    // Stamp trail on left side (skipEnds=true so we don't draw at start/end where draggable shape is)
                    // Use DRAGGABLE_SHAPE_SIZE for consistent size with the draggable shapes
                    stampShapeWithType(shape.x, shape.y, targetX, targetY, true, shape.shapeType, true, DRAGGABLE_SHAPE_SIZE);
                    
                    // Mirror stamp on right side (skipEnds=true since mirrored draggable shape is there too)
                    stampShapeWithType(p.width - shape.x, shape.y, p.width - targetX, targetY, false, shape.shapeType, true, DRAGGABLE_SHAPE_SIZE);
                }
                
                // Update shape position
                shape.x = targetX;
                shape.y = targetY;
            }

            p.image(brushLayer, 0, 0);
            
            // Draw draggable shapes on top of everything
            drawDraggableShapes();
        };
        
        // ==================
        // DRAW DRAGGABLE SHAPES
        // ==================
        function drawDraggableShapes() {
            for (let i = 0; i < shapePositions.length; i++) {
                const shape = shapePositions[i];
                const isBeingDragged = (i === draggedShapeIndex);
                
                // Draw shape on left side
                drawDraggableShape(p, shape.x, shape.y, DRAGGABLE_SHAPE_SIZE, shape.shapeType, isBeingDragged);
                
                // Draw mirrored shape on right side (same size)
                // Only draw if not at center to avoid double-drawing
                const mirroredX = p.width - shape.x;
                const centerX = p.width / 2;
                if (Math.abs(shape.x - centerX) > 5) {
                    drawDraggableShape(p, mirroredX, shape.y, DRAGGABLE_SHAPE_SIZE, shape.shapeType, isBeingDragged);
                }
            }
        }
        
        // Draw a single draggable shape (larger, with hover effect)
        function drawDraggableShape(g, x, y, baseS, shapeType, isBeingDragged) {
            let mult = 1.0;
            if (shapeType === 1) mult = 1.3; // Square
            if (shapeType === 2) mult = 1.5; // Triangle
            if (shapeType === 3) mult = 1.4; // Ellipse
            if (shapeType === 4) mult = 1.2; // Star
            if (shapeType === 5) mult = 1.3; // Pentagon

            let s = baseS * mult;
            
            // Scale up when being dragged
            if (isBeingDragged) {
                s *= 1.1;
            }

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
                // Ellipse
                g.ellipse(0, 0, s * 1.5, s * 0.9);
            } else if (shapeType === 4) {
                // Star (5-pointed)
                g.beginShape();
                for (let i = 0; i < 10; i++) {
                    let angle = (i * g.PI) / 5 - g.PI / 2;
                    let r = (i % 2 === 0) ? s / 2 : s / 4;
                    let px = g.cos(angle) * r;
                    let py = g.sin(angle) * r;
                    g.vertex(px, py);
                }
                g.endShape(g.CLOSE);
            } else if (shapeType === 5) {
                // Pentagon
                g.beginShape();
                for (let i = 0; i < 5; i++) {
                    let angle = (i * g.TWO_PI) / 5 - g.PI / 2;
                    let px = g.cos(angle) * (s / 2);
                    let py = g.sin(angle) * (s / 2);
                    g.vertex(px, py);
                }
                g.endShape(g.CLOSE);
            }

            g.pop();
        }

        // ==================
        // BRUSH STAMP
        // ==================
        // Stamp shape with explicit shape type (for draggable shapes)
        // skipEnds: if true, don't draw at start or end positions (because draggable shape was/will be there)
        // customSize: optional custom size for the stamps (defaults to shapeSize)
        function stampShapeWithType(x1, y1, x2, y2, recordIt, shapeType, skipEnds = false, customSize = null) {
            let dx = x2 - x1;
            let dy = y2 - y1;
            let distSeg = p.sqrt(dx * dx + dy * dy);
            if (distSeg === 0) return;

            let steps = p.max(1, p.floor(distSeg / stepDist));
            
            // If skipEnds is true, skip first and last positions (draggable shape handles those)
            let startStep = skipEnds ? 1 : 0;
            let endStep = skipEnds ? steps - 1 : steps;
            
            // Make sure we have steps to draw
            if (startStep > endStep) {
                // Not enough distance for intermediate stamps, just record and trigger sound
                if (recordIt) {
                    triggerSound(x2, y2, shapeType);
                }
                return;
            }
            
            // Use custom size if provided, otherwise use default shapeSize
            const stampSize = customSize !== null ? customSize : shapeSize;

            for (let i = startStep; i <= endStep; i++) {
                let f = i / steps;
                let x = p.lerp(x1, x2, f);
                let y = p.lerp(y1, y2, f);

                drawShape(brushLayer, x, y, stampSize, shapeType);

                if (recordIt) {
                    recordedPoints.push({ x, y, shape: shapeType });
                }
            }

            // Sound only on original drawing (not mirror)
            if (recordIt) triggerSound(x2, y2, shapeType);
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
            // Create simple play/stop toggle button at bottom right
            playStopButton = document.createElement("button");
            playStopButton.textContent = "[play]";
            playStopButton.style.position = "absolute";
            playStopButton.style.right = "10px";
            playStopButton.style.bottom = "50px"; // Above the parameter text area
            playStopButton.style.padding = "8px 12px";
            playStopButton.style.fontFamily = "'JetBrains Mono NL', monospace";
            playStopButton.style.fontSize = "15px";
            playStopButton.style.letterSpacing = "0.03em";
            playStopButton.style.lineHeight = "1";
            playStopButton.style.borderRadius = "0";
            playStopButton.style.border = "none";
            playStopButton.style.background = "#2C2C2C";
            playStopButton.style.color = "#ffffff";
            playStopButton.style.cursor = "pointer";
            playStopButton.style.zIndex = "1000";
            // Slide-in animation
            playStopButton.style.transform = "translateX(100%)";
            playStopButton.style.transition = "transform 0.3s ease";
            container.appendChild(playStopButton);
            
            // Trigger slide-in animation after a brief delay
            setTimeout(() => {
                playStopButton.style.transform = "translateX(0)";
            }, 50);

            playStopButton.addEventListener("click", () => {
                if (isReplaying) {
                    // Stop playback
                    isReplaying = false;
                    playStopButton.textContent = "[play]";
                } else {
                    // Start playback
                    if (!recordedPoints.length) return;

                    // Start audio safely
                    ensureAudio();

                    clearVisualOnly();
                    replayIndex = 0;
                    lastSoundTime = 0;
                    isReplaying = true;
                    playStopButton.textContent = "[stop]";
                }
            });
        }
        
        // ==================
        // SHAPE HIT DETECTION
        // ==================
        function getShapeAtPosition(mx, my) {
            // Check shapes in reverse order (topmost first)
            for (let i = shapePositions.length - 1; i >= 0; i--) {
                const shape = shapePositions[i];
                const hitRadius = DRAGGABLE_SHAPE_SIZE * 0.7; // Generous hit area
                
                const dx = mx - shape.x;
                const dy = my - shape.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < hitRadius) {
                    return i;
                }
            }
            return -1;
        }

        // ==================
        // BACKGROUND
        // ==================
        function paintBackground() {
            // Background removed - canvas is transparent to show page background
            // No divider line - shapes are mirrored seamlessly
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
            
            // Reset drawing state
            drawing = false;
            brushX = undefined;
            brushY = undefined;
            prevX = undefined;
            prevY = undefined;
            
            // Reset draggable shapes to initial positions
            initializeShapePositions();
            
            // Reset play/stop button text
            if (playStopButton) {
                playStopButton.textContent = "[play]";
            }
        }

        p.keyPressed = function() {
            if (p.key === "c" || p.key === "C") resetCanvas();
        };

        // Mouse press handler - detect shape clicks and start dragging
        p.mousePressed = function() {
            ensureAudio();
            
            // Check if clicking on a draggable shape
            const shapeIndex = getShapeAtPosition(p.mouseX, p.mouseY);
            if (shapeIndex >= 0) {
                draggedShapeIndex = shapeIndex;
                const shape = shapePositions[shapeIndex];
                dragOffsetX = p.mouseX - shape.x;
                dragOffsetY = p.mouseY - shape.y;
                
                // Hide instruction text when user starts interacting
                hideSoundShapeInstructionText();
            }
        };
        
        // Mouse release handler - stop dragging
        p.mouseReleased = function() {
            if (draggedShapeIndex >= 0) {
                // Save state after drawing
                saveState();
            }
            draggedShapeIndex = -1;
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
            
            // Reinitialize shape positions for new canvas size
            initializeShapePositions();
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
        
        // Check if there's a registered canvas for the initial pageId
        // Skip p5.js canvas creation for Shape & Number pages (0-3, 3-0) - they use native Canvas API
        // Skip p5.js canvas creation for Shape & Emotion pages (0-4, 4-0) - they use native Canvas API
        const initialPageId = getPageIdFromColors(selectedLeftIndex, selectedRightIndex);
        const isShapeNumberPage = initialPageId === '0-3' || initialPageId === '3-0';
        const isShapeEmotionPage = initialPageId === '0-4' || initialPageId === '4-0';
        
        if (isShapeNumberPage || isShapeEmotionPage) {
            // Don't create p5.js sketch for Shape & Number or Shape & Emotion pages
            return;
        }
        
        // If not Shape & Number page, proceed with p5.js sketch creation
        let sketchFactory = null;
        
        if (window.CanvasRegistry && window.CanvasRegistry.has(initialPageId)) {
            sketchFactory = window.CanvasRegistry.get(initialPageId);
        }
        
        // If no registered canvas found, use the default canvas
        if (!sketchFactory) {
            sketchFactory = createP5Cell01Sketch;
        }
        
        // Create p5 sketch using the factory function
        // Parameters: container, width, height, active flag, pageId, state storage
        const sketch = sketchFactory(
            container,
            width,
            height,
            p5SketchActive,
            initialPageId, // Use pageId instead of cellId for new canvases
            p5StateStorage // state storage object
        );
        
        // Create p5 instance - always create it once, even if initially hidden
        p5Instance = new p5(sketch, container);
        
        if (p5Instance) {
            p5Instance._currentPageId = initialPageId;
        }
    });
}

// Function to initialize SYN logo hover effect
// Shows synesthesia text overlay when hovering over the SYN logo
function initializeSynHoverEffect() {
    // Initialize SYN hover overlay
    const synElement = document.querySelector('.black-rectangle');
    const synOverlay = document.getElementById('canvas-text-box-syn-overlay');
    const synBacking = document.getElementById('canvas-text-box-syn-backing');
    
    if (synElement && synOverlay && synBacking) {
        // Render overlay text with line backgrounds to match main text box styling
        // Use same width as main text box (1035px) for the SYN overlay
        // Use black background color (#2C2C2C) for line backgrounds to match UI black
        const synText = 'syn-ethesia is a perceptual phenomenon in which the stimulation of one sense automatically triggers experiences in another. A sound may appear as a color, a letter may carry a specific hue, or a number may feel spatial or textured. These cross-sensory connections happen naturally and consistently, forming a unique inner world for each person who experiences them.';
        renderTextWithLineBackgrounds(synOverlay, synText, 1035, '#2C2C2C');
        
        // Show overlay and backing layer on hover
        synElement.addEventListener('mouseenter', () => {
            synBacking.classList.add('visible');
            synOverlay.classList.add('visible');
        });
        
        // Hide overlay and backing layer when hover ends
        synElement.addEventListener('mouseleave', () => {
            synBacking.classList.remove('visible');
            synOverlay.classList.remove('visible');
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
    
    // CRITICAL: Add demo-active class immediately to prevent text from appearing
    // The text should remain hidden until demo completes
    container.classList.add('demo-active');
    
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
        
        // Verify UI is still hidden after entry animation
        updateUIVisibility();
        
        // Trigger demo when intro text is visible
        triggerDemo();
        
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
    
    // Create instructional text for the 4th gradient rectangle (index 3) - all three lines
    const introText = document.createElement('div');
    introText.className = 'gradient-intro-text';
    introText.innerHTML = INITIAL_INSTRUCTION_TEXT;
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
        
        if (index === 0 || index === 3) { // Log first and 4th row (where START text is - 3rd from bottom)
        }
        
        // Set gradient: starts with left color (left edge), ends with right color (right edge)
        // This ensures: left scrollbar → left edge of gradient, right scrollbar → right edge of gradient
        rect.style.background = `linear-gradient(to right, ${leftColor}, ${rightColor})`;
        
        // CRITICAL: Topmost bar (index 0) always stays full width between scrollbar inner edges
        // Left edge aligns with inner edge of left scrollbar (50px), right edge aligns with inner edge of right scrollbar
        // This applies regardless of intro phase - it never shrinks back
        if (index === 0) {
            rect.style.left = `${SCROLLBAR_COLLAPSED_WIDTH}px`; // 50px - inner edge of left scrollbar
            rect.style.width = `${window.innerWidth - (2 * SCROLLBAR_COLLAPSED_WIDTH)}px`; // window.innerWidth - 100px
        } else {
            rect.style.left = `${leftEdge}px`;
            rect.style.width = `${width}px`;
        }
        rect.style.height = `${itemHeight}px`;
    });
    
    // Position instructional text in the 4th gradient rectangle (index 3) - all three lines
    // Text fades in during entry animation (synced with gradient shrink)
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        const isStartButton = introText.textContent === '[start]';
        
        // For START button, position it in the 4th rectangle (index 3) - 3rd from bottom
        // For instruction text, use 4th rectangle (index 3)
        const rectIndex = isStartButton ? 3 : 3;
        const rectTop = rectIndex * itemHeight;
        
        // Position text in the appropriate rectangle
        introText.style.left = `${leftEdge}px`;
        introText.style.width = `${width}px`;
        introText.style.top = `${rectTop}px`;
        introText.style.height = `${itemHeight}px`;
        introText.style.alignItems = 'center';
        introText.style.justifyContent = 'center';
        introText.style.flexDirection = 'column';
        
        // For START button, don't set display/visibility here - let setupStartButton() handle it
        // to allow the animation to work properly
        if (!isStartButton) {
            introText.style.display = 'flex';
            introText.style.visibility = 'visible';
        }
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
            const fourthRectIndex = 3; // 4th rectangle (0-indexed) - 3rd from bottom
            const fourthRectTop = fourthRectIndex * itemHeight;
            
            // Position arrow centered below START text
            // Calculate vertical offset: START text is centered, so we add some spacing below it
            const arrowTop = fourthRectTop + (itemHeight / 2) + 30; // 30px below center of START text
            
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
    
    // Heights are already at 0 (progress = 1), so we can set final state immediately
    // Wait for horizontal expansion to complete (250ms) before setting final state
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
        
        
        
        // Show main gradient header when intro completes
        showMainGradientHeader();
        
        // Hide canvas cover to reveal canvas content
        updateCanvasCoverVisibility();
        
        // Hide UI mask when intro completes
        updateUIMaskVisibility();
    }, 250); // Match CSS transition duration for horizontal expansion
}

// Function to start horizontal expansion (called once when scrolling begins)
function startHorizontalExpansion() {
    // CRITICAL: Early return if intro is completed - prevent expansion from restarting
    if (introCompleted) {
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
        // CRITICAL: Topmost bar (index 0) always stays full width between scrollbar inner edges
        const barIndex = parseInt(bar.getAttribute('data-bar-index'), 10);
        if (barIndex === 0) {
            // Top bar aligns with inner edges of scrollbars (same as other bars in closing phase)
            const containerLocalLeft = leftInnerX - containerRect.left;
            bar.style.left = containerLocalLeft + 'px';
            bar.style.width = targetWidth + 'px';
        } else {
            const containerLocalLeft = leftInnerX - containerRect.left;
            bar.style.left = containerLocalLeft + 'px';
            bar.style.width = targetWidth + 'px';
        }
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
    
    // Wait for horizontal expansion animation to complete (250ms) before showing UI
    // UI becomes visible ONLY AFTER gradients have expanded to reach the scrollbars
    setTimeout(() => {
        hasExpandedToScrollbars = true;
        updateUIVisibility();
        // Hide canvas cover to reveal canvas content when gradients fully expand
        updateCanvasCoverVisibility();
        // Hide UI mask when transition completes
        updateUIMaskVisibility();
    }, 250); // Match CSS transition duration for horizontal expansion
}

// Function to update gradient bar heights based on progress
function updateGradientBarHeights(progress) {
    // CRITICAL: Early return if intro is completed - prevent height updates
    if (introCompleted) {
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
            return;
        }
        
        // CRITICAL: Block center scroll during entry animation
        if (introPhase === 'entering') {
            return;
        }
        
        // CRITICAL: Block center scroll during START click transition (programmatic transition active)
        if (startClickTransitionActive) {
            return;
        }
        
        // CRITICAL: Disable scroll-to-close after START appears - only click should trigger transition
        if (introReady) {
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

// Function to initialize user interaction detection
// Detects real user interaction via wheel/touchstart/pointerdown events
// Sets userInteracted flag to true when genuine user interaction is detected
function initializeUserInteractionDetection() {
    // Detect wheel events (mouse wheel scrolling)
    document.addEventListener('wheel', (e) => {
        // Only set flag if not during demo and not during initialization
        if (!isDemoActive && !isInitializing) {
            userInteracted = true;
        }
    }, { passive: true });
    
    // Detect touch events (mobile/touchscreen)
    document.addEventListener('touchstart', (e) => {
        // Only set flag if not during demo and not during initialization
        if (!isDemoActive && !isInitializing) {
            userInteracted = true;
        }
    }, { passive: true });
    
    // Detect pointer events (mouse/touch/pen)
    document.addEventListener('pointerdown', (e) => {
        // Only set flag if not during demo and not during initialization
        if (!isDemoActive && !isInitializing) {
            userInteracted = true;
        }
    }, { passive: true });
}

// Function to reverse the intro transition (main → intro)
// Reuses the existing scroll-driven collapse logic, animating progress from 1 → 0
function reverseIntroTransition() {
    // Only allow reverse if intro is completed (we're on main screen)
    if (!introCompleted) {
        return;
    }
    
    
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
        // CRITICAL: Topmost bar (index 0) always stays full width between scrollbar inner edges
        const barIndex = parseInt(bar.getAttribute('data-bar-index'), 10);
        if (barIndex === 0) {
            // Top bar aligns with inner edges (same as other bars in closing phase)
            bar.style.left = containerLocalLeft + 'px';
            bar.style.width = targetWidth + 'px';
        } else {
            bar.style.left = containerLocalLeft + 'px';
            bar.style.width = targetWidth + 'px';
        }
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
            // CSS transition (250ms) will animate the horizontal contraction smoothly
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
            
            
            // Wait for horizontal contraction to complete (250ms), then transition to entering phase
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
            }, 250); // Match CSS transition duration for closing → active
        }
    }
    
    // Start animation
    requestAnimationFrame(animate);
}

// Function to cancel all demo animations
function cancelDemoAnimations() {
    // Store counts before clearing
    const timeoutCount = demoTimeouts.length;
    const frameCount = demoAnimationFrames.length;
    
    // Cancel all timeouts
    demoTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    demoTimeouts = [];
    
    // Cancel all animation frames
    demoAnimationFrames.forEach(frameId => {
        cancelAnimationFrame(frameId);
    });
    demoAnimationFrames = [];
    
    // Cancel current animation frame if exists
    if (currentAnimationFrame !== null) {
        cancelAnimationFrame(currentAnimationFrame);
        currentAnimationFrame = null;
    }
    
    // Re-enable scroll-snap on both columns
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    if (leftColumn) {
        leftColumn.style.removeProperty('scroll-snap-type');
    }
    if (rightColumn) {
        rightColumn.style.removeProperty('scroll-snap-type');
    }
    
    // Reset programmatic scroll flag
    isProgrammaticScroll = false;
    
}

// Function to skip demo when user scrolls during demo
// Immediately stops demo and shows START button
function skipDemo() {
    // Stop demo logic
    isDemoActive = false;
    
    // Cancel all demo animations immediately
    cancelDemoAnimations();
    
    // Mark user interaction
    userInteracted = true;
    
    // Prevent text from reverting
    introTextChanged = true;
    
    // Enable START button
    introReady = true;
    
    // Remove demo-active class to show text immediately
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (gradientContainer) {
        gradientContainer.classList.remove('demo-active');
    }
    
    // Show START button immediately (this will set up the text content)
    setupStartButton();
    
    // Use setTimeout to ensure DOM updates and CSS transitions are applied before forcing visibility
    // This ensures the demo-active class removal has taken effect
    setTimeout(() => {
        // Get intro text element and ensure it's visible after setupStartButton
        const introText = document.getElementById('gradient-intro-text');
        if (introText) {
            // Also ensure the container has intro-active class for CSS rules to work
            if (gradientContainer && !gradientContainer.classList.contains('intro-active')) {
                gradientContainer.classList.add('intro-active');
            }
            
            // Ensure visibility (but don't force opacity - let CSS animation handle it)
            // After removing demo-active class, intro-active CSS rule should apply
            // and the animation will handle the fade-in
            // Use 'flex' to match setupStartButton() and updateGradientIntro()
            introText.style.display = 'flex';
            introText.style.visibility = 'visible';
            // Don't set opacity - let CSS animation handle the fade-in
        }
    }, 0);
    
}

// Shared function to set up START button click handler
// This ensures consistent behavior whether START appears in initial intro or after returning via logo click
function setupStartButton() {
    // #region agent log
    const stack = new Error().stack;
    fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8026',message:'setupStartButton CALLED',data:{isDemoActive,introTextChanged,initialInstructionTextShown,userInteracted,hasScrolledScrollbar,isProgrammaticScroll,stack:stack.split('\n').slice(0,5).join(' | ')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'start-trigger'})}).catch(()=>{});
    // #endregion
    
    const introText = document.getElementById('gradient-intro-text');
    if (!introText) {
        console.warn('START button setup: intro text element not found');
        return;
    }
    
    // Reset element to initial animation state (same as 3 instruction sentences)
    // This ensures the START button animates in with the same fade-in and slide-up effect
    introText.style.opacity = '0';
    introText.style.transform = 'translateY(10px)';
    
    // Set START text
    introText.textContent = '[start]';
    
    // Set display and visibility so element is ready for animation
    // But keep opacity/transform at initial state for animation
    introText.style.display = 'flex';
    introText.style.visibility = 'visible';
    
    // Make START text clickable
    introText.style.cursor = 'pointer';
    introText.style.pointerEvents = 'auto';
    
    // Remove any existing click handlers by cloning and replacing (avoids duplicates)
    const newIntroText = introText.cloneNode(true);
    introText.parentNode.replaceChild(newIntroText, introText);
    
    // Update reference to the new node
    const updatedIntroText = document.getElementById('gradient-intro-text');
    
    // Add click handler to trigger forward transition
    updatedIntroText.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        
        // Trigger forward transition (intro → main)
        forwardIntroTransition();
    });
    
    // Use requestAnimationFrame to ensure DOM is ready, then remove inline styles
    // This allows CSS to take control and apply the animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Remove inline opacity and transform to let CSS animation take over
            // The CSS rule .gradient-intro-container.intro-active .gradient-intro-text
            // will apply opacity: 1 and transform: translateY(0) with the transition
            updatedIntroText.style.opacity = '';
            updatedIntroText.style.transform = '';
        });
    });
    
    // Show arrow (positioning is handled by updateGradientIntro, but visibility needs to be set)
    const arrowElement = document.getElementById('gradient-intro-arrow');
    if (arrowElement) {
        arrowElement.style.display = 'flex';
        arrowElement.style.visibility = 'visible';
        arrowElement.style.opacity = '0.7';
    }
    
    // Update gradient intro to position text and arrow correctly
    // This must be called after setting text content to '[start]' so arrow positioning works
    updateGradientIntro();
}

// Function to forward the intro transition (intro → main)
// Two-step process: 1) Horizontal expansion first, 2) Then collapse transition
// Uses the same programmatic animation approach - NO scroll-triggered functions
function forwardIntroTransition() {
    // Only allow if intro is ready and not completed (we're at START checkpoint)
    if (!introReady || introCompleted) {
        return;
    }
    
    // Prevent scroll-based trigger during programmatic transition
    startClickTransitionActive = true;
    
    
    // Get gradient container
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer) {
        console.error('Gradient container not found');
        startClickTransitionActive = false;
        return;
    }
    
    // Hide text and arrow immediately when transition starts
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        introText.style.display = 'none';
        introText.style.visibility = 'hidden';
        introText.style.opacity = '0';
        introText.style.pointerEvents = 'none';
    }
    
    const arrowElement = document.getElementById('gradient-intro-arrow');
    if (arrowElement) {
        arrowElement.style.display = 'none';
        arrowElement.style.visibility = 'hidden';
        arrowElement.style.opacity = '0';
        arrowElement.style.pointerEvents = 'none';
    }
    
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
    
    // CRITICAL: Set up initial state manually (like reverseIntroTransition does)
    // Start in 'active' phase (narrowed with gap) - this is the START checkpoint state
    introPhase = 'active';
    gradientContainer.classList.add('intro-active');
    gradientContainer.classList.remove('intro-closing');
    gradientContainer.classList.remove('intro-collapsed');
    
    // Set up initial state: rectangles in active phase (narrowed with gap)
    // This matches the state when progress = 0 (START checkpoint)
    const SCROLLBAR_COLLAPSED_WIDTH = 50;
    const SCROLLBAR_EXPANDED_WIDTH = 85;
    const GRADIENT_GAP = SCROLLBAR_EXPANDED_WIDTH - SCROLLBAR_COLLAPSED_WIDTH; // 35px
    const leftEdge = SCROLLBAR_COLLAPSED_WIDTH + GRADIENT_GAP; // 85px from left
    const rightEdge = window.innerWidth - SCROLLBAR_COLLAPSED_WIDTH - GRADIENT_GAP;
    const activeWidth = rightEdge - leftEdge;
    
    const containerRect = gradientContainer.getBoundingClientRect();
    const containerLocalLeft = leftEdge - containerRect.left;
    
    rectangles.forEach((bar) => {
        // CRITICAL: Topmost bar (index 0) always stays full width between scrollbar inner edges
        const barIndex = parseInt(bar.getAttribute('data-bar-index'), 10);
        if (barIndex === 0) {
            // Top bar aligns with inner edges: 50px from left, width = window.innerWidth - 100px
            bar.style.left = `${SCROLLBAR_COLLAPSED_WIDTH}px`;
            bar.style.width = `${window.innerWidth - (2 * SCROLLBAR_COLLAPSED_WIDTH)}px`;
        } else {
            bar.style.left = containerLocalLeft + 'px';
            bar.style.width = activeWidth + 'px';
        }
    });
    
    // Update colors for active phase
    updateGradientIntro();
    
    // Start with progress = 0 (fully expanded state - START checkpoint)
    introProgress = 0;
    
    // Set initial heights to full (expanded state)
    updateGradientBarHeights(introProgress);
    
    // Show main gradient header immediately (it should be visible under the collapsing gradient)
    showMainGradientHeader();
    
    // Update UI mask visibility immediately when transition starts
    updateUIMaskVisibility();
    
    // Mark that gradients have expanded to scrollbars (required for UI visibility)
    hasExpandedToScrollbars = true;
    
    // STEP 1: Horizontal expansion first
    // Transition from 'active' phase (narrowed with gap) to 'closing' phase (expanded to scrollbar edges)
    
    // Transition to closing phase (expanded to scrollbar edges)
    introPhase = 'closing';
    gradientContainer.classList.remove('intro-active');
    gradientContainer.classList.add('intro-closing');
    
    // Manually set rectangles to scrollbar edges (full width between scrollbars)
    const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
    const containerRectExpanded = gradientContainer.getBoundingClientRect();
    const containerLocalLeftExpanded = leftInnerX - containerRectExpanded.left;
    const targetWidth = rightInnerX - leftInnerX;
    
    rectangles.forEach((bar) => {
        // CRITICAL: Topmost bar (index 0) always stays full width between scrollbar inner edges
        // All bars use the same values (inner edges) in closing phase
        const barIndex = parseInt(bar.getAttribute('data-bar-index'), 10);
        bar.style.left = containerLocalLeftExpanded + 'px';
        bar.style.width = targetWidth + 'px';
    });
    
    // Update to closing state (expanded to scrollbar edges) - CSS transition (250ms) will animate
    updateGradientIntro();
    
    // STEP 2: Start collapse animation immediately (same frame as expansion) - zero delay for continuous gesture
    // Expansion and collapse now run simultaneously on the same timeline for uninterrupted motion
    
    // Animation parameters for collapse transition
    const duration = 2000; // 2 seconds for the collapse animation
    const startTime = performance.now();
    const startProgress = 0;
    const endProgress = 1;
    
    // Easing function (easeInOutCubic for smooth animation)
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Track if UI has been revealed (only once, when animation starts)
    let uiRevealed = false;
    
    // Animation loop for collapse transition
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Reveal UI and canvas when animation starts (first frame)
        // This happens as the top gradient rectangle starts collapsing
        if (!uiRevealed && progress > 0) {
            uiRevealed = true;
            // Show UI as the top gradient starts collapsing
            updateUIVisibility();
            // Hide canvas cover to reveal canvas content
            updateCanvasCoverVisibility();
        }
        
        // Apply easing
        const easedProgress = easeInOutCubic(progress);
        
        // Interpolate progress from 0 → 1 (heights collapse from full to 0)
        const currentProgress = startProgress + (endProgress - startProgress) * easedProgress;
        introProgress = currentProgress;
        
        // Log progress for debugging
        if (Math.floor(progress * 10) % 2 === 0) { // Log every 20% to avoid spam
        }
        
        // Update gradient bar heights using existing collapse logic
        updateGradientBarHeights(introProgress);
        
        // Continue animation until progress reaches 1
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete - ensure progress is exactly 1
            introProgress = 1;
            updateGradientBarHeights(1);
            
            // Mark intro as completed
            introCompleted = true;
            
            // Ensure we're in closing phase (should already be set)
            if (introPhase !== 'closing') {
                introPhase = 'closing';
                gradientContainer.classList.remove('intro-active');
                gradientContainer.classList.add('intro-closing');
            }
            
            
            // Trigger final cleanup
            setTimeout(() => {
                // Trigger final cleanup (same as scroll-based completion)
                if (!introTriggered) {
                    triggerIntroTransition();
                }
                
                // Hide UI mask when transition completes (same as scroll-based flow)
                updateUIMaskVisibility();
                
                // Reset flag
                startClickTransitionActive = false;
                
            }, 100); // Small delay for final state updates
        }
    }
    
    // Start collapse animation immediately (same frame as expansion) - zero delay
    requestAnimationFrame(animate);
}

// Function to go to START checkpoint (main → expand → START, no intro restart)
// This is used when clicking the logo to return to START without replaying intro/demo
function goToStartCheckpoint() {
    // Only allow if intro is completed (we're on main screen)
    if (!introCompleted) {
        return;
    }
    
    
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
        // CRITICAL: Topmost bar (index 0) always stays full width between scrollbar inner edges
        // All bars use the same values (inner edges) in closing phase
        const barIndex = parseInt(bar.getAttribute('data-bar-index'), 10);
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
                
                // Reset startClickTransitionActive to ensure clean state
                startClickTransitionActive = false;
                
                // Use shared function to set up START button (ensures consistent behavior)
                setupStartButton();
                
                // UI stays hidden (we're in START state, not main screen)
                updateUIVisibility();
                
                // Canvas cover stays visible (we're in START state)
                updateCanvasCoverVisibility();
                
                // Update UI mask visibility - should be visible at START checkpoint with gap
                updateUIMaskVisibility();
                
                // CRITICAL: Ensure main gradient header stays visible in START state
                // It should remain visible under the UI at all times
                showMainGradientHeader();
                
            }, 250); // Match CSS transition duration for closing → active
        }
    }
    
    // Start animation
    requestAnimationFrame(animate);
}

// Function to restart the intro sequence
// Resets all intro-related state and replays the intro from the beginning
function restartIntro() {
    
    // Reset all intro-related state variables
    introPhase = 'entering';
    introReady = false;
    introTriggered = false;
    introProgress = 0;
    introCompleted = false;
    horizontalExpansionStarted = false;
    hasExpandedToScrollbars = false;
    startClickTransitionActive = false; // Reset to ensure clean state
    
    // Reset intro text state
    introTextChanged = false;
    initialInstructionTextShown = false; // Reset initial instruction text shown flag
    leftColumnScrolled = false;
    rightColumnScrolled = false;
    userInteracted = false; // Reset user interaction flag
    hasScrolledScrollbar = false; // Reset scrollbar scroll flag
    isDemoActive = false; // Reset demo active flag
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
        
        
        // If intro is completed, go to START checkpoint (no intro restart)
        if (introCompleted) {
            goToStartCheckpoint();
        } else {
            // If intro is not completed, just restart (shouldn't happen normally)
            restartIntro();
        }
    });
    
}

// Function to check if intro text should be updated
// NOTE: This function is now primarily used for legacy/backup checks
// The main START trigger is now handled directly in the scroll handler on first user scroll
function checkAndUpdateIntroText() {
    // Don't change if already changed
    if (introTextChanged) return;
    
    // CRITICAL: Block START text change during demo or when no real user interaction detected
    if (isDemoActive) {
        return;
    }
    
    // Only allow START to appear when userInteracted === true (real user interaction detected)
    if (!userInteracted) {
        return;
    }
    
    // NOTE: START is now triggered on first user scroll in the scroll handler
    // This function is kept for backward compatibility but should rarely be called
    // The scroll handler directly calls setupStartButton() on first user scroll
}

// ==================
// SMOOTH DEMO SCROLL FUNCTION
// ==================

// Function to programmatically scroll a column with smooth continuous motion
// Uses a single fluid animation with strong ease-out (like a spinning wheel slowing down)
// scrollDistance: positive = down, negative = up (in number of items)
// Now supports infinite scrolling by wrapping position when hitting boundaries
function scrollColumnProgrammatically(column, duration, scrollDistance) {
    const itemHeight = window.innerHeight / 6;
    const singleSetHeight = 6 * itemHeight; // Height of one complete color set
    const startScrollTop = column.scrollTop;
    const totalScrollDistance = itemHeight * scrollDistance; // Total pixels to scroll
    const startTime = Date.now();
    const columnId = column.classList.contains('left-column') ? 'left' : 'right';
    
    // Boundaries for wrapping (same as infinite scroll logic)
    const topBoundary = singleSetHeight * 0.5;
    const bottomBoundary = singleSetHeight * 1.5;
    
    // Track cumulative scroll for wrapping
    let currentBase = startScrollTop;
    let lastEase = 0;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8620',message:'scrollColumnProgrammatically START',data:{columnId,startScrollTop,totalScrollDistance,scrollDistance,duration,itemHeight,singleSetHeight,topBoundary,bottomBoundary},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'wrap'})}).catch(()=>{});
    // #endregion
    
    // Set programmatic scroll flag to skip user interaction tracking
    // but gradients will still update via scroll handler
    isProgrammaticScroll = true;
    // Set demo active flag to prevent START text change during demo
    isDemoActive = true;
    
    // Disable scroll-snap during demo for smooth motion
    column.style.setProperty('scroll-snap-type', 'none', 'important');
    
    let frameCount = 0;
    
    // Single continuous animation with strong ease-out
    function animate() {
        // Check if demo was cancelled - if so, stop immediately
        if (!isDemoActive) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8638',message:'Animation CANCELLED',data:{columnId,frameCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'wrap'})}).catch(()=>{});
            // #endregion
            // Re-enable scroll-snap
            column.style.removeProperty('scroll-snap-type');
            // Reset flags
            isProgrammaticScroll = false;
            return;
        }
        
        frameCount++;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Roulette-style easing: short acceleration (20%), long deceleration (80%)
        // This creates the feel of a spinning wheel that takes time to slow down
        const accelPhase = 0.15; // Only 15% of time for acceleration
        let ease;
        if (progress < accelPhase) {
            // Ease-in: quick acceleration (quadratic)
            const t = progress / accelPhase;
            ease = t * t * accelPhase;
        } else {
            // Ease-out: gradual deceleration (power of 3)
            const t = (progress - accelPhase) / (1 - accelPhase);
            ease = accelPhase + (1 - accelPhase) * (1 - Math.pow(1 - t, 3));
        }
        
        // Calculate incremental scroll delta since last frame
        const deltaEase = ease - lastEase;
        const deltaScroll = totalScrollDistance * deltaEase;
        lastEase = ease;
        
        // Apply incremental scroll
        let newScrollTop = column.scrollTop + deltaScroll;
        
        // Wrap position if we cross boundaries (infinite scroll during animation)
        let wrapped = false;
        if (newScrollTop < topBoundary) {
            // Scrolled too far up: wrap forward by one set
            newScrollTop += singleSetHeight;
            wrapped = true;
        } else if (newScrollTop > bottomBoundary) {
            // Scrolled too far down: wrap backward by one set
            newScrollTop -= singleSetHeight;
            wrapped = true;
        }
        
        column.scrollTop = newScrollTop;
        
        // Log every 30 frames (~0.5 sec at 60fps) or when wrapped
        if (frameCount % 30 === 1 || wrapped) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8670',message:'Animation FRAME',data:{columnId,frameCount,elapsed,progress,ease,deltaScroll,newScrollTop,wrapped,actualScrollTop:column.scrollTop},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'wrap'})}).catch(()=>{});
            // #endregion
        }
        
        if (progress < 1) {
            const frameId = requestAnimationFrame(animate);
            demoAnimationFrames.push(frameId);
        } else {
            // Animation complete
            const finalActual = column.scrollTop;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8688',message:'Animation COMPLETE',data:{columnId,frameCount,finalActual},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'wrap'})}).catch(()=>{});
            // #endregion
            
            // Re-enable scroll-snap after a small delay to avoid browser snap interference
            const timeoutId = setTimeout(() => {
                column.style.removeProperty('scroll-snap-type');
                isProgrammaticScroll = false;
                // Note: isDemoActive is reset in scrollBothColumnsProgrammatically after all animations complete
            }, 100);
            demoTimeouts.push(timeoutId);
        }
    }
    
    // Start the animation
    const frameId = requestAnimationFrame(animate);
    demoAnimationFrames.push(frameId);
}
    
// Function to scroll both columns programmatically
// Both columns scroll simultaneously with smooth continuous motion
function scrollBothColumnsProgrammatically(duration) {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) {
        return;
    }
    
    // Clear any previous demo timeouts and animation frames
    cancelDemoAnimations();
    
    // CRITICAL: Reset userInteracted and hasScrolledScrollbar when demo starts
    // This ensures START only appears on first user scroll AFTER demo ends, not before
    userInteracted = false;
    hasScrolledScrollbar = false;
    
    // Set demo active flag at the start of demo
    isDemoActive = true;
    
    // Note: demo-active class is already added in startEntryAnimation()
    // to prevent text from appearing before demo starts
    // This ensures text stays hidden throughout the demo
    
    // Demo duration: ~5 seconds for roulette-style scroll
    // Extended to give more time for the fast spinning phase
    const phaseDuration = 5000;
    
    // Both columns scroll simultaneously
    // Right column scrolls UP, left column scrolls DOWN
    // Scroll amounts chosen to land on specific colors: orange (left) and green (right)
    scrollColumnProgrammatically(rightColumn, phaseDuration, -9); // Up 9 items (1.5 rotations) → lands on green (ירוק)
    scrollColumnProgrammatically(leftColumn, phaseDuration, 6);   // Down 6 items (1 rotation) → lands on orange (כתום)
    
    // Cleanup after animation fully completes - show text only at the end
    const cleanupTimeout = setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8781',message:'Cleanup timeout START',data:{isDemoActive,introTextChanged,initialInstructionTextShown},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'intro'})}).catch(()=>{});
        // #endregion
        
        // Check if demo was cancelled
        if (!isDemoActive) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8784',message:'Cleanup SKIPPED - demo was cancelled',data:{isDemoActive},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'intro'})}).catch(()=>{});
            // #endregion
            return;
        }
        
        isDemoActive = false;
        
        // CRITICAL: Set grace period flag to prevent START from triggering immediately
        // This prevents scroll-snap and residual events from triggering START
        demoJustEnded = true;
        userInteracted = false;
        hasScrolledScrollbar = false;
        
        // Clear grace period after 300ms - allows real user interaction to trigger START
        setTimeout(() => {
            demoJustEnded = false;
        }, 300);
        
        // Remove demo-active class to show instruction text again
        const gradientContainer = document.getElementById('gradient-intro-container');
        
        // #region agent log
        const classListBefore = gradientContainer ? gradientContainer.className : 'no container';
        fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8789',message:'Before class changes',data:{classListBefore,hasContainer:!!gradientContainer},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'css'})}).catch(()=>{});
        // #endregion
        
        if (gradientContainer) {
            gradientContainer.classList.remove('demo-active');
            // Ensure intro-active class is present for CSS rules to work
            if (!gradientContainer.classList.contains('intro-active')) {
                gradientContainer.classList.add('intro-active');
            }
            
            // #region agent log
            const classListAfter = gradientContainer.className;
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8798',message:'After class changes',data:{classListAfter,hasDemoActive:gradientContainer.classList.contains('demo-active'),hasIntroActive:gradientContainer.classList.contains('intro-active')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'css'})}).catch(()=>{});
            // #endregion
        }
        
        // Show instruction text (only if not already changed to START)
        const introText = document.getElementById('gradient-intro-text');
        // Check if text exists and either hasn't been changed yet, or current text is not the initial instruction text
        const currentText = introText ? introText.textContent.trim().toLowerCase() : '';
        const isCurrentlyStart = currentText === '[start]';
        const hasInitialText = currentText.includes('synesthesia') || currentText.includes('scroll');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8805',message:'Intro text check',data:{hasIntroText:!!introText,currentText,isCurrentlyStart,hasInitialText,introTextChanged,willShow:introText&&(!introTextChanged||(!isCurrentlyStart&&!hasInitialText))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'intro'})}).catch(()=>{});
        // #endregion
        
        if (introText && (!introTextChanged || (!isCurrentlyStart && !hasInitialText))) {
            // Restore initial instruction text content
            introText.innerHTML = INITIAL_INSTRUCTION_TEXT;
            // Remove any inline styles that might override CSS
            introText.style.cursor = '';
            introText.style.pointerEvents = '';
            // Ensure text is visible (display and visibility) - override any CSS that might hide it
            introText.style.display = 'flex';
            introText.style.visibility = 'visible';
            // Force opacity to be visible (override CSS if needed)
            introText.style.opacity = '1';
            // Reset transform to trigger smooth animation
            introText.style.transform = 'translateY(10px)';
            // Force reflow to ensure transform reset is applied
            void introText.offsetHeight;
            // Update gradient intro to position text correctly
            updateGradientIntro();
            // Mark that initial instruction text has been shown immediately
            initialInstructionTextShown = true;
            
            // #region agent log
            const computedStyle = window.getComputedStyle(introText);
            const textRect = introText.getBoundingClientRect();
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8823',message:'Intro text SHOWN',data:{initialInstructionTextShown,textContent:introText.textContent.substring(0,50),computedOpacity:computedStyle.opacity,computedVisibility:computedStyle.visibility,computedDisplay:computedStyle.display,inlineOpacity:introText.style.opacity,inlineDisplay:introText.style.display,position:{top:textRect.top,left:textRect.left,width:textRect.width,height:textRect.height},windowSize:{w:window.innerWidth,h:window.innerHeight},zIndex:computedStyle.zIndex,color:computedStyle.color},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'intro'})}).catch(()=>{});
            // #endregion
            
            // Also log after a short delay to see if something changes
            setTimeout(() => {
                // #region agent log
                const delayedComputedStyle = window.getComputedStyle(introText);
                const delayedRect = introText.getBoundingClientRect();
                fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8835',message:'Intro text AFTER 100ms',data:{computedOpacity:delayedComputedStyle.opacity,computedVisibility:delayedComputedStyle.visibility,computedDisplay:delayedComputedStyle.display,position:{top:delayedRect.top,left:delayedRect.left,width:delayedRect.width,height:delayedRect.height}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'intro'})}).catch(()=>{});
                // #endregion
            }, 100);
            
            // Remove inline transform to let CSS transition handle the animation
            // But keep opacity: 1 to ensure text stays visible
            const transformTimeout = setTimeout(() => {
                introText.style.transform = '';
                // DO NOT remove opacity - keep it at 1 to ensure text is always visible
                // CSS will handle the transition, but we keep opacity: 1 as fallback
            }, 0);
            demoTimeouts.push(transformTimeout);
            // CSS will handle visibility via intro-active class (opacity: 1 !important)
            // But we keep inline opacity: 1 to ensure text is always visible even if CSS fails
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/673ee941-da56-4033-8389-74ba604e06d4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:8851',message:'Intro text NOT shown - condition failed',data:{hasIntroText:!!introText,introTextChanged,isCurrentlyStart,hasInitialText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'intro'})}).catch(()=>{});
            // #endregion
        }
    }, phaseDuration); // Show text only after animation fully completes
    demoTimeouts.push(cleanupTimeout);
}

// Function to trigger demo when intro is in active phase
// Note: Text may be hidden by demo-active class, so we don't check text visibility
function triggerDemo() {
    const introText = document.getElementById('gradient-intro-text');
    if (!introText) {
        return;
    }
        
    // Check if gradients have collapsed (intro-active phase)
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer || !gradientContainer.classList.contains('intro-active')) {
        return;
    }
    
    // Check if text contains instruction text (not "[start]")
    // This ensures we only trigger demo for initial instruction text, not START
    const currentText = introText.textContent.trim().toLowerCase();
    if (!currentText.includes('synesthesia') && !currentText.includes('scroll')) {
        return;
    }
    
    // Trigger demo - scroll both columns with default duration (3 seconds for visible continuous motion)
    // Note: Text is already hidden by demo-active class, so it will stay hidden during demo
    scrollBothColumnsProgrammatically();
}

