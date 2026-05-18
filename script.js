const birthday = new Date("2026-07-14T00:00:00+05:30").getTime();
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
});

const timerIds = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds")
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const diff = Math.max(0, birthday - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  timerIds.days.textContent = pad(days);
  timerIds.hours.textContent = pad(hours);
  timerIds.minutes.textContent = pad(minutes);
  timerIds.seconds.textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const canvas = document.querySelector("#sky-canvas");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let particles = [];

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makeParticle(x, y, type = "confetti") {
  const colors = ["#ffd86b", "#74c9ff", "#ffffff", "#ffc9dd", "#bff5df"];
  const angle = Math.random() * Math.PI * 2;
  const speed = type === "firework" ? 2 + Math.random() * 6 : 0.7 + Math.random() * 2.3;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed + (type === "confetti" ? 1.4 : 0),
    size: type === "firework" ? 2 + Math.random() * 3 : 4 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: type === "firework" ? 80 + Math.random() * 28 : 150 + Math.random() * 90,
    maxLife: type === "firework" ? 108 : 240,
    spin: Math.random() * Math.PI,
    type
  };
}

function burst(x, y) {
  for (let i = 0; i < 86; i += 1) {
    particles.push(makeParticle(x, y, "firework"));
  }
}

function confettiDrift() {
  if (particles.length < 190) {
    for (let i = 0; i < 4; i += 1) {
      particles.push(makeParticle(Math.random() * width, -20, "confetti"));
    }
  }
}

function drawParticle(particle) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.spin);
  ctx.fillStyle = particle.color;

  if (particle.type === "firework") {
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65);
  }

  ctx.restore();
}

function animateSky() {
  ctx.clearRect(0, 0, width, height);
  confettiDrift();

  particles = particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.type === "firework" ? 0.035 : 0.012;
    particle.vx += Math.sin(particle.life * 0.06) * 0.01;
    particle.spin += 0.08;
    particle.life -= 1;
    drawParticle(particle);
    return particle.life > 0 && particle.y < height + 80;
  });

  requestAnimationFrame(animateSky);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(animateSky);

setTimeout(() => burst(width * 0.22, height * 0.22), 360);
setTimeout(() => burst(width * 0.72, height * 0.26), 760);
setTimeout(() => burst(width * 0.5, height * 0.18), 1160);

let isPlaying = false;
const musicButton = document.querySelector(".music-toggle");
const birthdayMusic = document.querySelector("#birthday-music");
let musicWasRequested = false;
let lastMusicToggle = 0;

if (birthdayMusic) {
  birthdayMusic.volume = 0.8;
  birthdayMusic.muted = false;
  birthdayMusic.playsInline = true;
  birthdayMusic.load();
}

function setMusicState(playing) {
  isPlaying = playing;
  musicButton.classList.toggle("is-playing", playing);
  musicButton.setAttribute("aria-pressed", String(playing));
  musicButton.setAttribute("title", playing ? "Music playing" : "Play music");
  musicButton.querySelector(".music-icon").textContent = playing ? "❚❚" : "♪";
}

async function startMusic(userRequested = false) {
  if (!birthdayMusic) return;
  musicWasRequested = true;

  try {
    birthdayMusic.muted = false;
    birthdayMusic.volume = 0.8;
    if (birthdayMusic.readyState < 2) {
      birthdayMusic.load();
    }
    await birthdayMusic.play();
    setMusicState(true);
  } catch (error) {
    setMusicState(false);
    if (userRequested) {
      musicButton.setAttribute("title", "Tap to start music");
    }
  }
}

function stopMusic() {
  if (!birthdayMusic) return;

  musicWasRequested = false;
  birthdayMusic.pause();
  setMusicState(false);
}

window.addEventListener("load", () => {
  startMusic(false);
});

function handleFirstGesture(event) {
  if (event.target && event.target.closest && event.target.closest(".music-toggle")) return;

  if (birthdayMusic && birthdayMusic.paused) {
    startMusic(false);
  }
}

document.addEventListener("pointerdown", handleFirstGesture, { once: true });
document.addEventListener("touchstart", handleFirstGesture, { once: true, passive: true });

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && birthdayMusic && birthdayMusic.paused && musicWasRequested) {
    startMusic(false);
  }
});

if (birthdayMusic) {
  birthdayMusic.addEventListener("play", () => setMusicState(true));
  birthdayMusic.addEventListener("pause", () => setMusicState(false));
}

async function toggleMusic(event) {
  event.preventDefault();
  event.stopPropagation();

  const now = Date.now();
  if (now - lastMusicToggle < 450) return;
  lastMusicToggle = now;

  if (birthdayMusic && !birthdayMusic.paused) {
    stopMusic();
  } else {
    await startMusic(true);
  }
}

musicButton.addEventListener("pointerdown", toggleMusic);
musicButton.addEventListener("touchstart", toggleMusic, { passive: false });
musicButton.addEventListener("click", toggleMusic);
