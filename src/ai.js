// AI Co-Op Player Logic

// AI state and configuration
const AI_CONFIG = {
    reactionTime: 50,            // ms delay before AI reacts (reduced for smoother response)
    movementPrecision: 0.85,     // How accurate AI movement is (0-1)
    shootingAccuracy: 0.75,      // How accurate AI shooting is (0-1)
    aggressiveness: 0.7,         // How aggressive vs defensive (0-1)
    helpfulness: 0.9,            // Priority on helping human player (0-1)
    decisionInterval: 50,        // ms between AI decisions (reduced for smoother movement)
    predictBubbles: true,        // Whether AI predicts bubble trajectories
    avoidObstacles: true,        // Whether AI avoids obstacles
};

let aiEnabled = false;
let aiDecisionTimer = null;
let aiCurrentTarget = null;
let aiLastDecisionTime = 0;
let aiReactionDelay = 0;

// AI Player reference (will be player2)
let aiPlayer = null;

// Initialize AI Co-Op mode
function initializeAI() {
    aiEnabled = true;
    aiPlayer = player2;
    aiCurrentTarget = null;
    aiReactionDelay = 0; // Start with no delay so AI acts immediately

    // Start AI decision-making loop
    startAILoop();
}

// Disable AI
function disableAI() {
    aiEnabled = false;
    if (aiDecisionTimer) {
        clearInterval(aiDecisionTimer);
        aiDecisionTimer = null;
    }
    // Stop all AI movement
    stopAIMovement();
    aiPlayer = null;
    aiCurrentTarget = null;
}

// Main AI decision-making loop
function startAILoop() {
    if (aiDecisionTimer) {
        clearInterval(aiDecisionTimer);
    }

    // Ensure AI keys are clean on start
    stopAIMovement();

    aiDecisionTimer = setInterval(() => {
        if (aiEnabled && gameRunning && !gamePaused && aiPlayer && aiPlayer.active) {
            makeAIDecision();
        } else {
            // Stop movement if conditions aren't met
            stopAIMovement();
        }
    }, AI_CONFIG.decisionInterval);
}

// Core AI decision-making
function makeAIDecision() {
    const now = Date.now();

    // Add reaction delay for more human-like behavior (only block if recently acted)
    if (now < aiReactionDelay) {
        return;
    }

    // Update reaction delay for next decision
    aiReactionDelay = now + AI_CONFIG.reactionTime;

    // Evaluate threats and opportunities
    const threats = evaluateThreats();
    const opportunities = evaluateOpportunities();

    // Check boundaries first - prevent going off screen
    if (aiPlayer && aiPlayer.x < 30) {
        // Too close to left edge, move right
        keys['KeyA'] = false;
        keys['KeyD'] = true;
        return;
    } else if (aiPlayer && aiPlayer.x + aiPlayer.width > canvas.width - 30) {
        // Too close to right edge, move left
        keys['KeyA'] = true;
        keys['KeyD'] = false;
        return;
    }

    // Decide action based on situation - prioritize offense over defense
    if (threats.immediate) {
        // Emergency evasion only for extremely close bubbles
        handleThreat(threats.immediate);
    } else if (opportunities.bubbles.length > 0) {
        // Primary focus: shoot bubbles aggressively
        handleBubbles(opportunities.bubbles);
    } else if (opportunities.powerup) {
        // Go for power-up when no bubbles to shoot
        handlePowerUp(opportunities.powerup);
    } else if (opportunities.rescue) {
        // Help downed human player
        handleRescue(opportunities.rescue);
    } else if (threats.nearby.length > 0) {
        // Only worry about nearby threats if nothing else to do
        handleNearbyThreats(threats.nearby);
    } else {
        // Default: patrol and look for targets
        handleDefaultPositioning();
    }

    aiLastDecisionTime = now;
}

// Evaluate threats around AI
function evaluateThreats() {
    const threats = {
        immediate: null,
        nearby: []
    };

    if (!aiPlayer || !aiPlayer.active) return threats;

    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;
    const aiCenterY = aiPlayer.y + aiPlayer.height / 2;
    const dangerRadius = 50;  // Reduced - only avoid very close bubbles
    const immediateRadius = 30; // Only emergency evasion for extremely close bubbles

    bubbles.forEach(bubble => {
        const bubbleCenterX = bubble.x + bubble.radius;
        const bubbleCenterY = bubble.y + bubble.radius;
        const distance = Math.hypot(bubbleCenterX - aiCenterX, bubbleCenterY - aiCenterY);

        if (distance < immediateRadius) {
            if (!threats.immediate || distance < threats.immediate.distance) {
                threats.immediate = { bubble, distance };
            }
        } else if (distance < dangerRadius) {
            threats.nearby.push({ bubble, distance });
        }
    });

    // Sort nearby threats by distance
    threats.nearby.sort((a, b) => a.distance - b.distance);

    return threats;
}

