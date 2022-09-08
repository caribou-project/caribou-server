import express from 'express';
import { loadMovie, loadMovies } from './resolver';

const app = express();

app.get("/movies", (req, res) => {
    const { limit=20, offset=0 } = req.query;
    if(Number.isNaN(Number(limit))){
        res.status(500).json({ error: "limit parameter must be a number" }) 
    };
    if(Number.isNaN(Number(offset))){
        res.status(500).json({ error: "offset parameter must be a number" }) 
    };

    const movies = loadMovies({limit: Number(limit), offset: Number(offset)});
    return res.json({movies});
});

app.get('/movie/:id', (req, res) => {
    const { id } = req.params;
    const { count=50 } = req.query;
    if(Number.isNaN(Number(count))){
        res.status(500).json({ error: "count parameter must be a number" }) 
    };

    try {
        const movie = loadMovie({id, count: Number(count)})
        return res.json(movie);
    } catch (err: unknown) {
        if(err instanceof Error){
            return res.status(400).json({ error: err.message })
        }
    }
})

app.listen(process.env.PORT || 9833, () => {
    console.log("Caribou server listen at localhost:9833 port");
});