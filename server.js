const cors = require('cors')
const proxy = require('express-http-proxy')
const app = require('express')()
const crypto = require('crypto')

const port = process.env.PORT || 3334

console.log(`To make http requests behind CORS, send the request to:
  http://localhost:${port}/proxy

Put the server URL (e. g. \`http://example.com/\`) in the X-Client-Gateway-Server header\n`)

let clientGatewayToken = process.env.CLIENT_GATEWAY_TOKEN
if (!clientGatewayToken) {
  crypto.randomBytes(48, (err, buffer) => {
    clientGatewayToken = buffer.toString('hex')
    console.log('Use the header X-Client-Gateway-Token with the following value:')
    console.log(`  ${clientGatewayToken}\n`)
  })
} else {
  console.log('Use the header X-Client-Gateway-Token with the contents of this environment variable:')
  console.log('  CLIENT_GATEWAY_TOKEN\n')
}

app.use(cors())

app.use('/proxy', proxy(req => {
  const server = req.headers['x-client-gateway-server']
  if (!server) {
    throw new Error('Missing header: X-Client-Gateway-Server')
  }
  return server
}, {
  filter(req, res) {
    const token = req.headers['x-client-gateway-token']
    if (!token) {
      console.log('Missing header: X-Client-Gateway-Token')
    }
    if (token !== clientGatewayToken) {
      console.log('Invalid token in header: X-Client-Gateway-Token')
    }
    return token === clientGatewayToken
  },
  proxyReqOptDecorator(proxyReqOpts, srcReq) {
    delete proxyReqOpts.headers['x-client-gateway-token']
    delete proxyReqOpts.headers['x-client-gateway-server']
    return proxyReqOpts
  }
}))

app.listen(port, () => {
  setTimeout(() => {
    console.log(`Listening on localhost:${port}`)
  }, 200)
})
