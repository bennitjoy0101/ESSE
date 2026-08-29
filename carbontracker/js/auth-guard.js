// auth-guard.js — protects pages by requiring a logged-in Firebase user.
// Usage in a page script: requireAuth(user => { ...your page logic... });

function requireAuth(callback) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      const isInPagesFolder = window.location.pathname.includes("/pages/");
      window.location.href = isInPagesFolder ? "login.html" : "pages/login.html";
      return;
    }
    callback(user);
  });
}

function logout() {
  auth.signOut().then(() => {
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    window.location.href = isInPagesFolder ? "login.html" : "pages/login.html";
  });
}