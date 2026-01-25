// Array of colors in order
const colors = ['#EF4538', '#891951', '#FAB01B', '#007A6F', '#EB4781', '#293990'];

// Array of words for each color (matching colors array order)
// כתום- shape, סגול- sound, צהוב- letter, ירוק- number, ורוד- emotion, כחול- color
const colorWords = ['shape', 'sound', 'letter', 'number', 'emotion', 'color'];

// Initial instruction text content (shown after demo ends, before user scrolls)
// Split into two lines for independent positioning on different gradient rectangles
const INTRO_LINE_1_TEXT = '[an experience where one sense triggers another]';
const INTRO_LINE_2_TEXT = '[scroll the bars to combine senses]';
// Legacy constant for backward compatibility (used in some checks)
const INITIAL_INSTRUCTION_TEXT = '<span class="intro-line">' + INTRO_LINE_1_TEXT + '</span><div style="margin-top: 21px;"><span class="intro-line">' + INTRO_LINE_2_TEXT + '</span></div>';

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
let scrollHintAnimationTriggered = false; // Flag to prevent multiple scroll hint animations
let scrollHintAnimationActive = false; // Flag to track if scroll hint animation is currently running
const SCROLL_THRESHOLD = 3000; // Threshold for full collapse (3x slower: requires ~3 scroll gestures to complete collapse)

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
    
    // Initialize LETTER & COLOR text box visibility
    updateLetterColorTextBox(initialPageId);
    
    // Initialize SOUND & SHAPE instruction text visibility
    updateSoundShapeInstructionText(initialPageId);
    
    // Initialize Letter + Letter circle visibility
    updateLetterLetterCircle(initialPageId);
    
    // Initialize Number + Number circle visibility
    updateNumberNumberCircle(initialPageId);
    
    // Initialize Shape + Color canvas (drag shapes with colored gradient trails)
    initializeShapeColorCanvas();
    
    // Initialize Shape + Color canvas visibility
    updateShapeColorCanvasVisibility(initialPageId);
    
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
    
    // Initialize Number + Emotion digits visibility
    updateNumberEmotionDigits(initialPageId);
    
    // Initialize Shape + Shape canvas visibility (ellipses interaction)
    updateShapeShapeCanvasVisibility(initialPageId);
    
    // Initialize Shape & Number canvas (not using p5.js)
    initializeShapeNumberCanvas();
    
    // Initialize Sound & Shape canvas (not using p5.js)
    initializeSoundShapeCanvas();
    
    // Initialize Sound & Shape visibility
    updateSoundShapeCanvasVisibility(initialPageId);
    
    // Initialize Sound + Emotion smiley visibility
    updateSoundEmotionVisibility(initialPageId);
    
    // Initialize SYN logo hover effect
    initializeSynHoverEffect();
    
    // Initialize color key click effect
    initializeColorKeyClickEffect();
    
    // Initialize INDEX hover effect (shows white overlay on canvas)
    initializeIndexHoverEffect();
    
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
    
    // Initialize index quote previews
    initializeIndexQuotePreviews();
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

// Initialize index quote previews - populate each index item with a truncated quote
function initializeIndexQuotePreviews() {
    const indexItems = document.querySelectorAll('.index-item');
    
    indexItems.forEach(item => {
        const leftIndex = item.dataset.left;
        const rightIndex = item.dataset.right;
        const pageId = `${leftIndex}-${rightIndex}`;
        
        // Get the quote text for this page
        const quoteText = canvasTextBoxContent[pageId] || '';
        
        // Find the quote span element
        const quoteSpan = item.querySelector('.index-item-quote');
        if (quoteSpan && quoteText) {
            // Set the full quote text - CSS will handle truncation with ellipsis
            quoteSpan.textContent = quoteText;
        }
    });
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
                // setupStartButton() now handles the full animation sequence:
                // 1. Animate instruction lines out (slide down)
                // 2. Wait 500ms
                // 3. Show START button with fade-in animation
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
                // setupStartButton() now handles the full animation sequence:
                // 1. Animate instruction lines out (slide down)
                // 2. Wait 500ms
                // 3. Show START button with fade-in animation
            }
        }
    }, { passive: true });
}

