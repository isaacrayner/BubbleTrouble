// Bubble management system

function resetBubbleSpeed() {
    // Reset BUBBLE_SPEED to the unchanging BUBBLE_BASE_SPEED
    if (typeof BUBBLE_BASE_SPEED !== 'undefined') {
        BUBBLE_SPEED = BUBBLE_BASE_SPEED; 
    } else {
        BUBBLE_SPEED = 2; // Fallback if BUBBLE_BASE_SPEED is somehow undefined
    }

    // Reset multiplier
    if (typeof bubbleSpeedMultiplier !== 'undefined') {
        bubbleSpeedMultiplier = 1.0;
    } else {
        bubbleSpeedMultiplier = 1.0; // Fallback
    }

    // IMPORTANT: If bubbleGravity is 'let' and can change, reset it here too.
    // If bubbleGravity is 'const' in constants.js, this line is not needed.
    // if (typeof bubbleGravity !== 'undefined' && typeof ORIGINAL_BUBBLE_GRAVITY !== 'undefined') { // Assuming ORIGINAL_BUBBLE_GRAVITY = 0.08
    //     bubbleGravity = ORIGINAL_BUBBLE_GRAVITY;
    // } else if (typeof bubbleGravity !== 'undefined') {
    //     bubbleGravity = 0.08; // Fallback
    // }

    
}

class Bubble {
    constructor(x, y, radius, speed, type = 'normal') { // Added type parameter
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type; // 'normal', 'golden', or 'boss'
        
        // --- MODIFICATION START ---
        // Directly use BUBBLE_BASE_SPEED from the global scope for initial velocity calculations.
        // This ensures that regardless of what 'speed' is passed, or what global BUBBLE_SPEED might be,
        // the initial dx/dy are based on the original constant BUBBLE_BASE_SPEED.
        const initialCalculationSpeed = (typeof BUBBLE_BASE_SPEED !== 'undefined') ? BUBBLE_BASE_SPEED : 2; // Default to 2 if undefined

        // You can still store the passed 'speed' if it's used for other logic,
        // but it won't affect the initial dx/dy here.
        this.currentBubbleSpeed = speed; 

        // Golden bubbles move 1.5x faster, boss bubbles move 1.2x faster
        const speedMultiplier = this.type === 'golden' ? 1.5 : (this.type === 'boss' ? 1.2 : 1.0);
        this.dx = (Math.random() - 0.5) * initialCalculationSpeed * 3 * speedMultiplier; 
        this.dy = -Math.random() * initialCalculationSpeed * 1.5 * speedMultiplier - (initialCalculationSpeed * 0.5);
        // --- MODIFICATION END ---

        // The rest of your constructor remains the same
        this.color = this.getColorForSize(radius);
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.bounces = 0;
        this.lastBounceTime = 0;
        this.isFrozen = false; // Initialize isFrozen state
        this.pointMultiplier = this.type === 'golden' ? 3 : (this.type === 'boss' ? 5 : 1); // 3x points for golden, 5x for boss
        if (this.type === 'boss') {
            this.health = 10;
        }
    }
    
    update() {
        if (!this.isFrozen) { // Only update physics if not frozen
            // Apply gravity with delta time
            this.dy += bubbleGravity * deltaTime;
            
            // Update position with delta time
            this.x += this.dx * deltaTime;
            this.y += this.dy * deltaTime;
            
            // Reduce damping significantly - only apply to very small movements
            if (Math.abs(this.dx) < 0.5 && Math.abs(this.dy) < 0.5) {
                this.dx *= 0.98; // Much less damping
                this.dy *= 0.98;
            }
        }
        // Visual effects can update regardless of freeze state
        this.pulsePhase += 0.1;
    }
    
    getColorForSize(radius) {
        // Boss bubbles are always a deep purple
        if (this.type === 'boss') return '#483d8b';
        // Golden bubbles are always golden
        if (this.type === 'golden') return '#FFD700';
        
        if (radius > 40) return '#ff6b6b';      // Large - Red
        if (radius > 25) return '#4ecdc4';      // Medium - Cyan  
        return '#f6e05e';                       // Small - Yellow
    }
    
