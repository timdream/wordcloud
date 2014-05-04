# HTML5 Word Cloud [![Build Status](https://secure.travis-ci.org/timdream/wordcloud.png)](http://travis-ci.org/timdream/wordcloud)

Create a tag [Wordle](http://www.wordle.net/) presentation on a HTML5 canvas element for a given article, powered by [wordfreq](https://github.com/timdream/wordfreq), remote data fetching through public APIs, and sharing tools.

**Visit [the web app](http://timc.idv.tw/wordcloud/).**

## Author & Copyright

Copyright 2011, 2013 [Timothy Guan-tin Chien](http://timdream.org/) and other contributors.
Released under [the MIT license](./MIT-LICENSE.txt).

## Libraries used

Understand more on how this web application works by following the links below:

* [wordcloud2.js](https://github.com/timdream/wordcloud2.js) - standalone library for the "word cloud" on canvas.
* [wordfreq](https://github.com/timdream/wordfreq) - text corpus calculation in Javascript (with Web Workers)
* [google-oauth2-web-client](https://github.com/timdream/google-oauth2-web-client) - Login with Google using OAuth2 for client-side web app

## Acknowledgement

* Christopher McKenzie for Javascript implementation of [Porter Stemming Algorithm](http://tartarus.org/~martin/PorterStemmer/) (used in wordfreq)
* [Bootstrap UI framework](http://twitter.github.io/bootstrap/) (CSS only)
* [Google Feed API](https://developers.google.com/feed/)
* [MediaWiki API](https://en.wikipedia.org/w/api.php) running on Wikipedia
* [Facebook Javascript SDK](https://developers.facebook.com/docs/reference/javascript/) and [Graph API](https://developers.facebook.com/docs/reference/api/)
* [Google+ API](https://developers.google.com/+/api/) available in JSON-P
* [Imgur API](https://api.imgur.com/) with free anonymous CORS image sharing

## Contributors

Understand how to contribute by reading [./CONTRIBUTE.md](CONTRIBUTE.md).

* [Grassboy Wu](https://github.com/Grassboy) for helping some of the work in the rewrite version
* [Yuren Ju](https://github.com/yurenju) for initial version of Facebook status fetching support

## Build

See [./PRODUCTION.md](PRODUCTION.md) for instructions.
