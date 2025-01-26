let points = 0;
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

function setupThemeButtons(data) {
  const themes = ["night", "sunset", "forest"];

  themes.forEach((theme) => {
    updateThemeButton(theme, data);
  });
}

function updateThemeButton(theme, data) {
  const buttonId = `${theme}ThemeButton`;
  const button = document.getElementById(buttonId);
  const themeClass = `${theme}-theme`;
  const cost = parseInt(button.dataset.cost, 10);

  if (!button) return;

  const isPurchased = data[`${themeClass}Purchased`] || false;
  const isSelected = selectedTheme === themeClass;

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

function purchaseTheme(themeClass, cost, theme, data) {
  if (points >= cost) {
    points -= cost;

    chrome.storage.sync.set({ points });
    chrome.storage.sync.set({ [`${themeClass}Purchased`]: true }, () => {
      updateThemeButton(theme, { ...data, [`${themeClass}Purchased`]: true });
    });

    updatePointsDisplay();
  } else {
    alert("Not enough points!");
  }
}

// A function to select a theme
function selectTheme(themeClass, theme, data) {
  applyTheme(themeClass);
  selectedTheme = themeClass;

  chrome.storage.sync.set({ selectedTheme }, () => {
    setupThemeButtons(data);
  });
}

// A function to unselect a theme
function unselectTheme(themeClass, theme, data) {
  document.body.className = "";
  selectedTheme = null;

  chrome.storage.sync.set({ selectedTheme: null }, () => {
    setupThemeButtons(data);
  });
}

// a function to apply the selected theme
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

// Timer
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

// it synchronise changes across tabs and windows
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

// points display
function updatePointsDisplay() {
  document.getElementById("points").textContent = `Points: ${points}`;
}

// Initialising the app on page load
document.addEventListener("DOMContentLoaded", initialiseApp);

// FAQ 
document.getElementById("faqButton").addEventListener("click", () => {
  document.getElementById("faqModal").classList.add("visible");
});

document.getElementById("closeFaq").addEventListener("click", () => {
  document.getElementById("faqModal").classList.remove("visible");
});

// Shop close n open
document.getElementById("shopToggle").addEventListener("click", () => {
  const shop = document.getElementById("shop");
  shop.classList.toggle("hidden");
  document.getElementById("shopToggle").textContent = shop.classList.contains("hidden") ? "Open Shop" : "Close Shop";
});

// Open the new window
document.getElementById("newWindowButton").addEventListener("click", () => {
  chrome.windows.create({
    url: "popup.html",
    type: "popup",
    width: 400,
    height: 600,
  });
});
