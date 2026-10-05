const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8];
const TOTAL_PAIRS = CARD_VALUES.length;
const TOTAL_CARDS = TOTAL_PAIRS * 2;
const MISMATCH_DELAY = 1000;
const STORAGE_KEY = 'memory-game-results';

const state = {
    cards: [],
    firstCard: null,
    secondCard: null,
    moves: 0,
    matchedPairs: 0,
    isLocked: false,
    isGameOver: false,
    mismatchTimerId: null,
    gameStartedAt: null,
};

const elements = {};

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createButton({
    className = '',
    text,
    ariaLabel,
    type = 'button',
} = {}) {
    const button = createElement('button', className, text);
    button.type = type;

    if (ariaLabel) {
        button.setAttribute('aria-label', ariaLabel);
    }

    return button;
}

function createHeader() {
    const header = createElement('header', 'app-header');
    const headerInner = createElement('div', 'header__inner');

    const brand = createElement('a', 'brand', 'Memory Game');
    brand.href = '#';
    brand.addEventListener('click', (event) => event.preventDefault());

    const actions = createElement('div', 'header__actions');

    const newGameButton = createButton({
        className: 'button button--secondary',
        text: 'New Game',
    });
    newGameButton.addEventListener('click', startNewGame);

    const leaderboardButton = createButton({
        className: 'button button--primary',
        text: 'Leaderboard',
    });
    leaderboardButton.addEventListener('click', openLeaderboardModal);

    actions.append(newGameButton, leaderboardButton);
    headerInner.append(brand, actions);
    header.append(headerInner);

    elements.newGameButton = newGameButton;
    elements.leaderboardButton = leaderboardButton;

    return header;
}

function createStats() {
    const stats = createElement('section', 'stats', undefined);
    stats.setAttribute('aria-label', 'Game statistics');

    const movesCard = createElement('div', 'stat');
    const movesLabel = createElement('span', 'stat__label', 'Moves');
    const movesValue = createElement('strong', 'stat__value', '0');
    movesCard.append(movesLabel, movesValue);

    const pairsCard = createElement('div', 'stat');
    const pairsLabel = createElement('span', 'stat__label', 'Pairs');
    const pairsValue = createElement(
        'strong',
        'stat__value',
        `0 / ${TOTAL_PAIRS}`,
    );
    pairsCard.append(pairsLabel, pairsValue);

    stats.append(movesCard, pairsCard);

    elements.movesValue = movesValue;
    elements.pairsValue = pairsValue;

    return stats;
}

function createGameBoard() {
    const board = createElement('main', 'game-board');
    board.setAttribute('aria-label', 'Memory game board');

    const cardsContainer = createElement('div', 'cards');
    cardsContainer.setAttribute('role', 'grid');
    cardsContainer.setAttribute(
        'aria-label',
        `Memory game with ${TOTAL_CARDS} cards`,
    );

    board.append(cardsContainer);
    elements.cardsContainer = cardsContainer;

    return board;
}

function createFooter() {
    const footer = createElement(
        'footer',
        'app-footer',
        'Find all 8 pairs in as few moves as possible.',
    );
    return footer;
}

function createPage() {
    const app = createElement('div', 'app');
    const header = createHeader();
    const content = createElement('div', 'app-content');
    const title = createElement('h1', 'visually-hidden', 'Memory Game');
    const stats = createStats();
    const board = createGameBoard();
    const footer = createFooter();

    content.append(title, stats, board, footer);
    app.append(header, content);
    document.body.append(app);
}

function createModal() {
    const overlay = createElement('div', 'modal-backdrop');
    overlay.setAttribute('aria-hidden', 'true');

    const dialog = createElement('section', 'modal');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'modal-title');

    const modalHeader = createElement('div', 'modal__header');
    const title = createElement('h2', 'modal__title', '');
    title.id = 'modal-title';

    const closeButton = createButton({
        className: 'icon-button',
        text: '×',
        ariaLabel: 'Close modal',
    });

    modalHeader.append(title, closeButton);

    const content = createElement('div', 'modal__content');
    dialog.append(modalHeader, content);
    overlay.append(dialog);
    document.body.append(overlay);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    });

    closeButton.addEventListener('click', closeModal);

    elements.modal = overlay;
    elements.modalTitle = title;
    elements.modalContent = content;
    elements.modalCloseButton = closeButton;

    document.addEventListener('keydown', handleGlobalKeydown);
}

