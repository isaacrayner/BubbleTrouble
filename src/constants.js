// Game constants and global variables

// ========== CANVAS AND CONTEXT ==========
let canvas;
let ctx;

// ========== GAME STATE VARIABLES ==========
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let levelTransitioning = false;
let gameMode = 'multi'; // 'single' or 'multi'
let currentLevel = 1;
let levelStartTime = 0;
let levelTimeLimit = 0; // 0 means no time limit, >0 for challenge levels
let isTimeChallengeLevel = false;

// ========== FRAME RATE CONTROL ==========
let lastFrameTime = 0;
const targetFPS = 60; // Target 60 FPS for delta time calculation
let deltaTime = 1; // Delta time multiplier (1 = normal speed at 60fps)
let frameTime = 0; // Cached Date.now() for current frame - set once per frame in gameLoop

// ========== GAME OBJECTS ARRAYS ==========
let bubbles = [];
let powerUps = [];
let particles = [];
let obstacles = [];

// ========== BUBBLE CONSTANTS ==========
const BUBBLE_BASE_SPEED = 2.5;      // Increased by 25% (was 2)
let BUBBLE_SPEED = BUBBLE_BASE_SPEED; // This is 'let', reset by resetBubbleSpeed()
let bubbleSpeedMultiplier = 1.0;    // This is 'let', reset by resetBubbleSpeed()

// ========== PHYSICS CONSTANTS ==========
const bubbleGravity = 0.08;
const bubbleBounceFactor = 0.92; // <--- ADD THIS LINE
                                    // If it's 'let' and changes, it MUST be reset in startNewGame or resetBubbleSpeed

// ========== PLAYER CONSTANTS ==========
const PLAYER_SPEED = 6.25;          // Increased by 25% (was 5)
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 30;

// ========== PROJECTILE CONSTANTS ==========
const PROJECTILE_SPEED = 8;
const PROJECTILE_WIDTH = 4;
const PROJECTILE_HEIGHT = 20;
const MAX_PROJECTILES_PER_PLAYER = 6; // Changed from 3 to 6
const RAPID_FIRE_MAX_PROJECTILES = 12; // Increased proportionally (was 10)

// ========== POWER-UP CONSTANTS ==========
const POWER_UP_DURATION = 5000; // 5 seconds
const POWER_UP_DROP_CHANCE = 0.3; // 30% chance

// ========== OBSTACLE CONSTANTS ==========
const OBSTACLE_WIDTH = 120; // Increased from default
const OBSTACLE_HEIGHT = 80; // Increased from default

// ========== SOUND SYSTEM ==========
let soundEnabled = true;
let sounds = {}; // Sound objects storage
let backgroundMusic = null; // Background music audio object

// ========== PLAYER OBJECTS ==========
let player1 = {
    id: 1,
    x: 0,
    y: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    dx: 0,
    speed: PLAYER_SPEED,
    color: '#667eea',
    score: 0,
    lives: 3,
    active: true,
    projectiles: [],
    lastShotTime: 0,
    activePowerUp: null,
    activePowerUps: [],
    powerUpTimer: null,
    powerUpEndTime: null,
    currentProjectileWidth: PROJECTILE_WIDTH,
    shootCooldown: 250, // Reduced from 500 to 250 (twice as fast)
    maxProjectiles: 6,
    hasShield: false,
    invincible: false,
    invincibilityTimer: null,
    projectileSpeedMultiplier: 1
};

let player2 = {
    id: 2,
    x: 0,
    y: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    dx: 0,
    speed: PLAYER_SPEED,
    color: '#f093fb',
    score: 0,
    lives: 3,
    active: true,
    projectiles: [],
    lastShotTime: 0,
    activePowerUp: null,
    activePowerUps: [],
    powerUpTimer: null,
    powerUpEndTime: null,
    currentProjectileWidth: PROJECTILE_WIDTH,
    shootCooldown: 250, // Reduced from 500 to 250 (twice as fast)
    maxProjectiles: 6,
    hasShield: false,
    invincible: false,
    invincibilityTimer: null,
    projectileSpeedMultiplier: 1
};

// ========== PLAYERS ARRAY ==========
// Array for easier iteration over both players
let players = [player1, player2];

console.log("=== CONSTANTS.JS LOADED ===");