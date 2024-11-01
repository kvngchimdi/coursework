const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
const scoreEl = document.querySelector("#scoreEl"); // Scoreboard element
const gameOverEl = document.querySelector("#gameOver"); // Game Over display
const startScreen = document.querySelector("#startScreen"); // Start screen element
const pauseScreen = document.querySelector("#pauseScreen"); // Pause screen element
const startButton = document.querySelector("#startButton"); // Start button
const resumeButton = document.querySelector("#resumeButton"); // Resume button
const restartButton = document.querySelector("#restartButton"); // Restart button
const leaderboardEl = document.querySelector("#leaderboard"); // Leaderboard element

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Audio elements
const backgroundMusic = new Audio("path/to/background-music.mp3");
const shootSound = new Audio("path/to/shoot.mp3");
const hitSound = new Audio("path/to/hit.mp3");

// Set the background music to loop
backgroundMusic.loop = true;

class Boundary {
  static width = 40;
  static height = 40;
  constructor({ position, image }) {
    this.position = position;
    this.width = 40;
    this.height = 40;
    this.image = image;
  }

  draw() {
    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
}

class Player {
  static width = 40;
  static height = 40;
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 10;
    this.speed = 5; // Default speed
    this.invincible = false; // Invincibility flag
    this.invincibleTime = 0; // Time remaining for invincibility
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.invincible ? "yellow" : "red"; // Change color if invincible
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Prevent player from moving out of bounds
    if (this.position.x < this.radius) this.position.x = this.radius;
    if (this.position.x > canvas.width - this.radius)
      this.position.x = canvas.width - this.radius;
    if (this.position.y < this.radius) this.position.y = this.radius;
    if (this.position.y > canvas.height - this.radius)
      this.position.y = canvas.height - this.radius;

    // Update invincibility timer
    if (this.invincible) {
      this.invincibleTime -= 1; // Decrease time
      if (this.invincibleTime <= 0) {
        this.invincible = false; // End invincibility
      }
    }
  }
}

class Ghost {
  static speed = 2; // Speed of the ghost
  constructor({ position, color = "green" }) {
    this.position = position;
    this.velocity = { x: 0, y: 0 }; // Initialize velocity to zero
    this.radius = 15;
    this.color = color;
    this.scared = false; // Indicates if the ghost is scared
    this.changeDirectionInterval = 1000; // Change direction every second
    this.lastDirectionChange = 0; // Timestamp of the last direction change
    this.randomDirection(); // Initialize a random direction
  }

  randomDirection() {
    const angle = Math.random() * Math.PI * 2; // Random angle in radians
    this.velocity.x = Math.cos(angle) * Ghost.speed; // Set x velocity based on angle
    this.velocity.y = Math.sin(angle) * Ghost.speed; // Set y velocity based on angle
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.scared ? "blue" : this.color; // Change color if scared
    c.fill();
    c.closePath();
  }

  // Check for collision with boundaries
  collidesWithBoundary(boundary) {
    return (
      this.position.x + this.radius > boundary.position.x &&
      this.position.x - this.radius < boundary.position.x + boundary.width &&
      this.position.y + this.radius > boundary.position.y &&
      this.position.y - this.radius < boundary.position.y + boundary.height
    );
  }

  update(boundaries, timestamp) {
    this.draw();

    // Change direction at regular intervals
    if (timestamp - this.lastDirectionChange > this.changeDirectionInterval) {
      this.randomDirection();
      this.lastDirectionChange = timestamp; // Update the last change time
    }

    // Calculate the next position
    const nextPosition = {
      x: this.position.x + this.velocity.x,
      y: this.position.y + this.velocity.y,
    };

    // Check for collisions with boundaries
    for (const boundary of boundaries) {
      if (this.collidesWithBoundary(boundary)) {
        this.randomDirection(); // Change direction if hitting a boundary
        break;
      }
    }

    // Update the ghost's position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Prevent ghost from moving out of bounds
    if (this.position.x < this.radius) {
      this.position.x = this.radius;
      this.randomDirection(); // Change direction if hitting left boundary
    }
    if (this.position.x > canvas.width - this.radius) {
      this.position.x = canvas.width - this.radius;
      this.randomDirection(); // Change direction if hitting right boundary
    }
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.randomDirection(); // Change direction if hitting top boundary
    }
    if (this.position.y > canvas.height - this.radius) {
      this.position.y = canvas.height - this.radius;
      this.randomDirection(); // Change direction if hitting bottom boundary
    }
  }
}

