const http = require('http');

http.get('http://localhost:3000/api/assets/settings', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.medalImage && !json.routeMapImage) {
      json.routeMapImage = json.medalImage;
      json.medalImage = "";
      
      const postData = JSON.stringify(json);
      const req = http.request('http://localhost:3000/api/assets/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (postRes) => {
        postRes.on('data', d => process.stdout.write(d));
      });
      req.write(postData);
      req.end();
    } else {
      console.log("No fix needed");
    }
  });
});
