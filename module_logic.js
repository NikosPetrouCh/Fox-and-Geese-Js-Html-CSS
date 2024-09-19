// Define GameStatus as an object to simulate enum behavior
export const GameStatus = {
    GOOSE_MOVING: 1,
    FOX_MOVING: 2,
    KICK_OUT_GEESE: 3,
    FOX_WIN: 4,
    GEESE_WIN: 5,
    VALID_INPUT: 6,
    NOT_VALID_INPUT: 7,
    VALID_POSITION: 8,
    NOT_VALID_POSITION: 9,
    ONGOING: 10
};

// Import the GameBoard class from module_board.js
import { GameBoard } from './module_board.js';


export class FoxAndGeese {
    constructor(gameBoard = null, currentPlayer = 'F', geeseKicked = 0, moveHistory = [], validMoves = null) {
        this._gameBoard = gameBoard || new GameBoard();
        this._currentPlayer = currentPlayer;
        this._geeseKicked = geeseKicked;
        this._moveHistory = moveHistory;
        this._lastState = this.findFoxPosition();
        this._validMoves = validMoves;
    }

    get gameBoard() {
        return this._gameBoard;
    }

    get currentPlayer() {
        return this._currentPlayer;
    }

    set currentPlayer(value) {
        this._currentPlayer = value;
    }

    get geeseKicked() {
        return this._geeseKicked;
    }

    get validMoves() {
        return this._validMoves;
    }

    get lastState() {
        return this._lastState;
    }

    get moveHistory() {
        return this._moveHistory;
    }

    set moveHistory(value) {
        this._moveHistory = value;
    }

    toDict() {
        return {
            gameBoard: this._gameBoard.toDict(),
            currentPlayer: this._currentPlayer,
            geeseKicked: this._geeseKicked,
            moveHistory: this._moveHistory,
        };
    }

    static fromDict(data) {
        const gameBoard = GameBoard.fromDict(data.gameBoard);
        return new FoxAndGeese(gameBoard, data.currentPlayer, data.geeseKicked, data.moveHistory);
    }

    resetGame() {
        this._gameBoard = new GameBoard();
        this._currentPlayer = 'F';
        this._geeseKicked = 0;
        this._moveHistory = [];
    }

    findFoxPosition() {
        for (let x = 0; x < this._gameBoard.board.length; x++) {
            for (let y = 0; y < this._gameBoard.board[x].length; y++) {
                if (this._gameBoard.board[y][x] === 'F') {
                    return `${y},${x}`;
                }
            }
        }
        return null;
    }

    sanitizeValidInput(input) {
        if (typeof input === 'string' && ['save', 'exit', 'undo'].includes(input)) {
            return GameStatus.VALID_INPUT;
        }

        if (this.currentPlayer === 'F') {
            if (!/^\d,\d$/.test(input)) {
                return GameStatus.NOT_VALID_INPUT;
            }
            try {
                const end = input.split(',').map(Number);
                if (end.length !== 2) {
                    return GameStatus.NOT_VALID_INPUT;
                }
                if (Number.isInteger(end[0]) && Number.isInteger(end[1]) && end[0] >= 0 && end[0] <= 8 && end[1] >= 0 && end[1] <= 8) {
                    return GameStatus.VALID_INPUT;
                } else {
                    return GameStatus.NOT_VALID_INPUT;
                }
            } catch (error) {
                return GameStatus.NOT_VALID_INPUT;
            }
        } else {
            if (!/^\d+,\d+-\d+,\d+$/.test(input)) {
                return GameStatus.NOT_VALID_INPUT;
            }

            try {
                const [start, end] = input.split('-').map(part => part.split(',').map(Number));
                if (start.length !== 2 || end.length !== 2) {
                    return GameStatus.NOT_VALID_INPUT;
                }
                if (Number.isInteger(start[0]) && Number.isInteger(start[1]) && start[0] >= 0 && start[1] <= 8) {
                    return GameStatus.VALID_INPUT;
                } else {
                    return GameStatus.NOT_VALID_INPUT;
                }
            } catch (error) {
                return GameStatus.NOT_VALID_INPUT;
            }
        }
    }

