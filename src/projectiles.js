// Projectile system

function shootProjectile(playerObj) {
    // Never fire while the game is paused, over, or showing a message overlay
    if (!gameRunning || gamePaused || gameOver) {
        return;
    }

    const currentTime = Date.now();

    // Reduced cooldown from 500ms to 250ms (twice as fast)
    const shootCooldown = playerObj.shootCooldown || 250; // Was 500, now 250
    
    // Check cooldown
    if (currentTime - playerObj.lastShotTime < shootCooldown) {
        return;
    }

    // Check projectile limit (use player's current max projectiles)
    const maxProjectiles = playerObj.maxProjectiles || MAX_PROJECTILES_PER_PLAYER;
    if (playerObj.projectiles.length >= maxProjectiles) {
        return;
    }

    // Use projectileSpeedMultiplier for fast bullets powerup
    let speed = PROJECTILE_SPEED;
    if (playerObj.projectileSpeedMultiplier) {
        speed *= playerObj.projectileSpeedMultiplier;
    }

    // Create projectile shooting UPWARD
    const projectile = {
        x: playerObj.x + playerObj.width / 2 - playerObj.currentProjectileWidth / 2,
        y: playerObj.y,
        width: playerObj.currentProjectileWidth,
        height: PROJECTILE_HEIGHT,
        dy: -speed, // NEGATIVE for upward movement
        dx: 0, // Add horizontal movement capability
        playerId: playerObj.id
    };

    playerObj.projectiles.push(projectile);
    playerObj.lastShotTime = currentTime;

    // Play shoot sound
    if (typeof playSound === 'function') {
        playSound('shoot');
    }
}

function updateProjectiles() {
    players.forEach(playerObj => {
        for (let i = playerObj.projectiles.length - 1; i >= 0; i--) {
            const projectile = playerObj.projectiles[i];
            
            // Safety check - projectile might have been removed by another system
            if (!projectile) {
                continue;
            }

            // Move projectile with delta time
            projectile.x += projectile.dx * deltaTime;
            projectile.y += projectile.dy * deltaTime;

            // Remove projectile if it goes off screen (ANY direction)
            if (projectile.y + projectile.height < 0 ||           // Top
                projectile.y > canvas.height ||                  // Bottom
                projectile.x + projectile.width < 0 ||           // Left
                projectile.x > canvas.width) {                   // Right
                playerObj.projectiles.splice(i, 1);
                continue;
            }

            // Check collision with rescue bubbles
            if (typeof checkProjectileRescueBubbleCollision === 'function') {
                if (checkProjectileRescueBubbleCollision(projectile)) {
                    playerObj.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Bounce off screen edges (left and right walls)
            if (projectile.x <= 0 || projectile.x + projectile.width >= canvas.width) {
                projectile.dx = -projectile.dx;
                projectile.x = Math.max(0, Math.min(canvas.width - projectile.width, projectile.x));
            }

            // Check collision with obstacles - make them bounce
            if (typeof checkProjectileObstacleCollision === 'function') {
                const collision = checkProjectileObstacleCollision(projectile);
                if (collision) {
                    handleProjectileObstacleBounce(projectile, collision);
                }
            }
        }
    });
}

// Add the bounce handler function
function handleProjectileObstacleBounce(projectile, collision) {
    // Determine which side of the obstacle was hit
    if (collision.side === 'top' || collision.side === 'bottom') {
        // Hit top or bottom - reverse vertical direction
        projectile.dy = -projectile.dy;
        
        // Adjust position to prevent sticking
        if (collision.side === 'top') {
            projectile.y = collision.obstacle.y - projectile.height;
        } else {
            projectile.y = collision.obstacle.y + collision.obstacle.height;
        }
    } else if (collision.side === 'left' || collision.side === 'right') {
        // Hit left or right side - reverse or add horizontal movement
        if (projectile.dx === 0) {
            // If no horizontal movement, add some
            projectile.dx = collision.side === 'left' ? -2 : 2;
        } else {
            // If already moving horizontally, reverse it
            projectile.dx = -projectile.dx;
        }
        
        // Adjust position to prevent sticking
        if (collision.side === 'left') {
            projectile.x = collision.obstacle.x - projectile.width;
        } else {
            projectile.x = collision.obstacle.x + collision.obstacle.width;
        }
    }
    
    // Optional: Play a bounce sound
    if (typeof playSound === 'function') {
        playSound('pop');
    }
}

function drawProjectiles() {
    players.forEach(playerObj => {
        playerObj.projectiles.forEach(projectile => {
            // Draw projectile as a vertical line/rectangle
            ctx.fillStyle = playerObj.color;
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);

            // Add glow effect
            ctx.shadowBlur = 5;
            ctx.shadowColor = playerObj.color;
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
            ctx.shadowBlur = 0;
        });
    });
}

