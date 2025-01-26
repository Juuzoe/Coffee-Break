let points = 50; // Adjusted for testing
let interval;
let selectedTheme = null;

// Initialise the app
function initialiseApp() {
  chrome.storage.sync.get(null, (data) => {
    // Restore points
    points = data.points || 0;
    updatePointsDisplay();

    // Restore purchased themes and button states
    setupThemeButtons(data);

    // Apply the selected theme, if any
    if (data.selectedTheme) {
      applyTheme(data.selectedTheme);
      selectedTheme = data.selectedTheme;
    }
  });
}

// Set up theme buttons for all themes
function setupThemeButtons(data) {
  const themes = ["night", "sunset", "forest"];

  themes.forEach((theme) => {
    updateThemeButton(theme, data);
  });
}

// Update a single theme button
function updateThemeButton(theme, data) {
  const buttonId = `${theme}ThemeButton`;
  const button = document.getElementById(buttonId);
  const themeClass = `${theme}-theme`;
  const cost = parseInt(button.dataset.cost, 10);

  if (!button) return;

  const isPurchased = data[`${themeClass}Purchased`] || false;
  const isSelected = selectedTheme === themeClass;

  // Set button text and action
  if (isSelected) {
    button.textContent = "Unselect";
    button.onclick = () => unselectTheme(themeClass, theme, data);
  } else if (isPurchased) {
    button.textContent = "Select";
    button.onclick = () => selectTheme(themeClass, theme, data);
  } else {
    button.textContent = `Buy for ${cost}`;
    button.onclick = () => purchaseTheme(themeClass, cost, theme, data);
  }
}

// Function to purchase a theme
function purchaseTheme(themeClass, cost, theme, data) {
  if (points >= cost) {
    points -= cost;

    // Save points and mark the theme as purchased
    chrome.storage.sync.set({ points });
    chrome.storage.sync.set({ [`${themeClass}Purchased`]: true }, () => {
      // Update only this theme's button
      updateThemeButton(theme, { ...data, [`${themeClass}Purchased`]: true });
    });

    updatePointsDisplay();
  } else {
    alert("Not enough points!");
  }
}

// Function to select a theme
function selectTheme(themeClass, theme, data) {
  // Apply the theme
  applyTheme(themeClass);
  selectedTheme = themeClass;

  // Save the selected theme and update buttons
  chrome.storage.sync.set({ selectedTheme }, () => {
    setupThemeButtons(data);
  });
}

// Function to unselect a theme
function unselectTheme(themeClass, theme, data) {
  // Revert to the default theme
  document.body.className = "";
  selectedTheme = null;

  // Save the unselected state and update buttons
  chrome.storage.sync.set({ selectedTheme: null }, () => {
    setupThemeButtons(data);
  });
}

// Apply the selected theme
function applyTheme(themeClass) {
  document.body.className = themeClass;

  const coffeeCupContainer = document.getElementById("coffeeCupContainer");
  const appContainer = document.getElementById("app");

  if (themeClass === "forest-theme") {
    coffeeCupContainer.style.background = "#228B22"; // Forest green
    appContainer.style.background = "#228B22";
  } else if (themeClass === "night-theme") {
    coffeeCupContainer.style.background = "#1c1c1c"; // Night grey
    appContainer.style.background = "#1c1c1c";
  } else if (themeClass === "sunset-theme") {
    coffeeCupContainer.style.background = "linear-gradient(to top, #FF7E5F, #FFB199)"; // Sunset gradient
    appContainer.style.background = "linear-gradient(to top, #FF7E5F, #FFB199)";
  } else {
    coffeeCupContainer.style.background = "";
    appContainer.style.background = "";
  }
}

// Timer functionality
function startCountdown(startTime, duration) {
  const message = document.getElementById("message");
  const coffeeFill = document.getElementById("coffeeFill");
  clearInterval(interval);

  interval = setInterval(() => {
    const now = new Date().getTime();
    const remainingTime = Math.max(0, startTime + duration - now);

    if (remainingTime <= 0) {
      clearInterval(interval);
      message.textContent = "You should have a break!";
      coffeeFill.style.height = "0"; // Reset coffee fill
      points += 5;
      updatePointsDisplay();
      document.getElementById("ringSound").play();
      chrome.storage.sync.set({ timer: { running: false } });
    } else {
      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      message.textContent = `Time left: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

      // Update coffee fill based on elapsed time
      const elapsedTime = duration - remainingTime;
      const fillHeight = (elapsedTime / duration) * 98; // Adjusted for coffee cup height
      coffeeFill.style.height = `${fillHeight}px`;
    }
  }, 1000);
}

document.getElementById("startTimer").addEventListener("click", () => {
  const studyTime = parseInt(document.getElementById("studyTime").value, 10);

  if (isNaN(studyTime) || studyTime <= 0) {
    document.getElementById("message").textContent = "Please enter a valid study time!";
    return;
  }

  const startTime = new Date().getTime();
  const duration = studyTime * 60000;

  chrome.storage.sync.set({
    timer: { running: true, startTime, duration },
  });

  startCountdown(startTime, duration);
});

// Synchronise changes across tabs and windows
chrome.storage.onChanged.addListener((changes) => {
  chrome.storage.sync.get(null, (data) => {
    if (changes.points) {
      points = changes.points.newValue;
      updatePointsDisplay();
    }

    if (changes.selectedTheme) {
      const newTheme = changes.selectedTheme.newValue;
      applyTheme(newTheme);
    }

    if (
      changes.nightThemePurchased ||
      changes.sunsetThemePurchased ||
      changes.forestThemePurchased
    ) {
      setupThemeButtons(data);
    }
  });
});

// Update the points display
function updatePointsDisplay() {
  document.getElementById("points").textContent = `Points: ${points}`;
}

// Initialise the app on page load
document.addEventListener("DOMContentLoaded", initialiseApp);

// FAQ Modal
document.getElementById("faqButton").addEventListener("click", () => {
  document.getElementById("faqModal").classList.add("visible");
});

document.getElementById("closeFaq").addEventListener("click", () => {
  document.getElementById("faqModal").classList.remove("visible");
});

// Shop Toggle
document.getElementById("shopToggle").addEventListener("click", () => {
  const shop = document.getElementById("shop");
  shop.classList.toggle("hidden");
  document.getElementById("shopToggle").textContent = shop.classList.contains("hidden") ? "Open Shop" : "Close Shop";
});

// Open New Window
document.getElementById("newWindowButton").addEventListener("click", () => {
  chrome.windows.create({
    url: "popup.html",
    type: "popup",
    width: 400,
    height: 600,
  });
});
