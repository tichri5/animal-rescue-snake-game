// Game Constants
const GRID_SIZE = 40;
const BASE_SPEED = 3;
const POWERUP_DURATION = 10000; // 10 seconds
const POWERUP_VISIBLE_DURATION = 5000; // 5 seconds
const STARTING_LIVES = 3;
const INVINCIBILITY_DURATION = 2000; // 2 seconds

// Game State
let canvas, ctx;
let player = {
    x: 0,
    y: 0,
    speed: BASE_SPEED,
    direction: 'right',
    isInvincible: false,
    lives: STARTING_LIVES,
    score: 0,
    level: 1,
    collectedAnimals: []
};

let officers = [];
let powerups = [];
let rescueTruck = null;
let isPaused = false;
let lastTime = 0;
let gameLoop;

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Initialize player position
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
    
    // Start game loop
    gameLoop = requestAnimationFrame(update);
}

// Game loop
function update(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    if (!isPaused) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update game state
        updatePlayer();
        updateOfficers();
        updatePowerups();
        checkCollisions();
        
        // Draw everything
        drawGame();
    }
    
    gameLoop = requestAnimationFrame(update);
}

// Handle keyboard input
function handleKeyPress(e) {
    if (isPaused) return;
    
    switch(e.key) {
        case 'ArrowUp':
            player.direction = 'up';
            break;
        case 'ArrowDown':
            player.direction = 'down';
            break;
        case 'ArrowLeft':
            player.direction = 'left';
            break;
        case 'ArrowRight':
            player.direction = 'right';
            break;
        case ' ':
            togglePause();
            break;
    }
}

function handleKeyRelease(e) {
    // Add any key release handling if needed
}

// Update game objects
function updatePlayer() {
    const speed = player.speed * (deltaTime / 16); // Normalize speed
    
    switch(player.direction) {
        case 'up':
            player.y = Math.max(0, player.y - speed);
            break;
        case 'down':
            player.y = Math.min(canvas.height - GRID_SIZE, player.y + speed);
            break;
        case 'left':
            player.x = Math.max(0, player.x - speed);
            break;
        case 'right':
            player.x = Math.min(canvas.width - GRID_SIZE, player.x + speed);
            break;
    }
}

function updateOfficers() {
    // Update officer positions and behavior
    officers.forEach(officer => {
        // Move officers towards player
        const dx = player.x - officer.x;
        const dy = player.y - officer.y;
        const angle = Math.atan2(dy, dx);
        
        officer.x += Math.cos(angle) * officer.speed;
        officer.y += Math.sin(angle) * officer.speed;
    });
}

function updatePowerups() {
    // Update powerup positions and timers
    powerups = powerups.filter(powerup => {
        powerup.timeLeft -= deltaTime;
        return powerup.timeLeft > 0;
    });
}

// Draw game objects
function drawGame() {
    // Draw player
    ctx.fillStyle = player.isInvincible ? 'rgba(255, 165, 0, 0.5)' : 'orange';
    ctx.fillRect(player.x, player.y, GRID_SIZE, GRID_SIZE);
    
    // Draw collected animals (tail)
    player.collectedAnimals.forEach((animal, index) => {
        ctx.fillStyle = 'green';
        ctx.fillRect(
            player.x - (index + 1) * GRID_SIZE,
            player.y,
            GRID_SIZE,
            GRID_SIZE
        );
    });
    
    // Draw officers
    officers.forEach(officer => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(officer.x, officer.y, GRID_SIZE, GRID_SIZE);
    });
    
    // Draw powerups
    powerups.forEach(powerup => {
        ctx.fillStyle = powerup.type === 'teacup' ? 'white' : 'yellow';
        ctx.fillRect(powerup.x, powerup.y, GRID_SIZE, GRID_SIZE);
    });
    
    // Draw rescue truck if present
    if (rescueTruck) {
        ctx.fillStyle = 'red';
        ctx.fillRect(rescueTruck.x, rescueTruck.y, GRID_SIZE * 2, GRID_SIZE);
    }
}

// Game state management
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseMenu').style.display = isPaused ? 'block' : 'none';
}

function loseLife() {
    if (!player.isInvincible) {
        player.lives--;
        document.getElementById('lives').textContent = player.lives;
        
        if (player.lives <= 0) {
            gameOver();
        } else {
            startInvincibility();
        }
    }
}

function startInvincibility() {
    player.isInvincible = true;
    setTimeout(() => {
        player.isInvincible = false;
    }, INVINCIBILITY_DURATION);
}

function gameOver() {
    isPaused = true;
    document.getElementById('pauseMenu').innerHTML = `
        <h2>GAME OVER</h2>
        <p>Final Score: ${player.score}</p>
        <button onclick="restartGame()">Play Again</button>
    `;
    document.getElementById('pauseMenu').style.display = 'block';
}

function restartGame() {
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        speed: BASE_SPEED,
        direction: 'right',
        isInvincible: false,
        lives: STARTING_LIVES,
        score: 0,
        level: 1,
        collectedAnimals: []
    };
    
    officers = [];
    powerups = [];
    rescueTruck = null;
    isPaused = false;
    
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';
    document.getElementById('lives').textContent = STARTING_LIVES;
    document.getElementById('pauseMenu').style.display = 'none';
}

// Start the game when the page loads
window.onload = init;
