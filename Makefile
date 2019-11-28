.PHONY: all
all:
	@npx grunt

.PHONY: deploy
deploy:
	@npx grunt deploy

.PHONY: test
test:
	@npx grunt test

.PHONY: check-imgur-credit
check-imgur-credit:
	@npx grunt check-imgur-credit
