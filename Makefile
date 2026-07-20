.PHONY: deps
deps:
	npm install

.PHONY: lint
lint:
	npm run lint

.PHONY: test
test:
	npm test

.PHONY: run-web
run-web:
	npm run dev

.PHONY: update-disk-cache
update-disk-cache:
	npx tsx scripts/update-disk-cache.ts
