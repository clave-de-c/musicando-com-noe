document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay'); // Novo elemento

    // --- BOTÕES ---
    const playButton = document.getElementById('play-button');
    const instructionsButton = document.getElementById('instructions-button');
    const closeInstructionsButton = document.getElementById('close-instructions-button');
    const exitButton = document.getElementById('exit-button');
    const restartButton = document.getElementById('restart-button'); // Novo botão
    const controlButtons = document.querySelectorAll('.control-button');

    // --- ELEMENTOS DO JOGO ---
    const noeChar = document.getElementById('noe-char');
    const scoreDisplay = document.getElementById('score');
    const feedbackText = document.getElementById('feedback-text');
    const finalScoreText = document.getElementById('final-score-text'); // Novo elemento
    
    // --- ÁUDIOS ---
    const sounds = { palma: document.getElementById('audio-palma'), pe: document.getElementById('audio-pe'), estalo: document.getElementById('audio-estalo') };
    const backgroundMusic = document.getElementById('audio-background');

    // --- ESTADO DO JOGO ---
    let gameSequence = [], playerSequence = [], score = 0, isPlayerTurn = false;
    const soundKeys = ['palma', 'pe', 'estalo'];

    // --- CONTROLE DE TELAS E MÚSICA ---
    playButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', () => {
        gameOverOverlay.classList.add('hidden');
        startGame();
    });
    instructionsButton.addEventListener('click', () => { instructionsOverlay.classList.remove('hidden'); });
    closeInstructionsButton.addEventListener('click', () => { instructionsOverlay.classList.add('hidden'); });
    exitButton.addEventListener('click', () => { gameOver(true); });

    function startGame() {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        gameSequence = [];
        score = 0;
        updateScore(0);
        feedbackText.textContent = 'Preste atenção...';
        
        setTimeout(nextTurn, 1000);
    }

    // --- LÓGICA DO JOGO ---
    function nextTurn() {
        isPlayerTurn = false;
        playerSequence = [];
        updateScore(score);
        feedbackText.textContent = 'Observe a sequência!';
        const randomIndex = Math.floor(Math.random() * soundKeys.length);
        gameSequence.push(soundKeys[randomIndex]);
        playSequence();
    }

    function playSequence() {
        let delay = 0;
        for (const sound of gameSequence) {
            setTimeout(() => playSoundAndHighlight(sound), delay);
            delay += 800;
        }
        setTimeout(() => {
            isPlayerTurn = true;
            feedbackText.textContent = 'Sua vez! Repita a sequência.';
        }, delay);
    }

    function playSoundAndHighlight(sound) {
        const button = document.querySelector(`.control-button[data-sound="${sound}"]`);
        if (!button) return;
        sounds[sound].currentTime = 0;
        sounds[sound].play();
        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 400);
    }

    function handlePlayerInput(sound) {
        if (!isPlayerTurn) return;
        playerSequence.push(sound);
        playSoundAndHighlight(sound);
        checkPlayerSequence();
    }

    function checkPlayerSequence() {
        const index = playerSequence.length - 1;
        if (playerSequence[index] !== gameSequence[index]) {
            gameOver(false);
            return;
        }
        if (playerSequence.length === gameSequence.length) {
            isPlayerTurn = false;
            score++;
            feedbackText.textContent = 'Correto!';
            celebrate();
            setTimeout(nextTurn, 1500);
        }
    }

    function celebrate() {
        noeChar.classList.add('celebrate');
        setTimeout(() => noeChar.classList.remove('celebrate'), 500);
    }

    function gameOver(isExiting) {
        gameContainer.classList.add('hidden');
        isPlayerTurn = false;
        
        if (isExiting) {
            startScreen.classList.remove('hidden');
            backgroundMusic.currentTime = 0;
            backgroundMusic.play().catch(()=>{});
        } else {
            // Mostra a nova tela de Fim de Jogo
            finalScoreText.textContent = `Sua pontuação final foi: ${score}`;
            gameOverOverlay.classList.remove('hidden');
        }
    }
    
    function updateScore(newScore) {
        scoreDisplay.textContent = `Pontuação: ${newScore}`;
    }

    // --- CONTROLES DE MOUSE E TECLADO ---
    controlButtons.forEach(button => {
        button.addEventListener('click', () => handlePlayerInput(button.dataset.sound));
    });

    window.addEventListener('keydown', (e) => {
        if (gameContainer.classList.contains('hidden')) return;
        const key = e.key.toUpperCase();
        const button = document.querySelector(`.control-button[data-key="${key}"]`);
        if (button) {
            handlePlayerInput(button.dataset.sound);
        }
    });

    // --- INICIA MÚSICA DE FUNDO ---
    function userInteractionHandler() {
        if (backgroundMusic.paused && startScreen.classList.contains('hidden') === false) {
             backgroundMusic.play().catch(()=>{});
        }
    }
    document.body.addEventListener('click', userInteractionHandler, { once: true });
    document.body.addEventListener('keydown', userInteractionHandler, { once: true });
    backgroundMusic.volume = 0.1;
});