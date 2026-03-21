// Input handling system

// Key state tracking
let keys = {};
let keyJustPressed = {}; // Track keys that were just pressed this frame

// Haptic feedback helper
function triggerHapticFeedback(duration = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// Add visual feedback to mobile buttons
function addButtonPressEffect(button) {
    if (button) {
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 100);
    }
}

// Key event listeners
document.addEventListener('keydown', (event) => {
    const wasPressed = keys[event.code];
    keys[event.code] = true;
    
    // Mark as "just pressed" only if it wasn't already pressed
    if (!wasPressed) {
        keyJustPressed[event.code] = true;
        
        // Handle shooting immediately on key press
        if (event.code === 'ArrowUp' && player1.active) {
            if (typeof shootProjectile === 'function') {
                shootProjectile(player1);
            }
        }
        if (event.code === 'KeyW' && (gameMode === 'multi' || gameMode === 'ai-coop') && player2.active) {
            if (typeof shootProjectile === 'function') {
                shootProjectile(player2);
            }
        }
    }
    
    // Prevent default behavior for game keys
    if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyD'].includes(event.code)) {
        event.preventDefault();
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
    keyJustPressed[event.code] = false;
});

// Handle keyboard input for both players
function handleInput() {
    // Clear the "just pressed" flags at the start of each frame
    keyJustPressed = {};

    // Handle movement (these can be continuous)
    if (keys['ArrowLeft'] && player1.active) {
        player1.dx = -player1.speed;
    } else if (keys['ArrowRight'] && player1.active) {
        player1.dx = player1.speed;
    } else if (player1.active) {
        player1.dx = 0;
    }

    if (gameMode === 'multi' || gameMode === 'ai-coop') {
        if (keys['KeyA'] && player2.active) {
            player2.dx = -player2.speed;
        } else if (keys['KeyD'] && player2.active) {
            player2.dx = player2.speed;
        } else if (player2.active) {
            player2.dx = 0;
        }
    } else if (player2.active) { // Ensure P2 doesn't move if somehow active in single player
        player2.dx = 0;
    }
    // Note: Shooting is now handled in keydown event, not here
}

// Mobile controls setup
function setupMobileControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const shootBtn = document.getElementById('shootBtn');
    const mobileControls = document.getElementById('mobileControls');

    if (!leftBtn || !rightBtn || !shootBtn || !mobileControls) {
        console.log('Mobile controls not found - running on desktop');
        return;
    }

    // Show mobile controls only on touch devices
    if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
        return;
    }
    mobileControls.style.display = 'flex';

    // Use pointer events so multiple simultaneous touches work correctly.
    // setPointerCapture ensures pointerup/pointercancel always fire on the
    // same element even if the finger slides off, preventing stuck keys.

    function setupMoveButton(btn, keyCode) {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            btn.setPointerCapture(e.pointerId);
            keys[keyCode] = true;
            btn.classList.add('pressed');
            if (e.pointerType === 'touch') triggerHapticFeedback(30);
        });
        btn.addEventListener('pointerup', (e) => {
            e.preventDefault();
            keys[keyCode] = false;
            btn.classList.remove('pressed');
        });
        btn.addEventListener('pointercancel', () => {
            keys[keyCode] = false;
            btn.classList.remove('pressed');
        });
    }

    setupMoveButton(leftBtn, 'ArrowLeft');
    setupMoveButton(rightBtn, 'ArrowRight');

    // Shoot button — fires immediately on press, then continuously while held
    let shootHoldInterval = null;

    function fireMobileShot() {
        if (player1.active && typeof shootProjectile === 'function') {
            shootProjectile(player1);
        }
    }

    shootBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        shootBtn.setPointerCapture(e.pointerId);
        shootBtn.classList.add('pressed');
        if (e.pointerType === 'touch') triggerHapticFeedback(50);
        fireMobileShot();
        if (!shootHoldInterval) {
            shootHoldInterval = setInterval(fireMobileShot, 150);
        }
    });
    shootBtn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        shootBtn.classList.remove('pressed');
        clearInterval(shootHoldInterval);
        shootHoldInterval = null;
    });
    shootBtn.addEventListener('pointercancel', () => {
        shootBtn.classList.remove('pressed');
        clearInterval(shootHoldInterval);
        shootHoldInterval = null;
    });
}

console.log("=== INPUT.JS LOADED ===");