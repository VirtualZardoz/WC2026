const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
data.forEach(t => {
  if (!t.passes) {
    console.log(`FAIL: ${t.id} - ${t.category} - ${t.description}`);
  }
});
