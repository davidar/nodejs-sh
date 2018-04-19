const duplex = require('duplexer')
const getRawBody = require('raw-body')
const {spawn} = require('child_process')

module.exports = new Proxy({}, {get: (target, name) => function (...args) {
  let proc = spawn(name, args, {stdio: ['pipe', 'pipe', process.stderr]})
  let stream = duplex(proc.stdin, proc.stdout)
  stream.end = function () {
    proc.stdin.end.apply(proc.stdin, arguments)
    return this // return duplex stream rather than original writer stream
  }
  stream.then = function (resolve, reject) {
    proc.on('close', code => (code === 0) ? resolve() : reject(code))
  }
  stream.toString = async function (encoding = 'utf-8') {
    let promise = getRawBody(this, {encoding})
    await this
    return promise
  }
  return stream
}})
