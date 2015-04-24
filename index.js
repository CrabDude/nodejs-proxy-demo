let path = require('path')
let http = require('http')
let fs = require('fs')
let request = require('request')
let argv = require('yargs')
  .default('host', '127.0.0.1')
  .argv
let scheme = 'http://'
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.log ? fs.createWriteStream(path.join(__dirname, argv.log)) : process.stdout

http.createServer((req, res) => {
  logStream.write(`\nEcho request received at: ${req.url}:\n` + JSON.stringify(req.headers))
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
  req.pipe(logStream, {end: false})
  req.pipe(res, {end: false})
}).listen(8000)

logStream.write('Listening at http://127.0.0.1:8000')

http.createServer((req, res) => {
  let url = destinationUrl
  if (req.headers['x-destination-url']) {
    url = req.headers['x-destination-url']
    delete req.headers['x-destination-url']
  }
  let options = {
    headers: req.headers,
    url: url + req.url
  }

  logStream.write(`\nRequest proxied to: ${url + req.url}: \n` + JSON.stringify(req.headers))
  req.pipe(logStream, {end: false})

  let destinationResponse = req.pipe(request(options), {end: false})

  logStream.write(JSON.stringify(destinationResponse.headers))
  destinationResponse.pipe(res, {end: false})
  destinationResponse.pipe(logStream, {end: false})
}).listen(8001)
