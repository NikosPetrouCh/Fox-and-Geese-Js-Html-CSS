import { FoxAndGeese, GameStatus } from './module_logic.js';

document.addEventListener('DOMContentLoaded', () => {

    class Game {
        constructor(savedState) {
            this.ctx = ctx;
            this.boardSize = 9;
            this.cellSize = canvas.width / this.boardSize;
            this.infoAreaHeight = 60;
            this.buttonAreaHeight = 60;
            this.currentPlayer = 'F'; // 'F' for Fox, 'G' for Geese
            this.selectedPiece = null;
            this.history = [];
            this.isMuted = false
            this.returnToMainMenu = false;
            this.activeButton = null;

            // Game state initialization
            this.gameLogic = savedState ? FoxAndGeese.fromDict(savedState) : new FoxAndGeese();
            this.gameBoard = this.gameLogic.gameBoard.board;
        }

        start() {
            this.init();
            this.gameLoop();
        }

        init() {
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.handleClick(x, y);
            });
        }

        drawBoard() {
            ctx.fillStyle = 'rgb(255, 165, 0)'; // ORANGE
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the info area
            ctx.fillStyle = 'rgb(200, 200, 200)'; // Light grey
            ctx.fillRect(0, 0, canvas.width, this.infoAreaHeight);

            // Draw number of kicked geese
            ctx.fillStyle = 'black';
            ctx.font = '15px Arial';
            ctx.fillText(`Geese Kicked: ${this.gameLogic.geeseKicked}/10`, 85, 40);

            // Draw current player's turn
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.currentPlayer === 'F' ? "Fox's" : "Geese's"} Turn`, canvas.width / 2, 45);

            // Draw the grid and pieces
            for (let x = 0; x < this.boardSize; x++) {
                for (let y = 0; y < this.boardSize; y++) {
                    const piece = this.gameBoard[y][x];
                    let img = null;

                    // Determine which image to use based on the piece
                    if (piece === 'F') {
                        img = assets.fox;
                    } else if (piece === 'G') {
                        img = assets.geese;
                    } // No image for '-'
                    const isEmptyArea = 
                        (x >= 0 && x <= 2 || x >= 6 && x <= 8) &&
                        (y >= 0 && y <= 2 || y >= 6 && y <= 8);

                    if (isEmptyArea) {
                        img = assets.empty;
                    }
                    // Draw the image if it is not null
                    if (img) {
                        ctx.drawImage(img, x * this.cellSize, y * this.cellSize + this.infoAreaHeight, this.cellSize, this.cellSize);
                    }

                    // Draw the grid outline
                    ctx.strokeRect(x * this.cellSize, y * this.cellSize + this.infoAreaHeight, this.cellSize, this.cellSize);
                }
            }

            // Draw selected cell highlight
            if (this.selectedPiece) {
                const [sx, sy] = this.selectedPiece;
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 3;
                ctx.strokeRect(sx * this.cellSize, sy * this.cellSize + this.infoAreaHeight, this.cellSize, this.cellSize);
            }

            // Draw buttons
            this.drawButtons();
        }

        drawButtons() {
            const buttonTexts = ["Exit", "Undo", "Save", "Mute"];
            const buttonPositions = [
                { x: 30, y: canvas.height - this.buttonAreaHeight + 15 },
                { x: canvas.width / 2 - 110, y: canvas.height - this.buttonAreaHeight + 15 },
                { x: canvas.width / 2 + 15, y: canvas.height - this.buttonAreaHeight + 15 },
                { x: canvas.width - 130, y:canvas.height - this.buttonAreaHeight + 15}
            ];

            // Background color for the button area
            ctx.fillStyle = 'rgb(100, 100, 100)'; // Dark grey
            ctx.fillRect(0, canvas.height - this.buttonAreaHeight, canvas.width, this.buttonAreaHeight);

            buttonTexts.forEach((text, i) => {
                const { x, y } = buttonPositions[i];
                ctx.fillStyle = 'rgb(150, 150, 150)'; // Grey
                ctx.fillRect(x + 1, y + 1, 98, 28);
                ctx.strokeStyle = 'black';
                ctx.strokeRect(x, y, 100, 30);
                ctx.fillStyle = 'black';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(text, x + 50, y + 23);
            });
        }

        handleClick(x, y) {
            const buttonAreaStartY = canvas.height - this.buttonAreaHeight;

            // Check if click is within the button area
            if (y >= buttonAreaStartY) {
                const buttonClicked = this.getButtonFromMouse(x, y);
                if (buttonClicked) {
                    this.activeButton = buttonClicked;
                    this.handleButtonClick(buttonClicked);
                    this.drawBoard();
                    return;
                }
            }

            const cellX = Math.floor(x / this.cellSize);
            const cellY = Math.floor((y - this.infoAreaHeight) / this.cellSize);

            if (cellX >= 0 && cellX < this.boardSize && cellY >= 0 && cellY < this.boardSize) {
                this.handleCellClick(cellX, cellY);
            }
        }


        handleCellClick(x, y) {
            if (this.selectedPiece) {
                const [startY, startX] = this.selectedPiece;
                const endX = y;
                const endY = x;

                // Check if the user clicked on the same cell as the selected piece
                if (startX === endX && startY === endY) {
                    this.selectedPiece = null; // Deselect the piece
                    return;
                }

                // Call movePiece or appropriate move function based on current player
                const moveStatus = this.gameLogic.logicValidMove([startX, startY], [endX, endY]);
                if (moveStatus === GameStatus.VALID_POSITION) {
                    let result;
                    if (this.currentPlayer === 'F') {
                        result = this.gameLogic.foxMove(startX, startY, endX, endY);
                        assets.moveFoxSound.play();
                    } else if (this.currentPlayer === 'G') {
                        result = this.gameLogic.geeseMove(startX, startY, endX, endY);
                        assets.moveGeeseSound.play();
                    }

                    // Check if there was a winning move
                    if (result === GameStatus.FOX_WIN) {
                        alert("Fox wins!");
                        assets.winSound.play();
                        exitToMenu();
                        

                    } else if (result === GameStatus.GEESE_WIN) {
                        alert("Geese win!");
                        assets.winSound.play();
                        exitToMenu();
                    }

                    // Switch player only if the move was valid and no win
                    this.currentPlayer = this.currentPlayer === 'F' ? 'G' : 'F';
                } else {
                    alert("Invalid move!");
                }

                this.selectedPiece = null;
            } else {
                // Ensure player can only select their own piece
                if ((this.currentPlayer === 'F' && this.gameBoard[y][x] === 'F') || 
                    (this.currentPlayer === 'G' && this.gameBoard[y][x] === 'G')) {
                    this.selectedPiece = [x, y];
                }
            }
        }

        getButtonFromMouse(mouseX, mouseY) {
            const buttonYStart = canvas.height - this.buttonAreaHeight;
            if (mouseY < buttonYStart || mouseY > buttonYStart + 30) return null;

            if (mouseX >= 30 && mouseX <= 130) return "Exit";
            if (mouseX >= canvas.width / 2 - 110 && mouseX <= canvas.width / 2 + 10) return "Undo";
            if (mouseX >= canvas.width / 2 + 15 && mouseX <= canvas.width /2 + 115) return "Save";
            if (mouseX >= canvas.width - 130 && mouseX <= canvas.width - 30) return "Mute";

            return null;
        }

        handleButtonClick(button) {
            if (button === "Exit") {
                console.log('exiting')
                exitToMenu(); // Return to menu
            } else if (button === "Undo") {
                console.log('undoing')
                if (this.history.length > 0) {
                    const lastState = this.history.pop();
                    this.gameBoard = JSON.parse(lastState);
                    this.currentPlayer = this.currentPlayer === 'F' ? 'G' : 'F';
                }
            } else if (button === "Save") {
                console.log('saving')
                const state = this.gameLogic.toDict();
                fetch('save_game.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(state)
                });
            } else if (button === "Mute") {
                console.log('muting')
                toggleGameMute();
            }
        }

        gameLoop() {
            this.drawBoard();
            startMenuMusic(); // Ensure menu music starts
            if (!this.returnToMainMenu) {
                requestAnimationFrame(() => this.gameLoop());
            }
        }
    }

    const playButton = document.getElementById('play-button');
    const loadButton = document.getElementById('load-button');
    const exitButton = document.getElementById('exit-button'); // The exit button to close the tab
    const muteMenuButton = document.getElementById('mute-menu-button');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let game;
    let isMenuMuted = false;
    let isGameMuted = false
    let audioContext;

    // Load assets
    const assets = {
        fox: new Image(),
        geese: new Image(),
        empty: new Image(),
        menuMusic: new Audio('assets/sounds/menu_music.wav'),
        moveFoxSound: new Audio('assets/sounds/move_fox.wav'),
        moveGeeseSound: new Audio('assets/sounds/move_geese.wav'),
        backgroundMusic: new Audio('assets/sounds/soundtrack.wav'),
        winSound: new Audio('assets/sounds/win.wav')
    };

    assets.fox.src = 'assets/images/fox.png';
    assets.geese.src = 'assets/images/geese.png';
    assets.empty.src = 'assets/images/empty.png';

    assets.menuMusic.loop = true;
    assets.backgroundMusic.loop = true;

    function playAudio(audio, isMuted) {
        if (isMuted) {
            audio.pause();
            return;
        }
    
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    
        if (!audio.sourceNode) {
            audio.sourceNode = audioContext.createMediaElementSource(audio);
            audio.sourceNode.connect(audioContext.destination);
        }
    
        if (audio.paused) {
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => audio.play().catch(error => console.error('Error playing audio:', error)));
            } else {
                audio.play().catch(error => console.error('Error playing audio:', error));
            }
        }
    }
    
    function startMenuMusic() {
        assets.backgroundMusic.pause();
        assets.backgroundMusic.currentTime = 0;
        playAudio(assets.menuMusic, isMenuMuted);
    }
    
    function startGameMusic() {
        assets.menuMusic.pause();
        assets.menuMusic.currentTime = 0;
        playAudio(assets.backgroundMusic, isGameMuted);
    }


    function startNewGame() {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        game = new Game();
        game.start();
    }

    function loadSavedGame() {
        console.log("Loading a saved game...");
        fetch('saved_game.json')
            .then(response => response.json())
            .then(data => {
                game = new Game(data);
                game.start();
            })
            .catch(() => startNewGame());
    }

    function exitToMenu() {
        console.log("Exiting to menu...");
        //startMenuMusic(); // Ensure menu music starts
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
    }

    function closeTab() {
        console.log("Closing the tab...");
        window.close(); // This attempts to close the tab
    }

    function toggleMenuMute() {
        isMenuMuted = !isMenuMuted;
        if (isMenuMuted) {
            assets.menuMusic.pause();
        } else {
            playAudio(assets.menuMusic, isMenuMuted);
        }
    }
    
    function toggleGameMute() {
        isGameMuted = !isGameMuted;
    
        if (isGameMuted) {
            assets.backgroundMusic.pause();
        } else {
            playAudio(assets.backgroundMusic, isGameMuted);
        }
    }    
    
    
    
    document.body.addEventListener('click', () => {
        startGameMusic();
        document.body.removeEventListener('click', this);
    }, {once: true});



    // Event listeners for buttons
    playButton.addEventListener('click', () => startNewGame());
    loadButton.addEventListener('click', () => loadSavedGame());
    exitButton.addEventListener('click', () => closeTab()); // Existing button to close tab
    muteMenuButton.addEventListener('click', () =>toggleMenuMute());
});