// Sound and visual effects system

// Sound loading and management
function loadSound(name, src) {
    try {
        sounds[name] = new Audio(src);
        sounds[name].preload = 'auto';
        sounds[name].addEventListener('error', (e) => {
            // Create a silent placeholder so the game doesn't break
            sounds[name] = { play: () => {}, currentTime: 0 };
        });
    } catch (error) {
        // Create a silent placeholder
        sounds[name] = { play: () => {}, currentTime: 0 };
    }
}

function playSound(name) {
    // Check if sound is enabled FIRST
    if (!soundEnabled) {
        return; // Don't play any sound when disabled
    }
    
    if (!sounds[name]) {
        return;
    }
    
    try {
        sounds[name].currentTime = 0;
        const playPromise = sounds[name].play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    } catch (error) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundToggle = document.getElementById('soundToggle');
    
    if (soundToggle) {
        if (soundEnabled) {
            soundToggle.textContent = '🔊 Sound';
            soundToggle.classList.remove('audio-disabled');
            soundToggle.classList.remove('muted');
            // Resume background music if game is running
            if (gameRunning && backgroundMusic) {
                playBackgroundMusic();
            }
        } else {
            soundToggle.textContent = '🔇 Muted';
            soundToggle.classList.add('audio-disabled');
            soundToggle.classList.add('muted');
            // Pause background music
            stopBackgroundMusic();
        }
    }
    
    return soundEnabled;
}

function initializeSounds() {
    loadSound('shoot', 'media/shoot.wav');
    loadSound('pop', 'media/pop.wav');
    loadSound('hit', 'media/hit.wav');
    loadSound('powerup', 'media/powerup.wav');
    loadSound('levelup', 'media/levelup.wav');
    loadSound('gameover', 'media/gameover.wav');
    loadSound('start', 'media/start.wav');
    
    // Load background music
    try {
        backgroundMusic = new Audio('media/background.wav');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3; // Set to 30% volume so it doesn't overpower sound effects
        backgroundMusic.preload = 'auto';
        backgroundMusic.addEventListener('error', () => {
            backgroundMusic = null;
        });
    } catch (error) {
        backgroundMusic = null;
    }
}

function playBackgroundMusic() {
    if (!soundEnabled || !backgroundMusic) {
        return;
    }
    
    try {
        backgroundMusic.currentTime = 0;
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    } catch (error) {}
}

function stopBackgroundMusic() {
    if (backgroundMusic) {
        try {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        } catch (error) {}
    }
}

// Particle system
class Particle {
    constructor(x, y, color, life = 30) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += 0.1 * deltaTime; // gravity
        this.vx *= Math.pow(0.99, deltaTime); // air resistance
        this.life -= deltaTime;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const MAX_PARTICLES = 200;

function createParticles(x, y, color, count = 8) {
    const available = MAX_PARTICLES - particles.length;
    const toCreate = Math.min(count, available);
    for (let i = 0; i < toCreate; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(particle => particle.draw());
}

function initializeSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        // Remove any existing event listeners to prevent duplicates
        soundToggle.removeEventListener('click', toggleSound);
        soundToggle.addEventListener('click', toggleSound);
        
        // Set initial state
        if (soundEnabled) {
            soundToggle.textContent = '🔊 Sound';
            soundToggle.classList.remove('audio-disabled');
            soundToggle.classList.remove('muted');
        } else {
            soundToggle.textContent = '🔇 Muted';
            soundToggle.classList.add('audio-disabled');
            soundToggle.classList.add('muted');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSoundToggle);

// Initialize sounds when the script loads
if (soundEnabled) {
    initializeSounds();
}

