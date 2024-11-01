document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (currentUser) {
    window.location.href = "index.html"; // Redirect if logged in
  }

  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent form submission

    const usernameInput = document.getElementById("username").value;

    // Retrieve the users from local storage
    const users = JSON.parse(localStorage.getItem("users"));

    // Check if users is an array and validate
    if (!Array.isArray(users)) {
      console.error("Users data is not an array or is corrupted.");
      alert(
        "An error occurred while retrieving users. Please try again later."
      );
      return;
    }

    // Check if the user exists
    const userExists = users.find((user) => user.username === usernameInput);

    if (userExists) {
      sessionStorage.setItem("currentUser", JSON.stringify(userExists));
      window.location.href = "index.html"; // Redirect to the game page
    } else {
      alert("User not found. Please register first."); // User not found message
    }
  });
});
