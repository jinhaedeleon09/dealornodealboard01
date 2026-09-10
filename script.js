const buttons = Array.from(document.querySelectorAll(".normalamount, .million"));
const offerButton = document.querySelector(".offer");
const resetButton = document.querySelector(".reset");
const closeOfferButton = document.getElementById("closeOffer");

const offerModal = document.getElementById("offerModal");
const offerAmount = document.getElementById("offerAmount");
const offerHistory = document.getElementById("offerHistory");

const OFFER_BREAKPOINTS = [6, 11, 15, 18, 20, 21, 22, 23, 24];
const STORAGE_PREFIX = "dealNoDeal_";
const MIN_POWER = 0.35;

// -------------------------
// Load saved board
// -------------------------

buttons.forEach((button, index) => {

    const clickedKey = STORAGE_PREFIX + "clicked_" + index;
    const legacyKey = STORAGE_PREFIX + index;

    if (
        localStorage.getItem(clickedKey) === "clicked" ||
        localStorage.getItem(legacyKey) === "clicked"
    ) {
        button.classList.add("clicked");
    }

});

// -------------------------
// Utility functions
// -------------------------

function getOpenedCount() {

    return buttons.filter(button =>
        button.classList.contains("clicked")
    ).length;

}

function getRemainingValues() {

    return buttons
        .filter(button => !button.classList.contains("clicked"))
        .map(button => Number(button.value));

}

function getCurrentRound(opened) {

    if (opened < 6) return 0;
    if (opened < 11) return 1;
    if (opened < 15) return 2;
    if (opened < 18) return 3;
    if (opened < 20) return 4;
    if (opened < 21) return 5;
    if (opened < 22) return 6;
    if (opened < 23) return 7;
    if (opened < 24) return 8;

    return 9;

}

function roundOffer(offer) {

    if (offer >= 10000)
        return Math.round(offer / 1000) * 1000;

    if (offer >= 1000)
        return Math.round(offer / 100) * 100;

    if (offer >= 100)
        return Math.round(offer / 10) * 10;

    if (offer >= 10)
        return Math.round(offer);

    return Number(offer.toFixed(2));

}

function calculateOffer(remaining, currentRound) {

    if (remaining.length === 0) {
        return 0;
    }

    const sum = remaining.reduce((a, b) => a + b, 0);
    const arithmeticMean = sum / remaining.length;

    const power = Math.max(
        MIN_POWER,
        1 - (currentRound / 9) * (1 - MIN_POWER)
    );

    const powerMean = Math.pow(
        remaining.reduce(
            (total, value) => total + Math.pow(value, power),
            0
        ) / remaining.length,
        1 / power
    );

    const offer = powerMean * (currentRound / 9);

    return roundOffer(offer);

}

function formatMoney(amount) {

    return amount.toLocaleString("en-US", {

        minimumFractionDigits: amount < 10 ? 2 : 0,
        maximumFractionDigits: 2

    });

}

function normalizeOfferHistory(history) {

    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter(item => item !== null)
        .map((item, index) => {

            if (typeof item === "number") {
                return {
                    breakpoint: OFFER_BREAKPOINTS[index] ?? 0,
                    offer: Number(item)
                };
            }

            if (typeof item === "object") {
                const breakpoint = Number(item.breakpoint);
                const offer = Number(item.offer);

                if (!Number.isFinite(breakpoint) || !Number.isFinite(offer)) {
                    return null;
                }

                return {
                    breakpoint,
                    offer
                };
            }

            return null;

        })
        .filter(item => item && item.breakpoint > 0)
        .sort((a, b) => a.breakpoint - b.breakpoint);

}

function getOfferHistory() {

    const saved = localStorage.getItem(STORAGE_PREFIX + "offerHistory");

    if (!saved) {
        return [];
    }

    try {
        return normalizeOfferHistory(JSON.parse(saved));
    } catch {
        return [];
    }

}

function saveOfferHistory(history) {

    localStorage.setItem(
        STORAGE_PREFIX + "offerHistory",
        JSON.stringify(history)
    );

}

function syncOfferHistoryWithBoard(opened) {

    const history = getOfferHistory();
    const trimmed = history.filter(
        entry => entry.breakpoint <= opened
    );

    saveOfferHistory(trimmed);

}

function displayOfferHistory() {

    if (!offerHistory) {
        return;
    }

    const history = getOfferHistory();

    offerHistory.innerHTML = "";

    history.forEach(entry => {

        const listItem = document.createElement("li");
        listItem.textContent = "$" + formatMoney(entry.offer);
        offerHistory.appendChild(listItem);

    });

}

// -------------------------
// Button state
// -------------------------

function updateButtons() {

    const opened = getOpenedCount();

    resetButton.disabled = opened === 0;

    const offerReady = OFFER_BREAKPOINTS.includes(opened);

    offerButton.disabled = !offerReady;

}

// -------------------------
// Amount buttons
// -------------------------

buttons.forEach((button, index) => {

    button.addEventListener("click", () => {

        const wasClicked = button.classList.contains("clicked");
        const clickedKey = STORAGE_PREFIX + "clicked_" + index;
        const legacyKey = STORAGE_PREFIX + index;

        if (wasClicked) {

            button.classList.remove("clicked");
            localStorage.removeItem(clickedKey);
            localStorage.removeItem(legacyKey);

        } else {

            button.classList.add("clicked");
            localStorage.setItem(clickedKey, "clicked");
            localStorage.removeItem(legacyKey);

        }

        syncOfferHistoryWithBoard(getOpenedCount());
        offerModal.style.display = "none";
        displayOfferHistory();
        updateButtons();

    });

});

// -------------------------
// Offer button
// -------------------------

offerButton.addEventListener("click", () => {

    const remaining = getRemainingValues();

    if (remaining.length === 0)
        return;

    const opened = getOpenedCount();
    const currentRound = getCurrentRound(opened);
    const offer = calculateOffer(remaining, currentRound);

    const history = getOfferHistory();
    const existingIndex = history.findIndex(entry => entry.breakpoint === opened);

    if (existingIndex >= 0) {
        history[existingIndex] = {
            breakpoint: opened,
            offer
        };
    } else {
        history.push({
            breakpoint: opened,
            offer
        });
    }

    history.sort((a, b) => a.breakpoint - b.breakpoint);
    saveOfferHistory(history);

    offerAmount.textContent = "$" + formatMoney(offer);

    displayOfferHistory();

    offerModal.style.display = "flex";

});

// -------------------------
// Close offer
// -------------------------

closeOfferButton.addEventListener("click", () => {

    offerModal.style.display = "none";

    updateButtons();

});

// -------------------------
// Reset
// -------------------------

resetButton.addEventListener("click", () => {

    if (!confirm("Are you sure you want to reset the amounts?"))
        return;

    buttons.forEach((button, index) => {

        button.classList.remove("clicked");

        localStorage.removeItem(STORAGE_PREFIX + "clicked_" + index);
        localStorage.removeItem(STORAGE_PREFIX + index);

    });

    localStorage.removeItem(STORAGE_PREFIX + "offerHistory");

    offerModal.style.display = "none";

    updateButtons();
    displayOfferHistory();

});

// -------------------------
// Initial setup
// -------------------------

syncOfferHistoryWithBoard(getOpenedCount());
displayOfferHistory();
updateButtons();