// Prevent page scrolling with mouse wheel when not over a column or index overlay
document.addEventListener('wheel', (e) => {
    const target = e.target;
    const isInColumn = target.closest('.column-container');
    const isInIndexOverlay = target.closest('.index-page-overlay');
    
    // Allow scrolling on columns and on the visible index overlay
    if (!isInColumn && !isInIndexOverlay) {
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
    
    // 15. Sound + Number (סאונד + ספרה) - sound=1, number=3
    '1-3': '"For me, the world of sounds is a world of visual mathematics. When I hear a drum beat, I see a sequence of numbers flashing to the rhythm of the music. Every sound has a numerical \'value\'- sharp, high-pitched sounds feel like the numbers 1 or 4, while deeper sounds look like larger, rounder numbers like 8 or 0. When I listen to a song, every musical note is immediately translated into a different digit."',
    '3-1': '"For me, the world of sounds is a world of visual mathematics. When I hear a drum beat, I see a sequence of numbers flashing to the rhythm of the music. Every sound has a numerical \'value\'- sharp, high-pitched sounds feel like the numbers 1 or 4, while deeper sounds look like larger, rounder numbers like 8 or 0. When I listen to a song, every musical note is immediately translated into a different digit."',
    
    // 16. Emotion + Number (רגש + ספרות) - emotion=4, number=3
    '4-3': '"Numbers have social lives. 1 is very lonely and a bit of an elitist. 2 is kind and motherly, always looking after 1. 3 is a bratty child, and 4 is a grumpy old man who is tired of 3\'s antics. 7 is the \'cool\' teenager of the group, very aloof and mysterious. When I see a phone number, I don\'t just see digits; I see a whole family dynamic playing out in a row."',
    
    // ==================
    // SAME-TYPE PAGES (Definition Texts)
    // ==================
    
    // 17. Shape + Shape (צורה + צורה) - shape=0, shape=0
    '0-0': 'Shape is the external appearance or outline of an object, defining the boundary with its surroundings. It focuses on geometric structures like circles or squares, regardless of color or material. This "silhouette" allows our eyes to identify and distinguish different objects in space. Categorizing these outlines helps us effectively organize and interpret the physical world.',
    
    // 18. Sound + Sound (סאונד + סאונד) - sound=1, sound=1
    '1-1': 'Sound is a physical vibration traveling as a wave through matter until reaching the ear. The brain translates these waves into hearing, allowing us to perceive voices and noises. Characterized by varying frequencies, it is a fundamental element of communication and environmental awareness. This sensory input enables music, conversation, and alertness to changes in our surroundings.',
    
    // 19. Letter + Letter (אות + אות) - letter=2, letter=2
    '2-2': 'A letter is a graphic symbol serving as the basic building block of writing and language. It represents specific speech sounds, translating spoken language into a visual form. Combinations of letters create words and sentences for conveying information and knowledge. Through standardized symbols, humans record history and communicate across vast distances and time.',
    
    // 20. Number + Number (ספרה + ספרה) - number=3, number=3
    '3-3': 'A number is an abstract concept describing quantity, measurement, counting, or position within a series. Digits are specific symbols representing these values visually. As a fundamental tool in logic and mathematics, numbers help organize data and perform calculations. Beyond counting, numerical systems provide the framework for scientific discovery and modern global infrastructure.',
    
    // 21. Emotion + Emotion (רגש + רגש) - emotion=4, emotion=4
    '4-4': 'Emotion is an internal reaction triggered by thoughts, events, or social interactions. Expressed through subjective feelings like joy or fear, it is often accompanied by physiological changes. Emotions help us evaluate situations, make decisions, and respond to our world. While personal, these states are expressed through facial and body language, fostering empathy and connection.',
    
    // 22. Color + Color (צבע + צבע) - color=5, color=5
    '5-5': 'Color is a visual experience where the brain interprets how objects reflect or emit light. The human eye detects electromagnetic wavelengths, translating them into the visible hues we see. This element helps us distinguish details, identify objects, and provide aesthetic meaning. Cultural and biological factors influence perception, attaching symbolic meanings like danger or peace to specific shades.'
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
        bgBlock.style.width = `${lineWidth + 41}px`; // 35px left + lineWidth + 6px right extension
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
        textElement.style.marginLeft = '6px'; // Move text 6px to the right
        
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
    
    // Always hide instruction text (removed for SHAPE & COLOR pages)
    instructionText.classList.remove('visible');
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
    // Store as RADIAL displacement (single number): positive = away from center, negative = toward center
    // Start with items pushed to their maximum distance from center
    if (!letterNumberDisplacements) {
        letterNumberDisplacements = [];
        
        for (let i = 0; i < LETTER_NUMBER_TOTAL_ITEMS; i++) {
            // Start at maximum radial displacement (pushed outward as far as possible)
            letterNumberDisplacements.push(LETTER_NUMBER_MAX_DISPLACEMENT);
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
        
        // Apply radial displacement in the current angle direction
        // This ensures displacement rotates with the element, maintaining constant distance from center
        const radialDisp = letterNumberDisplacements[index];
        const dirX = Math.cos(angle); // Current outward direction based on rotation
        const dirY = Math.sin(angle);
        let finalX = baseX + dirX * radialDisp;
        let finalY = baseY + dirY * radialDisp;
        
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
// Smart push: mouse outside circle pushes inward, mouse inside circle pushes outward
// Uses RADIAL displacement (single number) that rotates with the element
function applyLetterNumberRepulsion() {
    const container = document.getElementById('letter-number-circle-container');
    if (!container) return;
    
    const centerX = 350;
    const centerY = 350;
    
    for (let i = 0; i < LETTER_NUMBER_TOTAL_ITEMS; i++) {
        // Calculate current base position on circle
        const angle = (i / LETTER_NUMBER_TOTAL_ITEMS) * 2 * Math.PI + letterNumberRotationOffset;
        const baseX = centerX + LETTER_NUMBER_RADIUS * Math.cos(angle);
        const baseY = centerY + LETTER_NUMBER_RADIUS * Math.sin(angle);
        
        // Current radial displacement
        const radialDisp = letterNumberDisplacements[i];
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        
        // Current position with radial displacement
        const currentX = baseX + dirX * radialDisp;
        const currentY = baseY + dirY * radialDisp;
        
        // Calculate distance from mouse (mouse position is relative to center)
        const mouseAbsX = centerX + letterNumberMousePosition.x;
        const mouseAbsY = centerY + letterNumberMousePosition.y;
        
        const dx = currentX - mouseAbsX;
        const dy = currentY - mouseAbsY;
        const distanceFromMouse = Math.sqrt(dx * dx + dy * dy);
        
        // Apply repulsion if within range
        if (distanceFromMouse < LETTER_NUMBER_REPULSION_RADIUS && distanceFromMouse > 0) {
            // Calculate repulsion force (stronger when closer)
            const force = (LETTER_NUMBER_REPULSION_RADIUS - distanceFromMouse) / LETTER_NUMBER_REPULSION_RADIUS;
            const repulsionStrength = force * 3; // Multiplier for responsiveness
            
            // Calculate distances from center to determine push direction
            const mouseDistFromCenter = Math.sqrt(
                letterNumberMousePosition.x * letterNumberMousePosition.x +
                letterNumberMousePosition.y * letterNumberMousePosition.y
            );
            const elementDistFromCenter = LETTER_NUMBER_RADIUS + radialDisp;
            
            let pushAmount;
            
            if (mouseDistFromCenter > elementDistFromCenter) {
                // Mouse is OUTSIDE (farther from center) - push element INWARD (decrease radial displacement)
                pushAmount = -repulsionStrength;
            } else {
                // Mouse is INSIDE (closer to center) - push element OUTWARD (increase radial displacement)
                pushAmount = repulsionStrength;
            }
            
            // Apply to radial displacement
            letterNumberDisplacements[i] += pushAmount;
            
            // Clamp displacement: minimum allows pushing toward center but not past it
            // Maximum is the defined MAX_DISPLACEMENT
            letterNumberDisplacements[i] = Math.max(-LETTER_NUMBER_RADIUS + 50, 
                Math.min(LETTER_NUMBER_MAX_DISPLACEMENT, letterNumberDisplacements[i]));
        }
    }
}

// Slowly return elements to their original position (when not being pushed by mouse)
// Uses RADIAL displacement (single number) - returns toward 0 (original circle position)
function applyLetterNumberReturnToOrigin() {
    if (!letterNumberDisplacements) return;
    
    const centerX = 350;
    const centerY = 350;
    
    for (let i = 0; i < LETTER_NUMBER_TOTAL_ITEMS; i++) {
        // Calculate current base position on circle
        const angle = (i / LETTER_NUMBER_TOTAL_ITEMS) * 2 * Math.PI + letterNumberRotationOffset;
        const baseX = centerX + LETTER_NUMBER_RADIUS * Math.cos(angle);
        const baseY = centerY + LETTER_NUMBER_RADIUS * Math.sin(angle);
        
        // Current radial displacement
        const radialDisp = letterNumberDisplacements[i];
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        
        // Current position with radial displacement
        const currentX = baseX + dirX * radialDisp;
        const currentY = baseY + dirY * radialDisp;
        
        // Check distance from mouse
        const mouseAbsX = centerX + letterNumberMousePosition.x;
        const mouseAbsY = centerY + letterNumberMousePosition.y;
        const dx = currentX - mouseAbsX;
        const dy = currentY - mouseAbsY;
        const distanceFromMouse = Math.sqrt(dx * dx + dy * dy);
        
        // Only return to origin if mouse is far enough away
        if (distanceFromMouse > LETTER_NUMBER_REPULSION_RADIUS) {
            // Slowly reduce radial displacement (move toward 0 = original circle position)
            letterNumberDisplacements[i] *= (1 - LETTER_NUMBER_RETURN_SPEED);
            
            // Snap to zero if very small (avoid floating point drift)
            if (Math.abs(letterNumberDisplacements[i]) < 0.1) {
                letterNumberDisplacements[i] = 0;
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
// NUMBER + EMOTION Digits
// ==================

// Store current positions of each digit (x, y offsets from initial position)
let numberEmotionDigitPositions = null;
let numberEmotionDragInitialized = false;
// Animation loop ID for behaviors
let numberEmotionAnimationId = null;
// Track which digit is currently being dragged (-1 means none)
let numberEmotionDraggingIndex = -1;
// Track which corner digit 1 is currently in (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
let digit1CurrentCorner = 1; // Start at top-right (rightmost)
// Flag to track if digit 1 has been positioned to a corner
let digit1CornerInitialized = false;
// Store the initial position of digit 1 (captured once when initialized, prevents race conditions)
let digit1InitialPosition = null;
// Timestamp of last digit 1 jump (for cooldown to prevent rapid jumps)
let digit1LastJumpTime = 0;
const DIGIT1_JUMP_COOLDOWN = 300; // Minimum ms between jumps

// Digit 3 bouncing state
let digit3BounceTime = 0; // Time counter for bounce animation
const DIGIT3_BOUNCE_AMPLITUDE = 100; // How high the bounce goes (in pixels)
const DIGIT3_BOUNCE_SPEED = 0.12; // How fast it bounces (radians per frame)

// Digit 4 repulsion state (for pushing digit 3 away)
let digit4IsEnlarged = false; // Tracks if digit 4 is currently scaled up
const DIGIT4_PROXIMITY_THRESHOLD = 200; // Distance in pixels to trigger repulsion
const DIGIT4_PUSH_DISTANCE = 50; // How far to push digit 3 away (in pixels)
const DIGIT4_ENLARGED_SCALE = 2; // Scale factor when enlarged

// Digit 7 animation timer (double jump + 360 rotation every 3 seconds)
let digit7AnimationTimerId = null;
const DIGIT7_ANIMATION_INTERVAL = 3000; // 3 seconds between animations

// Function to update Number + Emotion digits visibility
function updateNumberEmotionDigits(pageId) {
    const digitsContainer = document.getElementById('number-emotion-digits-container');
    const linesSvg = document.getElementById('number-emotion-lines-svg');
    if (!digitsContainer) return;
    
    // Show digits only for Number + Emotion pages (pageId "3-4" or "4-3")
    // Parameter indices: 3=number, 4=emotion
    const isNumberEmotionPage = pageId === '3-4' || pageId === '4-3';
    
    if (isNumberEmotionPage) {
        digitsContainer.classList.add('visible');
        if (linesSvg) linesSvg.classList.remove('hidden');
        // Initialize drag functionality when page becomes visible
        requestAnimationFrame(() => {
            initializeNumberEmotionDrag();
            // Start the behavior animation loop
            startNumberEmotionBehaviors();
        });
    } else {
        digitsContainer.classList.remove('visible');
        if (linesSvg) linesSvg.classList.add('hidden');
        // Reset positions when leaving the page
        resetNumberEmotionPositions();
    }
}

// ==================
// LETTER + EMOTION GRID
// ==================
// Draggable 3x5 grid with letters in each cell

// State variables for Letter + Emotion grid
let letterEmotionGridContainer = null;
let letterEmotionCells = [];
let letterEmotionDividersH = []; // Horizontal dividers (3)
let letterEmotionDividersV = []; // Vertical dividers (4)
// Asymmetric default layout matching the design
let letterEmotionRowHeights = [28, 12, 45, 15]; // WORDS medium, CARRY compressed, FEELS tall, empty small
let letterEmotionColWidths = [10, 35, 15, 25, 15]; // O/A/E column wide, others narrower
const LETTER_EMOTION_MIN_SIZE = 5; // Minimum percentage for row/column

// Drag state for grid dividers
let letterEmotionIsDragging = false;
let letterEmotionDragType = null; // 'h' for horizontal, 'v' for vertical
let letterEmotionDragIndex = -1;
let letterEmotionDragStartPos = 0;
let letterEmotionGridInitialized = false;

// Function to update Letter + Emotion grid visibility
function updateLetterEmotionGrid(pageId) {
    const gridContainer = document.getElementById('letter-emotion-grid-container');
    if (!gridContainer) return;
    
    // Show grid only for Letter + Emotion pages (pageId "2-4" or "4-2")
    // Parameter indices: 2=letter, 4=emotion
    const isLetterEmotionPage = pageId === '2-4' || pageId === '4-2';
    
    if (isLetterEmotionPage) {
        gridContainer.classList.remove('hidden');
        // Initialize grid when page becomes visible
        requestAnimationFrame(() => {
            initializeLetterEmotionGrid();
        });
    } else {
        gridContainer.classList.add('hidden');
    }
}

// Initialize Letter + Emotion grid
function initializeLetterEmotionGrid() {
    letterEmotionGridContainer = document.getElementById('letter-emotion-grid-container');
    if (!letterEmotionGridContainer) return;
    
    // Get all cells and dividers
    letterEmotionCells = Array.from(letterEmotionGridContainer.querySelectorAll('.letter-emotion-cell'));
    letterEmotionDividersH = Array.from(letterEmotionGridContainer.querySelectorAll('.letter-emotion-divider-h'));
    letterEmotionDividersV = Array.from(letterEmotionGridContainer.querySelectorAll('.letter-emotion-divider-v'));
    
    // Reset to asymmetric initial sizes matching the design (3 rows only)
    letterEmotionRowHeights = [28, 12, 60]; // WORDS medium, CARRY compressed, FEELS tall
    letterEmotionColWidths = [10, 35, 15, 25, 15]; // O/A/E column wide, others narrower
    
    // Apply initial layout
    updateLetterEmotionGridLayout();
    
    // Only add event listeners once
    if (letterEmotionGridInitialized) return;
    letterEmotionGridInitialized = true;
    
    // Add mouse event listeners for dividers
    letterEmotionDividersH.forEach((divider, index) => {
        divider.addEventListener('mousedown', (e) => handleLetterEmotionDividerMouseDown(e, 'h', index));
    });
    
    letterEmotionDividersV.forEach((divider, index) => {
        divider.addEventListener('mousedown', (e) => handleLetterEmotionDividerMouseDown(e, 'v', index));
    });
    
    // Add document-level mouse move and up handlers
    document.addEventListener('mousemove', handleLetterEmotionDividerMouseMove);
    document.addEventListener('mouseup', handleLetterEmotionDividerMouseUp);
    
    // Add touch event listeners for dividers
    letterEmotionDividersH.forEach((divider, index) => {
        divider.addEventListener('touchstart', (e) => handleLetterEmotionDividerTouchStart(e, 'h', index), { passive: false });
    });
    
    letterEmotionDividersV.forEach((divider, index) => {
        divider.addEventListener('touchstart', (e) => handleLetterEmotionDividerTouchStart(e, 'v', index), { passive: false });
    });
    
    document.addEventListener('touchmove', handleLetterEmotionDividerTouchMove, { passive: false });
    document.addEventListener('touchend', handleLetterEmotionDividerTouchEnd);
}

// Update the visual layout of the grid based on current row heights and column widths
function updateLetterEmotionGridLayout() {
    if (!letterEmotionGridContainer) return;
    
    const containerRect = letterEmotionGridContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate cumulative positions for rows
    let rowPositions = [0]; // Start positions for each row
    for (let i = 0; i < letterEmotionRowHeights.length; i++) {
        rowPositions.push(rowPositions[i] + letterEmotionRowHeights[i]);
    }
    
    // Calculate cumulative positions for columns
    let colPositions = [0]; // Start positions for each column
    for (let i = 0; i < letterEmotionColWidths.length; i++) {
        colPositions.push(colPositions[i] + letterEmotionColWidths[i]);
    }
    
    // Position each cell
    letterEmotionCells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        const top = (rowPositions[row] / 100) * containerHeight;
        const left = (colPositions[col] / 100) * containerWidth;
        const height = (letterEmotionRowHeights[row] / 100) * containerHeight;
        const width = (letterEmotionColWidths[col] / 100) * containerWidth;
        
        cell.style.top = `${top}px`;
        cell.style.left = `${left}px`;
        cell.style.height = `${height}px`;
        cell.style.width = `${width}px`;
    });
    
    // Position horizontal dividers (between rows)
    letterEmotionDividersH.forEach((divider, index) => {
        const top = (rowPositions[index + 1] / 100) * containerHeight - 1; // Center the 2px line
        divider.style.top = `${top}px`;
    });
    
    // Position vertical dividers (between columns)
    letterEmotionDividersV.forEach((divider, index) => {
        const left = (colPositions[index + 1] / 100) * containerWidth - 1; // Center the 2px line
        divider.style.left = `${left}px`;
    });
}

// Mouse down handler for dividers
function handleLetterEmotionDividerMouseDown(e, type, index) {
    e.preventDefault();
    
    letterEmotionIsDragging = true;
    letterEmotionDragType = type;
    letterEmotionDragIndex = index;
    letterEmotionDragStartPos = type === 'h' ? e.clientY : e.clientX;
    
    // Add visual feedback
    const divider = type === 'h' ? letterEmotionDividersH[index] : letterEmotionDividersV[index];
    divider.classList.add('active');
    letterEmotionGridContainer.classList.add(type === 'h' ? 'dragging-h' : 'dragging-v');
}

// Mouse move handler for dividers
function handleLetterEmotionDividerMouseMove(e) {
    if (!letterEmotionIsDragging) return;
    
    e.preventDefault();
    
    const containerRect = letterEmotionGridContainer.getBoundingClientRect();
    
    if (letterEmotionDragType === 'h') {
        // Horizontal divider - affects row heights
        const deltaY = e.clientY - letterEmotionDragStartPos;
        const deltaPercent = (deltaY / containerRect.height) * 100;
        
        resizeLetterEmotionRows(letterEmotionDragIndex, deltaPercent);
        letterEmotionDragStartPos = e.clientY;
    } else {
        // Vertical divider - affects column widths
        const deltaX = e.clientX - letterEmotionDragStartPos;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        
        resizeLetterEmotionColumns(letterEmotionDragIndex, deltaPercent);
        letterEmotionDragStartPos = e.clientX;
    }
    
    updateLetterEmotionGridLayout();
}

// Mouse up handler for dividers
function handleLetterEmotionDividerMouseUp(e) {
    if (!letterEmotionIsDragging) return;
    
    // Remove visual feedback
    const divider = letterEmotionDragType === 'h' 
        ? letterEmotionDividersH[letterEmotionDragIndex] 
        : letterEmotionDividersV[letterEmotionDragIndex];
    
    if (divider) divider.classList.remove('active');
    letterEmotionGridContainer.classList.remove('dragging-h', 'dragging-v');
    
    letterEmotionIsDragging = false;
    letterEmotionDragType = null;
    letterEmotionDragIndex = -1;
}

// Touch start handler for dividers
function handleLetterEmotionDividerTouchStart(e, type, index) {
    if (!e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    letterEmotionIsDragging = true;
    letterEmotionDragType = type;
    letterEmotionDragIndex = index;
    letterEmotionDragStartPos = type === 'h' ? touch.clientY : touch.clientX;
    
    // Add visual feedback
    const divider = type === 'h' ? letterEmotionDividersH[index] : letterEmotionDividersV[index];
    divider.classList.add('active');
    letterEmotionGridContainer.classList.add(type === 'h' ? 'dragging-h' : 'dragging-v');
}

// Touch move handler for dividers
function handleLetterEmotionDividerTouchMove(e) {
    if (!letterEmotionIsDragging) return;
    if (!e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const containerRect = letterEmotionGridContainer.getBoundingClientRect();
    
    if (letterEmotionDragType === 'h') {
        const deltaY = touch.clientY - letterEmotionDragStartPos;
        const deltaPercent = (deltaY / containerRect.height) * 100;
        
        resizeLetterEmotionRows(letterEmotionDragIndex, deltaPercent);
        letterEmotionDragStartPos = touch.clientY;
    } else {
        const deltaX = touch.clientX - letterEmotionDragStartPos;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        
        resizeLetterEmotionColumns(letterEmotionDragIndex, deltaPercent);
        letterEmotionDragStartPos = touch.clientX;
    }
    
    updateLetterEmotionGridLayout();
}

// Touch end handler for dividers
function handleLetterEmotionDividerTouchEnd(e) {
    if (!letterEmotionIsDragging) return;
    
    // Remove visual feedback
    const divider = letterEmotionDragType === 'h' 
        ? letterEmotionDividersH[letterEmotionDragIndex] 
        : letterEmotionDividersV[letterEmotionDragIndex];
    
    if (divider) divider.classList.remove('active');
    letterEmotionGridContainer.classList.remove('dragging-h', 'dragging-v');
    
    letterEmotionIsDragging = false;
    letterEmotionDragType = null;
    letterEmotionDragIndex = -1;
}

// Resize adjacent rows (accordion style)
function resizeLetterEmotionRows(dividerIndex, deltaPercent) {
    // Divider at index i is between row i and row i+1
    const topRowIndex = dividerIndex;
    const bottomRowIndex = dividerIndex + 1;
    
    // Calculate new heights
    let newTopHeight = letterEmotionRowHeights[topRowIndex] + deltaPercent;
    let newBottomHeight = letterEmotionRowHeights[bottomRowIndex] - deltaPercent;
    
    // Enforce minimum size constraints
    if (newTopHeight < LETTER_EMOTION_MIN_SIZE) {
        const adjustment = LETTER_EMOTION_MIN_SIZE - newTopHeight;
        newTopHeight = LETTER_EMOTION_MIN_SIZE;
        newBottomHeight -= adjustment;
    }
    
    if (newBottomHeight < LETTER_EMOTION_MIN_SIZE) {
        const adjustment = LETTER_EMOTION_MIN_SIZE - newBottomHeight;
        newBottomHeight = LETTER_EMOTION_MIN_SIZE;
        newTopHeight -= adjustment;
    }
    
    // Final clamp
    if (newTopHeight >= LETTER_EMOTION_MIN_SIZE && newBottomHeight >= LETTER_EMOTION_MIN_SIZE) {
        letterEmotionRowHeights[topRowIndex] = newTopHeight;
        letterEmotionRowHeights[bottomRowIndex] = newBottomHeight;
    }
}

// Resize adjacent columns (accordion style)
function resizeLetterEmotionColumns(dividerIndex, deltaPercent) {
    // Divider at index i is between column i and column i+1
    const leftColIndex = dividerIndex;
    const rightColIndex = dividerIndex + 1;
    
    // Calculate new widths
    let newLeftWidth = letterEmotionColWidths[leftColIndex] + deltaPercent;
    let newRightWidth = letterEmotionColWidths[rightColIndex] - deltaPercent;
    
    // Enforce minimum size constraints
    if (newLeftWidth < LETTER_EMOTION_MIN_SIZE) {
        const adjustment = LETTER_EMOTION_MIN_SIZE - newLeftWidth;
        newLeftWidth = LETTER_EMOTION_MIN_SIZE;
        newRightWidth -= adjustment;
    }
    
    if (newRightWidth < LETTER_EMOTION_MIN_SIZE) {
        const adjustment = LETTER_EMOTION_MIN_SIZE - newRightWidth;
        newRightWidth = LETTER_EMOTION_MIN_SIZE;
        newLeftWidth -= adjustment;
    }
    
    // Final clamp
    if (newLeftWidth >= LETTER_EMOTION_MIN_SIZE && newRightWidth >= LETTER_EMOTION_MIN_SIZE) {
        letterEmotionColWidths[leftColIndex] = newLeftWidth;
        letterEmotionColWidths[rightColIndex] = newRightWidth;
    }
}

// Initialize positions array (all start at 0,0 offset)
function getInitialNumberEmotionPositions() {
    return [
        { x: 0, y: 0 }, // digit 1
        { x: 0, y: 0 }, // digit 2
        { x: 0, y: 0 }, // digit 3
        { x: 0, y: 0 }, // digit 4
        { x: 0, y: 0 }  // digit 7
    ];
}

// Update digit position visually using CSS transform
function updateNumberEmotionDigitPosition(digit, index) {
    if (!numberEmotionDigitPositions || !numberEmotionDigitPositions[index]) return;
    
    const pos = numberEmotionDigitPositions[index];
    digit.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    
    // Update the line connecting this digit to center
    updateNumberEmotionLine(digit, index);
}

// Update the SVG line connecting center to a specific digit
function updateNumberEmotionLine(digitElement, index) {
    const line = document.getElementById(`number-emotion-line-${index}`);
    if (!line) return;
    
    // Get canvas container for center calculation and coordinate reference
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;
    
    const canvasRect = canvasContainer.getBoundingClientRect();
    
    // Center of canvas (relative to canvas container since SVG is positioned absolutely within it)
    const centerX = canvasRect.width / 2;
    const centerY = canvasRect.height / 2;
    
    // Get digit center (screen coordinates)
    const digitRect = digitElement.getBoundingClientRect();
    const digitCenterX = digitRect.left + digitRect.width / 2;
    const digitCenterY = digitRect.top + digitRect.height / 2;
    
    // Convert digit position to canvas-container relative coordinates
    const digitRelativeX = digitCenterX - canvasRect.left;
    const digitRelativeY = digitCenterY - canvasRect.top;
    
    // Calculate end point - shorten only for digit 4 (index 3)
    let endX = digitRelativeX;
    let endY = digitRelativeY;
    
    if (index === 3) {
        // Only shorten the line for digit 4
        const dx = digitRelativeX - centerX;
        const dy = digitRelativeY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Shorten by 38% of digit width
        const shortenAmount = digitRect.width * 0.38;
        
        if (distance > shortenAmount) {
            const normX = dx / distance;
            const normY = dy / distance;
            endX = digitRelativeX - normX * shortenAmount;
            endY = digitRelativeY - normY * shortenAmount;
        }
    }
    
    // Set line coordinates (relative to canvas-container)
    line.setAttribute('x1', centerX);
    line.setAttribute('y1', centerY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
}

// Update all number-emotion lines
function updateAllNumberEmotionLines() {
    const container = document.getElementById('number-emotion-digits-container');
    if (!container) return;
    
    const digits = container.querySelectorAll('.number-emotion-digit');
    digits.forEach((digit, index) => {
        updateNumberEmotionLine(digit, index);
    });
}

// Initialize drag functionality for Number + Emotion digits
function initializeNumberEmotionDrag() {
    const container = document.getElementById('number-emotion-digits-container');
    if (!container) return;
    
    const digits = container.querySelectorAll('.number-emotion-digit');
    if (digits.length === 0) return;
    
    // Initialize positions if not already set
    if (!numberEmotionDigitPositions) {
        numberEmotionDigitPositions = getInitialNumberEmotionPositions();
    }
    
    // Apply initial positions
    digits.forEach((digit, index) => {
        updateNumberEmotionDigitPosition(digit, index);
    });
    
    // Update lines after a short delay to ensure DOM is ready
    requestAnimationFrame(() => {
        updateAllNumberEmotionLines();
    });
    
    // Only add event listeners once
    if (numberEmotionDragInitialized) return;
    
    // Get canvas container bounds for constraining drag
    const canvasContainer = document.getElementById('canvas-container');
    
    digits.forEach((digit, index) => {
        let isDragging = false;
        let startX, startY;
        let startPosX, startPosY;
        
        // Mouse down - start dragging (or jump for digit 1)
        digit.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            // Digit 1 (index 0) jumps to a random corner when clicked/dragged
            if (index === 0) {
                moveDigit1ToRandomCorner(digit);
                return; // Don't allow normal dragging
            }
            
            isDragging = true;
            numberEmotionDraggingIndex = index; // Track which digit is being dragged
            digit.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            startPosX = numberEmotionDigitPositions[index].x;
            startPosY = numberEmotionDigitPositions[index].y;
            
            // Add global mouse move and up listeners
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Calculate new position (free movement on both axes)
            let newX = startPosX + dx;
            let newY = startPosY + dy;
            
            // Constrain to canvas bounds
            const digitRect = digit.getBoundingClientRect();
            const canvasRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
            
            if (canvasRect) {
                // Calculate how far the digit can move while staying within canvas bounds
                // Account for the digit's current position and size
                const digitWidth = digitRect.width;
                const digitHeight = digitRect.height;
                
                // Get the digit's initial position (before any transform)
                const digitInitialLeft = digitRect.left - numberEmotionDigitPositions[index].x;
                const digitInitialTop = digitRect.top - numberEmotionDigitPositions[index].y;
                
                // Calculate max movement in each direction
                const padding = 20; // Small padding from edges
                const maxLeft = canvasRect.left - digitInitialLeft + padding;
                const maxRight = canvasRect.right - digitInitialLeft - digitWidth - padding;
                const maxTop = canvasRect.top - digitInitialTop + padding;
                const maxBottom = canvasRect.bottom - digitInitialTop - digitHeight - padding;
                
                // Clamp position
                newX = Math.max(maxLeft, Math.min(maxRight, newX));
                newY = Math.max(maxTop, Math.min(maxBottom, newY));
            }
            
            // Update position
            numberEmotionDigitPositions[index].x = newX;
            numberEmotionDigitPositions[index].y = newY;
            
            // Update visual position
            updateNumberEmotionDigitPosition(digit, index);
        }
        
        function onMouseUp() {
            isDragging = false;
            numberEmotionDraggingIndex = -1; // Clear dragging state
            digit.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        
        // Touch support for mobile (or jump for digit 1)
        digit.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // Digit 1 (index 0) jumps to a random corner when touched
            if (index === 0) {
                moveDigit1ToRandomCorner(digit);
                return; // Don't allow normal dragging
            }
            
            isDragging = true;
            numberEmotionDraggingIndex = index; // Track which digit is being dragged
            digit.classList.add('dragging');
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startPosX = numberEmotionDigitPositions[index].x;
            startPosY = numberEmotionDigitPositions[index].y;
            
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
            const digitRect = digit.getBoundingClientRect();
            const canvasRect = canvasContainer ? canvasContainer.getBoundingClientRect() : null;
            
            if (canvasRect) {
                const digitWidth = digitRect.width;
                const digitHeight = digitRect.height;
                
                const digitInitialLeft = digitRect.left - numberEmotionDigitPositions[index].x;
                const digitInitialTop = digitRect.top - numberEmotionDigitPositions[index].y;
                
                const padding = 20;
                const maxLeft = canvasRect.left - digitInitialLeft + padding;
                const maxRight = canvasRect.right - digitInitialLeft - digitWidth - padding;
                const maxTop = canvasRect.top - digitInitialTop + padding;
                const maxBottom = canvasRect.bottom - digitInitialTop - digitHeight - padding;
                
                newX = Math.max(maxLeft, Math.min(maxRight, newX));
                newY = Math.max(maxTop, Math.min(maxBottom, newY));
            }
            
            numberEmotionDigitPositions[index].x = newX;
            numberEmotionDigitPositions[index].y = newY;
            
            updateNumberEmotionDigitPosition(digit, index);
        }
        
        function onTouchEnd() {
            isDragging = false;
            numberEmotionDraggingIndex = -1; // Clear dragging state
            digit.classList.remove('dragging');
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        }
    });
    
    numberEmotionDragInitialized = true;
}

// Reset digit positions to initial layout
function resetNumberEmotionPositions() {
    // Stop the animation loop
    stopNumberEmotionBehaviors();
    
    numberEmotionDigitPositions = null;
    numberEmotionDragInitialized = false;
    numberEmotionDraggingIndex = -1;
    digit1CurrentCorner = 1; // Reset to top-right
    digit1CornerInitialized = false;
    digit1InitialPosition = null; // Reset stored initial position
    digit1LastJumpTime = 0; // Reset cooldown
    digit3BounceTime = 0; // Reset bounce animation
    digit4IsEnlarged = false; // Reset digit 4 scale state
    
    // Reset visual transforms
    const container = document.getElementById('number-emotion-digits-container');
    if (container) {
        const digits = container.querySelectorAll('.number-emotion-digit');
        digits.forEach((digit) => {
            digit.style.transform = '';
        });
    }
}

// ==================
// NUMBER + EMOTION Behavior System
// ==================

// Start the behavior animation loop
function startNumberEmotionBehaviors() {
    // Don't start if already running
    if (numberEmotionAnimationId !== null) return;
    
    // Start the loop
    updateNumberEmotionBehaviors();
    
    // Start digit 7 animation timer (runs every 5 seconds)
    if (digit7AnimationTimerId === null) {
        // Trigger first animation after 5 seconds
        digit7AnimationTimerId = setInterval(triggerDigit7Animation, DIGIT7_ANIMATION_INTERVAL);
    }
}

// Stop the behavior animation loop
function stopNumberEmotionBehaviors() {
    if (numberEmotionAnimationId !== null) {
        cancelAnimationFrame(numberEmotionAnimationId);
        numberEmotionAnimationId = null;
    }
    
    // Stop digit 7 animation timer
    if (digit7AnimationTimerId !== null) {
        clearInterval(digit7AnimationTimerId);
        digit7AnimationTimerId = null;
    }
}

// Trigger digit 7 double-jump + 360 rotation animation
function triggerDigit7Animation() {
    const container = document.getElementById('number-emotion-digits-container');
    if (!container || !container.classList.contains('visible')) return;
    
    // Find digit 7 (it's at index 4 in the array, data-digit="7")
    const digit7 = container.querySelector('.number-emotion-digit[data-digit="7"]');
    if (!digit7) return;
    
    // Set CSS custom properties for current position offset
    // This allows the animation to work from the digit's current position
    const pos = numberEmotionDigitPositions ? numberEmotionDigitPositions[4] : { x: 0, y: 0 };
    digit7.style.setProperty('--offset-x', `${pos.x}px`);
    digit7.style.setProperty('--offset-y', `${pos.y}px`);
    
    // Remove class first to reset animation if it's already playing
    digit7.classList.remove('digit7-animating');
    
    // Force reflow to ensure the class removal takes effect
    void digit7.offsetWidth;
    
    // Add the animation class
    digit7.classList.add('digit7-animating');
    
    // Remove the class after animation completes (1 second)
    setTimeout(() => {
        digit7.classList.remove('digit7-animating');
        // Restore the normal transform after animation
        if (numberEmotionDigitPositions && numberEmotionDigitPositions[4]) {
            digit7.style.transform = `translate(${numberEmotionDigitPositions[4].x}px, ${numberEmotionDigitPositions[4].y}px)`;
        }
        // Update line after animation ends
        updateNumberEmotionLine(digit7, 4);
    }, 1000);
}

// Main animation loop that updates all digit behaviors
function updateNumberEmotionBehaviors() {
    const container = document.getElementById('number-emotion-digits-container');
    if (!container || !container.classList.contains('visible')) {
        numberEmotionAnimationId = null;
        return;
    }
    
    const digits = container.querySelectorAll('.number-emotion-digit');
    if (digits.length === 0 || !numberEmotionDigitPositions) {
        numberEmotionAnimationId = requestAnimationFrame(updateNumberEmotionBehaviors);
        return;
    }
    
    // Update digit 1 repulsion behavior
    updateDigit1Repulsion(digits);
    
    // Update digit 2 following behavior
    updateDigit2Following(digits);
    
    // Update digit 4 repulsion behavior FIRST (pushes digit 3 away when approached)
    // Must run before bouncing so the position is updated before the transform is applied
    updateDigit4Repulsion(digits);
    
    // Update digit 3 bouncing behavior (applies the transform with bounce offset)
    updateDigit3Bouncing(digits);
    
    // Update all lines to stay connected to digits
    updateAllNumberEmotionLines();
    
    // Continue the loop
    numberEmotionAnimationId = requestAnimationFrame(updateNumberEmotionBehaviors);
}

// Calculate distance between two digit positions
function getDigitDistance(index1, index2) {
    if (!numberEmotionDigitPositions) return Infinity;
    
    const pos1 = numberEmotionDigitPositions[index1];
    const pos2 = numberEmotionDigitPositions[index2];
    
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    
    return Math.sqrt(dx * dx + dy * dy);
}

// Get center position of a digit in screen coordinates
function getDigitCenterPosition(digit, index) {
    const rect = digit.getBoundingClientRect();
    // Account for current transform offset
    const offsetX = numberEmotionDigitPositions ? numberEmotionDigitPositions[index].x : 0;
    const offsetY = numberEmotionDigitPositions ? numberEmotionDigitPositions[index].y : 0;
    
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        offsetX: offsetX,
        offsetY: offsetY
    };
}

// Get corner positions for digit 1 (returns offset from initial position)
function getDigit1CornerPositions(digit) {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer || !digit) return null;
    
    const canvasRect = canvasContainer.getBoundingClientRect();
    const digitRect = digit.getBoundingClientRect();
    const digitWidth = digitRect.width;
    const digitHeight = digitRect.height;
    
    // Use stored initial position if available (prevents race conditions)
    // Otherwise calculate it from current rect (only happens on first call)
    let digitInitialLeft, digitInitialTop;
    if (digit1InitialPosition) {
        digitInitialLeft = digit1InitialPosition.left;
        digitInitialTop = digit1InitialPosition.top;
    } else {
        // First time: calculate from current rect with offset 0 (digit hasn't moved yet)
        const currentOffset = numberEmotionDigitPositions ? numberEmotionDigitPositions[0] : { x: 0, y: 0 };
        digitInitialLeft = digitRect.left - currentOffset.x;
        digitInitialTop = digitRect.top - currentOffset.y;
        // Store for future use
        digit1InitialPosition = { left: digitInitialLeft, top: digitInitialTop, width: digitWidth, height: digitHeight };
    }
    
    const padding = 30;
    
    // Calculate corner positions as offsets from initial position
    const corners = [
        // 0: top-left
        { x: canvasRect.left - digitInitialLeft + padding, y: canvasRect.top - digitInitialTop + padding },
        // 1: top-right
        { x: canvasRect.right - digitInitialLeft - digitWidth - padding, y: canvasRect.top - digitInitialTop + padding },
        // 2: bottom-left
        { x: canvasRect.left - digitInitialLeft + padding, y: canvasRect.bottom - digitInitialTop - digitHeight - padding },
        // 3: bottom-right
        { x: canvasRect.right - digitInitialLeft - digitWidth - padding, y: canvasRect.bottom - digitInitialTop - digitHeight - padding }
    ];
    
    return corners;
}

// Move digit 1 to a specific corner
function moveDigit1ToCorner(digit, cornerIndex) {
    // Check cooldown to prevent rapid jumps (which cause race conditions)
    const now = Date.now();
    if (now - digit1LastJumpTime < DIGIT1_JUMP_COOLDOWN) {
        return; // Skip this jump, too soon after last one
    }
    
    const corners = getDigit1CornerPositions(digit);
    if (!corners || !numberEmotionDigitPositions) return;
    
    digit1LastJumpTime = now; // Update last jump time
    digit1CurrentCorner = cornerIndex;
    numberEmotionDigitPositions[0].x = corners[cornerIndex].x;
    numberEmotionDigitPositions[0].y = corners[cornerIndex].y;
    
    updateNumberEmotionDigitPosition(digit, 0);
}

// Move digit 1 to a random different corner
function moveDigit1ToRandomCorner(digit) {
    // Get a random corner that's not the current one
    let newCorner;
    do {
        newCorner = Math.floor(Math.random() * 4);
    } while (newCorner === digit1CurrentCorner);
    
    moveDigit1ToCorner(digit, newCorner);
}

// Initialize digit 1 to the rightmost corner (top-right)
function initializeDigit1Corner(digit) {
    if (digit1CornerInitialized) return;
    
    // Wait a frame for the digit to be positioned
    requestAnimationFrame(() => {
        moveDigit1ToCorner(digit, 1); // 1 = top-right
        digit1CornerInitialized = true;
    });
}

// Digit 1 Corner Behavior: lives only in corners, jumps when approached
function updateDigit1Repulsion(digits) {
    if (!numberEmotionDigitPositions || digits.length < 2) return;
    
    const digit1 = digits[0];
    const fleeRadius = 200; // Distance at which digit 1 jumps to another corner
    
    // Initialize to corner if not done yet
    if (!digit1CornerInitialized) {
        initializeDigit1Corner(digit1);
        return;
    }
    
    // Get digit 1's actual screen position (center point)
    const digit1Rect = digit1.getBoundingClientRect();
    const digit1CenterX = digit1Rect.left + digit1Rect.width / 2;
    const digit1CenterY = digit1Rect.top + digit1Rect.height / 2;
    
    // Check if any digit is too close (using actual screen positions)
    for (let i = 1; i < digits.length; i++) {
        const otherDigit = digits[i];
        const otherRect = otherDigit.getBoundingClientRect();
        const otherCenterX = otherRect.left + otherRect.width / 2;
        const otherCenterY = otherRect.top + otherRect.height / 2;
        
        const dx = otherCenterX - digit1CenterX;
        const dy = otherCenterY - digit1CenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If any digit is too close, jump to a different corner
        if (distance < fleeRadius) {
            moveDigit1ToRandomCorner(digit1);
            return; // Only jump once per frame
        }
    }
}

// Digit 2 Following: follows digit 3 with a slight delay (easing)
function updateDigit2Following(digits) {
    if (!numberEmotionDigitPositions || digits.length < 3) return;
    
    const digit2Index = 1; // Digit "2" is at index 1
    const digit3Index = 2; // Digit "3" is at index 2
    
    // Don't move digit 2 if it's being dragged
    if (numberEmotionDraggingIndex === digit2Index) return;
    
    const digit2 = digits[digit2Index];
    const pos2 = numberEmotionDigitPositions[digit2Index];
    const pos3 = numberEmotionDigitPositions[digit3Index];
    
    // Target position: follow digit 3 with a small offset to the left
    const followOffset = 60;
    const targetX = pos3.x - followOffset;
    const targetY = pos3.y;
    
    // Easing factor - lower = slower/more delay (0.08 = nice smooth follow)
    const easingFactor = 0.08;
    
    // Smoothly interpolate towards target position
    let newX = pos2.x + (targetX - pos2.x) * easingFactor;
    let newY = pos2.y + (targetY - pos2.y) * easingFactor;
    
    // Constrain to canvas bounds
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
        const canvasRect = canvasContainer.getBoundingClientRect();
        const digitRect = digit2.getBoundingClientRect();
        const digitWidth = digitRect.width;
        const digitHeight = digitRect.height;
        
        const digitInitialLeft = digitRect.left - pos2.x;
        const digitInitialTop = digitRect.top - pos2.y;
        
        const padding = 20;
        const maxLeft = canvasRect.left - digitInitialLeft + padding;
        const maxRight = canvasRect.right - digitInitialLeft - digitWidth - padding;
        const maxTop = canvasRect.top - digitInitialTop + padding;
        const maxBottom = canvasRect.bottom - digitInitialTop - digitHeight - padding;
        
        newX = Math.max(maxLeft, Math.min(maxRight, newX));
        newY = Math.max(maxTop, Math.min(maxBottom, newY));
    }
    
    numberEmotionDigitPositions[digit2Index].x = newX;
    numberEmotionDigitPositions[digit2Index].y = newY;
    
    // Update visual position
    updateNumberEmotionDigitPosition(digit2, digit2Index);
}

// Digit 3 Bouncing: continuously bounces up and down like a jumping ball, stops when dragged
function updateDigit3Bouncing(digits) {
    if (!numberEmotionDigitPositions || digits.length < 3) return;
    
    const digit3Index = 2; // Digit "3" is at index 2
    
    // Don't bounce digit 3 if it's being dragged
    if (numberEmotionDraggingIndex === digit3Index) {
        // Reset the bounce time so it starts smoothly when released
        digit3BounceTime = 0;
        return;
    }
    
    const digit3 = digits[digit3Index];
    
    // Increment time for the bounce animation
    digit3BounceTime += DIGIT3_BOUNCE_SPEED;
    
    // Use abs(sin()) to create a "bouncing ball" effect
    // The digit jumps UP (negative Y) and comes back DOWN to the baseline
    // This looks more like a real jump than a smooth wave
    const bounceOffset = -Math.abs(Math.sin(digit3BounceTime)) * DIGIT3_BOUNCE_AMPLITUDE;
    
    // Apply the transform with both the stored position and the bounce offset
    const pos = numberEmotionDigitPositions[digit3Index];
    digit3.style.transform = `translate(${pos.x}px, ${pos.y + bounceOffset}px)`;
    
    // Update the line for digit 3 after bounce
    updateNumberEmotionLine(digit3, digit3Index);
}

// Digit 4 Repulsion: grows to 2x and keeps digit 3 at minimum distance
// Digit 3 simply cannot get closer than DIGIT4_PROXIMITY_THRESHOLD pixels to digit 4
function updateDigit4Repulsion(digits) {
    if (!numberEmotionDigitPositions || digits.length < 4) return;
    
    const digit3Index = 2; // Digit "3" is at index 2
    const digit4Index = 3; // Digit "4" is at index 3
    
    const digit3 = digits[digit3Index];
    const digit4 = digits[digit4Index];
    
    // Get actual screen positions (center points) for both digits
    const digit3Rect = digit3.getBoundingClientRect();
    const digit4Rect = digit4.getBoundingClientRect();
    
    const digit3CenterX = digit3Rect.left + digit3Rect.width / 2;
    const digit3CenterY = digit3Rect.top + digit3Rect.height / 2;
    const digit4CenterX = digit4Rect.left + digit4Rect.width / 2;
    const digit4CenterY = digit4Rect.top + digit4Rect.height / 2;
    
    // Calculate distance between digit 3 and digit 4
    const dx = digit3CenterX - digit4CenterX;
    const dy = digit3CenterY - digit4CenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if digit 3 is within the proximity threshold
    if (distance < DIGIT4_PROXIMITY_THRESHOLD) {
        // Digit 3 is too close - immediately push it back to minimum distance
        
        // Calculate unit vector pointing from digit 4 to digit 3
        const length = Math.max(distance, 1); // Avoid division by zero
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Calculate how much we need to push digit 3 to reach exactly the threshold distance
        const pushAmount = DIGIT4_PROXIMITY_THRESHOLD - distance;
        
        // Apply push to digit 3's position (immediately, every frame)
        numberEmotionDigitPositions[digit3Index].x += dirX * pushAmount;
        numberEmotionDigitPositions[digit3Index].y += dirY * pushAmount;
        
        // Enlarge digit 4 (CSS transition handles the smooth animation)
        const pos4 = numberEmotionDigitPositions[digit4Index];
        digit4.style.transform = `translate(${pos4.x}px, ${pos4.y}px) scale(${DIGIT4_ENLARGED_SCALE})`;
        digit4IsEnlarged = true;
        
    } else {
        // Digit 3 is far enough - return digit 4 to normal size
        if (digit4IsEnlarged) {
            const pos4 = numberEmotionDigitPositions[digit4Index];
            digit4.style.transform = `translate(${pos4.x}px, ${pos4.y}px) scale(1)`;
            digit4IsEnlarged = false;
        }
    }
    
    // ALWAYS constrain digit 3 to canvas bounds (runs every frame, not just during repulsion)
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
        const canvasRect = canvasContainer.getBoundingClientRect();
        const digitWidth = digit3Rect.width;
        const digitHeight = digit3Rect.height;
        
        const pos3 = numberEmotionDigitPositions[digit3Index];
        // Calculate digit's initial position (before any transform)
        const digitInitialLeft = digit3Rect.left - pos3.x;
        const digitInitialTop = digit3Rect.top - pos3.y;
        
        const padding = 20;
        // Add bounce amplitude buffer to top constraint since bounce can push digit up by DIGIT3_BOUNCE_AMPLITUDE
        const bounceBuffer = DIGIT3_BOUNCE_AMPLITUDE;
        const maxLeft = canvasRect.left - digitInitialLeft + padding;
        const maxRight = canvasRect.right - digitInitialLeft - digitWidth - padding;
        const maxTop = canvasRect.top - digitInitialTop + padding + bounceBuffer; // Extra buffer for bounce
        const maxBottom = canvasRect.bottom - digitInitialTop - digitHeight - padding;
        
        // Clamp position to stay within canvas
        pos3.x = Math.max(maxLeft, Math.min(maxRight, pos3.x));
        pos3.y = Math.max(maxTop, Math.min(maxBottom, pos3.y));
    }
}

// Recalculate Number + Emotion lines on window resize
let numberEmotionResizeTimeout = null;
window.addEventListener('resize', () => {
    if (numberEmotionResizeTimeout) clearTimeout(numberEmotionResizeTimeout);
    numberEmotionResizeTimeout = setTimeout(() => {
        // Only update if digits container is visible
        const container = document.getElementById('number-emotion-digits-container');
        if (container && container.classList.contains('visible')) {
            updateAllNumberEmotionLines();
        }
    }, 150);
});

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

// ==================
// SHAPE + COLOR CANVAS (drag colored shapes to create gradient trails)
// ==================
// Shape + Color canvas implementation - colored shapes with gradient trails

// State variables for Shape + Color canvas
let shapeColorContainer = null;
let shapeColorDrawCanvas = null;
let shapeColorDrawCtx = null;
let shapeColorBrushCanvas = null;
let shapeColorBrushCtx = null;
let shapeColorPlayBtn = null;
let shapeColorResetBtn = null;
let shapeColorExportBtn = null;
let shapeColorResizeObserver = null;
let shapeColorAnimationId = null;

// Config
const SHAPE_COLOR_SIZE = 40;        // Size of draggable shapes
const SHAPE_COLOR_STAMP_SIZE = 40;  // Size of stamps (trail)
const SHAPE_COLOR_STEP_DIST = 8;    // Distance between stamps (smaller = denser trail)
const SHAPE_COLOR_STROKE_W = 3;     // Stroke weight
const SHAPE_COLOR_EASING = 0.4;     // Smoothing factor (higher = follows mouse faster)
const SHAPE_COLOR_SPACING = 70;     // Vertical spacing between shapes
const SHAPE_COLOR_TYPES = ['circle', 'square', 'triangle', 'ellipse', 'star', 'pentagon'];

// Colors for each shape type
const SHAPE_COLOR_COLORS = {
    0: '#293990', // circle - blue
    1: '#EF4538', // square - orange
    2: '#FAB01B', // triangle - yellow
    3: '#007A6F', // ellipse - green
    4: '#891951', // star - purple
    5: '#EB4781'  // pentagon - pink
};

// Background color
const SHAPE_COLOR_BG_COLOR = '#FFFFFF';

// State
let shapeColorPositions = [];       // { x, y, shapeType }
let shapeColorDraggedIndex = -1;    // -1 means no shape is being dragged
let shapeColorDragOffsetX = 0;
let shapeColorDragOffsetY = 0;
let shapeColorRecordedPoints = [];  // { x, y, shape, color } for playback
let shapeColorIsReplaying = false;
let shapeColorReplayIndex = 0;
let shapeColorActive = false;       // Whether the canvas is active

// State storage for persistence across page switches
let shapeColorStateStorage = {};

// Function to convert hex color to HSL
function hexToHSL(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
}

// Function to convert HSL to hex color
function hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

// Function to get a random shade variation of a color
function getRandomShadeColor(baseColor) {
    const hsl = hexToHSL(baseColor);
    
    // Vary lightness by -20% to +20%
    const lightnessVariation = (Math.random() - 0.5) * 40;
    let newLightness = hsl.l + lightnessVariation;
    
    // Clamp lightness to valid range (10-90 to avoid pure black/white)
    newLightness = Math.max(10, Math.min(90, newLightness));
    
    // Also slightly vary saturation for more natural feel
    const saturationVariation = (Math.random() - 0.5) * 20;
    let newSaturation = hsl.s + saturationVariation;
    newSaturation = Math.max(20, Math.min(100, newSaturation));
    
    return hslToHex(hsl.h, newSaturation, newLightness);
}

// Initialize Shape + Color canvas
function initializeShapeColorCanvas() {
    shapeColorContainer = document.getElementById('shape-color-container');
    if (!shapeColorContainer) {
        console.error('Shape + Color container not found');
        return;
    }
    
    shapeColorDrawCanvas = document.getElementById('shape-color-draw-surface');
    shapeColorBrushCanvas = document.getElementById('shape-color-brush-layer');
    shapeColorPlayBtn = document.getElementById('shape-color-play-btn');
    shapeColorResetBtn = document.getElementById('shape-color-reset-btn');
    shapeColorExportBtn = document.getElementById('shape-color-export-btn');
    
    if (!shapeColorDrawCanvas || !shapeColorBrushCanvas) {
        console.error('Shape + Color canvas elements not found');
        return;
    }
    
    shapeColorDrawCtx = shapeColorDrawCanvas.getContext('2d');
    shapeColorBrushCtx = shapeColorBrushCanvas.getContext('2d');
    
    // Set up event listeners
    shapeColorDrawCanvas.addEventListener('mousedown', handleShapeColorMouseDown);
    shapeColorDrawCanvas.addEventListener('mousemove', handleShapeColorMouseMove);
    shapeColorDrawCanvas.addEventListener('mouseup', handleShapeColorMouseUp);
    shapeColorDrawCanvas.addEventListener('mouseleave', handleShapeColorMouseUp);
    
    // Touch support
    shapeColorDrawCanvas.addEventListener('touchstart', handleShapeColorTouchStart);
    shapeColorDrawCanvas.addEventListener('touchmove', handleShapeColorTouchMove);
    shapeColorDrawCanvas.addEventListener('touchend', handleShapeColorTouchEnd);
    
    // Keyboard handler for reset
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'c' || e.key === 'C') && shapeColorActive) {
            resetShapeColorCanvas();
        }
    });
    
    // Play button
    if (shapeColorPlayBtn) {
        shapeColorPlayBtn.addEventListener('click', handleShapeColorPlayClick);
    }
    
    // Reset button
    if (shapeColorResetBtn) {
        shapeColorResetBtn.addEventListener('click', resetShapeColorCanvas);
    }
    
    // Export button
    if (shapeColorExportBtn) {
        shapeColorExportBtn.addEventListener('click', exportShapeColorCanvas);
    }
    
    // Resize handler
    if (window.ResizeObserver) {
        shapeColorResizeObserver = new ResizeObserver(() => {
            resizeShapeColorCanvas();
        });
        shapeColorResizeObserver.observe(shapeColorContainer);
    } else {
        window.addEventListener('resize', resizeShapeColorCanvas);
    }
    
    // Initial setup
    resizeShapeColorCanvas();
}

// Resize canvas to match container
function resizeShapeColorCanvas() {
    if (!shapeColorContainer || !shapeColorDrawCanvas || !shapeColorBrushCanvas) return;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;
    
    if (containerW <= 0 || containerH <= 0) return;
    
    // Match device pixel ratio for crisp lines
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    
    // Resize draw canvas
    shapeColorDrawCanvas.width = Math.floor(containerW * dpr);
    shapeColorDrawCanvas.height = Math.floor(containerH * dpr);
    shapeColorDrawCanvas.style.width = containerW + 'px';
    shapeColorDrawCanvas.style.height = containerH + 'px';
    shapeColorDrawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Resize brush canvas
    shapeColorBrushCanvas.width = Math.floor(containerW * dpr);
    shapeColorBrushCanvas.height = Math.floor(containerH * dpr);
    shapeColorBrushCanvas.style.width = containerW + 'px';
    shapeColorBrushCanvas.style.height = containerH + 'px';
    shapeColorBrushCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Initialize shape positions
    initializeShapeColorPositions();
    
    // Clear and redraw
    clearShapeColorBrushLayer();
    renderShapeColorFrame();
}

// Initialize draggable shape positions (centered column)
function initializeShapeColorPositions() {
    if (!shapeColorContainer) return;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    shapeColorPositions = [];
    
    const centerX = w / 2;
    const totalHeight = (SHAPE_COLOR_TYPES.length - 1) * SHAPE_COLOR_SPACING;
    const startY = (h - totalHeight) / 2 - 60; // Shifted 60px up
    
    for (let i = 0; i < SHAPE_COLOR_TYPES.length; i++) {
        shapeColorPositions.push({
            x: centerX,
            y: startY + i * SHAPE_COLOR_SPACING,
            shapeType: i
        });
    }
}

// Clear the brush layer (accumulated strokes)
function clearShapeColorBrushLayer() {
    if (!shapeColorBrushCtx || !shapeColorContainer) return;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    shapeColorBrushCtx.fillStyle = SHAPE_COLOR_BG_COLOR;
    shapeColorBrushCtx.fillRect(0, 0, w, h);
}

// Render a single frame
function renderShapeColorFrame() {
    if (!shapeColorDrawCtx || !shapeColorContainer) return;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    if (w <= 0 || h <= 0) return;
    
    // Clear draw canvas
    shapeColorDrawCtx.clearRect(0, 0, w, h);
    
    // Draw brush layer onto draw canvas
    shapeColorDrawCtx.drawImage(shapeColorBrushCanvas, 0, 0, w, h);
    
    // Draw draggable shapes on top
    drawShapeColorDraggableShapes();
}

// Draw all draggable shapes (and their mirrors)
function drawShapeColorDraggableShapes() {
    if (!shapeColorDrawCtx || !shapeColorContainer) return;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const w = containerRect.width;
    const centerX = w / 2;
    
    for (let i = 0; i < shapeColorPositions.length; i++) {
        const shape = shapeColorPositions[i];
        const isBeingDragged = (i === shapeColorDraggedIndex);
        const fillColor = SHAPE_COLOR_COLORS[shape.shapeType];
        
        // Draw shape on left side
        drawShapeColorDraggable(shapeColorDrawCtx, shape.x, shape.y, SHAPE_COLOR_SIZE, shape.shapeType, isBeingDragged, fillColor);
        
        // Draw mirrored shape on right side (if not at center)
        const mirroredX = w - shape.x;
        if (Math.abs(shape.x - centerX) > 5) {
            drawShapeColorDraggable(shapeColorDrawCtx, mirroredX, shape.y, SHAPE_COLOR_SIZE, shape.shapeType, isBeingDragged, fillColor);
        }
    }
}

// Draw a single draggable shape with color (fill only, no stroke)
function drawShapeColorDraggable(ctx, x, y, baseSize, shapeType, isBeingDragged, fillColor) {
    // Size multipliers for different shapes
    const multipliers = [1.0, 1.3, 1.5, 1.4, 1.2, 1.3]; // circle, square, triangle, ellipse, star, pentagon
    let size = baseSize * (multipliers[shapeType] || 1.0);
    
    if (isBeingDragged) {
        size *= 1.1;
    }
    
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = fillColor;
    
    drawShapeColorByType(ctx, 0, 0, size, shapeType, false); // false = no stroke
    
    ctx.restore();
}

// Draw shape by type at origin (assumes translate already applied)
// withStroke parameter controls whether to draw the outline (default: false for fill only)
function drawShapeColorByType(ctx, x, y, size, shapeType, withStroke = false) {
    ctx.beginPath();
    
    if (shapeType === 0) {
        // Circle
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    } else if (shapeType === 1) {
        // Square
        ctx.rect(x - size / 2, y - size / 2, size, size);
    } else if (shapeType === 2) {
        // Triangle
        const h = size * 0.9;
        ctx.moveTo(x, y - h / 2);
        ctx.lineTo(x - h / 2, y + h / 2);
        ctx.lineTo(x + h / 2, y + h / 2);
        ctx.closePath();
    } else if (shapeType === 3) {
        // Ellipse
        ctx.ellipse(x, y, size * 0.75, size * 0.45, 0, 0, Math.PI * 2);
    } else if (shapeType === 4) {
        // Star (5-pointed)
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const r = (i % 2 === 0) ? size / 2 : size / 4;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shapeType === 5) {
        // Pentagon
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * (size / 2);
            const py = y + Math.sin(angle) * (size / 2);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }
    
    ctx.fill();
    if (withStroke) {
        ctx.stroke();
    }
}

// Draw stamp on brush layer (for trails) with gradient color variation (fill only, no stroke)
function drawShapeColorStamp(x, y, shapeType, color) {
    if (!shapeColorBrushCtx) return;
    
    // Size multipliers for stamps
    const multipliers = [1.0, 1.5, 2.0, 1.8, 1.3, 1.4]; // circle, square, triangle, ellipse, star, pentagon
    const size = SHAPE_COLOR_STAMP_SIZE * (multipliers[shapeType] || 1.0);
    
    shapeColorBrushCtx.save();
    shapeColorBrushCtx.translate(x, y);
    shapeColorBrushCtx.fillStyle = color;
    
    drawShapeColorByType(shapeColorBrushCtx, 0, 0, size, shapeType, false); // false = no stroke
    
    shapeColorBrushCtx.restore();
}

// Stamp trail from one point to another with gradient colors
function stampShapeColorTrail(x1, y1, x2, y2, shapeType, recordIt) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    // Use smaller step distance for smoother trails
    const stepDist = 8;
    const steps = Math.max(1, Math.floor(dist / stepDist));
    
    // Get base color for this shape type
    const baseColor = SHAPE_COLOR_COLORS[shapeType];
    
    // Draw stamps along the path, including at endpoints
    for (let i = 0; i <= steps; i++) {
        const f = steps > 0 ? i / steps : 0;
        const x = x1 + (x2 - x1) * f;
        const y = y1 + (y2 - y1) * f;
        
        // Get random shade variation of the base color
        const stampColor = getRandomShadeColor(baseColor);
        
        drawShapeColorStamp(x, y, shapeType, stampColor);
        
        if (recordIt) {
            shapeColorRecordedPoints.push({ x, y, shape: shapeType, color: stampColor });
        }
    }
}

