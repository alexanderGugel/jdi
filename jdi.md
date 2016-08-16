# jdi
This is the actual `jdi` executable which is being declared as `bin` in the
`package.json` file. Whenever a user runs `jdi`, this is the file that is
being run.
## module dependencies
We're using [`commander`](https://www.npmjs.com/package/commander) for
parsing command line arguments and generating the `--help` output. We tried
out [`vorpal`](https://www.npmjs.com/package/vorpal) as well, but it
significantly increases startup time, which we obviously want to avoid.
```js
const program  = require('commander')
```
The [`package.json`](./package.json) is our source of truth.
```js
const version  = require('./package.json').version
const jdi      = require('.')
```
`jdi` uses the [`glob`](https://www.npmjs.com/package/glob) module for
filename expansion. If your shell already handles that for you (e.g. if
you're using `fish`), you can optionally quote the filenames that you want to
expand, e.g. like this:
```sh
$ jdi 'src/**/*.js'
```
```js
const glob     = require('glob')
const flatten  = require('flatten')

```
## program
This is where we declare our `jdi` command. Currently there are no
sub-commands, but this might change in the future as `jdi` grows.
```js
program
  .version(version)
  .parse(process.argv)

```
Expand glob patterns to actual filenames. This is going to run `**/*.js` into
an array of actually existing files.
```js
const filenames = flatten(
	program.args
		.map(pattern => glob.sync(pattern))
)

```
## `run()`
Here we actually invoke `run` and start execution.
```js
jdi.run(process.cwd(), filenames)

```
------------------------
Generated _Wed Aug 17 2016 00:23:19 GMT+0100 (BST)_ from `jdi`
