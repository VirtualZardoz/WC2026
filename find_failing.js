const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const failing = data.filter(t => !t.passes);
console.log('Total tests:', data.length);
console.log('Failing tests count:', failing.length);
console.log(JSON.stringify(failing.map(t => ({id: t.id, description: t.description})), null, 2));