// Get mouse position relative to canvas
function getShapeColorMousePos(e) {
    const rect = shapeColorDrawCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Get touch position relative to canvas
function getShapeColorTouchPos(e) {
    const rect = shapeColorDrawCanvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

// Find shape at position
function getShapeColorAtPosition(mx, my) {
    const hitRadius = SHAPE_COLOR_SIZE * 0.7;
    
    for (let i = shapeColorPositions.length - 1; i >= 0; i--) {
        const shape = shapeColorPositions[i];
        const dx = mx - shape.x;
        const dy = my - shape.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < hitRadius) {
            return i;
        }
    }
    return -1;
}

// Function to hide Shape + Color instruction text
function hideShapeColorInstructionText() {
    const instructionText = document.getElementById('canvas-instruction-text');
    if (!instructionText) return;
    
    instructionText.classList.remove('visible');
}

// Mouse event handlers
function handleShapeColorMouseDown(e) {
    if (!shapeColorActive) return;
    
    const pos = getShapeColorMousePos(e);
    const shapeIndex = getShapeColorAtPosition(pos.x, pos.y);
    
    if (shapeIndex >= 0) {
        shapeColorDraggedIndex = shapeIndex;
        const shape = shapeColorPositions[shapeIndex];
        shapeColorDragOffsetX = pos.x - shape.x;
        shapeColorDragOffsetY = pos.y - shape.y;
        
        // Hide instruction text
        hideShapeColorInstructionText();
    }
}

function handleShapeColorMouseMove(e) {
    if (!shapeColorActive || shapeColorDraggedIndex < 0) return;
    
    const pos = getShapeColorMousePos(e);
    const shape = shapeColorPositions[shapeColorDraggedIndex];
    
    const newX = pos.x - shapeColorDragOffsetX;
    const newY = pos.y - shapeColorDragOffsetY;
    
    // Apply easing
    const targetX = shape.x + (newX - shape.x) * SHAPE_COLOR_EASING;
    const targetY = shape.y + (newY - shape.y) * SHAPE_COLOR_EASING;
    
    // Calculate movement
    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2) {
        const containerRect = shapeColorContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        // Stamp trail on left side
        stampShapeColorTrail(shape.x, shape.y, targetX, targetY, shape.shapeType, true);
        
        // Mirror stamp on right side
        stampShapeColorTrail(w - shape.x, shape.y, w - targetX, targetY, shape.shapeType, false);
    }
    
    // Update position
    shape.x = targetX;
    shape.y = targetY;
    
    // Redraw
    renderShapeColorFrame();
}