// Evaluate opportunities
function evaluateOpportunities() {
    const opportunities = {
        bubbles: [],
        powerup: null,
        rescue: null
    };

    if (!aiPlayer || !aiPlayer.active) return opportunities;

    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;

    // Check if bubbles array exists
    if (typeof bubbles === 'undefined' || !bubbles) {
        return opportunities;
    }

    // Find shootable bubbles
    bubbles.forEach(bubble => {
        // FIXED: Bubbles have 'radius' property, not 'size'
        const bubbleX = bubble.x; // bubble.x is the center position
        const horizontalDist = Math.abs(bubbleX - aiCenterX);
        const isInRange = horizontalDist < 300; // Increased range for easier targeting

        if (isInRange) {
            opportunities.bubbles.push({
                bubble,
                distance: horizontalDist,
                priority: calculateBubblePriority(bubble)
            });
        }
    });

    // Sort bubbles by priority
    opportunities.bubbles.sort((a, b) => b.priority - a.priority);

    // Find power-ups
    if (powerUps.length > 0 && Math.random() < AI_CONFIG.aggressiveness) {
        const nearestPowerUp = findNearestPowerUp();
        if (nearestPowerUp) {
            opportunities.powerup = nearestPowerUp;
        }
    }

    // Check if human player needs rescue
    if (gameMode === 'ai-coop' && player1 && !player1.active) {
        if (typeof rescueBubbles !== 'undefined' && rescueBubbles.length > 0) {
            opportunities.rescue = rescueBubbles[0];
        }
    }

    return opportunities;
}

// Calculate bubble priority (higher = more important to shoot)
function calculateBubblePriority(bubble) {
    let priority = 0;

    // Larger bubbles = higher priority (more points, spawn more bubbles)
    priority += bubble.radius / 10;

    // Lower bubbles = higher priority (more dangerous)
    priority += (canvas.height - bubble.y) / 100;

    // Bubbles near human player = higher priority (protective)
    if (player1 && player1.active) {
        const distToHuman = Math.hypot(
            (bubble.x + bubble.radius) - (player1.x + player1.width / 2),
            (bubble.y + bubble.radius) - (player1.y + player1.height / 2)
        );
        if (distToHuman < 200) {
            priority += (200 - distToHuman) / 50 * AI_CONFIG.helpfulness;
        }
    }

    return priority;
}

// Handle immediate threat
function handleThreat(threat) {
    if (!aiPlayer || !aiPlayer.active) return;

    const bubbleX = threat.bubble.x + threat.bubble.radius;
    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;

    // Move away from bubble
    if (bubbleX > aiCenterX) {
        // Bubble on right, move left
        keys['KeyA'] = true;
        keys['KeyD'] = false;
    } else {
        // Bubble on left, move right
        keys['KeyA'] = false;
        keys['KeyD'] = true;
    }

    // Try to shoot it while evading
    if (canAIShoot() && Math.random() < 0.7) {
        attemptAIShoot();
    }
}

// Handle nearby threats
function handleNearbyThreats(threats) {
    if (!aiPlayer || !aiPlayer.active || threats.length === 0) return;

    const closestThreat = threats[0];
    const bubbleX = closestThreat.bubble.x + closestThreat.bubble.radius;
    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;
    const horizontalDist = Math.abs(bubbleX - aiCenterX);

    if (horizontalDist < 30) {
        // Position to shoot
        stopAIMovement();
        if (canAIShoot()) {
            attemptAIShoot();
        }
    } else {
        // Move to position
        if (bubbleX > aiCenterX) {
            keys['KeyA'] = false;
            keys['KeyD'] = true;
        } else {
            keys['KeyA'] = true;
            keys['KeyD'] = false;
        }
    }
}

// Handle rescue mission
function handleRescue(rescueBubble) {
    if (!aiPlayer || !aiPlayer.active || !rescueBubble) return;

    const rescueX = rescueBubble.x + rescueBubble.size;
    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;
    const horizontalDist = Math.abs(rescueX - aiCenterX);

    if (horizontalDist < 20) {
        // In position, shoot!
        stopAIMovement();
        if (canAIShoot()) {
            attemptAIShoot();
        }
    } else {
        // Move toward rescue bubble
        if (rescueX > aiCenterX) {
            keys['KeyA'] = false;
            keys['KeyD'] = true;
        } else {
            keys['KeyA'] = true;
            keys['KeyD'] = false;
        }
    }
}

