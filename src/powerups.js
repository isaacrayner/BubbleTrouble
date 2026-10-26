// Power-up system

// Track all active timers to prevent race conditions
const activeTimers = new Set();

function clearAllActiveTimers() {
    activeTimers.forEach(timerId => clearTimeout(timerId));
    activeTimers.clear();
}

// Update powerup timer displays for all players
function updatePlayerPowerUps() {
    updateAllPowerUpTimers(player1);
    if (gameMode === 'multi' || gameMode === 'ai-coop') {
        updateAllPowerUpTimers(player2);
    }
}

const POWER_UP_TYPES = [
    'rapid_fire',
    'wide_shot',
    'shield',
    'extra_life',
    'slowBubbles',
    'fastBullets',
    'speed_boost'
];

function createPowerUp(x, y) {
    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    const powerUp = {
        x: x - 15,
        y: y - 15,
        width: 30,
        height: 30,
        type,
        dx: (Math.random() - 0.5) * 4,
        dy: -Math.random() * 3 - 1,
        pulsePhase: Math.random() * Math.PI * 2,
        fadeStartTime: null,
        createdAt: Date.now(),
        lifeTime: 15000
    };
    powerUps.push(powerUp);
}

function updatePowerUps() {
    // Update power-up physics and animations
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];

        // Update animation
        if (powerUp.pulsePhase !== undefined) {
            powerUp.pulsePhase += 0.1;
        }

        // Apply physics - movement and gravity (delta-time normalized)
        powerUp.x += powerUp.dx * deltaTime;
        powerUp.y += powerUp.dy * deltaTime;
        powerUp.dy += 0.5 * deltaTime; // Gravity
        powerUp.dx *= Math.pow(0.98, deltaTime); // Air resistance

        // Bounce off canvas edges
        if (powerUp.x <= 0 || powerUp.x + powerUp.width >= canvas.width) {
            powerUp.dx *= -0.7;
            powerUp.x = Math.max(0, Math.min(canvas.width - powerUp.width, powerUp.x));
        }

        // Bounce off ground
        if (powerUp.y + powerUp.height >= canvas.height) {
            powerUp.y = canvas.height - powerUp.height;
            powerUp.dy *= -0.6;
            powerUp.dx *= 0.8;

            // Stop bouncing if velocity is too low
            if (Math.abs(powerUp.dy) < 1) {
                powerUp.dy = 0;
            }
        }

        // Remove power-ups that are too old (use frameTime cached once per frame)
        if (frameTime - powerUp.createdAt > powerUp.lifeTime) {
            powerUps.splice(i, 1);
        }
    }
    // Update active powerup timers & HUD
    updatePlayerPowerUps();
}