    isOutOfTheBoard(sx, sy, ex, ey) {
        if (!(ex >= 0 && ex < this._gameBoard.board.length && ey >= 0 && ey < this._gameBoard.board[0].length)) {
            return GameStatus.NOT_VALID_POSITION;
        }
        return GameStatus.VALID_POSITION;
    }

    isNotPlayersPosition(sx, sy) {
        if (this._gameBoard.board[sx][sy] === '-') {
            return GameStatus.NOT_VALID_POSITION;
        }
        return GameStatus.VALID_POSITION;
    }

    isPositionOccupiedByGoose(ex, ey) {
        if (this._gameBoard.board[ex][ey] === 'G') {
            return GameStatus.NOT_VALID_POSITION;
        }
        return GameStatus.VALID_POSITION;
    }

    isTheSamePosition(sx, sy, ex, ey) {
        if (sx === ex && sy === ey) {
            return GameStatus.NOT_VALID_POSITION;
        }
        return GameStatus.VALID_POSITION;
    }

    isValidFoxMove(sx, sy, ex, ey) {
        if (this._gameBoard.board[sx][sy] === 'F' && this._gameBoard.board[ex][ey] === '-') {
            if (Math.abs(ex - sx) <= 1 && Math.abs(ey - sy) <= 1) {
                return GameStatus.VALID_POSITION;
            }
            if (Math.abs(ex - sx) === 2 && Math.abs(ey - sy) === 2) {
                const midX = (sx + ex) / 2, midY = (sy + ey) / 2;
                if (this._gameBoard.board[midX][midY] === 'G' && this._gameBoard.board[ex][ey] === '-') {
                    return GameStatus.VALID_POSITION;
                }
            } else if (Math.abs(ex - sx) === 2 && ey === sy) {
                const midX = (sx + ex) / 2, midY = sy;
                if (this._gameBoard.board[midX][midY] === 'G' && this._gameBoard.board[ex][ey] === '-') {
                    return GameStatus.VALID_POSITION;
                }
            } else if (Math.abs(ey - sy) === 2 && ex === sx) {
                const midX = sx, midY = (sy + ey) / 2;
                if (this._gameBoard.board[midX][midY] === 'G' && this._gameBoard.board[ex][ey] === '-') {
                    return GameStatus.VALID_POSITION;
                }
            }
        }
        return GameStatus.NOT_VALID_POSITION;
    }

    isValidGooseMove(sx, sy, ex, ey) {
        if (this._gameBoard.board[sx][sy] === 'G' && this._gameBoard.board[ex][ey] === '-') {
            if (Math.abs(ex - sx) <= 1 && Math.abs(ey - sy) <= 1) {
                return GameStatus.VALID_POSITION;
            }
        }
        return GameStatus.NOT_VALID_POSITION;
    }

    logicValidMove(start, end) {
        const [sx, sy] = start;
        const [ex, ey] = end;

        if (this.isOutOfTheBoard(sx, sy, ex, ey) === GameStatus.NOT_VALID_POSITION) {
            return GameStatus.NOT_VALID_POSITION;
        }

        if (this.isNotPlayersPosition(sx, sy) === GameStatus.NOT_VALID_POSITION) {
            return GameStatus.NOT_VALID_POSITION;
        }

        if (this.isPositionOccupiedByGoose(ex, ey) === GameStatus.NOT_VALID_POSITION) {
            return GameStatus.NOT_VALID_POSITION;
        }

        if (this.isTheSamePosition(sx, sy, ex, ey) === GameStatus.NOT_VALID_POSITION) {
            return GameStatus.NOT_VALID_POSITION;
        }

        if (this.currentPlayer === 'F') {
            if (this.isValidFoxMove(sx, sy, ex, ey) === GameStatus.VALID_POSITION) {
                return GameStatus.VALID_POSITION;
            } else {
                return GameStatus.NOT_VALID_POSITION;
            }
        }

        if (this.currentPlayer === 'G') {
            if (this.isValidGooseMove(sx, sy, ex, ey) === GameStatus.VALID_POSITION) {
                return GameStatus.VALID_POSITION;
            } else {
                return GameStatus.NOT_VALID_POSITION;
            }
        }

        return GameStatus.NOT_VALID_POSITION;
    }

