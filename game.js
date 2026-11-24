// 1. Game states
const MENU = 0; // New menu state!
const WAITING = 1;
const GROWING = 2; 
const FALLING = 3;
const WALKING = 4;
const GAME_OVER = 5;

let gameState = MENU; // Start the game in the MENU state

// 2. Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); 

// 3. Platform definitions (Array of 3 platforms)
let platforms = [
  { x: 0, width: 60 },
  { x: 120, width: 50 },
  { x: 260, width: 40 }
];

// 4. Game variables
let score = 0;
let highScore = 0;
let stickLength = 0;
let stickAngle = 0;
let heroX = platforms[0].x + platforms[0].width - 20; 
let heroSpeed = 4;

let stickSpeed = 4; // Default speed

// Button locations and sizes: { label, x, y, width, height, speed }
const difficultyButtons = [
  { label: 'Easy',   x: 60,  y: 220, width: 80, height: 40, speed: 2 },
  { label: 'Normal', x: 160, y: 220, width: 80, height: 40, speed: 4 },
  { label: 'Hard',   x: 260, y: 220, width: 80, height: 40, speed: 8 }
];

const platformColors = [
  '#333',    // 0–4
  '#f86b6b', // 5–9
  '#f8ad6b', // 10–14
  '#f8f86b', // 15–19
  '#6bf86b', // 20–24
  '#6bf8f8', // 25–29
  '#6b6bf8', // 30–34
  '#f86bf8'  // 35+
];

function getPlatformColor(currentScore) {
  const index = Math.floor(currentScore / 5);
  return platformColors[index % platformColors.length];
}

// 5. Draw function
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all platforms in the array
  platforms.forEach((p, index) => {
    ctx.fillStyle = getPlatformColor(score + index);
    ctx.fillRect(p.x, 350, p.width, 150);
  });

  // Draw Red Hero
  ctx.fillStyle = '#E74C3C';
  ctx.fillRect(heroX, 320, 20, 30);

  // Draw Rotating Stick
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

  // Draw Score & Overlay
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Score: ${score}`, 20, 40);
  ctx.fillText(`High Score: ${highScore}`, 20, 70);

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
  if (gameState === MENU) {
    // Title
    ctx.fillStyle = '#333';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select Difficulty', canvas.width / 2, 160);

    // Draw Easy, Normal, and Hard Buttons
    difficultyButtons.forEach(btn => {
      // Button background
      ctx.fillStyle = '#3498db';
      ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

      // Button label
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + 25);
    });

    ctx.textAlign = 'left'; // Reset text alignment
    return; // Stop drawing the rest of the game elements while in menu!
  }
}

// 6. Helper functions
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

// 7. Event listeners
window.addEventListener('mousedown', function(e) {
  if (gameState === MENU) {
    // Get mouse coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if click was inside any button
    difficultyButtons.forEach(btn => {
      if (
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.width &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.height
      ) {
        stickSpeed = btn.speed; // Set speed (2, 4, or 8)
        gameState = WAITING;    // Start the game!
      }
    });
  } else if (gameState === WAITING) {
    gameState = GROWING;
  } else if (gameState === GAME_OVER) {
    score = 0;
    stickLength = 0;
    stickAngle = 0;
    platforms = [
      { x: 0, width: 60 },
      { x: 120, width: 50 },
      { x: 260, width: 40 }
    ];
    heroX = platforms[0].width - 20;
    gameState = MENU; // Return to difficulty menu on restart!
  }
});

window.addEventListener('mouseup', function() {
  if (gameState === GROWING) {
    gameState = FALLING;
  }
});


// 8. Main game loop
function update() {
  if (gameState === GROWING) {
    stickLength += stickSpeed;
  } else if (gameState === FALLING) {
    stickAngle += 0.08;
    if (stickAngle >= Math.PI / 2) {
      stickAngle = Math.PI / 2;
      checkLanding();
    }
  } else if (gameState === WALKING) {
    heroX += heroSpeed;
    const targetX = platforms[1].x + platforms[1].width - 20;

    if (heroX >= targetX) {
      score++;

      // Shift platforms left
      const shiftDistance = platforms[1].x;
      platforms.forEach(p => p.x -= shiftDistance);

      // Remove passed platform and generate new 3rd platform
      platforms.shift();
      generateNextPlatform();

      // Reset positions for next turn
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

// Start game
update();