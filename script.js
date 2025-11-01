/* script.js — Snake amélioré : vitesse progressive + serpent multicolore */

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

  // --- Paramètres de grille ---
  const CELL = 20;
  const COLS = Math.floor(canvas.width / CELL);
  const ROWS = Math.floor(canvas.height / CELL);

  // --- État du jeu ---
  let snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = randomFood();
  let score = 0;
  let bestScore = loadBest();
  bestEl.textContent = bestScore;
  let running = false;
  let paused = false;
  let lastTime = 0;
  let acc = 0;

  // --- Vitesse progressive ---
  let moveInterval = 180; // lent au départ (ms entre déplacements)
  const speedIncrease = 6; // +6ms plus rapide à chaque fruit mangé
  const minSpeed = 60; // vitesse max (plus petit = plus rapide)

  let rafId = null;

  // Couleurs variées pour un serpent multicolore
  const COLORS = [
    "#ff4b5c", "#ff9a00", "#ffee00", "#00d084", "#00b4d8", "#0077b6", "#8338ec", "#ff006e"
  ];

  // ----------- Fonctions utilitaires ------------
  function loadBest() {
    const saved = localStorage.getItem('snake_best_v2');
    return saved ? parseInt(saved, 10) || 0 : 0;
  }

  function saveBest() {
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('snake_best_v2', bestScore);
      bestEl.textContent = bestScore;
    }
  }

  function randomFood() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    for (let attempt = 0; attempt < 1000; attempt++) {
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
    return { x: 0, y: 0 };
  }

  function gameOver(reason) {
    running = false;
    paused = false;
    cancelAnimationFrame(rafId);
    saveBest();
    alert(`Perdu — ${reason}`);
  }

  // ----------- Dessin du jeu (fond vert + grille + serpent + nourriture) ------------
  function draw() {
    // fond vert
    ctx.fillStyle = "#155724";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grille légère
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      const px = x * CELL + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      const py = y * CELL + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
    }

    // nourriture
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // serpent multicolore
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const sx = seg.x * CELL;
      const sy = seg.y * CELL;
      const color = COLORS[i % COLORS.length];
      ctx.fillStyle = color;
      ctx.fillRect(sx + 1, sy + 1, CELL - 2, CELL - 2);
    }

    // tête plus claire pour la distinguer
    const head = snake[snake.length - 1];
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(head.x * CELL + 3, head.y * CELL + 3, CELL - 6, CELL - 6);
  }

  // ----------- Logique du jeu ------------
  function step() {
    dir = nextDir;
    const head = {
      x: snake[snake.length - 1].x + dir.x,
      y: snake[snake.length - 1].y + dir.y,
    };

    // collisions
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      gameOver("mur");
      return;
    }
    for (let part of snake) {
      if (part.x === head.x && part.y === head.y) {
        gameOver("queue");
        return;
      }
    }

    // ajoute la tête
    snake.push(head);

    // mange ?
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      saveBest();
      food = randomFood();

      // accélération progressive
      moveInterval = Math.max(minSpeed, moveInterval - speedIncrease);
    } else {
      snake.shift(); // sinon enlève la queue
    }
  }

  // ----------- Boucle principale ------------
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (running && !paused) {
      acc += delta;
      while (acc >= moveInterval) {
        step();
        acc -= moveInterval;
      }
      draw();
    }

    rafId = requestAnimationFrame(loop);
  }

  // ----------- Contrôles ------------
  function setDirection(newDir) {
    if (snake.length > 1) {
      if (newDir.x === -dir.x && newDir.y === -dir.y) return;
    }
    nextDir = newDir;
  }

  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowUp" || k === "w" || k === "W") setDirection({ x: 0, y: -1 });
    if (k === "ArrowDown" || k === "s" || k === "S") setDirection({ x: 0, y: 1 });
    if (k === "ArrowLeft" || k === "a" || k === "A") setDirection({ x: -1, y: 0 });
    if (k === "ArrowRight" || k === "d" || k === "D") setDirection({ x: 1, y: 0 });
    if (k === " ") {
      if (running) paused = !paused;
      else start();
    }
  });

  // ----------- Boutons ------------
  function start() {
    if (!running) {
      running = true;
      paused = false;
      lastTime = 0;
      acc = 0;
      requestAnimationFrame(loop);
    }
  }

  startBtn.addEventListener("click", () => {
    if (running) paused = !paused;
    else start();
  });

  restartBtn.addEventListener("click", () => {
    snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    food = randomFood();
    score = 0;
    scoreEl.textContent = score;
    moveInterval = 180; // réinitialiser la vitesse lente
    paused = false;
    saveBest();
    start();
  });

  // ----------- Démarrage visuel ------------
  draw();
});