function drawPowerUps() {
    powerUps.forEach(p => {
        if (p.x === undefined || p.y === undefined || !p.width || !p.height || !p.type) return;
        const centerX = p.x + p.width / 2, centerY = p.y + p.height / 2;
        const pulseSize = 2 + Math.sin(p.pulsePhase) * 3;
        const baseSize = p.width / 2, currentRadius = baseSize + pulseSize;
        if (!isFinite(centerX) || !isFinite(centerY) || !isFinite(currentRadius) || currentRadius <= 0) return;

        // Color and symbol
        let color = '#4ecdc4', glowColor = 'rgba(78,205,196,0.5)', symbol = '?';
        switch (p.type) {
            case 'rapid_fire': color = '#ff6b6b'; glowColor = 'rgba(255,107,107,0.5)'; symbol = 'R'; break;
            case 'wide_shot': color = '#4ecdc4'; glowColor = 'rgba(78,205,196,0.5)'; symbol = 'W'; break;
            case 'shield': color = '#45b7d1'; glowColor = 'rgba(69,183,209,0.5)'; symbol = 'S'; break;
            case 'extra_life': color = '#f9ca24'; glowColor = 'rgba(249,202,36,0.5)'; symbol = 'L'; break;
            case 'slowBubbles': color = '#b388ff'; glowColor = 'rgba(179,136,255,0.5)'; symbol = '⏳'; break;
            case 'fastBullets': color = '#ffb300'; glowColor = 'rgba(255,179,0,0.5)'; symbol = 'F'; break;
            case 'speed_boost': color = '#f9ca24'; glowColor = 'rgba(249,202,36,0.5)'; symbol = '⚡'; break;
        }

        try {
            const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentRadius + 8);
            glowGradient.addColorStop(0, glowColor);
            glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius + 8, 0, Math.PI * 2);
            ctx.fill();

            const bodyGradient = ctx.createRadialGradient(centerX - currentRadius * 0.3, centerY - currentRadius * 0.3, 0, centerX, centerY, currentRadius);
            bodyGradient.addColorStop(0, color);
            bodyGradient.addColorStop(1, color + '88');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        } catch {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.fillText(symbol, centerX, centerY);
        ctx.restore();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function playerCollidesWithPowerUp(player, p) {
    return player.x < p.x + p.width && player.x + player.width > p.x &&
           player.y < p.y + p.height && player.y + player.height > p.y;
}

function applyPowerUp(player, type) {
    // Initialize activePowerUps array if it doesn't exist
    if (!player.activePowerUps) {
        player.activePowerUps = [];
    }

    // Handle extra_life immediately (instant effect)
    if (type === 'extra_life') {
        player.lives++;
        return;
    }

    let specificDuration = POWER_UP_DURATION; // Default duration

    // Apply the powerup effect
    switch (type) {
        case 'rapid_fire':
            player.shootCooldown = 80;
            player.maxProjectiles = RAPID_FIRE_MAX_PROJECTILES;
            break;

        case 'wide_shot':
            player.currentProjectileWidth = PROJECTILE_WIDTH * 5;
            break;

        case 'shield':
            player.hasShield = true;
            break;

        case 'slowBubbles':
            slowAllBubbles();
            specificDuration = 3000;
            break;

        case 'fastBullets':
            player.projectileSpeedMultiplier = 5;
            break;
        case 'speed_boost':
            player.speed = PLAYER_SPEED * 2.5;
            break;
    }

    // Create powerup entry with timer
    const endTime = Date.now() + specificDuration;
    const timer = setTimeout(() => {
        removeSpecificPowerUp(player, type);
    }, specificDuration);

    activeTimers.add(timer);

    // Add to active powerups
    player.activePowerUps.push({
        type: type,
        endTime: endTime,
        timer: timer,
        duration: specificDuration
    });

    // Keep legacy activePowerUp for backward compatibility (use first powerup)
    player.activePowerUp = type;
    player.powerUpEndTime = endTime;
    player.currentPowerUpDuration = specificDuration;

    // Show power-up timer UI
    if (typeof showPowerUpTimer === 'function') {
        showPowerUpTimer(player, type);
    }
}

function removeSpecificPowerUp(player, type) {
    if (!player.activePowerUps) return;

    // Find and remove the powerup from the array
    const index = player.activePowerUps.findIndex(p => p.type === type);
    if (index === -1) return;

    const powerup = player.activePowerUps[index];

    // Clear the timer and remove from tracking set
    if (powerup.timer) {
        clearTimeout(powerup.timer);
        activeTimers.delete(powerup.timer);
    }

    // Remove from array
    player.activePowerUps.splice(index, 1);

    // Handle specific cleanup - but only if this powerup isn't active anymore
    const stillActive = player.activePowerUps.some(p => p.type === type);

    if (!stillActive) {
        switch (type) {
            case 'rapid_fire':
                player.shootCooldown = 250;
                player.maxProjectiles = MAX_PROJECTILES_PER_PLAYER;
                break;

            case 'wide_shot':
                player.currentProjectileWidth = PROJECTILE_WIDTH;
                break;

            case 'shield':
                player.hasShield = false;
                break;

            case 'slowBubbles':
                resetBubbleSpeedEffect();
                break;

            case 'fastBullets':
                player.projectileSpeedMultiplier = 1;
                break;
            case 'speed_boost':
                player.speed = PLAYER_SPEED;
                break;
        }
    }

    // Update legacy fields for backward compatibility
    if (player.activePowerUps.length > 0) {
        const mostRecent = player.activePowerUps[player.activePowerUps.length - 1];
        player.activePowerUp = mostRecent.type;
        player.powerUpEndTime = mostRecent.endTime;
    } else {
        player.activePowerUp = null;
        player.powerUpEndTime = null;
    }

    // Hide timer if no powerups remain
    if (player.activePowerUps.length === 0 && typeof hidePowerUpTimer === 'function') {
        hidePowerUpTimer(player.id);
    }
}

function removePowerUp(player) {
    if (!player.activePowerUps) {
        player.activePowerUps = [];
    }

    // Clear all active powerups for this player via removeSpecificPowerUp so each type's
    // cleanup runs and timers are individually removed from activeTimers.
    while (player.activePowerUps.length > 0) {
        const powerup = player.activePowerUps[0];
        removeSpecificPowerUp(player, powerup.type);
    }

    // Reset all powerup-related properties
    player.activePowerUp = null;
    player.powerUpEndTime = null;
    player.hasShield = false;
    player.shootCooldown = 250;
    player.maxProjectiles = MAX_PROJECTILES_PER_PLAYER;
    player.currentProjectileWidth = PROJECTILE_WIDTH;
    player.projectileSpeedMultiplier = 1;
    player.currentPowerUpDuration = null;

    // Hide powerup timer UI
    hidePowerUpTimer(player.id);
}

// Remove all power-ups from every player (used at level transitions and game over)
function clearAllPlayerPowerUps() {
    players.forEach(player => removePowerUp(player));
}

// Store original speeds for proper restoration
let originalBubbleSpeeds = new Map(); // Store original dx/dy for each bubble
let bubbleSlowEffectActive = false;

function slowAllBubbles() {
    if (bubbleSlowEffectActive) return;
    bubbleSlowEffectActive = true;
    originalBubbleSpeeds.clear();
    bubbles.forEach(bubble => {
        originalBubbleSpeeds.set(bubble, { dx: bubble.dx, dy: bubble.dy });
        bubble.isFrozen = true;
    });
}

function resetBubbleSpeedEffect() {
    if (!bubbleSlowEffectActive) return;
    bubbleSlowEffectActive = false;
    bubbles.forEach(bubble => {
        bubble.isFrozen = false;
        const originalSpeed = originalBubbleSpeeds.get(bubble);
        if (originalSpeed) {
            bubble.dx = originalSpeed.dx;
            bubble.dy = originalSpeed.dy;
        }
    });
    originalBubbleSpeeds.clear();
}

function showPowerUpTimer(player, powerUpType) {
    // Find existing timer container or create one
    let containerElement = document.getElementById(`powerup-timer-container-${player.id}`);

    if (!containerElement) {
        containerElement = document.createElement('div');
        containerElement.className = 'powerup-timer-container';
        containerElement.id = `powerup-timer-container-${player.id}`;
        containerElement.style.cssText = `
            position: fixed;
            ${player.id === 1 ? 'left: 20px;' : 'right: 20px;'}
            top: 120px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 999;
        `;
        document.body.appendChild(containerElement);
    }

    // Check if timer element for this powerup already exists
    let timerElement = document.getElementById(`powerup-timer-${player.id}-${powerUpType}`);
    const powerUpName = getPowerUpDisplayName(powerUpType);
    const powerUpColor = getPowerUpColor(powerUpType);

    if (!timerElement) {
        timerElement = document.createElement('div');
        timerElement.className = 'powerup-timer';
        timerElement.id = `powerup-timer-${player.id}-${powerUpType}`;
        containerElement.appendChild(timerElement);
    }

    timerElement.innerHTML = `
        <div class="powerup-timer-content">
            <div class="powerup-details">
                <div class="powerup-name">${powerUpName}</div>
                <div class="powerup-time">10.0s</div>
            </div>
            <div class="powerup-progress">
                <div class="powerup-progress-bar" style="width: 100%; background: ${powerUpColor};"></div>
            </div>
        </div>
    `;

    return timerElement;
}

function hidePowerUpTimer(playerId = null) {
    if (playerId) {
        // Hide specific player's timer container
        const container = document.getElementById(`powerup-timer-container-${playerId}`);
        if (container) {
            container.style.opacity = '0';
            setTimeout(() => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }, 300);
        }
    } else {
        // Hide all timer containers
        const containers = document.querySelectorAll('.powerup-timer-container');
        containers.forEach(container => {
            container.style.opacity = '0';
            setTimeout(() => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }, 300);
        });
    }
}