function handleGlobalKeydown(event) {
    if (event.key === 'Escape' && isModalOpen()) {
        closeModal();
    }
}

function isModalOpen() {
    return elements.modal.classList.contains('modal-backdrop--visible');
}

function openModal(title, contentBuilder) {
    elements.modalTitle.textContent = title;
    elements.modalContent.replaceChildren();
    contentBuilder(elements.modalContent);
    elements.modal.classList.add('modal-backdrop--visible');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    elements.modalCloseButton.focus();
}

function closeModal() {
    elements.modal.classList.remove('modal-backdrop--visible');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
}

function shuffle(items) {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [
            shuffled[randomIndex],
            shuffled[index],
        ];
    }

    return shuffled;
}

function buildDeck() {
    return shuffle([...CARD_VALUES, ...CARD_VALUES]).map((value, index) => ({
        id: `${value}-${index}`,
        value,
        matched: false,
    }));
}

function createCard(cardData) {
    const card = createElement('button', 'memory-card');
    card.type = 'button';
    card.dataset.cardId = cardData.id;
    card.setAttribute('role', 'gridcell');
    card.setAttribute('aria-label', 'Hidden card');

    const inner = createElement('span', 'memory-card__inner');
    const front = createElement(
        'span',
        'memory-card__face memory-card__face--front',
        String(cardData.value),
    );
    const back = createElement(
        'span',
        'memory-card__face memory-card__face--back',
        '?',
    );

    inner.append(front, back);
    card.append(inner);
    card.addEventListener('click', () => handleCardClick(cardData.id));

    return card;
}

function renderCards() {
    elements.cardsContainer.replaceChildren();
    state.cards.forEach((cardData) => {
        elements.cardsContainer.append(createCard(cardData));
    });
}

function findCardData(cardId) {
    return state.cards.find((card) => card.id === cardId);
}

function findCardElement(cardId) {
    return elements.cardsContainer.querySelector(
        `[data-card-id="${CSS.escape(cardId)}"]`,
    );
}

function setCardOpen(cardId, isOpen) {
    const cardElement = findCardElement(cardId);

    if (!cardElement) {
        return;
    }

    cardElement.classList.toggle('memory-card--open', isOpen);
    cardElement.setAttribute(
        'aria-label',
        isOpen ? `Card ${findCardData(cardId).value}` : 'Hidden card',
    );
}

function setCardMatched(cardId) {
    const cardElement = findCardElement(cardId);

    if (!cardElement) {
        return;
    }

    cardElement.classList.add('memory-card--matched');
    cardElement.setAttribute(
        'aria-label',
        `Matched card ${findCardData(cardId).value}`,
    );
}

function updateStats() {
    elements.movesValue.textContent = String(state.moves);
    elements.pairsValue.textContent = `${state.matchedPairs} / ${TOTAL_PAIRS}`;
}

function resetSelection() {
    state.firstCard = null;
    state.secondCard = null;
}

function clearMismatchTimer() {
    if (state.mismatchTimerId !== null) {
        clearTimeout(state.mismatchTimerId);
        state.mismatchTimerId = null;
    }
}

function handleCardClick(cardId) {
    if (state.isLocked || state.isGameOver) {
        return;
    }

    const cardData = findCardData(cardId);

    if (!cardData || cardData.matched || cardId === state.firstCard) {
        return;
    }

    setCardOpen(cardId, true);

    if (!state.firstCard) {
        state.firstCard = cardId;
        return;
    }

    state.secondCard = cardId;
    state.moves += 1;
    updateStats();
    evaluatePair();
}

function evaluatePair() {
    const firstData = findCardData(state.firstCard);
    const secondData = findCardData(state.secondCard);

    if (firstData.value === secondData.value) {
        firstData.matched = true;
        secondData.matched = true;
        state.matchedPairs += 1;

        setCardMatched(firstData.id);
        setCardMatched(secondData.id);
        updateStats();
        resetSelection();

        if (state.matchedPairs === TOTAL_PAIRS) {
            finishGame();
        }

        return;
    }

    state.isLocked = true;
    const firstId = firstData.id;
    const secondId = secondData.id;

    state.mismatchTimerId = window.setTimeout(() => {
        setCardOpen(firstId, false);
        setCardOpen(secondId, false);
        state.mismatchTimerId = null;
        state.isLocked = false;
        resetSelection();
    }, MISMATCH_DELAY);
}

