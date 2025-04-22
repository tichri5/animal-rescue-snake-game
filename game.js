// Game Constants
const GRID_SIZE = 40;
const BASE_SPEED = 3;
const POWERUP_DURATION = 10000; // 10 seconds
const POWERUP_VISIBLE_DURATION = 5000; // 5 seconds
const STARTING_LIVES = 3;
const INVINCIBILITY_DURATION = 2000; // 2 seconds
const ANIMAL_SPAWN_INTERVAL = 3000; // 3 seconds
const OFFICER_SPAWN_INTERVAL = 5000; // 5 seconds
const POWERUP_SPAWN_INTERVAL = 8000; // 8 seconds
const RESCUE_TRUCK_INTERVAL = 20000; // 20 seconds

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
let lastAnimalSpawn = 0;
let lastOfficerSpawn = 0;
let lastPowerupSpawn = 0;
let lastRescueTruckSpawn = 0;

// Audio control
let bgMusic;
let isMusicPlaying = false;

// Game state variables
let gameState = {
    score: 0,
    level: 1,
    lives: 3,
    isPaused: false,
    isGameOver: false
};

function initAudio() {
    bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.3; // Set initial volume to 30%
    bgMusic.addEventListener('ended', function() {
        bgMusic.currentTime = 0;
        if (isMusicPlaying) {
            bgMusic.play();
        }
    });
}

function toggleMusic() {
    const musicToggle = document.getElementById('musicToggle');
    if (isMusicPlaying) {
        bgMusic.pause();
        musicToggle.textContent = '🔈 Music';
    } else {
        bgMusic.play();
        musicToggle.textContent = '🔊 Music';
    }
    isMusicPlaying = !isMusicPlaying;
}

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
    
    // Initialize audio
    initAudio();
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
    
    // Start game loop
    gameLoop = requestAnimationFrame(update);
    
    // Reset game state
    resetGameState();
    updateUI();
}

// Reset game state
function resetGameState() {
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
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = `Score: ${player.score}`;
    document.getElementById('level').textContent = `Level: ${player.level}`;
    document.getElementById('lives').textContent = `Lives: ${player.lives}`;
}

// Game loop
function update(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    if (!isPaused) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Spawn game elements
        spawnGameElements(timestamp);
        
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

// Spawn game elements
function spawnGameElements(timestamp) {
    // Spawn animals
    if (timestamp - lastAnimalSpawn > ANIMAL_SPAWN_INTERVAL) {
        spawnAnimal();
        lastAnimalSpawn = timestamp;
    }
    
    // Spawn officers (only in level 2+)
    if (player.level >= 2 && timestamp - lastOfficerSpawn > OFFICER_SPAWN_INTERVAL) {
        spawnOfficer();
        lastOfficerSpawn = timestamp;
    }
    
    // Spawn powerups
    if (timestamp - lastPowerupSpawn > POWERUP_SPAWN_INTERVAL) {
        spawnPowerup();
        lastPowerupSpawn = timestamp;
    }
    
    // Spawn rescue truck
    if (timestamp - lastRescueTruckSpawn > RESCUE_TRUCK_INTERVAL) {
        spawnRescueTruck();
        lastRescueTruckSpawn = timestamp;
    }
}

function spawnAnimal() {
    const animal = {
        x: Math.random() * (canvas.width - GRID_SIZE),
        y: Math.random() * (canvas.height - GRID_SIZE),
        type: Math.random() > 0.5 ? 'puppy' : 'kitten'
    };
    
    // Check if animal is too close to player
    const dx = animal.x - player.x;
    const dy = animal.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > GRID_SIZE * 3) {
        player.collectedAnimals.push(animal);
    }
}

function spawnOfficer() {
    const officer = {
        x: Math.random() * (canvas.width - GRID_SIZE),
        y: Math.random() * (canvas.height - GRID_SIZE),
        speed: BASE_SPEED * 0.7
    };
    
    officers.push(officer);
}

