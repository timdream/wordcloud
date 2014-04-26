-include local.mk

WGET?=wget
CONVERT?=convert

.PHONY: all
all: facebook.png twitter.png plurk.png tumblr.png imgur.png

facebook.png:
	(wget http://facebook.com/favicon.ico -O facebook.ico && \
	 rm -f facebook.png && \
	 convert facebook.ico facebook.png && \
	 rm facebook.ico && \
	 optipng -o9 facebook.png)

twitter.png:
	(wget http://twitter.com/favicon.ico -O twitter.ico && \
		rm -f twitter.png && \
	 convert twitter.ico twitter.png && \
	 rm twitter.ico && \
	 optipng -o9 twitter.png)

plurk.png:
	(wget http://plurk.com/favicon.ico -O plurk.ico && \
	 rm -f plurk.png plurk-0.png plurk-1.png && \
	 convert plurk.ico plurk.png && \
	 mv plurk-1.png plurk.png && rm plurk-0.png && \
	 rm plurk.ico && \
	 optipng -o9 plurk.png)

tumblr.png:
	(wget http://tumblr.com/favicon.ico -O tumblr.ico && \
	 rm -f tumblr.png tumblr-0.png tumblr-1.png && \
	 rm -f tumblr.png && \
	 convert tumblr.ico tumblr.png && \
	 mv tumblr-0.png tumblr.png && rm tumblr-1.png && \
	 rm tumblr.ico && \
	 optipng -o9 tumblr.png)

imgur.png:
	(wget http://imgur.com/favicon.ico -O imgur.ico && \
		rm -f imgur.png && \
	 convert imgur.ico imgur.png && \
	 rm imgur.ico && \
	 optipng -o9 imgur.png)

clean:
	rm -f facebook.png facebook.ico plurk.ico plurk.png twitter.ico twitter.png tumblr.png imgur.png