function finishGame() {
    state.isGameOver = true;
    saveResult(state.moves);

    openWinModal();
}

function startNewGame() {
    clearMismatchTimer();
    resetSelection();

    state.cards = buildDeck();
    state.moves = 0;
    state.matchedPairs = 0;
    state.isLocked = false;
    state.isGameOver = false;
    state.gameStartedAt = Date.now();

    closeModal();
    renderCards();
    updateStats();
}

function getResults() {
    try {
        const storedResults = localStorage.getItem(STORAGE_KEY);

        if (!storedResults) {
            return [];
        }

        const parsedResults = JSON.parse(storedResults);
        return Array.isArray(parsedResults) ? parsedResults : [];
    } catch {
        return [];
    }
}

function saveResult(moves) {
    const results = getResults();
    const result = {
        moves,
        date: getLocalDateString(),
        timestamp: Date.now(),
    };

    const updatedResults = [...results, result]
        .sort(
            (first, second) =>
                first.moves - second.moves ||
                first.timestamp - second.timestamp,
        )
        .slice(0, 10);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
    } catch {
        console.warn('Failed to save high score to localStorage:', error);
    }
}

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(isoDate) {
    const [year, month, day] = isoDate.split('-');

    if (!year || !month || !day) {
        return isoDate;
    }

    return `${day}.${month}.${year}`;
}

function buildWinModalContent(container) {
    const message = createElement(
        'p',
        'modal__lead',
        'Congratulations! You found all 8 pairs.',
    );
    const score = createElement('p', 'win-score');
    const scoreLabel = createElement('span', 'win-score__label', 'Your moves');
    const scoreValue = createElement(
        'strong',
        'win-score__value',
        String(state.moves),
    );
    score.append(scoreLabel, scoreValue);

    const actions = createElement('div', 'modal__actions');
    const newGameButton = createButton({
        className: 'button button--primary',
        text: 'New Game',
    });
    const closeButton = createButton({
        className: 'button button--secondary',
        text: 'Close',
    });

    newGameButton.addEventListener('click', startNewGame);
    closeButton.addEventListener('click', closeModal);
    actions.append(newGameButton, closeButton);

    container.append(message, score, actions);
}

function openWinModal() {
    openModal('You Win!', buildWinModalContent);
}

function createLeaderboardTable(results) {
    const table = createElement('table', 'leaderboard');
    const caption = createElement(
        'caption',
        'visually-hidden',
        'Top 10 Memory Game results',
    );
    table.append(caption);

    const thead = createElement('thead');
    const headerRow = createElement('tr');
    ['Place', 'Moves', 'Date'].forEach((label) => {
        const th = createElement('th', undefined, label);
        th.scope = 'col';
        headerRow.append(th);
    });
    thead.append(headerRow);

    const tbody = createElement('tbody');

    results.forEach((result, index) => {
        const row = createElement('tr');
        const place = createElement(
            'td',
            'leaderboard__place',
            String(index + 1),
        );
        const moves = createElement('td', undefined, String(result.moves));
        const date = createElement('td', undefined, formatDate(result.date));
        row.append(place, moves, date);
        tbody.append(row);
    });

    table.append(thead, tbody);
    return table;
}

function buildLeaderboardModalContent(container) {
    const results = getResults();

    if (results.length === 0) {
        const emptyState = createElement(
            'p',
            'empty-state',
            'No results yet. Finish a game to appear here.',
        );
        container.append(emptyState);
        return;
    }

    const hint = createElement(
        'p',
        'modal__hint',
        'Top 10 results, sorted by fewest moves. Earlier results rank higher when moves are equal.',
    );
    container.append(hint, createLeaderboardTable(results));
}

function openLeaderboardModal() {
    openModal('Leaderboard', buildLeaderboardModalContent);
}

function init() {
    createPage();
    createModal();
    startNewGame();
}

init();