function updatePowerUpTimerDisplay(player, powerUpType) {
    const timerElement = document.getElementById(`powerup-timer-${player.id}-${powerUpType}`);

    if (!player.activePowerUps) return;

    // Find the powerup in the active list
    const powerup = player.activePowerUps.find(p => p.type === powerUpType);

    if (!timerElement || !powerup) {
        return;
    }

    const timeLeft = Math.max(0, (powerup.endTime - frameTime) / 1000);
    const totalDuration = powerup.duration / 1000;
    const progress = Math.max(0, (timeLeft / totalDuration) * 100);

    const timeDisplay = timerElement.querySelector('.powerup-time');
    const progressBar = timerElement.querySelector('.powerup-progress-bar');

    if (timeDisplay) {
        timeDisplay.textContent = `${timeLeft.toFixed(1)}s`;
    }

    if (progressBar) {
        progressBar.style.width = `${progress}%`;

        // Change color when time is running out
        if (timeLeft < 3) {
            progressBar.style.background = '#ef4444';
            timerElement.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.6)';
        } else {
            progressBar.style.background = getPowerUpColor(powerUpType);
            timerElement.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(83, 52, 131, 0.4)';
        }
    }

    // Hide when expired
    if (timeLeft <= 0) {
        timerElement.remove();
    }
}

// Update all active powerup timers for a player
function updateAllPowerUpTimers(player) {
    if (!player.activePowerUps) return;

    player.activePowerUps.forEach(powerup => {
        updatePowerUpTimerDisplay(player, powerup.type);
    });
}

const POWER_UP_DISPLAY_NAMES = {
    'rapid_fire': 'Rapid Fire',
    'wide_shot': 'Wide Shot',
    'shield': 'Shield',
    'extra_life': 'Extra Life',
    'slowBubbles': 'Slow Bubbles',
    'fastBullets': 'Fast Bullets',
    'speed_boost': 'Speed Boost'
};

function getPowerUpDisplayName(type) {
    return POWER_UP_DISPLAY_NAMES[type] || 'Power Up';
}

const POWER_UP_COLORS = {
    'rapid_fire': '#ff6b6b',
    'wide_shot': '#4ecdc4',
    'shield': '#45b7d1',
    'extra_life': '#f9ca24',
    'slowBubbles': '#b388ff',
    'fastBullets': '#10b981',
    'speed_boost': '#f9ca24'
};

function getPowerUpColor(type) {
    return POWER_UP_COLORS[type] || '#4ecdc4';
}
