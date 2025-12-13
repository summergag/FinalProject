const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

// Load users
function loadUsers() {
    const file = path.join(__dirname, "../../models/users.json");
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
    return JSON.parse(fs.readFileSync(file));
}

// Save users
function saveUsers(users) {
    const file = path.join(__dirname, "../../models/users.json");
    fs.writeFileSync(file, JSON.stringify(users, null, 2));
}

// REGISTER
router.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    const users = loadUsers();

    if (users.find(u => u.email === email)) {
        return res.send("Email already exists");
    }

    const newUser = {
        id: uuid(),
        username,
        email,
        password
    };

    users.push(newUser);
    saveUsers(users);

    res.redirect("/login");
});

// LOGIN
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (!user) {
        return res.render("login", { error: "Invalid username or password." });
    }

    req.session.user = {
        id: user.id,
        username: user.username
    };

    res.redirect("/movies");
});

// LOGOUT
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;