function handleShapeColorMouseUp(e) {
    if (shapeColorDraggedIndex >= 0) {
        // Save state after drawing
        saveShapeColorState();
    }
    shapeColorDraggedIndex = -1;
}

// Touch event handlers
function handleShapeColorTouchStart(e) {
    e.preventDefault();
    if (!shapeColorActive) return;
    
    const pos = getShapeColorTouchPos(e);
    const shapeIndex = getShapeColorAtPosition(pos.x, pos.y);
    
    if (shapeIndex >= 0) {
        shapeColorDraggedIndex = shapeIndex;
        const shape = shapeColorPositions[shapeIndex];
        shapeColorDragOffsetX = pos.x - shape.x;
        shapeColorDragOffsetY = pos.y - shape.y;
        
        hideShapeColorInstructionText();
    }
}

function handleShapeColorTouchMove(e) {
    e.preventDefault();
    if (!shapeColorActive || shapeColorDraggedIndex < 0) return;
    
    const pos = getShapeColorTouchPos(e);
    const shape = shapeColorPositions[shapeColorDraggedIndex];
    
    const newX = pos.x - shapeColorDragOffsetX;
    const newY = pos.y - shapeColorDragOffsetY;
    
    const targetX = shape.x + (newX - shape.x) * SHAPE_COLOR_EASING;
    const targetY = shape.y + (newY - shape.y) * SHAPE_COLOR_EASING;
    
    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2) {
        const containerRect = shapeColorContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        stampShapeColorTrail(shape.x, shape.y, targetX, targetY, shape.shapeType, true);
        stampShapeColorTrail(w - shape.x, shape.y, w - targetX, targetY, shape.shapeType, false);
    }
    
    shape.x = targetX;
    shape.y = targetY;
    
    renderShapeColorFrame();
}

function handleShapeColorTouchEnd(e) {
    e.preventDefault();
    if (shapeColorDraggedIndex >= 0) {
        saveShapeColorState();
    }
    shapeColorDraggedIndex = -1;
}

// Playback functions
function handleShapeColorPlayClick() {
    if (shapeColorIsReplaying) {
        // Stop playback
        shapeColorIsReplaying = false;
        if (shapeColorPlayBtn) {
            shapeColorPlayBtn.textContent = '[play]';
        }
        if (shapeColorAnimationId) {
            cancelAnimationFrame(shapeColorAnimationId);
            shapeColorAnimationId = null;
        }
    } else {
        // Start playback
        if (shapeColorRecordedPoints.length === 0) return;
        
        clearShapeColorBrushLayer();
        shapeColorReplayIndex = 0;
        shapeColorIsReplaying = true;
        
        if (shapeColorPlayBtn) {
            shapeColorPlayBtn.textContent = '[stop]';
        }
        
        replayShapeColorDrawing();
    }
}

function replayShapeColorDrawing() {
    if (!shapeColorIsReplaying || !shapeColorActive) {
        shapeColorIsReplaying = false;
        return;
    }
    
    const pointsPerFrame = 10;
    
    for (let i = 0; i < pointsPerFrame; i++) {
        const point = shapeColorRecordedPoints[shapeColorReplayIndex];
        
        if (!point) {
            // Loop: restart from beginning
            shapeColorReplayIndex = 0;
            clearShapeColorBrushLayer();
            shapeColorAnimationId = requestAnimationFrame(replayShapeColorDrawing);
            return;
        }
        
        const containerRect = shapeColorContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        // Draw stamp and its mirror (use recorded color)
        drawShapeColorStamp(point.x, point.y, point.shape, point.color);
        drawShapeColorStamp(w - point.x, point.y, point.shape, point.color);
        
        shapeColorReplayIndex++;
    }
    
    renderShapeColorFrame();
    shapeColorAnimationId = requestAnimationFrame(replayShapeColorDrawing);
}

// Reset canvas
function resetShapeColorCanvas() {
    // Clear saved state
    const pageId = getCurrentShapeColorPageId();
    if (pageId && shapeColorStateStorage[pageId]) {
        delete shapeColorStateStorage[pageId];
    }
    
    // Clear visual
    clearShapeColorBrushLayer();
    shapeColorRecordedPoints = [];
    shapeColorIsReplaying = false;
    shapeColorReplayIndex = 0;
    shapeColorDraggedIndex = -1;
    
    if (shapeColorAnimationId) {
        cancelAnimationFrame(shapeColorAnimationId);
        shapeColorAnimationId = null;
    }
    
    // Reset play button
    if (shapeColorPlayBtn) {
        shapeColorPlayBtn.textContent = '[play]';
    }
    
    // Reinitialize shape positions
    initializeShapeColorPositions();
    
    // Redraw
    renderShapeColorFrame();
}

