document.addEventListener('DOMContentLoaded', () => {
    const holes = document.querySelectorAll('.hole');
    const scoreDisplay = document.getElementById('score');
    const startButton = document.getElementById('startButton');
    const confettiContainer = document.getElementById('confetti-container');

    // --- Defensive checks for elements ---
    if (!scoreDisplay || !startButton || !confettiContainer) {
        console.error("Critical HTML elements missing. Please check index.html IDs/classes.");
        if (!scoreDisplay) console.error("Missing: #score");
        if (!startButton) console.error("Missing: #startButton");
        if (!confettiContainer) console.error("Missing: #confetti-container");
        return;
    }
    if (holes.length === 0) {
        console.warn("Warning: No elements with class 'hole' found. The game won't function.");
    }
    // --- End Defensive checks ---

    let score = 0;
    let lastHole;
    let timeUp = false; // Game time is over
    let gameRunning = false; // Game is currently active
    let gameFailed = false; // Flag: game ended due to hitting non-flying object

    let gameTimer;
    let objectTimer;
    let decorationShown = false;

    // Adjusted speed constants (slower)
    const OBJECT_UP_TIME = 1000; // Object stays up for 1 second
    const NEXT_OBJECT_DELAY = 1000; // Next object appears 1 second after previous goes down
    const GAME_DURATION = 30000; // Game lasts for 30 seconds (adjusted for slower pace)
    const WIN_SCORE_THRESHOLD = 100; // Score to trigger confetti/win

    // Define flying and non-flying objects
    const objects = [
        // Flying Objects (type: 'flying')
        { emoji: '🐦', type: 'flying' }, // Bird
        { emoji: '✈️', type: 'flying' }, // Airplane
        { emoji: '🦋', type: 'flying' }, // Butterfly
        { emoji: '🐝', type: 'flying' }, // Bee
        { emoji: '🦉', type: 'flying' }, // Owl
        { emoji: '🚁', type: 'flying' }, // Helicopter
        { emoji: '🎈', type: 'flying' }, // Balloon

        // Non-Flying Objects (type: 'non-flying')
        { emoji: '🚗', type: 'non-flying' }, // Car
        { emoji: '🐕', type: 'non-flying' }, // Dog
        { emoji: '🌳', type: 'non-flying' }, // Tree
        { emoji: '🍎', type: 'non-flying' }, // Apple
        { emoji: '👟', type: 'non-flying' }, // Shoe
        { emoji: '🧱', type: 'non-flying' }, // Brick
        { emoji: '🐢', type: 'non-flying' }, // Turtle
        { emoji: '🐈', type: 'non-flying' }, // Cat
        { emoji: '🍩', type: 'non-flying' }  // Donut
    ];

    // Confetti colors
    const COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a'];

    // Function to select a random hole
    function randomHole(holes) {
        const idx = Math.floor(Math.random() * holes.length);
        const hole = holes[idx];
        if (hole === lastHole) {
            return randomHole(holes);
        }
        lastHole = hole;
        return hole;
    }

    // Function to select a random object
    function randomObject() {
        return objects[Math.floor(Math.random() * objects.length)];
    }

    // Function to make an object pop up
    function peep() {
        if (timeUp || gameFailed) { // Stop peeping if game time is up or failed
            return;
        }

        const hole = randomHole(holes);
        const objectDisplay = hole.querySelector('.object-display');

        if (!objectDisplay) {
            console.error("Error: '.object-display' element not found inside a hole. Skipping this peep.");
            if (!timeUp && !gameFailed) {
                objectTimer = setTimeout(peep, NEXT_OBJECT_DELAY);
            }
            return;
        }

        const obj = randomObject(); // Get a random object
        objectDisplay.textContent = obj.emoji; // Set the emoji
        objectDisplay.dataset.type = obj.type; // Store the type in a data attribute

        hole.classList.add('up');
        objectDisplay.classList.remove('hit-flying', 'hit-nonflying'); // Clear previous hit state

        objectTimer = setTimeout(() => {
            hole.classList.remove('up'); // Object goes down
            if (!timeUp && !gameFailed) {
                objectTimer = setTimeout(peep, NEXT_OBJECT_DELAY);
            }
        }, OBJECT_UP_TIME);
    }

    // Function to trigger confetti shower
    function triggerConfetti() {
        if (decorationShown) return;
        decorationShown = true;

        const numConfetti = 70; // More confetti!
        for (let i = 0; i < numConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];

            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = `${-20 + Math.random() * 40}vh`;

            confetti.style.animationDelay = `${Math.random() * 2}s`; // Longer delay range for spread
            confetti.style.setProperty('--end-x', `${(Math.random() - 0.5) * 200}vw`);

            confettiContainer.appendChild(confetti);

            confetti.addEventListener('animationend', () => {
                confetti.remove();
            });
        }
    }

    // Centralized game end logic
    function endGame(status) { // status: 'win', 'fail', 'timeup'
        timeUp = true;
        gameRunning = false;
        startButton.disabled = false;

        clearTimeout(gameTimer);
        clearTimeout(objectTimer);

        holes.forEach(hole => {
            hole.classList.remove('up');
            const objectDisplay = hole.querySelector('.object-display');
            if (objectDisplay) {
                objectDisplay.classList.remove('hit-flying', 'hit-nonflying');
                objectDisplay.textContent = ''; // Clear emoji
                objectDisplay.dataset.type = ''; // Clear type
            }
        });

        confettiContainer.innerHTML = ''; // Clear any residual confetti

        if (status === 'fail') {
            alert(`GAME OVER! You clicked a non-flying object. Your score: ${score}`);
        } else if (status === 'win') {
            alert(`CONGRATULATIONS! You reached ${WIN_SCORE_THRESHOLD} points! Your score: ${score}`);
            triggerConfetti(); // Ensure confetti plays on win
        } else { // timeup
            alert(`TIME'S UP! Your final score: ${score}`);
        }
    }

    // Function to handle click/tap on an object
    function handleClick(e) {
        if (!gameRunning || !e.target.classList.contains('object-display') || !e.target.parentNode.classList.contains('up')) {
            return;
        }

        const clickedObject = e.target;
        const objectType = clickedObject.dataset.type;

        // Immediately make object go down
        clickedObject.parentNode.classList.remove('up');
        clearTimeout(objectTimer); // Clear its timer

        if (objectType === 'flying') {
            score++;
            scoreDisplay.textContent = score;
            clickedObject.classList.add('hit-flying'); // Green feedback

            // Check for win condition after a successful hit
            if (score >= WIN_SCORE_THRESHOLD && !decorationShown) {
                endGame('win'); // End game with win status
                return;
            }

            // Schedule next object if game continues
            if (!timeUp && !gameFailed) {
                objectTimer = setTimeout(peep, NEXT_OBJECT_DELAY);
            }
        } else { // objectType === 'non-flying'
            clickedObject.classList.add('hit-nonflying'); // Red feedback
            gameFailed = true; // Set game failed flag
            endGame('fail'); // End game with fail status
            return;
        }
    }

    // Function to start the game
    function startGame() {
        if (gameRunning) return;

        score = 0;
        scoreDisplay.textContent = 0;
        timeUp = false;
        gameRunning = true;
        gameFailed = false; // Reset fail flag
        startButton.disabled = true;
        decorationShown = false; // Reset confetti flag

        clearTimeout(gameTimer);
        clearTimeout(objectTimer);

        holes.forEach(hole => {
            hole.classList.remove('up');
            const objectDisplay = hole.querySelector('.object-display');
            if (objectDisplay) {
                objectDisplay.classList.remove('hit-flying', 'hit-nonflying');
                objectDisplay.textContent = ''; // Clear previous emoji
                objectDisplay.dataset.type = ''; // Clear previous type
            }
        });

        confettiContainer.innerHTML = ''; // Clear any residual confetti

        peep(); // Start the first object

        gameTimer = setTimeout(() => {
            if (!gameFailed && gameRunning) { // Only end by time if not already failed and still running
                endGame('timeup');
            }
        }, GAME_DURATION);
    }

    // Add event listeners
    holes.forEach(hole => hole.addEventListener('click', handleClick));
    startButton.addEventListener('click', startGame);
});
