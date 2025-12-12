const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

// Load movies
function loadMovies() {
    const file = path.join(__dirname, "../../models/movies.json");
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
    return JSON.parse(fs.readFileSync(file));
}

// Save movies
function saveMovies(movies) {
    const file = path.join(__dirname, "../../models/movies.json");
    fs.writeFileSync(file, JSON.stringify(movies, null, 2));
}

// ADD MOVIE
router.post("/", (req, res) => {
    const { title, year, description } = req.body;

    const movies = loadMovies();

    const newMovie = {
        id: uuid(),
        title,
        year,
        description,
        reviews: []
    };

    movies.push(newMovie);
    saveMovies(movies);

    res.redirect("/movies");
});

// ADD REVIEW
router.post("/:id/reviews", (req, res) => {
    const { rating, comment } = req.body;

    const movies = loadMovies();
    const movie = movies.find(m => m.id == req.params.id);

    if (!movie) return res.send("Movie not found");

    movie.reviews.push({
        username: req.session.user.username,
        rating: Number(rating),
        comment
    });

    saveMovies(movies);

    res.redirect(`/movies/${movie.id}`);
});

module.exports = router;