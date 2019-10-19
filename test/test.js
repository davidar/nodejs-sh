/* eslint-env mocha */
const { expect } = require('chai')
const fs = require('fs')
const path = require('path')
const tmp = require('tmp')

const { cat, echo, ls, sleep, wc } = require('..')

describe('Basic tests', function () {
  it('echo', async function () {
    const output = await echo('foo', 'bar').toString()
    expect(output).to.equal('foo bar\n')
  })
  it('cat', async function () {
    const output = await cat().end('foo\nbar').toString()
    expect(output).to.equal('foo\nbar')
  })
  it('exit code', async function () {
    let exitCode
    try {
      await ls('/doesnt/exist')
      exitCode = 0
    } catch (e) {
      exitCode = e
    }
    expect(exitCode).to.equal(2)
  })
  it('redirection', function () {
    const tmpdir = tmp.dirSync().name
    const file = fs.createWriteStream(path.join(tmpdir, 'file.txt'))
    ls('test/').pipe(file).on('finish', () => {
      expect(fs.readFileSync(path.join(tmpdir, 'file.txt'), 'utf8')).to.equal('test.js\n')
    })
  })
  it('pipe', async function () {
    const output = await ls('-1').pipe(wc('-l')).toString()
    expect(output).to.equal('11\n')
  })
  it('background', async function () {
    const p = sleep('1')
    let finished = false
    p.then(() => { finished = true })
    expect(finished).to.equal(false)
    await p
    expect(finished).to.equal(true)
  })
})
