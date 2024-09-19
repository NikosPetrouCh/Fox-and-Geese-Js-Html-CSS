// Define the GameBoard class
export class GameBoard {
    // The constructor initializes the board by calling the createBoard method.
    constructor() {
        this.board = this.createBoard();
    }

    // The toDict method converts the board into a dictionary-like object.
    toDict() {
        return {
            board: this.board
        };
    }

    // The static fromDict method creates a GameBoard instance from a dictionary-like object.
    static fromDict(data) {
        const obj = new GameBoard();
        obj.board = data.board;
        return obj;
    }

    // The createBoard method creates the initial state of the board.
    createBoard() {
        // Initialize a 9x9 board filled with spaces (' ')
        let board = Array.from({ length: 9 }, () => Array(9).fill(' '));

        // Create horizontal and vertical lines in the middle of the board
        for (let i = 0; i < 9; i++) {
            board[3][i] = '-';
            board[4][i] = '-';
            board[5][i] = '-';

            board[i][3] = '-';
            board[i][4] = '-';
            board[i][5] = '-';
        }

        // Place 'G' on specific positions
        for (let i = 3; i < 6; i++) {
            board[0][i] = 'G';
            board[1][i] = 'G';
            board[2][i] = 'G';
        }

        for (let i = 0; i < 9; i++) {
            board[3][i] = 'G';
        }

        // Place 'F' at a specific position
        board[7][4] = 'F';

        // Return the created board
        return board;
    }

    // The printBoard method prints the board to the console.
    printBoard() {
        // Clear the console screen (works on both Windows and Unix-like systems)
        console.clear();

        // Print column indices
        console.log("   " + Array.from({ length: 9 }, (_, i) => i).join(" "));

        // Print each row of the board with its index
        this.board.forEach((row, idx) => {
            console.log(`${idx}  ${row.join(" ")}`);
        });

        // Print legend
        console.log("\nG: Goose, F: Fox, -: Empty space, ' ' represents invalid positions\n");
    }
}

// Example usage:
// const gameBoard = new GameBoard();
// gameBoard.printBoard();
// console.log(gameBoard.toDict());