    draw() {
        // Enhanced bubble drawing with better effects
        const currentRadius = this.radius + Math.sin(this.pulsePhase) * 2;
        
        // Golden bubbles get extra sparkle effect
        if (this.type === 'golden') {
            // Outer golden glow
            const goldenGlow = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, currentRadius + 12
            );
            goldenGlow.addColorStop(0, '#FFD70080');
            goldenGlow.addColorStop(0.5, '#FFA50040');
            goldenGlow.addColorStop(1, '#FFD70000');
            ctx.fillStyle = goldenGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius + 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Sparkle particles
            const sparkleCount = 6;
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (this.pulsePhase + i * Math.PI * 2 / sparkleCount) % (Math.PI * 2);
                const sparkleX = this.x + Math.cos(angle) * (currentRadius + 5);
                const sparkleY = this.y + Math.sin(angle) * (currentRadius + 5);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'boss') {
            // Pulsating purple glow for boss bubbles
            const bossGlow = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, currentRadius + 15 + Math.sin(this.pulsePhase) * 3
            );
            bossGlow.addColorStop(0, '#483d8b' + '99'); // Purple with transparency
            bossGlow.addColorStop(0.7, '#483d8b' + '44');
            bossGlow.addColorStop(1, '#483d8b' + '00');
            ctx.fillStyle = bossGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius + 15 + Math.sin(this.pulsePhase) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Freeze effect glow
        if (this.isFrozen) {
            const freezeGlow = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, currentRadius + 12
            );
            freezeGlow.addColorStop(0, 'rgba(0, 240, 255, 0.7)');
            freezeGlow.addColorStop(0.6, 'rgba(0, 180, 255, 0.4)');
            freezeGlow.addColorStop(1, 'rgba(0, 180, 255, 0)');
            ctx.fillStyle = freezeGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius + 12, 0, Math.PI * 2);
            ctx.fill();
        }

        // Outer glow
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentRadius + 8
        );
        glowGradient.addColorStop(0, this.color + '40');
        glowGradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius + 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Main bubble body
        const bodyGradient = ctx.createRadialGradient(
            this.x - currentRadius * 0.3, 
            this.y - currentRadius * 0.3, 
            0,
            this.x, this.y, currentRadius
        );
        bodyGradient.addColorStop(0, this.color + 'CC');
        bodyGradient.addColorStop(0.7, this.color + '99');
        bodyGradient.addColorStop(1, this.color + '66');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        const highlightGradient = ctx.createRadialGradient(
            this.x - currentRadius * 0.4,
            this.y - currentRadius * 0.4,
            0,
            this.x - currentRadius * 0.4,
            this.y - currentRadius * 0.4,
            currentRadius * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = this.color + 'BB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawBubbles() {
    bubbles.forEach(bubble => bubble.draw());
}



function calculatePoints(radius) {
    if (radius > 40) return 100;
    if (radius > 25) return 200;
    return 300;
}

function handleBubbleHit(bubble, bubbleIndex, playerObj) {
    // Award points with multiplier for golden bubbles
    const basePoints = calculatePoints(bubble.radius);
    const multiplier = bubble.pointMultiplier || 1;
    const points = basePoints * multiplier;
    playerObj.score += points;
    
    // Show bonus text for golden bubbles
    if (bubble.type === 'golden' && typeof createFloatingText === 'function') {
        createFloatingText(bubble.x, bubble.y, `+${points} GOLD!`, '#FFD700');
    } else if (bubble.type === 'boss' && typeof createFloatingText === 'function') {
        createFloatingText(bubble.x, bubble.y, `+${points} BOSS HIT!`, '#483d8b');
    } else if (typeof createFloatingText === 'function') {
        createFloatingText(bubble.x, bubble.y, `+${points}`, '#FFFFFF');
    }
    
    // Create hit particles
    if (typeof createParticles === 'function') {
        createParticles(bubble.x, bubble.y, bubble.color, 8);
    }
    
    // Play pop sound
    if (typeof playSound === 'function') {
        playSound('hit');
    }

    if (bubble.type === 'boss') {
        bubble.health--;
        if (bubble.health <= 0) {
            // Remove the original bubble
            bubbles.splice(bubbleIndex, 1);
            
            // Chance to drop power-up
            if (Math.random() < POWER_UP_DROP_CHANCE && typeof createPowerUp === 'function') {
                createPowerUp(bubble.x, bubble.y);
            }
        }
        return;
    }
    
    // Check if bubble should split
    const minRadius = 15;
    if (bubble.radius > minRadius) {
        // Create two smaller bubbles with much stronger explosive physics
        const newRadius = bubble.radius * 0.7;
        const explosiveForce = 2 + (bubble.radius / 12);
        const upwardForce = 1 + (bubble.radius / 20);
        
        // Preserve bubble type (golden stays golden when split)
        const bubbleType = bubble.type || 'normal';
        
        // Create left bubble with explosive force
        const leftBubble = new Bubble(
            bubble.x - newRadius * 0.8, // Slightly closer spawn
            bubble.y,
            newRadius,
            bubble.currentBubbleSpeed,
            bubbleType // Preserve type
        );
        // Strong leftward and upward velocity
        leftBubble.dx = -explosiveForce + (Math.random() - 0.5) * 2;
        leftBubble.dy = -upwardForce + (Math.random() - 0.5) * 1;
        
        // Create right bubble with explosive force
        const rightBubble = new Bubble(
            bubble.x + newRadius * 0.8, // Slightly closer spawn
            bubble.y,
            newRadius,
            bubble.currentBubbleSpeed,
            bubbleType // Preserve type
        );
        // Strong rightward and upward velocity
        rightBubble.dx = explosiveForce + (Math.random() - 0.5) * 2;
        rightBubble.dy = -upwardForce + (Math.random() - 0.5) * 1;
        
        // If time freeze is active, freeze new split bubbles
        if (typeof bubbleSlowEffectActive !== 'undefined' && bubbleSlowEffectActive && typeof originalBubbleSpeeds !== 'undefined') {
            originalBubbleSpeeds.set(leftBubble, { dx: leftBubble.dx, dy: leftBubble.dy });
            originalBubbleSpeeds.set(rightBubble, { dx: rightBubble.dx, dy: rightBubble.dy });
            leftBubble.isFrozen = true;
            rightBubble.isFrozen = true;
        }

        // Add both bubbles to the array
        bubbles.push(leftBubble, rightBubble);
        
    }
    
    // Remove the original bubble
    bubbles.splice(bubbleIndex, 1);
    
    // Chance to drop power-up
    if (Math.random() < POWER_UP_DROP_CHANCE && typeof createPowerUp === 'function') {
        createPowerUp(bubble.x, bubble.y);
    }
}

