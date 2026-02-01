// Array of colors in order
const colors = ['#EF4538', '#891951', '#FAB01B', '#007A6F', '#EB4781', '#293990'];

// Array of words for each color (matching colors array order)
// כתום- shape, סגול- sound, צהוב- letter, ירוק- number, ורוד- emotion, כחול- color
const colorWords = ['shape', 'sound', 'letter', 'number', 'emotion', 'color'];

// Initial instruction text content (shown after demo ends, before user scrolls)
// Two intro text lines - line 1 is the explanation, line 2 is the instruction
const INTRO_LINE_1_TEXT = '[synesthesia is an experience where senses blend together]';
const INTRO_LINE_2_TEXT = '[scroll the side wheels to combine the senses]';
// Legacy constant for backward compatibility (used in some checks)
const INITIAL_INSTRUCTION_TEXT = '<span class="intro-line">' + INTRO_LINE_2_TEXT + '</span>';

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

// Idle scroll hint for main screen (after intro completes)
let mainScreenIdleTimer = null; // Timer ID for idle detection
let mainScreenHintActive = false; // Flag to track if main screen hint is running
let isFirstMainScreenHint = true; // Flag to track if this is the first hint after intro completes
const FIRST_HINT_DELAY = 3000; // 3 seconds for first hint after main screen opens
const IDLE_HINT_DELAY = 10000; // 10 seconds for subsequent hints

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
    
    // Initialize top row markers for hover disable logic
    updateTopRowMarkers();
    
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
    
    // Initialize Emotion + Emotion circle visibility
    updateEmotionEmotionCircle(initialPageId);
    
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
    
    // Initialize Shape + Shape circle visibility (concentric rings with black square)
    updateShapeShapeCircle(initialPageId);
    
    // Initialize Shape & Number canvas (not using p5.js)
    initializeShapeNumberCanvas();
    
    // Initialize Sound & Shape canvas (not using p5.js)
    initializeSoundShapeCanvas();
    
    // Initialize Sound & Shape visibility
    updateSoundShapeCanvasVisibility(initialPageId);
    
    // Initialize Sound + Emotion smiley visibility
    updateSoundEmotionVisibility(initialPageId);
    
    // Initialize Shape + Emotion circles grid visibility
    updateShapeEmotionVisibility(initialPageId);
    
    // Initialize Emotion + Color grid visibility
    updateEmotionColorVisibility(initialPageId);
    
    // Initialize Number + Color grid visibility
    updateNumberColorGrid(initialPageId);
    
    // Initialize SYN logo hover effect
    initializeSynHoverEffect();
    
    // Initialize color key click effect
    initializeColorKeyClickEffect();
    
    // Initialize INDEX hover effect (shows white overlay on canvas)
    initializeIndexHoverEffect();
    
    // Initialize ABOUT hover effect (shows white overlay on canvas)
    initializeAboutHoverEffect();
    
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
            
            // Only disable hover expansion during intro phase (before intro completes)
            // This prevents flicker during demo without affecting main screen behavior
            if (!introCompleted) {
                if (!isScrolling) {
                    isScrolling = true;
                    setHoverEnabled(false);
                }
                // Clear any pending scroll-end timeout and set a new one
                if (scrollEndTimeout) {
                    clearTimeout(scrollEndTimeout);
                }
                scrollEndTimeout = setTimeout(() => {
                    isScrolling = false;
                    setHoverEnabled(true);
                }, 100);
            }
            
            // Update gradients even during programmatic scrolls (demo will use this)
                updateSelectedIndices();
            
            // Skip user interaction tracking
            return;
        }
        
        // CRITICAL: Ignore demo-driven scrolls for START logic
        // Log scroll event for debugging
        
        if (isDemoActive) {
            // Only disable hover expansion during intro phase (before intro completes)
            // This prevents flicker during demo without affecting main screen behavior
            if (!introCompleted) {
                if (!isScrolling) {
                    isScrolling = true;
                    setHoverEnabled(false);
                }
                // Clear any pending scroll-end timeout and set a new one
                if (scrollEndTimeout) {
                    clearTimeout(scrollEndTimeout);
                }
                scrollEndTimeout = setTimeout(() => {
                    isScrolling = false;
                    setHoverEnabled(true);
                }, 100);
            }
            
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
        // This applies both during intro and after - rectangles collapse during scroll
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
            // Update top row markers for hover disable logic
            updateTopRowMarkers();
        }, 100); // 100ms - match snap timeout
        
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
        // Using 100ms timeout - short enough to feel responsive, but long enough for CSS snap to work
        scrollTimeout = setTimeout(() => {
            if (!isAdjusting) {
                const currentScroll = column.scrollTop;
                const snappedScroll = snapToTile(currentScroll);
                const currentSnapStyle = column.style.scrollSnapType;
                
                // CRITICAL FIX: Re-enable CSS scroll-snap if it was disabled
                if (currentSnapStyle === 'none' || currentSnapStyle === '') {
                    column.style.removeProperty('scroll-snap-type');
                }
                
                // Only adjust if we're significantly off (more than 2px)
                if (Math.abs(currentScroll - snappedScroll) > 2) {
                    isAdjusting = true;
                    isProgrammaticScroll = true; // Mark as programmatic
                    // Use smooth scrolling instead of instant jump
                    column.scrollTo({ top: snappedScroll, behavior: 'smooth' });
                    // Keep flags set briefly to cover the smooth scroll animation
                    setTimeout(() => {
                        isProgrammaticScroll = false;
                        isAdjusting = false;
                    }, 300);
                }
                
                // Update selected indices after snap completes (this will trigger gradient update)
                updateSelectedIndices();
                // Update top row markers for hover disable logic
                updateTopRowMarkers();
            }
        }, 100); // 100ms - balance between responsiveness and letting CSS snap work
        
        // Update selected indices during scroll (for real-time updates)
        // This will schedule a gradient update via requestAnimationFrame
        updateSelectedIndices();
        
        if (introCompleted) {
        }
    });
    
    // Modern scrollend event - more reliable detection of when scrolling truly ends
    column.addEventListener('scrollend', () => {
        if (isProgrammaticScroll || isAdjusting || isInitializing) return;
        
        const currentScroll = column.scrollTop;
        const snappedScroll = snapToTile(currentScroll);
        const currentSnapStyle = column.style.scrollSnapType;
        
        // CRITICAL FIX: Re-enable CSS scroll-snap if it was disabled
        if (currentSnapStyle === 'none' || currentSnapStyle === '') {
            column.style.removeProperty('scroll-snap-type');
        }
        
        // Only adjust if we're significantly off (more than 2px)
        if (Math.abs(currentScroll - snappedScroll) > 2) {
            isAdjusting = true;
            isProgrammaticScroll = true;
            column.scrollTo({ top: snappedScroll, behavior: 'smooth' });
            setTimeout(() => {
                isProgrammaticScroll = false;
                isAdjusting = false;
            }, 300);
        }
        
        updateSelectedIndices();
        // Update top row markers for hover disable logic
        updateTopRowMarkers();
    });
    
    // Detect real user wheel interaction
    column.addEventListener('wheel', (e) => {
        // Check if demo is active - if so, skip it immediately
        if (isDemoActive) {
            skipDemo();
            e.stopPropagation();
            return;
        }
        
        // Reset idle timer on user scroll (for main screen hint)
        resetMainScreenIdleTimer();
        
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
                // setupStartButton() shows START button alongside instruction text
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
        
        // Reset idle timer on user scroll (for main screen hint)
        resetMainScreenIdleTimer();
        
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
                // setupStartButton() shows START button alongside instruction text
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

// Function to mark items that are currently in the top row (affecting gradient)
// This is used to disable hover expansion for top-row items on the home screen
function updateTopRowMarkers() {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    if (!leftColumn || !rightColumn) return;
    
    const itemHeight = window.innerHeight / 6;
    
    [leftColumn, rightColumn].forEach(column => {
        const scrollTop = column.scrollTop;
        const topTileIndex = Math.round(scrollTop / itemHeight);
        
        // Remove class from all items in this column
        column.querySelectorAll('.color-item').forEach((item, index) => {
            item.classList.remove('affects-gradient');
            // Add class to item that is currently at the top
            if (index === topTileIndex) {
                item.classList.add('affects-gradient');
            }
        });
    });
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
    '3-5': '"Numbers have had colors since I was a toddler. 1 is white, 2 is a pale yellow, 3 is pink, 4 is a dark blood-red, and 5 is grass green. Math was always easy for me because I didn\'t see equations; I saw color patterns. Adding 2 and 3 was like watching yellow and pink come together to create the green of 5. It makes the world of data feel very aesthetic and organized visually and spatially."',
    '5-3': '"Numbers have had colors since I was a toddler. 1 is white, 2 is a pale yellow, 3 is pink, 4 is a dark blood-red, and 5 is grass green. Math was always easy for me because I didn\'t see equations; I saw color patterns. Adding 2 and 3 was like watching yellow and pink come together to create the green of 5. It makes the world of data feel very aesthetic and organized visually and spatially."',
    
    // 7. Number + Emotion (ספרות + רגש) - number=3, emotion=4
    '3-4': '"Numbers have social lives. 1 is very lonely and a bit of an elitist. 2 is kind and motherly, always looking after 1. 3 is a bratty child, and 4 is a grumpy old man who is tired of 3\'s antics. 7 is the \'cool\' teenager of the group, very aloof and mysterious. When I see a phone number, I don\'t just see digits; I see a whole family dynamic playing out in a row. Each number carries a personality, a role, and a place in the group."',
    
    // 8. Number + Shape (ספרות + צורה) - number=3, shape=0
    '3-0': '"When I think of numbers, they exist on a physical path in space around me. Numbers 1 through 20 go in a straight line directly in front of my chest. At 21, the line takes a sharp 90-degree turn to the left and starts climbing upwards until it reaches 100. From 100 onwards, the numbers disappear into a vast spiral that goes behind my head. I have to physically \'look\' to the left in my mind to remember dates or do mental math."',
    '0-3': '"When I think of numbers, they exist on a physical path in space around me. Numbers 1 through 20 go in a straight line directly in front of my chest. At 21, the line takes a sharp 90-degree turn to the left and starts climbing upwards until it reaches 100. From 100 onwards, the numbers disappear into a vast spiral that goes behind my head. I have to physically \'look\' to the left in my mind to remember dates or do mental math."',
    
    // 9. Shape + Color (צורה + צבע) - shape=0, color=5
    '0-5': '"Shapes have inherent colors that can never be changed. A circle is always a deep, ocean blue. A square is a solid, opaque orange. Triangles are always a sharp, acidic lemon yellow. When I see a black-and-white drawing of geometric patterns, my brain automatically fills them in with these colors. A star shape is especially vivid; it\'s always a shimmering metallic silver with a hint of violet at the edges."',
    '5-0': '"Shapes have inherent colors that can never be changed. A circle is always a deep, ocean blue. A square is a solid, opaque orange. Triangles are always a sharp, acidic lemon yellow. When I see a black-and-white drawing of geometric patterns, my brain automatically fills them in with these colors. A star shape is especially vivid; it\'s always a shimmering metallic silver with a hint of violet at the edges."',
    
    // 10. Shape + Emotion (צורה + רגש) - shape=0, emotion=4
    '0-4': '"I have a strange reaction to certain shapes. Perfectly smooth, rounded surfaces give me a feeling of immense relief and calm. However, seeing a cluster of small, irregular triangles or jagged shapes makes me feel extremely anxious and \'itchy\' inside. It\'s a visceral emotional reaction to the geometry of objects. Complex, messy shapes make me feel deeply depressed and unsettled."',
    '4-0': '"I have a strange reaction to certain shapes. Perfectly smooth, rounded surfaces give me a feeling of immense relief and calm. However, seeing a cluster of small, irregular triangles or jagged shapes makes me feel extremely anxious and \'itchy\' inside. It\'s a visceral emotional reaction to the geometry of objects. Complex, messy shapes make me feel deeply depressed and unsettled."',
    
    // 11. Letter + Shape (אותיות + צורה) - letter=2, shape=0
    '2-0': '"Letters don\'t appear to me as signs; they appear as forms. Each letter has a physical presence of its own, independent of sound or meaning. Some feel narrow and tense, others wide and relaxed. The letter W feels sharp to me, pointed and angular, while G is broader and rounded, heavier in its curve. When I read, my attention moves from one form to another, sensing their edges and weight."',
    '0-2': '"Letters don\'t appear to me as signs; they appear as forms. Each letter has a physical presence of its own, independent of sound or meaning. Some feel narrow and tense, others wide and relaxed. The letter W feels sharp to me, pointed and angular, while G is broader and rounded, heavier in its curve. When I read, my attention moves from one form to another, sensing their edges and weight."',
    
    // 12. Color + Emotion (צבע + רגש) - color=5, emotion=4
    '5-4': '"Colors are the primary way I experience emotions. If I\'m feeling happy, the world actually looks brighter, as if someone turned up the saturation, and I see flashes of gold in my peripheral vision. Grief is not just a feeling; it\'s a heavy, oppressive charcoal grey that seems to coat everything I look at. When I\'m angry, I see sparks of a very specific, dirty orange-red that clouds my vision."',
    '4-5': '"Colors are the primary way I experience emotions. If I\'m feeling happy, the world actually looks brighter, as if someone turned up the saturation, and I see flashes of gold in my peripheral vision. Grief is not just a feeling; it\'s a heavy, oppressive charcoal grey that seems to coat everything I look at. When I\'m angry, I see sparks of a very specific, dirty orange-red that clouds my vision."',
    
    // 13. Letter + Number (אותיות + ספרות) - letter=2, number=3
    '2-3': '"My mind organizes all sequences together. Letters and numbers share the same physical \'track\' in my head. The letters A-Z occupy the first half of a great circle, and as soon as Z ends, the number 1 starts and continues the circle. They are made of the same \'material\' in my mind. It\'s like they belong to the same family of objects, arranged on a continuous, rotating ring in space."',
    '3-2': '"My mind organizes all sequences together. Letters and numbers share the same physical \'track\' in my head. The letters A-Z occupy the first half of a great circle, and as soon as Z ends, the number 1 starts and continues the circle. They are made of the same \'material\' in my mind. It\'s like they belong to the same family of objects, arranged on a continuous, rotating ring in space."',
    
    // 14. Sound + Letter (סאונד + אותיות) - sound=1, letter=2
    '1-2': '"When I hear people speak, I see the letters of the words they are saying scrolling across a screen in my mind, like closed captions. But the letters are influenced by the sound; if someone has a gravelly, deep voice, the letters look blocky and made of stone. If someone has a high-pitched, melodic voice, the letters appear in a flowing, cursive script that glows slightly as if alive."',
    '2-1': '"When I hear people speak, I see the letters of the words they are saying scrolling across a screen in my mind, like closed captions. But the letters are influenced by the sound; if someone has a gravelly, deep voice, the letters look blocky and made of stone. If someone has a high-pitched, melodic voice, the letters appear in a flowing, cursive script that glows slightly as if alive."',
    
    // 15. Sound + Number (סאונד + ספרה) - sound=1, number=3
    '1-3': '"For me, the world of sounds is a world of visual mathematics. When I hear a drum beat, I see a sequence of numbers flashing to the rhythm of the music. Every sound has a numerical \'value\'- sharp, high-pitched sounds feel like the numbers 1 or 4, while deeper sounds look like larger, rounder numbers like 8 or 0. When I listen to a song, every musical note is immediately translated into a different digit."',
    '3-1': '"For me, the world of sounds is a world of visual mathematics. When I hear a drum beat, I see a sequence of numbers flashing to the rhythm of the music. Every sound has a numerical \'value\'- sharp, high-pitched sounds feel like the numbers 1 or 4, while deeper sounds look like larger, rounder numbers like 8 or 0. When I listen to a song, every musical note is immediately translated into a different digit."',
    
    // 16. Emotion + Number (רגש + ספרות) - emotion=4, number=3
    '4-3': '"Numbers have social lives. 1 is very lonely and a bit of an elitist. 2 is kind and motherly, always looking after 1. 3 is a bratty child, and 4 is a grumpy old man who is tired of 3\'s antics. 7 is the \'cool\' teenager of the group, very aloof and mysterious. When I see a phone number, I don\'t just see digits; I see a whole family dynamic playing out in a row. Each number carries a personality, a role, and a place in the group."',
    
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
    
    // First, split by explicit newlines to respect forced line breaks
    const explicitLines = text.split('\n');
    const lines = [];
    
    // Process each explicit line segment
    for (const segment of explicitLines) {
        if (segment.trim().length === 0) {
            // Empty line - skip or add empty if needed
            continue;
        }
        
        // Split segment into words (preserve spaces)
        const words = segment.split(/(\s+)/); // Split but keep spaces
        let currentLine = '';
        
        // Wrap based on width within this segment
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + word;
            const testWidth = textMeasureCtx.measureText(testLine).width;
            
            const hasContent = currentLine.trim().length > 0;
            
            if (testWidth > maxWidth && hasContent) {
                lines.push(currentLine.trim());
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        // Add the last line of this segment
        const lastLine = currentLine.trim();
        if (lastLine.length > 0) {
            lines.push(lastLine);
        }
    }
    
    return lines;
}

// Render text with per-line grey background blocks
function renderTextWithLineBackgrounds(textBox, text, maxWidth = 1035, backgroundColor = '#E0E0E0', alignRight = false) {
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
        if (alignRight) {
            lineRow.style.justifyContent = 'flex-end'; // Right-align content
        }
        
        // Check if this is the last line - extend background by 2px for PANEL overlay
        const isLastLine = index === lines.length - 1;
        const extendedBgHeight = isLastLine && backgroundColor === '#2C2C2C' ? bgHeight + 2 : bgHeight;
        
        // Create background block
        const bgBlock = document.createElement('div');
        bgBlock.className = 'canvas-line-bg';
        bgBlock.style.position = 'absolute';
        if (alignRight) {
            bgBlock.style.right = '-35px'; // Start 35px after the text (to the right)
        } else {
            bgBlock.style.left = '-35px'; // Start 35px before the text
        }
        bgBlock.style.width = `${lineWidth + 49}px`; // 35px left + lineWidth + 14px right extension
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
        if (alignRight) {
            textElement.style.marginRight = '6px'; // Move text 6px to the left
        } else {
            textElement.style.marginLeft = '6px'; // Move text 6px to the right
        }
        
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
    
    // Add page-specific class for Shape + Shape page (for orange text styling)
    if (pageId === '0-0') {
        textBox.classList.add('page-shape-shape');
    } else {
        textBox.classList.remove('page-shape-shape');
    }
}

// Function to wrap text letters in spans for hover interaction
// ==================
// LETTER → SHAPE MAPPING
// ==================
// Mapping object: uppercase letter (A-Z) → shape specification
const LETTER_SHAPES = {
    'A': { type: 'triangle', points: '22.5,5 40,40 5,40' },
    'B': { type: 'rect', width: 35, height: 35 },
    'C': { type: 'polygon', points: '22.5,3 27.5,13.5 39,13.5 30,19.5 34.5,30.5 22.5,24.5 10.5,30.5 15,19.5 6,13.5 17.5,13.5' },
    'D': { type: 'diamond', points: '22.5,5 40,22.5 22.5,40 5,22.5' },
    'E': { type: 'ellipse', rx: 18, ry: 12 },
    'F': { type: 'triangle', points: '5,5 40,5 5,40' },
    'G': { type: 'rect', width: 38, height: 30 },
    'H': { type: 'rect', width: 8, height: 35 },
    'I': { type: 'path', d: 'M 22.5,5 Q 28,11.25 22.5,17.5 Q 17,23.75 22.5,30 Q 28,36.25 22.5,40' },
    'J': { type: 'arc', startAngle: 90, endAngle: 270, largeArc: 0 },
    'K': { type: 'polygon', points: '5,5 5,40 22.5,22.5 40,5 40,15' },
    'L': { type: 'polygon', points: '5,5 5,40 40,40' },
    'M': { type: 'polygon', points: '5,40 15,10 22.5,25 30,10 40,40' },
    'N': { type: 'polygon', points: '5,40 5,5 35,40 35,5' },
    'O': { type: 'circle', cx: 22.5, cy: 22.5, r: 18 },
    'P': { type: 'rect', width: 12, height: 35 },
    'Q': { type: 'circle', cx: 22.5, cy: 22.5, r: 15 },
    'R': { type: 'polygon', points: '5,5 5,40 25,40 35,25 25,5' },
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
    'A': '#EF4538',  // Red (palette)
    'B': '#293990',  // Blue (palette)
    'C': '#FAB01B',  // Yellow (palette)
    'D': '#007A6F',  // Green (palette)
    'E': '#891951',  // Purple (palette)
    'F': '#EF4538',  // Red (palette) - was Orange
    'G': '#007A6F',  // Green (palette) - was Cyan
    'H': '#EB4781',  // Pink (palette)
    'I': '#293990',  // Blue (palette) - was Deep Purple
    'J': '#293990',  // Blue (palette) - was Light Blue
    'K': '#007A6F',  // Green (palette) - was Light Green
    'L': '#FAB01B',  // Yellow (palette) - was Amber
    'M': '#293990',  // Blue (palette) - was Indigo
    'N': '#007A6F',  // Green (palette) - was Teal
    'O': '#EF4538',  // Red (palette) - was Deep Orange
    'P': '#FAB01B',  // Yellow (palette) - was Lime
    'Q': '#891951',  // Purple (palette) - was Brown
    'R': '#EB4781',  // Pink (palette) - was Pink Light
    'S': '#891951',  // Purple (palette) - was Purple Light
    'T': '#007A6F',  // Green (palette) - was Teal Light
    'U': '#293990',  // Blue (palette) - was Blue Light
    'V': '#007A6F',  // Green (palette) - was Green Light
    'W': '#FAB01B',  // Yellow (palette) - was Yellow Light
    'X': '#EF4538',  // Red (palette) - was Red Light
    'Y': '#891951',  // Purple (palette) - was Deep Purple Light
    'Z': '#293990'   // Blue (palette) - was Blue Grey
};

// ==================
// DIGIT → COLOR MAPPING
// ==================
// Mapping object: digit (1-6) → color hex code
// Uses the same 6 colors as the main site palette
const DIGIT_COLORS = {
    '1': '#EF4538',  // Orange (shape color)
    '2': '#891951',  // Purple (sound color)
    '3': '#FAB01B',  // Yellow (letter color)
    '4': '#007A6F',  // Green (number color)
    '5': '#EB4781',  // Pink (emotion color)
    '6': '#293990'   // Blue (color color)
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
    
    // All shapes use stroke only (no fill) with ~3px visual stroke (1.63px in viewBox, scaled to 83px display)
    shape.setAttribute('fill', 'none');
    shape.setAttribute('stroke', '#2C2C2C');
    shape.setAttribute('stroke-width', '1.63');
    // Sharp corners for all shapes (no rounding)
    shape.setAttribute('stroke-linejoin', 'miter');
    shape.setAttribute('stroke-linecap', 'butt');
    
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
            shape.setAttribute('stroke-width', (shapeSpec.strokeWidth || '1.63').toString());
            shape.setAttribute('fill', 'none');
            break;
            
        case 'path':
            // Direct path specification (for wavy lines, custom paths, etc.)
            shape.setAttribute('d', shapeSpec.d);
            shape.setAttribute('stroke', color);
            shape.setAttribute('stroke-width', (shapeSpec.strokeWidth || '1.63').toString());
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

// ==================

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
    // Specifically target the letter-letter rings SVG to avoid matching shape-shape rings
    const ringGroup = document.querySelector(`#concentric-rings-svg .ring-group[data-ring="${ringIndex}"]`);
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
// EMOTION + EMOTION RINGS (Smiley Face)
// ==================
// Track rotation angles for each emotion ring
let emotionRingRotations = [0, 0, 0, 0, 0];
let emotionRingsInitialized = false;

// Function to update Emotion + Emotion circle visibility
function updateEmotionEmotionCircle(pageId) {
    const circleContainer = document.getElementById('emotion-emotion-circle-container');
    if (!circleContainer) return;
    
    // Show circle only for Emotion + Emotion page (pageId "4-4")
    // Parameter indices: 4=emotion
    const isEmotionEmotionPage = pageId === '4-4';
    
    if (isEmotionEmotionPage) {
        circleContainer.classList.add('visible');
        // Initialize ring rotation functionality when page becomes visible
        requestAnimationFrame(() => {
            initializeEmotionRings();
        });
    } else {
        circleContainer.classList.remove('visible');
        // Reset ring rotations when leaving the page
        resetEmotionRings();
    }
}

// Get the center point of the Emotion rings SVG in page coordinates
function getEmotionRingsCenterPoint() {
    const svg = document.getElementById('emotion-emotion-rings-svg');
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Apply rotation to an emotion ring group
function applyEmotionRingRotation(ringIndex, angle) {
    const ringGroup = document.querySelector(`#emotion-emotion-rings-svg .emotion-ring-group[data-ring="${ringIndex}"]`);
    if (ringGroup) {
        ringGroup.setAttribute('transform', `rotate(${angle}, 0, 0)`);
    }
}

// Handle mouse move for emotion rings
function handleEmotionRingMouseMove(e) {
    // Only work when emotion rings container is visible
    const container = document.getElementById('emotion-emotion-circle-container');
    if (!container || !container.classList.contains('visible')) return;
    
    // Calculate current angle from center to mouse position
    const center = getEmotionRingsCenterPoint();
    const mouseAngle = calculateAngle(center.x, center.y, e.clientX, e.clientY);
    
    // Apply rotation to each ring with its own multiplier (same as number rings)
    for (let i = 0; i < 5; i++) {
        const rotation = mouseAngle * ringMultipliers[i];
        emotionRingRotations[i] = rotation;
        applyEmotionRingRotation(i, rotation);
    }
}

// Initialize the emotion concentric rings interaction
function initializeEmotionRings() {
    if (emotionRingsInitialized) return;
    
    const svg = document.getElementById('emotion-emotion-rings-svg');
    if (!svg) return;
    
    // Add mouse move listener to document - rings follow mouse position
    document.addEventListener('mousemove', handleEmotionRingMouseMove);
    
    emotionRingsInitialized = true;
}

// Reset all emotion ring rotations to 0
function resetEmotionRings() {
    emotionRingRotations = [0, 0, 0, 0, 0];
    
    // Apply reset rotations to all emotion rings
    for (let i = 0; i < 5; i++) {
        applyEmotionRingRotation(i, 0);
    }
}

// ==================
// SHAPE + SHAPE RINGS (Black Square)
// ==================
// Track rotation angles for each shape ring
let shapeRingRotations = [0, 0, 0, 0, 0];
let shapeRingsInitialized = false;

// Function to update Shape + Shape circle visibility
function updateShapeShapeCircle(pageId) {
    const circleContainer = document.getElementById('shape-shape-circle-container');
    if (!circleContainer) return;
    
    // Show circle only for Shape + Shape page (pageId "0-0")
    // Parameter indices: 0=shape
    const isShapeShapePage = pageId === '0-0';
    
    if (isShapeShapePage) {
        circleContainer.classList.add('visible');
        // Initialize ring rotation functionality when page becomes visible
        requestAnimationFrame(() => {
            initializeShapeRings();
        });
    } else {
        circleContainer.classList.remove('visible');
        // Reset ring rotations when leaving the page
        resetShapeRings();
    }
}

// Get the center point of the Shape rings SVG in page coordinates
function getShapeRingsCenterPoint() {
    const svg = document.getElementById('shape-shape-rings-svg');
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Apply rotation to a shape ring group
function applyShapeRingRotation(ringIndex, angle) {
    const ringGroup = document.querySelector(`#shape-shape-rings-svg .shape-ring-group[data-ring="${ringIndex}"]`);
    if (ringGroup) {
        ringGroup.setAttribute('transform', `rotate(${angle}, 0, 0)`);
    }
}

// Handle mouse move for shape rings
function handleShapeRingMouseMove(e) {
    // Only work when shape rings container is visible
    const container = document.getElementById('shape-shape-circle-container');
    if (!container || !container.classList.contains('visible')) return;
    
    // Calculate current angle from center to mouse position
    const center = getShapeRingsCenterPoint();
    const mouseAngle = calculateAngle(center.x, center.y, e.clientX, e.clientY);
    
    // Apply rotation to each ring with its own multiplier (same as other rings)
    for (let i = 0; i < 5; i++) {
        const rotation = mouseAngle * ringMultipliers[i];
        shapeRingRotations[i] = rotation;
        applyShapeRingRotation(i, rotation);
    }
}

// Initialize the shape concentric rings interaction
function initializeShapeRings() {
    if (shapeRingsInitialized) return;
    
    const svg = document.getElementById('shape-shape-rings-svg');
    if (!svg) return;
    
    // Add mouse move listener to document - rings follow mouse position
    document.addEventListener('mousemove', handleShapeRingMouseMove);
    
    shapeRingsInitialized = true;
}

// Reset all shape ring rotations to 0
function resetShapeRings() {
    shapeRingRotations = [0, 0, 0, 0, 0];
    
    // Apply reset rotations to all shape rings
    for (let i = 0; i < 5; i++) {
        applyShapeRingRotation(i, 0);
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
    const waveContainer = document.getElementById('sound-sound-circle-container');
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
        // Initialize ring rotation functionality
        requestAnimationFrame(() => {
            initializeSoundRings();
        });
    } else {
        waveContainer.classList.remove('visible');
        // Stop the wave animation when leaving the page
        stopSoundSoundWave();
        // Reset ring rotations when leaving the page
        resetSoundRings();
    }
}

// ==================
// SOUND + SOUND Wave Visualization State
// ==================
let soundSoundAnimationId = null;    // requestAnimationFrame ID
let soundSoundWaveActive = false;    // Whether autonomous wave is active
let soundSoundInitialized = false;   // Whether the wave has been initialized

// Wave visualization constants (for rings SVG with viewBox centered at 0,0)
const SOUND_WAVE_WIDTH = 600;        // Width of the wave from -300 to 300
const SOUND_WAVE_POINTS = 64;        // Number of points to sample for the wave (more points = smoother curve)

// Autonomous wave parameters for organic movement
const WAVE_BASE_AMPLITUDE = 65;      // Base amplitude of the wave (increased for more intensity)
const WAVE_AMPLITUDE_VARIATION = 35; // How much amplitude varies over time (more dramatic changes)
const WAVE_SPEED = 1.4;              // Base speed of wave movement (faster)
const WAVE_COMPLEXITY = 5;           // Number of overlapping sine waves for organic feel

// Initialize the Sound + Sound wave visualization
function initializeSoundSoundWave() {
    if (soundSoundInitialized) return;
    soundSoundInitialized = true;
    
    const wavePaths = document.querySelectorAll('#sound-sound-rings-svg .ring-wave');
    
    if (!wavePaths || wavePaths.length === 0) return;
    
    // Start the autonomous wave animation (no microphone needed)
    startAutonomousWave();
}

// Start the autonomous wave animation
function startAutonomousWave() {
    if (soundSoundWaveActive) return;
    soundSoundWaveActive = true;
    
    // Start the animation loop
    drawAutonomousWave();
}

// Stop the autonomous wave animation
function stopAutonomousWave() {
    soundSoundWaveActive = false;
    
    // Stop animation
    if (soundSoundAnimationId) {
        cancelAnimationFrame(soundSoundAnimationId);
        soundSoundAnimationId = null;
    }
    
    // Draw flat line when wave is stopped
    drawFlatWaveLine();
}

// Stop the wave visualization completely (when leaving the page)
function stopSoundSoundWave() {
    stopAutonomousWave();
    soundSoundInitialized = false;
}

// Draw a flat horizontal line (when no audio) - for rings coordinate system centered at (0,0)
function drawFlatWaveLine() {
    const wavePaths = document.querySelectorAll('#sound-sound-rings-svg .ring-wave');
    if (!wavePaths || wavePaths.length === 0) return;
    
    // Flat line from left edge to right edge of rings (x: -300 to 300, y: 0)
    const flatPathData = 'M -300 0 L 300 0';
    
    // Apply the same flat line to all ring wave paths
    wavePaths.forEach(wavePath => {
        wavePath.setAttribute('d', flatPathData);
    });
}

// Animation loop to draw autonomous organic wave - for rings coordinate system centered at (0,0)
// Uses multiple overlapping sine waves with varying frequencies and phases for natural movement
function drawAutonomousWave() {
    if (!soundSoundWaveActive) {
        return;
    }
    
    const wavePaths = document.querySelectorAll('#sound-sound-rings-svg .ring-wave');
    if (!wavePaths || wavePaths.length === 0) return;
    
    // Get current time in seconds for smooth animation
    const time = performance.now() / 1000;
    
    // Calculate points for the wave
    // In the rings coordinate system: x goes from -300 to 300, y is centered at 0
    const points = [];
    const startX = -300;
    const endX = 300;
    const totalWidth = endX - startX; // 600
    const sliceWidth = totalWidth / (SOUND_WAVE_POINTS - 1);
    
    // Dynamic amplitude that varies over time with sharper changes
    const dynamicAmplitude = WAVE_BASE_AMPLITUDE + 
        Math.sin(time * 0.5) * WAVE_AMPLITUDE_VARIATION * 0.6 +
        Math.sin(time * 0.31) * WAVE_AMPLITUDE_VARIATION * 0.4 +
        Math.sin(time * 0.73) * WAVE_AMPLITUDE_VARIATION * 0.3;
    
    // Varying base frequency for more dynamic movement
    const baseFreq = 0.015 + Math.sin(time * 0.2) * 0.008;
    
    for (let i = 0; i < SOUND_WAVE_POINTS; i++) {
        const x = startX + i * sliceWidth;
        
        // Normalize x position for wave calculation (0 to 1)
        const normalizedX = i / (SOUND_WAVE_POINTS - 1);
        
        // Combine multiple sine waves with stronger, sharper movements
        // Each wave has different frequency, phase, and amplitude
        let y = 0;
        
        // Primary wave - main movement (stronger)
        y += Math.sin(normalizedX * Math.PI * 2 * 2.5 + time * WAVE_SPEED) * dynamicAmplitude * 0.55;
        
        // Secondary wave - adds complexity (stronger and faster)
        y += Math.sin(normalizedX * Math.PI * 2 * 4 + time * WAVE_SPEED * 1.6 + 0.5) * dynamicAmplitude * 0.35;
        
        // Tertiary wave - sharper high frequency detail
        y += Math.sin(normalizedX * Math.PI * 2 * 6 + time * WAVE_SPEED * 2.1 + 1.2) * dynamicAmplitude * 0.25;
        
        // Medium wave - creates sharper shifts in the overall shape
        y += Math.sin(normalizedX * Math.PI * 2 * 1.5 + time * WAVE_SPEED * 0.9 + 2.1) * dynamicAmplitude * 0.35;
        
        // Fast modulation wave - adds quick variations
        y += Math.sin(normalizedX * Math.PI * 2 * 7 + time * WAVE_SPEED * 2.5 + 3.7) * dynamicAmplitude * 0.15;
        
        // Clamp to prevent extreme values
        y = Math.max(-95, Math.min(95, y));
        
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
    
    // Apply the same path data to all ring wave paths
    wavePaths.forEach(wavePath => {
        wavePath.setAttribute('d', pathData);
    });
    
    // Continue animation
    soundSoundAnimationId = requestAnimationFrame(drawAutonomousWave);
}

// ==================
// SOUND + SOUND RINGS (Wave Line) - Ring Rotation
// ==================
// Track rotation angles for each sound ring
let soundRingRotations = [0, 0, 0, 0, 0];
let soundRingsInitialized = false;
let soundPrevAngle = null;
let soundCumulativeRotation = 0;

// Get the center point of the Sound rings SVG in page coordinates
function getSoundRingsCenterPoint() {
    const svg = document.getElementById('sound-sound-rings-svg');
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Apply rotation to a sound ring group
function applySoundRingRotation(ringIndex, angle) {
    const ringGroup = document.querySelector(`#sound-sound-rings-svg .sound-ring-group[data-ring="${ringIndex}"]`);
    if (ringGroup) {
        ringGroup.setAttribute('transform', `rotate(${angle}, 0, 0)`);
    }
}

// Handle mouse move for sound rings
function handleSoundRingMouseMove(e) {
    // Only work when sound rings container is visible
    const container = document.getElementById('sound-sound-circle-container');
    if (!container || !container.classList.contains('visible')) return;
    
    // Calculate current angle from center to mouse position
    const center = getSoundRingsCenterPoint();
    const mouseAngle = calculateAngle(center.x, center.y, e.clientX, e.clientY);
    
    // Calculate delta and normalize to prevent jumps at ±180° boundary
    let angleDelta = 0;
    if (soundPrevAngle !== null) {
        angleDelta = mouseAngle - soundPrevAngle;
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;
        soundCumulativeRotation += angleDelta;
    }
    soundPrevAngle = mouseAngle;
    
    // Apply rotation to each ring with different multipliers (outer rings rotate more)
    const ringMultipliers = [1.0, 0.8, 0.6, 0.4, 0.2]; // Outer to inner
    for (let i = 0; i < 5; i++) {
        const rotation = soundCumulativeRotation * ringMultipliers[i];
        soundRingRotations[i] = rotation;
        applySoundRingRotation(i, rotation);
    }
}

// Initialize the sound concentric rings interaction
function initializeSoundRings() {
    if (soundRingsInitialized) return;
    
    const svg = document.getElementById('sound-sound-rings-svg');
    if (!svg) return;
    
    // Add mouse move listener to document - rings follow mouse position
    document.addEventListener('mousemove', handleSoundRingMouseMove);
    
    soundRingsInitialized = true;
}

// Reset all sound ring rotations to 0
function resetSoundRings() {
    soundRingRotations = [0, 0, 0, 0, 0];
    soundPrevAngle = null;
    soundCumulativeRotation = 0;
    
    // Reset all ring transforms
    for (let i = 0; i < 5; i++) {
        applySoundRingRotation(i, 0);
    }
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
const LETTER_NUMBER_OUTER_EXTENSION = 400; // How far beyond element to detect mouse for pushing inward
const LETTER_NUMBER_ANGULAR_TOLERANCE = 0.25; // Radians (~15 degrees) - how close mouse angle must be to element's radial line

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
    
    // Set up mouse move listener on document (full page tracking for extended zone)
    if (!letterNumberInitialized) {
        document.addEventListener('mousemove', handleLetterNumberMouseMove);
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
// Extended zone: allows pushing from outside the element along its radial direction
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
        
        // Current radial displacement
        const radialDisp = letterNumberDisplacements[i];
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        
        // Current position with radial displacement (before clamping)
        let currentX = baseX + dirX * radialDisp;
        let currentY = baseY + dirY * radialDisp;
        
        // Apply same boundary clamping as visual positioning to get actual element position
        const clampedX = Math.max(minX, Math.min(maxX, currentX));
        const clampedY = Math.max(minY, Math.min(maxY, currentY));
        
        // Calculate distance from mouse (mouse position is relative to center)
        const mouseAbsX = centerX + letterNumberMousePosition.x;
        const mouseAbsY = centerY + letterNumberMousePosition.y;
        
        const dx = clampedX - mouseAbsX;
        const dy = clampedY - mouseAbsY;
        const distanceFromMouse = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate distances from center - use ACTUAL clamped position, not theoretical
        const mouseDistFromCenter = Math.sqrt(
            letterNumberMousePosition.x * letterNumberMousePosition.x +
            letterNumberMousePosition.y * letterNumberMousePosition.y
        );
        // Actual element distance from center (after clamping)
        const actualElementDistFromCenter = Math.sqrt(
            (clampedX - centerX) * (clampedX - centerX) +
            (clampedY - centerY) * (clampedY - centerY)
        );
        
        // Calculate angle from center to mouse
        const mouseAngle = Math.atan2(letterNumberMousePosition.y, letterNumberMousePosition.x);
        
        // Calculate angular difference (normalized to -PI to PI range)
        let angleDiff = mouseAngle - angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        const absAngleDiff = Math.abs(angleDiff);
        
        // Check if mouse is in the EXTENDED ZONE (beyond the element, on the same radial line)
        // This allows pushing inward from outside the visible element
        // Uses actual element position (clamped) instead of theoretical position
        const isInExtendedZone = (
            absAngleDiff < LETTER_NUMBER_ANGULAR_TOLERANCE && // Mouse is on same radial line
            mouseDistFromCenter > actualElementDistFromCenter && // Mouse is beyond element (further from center)
            mouseDistFromCenter < actualElementDistFromCenter + LETTER_NUMBER_OUTER_EXTENSION // Within extension range
        );
        
        // Check if mouse is in the normal repulsion zone (close to element)
        const isInNormalZone = distanceFromMouse < LETTER_NUMBER_REPULSION_RADIUS && distanceFromMouse > 0;
        
        // Apply repulsion if in either zone
        if (isInNormalZone || isInExtendedZone) {
            let repulsionStrength;
            
            if (isInExtendedZone && !isInNormalZone) {
                // Extended zone: calculate force based on distance beyond element
                const distBeyondElement = mouseDistFromCenter - actualElementDistFromCenter;
                const force = 1 - (distBeyondElement / LETTER_NUMBER_OUTER_EXTENSION);
                repulsionStrength = force * 3; // Same multiplier for consistency
            } else {
                // Normal zone: calculate force based on proximity to element
                const force = (LETTER_NUMBER_REPULSION_RADIUS - distanceFromMouse) / LETTER_NUMBER_REPULSION_RADIUS;
                repulsionStrength = force * 3; // Multiplier for responsiveness
            }
            
            let pushAmount;
            
            if (mouseDistFromCenter > actualElementDistFromCenter) {
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

// Mouse position zones mapped to segment indices
// Canvas is divided into 6 pie-slice zones (60° each), starting from top going clockwise:
// Zone 0 (330° to 30°): Top → Segment 0 (Red)
// Zone 1 (30° to 90°): Top-Right → Segment 1 (Purple)  
// Zone 2 (90° to 150°): Bottom-Right → Segment 2 (Yellow)
// Zone 3 (150° to 210°): Bottom → Segment 3 (Green)
// Zone 4 (210° to 270°): Bottom-Left → Segment 4 (Pink)
// Zone 5 (270° to 330°): Top-Left → Segment 5 (Blue)

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

// Get which segment should be revealed based on mouse angle from center
// Returns segment index (0-5) based on which zone the mouse is in
function getRevealedSegmentFromAngle(mouseAngle) {
    // Normalize angle to 0-360 range
    let angle = mouseAngle;
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    
    // Determine which 60° zone the mouse is in
    // Offset by 30° so zone 0 is centered at top (330° to 30°)
    const adjustedAngle = (angle + 30) % 360;
    const zoneIndex = Math.floor(adjustedAngle / 60);
    
    return zoneIndex;
}

// Update color segment reveal states based on mouse position on canvas
// Only the segment corresponding to the mouse's zone is revealed
function updateColorColorSegmentRevealByZone(revealedSegmentIndex) {
    const container = document.getElementById('color-color-circle-container');
    if (!container) return;
    
    // Get all segments across all rings
    const allSegments = container.querySelectorAll('.color-segment');
    
    allSegments.forEach(segment => {
        const segmentIndex = parseInt(segment.getAttribute('data-segment'));
        
        // Reveal only the segment that matches the mouse zone
        if (segmentIndex === revealedSegmentIndex) {
            segment.classList.add('revealed');
        } else {
            segment.classList.remove('revealed');
        }
    });
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
    
    // Reveal segment based on mouse position zone (not rotation)
    const revealedSegment = getRevealedSegmentFromAngle(mouseAngle);
    updateColorColorSegmentRevealByZone(revealedSegment);
}

// Initialize the color concentric rings interaction
function initializeColorColorRings() {
    if (colorColorRingsInitialized) return;
    
    const container = document.getElementById('color-color-circle-container');
    const canvasContainer = document.getElementById('canvas-container');
    if (!container || !canvasContainer) return;
    
    // Add mouse move listener to document - rings follow mouse position
    document.addEventListener('mousemove', handleColorColorRingMouseMove);
    
    // Track when mouse enters/leaves the canvas area
    // When outside canvas, segments should be black; when inside, show actual colors
    canvasContainer.addEventListener('mouseenter', () => {
        container.classList.remove('mouse-outside-canvas');
    });
    
    canvasContainer.addEventListener('mouseleave', () => {
        container.classList.add('mouse-outside-canvas');
    });
    
    // Start with mouse-outside-canvas class (assume mouse starts outside)
    container.classList.add('mouse-outside-canvas');
    
    colorColorRingsInitialized = true;
}

// Reset all color ring rotations to 0 and hide all segment colors
function resetColorColorRings() {
    colorColorRingRotations = [0, 0, 0, 0, 0];
    
    // Apply reset rotations to all rings and remove revealed class from segments
    for (let i = 0; i < 5; i++) {
        applyColorColorRingRotation(i, 0);
        
        // Remove revealed class from all segments in this ring
        const ring = document.querySelector(`.color-color-ring[data-ring="${i}"]`);
        if (ring) {
            const segments = ring.querySelectorAll('.color-segment');
            segments.forEach(segment => segment.classList.remove('revealed'));
        }
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

// Digit 7 animation - now triggered only on click/touch (no automatic timer)

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

// ==================
// NUMBER + COLOR GRID
// ==================
// Draggable 2x5 grid with digits 0-9
// Each column has independent row heights (per-column horizontal dividers)

// State variables for Number + Color grid
let numberColorGridContainer = null;
let numberColorCells = []; // Array of 10 cells (0-9)
let numberColorDividersH = []; // Horizontal dividers (5 - one per column)
let numberColorDividersV = []; // Vertical dividers (4)
// Per-column row heights: each column has its own [topRowHeight, bottomRowHeight]
// Array of 5 columns, each with 2 row heights that sum to 100%
let numberColorPerColRowHeights = [
    [30, 70],  // Column 0: 0 smaller, 5 larger
    [10, 90],  // Column 1: 1 very small, 6 very large
    [35, 65],  // Column 2: 2 medium, 7 larger
    [55, 45],  // Column 3: 3 larger, 8 smaller
    [25, 75]   // Column 4: 4 small, 9 large
];
let numberColorColWidths = [15, 25, 15, 20, 25]; // Varied column widths
const NUMBER_COLOR_MIN_SIZE = 5; // Minimum percentage for row/column

// Color palette for digit reveal effect (from scrollbar colors)
const NUMBER_COLOR_PALETTE = [
    '#EF4538', // Red
    '#891951', // Purple
    '#FAB01B', // Yellow
    '#007A6F', // Teal
    '#EB4781', // Pink
    '#293990'  // Blue
];

// Drag state for grid dividers
let numberColorIsDragging = false;
let numberColorDragType = null; // 'h' for horizontal, 'v' for vertical
let numberColorDragIndex = -1; // For vertical dividers: index between columns. For horizontal: column index
let numberColorDragStartPos = 0;
let numberColorGridInitialized = false;

// Function to update Number + Color grid visibility
function updateNumberColorGrid(pageId) {
    const gridContainer = document.getElementById('number-color-grid-container');
    if (!gridContainer) return;
    
    // Show grid only for Number + Color pages (pageId "3-5" or "5-3")
    // Parameter indices: 3=number, 5=color
    const isNumberColorPage = pageId === '3-5' || pageId === '5-3';
    
    if (isNumberColorPage) {
        gridContainer.classList.remove('hidden');
        // Initialize grid when page becomes visible
        requestAnimationFrame(() => {
            initializeNumberColorGrid();
        });
    } else {
        gridContainer.classList.add('hidden');
    }
}

// Initialize Number + Color grid
function initializeNumberColorGrid() {
    numberColorGridContainer = document.getElementById('number-color-grid-container');
    if (!numberColorGridContainer) return;
    
    // Get all cells and dividers
    numberColorCells = Array.from(numberColorGridContainer.querySelectorAll('.number-color-cell'));
    numberColorDividersH = Array.from(numberColorGridContainer.querySelectorAll('.number-color-divider-h'));
    numberColorDividersV = Array.from(numberColorGridContainer.querySelectorAll('.number-color-divider-v'));
    
    // Reset to asymmetric initial sizes matching the design
    numberColorPerColRowHeights = [
        [30, 70],  // Column 0: 0 smaller, 5 larger
        [10, 90],  // Column 1: 1 very small, 6 very large
        [35, 65],  // Column 2: 2 medium, 7 larger
        [55, 45],  // Column 3: 3 larger, 8 smaller
        [25, 75]   // Column 4: 4 small, 9 large
    ];
    numberColorColWidths = [15, 25, 15, 20, 25]; // Varied column widths
    
    // Apply initial layout
    updateNumberColorGridLayout();
    
    // Only add event listeners once
    if (numberColorGridInitialized) return;
    numberColorGridInitialized = true;
    
    // Add mouse event listeners for horizontal dividers (per-column)
    numberColorDividersH.forEach((divider) => {
        const colIndex = parseInt(divider.dataset.col);
        divider.addEventListener('mousedown', (e) => handleNumberColorDividerMouseDown(e, 'h', colIndex));
    });
    
    // Add mouse event listeners for vertical dividers
    numberColorDividersV.forEach((divider, index) => {
        divider.addEventListener('mousedown', (e) => handleNumberColorDividerMouseDown(e, 'v', index));
    });
    
    // Add document-level mouse move and up handlers
    document.addEventListener('mousemove', handleNumberColorDividerMouseMove);
    document.addEventListener('mouseup', handleNumberColorDividerMouseUp);
    
    // Add touch event listeners for horizontal dividers (per-column)
    numberColorDividersH.forEach((divider) => {
        const colIndex = parseInt(divider.dataset.col);
        divider.addEventListener('touchstart', (e) => handleNumberColorDividerTouchStart(e, 'h', colIndex), { passive: false });
    });
    
    // Add touch event listeners for vertical dividers
    numberColorDividersV.forEach((divider, index) => {
        divider.addEventListener('touchstart', (e) => handleNumberColorDividerTouchStart(e, 'v', index), { passive: false });
    });
    
    document.addEventListener('touchmove', handleNumberColorDividerTouchMove, { passive: false });
    document.addEventListener('touchend', handleNumberColorDividerTouchEnd);
}

// Update the visual layout of the grid based on current row heights and column widths
function updateNumberColorGridLayout() {
    if (!numberColorGridContainer) return;
    
    const containerRect = numberColorGridContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate cumulative positions for columns
    let colPositions = [0]; // Start positions for each column
    for (let i = 0; i < numberColorColWidths.length; i++) {
        colPositions.push(colPositions[i] + numberColorColWidths[i]);
    }
    
    // Position each cell - using per-column row heights
    numberColorCells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Get this column's row heights
        const colRowHeights = numberColorPerColRowHeights[col];
        
        // Calculate row position within this column
        const rowTopPercent = row === 0 ? 0 : colRowHeights[0];
        const rowHeightPercent = colRowHeights[row];
        
        const top = (rowTopPercent / 100) * containerHeight;
        const left = (colPositions[col] / 100) * containerWidth;
        const height = (rowHeightPercent / 100) * containerHeight;
        const width = (numberColorColWidths[col] / 100) * containerWidth;
        
        cell.style.top = `${top}px`;
        cell.style.left = `${left}px`;
        cell.style.height = `${height}px`;
        cell.style.width = `${width}px`;
    });
    
    // Position horizontal dividers (per-column, between rows 0 and 1)
    numberColorDividersH.forEach((divider) => {
        const col = parseInt(divider.dataset.col);
        const colRowHeights = numberColorPerColRowHeights[col];
        
        // Divider is at the bottom of row 0 (top of row 1)
        const top = (colRowHeights[0] / 100) * containerHeight - 1;
        const left = (colPositions[col] / 100) * containerWidth;
        const width = (numberColorColWidths[col] / 100) * containerWidth;
        
        divider.style.top = `${top}px`;
        divider.style.left = `${left}px`;
        divider.style.width = `${width}px`;
    });
    
    // Position vertical dividers (between columns)
    numberColorDividersV.forEach((divider, index) => {
        const left = (colPositions[index + 1] / 100) * containerWidth - 1; // Center the 2px line
        divider.style.left = `${left}px`;
    });
}

// Update digit colors based on dragging state
// Only the cells affected by the current drag reveal their colors
// dragType: 'h' for horizontal (affects 2 cells in one column), 'v' for vertical (affects 4 cells in 2 columns)
// dragIndex: for 'h' = column index, for 'v' = divider index between columns
function updateNumberColorDigitColors(isDragging, dragType, dragIndex) {
    numberColorCells.forEach(cell => {
        const digitText = cell.querySelector('.number-color-digit');
        if (!digitText) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Determine if this cell is affected by the current drag
        let isAffected = false;
        if (isDragging) {
            if (dragType === 'h') {
                // Horizontal divider affects both rows in this column only
                isAffected = (col === dragIndex);
            } else if (dragType === 'v') {
                // Vertical divider at index X is between columns X and X+1
                // Affects all cells in both adjacent columns
                isAffected = (col === dragIndex || col === dragIndex + 1);
            }
        }
        
        if (isAffected) {
            // Reveal color based on digit value (0-9 mapped to 6 colors)
            const digit = parseInt(digitText.textContent);
            const colorIndex = digit % NUMBER_COLOR_PALETTE.length;
            digitText.style.fill = NUMBER_COLOR_PALETTE[colorIndex];
        } else {
            // Return to black (or stay black if not dragging)
            digitText.style.fill = '#2C2C2C';
        }
    });
}

// Mouse down handler for dividers
function handleNumberColorDividerMouseDown(e, type, index) {
    e.preventDefault();
    
    numberColorIsDragging = true;
    numberColorDragType = type;
    numberColorDragIndex = index; // For 'h': column index. For 'v': divider index between columns
    numberColorDragStartPos = type === 'h' ? e.clientY : e.clientX;
    
    // Add visual feedback
    const divider = type === 'h' 
        ? numberColorDividersH.find(d => parseInt(d.dataset.col) === index)
        : numberColorDividersV[index];
    if (divider) divider.classList.add('active');
    numberColorGridContainer.classList.add(type === 'h' ? 'dragging-h' : 'dragging-v');
    
    // Reveal digit colors for affected cells only
    updateNumberColorDigitColors(true, type, index);
}

// Mouse move handler for dividers
function handleNumberColorDividerMouseMove(e) {
    if (!numberColorIsDragging) return;
    
    e.preventDefault();
    
    const containerRect = numberColorGridContainer.getBoundingClientRect();
    
    if (numberColorDragType === 'h') {
        // Horizontal divider - affects row heights for this column only
        const deltaY = e.clientY - numberColorDragStartPos;
        const deltaPercent = (deltaY / containerRect.height) * 100;
        
        resizeNumberColorRows(numberColorDragIndex, deltaPercent);
        numberColorDragStartPos = e.clientY;
    } else {
        // Vertical divider - affects column widths
        const deltaX = e.clientX - numberColorDragStartPos;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        
        resizeNumberColorColumns(numberColorDragIndex, deltaPercent);
        numberColorDragStartPos = e.clientX;
    }
    
    updateNumberColorGridLayout();
}

// Mouse up handler for dividers
function handleNumberColorDividerMouseUp(e) {
    if (!numberColorIsDragging) return;
    
    // Remove visual feedback
    const divider = numberColorDragType === 'h' 
        ? numberColorDividersH.find(d => parseInt(d.dataset.col) === numberColorDragIndex)
        : numberColorDividersV[numberColorDragIndex];
    
    if (divider) divider.classList.remove('active');
    numberColorGridContainer.classList.remove('dragging-h', 'dragging-v');
    
    // Return digits to black when drag ends
    updateNumberColorDigitColors(false);
    
    numberColorIsDragging = false;
    numberColorDragType = null;
    numberColorDragIndex = -1;
}

// Touch start handler for dividers
function handleNumberColorDividerTouchStart(e, type, index) {
    if (!e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    numberColorIsDragging = true;
    numberColorDragType = type;
    numberColorDragIndex = index;
    numberColorDragStartPos = type === 'h' ? touch.clientY : touch.clientX;
    
    // Add visual feedback
    const divider = type === 'h' 
        ? numberColorDividersH.find(d => parseInt(d.dataset.col) === index)
        : numberColorDividersV[index];
    if (divider) divider.classList.add('active');
    numberColorGridContainer.classList.add(type === 'h' ? 'dragging-h' : 'dragging-v');
    
    // Reveal digit colors for affected cells only
    updateNumberColorDigitColors(true, type, index);
}

// Touch move handler for dividers
function handleNumberColorDividerTouchMove(e) {
    if (!numberColorIsDragging) return;
    if (!e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const containerRect = numberColorGridContainer.getBoundingClientRect();
    
    if (numberColorDragType === 'h') {
        const deltaY = touch.clientY - numberColorDragStartPos;
        const deltaPercent = (deltaY / containerRect.height) * 100;
        
        resizeNumberColorRows(numberColorDragIndex, deltaPercent);
        numberColorDragStartPos = touch.clientY;
    } else {
        const deltaX = touch.clientX - numberColorDragStartPos;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        
        resizeNumberColorColumns(numberColorDragIndex, deltaPercent);
        numberColorDragStartPos = touch.clientX;
    }
    
    updateNumberColorGridLayout();
}

// Touch end handler for dividers
function handleNumberColorDividerTouchEnd(e) {
    if (!numberColorIsDragging) return;
    
    // Remove visual feedback
    const divider = numberColorDragType === 'h' 
        ? numberColorDividersH.find(d => parseInt(d.dataset.col) === numberColorDragIndex)
        : numberColorDividersV[numberColorDragIndex];
    
    if (divider) divider.classList.remove('active');
    numberColorGridContainer.classList.remove('dragging-h', 'dragging-v');
    
    // Return digits to black when drag ends
    updateNumberColorDigitColors(false);
    
    numberColorIsDragging = false;
    numberColorDragType = null;
    numberColorDragIndex = -1;
}

// Resize rows for a specific column (per-column row heights)
function resizeNumberColorRows(colIndex, deltaPercent) {
    // Get current row heights for this column
    const colRowHeights = numberColorPerColRowHeights[colIndex];
    
    // Calculate new heights
    let newTopHeight = colRowHeights[0] + deltaPercent;
    let newBottomHeight = colRowHeights[1] - deltaPercent;
    
    // Enforce minimum size constraints
    if (newTopHeight < NUMBER_COLOR_MIN_SIZE) {
        const adjustment = NUMBER_COLOR_MIN_SIZE - newTopHeight;
        newTopHeight = NUMBER_COLOR_MIN_SIZE;
        newBottomHeight -= adjustment;
    }
    
    if (newBottomHeight < NUMBER_COLOR_MIN_SIZE) {
        const adjustment = NUMBER_COLOR_MIN_SIZE - newBottomHeight;
        newBottomHeight = NUMBER_COLOR_MIN_SIZE;
        newTopHeight -= adjustment;
    }
    
    // Final clamp
    if (newTopHeight >= NUMBER_COLOR_MIN_SIZE && newBottomHeight >= NUMBER_COLOR_MIN_SIZE) {
        numberColorPerColRowHeights[colIndex] = [newTopHeight, newBottomHeight];
    }
}

// Resize adjacent columns (accordion style)
function resizeNumberColorColumns(dividerIndex, deltaPercent) {
    // Divider at index i is between column i and column i+1
    const leftColIndex = dividerIndex;
    const rightColIndex = dividerIndex + 1;
    
    // Calculate new widths
    let newLeftWidth = numberColorColWidths[leftColIndex] + deltaPercent;
    let newRightWidth = numberColorColWidths[rightColIndex] - deltaPercent;
    
    // Enforce minimum size constraints
    if (newLeftWidth < NUMBER_COLOR_MIN_SIZE) {
        const adjustment = NUMBER_COLOR_MIN_SIZE - newLeftWidth;
        newLeftWidth = NUMBER_COLOR_MIN_SIZE;
        newRightWidth -= adjustment;
    }
    
    if (newRightWidth < NUMBER_COLOR_MIN_SIZE) {
        const adjustment = NUMBER_COLOR_MIN_SIZE - newRightWidth;
        newRightWidth = NUMBER_COLOR_MIN_SIZE;
        newLeftWidth -= adjustment;
    }
    
    // Final clamp
    if (newLeftWidth >= NUMBER_COLOR_MIN_SIZE && newRightWidth >= NUMBER_COLOR_MIN_SIZE) {
        numberColorColWidths[leftColIndex] = newLeftWidth;
        numberColorColWidths[rightColIndex] = newRightWidth;
    }
}

// ==================
// SOUND + NUMBER GRID
// ==================
// Draggable 3x3 grid with digit 1 in center cell

// State variables for Sound + Number grid
let soundNumberGridContainer = null;
let soundNumberCell = null; // Only the center cell (row 1, col 1)
let soundNumberDividersH = []; // Horizontal dividers (2)
let soundNumberDividersV = []; // Vertical dividers (2)
// Default layout - wide and short center cell (shows digit 8)
let soundNumberRowHeights = [30, 40, 30]; // Small top, large middle, small bottom
let soundNumberColWidths = [15, 70, 15]; // Narrow left, wide middle, narrow right
const SOUND_NUMBER_MIN_SIZE = 5; // Minimum percentage for row/column

// Drag state for grid dividers
let soundNumberIsDragging = false;
let soundNumberDragType = null; // 'h' for horizontal, 'v' for vertical
let soundNumberDragIndex = -1;
let soundNumberDragStartPos = 0;
let soundNumberGridInitialized = false;

// Audio state for Sound + Number grid
let soundNumberAudioContext = null;
let soundNumberOscillator = null;
let soundNumberGainNode = null;

// Function to update Sound + Number grid visibility
function updateSoundNumberGrid(pageId) {
    const gridContainer = document.getElementById('sound-number-container');
    if (!gridContainer) return;
    
    // Show grid only for Sound + Number pages (pageId "1-3" or "3-1")
    // Parameter indices: 1=sound, 3=number
    const isSoundNumberPage = pageId === '1-3' || pageId === '3-1';
    
    if (isSoundNumberPage) {
        gridContainer.classList.remove('hidden');
        // Initialize grid after making visible
        requestAnimationFrame(() => {
            initializeSoundNumberGrid();
        });
    } else {
        gridContainer.classList.add('hidden');
    }
}

// Initialize Sound + Number grid
function initializeSoundNumberGrid() {
    soundNumberGridContainer = document.getElementById('sound-number-container');
    if (!soundNumberGridContainer) return;
    
    // Get center cell (the one with the digit) and dividers
    soundNumberCell = soundNumberGridContainer.querySelector('.sound-number-cell-center');
    soundNumberDividersH = Array.from(soundNumberGridContainer.querySelectorAll('.sound-number-divider-h'));
    soundNumberDividersV = Array.from(soundNumberGridContainer.querySelectorAll('.sound-number-divider-v'));
    
    // Reset to default layout - narrow and tall center cell (shows digit 3), shifted right
    soundNumberRowHeights = [15, 70, 15];
    soundNumberColWidths = [55, 20, 25];
    
    // Apply initial layout
    updateSoundNumberGridLayout();
    
    // Only add event listeners once
    if (soundNumberGridInitialized) return;
    soundNumberGridInitialized = true;
    
    // Add mouse event listeners for dividers
    soundNumberDividersH.forEach((divider, index) => {
        divider.addEventListener('mousedown', (e) => handleSoundNumberDividerMouseDown(e, 'h', index));
    });
    
    soundNumberDividersV.forEach((divider, index) => {
        divider.addEventListener('mousedown', (e) => handleSoundNumberDividerMouseDown(e, 'v', index));
    });
    
    // Add document-level mouse move and up handlers
    document.addEventListener('mousemove', handleSoundNumberDividerMouseMove);
    document.addEventListener('mouseup', handleSoundNumberDividerMouseUp);
    
    // Add touch event listeners for dividers
    soundNumberDividersH.forEach((divider, index) => {
        divider.addEventListener('touchstart', (e) => handleSoundNumberDividerTouchStart(e, 'h', index), { passive: false });
    });
    
    soundNumberDividersV.forEach((divider, index) => {
        divider.addEventListener('touchstart', (e) => handleSoundNumberDividerTouchStart(e, 'v', index), { passive: false });
    });
    
    document.addEventListener('touchmove', handleSoundNumberDividerTouchMove, { passive: false });
    document.addEventListener('touchend', handleSoundNumberDividerTouchEnd);
}

// Update the visual layout of the grid based on current row heights and column widths
function updateSoundNumberGridLayout() {
    if (!soundNumberGridContainer) return;
    
    const containerRect = soundNumberGridContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate cumulative positions for rows
    let rowPositions = [0]; // Start positions for each row
    for (let i = 0; i < soundNumberRowHeights.length; i++) {
        rowPositions.push(rowPositions[i] + soundNumberRowHeights[i]);
    }
    
    // Calculate cumulative positions for columns
    let colPositions = [0]; // Start positions for each column
    for (let i = 0; i < soundNumberColWidths.length; i++) {
        colPositions.push(colPositions[i] + soundNumberColWidths[i]);
    }
    
    // Position all cells (9 total: 8 outer + 1 center)
    const allCells = soundNumberGridContainer.querySelectorAll('.sound-number-cell');
    allCells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        const top = (rowPositions[row] / 100) * containerHeight;
        const left = (colPositions[col] / 100) * containerWidth;
        const height = (soundNumberRowHeights[row] / 100) * containerHeight;
        const width = (soundNumberColWidths[col] / 100) * containerWidth;
        
        cell.style.top = `${top}px`;
        cell.style.left = `${left}px`;
        cell.style.height = `${height}px`;
        cell.style.width = `${width}px`;
    });
    
    // Position horizontal dividers (between rows)
    soundNumberDividersH.forEach((divider, index) => {
        const top = (rowPositions[index + 1] / 100) * containerHeight - 1; // Center the 2px line
        divider.style.top = `${top}px`;
    });
    
    // Position vertical dividers (between columns)
    soundNumberDividersV.forEach((divider, index) => {
        const left = (colPositions[index + 1] / 100) * containerWidth - 1; // Center the 2px line
        divider.style.left = `${left}px`;
    });
    
    // Update digit based on cell ratio
    updateSoundNumberDigit();
    
    // Update audio frequency if currently dragging
    if (soundNumberIsDragging) {
        updateSoundNumberFrequency();
    }
}

// Update the digit (1-9) based on cell aspect ratio
// ratio < 1 (vertical/tall) -> lower digits (1-4)
// ratio = 1 (square) -> digit 5
// ratio > 1 (horizontal/wide) -> higher digits (6-9)
function updateSoundNumberDigit() {
    if (!soundNumberCell) return;
    
    const width = parseFloat(soundNumberCell.style.width);
    const height = parseFloat(soundNumberCell.style.height);
    
    if (width <= 0 || height <= 0) return;
    
    // Calculate aspect ratio (width/height)
    const ratio = width / height;
    
    // Map ratio to digit 1-9
    let digit;
    if (ratio <= 0.2) digit = 1;
    else if (ratio <= 0.4) digit = 2;
    else if (ratio <= 0.6) digit = 3;
    else if (ratio <= 0.8) digit = 4;
    else if (ratio <= 1.2) digit = 5;
    else if (ratio <= 1.6) digit = 6;
    else if (ratio <= 2.2) digit = 7;
    else if (ratio <= 3.0) digit = 8;
    else digit = 9;
    
    // Update the SVG text
    const digitElement = soundNumberCell.querySelector('.sound-number-digit');
    if (digitElement) {
        digitElement.textContent = digit.toString();
    }
    
    // Calculate frequency for pitch labels (same logic as updateSoundNumberFrequency)
    const minFreq = 150;
    const maxFreq = 800;
    const clampedRatio = Math.max(0.2, Math.min(5.0, ratio));
    const logMin = Math.log(0.2);
    const logMax = Math.log(5.0);
    const logRatio = Math.log(clampedRatio);
    const normalizedRatio = (logRatio - logMin) / (logMax - logMin);
    const frequency = Math.round(maxFreq - (normalizedRatio * (maxFreq - minFreq)));
    
    // Update all pitch labels with the current frequency
    const pitchLabels = soundNumberGridContainer.querySelectorAll('.sound-number-pitch-label');
    pitchLabels.forEach(label => {
        label.textContent = `${frequency} hz`;
    });
}

// Start the sine wave sound when dragging begins
function startSoundNumberAudio() {
    // Create audio context if needed (must be created after user interaction)
    if (!soundNumberAudioContext) {
        soundNumberAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume context if suspended (browser autoplay policy)
    if (soundNumberAudioContext.state === 'suspended') {
        soundNumberAudioContext.resume();
    }
    
    // Create oscillator and gain node
    soundNumberOscillator = soundNumberAudioContext.createOscillator();
    soundNumberGainNode = soundNumberAudioContext.createGain();
    
    // Configure oscillator
    soundNumberOscillator.type = 'sine';
    soundNumberOscillator.frequency.value = 440; // Start at middle frequency
    
    // Configure gain (volume) - start at 0 and fade in
    soundNumberGainNode.gain.value = 0;
    soundNumberGainNode.gain.linearRampToValueAtTime(0.3, soundNumberAudioContext.currentTime + 0.05);
    
    // Connect: oscillator -> gain -> output
    soundNumberOscillator.connect(soundNumberGainNode);
    soundNumberGainNode.connect(soundNumberAudioContext.destination);
    
    // Start the oscillator
    soundNumberOscillator.start();
    
    // Update frequency based on current cell ratio
    updateSoundNumberFrequency();
}

// Update the oscillator frequency based on cell aspect ratio
// Narrow/tall (low ratio) = high pitch, Wide/short (high ratio) = low pitch
function updateSoundNumberFrequency() {
    if (!soundNumberOscillator || !soundNumberCell) return;
    
    const width = parseFloat(soundNumberCell.style.width);
    const height = parseFloat(soundNumberCell.style.height);
    
    if (width <= 0 || height <= 0) return;
    
    // Calculate aspect ratio (width/height)
    const ratio = width / height;
    
    // Map ratio to frequency (inverse relationship)
    // ratio 0.2 (very tall) -> 800Hz (high pitch)
    // ratio 1.0 (square) -> 440Hz (middle)
    // ratio 5.0 (very wide) -> 150Hz (low pitch)
    // Using logarithmic mapping for more natural sound
    const minFreq = 150;
    const maxFreq = 800;
    
    // Clamp ratio to reasonable range
    const clampedRatio = Math.max(0.2, Math.min(5.0, ratio));
    
    // Inverse logarithmic mapping: low ratio = high freq, high ratio = low freq
    const logMin = Math.log(0.2);
    const logMax = Math.log(5.0);
    const logRatio = Math.log(clampedRatio);
    const normalizedRatio = (logRatio - logMin) / (logMax - logMin); // 0 to 1
    
    // Invert: 0 -> maxFreq, 1 -> minFreq
    const frequency = maxFreq - (normalizedRatio * (maxFreq - minFreq));
    
    // Smooth frequency transition
    soundNumberOscillator.frequency.linearRampToValueAtTime(
        frequency,
        soundNumberAudioContext.currentTime + 0.05
    );
}

// Stop the sound when dragging ends
function stopSoundNumberAudio() {
    if (!soundNumberOscillator || !soundNumberGainNode) return;
    
    // Fade out to avoid click
    soundNumberGainNode.gain.linearRampToValueAtTime(0, soundNumberAudioContext.currentTime + 0.1);
    
    // Stop oscillator after fade out
    setTimeout(() => {
        if (soundNumberOscillator) {
            soundNumberOscillator.stop();
            soundNumberOscillator.disconnect();
            soundNumberOscillator = null;
        }
        if (soundNumberGainNode) {
            soundNumberGainNode.disconnect();
            soundNumberGainNode = null;
        }
    }, 150);
}

// Mouse down handler for dividers
function handleSoundNumberDividerMouseDown(e, type, index) {
    e.preventDefault();
    
    soundNumberIsDragging = true;
    soundNumberDragType = type;
    soundNumberDragIndex = index;
    soundNumberDragStartPos = type === 'h' ? e.clientY : e.clientX;
    
    // Add visual feedback
    const divider = type === 'h' ? soundNumberDividersH[index] : soundNumberDividersV[index];
    divider.classList.add('active');
    soundNumberGridContainer.classList.add(type === 'h' ? 'dragging-h' : 'dragging-v');
    
    // Start audio
    startSoundNumberAudio();
}

// Mouse move handler for dividers
function handleSoundNumberDividerMouseMove(e) {
    if (!soundNumberIsDragging) return;
    
    e.preventDefault();
    
    const containerRect = soundNumberGridContainer.getBoundingClientRect();
    
    if (soundNumberDragType === 'h') {
        // Horizontal divider - affects row heights
        const deltaY = e.clientY - soundNumberDragStartPos;
        const deltaPercent = (deltaY / containerRect.height) * 100;
        
        resizeSoundNumberRows(soundNumberDragIndex, deltaPercent);
        soundNumberDragStartPos = e.clientY;
    } else {
        // Vertical divider - affects column widths
        const deltaX = e.clientX - soundNumberDragStartPos;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        
        resizeSoundNumberColumns(soundNumberDragIndex, deltaPercent);
        soundNumberDragStartPos = e.clientX;
    }
    
    updateSoundNumberGridLayout();
}

// Mouse up handler for dividers
function handleSoundNumberDividerMouseUp(e) {
    if (!soundNumberIsDragging) return;
    
    // Stop audio
    stopSoundNumberAudio();
    
    // Remove visual feedback
    const divider = soundNumberDragType === 'h' 
        ? soundNumberDividersH[soundNumberDragIndex] 
        : soundNumberDividersV[soundNumberDragIndex];
    
    if (divider) divider.classList.remove('active');
    soundNumberGridContainer.classList.remove('dragging-h', 'dragging-v');
    
    soundNumberIsDragging = false;
    soundNumberDragType = null;
    soundNumberDragIndex = -1;
}

// Touch start handler for dividers
function handleSoundNumberDividerTouchStart(e, type, index) {
    if (!e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    soundNumberIsDragging = true;
    soundNumberDragType = type;
    soundNumberDragIndex = index;
    soundNumberDragStartPos = type === 'h' ? touch.clientY : touch.clientX;
    
    // Add visual feedback
    const divider = type === 'h' ? soundNumberDividersH[index] : soundNumberDividersV[index];
    divider.classList.add('active');
    soundNumberGridContainer.classList.add(type === 'h' ? 'dragging-h' : 'dragging-v');
    
    // Start audio
    startSoundNumberAudio();
}

// Touch move handler for dividers
function handleSoundNumberDividerTouchMove(e) {
    if (!soundNumberIsDragging) return;
    if (!e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const containerRect = soundNumberGridContainer.getBoundingClientRect();
    
    if (soundNumberDragType === 'h') {
        const deltaY = touch.clientY - soundNumberDragStartPos;
        const deltaPercent = (deltaY / containerRect.height) * 100;
        
        resizeSoundNumberRows(soundNumberDragIndex, deltaPercent);
        soundNumberDragStartPos = touch.clientY;
    } else {
        const deltaX = touch.clientX - soundNumberDragStartPos;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        
        resizeSoundNumberColumns(soundNumberDragIndex, deltaPercent);
        soundNumberDragStartPos = touch.clientX;
    }
    
    updateSoundNumberGridLayout();
}

// Touch end handler for dividers
function handleSoundNumberDividerTouchEnd(e) {
    if (!soundNumberIsDragging) return;
    
    // Stop audio
    stopSoundNumberAudio();
    
    // Remove visual feedback
    const divider = soundNumberDragType === 'h' 
        ? soundNumberDividersH[soundNumberDragIndex] 
        : soundNumberDividersV[soundNumberDragIndex];
    
    if (divider) divider.classList.remove('active');
    soundNumberGridContainer.classList.remove('dragging-h', 'dragging-v');
    
    soundNumberIsDragging = false;
    soundNumberDragType = null;
    soundNumberDragIndex = -1;
}

// Resize adjacent rows (accordion style)
function resizeSoundNumberRows(dividerIndex, deltaPercent) {
    // Divider at index i is between row i and row i+1
    const topRowIndex = dividerIndex;
    const bottomRowIndex = dividerIndex + 1;
    
    // Calculate new heights
    let newTopHeight = soundNumberRowHeights[topRowIndex] + deltaPercent;
    let newBottomHeight = soundNumberRowHeights[bottomRowIndex] - deltaPercent;
    
    // Enforce minimum size constraints
    if (newTopHeight < SOUND_NUMBER_MIN_SIZE) {
        const adjustment = SOUND_NUMBER_MIN_SIZE - newTopHeight;
        newTopHeight = SOUND_NUMBER_MIN_SIZE;
        newBottomHeight -= adjustment;
    }
    
    if (newBottomHeight < SOUND_NUMBER_MIN_SIZE) {
        const adjustment = SOUND_NUMBER_MIN_SIZE - newBottomHeight;
        newBottomHeight = SOUND_NUMBER_MIN_SIZE;
        newTopHeight -= adjustment;
    }
    
    // Final clamp
    if (newTopHeight >= SOUND_NUMBER_MIN_SIZE && newBottomHeight >= SOUND_NUMBER_MIN_SIZE) {
        soundNumberRowHeights[topRowIndex] = newTopHeight;
        soundNumberRowHeights[bottomRowIndex] = newBottomHeight;
    }
}

// Resize adjacent columns (accordion style)
function resizeSoundNumberColumns(dividerIndex, deltaPercent) {
    // Divider at index i is between column i and column i+1
    const leftColIndex = dividerIndex;
    const rightColIndex = dividerIndex + 1;
    
    // Calculate new widths
    let newLeftWidth = soundNumberColWidths[leftColIndex] + deltaPercent;
    let newRightWidth = soundNumberColWidths[rightColIndex] - deltaPercent;
    
    // Enforce minimum size constraints
    if (newLeftWidth < SOUND_NUMBER_MIN_SIZE) {
        const adjustment = SOUND_NUMBER_MIN_SIZE - newLeftWidth;
        newLeftWidth = SOUND_NUMBER_MIN_SIZE;
        newRightWidth -= adjustment;
    }
    
    if (newRightWidth < SOUND_NUMBER_MIN_SIZE) {
        const adjustment = SOUND_NUMBER_MIN_SIZE - newRightWidth;
        newRightWidth = SOUND_NUMBER_MIN_SIZE;
        newLeftWidth -= adjustment;
    }
    
    // Final clamp
    if (newLeftWidth >= SOUND_NUMBER_MIN_SIZE && newRightWidth >= SOUND_NUMBER_MIN_SIZE) {
        soundNumberColWidths[leftColIndex] = newLeftWidth;
        soundNumberColWidths[rightColIndex] = newRightWidth;
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
    
    // Add click/touch handler for digit 7 animation (triggers on interaction)
    const digit7 = container.querySelector('.number-emotion-digit[data-digit="7"]');
    if (digit7) {
        // Mouse click handler
        digit7.addEventListener('click', (e) => {
            e.preventDefault();
            triggerDigit7Animation();
        });
        
        // Touch handler (for mobile)
        digit7.addEventListener('touchend', (e) => {
            // Only trigger if it wasn't a drag (touch moved less than 10px)
            if (e.changedTouches && e.changedTouches.length > 0) {
                triggerDigit7Animation();
            }
        });
    }
    
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
    
    // Note: Digit 7 animation now triggers only on click/touch, not automatically
}

// Stop the behavior animation loop
function stopNumberEmotionBehaviors() {
    if (numberEmotionAnimationId !== null) {
        cancelAnimationFrame(numberEmotionAnimationId);
        numberEmotionAnimationId = null;
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

// Check all square collisions and update sounds and colors accordingly
function checkSquareCollisionsAndUpdateSounds() {
    const container = document.getElementById('sound-color-squares-container');
    if (!container) return;
    
    const squares = container.querySelectorAll('.sound-color-square');
    if (squares.length === 0) return;
    
    // Convert NodeList to Array for easier manipulation
    const squaresArray = Array.from(squares);
    
    // Track current touching pairs
    const currentTouchingPairs = new Set();
    // Track which instruments should be playing (and which squares should show color)
    const shouldBePlaying = new Set();
    
    // If a square is being dragged, its sound should play and it should show color
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
                
                // Both instruments should play and show their colors
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
    
    // Update square colors based on state:
    // - Squares being dragged or touching others show their original color
    // - All other squares are white
    squaresArray.forEach((square, index) => {
        const squareIndex = parseInt(square.getAttribute('data-index'));
        const originalColor = square.getAttribute('data-color');
        
        if (shouldBePlaying.has(squareIndex)) {
            // Square is active (dragging or touching) - show original color
            square.style.backgroundColor = originalColor;
        } else {
            // Square is inactive - show white
            square.style.backgroundColor = '#FFFFFF';
        }
    });
    
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
            { x: -100, y: -370 },   // 0: Orange - Top-center-left (moved 150px up)
            { x: -480, y: -80 },    // 1: Purple - Left side, middle (moved 200px left)
            { x: 280, y: -100 },    // 2: Yellow - Center-right, upper
            { x: 450, y: 20 },      // 3: Green - Far right
            { x: -180, y: 180 },    // 4: Pink - Bottom-left (moved 100px left)
            { x: 380, y: 320 }      // 5: Blue - Bottom-right
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
        { x: -0.18 * maxX, y: -0.55 * maxY - 150 },  // 0: Orange - Top-center-left (moved 150px up)
        { x: -0.55 * maxX - 200, y: -0.20 * maxY },  // 1: Purple - Left side, middle (moved 200px left)
        { x: 0.55 * maxX, y: -0.25 * maxY },         // 2: Yellow - Center-right, upper
        { x: 0.95 * maxX, y: 0.05 * maxY },          // 3: Green - Far right
        { x: -0.15 * maxX - 100, y: 0.40 * maxY },   // 4: Pink - Bottom-left (moved 100px left)
        { x: 0.80 * maxX, y: 0.75 * maxY }           // 5: Blue - Bottom-right
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
    
    // Apply positions and set initial white color
    // Squares start white and only show their color when dragged or touching other squares
    squares.forEach((square, index) => {
        // Set initial color to white (color will be revealed on interaction)
        square.style.backgroundColor = '#FFFFFF';
        // Update visual position
        updateSoundColorSquarePosition(square, index);
    });
    
    // Check if any squares are initially touching and update their colors
    checkSquareCollisionsAndUpdateSounds();
    
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
// SHAPE + COLOR BOUNCING SHAPES (shapes that bounce off walls and transform)
// ==================
// Shape + Color interaction: 60 shapes that bounce freely and transform on wall collision
// When hitting a wall: shape transforms to next type in cycle and flashes its color

// Configuration - Bouncing Physics
const SHAPE_COLOR_COUNT = 6;            // One of each shape type
const SHAPE_COLOR_BASE_SIZE = 55;       // Base shape size in pixels
const SHAPE_COLOR_FLASH_DURATION = 200; // Color flash duration in ms
const SHAPE_COLOR_BOUNCE_DAMPING = 0.92; // Speed reduction on each wall hit (0.92 = loses 8% speed)

// Shape types with their size multipliers and speeds (ordered from slowest to fastest)
// All shapes are the same size (4.5x), speeds vary
const SHAPE_COLOR_CONFIG = {
    circle:   { sizeMultiplier: 4.5, speed: 1.5 },
    square:   { sizeMultiplier: 4.5, speed: 2.25 },
    ellipse:  { sizeMultiplier: 4.5, speed: 3.0 },
    triangle: { sizeMultiplier: 4.5, speed: 3.75 },
    pentagon: { sizeMultiplier: 4.5, speed: 4.5 },
    star:     { sizeMultiplier: 4.5, speed: 5.25 }
};

// Shape types in order
const SHAPE_COLOR_CYCLE = ['circle', 'square', 'ellipse', 'triangle', 'pentagon', 'star'];

// Fill colors for each shape type (shown only when shape is in motion)
// Using the site's 6-color palette from the conic-gradient
const SHAPE_COLOR_FILL_COLORS = {
    circle: '#293990',    // Blue
    square: '#FAB01B',    // Orange
    triangle: '#EF4538',  // Red (site palette)
    ellipse: '#891951',   // Purple
    star: '#EB4781',      // Pink
    pentagon: '#007A6F'   // Green
};

// State variables for Shape + Color bouncing shapes
let shapeColorContainer = null;
// Array of shape data: { element, x, y, vx, vy, shapeTypeIndex, colorFlashTime, shapeSize }
let shapeColorShapes = [];
let shapeColorAnimationId = null;
let shapeColorInitialized = false;
let shapeColorLastTime = 0; // For delta time calculation

// Drag state variables
let draggedShape = null;        // Currently dragged shape data
let dragOffsetX = 0;            // Offset from shape center to mouse
let dragOffsetY = 0;
let dragLastX = 0;              // Last mouse position for velocity calculation
let dragLastY = 0;
let dragLastTime = 0;           // Last time for velocity calculation
let dragVelocityX = 0;          // Calculated throw velocity
let dragVelocityY = 0;

// Helper function to create SVG for triangle shape
function createTriangleSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '50,5 95,95 5,95');
    polygon.setAttribute('fill', '#ffffff');
    polygon.setAttribute('stroke', '#2C2C2C');
    polygon.setAttribute('stroke-width', '3');
    
    svg.appendChild(polygon);
    return svg;
}

// Helper function to create SVG for star shape
function createStarSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    // 5-pointed star coordinates
    const points = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI / 5) - Math.PI / 2;
        const r = (i % 2 === 0) ? 45 : 20; // Outer and inner radius
        const x = 50 + Math.cos(angle) * r;
        const y = 50 + Math.sin(angle) * r;
        points.push(`${x},${y}`);
    }
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'none');
    polygon.setAttribute('stroke', '#2C2C2C');
    polygon.setAttribute('stroke-width', '3');
    
    svg.appendChild(polygon);
    return svg;
}

// Helper function to create SVG for ellipse shape
function createEllipseSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '50');
    ellipse.setAttribute('cy', '50');
    ellipse.setAttribute('rx', '47'); // Horizontal radius (wider)
    ellipse.setAttribute('ry', '30'); // Vertical radius (shorter)
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', '#2C2C2C');
    ellipse.setAttribute('stroke-width', '3');
    
    svg.appendChild(ellipse);
    return svg;
}

// Helper function to create SVG for pentagon shape
function createPentagonSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    // 5-sided pentagon coordinates
    const points = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2 / 5) - Math.PI / 2; // Start from top
        const x = 50 + Math.cos(angle) * 45;
        const y = 50 + Math.sin(angle) * 45;
        points.push(`${x},${y}`);
    }
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'none');
    polygon.setAttribute('stroke', '#2C2C2C');
    polygon.setAttribute('stroke-width', '3');
    
    svg.appendChild(polygon);
    return svg;
}

// Helper function to get a random velocity direction (positive or negative) with given speed
function getRandomVelocity(speed) {
    return Math.random() > 0.5 ? speed : -speed;
}

// Helper function to get shape type name from index
function getShapeTypeName(index) {
    return SHAPE_COLOR_CYCLE[index % SHAPE_COLOR_CYCLE.length];
}

// Apply fill color to a shape (handles both CSS-based and SVG-based shapes)
function applyShapeColor(shapeData, color) {
    const element = shapeData.element;
    const shapeType = getShapeTypeName(shapeData.shapeTypeIndex);
    
    // CSS-based shapes (circle, square) - use backgroundColor
    if (shapeType === 'circle' || shapeType === 'square') {
        element.style.backgroundColor = color;
    }
    // SVG-based shapes (triangle, star, ellipse, pentagon) - update SVG fill attribute
    else {
        const svg = element.querySelector('svg');
        if (svg) {
            // Triangle and star use polygon, ellipse uses ellipse element, pentagon uses polygon
            const fillElement = svg.querySelector('polygon, ellipse');
            if (fillElement) {
                fillElement.setAttribute('fill', color);
            }
        }
    }
}

// Create a shape element with the given type
function createShapeElement(shapeTypeIndex) {
    const shapeType = getShapeTypeName(shapeTypeIndex);
    const shape = document.createElement('div');
    
    // Add base class and shape-specific class
    shape.className = `shape-color-shape shape-color-${shapeType}`;
    
    // Add SVG content for SVG-based shapes
    if (shapeType === 'triangle') {
        shape.appendChild(createTriangleSVG());
    } else if (shapeType === 'star') {
        shape.appendChild(createStarSVG());
    } else if (shapeType === 'ellipse') {
        shape.appendChild(createEllipseSVG());
    } else if (shapeType === 'pentagon') {
        shape.appendChild(createPentagonSVG());
    }
    
    return shape;
}

// Initialize Shape + Color bouncing shapes
function initializeShapeColorSquares() {
    shapeColorContainer = document.getElementById('shape-color-container');
    if (!shapeColorContainer) {
        console.error('Shape + Color container not found');
        return;
    }
    
    // Only initialize once
    if (shapeColorInitialized) {
        return;
    }
    
    // Clear any existing shapes
    shapeColorContainer.innerHTML = '';
    shapeColorShapes = [];
    
    // Get container dimensions
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Create one of each shape type with specific size and speed
    SHAPE_COLOR_CYCLE.forEach((shapeType, index) => {
        const config = SHAPE_COLOR_CONFIG[shapeType];
        const shapeSize = SHAPE_COLOR_BASE_SIZE * config.sizeMultiplier;
        const halfSize = shapeSize / 2;
        const speed = config.speed;
        
        // Create the shape element
        const shape = createShapeElement(index);
        
        // Set the shape's size
        shape.style.width = `${shapeSize}px`;
        shape.style.height = `${shapeSize}px`;
        
        // Random position (within container bounds, avoiding edges)
        const x = halfSize + Math.random() * (containerWidth - shapeSize);
        const y = halfSize + Math.random() * (containerHeight - shapeSize);
        
        // Random velocity direction with shape-specific speed
        const vx = getRandomVelocity(speed);
        const vy = getRandomVelocity(speed);
        
        // Position shape
        shape.style.left = '0';
        shape.style.top = '0';
        shape.style.transform = `translate(${x - halfSize}px, ${y - halfSize}px)`;
        
        shapeColorContainer.appendChild(shape);
        
        // Store shape data with velocity, size, and flash timing
        shapeColorShapes.push({
            element: shape,
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            shapeTypeIndex: index,
            shapeSize: shapeSize,
            colorFlashTime: 0 // 0 means no flash active
        });
    });
    
    shapeColorInitialized = true;
    shapeColorLastTime = performance.now();
    
    // Set up drag event listeners
    setupShapeDragHandlers();
    
    // Start animation loop
    startShapeColorAnimation();
}

// Set up drag and throw handlers for shapes
function setupShapeDragHandlers() {
    if (!shapeColorContainer) return;
    
    // Mouse events
    shapeColorContainer.addEventListener('mousedown', handleShapeDragStart);
    document.addEventListener('mousemove', handleShapeDragMove);
    document.addEventListener('mouseup', handleShapeDragEnd);
    
    // Touch events
    shapeColorContainer.addEventListener('touchstart', handleShapeTouchStart, { passive: false });
    document.addEventListener('touchmove', handleShapeTouchMove, { passive: false });
    document.addEventListener('touchend', handleShapeTouchEnd);
}

// Find which shape was clicked/touched
function findShapeAtPoint(clientX, clientY) {
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const x = clientX - containerRect.left;
    const y = clientY - containerRect.top;
    
    // Check shapes in reverse order (top shapes first)
    for (let i = shapeColorShapes.length - 1; i >= 0; i--) {
        const shape = shapeColorShapes[i];
        const halfSize = shape.shapeSize / 2;
        
        if (x >= shape.x - halfSize && x <= shape.x + halfSize &&
            y >= shape.y - halfSize && y <= shape.y + halfSize) {
            return shape;
        }
    }
    return null;
}

// Mouse drag start
function handleShapeDragStart(e) {
    const shape = findShapeAtPoint(e.clientX, e.clientY);
    if (!shape) return;
    
    e.preventDefault();
    startDragging(shape, e.clientX, e.clientY);
}

// Touch drag start
function handleShapeTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const shape = findShapeAtPoint(touch.clientX, touch.clientY);
    if (!shape) return;
    
    e.preventDefault();
    startDragging(shape, touch.clientX, touch.clientY);
}

// Start dragging a shape
function startDragging(shape, clientX, clientY) {
    draggedShape = shape;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const mouseX = clientX - containerRect.left;
    const mouseY = clientY - containerRect.top;
    
    // Calculate offset from shape center
    dragOffsetX = mouseX - shape.x;
    dragOffsetY = mouseY - shape.y;
    
    // Initialize velocity tracking
    dragLastX = clientX;
    dragLastY = clientY;
    dragLastTime = performance.now();
    dragVelocityX = 0;
    dragVelocityY = 0;
    
    // Stop shape's current movement
    shape.vx = 0;
    shape.vy = 0;
    
    // Add dragging class
    shape.element.classList.add('dragging');
}

// Mouse drag move
function handleShapeDragMove(e) {
    if (!draggedShape) return;
    
    e.preventDefault();
    updateDragging(e.clientX, e.clientY);
}

// Touch drag move
function handleShapeTouchMove(e) {
    if (!draggedShape || !e.touches || e.touches.length === 0) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    updateDragging(touch.clientX, touch.clientY);
}

// Update dragging position and calculate velocity
function updateDragging(clientX, clientY) {
    if (!draggedShape || !shapeColorContainer) return;
    
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const mouseX = clientX - containerRect.left;
    const mouseY = clientY - containerRect.top;
    
    // Calculate velocity based on movement
    const currentTime = performance.now();
    const dt = currentTime - dragLastTime;
    
    if (dt > 0) {
        // Smooth velocity calculation
        const instantVx = (clientX - dragLastX) / dt * 16; // Normalize to ~60fps
        const instantVy = (clientY - dragLastY) / dt * 16;
        
        // Smooth with previous velocity
        dragVelocityX = dragVelocityX * 0.5 + instantVx * 0.5;
        dragVelocityY = dragVelocityY * 0.5 + instantVy * 0.5;
    }
    
    dragLastX = clientX;
    dragLastY = clientY;
    dragLastTime = currentTime;
    
    // Update shape position (apply offset so shape doesn't jump to cursor)
    const halfSize = draggedShape.shapeSize / 2;
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Constrain to container
    draggedShape.x = Math.max(halfSize, Math.min(containerWidth - halfSize, mouseX - dragOffsetX));
    draggedShape.y = Math.max(halfSize, Math.min(containerHeight - halfSize, mouseY - dragOffsetY));
    
    // Update DOM position
    draggedShape.element.style.transform = `translate(${draggedShape.x - halfSize}px, ${draggedShape.y - halfSize}px)`;
}

// Mouse drag end
function handleShapeDragEnd(e) {
    if (!draggedShape) return;
    endDragging();
}

// Touch drag end
function handleShapeTouchEnd(e) {
    if (!draggedShape) return;
    endDragging();
}

// End dragging and apply throw velocity
function endDragging() {
    if (!draggedShape) return;
    
    // Apply throw velocity (clamped to reasonable range)
    const maxVelocity = 15;
    draggedShape.vx = Math.max(-maxVelocity, Math.min(maxVelocity, dragVelocityX));
    draggedShape.vy = Math.max(-maxVelocity, Math.min(maxVelocity, dragVelocityY));
    
    // Remove dragging class
    draggedShape.element.classList.remove('dragging');
    
    // Clear drag state
    draggedShape = null;
}

// Transform shape to next type in cycle and trigger color flash
function transformShapeToNext(shapeData) {
    // Move to next shape in cycle
    shapeData.shapeTypeIndex = (shapeData.shapeTypeIndex + 1) % SHAPE_COLOR_CYCLE.length;
    const newShapeType = getShapeTypeName(shapeData.shapeTypeIndex);
    
    // Update element class
    const oldElement = shapeData.element;
    
    // Remove old shape-specific class
    SHAPE_COLOR_CYCLE.forEach(type => {
        oldElement.classList.remove(`shape-color-${type}`);
    });
    
    // Add new shape-specific class
    oldElement.classList.add(`shape-color-${newShapeType}`);
    
    // Clear old SVG content and add new if needed
    oldElement.innerHTML = '';
    
    if (newShapeType === 'triangle') {
        oldElement.appendChild(createTriangleSVG());
    } else if (newShapeType === 'star') {
        oldElement.appendChild(createStarSVG());
    } else if (newShapeType === 'ellipse') {
        oldElement.appendChild(createEllipseSVG());
    } else if (newShapeType === 'pentagon') {
        oldElement.appendChild(createPentagonSVG());
    }
    
    // Trigger color flash
    shapeData.colorFlashTime = performance.now();
    
    // Apply the shape's color immediately
    const color = SHAPE_COLOR_FILL_COLORS[newShapeType];
    applyShapeColor(shapeData, color);
}

// Trigger color flash for a shape (without changing shape type)
function flashShapeColor(shapeData) {
    const shapeType = getShapeTypeName(shapeData.shapeTypeIndex);
    shapeData.colorFlashTime = performance.now();
    const color = SHAPE_COLOR_FILL_COLORS[shapeType];
    applyShapeColor(shapeData, color);
}

// Animation loop - updates bouncing shape positions
function updateShapeColorSquares() {
    if (!shapeColorContainer) return;
    
    const currentTime = performance.now();
    const containerRect = shapeColorContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    shapeColorShapes.forEach(shapeData => {
        // Skip shape if it's being dragged
        if (shapeData === draggedShape) return;
        
        // Use shape-specific size
        const halfSize = shapeData.shapeSize / 2;
        
        // Update position based on velocity
        shapeData.x += shapeData.vx;
        shapeData.y += shapeData.vy;
        
        // Check for wall collisions and bounce
        let hitWall = false;
        
        // Left wall
        if (shapeData.x - halfSize <= 0) {
            shapeData.x = halfSize;
            shapeData.vx = Math.abs(shapeData.vx); // Reverse to positive
            hitWall = true;
        }
        // Right wall
        else if (shapeData.x + halfSize >= containerWidth) {
            shapeData.x = containerWidth - halfSize;
            shapeData.vx = -Math.abs(shapeData.vx); // Reverse to negative
            hitWall = true;
        }
        
        // Top wall
        if (shapeData.y - halfSize <= 0) {
            shapeData.y = halfSize;
            shapeData.vy = Math.abs(shapeData.vy); // Reverse to positive
            hitWall = true;
        }
        // Bottom wall
        else if (shapeData.y + halfSize >= containerHeight) {
            shapeData.y = containerHeight - halfSize;
            shapeData.vy = -Math.abs(shapeData.vy); // Reverse to negative
            hitWall = true;
        }
        
        // If hit wall, apply damping and flash color
        if (hitWall) {
            // Reduce velocity (shape loses energy on each bounce)
            shapeData.vx *= SHAPE_COLOR_BOUNCE_DAMPING;
            shapeData.vy *= SHAPE_COLOR_BOUNCE_DAMPING;
            
            flashShapeColor(shapeData);
        }
        
        // Handle color flash timeout - return to white after flash duration
        if (shapeData.colorFlashTime > 0) {
            const elapsed = currentTime - shapeData.colorFlashTime;
            if (elapsed >= SHAPE_COLOR_FLASH_DURATION) {
                // Flash ended - return to white
                applyShapeColor(shapeData, '#ffffff');
                shapeData.colorFlashTime = 0;
            }
        }
        
        // Update DOM element position
        shapeData.element.style.transform = `translate(${shapeData.x - halfSize}px, ${shapeData.y - halfSize}px)`;
    });
    
    // Continue animation
    shapeColorAnimationId = requestAnimationFrame(updateShapeColorSquares);
}

// Start animation loop
function startShapeColorAnimation() {
    if (shapeColorAnimationId) return; // Already running
    shapeColorAnimationId = requestAnimationFrame(updateShapeColorSquares);
}

// Stop animation loop
function stopShapeColorAnimation() {
    if (shapeColorAnimationId) {
        cancelAnimationFrame(shapeColorAnimationId);
        shapeColorAnimationId = null;
    }
}

// Stub function for backwards compatibility (called during init)
function initializeShapeColorCanvas() {
    // This is now handled by initializeShapeColorSquares
    // Called from main initialization - do nothing here
}

// Update Shape + Color visibility based on current page
// NOTE: Bouncing shapes interaction has been removed from this page.
// The ellipses interaction (from Shape+Shape) is now shown here instead.
// See updateShapeShapeCanvasVisibility for the new logic.
function updateShapeColorCanvasVisibility(pageId) {
    const container = document.getElementById('shape-color-container');
    if (!container) return;
    
    // Always hide - bouncing shapes interaction is no longer used
    container.classList.add('hidden');
    stopShapeColorAnimation();
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
    
    // Update Emotion + Emotion circle visibility
    updateEmotionEmotionCircle(pageId);
    
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
    
    // Update Sound + Number grid visibility
    updateSoundNumberGrid(pageId);
    
    // Update Shape & Number canvas visibility
    updateShapeNumberCanvasVisibility(pageId);
    
    // Update Shape + Shape canvas visibility (ellipses interaction)
    updateShapeShapeCanvasVisibility(pageId);
    
    // Update Shape + Shape circle visibility (concentric rings with black square)
    updateShapeShapeCircle(pageId);
    
    // Update Sound & Shape canvas visibility
    updateSoundShapeCanvasVisibility(pageId);
    
    // Update Sound + Emotion smiley visibility
    updateSoundEmotionVisibility(pageId);
    
    // Update Shape + Emotion circles grid visibility
    updateShapeEmotionVisibility(pageId);
    
    // Update Emotion + Color grid visibility
    updateEmotionColorVisibility(pageId);
    
    // Update Number + Color grid visibility
    updateNumberColorGrid(pageId);
    
    // Also update visibility based on colors (for orange+yellow combination)
    const leftColor = getColorFromIndex(selectedLeftIndex);
    const rightColor = getColorFromIndex(selectedRightIndex);
    updateVisibilityBasedOnColors(leftColor, rightColor);
}

// Function to update the word text based on current parameter combination
// Now populates two separate rectangles: left word and right word
// Also updates text color to match the parameter's color
function updateWordText() {
    const leftWordElement = document.getElementById('word-text-left');
    const rightWordElement = document.getElementById('word-text-right');
    
    // Get the words for the current indices
    const leftWord = colorWords[selectedLeftIndex];
    const rightWord = colorWords[selectedRightIndex];
    
    // Get the colors for each parameter
    const leftColor = colors[selectedLeftIndex];
    const rightColor = colors[selectedRightIndex];
    
    // Helper function to populate a word element with letter spans
    // All letters are uppercase (e.g., "SHAPE", "COLOR")
    // Also sets the text color to match the parameter's color
    function populateWordElement(element, word, textColor) {
        if (!element) return;
        
        // Clear existing content
        element.innerHTML = '';
        
        // Create a span for each character
        for (let i = 0; i < word.length; i++) {
            const span = document.createElement('span');
            // All letters uppercase
            span.textContent = word[i].toUpperCase();
            span.className = 'word-letter';
            // Set the text color to match the parameter's color
            span.style.color = textColor;
            element.appendChild(span);
        }
    }
    
    // Populate left rectangle with left word and its color (e.g., "Shape" in orange)
    populateWordElement(leftWordElement, leftWord, leftColor);
    
    // Populate right rectangle with right word and its color (e.g., "Color" in blue)
    populateWordElement(rightWordElement, rightWord, rightColor);
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

// Only show digits 7, 8, 9 centered on page
const DIGIT_ROW = ["7","8","9"];

// Shape cycling order for hover interaction
const SHAPE_ORDER = ["circle", "square", "triangle", "ellipse", "star", "pentagon"];
let currentShapeIndex = 0;

// Hover state tracking for shape cycling
let isHoveringDigit = false;
let digitHitboxes = []; // Will store {x, y, width, height} for each digit

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
    
    // Mouse tracking for count (X) and size (Y)
    shapeNumberCanvas.addEventListener('mousemove', handleShapeNumberMouseMove);
    shapeNumberCanvas.addEventListener('mouseleave', handleShapeNumberMouseLeave);
    
    // Initial resize
    resizeShapeNumber();
}

// Handle mouse movement over the shape-number canvas
function handleShapeNumberMouseMove(e) {
    if (!shapeNumberContainer) return;
    
    const rect = shapeNumberContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const W = rect.width;
    const H = rect.height;
    
    // Map X position to count (1 to 20)
    // Left edge = 1, right edge = 20
    const countMin = 1;
    const countMax = 20;
    const normalizedX = Math.max(0, Math.min(1, mouseX / W));
    numShapes = Math.round(countMin + normalizedX * (countMax - countMin));
    
    // Map Y position to size (0.2 to 4.0)
    // Top = small (0.2), bottom = large (4.0)
    const sizeMin = 0.2;
    const sizeMax = 4.0;
    const normalizedY = Math.max(0, Math.min(1, mouseY / H));
    shapeSizeFactor = sizeMin + normalizedY * (sizeMax - sizeMin);
    
    // Check if mouse is hovering over any digit for shape cycling
    checkDigitHover(mouseX, mouseY);
    
    // Redraw with new values
    renderShapeNumber();
}

// Handle mouse leaving the canvas
function handleShapeNumberMouseLeave() {
    // Reset hover state when mouse leaves
    isHoveringDigit = false;
}

// Check if mouse is hovering over any digit and cycle shape if entering
function checkDigitHover(mouseX, mouseY) {
    let currentlyOverDigit = false;
    
    for (const hitbox of digitHitboxes) {
        if (mouseX >= hitbox.x && mouseX <= hitbox.x + hitbox.width &&
            mouseY >= hitbox.y && mouseY <= hitbox.y + hitbox.height) {
            currentlyOverDigit = true;
            break;
        }
    }
    
    // If we just entered a digit area (wasn't hovering before, now hovering)
    if (currentlyOverDigit && !isHoveringDigit) {
        // Cycle to next shape
        currentShapeIndex = (currentShapeIndex + 1) % SHAPE_ORDER.length;
        shapeType = SHAPE_ORDER[currentShapeIndex];
    }
    
    isHoveringDigit = currentlyOverDigit;
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
    
    // Clear hitboxes for hover detection
    digitHitboxes = [];
    
    // 3 digits (7, 8, 9) centered on page
    // Increase size by 69% compared to original
    const baseCellW = W / 7.5;
    const cellW = baseCellW * 1.69; // 69% larger (30% increase from 1.30)
    const cellH = H * 0.8; // Use 80% of height for taller digits
    const digitSpacing = 91; // Gap between digits (30% increase from 70)
    
    // Center the single row horizontally: 3 cells + 2 gaps between them
    const totalWidth = 3 * cellW + 2 * digitSpacing;
    const startX = (W - totalWidth) / 2;
    
    // Center vertically, then move up by 70px
    const startY = (H - cellH) / 2 - 70;
    
    // Draw the 3 digits (7, 8, 9) centered
    for (let i = 0; i < DIGIT_ROW.length; i++) {
        const x = startX + i * (cellW + digitSpacing);
        const y = startY;
        
        // Store hitbox for hover detection
        digitHitboxes.push({
            x: x,
            y: y,
            width: cellW,
            height: cellH,
            digit: DIGIT_ROW[i]
        });
        
        drawDigitInCell(DIGIT_ROW[i], x, y, cellW, cellH);
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
    
    const baseSize = boxSize * 0.208; // 30% larger (0.16 * 1.30)
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
// SHAPE + EMOTION CIRCLES GRID
// ==================
// Shape + Emotion interaction: 50 circles (10x5 grid) that repel from mouse cursor

// Configuration
const SHAPE_EMOTION_GRID_COLS = 12;
const SHAPE_EMOTION_GRID_ROWS = 5;
const SHAPE_EMOTION_CIRCLE_SIZE = 110; // Circle diameter in pixels
const SHAPE_EMOTION_REPEL_RADIUS = 150; // Distance at which circles start to repel
const SHAPE_EMOTION_REPEL_STRENGTH = 15; // How strongly circles are pushed away

// State variables for Shape + Emotion circles grid
let shapeEmotionContainer = null;
let shapeEmotionCircles = []; // Array of { element, x, y, baseX, baseY }
let shapeEmotionMouseX = -1000;
let shapeEmotionMouseY = -1000;
let shapeEmotionAnimationId = null;
let shapeEmotionInitialized = false;

// Initialize Shape + Emotion circles grid
function initializeShapeEmotionCircles() {
    shapeEmotionContainer = document.getElementById('shape-emotion-container');
    if (!shapeEmotionContainer) {
        console.error('Shape + Emotion container not found');
        return;
    }
    
    // Only initialize once (circles are created once)
    if (shapeEmotionInitialized) {
        // Just recalculate positions if already initialized
        recalculateShapeEmotionGrid();
        return;
    }
    
    // Clear any existing circles
    shapeEmotionContainer.innerHTML = '';
    shapeEmotionCircles = [];
    
    // Get container dimensions
    const containerRect = shapeEmotionContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate grid spacing to center the grid (shifted 80px up)
    const totalGridWidth = SHAPE_EMOTION_GRID_COLS * SHAPE_EMOTION_CIRCLE_SIZE;
    const totalGridHeight = SHAPE_EMOTION_GRID_ROWS * SHAPE_EMOTION_CIRCLE_SIZE;
    const startX = (containerWidth - totalGridWidth) / 2 + SHAPE_EMOTION_CIRCLE_SIZE / 2;
    const startY = (containerHeight - totalGridHeight) / 2 + SHAPE_EMOTION_CIRCLE_SIZE / 2 - 80;
    
    // Create 50 circles (10 columns x 5 rows)
    for (let row = 0; row < SHAPE_EMOTION_GRID_ROWS; row++) {
        for (let col = 0; col < SHAPE_EMOTION_GRID_COLS; col++) {
            const circle = document.createElement('div');
            circle.className = 'shape-emotion-circle';
            
            // Calculate initial position (center of each grid cell)
            const baseX = startX + col * SHAPE_EMOTION_CIRCLE_SIZE;
            const baseY = startY + row * SHAPE_EMOTION_CIRCLE_SIZE;
            
            // Position circle (using transform for better performance)
            circle.style.left = '0';
            circle.style.top = '0';
            circle.style.transform = `translate(${baseX - SHAPE_EMOTION_CIRCLE_SIZE / 2}px, ${baseY - SHAPE_EMOTION_CIRCLE_SIZE / 2}px)`;
            
            shapeEmotionContainer.appendChild(circle);
            
            // Store circle data
            shapeEmotionCircles.push({
                element: circle,
                x: baseX,
                y: baseY,
                baseX: baseX,
                baseY: baseY
            });
        }
    }
    
    // Set up mouse tracking
    shapeEmotionContainer.addEventListener('mousemove', handleShapeEmotionMouseMove);
    shapeEmotionContainer.addEventListener('mouseleave', handleShapeEmotionMouseLeave);
    
    // Set up touch tracking
    shapeEmotionContainer.addEventListener('touchmove', handleShapeEmotionTouchMove, { passive: false });
    shapeEmotionContainer.addEventListener('touchend', handleShapeEmotionMouseLeave);
    
    // Handle window resize
    window.addEventListener('resize', recalculateShapeEmotionGrid);
    
    shapeEmotionInitialized = true;
    
    // Start animation loop
    startShapeEmotionAnimation();
}

// Recalculate grid positions on resize (but don't reset circle positions)
function recalculateShapeEmotionGrid() {
    if (!shapeEmotionContainer || shapeEmotionCircles.length === 0) return;
    
    const containerRect = shapeEmotionContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate new grid starting position (shifted 80px up)
    const totalGridWidth = SHAPE_EMOTION_GRID_COLS * SHAPE_EMOTION_CIRCLE_SIZE;
    const totalGridHeight = SHAPE_EMOTION_GRID_ROWS * SHAPE_EMOTION_CIRCLE_SIZE;
    const startX = (containerWidth - totalGridWidth) / 2 + SHAPE_EMOTION_CIRCLE_SIZE / 2;
    const startY = (containerHeight - totalGridHeight) / 2 + SHAPE_EMOTION_CIRCLE_SIZE / 2 - 80;
    
    // Update base positions (where circles would return to)
    let index = 0;
    for (let row = 0; row < SHAPE_EMOTION_GRID_ROWS; row++) {
        for (let col = 0; col < SHAPE_EMOTION_GRID_COLS; col++) {
            if (index < shapeEmotionCircles.length) {
                shapeEmotionCircles[index].baseX = startX + col * SHAPE_EMOTION_CIRCLE_SIZE;
                shapeEmotionCircles[index].baseY = startY + row * SHAPE_EMOTION_CIRCLE_SIZE;
                index++;
            }
        }
    }
}

// Mouse move handler
function handleShapeEmotionMouseMove(e) {
    if (!shapeEmotionContainer) return;
    
    const rect = shapeEmotionContainer.getBoundingClientRect();
    shapeEmotionMouseX = e.clientX - rect.left;
    shapeEmotionMouseY = e.clientY - rect.top;
}

// Mouse leave handler
function handleShapeEmotionMouseLeave() {
    shapeEmotionMouseX = -1000;
    shapeEmotionMouseY = -1000;
}

// Touch move handler
function handleShapeEmotionTouchMove(e) {
    e.preventDefault();
    if (!shapeEmotionContainer || !e.touches || e.touches.length === 0) return;
    
    const rect = shapeEmotionContainer.getBoundingClientRect();
    const touch = e.touches[0];
    shapeEmotionMouseX = touch.clientX - rect.left;
    shapeEmotionMouseY = touch.clientY - rect.top;
}

// Animation loop - updates circle positions
function updateShapeEmotionCircles() {
    if (!shapeEmotionContainer) return;
    
    const containerRect = shapeEmotionContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const halfSize = SHAPE_EMOTION_CIRCLE_SIZE / 2;
    
    shapeEmotionCircles.forEach(circleData => {
        // Calculate distance from mouse to circle center
        const dx = circleData.x - shapeEmotionMouseX;
        const dy = circleData.y - shapeEmotionMouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If mouse is close enough, repel the circle
        if (distance < SHAPE_EMOTION_REPEL_RADIUS && distance > 0) {
            // Calculate repulsion force (stronger when closer)
            const force = (SHAPE_EMOTION_REPEL_RADIUS - distance) / SHAPE_EMOTION_REPEL_RADIUS;
            const repelX = (dx / distance) * force * SHAPE_EMOTION_REPEL_STRENGTH;
            const repelY = (dy / distance) * force * SHAPE_EMOTION_REPEL_STRENGTH;
            
            // Update position
            circleData.x += repelX;
            circleData.y += repelY;
            
            // Constrain to container bounds
            circleData.x = Math.max(halfSize, Math.min(containerWidth - halfSize, circleData.x));
            circleData.y = Math.max(halfSize, Math.min(containerHeight - halfSize, circleData.y));
        }
        
        // Update DOM element position
        circleData.element.style.transform = `translate(${circleData.x - halfSize}px, ${circleData.y - halfSize}px)`;
    });
    
    // Continue animation
    shapeEmotionAnimationId = requestAnimationFrame(updateShapeEmotionCircles);
}

// Start animation loop
function startShapeEmotionAnimation() {
    if (shapeEmotionAnimationId) return; // Already running
    shapeEmotionAnimationId = requestAnimationFrame(updateShapeEmotionCircles);
}

// Stop animation loop
function stopShapeEmotionAnimation() {
    if (shapeEmotionAnimationId) {
        cancelAnimationFrame(shapeEmotionAnimationId);
        shapeEmotionAnimationId = null;
    }
}

// Update Shape + Emotion visibility based on current page
function updateShapeEmotionVisibility(pageId) {
    const container = document.getElementById('shape-emotion-container');
    if (!container) return;
    
    // Show for pageId "0-4" or "4-0" (Shape + Emotion)
    const isShapeEmotionPage = pageId === '0-4' || pageId === '4-0';
    
    if (isShapeEmotionPage) {
        container.classList.remove('hidden');
        // Initialize circles after a brief delay to ensure container is visible
        setTimeout(() => {
            if (container && !container.classList.contains('hidden')) {
                initializeShapeEmotionCircles();
                startShapeEmotionAnimation();
            }
        }, 50);
    } else {
        container.classList.add('hidden');
        stopShapeEmotionAnimation();
    }
}

// ========================================
// EMOTION + COLOR GRID INTERACTION
// 3x3 grid of faces that stretch based on
// draggable dividers, with color based on emotion
// ========================================

// State for Emotion + Color grid
let emotionColorContainer = null;
let emotionColorCells = [];
let emotionColorDividersH = [];
let emotionColorDividersV = [];
let emotionColorDragging = null; // { type: 'h' | 'v', index: number }
let emotionColorRowHeights = [1/3, 1/3, 1/3]; // Normalized row heights (sum = 1)
let emotionColorColWidths = [1/3, 1/3, 1/3];  // Normalized column widths (sum = 1)

// Color palettes
const WARM_COLORS = ['#FAB01B', '#EB4781', '#EF4538']; // Yellow, Pink, Red
const COOL_COLORS = ['#293990', '#891951', '#007A6F']; // Blue, Purple, Green

// Update Emotion + Color grid visibility based on current page
function updateEmotionColorVisibility(pageId) {
    emotionColorContainer = document.getElementById('emotion-color-container');
    if (!emotionColorContainer) return;
    
    // Show for pageId "4-5" or "5-4" (Emotion + Color)
    const isEmotionColorPage = pageId === '4-5' || pageId === '5-4';
    
    if (isEmotionColorPage) {
        emotionColorContainer.classList.remove('hidden');
        // Initialize grid after a brief delay to ensure container is visible
        setTimeout(() => {
            if (emotionColorContainer && !emotionColorContainer.classList.contains('hidden')) {
                initializeEmotionColorGrid();
            }
        }, 50);
    } else {
        emotionColorContainer.classList.add('hidden');
    }
}

// Initialize the Emotion + Color grid
function initializeEmotionColorGrid() {
    emotionColorContainer = document.getElementById('emotion-color-container');
    if (!emotionColorContainer) return;
    
    // Get all cells
    emotionColorCells = Array.from(emotionColorContainer.querySelectorAll('.emotion-color-cell'));
    
    // Get dividers
    emotionColorDividersH = Array.from(emotionColorContainer.querySelectorAll('.emotion-color-divider-h'));
    emotionColorDividersV = Array.from(emotionColorContainer.querySelectorAll('.emotion-color-divider-v'));
    
    // Reset to equal distribution
    emotionColorRowHeights = [1/3, 1/3, 1/3];
    emotionColorColWidths = [1/3, 1/3, 1/3];
    
    // Position all elements
    updateEmotionColorLayout();
    
    // Add drag listeners to dividers
    emotionColorDividersH.forEach((divider, index) => {
        divider.addEventListener('mousedown', (e) => startEmotionColorDrag(e, 'h', index));
        divider.addEventListener('touchstart', (e) => startEmotionColorDrag(e, 'h', index), { passive: false });
    });
    
    emotionColorDividersV.forEach((divider, index) => {
        divider.addEventListener('mousedown', (e) => startEmotionColorDrag(e, 'v', index));
        divider.addEventListener('touchstart', (e) => startEmotionColorDrag(e, 'v', index), { passive: false });
    });
    
    // Global mouse/touch move and up listeners
    document.addEventListener('mousemove', handleEmotionColorDrag);
    document.addEventListener('mouseup', endEmotionColorDrag);
    document.addEventListener('touchmove', handleEmotionColorDrag, { passive: false });
    document.addEventListener('touchend', endEmotionColorDrag);
}

// Update the layout of all grid elements based on current row/col sizes
function updateEmotionColorLayout() {
    if (!emotionColorContainer) return;
    
    const containerRect = emotionColorContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate cumulative positions
    let rowTops = [0];
    let cumHeight = 0;
    for (let i = 0; i < emotionColorRowHeights.length; i++) {
        cumHeight += emotionColorRowHeights[i];
        rowTops.push(cumHeight);
    }
    
    let colLefts = [0];
    let cumWidth = 0;
    for (let i = 0; i < emotionColorColWidths.length; i++) {
        cumWidth += emotionColorColWidths[i];
        colLefts.push(cumWidth);
    }
    
    // Position cells
    emotionColorCells.forEach(cell => {
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        
        const top = rowTops[row] * containerHeight;
        const left = colLefts[col] * containerWidth;
        const height = emotionColorRowHeights[row] * containerHeight;
        const width = emotionColorColWidths[col] * containerWidth;
        
        cell.style.top = `${top}px`;
        cell.style.left = `${left}px`;
        cell.style.width = `${width}px`;
        cell.style.height = `${height}px`;
        
        // Update face emotion based on aspect ratio
        updateFaceEmotion(cell, width, height);
    });
    
    // Position horizontal dividers
    emotionColorDividersH.forEach((divider, index) => {
        const top = rowTops[index + 1] * containerHeight - 1.5; // Center on the line
        divider.style.top = `${top}px`;
    });
    
    // Position vertical dividers
    emotionColorDividersV.forEach((divider, index) => {
        const left = colLefts[index + 1] * containerWidth - 1.5; // Center on the line
        divider.style.left = `${left}px`;
    });
}

// Start dragging a divider
function startEmotionColorDrag(e, type, index) {
    e.preventDefault();
    emotionColorDragging = { type, index };
    
    // Add active class to the divider
    if (type === 'h') {
        emotionColorDividersH[index].classList.add('active');
        emotionColorContainer.classList.add('dragging-h');
    } else {
        emotionColorDividersV[index].classList.add('active');
        emotionColorContainer.classList.add('dragging-v');
    }
}

// Handle drag movement
function handleEmotionColorDrag(e) {
    if (!emotionColorDragging || !emotionColorContainer) return;
    
    e.preventDefault();
    
    const containerRect = emotionColorContainer.getBoundingClientRect();
    
    // Get mouse/touch position
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const { type, index } = emotionColorDragging;
    
    if (type === 'h') {
        // Horizontal divider - adjust row heights
        const relativeY = (clientY - containerRect.top) / containerRect.height;
        
        // Calculate new row heights
        // The divider at index N is between row N and row N+1
        // We need to redistribute the heights of row[index] and row[index+1]
        
        // Sum of the two affected rows
        const sumHeight = emotionColorRowHeights[index] + emotionColorRowHeights[index + 1];
        
        // Calculate where the divider should be relative to the start of row[index]
        let cumulativeTop = 0;
        for (let i = 0; i < index; i++) {
            cumulativeTop += emotionColorRowHeights[i];
        }
        
        // New height for row[index]
        let newTopHeight = relativeY - cumulativeTop;
        
        // Clamp to reasonable values (minimum 10% of container)
        const minSize = 0.1;
        newTopHeight = Math.max(minSize, Math.min(sumHeight - minSize, newTopHeight));
        
        emotionColorRowHeights[index] = newTopHeight;
        emotionColorRowHeights[index + 1] = sumHeight - newTopHeight;
        
    } else {
        // Vertical divider - adjust column widths
        const relativeX = (clientX - containerRect.left) / containerRect.width;
        
        // Sum of the two affected columns
        const sumWidth = emotionColorColWidths[index] + emotionColorColWidths[index + 1];
        
        // Calculate where the divider should be relative to the start of col[index]
        let cumulativeLeft = 0;
        for (let i = 0; i < index; i++) {
            cumulativeLeft += emotionColorColWidths[i];
        }
        
        // New width for col[index]
        let newLeftWidth = relativeX - cumulativeLeft;
        
        // Clamp to reasonable values (minimum 10% of container)
        const minSize = 0.1;
        newLeftWidth = Math.max(minSize, Math.min(sumWidth - minSize, newLeftWidth));
        
        emotionColorColWidths[index] = newLeftWidth;
        emotionColorColWidths[index + 1] = sumWidth - newLeftWidth;
    }
    
    // Update layout
    updateEmotionColorLayout();
}

// End dragging
function endEmotionColorDrag() {
    if (!emotionColorDragging) return;
    
    const { type, index } = emotionColorDragging;
    
    // Remove active class
    if (type === 'h') {
        emotionColorDividersH[index].classList.remove('active');
        emotionColorContainer.classList.remove('dragging-h');
    } else {
        emotionColorDividersV[index].classList.remove('active');
        emotionColorContainer.classList.remove('dragging-v');
    }
    
    emotionColorDragging = null;
}

// Update face emotion based on cell aspect ratio relative to container
function updateFaceEmotion(cell, width, height) {
    const face = cell.querySelector('.emotion-color-face');
    if (!face) return;
    
    const mouth = face.querySelector('.face-mouth');
    if (!mouth) return;
    
    // Get container aspect ratio to use as baseline for "neutral"
    const containerRect = emotionColorContainer.getBoundingClientRect();
    const containerAspectRatio = containerRect.width / containerRect.height;
    
    // Calculate cell aspect ratio
    const cellAspectRatio = width / height;
    
    // Neutral baseline: when all cells are equal (1/3 x 1/3), each cell has the same aspect ratio as container
    // So neutral = containerAspectRatio, not 1
    const neutralAspectRatio = containerAspectRatio;
    
    // Emotion level: -1 (very sad) to +1 (very happy)
    // Neutral is when cellAspectRatio = neutralAspectRatio
    let emotionLevel = 0;
    
    // Calculate deviation from neutral
    const deviation = cellAspectRatio / neutralAspectRatio;
    
    if (deviation > 1.05) {
        // Wider than neutral = happier
        emotionLevel = Math.min(1, (deviation - 1) / 1.0);
    } else if (deviation < 0.95) {
        // Taller than neutral = sadder
        emotionLevel = Math.max(-1, (deviation - 1) / 0.5);
    }
    
    // Update mouth curve based on emotion level
    // Neutral: M 30 60 Q 50 60 70 60 (straight line)
    // Happy: M 30 55 Q 50 75 70 55 (smile)
    // Sad: M 30 65 Q 50 50 70 65 (frown)
    
    const mouthY = 60;
    const curveAmount = emotionLevel * 15; // Max 15 units of curve
    
    // For happy: endpoints go up, control point goes down
    // For sad: endpoints go down, control point goes up
    const endpointY = mouthY - curveAmount * 0.3;
    const controlY = mouthY + curveAmount;
    
    const pathD = `M 30 ${endpointY} Q 50 ${controlY} 70 ${endpointY}`;
    mouth.setAttribute('d', pathD);
    
    // Update cell background color based on emotion
    updateCellColor(cell, emotionLevel);
}

// Update face stroke color based on emotion level
function updateCellColor(cell, emotionLevel) {
    let faceColor = '#2C2C2C'; // Default black
    
    // Lower threshold to 0.05 for more sensitive color change
    if (Math.abs(emotionLevel) >= 0.05) {
        // Calculate color intensity (0 to 1)
        const intensity = Math.abs(emotionLevel);
        
        // Choose color palette based on emotion direction
        const colors = emotionLevel > 0 ? WARM_COLORS : COOL_COLORS;
        
        // Pick color based on intensity (more intense = further in array)
        let colorIndex = Math.floor(intensity * colors.length);
        colorIndex = Math.min(colorIndex, colors.length - 1);
        
        faceColor = colors[colorIndex];
    }
    
    // Apply color using CSS custom property - this will cascade to all face elements
    cell.style.setProperty('--face-color', faceColor);
}

// Convert hex color to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Handle window resize for Emotion + Color grid
window.addEventListener('resize', () => {
    if (emotionColorContainer && !emotionColorContainer.classList.contains('hidden')) {
        updateEmotionColorLayout();
    }
});

// Function to update Shape + Shape canvas visibility (ellipses interaction)
// NOTE: Ellipses interaction has been moved from Shape+Shape page to Shape+Color page.
// Shape+Shape page (0-0) is now empty.
function updateShapeShapeCanvasVisibility(pageId) {
    const shapeShapeContainer = document.getElementById('shape-shape-container');
    
    if (!shapeShapeContainer) return;
    
    // Show ellipses for Shape + Color page (0-5 or 5-0) instead of Shape + Shape (0-0)
    // Parameter indices: 0=shape, 5=color
    const isShapeColorPage = pageId === '0-5' || pageId === '5-0';
    
    if (isShapeColorPage) {
        // Show ellipses container on Shape + Color page
        shapeShapeContainer.classList.remove('hidden');
        // Initialize ellipses after a brief delay to ensure container is visible
        setTimeout(() => {
            if (shapeShapeContainer && !shapeShapeContainer.classList.contains('hidden')) {
                // Initialize ellipses when page becomes visible
                initializeShapeEllipses();
            }
        }, 50);
    } else {
        // Hide ellipses container (including for old Shape+Shape page which is now empty)
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

// Initialize shapes interaction (ellipses, triangles, rectangles)
function initializeShapeEllipses() {
    shapeEllipsesContainer = document.getElementById('shape-shape-ellipses');
    if (!shapeEllipsesContainer) return;
    
    // Select the wrapper elements (not the SVG shapes themselves)
    shapeEllipses = Array.from(shapeEllipsesContainer.querySelectorAll('.shape-wrapper'));
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

// Calculate distance from a point to a line segment
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Detect which edge is being clicked (returns edge index 0-5, or -1 if not on edge)
function detectEdge(clientX, clientY) {
    if (!shapeEllipses || shapeEllipses.length !== 7) return -1;
    
    const edgeZone = 20; // Pixels from edge that count as "on edge"
    
    // Check each shape for edge proximity
    for (let i = 0; i < shapeEllipses.length; i++) {
        const wrapper = shapeEllipses[i];
        const rect = wrapper.getBoundingClientRect();
        const shapeType = wrapper.dataset.shape;
        
        // For all shapes, check wrapper edges (works for ellipse, rectangle, pentagon, hexagon)
        // Check right edge of this shape (edge between shape i and i+1)
        if (i < shapeEllipses.length - 1) {
            if (Math.abs(clientX - rect.right) < edgeZone) {
                return i;
            }
        }
        
        // Check left edge of this shape (edge between shape i-1 and i)
        if (i > 0) {
            if (Math.abs(clientX - rect.left) < edgeZone) {
                return i - 1;
            }
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
    // If dragging, handle the drag
    if (isDraggingEllipse) {
        e.preventDefault();
        const deltaX = e.clientX - dragStartX;
        
        // Calculate width change as percentage of container
        const containerWidth = shapeEllipsesContainer.getBoundingClientRect().width;
        const deltaPercent = (deltaX / containerWidth) * 100;
        
        // Apply the change to the two adjacent ellipses
        resizeAdjacentEllipses(dragEdgeIndex, deltaPercent);
        
        // Update start position for next move
        dragStartX = e.clientX;
        return;
    }
    
    // If not dragging, update cursor based on edge proximity
    if (shapeEllipsesContainer) {
        const edgeIndex = detectEdge(e.clientX, e.clientY);
        if (edgeIndex !== -1) {
            shapeEllipsesContainer.style.cursor = 'ew-resize';
        } else {
            shapeEllipsesContainer.style.cursor = 'default';
        }
    }
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
let soundShapeResizeObserver = null;
let soundShapeAnimationId = null;

// Config
const SOUND_SHAPE_SIZE = 40;        // Size of draggable shapes
const SOUND_SHAPE_STAMP_SIZE = 40;  // Size of stamps (trail)
const SOUND_SHAPE_STEP_DIST = 10;   // Distance between stamps (smaller = denser trail)
const SOUND_SHAPE_STROKE_W = 3;     // Stroke weight
const SOUND_SHAPE_EASING = 0.4;     // Smoothing factor (higher = follows mouse faster)
const SOUND_SHAPE_SPACING = 70;     // Vertical spacing between shapes
const SOUND_SHAPE_TYPES = ['circle', 'square', 'triangle', 'ellipse', 'pentagon'];

// Colors
const SOUND_SHAPE_BG_COLOR = '#FFFFFF';
const SOUND_SHAPE_FILL_COLOR = '#FFFFFF';
const SOUND_SHAPE_STROKE_COLOR = '#2C2C2C';

// State
let soundShapePositions = [];       // { x, y, shapeType }
let soundShapeDraggedIndex = -1;    // -1 means no shape is being dragged
let soundShapeDragOffsetX = 0;
let soundShapeDragOffsetY = 0;
let soundShapeLastStampX = 0;       // Last position where we stamped
let soundShapeLastStampY = 0;
let soundShapeRecordedPoints = [];  // { x, y, shape } for playback
let soundShapeIsReplaying = false;
let soundShapeReplayIndex = 0;
let soundShapeActive = false;       // Whether the canvas is active
let soundShapeAutoPlayTimer = null; // Timer for auto-play after 3 seconds of inactivity

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
            shapeType: SOUND_SHAPE_TYPES[i]  // Store shape name instead of index
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
    const multipliers = { circle: 1.0, square: 1.3, triangle: 1.5, ellipse: 1.4, star: 1.2, pentagon: 1.3 };
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
    
    if (shapeType === 'circle') {
        // Circle
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    } else if (shapeType === 'square') {
        // Square
        ctx.rect(x - size / 2, y - size / 2, size, size);
    } else if (shapeType === 'triangle') {
        // Triangle
        const h = size * 0.9;
        ctx.moveTo(x, y - h / 2);
        ctx.lineTo(x - h / 2, y + h / 2);
        ctx.lineTo(x + h / 2, y + h / 2);
        ctx.closePath();
    } else if (shapeType === 'ellipse') {
        // Ellipse
        ctx.ellipse(x, y, size * 0.75, size * 0.45, 0, 0, Math.PI * 2);
    } else if (shapeType === 'star') {
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
    } else if (shapeType === 'pentagon') {
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
    
    // Size multipliers for stamps (should match draggable shape multipliers for consistency)
    const multipliers = { circle: 1.0, square: 1.3, triangle: 1.5, ellipse: 1.4, star: 1.2, pentagon: 1.3 };
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
    
    // Use step distance from constant
    const stepDist = SOUND_SHAPE_STEP_DIST;
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
    
    // Cancel auto-play timer if user starts drawing again
    cancelSoundShapeAutoPlayTimer();
    
    // Stop any ongoing playback
    if (soundShapeIsReplaying) {
        stopSoundShapePlayback();
    }
    
    ensureSoundShapeAudio();
    
    const pos = getSoundShapeMousePos(e);
    const shapeIndex = getSoundShapeAtPosition(pos.x, pos.y);
    
    if (shapeIndex >= 0) {
        soundShapeDraggedIndex = shapeIndex;
        const shape = soundShapePositions[shapeIndex];
        soundShapeDragOffsetX = pos.x - shape.x;
        soundShapeDragOffsetY = pos.y - shape.y;
        
        // Initialize last stamp position to current shape position
        soundShapeLastStampX = shape.x;
        soundShapeLastStampY = shape.y;
        
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
    
    // Calculate distance from LAST STAMP position (not current shape position)
    const stampDx = targetX - soundShapeLastStampX;
    const stampDy = targetY - soundShapeLastStampY;
    const stampDist = Math.sqrt(stampDx * stampDx + stampDy * stampDy);
    
    // Only stamp when we've moved at least STEP_DIST from the last stamp
    if (stampDist >= SOUND_SHAPE_STEP_DIST) {
        const containerRect = soundShapeContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        // Stamp single shape at current position
        drawSoundShapeStamp(targetX, targetY, shape.shapeType);
        drawSoundShapeStamp(w - targetX, targetY, shape.shapeType);
        
        // Record for playback (with timestamp for real-time playback)
        soundShapeRecordedPoints.push({ x: targetX, y: targetY, shape: shape.shapeType, time: performance.now() });
        
        // Trigger sound
        triggerSoundShapeSound(targetX, targetY, shape.shapeType);
        
        // Update last stamp position
        soundShapeLastStampX = targetX;
        soundShapeLastStampY = targetY;
    }
    
    // Update position
    shape.x = targetX;
    shape.y = targetY;
    
    // Redraw
    renderSoundShapeFrame();
}

function handleSoundShapeMouseUp(e) {
    if (soundShapeDraggedIndex >= 0) {
        // Start auto-play timer (3 seconds after user stops drawing)
        startSoundShapeAutoPlayTimer();
    }
    soundShapeDraggedIndex = -1;
}

// Touch event handlers
function handleSoundShapeTouchStart(e) {
    e.preventDefault();
    if (!soundShapeActive) return;
    
    // Cancel auto-play timer if user starts drawing again
    cancelSoundShapeAutoPlayTimer();
    
    // Stop any ongoing playback
    if (soundShapeIsReplaying) {
        stopSoundShapePlayback();
    }
    
    ensureSoundShapeAudio();
    
    const pos = getSoundShapeTouchPos(e);
    const shapeIndex = getSoundShapeAtPosition(pos.x, pos.y);
    
    if (shapeIndex >= 0) {
        soundShapeDraggedIndex = shapeIndex;
        const shape = soundShapePositions[shapeIndex];
        soundShapeDragOffsetX = pos.x - shape.x;
        soundShapeDragOffsetY = pos.y - shape.y;
        
        // Initialize last stamp position to current shape position
        soundShapeLastStampX = shape.x;
        soundShapeLastStampY = shape.y;
        
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
    
    // Calculate distance from LAST STAMP position (not current shape position)
    const stampDx = targetX - soundShapeLastStampX;
    const stampDy = targetY - soundShapeLastStampY;
    const stampDist = Math.sqrt(stampDx * stampDx + stampDy * stampDy);
    
    // Only stamp when we've moved at least STEP_DIST from the last stamp
    if (stampDist >= SOUND_SHAPE_STEP_DIST) {
        const containerRect = soundShapeContainer.getBoundingClientRect();
        const w = containerRect.width;
        
        // Stamp single shape at current position
        drawSoundShapeStamp(targetX, targetY, shape.shapeType);
        drawSoundShapeStamp(w - targetX, targetY, shape.shapeType);
        
        // Record for playback (with timestamp for real-time playback)
        soundShapeRecordedPoints.push({ x: targetX, y: targetY, shape: shape.shapeType, time: performance.now() });
        
        // Trigger sound
        triggerSoundShapeSound(targetX, targetY, shape.shapeType);
        
        // Update last stamp position
        soundShapeLastStampX = targetX;
        soundShapeLastStampY = targetY;
    }
    
    shape.x = targetX;
    shape.y = targetY;
    
    renderSoundShapeFrame();
}

function handleSoundShapeTouchEnd(e) {
    e.preventDefault();
    if (soundShapeDraggedIndex >= 0) {
        // Start auto-play timer (3 seconds after user stops drawing)
        startSoundShapeAutoPlayTimer();
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
    if (now - soundShapeLastSoundTime < 91) return;  // 70 * 1.3 = 91 (30% slower)
    soundShapeLastSoundTime = now;
    
    ensureSoundShapeAudio();
    if (!soundShapeAudioCtx || soundShapeAudioCtx.state !== 'running') return;
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const h = containerRect.height;
    
    // Pitch based on Y position
    const normalizedY = 1 - (y / h); // 0 at bottom, 1 at top
    const midiNote = Math.floor(48 + normalizedY * 36); // MIDI 48-84
    let freq = midiToFreqSoundShape(midiNote);
    
    // Shape-specific sound parameters (all timing values increased by 30%)
    let oscType = 'sine';
    let amp = 0.30;
    let dur = 0.182;       // 0.14 * 1.3
    let attackTime = 0.013; // 0.01 * 1.3
    let decayTime = 0.169;  // 0.13 * 1.3
    let filterFreq = null;
    
    if (shapeType === 'circle') {
        // Circle - soft sine wave
        oscType = 'sine';
        freq = freq * 0.85;
        amp = 0.50;
        dur = 0.26;         // 0.20 * 1.3
        attackTime = 0.026;  // 0.02 * 1.3
        decayTime = 0.234;   // 0.18 * 1.3
    } else if (shapeType === 'square') {
        // Square - sharp square wave
        oscType = 'square';
        freq = freq * 1.15;
        amp = 0.45;
        dur = 0.104;         // 0.08 * 1.3
        attackTime = 0.0065; // 0.005 * 1.3
        decayTime = 0.0975;  // 0.075 * 1.3
    } else if (shapeType === 'triangle') {
        // Triangle - triangle wave
        oscType = 'triangle';
        freq = freq * 1.25;
        amp = 0.32;
        dur = 0.195;        // 0.15 * 1.3
        attackTime = 0.013; // 0.01 * 1.3
        decayTime = 0.182;  // 0.14 * 1.3
    } else if (shapeType === 'ellipse') {
        // Ellipse - filtered sine wave
        oscType = 'sine';
        freq = freq * 0.75;
        amp = 0.55;
        dur = 0.325;        // 0.25 * 1.3
        attackTime = 0.039; // 0.03 * 1.3
        decayTime = 0.286;  // 0.22 * 1.3
        filterFreq = freq * 0.5;
    } else if (shapeType === 'star') {
        // Star - sawtooth wave
        oscType = 'sawtooth';
        freq = freq * 1.35;
        amp = 0.50;
        dur = 0.078;         // 0.06 * 1.3
        attackTime = 0.0026; // 0.002 * 1.3
        decayTime = 0.0754;  // 0.058 * 1.3
    } else if (shapeType === 'pentagon') {
        // Pentagon - filtered square wave
        oscType = 'square';
        freq = freq * 0.95;
        amp = 0.48;
        dur = 0.156;         // 0.12 * 1.3
        attackTime = 0.0104; // 0.008 * 1.3
        decayTime = 0.1456;  // 0.112 * 1.3
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
        filter.type = shapeType === 'ellipse' ? 'lowpass' : 'highpass';
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

// Auto-play timer functions
function cancelSoundShapeAutoPlayTimer() {
    if (soundShapeAutoPlayTimer) {
        clearTimeout(soundShapeAutoPlayTimer);
        soundShapeAutoPlayTimer = null;
    }
}

function startSoundShapeAutoPlayTimer() {
    // Cancel any existing timer first
    cancelSoundShapeAutoPlayTimer();
    
    // Only start timer if there are recorded points to play
    if (soundShapeRecordedPoints.length === 0) return;
    
    // Start 3-second timer for auto-play
    soundShapeAutoPlayTimer = setTimeout(() => {
        autoPlaySoundShape();
    }, 3000);
}

function stopSoundShapePlayback() {
    soundShapeIsReplaying = false;
    if (soundShapeAnimationId) {
        clearTimeout(soundShapeAnimationId);
        soundShapeAnimationId = null;
    }
}

function autoPlaySoundShape() {
    // Don't auto-play if already replaying or no points recorded
    if (soundShapeIsReplaying || soundShapeRecordedPoints.length === 0) return;
    
    ensureSoundShapeAudio();
    
    clearSoundShapeBrushLayer();
    soundShapeReplayIndex = 0;
    soundShapeLastSoundTime = 0;
    soundShapeIsReplaying = true;
    
    // Use the one-shot replay function (plays once, doesn't loop)
    replaySoundShapeDrawingOnce();
}

// One-shot replay function (plays once, then stops - used for auto-play)
function replaySoundShapeDrawingOnce() {
    if (!soundShapeIsReplaying || !soundShapeActive) {
        soundShapeIsReplaying = false;
        return;
    }
    
    const point = soundShapeRecordedPoints[soundShapeReplayIndex];
    
    if (!point) {
        // End of playback - stop (no looping)
        soundShapeIsReplaying = false;
        soundShapeReplayIndex = 0;
        return;
    }
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const w = containerRect.width;
    
    // Draw stamp and its mirror
    drawSoundShapeStamp(point.x, point.y, point.shape);
    drawSoundShapeStamp(w - point.x, point.y, point.shape);
    
    // Play sound
    triggerSoundShapeSound(point.x, point.y, point.shape);
    
    renderSoundShapeFrame();
    
    soundShapeReplayIndex++;
    
    // Fixed moderate playback speed: 8ms between each point
    soundShapeAnimationId = setTimeout(replaySoundShapeDrawingOnce, 8);
}

// Playback functions (for manual play button - kept for backwards compatibility)
function handleSoundShapePlayClick() {
    if (soundShapeIsReplaying) {
        // Stop playback
        stopSoundShapePlayback();
    } else {
        // Start playback
        if (soundShapeRecordedPoints.length === 0) return;
        
        ensureSoundShapeAudio();
        
        clearSoundShapeBrushLayer();
        soundShapeReplayIndex = 0;
        soundShapeLastSoundTime = 0;
        soundShapeIsReplaying = true;
        
        replaySoundShapeDrawing();
    }
}

function replaySoundShapeDrawing() {
    if (!soundShapeIsReplaying || !soundShapeActive) {
        soundShapeIsReplaying = false;
        return;
    }
    
    const point = soundShapeRecordedPoints[soundShapeReplayIndex];
    
    if (!point) {
        // Loop: restart from beginning
        soundShapeReplayIndex = 0;
        clearSoundShapeBrushLayer();
        // Small delay before restarting loop
        soundShapeAnimationId = setTimeout(replaySoundShapeDrawing, 500);
        return;
    }
    
    const containerRect = soundShapeContainer.getBoundingClientRect();
    const w = containerRect.width;
    
    // Draw stamp and its mirror
    drawSoundShapeStamp(point.x, point.y, point.shape);
    drawSoundShapeStamp(w - point.x, point.y, point.shape);
    
    // Play sound
    triggerSoundShapeSound(point.x, point.y, point.shape);
    
    renderSoundShapeFrame();
    
    soundShapeReplayIndex++;
    
    // Fixed moderate playback speed: 8ms between each point
    soundShapeAnimationId = setTimeout(replaySoundShapeDrawing, 8);
}

// Reset canvas
function resetSoundShapeCanvas() {
    // Clear saved state
    const pageId = getCurrentSoundShapePageId();
    if (pageId && soundShapeStateStorage[pageId]) {
        delete soundShapeStateStorage[pageId];
    }
    
    // Cancel auto-play timer
    cancelSoundShapeAutoPlayTimer();
    
    // Clear visual
    clearSoundShapeBrushLayer();
    soundShapeRecordedPoints = [];
    soundShapeIsReplaying = false;
    soundShapeReplayIndex = 0;
    soundShapeDraggedIndex = -1;
    
    if (soundShapeAnimationId) {
        clearTimeout(soundShapeAnimationId);
        soundShapeAnimationId = null;
    }
    
    // Reinitialize shape positions
    initializeSoundShapePositions();
    
    // Redraw
    renderSoundShapeFrame();
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
                clearTimeout(soundShapeAnimationId);
                soundShapeAnimationId = null;
            }
        }
        
        // Cancel auto-play timer
        cancelSoundShapeAutoPlayTimer();
        
        // Resize and start fresh (no restore - canvas always starts clean)
        setTimeout(() => {
            resizeSoundShapeCanvas();
            renderSoundShapeFrame();
        }, 50);
    } else {
        // Clear canvas when leaving the page (instead of saving state)
        if (soundShapeActive) {
            // Clear all drawing data
            clearSoundShapeBrushLayer();
            soundShapeRecordedPoints = [];
            initializeSoundShapePositions();
        }
        
        soundShapeContainer.classList.add('hidden');
        soundShapeActive = false;
        
        // Stop replay
        if (soundShapeIsReplaying) {
            soundShapeIsReplaying = false;
            if (soundShapeAnimationId) {
                clearTimeout(soundShapeAnimationId);
                soundShapeAnimationId = null;
            }
        }
        
        // Cancel auto-play timer
        cancelSoundShapeAutoPlayTimer();
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
    soundEmotionContainer = document.getElementById('sound-emotion-container');
    smileyFace = document.getElementById('smiley-face');
    smileyEyeLeft = document.getElementById('smiley-eye-left');
    smileyEyeRight = document.getElementById('smiley-eye-right');
    smileyMouth = document.getElementById('smiley-mouth');
    
    if (!soundEmotionSmiley) return;
    
    // Remove old listeners to prevent duplicates
    soundEmotionSmiley.removeEventListener('mousemove', handleSoundEmotionMouseMove);
    soundEmotionSmiley.removeEventListener('mouseenter', handleSoundEmotionMouseEnter);
    soundEmotionSmiley.removeEventListener('mouseleave', handleSoundEmotionMouseLeave);
    
    // Add mouse event listeners on the smiley SVG itself (not the container)
    soundEmotionSmiley.addEventListener('mousemove', handleSoundEmotionMouseMove);
    soundEmotionSmiley.addEventListener('mouseenter', handleSoundEmotionMouseEnter);
    soundEmotionSmiley.addEventListener('mouseleave', handleSoundEmotionMouseLeave);
    
    // Initial render
    resizeSoundEmotionSmiley();
}

// Track if mouse is currently in mouth area
let isInMouthArea = false;

// Handle mouse entering the smiley
function handleSoundEmotionMouseEnter(e) {
    // Check if in mouth area and handle accordingly
    handleSoundEmotionMouseMove(e);
}

// Handle mouse leaving the smiley (stop sound)
function handleSoundEmotionMouseLeave() {
    isInMouthArea = false;
    stopSoundEmotionTone();
    // Reset smiley to neutral position
    updateSmileyMouth(0);
}

// Handle mouse movement (update smiley and sound only in mouth area)
function handleSoundEmotionMouseMove(e) {
    if (!soundEmotionSmiley) return;
    
    // Check if mouse Y is within mouth area
    const inMouthArea = isMouseInMouthArea(e);
    
    if (inMouthArea) {
        const value = calculateMouseXValue(e);
        updateSmileyMouth(value);
        startSoundEmotionTone(value);
        isInMouthArea = true;
    } else {
        // Mouse left mouth area - stop sound and reset
        if (isInMouthArea) {
            stopSoundEmotionTone();
            updateSmileyMouth(0);
            isInMouthArea = false;
        }
    }
}

// Check if mouse Y position is within the mouth area
function isMouseInMouthArea(e) {
    if (!soundEmotionSmiley) return false;
    
    const smileyRect = soundEmotionSmiley.getBoundingClientRect();
    const mouseY = e.clientY - smileyRect.top;
    const smileyHeight = smileyRect.height;
    const smileyWidth = smileyRect.width;
    
    // Calculate mouth Y position (same formula as in updateSmileyMouth)
    // Mouth is at ellipseCy + ellipseRy * 0.25
    const ellipseCy = smileyHeight / 2;
    const ellipseRy = (smileyHeight / 2) - 15; // Same padding as in resizeSoundEmotionSmiley
    const mouthY = ellipseCy + ellipseRy * 0.25;
    
    // Define mouth area as a horizontal strip (with some tolerance for interaction)
    // The mouth curve can go up/down by maxCurve = ellipseRy * 0.85
    const mouthAreaHeight = ellipseRy * 0.5; // Generous tolerance for the mouth area
    const mouthTop = mouthY - mouthAreaHeight;
    const mouthBottom = mouthY + mouthAreaHeight;
    
    return mouseY >= mouthTop && mouseY <= mouthBottom;
}

// Calculate value (-100 to 100) based on mouse X position within smiley
// Left edge = -100 (sad), Right edge = 100 (happy)
function calculateMouseXValue(e) {
    if (!soundEmotionSmiley) return 0;
    
    const smileyRect = soundEmotionSmiley.getBoundingClientRect();
    const mouseX = e.clientX - smileyRect.left;
    const smileyWidth = smileyRect.width;
    
    // Map mouseX (0 to smileyWidth) to value (-100 to 100)
    // Left edge = -100, Center = 0, Right edge = 100
    const normalizedX = mouseX / smileyWidth; // 0 to 1
    const value = (normalizedX * 200) - 100; // -100 to 100
    
    // Clamp value to valid range
    return Math.max(-100, Math.min(100, Math.round(value)));
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
    const ellipseRx = (width / 2) - 15; // Padding for stroke (stroke-width is 25px, extends 12.5px each side)
    const ellipseRy = (height / 2) - 15; // Padding for stroke
    
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
    
    // Initialize mouth and eyes with neutral position (0)
    // Mouse movement will update this dynamically
    updateSmileyMouth(0);
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
    // Credits text box has been removed - this function is now empty
    // Hover behavior is handled in initializeColorKeyClickEffect for unified overlay control
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

// Function to initialize logo hover effect - expands all scrollbar color items and pushes UI rectangles inward when hovering on logo
// Overlay stays open when moving from logo to overlay, and logo maintains hover state while overlay is open
// Also handles the credits text box visibility (syn-overlay)
function initializeColorKeyClickEffect() {
    const logoElement = document.querySelector('.black-rectangle-logo');
    
    if (!logoElement) return;
    
    // Get the about page overlay (now shown when hovering logo - swapped behavior)
    const logoHoverOverlay = document.getElementById('about-page-overlay');
    
    // Get canvas text box element
    const canvasTextBox = document.getElementById('canvas-text-box');
    
    // Get parameter rectangles for slide-out effect (same as Index and About)
    const paramRectLeft = document.querySelector('.black-bottom-rectangle-left');
    const paramRectRight = document.querySelector('.black-bottom-rectangle-right');
    
    // Flag to track if line backgrounds have been created for logo hover text box
    let logoHoverBackgroundsCreated = false;
    
    // Track if overlay is currently open
    let overlayIsOpen = false;
    
    // Helper function to open overlay (legend expansion moved to About hover)
    const openOverlay = () => {
        overlayIsOpen = true;
        
        // Show the logo hover overlay (10% black + blur on canvas area)
        if (logoHoverOverlay) logoHoverOverlay.classList.add('visible');
        
        // Add logo-active class to maintain hover appearance while overlay is open
        logoElement.classList.add('logo-active');
        
        // Hide canvas text box during logo hover
        if (canvasTextBox) canvasTextBox.classList.add('syn-hovered');
        
        // Slide out parameter rectangles (same behavior as Index and About)
        if (paramRectLeft) paramRectLeft.classList.add('about-hovered');
        if (paramRectRight) paramRectRight.classList.add('about-hovered');
        
        // Create line backgrounds for about text box on first hover (swapped to about overlay)
        // Uses setTimeout to wait for overlay visibility for accurate measurements
        if (!logoHoverBackgroundsCreated) {
            setTimeout(() => {
                initializeLineBackgroundsForTextBox('about-text-box-1');
                logoHoverBackgroundsCreated = true;
            }, 50);
        }
    };
    
    // Helper function to close overlay (legend collapse moved to About hover)
    const closeOverlay = () => {
        overlayIsOpen = false;
        
        // Hide the logo hover overlay
        if (logoHoverOverlay) logoHoverOverlay.classList.remove('visible');
        
        // Remove logo-active class to restore normal logo appearance
        logoElement.classList.remove('logo-active');
        
        // Show canvas text box again
        if (canvasTextBox) canvasTextBox.classList.remove('syn-hovered');
        
        // Slide in parameter rectangles back to original position
        if (paramRectLeft) paramRectLeft.classList.remove('about-hovered');
        if (paramRectRight) paramRectRight.classList.remove('about-hovered');
    };
    
    // Logo: open overlay on hover
    logoElement.addEventListener('mouseenter', () => {
        if (!overlayIsOpen) {
            openOverlay();
        }
    });
    
    // Logo: when leaving logo, close only if NOT moving to overlay
    logoElement.addEventListener('mouseleave', (e) => {
        // If moving to overlay, keep open state
        if (logoHoverOverlay && logoHoverOverlay.contains(e.relatedTarget)) {
            return;
        }
        // Leaving to somewhere else while open - close
        if (overlayIsOpen) {
            closeOverlay();
        }
    });
    
    // Overlay: keep open when hovering over it
    if (logoHoverOverlay) {
        logoHoverOverlay.addEventListener('mouseenter', () => {
            // Keep open state - logo-active class already applied
        });
        
        // Overlay: when leaving overlay, close unless going to logo
        logoHoverOverlay.addEventListener('mouseleave', (e) => {
            // If moving to logo, keep open state
            if (logoElement.contains(e.relatedTarget)) {
                return;
            }
            // Leaving to somewhere else - close
            if (overlayIsOpen) {
                closeOverlay();
            }
        });
    }
    
}

// Function to initialize line backgrounds for about page text boxes
// Creates gray background blocks behind each line of text, aligned to the right edge
function initializeAboutTextBoxLineBackgrounds() {
    // Initialize backgrounds for the about text box
    initializeLineBackgroundsForTextBox('about-text-box-1');
    // Initialize backgrounds for the logo hover text box
    initializeLineBackgroundsForTextBox('logo-hover-text-box');
}

// Helper function to create line backgrounds for a specific text box
// Handles both continuous text (natural wrapping) and text with <br> tags
// Updated to support multiple paragraphs in the text box
function initializeLineBackgroundsForTextBox(textBoxId) {
    const textBox = document.getElementById(textBoxId);
    if (!textBox) return;
    
    // Get all paragraphs in the text box (supports multiple <p> tags)
    const paragraphs = textBox.querySelectorAll('p');
    if (paragraphs.length === 0) return;
    
    // Remove any existing line backgrounds
    const existingBgs = textBox.querySelectorAll('.about-line-bg');
    existingBgs.forEach(bg => bg.remove());
    
    // Temporarily force visibility for accurate measurements
    const originalOpacity = textBox.style.opacity;
    const originalVisibility = textBox.style.visibility;
    const originalTransition = textBox.style.transition;
    textBox.style.transition = 'none';
    textBox.style.opacity = '1';
    textBox.style.visibility = 'visible';
    
    // Force layout recalculation
    textBox.offsetHeight;
    
    // Get text box dimensions
    const textBoxRect = textBox.getBoundingClientRect();
    
    // Get line rectangles using Range API
    const range = document.createRange();
    const lines = [];
    
    // Process each paragraph in the text box
    paragraphs.forEach(paragraph => {
        // Get all text nodes in the paragraph (handles <br> tags by getting multiple text nodes)
        const walker = document.createTreeWalker(
            paragraph,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let textNode;
        while ((textNode = walker.nextNode())) {
            const text = textNode.textContent;
            if (!text || text.length === 0) continue;
            
            let lineStart = 0;
            let lastTop = null;
            
            // Iterate through text to find line breaks
            // Check each character's position individually to detect line wraps
            for (let i = 1; i <= text.length; i++) {
                // Check position of current character only (not the entire range from lineStart)
                range.setStart(textNode, i - 1);
                range.setEnd(textNode, i);
                
                const charRect = range.getBoundingClientRect();
                const currentTop = charRect.top;
                
                // Check if we've moved to a new line or reached end of text
                const isNewLine = lastTop !== null && Math.abs(currentTop - lastTop) > 2;
                const isEndOfText = i === text.length;
                
                if (isNewLine || isEndOfText) {
                    const lineEnd = isNewLine ? i - 1 : i;
                    
                    if (lineEnd > lineStart) {
                        range.setStart(textNode, lineStart);
                        range.setEnd(textNode, lineEnd);
                        const lineRect = range.getBoundingClientRect();
                        
                        if (lineRect.width > 0 && lineRect.height > 0) {
                            // Convert to text box-relative coordinates
                            lines.push({
                                left: lineRect.left - textBoxRect.left,
                                right: textBoxRect.right - lineRect.right,
                                top: lineRect.top - textBoxRect.top,
                                width: lineRect.width,
                                height: lineRect.height
                            });
                        }
                    }
                    
                    if (isNewLine) {
                        lineStart = i - 1;
                    }
                }
                
                lastTop = currentTop;
            }
        }
    });
    
    // Create background divs for each line
    const paddingX = 12; // Horizontal padding
    // Use smaller vertical padding for logo-hover-text-box to match credits box (2px vs 6px)
    const paddingY = textBoxId === 'logo-hover-text-box' ? 2 : 6;
    
    // Calculate the minimum allowed top position: the background can extend up to canvas-container's top edge
    // This is the negative of the text box's offset from canvas-container
    const canvasContainer = document.getElementById('canvas-container');
    const canvasContainerTop = canvasContainer ? canvasContainer.getBoundingClientRect().top : textBoxRect.top;
    const textBoxOffsetFromContainer = textBoxRect.top - canvasContainerTop;
    const minTopPosition = -textBoxOffsetFromContainer; // How far up the background can go (relative to text box)
    
    lines.forEach((lineRect) => {
        const bgDiv = document.createElement('div');
        bgDiv.className = 'about-line-bg';
        
        // Position based on actual line position (left + width)
        // This works for right-aligned text because each line has different left position
        // Use Math.max(minTopPosition, ...) to allow background to extend up to canvas-container edge but not beyond
        const rawTop = lineRect.top - paddingY;
        const topPosition = Math.max(minTopPosition, rawTop);
        bgDiv.style.left = `${lineRect.left - paddingX}px`;
        bgDiv.style.top = `${topPosition}px`;
        bgDiv.style.width = `${lineRect.width + (paddingX * 2)}px`;
        bgDiv.style.height = `${lineRect.height + (paddingY * 2)}px`;
        
        textBox.appendChild(bgDiv);
    });
    
    // Restore original styles (clear inline styles to let CSS class control visibility)
    textBox.style.transition = '';
    textBox.style.opacity = '';
    textBox.style.visibility = '';
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

// Function to initialize ABOUT hover effect - shows white overlay on canvas when hovering on ABOUT button
function initializeAboutHoverEffect() {
    const aboutButton = document.querySelector('.black-corner-rectangle-about');
    const aboutPageOverlay = document.getElementById('logo-hover-overlay');
    const paramRectLeft = document.querySelector('.black-bottom-rectangle-left');
    const paramRectRight = document.querySelector('.black-bottom-rectangle-right');
    
    // Get all color items from both columns (moved from Logo hover)
    const allColorItems = document.querySelectorAll('.color-item');
    
    // Get mask containers for legend expansion (moved from Logo hover)
    const maskLeft = document.querySelector('.ui-rect-mask-left');
    const maskRight = document.querySelector('.ui-rect-mask-right');
    
    // Get the scroll tracks for animation
    const rightColumnScrollTrack = aboutPageOverlay ? 
        aboutPageOverlay.querySelector('.diagram-column-right .diagram-scroll-track') : null;
    const leftColumnScrollTrack = aboutPageOverlay ? 
        aboutPageOverlay.querySelector('.diagram-column-left .diagram-scroll-track') : null;
    
    // Animation state for infinite loop
    let animationTimeouts = []; // Array to store all timeout IDs for cleanup
    let rightOffset = 0; // Current right column offset (in rect units, 0 to -6)
    let leftOffset = -6; // Current left column offset (in rect units, -6 to 0)
    
    // Letters array for the scrollable rectangles
    const diagramLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
    
    // Get header elements for dynamic updates
    const headerLeft = aboutPageOverlay ? aboutPageOverlay.querySelector('.diagram-header-left') : null;
    const headerCenter = aboutPageOverlay ? aboutPageOverlay.querySelector('.diagram-header-center') : null;
    const headerRight = aboutPageOverlay ? aboutPageOverlay.querySelector('.diagram-header-right') : null;
    
    // Function to update header labels based on current scroll offsets
    const updateDiagramHeaders = () => {
        // Calculate visible letter index for each column
        // Formula: visibleIndex = (-offset) % 6
        const leftVisibleIndex = ((-leftOffset) % 6 + 6) % 6; // Ensure positive modulo
        const rightVisibleIndex = ((-rightOffset) % 6 + 6) % 6; // Ensure positive modulo
        
        const leftLetter = diagramLetters[leftVisibleIndex];
        const rightLetter = diagramLetters[rightVisibleIndex];
        
        // Update header labels
        if (headerLeft) headerLeft.textContent = `[${leftLetter}]`;
        if (headerRight) headerRight.textContent = `[${rightLetter}]`;
        if (headerCenter) headerCenter.textContent = `[sense ${leftLetter}] + [sense ${rightLetter}]`;
    };
    
    if (!aboutButton || !aboutPageOverlay) return;
    
    // Track if about is currently open
    let aboutIsOpen = false;
    
    // Flag to track if line backgrounds have been created (need to wait for visibility)
    let aboutTextBoxBackgroundsCreated = false;
    
    // Calculate rectangle height for animations
    // Read actual rendered height from DOM to avoid sub-pixel misalignment between CSS flexbox and JS calculations
    const getRectHeight = () => {
        const rect = document.querySelector('.diagram-scrollable-rect');
        if (rect) {
            // Use actual rendered height (rounded to avoid sub-pixel accumulation)
            return Math.round(rect.getBoundingClientRect().height);
        }
        // Fallback to calculated value if DOM element not available
        return Math.round((window.innerHeight * 5 / 6 * 0.54) / 6);
    };
    
    // Helper to move right column up by 1 and handle wrap-around after animation completes
    const moveRightUp = (callback) => {
        const rectHeight = getRectHeight();
        rightOffset -= 1;
        
        // Animate to target position (rounded to avoid sub-pixel gaps)
        rightColumnScrollTrack.style.transform = `translateY(${Math.round(rightOffset * rectHeight)}px)`;
        
        // Update header labels to reflect new position
        updateDiagramHeaders();
        
        // Check if we completed a full rotation (reached -6, showing duplicate [a])
        if (rightOffset <= -6) {
            // Wait for animation to complete (500ms), then reset to 0 without transition
            const resetTimeout = setTimeout(() => {
                rightColumnScrollTrack.style.transition = 'none';
                rightColumnScrollTrack.style.transform = 'translateY(0)';
                rightColumnScrollTrack.offsetHeight;
                rightColumnScrollTrack.style.transition = 'transform 0.5s ease-out';
                rightOffset = 0;
                updateDiagramHeaders(); // Update headers after reset
                if (callback) callback();
            }, 600); // Slightly longer than transition to ensure it completes
            animationTimeouts.push(resetTimeout);
        } else {
            if (callback) callback();
        }
    };
    
    // Helper to move left column down by 1 and handle wrap-around after animation completes
    const moveLeftDown = (callback) => {
        const rectHeight = getRectHeight();
        leftOffset += 1;
        
        // Animate to target position (rounded to avoid sub-pixel gaps)
        leftColumnScrollTrack.style.transform = `translateY(${Math.round(leftOffset * rectHeight)}px)`;
        
        // Update header labels to reflect new position
        updateDiagramHeaders();
        
        // Check if we completed a full rotation (reached 0, showing first set [a])
        if (leftOffset >= 0) {
            // Wait for animation to complete (500ms), then reset to -6 without transition
            const resetTimeout = setTimeout(() => {
                leftColumnScrollTrack.style.transition = 'none';
                leftColumnScrollTrack.style.transform = `translateY(${Math.round(-6 * getRectHeight())}px)`;
                leftColumnScrollTrack.offsetHeight;
                leftColumnScrollTrack.style.transition = 'transform 0.5s ease-out';
                leftOffset = -6;
                updateDiagramHeaders(); // Update headers after reset
                if (callback) callback();
            }, 600); // Slightly longer than transition to ensure it completes
            animationTimeouts.push(resetTimeout);
        } else {
            if (callback) callback();
        }
    };
    
    // Recursive function to run one animation cycle (right up 2, left down 2) then repeat
    const runAnimationCycle = () => {
        // RIGHT COLUMN: up 1 rect
        const t1 = setTimeout(() => {
            moveRightUp(() => {
                // RIGHT COLUMN: wait 2s, then up 1 more rect
                const t2 = setTimeout(() => {
                    moveRightUp(() => {
                        // Wait 2s, then LEFT COLUMN: down 1 rect
                        const t3 = setTimeout(() => {
                            moveLeftDown(() => {
                                // LEFT COLUMN: wait 2s, then down 1 more rect
                                const t4 = setTimeout(() => {
                                    moveLeftDown(() => {
                                        // Wait 2s, then repeat the cycle
                                        const t5 = setTimeout(() => {
                                            runAnimationCycle();
                                        }, 2000);
                                        animationTimeouts.push(t5);
                                    });
                                }, 2000);
                                animationTimeouts.push(t4);
                            });
                        }, 2000);
                        animationTimeouts.push(t3);
                    });
                }, 2000);
                animationTimeouts.push(t2);
            });
        }, 2000);
        animationTimeouts.push(t1);
    };
    
    // Helper to open about (show overlay, expand letters, hide param rects, expand legend)
    const openAbout = () => {
        aboutIsOpen = true;
        
        const rectHeight = getRectHeight();
        
        // Reset position tracking
        rightOffset = 0;
        leftOffset = -6;
        
        // IMPORTANT: Set left column to starting offset position BEFORE overlay becomes visible
        // Start at -6 rects (showing the second/duplicate set starting with [a])
        // This way when we animate toward 0, content moves DOWN and [f][e][d]... appear from top
        if (leftColumnScrollTrack) {
            leftColumnScrollTrack.style.transition = 'none'; // Disable transition for instant jump
            leftColumnScrollTrack.style.transform = `translateY(-${Math.round(rectHeight * 6)}px)`; // Start at second set [a]
            leftColumnScrollTrack.offsetHeight; // Force reflow
            leftColumnScrollTrack.style.transition = 'transform 0.5s ease-out'; // Re-enable transition
        }
        
        // Reset right column to initial position
        if (rightColumnScrollTrack) {
            rightColumnScrollTrack.style.transition = 'none';
            rightColumnScrollTrack.style.transform = 'translateY(0)';
            rightColumnScrollTrack.offsetHeight;
            rightColumnScrollTrack.style.transition = 'transform 0.5s ease-out';
        }
        
        aboutPageOverlay.classList.add('visible');
        aboutButton.classList.add('color-key-expanded'); // Keep letters expanded
        if (paramRectLeft) paramRectLeft.classList.add('about-hovered');
        if (paramRectRight) paramRectRight.classList.add('about-hovered');
        
        // Legend expansion (moved from Logo hover)
        // Add legend-expanded class to ALL items (both columns) for bulk hover effect
        allColorItems.forEach(item => {
            item.classList.add('legend-expanded');
        });
        
        // Add logo-hovered class to mask containers to push them inward (to 85px from edges)
        if (maskLeft) maskLeft.classList.add('logo-hovered');
        if (maskRight) maskRight.classList.add('logo-hovered');
        
        // Create line backgrounds on first open (when text box is visible for accurate measurements)
        // Use setTimeout to wait for CSS transition to complete (300ms transition + 50ms buffer)
        // Now initializes logo-hover-text-box since overlays are swapped
        if (!aboutTextBoxBackgroundsCreated) {
            setTimeout(() => {
                initializeLineBackgroundsForTextBox('logo-hover-text-box');
                aboutTextBoxBackgroundsCreated = true;
            }, 350);
        }
        
        // Update header labels to show initial state
        updateDiagramHeaders();
        
        // Start the infinite animation loop
        if (rightColumnScrollTrack && leftColumnScrollTrack) {
            runAnimationCycle();
        }
    };
    
    // Helper to close about (hide overlay, collapse letters, show param rects, collapse legend)
    const closeAbout = () => {
        aboutIsOpen = false;
        aboutPageOverlay.classList.remove('visible');
        aboutButton.classList.remove('color-key-expanded'); // Collapse letters
        if (paramRectLeft) paramRectLeft.classList.remove('about-hovered');
        if (paramRectRight) paramRectRight.classList.remove('about-hovered');
        
        // Legend collapse (moved from Logo hover)
        // Remove legend-expanded class from all items
        allColorItems.forEach(item => {
            item.classList.remove('legend-expanded');
        });
        
        // Remove logo-hovered class from mask containers to reset their position
        if (maskLeft) maskLeft.classList.remove('logo-hovered');
        if (maskRight) maskRight.classList.remove('logo-hovered');
        
        // Clear all pending animation timeouts
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];
        
        // Reset position tracking
        rightOffset = 0;
        leftOffset = -6;
        
        // Reset both column scroll tracks to initial position (without transition during fade-out)
        if (rightColumnScrollTrack) {
            rightColumnScrollTrack.style.transition = 'none';
            rightColumnScrollTrack.style.transform = 'translateY(0)';
            rightColumnScrollTrack.offsetHeight; // Force reflow
            rightColumnScrollTrack.style.transition = 'transform 0.5s ease-out';
        }
        if (leftColumnScrollTrack) {
            leftColumnScrollTrack.style.transition = 'none';
            leftColumnScrollTrack.style.transform = 'translateY(0)';
            leftColumnScrollTrack.offsetHeight; // Force reflow
            leftColumnScrollTrack.style.transition = 'transform 0.5s ease-out';
        }
    };
    
    // ABOUT button: open if closed, close if open
    aboutButton.addEventListener('mouseenter', () => {
        if (aboutIsOpen) {
            // Close when hovering on ABOUT while overlay is open
            closeAbout();
        } else {
            // Open when hovering on ABOUT while overlay is closed
            openAbout();
        }
    });
    
    // When leaving ABOUT button to overlay, keep open; otherwise close
    aboutButton.addEventListener('mouseleave', (e) => {
        // If moving to overlay, keep open state
        if (aboutPageOverlay.contains(e.relatedTarget)) {
            // Moving to overlay - keep open
            return;
        }
        // If overlay is not open anymore (was closed by mouseenter), don't do anything
        if (!aboutIsOpen) {
            return;
        }
        // Leaving to somewhere else while open - close
        closeAbout();
    });
    
    // Overlay: keep about open when hovering over it
    aboutPageOverlay.addEventListener('mouseenter', () => {
        // Keep open state and expanded letters
        openAbout();
    });
    
    // When leaving overlay, close unless going to ABOUT button
    aboutPageOverlay.addEventListener('mouseleave', (e) => {
        if (!aboutButton.contains(e.relatedTarget)) {
            closeAbout();
        }
    });
}

// Function to align PARAMETER TEXT-BOX rectangles with gradient header bottom edge
// Note: Positioning is now on mask containers (.ui-rect-mask-left, .ui-rect-mask-right, .ui-rect-mask-index)
function alignRectanglesWithEsthesia() {
    // Wait for fonts to load if available, then wait for layout to stabilize
    const waitForLayout = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Use logo-container for horizontal alignment of INDEX
                const logoContainer = document.querySelector('.logo-container');
                // Get mask containers instead of rectangles for positioning
                const maskLeft = document.querySelector('.ui-rect-mask-left');
                const maskRight = document.querySelector('.ui-rect-mask-right');
                const maskIndex = document.querySelector('.ui-rect-mask-index');
                const maskAbout = document.querySelector('.ui-rect-mask-about');
                
                if (!logoContainer) {
                    console.warn('Logo alignment: Missing logo container element');
                    return;
                }
                
                // Get the bottom edge of the gradient header (100vh / 6)
                const gradientBottom = window.innerHeight / 6;
                
                // Get actual mask heights from CSS (dynamically reads the current values)
                // Parameter masks (left/right) and index/about masks may have different heights
                const paramMaskHeight = maskLeft ? parseFloat(getComputedStyle(maskLeft).height) : 40;
                const indexMaskHeight = maskIndex ? parseFloat(getComputedStyle(maskIndex).height) : 28;
                
                // Position rectangles so their bottom edge aligns with gradient bottom
                const paramRectTop = gradientBottom - paramMaskHeight;
                const indexRectTop = gradientBottom - indexMaskHeight;
                
                // Get logo right edge for INDEX horizontal positioning
                const logoContainerBounds = logoContainer.getBoundingClientRect();
                const logoRight = logoContainerBounds.right;
                
                // Align left mask container - bottom edge at gradient bottom
                if (maskLeft) {
                    maskLeft.style.top = `${paramRectTop}px`;
                }
                
                // Align right mask container - bottom edge at gradient bottom
                if (maskRight) {
                    maskRight.style.top = `${paramRectTop}px`;
                }
                
                // Align ABOUT mask container - 50px to the right of logo, bottom edge at gradient bottom
                if (maskAbout) {
                    const aboutLeft = logoRight + 50; // 50px to the right of logo
                    maskAbout.style.top = `${indexRectTop}px`;
                    maskAbout.style.left = `${aboutLeft}px`;
                }
                
                // Align INDEX mask container - 50px to the right of ABOUT, bottom edge at gradient bottom
                if (maskIndex && maskAbout) {
                    const aboutBounds = maskAbout.getBoundingClientRect();
                    const indexLeft = aboutBounds.right + 50; // 50px to the right of ABOUT
                    maskIndex.style.top = `${indexRectTop}px`;
                    maskIndex.style.left = `${indexLeft}px`;
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
    
    // Disable logo hover effect during demo/intro
    const logoElement = document.querySelector('.black-rectangle-logo');
    if (logoElement) {
        logoElement.classList.add('logo-hover-disabled');
    }
    
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
    
    // Create intro explanation text element (two-line explanation above instruction)
    // Positioned at bottom of gradient rectangle index 1 (2nd from top)
    const introTextLine1 = document.createElement('div');
    introTextLine1.className = 'gradient-intro-text gradient-intro-text-line1';
    introTextLine1.innerHTML = '<span class="intro-line">' + INTRO_LINE_1_TEXT + '</span>';
    introTextLine1.id = 'gradient-intro-text-line1';
    // No inline opacity - CSS handles visibility via intro-line transform (slide-up from mask)
    container.appendChild(introTextLine1);
    
    // Create instructional text element (centered on screen)
    // Positioned at bottom of gradient rectangle index 2 (3rd from top)
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
    
    // Position instructional text lines at bottom of gradient rectangles
    // Text fades in during entry animation (synced with gradient shrink)
    const LINE_HEIGHT = 38; // Height of single-line intro-line element (matches CSS index rectangle height)
    const LINE1_HEIGHT = 38; // Height for explanation text (matches index rectangle height)
    
    // Line 1: bottom-aligned to gradient rectangle index 1 (2nd from top), centered on X axis
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    if (introTextLine1) {
        const rectIndex1 = 1; // 2nd gradient from top (0-indexed)
        // Bottom-aligned: top = bottom edge of rectangle - line height
        const line1Top = (rectIndex1 + 1) * itemHeight - LINE1_HEIGHT;
        
        introTextLine1.style.left = `${leftEdge}px`; // Centered on X axis
        introTextLine1.style.width = `${width}px`;
        introTextLine1.style.top = `${line1Top}px`;
        introTextLine1.style.height = `${LINE1_HEIGHT}px`;
        // CSS handles display, alignItems, justifyContent for slide-up mask effect
        introTextLine1.style.visibility = 'visible';
        // DO NOT set opacity or alignItems inline - CSS handles the slide-up animation
    }
    
    // Line 2: bottom-aligned to gradient rectangle index 2 (3rd from top), centered on X axis
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (introTextLine2) {
        const rectIndex2 = 2; // 3rd gradient from top (0-indexed)
        // Bottom-aligned: top = bottom edge of rectangle - line height
        const line2Top = (rectIndex2 + 1) * itemHeight - LINE_HEIGHT;
        
        introTextLine2.style.left = `${leftEdge}px`; // Centered on X axis
        introTextLine2.style.width = `${width}px`;
        introTextLine2.style.top = `${line2Top}px`;
        introTextLine2.style.height = `${LINE_HEIGHT}px`;
        // CSS handles display, alignItems, justifyContent for slide-up mask effect
        introTextLine2.style.visibility = 'visible';
        // DO NOT set opacity or alignItems inline - CSS handles the slide-up animation
    }
    
    // START button: positioned in gradient rectangle index 2 (3rd from top)
    const introTextStart = document.getElementById('gradient-intro-text-start');
    if (introTextStart) {
        const rectIndexStart = 2; // 3rd gradient from top (0-indexed)
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
    
    // Hide triangles when intro closes (remove all triangle-related classes)
    document.body.classList.remove('triangles-revealed');
    document.body.classList.remove('scroll-hint-active');
    
    // Hide intro text elements immediately (intro lines and START button)
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
    
    // Note: scroll-hint-active class is now added/removed per bounce cycle
    // Triangles appear only during actual movement, not during pauses
    
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
            document.body.classList.remove('scroll-hint-active');
            return;
        }
        
        // Show triangles when bounce starts
        document.body.classList.add('scroll-hint-active');
        
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
                        // Hide triangles when bounce ends (before pause)
                        document.body.classList.remove('scroll-hint-active');
                        
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
    
    // Remove class from body to hide triangles (they'll only show on hover now)
    document.body.classList.remove('scroll-hint-active');
    
    // Re-enable scroll-snap on columns after animation stops
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    if (leftColumn) leftColumn.style.scrollSnapType = '';
    if (rightColumn) rightColumn.style.scrollSnapType = '';
}

// ==================
// MAIN SCREEN IDLE SCROLL HINT
// Triggers scroll hint animation when user is idle for 10 seconds on main screen
// ==================

// Function to start the idle timer for main screen
function startMainScreenIdleTimer() {
    // Only start timer if intro is completed (we're on the main screen)
    if (!introCompleted) return;
    
    // Clear any existing timer first
    stopMainScreenIdleTimer();
    
    // Use shorter delay for first hint after main screen opens, then 10 seconds for subsequent hints
    const delay = isFirstMainScreenHint ? FIRST_HINT_DELAY : IDLE_HINT_DELAY;
    
    // Start timer with appropriate delay
    mainScreenIdleTimer = setTimeout(() => {
        // When timer fires, trigger the scroll hint if not already active
        if (introCompleted && !mainScreenHintActive) {
            // First hint repeats twice, subsequent hints run once
            const repeatCount = isFirstMainScreenHint ? 2 : 1;
            // Mark that first hint has been triggered (subsequent hints use 10 second delay)
            isFirstMainScreenHint = false;
            triggerMainScreenScrollHint(repeatCount);
        }
    }, delay);
}

// Function to stop the idle timer
function stopMainScreenIdleTimer() {
    if (mainScreenIdleTimer !== null) {
        clearTimeout(mainScreenIdleTimer);
        mainScreenIdleTimer = null;
    }
}

// Function to reset the idle timer (called when user scrolls)
function resetMainScreenIdleTimer() {
    // Only reset if intro is completed
    if (!introCompleted) return;
    
    // If hint animation is running, stop it
    if (mainScreenHintActive) {
        stopMainScreenScrollHint();
    }
    
    // Restart the timer
    startMainScreenIdleTimer();
}

// Function to stop the main screen scroll hint animation
function stopMainScreenScrollHint() {
    mainScreenHintActive = false;
    isProgrammaticScroll = false;
    
    // Remove class from body to hide triangles
    document.body.classList.remove('scroll-hint-active');
    
    // Re-enable scroll-snap on columns after animation stops
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    if (leftColumn) leftColumn.style.scrollSnapType = '';
    if (rightColumn) rightColumn.style.scrollSnapType = '';
}

// Function to trigger scroll hint animation on main screen (after idle)
// repeatCount: how many times to repeat the full hint sequence (default 1)
function triggerMainScreenScrollHint(repeatCount = 1) {
    // Safety checks: only run on main screen and not already running
    if (!introCompleted || mainScreenHintActive) return;
    
    mainScreenHintActive = true;
    
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) {
        mainScreenHintActive = false;
        startMainScreenIdleTimer(); // Restart timer to try again later
        return;
    }
    
    // Disable scroll-snap during animation for smooth programmatic scrolling
    leftColumn.style.scrollSnapType = 'none';
    rightColumn.style.scrollSnapType = 'none';
    
    // Animation parameters (same as intro scroll hint)
    const nudgeDistance = 32; // pixels to move
    const bounceDuration = 400; // ms per single direction
    const pauseBetweenBounces = 200; // ms pause between bounces within a set
    const pauseBetweenSequences = 1500; // ms pause between full sequences (1.5 seconds)
    const bouncesPerSet = 2; // Number of bounces per sequence
    
    // Track bounce count and sequence count
    let bounceCount = 0;
    let sequenceCount = 0;
    const totalSequences = repeatCount;
    
    // Mark as programmatic scroll to prevent triggering user interaction detection
    isProgrammaticScroll = true;
    
    // Easing function for smooth animation
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Animate a single column's scroll position
    function animateScroll(column, startPos, endPos, duration, callback) {
        const startTime = performance.now();
        
        function animate(currentTime) {
            // Check if animation should stop
            if (!mainScreenHintActive) {
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
            } else {
                callback();
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Perform one bounce cycle (out and back) for both columns
    function performBounce() {
        // Check if animation should stop
        if (!mainScreenHintActive) {
            isProgrammaticScroll = false;
            document.body.classList.remove('scroll-hint-active');
            return;
        }
        
        // Show triangles when bounce starts
        document.body.classList.add('scroll-hint-active');
        
        // Get current scroll positions
        const leftOriginalScroll = leftColumn.scrollTop;
        const rightOriginalScroll = rightColumn.scrollTop;
        
        // Calculate target positions: right nudges DOWN, left nudges UP
        const rightTargetScroll = rightOriginalScroll + nudgeDistance;
        const leftTargetScroll = Math.max(0, leftOriginalScroll - nudgeDistance);
        
        // Phase 1: Move columns to nudge position
        let completedPhase1 = 0;
        
        function onPhase1Complete() {
            completedPhase1++;
            if (completedPhase1 === 2) {
                // Check if animation should stop
                if (!mainScreenHintActive) {
                    isProgrammaticScroll = false;
                    return;
                }
                
                // Phase 2: Return columns to original position
                let completedPhase2 = 0;
                
                function onPhase2Complete() {
                    completedPhase2++;
                    if (completedPhase2 === 2) {
                        // Hide triangles when bounce ends
                        document.body.classList.remove('scroll-hint-active');
                        
                        // Check if animation should stop
                        if (!mainScreenHintActive) {
                            isProgrammaticScroll = false;
                            return;
                        }
                        
                        // Increment bounce count
                        bounceCount++;
                        
                        // Check if we've completed all bounces in the current sequence
                        if (bounceCount >= bouncesPerSet) {
                            // Sequence complete - increment sequence count
                            sequenceCount++;
                            
                            // Check if we've completed all sequences
                            if (sequenceCount >= totalSequences) {
                                // All sequences complete - stop and restart idle timer
                                mainScreenHintActive = false;
                                isProgrammaticScroll = false;
                                
                                // Re-enable scroll-snap
                                leftColumn.style.scrollSnapType = '';
                                rightColumn.style.scrollSnapType = '';
                                
                                // Restart idle timer for next hint
                                startMainScreenIdleTimer();
                            } else {
                                // More sequences to run - pause then start next sequence
                                bounceCount = 0; // Reset bounce count for next sequence
                                setTimeout(() => {
                                    if (mainScreenHintActive) {
                                        performBounce();
                                    }
                                }, pauseBetweenSequences);
                            }
                        } else {
                            // Short pause before next bounce within same sequence
                            setTimeout(() => {
                                if (mainScreenHintActive) {
                                    performBounce();
                                }
                            }, pauseBetweenBounces);
                        }
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
    
    // Start the first bounce immediately
    performBounce();
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

// Momentum-based scrolling state
let centerScrollVelocity = 0;
let centerScrollLastTime = 0;
let centerScrollMomentumFrame = null;
let centerScrollInputTimeout = null;
let centerScrollMomentumActive = false;

// Function to scroll both wheels from center area scroll
// MOMENTUM-BASED: Scrolling moves columns, then snaps to nearest tile
function scrollWheelsFromCenter(deltaY) {
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    
    if (!leftColumn || !rightColumn) return;
    
    // Calculate tile dimensions
    const itemHeight = window.innerHeight / 6;
    const singleSetHeight = 6 * itemHeight;
    const topBoundary = singleSetHeight * 0.5;
    const bottomBoundary = singleSetHeight * 1.5;
    
    // CRITICAL: Stop scroll hint animation when user scrolls from center
    if (scrollHintAnimationActive) {
        stopScrollHintAnimation();
    }
    
    // Reset idle timer on user scroll (for main screen hint)
    resetMainScreenIdleTimer();
    
    // CRITICAL: Mark this as user interaction so START button can appear
    if (!userInteracted && !isInitializing) {
        userInteracted = true;
    }
    
    // If momentum animation is running, cancel it (user is scrolling again)
    if (centerScrollMomentumFrame) {
        cancelAnimationFrame(centerScrollMomentumFrame);
        centerScrollMomentumFrame = null;
        centerScrollMomentumActive = false;
    }
    
    // Disable CSS scroll-snap during active scrolling
    leftColumn.style.scrollSnapType = 'none';
    rightColumn.style.scrollSnapType = 'none';
    
    // Track velocity based on recent deltas
    const now = performance.now();
    const timeDelta = centerScrollLastTime ? (now - centerScrollLastTime) : 16;
    centerScrollLastTime = now;
    
    // Update velocity with smoother blending
    const newVelocity = deltaY / Math.max(timeDelta, 8) * 16;
    centerScrollVelocity = centerScrollVelocity * 0.7 + newVelocity * 0.3;
    
    // Apply scroll delta directly
    const scrollMultiplier = 1.5;
    isProgrammaticScroll = true;
    
    rightColumn.scrollTop += deltaY * scrollMultiplier;
    leftColumn.scrollTop -= deltaY * scrollMultiplier;
    
    // Handle infinite scroll boundaries
    handleCenterScrollBoundaries(leftColumn, rightColumn, itemHeight, singleSetHeight, topBoundary, bottomBoundary);
    
    isProgrammaticScroll = false;
    
    // Reset input timeout - when this fires, user stopped scrolling
    if (centerScrollInputTimeout) {
        clearTimeout(centerScrollInputTimeout);
    }
    
    centerScrollInputTimeout = setTimeout(() => {
        // Only start momentum if not already running
        if (!centerScrollMomentumActive) {
            startCenterScrollMomentum(leftColumn, rightColumn, itemHeight, singleSetHeight, topBoundary, bottomBoundary);
        }
    }, 60);
}

// Handle infinite scroll boundaries for center scroll
function handleCenterScrollBoundaries(leftColumn, rightColumn, itemHeight, singleSetHeight, topBoundary, bottomBoundary) {
    const leftScrollTop = leftColumn.scrollTop;
    const rightScrollTop = rightColumn.scrollTop;
    
    const snapToTile = (scrollTop) => Math.round(scrollTop / itemHeight) * itemHeight;
    
    const leftNeedsJumpForward = leftScrollTop < topBoundary;
    const leftNeedsJumpBackward = leftScrollTop > bottomBoundary;
    const rightNeedsJumpForward = rightScrollTop < topBoundary;
    const rightNeedsJumpBackward = rightScrollTop > bottomBoundary;
    
    if (leftNeedsJumpForward || rightNeedsJumpBackward) {
        leftColumn.scrollTop = snapToTile(leftScrollTop + singleSetHeight);
        rightColumn.scrollTop = snapToTile(rightScrollTop - singleSetHeight);
    } else if (leftNeedsJumpBackward || rightNeedsJumpForward) {
        leftColumn.scrollTop = snapToTile(leftScrollTop - singleSetHeight);
        rightColumn.scrollTop = snapToTile(rightScrollTop + singleSetHeight);
    }
}

// Momentum animation - snaps to nearest tile with smooth animation
function startCenterScrollMomentum(leftColumn, rightColumn, itemHeight, singleSetHeight, topBoundary, bottomBoundary) {
    // Mark momentum as active to prevent duplicate starts
    centerScrollMomentumActive = true;
    
    const snapToTile = (scrollTop) => Math.round(scrollTop / itemHeight) * itemHeight;
    
    // Current positions
    const leftStart = leftColumn.scrollTop;
    const rightStart = rightColumn.scrollTop;
    
    // Snap to nearest tile
    const leftTarget = snapToTile(leftStart);
    const rightTarget = snapToTile(rightStart);
    
    // Calculate distance to snap
    const leftDistance = Math.abs(leftTarget - leftStart);
    const rightDistance = Math.abs(rightTarget - rightStart);
    const maxDistance = Math.max(leftDistance, rightDistance);
    
    // If already at target (within 1px), just finish
    if (maxDistance < 1) {
        centerScrollMomentumActive = false;
        centerScrollVelocity = 0;
        leftColumn.style.removeProperty('scroll-snap-type');
        rightColumn.style.removeProperty('scroll-snap-type');
        updateSelectedIndices();
        return;
    }
    
    // Short animation duration for snap
    const duration = 120;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out cubic for smooth snap
        const eased = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate positions
        const leftCurrent = leftStart + (leftTarget - leftStart) * eased;
        const rightCurrent = rightStart + (rightTarget - rightStart) * eased;
        
        isProgrammaticScroll = true;
        leftColumn.scrollTop = leftCurrent;
        rightColumn.scrollTop = rightCurrent;
        isProgrammaticScroll = false;
        
        if (progress < 1) {
            centerScrollMomentumFrame = requestAnimationFrame(animate);
        } else {
            // Animation complete - ensure exact tile position
            isProgrammaticScroll = true;
            leftColumn.scrollTop = leftTarget;
            rightColumn.scrollTop = rightTarget;
            
            // Re-enable CSS scroll-snap
            leftColumn.style.removeProperty('scroll-snap-type');
            rightColumn.style.removeProperty('scroll-snap-type');
            
            isProgrammaticScroll = false;
            centerScrollMomentumFrame = null;
            centerScrollMomentumActive = false;
            centerScrollVelocity = 0;
            
            // Handle boundaries after animation
            handleCenterScrollBoundaries(leftColumn, rightColumn, itemHeight, singleSetHeight, topBoundary, bottomBoundary);
            
            updateSelectedIndices();
        }
    }
    
    centerScrollMomentumFrame = requestAnimationFrame(animate);
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
        
        // NEW: Center scroll drives wheels during post-demo phase
        // Active when: demo ended (instruction text shown), but intro not yet completed
        // This allows scrolling the wheels from the center area between demo end and START click
        if (!isDemoActive && initialInstructionTextShown && !introCompleted) {
            // Check if the event originated from a scrollbar column
            const target = e.target;
            const isInScrollbar = target.closest('.column-container');
            if (isInScrollbar) {
                // This is a scrollbar scroll - let it work normally
                return;
            }
            
            // Check if mouse is in center area (between scrollbars)
            const mouseX = e.clientX;
            const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
            
            if (mouseX >= leftInnerX && mouseX <= rightInnerX) {
                e.preventDefault();
                scrollWheelsFromCenter(e.deltaY);
                return;
            }
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
                
                // Logo re-enters together with parameter rectangles (same timing)
                const logoContainer = document.querySelector('.logo-container');
                if (logoContainer) {
                    logoContainer.classList.remove('logo-exiting');
                    logoContainer.classList.add('logo-reentering');
                    // After animation completes, switch to logo-visible for stable state
                    setTimeout(() => {
                        logoContainer.classList.remove('logo-reentering');
                        logoContainer.classList.add('logo-visible');
                    }, 400); // Match the re-entrance animation duration
                }
            }
            
            // When progress reaches 1 for the first time, lock it
            if (introProgress >= 1 && !introCompleted) {
                introCompleted = true;
                // Add body class for CSS to detect intro completion
                document.body.classList.add('intro-completed');
                // Update UI visibility - UI remains visible after intro is done
                updateUIVisibility();
                
                // Re-enable logo hover effect now that intro is complete
                const logoElement = document.querySelector('.black-rectangle-logo');
                if (logoElement) {
                    logoElement.classList.remove('logo-hover-disabled');
                }
                
                // Start idle timer for main screen scroll hint
                startMainScreenIdleTimer();
                
                // Note: UI rectangles and logo are already revealed at 70% progress (see above)
                
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
    // Remove body class so labels stay visible during scroll in intro
    document.body.classList.remove('intro-completed');
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
    
    // Get or create intro explanation text element (line 1)
    let introTextLine1 = document.getElementById('gradient-intro-text-line1');
    if (!introTextLine1) {
        introTextLine1 = document.createElement('div');
        introTextLine1.className = 'gradient-intro-text gradient-intro-text-line1';
        introTextLine1.innerHTML = '<span class="intro-line">' + INTRO_LINE_1_TEXT + '</span>';
        introTextLine1.id = 'gradient-intro-text-line1';
        gradientContainer.appendChild(introTextLine1);
    }
    
    // Get or create intro text line element (line 2)
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
        logoContainer.classList.remove('logo-intro-hidden', 'logo-entering', 'logo-exiting', 'logo-reentering');
        logoContainer.classList.add('logo-visible');
    }
    if (uiLayer) {
        // Keep logo-animating so logo stays visible (rest of UI still hidden)
        uiLayer.classList.add('logo-animating');
        // NOTE: words-revealed is NOT added here - parameter rectangles only appear after collapse animation
    }
    
    // Show labels on all scrollbar color items when demo is skipped (same as normal demo end)
    // Use intro-labels-visible to keep width at 50px while showing labels
    const allColorItems = document.querySelectorAll('.color-item');
    allColorItems.forEach(item => {
        item.classList.add('intro-labels-visible');
    });
    
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
    
    // Note: Triangles are now controlled by hover and scroll-hint-active class
    // They will appear during scroll hint animation and on hover
    
    // Show START button alongside the instruction text (both remain visible)
    setupStartButton();
    
    // Ensure intro-active class exists for CSS rules to work
    if (gradientContainer && !gradientContainer.classList.contains('intro-active')) {
        gradientContainer.classList.add('intro-active');
    }
    
}

// Shared function to set up START button click handler
// This ensures consistent behavior whether START appears in initial intro or after returning via logo click
// Shows START button while keeping the instruction text visible
function setupStartButton() {
    // Stop scroll hint animation when START appears
    stopScrollHintAnimation();
    
    // Show START button alongside the instruction text (both remain visible)
    showStartButtonElement();
}

// Helper function that actually displays the START button element
// Called after the instruction lines have finished their exit animation
function showStartButtonElement() {
    // Hide line2 (scroll instruction) when START appears - trigger slide-out animation
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (introTextLine2) {
        const line2Inner = introTextLine2.querySelector('.intro-line');
        if (line2Inner) {
            line2Inner.classList.add('intro-line-exiting');
        }
        // Hide container after animation completes
        setTimeout(() => {
            introTextLine2.style.display = 'none';
            introTextLine2.style.visibility = 'hidden';
        }, 800);
    }
    
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
    
    // Trigger slide-out animation for WORD rectangles (runs simultaneously with START slide-out)
    // Add words-exiting class to slide WORD rectangles out, remove words-revealed to reset state
    const uiLayerForExit = document.querySelector('.ui-layer');
    if (uiLayerForExit) {
        uiLayerForExit.classList.add('words-exiting');
        uiLayerForExit.classList.remove('words-revealed');
    }
    
    // Hide labels on all scrollbar color items when START is clicked
    // This removes the intro-labels-visible class that was added after demo ended
    const allColorItems = document.querySelectorAll('.color-item');
    allColorItems.forEach(item => {
        item.classList.remove('intro-labels-visible');
    });
    
    // Trigger slide-out animation for instruction text (runs simultaneously with START slide-out)
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    const line1Inner = introTextLine1?.querySelector('.intro-line');
    if (line1Inner) {
        // Disable pointer events immediately
        line1Inner.style.pointerEvents = 'none';
        // Trigger slide-out animation
        line1Inner.classList.add('intro-line-exiting');
    }
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    const line2Inner = introTextLine2?.querySelector('.intro-line');
    if (line2Inner) {
        // Disable pointer events immediately
        line2Inner.style.pointerEvents = 'none';
        // Trigger slide-out animation
        line2Inner.classList.add('intro-line-exiting');
    }
    const introText = document.getElementById('gradient-intro-text');
    if (introText) {
        introText.style.display = 'none';
        introText.style.visibility = 'hidden';
        introText.style.opacity = '0';
        introText.style.pointerEvents = 'none';
    }
    
    // Hide START button and instruction text containers after slide-out animation completes (800ms)
    // This happens in background while collapse animation runs
    setTimeout(() => {
        if (introTextStart) {
            introTextStart.style.display = 'none';
            introTextStart.style.visibility = 'hidden';
            introTextStart.style.opacity = '0';
            introTextStart.style.pointerEvents = 'none';
        }
        if (introTextLine1) {
            introTextLine1.style.display = 'none';
            introTextLine1.style.visibility = 'hidden';
            introTextLine1.style.opacity = '0';
            introTextLine1.style.pointerEvents = 'none';
        }
        if (introTextLine2) {
            introTextLine2.style.display = 'none';
            introTextLine2.style.visibility = 'hidden';
            introTextLine2.style.opacity = '0';
            introTextLine2.style.pointerEvents = 'none';
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
        // Remove words-exiting and add words-revealed to trigger slide-in animation
        if (introProgress >= 0.7 && uiLayer && !uiLayer.classList.contains('words-revealed')) {
            uiLayer.classList.remove('words-exiting'); // Remove slide-out state
            uiLayer.classList.remove('logo-animating'); // Remove logo-animating so masks stay at 50px
            uiLayer.classList.add('words-revealed'); // Trigger slide-in for WORD + INDEX
            
            // Logo re-enters together with parameter rectangles (same timing)
            const logoContainer = document.querySelector('.logo-container');
            if (logoContainer) {
                logoContainer.classList.remove('logo-exiting');
                logoContainer.classList.add('logo-reentering');
                // After animation completes, switch to logo-visible for stable state
                setTimeout(() => {
                    logoContainer.classList.remove('logo-reentering');
                    logoContainer.classList.add('logo-visible');
                }, 400); // Match the re-entrance animation duration
            }
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
            // Add body class for CSS to detect intro completion
            document.body.classList.add('intro-completed');
            
            // Update UI visibility for final state
            updateUIVisibility();
            
            // Re-enable logo hover effect now that intro is complete
            const logoElement = document.querySelector('.black-rectangle-logo');
            if (logoElement) {
                logoElement.classList.remove('logo-hover-disabled');
            }
            
            // Start idle timer for main screen scroll hint
            startMainScreenIdleTimer();
            
            // Note: UI rectangles and logo are already revealed at 70% progress (see above)
            
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
    // Remove body class so labels stay visible during scroll in intro
    document.body.classList.remove('intro-completed');
    
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
            
            // Wait for horizontal contraction to complete (400ms), then set INTRO state
            setTimeout(() => {
                // Set INTRO state variables (not START checkpoint)
                // This allows START to appear after user scrolls, like the original intro
                introCompleted = false; // Keep false so scrolling works
                // Remove body class so labels stay visible during scroll in intro
                document.body.classList.remove('intro-completed');
                horizontalExpansionStarted = false; // Reset so it can start again when scrolling
                hasExpandedToScrollbars = true; // Scrollbars are visible at intro
                introReady = true; // Enable center scroll trigger
                introTriggered = false; // Not yet triggered
                
                // Reset intro text state so START appears after scroll (like original intro)
                introTextChanged = false; // Enables START to appear on scroll
                hasScrolledScrollbar = false; // Resets scroll detection
                userInteracted = false; // Resets interaction detection
                initialInstructionTextShown = true; // Allows START after scroll
                
                // Reset startClickTransitionActive to ensure clean state
                startClickTransitionActive = false;
                
                // Show instruction text lines (not START button)
                const introTextLine1 = document.getElementById('gradient-intro-text-line1');
                if (introTextLine1) {
                    introTextLine1.style.display = 'flex';
                    introTextLine1.style.visibility = 'visible';
                    // Reset slide-out state if present
                    const line1Inner = introTextLine1.querySelector('.intro-line');
                    if (line1Inner) {
                        line1Inner.classList.remove('intro-line-exiting');
                    }
                }
                const introTextLine2 = document.getElementById('gradient-intro-text-line2');
                if (introTextLine2) {
                    introTextLine2.style.display = 'flex';
                    introTextLine2.style.visibility = 'visible';
                    // Reset slide-out state if present
                    const line2Inner = introTextLine2.querySelector('.intro-line');
                    if (line2Inner) {
                        line2Inner.classList.remove('intro-line-exiting');
                    }
                }
                
                // Hide START button (it will appear after user scrolls)
                const introTextStart = document.getElementById('gradient-intro-text-start');
                if (introTextStart) {
                    introTextStart.style.display = 'none';
                    introTextStart.style.visibility = 'hidden';
                    introTextStart.style.opacity = '0';
                    // Reset slide-out state if present
                    const startInner = introTextStart.querySelector('.intro-line');
                    if (startInner) {
                        startInner.classList.remove('start-exiting');
                    }
                }
                
                // Hide legacy START button element if it exists
                const introText = document.getElementById('gradient-intro-text');
                if (introText) {
                    introText.style.display = 'none';
                    introText.style.visibility = 'hidden';
                    introText.style.opacity = '0';
                }
                
                // Show parameter rectangles (word boxes) by adding words-revealed class
                const uiLayer = document.querySelector('.ui-layer');
                if (uiLayer) {
                    uiLayer.classList.remove('words-exiting');
                    uiLayer.classList.add('words-revealed');
                }
                
                // Update UI visibility
                updateUIVisibility();
                
                // Canvas cover stays visible (we're in intro state)
                updateCanvasCoverVisibility();
                
                // Update UI mask visibility - should be visible at intro state with gap
                updateUIMaskVisibility();
                
                // CRITICAL: Ensure main gradient header stays visible in intro state
                // It should remain visible under the UI at all times
                showMainGradientHeader();
                
                // Update gradient intro to position text correctly
                updateGradientIntro();
                
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
    // Remove body class so labels stay visible during scroll in intro
    document.body.classList.remove('intro-completed');
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
    
    // Reset main screen idle timer state
    stopMainScreenIdleTimer();
    mainScreenHintActive = false;
    isFirstMainScreenHint = true; // Reset so first hint uses 3-second delay after restart
    
    // Reset triangle animation state (hide triangles for next intro)
    document.body.classList.remove('triangles-revealed');
    document.body.classList.remove('scroll-hint-active');
    
    // Collapse all scrollbar color items for clean restart
    const allColorItems = document.querySelectorAll('.color-item');
    allColorItems.forEach(item => {
        item.classList.remove('legend-expanded');
        item.classList.remove('intro-labels-visible');
    });
    
    // Get gradient container and clean up existing DOM elements
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (gradientContainer) {
        // Remove all existing gradient rectangles
        const rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
        rectangles.forEach(rect => rect.remove());
        
        // Remove intro text elements if they exist
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
        logoContainer.classList.remove('logo-intro-hidden', 'logo-entering', 'logo-visible', 'logo-exiting', 'logo-reentering');
    }
    if (uiLayer) {
        uiLayer.classList.remove('logo-animating');
    }
    
    // Ensure logo remains clickable after restart
    const logoElement = document.querySelector('.black-rectangle-logo');
    if (logoElement) {
        logoElement.style.pointerEvents = 'auto';
        logoElement.style.cursor = 'pointer';
    }
    
    // Re-initialize the gradient intro (this will create new rectangles and start the animation)
    // This also adds logo-intro-hidden class to reset logo state
    initializeGradientIntro();
    
}

// Function to jump to demo start with shutter-close animation
// Called when clicking the logo - runs shutter animation then starts the demo
function jumpToDemoStart() {
    // Slide out parameter rectangles (WORD boxes) with animation
    // They will slide back in when demo ends and intro text appears
    const uiLayer = document.querySelector('.ui-layer');
    if (uiLayer) {
        uiLayer.classList.add('words-exiting');
        uiLayer.classList.remove('words-revealed');
    }
    
    // Collapse all scrollbar color items when restarting demo
    // They will expand again when demo ends
    const allColorItems = document.querySelectorAll('.color-item');
    allColorItems.forEach(item => {
        item.classList.remove('legend-expanded');
        item.classList.remove('intro-labels-visible');
    });
    
    // Disable logo hover effect during the transition and demo
    const logoElementForHover = document.querySelector('.black-rectangle-logo');
    if (logoElementForHover) {
        logoElementForHover.classList.add('logo-hover-disabled');
    }
    
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
    
    // Remove collapsed class if present, set to closing phase for animation
    gradientContainer.classList.remove('intro-collapsed', 'intro-entering', 'intro-active', 'demo-active');
    gradientContainer.classList.add('intro-closing');
    
    // Get or create gradient rectangles
    let rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
    const itemHeight = window.innerHeight / 6;
    
    // Remove any existing text elements (will be recreated after demo)
    const introTextLine1 = document.getElementById('gradient-intro-text-line1');
    if (introTextLine1) introTextLine1.remove();
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (introTextLine2) introTextLine2.remove();
    const introText = document.getElementById('gradient-intro-text');
    if (introText) introText.remove();
    const introTextStart = document.getElementById('gradient-intro-text-start');
    if (introTextStart) introTextStart.remove();
    const arrowElement = document.getElementById('gradient-intro-arrow');
    if (arrowElement) arrowElement.remove();
    
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
    
    // Temporarily bypass introCompleted check
    const wasIntroCompleted = introCompleted;
    introCompleted = false;
    // Remove body class so labels stay visible during scroll in intro
    document.body.classList.remove('intro-completed');
    horizontalExpansionStarted = false;
    
    // Set up initial state: rectangles at scrollbar edges with 0 height (collapsed state)
    const { leftInnerX, rightInnerX } = getClosedScrollbarInnerEdges();
    const containerRect = gradientContainer.getBoundingClientRect();
    const containerLocalLeft = leftInnerX - containerRect.left;
    const targetWidth = rightInnerX - leftInnerX;
    
    // Position rectangles at scrollbar edges with 0 height
    rectangles.forEach((bar) => {
        bar.style.left = containerLocalLeft + 'px';
        bar.style.width = targetWidth + 'px';
        bar.style.height = '0px'; // Start collapsed
    });
    
    // Update colors
    updateGradientIntro();
    
    // Animation parameters - shutter close (bars expand in height)
    const animationDuration = 800; // 800ms for shutter animation
    const startTime = performance.now();
    
    // Easing function (easeOutCubic for smooth deceleration)
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Animation loop - expand bar heights (shutter close effect)
    function animateShutterClose(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const easedProgress = easeOutCubic(progress);
        
        // Expand bar heights from 0 to full height
        rectangles.forEach((bar) => {
            const currentHeight = easedProgress * itemHeight;
            bar.style.height = currentHeight + 'px';
        });
        
        if (progress < 1) {
            requestAnimationFrame(animateShutterClose);
        } else {
            // Shutter animation complete - now expand to full-bleed
            onShutterCloseComplete();
        }
    }
    
    // Called when shutter-close animation is complete
    function onShutterCloseComplete() {
        // Transition to entering phase (full-bleed)
        gradientContainer.classList.remove('intro-closing');
        gradientContainer.classList.add('intro-entering');
        
        // Expand rectangles to full width (full-bleed)
        rectangles.forEach((bar) => {
            bar.style.left = '0px';
            bar.style.width = '100%';
            bar.style.height = itemHeight + 'px';
        });
        
        // Short delay for the horizontal expansion to complete visually
        setTimeout(() => {
            // Now do the full state reset and start demo
            completeJumpToDemoStart();
        }, 300); // 300ms for horizontal expansion
    }
    
    // Start the shutter animation
    requestAnimationFrame(animateShutterClose);
}

// Helper function to complete the jump to demo start after animation
function completeJumpToDemoStart() {
    // Reset all intro-related state variables to initial values
    introPhase = 'entering';
    introReady = false;
    introTriggered = false;
    introProgress = 0;
    introCompleted = false;
    // Remove body class so labels stay visible during scroll in intro
    document.body.classList.remove('intro-completed');
    horizontalExpansionStarted = false;
    hasExpandedToScrollbars = false;
    startClickTransitionActive = false;
    
    // Reset intro text and user interaction state
    introTextChanged = false;
    initialInstructionTextShown = false;
    leftColumnScrolled = false;
    rightColumnScrolled = false;
    userInteracted = false;
    hasScrolledScrollbar = false;
    isDemoActive = false;
    demoJustEnded = false;
    uniqueColorsSeen.clear();
    hasUserInteracted = false;
    
    // Reset scroll hint animation state
    scrollHintAnimationTriggered = false;
    scrollHintAnimationActive = false;
    
    // Reset main screen idle timer state
    stopMainScreenIdleTimer();
    mainScreenHintActive = false;
    isFirstMainScreenHint = true;
    
    // Reset triangle animation state
    document.body.classList.remove('triangles-revealed');
    document.body.classList.remove('scroll-hint-active');
    
    // Collapse all scrollbar color items for clean restart
    const allColorItems = document.querySelectorAll('.color-item');
    allColorItems.forEach(item => {
        item.classList.remove('legend-expanded');
        item.classList.remove('intro-labels-visible');
    });
    
    // Clean up gradient container DOM
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (gradientContainer) {
        // Remove all existing gradient rectangles (will be recreated by initializeGradientIntro)
        const rectangles = gradientContainer.querySelectorAll('.gradient-intro-rectangle');
        rectangles.forEach(rect => rect.remove());
        
        // Remove text elements
        const introTextLine1 = document.getElementById('gradient-intro-text-line1');
        if (introTextLine1) introTextLine1.remove();
        
        const introTextLine2 = document.getElementById('gradient-intro-text-line2');
        if (introTextLine2) introTextLine2.remove();
        
        const introText = document.getElementById('gradient-intro-text');
        if (introText) introText.remove();
        
        const introTextStart = document.getElementById('gradient-intro-text-start');
        if (introTextStart) introTextStart.remove();
        
        const arrowElement = document.getElementById('gradient-intro-arrow');
        if (arrowElement) arrowElement.remove();
        
        // Reset container classes and styles
        gradientContainer.classList.remove('intro-active', 'intro-closing', 'intro-collapsed', 'demo-active');
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
    
    // Reset UI visibility (hidden during entering phase)
    updateUIVisibility();
    
    // Reset canvas cover visibility (visible during intro)
    updateCanvasCoverVisibility();
    
    // Reset logo animation state
    const logoContainer = document.querySelector('.logo-container');
    const uiLayerForLogo = document.querySelector('.ui-layer');
    if (logoContainer) {
        logoContainer.classList.remove('logo-intro-hidden', 'logo-entering', 'logo-visible', 'logo-exiting', 'logo-reentering');
    }
    if (uiLayerForLogo) {
        uiLayerForLogo.classList.remove('logo-animating');
        // Clean up words-exiting class so it doesn't interfere with the new intro
        // Note: words-revealed stays removed - it will be added when demo ends
        uiLayerForLogo.classList.remove('words-exiting');
    }
    
    // Ensure logo remains clickable after restart
    const logoElement = document.querySelector('.black-rectangle-logo');
    if (logoElement) {
        logoElement.style.pointerEvents = 'auto';
        logoElement.style.cursor = 'pointer';
    }
    
    // Re-initialize the gradient intro (creates new rectangles and starts the demo)
    initializeGradientIntro();
}

// Function to initialize logo click handler
function initializeLogoClickHandler() {
    const logoElement = document.querySelector('.black-rectangle-logo');
    
    if (!logoElement) {
        console.warn('Logo element (.black-rectangle-logo) not found');
        return;
    }
    
    // Click handler function for logo - jumps to demo start
    const handleLogoClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Only allow click when intro is completed (user is on main screen)
        // Prevents clicking during demo or intro phases
        if (!introCompleted) {
            return;
        }
        
        // Jump to demo start state with shutter animation
        jumpToDemoStart();
    };
    
    // Set up logo rectangle
    if (logoElement) {
        // CRITICAL: Enable pointer events (CSS has pointer-events: none by default)
        logoElement.style.pointerEvents = 'auto';
        logoElement.style.cursor = 'pointer';
        logoElement.addEventListener('click', handleLogoClick);
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
        
        // CRITICAL: Reset isProgrammaticScroll to allow user scrolling to be detected
        // This was staying true after demo, blocking all user interaction detection
        isProgrammaticScroll = false;
        
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
        
        // NOTE: words-revealed is NOT added here - parameter rectangles only appear after collapse animation
        // Logo exits after demo ends (will re-enter with parameter rectangles during collapse)
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer && !logoContainer.classList.contains('logo-exiting')) {
            logoContainer.classList.add('logo-exiting');
            logoContainer.classList.remove('logo-visible');
        }
        
        // Show labels on all scrollbar color items when demo ends
        // Use intro-labels-visible to keep width at 50px while showing labels
        const allColorItems = document.querySelectorAll('.color-item');
        allColorItems.forEach(item => {
            item.classList.add('intro-labels-visible');
        });
        
        // Note: Triangles are now controlled by hover and scroll-hint-active class
        // They will appear during scroll hint animation and on hover
        
        // Show instruction text lines (only if not already changed to START)
        if (!introTextChanged) {
            // Show instruction line 1 element (explanation)
            const introTextLine1 = document.getElementById('gradient-intro-text-line1');
            
            if (introTextLine1) {
                // Remove any inline styles that might override CSS
                introTextLine1.style.cursor = '';
                introTextLine1.style.pointerEvents = '';
                // Ensure container is visible - CSS handles the slide-up animation via inner .intro-line
                introTextLine1.style.display = 'flex';
                introTextLine1.style.visibility = 'visible';
                // Don't set opacity inline - let CSS handle it via intro-active class
            }
            
            // Show instruction line 2 element (scroll instruction)
            const introTextLine2 = document.getElementById('gradient-intro-text-line2');
            
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
    // Check if instruction line element exists (not the START button)
    const introTextLine2 = document.getElementById('gradient-intro-text-line2');
    if (!introTextLine2) {
        return;
    }
        
    // Check if gradients have collapsed (intro-active phase)
    const gradientContainer = document.getElementById('gradient-intro-container');
    if (!gradientContainer || !gradientContainer.classList.contains('intro-active')) {
        return;
    }
    
    // Check if instruction text line is visible (not the START button)
    // This ensures we only trigger demo for initial instruction text, not START
    const lineVisible = introTextLine2 && introTextLine2.style.display !== 'none';
    if (!lineVisible) {
        return;
    }
    
    // Trigger demo - scroll both columns with default duration (3 seconds for visible continuous motion)
    // Note: Text is already hidden by demo-active class, so it will stay hidden during demo
    scrollBothColumnsProgrammatically();
}

