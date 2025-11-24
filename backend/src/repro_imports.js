import { tasks } from './modules/tasks/tasks.schema.js';
import { users } from './modules/users/users.schema.js';
import { kanbanBoards, kanbanColumns } from './modules/kanban/kanban.schema.js';

console.log('Checking imports...');
console.log('tasks:', !!tasks);
console.log('users:', !!users);
console.log('kanbanBoards:', !!kanbanBoards);
console.log('kanbanColumns:', !!kanbanColumns);

if (!tasks || !users || !kanbanBoards || !kanbanColumns) {
    console.error('FAIL: Some imports are undefined');
    process.exit(1);
} else {
    console.log('SUCCESS: All imports are defined');
    console.log('Tasks columns:', Object.keys(tasks));
    console.log('Users columns:', Object.keys(users));
}