    movePiece(start, end) {
        const [sx, sy] = start;
        const [ex, ey] = end;

        if (this.logicValidMove(start, end) === GameStatus.VALID_POSITION) {
            this._moveHistory.push([start, end]);
            this._gameBoard.board[ex][ey] = this._gameBoard.board[sx][sy];
            this._gameBoard.board[sx][sy] = '-';

            if (this._gameBoard.board[ex][ey] === 'F') {
                this._lastState = [ex, ey];
            }

            if (Math.abs(sx - ex) === 2 || Math.abs(sy - ey) === 2) {
                const midX = (sx + ex) / 2, midY = (sy + ey) / 2;
                if (this._gameBoard.board[midX][midY] === 'G') {
                    this._gameBoard.board[midX][midY] = '-';
                    this._geeseKicked++;
                }
            }
        }
    }

    foxMove(sx, sy, ex, ey) {
        if (this.logicValidMove([sx, sy], [ex, ey]) === GameStatus.VALID_POSITION) {
            this.movePiece([sx, sy], [ex, ey]);
            this._lastState = [ex, ey];
            this._currentPlayer = 'G';
            this.findFoxPosition();
            return this.checkWin() === GameStatus.FOX_WIN ? GameStatus.FOX_WIN : GameStatus.FOX_MOVING;
        }
    }

    geeseMove(sx, sy, ex, ey) {
        if (this.logicValidMove([sx, sy], [ex, ey]) === GameStatus.VALID_POSITION) {
            this.movePiece([sx, sy], [ex, ey]);
            this._currentPlayer = 'F';
            return this.checkWin() === GameStatus.GEESE_WIN ? GameStatus.GEESE_WIN : GameStatus.GOOSE_MOVING;
        }
    }

    currentPlayersMove(input) {
        let moveStatus;

        if (this.currentPlayer === 'F') {
            const foxPosition = this.findFoxPosition().split(',').map(Number);
            const end = input.split(',').map(Number);
            const [sx, sy] = foxPosition;
            const [ex, ey] = end;
            moveStatus = this.foxMove(sx, sy, ex, ey);
        } else {
            const [start, end] = input.split('-').map(part => part.split(',').map(Number));
            const [sx, sy] = start;
            const [ex, ey] = end;
            moveStatus = this.geeseMove(sx, sy, ex, ey);
        }

        return moveStatus;
    }

    checkWin() {
        if (this._geeseKicked >= 10) {
            return GameStatus.FOX_WIN;
        }

        const foxPos = this._lastState;
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [1, 1], [-1, 1], [1, -1]
        ];
        const jumpDirections = [
            [-2, 0], [2, 0], [0, -2], [0, 2],
            [-2, -2], [2, 2], [-2, 2], [2, -2]
        ];

        const potentialMoves = [];

        for (const [dx, dy] of directions) {
            const x1 = foxPos[0] + dx, y1 = foxPos[1] + dy;
            if (x1 >= 0 && x1 < 9 && y1 >= 0 && y1 < 9 && this._gameBoard.board[x1][y1] === '-') {
                potentialMoves.push([x1, y1]);
            }
        }

        for (const [dx, dy] of jumpDirections) {
            const midX = foxPos[0] + dx / 2, midY = foxPos[1] + dy / 2;
            const x2 = foxPos[0] + dx, y2 = foxPos[1] + dy;
            if (x2 >= 0 && x2 < 9 && y2 >= 0 && y2 < 9 && this._gameBoard.board[midX][midY] === 'G' && this._gameBoard.board[x2][y2] === '-') {
                potentialMoves.push([x2, y2]);
            }
        }

        this._validMoves = potentialMoves;

        if (!this._validMoves.length) {
            return GameStatus.GEESE_WIN;
        }

        if (this._validMoves.length === 1 && this._lastState.toString() === this._validMoves[0].toString()) {
            return GameStatus.GEESE_WIN;
        }

        return GameStatus.ONGOING;
    }
}


