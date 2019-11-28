.PHONY: all
all:
	@sass --compass assets/first-screen.scss assets/first-screen.css
	@sass --compass assets/wordcloud.scss assets/wordcloud.css
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
