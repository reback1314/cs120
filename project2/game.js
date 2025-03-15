const targetWords = ["APPLE", "CLOUD", "CHAIR", "DREAM", "EARTH",
    "FRUIT", "GRAPE", "GHOST", "HOUSE", "HAPPY", "JELLY", "KNIFE",
    "LEMON", "LIGHT", "MONEY", "MAGIC", "MOUTH", "NOISE", "OCEAN",
    "PLANT", "RIVER", "SHEEP", "SNAKE", "STORY", "TABLE", "TRAIN",
    "WATER", "WHALE", "WORLD", "YACHT", "ZEBRA"];
let currentRow = 0;
let usedLetters = new Set();
let letterColorMap = new Map();     // map to store letter-color pairs with priority
let totalGames = parseInt(getCookie('totalGames'));    // initialize game statistics from cookies
let totalGuessTimes = parseInt(getCookie('totalGuessTimes'));
let gridData = Array(6).fill().map(() => Array(5).fill(''));

// define color constants with priority values
const COLORS = {
    GREEN: { value: '#6aaa64', priority: 3 },
    GOLD: { value: '#c9b458', priority: 2 },
    GRAY: { value: '#787c7e', priority: 1 }
};

// randomly choose a word from targetWords and print in console
let targetWord = targetWords[Math.floor(Math.random() * targetWords.length)];
console.log("Target word is: " + targetWord);

// get dom data
const wordInput = document.getElementById('word-input');
const submitButton = document.getElementById('submit-button');
const grid = document.getElementById('board-grid');

// Handling of submission events
submitButton.addEventListener('click', () => {
    // check input length
    const guess = wordInput.value.toUpperCase();
    if (guess.length !== 5) {
        alert('Please enter 5 letters!');
        return;
    }

    // check input characters
    const letterRegex = /^[A-Z]+$/;
    if (!letterRegex.test(guess)) {
        alert('Illegal characters exist!');
        return;
    }

    // Check if the word is valid using the Dictionary API
    validateWord(guess.toLowerCase())
        .then(isValid => {
            if (!isValid) {
                alert('Not an valid English word!');
                return;
            }

            // update current row data with input word and display on board
            for (let i in guess) {
                gridData[currentRow][i] = guess[i];
            }
            updateGrid();

            // check guess result
            checkGuess(guess);

            // update keyboard
            updateKeyboard(guess);

            // empty input box
            wordInput.value = '';

            // check if win
            if (guess === targetWord) {
                showGameEndModal(true);
                return;
            }

            // update current row to next row and check if game over
            currentRow++;
            if (currentRow >= 6) {
                showGameEndModal(false);
            }
        })
        .catch(error => {
            console.error('Error validating word:', error);
            alert('Error checking word. Please try again.');
        });
});

// update gridData to board-grid
function updateGrid() {
    Array.from(grid.getElementsByClassName('row')).forEach((row, i) => {
        Array.from(row.getElementsByClassName('cell')).forEach((cell, j) => {
            cell.textContent = gridData[i][j];
        });
    });
}

// check guess result and update grid color
function checkGuess(word) {
    const cells = grid.getElementsByClassName('row')[currentRow].getElementsByClassName('cell');
    Array.from(cells).forEach((cell, i) => {
        if (word[i] === targetWord[i]) {
            cell.style.backgroundColor = COLORS.GREEN.value;
        } else if (targetWord.includes(word[i])) {
            cell.style.backgroundColor = COLORS.GOLD.value;
        } else {
            cell.style.backgroundColor = COLORS.GRAY.value;
        }
    });
}

// update keyboard state
function updateKeyboard(word) {
    Array.from(word).forEach((letter, i) => {
        usedLetters.add(letter);
        const keyElement = document.getElementById(`used-${letter}`);

        let fillColor;
        // Determine the color based on letter position
        if (letter === targetWord[i]) {
            fillColor = COLORS.GREEN;
        } else if (targetWord.includes(letter)) {
            fillColor = COLORS.GOLD;
        } else {
            fillColor = COLORS.GRAY;
        }

        // Check if letter already has a color with higher priority
        const currentColor = letterColorMap.get(letter);
        if (!currentColor || currentColor.priority < fillColor.priority) {
            letterColorMap.set(letter, fillColor);
            keyElement.style.backgroundColor = fillColor.value;
        }
    });
}

// show game over
function showGameEndModal(win) {
    // update statistics
    const curGuessTimes = win ? currentRow + 1 : 6;
    totalGuessTimes += curGuessTimes;

    // save result to cookies
    setCookie('totalGames', ++totalGames, 7);
    setCookie('totalGuessTimes', totalGuessTimes, 7);

    // disable input and submit button
    wordInput.disabled = true;
    submitButton.disabled = true;

    // show result
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
    <h2>${win ? 'Congratulations!' : 'Game Over'}</h2>
    <p>targetWord is: ${targetWord}</p>
    <p>You used ${win ? curGuessTimes : 'all 6'} guesses</p>
    <p>Average guesses: ${(totalGuessTimes / totalGames).toFixed(2)}</p>
    <button id="restart-button" onclick="location.reload()">Restart</button>`;
    document.body.appendChild(modal);

    // Add event listener for Enter key to restart game
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            location.reload();
        }
    });
}

// Function to validate if a word exists in the dictionary
function validateWord(word) {
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

    return fetch(apiUrl)
        .then(response => {
            // only when netword is normal and word not found, return false
            if (response.status === 404) {
                return response.json().then(data => {
                    return data.title !== "No Definitions Found";
                });
            }
            return true;
        })
        .catch(error => {
            console.log("Validation error:", error);
            return true;
        });
}

// Cookie functions for tracking game statistics
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
    const parts = `; ${document.cookie}`.split(`; ${name}=`);
    if (parts.length === 2)
        return parts.pop().split(';').shift();
    else
        return 0;
}

// add event listener to input box for Enter key
wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitButton.click();
    }
});