// Export canvas as PNG image
function exportShapeColorCanvas() {
    if (!shapeColorBrushCanvas || !shapeColorContainer) return;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    if (w <= 0 || h <= 0) return;
    
    // Create a temporary canvas to combine layers
    const exportCanvas = document.createElement('canvas');
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    exportCanvas.width = Math.floor(w * dpr);
    exportCanvas.height = Math.floor(h * dpr);
    
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Draw white background
    exportCtx.fillStyle = SHAPE_COLOR_BG_COLOR;
    exportCtx.fillRect(0, 0, w, h);
    
    // Draw the brush layer (accumulated strokes)
    exportCtx.drawImage(shapeColorBrushCanvas, 0, 0, w, h);
    
    // Draw the draggable shapes on top (fill only, no stroke)
    const centerX = w / 2;
    for (let i = 0; i < shapeColorPositions.length; i++) {
        const shape = shapeColorPositions[i];
        const multipliers = [1.0, 1.3, 1.5, 1.4, 1.2, 1.3];
        const size = SHAPE_COLOR_SIZE * (multipliers[shape.shapeType] || 1.0);
        const fillColor = SHAPE_COLOR_COLORS[shape.shapeType];
        
        // Draw shape on left side
        exportCtx.save();
        exportCtx.translate(shape.x, shape.y);
        exportCtx.fillStyle = fillColor;
        drawShapeColorByType(exportCtx, 0, 0, size, shape.shapeType, false); // no stroke
        exportCtx.restore();
        
        // Draw mirrored shape on right side
        const mirroredX = w - shape.x;
        if (Math.abs(shape.x - centerX) > 5) {
            exportCtx.save();
            exportCtx.translate(mirroredX, shape.y);
            exportCtx.fillStyle = fillColor;
            drawShapeColorByType(exportCtx, 0, 0, size, shape.shapeType, false); // no stroke
            exportCtx.restore();
        }
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `synesthesia-shapecolor-${timestamp}.png`;
    
    // Create download link and trigger download
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}

// State persistence
function getCurrentShapeColorPageId() {
    // Get current page ID from selected colors
    return `${selectedLeftIndex}-${selectedRightIndex}`;
}

function saveShapeColorState() {
    const pageId = getCurrentShapeColorPageId();
    if (!pageId) return;
    
    try {
        // Save brush layer as image data
        let imageData = null;
        if (shapeColorBrushCanvas) {
            imageData = shapeColorBrushCanvas.toDataURL('image/png');
        }
        
        shapeColorStateStorage[pageId] = {
            imageData: imageData,
            recordedPoints: [...shapeColorRecordedPoints]
        };
    } catch (e) {
        console.warn('Failed to save shape color state:', e);
    }
}

function restoreShapeColorState() {
    const pageId = getCurrentShapeColorPageId();
    if (!pageId) {
        clearShapeColorBrushLayer();
        shapeColorRecordedPoints = [];
        return false;
    }
    
    const savedState = shapeColorStateStorage[pageId];
    if (!savedState) {
        clearShapeColorBrushLayer();
        shapeColorRecordedPoints = [];
        return false;
    }
    
    try {
        // Restore recorded points
        if (savedState.recordedPoints && savedState.recordedPoints.length > 0) {
            shapeColorRecordedPoints = [...savedState.recordedPoints];
        } else {
            shapeColorRecordedPoints = [];
        }
        
        // Restore brush layer image
        if (savedState.imageData && shapeColorBrushCtx) {
            const img = new Image();
            img.onload = () => {
                const containerRect = shapeColorContainer.getBoundingClientRect();
                shapeColorBrushCtx.drawImage(img, 0, 0, containerRect.width, containerRect.height);
                renderShapeColorFrame();
            };
            img.src = savedState.imageData;
        }
        
        return true;
    } catch (e) {
        console.warn('Failed to restore shape color state:', e);
        clearShapeColorBrushLayer();
        shapeColorRecordedPoints = [];
        return false;
    }
}

// Visibility update function
function updateShapeColorCanvasVisibility(pageId) {
    if (!shapeColorContainer) return;
    
    // Show for pages "0-5" or "5-0" (Shape + Color)
    const isShapeColorPage = pageId === '0-5' || pageId === '5-0';
    
    if (isShapeColorPage) {
        shapeColorContainer.classList.remove('hidden');
        shapeColorActive = true;
        
        // Stop any ongoing replay first
        if (shapeColorIsReplaying) {
            shapeColorIsReplaying = false;
            if (shapeColorAnimationId) {
                cancelAnimationFrame(shapeColorAnimationId);
                shapeColorAnimationId = null;
            }
            if (shapeColorPlayBtn) {
                shapeColorPlayBtn.textContent = '[play]';
            }
        }
        
        // Resize and restore state after a brief delay
        setTimeout(() => {
            resizeShapeColorCanvas();
            restoreShapeColorState();
            renderShapeColorFrame();
        }, 50);
    } else {
        // Save state before hiding
        if (shapeColorActive) {
            saveShapeColorState();
        }
        
        shapeColorContainer.classList.add('hidden');
        shapeColorActive = false;
        
        // Stop replay
        if (shapeColorIsReplaying) {
            shapeColorIsReplaying = false;
            if (shapeColorAnimationId) {
                cancelAnimationFrame(shapeColorAnimationId);
                shapeColorAnimationId = null;
            }
            if (shapeColorPlayBtn) {
                shapeColorPlayBtn.textContent = '[play]';
            }
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
    
    if (!shapeNumberContainer) return;
    
    // Show Shape & Number canvas only for pageIds "0-3" or "3-0"
    const isShapeNumberPage = pageId === '0-3' || pageId === '3-0';
    
    if (isShapeNumberPage) {
        // Show Shape & Number container
        shapeNumberContainer.classList.remove('hidden');
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
        // Hide Shape & Number container
        shapeNumberContainer.classList.add('hidden');
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
    
    // Update Shape + Color canvas visibility
    updateShapeColorCanvasVisibility(pageId);
    
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
    
    // Update Number + Emotion digits visibility
    updateNumberEmotionDigits(pageId);
    
    // Update Letter + Emotion grid visibility
    updateLetterEmotionGrid(pageId);
    
    // Update Shape & Number canvas visibility
    updateShapeNumberCanvasVisibility(pageId);
    
    // Update Shape + Shape canvas visibility (ellipses interaction)
    updateShapeShapeCanvasVisibility(pageId);
    
    // Update Sound & Shape canvas visibility
    updateSoundShapeCanvasVisibility(pageId);
    
    // Update Sound + Emotion smiley visibility
    updateSoundEmotionVisibility(pageId);
    
    // Also update visibility based on colors (for orange+yellow combination)
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    updateVisibilityBasedOnColors(leftColor, rightColor);
}

// Function to update the word text based on current parameter combination
// Now populates two separate rectangles: left word and right word
function updateWordText() {
    const leftWordElement = document.getElementById('word-text-left');
    const rightWordElement = document.getElementById('word-text-right');
    
    // Get the words for the current indices
    const leftWord = colorWords[selectedLeftIndex];
    const rightWord = colorWords[selectedRightIndex];
    
    // Helper function to populate a word element with letter spans
    function populateWordElement(element, word) {
        if (!element) return;
        
        // Clear existing content
        element.innerHTML = '';
        
        // Create a span for each character
        for (let i = 0; i < word.length; i++) {
            const span = document.createElement('span');
            span.textContent = word[i];
            span.className = 'word-letter';
            element.appendChild(span);
        }
    }
    
    // Populate left rectangle with left word (e.g., "SHAPE")
    populateWordElement(leftWordElement, leftWord);
    
    // Populate right rectangle with right word (e.g., "COLOR")
    populateWordElement(rightWordElement, rightWord);
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

// Function to update visibility of text box based on color combination
function updateVisibilityBasedOnColors(leftColor, rightColor) {
    const textBox = document.getElementById('text-box');
    
    if (!textBox) return;
    
    // Update text box visibility
    // Text box is always hidden - only interaction is shown for interactive pages
    // Use display: none to remove it from layout flow so it doesn't take up space
    textBox.style.display = 'none';
    textBox.style.visibility = 'hidden';
    textBox.style.opacity = '0';
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

// Function to update Shape + Shape canvas visibility (ellipses interaction)
function updateShapeShapeCanvasVisibility(pageId) {
    const shapeShapeContainer = document.getElementById('shape-shape-container');
    
    if (!shapeShapeContainer) return;
    
    // Show Shape + Shape canvas only for pageId "0-0"
    // Parameter indices: 0=shape, 0=shape
    const isShapeShapePage = pageId === '0-0';
    
    if (isShapeShapePage) {
        // Show Shape + Shape container
        shapeShapeContainer.classList.remove('hidden');
        // Initialize ellipses after a brief delay to ensure container is visible
        setTimeout(() => {
            if (shapeShapeContainer && !shapeShapeContainer.classList.contains('hidden')) {
                // Initialize ellipses when page becomes visible
                initializeShapeEllipses();
            }
        }, 50);
    } else {
        // Hide Shape + Shape container
        shapeShapeContainer.classList.add('hidden');
    }
}

// ==================
// SHAPE + SHAPE ELLIPSES INTERACTION
// ==================
// 7 vertical ellipses with drag-to-resize accordion behavior

// State variables for ellipse interaction
let shapeEllipsesContainer = null;
let shapeEllipses = [];
// Varied initial widths to hint at resize capability (total = 100%)
let ellipseWidths = [20, 8, 18, 12, 30, 6, 6]; // Percentages
const MIN_ELLIPSE_WIDTH = 5; // Minimum width percentage
const MAX_ELLIPSE_WIDTH = 60; // Maximum width percentage

// Drag state
let isDraggingEllipse = false;
let dragStartX = 0;
let dragEdgeIndex = -1; // The index of the edge being dragged (0-5, where edge i is between ellipse i and i+1)

// Initialize ellipses interaction
function initializeShapeEllipses() {
    shapeEllipsesContainer = document.getElementById('shape-shape-ellipses');
    if (!shapeEllipsesContainer) return;
    
    // Select the wrapper elements (not the SVG ellipses themselves)
    shapeEllipses = Array.from(shapeEllipsesContainer.querySelectorAll('.shape-ellipse-wrapper'));
    if (shapeEllipses.length !== 7) return;
    
    // Varied initial widths to hint at resize capability (total = 100%)
    ellipseWidths = [20, 8, 18, 12, 30, 6, 6];
    updateEllipseWidths();
    
    // Remove old event listeners if any (to prevent duplicates)
    shapeEllipsesContainer.removeEventListener('mousedown', handleEllipseMouseDown);
    document.removeEventListener('mousemove', handleEllipseMouseMove);
    document.removeEventListener('mouseup', handleEllipseMouseUp);
    
    // Add mouse event listeners
    shapeEllipsesContainer.addEventListener('mousedown', handleEllipseMouseDown);
    document.addEventListener('mousemove', handleEllipseMouseMove);
    document.addEventListener('mouseup', handleEllipseMouseUp);
    
    // Add touch event listeners
    shapeEllipsesContainer.removeEventListener('touchstart', handleEllipseTouchStart);
    document.removeEventListener('touchmove', handleEllipseTouchMove);
    document.removeEventListener('touchend', handleEllipseTouchEnd);
    
    shapeEllipsesContainer.addEventListener('touchstart', handleEllipseTouchStart, { passive: false });
    document.addEventListener('touchmove', handleEllipseTouchMove, { passive: false });
    document.addEventListener('touchend', handleEllipseTouchEnd);
}

// Update ellipse widths in the DOM
function updateEllipseWidths() {
    if (!shapeEllipses || shapeEllipses.length !== 7) return;
    
    shapeEllipses.forEach((ellipse, index) => {
        ellipse.style.flex = `0 0 ${ellipseWidths[index]}%`;
    });
}

// Detect which edge is being clicked (returns edge index 0-5, or -1 if not on edge)
function detectEdge(clientX, clientY) {
    if (!shapeEllipses || shapeEllipses.length !== 7) return -1;
    
    const edgeZone = 15; // Pixels from edge that count as "on edge"
    
    // Check each ellipse (except the last) for right edge proximity
    for (let i = 0; i < shapeEllipses.length - 1; i++) {
        const rect = shapeEllipses[i].getBoundingClientRect();
        const rightEdge = rect.right;
        
        // Check if click is near the right edge of this ellipse (which is the left edge of the next)
        if (Math.abs(clientX - rightEdge) < edgeZone) {
            return i; // Return the edge index
        }
    }
    
    return -1; // Not on any edge
}

// Mouse event handlers for ellipse dragging
function handleEllipseMouseDown(e) {
    const edgeIndex = detectEdge(e.clientX, e.clientY);
    if (edgeIndex === -1) return; // Not clicking on an edge
    
    e.preventDefault();
    isDraggingEllipse = true;
    dragStartX = e.clientX;
    dragEdgeIndex = edgeIndex;
    
    shapeEllipsesContainer.classList.add('dragging');
}

function handleEllipseMouseMove(e) {
    if (!isDraggingEllipse) return;
    
    e.preventDefault();
    const deltaX = e.clientX - dragStartX;
    
    // Calculate width change as percentage of container
    const containerWidth = shapeEllipsesContainer.getBoundingClientRect().width;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    // Apply the change to the two adjacent ellipses
    resizeAdjacentEllipses(dragEdgeIndex, deltaPercent);
    
    // Update start position for next move
    dragStartX = e.clientX;
}

function handleEllipseMouseUp(e) {
    if (!isDraggingEllipse) return;
    
    isDraggingEllipse = false;
    dragEdgeIndex = -1;
    
    if (shapeEllipsesContainer) {
        shapeEllipsesContainer.classList.remove('dragging');
    }
}

// Touch event handlers for ellipse dragging
function handleEllipseTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const edgeIndex = detectEdge(touch.clientX, touch.clientY);
    if (edgeIndex === -1) return; // Not touching on an edge
    
    e.preventDefault();
    isDraggingEllipse = true;
    dragStartX = touch.clientX;
    dragEdgeIndex = edgeIndex;
    
    shapeEllipsesContainer.classList.add('dragging');
}

function handleEllipseTouchMove(e) {
    if (!isDraggingEllipse) return;
    if (!e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    
    // Calculate width change as percentage of container
    const containerWidth = shapeEllipsesContainer.getBoundingClientRect().width;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    // Apply the change to the two adjacent ellipses
    resizeAdjacentEllipses(dragEdgeIndex, deltaPercent);
    
    // Update start position for next move
    dragStartX = touch.clientX;
}

function handleEllipseTouchEnd(e) {
    if (!isDraggingEllipse) return;
    
    isDraggingEllipse = false;
    dragEdgeIndex = -1;
    
    if (shapeEllipsesContainer) {
        shapeEllipsesContainer.classList.remove('dragging');
    }
}

// Resize two adjacent ellipses (accordion behavior)
// edgeIndex: the edge being dragged (between ellipse[edgeIndex] and ellipse[edgeIndex + 1])
// deltaPercent: how much to change (positive = left ellipse grows, right shrinks)
function resizeAdjacentEllipses(edgeIndex, deltaPercent) {
    if (edgeIndex < 0 || edgeIndex >= ellipseWidths.length - 1) return;
    
    const leftIndex = edgeIndex;
    const rightIndex = edgeIndex + 1;
    
    // Calculate new widths
    let newLeftWidth = ellipseWidths[leftIndex] + deltaPercent;
    let newRightWidth = ellipseWidths[rightIndex] - deltaPercent;
    
    // Clamp to min/max bounds
    if (newLeftWidth < MIN_ELLIPSE_WIDTH) {
        const overflow = MIN_ELLIPSE_WIDTH - newLeftWidth;
        newLeftWidth = MIN_ELLIPSE_WIDTH;
        newRightWidth -= overflow; // Don't give the overflow to the other ellipse
    }
    if (newRightWidth < MIN_ELLIPSE_WIDTH) {
        const overflow = MIN_ELLIPSE_WIDTH - newRightWidth;
        newRightWidth = MIN_ELLIPSE_WIDTH;
        newLeftWidth -= overflow; // Don't give the overflow to the other ellipse
    }
    if (newLeftWidth > MAX_ELLIPSE_WIDTH) {
        newLeftWidth = MAX_ELLIPSE_WIDTH;
        newRightWidth = ellipseWidths[leftIndex] + ellipseWidths[rightIndex] - MAX_ELLIPSE_WIDTH;
    }
    if (newRightWidth > MAX_ELLIPSE_WIDTH) {
        newRightWidth = MAX_ELLIPSE_WIDTH;
        newLeftWidth = ellipseWidths[leftIndex] + ellipseWidths[rightIndex] - MAX_ELLIPSE_WIDTH;
    }
    
    // Ensure widths stay within bounds after adjustment
    newLeftWidth = Math.max(MIN_ELLIPSE_WIDTH, Math.min(MAX_ELLIPSE_WIDTH, newLeftWidth));
    newRightWidth = Math.max(MIN_ELLIPSE_WIDTH, Math.min(MAX_ELLIPSE_WIDTH, newRightWidth));
    
    // Update state
    ellipseWidths[leftIndex] = newLeftWidth;
    ellipseWidths[rightIndex] = newRightWidth;
    
    // Update DOM
    updateEllipseWidths();
}

// Handle window resize - maintain ellipse proportions
window.addEventListener('resize', () => {
    if (shapeEllipsesContainer && !shapeEllipsesContainer.closest('.hidden')) {
        updateEllipseWidths();
    }
});

// ==================
// SOUND & SHAPE CANVAS
// ==================
// Sound & Shape canvas implementation using native Canvas API (not p5.js)

// State variables for Sound & Shape canvas
let soundShapeContainer = null;
let soundShapeDrawCanvas = null;
let soundShapeDrawCtx = null;
let soundShapeBrushCanvas = null;
let soundShapeBrushCtx = null;
let soundShapePlayBtn = null;
let soundShapeResetBtn = null;
let soundShapeExportBtn = null;
let soundShapeResizeObserver = null;
let soundShapeAnimationId = null;

// Config
const SOUND_SHAPE_SIZE = 40;        // Size of draggable shapes
const SOUND_SHAPE_STAMP_SIZE = 40;  // Size of stamps (trail)
const SOUND_SHAPE_STEP_DIST = 8;    // Distance between stamps (smaller = denser trail)
const SOUND_SHAPE_STROKE_W = 3;     // Stroke weight
const SOUND_SHAPE_EASING = 0.4;     // Smoothing factor (higher = follows mouse faster)
const SOUND_SHAPE_SPACING = 70;     // Vertical spacing between shapes
const SOUND_SHAPE_TYPES = ['circle', 'square', 'triangle', 'ellipse', 'star', 'pentagon'];

// Colors
const SOUND_SHAPE_BG_COLOR = '#FFFFFF';
const SOUND_SHAPE_FILL_COLOR = '#FFFFFF';
const SOUND_SHAPE_STROKE_COLOR = '#000000';

// State
let soundShapePositions = [];       // { x, y, shapeType }
let soundShapeDraggedIndex = -1;    // -1 means no shape is being dragged
let soundShapeDragOffsetX = 0;
let soundShapeDragOffsetY = 0;
let soundShapeRecordedPoints = [];  // { x, y, shape } for playback
let soundShapeIsReplaying = false;
let soundShapeReplayIndex = 0;
let soundShapeActive = false;       // Whether the canvas is active

// Sound state (Web Audio API)
let soundShapeAudioCtx = null;
let soundShapeMasterGain = null;
let soundShapeLastSoundTime = 0;

// State storage for persistence across page switches
let soundShapeStateStorage = {};

// Initialize Sound & Shape canvas
function initializeSoundShapeCanvas() {
    soundShapeContainer = document.getElementById('sound-shape-container');
    if (!soundShapeContainer) {
        console.error('Sound & Shape container not found');
        return;
    }
    
    soundShapeDrawCanvas = document.getElementById('sound-shape-draw-surface');
    soundShapeBrushCanvas = document.getElementById('sound-shape-brush-layer');
    soundShapePlayBtn = document.getElementById('sound-shape-play-btn');
    soundShapeResetBtn = document.getElementById('sound-shape-reset-btn');
    soundShapeExportBtn = document.getElementById('sound-shape-export-btn');
    
    if (!soundShapeDrawCanvas || !soundShapeBrushCanvas) {
        console.error('Sound & Shape canvas elements not found');
        return;
    }
    
    soundShapeDrawCtx = soundShapeDrawCanvas.getContext('2d');
    soundShapeBrushCtx = soundShapeBrushCanvas.getContext('2d');
    
    // Set up event listeners
    soundShapeDrawCanvas.addEventListener('mousedown', handleSoundShapeMouseDown);
    soundShapeDrawCanvas.addEventListener('mousemove', handleSoundShapeMouseMove);
    soundShapeDrawCanvas.addEventListener('mouseup', handleSoundShapeMouseUp);
    soundShapeDrawCanvas.addEventListener('mouseleave', handleSoundShapeMouseUp);
    
    // Touch support
    soundShapeDrawCanvas.addEventListener('touchstart', handleSoundShapeTouchStart);
    soundShapeDrawCanvas.addEventListener('touchmove', handleSoundShapeTouchMove);
    soundShapeDrawCanvas.addEventListener('touchend', handleSoundShapeTouchEnd);
    
    // Keyboard handler for reset
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'c' || e.key === 'C') && soundShapeActive) {
            resetSoundShapeCanvas();
        }
    });
    
    // Play button
    if (soundShapePlayBtn) {
        soundShapePlayBtn.addEventListener('click', handleSoundShapePlayClick);
    }
    
    // Reset button
    if (soundShapeResetBtn) {
        soundShapeResetBtn.addEventListener('click', resetSoundShapeCanvas);
    }
    
    // Export button
    if (soundShapeExportBtn) {
        soundShapeExportBtn.addEventListener('click', exportSoundShapeCanvas);
    }
    
    // Resize handler
    if (window.ResizeObserver) {
        soundShapeResizeObserver = new ResizeObserver(() => {
            resizeSoundShapeCanvas();
        });
        soundShapeResizeObserver.observe(soundShapeContainer);
    } else {
        window.addEventListener('resize', resizeSoundShapeCanvas);
    }
    
    // Initial setup
    resizeSoundShapeCanvas();
}

// Resize canvas to match container
function resizeSoundShapeCanvas() {
    if (!soundShapeContainer || !soundShapeDrawCanvas || !soundShapeBrushCanvas) return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;
    
    if (containerW <= 0 || containerH <= 0) return;
    
    // Match device pixel ratio for crisp lines
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    
    // Resize draw canvas
    soundShapeDrawCanvas.width = Math.floor(containerW * dpr);
    soundShapeDrawCanvas.height = Math.floor(containerH * dpr);
    soundShapeDrawCanvas.style.width = containerW + 'px';
    soundShapeDrawCanvas.style.height = containerH + 'px';
    soundShapeDrawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Resize brush canvas
    soundShapeBrushCanvas.width = Math.floor(containerW * dpr);
    soundShapeBrushCanvas.height = Math.floor(containerH * dpr);
    soundShapeBrushCanvas.style.width = containerW + 'px';
    soundShapeBrushCanvas.style.height = containerH + 'px';
    soundShapeBrushCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Initialize shape positions
    initializeSoundShapePositions();
    
    // Clear and redraw
    clearSoundShapeBrushLayer();
    renderSoundShapeFrame();
}

// Initialize draggable shape positions (centered column)
function initializeSoundShapePositions() {
    if (!soundShapeContainer) return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    soundShapePositions = [];
    
    const centerX = w / 2;
    const totalHeight = (SOUND_SHAPE_TYPES.length - 1) * SOUND_SHAPE_SPACING;
    const startY = (h - totalHeight) / 2 - 60; // Shifted 60px up
    
    for (let i = 0; i < SOUND_SHAPE_TYPES.length; i++) {
        soundShapePositions.push({
            x: centerX,
            y: startY + i * SOUND_SHAPE_SPACING,
            shapeType: i
        });
    }
}

// Clear the brush layer (accumulated strokes)
function clearSoundShapeBrushLayer() {
    if (!soundShapeBrushCtx || !soundShapeContainer) return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    soundShapeBrushCtx.fillStyle = SOUND_SHAPE_BG_COLOR;
    soundShapeBrushCtx.fillRect(0, 0, w, h);
}

// Render a single frame
function renderSoundShapeFrame() {
    if (!soundShapeDrawCtx || !soundShapeContainer) return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    if (w <= 0 || h <= 0) return;
    
    // Clear draw canvas
    soundShapeDrawCtx.clearRect(0, 0, w, h);
    
    // Draw brush layer onto draw canvas
    soundShapeDrawCtx.drawImage(soundShapeBrushCanvas, 0, 0, w, h);
    
    // Draw draggable shapes on top
    drawSoundShapeDraggableShapes();
}

// Draw all draggable shapes (and their mirrors)
function drawSoundShapeDraggableShapes() {
    if (!soundShapeDrawCtx || !soundShapeContainer) return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const w = containerRect.width;
    const centerX = w / 2;
    
    for (let i = 0; i < soundShapePositions.length; i++) {
        const shape = soundShapePositions[i];
        const isBeingDragged = (i === soundShapeDraggedIndex);
        
        // Draw shape on left side
        drawSoundShapeDraggable(soundShapeDrawCtx, shape.x, shape.y, SOUND_SHAPE_SIZE, shape.shapeType, isBeingDragged);
        
        // Draw mirrored shape on right side (if not at center)
        const mirroredX = w - shape.x;
        if (Math.abs(shape.x - centerX) > 5) {
            drawSoundShapeDraggable(soundShapeDrawCtx, mirroredX, shape.y, SOUND_SHAPE_SIZE, shape.shapeType, isBeingDragged);
        }
    }
}

// Draw a single draggable shape
function drawSoundShapeDraggable(ctx, x, y, baseSize, shapeType, isBeingDragged) {
    // Size multipliers for different shapes
    const multipliers = [1.0, 1.3, 1.5, 1.4, 1.2, 1.3]; // circle, square, triangle, ellipse, star, pentagon
    let size = baseSize * (multipliers[shapeType] || 1.0);
    
    if (isBeingDragged) {
        size *= 1.1;
    }
    
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = SOUND_SHAPE_FILL_COLOR;
    ctx.strokeStyle = SOUND_SHAPE_STROKE_COLOR;
    ctx.lineWidth = SOUND_SHAPE_STROKE_W;
    
    drawSoundShapeByType(ctx, 0, 0, size, shapeType);
    
    ctx.restore();
}

// Draw shape by type at origin (assumes translate already applied)
function drawSoundShapeByType(ctx, x, y, size, shapeType) {
    ctx.beginPath();
    
    if (shapeType === 0) {
        // Circle
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    } else if (shapeType === 1) {
        // Square
        ctx.rect(x - size / 2, y - size / 2, size, size);
    } else if (shapeType === 2) {
        // Triangle
        const h = size * 0.9;
        ctx.moveTo(x, y - h / 2);
        ctx.lineTo(x - h / 2, y + h / 2);
        ctx.lineTo(x + h / 2, y + h / 2);
        ctx.closePath();
    } else if (shapeType === 3) {
        // Ellipse
        ctx.ellipse(x, y, size * 0.75, size * 0.45, 0, 0, Math.PI * 2);
    } else if (shapeType === 4) {
        // Star (5-pointed)
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const r = (i % 2 === 0) ? size / 2 : size / 4;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shapeType === 5) {
        // Pentagon
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * (size / 2);
            const py = y + Math.sin(angle) * (size / 2);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }
    
    ctx.fill();
    ctx.stroke();
}

// Draw stamp on brush layer (for trails)
function drawSoundShapeStamp(x, y, shapeType) {
    if (!soundShapeBrushCtx) return;
    
    // Size multipliers for stamps
    const multipliers = [1.0, 1.5, 2.0, 1.8, 1.3, 1.4]; // circle, square, triangle, ellipse, star, pentagon
    const size = SOUND_SHAPE_STAMP_SIZE * (multipliers[shapeType] || 1.0);
    
    soundShapeBrushCtx.save();
    soundShapeBrushCtx.translate(x, y);
    soundShapeBrushCtx.fillStyle = SOUND_SHAPE_FILL_COLOR;
    soundShapeBrushCtx.strokeStyle = SOUND_SHAPE_STROKE_COLOR;
    soundShapeBrushCtx.lineWidth = SOUND_SHAPE_STROKE_W;
    
    drawSoundShapeByType(soundShapeBrushCtx, 0, 0, size, shapeType);
    
    soundShapeBrushCtx.restore();
}

// Stamp trail from one point to another
function stampSoundShapeTrail(x1, y1, x2, y2, shapeType, recordIt) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    // Use smaller step distance for smoother trails
    const stepDist = 8;
    const steps = Math.max(1, Math.floor(dist / stepDist));
    
    // Draw stamps along the path, including at endpoints
    for (let i = 0; i <= steps; i++) {
        const f = steps > 0 ? i / steps : 0;
        const x = x1 + (x2 - x1) * f;
        const y = y1 + (y2 - y1) * f;
        
        drawSoundShapeStamp(x, y, shapeType);
        
        if (recordIt) {
            soundShapeRecordedPoints.push({ x, y, shape: shapeType });
        }
    }
    
    if (recordIt) {
        triggerSoundShapeSound(x2, y2, shapeType);
    }
}

// Get mouse position relative to canvas
function getSoundShapeMousePos(e) {
    const rect = soundShapeDrawCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Get touch position relative to canvas
function getSoundShapeTouchPos(e) {
    const rect = soundShapeDrawCanvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

// Find shape at position
function getSoundShapeAtPosition(mx, my) {
    const hitRadius = SOUND_SHAPE_SIZE * 0.7;
    
    for (let i = soundShapePositions.length - 1; i >= 0; i--) {
        const shape = soundShapePositions[i];
        const dx = mx - shape.x;
        const dy = my - shape.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < hitRadius) {
            return i;
        }
    }
    return -1;
}

// Mouse event handlers
function handleSoundShapeMouseDown(e) {
    if (!soundShapeActive) return;
    
    ensureSoundShapeAudio();
    
    const pos = getSoundShapeMousePos(e);
    const shapeIndex = getSoundShapeAtPosition(pos.x, pos.y);
    
    if (shapeIndex >= 0) {
        soundShapeDraggedIndex = shapeIndex;
        const shape = soundShapePositions[shapeIndex];
        soundShapeDragOffsetX = pos.x - shape.x;
        soundShapeDragOffsetY = pos.y - shape.y;
        
        // Hide instruction text
        hideSoundShapeInstructionText();
    }
}

function handleSoundShapeMouseMove(e) {
    if (!soundShapeActive || soundShapeDraggedIndex < 0) return;
    
    const pos = getSoundShapeMousePos(e);
    const shape = soundShapePositions[soundShapeDraggedIndex];
    
    const newX = pos.x - soundShapeDragOffsetX;
    const newY = pos.y - soundShapeDragOffsetY;
    
    // Apply easing
    const targetX = shape.x + (newX - shape.x) * SOUND_SHAPE_EASING;
    const targetY = shape.y + (newY - shape.y) * SOUND_SHAPE_EASING;
    
    // Calculate movement
    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2) {
        const containerRect = soundShapeContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        // Stamp trail on left side
        stampSoundShapeTrail(shape.x, shape.y, targetX, targetY, shape.shapeType, true);
        
        // Mirror stamp on right side
        stampSoundShapeTrail(w - shape.x, shape.y, w - targetX, targetY, shape.shapeType, false);
    }
    
    // Update position
    shape.x = targetX;
    shape.y = targetY;
    
    // Redraw
    renderSoundShapeFrame();
}

function handleSoundShapeMouseUp(e) {
    if (soundShapeDraggedIndex >= 0) {
        // Save state after drawing
        saveSoundShapeState();
    }
    soundShapeDraggedIndex = -1;
}

// Touch event handlers
function handleSoundShapeTouchStart(e) {
    e.preventDefault();
    if (!soundShapeActive) return;
    
    ensureSoundShapeAudio();
    
    const pos = getSoundShapeTouchPos(e);
    const shapeIndex = getSoundShapeAtPosition(pos.x, pos.y);
    
    if (shapeIndex >= 0) {
        soundShapeDraggedIndex = shapeIndex;
        const shape = soundShapePositions[shapeIndex];
        soundShapeDragOffsetX = pos.x - shape.x;
        soundShapeDragOffsetY = pos.y - shape.y;
        
        hideSoundShapeInstructionText();
    }
}

function handleSoundShapeTouchMove(e) {
    e.preventDefault();
    if (!soundShapeActive || soundShapeDraggedIndex < 0) return;
    
    const pos = getSoundShapeTouchPos(e);
    const shape = soundShapePositions[soundShapeDraggedIndex];
    
    const newX = pos.x - soundShapeDragOffsetX;
    const newY = pos.y - soundShapeDragOffsetY;
    
    const targetX = shape.x + (newX - shape.x) * SOUND_SHAPE_EASING;
    const targetY = shape.y + (newY - shape.y) * SOUND_SHAPE_EASING;
    
    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2) {
        const containerRect = soundShapeContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        stampSoundShapeTrail(shape.x, shape.y, targetX, targetY, shape.shapeType, true);
        stampSoundShapeTrail(w - shape.x, shape.y, w - targetX, targetY, shape.shapeType, false);
    }
    
    shape.x = targetX;
    shape.y = targetY;
    
    renderSoundShapeFrame();
}

function handleSoundShapeTouchEnd(e) {
    e.preventDefault();
    if (soundShapeDraggedIndex >= 0) {
        saveSoundShapeState();
    }
    soundShapeDraggedIndex = -1;
}

// Sound functions (Web Audio API)
function ensureSoundShapeAudio() {
    if (!soundShapeAudioCtx) {
        soundShapeAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        soundShapeMasterGain = soundShapeAudioCtx.createGain();
        soundShapeMasterGain.gain.value = 0.9;
        soundShapeMasterGain.connect(soundShapeAudioCtx.destination);
    }
    if (soundShapeAudioCtx.state === 'suspended') {
        soundShapeAudioCtx.resume();
    }
}

