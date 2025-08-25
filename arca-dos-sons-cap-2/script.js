document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const victoryOverlay = document.getElementById('victory-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');

    // --- BOTÕES ---
    const playButton = document.getElementById('play-button');
    const instructionsButton = document.getElementById('instructions-button');
    const closeInstructionsButton = document.getElementById('close-instructions-button');
    const exitButton = document.getElementById('exit-button');
    const restartButton = document.getElementById('restart-button');
    const playAgainButton = document.getElementById('play-again-button');
    const tools = document.querySelectorAll('.tool');

    // --- ELEMENTOS DO JOGO ---
    const levelDisplay = document.getElementById('level-display');
    const feedbackText = document.getElementById('feedback-text');
    const arkPieces = document.querySelectorAll('.ark-piece');
    const finalScoreText = document.getElementById('final-score-text');
    
    // --- ÁUDIOS ---
    const sounds = { hammer: document.getElementById('audio-hammer'), saw: document.getElementById('audio-saw'), sander: document.getElementById('audio-sander') };
    const backgroundMusic = document.getElementById('audio-background');
    const correctSound = document.getElementById('audio-correct');
    const wrongSound = document.getElementById('audio-wrong');

    // --- ESTADO DO JOGO ---
    let sequence = [], playerSequence = [], level = 1, isPlayerTurn = false;
    const totalLevels = 10;
    const toolKeys = ['hammer', 'sander', 'saw'];

    // --- CONTROLE DE TELAS E MÚSICA ---
    playButton.addEventListener('click', startGame);
    instructionsButton.addEventListener('click', () => instructionsOverlay.classList.remove('hidden'));
    closeInstructionsButton.addEventListener('click', () => instructionsOverlay.classList.add('hidden'));
    exitButton.addEventListener('click', returnToMenu);
    restartButton.addEventListener('click', () => { gameOverOverlay.classList.add('hidden'); startGame(); });
    playAgainButton.addEventListener('click', () => { victoryOverlay.classList.add('hidden'); startGame(); });

    function startGame() {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        level = 1;
        sequence = [];
        updateArkVisual();
        setTimeout(nextTurn, 500);
    }

    function returnToMenu() {
        gameContainer.classList.add('hidden');
        startScreen.classList.remove('hidden');
        backgroundMusic.play().catch(()=>{});
    }

    // --- LÓGICA DO JOGO ---
    function nextTurn() {
        isPlayerTurn = false;
        playerSequence = [];
        levelDisplay.textContent = `Nível: ${level}`;
        feedbackText.textContent = 'Observe a sequência...';
        
        if (level > sequence.length) {
            const randomIndex = Math.floor(Math.random() * toolKeys.length);
            sequence.push(toolKeys[randomIndex]);
        }
        
        playSequence();
    }

    function playSequence() {
        let delay = 0;
        tools.forEach(tool => tool.style.pointerEvents = 'none');

        for (const toolKey of sequence) {
            setTimeout(() => playSoundAndHighlight(toolKey), delay);
            delay += 1000;
        }

        setTimeout(() => {
            isPlayerTurn = true;
            feedbackText.textContent = 'Sua vez!';
            tools.forEach(tool => tool.style.pointerEvents = 'auto');
        }, delay);
    }

    function playSoundAndHighlight(toolKey) {
        const toolElement = document.querySelector(`.tool[data-tool="${toolKey}"]`);
        if (!toolElement) return;
        sounds[toolKey].currentTime = 0;
        sounds[toolKey].play();
        toolElement.classList.add('active');
        setTimeout(() => toolElement.classList.remove('active'), 500);
    }

    function handlePlayerInput(e) {
        if (!isPlayerTurn) return;
        
        const clickedTool = e.currentTarget.dataset.tool;
        playerSequence.push(clickedTool);
        playSoundAndHighlight(clickedTool);

        const index = playerSequence.length - 1;

        // VERIFICA SE O JOGADOR ERROU
        if (playerSequence[index] !== sequence[index]) {
            wrongSound.play();
            handleGameOver(); // Chama a função específica de erro
            return; // Para a execução aqui
        }

        // VERIFICA SE O JOGADOR ACERTOU A SEQUÊNCIA
        if (playerSequence.length === sequence.length) {
            isPlayerTurn = false;
            correctSound.volume = 0.3;
            correctSound.play();
            
            // VERIFICA SE É O ÚLTIMO NÍVEL (VITÓRIA)
            if (level === totalLevels) {
                handleVictory(); // Chama a função específica de vitória
            } else {
                // AVANÇA PARA O PRÓXIMO NÍVEL
                feedbackText.textContent = 'Correto!';
                level++;
                updateArkVisual();
                setTimeout(nextTurn, 1500);
            }
        }
    }
    
    function updateArkVisual() {
        const pieceToShow = Math.floor((level + 1) / 2) - 1;
        arkPieces.forEach((piece, index) => {
            if (index < pieceToShow) {
                piece.classList.add('visible');
            } else {
                piece.classList.remove('visible');
            }
        });
    }
    
    // NOVA FUNÇÃO SÓ PARA QUANDO O JOGADOR ERRA
    function handleGameOver() {
        isPlayerTurn = false;
        gameContainer.classList.add('hidden');
        finalScoreText.textContent = `Você chegou ao Nível ${level}`;
        gameOverOverlay.classList.remove('hidden');
    }
    
    // NOVA FUNÇÃO SÓ PARA A VITÓRIA FINAL
    function handleVictory() {
        feedbackText.textContent = 'Arca Construída!';
        updateArkVisual(); // Garante que a última peça apareça
        setTimeout(() => {
            gameContainer.classList.add('hidden');
            victoryOverlay.classList.remove('hidden');
        }, 1500);
    }

    // --- INICIALIZAÇÃO ---
    tools.forEach(tool => tool.addEventListener('click', handlePlayerInput));
    
    function userInteractionHandler() {
        if (backgroundMusic.paused) { backgroundMusic.play().catch(()=>{}); }
    }
    document.body.addEventListener('click', userInteractionHandler, { once: true });
    backgroundMusic.volume = 0.1;
});