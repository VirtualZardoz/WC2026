const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
data.filter(t => !t.passes).forEach(t => console.log(`${t.id}: ${t.description}`));