function midiToFreqSoundShape(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function triggerSoundShapeSound(x, y, shapeType) {
    const now = performance.now();
    if (now - soundShapeLastSoundTime < 70) return;
    soundShapeLastSoundTime = now;
    
    ensureSoundShapeAudio();
    if (!soundShapeAudioCtx || soundShapeAudioCtx.state !== 'running') return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const h = containerRect.height;
    
    // Pitch based on Y position
    const normalizedY = 1 - (y / h); // 0 at bottom, 1 at top
    const midiNote = Math.floor(48 + normalizedY * 36); // MIDI 48-84
    let freq = midiToFreqSoundShape(midiNote);
    
    // Shape-specific sound parameters
    let oscType = 'sine';
    let amp = 0.30;
    let dur = 0.14;
    let attackTime = 0.01;
    let decayTime = 0.13;
    let filterFreq = null;
    
    if (shapeType === 0) {
        // Circle - soft sine wave
        oscType = 'sine';
        freq = freq * 0.85;
        amp = 0.50;
        dur = 0.20;
        attackTime = 0.02;
        decayTime = 0.18;
    } else if (shapeType === 1) {
        // Square - sharp square wave
        oscType = 'square';
        freq = freq * 1.15;
        amp = 0.45;
        dur = 0.08;
        attackTime = 0.005;
        decayTime = 0.075;
    } else if (shapeType === 2) {
        // Triangle - triangle wave
        oscType = 'triangle';
        freq = freq * 1.25;
        amp = 0.32;
        dur = 0.15;
        attackTime = 0.01;
        decayTime = 0.14;
    } else if (shapeType === 3) {
        // Ellipse - filtered sine wave
        oscType = 'sine';
        freq = freq * 0.75;
        amp = 0.55;
        dur = 0.25;
        attackTime = 0.03;
        decayTime = 0.22;
        filterFreq = freq * 0.5;
    } else if (shapeType === 4) {
        // Star - sawtooth wave
        oscType = 'sawtooth';
        freq = freq * 1.35;
        amp = 0.50;
        dur = 0.06;
        attackTime = 0.002;
        decayTime = 0.058;
    } else if (shapeType === 5) {
        // Pentagon - filtered square wave
        oscType = 'square';
        freq = freq * 0.95;
        amp = 0.48;
        dur = 0.12;
        attackTime = 0.008;
        decayTime = 0.112;
        filterFreq = freq * 1.5;
    }
    
    const t0 = soundShapeAudioCtx.currentTime;
    
    const osc = soundShapeAudioCtx.createOscillator();
    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, t0);
    
    const g = soundShapeAudioCtx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(amp, t0 + attackTime);
    g.gain.linearRampToValueAtTime(0.0001, t0 + attackTime + decayTime);
    
    let filter = null;
    if (filterFreq !== null) {
        filter = soundShapeAudioCtx.createBiquadFilter();
        filter.type = shapeType === 3 ? 'lowpass' : 'highpass';
        filter.frequency.setValueAtTime(filterFreq, t0);
        filter.Q.setValueAtTime(1, t0);
        
        osc.connect(g);
        g.connect(filter);
        filter.connect(soundShapeMasterGain);
    } else {
        osc.connect(g);
        g.connect(soundShapeMasterGain);
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

// Playback functions
function handleSoundShapePlayClick() {
    if (soundShapeIsReplaying) {
        // Stop playback
        soundShapeIsReplaying = false;
        if (soundShapePlayBtn) {
            soundShapePlayBtn.textContent = '[play]';
        }
        if (soundShapeAnimationId) {
            cancelAnimationFrame(soundShapeAnimationId);
            soundShapeAnimationId = null;
        }
    } else {
        // Start playback
        if (soundShapeRecordedPoints.length === 0) return;
        
        ensureSoundShapeAudio();
        
        clearSoundShapeBrushLayer();
        soundShapeReplayIndex = 0;
        soundShapeLastSoundTime = 0;
        soundShapeIsReplaying = true;
        
        if (soundShapePlayBtn) {
            soundShapePlayBtn.textContent = '[stop]';
        }
        
        replaySoundShapeDrawing();
    }
}

function replaySoundShapeDrawing() {
    if (!soundShapeIsReplaying || !soundShapeActive) {
        soundShapeIsReplaying = false;
        return;
    }
    
    const pointsPerFrame = 10;
    
    for (let i = 0; i < pointsPerFrame; i++) {
        const point = soundShapeRecordedPoints[soundShapeReplayIndex];
        
        if (!point) {
            // Loop: restart from beginning
            soundShapeReplayIndex = 0;
            clearSoundShapeBrushLayer();
            soundShapeAnimationId = requestAnimationFrame(replaySoundShapeDrawing);
            return;
        }
        
        const containerRect = soundShapeContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        // Draw stamp and its mirror
        drawSoundShapeStamp(point.x, point.y, point.shape);
        drawSoundShapeStamp(w - point.x, point.y, point.shape);
        
        // Play sound
        triggerSoundShapeSound(point.x, point.y, point.shape);
        
        soundShapeReplayIndex++;
    }
    
    renderSoundShapeFrame();
    soundShapeAnimationId = requestAnimationFrame(replaySoundShapeDrawing);
}

// Reset canvas
function resetSoundShapeCanvas() {
    // Clear saved state
    const pageId = getCurrentSoundShapePageId();
    if (pageId && soundShapeStateStorage[pageId]) {
        delete soundShapeStateStorage[pageId];
    }
    
    // Clear visual
    clearSoundShapeBrushLayer();
    soundShapeRecordedPoints = [];
    soundShapeIsReplaying = false;
    soundShapeReplayIndex = 0;
    soundShapeDraggedIndex = -1;
    
    if (soundShapeAnimationId) {
        cancelAnimationFrame(soundShapeAnimationId);
        soundShapeAnimationId = null;
    }
    
    // Reset play button
    if (soundShapePlayBtn) {
        soundShapePlayBtn.textContent = '[play]';
    }
    
    // Reinitialize shape positions
    initializeSoundShapePositions();
    
    // Redraw
    renderSoundShapeFrame();
}

// Export canvas as PNG image
function exportSoundShapeCanvas() {
    if (!soundShapeBrushCanvas || !soundShapeContainer) return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    
    if (w <= 0 || h <= 0) return;
    
    // Create a temporary canvas to combine layers
    const exportCanvas = document.createElement('canvas');
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    exportCanvas.width = Math.floor(w * dpr);
    exportCanvas.height = Math.floor(h * dpr);
    
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Draw white background
    exportCtx.fillStyle = SOUND_SHAPE_BG_COLOR;
    exportCtx.fillRect(0, 0, w, h);
    
    // Draw the brush layer (accumulated strokes)
    exportCtx.drawImage(soundShapeBrushCanvas, 0, 0, w, h);
    
    // Draw the draggable shapes on top
    const centerX = w / 2;
    for (let i = 0; i < soundShapePositions.length; i++) {
        const shape = soundShapePositions[i];
        const multipliers = [1.0, 1.3, 1.5, 1.4, 1.2, 1.3];
        const size = SOUND_SHAPE_SIZE * (multipliers[shape.shapeType] || 1.0);
        
        // Draw shape on left side
        exportCtx.save();
        exportCtx.translate(shape.x, shape.y);
        exportCtx.fillStyle = SOUND_SHAPE_FILL_COLOR;
        exportCtx.strokeStyle = SOUND_SHAPE_STROKE_COLOR;
        exportCtx.lineWidth = SOUND_SHAPE_STROKE_W;
        drawSoundShapeByType(exportCtx, 0, 0, size, shape.shapeType);
        exportCtx.restore();
        
        // Draw mirrored shape on right side
        const mirroredX = w - shape.x;
        if (Math.abs(shape.x - centerX) > 5) {
            exportCtx.save();
            exportCtx.translate(mirroredX, shape.y);
            exportCtx.fillStyle = SOUND_SHAPE_FILL_COLOR;
            exportCtx.strokeStyle = SOUND_SHAPE_STROKE_COLOR;
            exportCtx.lineWidth = SOUND_SHAPE_STROKE_W;
            drawSoundShapeByType(exportCtx, 0, 0, size, shape.shapeType);
            exportCtx.restore();
        }
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `synesthesia-drawing-${timestamp}.png`;
    
    // Create download link and trigger download
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}

// State persistence
function getCurrentSoundShapePageId() {
    // Get current page ID from selected colors
    return `${selectedLeftIndex}-${selectedRightIndex}`;
}

function saveSoundShapeState() {
    const pageId = getCurrentSoundShapePageId();
    if (!pageId) return;
    
    try {
        // Save brush layer as image data
        let imageData = null;
        if (soundShapeBrushCanvas) {
            imageData = soundShapeBrushCanvas.toDataURL('image/png');
        }
        
        soundShapeStateStorage[pageId] = {
            imageData: imageData,
            recordedPoints: [...soundShapeRecordedPoints]
        };
    } catch (e) {
        console.warn('Failed to save sound shape state:', e);
    }
}

function restoreSoundShapeState() {
    const pageId = getCurrentSoundShapePageId();
    if (!pageId) {
        clearSoundShapeBrushLayer();
        soundShapeRecordedPoints = [];
        return false;
    }
    
    const savedState = soundShapeStateStorage[pageId];
    if (!savedState) {
        clearSoundShapeBrushLayer();
        soundShapeRecordedPoints = [];
        return false;
    }
    
    try {
        // Restore recorded points
        if (savedState.recordedPoints && savedState.recordedPoints.length > 0) {
            soundShapeRecordedPoints = [...savedState.recordedPoints];
        } else {
            soundShapeRecordedPoints = [];
        }
        
        // Restore brush layer image
        if (savedState.imageData && soundShapeBrushCtx) {
            const img = new Image();
            img.onload = () => {
                const containerRect = soundShapeContainer.getBoundingClientRect();
                soundShapeBrushCtx.drawImage(img, 0, 0, containerRect.width, containerRect.height);
                renderSoundShapeFrame();
            };
            img.src = savedState.imageData;
        }
        
        return true;
    } catch (e) {
        console.warn('Failed to restore sound shape state:', e);
        clearSoundShapeBrushLayer();
        soundShapeRecordedPoints = [];
        return false;
    }
}

// Visibility update function
function updateSoundShapeCanvasVisibility(pageId) {
    if (!soundShapeContainer) return;
    
    // Show for pages "0-1" or "1-0" (Shape + Sound)
    const isSoundShapePage = pageId === '0-1' || pageId === '1-0';
    
    if (isSoundShapePage) {
        soundShapeContainer.classList.remove('hidden');
        soundShapeActive = true;
        
        // Stop any ongoing replay first
        if (soundShapeIsReplaying) {
            soundShapeIsReplaying = false;
            if (soundShapeAnimationId) {
                cancelAnimationFrame(soundShapeAnimationId);
                soundShapeAnimationId = null;
            }
            if (soundShapePlayBtn) {
                soundShapePlayBtn.textContent = '[play]';
            }
        }
        
        // Resize and restore state after a brief delay
        setTimeout(() => {
            resizeSoundShapeCanvas();
            restoreSoundShapeState();
            renderSoundShapeFrame();
        }, 50);
    } else {
        // Save state before hiding
        if (soundShapeActive) {
            saveSoundShapeState();
        }
        
        soundShapeContainer.classList.add('hidden');
        soundShapeActive = false;
        
        // Stop replay
        if (soundShapeIsReplaying) {
            soundShapeIsReplaying = false;
            if (soundShapeAnimationId) {
                cancelAnimationFrame(soundShapeAnimationId);
                soundShapeAnimationId = null;
            }
            if (soundShapePlayBtn) {
                soundShapePlayBtn.textContent = '[play]';
            }
        }
    }
}

// ==================
// SOUND + EMOTION SMILEY
// ==================
// Interactive smiley face with slider-controlled mouth curve

// State variables for Sound + Emotion interaction
let soundEmotionContainer = null;
let soundEmotionSmiley = null;
let soundEmotionSlider = null;
let smileyFace = null;
let smileyEyeLeft = null;
let smileyEyeRight = null;
let smileyMouth = null;

// Web Audio API state for Sound + Emotion
let soundEmotionAudioContext = null;
let soundEmotionOscillator = null;
let soundEmotionGainNode = null;
let soundEmotionIsPlaying = false;

// Initialize Web Audio context (must be called after user interaction)
function initSoundEmotionAudio() {
    if (soundEmotionAudioContext) return; // Already initialized
    
    soundEmotionAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    soundEmotionGainNode = soundEmotionAudioContext.createGain();
    soundEmotionGainNode.connect(soundEmotionAudioContext.destination);
    soundEmotionGainNode.gain.value = 0.3; // Volume level (0-1)
}

// Start playing oscillator sound
function startSoundEmotionTone(sliderValue) {
    // Initialize audio context on first user interaction
    initSoundEmotionAudio();
    
    // Resume audio context if suspended (browser autoplay policy)
    if (soundEmotionAudioContext.state === 'suspended') {
        soundEmotionAudioContext.resume();
    }
    
    // Don't create a new oscillator if already playing
    if (soundEmotionIsPlaying) {
        updateSoundEmotionPitch(sliderValue);
        return;
    }
    
    // Create oscillator
    soundEmotionOscillator = soundEmotionAudioContext.createOscillator();
    soundEmotionOscillator.type = 'sine'; // Smooth sine wave
    soundEmotionOscillator.connect(soundEmotionGainNode);
    
    // Set initial frequency based on slider
    updateSoundEmotionPitch(sliderValue);
    
    // Start the oscillator
    soundEmotionOscillator.start();
    soundEmotionIsPlaying = true;
}

// Update oscillator frequency based on slider value
// Maps slider (-100 to 100) to frequency (200Hz to 600Hz)
function updateSoundEmotionPitch(sliderValue) {
    if (!soundEmotionOscillator) return;
    
    // Map slider value to frequency
    // -100 (sad/left) → 200Hz (low pitch)
    // 0 (neutral) → 400Hz
    // 100 (happy/right) → 600Hz (high pitch)
    const minFreq = 200;
    const maxFreq = 600;
    const normalizedValue = (sliderValue + 100) / 200; // 0 to 1
    const frequency = minFreq + (normalizedValue * (maxFreq - minFreq));
    
    // Smooth frequency transition
    soundEmotionOscillator.frequency.setTargetAtTime(
        frequency, 
        soundEmotionAudioContext.currentTime, 
        0.05 // Smoothing time constant
    );
}

// Stop the oscillator sound
function stopSoundEmotionTone() {
    if (soundEmotionOscillator && soundEmotionIsPlaying) {
        soundEmotionOscillator.stop();
        soundEmotionOscillator.disconnect();
        soundEmotionOscillator = null;
        soundEmotionIsPlaying = false;
    }
}

// Function to update Sound + Emotion smiley visibility
function updateSoundEmotionVisibility(pageId) {
    soundEmotionContainer = document.getElementById('sound-emotion-container');
    if (!soundEmotionContainer) return;
    
    // Show for pages "1-4" or "4-1" (Sound + Emotion)
    const isSoundEmotionPage = pageId === '1-4' || pageId === '4-1';
    
    if (isSoundEmotionPage) {
        soundEmotionContainer.classList.remove('hidden');
        // Initialize and resize after a brief delay to ensure container is visible
        setTimeout(() => {
            initializeSoundEmotionSmiley();
            resizeSoundEmotionSmiley();
        }, 50);
    } else {
        soundEmotionContainer.classList.add('hidden');
        // Stop any playing sound when leaving the page
        stopSoundEmotionTone();
    }
}

// Initialize the smiley interaction
function initializeSoundEmotionSmiley() {
    soundEmotionSmiley = document.getElementById('sound-emotion-smiley');
    soundEmotionSlider = document.getElementById('sound-emotion-slider');
    smileyFace = document.getElementById('smiley-face');
    smileyEyeLeft = document.getElementById('smiley-eye-left');
    smileyEyeRight = document.getElementById('smiley-eye-right');
    smileyMouth = document.getElementById('smiley-mouth');
    
    if (!soundEmotionSmiley || !soundEmotionSlider) return;
    
    // Remove old listeners to prevent duplicates
    soundEmotionSlider.removeEventListener('input', handleSoundEmotionSlider);
    soundEmotionSlider.removeEventListener('mouseup', handleSoundEmotionSliderRelease);
    soundEmotionSlider.removeEventListener('touchend', handleSoundEmotionSliderRelease);
    soundEmotionSlider.removeEventListener('mouseleave', handleSoundEmotionSliderRelease);
    
    // Add slider event listeners
    soundEmotionSlider.addEventListener('input', handleSoundEmotionSlider);
    // Stop sound when user releases slider
    soundEmotionSlider.addEventListener('mouseup', handleSoundEmotionSliderRelease);
    soundEmotionSlider.addEventListener('touchend', handleSoundEmotionSliderRelease);
    soundEmotionSlider.addEventListener('mouseleave', handleSoundEmotionSliderRelease);
    
    // Initial render
    resizeSoundEmotionSmiley();
}

// Handle slider release (stop sound)
function handleSoundEmotionSliderRelease() {
    stopSoundEmotionTone();
}

// Handle slider input
function handleSoundEmotionSlider(e) {
    const value = parseInt(e.target.value, 10);
    updateSmileyMouth(value);
    // Start/update sound based on slider value
    startSoundEmotionTone(value);
}

// Resize and position smiley elements
function resizeSoundEmotionSmiley() {
    if (!soundEmotionSmiley || !smileyFace || !smileyEyeLeft || !smileyEyeRight || !smileyMouth) return;
    
    const svgRect = soundEmotionSmiley.getBoundingClientRect();
    const width = svgRect.width;
    const height = svgRect.height;
    
    if (width === 0 || height === 0) return;
    
    // Set SVG viewBox to match dimensions
    soundEmotionSmiley.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Calculate ellipse dimensions
    // Ellipse fills the full width and height of the SVG
    const ellipseCx = width / 2;
    const ellipseCy = height / 2;
    const ellipseRx = (width / 2) - 10; // Padding for stroke
    const ellipseRy = (height / 2) - 10; // Padding for stroke
    
    // Set ellipse attributes
    smileyFace.setAttribute('cx', ellipseCx);
    smileyFace.setAttribute('cy', ellipseCy);
    smileyFace.setAttribute('rx', ellipseRx);
    smileyFace.setAttribute('ry', ellipseRy);
    
    // Position eyes - 1/3 from top, 1/4 from each side
    const eyeY = ellipseCy - ellipseRy * 0.25; // Slightly above center
    const eyeLeftX = ellipseCx - ellipseRx * 0.35;
    const eyeRightX = ellipseCx + ellipseRx * 0.35;
    const eyeBaseRadius = Math.min(ellipseRx, ellipseRy) * 0.18; // Eye size relative to face (larger for smiley look)
    
    // Store base eye radius for dynamic updates
    smileyEyeLeft.dataset.baseRadius = eyeBaseRadius;
    smileyEyeRight.dataset.baseRadius = eyeBaseRadius;
    
    smileyEyeLeft.setAttribute('cx', eyeLeftX);
    smileyEyeLeft.setAttribute('cy', eyeY);
    smileyEyeLeft.setAttribute('rx', eyeBaseRadius);
    smileyEyeLeft.setAttribute('ry', eyeBaseRadius);
    
    smileyEyeRight.setAttribute('cx', eyeRightX);
    smileyEyeRight.setAttribute('cy', eyeY);
    smileyEyeRight.setAttribute('rx', eyeBaseRadius);
    smileyEyeRight.setAttribute('ry', eyeBaseRadius);
    
    // Update mouth and eyes with current slider value
    const sliderValue = soundEmotionSlider ? parseInt(soundEmotionSlider.value, 10) : 0;
    updateSmileyMouth(sliderValue);
}

// Update mouth curve based on slider value (-100 to 100)
function updateSmileyMouth(sliderValue) {
    if (!soundEmotionSmiley || !smileyMouth || !smileyFace) return;
    
    const svgRect = soundEmotionSmiley.getBoundingClientRect();
    const width = svgRect.width;
    const height = svgRect.height;
    
    if (width === 0 || height === 0) return;
    
    // Get ellipse dimensions
    const ellipseCx = width / 2;
    const ellipseCy = height / 2;
    const ellipseRx = (width / 2) - 10;
    const ellipseRy = (height / 2) - 10;
    
    // Mouth position - below center
    const mouthY = ellipseCy + ellipseRy * 0.25;
    const mouthWidth = ellipseRx * 0.7; // Wider mouth (70% of face width)
    
    // Start and end points of mouth
    const mouthStartX = ellipseCx - mouthWidth;
    const mouthEndX = ellipseCx + mouthWidth;
    
    // Control point for quadratic bezier
    // sliderValue: -100 (left/sad) to 100 (right/happy)
    // Left side = frown, Right side = smile
    const maxCurve = ellipseRy * 0.85; // Maximum curve amount (exaggerated curvature)
    const curveAmount = (-sliderValue / 100) * maxCurve;
    
    // Control point Y: subtract curveAmount (so positive = curves up = happy)
    const controlX = ellipseCx;
    const controlY = mouthY - curveAmount;
    
    // Create quadratic bezier path
    const pathD = `M ${mouthStartX} ${mouthY} Q ${controlX} ${controlY} ${mouthEndX} ${mouthY}`;
    smileyMouth.setAttribute('d', pathD);
    
    // Update eye shape based on emotion
    // When happy (positive slider), eyes become more elliptical (squinting smile)
    // When sad (negative slider), eyes stay round
    updateSmileyEyes(sliderValue);
}

// Update eye shape based on slider value
// Happy = more elliptical (wider, shorter), Sad = round
function updateSmileyEyes(sliderValue) {
    if (!smileyEyeLeft || !smileyEyeRight) return;
    
    const baseRadiusLeft = parseFloat(smileyEyeLeft.dataset.baseRadius) || 20;
    const baseRadiusRight = parseFloat(smileyEyeRight.dataset.baseRadius) || 20;
    
    // Normalize slider value: 0 (sad/neutral) to 1 (happy)
    // Only apply squish effect when happy (positive values)
    const happinessLevel = Math.max(0, sliderValue) / 100; // 0 to 1
    
    // When happy, eyes get wider (rx increases) and shorter (ry decreases)
    // Maximum squish: rx = 1.4x base, ry = 0.5x base
    const rxMultiplier = 1 + (happinessLevel * 0.4); // 1.0 to 1.4
    const ryMultiplier = 1 - (happinessLevel * 0.5); // 1.0 to 0.5
    
    // Apply to left eye
    smileyEyeLeft.setAttribute('rx', baseRadiusLeft * rxMultiplier);
    smileyEyeLeft.setAttribute('ry', baseRadiusLeft * ryMultiplier);
    
    // Apply to right eye
    smileyEyeRight.setAttribute('rx', baseRadiusRight * rxMultiplier);
    smileyEyeRight.setAttribute('ry', baseRadiusRight * ryMultiplier);
}

// Handle window resize for Sound + Emotion smiley
let soundEmotionResizeTimeout = null;
window.addEventListener('resize', () => {
    if (soundEmotionResizeTimeout) clearTimeout(soundEmotionResizeTimeout);
    soundEmotionResizeTimeout = setTimeout(() => {
        // Only resize if container is visible
        if (soundEmotionContainer && !soundEmotionContainer.classList.contains('hidden')) {
            resizeSoundEmotionSmiley();
        }
    }, 100);
});

// Function to initialize SYN logo hover effect
// Shows synesthesia text overlay when hovering over the SYN logo
function initializeSynHoverEffect() {
    // Initialize SYN hover overlay - now using logo-container for unified hover
    const logoContainer = document.querySelector('.logo-container');
    const synElement = document.querySelector('.black-rectangle-syn');
    const ethesiaElement = document.querySelector('.black-rectangle-ethesia');
    const synOverlay = document.getElementById('canvas-text-box-syn-overlay');
    const synBacking = document.getElementById('canvas-text-box-syn-backing');
    
    if (logoContainer && synOverlay && synBacking) {
        // Render overlay text with line backgrounds to match main text box styling
        // Use same width as main text box (1035px) for the SYN overlay
        // Use black background color (#2C2C2C) for line backgrounds to match UI black
        const synText = 'syn-ethesia is a perceptual phenomenon in which the stimulation of one sense automatically triggers experiences in another. A sound may appear as a color, a letter may carry a specific hue, or a number may feel spatial or textured. These cross-sensory connections happen naturally and consistently, forming a unique inner world for each person who experiences them.';
        renderTextWithLineBackgrounds(synOverlay, synText, 1035, '#2C2C2C');
        
        // Helper function to show overlay
        const showOverlay = () => {
            synBacking.classList.add('visible');
            synOverlay.classList.add('visible');
        };
        
        // Helper function to hide overlay
        const hideOverlay = () => {
            synBacking.classList.remove('visible');
            synOverlay.classList.remove('visible');
        };
        
        // Show overlay when hovering on either SYN or [esthesia] rectangle
        if (synElement) {
            synElement.addEventListener('mouseenter', showOverlay);
            synElement.addEventListener('mouseleave', hideOverlay);
        }
        if (ethesiaElement) {
            ethesiaElement.addEventListener('mouseenter', showOverlay);
            ethesiaElement.addEventListener('mouseleave', hideOverlay);
        }
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

// Function to initialize logo hover effect - expands all scrollbar color items and pushes UI rectangles inward when hovering on SYN logo
function initializeColorKeyClickEffect() {
    const synElement = document.querySelector('.black-rectangle-syn');
    const ethesiaElement = document.querySelector('.black-rectangle-ethesia');
    
    if (!synElement && !ethesiaElement) return;
    
    // Get all color items from both columns
    const allColorItems = document.querySelectorAll('.color-item');
    
    // Get mask containers (CSS expects logo-hovered on these, not the inner rectangles)
    const maskIndex = document.querySelector('.ui-rect-mask-index');
    const maskLeft = document.querySelector('.ui-rect-mask-left');
    const maskRight = document.querySelector('.ui-rect-mask-right');
    
    // Get the logo hover overlay (darkens and blurs canvas area)
    const logoHoverOverlay = document.getElementById('logo-hover-overlay');
    
    // Get the logo hover text boxes
    const logoHoverTextBox1 = document.getElementById('logo-hover-text-box-1');
    const logoHoverTextBox2 = document.getElementById('logo-hover-text-box-2');
    
    // Helper function to handle hover in - expand all items and push UI rectangles inward
    const handleHoverIn = () => {
        // Add legend-expanded class to ALL items (both columns) for bulk hover effect
        allColorItems.forEach(item => {
            item.classList.add('legend-expanded');
        });
        
        // Add logo-hovered class to mask containers to push them inward (to 85px from edges)
        if (maskIndex) maskIndex.classList.add('logo-hovered');
        if (maskLeft) maskLeft.classList.add('logo-hovered');
        if (maskRight) maskRight.classList.add('logo-hovered');
        
        // Show the logo hover overlay (10% black + blur on canvas area)
        if (logoHoverOverlay) logoHoverOverlay.classList.add('visible');
        
        // Show the logo hover text boxes
        if (logoHoverTextBox1) logoHoverTextBox1.classList.add('visible');
        if (logoHoverTextBox2) logoHoverTextBox2.classList.add('visible');
    };
    
    // Helper function to handle hover out - collapse all items and reset UI rectangles
    const handleHoverOut = () => {
        // Remove legend-expanded class from all items
        allColorItems.forEach(item => {
            item.classList.remove('legend-expanded');
        });
        
        // Remove logo-hovered class from mask containers to reset their position (back to 50px)
        if (maskIndex) maskIndex.classList.remove('logo-hovered');
        if (maskLeft) maskLeft.classList.remove('logo-hovered');
        if (maskRight) maskRight.classList.remove('logo-hovered');
        
        // Hide the logo hover overlay
        if (logoHoverOverlay) logoHoverOverlay.classList.remove('visible');
        
        // Hide the logo hover text boxes
        if (logoHoverTextBox1) logoHoverTextBox1.classList.remove('visible');
        if (logoHoverTextBox2) logoHoverTextBox2.classList.remove('visible');
    };
    
    // Add event listeners to both logo rectangles for unified hover behavior
    if (synElement) {
        synElement.addEventListener('mouseenter', handleHoverIn);
        synElement.addEventListener('mouseleave', handleHoverOut);
    }
    if (ethesiaElement) {
        ethesiaElement.addEventListener('mouseenter', handleHoverIn);
        ethesiaElement.addEventListener('mouseleave', handleHoverOut);
    }
}

// Function to initialize INDEX hover effect - shows white overlay on canvas when hovering on INDEX button
function initializeIndexHoverEffect() {
    const indexButton = document.querySelector('.black-corner-rectangle');
    const indexPageOverlay = document.getElementById('index-page-overlay');
    const paramRectLeft = document.querySelector('.black-bottom-rectangle-left');
    const paramRectRight = document.querySelector('.black-bottom-rectangle-right');
    const shuttersContainer = document.getElementById('index-shutters-container');
    
    if (!indexButton || !indexPageOverlay) return;
    
    // Track if index is currently open
    let indexIsOpen = false;
    
    // Helper to open index (show overlay, expand letters, hide param rects, trigger shutter animation)
    const openIndex = () => {
        // Only trigger shutter animation if transitioning from closed to open
        const wasAlreadyOpen = indexIsOpen;
        
        indexIsOpen = true;
        indexPageOverlay.classList.add('visible');
        indexButton.classList.add('color-key-expanded'); // Keep letters expanded
        if (paramRectLeft) paramRectLeft.classList.add('index-hovered');
        if (paramRectRight) paramRectRight.classList.add('index-hovered');
        
        // Trigger shutter animation only when first opening (not when moving between INDEX and overlay)
        if (!wasAlreadyOpen && shuttersContainer) {
            shuttersContainer.classList.remove('animating');
            // Use requestAnimationFrame to ensure the class removal is processed before re-adding
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    shuttersContainer.classList.add('animating');
                });
            });
        }
    };
    
    // Helper to close index (hide overlay, collapse letters, show param rects, reset shutters)
    const closeIndex = () => {
        indexIsOpen = false;
        indexPageOverlay.classList.remove('visible');
        indexButton.classList.remove('color-key-expanded'); // Collapse letters
        if (paramRectLeft) paramRectLeft.classList.remove('index-hovered');
        if (paramRectRight) paramRectRight.classList.remove('index-hovered');
        
        // Reset shutters to initial position (instant, no animation)
        if (shuttersContainer) {
            shuttersContainer.classList.remove('animating');
        }
    };
    
    // INDEX button: open if closed, close if open
    indexButton.addEventListener('mouseenter', () => {
        if (indexIsOpen) {
            // Close when hovering on INDEX while overlay is open
            closeIndex();
        } else {
            // Open when hovering on INDEX while overlay is closed
            openIndex();
        }
    });
    
    // When leaving INDEX button to overlay, keep open; otherwise close
    indexButton.addEventListener('mouseleave', (e) => {
        // If moving to overlay, keep open state
        if (indexPageOverlay.contains(e.relatedTarget)) {
            // Moving to overlay - keep open
            return;
        }
        // If overlay is not open anymore (was closed by mouseenter), don't do anything
        if (!indexIsOpen) {
            return;
        }
        // Leaving to somewhere else while open - close
        closeIndex();
    });
    
    // Overlay: keep index open when hovering over it
    indexPageOverlay.addEventListener('mouseenter', () => {
        // Keep open state and expanded letters
        openIndex();
    });
    
    // When leaving overlay, close unless going to INDEX button
    indexPageOverlay.addEventListener('mouseleave', (e) => {
        if (!indexButton.contains(e.relatedTarget)) {
            closeIndex();
        }
    });
    
    // Add click handlers for index items to navigate to pages
    const indexItems = indexPageOverlay.querySelectorAll('.index-item');
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) return;
    
    indexItems.forEach(item => {
        item.addEventListener('click', () => {
            const leftIndex = parseInt(item.dataset.left, 10);
            const rightIndex = parseInt(item.dataset.right, 10);
            
            // Calculate scroll positions
            const itemHeight = window.innerHeight / 6;
            const singleSetHeight = 6 * itemHeight; // Start of middle set
            
            // Scroll both columns to the correct indices
            // Position in middle set + index offset
            leftColumn.scrollTop = singleSetHeight + (leftIndex * itemHeight);
            rightColumn.scrollTop = singleSetHeight + (rightIndex * itemHeight);
            
            // Close the index (hide overlay, collapse letters, show param rects)
            closeIndex();
        });
    });
}

