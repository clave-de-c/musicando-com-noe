document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const challengeCompleteOverlay = document.getElementById('challenge-complete-overlay');

    // --- BOTÕES ---
    const trainingModeButton = document.getElementById('training-mode-button');
    const challengeModeButton = document.getElementById('challenge-mode-button');
    const instructionsButton = document.getElementById('instructions-button');
    const closeInstructionsButton = document.getElementById('close-instructions-button');
    const exitButton = document.getElementById('exit-button');
    const playNotesButton = document.getElementById('play-notes-button');
    const backToMenuButton = document.getElementById('back-to-menu-button');

    // --- ELEMENTOS DO JOGO ---
    const gameModeTitle = document.getElementById('game-mode-title');
    const progressCounter = document.getElementById('progress-counter');
    const dove = document.getElementById('dove');
    const clouds = document.querySelectorAll('.cloud');
    const feedbackText = document.getElementById('feedback-text');
    const sky = document.getElementById('sky');

    // --- ÁUDIO ---
    const backgroundMusic = document.getElementById('audio-background');
    let audioContext;
    const notes = { low: 261.63, mid: 329.63, high: 392.00 };
    
    // --- ESTADO DO JOGO ---
    let currentMelody = [], playerSequence = [], canPlay = false;
    let isChallengeMode = false;
    let currentRound = 0;
    const totalRounds = 10;

    // --- CONTROLE DE TELAS E MÚSICA ---
    trainingModeButton.addEventListener('click', () => { isChallengeMode = false; startGame(); });
    challengeModeButton.addEventListener('click', () => { isChallengeMode = true; currentRound = 1; startGame(); });

    function startGame() {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        backgroundMusic.pause();
        initAudio();
        if (isChallengeMode) {
            gameModeTitle.textContent = 'Modo Desafio';
            progressCounter.textContent = `${currentRound} / ${totalRounds}`;
            progressCounter.classList.remove('hidden');
        } else {
            gameModeTitle.textContent = 'Modo Treino';
            progressCounter.classList.add('hidden');
        }
        startNewRound();
    }
    
    instructionsButton.addEventListener('click', () => { instructionsOverlay.classList.remove('hidden'); });
    closeInstructionsButton.addEventListener('click', () => { instructionsOverlay.classList.add('hidden'); });
    exitButton.addEventListener('click', returnToMenu);
    backToMenuButton.addEventListener('click', returnToMenu);

    function returnToMenu() {
        gameContainer.classList.add('hidden');
        challengeCompleteOverlay.classList.add('hidden');
        startScreen.classList.remove('hidden');
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(()=>{});
    }

    // --- LÓGICA DE ÁUDIO ---
    function initAudio() {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playNote(pitch, delay = 0) {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(notes[pitch], audioContext.currentTime + delay);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.4);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + 0.5);
    }

    // --- LÓGICA PRINCIPAL DO JOGO ---
    function generateNewMelody() {
        playerSequence = [];
        const pitches = ['low', 'mid', 'high'].sort(() => 0.5 - Math.random());
        currentMelody = pitches;
    }

    function playCurrentNotes() {
        canPlay = false;
        playNotesButton.disabled = true;
        feedbackText.textContent = 'Ouvindo...';
        currentMelody.forEach((pitch, index) => playNote(pitch, index * 0.6));
        setTimeout(() => {
            feedbackText.textContent = 'Sua vez! Clique na ordem correta.';
            canPlay = true;
            playNotesButton.disabled = false;
        }, currentMelody.length * 600);
    }

    function handleCloudClick(e) {
        if (!canPlay || currentMelody.length === 0) return;
        const clickedPitch = e.target.dataset.pitch;
        playNote(clickedPitch);
        const expectedPitch = currentMelody[playerSequence.length];
        
        if (clickedPitch === expectedPitch) {
            playerSequence.push(clickedPitch);
            const cloudRect = e.target.getBoundingClientRect();
            const skyRect = sky.getBoundingClientRect();
            dove.style.top = `${cloudRect.top - skyRect.top + (cloudRect.height / 2)}px`;
            dove.style.left = `${cloudRect.left - skyRect.left + (cloudRect.width / 2)}px`;
            feedbackText.textContent = 'Correto!';
            feedbackText.style.color = 'green';

            if (playerSequence.length === currentMelody.length) {
                canPlay = false;
                if (isChallengeMode) {
                    if (currentRound === totalRounds) {
                        feedbackText.textContent = 'Desafio Concluído!';
                        setTimeout(() => { challengeCompleteOverlay.classList.remove('hidden'); }, 1500);
                    } else {
                        feedbackText.textContent = 'Sequência correta!';
                        currentRound++;
                        setTimeout(() => {
                            progressCounter.textContent = `${currentRound} / ${totalRounds}`;
                            startNewRound();
                        }, 1500);
                    }
                } else {
                    feedbackText.textContent = 'Parabéns, você conseguiu!';
                    setTimeout(() => { dove.style.left = '110%'; }, 1000);
                    setTimeout(startNewRound, 2500);
                }
            }
        } else {
            feedbackText.textContent = 'Ops! Tente de novo do começo.';
            feedbackText.style.color = 'red';
            sky.classList.add('shake');
            setTimeout(() => sky.classList.remove('shake'), 500);
            playerSequence = [];
            dove.style.top = '50%';
            dove.style.left = '15%';
        }
    }

    function startNewRound() {
        feedbackText.textContent = 'Clique no botão para ouvir as novas notas';
        feedbackText.style.color = '#555';
        dove.style.transition = 'none';
        dove.style.top = '50%';
        dove.style.left = '15%';
        setTimeout(() => { dove.style.transition = 'all 0.8s cubic-bezier(0.42, 0, 0.58, 1)'; }, 100);
        generateNewMelody();
        canPlay = true;
    }

    // --- INICIALIZAÇÃO ---
    playNotesButton.addEventListener('click', playCurrentNotes);
    clouds.forEach(cloud => cloud.addEventListener('click', handleCloudClick));
    
    // Inicia a música de fundo com a primeira interação
    function userInteractionHandler() {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(() => {});
        }
    }
    document.body.addEventListener('click', userInteractionHandler, { once: true });
    backgroundMusic.volume = 0.1;

});