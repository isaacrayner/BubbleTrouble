// Rescue bubble system - brings back dead players

let rescueBubbles = [];
const RESCUE_BUBBLE_DURATION = 4000; // 4 seconds
const RESCUE_BUBBLE_SIZE = 40;
const RESCUE_BUBBLE_SPEED = 1.5;

class RescueBubble {
    constructor(x, y, targetPlayerId) {
        this.x = x;
        this.y = y;
        this.targetPlayerId = targetPlayerId; // Which player this bubble will rescue
        this.size = RESCUE_BUBBLE_SIZE;
        this.dx = (Math.random() - 0.5) * RESCUE_BUBBLE_SPEED;
        this.dy = (Math.random() - 0.5) * RESCUE_BUBBLE_SPEED;
        this.createdAt = Date.now();
        this.expiresAt = Date.now() + RESCUE_BUBBLE_DURATION;
        this.pulsePhase = 0;
        this.collected = false;
    }

    update() {
        // Move the bubble with delta time
        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;

        // Bounce off walls
        if (this.x <= this.size/2 || this.x >= canvas.width - this.size/2) {
            this.dx = -this.dx;
            this.x = Math.max(this.size/2, Math.min(canvas.width - this.size/2, this.x));
        }
        if (this.y <= this.size/2 || this.y >= canvas.height - this.size/2) {
            this.dy = -this.dy;
            this.y = Math.max(this.size/2, Math.min(canvas.height - this.size/2, this.y));
        }

        // Bounce off obstacles
        if (typeof obstacles !== 'undefined') {
            obstacles.forEach(obstacle => {
                if (this.x - this.size/2 < obstacle.x + obstacle.width &&
                    this.x + this.size/2 > obstacle.x &&
                    this.y - this.size/2 < obstacle.y + obstacle.height &&
                    this.y + this.size/2 > obstacle.y) {
                    
                    // Simple bounce - reverse both directions
                    this.dx = -this.dx;
                    this.dy = -this.dy;
                    
                    // Move bubble away from obstacle
                    if (this.x < obstacle.x + obstacle.width/2) {
                        this.x = obstacle.x - this.size/2;
                    } else {
                        this.x = obstacle.x + obstacle.width + this.size/2;
                    }
                }
            });
        }

        // Update pulse animation
        this.pulsePhase += 0.15;

        // Check if expired
        return frameTime < this.expiresAt && !this.collected;
    }

