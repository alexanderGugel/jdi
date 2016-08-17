# `index.js`
This file exposes functions for using `jdi` APIs directly, without the `jdi`
command line utility.
## module dependencies
Native node dependencies.
```js
const fs       = require('fs')
const path     = require('path')
```
Dependencies used for processing the read streams of processed source files.
```js
const split    = require('split')
const through2 = require('through2')

```
## regular expressions
### `isDoc`
`isDoc` matches comments starting with `//`. Whitespace is being ignored.
```js
const isDoc = /^\s*\/\/\s*/
```
### `isBlank`
`isBlank` matches lines containing only whitespace characters, such as tabs
or spaces.
```js
const isBlank = /^\s*$/
```
### `isShebang`
`isShebang` matches lines that start with the shebang character sequence. See
[Shebang (Unix)](https://de.wikipedia.org/wiki/Shebang) explaining the syntax
of the directive itself.
```js
const isShebang = /^#!/
```
### `isIgnored`
`isIgnored` matches lines that end with "jdi-disable-line". This is inspired
by `eslint`'s `eslint-disable-line` directive.
```js
const isIgnored = /^.*jdi-disable-line$/

```
## `transformFunction`
```js
function transformFunction (chunk, enc, cb) {
	const extname = this.options.extname

```
### shebang
Are we currently processing the first line of the file in question?
```js
	const isFirstLine = !this.isNotFirstLine
	this.isNotFirstLine = true

```
Check if the file starts with a shebang.
```js
	if (isFirstLine && isShebang.test(chunk)) {
```
If we are on the first line of the file and the file starts with a
shebang, e.g. `#!/usr/bin/env node`, we ignore the shebang.
```js
		cb()
		return
	}

```
### blank lines 
We ignore empty lines in order to avoid creating excessive code blocks.
Empty lines are being preserved in the transformed `.md` file. They can
be used for separating sections.
```js
	if (isBlank.test(chunk)) {
		this.push(chunk)
		this.push('\n')
		cb()
		return
	}

```
### ignored lines
Check if line ends with jdi-disable-line.
```js
	if (isIgnored.test(chunk)) {
```
If jdi should ignore this line, `cb()` without pushing `chunk`.
```js
		cb()
		return
	}

```
### code blocks
Check if we are currently in a code block. Everything that is **not** a
comment can be considered to be a code block.
```js
	const isCodeBlock = this.isCodeBlock
	this.isCodeBlock = !isDoc.test(chunk)

```
Did we just start a code block?
```js
	if (this.isCodeBlock && !isCodeBlock) {
```
If yes, append ``\`\`\`${extname}` to start the code block.
```js
		this.push(`\`\`\`${extname}\n`)
	}

```
Did we just close a code block?
```js
	if (!this.isCodeBlock && isCodeBlock) {
```
If yes, append `\`\`\`` to close the code block.
```js
		this.push('```\n')
	}

```
Are we currently in a code block?
```js
	if (this.isCodeBlock) {
```
If yes, just pass the chunk through.
```js
		this.push(chunk)
	} else {
```
Otherwise, we're in a comment (= documentation). We remove the
comment prefix and trailing whitespace (typically `// `).
That way `// # title` becomes `# title`.
```js
		this.push(String(chunk).replace(isDoc, ''))
	}

	this.push('\n')
	cb()
}

```
## `flushFunction`
This function is being called just prior to the stream ending. Keep in mind
that it's a `prototype` function, thuse `flushFunction` and
`transformFunction` share the same `this` context.
```js
function flushFunction (cb) {
```
### closing code blocks
Make sure we're closing any open code blocks with `\`\`\``.
```js
	if (this.isCodeBlock) {
		this.push('```\n')
	}

```
### file footer
Here we append a footer to the generated `.md` file. The footer includes
the date when the file has been generated, as well as the relative
filename of the processed file itself.
```js
	const file = this.options.file
```
The `.md` file will be in the same directory as the source file. We only
need the basename.
```js
	const basename = path.basename(file)
	const date = String(new Date())
	this.push('------------------------\n')
	this.push(`Generated _${date}_ from [&#x24C8; ${basename}](${basename} "View in source")\n`)
	this.push('\n')
	cb()
}

```
## `Transform`
Instead of returning a `stream.Transform` instance, through2.ctor() returns a
constructor for our custom Transform that operates on a line-by-line basis.
```js
const Transform = through2.ctor(transformFunction, flushFunction)

```
## `doc`
`doc` accepts a filename, creates a corresponding read stream, processes the
file and writes the resulting `.md` file to disk.
```js
const doc = file =>
	fs.createReadStream(file)
```
[`split`](https://www.npmjs.com/package/split) is a transform that
generates chunks separated by new-line.
```js
		.pipe(split())
```
Here we invoke our custom `Transform` instance used for processing
the separated line-chunks.
```js
		.pipe(new Transform({
```
If there is no file extension, we assume that the source file is
a JavaScript file. In some cases, we could also determine the
extension name from the first line of the file, e.g.
`#!/usr/bin/env node`.
```js
			extname: path.extname(file).substr(1) || 'js',

```
The `file` is being used for adding the header of the `.md`
output.
```js
			file
		}))

```
## `handleClose`
We print a message whenever we generated a `.md` file.
```js
const handleClose = cwd => function handler () {
	const toPath = path.relative(cwd, this.path)
	console.log('wrote', this.bytesWritten, 'bytes to', toPath) // eslint-disable-line no-console
}

```
## `run`
This is the main function of `jdi`. It accepts an array of `args` and
generates corresponding `.md` files.
**Warning:** `run` has persistent side-effects (it overrides files). If you
just want to create streams of documented source files, use `doc()` instead.
```js
const run = (cwd, args) =>
	args
```
Files that should be documented are being passed in via `args`, e.g.
if the user invokes `jdi index.js test.js`, `args` will be an array
of `['index.js', 'test.js']`.
```js
		.map(file => path.join(cwd, file))
```
Now we have an array of filenames to be processed.
We map over those files and create a corresponding stream.
```js
		.map(doc)
```
Create a corresponding [`WriteStream`](https://nodejs.org/api/fs.html#fs_class_fs_writestream).
```js
		.map(out => out.pipe(fs.createWriteStream(`${out.options.file}.md`)))
```
.pipe(fs.createWriteStream(`${file}.md`))
Now we attach the `close` listener.
```js
		.forEach(stream => stream.on('close', handleClose(cwd)))

```
## `exports`
Public APIs:
```js
exports.run = run
exports.doc = doc
exports.Transform = Transform

```
------------------------
Generated _Wed Aug 17 2016 21:45:13 GMT+0100 (BST)_ from [&#x24C8; index.js](index.js "View in source")

