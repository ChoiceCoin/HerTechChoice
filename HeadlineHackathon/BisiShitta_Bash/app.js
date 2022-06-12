const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname + "/"));

app.get('/', (req, res) =>{
  res.sendFile(path.join(__dirname + "/index.html"))
})

app.get('/index', (req, res) =>{
  res.sendFile(path.join(__dirname + "/index.html"))
})

app.get('/modal', (req, res) =>{
  res.sendFile(path.join(__dirname + "/modal.html"))
})


var port = process.env.PORT || 3000;
app.listen(port, function(err){
  if(err) console.log(err);
  console.log(`Server listening on port ${port}`);
})