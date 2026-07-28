// Function cache - validate once at startup instead of every frame
const gameFunctions = {};

function validateGameFunctions() {
    // Cache function existence checks
    gameFunctions.handleInput = typeof handleInput === 'function';
    gameFunctions.updatePlayers = typeof updatePlayers === 'function';
    gameFunctions.updateBubbles = typeof updateBubbles === 'function';
    gameFunctions.updateProjectiles = typeof updateProjectiles === 'function';
    gameFunctions.updatePowerUps = typeof updatePowerUps === 'function';
    gameFunctions.updateRescueBubbles = typeof updateRescueBubbles === 'function';
    gameFunctions.updateParticles = typeof updateParticles === 'function';
    gameFunctions.checkCollisions = typeof checkCollisions === 'function';
    gameFunctions.checkRescueBubbleCollisions = typeof checkRescueBubbleCollisions === 'function';
    gameFunctions.drawEverything = typeof drawEverything === 'function';
    gameFunctions.playSound = typeof playSound === 'function';
    gameFunctions.initializeSounds = typeof initializeSounds === 'function';
    gameFunctions.resetBubbleSpeedEffect = typeof resetBubbleSpeedEffect === 'function';
    gameFunctions.clearAllRescueBubbles = typeof clearAllRescueBubbles === 'function';
    gameFunctions.resetBubbleSpeed = typeof resetBubbleSpeed === 'function';
    gameFunctions.removePowerUp = typeof removePowerUp === 'function';
    gameFunctions.resetPlayers = typeof resetPlayers === 'function';
    gameFunctions.startLevel = typeof startLevel === 'function';
    gameFunctions.initializeObstacles = typeof initializeObstacles === 'function';
    gameFunctions.initializeLevelBubbles = typeof initializeLevelBubbles === 'function';
    gameFunctions.clearCanvas = typeof clearCanvas === 'function';
    gameFunctions.createPowerUp = typeof createPowerUp === 'function';
    gameFunctions.handleInput = typeof handleInput === 'function';
    gameFunctions.updateFloatingTexts = typeof updateFloatingTexts === 'function';
    gameFunctions.clearAllPlayerPowerUps = typeof clearAllPlayerPowerUps === 'function';

    // Warn about missing critical functions
    if (!gameFunctions.createPowerUp) {
        console.error('CRITICAL: createPowerUp function not found! Powerups will not drop.');
    }
}

// Initialize canvas and context (variables are declared in constants.js)
canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');

