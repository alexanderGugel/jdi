.PHONY: default test

default: index.js.md jdi.md

%.md: %
	@./jdi $<

test:
	@./node_modules/.bin/tape test/*.js
