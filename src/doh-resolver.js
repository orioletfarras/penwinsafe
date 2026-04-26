'use strict'

const https = require('https')
const dnsPacket = require('dns-packet')

const DOH_HOST = 'doh.cleanbrowsing.org'
const DOH_PATH = '/doh/family-filter/'

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

function resolve(hostname) {
  const cached = cachedGet(hostname)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    const query = buildQuery(hostname)

    const options = {
      hostname: DOH_HOST,
      path: DOH_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-message',
        'Content-Length': query.length,
        'Accept': 'application/dns-message'
      }
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        try {
          const response = dnsPacket.decode(Buffer.concat(chunks))
          const answer = response.answers.find(a => a.type === 'A')
          if (!answer) return reject(new Error(`No A record for ${hostname}`))
          cacheSet(hostname, answer.data)
          resolve(answer.data)
        } catch (err) {
          reject(err)
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy(new Error('DoH timeout'))
    })
    req.write(query)
    req.end()
  })
}

module.exports = { resolve }
