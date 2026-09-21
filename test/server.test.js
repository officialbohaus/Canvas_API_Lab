import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { after, before, beforeEach, test } from 'node:test';

process.env.CANVAS_BASE_URL = 'https://canvas.test';
process.env.CANVAS_TOKEN = 'test-token';
process.env.CANVAS_COURSE_ID = 'fallback-course';

const { default: app } = await import('../server.js');
const originalFetch = globalThis.fetch;
let server;
let canvasRequests;

before(async () => {
    server = app.listen(0);
    await once(server, 'listening');
});

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    globalThis.fetch = originalFetch;
});

beforeEach(() => {
    canvasRequests = [];
    globalThis.fetch = async (input, options) => {
        canvasRequests.push({ url: String(input), options });
        return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    };
});

function get(path) {
    return new Promise((resolve, reject) => {
        const request = http.get({ hostname: '127.0.0.1', port: server.address().port, path }, (response) => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => { body += chunk; });
            response.on('end', () => resolve({
                status: response.statusCode,
                body: body ? JSON.parse(body) : null
            }));
        });
        request.on('error', reject);
    });
}

test('GET /api/courses returns named courses from Canvas', async () => {
    globalThis.fetch = async (input, options) => {
        const url = String(input);
        canvasRequests.push({ url, options });
        if (url.includes('page=2')) {
            return new Response(JSON.stringify([
                { id: 103, name: 'Algorithms', course_code: 'CS-201' }
            ]), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response(JSON.stringify([
            { id: 101, name: 'Web Development', course_code: 'WEB-101' },
            { id: 102, name: '' },
            { id: null, name: 'Unavailable Course' }
        ]), {
            status: 200,
            headers: {
                'content-type': 'application/json',
                link: '<https://canvas.test/api/v1/courses?page=2&per_page=100>; rel="next"'
            }
        });
    };

    const response = await get('/api/courses');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [
        { id: 101, name: 'Web Development', course_code: 'WEB-101' },
        { id: 103, name: 'Algorithms', course_code: 'CS-201' }
    ]);
    assert.equal(canvasRequests.length, 2);
    assert.match(canvasRequests[0].url, /\/api\/v1\/courses\?enrollment_state=active&per_page=100/);
    assert.equal(canvasRequests[0].options.headers.Authorization, 'Bearer test-token');
});

test('GET /api/todos forwards the selected course to Canvas', async () => {
    globalThis.fetch = async (input, options) => {
        const url = String(input);
        canvasRequests.push({ url, options });
        if (url.includes('page=2')) {
            return new Response(JSON.stringify([{ title: 'Submit quiz' }]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }
        return new Response(JSON.stringify([{ title: 'Read chapter 1' }]), {
            status: 200,
            headers: {
                'content-type': 'application/json',
                link: '<https://canvas.test/api/v1/courses/course%2F42/todo?page=2&per_page=100>; rel="next"'
            }
        });
    };

    const response = await get('/api/todos?courseId=course%2F42');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [{ title: 'Read chapter 1' }, { title: 'Submit quiz' }]);
    assert.equal(canvasRequests.length, 2);
    assert.match(canvasRequests[0].url, /\/api\/v1\/courses\/course%2F42\/todo\?per_page=100/);
    assert.equal(canvasRequests[0].options.headers.Authorization, 'Bearer test-token');
});

test('Canvas errors are returned by the todo proxy', async () => {
    globalThis.fetch = async () => new Response('forbidden', { status: 403 });

    const response = await get('/api/todos?courseId=101');

    assert.equal(response.status, 403);
    assert.equal(response.body.error, 'Canvas returned 403.');
    assert.equal(response.body.detail, 'forbidden');
});
