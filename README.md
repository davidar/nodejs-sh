# node-sh

This is a Node.js port of the [sh](https://amoffat.github.io/sh/) Python library, that allows you to call any program as if it were a function:

```js
const {ifconfig} = require('node-sh')

let output = await ifconfig('eth0').toString()
console.log(output)
```

Output:

```
eth0      Link encap:Ethernet  HWaddr 00:00:00:00:00:00
          inet addr:192.168.1.100  Bcast:192.168.1.255  Mask:255.255.255.0
          inet6 addr: ffff::ffff:ffff:ffff:fff/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:0 (0 GB)  TX bytes:0 (0 GB)
```

## Installation

```sh
npm install node-sh
```

## Quick Reference

### Passing Arguments

```js
const {ls} = require('node-sh')

ls('-l', '/tmp', '--color=never').pipe(process.stdout)
```

### Non-zero Exit Codes

```js
const {ls} = require('node-sh')

try {
  await ls('/doesnt/exist')
} catch (exitCode) {
  if (exitCode === 2) console.log("directory doesn't exist")
}
```

### Redirection

```js
const fs = require('fs')
const {ls} = require('node-sh')

let file = fs.createWriteStream('file.txt')
ls('test/').pipe(file).on('finish', () => {
  let output = fs.readFileSync('file.txt', 'utf8')
})
```

### Piping

```js
const {ls, wc} = require('node-sh')

let output = await ls('-1').pipe(wc('-l')).toString()
```

### Background Processes

```js
const {find} = require('node-sh')

let p = find('-name', 'index.js')
// ... do other things ...
await p
```
