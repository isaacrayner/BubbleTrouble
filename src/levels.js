// Level configuration and management

function getLevelConfig(level) {
    // Ensure level is a valid number
    level = Math.max(1, Math.floor(level) || 1);
    
    // Level progression with validation
    if (level === 1) {
        return {
            bubbleCount: 1,
            speed: 1.0,
            size: 40,
            hasObstacle: true
        };
    } else if (level <= 5) {
        return {
            bubbleCount: Math.max(1, 1 + Math.floor((level - 1) / 1)), // 1, 2, 3, 4, 5 bubbles
            speed: Math.max(0.5, 1.0 + (level - 1) * 0.15),
            size: Math.max(15, Math.min(60, 40 - (level - 1) * 2)),
            hasObstacle: true
        };
    } else if (level <= 10) {
        return {
            bubbleCount: Math.max(2, 3 + Math.floor((level - 6) / 2)), // 3-6 bubbles
            speed: Math.max(0.5, 1.75 + (level - 5) * 0.1),
            size: Math.max(15, Math.min(40, 30 - Math.floor((level - 5) / 2))),
            hasObstacle: true
        };
    } else {
        // Game should end after level 10
        return null;
    }
}

function initializeLevelBubbles() {
    bubbles = [];
    const config = getLevelConfig(currentLevel);
    
    if (!config) {
        // No more levels - game complete!
        gameComplete();
        return;
    }
    
    console.log(`Level ${currentLevel}: Creating ${config.bubbleCount} bubbles`);
    
    // Validate canvas dimensions
    if (!canvas || !isFinite(canvas.width) || !isFinite(canvas.height)) {
        console.error('Invalid canvas dimensions');
        return;
    }
    
    // Boss level: create one giant bubble
    const isBossLevel = (currentLevel > 1 && currentLevel % 5 === 0);
    console.log(`initializeBubbles: currentLevel=${currentLevel}, isBossLevel=${isBossLevel}`);
    if (isBossLevel) {
        const bossSize = 80; // Giant bubble
        const x = canvas.width / 2;
        const y = canvas.height / 3;
        const bossBubble = new Bubble(x, y, bossSize, config.speed, 'boss');
        if (isFinite(bossBubble.x) && isFinite(bossBubble.y) && isFinite(bossBubble.radius)) {
            bubbles.push(bossBubble);
            console.log(`Boss bubble created at (${x}, ${y}) with size ${bossSize}`);
        }
        console.log(`Boss level - returning early. Bubbles array length: ${bubbles.length}`);
        return; // Only the boss bubble
    }
    
    // 20% chance for a golden bubble (1 in 5 bubbles)
    const goldenBubbleIndex = Math.random() < 0.2 ? Math.floor(Math.random() * config.bubbleCount) : -1;
    
    for (let i = 0; i < config.bubbleCount; i++) {
        // Calculate safe position
        const x = Math.max(config.size, Math.min(canvas.width - config.size, 
            (canvas.width / (config.bubbleCount + 1)) * (i + 1)));
        const y = Math.max(config.size, canvas.height / 4);
        
        // Create golden bubble or normal bubble
        const bubbleType = (i === goldenBubbleIndex) ? 'golden' : 'normal';
        const bubble = new Bubble(x, y, config.size, config.speed, bubbleType);
        
        // Validate bubble before adding
        if (isFinite(bubble.x) && isFinite(bubble.y) && isFinite(bubble.radius)) {
            bubbles.push(bubble);
        } else {
            console.error('Invalid bubble created:', bubble);
        }
    }
    
    console.log(`Successfully created ${bubbles.length} bubbles for level ${currentLevel}`);
}

function checkLevelComplete() {
    // Only check if game is running and not transitioning
    if (!gameRunning || levelTransitioning) {
        return;
    }
    
    // Check if all bubbles are destroyed
    if (bubbles.length === 0) {
        console.log(`Level ${currentLevel} completed! Bubbles remaining: ${bubbles.length}`);
        
        levelTransitioning = true;
        gameRunning = false;
        
        // Calculate bonuses
        const levelTime = (Date.now() - levelStartTime) / 1000;
        let timeBonus = Math.max(0, 5000 - (Date.now() - levelStartTime));
        const levelBonus = currentLevel * 1000;
        
        // Extra bonus for time challenge completion
        let challengeBonus = 0;
        let bonusMessage = '';
        if (isTimeChallengeLevel && levelTime < levelTimeLimit) {
            challengeBonus = 5000;
            const remainingTime = (levelTimeLimit - levelTime).toFixed(1);
            bonusMessage = `\n⏱️ TIME CHALLENGE COMPLETE! +${challengeBonus} bonus!\n${remainingTime}s remaining!`;
        }
        
        // Add bonuses to both players if they're active
        const score1El = document.getElementById('score1');
        const score2El = document.getElementById('score2');

        if (player1.active) {
            player1.score += timeBonus + levelBonus + challengeBonus;
            if (score1El) score1El.textContent = player1.score;
            else console.warn("UI element score1 not found for update.");
        }
        
        if (gameMode === 'multi' && player2.active) {
            player2.score += timeBonus + levelBonus + challengeBonus;
            if (score2El) score2El.textContent = player2.score;
            else console.warn("UI element score2 not found for update.");

        }
        
        playSound('levelup');
        
        // Check if this was the final level
        if (currentLevel >= 10) {
            gameComplete();
        } else {
            // Advance to next level
            currentLevel++;
            
            // Show level complete message
            showMessage(
                `Level ${currentLevel - 1} Complete!\nTime Bonus: ${Math.floor(timeBonus)}\nLevel Bonus: ${levelBonus}${bonusMessage}\n\nStarting Level ${currentLevel}...`,
                'Continue',
                () => {
                    hideMessage();
                    startLevel(currentLevel);
                }
            );
        }
    }
}

