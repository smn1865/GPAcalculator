// ../js/welcome.js

document.addEventListener("DOMContentLoaded", () => {
  const name = sessionStorage.getItem("currentUserFirstName");
  const welcomeEl = document.getElementById("welcome-msg");

  if (!welcomeEl) return;

  if (name) {
    welcomeEl.textContent = `Welcome back, ${name}!`;
  } else {
    // optional: text when user opened page directly, without login
    welcomeEl.textContent = "";
  }
});