    draw() {
        ctx.save();
        
        // Pulsing effect based on remaining time
        const timeLeft = this.expiresAt - frameTime;
        const urgency = 1 - (timeLeft / RESCUE_BUBBLE_DURATION);
        const pulseIntensity = 0.8 + 0.2 * Math.sin(this.pulsePhase);
        
        // Star gradient
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${pulseIntensity})`); // Gold center
        gradient.addColorStop(0.7, `rgba(255, 165, 0, ${pulseIntensity * 0.8})`); // Orange
        gradient.addColorStop(1, `rgba(255, 69, 0, ${pulseIntensity * 0.6})`); // Red edge
        
        // Outer glow for urgency
        if (urgency > 0.5) {
            ctx.shadowBlur = 20 * urgency;
            ctx.shadowColor = '#ff0000';
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffd700';
        }
        
        // Draw star shape
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        
        this.drawStar(this.x, this.y, this.size * pulseIntensity);
        
        // Draw target player indicator
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.targetPlayerId, this.x, this.y + 5);
        
        // Draw timer bar
        const barWidth = this.size * 1.5;
        const barHeight = 4;
        const timeProgress = timeLeft / RESCUE_BUBBLE_DURATION;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - barWidth/2, this.y + this.size/2 + 10, barWidth, barHeight);
        
        ctx.fillStyle = timeProgress > 0.3 ? '#ffd700' : '#ff4444';
        ctx.fillRect(this.x - barWidth/2, this.y + this.size/2 + 10, barWidth * timeProgress, barHeight);
        
        ctx.restore();
    }

    drawStar(centerX, centerY, radius) {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const currentRadius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + Math.cos(angle) * currentRadius;
            const y = centerY + Math.sin(angle) * currentRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    getBounds() {
        return {
            x: this.x - this.size/2,
            y: this.y - this.size/2,
            width: this.size,
            height: this.size
        };
    }
}

function createRescueBubble(deadPlayer) {
    // Only create if the other player is still alive
    const alivePlayer = deadPlayer.id === 1 ? player2 : player1;
    if (!alivePlayer.active) return;

    // Don't create if one already exists for this player
    if (rescueBubbles.some(bubble => bubble.targetPlayerId === deadPlayer.id)) return;

    // Create rescue bubble near center of screen
    const x = canvas.width/2 + (Math.random() - 0.5) * 200;
    const y = canvas.height/2 + (Math.random() - 0.5) * 200;

    rescueBubbles.push(new RescueBubble(x, y, deadPlayer.id));

    // Play special sound
    if (typeof playSound === 'function') {
        playSound('powerup');
    }
}

function updateRescueBubbles() {
    for (let i = rescueBubbles.length - 1; i >= 0; i--) {
        const bubble = rescueBubbles[i];
        
        if (!bubble.update()) {
            rescueBubbles.splice(i, 1);
        }
    }
}

function drawRescueBubbles() {
    rescueBubbles.forEach(bubble => bubble.draw());
}

function checkRescueBubbleCollisions() {
    // Only alive players can collect rescue bubbles
    const alivePlayers = players.filter(p => p.active);
    
    for (let i = rescueBubbles.length - 1; i >= 0; i--) {
        const bubble = rescueBubbles[i];
        
        for (const player of alivePlayers) {
            // bubble.size is the star's outer radius (see drawStar), so use it directly
            const radius = bubble.size;
            if (player.x < bubble.x + radius &&
                player.x + player.width > bubble.x - radius &&
                player.y < bubble.y + radius &&
                player.y + player.height > bubble.y - radius) {
                
                // Rescue the target player
                rescuePlayer(bubble.targetPlayerId);
                
                // Remove the rescue bubble
                bubble.collected = true;
                rescueBubbles.splice(i, 1);
                
                // Play rescue sound
                if (typeof playSound === 'function') {
                    playSound('levelup'); // Use levelup sound or create special rescue sound
                }
                
                // Create celebration particles
                if (typeof createParticles === 'function') {
                    createParticles(bubble.x, bubble.y, '#ffd700', 15);
                }
                
                break;
            }
        }
    }
}

function checkProjectileRescueBubbleCollision(projectile) {
    for (let i = rescueBubbles.length - 1; i >= 0; i--) {
        const bubble = rescueBubbles[i];
        
        // Check collision between projectile and rescue bubble
        const radius = bubble.size;
        if (projectile.x < bubble.x + radius &&
            projectile.x + projectile.width > bubble.x - radius &&
            projectile.y < bubble.y + radius &&
            projectile.y + projectile.height > bubble.y - radius) {
            
            // Rescue the target player
            rescuePlayer(bubble.targetPlayerId);
            
            // Remove the rescue bubble
            bubble.collected = true;
            rescueBubbles.splice(i, 1);
            
            // Play rescue sound
            if (typeof playSound === 'function') {
                playSound('levelup');
            }
            
            // Create celebration particles
            if (typeof createParticles === 'function') {
                createParticles(bubble.x, bubble.y, '#ffd700', 15);
            }
            
            return true; // Projectile hit something
        }
    }
    return false; // No collision
}

function rescuePlayer(playerId) {
    const playerToRescue = playerId === 1 ? player1 : player2;

    if (playerToRescue.active) return;
    
    // Bring player back to life
    playerToRescue.active = true;
    playerToRescue.lives = Math.max(1, playerToRescue.lives); // Ensure at least 1 life
    playerToRescue.invincible = true; // Brief invincibility
    
    // Reset position
    if (playerId === 1) {
        playerToRescue.x = canvas.width / 2 - 15;
    } else {
        playerToRescue.x = canvas.width / 4;
    }
    playerToRescue.y = canvas.height - 40;
    playerToRescue.dx = 0;
    
    // Clear any projectiles
    playerToRescue.projectiles = [];
    
    // Remove invincibility after 2 seconds (tracked to allow cleanup on death)
    if (playerToRescue.invincibilityTimer) {
        clearTimeout(playerToRescue.invincibilityTimer);
    }
    playerToRescue.invincibilityTimer = setTimeout(() => {
        playerToRescue.invincible = false;
        playerToRescue.invincibilityTimer = null;
    }, 2000);
}

function clearAllRescueBubbles() {
    rescueBubbles.length = 0;
}