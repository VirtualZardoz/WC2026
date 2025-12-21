const fs = require('fs');
let data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
data = data.map(t => {
  if (t.id === '065' || t.id === '096') {
    return { ...t, passes: true };
  }
  return t;
});
fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