// Bullet class
class Bullet {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = "orange";
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Remove bullet if it goes off-screen
    if (
      this.position.y < 0 ||
      this.position.y > canvas.height ||
      this.position.x < 0 ||
      this.position.x > canvas.width
    ) {
      return false; // Indicate that the bullet should be removed
    }
    return true; // Indicate that the bullet is still active
  }
}

// Power-up class
class PowerUp {
  constructor({ position, type }) {
    this.position = position;
    this.type = type;
    this.radius = 10;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = "green"; // Change color based on type
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
  }
}

const boundaries = [];
const ghosts = [
  new Ghost({
    position: {
      x: Boundary.width * 6 + Boundary.width / 2,
      y: Boundary.height + Boundary.height / 2,
    },
    color: "green",
  }),
  new Ghost({
    position: {
      x: Boundary.width * 10 + Boundary.width / 2,
      y: Boundary.height + Boundary.height / 2,
    },
    velocity: { x: -Ghost.speed, y: -Ghost.speed },
    color: "pink",
  }),
  new Ghost({
    position: {
      x: Boundary.width + Boundary.width / 2,
      y: Boundary.height * 8 + Boundary.height / 2,
    },
    velocity: { x: -Ghost.speed, y: -Ghost.speed },
    color: "purple",
  }),
];

// Map setup
const map = [
  ["1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "2"],
  ["|", " ", " ", " ", " ", " ", "b", " ", " ", "b", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "|"],
  ["|", " ", " ", "b", " ", " ", " ", " ", "p", " ", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", "b", " ", " ", "b", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "|"],
  ["|", " ", " ", "b", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", "b", " ", " ", "b", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", "b", " ", " ", "b", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "|"],
  ["|", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "|"],
  ["4", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3"],
];

function createImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

map.forEach((row, i) => {
  row.forEach((symbol, j) => {
    switch (symbol) {
      case "-":
        boundaries.push(
          new Boundary({
            position: { x: Boundary.width * j, y: Boundary.height * i },
            image: createImage("../img/pipeHorizontal.png"),
          })
        );
        break;
      case "|":
        boundaries.push(
          new Boundary({
            position: { x: Boundary.width * j, y: Boundary.height * i },
            image: createImage("../img/pipeVertical.png"),
          })
        );
        break;
      case "1":
        boundaries.push(
          new Boundary({
            position: { x: Boundary.width * j, y: Boundary.height * i },
            image: createImage("../img/pipeCorner1.png"),
          })
        );
        break;
      case "2":
        boundaries.push(
          new Boundary({
            position: { x: Boundary.width * j, y: Boundary.height * i },
            image: createImage("../img/pipeCorner2.png"),
          })
        );
        break;
      case "3":
        boundaries.push(
          new Boundary({
            position: { x: Boundary.width * j, y: Boundary.height * i },
            image: createImage("../img/pipeCorner3.png"),
          })
        );
        break;
      case "4":
        boundaries.push(
          new Boundary({
            position: { x: Boundary.width * j, y: Boundary.height * i },
            image: createImage("../img/pipeCorner4.png"),
          })
        );
        break;
      case "b":
        boundaries.push(
          new Boundary({
            position: { x: Boundary.width * j, y: Boundary.height * i },
            image: createImage("../img/block.png"),
          })
        );
        break;
    }
  });
});

// Calculate the center position of the boundaries
const centerX = (Boundary.width * (map[0].length - 1)) / 2;
const centerY = (Boundary.height * (map.length - 1)) / 2;

const player = new Player({
  position: {
    x: centerX + Boundary.width / 2, // Centering the player horizontally
    y: centerY + Boundary.height / 2, // Centering the player vertically
  },
  velocity: { x: 0, y: 0 },
});

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false },
};

let lastkey = "";
let score = 0; // Initialize score
const bullets = []; // Array to store all bullets
const powerUps = []; // Array to store all power-ups
let gameOver = false; // Game over condition
let paused = false; // Pause condition

// Spawn power-ups
function spawnPowerUps() {
  const powerUpTypes = ["speedBoost", "invincibility"];
  const randomType =
    powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  const powerUp = new PowerUp({
    position: {
      x: Math.random() * (canvas.width - 20),
      y: Math.random() * (canvas.height - 20),
    },
    type: randomType,
  });
  powerUps.push(powerUp);
}

// Update power-ups
function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.update();

    // Check if player collects power-up
    if (
      Math.hypot(
        player.position.x - powerUp.position.x,
        player.position.y - powerUp.position.y
      ) <
      player.radius + powerUp.radius
    ) {
      // Apply power-up effect
      if (powerUp.type === "speedBoost") {
        player.speed = 10; // Increase speed
        setTimeout(() => {
          player.speed = 5; // Reset speed after 5 seconds
        }, 5000);
      } else if (powerUp.type === "invincibility") {
        player.invincible = true; // Make player invincible
        player.invincibleTime = 100; // Set invincibility time
      }

      // Remove power-up
      powerUps.splice(i, 1);
    }
  }
}

