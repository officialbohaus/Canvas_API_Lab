# Canvas Todo Board

Canvas Todo Board is an Express web app that connects to Canvas LMS, lets you choose one of your active courses, and displays its Todo items in a focused dashboard. It is useful for quickly seeing upcoming course work without navigating through several Canvas pages.

## Setup

### Prerequisites

Install Node.js, which includes the `npm` package manager, from [nodejs.org](https://nodejs.org/). After installation, verify that both commands work:

```bash
node --version
npm --version
```

### Install and run

1. Clone this repository:

	```bash
	git clone https://github.com/officialbohaus/Canvas_API_Lab.git
	```

2. Move into the project directory:

	```bash
	cd Canvas_API_Lab
	```

3. Install the project's dependencies. This reads `package.json` and downloads the packages into `node_modules`:

	```bash
	npm install
	```

4. Create your local environment file from the included template:

	```bash
	cp .env.example .env
	```

5. Open `.env` and fill in your Canvas URL and personal access token. `CANVAS_COURSE_ID` is optional and is only used as a fallback:

	```env
	CANVAS_BASE_URL=https://your-school.instructure.com
	CANVAS_TOKEN=your_canvas_access_token
	CANVAS_COURSE_ID=12345
	```

	The app also accepts the existing variable name `CANVAS_API_TOKEN` in place of `CANVAS_TOKEN`. Create a personal access token in Canvas under **Account Settings**. Never commit `.env` or share the token.

6. Start the web app:

	```bash
	npm start
	```

7. Open [http://localhost:3000](http://localhost:3000) in a browser and choose a course from the selector.

The Canvas token stays on the server. The browser only calls the local `/api/todos` endpoint.

## Canvas API endpoints used

| Canvas endpoint | Data retrieved |
| --- | --- |
| `GET /api/v1/courses?enrollment_state=active` | The active courses available to the authenticated user, used to populate the course selector. |
| `GET /api/v1/courses/:course_id/todo` | Todo items and assignment details for the selected course. |

Both list requests follow Canvas `Link` headers with `rel="next"`, so the app combines all pages before displaying the results. The app's local `/api/courses` and `/api/todos` routes keep the Canvas token out of the browser.

## Tests

Run the API proxy tests with:

```bash
npm test
```

The tests mock Canvas responses, including pagination and error status codes, so they do not require a live Canvas account.

## Reflection

This project helped me understand how an Express server can act as a secure middle layer between a browser and a third-party REST API. I learned how to use Canvas's course and Todo endpoints together, keep credentials in environment variables, and transform API responses into a readable interface instead of exposing raw JSON. I also learned that pagination needs to be handled explicitly because a successful first response does not guarantee that all available records were returned.

The most challenging parts were handling several failure modes consistently and preserving the Canvas token on the server while still allowing the browser to select a course. Following the `Link` header was another important detail because the API controls the next-page URL. With more time, I would add richer filtering and sorting, link each Todo directly to its Canvas assignment, and add browser-level tests for the course form and loading states.