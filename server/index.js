import express from 'express';
import { loadMovie, loadMovies } from './resolver.js';

const app = express();

app.get("/movies", (req, res) => {
    const movies = loadMovies();
    return res.json({movies});
});

app.get('/movie/:id', (req, res) => {
    const { id } = req.params;
    try {
        const movie = loadMovie(id)
        return res.json(movie);
    } catch (err) {
        return res.status(400).json({ error: err.message })
    }
})

app.listen(process.env.PORT || 9833, () => {
    console.log("Caribou server listen at localhost:9833 port");
});