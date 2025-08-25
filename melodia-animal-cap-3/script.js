document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const levelUp2Overlay = document.getElementById('level-up-2-overlay');
    const levelUp3Overlay = document.getElementById('level-up-3-overlay');
    const finalVictoryOverlay = document.getElementById('final-victory-overlay');
    const toastContainer = document.getElementById('toast-container');
    
    // --- BOTÕES ---
    const playButton = document.getElementById('play-button');
    const instructionsButton = document.getElementById('instructions-button');
    const closeInstructionsButton = document.getElementById('close-instructions-button');
    const playMelodyButton = document.getElementById('play-melody-button');
    const nextButton = document.getElementById('next-button');
    const clearButton = document.getElementById('clear-button');
    const exitButton = document.getElementById('exit-button');
    const playAgainButton = document.getElementById('play-again-button');
    document.querySelectorAll('.continue-button').forEach(btn => btn.addEventListener('click', () => {
        levelUp2Overlay.classList.add('hidden');
        levelUp3Overlay.classList.add('hidden');
    }));

    // --- ELEMENTOS DO JOGO ---
    const animalImage = document.getElementById('animal-image');
    const syllableSlotsContainer = document.getElementById('syllable-slots');
    const notePaletteContainer = document.getElementById('note-palette');
    const levelDisplay = document.getElementById('level-display');
    
    // --- ÁUDIO ---
    const backgroundMusic = new Audio('sounds/background-music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.1;
    let audioContext;
    const audioBuffers = {};

    // --- DADOS DO JOGO ---
    const allNotes = [
        { id: 'C', name: 'Dó', color: '#FF0000', file: 'sounds/do.mp3' },
        { id: 'D', name: 'Ré', color: '#FFA500', file: 'sounds/re.mp3' },
        { id: 'E', name: 'Mi', color: '#FFFF00', file: 'sounds/mi.mp3' },
        { id: 'F', name: 'Fá', color: '#008000', file: 'sounds/fa.mp3' },
        { id: 'G', name: 'Sol', color: '#00BFFF', file: 'sounds/sol.mp3' },
        { id: 'A', name: 'Lá', color: '#00008B', file: 'sounds/la.mp3' },
        { id: 'B', name: 'Si', color: '#8A2BE2', file: 'sounds/si.mp3' }
    ];
    const animals = [
        { name: 'Leão', syllables: ['LE', 'ÃO'], image: 'leao.png' },
        { name: 'Gato', syllables: ['GA', 'TO'], image: 'gato.png' },
        { name: 'Cavalo', syllables: ['CA', 'VA', 'LO'], image: 'cavalo.png' },
        { name: 'Pomba', syllables: ['POM', 'BA'], image: 'pomba.png' },
        { name: 'Cachorro', syllables: ['CA', 'CHO', 'RRO'], image: 'cachorro.png' },
        { name: 'Macaco', syllables: ['MA', 'CA', 'CO'], image: 'macaco.png' },
        { name: 'Girafa', syllables: ['GI', 'RA', 'FA'], image: 'girafa.png' },
        { name: 'Capivara', syllables: ['CA', 'PI', 'VA', 'RA'], image: 'capivara.png' },
        { name: 'Elefante', syllables: ['E', 'LE', 'FAN', 'TE'], image: 'elefante.png' },
        { name: 'Hipopótamo', syllables: ['HI', 'PO', 'PÓ', 'TA', 'MO'], image: 'hipopotamo.png' }
    ];
    let animalOrder = [];

    let currentAnimalIndex = 0;
    let level = 1;
    let notesInPalette = [];
    let placedNotesHistory = [];

    // --- CONTROLE DE TELAS E MÚSICA ---
    playButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        backgroundMusic.pause();
        initGame(true); // Sempre embaralha ao iniciar
    });
    playAgainButton.addEventListener('click', () => {
        finalVictoryOverlay.classList.add('hidden');
        initGame(true); // Reinicia e embaralha
    });
    instructionsButton.addEventListener('click', () => instructionsOverlay.classList.remove('hidden'));
    closeInstructionsButton.addEventListener('click', () => instructionsOverlay.classList.add('hidden'));
    exitButton.addEventListener('click', () => {
        gameContainer.classList.add('hidden');
        startScreen.classList.remove('hidden');
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
    });

    // --- SISTEMA DE ÁUDIO ---
    async function setupAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        for (const note of allNotes) {
            try {
                const response = await fetch(note.file);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffers[note.id] = await audioContext.decodeAudioData(arrayBuffer);
            } catch (error) { console.error(`Erro ao carregar o som: ${note.file}`, error); }
        }
    }

    function playNoteById(noteId, delay = 0) {
        if (!audioContext || !audioBuffers[noteId]) return;
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[noteId];
        source.connect(audioContext.destination);
        source.start(audioContext.currentTime + delay);
    }
    
    // --- LÓGICA DO JOGO ---
    function updateLevel() {
        const previousLevel = level;
        if (currentAnimalIndex < 3) { level = 1; notesInPalette = allNotes.slice(0, 3); } 
        else if (currentAnimalIndex < 6) { level = 2; notesInPalette = allNotes.slice(0, 5); } 
        else { level = 3; notesInPalette = allNotes.slice(0, 7); }

        if (level > previousLevel) {
            const overlay = document.getElementById(`level-up-${level}-overlay`);
            if (overlay) overlay.classList.remove('hidden');
        }
        levelDisplay.textContent = `Nível ${level}`;
        // **CORREÇÃO:** Garante que a paleta de notas seja redesenhada
        setupNotePalette();
    }

    function setupAnimal(index) {
        placedNotesHistory = [];
        const animal = animalOrder[index];
        animalImage.src = `images/${animal.image}`;
        animalImage.alt = animal.name;
        
        syllableSlotsContainer.innerHTML = '';
        animal.syllables.forEach((syllable, i) => {
            const slot = document.createElement('div');
            slot.className = 'syllable-slot';
            slot.dataset.index = i;
            const label = document.createElement('span');
            label.className = 'syllable-label';
            label.textContent = syllable;
            slot.appendChild(label);
            syllableSlotsContainer.appendChild(slot);
        });
        addDropListeners();
        checkPlayButtonState();
    }

    function setupNotePalette() {
        notePaletteContainer.innerHTML = '';
        notesInPalette.forEach(note => {
            const bubble = document.createElement('div');
            bubble.className = 'note-bubble';
            bubble.draggable = true;
            bubble.textContent = note.name;
            bubble.style.backgroundColor = note.color;
            if (note.id === 'E') bubble.style.color = '#555';
            bubble.dataset.noteId = note.id;
            bubble.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', note.id);
                setTimeout(() => bubble.classList.add('dragging'), 0);
            });
            bubble.addEventListener('dragend', () => bubble.classList.remove('dragging'));
            notePaletteContainer.appendChild(bubble);
        });
    }

    function addDropListeners() {
        document.querySelectorAll('.syllable-slot').forEach(slot => {
            slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('over'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('over'));
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('over');
                if (slot.querySelector('.note-bubble')) return;

                const noteId = e.dataTransfer.getData('text/plain');
                const noteData = allNotes.find(n => n.id === noteId);
                
                const bubbleClone = document.createElement('div');
                bubbleClone.className = 'note-bubble';
                bubbleClone.textContent = noteData.name;
                bubbleClone.style.backgroundColor = noteData.color;
                if (noteData.id === 'E') bubbleClone.style.color = '#555';
                bubbleClone.dataset.noteId = noteData.id;
                
                slot.insertBefore(bubbleClone, slot.firstChild);
                placedNotesHistory.push(slot);
                playNoteById(noteData.id);
                checkPlayButtonState();
            });
        });
    }

    function clearLastNote() {
        if (placedNotesHistory.length === 0) return;
        const lastPlacedSlot = placedNotesHistory.pop();
        const bubbleToRemove = lastPlacedSlot.querySelector('.note-bubble');
        if (bubbleToRemove) {
            lastPlacedSlot.removeChild(bubbleToRemove);
        }
        checkPlayButtonState();
    }
    
    function checkPlayButtonState() {
        const slots = document.querySelectorAll('.syllable-slot');
        const filledSlots = document.querySelectorAll('.syllable-slot .note-bubble');
        playMelodyButton.disabled = slots.length !== filledSlots.length;
    }

    function playMelody() {
        showToast("Ótima Melodia!");
        const filledSlots = document.querySelectorAll('.syllable-slot .note-bubble');
        filledSlots.forEach((bubble, index) => {
            playNoteById(bubble.dataset.noteId, index * 0.5);
        });
    }

    function nextAnimal() {
        currentAnimalIndex++;
        if (currentAnimalIndex >= animals.length) {
            finalVictoryOverlay.classList.remove('hidden');
            return;
        }
        updateLevel();
        animalImage.style.animation = 'none';
        setTimeout(() => {
            setupAnimal(currentAnimalIndex);
            animalImage.style.animation = '';
        }, 10);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // --- INICIALIZAÇÃO ---
    function initGame(reshuffle = false) {
        if (reshuffle || animalOrder.length === 0) {
            animalOrder = [...animals].sort(() => 0.5 - Math.random());
        }
        currentAnimalIndex = 0;
        playMelodyButton.addEventListener('click', playMelody);
        nextButton.addEventListener('click', nextAnimal);
        clearButton.addEventListener('click', clearLastNote);
        updateLevel();
        setupAnimal(currentAnimalIndex);
        setupAudio();
    }
    
    document.body.addEventListener('click', () => {
        if (!gameContainer.classList.contains('hidden')) return;
        backgroundMusic.play().catch(()=>{});
    }, { once: true });
});