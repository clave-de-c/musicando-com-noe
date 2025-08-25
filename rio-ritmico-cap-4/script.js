document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const victoryOverlay = document.getElementById('victory-overlay');
    const playButton = document.getElementById('play-button');
    const instructionsButton = document.getElementById('instructions-button');
    const closeInstructionsButton = document.getElementById('close-instructions-button');
    const exitButton = document.getElementById('exit-button');
    const playAgainButton = document.getElementById('play-again-button');
    const backToMenuButton = document.getElementById('back-to-menu-button');
    
    const gameArea = document.getElementById('game-area');
    const hitZone = document.getElementById('hit-zone');
    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const feedbackText = document.getElementById('feedback-text');
    const waterLevel = document.getElementById('water-level');
    
    // Áudios
    const backgroundMusic = document.getElementById('audio-background');
    const hitSound = document.getElementById('audio-hit');
    const correctSound = document.getElementById('audio-correct');
    const wrongSound = document.getElementById('audio-wrong');

    // --- ESTADO DO JOGO ---
    let score = 0;
    let level = 1;
    const targetScore = 300;
    let gameLoop;
    let fallSpeed = 5;
    let timeSinceLastDrop = 0;

    const rhythmPatterns = {
        level1: [1500, 1500, 2500],
        level2: [1200, 600, 600, 2000],
        level3: [600, 600, 600, 600, 1200, 1200]
    };
    let currentPattern = [];
    let patternIndex = 0;

    // --- CONTROLE DE TELAS ---
    playButton.addEventListener('click', startGame);
    instructionsButton.addEventListener('click', () => instructionsOverlay.classList.remove('hidden'));
    closeInstructionsButton.addEventListener('click', () => instructionsOverlay.classList.add('hidden'));
    exitButton.addEventListener('click', returnToMenu);
    playAgainButton.addEventListener('click', () => {
        victoryOverlay.classList.add('hidden');
        startGame();
    });
    backToMenuButton.addEventListener('click', () => {
        victoryOverlay.classList.add('hidden');
        returnToMenu();
    });

    function startGame() {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        backgroundMusic.pause();
        score = 0;
        level = 1;
        fallSpeed = 5;
        updateScore();
        updateLevelDisplay();
        currentPattern = rhythmPatterns.level1;
        patternIndex = 0;
        timeSinceLastDrop = 0;
        gameLoop = setInterval(updateGame, 100);
    }

    function returnToMenu() {
        gameContainer.classList.add('hidden');
        startScreen.classList.remove('hidden');
        clearInterval(gameLoop);
        document.querySelectorAll('.raindrop').forEach(drop => drop.remove());
        backgroundMusic.play().catch(()=>{});
    }
    
    function updateGame() {
        timeSinceLastDrop += 100;
        if (timeSinceLastDrop >= currentPattern[patternIndex]) {
            createRaindrop();
            timeSinceLastDrop = 0;
            patternIndex = (patternIndex + 1) % currentPattern.length;
        }
    }

    function createRaindrop() {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = `${Math.random() * (gameArea.clientWidth - 40)}px`;
        drop.style.animationDuration = `${fallSpeed}s`;
        gameArea.appendChild(drop);
        setTimeout(() => {
            if (drop.parentNode) {
                handleHit(true);
                gameArea.removeChild(drop);
            }
        }, fallSpeed * 1000);
    }

    function handleHit(missed = false) {
        if (missed) {
            playWrongSound();
            updateScore();
            return;
        }
        const hitZoneRect = hitZone.getBoundingClientRect();
        let hit = false;
        document.querySelectorAll('.raindrop').forEach(drop => {
            const dropRect = drop.getBoundingClientRect();
            if (dropRect.bottom > hitZoneRect.top - 10 && dropRect.top < hitZoneRect.bottom + 10) {
                playCorrectSound();
                score += 10;
                gameArea.removeChild(drop);
                hit = true;
            }
        });
        if (!hit) {
            playWrongSound();
        }
        updateScore();
        updateLevel();
        checkWinCondition();
    }

    function playCorrectSound() {
        hitSound.currentTime = 0; hitSound.play();
        correctSound.currentTime = 0; correctSound.play();
        createParticles();
    }

    function playWrongSound() {
        wrongSound.currentTime = 0; wrongSound.play();
        score -= 5;
    }
    
    function createParticles() {
        const hitZoneRect = hitZone.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = `${hitZoneRect.left - gameAreaRect.left + (hitZoneRect.width * Math.random())}px`;
            p.style.top = `${hitZoneRect.top - gameAreaRect.top + (hitZoneRect.height / 2)}px`;
            const size = Math.random() * 8 + 2;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            p.style.setProperty('--x', `${x}px`);
            p.style.setProperty('--y', `${y}px`);
            gameArea.appendChild(p);
            setTimeout(() => { p.remove(); }, 700);
        }
    }

    function updateScore() {
        if (score < 0) score = 0;
        scoreDisplay.textContent = `Pontos: ${score} / ${targetScore}`;
        waterLevel.style.height = `${(score / targetScore) * 100}%`;
    }

    function updateLevel() {
        let newLevel = 1;
        if (score >= 200) newLevel = 3;
        else if (score >= 100) newLevel = 2;
        if (newLevel !== level) {
            level = newLevel;
            feedbackText.textContent = `Nível ${level}!`;
            setTimeout(() => feedbackText.textContent = '', 2000);
            updateLevelDisplay();
            if (level === 2) { fallSpeed = 4.5; currentPattern = rhythmPatterns.level2; }
            if (level === 3) { fallSpeed = 4; currentPattern = rhythmPatterns.level3; }
        }
    }
    
    function updateLevelDisplay() {
        levelDisplay.textContent = `Nível: ${level}`;
    }
    
    function checkWinCondition() {
        if (score >= targetScore) {
            clearInterval(gameLoop);
            document.querySelectorAll('.raindrop').forEach(drop => drop.remove());
            victoryOverlay.classList.remove('hidden');
        }
    }
    
    gameArea.addEventListener('click', () => handleHit(false));
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameContainer.classList.contains('hidden')) {
            e.preventDefault();
            handleHit(false);
        }
    });
    
    function userInteractionHandler() {
        if (backgroundMusic.paused) { backgroundMusic.play().catch(()=>{}); }
    }
    document.body.addEventListener('click', userInteractionHandler, { once: true });
    
    backgroundMusic.volume = 0.05;
    hitSound.volume = 0.5;
    correctSound.volume = 0.4;
    wrongSound.volume = 0.4;
});