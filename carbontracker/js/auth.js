// auth.js — wires up pages/login.html: email/password login+signup, Google sign-in.
// If already logged in, redirects straight to the dashboard.

let isSignUpMode = false;

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = "../dashboard.html";
  });

  const submitBtn = document.getElementById("submitBtn");
  const googleBtn = document.getElementById("googleBtn");
  const toggleLink = document.getElementById("toggleModeLink");
  const toggleText = document.getElementById("toggleText");
  const authTitle = document.getElementById("authTitle");
  const errorMsg = document.getElementById("errorMsg");

  toggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    authTitle.textContent = isSignUpMode ? "Sign Up" : "Log In";
    submitBtn.textContent = isSignUpMode ? "Sign Up" : "Log In";
    toggleText.textContent = isSignUpMode ? "Already have an account?" : "Don't have an account?";
    toggleLink.textContent = isSignUpMode ? "Log In" : "Sign Up";
    errorMsg.style.display = "none";
  });

  submitBtn.addEventListener("click", () => {
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    errorMsg.style.display = "none";

    if (!email || !password) {
      showError("Please enter both email and password.");
      return;
    }

    const action = isSignUpMode
      ? auth.createUserWithEmailAndPassword(email, password)
      : auth.signInWithEmailAndPassword(email, password);

    action
      .then(() => { window.location.href = "../dashboard.html"; })
      .catch((err) => showError(err.message));
  });

  googleBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(() => { window.location.href = "../dashboard.html"; })
      .catch((err) => showError(err.message));
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
  }
});