// Bullet shooting
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "f": // Shoot bullet upwards
      bullets.push(
        new Bullet({
          position: {
            x: player.position.x,
            y: player.position.y - player.radius,
          },
          velocity: { x: 0, y: -5 },
        })
      );
      shootSound.currentTime = 0; // Reset sound to the beginning
      shootSound.play(); // Play shooting sound
      break;
    case "c": // Shoot bullet downwards
      bullets.push(
        new Bullet({
          position: {
            x: player.position.x,
            y: player.position.y + player.radius,
          },
          velocity: { x: 0, y: 5 },
        })
      );
      shootSound.currentTime = 0; // Reset sound to the beginning
      shootSound.play(); // Play shooting sound
      break;
    case "x": // Shoot bullet to the left
      bullets.push(
        new Bullet({
          position: {
            x: player.position.x - player.radius,
            y: player.position.y,
          },
          velocity: { x: -5, y: 0 },
        })
      );
      shootSound.currentTime = 0; // Reset sound to the beginning
      shootSound.play(); // Play shooting sound
      break;
    case "e": // Shoot bullet to the right
      bullets.push(
        new Bullet({
          position: {
            x: player.position.x + player.radius,
            y: player.position.y,
          },
          velocity: { x: 5, y: 0 },
        })
      );
      shootSound.currentTime = 0; // Reset sound to the beginning
      shootSound.play(); // Play shooting sound
      break;
  }
});

// Bullet collision detection
function bulletCollidesWithBoundary(bullet, boundary) {
  return (
    bullet.position.x + bullet.radius > boundary.position.x &&
    bullet.position.x - bullet.radius < boundary.position.x + boundary.width &&
    bullet.position.y + bullet.radius > boundary.position.y &&
    bullet.position.y - bullet.radius < boundary.position.y + boundary.height
  );
}

function bulletCollidesWithGhost(bullet, ghost) {
  return (
    Math.hypot(
      bullet.position.x - ghost.position.x,
      bullet.position.y - ghost.position.y
    ) <
    bullet.radius + ghost.radius
  );
}

// Function to check for game over
function checkGameOver() {
  for (const ghost of ghosts) {
    if (
      Math.hypot(
        player.position.x - ghost.position.x,
        player.position.y - ghost.position.y
      ) <
      player.radius + ghost.radius
    ) {
      gameOver = true;
      backgroundMusic.pause(); // Stop background music
      gameOverEl.style.display = "block"; // Show game over message
      break;
    }
  }
}

