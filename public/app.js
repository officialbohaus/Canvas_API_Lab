const todoList = document.querySelector('#todo-list');
const message = document.querySelector('#message');
const todoCount = document.querySelector('#todo-count');
const nextDue = document.querySelector('#next-due');
const lastSync = document.querySelector('#last-sync');
const refreshButton = document.querySelector('#refresh-button');
const courseSelect = document.querySelector('#course-select');
const courseForm = document.querySelector('#course-form');

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function getTodoDate(todo) {
    return todo.assignment?.due_at || todo.planner_override?.marked_complete_at || todo.due_at;
}

function formatDueDate(dateValue) {
    if (!dateValue) return 'No due date';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'No due date';
    return dateFormatter.format(date);
}

function renderTodos(todos) {
    todoList.replaceChildren();
    todoCount.textContent = todos.length;

    const datedTodos = todos
        .map((todo) => ({ todo, date: getTodoDate(todo) ? new Date(getTodoDate(todo)) : null }))
        .filter(({ date }) => date && !Number.isNaN(date.getTime()))
        .sort((a, b) => a.date - b.date);
    nextDue.textContent = datedTodos.length ? formatDueDate(datedTodos[0].date) : 'None';

    if (!todos.length) {
        message.hidden = true;
        todoList.innerHTML = '<div class="empty">You are all caught up. Nothing is waiting in this course.</div>';
        return;
    }

    message.hidden = true;
    todos.forEach((todo, index) => {
        const assignment = todo.assignment || {};
        const title = assignment.name || todo.title || 'Untitled todo';
        const context = todo.context_name || todo.context_type || 'Course item';
        const dateValue = getTodoDate(todo);
        const date = dateValue ? new Date(dateValue) : null;
        const isOverdue = date && !Number.isNaN(date.getTime()) && date < new Date();

        const item = document.createElement('article');
        item.className = 'todo';
        item.innerHTML = `
            <span class="todo-number">${String(index + 1).padStart(2, '0')}</span>
            <div>
                <h3 class="todo-title"></h3>
                <p class="todo-meta"></p>
            </div>
            <time class="todo-due${isOverdue ? ' overdue' : ''}">${formatDueDate(dateValue)}</time>
        `;
        item.querySelector('.todo-title').textContent = title;
        item.querySelector('.todo-meta').textContent = context;
        todoList.append(item);
    });
}

async function loadTodos(courseId = courseSelect.value) {
    refreshButton.disabled = true;
    refreshButton.querySelector('span').textContent = '…';
    message.hidden = false;
    message.className = 'message';
    message.textContent = 'Loading your course todos...';

    try {
        const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
        const response = await fetch(`/api/todos${query}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Canvas could not load todos.');
        renderTodos(payload);
        lastSync.textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date());
    } catch (error) {
        todoList.replaceChildren();
        message.className = 'message error';
        message.textContent = error.message;
        todoCount.textContent = '—';
        nextDue.textContent = '—';
        lastSync.textContent = '—';
    } finally {
        refreshButton.disabled = false;
        refreshButton.querySelector('span').textContent = '↻';
    }
}

async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();
        if (!response.ok) throw new Error(courses.error || 'Canvas could not load courses.');

        courseSelect.replaceChildren();
        if (!courses.length) throw new Error('No active Canvas courses were found.');

        courses
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((course) => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseSelect.append(option);
            });
        courseSelect.disabled = false;
        await loadTodos();
    } catch (error) {
        courseSelect.replaceChildren();
        courseSelect.disabled = true;
        const option = document.createElement('option');
        option.textContent = 'Courses unavailable';
        courseSelect.append(option);
        message.className = 'message error';
        message.textContent = error.message;
    }
}

refreshButton.addEventListener('click', () => loadTodos());
courseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadTodos(courseSelect.value);
});
loadCourses();