// Function to align PARAMETER TEXT-BOX rectangles with logo bottom edge
// Note: SIGNAL rectangle is now positioned at bottom via CSS, no JS alignment needed
// Note: Positioning is now on mask containers (.ui-rect-mask-left, .ui-rect-mask-right)
function alignRectanglesWithEsthesia() {
    // Wait for fonts to load if available, then wait for layout to stabilize
    const waitForLayout = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Use logo-container for alignment (contains both SYN and [esthesia] rectangles)
                const logoContainer = document.querySelector('.logo-container');
                // Get mask containers instead of rectangles for positioning
                const maskLeft = document.querySelector('.ui-rect-mask-left');
                const maskRight = document.querySelector('.ui-rect-mask-right');
                
                if (!logoContainer) {
                    console.warn('Logo alignment: Missing logo container element');
                    return;
                }
                
                // Measure the logo container using getBoundingClientRect()
                const logoContainerBounds = logoContainer.getBoundingClientRect();
                const logoBottom = logoContainerBounds.bottom;
                
                // Align left mask container
                if (maskLeft) {
                    const leftRectHeight = 40; // Fixed height of mask/rectangle
                    const leftTop = logoBottom - leftRectHeight;
                    maskLeft.style.top = `${leftTop}px`;
                }
                
                // Align right mask container
                if (maskRight) {
                    const rightRectHeight = 40; // Fixed height of mask/rectangle
                    const rightTop = logoBottom - rightRectHeight;
                    maskRight.style.top = `${rightTop}px`;
                }
                
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
    
    // Only remove logo-animating when intro is COMPLETED (gradients fully collapsed)
    // This ensures logo stays above gradients (z-index: 6) during the collapse animation
    // If we remove it when hasExpandedToScrollbars is true, the logo would be covered by
    // the still-visible gradients (z-index: 5 > z-index: 2)
    if (introCompleted) {
        uiLayer.classList.remove('logo-animating');
    }
    
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
    
    // Start logo entrance animation IN PARALLEL with gradient shrink
    // Both animations run together (logo animation duration matches gradient shrink: 2000ms)
    startLogoEntranceAnimation();
    
    // After gradient shrink animation completes (2000ms), entry animation is done
    // Logo animation also completes around the same time (synced duration)
    setTimeout(() => {
        // Entry animation complete - but UI stays hidden
        // hasExpandedToScrollbars remains false until EXPAND happens
        
        // Verify UI is still hidden after entry animation
        updateUIVisibility();
        
        // Mark logo as visible (animation complete)
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.classList.remove('logo-entering');
            logoContainer.classList.add('logo-visible');
        }
        
        // Trigger demo after both animations complete
        triggerDemo();
        
        // Note: Header (first rectangle at index 0) visibility is controlled by intro container visibility
    }, 2000);
}

