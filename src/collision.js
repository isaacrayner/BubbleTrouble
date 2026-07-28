// Collision detection system

function checkCollisions() {
    // Early exit if no bubbles
    if (bubbles.length === 0) return;
    
    // Check projectile-bubble collisions
    players.forEach(playerObj => {
        if (!playerObj.active || playerObj.projectiles.length === 0) return; // Early exit
        
        for (let i = playerObj.projectiles.length - 1; i >= 0; i--) {
            const projectile = playerObj.projectiles[i];
            
            for (let j = bubbles.length - 1; j >= 0; j--) {
                const bubble = bubbles[j];
                
                if (projectileHitsBubble(projectile, bubble)) {
                    playerObj.projectiles.splice(i, 1);
                    handleBubbleHit(bubble, j, playerObj);
                    break; // Exit bubble loop since projectile is gone
                }
            }
        }
    });
    
    // Check player-bubble collisions
    detectCollisions();
    
    // Check power-up collisions (only once per frame)
    if (typeof checkPowerUpCollisions === 'function') {
        checkPowerUpCollisions();
    }
}

function detectCollisions() {
    players.forEach(playerObj => {
        if (!playerObj.active || playerObj.invincible) return; // Skip if invincible
        
        bubbles.forEach(bubble => {
            if (playerCollidesWith(playerObj, bubble)) {
                // Use handlePlayerHit instead of loseLife
                handlePlayerHit(playerObj, bubble);
                
                // Play hit sound
                if (typeof playSound === 'function') {
                    playSound('hit'); // or 'pop'
                }
            }
        });
    });
}

function projectileHitsBubble(projectile, bubble) {
    // projectile.x, projectile.y is the CURRENT top-left of the projectile AFTER movement for this frame.
    // projectile.dy is the change in y that just occurred (it's negative for upward movement).

    // Define the swept rectangle of the projectile for this frame.
    // The projectile moved from (projectile.y - projectile.dy) to (projectile.y) [these are top y-coordinates].
    const sweptRectX = projectile.x;
    const sweptRectWidth = projectile.width;
    
    // The top of the swept area is the projectile's current y position (since dy is negative).
    const sweptRectY = projectile.y; 
    // The height of the swept area includes the projectile's own height plus the distance it traveled.
    const sweptRectHeight = projectile.height + Math.abs(projectile.dy);

    // Now, check collision between this sweptRect and the bubble (circle).
    // Bubble center: bubble.x, bubble.y
    // Bubble radius: bubble.radius

    // Find the closest point on the swept rectangle to the bubble's center.
    const closestX = Math.max(sweptRectX, Math.min(bubble.x, sweptRectX + sweptRectWidth));
    const closestY = Math.max(sweptRectY, Math.min(bubble.y, sweptRectY + sweptRectHeight));

    // Calculate the square of the distance between the closest point and the bubble's center.
    const deltaX = bubble.x - closestX;
    const deltaY = bubble.y - closestY;
    const distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);
    
    // If the distance is less than the bubble's radius, a collision occurred.
    return distanceSquared < (bubble.radius * bubble.radius);
}

function playerCollidesWith(playerObj, bubble) {
    const closestX = Math.max(playerObj.x, Math.min(bubble.x, playerObj.x + playerObj.width));
    const closestY = Math.max(playerObj.y, Math.min(bubble.y, playerObj.y + playerObj.height));
    const dx = bubble.x - closestX;
    const dy = bubble.y - closestY;
    return (dx * dx + dy * dy) < (bubble.radius * bubble.radius);
}



function checkPowerUpCollisions() {
    if (typeof powerUps === 'undefined') return;
    
    players.forEach(playerObj => {
        if (!playerObj.active) return;
        
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            
            if (playerCollidesWithPowerUp(playerObj, powerUp)) {
                // Apply power-up effect
                if (typeof applyPowerUp === 'function') {
                    applyPowerUp(playerObj, powerUp.type);
                }
                
                // Play powerup sound - THIS WAS MISSING!
                if (typeof playSound === 'function') {
                    playSound('powerup');
                }
                
                // Remove power-up
                powerUps.splice(i, 1);
            }
        }
    });
}

// Add this function to your collision.js file
function checkProjectileObstacleCollision(projectile) {
    for (let obstacle of obstacles) {
        if (projectile.x < obstacle.x + obstacle.width &&
            projectile.x + projectile.width > obstacle.x &&
            projectile.y < obstacle.y + obstacle.height &&
            projectile.y + projectile.height > obstacle.y) {
            
            // Determine which side was hit
            const overlapLeft = (projectile.x + projectile.width) - obstacle.x;
            const overlapRight = (obstacle.x + obstacle.width) - projectile.x;
            const overlapTop = (projectile.y + projectile.height) - obstacle.y;
            const overlapBottom = (obstacle.y + obstacle.height) - projectile.y;
            
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            let side;
            if (minOverlap === overlapTop) side = 'top';
            else if (minOverlap === overlapBottom) side = 'bottom';
            else if (minOverlap === overlapLeft) side = 'left';
            else side = 'right';
            
            return { obstacle, side };
        }
    }
    return false;
}

// Add this to your player hit logic in collision.js
function handlePlayerHit(player, bubble) {
    if (player.hasShield || player.invincible) {
        return; // Player is protected
    }

    player.lives--;

    if (player.lives <= 0) {
        player.active = false;
        // Clear any pending invincibility timer since the player is now dead
        if (player.invincibilityTimer) {
            clearTimeout(player.invincibilityTimer);
            player.invincibilityTimer = null;
        }

        // Create rescue bubble when player dies
        if (typeof createRescueBubble === 'function') {
            createRescueBubble(player);
        }
    } else {
        // Player still has lives, make them invincible briefly
        if (player.invincibilityTimer) {
            clearTimeout(player.invincibilityTimer);
        }
        player.invincible = true;
        player.invincibilityTimer = setTimeout(() => {
            player.invincible = false;
            player.invincibilityTimer = null;
        }, 1500);
    }

    // Play hit sound
    if (typeof playSound === 'function') {
        playSound('hit');
    }

    // Create hit particles
    if (typeof createParticles === 'function') {
        createParticles(player.x + player.width/2, player.y + player.height/2, '#ff4444', 10);
    }
}

