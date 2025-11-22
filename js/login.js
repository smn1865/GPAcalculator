// Usernery

const USERS = [
  { username: "I25.Grigoryan.Erik@etud.ufar.am", password: "1234", grade: 1, firstName: "MyLord"},
  { username: "I25.Gasparyan.Gevorg@etud.ufar.am", password: "5678", grade: 1, firstName: "Gev" },
  { username: "I24.OfaOfa@etud.ufar.am", password: "abcd", grade: 2, firstName: "Ofa" },
];

// pathery
const GRADE_ROUTES = {
  1: "Grade1.html", 
  2: "GpaCalculator2.html",
};

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".login-btn");
  const panel = document.getElementById("login-panel");
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const userInput = document.getElementById("login-username");
  const passInput = document.getElementById("login-password");

  if (!toggleBtn || !panel || !form) return;
    // knopki hide/show
  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("visible");
    errorBox.textContent = "";
    if (panel.classList.contains("visible")) {
      userInput.focus();
    }
  });

  // knopki close
  document.addEventListener("click", (e) => {
    if (
      !panel.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      panel.classList.remove("visible");
      errorBox.textContent = "";
    }
  });

  // knopka submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = userInput.value.trim();
    const password = passInput.value;

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

    // helloi hmar
    sessionStorage.setItem("currentUserFirstName", user.firstName);
    sessionStorage.setItem("currentUserGrade", String(user.grade));
    sessionStorage.setItem("currentUsername", user.username);

    // redirecty
    window.location.href = target;
  });
});
