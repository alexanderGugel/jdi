'use strict'

const test = require('tape')
const Transform = require('..').Transform

test('Transform#transformFunction', t => {
	t.test('should ignore shebang', t => {
		const s = new Transform({ file: '' })
		let md = ''
		s.on('data', chunk => md += chunk)
		s.write('#!/usr/bin/env node')

		t.equal(md, '', 'should ignore shebang')
		s.end()
		t.end()
	})

	t.test('should ignore jdi-disable-line lines', t => {
		const s = new Transform({ file: 'test.js' })
		let md = ''
		s.on('data', chunk => md += chunk)
		s.write('ignore me // jdi-disable-line')
		s.write('don\'t ignore me // jdi-disable-line-not-ignored')

		t.equal(md, '```undefined\ndon\'t ignore me // jdi-disable-line-not-ignored\n')
		t.end()
		s.end()
	})

	t.test('should strip comment prefixes', t => {
		const s = new Transform({ file: 'test.js' })
		let md = ''
		s.on('data', chunk => md += chunk)
		s.write('// # markdown comment')

		t.equal(md, '# markdown comment\n')
		t.end()
		s.end()
	})
})