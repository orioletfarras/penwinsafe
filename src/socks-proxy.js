'use strict'

const net = require('net')
const { resolve } = require('./doh-resolver')

const PROXY_HOST = '127.0.0.1'
const PROXY_PORT = 18765

const SOCKS5_VERSION = 0x05
const AUTH_NO_AUTH = 0x00
const CMD_CONNECT = 0x01
const ATYP_IPV4 = 0x01
const ATYP_DOMAIN = 0x03
const ATYP_IPV6 = 0x04
const REP_SUCCESS = 0x00
const REP_FAILURE = 0x01

function handleClient(client) {
  client.once('data', (data) => {
    if (data[0] !== SOCKS5_VERSION) { client.destroy(); return }

    // Handshake: accept no-auth
    client.write(Buffer.from([SOCKS5_VERSION, AUTH_NO_AUTH]))

    client.once('data', async (req) => {
      if (req[0] !== SOCKS5_VERSION || req[1] !== CMD_CONNECT) {
        client.write(Buffer.from([SOCKS5_VERSION, REP_FAILURE, 0x00, ATYP_IPV4, 0, 0, 0, 0, 0, 0]))
        client.destroy()
        return
      }

      const atyp = req[3]
      let hostname
      let port
      let offset

      if (atyp === ATYP_IPV4) {
        hostname = `${req[4]}.${req[5]}.${req[6]}.${req[7]}`
        port = req.readUInt16BE(8)
        offset = 10
      } else if (atyp === ATYP_DOMAIN) {
        const len = req[4]
        hostname = req.slice(5, 5 + len).toString()
        port = req.readUInt16BE(5 + len)
        offset = 5 + len + 2
      } else if (atyp === ATYP_IPV6) {
        // IPv6: pass through without DNS resolution
        hostname = null
        port = req.readUInt16BE(20)
      } else {
        client.destroy()
        return
      }

      try {
        let targetIP = hostname

        // Only resolve domain names through CleanBrowsing DoH
        if (atyp === ATYP_DOMAIN) {
          targetIP = await resolve(hostname)
        }

        if (!targetIP) {
          client.write(Buffer.from([SOCKS5_VERSION, REP_FAILURE, 0x00, ATYP_IPV4, 0, 0, 0, 0, 0, 0]))
          client.destroy()
          return
        }

        const target = net.createConnection({ host: targetIP, port }, () => {
          // Send success response with bound address
          const ipParts = targetIP.split('.').map(Number)
          const reply = Buffer.from([
            SOCKS5_VERSION, REP_SUCCESS, 0x00, ATYP_IPV4,
            ipParts[0], ipParts[1], ipParts[2], ipParts[3],
            (port >> 8) & 0xff, port & 0xff
          ])
          client.write(reply)
          target.pipe(client)
          client.pipe(target)
        })

        target.on('error', () => {
          client.destroy()
        })

        client.on('error', () => {
          target.destroy()
        })

      } catch (err) {
        client.write(Buffer.from([SOCKS5_VERSION, REP_FAILURE, 0x00, ATYP_IPV4, 0, 0, 0, 0, 0, 0]))
        client.destroy()
      }
    })
  })

  client.on('error', () => {})
}

function start() {
  return new Promise((resolve, reject) => {
    const server = net.createServer(handleClient)
    server.listen(PROXY_PORT, PROXY_HOST, () => {
      console.log(`[PenwinSafe] Proxy SOCKS5 activo en ${PROXY_HOST}:${PROXY_PORT}`)
      resolve()
    })
    server.on('error', reject)
  })
}

module.exports = { start, PROXY_HOST, PROXY_PORT }
