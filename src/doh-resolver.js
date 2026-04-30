'use strict'

const https = require('https')
const dnsPacket = require('dns-packet')

// Primary: Cloudflare — Secondary: Google
const DOH_SERVERS = [
  { host: 'cloudflare-dns.com', path: '/dns-query' },
  { host: 'dns.google',         path: '/dns-query' },
]

const cache = new Map()
const CACHE_TTL_MS = 60_000

function cachedGet(hostname) {
  const entry = cache.get(hostname)
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.ip
  return null
}

function cacheSet(hostname, ip) {
  cache.set(hostname, { ip, ts: Date.now() })
}

function buildQuery(hostname) {
  return dnsPacket.encode({
    type: 'query',
    id: Math.floor(Math.random() * 65535),
    flags: dnsPacket.RECURSION_DESIRED,
    questions: [{ type: 'A', name: hostname }]
  })
}

function queryServer(hostname, server) {
  const query = buildQuery(hostname)
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: server.host,
      path: server.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-message',
        'Content-Length': query.length,
        'Accept': 'application/dns-message',
      },
    }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        try {
          const response = dnsPacket.decode(Buffer.concat(chunks))
          const answer = response.answers.find(a => a.type === 'A')
          if (!answer) return reject(new Error(`No A record for ${hostname}`))
          resolve(answer.data)
        } catch (err) { reject(err) }
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => req.destroy(new Error('DoH timeout')))
    req.write(query)
    req.end()
  })
}

async function resolve(hostname) {
  const cached = cachedGet(hostname)
  if (cached) return cached

  let lastErr
  for (const server of DOH_SERVERS) {
    try {
      const ip = await queryServer(hostname, server)
      cacheSet(hostname, ip)
      return ip
    } catch (e) { lastErr = e }
  }
  throw lastErr
}

module.exports = { resolve }
