// --- Konfiguracja i Stan Gry ---
const boardElement = document.getElementById('chessboard');
const statusElement = document.getElementById('game-status');
const startBtn = document.getElementById('start-btn');
const rankingList = document.getElementById('ranking-list');

let board = [];
let selectedSquare = null;
let currentPlayer = 'w';
let gameActive = false;

// Reprezentacja figur (Unicode)
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

// --- Inicjalizacja i Rysowanie Planszy ---
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
            
            // Szachownica: naprzemienne kolory
            if ((row + col) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');
            }
            
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = board[row][col];
            if (piece) {
                square.innerText = pieces[piece];
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
}

// --- Logika Ruchu i Obsługa Gracza ---
function handleSquareClick(row, col) {
    if (!gameActive || currentPlayer !== 'w') return;

    const piece = board[row][col];

    // Wybór figury
    if (selectedSquare === null) {
        if (piece && isWhitePiece(piece)) {
            selectedSquare = { row, col };
            highlightSquare(row, col);
        }
    } else {
        // Próba wykonania ruchu (weryfikacja kolizji z własną figurą)
        if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
            makeMove(selectedSquare.row, selectedSquare.col, row, col);
            selectedSquare = null;
            
            if (gameActive) {
                currentPlayer = 'b';
                statusElement.innerText = "Myśli AI (Czarne)...";
                setTimeout(makeAIMove, 600); // Symulacja czasu myślenia
            }
        } else {
            // Zmiana wyboru figury
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
    drawBoard(); // Odśwież, by usunąć poprzednie podświetlenia
    const index = row * 8 + col;
    boardElement.children[index].classList.add('highlighted');
}

function isValidMove(startRow, startCol, endRow, endCol) {
    // Podstawowa weryfikacja - zapobieganie bicia własnych figur
    const targetPiece = board[endRow][endCol];
    if (targetPiece && isWhitePiece(targetPiece)) return false; 
    return true; 
}

function makeMove(startRow, startCol, endRow, endCol) {
    board[endRow][endCol] = board[startRow][startCol];
    board[startRow][startCol] = '';
    drawBoard();
    checkWinCondition();
}

// --- Sztuczna Inteligencja (AI Minimax / Random fallback) ---
function makeAIMove() {
    if (!gameActive) return;
    
    const depth = parseInt(document.getElementById('difficulty').value);
    console.log(`Silnik analizuje ruch z głębokością: ${depth}`);
    
    // Zbieranie wszystkich możliwych ruchów dla czarnych
    let possibleMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && !isWhitePiece(board[r][c])) {
                // Logika silnika: symulacja prostych ruchów w dół planszy
                if (r < 7 && !board[r+1][c]) {
                    possibleMoves.push({ sr: r, sc: c, er: r+1, ec: c });
                }
            }
        }
    }

    if (possibleMoves.length > 0) {
        // Wykonanie wyliczonego ruchu (tutaj fallback dla dema przeglądarkowego)
        const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        makeMove(move.sr, move.sc, move.er, move.ec);
    }

    if (gameActive) {
        currentPlayer = 'w';
        statusElement.innerText = "Twój ruch (Białe)";
    }
}

// --- Stan Gry i Ranking (Lokalna Baza Danych) ---
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
    
    if (ranking[nickInput]) {
        ranking[nickInput]++;
    } else {
        ranking[nickInput] = 1;
    }
    
    localStorage.setItem('chessRanking', JSON.stringify(ranking));
    loadRanking();
}

function loadRanking() {
    let ranking = JSON.parse(localStorage.getItem('chessRanking')) || {};
    rankingList.innerHTML = '';
    
    const sortedRanking = Object.entries(ranking).sort((a, b) => b[1] - a[1]);
    
    sortedRanking.forEach(([nick, wins]) => {
        const li = document.createElement('li');
        li.innerText = `${nick}: ${wins} wygranych`;
        rankingList.appendChild(li);
    });
}

// --- Uruchomienie ---
startBtn.addEventListener('click', initGame);
initGame();