function destroyBubble(index) {
    // Play pop sound
    if (typeof playSound === 'function') {
        playSound('pop');
    }
    
    // Your existing bubble destruction code...
    bubbles.splice(index, 1);
}

function updateBubbles() {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        
        if (!bubble || typeof bubble.update !== 'function') {
            bubbles.splice(i, 1);
            continue;
        }
        
        // Store previous position for collision detection
        const prevX = bubble.x;
        const prevY = bubble.y;
        
        // Update bubble physics
        bubble.update();
        
        // Enhanced bounce physics with energy retention
        handleEnhancedBubbleBouncing(bubble, prevX, prevY);
        
        // Remove bubbles that are stuck or invalid
        if (!isFinite(bubble.x) || !isFinite(bubble.y) ||
            !isFinite(bubble.dx) || !isFinite(bubble.dy)) {
            bubbles.splice(i, 1);
        }
    }
}

function handleEnhancedBubbleBouncing(bubble, prevX, prevY) {
    // Enhanced floor bouncing with much better energy retention
    if (bubble.y + bubble.radius >= canvas.height) {
        bubble.y = canvas.height - bubble.radius;
        // Ensure a strong minimum upward bounce, or retain energy if bounce is already strong
        bubble.dy = -Math.max(5.0, Math.abs(bubble.dy) * bubbleBounceFactor); 
        
        // Add horizontal movement if bubble is moving too slowly
        if (Math.abs(bubble.dx) < 1.0) {
            bubble.dx += (Math.random() - 0.5) * 3;
        }
    }
    
    // Enhanced wall bouncing with more force
    if (bubble.x - bubble.radius <= 0) {
        bubble.x = bubble.radius;
        bubble.dx = Math.abs(bubble.dx) * bubbleBounceFactor;
        
        // Add significant upward force on wall bounce
        bubble.dy -= 2.0; // Increased upward impulse
        
        // Ensure minimum horizontal velocity
        if (bubble.dx < 1.5) {
            bubble.dx = 2.0;
        }
    } else if (bubble.x + bubble.radius >= canvas.width) {
        bubble.x = canvas.width - bubble.radius;
        bubble.dx = -Math.abs(bubble.dx) * bubbleBounceFactor;
        
        // Add significant upward force on wall bounce
        bubble.dy -= 2.0; // Increased upward impulse
        
        // Ensure minimum horizontal velocity
        if (bubble.dx > -1.5) {
            bubble.dx = -2.0;
        }
    }
    
    // Enhanced ceiling bouncing
    if (bubble.y - bubble.radius <= 0) {
        bubble.y = bubble.radius;
        bubble.dy = Math.abs(bubble.dy) * bubbleBounceFactor;
        
        // Ensure minimum downward velocity after ceiling bounce
        if (bubble.dy < 1.5) {
            bubble.dy = 2.0;
        }
    }
    
    // Obstacle collision with enhanced bouncing
    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
        handleObstacleBouncing(bubble, prevX, prevY);
    }
}