function spawnPowerup() {
    const powerup = {
        x: Math.random() * (canvas.width - GRID_SIZE),
        y: Math.random() * (canvas.height - GRID_SIZE),
        type: Math.random() > 0.5 ? 'teacup' : 'lightning',
        timeLeft: POWERUP_VISIBLE_DURATION
    };
    
    powerups.push(powerup);
}

function spawnRescueTruck() {
    rescueTruck = {
        x: Math.random() * (canvas.width - GRID_SIZE * 2),
        y: Math.random() * (canvas.height - GRID_SIZE),
        timeLeft: POWERUP_VISIBLE_DURATION
    };
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
    
    // Update rescue truck timer
    if (rescueTruck) {
        rescueTruck.timeLeft -= deltaTime;
        if (rescueTruck.timeLeft <= 0) {
            rescueTruck = null;
        }
    }
}

// Check for collisions
function checkCollisions() {
    // Check collisions with officers
    officers.forEach(officer => {
        if (checkCollision(player, officer)) {
            loseLife();
        }
    });
    
    // Check collisions with powerups
    powerups.forEach((powerup, index) => {
        if (checkCollision(player, powerup)) {
            applyPowerup(powerup);
            powerups.splice(index, 1);
        }
    });
    
    // Check collision with rescue truck
    if (rescueTruck && checkCollision(player, rescueTruck)) {
        saveAnimals();
    }
    
    // Check wall collisions
    if (player.x <= 0 || player.x >= canvas.width - GRID_SIZE ||
        player.y <= 0 || player.y >= canvas.height - GRID_SIZE) {
        loseLife();
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + GRID_SIZE &&
           obj1.x + GRID_SIZE > obj2.x &&
           obj1.y < obj2.y + GRID_SIZE &&
           obj1.y + GRID_SIZE > obj2.y;
}

function applyPowerup(powerup) {
    if (powerup.type === 'teacup') {
        player.speed = BASE_SPEED * 0.5;
        setTimeout(() => {
            player.speed = BASE_SPEED;
        }, POWERUP_DURATION);
    } else if (powerup.type === 'lightning') {
        player.speed = BASE_SPEED * 2;
        setTimeout(() => {
            player.speed = BASE_SPEED;
        }, POWERUP_DURATION);
    }
}

function saveAnimals() {
    if (player.collectedAnimals.length > 0) {
        player.score += player.collectedAnimals.length * 10;
        document.getElementById('score').textContent = player.score;
        
        // Level up if score is high enough
        if (player.score >= player.level * 100) {
            player.level++;
            document.getElementById('level').textContent = player.level;
        }
        
        player.collectedAnimals = [];
        rescueTruck = null;
    }
}

// Draw game objects
function drawGame() {
    // Draw player
    ctx.fillStyle = player.isInvincible ? 'rgba(255, 165, 0, 0.5)' : 'orange';
    ctx.fillRect(player.x, player.y, GRID_SIZE, GRID_SIZE);
    
    // Draw collected animals (tail)
    player.collectedAnimals.forEach((animal, index) => {
        ctx.fillStyle = animal.type === 'puppy' ? 'brown' : 'gray';
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

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    const pauseMenu = document.getElementById('pauseMenu');
    pauseMenu.style.display = isPaused ? 'block' : 'none';
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

// Handle game over
function gameOver() {
    isPaused = true;
    const pauseMenu = document.getElementById('pauseMenu');
    pauseMenu.innerHTML = `
        <h2>GAME OVER</h2>
        <p>Final Score: ${player.score}</p>
        <button onclick="restartGame()">Play Again</button>
    `;
    pauseMenu.style.display = 'block';
}

// Restart game
function restartGame() {
    resetGameState();
    updateUI();
    document.getElementById('pauseMenu').style.display = 'none';
}

// Event listeners
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (!gameState.isGameOver) {
            togglePause();
        }
    }
});

// Start the game when the page loads
window.onload = init; 
