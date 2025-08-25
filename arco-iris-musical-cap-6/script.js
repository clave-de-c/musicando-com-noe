document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const successOverlay = document.getElementById('success-overlay');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const backgroundMusic = document.getElementById('background-music');
    
    // --- BOTÕES ---
    const playButton = document.getElementById('play-button');
    const instructionsButton = document.getElementById('instructions-button');
    const closeInstructionsButton = document.getElementById('close-instructions-button');
    const playAgainButton = document.getElementById('play-again-button');
    const exitButton = document.getElementById('exit-button');
    const muteButton = document.getElementById('mute-button');

    // --- ELEMENTOS DO JOGO ---
    const notesContainer = document.getElementById('notes-container');
    const rainbowArcs = document.querySelectorAll('.rainbow-arc');

    // --- DADOS DAS NOTAS ---
    const noteData = [
        { id: 'C', name: 'Dó', freq: 261.63, color: 'var(--color-do)' },
        { id: 'D', name: 'Ré', freq: 293.66, color: 'var(--color-re)' },
        { id: 'E', name: 'Mi', freq: 329.63, color: 'var(--color-mi)' },
        { id: 'F', name: 'Fá', freq: 349.23, color: 'var(--color-fa)' },
        { id: 'G', name: 'Sol', freq: 392.00, color: 'var(--color-sol)' },
        { id: 'A', name: 'Lá', freq: 440.00, color: 'var(--color-la)' },
        { id: 'B', name: 'Si', freq: 493.88, color: 'var(--color-si)' }
    ];
    
    let completedNotes = 0;
    let audioContext;

    // --- LÓGICA DA MÚSICA E MUDO ---
    backgroundMusic.volume = 0.15;

    muteButton.addEventListener('click', () => {
        backgroundMusic.muted = !backgroundMusic.muted;
        muteButton.textContent = backgroundMusic.muted ? '🔇' : '🔊';
    });

    // --- LÓGICA DA TELA INICIAL E FLUXO ---
    playButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        backgroundMusic.play().catch(e => console.log("O navegador impediu o autoplay."));
        resetGame(true);
    });

    instructionsButton.addEventListener('click', () => {
        instructionsOverlay.classList.remove('hidden');
    });

    closeInstructionsButton.addEventListener('click', () => {
        instructionsOverlay.classList.add('hidden');
    });
    
    exitButton.addEventListener('click', () => {
        gameContainer.classList.add('hidden');
        startScreen.classList.remove('hidden');
        removeConfetti();
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    });

    playAgainButton.addEventListener('click', () => {
        successOverlay.classList.add('hidden');
        removeConfetti();
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(e => console.log("O navegador impediu o autoplay."));
        resetGame(false);
    });

    // --- LÓGICA DO JOGO ---
    function resetGame(isNewGame) {
        completedNotes = 0;
        rainbowArcs.forEach(arc => arc.classList.remove('filled'));
        if (isNewGame && !audioContext) {
            initAudio();
        }
        createNoteBubbles();
    }
    
    function initAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    function playNote(frequency) {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function createNoteBubbles() {
        notesContainer.innerHTML = '';
        const shuffledNotes = shuffle([...noteData]);
        shuffledNotes.forEach(note => {
            const bubble = document.createElement('div');
            bubble.id = `note-bubble-${note.id}`;
            bubble.className = 'note-bubble';
            bubble.draggable = true;
            bubble.dataset.note = note.id;
            bubble.textContent = note.name;
            let noteNameNormalized = note.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            bubble.style.backgroundColor = `var(--color-${noteNameNormalized})`;
            notesContainer.appendChild(bubble);
            bubble.addEventListener('dragstart', handleDragStart);
            bubble.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/note-id', e.target.dataset.note);
        e.dataTransfer.setData('text/element-id', e.target.id);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    rainbowArcs.forEach(arc => {
        arc.addEventListener('dragover', handleDragOver);
        arc.addEventListener('drop', handleDrop);
    });

    function handleDragOver(e) { e.preventDefault(); }

    function handleDrop(e) {
        e.preventDefault();
        const draggedNoteId = e.dataTransfer.getData('text/note-id');
        const draggedElementId = e.dataTransfer.getData('text/element-id');
        const targetArc = e.target;
        if (draggedNoteId === targetArc.dataset.note && !targetArc.classList.contains('filled')) {
            const noteInfo = noteData.find(n => n.id === draggedNoteId);
            playNote(noteInfo.freq);
            targetArc.classList.add('filled');
            const draggedBubble = document.getElementById(draggedElementId);
            if (draggedBubble) {
                draggedBubble.style.display = 'none';
            }
            completedNotes++;
            checkWinCondition();
        }
    }

    function checkWinCondition() {
        if (completedNotes === noteData.length) {
            backgroundMusic.pause();
            setTimeout(() => {
                playFullScale();
                successOverlay.classList.remove('hidden');
                createConfetti();
            }, 500);
        }
    }
    
    function playFullScale() {
        noteData.forEach((note, index) => {
            setTimeout(() => { playNote(note.freq); }, index * 150);
        });
    }
    
    function createConfetti() {
        const confettiContainer = document.body;
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = noteData[Math.floor(Math.random() * noteData.length)].color;
            confetti.style.animationDuration = (Math.random() * 3 + 3) + 's';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confettiContainer.appendChild(confetti);
        }
    }

    function removeConfetti() {
        const confettis = document.querySelectorAll('.confetti');
        confettis.forEach(confetti => confetti.remove());
    }
});