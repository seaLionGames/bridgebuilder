// ==========================================
// 1. GAME STATES & GLOBAL CONSTANTS
// ==========================================
const MENU = 0;
const WAITING = 1;
const GROWING = 2; 
const FALLING = 3;
const WALKING = 4;
const GAME_OVER = 5;

let gameState = MENU;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); 

// Platform color palette (Moved to global scope to prevent garbage collection lag)
const PLATFORM_COLORS = [
  '#333',    // 0–4
  '#f86b6b', // 5–9
  '#f8ad6b', // 10–14
  '#f8f86b', // 15–19
  '#6bf86b', // 20–24
  '#6bf8f8', // 25–29
  '#6b6bf8', // 30–34
  '#f86bf8'  // 35+
];

// Difficulty buttons config (Moved outside draw loop)
const DIFFICULTY_BUTTONS = [
  { label: 'Easy',   x: 60,  y: 220, width: 80, height: 40, speed: 2 },
  { label: 'Normal', x: 160, y: 220, width: 80, height: 40, speed: 4 },
  { label: 'Hard',   x: 260, y: 220, width: 80, height: 40, speed: 8 }
];

// ==========================================
// 2. GAME VARIABLES
// ==========================================
let platforms = [
  { x: 0, width: 60 },
  { x: 120, width: 50 },
  { x: 260, width: 40 }
];

let score = 0;
let highScore = 0;
let stickLength = 0;
let stickAngle = 0;
let stickSpeed = 4; // Set by difficulty
let heroX = platforms[0].x + platforms[0].width - 20; 
let heroSpeed = 4;

// Delta-time tracker to fix refresh rate / browser throttling lag
let lastTime = 0;

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================
function getPlatformColor(currentScore) {
  const index = Math.floor(currentScore / 5);
  return PLATFORM_COLORS[index % PLATFORM_COLORS.length];
}

function generateNextPlatform() {
  const minGap = 50;
  const maxGap = 130;
  const minWidth = 30;
  const maxWidth = 70;

  const lastPlatform = platforms[platforms.length - 1];
  const distance = Math.random() * (maxGap - minGap) + minGap;
  const newWidth = Math.random() * (maxWidth - minWidth) + minWidth;

  platforms.push({
    x: lastPlatform.x + lastPlatform.width + distance,
    width: newWidth
  });
}

function checkLanding() {
  const stickEnd = platforms[0].x + platforms[0].width + stickLength;
  const targetLeft = platforms[1].x;
  const targetRight = platforms[1].x + platforms[1].width;

  if (stickEnd >= targetLeft && stickEnd <= targetRight) {
    gameState = WALKING;
  } else {
    gameState = GAME_OVER;
  }
}

function resetGame() {
  score = 0;
  stickLength = 0;
  stickAngle = 0;
  platforms = [
    { x: 0, width: 60 },
    { x: 120, width: 50 },
    { x: 260, width: 40 }
  ];
  heroX = platforms[0].width - 20;
  gameState = MENU;
}

// ==========================================
// 4. DRAWING FUNCTION
// ==========================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw Menu Screen
  if (gameState === MENU) {
    ctx.fillStyle = '#333';
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bridge Builder', canvas.width / 2, 100);  
    ctx.font = '20px sans-serif';
    ctx.fillText('Select Difficulty', canvas.width / 2, 160);

    DIFFICULTY_BUTTONS.forEach(btn => {
      ctx.fillStyle = '#3498db';
      ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + 25);
    });

    ctx.textAlign = 'left';
    return;
  }

  // 2. Draw Platforms
  platforms.forEach((p, index) => {
    ctx.fillStyle = getPlatformColor(score + index);
    ctx.fillRect(p.x, 350, p.width, 150);
  });

  // 3. Draw Hero
  ctx.fillStyle = '#E74C3C';
  ctx.fillRect(heroX, 320, 20, 30);

  // 4. Draw Rotating Stick
  if (stickLength > 0) {
    ctx.save();
    const pivotX = platforms[0].x + platforms[0].width;
    const pivotY = 350;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(stickAngle);

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stickLength);
    ctx.stroke();

    ctx.restore();
  }

  // 5. Draw Scores
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Score: ${score}`, 20, 40);
  ctx.fillText(`High Score: ${highScore}`, 20, 70);

  // 6. Draw Game Over Overlay
  if (gameState === GAME_OVER) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, 220);
    ctx.font = '16px sans-serif';
    ctx.fillText('Click to Try Again', canvas.width / 2, 260);
    ctx.textAlign = 'left';
  }
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================
window.addEventListener('mousedown', function(e) {
  if (gameState === MENU) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    DIFFICULTY_BUTTONS.forEach(btn => {
      if (
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.width &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.height
      ) {
        stickSpeed = btn.speed;
        gameState = WAITING;
      }
    });
  } else if (gameState === WAITING) {
    gameState = GROWING;
  } else if (gameState === GAME_OVER) {
    resetGame();
  }
});

window.addEventListener('mouseup', function() {
  if (gameState === GROWING) {
    gameState = FALLING;
  }
});

// ==========================================
// 6. MAIN ANIMATION LOOP (DELTA TIME)
// ==========================================
function update(currentTime) {
  if (!lastTime) lastTime = currentTime;
  
  // Calculate seconds elapsed since last frame
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Normalize speed against 60 FPS standard reference
  const timeScale = dt > 0.1 ? 1 : dt * 60;

  if (gameState === GROWING) {
    stickLength += stickSpeed * timeScale;
  } else if (gameState === FALLING) {
    stickAngle += 0.08 * timeScale;
    if (stickAngle >= Math.PI / 2) {
      stickAngle = Math.PI / 2;
      checkLanding();
    }
  } else if (gameState === WALKING) {
    heroX += heroSpeed * timeScale;
    const targetX = platforms[1].x + platforms[1].width - 20;

    if (heroX >= targetX) {
      score++;

      // Shift platforms left
      const shiftDistance = platforms[1].x;
      platforms.forEach(p => p.x -= shiftDistance);

      platforms.shift();
      generateNextPlatform();

      heroX = platforms[0].width - 20;
      stickLength = 0;
      stickAngle = 0;
      gameState = WAITING;
    }
  }

  if (score > highScore) {
    highScore = score;
  }

  draw();
  requestAnimationFrame(update);
}

// Single startup execution point
requestAnimationFrame(update);