function gameComplete() {
    console.log('Game Complete!');
    
    gameRunning = false;
    levelTransitioning = false;
    gameOver = true;
    
    // Stop background music
    if (typeof stopBackgroundMusic === 'function') {
        stopBackgroundMusic();
    }
    
    // Calculate final scores
    const player1FinalScore = player1.score;
    const player2FinalScore = ((gameMode === 'multi' || gameMode === 'ai-coop') && player2) ? player2.score : 0;
    
    // Determine winner
    let winnerMessage = '';
    if (gameMode === 'single') {
        winnerMessage = `Your Final Score: ${player1FinalScore}`;
    } else if (gameMode === 'ai-coop') {
        winnerMessage = `Your Score: ${player1FinalScore}\nAI Score: ${player2FinalScore}\nTeam Total: ${player1FinalScore + player2FinalScore}`;
    } else {
        if (player1FinalScore > player2FinalScore) {
            winnerMessage = `Player 1 Wins!\nPlayer 1: ${player1FinalScore}\nPlayer 2: ${player2FinalScore}`;
        } else if (player2FinalScore > player1FinalScore) {
            winnerMessage = `Player 2 Wins!\nPlayer 2: ${player2FinalScore}\nPlayer 1: ${player1FinalScore}`;
        } else {
            winnerMessage = `It's a Tie!\nBoth scored: ${player1FinalScore}`;
        }
    }

    // Record the high score for this completed run
    const isNewHighScore = typeof updateHighScore === 'function' && updateHighScore();
    const highScoreLine = isNewHighScore
        ? `\n\n🏆 NEW HIGH SCORE! 🏆\nBest: ${highScore}`
        : `\n\nBest: ${highScore}`;
    
    playSound('levelup'); // Use levelup sound for game completion
    
    showMessage(
        `🎉 GAME COMPLETE! 🎉\n\nYou've beaten all 10 levels!\n\n${winnerMessage}${highScoreLine}\n\nCongratulations!`,
        'Play Again',
        () => {
            hideMessage();
            startNewGame();
        }
    );
}

function startLevel(level) {
    console.log(`Starting level ${level}`);
    
    currentLevel = Math.max(1, level);
    levelTransitioning = false;
    
    // Every 5th level is a boss level (5, 10)
    const isBossLevel = (currentLevel > 1 && currentLevel % 5 === 0);
    
    // A level is a time challenge if it's the level right before a boss level, or a multiple of 3.
    // A boss level cannot be a time challenge.
    isTimeChallengeLevel = !isBossLevel && (currentLevel > 1 && (currentLevel % 3 === 0 || (currentLevel + 1) % 5 === 0));
    levelTimeLimit = isTimeChallengeLevel ? 45 : 0; // 45 seconds for challenge levels
    
    // Check if level exists
    const config = getLevelConfig(currentLevel);
    if (!config) {
        console.warn(`No config for level ${currentLevel}, game complete!`);
        gameComplete();
        return;
    }

    const initializeAndStartLevel = () => {
        // Update level display
        const levelDisplay = document.getElementById('levelDisplay');
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${currentLevel}${isTimeChallengeLevel ? ' ⏱️' : ''}`;
        } else {
            console.log("Level display element not found - skipping UI update");
        }
        
        // Clear existing game objects
        bubbles = [];
        powerUps.length = 0;
        particles.length = 0;
        obstacles = [];
        
        // Reset player projectiles
        player1.projectiles = [];
        if (player2) {
            player2.projectiles = [];
        }
        
        // Initialize level
        if (typeof initializeObstacles === 'function') {
            initializeObstacles();
        }
        initializeLevelBubbles();
        
        // Resume game
        levelStartTime = Date.now(); // Reset timer after intro
        gameRunning = true;
        gamePaused = false;
        
        console.log(`Level ${currentLevel} started with ${bubbles.length} bubbles`);
    };

    // Show boss intro for boss levels
    if (isBossLevel && typeof showBossIntro === 'function') {
        showBossIntro(initializeAndStartLevel);
    }
    // Show time challenge announcement
    else if (isTimeChallengeLevel && typeof showTimeChallengeIntro === 'function') {
        showTimeChallengeIntro(initializeAndStartLevel);
    }
    else {
        initializeAndStartLevel();
    }
}

console.log("=== LEVELS.JS LOADED ===");