// Canvas management
function resizeCanvas() {
    // Fixed canvas size for consistent gameplay
    canvas.width = 1000;
    canvas.height = 800;
    // If mode select is visible, re-trigger animations
    const messageBox = document.getElementById('messageBox');
    if (messageBox && messageBox.style.display !== 'none') {
        const p1Button = document.getElementById('singlePlayerButton');
        const p2Button = document.getElementById('multiPlayerButton');
        const aiButton = document.getElementById('aiCoopButton');
        
        if (p1Button && p2Button && aiButton) {
            // Remove and re-add the class to restart the animation
            [p1Button, p2Button, aiButton].forEach(btn => {
                btn.classList.remove('animate-in');
                // Use a timeout to ensure the class removal is processed before re-adding
                setTimeout(() => btn.classList.add('animate-in'), 10);
            });
        }
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game initialization
window.addEventListener('load', () => {
    setupGame();
});

function setupGame() {
    // Validate all game functions once at startup
    validateGameFunctions();
    
    // Initialize sound system first
    if (gameFunctions.initializeSounds) {
        initializeSounds();
    }
    setupMobileControls();
    showModeSelectPrompt(); // Ask for game mode
}

function showModeSelectPrompt() {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const actionButton = document.getElementById('actionButton');

    // Stop background music when returning to mode selection
    if (typeof stopBackgroundMusic === 'function') {
        stopBackgroundMusic();
    }

    if (!messageBox || !messageText || !actionButton) {
        console.error("Message box elements not found for mode selection! Defaulting to single player.");
        gameMode = 'single';
        if (typeof playSound === 'function') playSound('start');
        startNewGame();
        return;
    }

    // Create awesome animated title
    messageText.innerHTML = `
        <div class="game-title-container">
            <h1 class="game-title">
                <span class="title-word">BUBBLE</span>
                <span class="title-word">TROUBLE</span>
            </h1>
            <div class="subtitle">Ottos & Theo's Epic Adventure</div>
            <div class="mode-selection-prompt">Choose Your Destiny</div>
        </div>
    `;
    
    actionButton.style.display = 'none';

    // Function to clean up and start game
    const startGameWithMode = (selectedMode) => {
        gameMode = selectedMode;
        
        // Add selection animation
        let selectedButton;
        if (selectedMode === 'single') {
            selectedButton = document.getElementById('singlePlayerButton');
        } else if (selectedMode === 'multi') {
            selectedButton = document.getElementById('multiPlayerButton');
        } else if (selectedMode === 'ai-coop') {
            selectedButton = document.getElementById('aiCoopButton');
        }
        
        if (selectedButton) {
            selectedButton.classList.add('selected');
            setTimeout(() => {
                document.getElementById('singlePlayerButton')?.remove();
                document.getElementById('multiPlayerButton')?.remove();
                document.getElementById('aiCoopButton')?.remove();
                actionButton.style.display = 'inline-block';
                hideMessage();
                if (typeof playSound === 'function') playSound('start');
                
                // Handle AI Co-Op mode (temporarily treat as single player until implemented)
                if (selectedMode === 'ai-coop') {
                    gameMode = 'ai-coop';
                }
                
                startNewGame();
            }, 500);
        }
    };

    // Create enhanced Player 1 button
    const p1Button = document.createElement('button');
    p1Button.id = 'singlePlayerButton';
    p1Button.className = 'player-mode-button single-player';
    p1Button.innerHTML = `
        <div class="mode-icon">
            <div class="player-avatar solo">👤</div>
            <div class="mode-particles"></div>
        </div>
        <div class="mode-content">
            <div class="mode-title">SOLO</div>
            <div class="mode-subtitle">Face bubbles alone</div>
        </div>
        <div class="mode-glow"></div>
    `;
    p1Button.onclick = () => startGameWithMode('single');

    // Create enhanced Player 2 button
    const p2Button = document.createElement('button');
    p2Button.id = 'multiPlayerButton';
    p2Button.className = 'player-mode-button multi-player';
    p2Button.innerHTML = `
        <div class="mode-icon">
            <div class="player-avatar duo">👥</div>
            <div class="mode-particles"></div>
        </div>
        <div class="mode-content">
            <div class="mode-title">CO-OP</div>
            <div class="mode-subtitle">Team with friend</div>
        </div>
        <div class="mode-glow"></div>
    `;
    p2Button.onclick = () => startGameWithMode('multi');

    // Create AI Co-Op button
    const aiButton = document.createElement('button');
    aiButton.id = 'aiCoopButton';
    aiButton.className = 'player-mode-button ai-coop';
    aiButton.innerHTML = `
        <div class="mode-icon">
            <div class="player-avatar ai">🤖</div>
            <div class="mode-particles"></div>
        </div>
        <div class="mode-content">
            <div class="mode-title">AI CO-OP</div>
            <div class="mode-subtitle">Computer teammate</div>
        </div>
        <div class="mode-glow"></div>
    `;
    aiButton.onclick = () => startGameWithMode('ai-coop');

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mode-buttons-container';
    buttonContainer.appendChild(p1Button);
    buttonContainer.appendChild(p2Button);
    buttonContainer.appendChild(aiButton);

    // Add to message box
    messageText.appendChild(buttonContainer);

    messageBox.style.display = 'flex';
    gamePaused = true;

    // Add entrance animations
    setTimeout(() => {
        p1Button.classList.add('animate-in');
        setTimeout(() => {
            p2Button.classList.add('animate-in');
            setTimeout(() => {
                aiButton.classList.add('animate-in');
            }, 200);
        }, 200);
    }, 100);
}

let animationFrameId = null;
let isPaused = false;
let pauseOverlay = null;

// Main game loop
function gameLoop(timestamp) {
    if (isPaused) return; // <--- Add this line
    if (!gameRunning || gamePaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    
    // Calculate delta time for frame-rate independence
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
        deltaTime = 1; // Use default 1 on first frame
    } else {
        const elapsed = timestamp - lastFrameTime;
        deltaTime = elapsed / (1000 / targetFPS); // Normalize to 60 FPS
        lastFrameTime = timestamp;
        
        // Cap delta time to prevent huge jumps (e.g., when tab is inactive)
        if (deltaTime > 3 || deltaTime <= 0) deltaTime = 1;
    }
    
    // Cache current time once per frame for all subsystems
    frameTime = Date.now();

    // Clear canvas using centralized function from ui.js
    if (gameFunctions.clearCanvas) {
        clearCanvas();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draw your game objects (bubbles, players, etc) here
    updateGameSystems();
    checkLevelComplete();
    checkGameOver();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Consolidated update function - uses cached function validation
function updateGameSystems() {
    if (gameFunctions.handleInput) handleInput();
    if (gameFunctions.updatePlayers) updatePlayers();
    if (gameFunctions.updateBubbles) updateBubbles();
    if (gameFunctions.updateProjectiles) updateProjectiles();
    if (gameFunctions.updatePowerUps) updatePowerUps();
    if (gameFunctions.updateRescueBubbles) updateRescueBubbles();
    if (gameFunctions.updateParticles) updateParticles();
    if (gameFunctions.updateFloatingTexts) updateFloatingTexts();
    if (gameFunctions.checkCollisions) checkCollisions();
    if (gameFunctions.checkRescueBubbleCollisions) checkRescueBubbleCollisions();
    if (gameMode === 'ai-coop' && typeof updateAI === 'function') updateAI();
    if (gameFunctions.drawEverything) drawEverything();
}

// Level completion check - delegates to levels.js for comprehensive logic
// The checkLevelComplete() function in levels.js handles:
// - Level completion detection
// - Score bonuses (time bonus, level bonus)
// - Game completion after level 10
// - Level transition messages

// Start next level
function startNextLevel() {
    clearGameObjects();
    
    // Clear all power-up timers and effects
    if (gameFunctions.clearAllPlayerPowerUps) clearAllPlayerPowerUps();

    // Clear bubble speed effects before level transition
    if (gameFunctions.resetBubbleSpeedEffect) resetBubbleSpeedEffect();
    
    // Reset players for level transition (keeps lives, score, but resets power-ups and positions)
    if (gameFunctions.resetPlayers) {
        resetPlayers('level-transition');
    }
    initializeLevel();
    levelTransitioning = false;
    gameRunning = true;
    gamePaused = false;
}

// Power-up timer clearing is now centralized in powerups.js removePowerUp() function

// Game over logic
function checkGameOver() {
    let allPlayersOut = false;
    if (gameMode === 'single') {
        allPlayersOut = !player1.active;
    } else if (gameMode === 'ai-coop') {
        allPlayersOut = !player1.active && !player2.active;
    } else {
        allPlayersOut = players.every(p => !p.active);
    }

    if (allPlayersOut && gameRunning) {
        gameRunning = false;
        gameOver = true;
        
        // Stop background music
        if (typeof stopBackgroundMusic === 'function') {
            stopBackgroundMusic();
        }
        
        // Clear all power-up timers
        if (gameFunctions.clearAllPlayerPowerUps) clearAllPlayerPowerUps();
        
        // Clear rescue bubbles on game over
        if (gameFunctions.clearAllRescueBubbles) {
            clearAllRescueBubbles();
        }
        
        if (gameFunctions.playSound) playSound('gameover');
        showGameOverMessage();
    }
}

// Show game over message with scores
function showGameOverMessage() {
    let message = '';
    if (gameMode === 'single') {
        message = `Game Over!\n\nYour Score: ${player1.score}`;
    } else if (gameMode === 'ai-coop') {
        const totalScore = player1.score + player2.score;
        message = `Game Over!\n\nYour Score: ${player1.score}\nAI Score: ${player2.score}\nTeam Total: ${totalScore}`;
    } else {
        const player1Score = player1.score;
        const player2Score = player2.score;
        message = 'Game Over!\n\n';
        if (player1Score > player2Score) {
            message += `Player 1 wins!\nPlayer 1: ${player1Score}\nPlayer 2: ${player2Score}`;
        } else if (player2Score > player1Score) {
            message += `Player 2 wins!\nPlayer 1: ${player1Score}\nPlayer 2: ${player2Score}`;
        } else {
            message += `It's a tie!\nBoth players scored: ${player1Score}`;
        }
    }
    showMessage(message, 'Play Again', () => {
        hideMessage();
        startNewGame();
    });
}

// Start new game
function startNewGame() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Clear any lingering power-up timers
    if (gameFunctions.clearAllPlayerPowerUps) clearAllPlayerPowerUps();
    
    // Clear rescue bubbles on game restart
    if (gameFunctions.clearAllRescueBubbles) {
        clearAllRescueBubbles();
    }
    
    // Clear bubble speed effects on new game
    if (gameFunctions.resetBubbleSpeedEffect) {
        resetBubbleSpeedEffect();
    }
    
    if (gameFunctions.resetBubbleSpeed) {
        resetBubbleSpeed();
    }
    
    gameRunning = true;
    gamePaused = false;
    gameOver = false;
    levelTransitioning = false;
    currentLevel = 1;
    
    // Use unified player reset function from player.js
    if (gameFunctions.resetPlayers) {
        resetPlayers('new-game');
    }
    
    // Handle AI initialization for ai-coop mode
    if (gameMode === 'ai-coop') {
        if (typeof initializeAI === 'function') {
            initializeAI();
        }
    } else if (gameMode === 'single') {
        if (typeof disableAI === 'function') {
            disableAI();
        }
    } else {
        if (typeof disableAI === 'function') {
            disableAI();
        }
    }
    
    if (gameFunctions.startLevel) {
        startLevel(1);
    } else {
        initializeLevel();
    }
    
    // Start background music
    if (typeof playBackgroundMusic === 'function') {
        playBackgroundMusic();
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Helper functions
function clearGameObjects() {
    players.forEach(p => p.projectiles = []);
    particles.length = 0;
    powerUps.length = 0;
    if (typeof floatingTexts !== 'undefined') floatingTexts.length = 0;
    obstacles = [];
    bubbles = [];
    
    // Clear rescue bubbles when clearing all game objects
    if (gameFunctions.clearAllRescueBubbles) {
        clearAllRescueBubbles();
    }

    if (typeof hidePowerUpTimer === 'function') {
        hidePowerUpTimer();
    }
}

function initializeLevel() {
    // Obstacles are initialized in obstacles.js
    if (gameFunctions.initializeObstacles) {
        initializeObstacles();
    }
    if (gameFunctions.initializeLevelBubbles) {
        initializeLevelBubbles();
    }
}

// Player reset is now handled by resetPlayers() in player.js
// Call with mode: 'new-game', 'level-transition', or 'position-only'


function togglePause() {
    isPaused = !isPaused;
    gamePaused = isPaused;
    if (isPaused) {
        showPauseOverlay();
        if (typeof stopBackgroundMusic === 'function') {
            stopBackgroundMusic();
        }
    } else {
        hidePauseOverlay();
        if (typeof playBackgroundMusic === 'function') {
            playBackgroundMusic();
        }
        lastFrameTime = 0;
        requestAnimationFrame(gameLoop);
    }
}

function showPauseOverlay() {
    if (!pauseOverlay) pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) pauseOverlay.style.display = 'flex';
}

function hidePauseOverlay() {
    if (!pauseOverlay) pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) pauseOverlay.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    pauseOverlay = document.getElementById('pauseOverlay');

    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            isPaused = false;
            hidePauseOverlay();
            showModeSelectPrompt(); // Return to mode selection
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyP') {
            togglePause();
        }
        if (e.code === 'KeyR') {
            isPaused = false;
            hidePauseOverlay();
            showModeSelectPrompt(); // Return to mode selection
        }
        if (e.code === 'KeyM') {
            // Use direct toggle instead of clicking button
            if (typeof toggleSound === 'function') {
                toggleSound();
            }
        }
    });
});

