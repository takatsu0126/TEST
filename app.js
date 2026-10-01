const SIZE = 8;
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const boardElement = document.querySelector("#board");
const blackScoreElement = document.querySelector("#black-score");
const whiteScoreElement = document.querySelector("#white-score");
const turnLabelElement = document.querySelector("#turn-label");
const moveCountElement = document.querySelector("#move-count");
const statusMessageElement = document.querySelector("#status-message");
const passButton = document.querySelector("#pass-turn");
const undoButton = document.querySelector("#undo-move");
const newGameButton = document.querySelector("#new-game");

let board = createInitialBoard();
let currentPlayer = BLACK;
let history = [];
let moveCount = 1;
let gameOver = false;
let lastMove = null;

function createInitialBoard() {
  const nextBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  nextBoard[3][3] = WHITE;
  nextBoard[3][4] = BLACK;
  nextBoard[4][3] = BLACK;
  nextBoard[4][4] = WHITE;
  return nextBoard;
}

function isInside(row, column) {
  return row >= 0 && row < SIZE && column >= 0 && column < SIZE;
}

function getFlips(row, column, player, currentBoard = board) {
  if (!isInside(row, column) || currentBoard[row][column] !== EMPTY) return [];
  const opponent = player === BLACK ? WHITE : BLACK;
  const flips = [];

  for (const [rowStep, columnStep] of DIRECTIONS) {
    const line = [];
    let nextRow = row + rowStep;
    let nextColumn = column + columnStep;
    while (isInside(nextRow, nextColumn) && currentBoard[nextRow][nextColumn] === opponent) {
      line.push([nextRow, nextColumn]);
      nextRow += rowStep;
      nextColumn += columnStep;
    }
    if (line.length && isInside(nextRow, nextColumn) && currentBoard[nextRow][nextColumn] === player) {
      flips.push(...line);
    }
  }
  return flips;
}

function getValidMoves(player) {
  const moves = new Map();
  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      const flips = getFlips(row, column, player);
      if (flips.length) moves.set(`${row}-${column}`, flips);
    }
  }
  return moves;
}

function render() {
  const validMoves = getValidMoves(currentPlayer);
  boardElement.replaceChildren();

  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      const cell = document.createElement("button");
      const value = board[row][column];
      const key = `${row}-${column}`;
      cell.className = "cell";
      cell.type = "button";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `${row + 1}行 ${column + 1}列`);
      if (validMoves.has(key)) cell.classList.add("valid");
      if (lastMove && lastMove[0] === row && lastMove[1] === column) cell.classList.add("last-move");
      if (value !== EMPTY) {
        const stone = document.createElement("span");
        stone.className = `stone ${value === BLACK ? "stone-black" : "stone-white"}`;
        cell.append(stone);
      }
      cell.addEventListener("click", () => playMove(row, column));
      boardElement.append(cell);
    }
  }

  const score = countStones();
  blackScoreElement.textContent = score[BLACK];
  whiteScoreElement.textContent = score[WHITE];
  turnLabelElement.textContent = gameOver ? "ゲーム終了" : `${currentPlayer === BLACK ? "黒" : "白"}の手番`;
  moveCountElement.textContent = `MOVE ${String(moveCount).padStart(2, "0")}`;
  passButton.disabled = gameOver || validMoves.size > 0;
  undoButton.disabled = history.length === 0;

  if (!gameOver && validMoves.size === 0) {
    statusMessageElement.textContent = "置ける場所がありません。パスしてください";
  } else if (!gameOver) {
    statusMessageElement.textContent = `${validMoves.size}か所に置けます`;
  }
}

function countStones() {
  const score = { [BLACK]: 0, [WHITE]: 0 };
  board.flat().forEach((cell) => {
    if (cell === BLACK || cell === WHITE) score[cell] += 1;
  });
  return score;
}

function playMove(row, column) {
  if (gameOver) return;
  const flips = getFlips(row, column, currentPlayer);
  if (!flips.length) return;

  history.push({ board: board.map((line) => [...line]), currentPlayer, moveCount, lastMove });
  board[row][column] = currentPlayer;
  flips.forEach(([flipRow, flipColumn]) => { board[flipRow][flipColumn] = currentPlayer; });
  lastMove = [row, column];
  moveCount += 1;
  switchTurn();
}

function switchTurn() {
  const nextPlayer = currentPlayer === BLACK ? WHITE : BLACK;
  if (getValidMoves(nextPlayer).size > 0) {
    currentPlayer = nextPlayer;
    render();
    return;
  }

  if (getValidMoves(currentPlayer).size > 0) {
    statusMessageElement.textContent = `${nextPlayer === BLACK ? "黒" : "白"}はパス。続けてください`;
    render();
    return;
  }
  finishGame();
}

function passTurn() {
  if (gameOver || getValidMoves(currentPlayer).size > 0) return;
  history.push({ board: board.map((line) => [...line]), currentPlayer, moveCount, lastMove });
  currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
  moveCount += 1;
  statusMessageElement.textContent = "手番を交代しました";
  render();
}

function undoMove() {
  const previous = history.pop();
  if (!previous) return;
  board = previous.board;
  currentPlayer = previous.currentPlayer;
  moveCount = previous.moveCount;
  lastMove = previous.lastMove;
  gameOver = false;
  statusMessageElement.textContent = "一手戻しました";
  render();
}

function finishGame() {
  gameOver = true;
  const score = countStones();
  const result = score[BLACK] === score[WHITE]
    ? "引き分けです"
    : `${score[BLACK] > score[WHITE] ? "黒" : "白"}の勝ちです`;
  statusMessageElement.textContent = `${result} もう一度遊びますか？`;
  render();
}

function startNewGame() {
  board = createInitialBoard();
  currentPlayer = BLACK;
  history = [];
  moveCount = 1;
  gameOver = false;
  lastMove = null;
  statusMessageElement.textContent = "置ける場所を選んでください";
  render();
}

passButton.addEventListener("click", passTurn);
undoButton.addEventListener("click", undoMove);
newGameButton.addEventListener("click", startNewGame);
render();
