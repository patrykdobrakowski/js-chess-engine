const boardElement = document.getElementById('chessboard');
const statusElement = document.getElementById('game-status');
const startBtn = document.getElementById('start-btn');
const rankingList = document.getElementById('ranking-list');

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

let board = [];
let selectedSquare = null;
let currentPlayer = 'w';
let gameActive = false;
let aiTimeout = null; // Zabezpieczenie przed klonowaniem

function initGame() {
    if (aiTimeout) clearTimeout(aiTimeout); // Anulowanie starych ruchów AI przy resecie
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
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            
            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add('highlighted');
            }

            const piece = board[row][col];
            if (piece) {
                square.innerText = pieces[piece];
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (!gameActive || currentPlayer !== 'w') return;

    const piece = board[row][col];
    const isWhite = piece !== '' && piece === piece.toUpperCase();

    if (!selectedSquare) {
        if (isWhite) {
            selectedSquare = { row, col };
            drawBoard(); 
        }
    } else {
        if (isWhite) {
            selectedSquare = { row, col };
            drawBoard();
        } else {
            if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
                makeMove(selectedSquare.row, selectedSquare.col, row, col);
                selectedSquare = null;
                
                if (gameActive) {
                    currentPlayer = 'b';
                    statusElement.innerText = "Myśli AI (Czarne)...";
                    aiTimeout = setTimeout(makeAIMove, 400);
                }
            } else {
                selectedSquare = null;
                drawBoard();
            }
        }
    }
}

function isValidMove(sr, sc, er, ec) {
    const piece = board[sr][sc];
    const target = board[er][ec];
    
    // Zabezpieczenie przed klikaniem w to samo pole
    if (sr === er && sc === ec) return false;
    
    // Zabezpieczenie przed zbijaniem własnych figur
    if (target !== '') {
        const isPieceWhite = piece === piece.toUpperCase();
        const isTargetWhite = target === target.toUpperCase();
        if (isPieceWhite === isTargetWhite) return false;
    }

    const dr = er - sr;
    const dc = ec - sc;
    const p = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();

    if (p === 'p') {
        const dir = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        if (dc === 0) {
            if (dr === dir && target === '') return true;
            if (sr === startRow && dr === 2 * dir && target === '' && board[sr + dir][sc] === '') return true;
        } else if (Math.abs(dc) === 1 && dr === dir && target !== '') {
            return true;
        }
        return false;
    }
    
    if (p === 'n') return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    if (p === 'b') return Math.abs(dr) === Math.abs(dc) && isPathClear(sr, sc, er, ec);
    if (p === 'r') return (dr === 0 || dc === 0) && isPathClear(sr, sc, er, ec);
    if (p === 'q') return (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) && isPathClear(sr, sc, er, ec);
    if (p === 'k') return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;

    return false;
}

function isPathClear(sr, sc, er, ec) {
    const rowStep = sr === er ? 0 : (er > sr ? 1 : -1);
    const colStep = sc === ec ? 0 : (ec > sc ? 1 : -1);
    let r = sr + rowStep;
    let c = sc + colStep;
    
    while (r !== er || c !== ec) {
        if (board[r][c] !== '') return false;
        r += rowStep;
        c += colStep;
    }
    return true;
}

function makeMove(sr, sc, er, ec) {
    board[er][ec] = board[sr][sc];
    board[sr][sc] = '';
    drawBoard();
    checkWinCondition();
}

function makeAIMove() {
    if (!gameActive) return;
    
    let possibleMoves = [];
    for (let sr = 0; sr < 8; sr++) {
        for (let sc = 0; sc < 8; sc++) {
            const piece = board[sr][sc];
            // AI generuje ruchy tylko dla swoich czarnych figur
            if (piece !== '' && piece === piece.toLowerCase()) {
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
        let bestMoves = [];
        for (let move of possibleMoves) {
            if (board[move.er][move.ec] !== '') {
                bestMoves.push(move);
            }
        }
        
        let move = bestMoves.length > 0 
            ? bestMoves[Math.floor(Math.random() * bestMoves.length)] 
            : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            
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