// Handle power-up collection
function handlePowerUp(powerup) {
    if (!aiPlayer || !aiPlayer.active || !powerup) return;

    const powerupX = powerup.x + powerup.width / 2;
    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;
    const horizontalDist = Math.abs(powerupX - aiCenterX);

    if (horizontalDist < 10) {
        stopAIMovement();
    } else {
        if (powerupX > aiCenterX) {
            keys['KeyA'] = false;
            keys['KeyD'] = true;
        } else {
            keys['KeyA'] = true;
            keys['KeyD'] = false;
        }
    }
}

// Handle bubble shooting - SIMPLIFIED VERSION
function handleBubbles(bubbleTargets) {
    if (!aiPlayer || !aiPlayer.active || bubbleTargets.length === 0) return;

    const target = bubbleTargets[0]; // Highest priority
    const bubbleX = target.bubble.x; // Bubble x is already center position
    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;
    const horizontalDist = Math.abs(bubbleX - aiCenterX);

    // Move toward the bubble
    if (horizontalDist > 10) { // Small dead zone to prevent jitter
        if (bubbleX > aiCenterX) {
            keys['KeyA'] = false;
            keys['KeyD'] = true;
        } else {
            keys['KeyA'] = true;
            keys['KeyD'] = false;
        }
    } else {
        // Stop moving when very close
        keys['KeyA'] = false;
        keys['KeyD'] = false;
    }

    // Shoot whenever reasonably aligned (within 100px)
    if (horizontalDist < 100 && canAIShoot()) {
        attemptAIShoot();
    }
}

// Handle default positioning (patrol behavior)
function handleDefaultPositioning() {
    if (!aiPlayer || !aiPlayer.active) return;

    // Create patrol pattern - move between left third and right third of screen
    const now = Date.now();
    const patrolCycle = 6000; // 6 second cycle
    const cyclePosition = (now % patrolCycle) / patrolCycle; // 0 to 1

    let targetX;
    if (cyclePosition < 0.5) {
        // Move toward right side (70% of screen width)
        targetX = canvas.width * 0.7;
    } else {
        // Move toward left side (30% of screen width)
        targetX = canvas.width * 0.3;
    }

    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;
    const dist = Math.abs(targetX - aiCenterX);

    if (dist < 30) {
        // Close enough to target, keep patrolling gently
        if (cyclePosition < 0.5) {
            keys['KeyA'] = false;
            keys['KeyD'] = true;
        } else {
            keys['KeyA'] = true;
            keys['KeyD'] = false;
        }
    } else {
        // Move toward target
        if (targetX > aiCenterX) {
            keys['KeyA'] = false;
            keys['KeyD'] = true;
        } else {
            keys['KeyA'] = true;
            keys['KeyD'] = false;
        }
    }
}

// Check if AI can shoot
function canAIShoot() {
    if (!aiPlayer || !aiPlayer.active) return false;

    const now = Date.now();
    const timeSinceLastShot = now - (aiPlayer.lastShootTime || 0);
    return timeSinceLastShot >= aiPlayer.shootCooldown &&
           aiPlayer.projectiles.length < aiPlayer.maxProjectiles;
}

// Attempt to shoot
function attemptAIShoot() {
    if (!canAIShoot()) return;

    // Add slight inaccuracy
    if (Math.random() > AI_CONFIG.shootingAccuracy) {
        return; // Miss this shot
    }

    // Directly call shootProjectile instead of simulating key press
    if (typeof shootProjectile === 'function' && aiPlayer) {
        shootProjectile(aiPlayer);
    }

    // Add reaction delay
    aiReactionDelay = Date.now() + AI_CONFIG.reactionTime;
}

// Stop AI movement
function stopAIMovement() {
    keys['KeyA'] = false;
    keys['KeyD'] = false;
}

// Check if AI is near boundaries
function isNearBoundary() {
    if (!aiPlayer) return false;
    const margin = 50;
    return aiPlayer.x < margin || aiPlayer.x + aiPlayer.width > canvas.width - margin;
}

// Find nearest power-up
function findNearestPowerUp() {
    if (!aiPlayer || !aiPlayer.active || powerUps.length === 0) return null;

    const aiCenterX = aiPlayer.x + aiPlayer.width / 2;
    let nearest = null;
    let minDist = Infinity;

    powerUps.forEach(powerup => {
        const dist = Math.abs((powerup.x + powerup.width / 2) - aiCenterX);
        if (dist < minDist) {
            minDist = dist;
            nearest = powerup;
        }
    });

    return nearest;
}

// Update AI (called from main game loop)
function updateAI() {
    if (!aiEnabled || !gameRunning || gamePaused) return;
    if (!aiPlayer || !aiPlayer.active) return;

    // AI is managed by the decision loop
    // This function is here for any per-frame updates if needed
}

// Draw AI indicator
function drawAIIndicator() {
    if (!aiEnabled || !aiPlayer || !aiPlayer.active) return;

    ctx.save();
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    const text = '🤖 AI';
    const x = canvas.width - 10;
    const y = 140;

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
}
