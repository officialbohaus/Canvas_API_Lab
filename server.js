// node's http module used for http protocols
// createServer
import { createServer } from 'node:http';
import 'os';

// adds .env values on import to process.env
import 'dotenv/config'

// check values for canvas API and server
const canvasURL = process.env.CANVAS_BASE_URL;
// const hostname = os.hostname();
const port = process.env.PORT;
console.log(process.env);
// console.log(hostname);

const server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/echo') {
        body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        })
        .on('end', () => {
            body = Buffer.concat(body).toString;
            res.statusCode = 200;
            res.end(body);
        })
    } else {
        res.statusCode = 404;
        res.end();
    }

    // const { headers, method, url } = req;
    // // array to store sequential chunks of data until all are received.
    // let body = [];
    // req.on('error', (err) => {
    //     console.error(err);
    // })
    // .on('data', (chunk) => {
    //     // push each sequential chunk
    //     body.push(chunk);
    // })
    // // once done receiving data, then begin response
    // .on('end', () => {
    //     // concatenate all chunks in body to one string
    //     body = Buffer.concat(body).toString();

    //     res.on('error', err => {
    //         console.error(err);
    //     });

    //     res.statusCode = 200;
    //     res.setHeader('Content-Type', 'application/json');

    //     const resBody = { headers, method, url, body };
    //     // res is a write stream, 
    //     res.write(JSON.stringify(resBody));
    //     res.end();

    // })
    // console.log(method);
    // console.log(url);
    // console.log(headers);
    // res.statusCode = 200; // to indicate successful response
    // res.setHeader('Content-Type', 'text/html') // HTTP header
    // res.end('<html><body><h1>Hello World!</h1></body></html>'); //  .end says last chunk of data
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})