// Function to animate logo entrance (rises up from behind top gradient)
// Called at the same time as gradient shrink - both animations run in parallel
function startLogoEntranceAnimation() {
    const logoContainer = document.querySelector('.logo-container');
    const uiLayer = document.querySelector('.ui-layer');
    
    if (!logoContainer || !uiLayer) {
        return;
    }
    
    // Add logo-animating class to UI layer to make only the logo visible
    // This overrides the UI layer's opacity: 0 for just the logo
    uiLayer.classList.add('logo-animating');
    
    // Remove hidden state to trigger the animation
    // The logo-entering class is already added (during initialization)
    // and has the transition defined, so removing logo-intro-hidden triggers the animation
    // Animation duration is synced with gradient shrink (2000ms in CSS)
    logoContainer.classList.remove('logo-intro-hidden');
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
    
    // Create two separate instructional text elements for independent positioning
    // Line 1: positioned at bottom of gradient rectangle index 2 (3rd from top)
    const introTextLine1 = document.createElement('div');
    introTextLine1.className = 'gradient-intro-text gradient-intro-text-line1';
    introTextLine1.innerHTML = '<span class="intro-line">' + INTRO_LINE_1_TEXT + '</span>';
    introTextLine1.id = 'gradient-intro-text-line1';
    // No inline opacity - CSS handles visibility via intro-line transform (slide-up from mask)
    // Container is always visible (opacity: 1), inner .intro-line starts hidden (translateY: 100%)
    container.appendChild(introTextLine1);
    
    // Line 2: positioned at bottom of gradient rectangle index 3 (4th from top)
    const introTextLine2 = document.createElement('div');
    introTextLine2.className = 'gradient-intro-text gradient-intro-text-line2';
    introTextLine2.innerHTML = '<span class="intro-line">' + INTRO_LINE_2_TEXT + '</span>';
    introTextLine2.id = 'gradient-intro-text-line2';
    // No inline opacity - CSS handles visibility via intro-line transform (slide-up from mask)
    container.appendChild(introTextLine2);
    
    // Create START button container with same mask structure as intro lines
    // Uses gradient-intro-text-start class for mask container and intro-line for inner styling
    const introTextStart = document.createElement('div');
    introTextStart.className = 'gradient-intro-text gradient-intro-text-start';
    introTextStart.id = 'gradient-intro-text-start';
    introTextStart.innerHTML = '<span class="intro-line">[start]</span>';
    // Hidden by default - will slide up after intro lines exit
    container.appendChild(introTextStart);
    
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
    
    // Initialize logo in hidden state for entrance animation
    // Logo will rise up from behind the top gradient rectangle before demo starts
    // We add both classes: logo-intro-hidden (hidden position) and logo-entering (has transition)
    // When animating, we remove logo-intro-hidden to trigger the transition to final position
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.classList.add('logo-intro-hidden');
        logoContainer.classList.add('logo-entering');
    }
    
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
    
    // Position instructional text lines - each at the bottom of its respective gradient rectangle
    // Text fades in during entry animation (synced with gradient shrink)
    const LINE_HEIGHT = 40; // Height of each intro-line element (matches CSS and parameter rectangles)
    
    // Line 1: bottom-aligned to gradient rectangle index 2 (3rd from top)
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    if (introTextLine1) {
        const rectIndex1 = 2; // 3rd gradient from top (0-indexed)
        // Bottom-aligned: top = bottom edge of rectangle - line height
        const line1Top = (rectIndex1 + 1) * itemHeight - LINE_HEIGHT;
        
        introTextLine1.style.left = `${leftEdge - 250}px`;
        introTextLine1.style.width = `${width}px`;
        introTextLine1.style.top = `${line1Top}px`;
        introTextLine1.style.height = `${LINE_HEIGHT}px`;
        // CSS handles display, alignItems, justifyContent for slide-up mask effect
        introTextLine1.style.visibility = 'visible';
        // DO NOT set opacity or alignItems inline - CSS handles the slide-up animation
    }
    
    // Line 2: bottom-aligned to gradient rectangle index 3 (4th from top)
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (introTextLine2) {
        const rectIndex2 = 3; // 4th gradient from top (0-indexed)
        // Bottom-aligned: top = bottom edge of rectangle - line height
        const line2Top = (rectIndex2 + 1) * itemHeight - LINE_HEIGHT;
        
        introTextLine2.style.left = `${leftEdge + 250}px`;
        introTextLine2.style.width = `${width}px`;
        introTextLine2.style.top = `${line2Top}px`;
        introTextLine2.style.height = `${LINE_HEIGHT}px`;
        // CSS handles display, alignItems, justifyContent for slide-up mask effect
        introTextLine2.style.visibility = 'visible';
        // DO NOT set opacity or alignItems inline - CSS handles the slide-up animation
    }
    
    // START button: positioned in gradient rectangle index 3 (4th from top) - same as line 2 but centered
    const introTextStart = document.getElementById('gradient-intro-text-start');
    if (introTextStart) {
        const rectIndexStart = 3; // 4th gradient from top (0-indexed)
        // Bottom-aligned: top = bottom edge of rectangle - line height (same as intro lines)
        const startTop = (rectIndexStart + 1) * itemHeight - LINE_HEIGHT;
        
        introTextStart.style.left = `${leftEdge}px`;
        introTextStart.style.width = `${width}px`;
        introTextStart.style.top = `${startTop}px`;
        introTextStart.style.height = `${LINE_HEIGHT}px`;
        // CSS handles display, alignItems, justifyContent for slide-up mask effect
        // Visibility handled by showStartButtonElement() - don't override here
    }
    
    // Legacy: also check for old single element (for backward compatibility during transition)
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        const isStartButton = introText.textContent === '[start]';
        
        // For START button, position it in the 4th rectangle (index 3) - 3rd from bottom
        const rectIndex = 3;
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
        if (!isStartButton) {
            introText.style.display = 'flex';
            introText.style.visibility = 'visible';
        }
    }
    
    // Position arrow element below START text (only when START is visible and not entering)
    const arrowElement = document.getElementById('gradient-intro-arrow');
    // Check if START button is visible (either new container or legacy element)
    const startButtonVisible = (introTextStart && introTextStart.style.display !== 'none') ||
                               (introText && introText.textContent === '[start]');
    if (arrowElement) {
        if (introPhase === 'entering') {
            // Hide arrow during entry animation
            arrowElement.style.display = 'none';
            arrowElement.style.visibility = 'hidden';
            arrowElement.style.opacity = '0';
        } else if (startButtonVisible) {
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
    
    // Trigger triangle slide-out animation (intro closing)
    document.body.classList.remove('triangles-revealed');
    
    // Hide all intro text elements immediately (both lines and START button)
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    if (introTextLine1) {
        introTextLine1.style.display = 'none';
        introTextLine1.style.visibility = 'hidden';
        introTextLine1.style.opacity = '0';
        introTextLine1.style.pointerEvents = 'none';
    }
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (introTextLine2) {
        introTextLine2.style.display = 'none';
        introTextLine2.style.visibility = 'hidden';
        introTextLine2.style.opacity = '0';
        introTextLine2.style.pointerEvents = 'none';
    }
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        introText.style.display = 'none';
        introText.style.visibility = 'hidden';
        introText.style.opacity = '0';
        introText.style.pointerEvents = 'none';
    }
    
    // Hide new START button container
    const introTextStart = document.getElementById('gradient-intro-text-start');
    if (introTextStart) {
        introTextStart.style.display = 'none';
        introTextStart.style.visibility = 'hidden';
        introTextStart.style.opacity = '0';
        introTextStart.style.pointerEvents = 'none';
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

// ==================
// SCROLL HINT ANIMATION
// Continuous bounce animation on scroll columns to hint users to interact
// Runs after demo ends until user scrolls and START appears
// ==================

// Function to start continuous scroll hint animation after demo ends
function startScrollHintAnimation() {
    // Prevent multiple triggers
    if (scrollHintAnimationTriggered || scrollHintAnimationActive) return;
    scrollHintAnimationTriggered = true;
    scrollHintAnimationActive = true;
    
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) {
        scrollHintAnimationActive = false;
        return;
    }
    
    // CRITICAL FIX: Disable scroll-snap during animation to allow smooth programmatic scrolling
    // scroll-snap-type: y mandatory was preventing scrollTop changes from taking effect
    leftColumn.style.scrollSnapType = 'none';
    rightColumn.style.scrollSnapType = 'none';
    
    // Animation parameters
    const nudgeDistance = 32; // pixels to move (reduced by 30% from 45)
    const bounceDuration = 400; // ms per single direction (out or back)
    const pauseBetweenBounces = 200; // ms pause between bounces within a set
    const pauseAfterSet = 1500; // ms pause after 2 bounces (1.5 seconds)
    const bouncesPerSet = 2; // Number of bounces before long pause
    
    // Track bounce count for rhythm pattern (2 bounces, pause, repeat)
    let bounceCount = 0;
    
    // Mark as programmatic scroll to prevent triggering user interaction detection
    isProgrammaticScroll = true;
    
    // Easing function for smooth animation (ease-in-out)
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Animate a single column's scroll position
    function animateScroll(column, startPos, endPos, duration, callback) {
        const startTime = performance.now();
        
        function animate(currentTime) {
            // Check if animation should stop
            if (!scrollHintAnimationActive) {
                isProgrammaticScroll = false;
                return;
            }
            
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);
            
            const currentPos = startPos + (endPos - startPos) * easedProgress;
            column.scrollTop = currentPos;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Perform one bounce cycle (out and back) for both columns, then loop
    function performBounce() {
        // Check if animation should stop
        if (!scrollHintAnimationActive) {
            isProgrammaticScroll = false;
            return;
        }
        
        // Get current scroll positions (may have changed if user scrolled)
        const leftOriginalScroll = leftColumn.scrollTop;
        const rightOriginalScroll = rightColumn.scrollTop;
        
        // Calculate target positions for this bounce
        // Right column: nudge DOWN (increase scrollTop)
        // Left column: nudge UP (decrease scrollTop)
        const rightTargetScroll = rightOriginalScroll + nudgeDistance;
        const leftTargetScroll = Math.max(0, leftOriginalScroll - nudgeDistance);
        
        // Phase 1: Move columns to nudge position (both simultaneously)
        let completedPhase1 = 0;
        
        function onPhase1Complete() {
            completedPhase1++;
            if (completedPhase1 === 2) {
                // Check if animation should stop
                if (!scrollHintAnimationActive) {
                    isProgrammaticScroll = false;
                    return;
                }
                
                // Both columns reached nudge position, now return
                // Phase 2: Return columns to original position
                let completedPhase2 = 0;
                
                function onPhase2Complete() {
                    completedPhase2++;
                    if (completedPhase2 === 2) {
                        // Check if animation should stop
                        if (!scrollHintAnimationActive) {
                            isProgrammaticScroll = false;
                            return;
                        }
                        
                        // Increment bounce count
                        bounceCount++;
                        
                        // Determine pause duration: short pause within set, long pause after set completes
                        let pauseDuration;
                        if (bounceCount >= bouncesPerSet) {
                            // Completed a set of 2 bounces - long pause
                            pauseDuration = pauseAfterSet;
                            bounceCount = 0; // Reset for next set
                        } else {
                            // Still within a set - short pause
                            pauseDuration = pauseBetweenBounces;
                        }
                        
                        // Start next bounce after calculated pause
                        setTimeout(() => {
                            performBounce();
                        }, pauseDuration);
                    }
                }
                
                // Return both columns to original position
                animateScroll(rightColumn, rightTargetScroll, rightOriginalScroll, bounceDuration, onPhase2Complete);
                animateScroll(leftColumn, leftTargetScroll, leftOriginalScroll, bounceDuration, onPhase2Complete);
            }
        }
        
        // Move both columns to nudge position
        animateScroll(rightColumn, rightOriginalScroll, rightTargetScroll, bounceDuration, onPhase1Complete);
        animateScroll(leftColumn, leftOriginalScroll, leftTargetScroll, bounceDuration, onPhase1Complete);
    }
    
    // Start the first bounce after 1.5 seconds delay (wait for intro to settle)
    setTimeout(() => {
        if (scrollHintAnimationActive) {
            performBounce();
        }
    }, 1500); // 1.5 second delay before animation starts
}

// Function to stop the scroll hint animation (called when START appears)
function stopScrollHintAnimation() {
    scrollHintAnimationActive = false;
    isProgrammaticScroll = false;
    
    // Re-enable scroll-snap on columns after animation stops
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    if (leftColumn) leftColumn.style.scrollSnapType = '';
    if (rightColumn) rightColumn.style.scrollSnapType = '';
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
            
            // Reveal UI rectangles early at 70% progress (before intro fully completes)
            const uiLayer = document.querySelector('.ui-layer');
            if (introProgress >= 0.7 && uiLayer && !uiLayer.classList.contains('words-revealed')) {
                uiLayer.classList.add('words-revealed');
            }
            
            // When progress reaches 1 for the first time, lock it
            if (introProgress >= 1 && !introCompleted) {
                introCompleted = true;
                // Update UI visibility - UI remains visible after intro is done
                updateUIVisibility();
                
                // Note: UI rectangles are already revealed at 70% progress (see above)
                
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
    
    // Get or create intro text line elements
    let introTextLine1 = document.getElementById('gradient-intro-text-line1');
    if (!introTextLine1) {
        introTextLine1 = document.createElement('div');
        introTextLine1.className = 'gradient-intro-text gradient-intro-text-line1';
        introTextLine1.innerHTML = '<span class="intro-line">' + INTRO_LINE_1_TEXT + '</span>';
        introTextLine1.id = 'gradient-intro-text-line1';
        gradientContainer.appendChild(introTextLine1);
    }
    
    let introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (!introTextLine2) {
        introTextLine2 = document.createElement('div');
        introTextLine2.className = 'gradient-intro-text gradient-intro-text-line2';
        introTextLine2.innerHTML = '<span class="intro-line">' + INTRO_LINE_2_TEXT + '</span>';
        introTextLine2.id = 'gradient-intro-text-line2';
        gradientContainer.appendChild(introTextLine2);
    }
    
    // Get or create START button element (legacy gradient-intro-text)
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
    
    // Hide all text and arrow during reverse animation (CSS will also hide them in intro-closing phase)
    introTextLine1.style.display = 'none';
    introTextLine1.style.visibility = 'hidden';
    introTextLine1.style.opacity = '0';
    introTextLine2.style.display = 'none';
    introTextLine2.style.visibility = 'hidden';
    introTextLine2.style.opacity = '0';
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
    
    // Immediately show logo in final position (skip any ongoing entrance animation)
    const logoContainer = document.querySelector('.logo-container');
    const uiLayer = document.querySelector('.ui-layer');
    if (logoContainer) {
        // Remove any animation classes and set to visible state
        logoContainer.classList.remove('logo-intro-hidden', 'logo-entering');
        logoContainer.classList.add('logo-visible');
    }
    if (uiLayer) {
        // Keep logo-animating so logo stays visible (rest of UI still hidden)
        uiLayer.classList.add('logo-animating');
    }
    
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
    
    // Trigger triangle slide-in animation (demo ended)
    document.body.classList.add('triangles-revealed');
    
    // Show START button (after intro lines slide out animation completes - 500ms)
    // setupStartButton() handles the full animation sequence:
    // 1. Animate instruction lines out (slide down)
    // 2. Wait 500ms for animation to complete
    // 3. Show START button with fade-in animation
    setupStartButton();
    
    // Ensure intro-active class exists for CSS rules to work
    if (gradientContainer && !gradientContainer.classList.contains('intro-active')) {
        gradientContainer.classList.add('intro-active');
    }
    
}

// Shared function to set up START button click handler
// This ensures consistent behavior whether START appears in initial intro or after returning via logo click
// First animates the instruction lines out (slide down), then shows START button
function setupStartButton() {
    // Stop scroll hint animation when START appears
    stopScrollHintAnimation();
    
    // Get the instruction line elements
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    
    // Get the inner intro-line elements for the exit animation
    const line1Inner = introTextLine1?.querySelector('.intro-line');
    const line2Inner = introTextLine2?.querySelector('.intro-line');
    
    // Check if lines are visible (have content and are displayed)
    const linesAreVisible = (introTextLine1 && introTextLine1.style.display !== 'none') ||
                            (introTextLine2 && introTextLine2.style.display !== 'none');
    
    if (linesAreVisible && (line1Inner || line2Inner)) {
        // Add exiting class to trigger slide-out animation (both lines together)
        if (line1Inner) line1Inner.classList.add('intro-line-exiting');
        if (line2Inner) line2Inner.classList.add('intro-line-exiting');
        
        // Wait for animation to complete, then hide lines and show START
        // Using 400ms instead of 800ms so START begins appearing while lines are still finishing
        // This creates a smoother, more connected transition
        setTimeout(() => {
            // Hide the text line containers after animation
            if (introTextLine1) {
                introTextLine1.style.display = 'none';
                introTextLine1.style.visibility = 'hidden';
                introTextLine1.style.opacity = '0';
            }
            if (introTextLine2) {
                introTextLine2.style.display = 'none';
                introTextLine2.style.visibility = 'hidden';
                introTextLine2.style.opacity = '0';
            }
            
            // Now show the START button
            showStartButtonElement();
        }, 400); // 400ms - START begins while lines are nearly finished exiting
    } else {
        // Lines are already hidden (e.g., returning via logo click), show START immediately
        // Still hide them to be safe
        if (introTextLine1) {
            introTextLine1.style.display = 'none';
            introTextLine1.style.visibility = 'hidden';
            introTextLine1.style.opacity = '0';
        }
        if (introTextLine2) {
            introTextLine2.style.display = 'none';
            introTextLine2.style.visibility = 'hidden';
            introTextLine2.style.opacity = '0';
        }
        
        // Show START immediately
        showStartButtonElement();
    }
}

// Helper function that actually displays the START button element
// Called after the instruction lines have finished their exit animation
function showStartButtonElement() {
    // Get the START button container (new structure with mask)
    let introTextStart = document.getElementById('gradient-intro-text-start');
    if (!introTextStart) {
        // Create the START button element if it doesn't exist
        const gradientContainer = document.getElementById('gradient-intro-container');
        if (!gradientContainer) {
            console.warn('START button setup: gradient container not found');
            return;
        }
        introTextStart = document.createElement('div');
        introTextStart.className = 'gradient-intro-text gradient-intro-text-start';
        introTextStart.id = 'gradient-intro-text-start';
        introTextStart.innerHTML = '<span class="intro-line">[start]</span>';
        gradientContainer.appendChild(introTextStart);
    }
    
    // Get the inner intro-line element
    const startInner = introTextStart.querySelector('.intro-line');
    if (!startInner) {
        console.warn('START button setup: inner intro-line not found');
        return;
    }
    
    // Ensure container is visible
    introTextStart.style.display = 'flex';
    introTextStart.style.visibility = 'visible';
    
    // Remove any existing click handlers by cloning and replacing (avoids duplicates)
    const newStartInner = startInner.cloneNode(true);
    startInner.parentNode.replaceChild(newStartInner, startInner);
    
    // Get the updated inner element
    const updatedStartInner = introTextStart.querySelector('.intro-line');
    
    // Add click handler to trigger forward transition
    updatedStartInner.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Trigger forward transition (intro → main)
        forwardIntroTransition();
    });
    
    // Trigger the slide-up animation by adding the start-entering class
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Add class to trigger slide-up animation
            updatedStartInner.classList.add('start-entering');
        });
    });
    
    // Show arrow (positioning is handled by updateGradientIntro, but visibility needs to be set)
    const arrowElement = document.getElementById('gradient-intro-arrow');
    if (arrowElement) {
        arrowElement.style.display = 'flex';
        arrowElement.style.visibility = 'visible';
        arrowElement.style.opacity = '0.7';
    }
    
    // Update gradient intro to position START button correctly
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
    
    // Trigger slide-out animation for START button (runs simultaneously with collapse)
    const introTextStart = document.getElementById('gradient-intro-text-start');
    const startInner = introTextStart?.querySelector('.intro-line');
    
    if (startInner) {
        // Disable pointer events immediately to prevent double-clicks
        startInner.style.pointerEvents = 'none';
        // Trigger slide-out animation
        // IMPORTANT: Add start-exiting FIRST, before removing start-entering
        // This ensures the transition animates from translateY(0) to translateY(40px)
        // because start-exiting's !important overrides start-entering's transform
        startInner.classList.add('start-exiting');
        startInner.classList.remove('start-entering');
    }
    
    // Hide arrow immediately
    const arrowElement = document.getElementById('gradient-intro-arrow');
    if (arrowElement) {
        arrowElement.style.display = 'none';
        arrowElement.style.visibility = 'hidden';
        arrowElement.style.opacity = '0';
        arrowElement.style.pointerEvents = 'none';
    }
    
    // Hide intro text line elements immediately (they're already hidden at START state)
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    if (introTextLine1) {
        introTextLine1.style.display = 'none';
        introTextLine1.style.visibility = 'hidden';
        introTextLine1.style.opacity = '0';
        introTextLine1.style.pointerEvents = 'none';
    }
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (introTextLine2) {
        introTextLine2.style.display = 'none';
        introTextLine2.style.visibility = 'hidden';
        introTextLine2.style.opacity = '0';
        introTextLine2.style.pointerEvents = 'none';
    }
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        introText.style.display = 'none';
        introText.style.visibility = 'hidden';
        introText.style.opacity = '0';
        introText.style.pointerEvents = 'none';
    }
    
    // Hide START button container after slide-out animation completes (800ms)
    // This happens in background while collapse animation runs
    setTimeout(() => {
        if (introTextStart) {
            introTextStart.style.display = 'none';
            introTextStart.style.visibility = 'hidden';
            introTextStart.style.opacity = '0';
            introTextStart.style.pointerEvents = 'none';
        }
    }, 800);
    
    // Start collapse animation immediately (simultaneously with START slide-out)
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
    
    const uiLayer = document.querySelector('.ui-layer');
    
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
        
        // Reveal UI rectangles early at 70% progress (before animation fully completes)
        if (introProgress >= 0.7 && uiLayer && !uiLayer.classList.contains('words-revealed')) {
            uiLayer.classList.add('words-revealed');
        }
        
        // Continue animation until progress reaches 1
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete - ensure progress is exactly 1
            introProgress = 1;
            updateGradientBarHeights(1);
            
            // Mark intro as completed
            introCompleted = true;
            
            // Update UI visibility for final state
            updateUIVisibility();
            
            // Note: UI rectangles are already revealed at 70% progress (see above)
            
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
    
    // Reset scroll hint animation state (so it can run again on restart)
    scrollHintAnimationTriggered = false;
    scrollHintAnimationActive = false;
    
    // Reset triangle animation state (hide triangles for next intro)
    document.body.classList.remove('triangles-revealed');
    
    // Get gradient container and clean up existing DOM elements
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (gradientContainer) {
        // Remove all existing gradient rectangles
        const rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
        rectangles.forEach(rect => rect.remove());
        
        // Remove all intro text elements if they exist
        const introTextLine1 = document.getElementById('gradient-intro-text-line1');
        if (introTextLine1) {
            introTextLine1.remove();
        }
        const introTextLine2 = document.getElementById('gradient-intro-text-line2');
        if (introTextLine2) {
            introTextLine2.remove();
        }
        const introText = document.getElementById('gradient-intro-text');
        if (introText) {
            introText.remove();
        }
        
        // Remove new START button container if it exists
        const introTextStart = document.getElementById('gradient-intro-text-start');
        if (introTextStart) {
            introTextStart.remove();
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
    
    // Reset logo entrance animation state
    // Remove all logo animation classes so it can animate again from hidden
    const logoContainer = document.querySelector('.logo-container');
    const uiLayer = document.querySelector('.ui-layer');
    if (logoContainer) {
        logoContainer.classList.remove('logo-intro-hidden', 'logo-entering', 'logo-visible');
    }
    if (uiLayer) {
        uiLayer.classList.remove('logo-animating');
    }
    
    // Ensure logo remains clickable after restart
    const synElement = document.querySelector('.black-rectangle-syn');
    const ethesiaElement = document.querySelector('.black-rectangle-ethesia');
    if (synElement) {
        synElement.style.pointerEvents = 'auto';
        synElement.style.cursor = 'pointer';
    }
    if (ethesiaElement) {
        ethesiaElement.style.pointerEvents = 'auto';
        ethesiaElement.style.cursor = 'pointer';
    }
    
    // Re-initialize the gradient intro (this will create new rectangles and start the animation)
    // This also adds logo-intro-hidden class to reset logo state
    initializeGradientIntro();
    
}

// Function to initialize logo click handler
function initializeLogoClickHandler() {
    const synElement = document.querySelector('.black-rectangle-syn');
    const ethesiaElement = document.querySelector('.black-rectangle-ethesia');
    
    if (!synElement && !ethesiaElement) {
        console.warn('Logo elements (.black-rectangle-syn, .black-rectangle-ethesia) not found');
        return;
    }
    
    // Click handler function for both logo rectangles
    const handleLogoClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // If intro is completed, go to START checkpoint (no intro restart)
        if (introCompleted) {
            goToStartCheckpoint();
        } else {
            // If intro is not completed, just restart (shouldn't happen normally)
            restartIntro();
        }
    };
    
    // Set up SYN rectangle
    if (synElement) {
        // CRITICAL: Enable pointer events (CSS has pointer-events: none by default)
        synElement.style.pointerEvents = 'auto';
        synElement.style.cursor = 'pointer';
        synElement.addEventListener('click', handleLogoClick);
    }
    
    // Set up [esthesia] rectangle
    if (ethesiaElement) {
        // CRITICAL: Enable pointer events
        ethesiaElement.style.pointerEvents = 'auto';
        ethesiaElement.style.cursor = 'pointer';
        ethesiaElement.addEventListener('click', handleLogoClick);
    }
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
    
    // Boundaries for wrapping (same as infinite scroll logic)
    const topBoundary = singleSetHeight * 0.5;
    const bottomBoundary = singleSetHeight * 1.5;
    
    // Calculate the EXACT target position (where we want to land)
    // This ensures we end on an exact item boundary, avoiding any visible snap
    let targetScrollTop = startScrollTop + totalScrollDistance;
    // Apply wrapping to get target within valid range
    while (targetScrollTop < topBoundary) {
        targetScrollTop += singleSetHeight;
    }
    while (targetScrollTop > bottomBoundary) {
        targetScrollTop -= singleSetHeight;
    }
    // Round to nearest item boundary (should already be exact, but ensure precision)
    targetScrollTop = Math.round(targetScrollTop / itemHeight) * itemHeight;
    
    // Track easing progress for incremental scrolling
    let lastEase = 0;
    
    // Set programmatic scroll flag to skip user interaction tracking
    // but gradients will still update via scroll handler
    isProgrammaticScroll = true;
    // Set demo active flag to prevent START text change during demo
    isDemoActive = true;
    
    // Disable scroll-snap during demo for smooth motion
    column.style.setProperty('scroll-snap-type', 'none', 'important');
    
    // Single continuous animation with strong ease-out
    function animate() {
        // Check if demo was cancelled - if so, jump directly to target and stop
        if (!isDemoActive) {
            // Set scroll directly to target position (no animation remainder)
            column.scrollTop = targetScrollTop;
            
            // Re-enable scroll-snap (now safe since we're at exact target)
            column.style.removeProperty('scroll-snap-type');
            // Reset flags
            isProgrammaticScroll = false;
            return;
        }
        
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
        if (newScrollTop < topBoundary) {
            newScrollTop += singleSetHeight;
        } else if (newScrollTop > bottomBoundary) {
            newScrollTop -= singleSetHeight;
        }
        
        column.scrollTop = newScrollTop;
        
        if (progress < 1) {
            const frameId = requestAnimationFrame(animate);
            demoAnimationFrames.push(frameId);
        } else {
            // Animation complete - DON'T jump to target, accept the small error
            // The error is typically < 10 pixels which is less noticeable than a sudden position change
            // Scroll-snap will handle final alignment if needed
            
            // Re-enable scroll-snap after animation completes
            const timeoutId = setTimeout(() => {
                column.style.removeProperty('scroll-snap-type');
                isProgrammaticScroll = false;
                // Note: isDemoActive is reset in scrollBothColumnsProgrammatically after all animations complete
            }, 100); // Re-enable scroll-snap after brief delay
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
        // Check if demo was cancelled
        if (!isDemoActive) {
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
        
        if (gradientContainer) {
            gradientContainer.classList.remove('demo-active');
            // Ensure intro-active class is present for CSS rules to work
            if (!gradientContainer.classList.contains('intro-active')) {
                gradientContainer.classList.add('intro-active');
            }
        }
        
        // Trigger triangle slide-in animation (demo ended)
        document.body.classList.add('triangles-revealed');
        
        // Show instruction text lines (only if not already changed to START)
        if (!introTextChanged) {
            // Show both instruction line elements
            const introTextLine1 = document.getElementById('gradient-intro-text-line1');
            const introTextLine2 = document.getElementById('gradient-intro-text-line2');
            
            if (introTextLine1) {
                // Remove any inline styles that might override CSS
                introTextLine1.style.cursor = '';
                introTextLine1.style.pointerEvents = '';
                // Ensure container is visible - CSS handles the slide-up animation via inner .intro-line
                introTextLine1.style.display = 'flex';
                introTextLine1.style.visibility = 'visible';
                // Don't set opacity inline - let CSS handle it via intro-active class
            }
            
            if (introTextLine2) {
                // Remove any inline styles that might override CSS
                introTextLine2.style.cursor = '';
                introTextLine2.style.pointerEvents = '';
                // Ensure container is visible - CSS handles the slide-up animation via inner .intro-line
                introTextLine2.style.display = 'flex';
                introTextLine2.style.visibility = 'visible';
                // Don't set opacity inline - let CSS handle it via intro-active class
            }
            
            // Hide the START button elements if they exist
            const introText = document.getElementById('gradient-intro-text');
            if (introText) {
                introText.style.display = 'none';
                introText.style.visibility = 'hidden';
                introText.style.opacity = '0';
            }
            
            // Hide new START button container
            const introTextStart = document.getElementById('gradient-intro-text-start');
            if (introTextStart) {
                introTextStart.style.display = 'none';
                introTextStart.style.visibility = 'hidden';
                introTextStart.style.opacity = '0';
            }
            
            // Update gradient intro to position text correctly
            updateGradientIntro();
            // Mark that initial instruction text has been shown immediately
            initialInstructionTextShown = true;
            // CSS handles the slide-up animation via .intro-active class on container
            
            // Start scroll hint animation after intro text appears
            // This hints users to scroll the side columns
            startScrollHintAnimation();
        }
    }, phaseDuration + 150); // Show text only after animation fully completes (+150ms buffer to ensure animations finish)
    demoTimeouts.push(cleanupTimeout);
}

// Function to trigger demo when intro is in active phase
// Note: Text may be hidden by demo-active class, so we don't check text visibility
function triggerDemo() {
    // Check if instruction line elements exist (not the START button)
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (!introTextLine1 && !introTextLine2) {
        return;
    }
        
    // Check if gradients have collapsed (intro-active phase)
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer || !gradientContainer.classList.contains('intro-active')) {
        return;
    }
    
    // Check if instruction text lines are visible (not the START button)
    // This ensures we only trigger demo for initial instruction text, not START
    const line1Visible = introTextLine1 && introTextLine1.style.display !== 'none';
    const line2Visible = introTextLine2 && introTextLine2.style.display !== 'none';
    if (!line1Visible && !line2Visible) {
        return;
    }
    
    // Trigger demo - scroll both columns with default duration (3 seconds for visible continuous motion)
    // Note: Text is already hidden by demo-active class, so it will stay hidden during demo
    scrollBothColumnsProgrammatically();
}