function handleObstacleBouncing(bubble, prevX, prevY) {
    obstacles.forEach(obstacle => {
        if (bubbleCollidesWithObstacle(bubble, obstacle)) {
            // Determine collision side based on previous position
            const bubbleLeft = bubble.x - bubble.radius;
            const bubbleRight = bubble.x + bubble.radius;
            const bubbleTop = bubble.y - bubble.radius;
            const bubbleBottom = bubble.y + bubble.radius;
            
            const obstacleLeft = obstacle.x;
            const obstacleRight = obstacle.x + obstacle.width;
            const obstacleTop = obstacle.y;
            const obstacleBottom = obstacle.y + obstacle.height;
            
            // Calculate overlap distances
            const overlapLeft = bubbleRight - obstacleLeft;
            const overlapRight = obstacleRight - bubbleLeft;
            const overlapTop = bubbleBottom - obstacleTop;
            const overlapBottom = obstacleBottom - bubbleTop;
            
            // Find minimum overlap to determine collision side
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if (minOverlap === overlapTop) {
                // Hit from above
                bubble.y = obstacleTop - bubble.radius;
                bubble.dy = -Math.abs(bubble.dy) * bubbleBounceFactor;
                // Add stronger horizontal deflection
                bubble.dx += (Math.random() - 0.5) * 3;
                
                // Ensure strong bounce
                if (Math.abs(bubble.dy) < 2.0) {
                    bubble.dy = -3.0;
                }
            } else if (minOverlap === overlapBottom) {
                // Hit from below
                bubble.y = obstacleBottom + bubble.radius;
                bubble.dy = Math.abs(bubble.dy) * bubbleBounceFactor;
                // Add stronger horizontal deflection
                bubble.dx += (Math.random() - 0.5) * 3;
                
                // Ensure strong bounce
                if (bubble.dy < 2.0) {
                    bubble.dy = 3.0;
                }
            } else if (minOverlap === overlapLeft) {
                // Hit from left
                bubble.x = obstacleLeft - bubble.radius;
                bubble.dx = -Math.abs(bubble.dx) * bubbleBounceFactor;
                // Add stronger upward force
                bubble.dy -= 1.5;
                
                // Ensure minimum velocity
                if (bubble.dx > -1.5) {
                    bubble.dx = -2.5;
                }
            } else if (minOverlap === overlapRight) {
                // Hit from right
                bubble.x = obstacleRight + bubble.radius;
                bubble.dx = Math.abs(bubble.dx) * bubbleBounceFactor;
                // Add stronger upward force
                bubble.dy -= 1.5;
                
                // Ensure minimum velocity
                if (bubble.dx < 1.5) {
                    bubble.dx = 2.5;
                }
            }
            
            // Ensure bubbles always have strong minimum velocity
            if (Math.abs(bubble.dx) < 1.5) {
                bubble.dx = bubble.dx < 0 ? -2.0 : 2.0;
            }
            if (Math.abs(bubble.dy) < 1.5) {
                bubble.dy = bubble.dy < 0 ? -2.0 : 2.0;
            }
        }
    });
}

// Add the missing collision detection function
function bubbleCollidesWithObstacle(bubble, obstacle) {
    const bubbleLeft = bubble.x - bubble.radius;
    const bubbleRight = bubble.x + bubble.radius;
    const bubbleTop = bubble.y - bubble.radius;
    const bubbleBottom = bubble.y + bubble.radius;
    
    const obstacleLeft = obstacle.x;
    const obstacleRight = obstacle.x + obstacle.width;
    const obstacleTop = obstacle.y;
    const obstacleBottom = obstacle.y + obstacle.height;
    
    return bubbleRight > obstacleLeft &&
           bubbleLeft < obstacleRight &&
           bubbleBottom > obstacleTop &&
           bubbleTop < obstacleBottom;
}

function setBubbleSpeedForLevel(level) {
    // Calculate level-based speed increase (starts fresh each game)
    const levelBonus = (level - 1) * 0.3; // Gradual increase per level
    BUBBLE_SPEED = BUBBLE_BASE_SPEED + levelBonus;
    
}