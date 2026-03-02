// Calculator logic – with extra credit: decimal, backspace, keyboard support

// ---------- Basic math functions ----------
function add(a, b) {
    return a + b;
}
function subtract(a, b) {
    return a - b;
}
function multiply(a, b) {
    return a * b;
}
function divide(a, b) {
    if (b === 0) {
        throw new Error("Division by zero");
    }
    return a / b;
}

// Operator mapping
const operators = {
    '+': add,
    '−': subtract,
    '×': multiply,
    '/': divide
};

// ---------- Calculator state ----------
let firstOperand = null;
let secondOperand = null;
let currentOperator = null;
let waitingForSecondOperand = false; // true after operator is pressed
let shouldResetDisplay = false;      // true after equals or result shown
const display = document.getElementById('display');
const decimalBtn = document.getElementById('decimal');

// ---------- Helper functions ----------
function updateDisplay(value) {
    display.textContent = value.toString().slice(0, 12); // prevent overflow
}

function clearCalculator() {
    firstOperand = null;
    secondOperand = null;
    currentOperator = null;
    waitingForSecondOperand = false;
    shouldResetDisplay = false;
    updateDisplay('0');
    enableDecimalButton();
}

function enableDecimalButton() {
    decimalBtn.classList.remove('disabled');
}
function disableDecimalButton() {
    decimalBtn.classList.add('disabled');
}

// Check if current display already contains a decimal point
function displayHasDecimal() {
    return display.textContent.includes('.');
}

// Round to avoid long decimals (max 10 decimal places)
function roundResult(value) {
    return Math.round(value * 1e10) / 1e10;
}

// ---------- Core operate function ----------
function operate(operator, a, b) {
    a = Number(a);
    b = Number(b);
    if (!operators[operator]) return b; // fallback
    try {
        let result = operators[operator](a, b);
        result = roundResult(result);
        return result;
    } catch (error) {
        if (error.message === "Division by zero") {
            return "🤯"; // snarky error
        }
        return "Error";
    }
}

// ---------- Handle digit input ----------
function inputDigit(digit) {
    const currentDisplay = display.textContent;

    if (shouldResetDisplay) {
        // Start fresh after result
        display.textContent = digit;
        shouldResetDisplay = false;
    } else {
        // Replace leading zero or append
        if (currentDisplay === '0' && digit !== '.') {
            display.textContent = digit;
        } else {
            display.textContent = currentDisplay + digit;
        }
    }

    // If waiting for second operand, we are now entering second number
    if (waitingForSecondOperand) {
        secondOperand = display.textContent;
    } else {
        firstOperand = display.textContent;
    }

    // Disable decimal if present in new display
    if (displayHasDecimal()) {
        disableDecimalButton();
    }
}

// ---------- Handle decimal point ----------
function inputDecimal() {
    if (displayHasDecimal()) return; // already has one

    const currentDisplay = display.textContent;
    if (shouldResetDisplay) {
        display.textContent = '0.';
        shouldResetDisplay = false;
    } else {
        display.textContent = currentDisplay + '.';
    }

    // Update operand references
    if (waitingForSecondOperand) {
        secondOperand = display.textContent;
    } else {
        firstOperand = display.textContent;
    }

    disableDecimalButton();
}

// ---------- Handle operator ----------
function handleOperator(nextOperator) {
    const currentValue = Number(display.textContent);

    // If no first operand yet, store it and set operator
    if (firstOperand === null) {
        firstOperand = currentValue;
        currentOperator = nextOperator;
        waitingForSecondOperand = true;
        shouldResetDisplay = false;
        enableDecimalButton(); // reset decimal for next number
        return;
    }

    // If waiting for second operand and user presses another operator,
    // just change the operator (do not evaluate)
    if (waitingForSecondOperand) {
        currentOperator = nextOperator;
        return;
    }

    // We have first operand and user is entering second (or just pressed operator again)
    // For safety, treat the current display as second operand
    if (firstOperand !== null && currentOperator) {
        secondOperand = currentValue;
        const result = operate(currentOperator, firstOperand, secondOperand);
        updateDisplay(result);
        // After evaluation, result becomes first operand for next operation
        firstOperand = result;
        currentOperator = nextOperator;
        waitingForSecondOperand = true;
        shouldResetDisplay = true; // so next digit clears display
        enableDecimalButton(); // new number can have decimal
    } else {
        // No operator yet, just store operator
        currentOperator = nextOperator;
        waitingForSecondOperand = true;
        shouldResetDisplay = false;
    }
}

// ---------- Handle equals ----------
function handleEquals() {
    if (firstOperand === null || currentOperator === null) return; // nothing to compute

    const currentValue = Number(display.textContent);
    // If waiting for second operand, the display likely holds second number
    if (waitingForSecondOperand) {
        secondOperand = currentValue;
    }

    if (secondOperand === null) {
        // user pressed equals right after operator (no second number) -> ignore
        return;
    }

    const result = operate(currentOperator, firstOperand, secondOperand);
    updateDisplay(result);

    // Reset state: result becomes new first operand, clear operator & second
    firstOperand = result;
    secondOperand = null;
    currentOperator = null;
    waitingForSecondOperand = false;
    shouldResetDisplay = true; // next digit starts fresh
    enableDecimalButton();
}

// ---------- Handle backspace ----------
function handleBackspace() {
    const currentDisplay = display.textContent;
    if (currentDisplay.length > 1) {
        display.textContent = currentDisplay.slice(0, -1);
    } else {
        display.textContent = '0';
    }

    // Update operand references
    if (waitingForSecondOperand) {
        secondOperand = display.textContent;
    } else {
        firstOperand = display.textContent;
    }

    // Re‑enable decimal if needed
    if (!displayHasDecimal()) {
        enableDecimalButton();
    }
}

// ---------- Event listeners for buttons ----------
document.querySelectorAll('.number').forEach(btn => {
    btn.addEventListener('click', () => inputDigit(btn.textContent));
});

document.getElementById('decimal').addEventListener('click', inputDecimal);

document.querySelectorAll('.operator').forEach(btn => {
    btn.addEventListener('click', () => handleOperator(btn.textContent));
});

document.getElementById('equals').addEventListener('click', handleEquals);

document.getElementById('clear').addEventListener('click', clearCalculator);

document.getElementById('backspace').addEventListener('click', handleBackspace);

// ---------- Keyboard support ----------
document.addEventListener('keydown', (e) => {
    const key = e.key;
    // Prevent default behavior for calculator keys (like page scrolling with arrow keys)
    if (/^[0-9.]$|^\+|\-|\*|\/|=$|Backspace|Delete|Escape/.test(key)) {
        e.preventDefault();
    }

    if (key >= '0' && key <= '9') {
        inputDigit(key);
    } else if (key === '.') {
        inputDecimal();
    } else if (key === '+' || key === '-') {
        handleOperator(key === '-' ? '−' : '+'); // map to display symbols
    } else if (key === '*') {
        handleOperator('×');
    } else if (key === '/') {
        handleOperator('/');
    } else if (key === '=' || key === 'Enter') {
        handleEquals();
    } else if (key === 'Backspace') {
        handleBackspace();
    } else if (key === 'Delete' || key === 'Escape') {
        clearCalculator();
    }
});

// Initialize
clearCalculator();
