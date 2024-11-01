function registerUser(username) {
  const users = JSON.parse(localStorage.getItem("users")) || []; // Retrieve existing users or create an empty array

  // Check if the username is already taken
  if (users.find((user) => user.username === username)) {
    alert("Username is already taken. Please choose another one.");
    return;
  }

  // Add the new user
  users.push({ username });
  localStorage.setItem("users", JSON.stringify(users)); // Save back to local storage
  alert("Registration successful! You can now log in.");
}
