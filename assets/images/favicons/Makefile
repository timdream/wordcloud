-include local.mk

WGET?=wget
CONVERT?=convert

.PHONY: all
all: facebook.png twitter.png plurk.png

facebook.png:
	(wget http://facebook.com/favicon.ico -O facebook.ico && \
	 rm -f facebook.png && \
	 convert facebook.ico facebook.png && \
	 rm facebook.ico)

twitter.png:
	(wget http://twitter.com/favicon.ico -O twitter.ico && \
		rm -f twitter.png && \
	 convert twitter.ico twitter.png && \
	 rm twitter.ico)

plurk.png:
	(wget http://plurk.com/favicon.ico -O plurk.ico && \
	 rm -f plurk.png plurk-0.png plurk-1.png && \
	 convert plurk.ico plurk.png && \
	 mv plurk-1.png plurk.png && rm plurk-0.png && \
	 rm plurk.ico)

clean:
	rm -f facebook.png facebook.ico plurk.ico plurk.png twitter.ico twitter.png
