'use strict'

const test = require('tape')
const Transform = require('..').Transform

test('Transform#flushFunction', t => {
	t.test('should close open code block', t => {
		const s = new Transform({ file: '' })
		let md = ''
		s.isCodeBlock = true
		s.on('data', chunk => md += chunk).end()

		t.equal(md.substr(0, 3), '```', 'should close open code block')
		t.end()
	})

	t.test('should write ', t => {
		const s = new Transform({ file: '/some/filename.js' })
		let md = ''
		s.on('data', chunk => md += chunk).end()

		t.notEqual(`from \`${md.indexOf('filename.js')}\``, -1, 'should include basename of file in footer')
		t.end()
	})
})