function animate(timestamp) {
  if (gameOver) return; // Stop the game loop if game is over
  if (paused) return; // Stop the game loop if paused
  requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);
  player.update();
  boundaries.forEach((boundary) => boundary.draw());

  // Update ghosts and pass the player's position and boundaries
  ghosts.forEach((ghost) => ghost.update(boundaries, timestamp));

  // Update bullets and check for collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    if (!bullet.update()) {
      bullets.splice(i, 1); // Remove bullet if out of bounds
      continue;
    }

    // Check collision with boundaries
    for (let j = 0; j < boundaries.length; j++) {
      if (bulletCollidesWithBoundary(bullet, boundaries[j])) {
        bullets.splice(i, 1); // Remove bullet
        break;
      }
    }

    // Check collision with ghosts
    for (let j = ghosts.length - 1; j >= 0; j--) {
      if (bulletCollidesWithGhost(bullet, ghosts[j])) {
        bullets.splice(i, 1); // Remove bullet
        ghosts.splice(j, 1); // Remove ghost
        score += 50; // Increase score
        scoreEl.textContent = `Score: ${score}`; // Update score
        hitSound.currentTime = 0; // Reset sound to the beginning
        hitSound.play(); // Play hit sound
        break;
      }
    }
  }

  // Update power-ups
  updatePowerUps();

  // Check for game over condition
  checkGameOver();
}

// Handle key presses for player movement
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "w":
      keys.w.pressed = true;
      lastkey = "w";
      break;
    case "a":
      keys.a.pressed = true;
      lastkey = "a";
      break;
    case "s":
      keys.s.pressed = true;
      lastkey = "s";
      break;
    case "d":
      keys.d.pressed = true;
      lastkey = "d";
      break;
    case "p": // Pause game
      paused = !paused;
      if (paused) {
        pauseScreen.style.display = "block";
      } else {
        pauseScreen.style.display = "none";
      }
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
      keys.w.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
    case "s":
      keys.s.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
  }
});

// Game loop
function gameLoop() {
  if (gameOver) {
    return; // Exit if the game is over
  }

  player.velocity.y = 0;
  player.velocity.x = 0;

  if (keys.w.pressed) player.velocity.y = -player.speed;
  if (keys.a.pressed) player.velocity.x = -player.speed;
  if (keys.s.pressed) player.velocity.y = player.speed;
  if (keys.d.pressed) player.velocity.x = player.speed;

  animate(performance.now());
}

// Start the game loop
startButton.addEventListener("click", () => {
  startScreen.style.display = "none";
  backgroundMusic.play(); // Start playing background music
  gameLoop();
});

// Resume button event listener
resumeButton.addEventListener("click", () => {
  pauseScreen.style.display = "none";
  paused = false;
  gameLoop();
});

// Restart button event listener
restartButton.addEventListener("click", () => {
  gameOverEl.style.display = "none";
  gameOver = false;
  score = 0;
  scoreEl.textContent = `Score: ${score}`;
  ghosts.length = 0;
  bullets.length = 0;
  powerUps.length = 0;
  player.position = {
    x: Boundary.width + Boundary.width / 2,
    y: Boundary.height + Boundary.height / 2,
  };
  gameLoop();
});

// Handle window resizing
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Leaderboard
function updateLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("scores")) || [];
  scores.push(score);
  scores.sort((a, b) => b - a);
  scores.splice(10); // Keep only the top 10 scores
  localStorage.setItem("scores", JSON.stringify(scores));
  leaderboardEl.innerHTML = "";
  scores.forEach((score) => {
    const li = document.createElement("li");
    li.textContent = `Score: ${score}`;
    leaderboardEl.appendChild(li);
  });
}

// Update leaderboard when game is over
gameOverEl.addEventListener("click", () => {
  updateLeaderboard();
});
