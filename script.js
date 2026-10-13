const boardElement = document.getElementById('chessboard');
const statusElement = document.getElementById('game-status');
const startBtn = document.getElementById('start-btn');
const rankingList = document.getElementById('ranking-list');

let board = [];
let selectedSquare = null;
let currentPlayer = 'w';
let gameActive = false;

const pieces = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

function initGame() {
    board = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer = 'w';
    gameActive = true;
    selectedSquare = null;
    statusElement.innerText = "Twój ruch (Białe)";
    drawBoard();
    loadRanking();
}

function drawBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = board[row][col];
            if (piece) square.innerText = pieces[piece];

            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (!gameActive || currentPlayer !== 'w') return;

    const piece = board[row][col];

    if (selectedSquare === null) {
        if (piece && isWhitePiece(piece)) {
            selectedSquare = { row, col };
            highlightSquare(row, col);
        }
    } else {
        if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
            makeMove(selectedSquare.row, selectedSquare.col, row, col);
            selectedSquare = null;
            
            if (gameActive) {
                currentPlayer = 'b';
                statusElement.innerText = "Myśli AI (Czarne)...";
                setTimeout(makeAIMove, 400); 
            }
        } else {
            selectedSquare = null;
            drawBoard();
            if (piece && isWhitePiece(piece)) {
                selectedSquare = { row, col };
                highlightSquare(row, col);
            }
        }
    }
}

function isWhitePiece(piece) {
    return piece === piece.toUpperCase() && piece !== '';
}

function highlightSquare(row, col) {
    drawBoard();
    const index = row * 8 + col;
    boardElement.children[index].classList.add('highlighted');
}

function isPathClear(sr, sc, er, ec) {
    const dr = Math.sign(er - sr);
    const dc = Math.sign(ec - sc);
    let r = sr + dr;
    let c = sc + dc;
    while (r !== er || c !== ec) {
        if (board[r][c] !== '') return false;
        r += dr;
        c += dc;
    }
    return true;
}

function isValidMove(sr, sc, er, ec) {
    const piece = board[sr][sc];
    const target = board[er][ec];
    
    // Nie można zbić własnej figury
    if (target && isWhitePiece(piece) === isWhitePiece(target)) return false;

    const dr = er - sr;
    const dc = ec - sc;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);
    const p = piece.toLowerCase();

    if (p === 'p') {
        const dir = isWhitePiece(piece) ? -1 : 1;
        const startRow = isWhitePiece(piece) ? 6 : 1;
        
        if (dc === 0 && target === '') {
            if (dr === dir) return true;
            if (sr === startRow && dr === 2 * dir && board[sr + dir][sc] === '') return true;
        } else if (absDc === 1 && dr === dir && target !== '') {
            return true;
        }
        return false;
    }
    
    if (p === 'n') return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    if (p === 'b') return absDr === absDc && isPathClear(sr, sc, er, ec);
    if (p === 'r') return (dr === 0 || dc === 0) && isPathClear(sr, sc, er, ec);
    if (p === 'q') return (absDr === absDc || dr === 0 || dc === 0) && isPathClear(sr, sc, er, ec);
    if (p === 'k') return absDr <= 1 && absDc <= 1;

    return false;
}

function makeMove(startRow, startCol, endRow, endCol) {
    board[endRow][endCol] = board[startRow][startCol];
    board[startRow][startCol] = '';
    drawBoard();
    checkWinCondition();
}

function makeAIMove() {
    if (!gameActive) return;
    
    let possibleMoves = [];
    for (let sr = 0; sr < 8; sr++) {
        for (let sc = 0; sc < 8; sc++) {
            if (board[sr][sc] && !isWhitePiece(board[sr][sc])) {
                for (let er = 0; er < 8; er++) {
                    for (let ec = 0; ec < 8; ec++) {
                        if (isValidMove(sr, sc, er, ec)) {
                            possibleMoves.push({ sr, sc, er, ec });
                        }
                    }
                }
            }
        }
    }

    if (possibleMoves.length > 0) {
        const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        makeMove(move.sr, move.sc, move.er, move.ec);
    }

    if (gameActive) {
        currentPlayer = 'w';
        statusElement.innerText = "Twój ruch (Białe)";
    }
}

function checkWinCondition() {
    let whiteKing = false;
    let blackKing = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === 'K') whiteKing = true;
            if (board[r][c] === 'k') blackKing = true;
        }
    }

    if (!whiteKing) endGame("Czarne wygrywają!");
    else if (!blackKing) {
        endGame("Szach Mat! Białe wygrywają!");
        saveWin();
    }
}

function endGame(message) {
    gameActive = false;
    statusElement.innerText = `Koniec gry! ${message}`;
}

function saveWin() {
    const nickInput = document.getElementById('player-nick').value.trim() || 'Anonim';
    let ranking = JSON.parse(localStorage.getItem('chessRanking')) || {};
    ranking[nickInput] = (ranking[nickInput] || 0) + 1;
    localStorage.setItem('chessRanking', JSON.stringify(ranking));
    loadRanking();
}

function loadRanking() {
    let ranking = JSON.parse(localStorage.getItem('chessRanking')) || {};
    rankingList.innerHTML = '';
    Object.entries(ranking).sort((a, b) => b[1] - a[1]).forEach(([nick, wins]) => {
        const li = document.createElement('li');
        li.innerText = `${nick}: ${wins} wygranych`;
        rankingList.appendChild(li);
    });
}

startBtn.addEventListener('click', initGame);
initGame();
