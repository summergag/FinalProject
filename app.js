const express = require("express");
const path = require("path");
const session = require("express-session");
const fs = require("fs");

const app = express();
const PORT = 3000;

// ----------- MIDDLEWARE -----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: true,
    })
);

// ----------- STATIC FILES -----------
app.use(express.static(path.join(__dirname, "public")));

// ----------- EJS SETUP -----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----------- ROUTES -----------
app.use("/api/users", require("./routes/api/users"));
app.use("/api/movies", require("./routes/api/movies"));

// ----------- READ MOVIES FUNCTION -----------
function readMovies() {
    const filePath = path.join(__dirname, "models/movies.json");

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]"); // ensure file exists
    }

    return JSON.parse(fs.readFileSync(filePath));
}

// ----------- PAGE ROUTES -----------

// Default → redirect to login
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Register page
app.get("/register", (req, res) => {
    res.render("register");
});

// All movies page
app.get("/movies", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const movies = readMovies();
    res.render("movies", { movies });
});

//Render Edit movie
app.get("/movies/:id/edit", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const movies = readMovies();
    const movie = movies.find(m => m.id == req.params.id);

    if (!movie) return res.send("Movie not found");

    res.render("editMovie", { movie });
});

// Single movie details
app.get("/movies/:id", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const movies = readMovies();
    const movie = movies.find(m => m.id == req.params.id);

    if (!movie) return res.send("Movie not found");

    // Ensure movie.reviews exists
    movie.reviews = movie.reviews || [];

    // Check if user already reviewed
    const userReviewed = movie.reviews.some(
        r => r.username === req.session.user.username
    );

    res.render("movieDetails", { movie, userReviewed });
});

// ----------- START SERVER -----------
app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
);

module.exports = app;