const fs = require('fs');
let data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
data = data.map(t => {
  if (['067', '068', '069', '089'].includes(t.id)) {
    return { ...t, passes: true };
  }
  return t;
});
fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
