
import express from 'express';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = process.env.PORT || 3000;
const canvasBaseUrl = (process.env.CANVAS_BASE_URL || '').replace(/\/$/, '');
const canvasToken = process.env.CANVAS_TOKEN || process.env.CANVAS_API_TOKEN;
const canvasCourseId = process.env.CANVAS_COURSE_ID;

app.use(express.static('public'));

function canvasRequest(path) {
    return fetch(new URL(path, `${canvasBaseUrl}/`), {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${canvasToken}`
        }
    });
}

function getNextPageUrl(linkHeader) {
    if (!linkHeader) return null;

    const nextLink = linkHeader
        .split(',')
        .map((link) => link.trim())
        .find((link) => /rel=["']?next["']?/.test(link));

    if (!nextLink) return null;
    const urlMatch = nextLink.match(/^<([^>]+)>/);
    return urlMatch ? urlMatch[1] : null;
}

async function fetchAllCanvasPages(path) {
    const items = [];
    let nextUrl = new URL(path, `${canvasBaseUrl}/`).toString();

    while (nextUrl) {
        const response = await canvasRequest(nextUrl);
        if (!response.ok) {
            return { response, detail: await response.text() };
        }

        const page = await response.json();
        items.push(...page);
        nextUrl = getNextPageUrl(response.headers.get('link'));
    }

    return { items };
}

function sendCanvasError(res, result) {
    return res.status(result.response.status).json({
        error: `Canvas returned ${result.response.status}.`,
        ...(result.detail ? { detail: result.detail } : {})
    });
}

app.get('/api/courses', async (req, res) => {
    if (!canvasBaseUrl || !canvasToken) {
        return res.status(503).json({
            error: 'Canvas is not configured. Add CANVAS_BASE_URL and CANVAS_TOKEN to .env.'
        });
    }

    try {
        const result = await fetchAllCanvasPages('/api/v1/courses?enrollment_state=active&per_page=100');
        if (result.response) return sendCanvasError(res, result);
        res.json(result.items.filter((course) => course.id && course.name));
    } catch (error) {
        console.error('Canvas courses request failed:', error);
        res.status(502).json({ error: 'Unable to reach Canvas right now.' });
    }
});

app.get('/api/todos', async (req, res) => {
    const courseId = req.query.courseId || canvasCourseId;

    if (!canvasBaseUrl || !canvasToken || !courseId) {
        return res.status(503).json({
            error: 'Canvas is not configured. Add CANVAS_BASE_URL, CANVAS_TOKEN, and CANVAS_COURSE_ID to .env.'
        });
    }

    const canvasUrl = new URL(
        `/api/v1/courses/${encodeURIComponent(courseId)}/todo`,
        `${canvasBaseUrl}/`
    );
    canvasUrl.searchParams.set('per_page', '100');

    try {
        const result = await fetchAllCanvasPages(`${canvasUrl.pathname}${canvasUrl.search}`);
        if (result.response) return sendCanvasError(res, result);
        res.json(result.items);
    } catch (error) {
        console.error('Canvas request failed:', error);
        res.status(502).json({ error: 'Unable to reach Canvas right now.' });
    }
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;
