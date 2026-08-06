const buttons = Array.from(document.querySelectorAll(".normalamount, .million"));
const offerButton = document.querySelector(".offer");
const resetButton = document.querySelector(".reset");
const closeOfferButton = document.getElementById("closeOffer");

const OFFER_BREAKPOINTS = [5, 9, 12, 14, 15, 16, 17, 18, 19];

const STORAGE_PREFIX = "dealNoDeal_";

// -------------------------
// Load saved board
// -------------------------

buttons.forEach((button, index) => {

    if (localStorage.getItem(STORAGE_PREFIX + index) === "clicked") {
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

    if (opened < 5) return 0;
    if (opened < 9) return 1;
    if (opened < 12) return 2;
    if (opened < 14) return 3;
    if (opened < 15) return 4;
    if (opened < 16) return 5;
    if (opened < 17) return 6;
    if (opened < 18) return 7;

    return 8;

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

// -------------------------
// Button state
// -------------------------

function updateButtons() {

    const opened = getOpenedCount();

    resetButton.disabled = opened === 0;

    const offerReady =
        OFFER_BREAKPOINTS.includes(opened)

    offerButton.disabled = !offerReady;

}

// -------------------------
// Amount buttons
// -------------------------

buttons.forEach((button, index) => {

    button.addEventListener("click", () => {

        const wasClicked = button.classList.contains("clicked");

        if (wasClicked) {

            button.classList.remove("clicked");
            localStorage.removeItem(STORAGE_PREFIX + index);

        } else {

            button.classList.add("clicked");
            localStorage.setItem(STORAGE_PREFIX + index, "clicked");

        }

        // Once another amount is opened,
        // the previous offer is considered over.

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

    const sum = remaining.reduce((a, b) => a + b, 0);

    const average = sum / remaining.length;

    const currentRound = getCurrentRound(getOpenedCount());

    let offer = average * (currentRound / 9);

    offer = roundOffer(offer);

    const displayOffer = offer.toLocaleString("en-US", {

        minimumFractionDigits: offer < 10 ? 2 : 0,
        maximumFractionDigits: 2

    });

    document.getElementById("offerAmount").textContent =
        "$" + displayOffer;

    document.getElementById("offerModal").style.display = "flex";

});

// -------------------------
// Close offer
// -------------------------

closeOfferButton.addEventListener("click", () => {

    document.getElementById("offerModal").style.display = "none";

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

        localStorage.removeItem(STORAGE_PREFIX + index);

    });

    updateButtons();

});

// -------------------------
// Initial setup
// -------------------------

updateButtons();