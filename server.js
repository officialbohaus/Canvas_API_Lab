
import express from 'express';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("Hello, Express!");
});

app.get("/secret", (req, res) => {
    res.send("Super secret!");
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
