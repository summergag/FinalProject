const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, path.join(__dirname, "../../public/images"));
    },
    filename: (req, file, cb) => {
        const uniqueId = uuid();
        const fileExt = path.extname(file.originalname);
        cb(null, uniqueId + fileExt);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

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
router.post("/", upload.single('poster'), (req, res) => {
    const { title, year, description } = req.body;

    let finalPosterPath = null;

    if (req.file) {
        finalPosterPath = `/images/${req.file.filename}`;
    }

    if (!title || !year || !description) {
         if (req.file) {
             fs.unlinkSync(req.file.path); 
         }
         return res.status(400).send("Missing required movie fields: title, year, or description.");
    }

    const movies = loadMovies();

    const newMovie = {
        id: uuid(),
        title,
        year,
        description,
        posterPath: finalPosterPath,
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

router.post("/:id", upload.single('poster'), (req, res) => {
    if (req.body._method !== 'PATCH') {

    }
    
    const movieId = req.params.id;
    const { title, year, description, deletePoster } = req.body;
    
    // Load all movies
    const movies = loadMovies();
        const movieIndex = movies.findIndex(m => m.id === movieId);

    if (movieIndex === -1) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(404).send("Movie not found for update.");
    }
    
    let movie = movies[movieIndex];
    let newPosterPath = movie.posterPath;

    if (req.file) {
        if (movie.posterPath) {
            const oldFilePath = path.join(__dirname, "../../public", movie.posterPath);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        newPosterPath = `/images/${req.file.filename}`;
    }

    else if (deletePoster === 'true' && movie.posterPath) {
        const oldFilePath = path.join(__dirname, "../../public", movie.posterPath);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }
        newPosterPath = null;
    }

    movie.title = title;
    movie.year = year;
    movie.description = description;
    movie.posterPath = newPosterPath;

    saveMovies(movies);

    res.redirect(`/movies/${movieId}`);
});

module.exports = router;