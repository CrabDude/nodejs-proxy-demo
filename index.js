let http = require('http')
let fs = require('fs')
let request = require('request')
let scheme = 'http://'
let argv = require('yargs')
  .default('host', '127.0.0.1')
  .argv
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout

http.createServer((req, res) => {
  logStream.write(`\nRequest received at: ${req.url}`)
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
  logStream.write('\n\n\nEcho Request:\n' + JSON.stringify(req.headers))
  req.pipe(logStream)
  req.pipe(res)
}).listen(8000)

http.createServer((req, res) => {
  logStream.write(`\nProxying request to: ${destinationUrl + req.url}`)
  let url
  if (req.headers['x-destination-url']) {
    url = req.headers['x-destination-url']
    delete req.headers['x-destination-url']
  } else {
    url = destinationUrl + req.url
  }

  let options = {
    method: req.method,
    headers: req.headers,
    url: url
  }
  logStream.write('\n\n\nProxy Request:\n' + JSON.stringify(req.headers))
  req.pipe(logStream)

  let downstreamResponse = req.pipe(request(options))
  downstreamResponse.pipe(logStream)
  downstreamResponse.pipe(res)
}).listen(8001)
