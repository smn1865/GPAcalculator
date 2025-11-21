// ../js/login.js

// 1) Here you define all allowed users.
//    username: what they type in "Login"
//    password: what they type in "Password"
//    grade: which grade/page they should go to

const USERS = [
  { username: "I25.Grigoryan.Erik@etud.ufar.am", password: "1234", grade: 1, firstName: "MyLord"},
  { username: "I25.Gasparyan.Gevorg@etud.ufar.am", password: "5678", grade: 1, firstName: "Gev" },
  { username: "I24.OfaOfa@etud.ufar.am", password: "abcd", grade: 2, firstName: "Ofa" },
  // TODO: add the rest of your ~300 users here
  // { username: "XXXX", password: "YYYY", grade: 1 },
  // { username: "AAAA", password: "BBBB", grade: 2 },
];

// 2) Where each grade should be redirected.
//    Change these paths to whatever you actually use.
const GRADE_ROUTES = {
  1: "Grade1.html",   // Grade 1 panel/page
  2: "GpaCalculator2.html",  // Grade 2 panel/page
  // 3: "grade3.html", etc. if you add more
};

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".login-btn");
  const panel = document.getElementById("login-panel");
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const userInput = document.getElementById("login-username");
  const passInput = document.getElementById("login-password");

  if (!toggleBtn || !panel || !form) return;

  // Show/hide the small login block
  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("visible");
    errorBox.textContent = "";
    if (panel.classList.contains("visible")) {
      userInput.focus();
    }
  });

  // Optional: close when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !panel.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      panel.classList.remove("visible");
      errorBox.textContent = "";
    }
  });

  // Handle login submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = userInput.value.trim();
    const password = passInput.value;

    // Find matching user
    const user = USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      errorBox.textContent = "Wrong login or password.";
      return;
    }

    const target = GRADE_ROUTES[user.grade];

    if (!target) {
      errorBox.textContent = "No page is assigned to your account yet.";
      return;
    }

    // ✅ Save info for the next page (only for this tab)
    sessionStorage.setItem("currentUserFirstName", user.firstName);
    sessionStorage.setItem("currentUserGrade", String(user.grade));
    sessionStorage.setItem("currentUsername", user.username);

    // Redirect to their grade page
    window.location.href = target;
  });
});
