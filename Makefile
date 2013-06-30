.PHONY: all
all:
	@grunt

.PHONY: deploy
deploy:
	@grunt deploy

.PHONY: test
test:
	@grunt test

.PHONY: check-imgur-credit
check-imgur-credit:
	@grunt check-imgur-credit
