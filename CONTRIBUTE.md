Thank you for your interests about contributing HTML5 Word Cloud!

## Setup development environment

### Skill/tools

You'll need the following skill/tools

* [`git`](http://git-scm.com/)
* [Closure Linter (`gjslint`)](https://developers.google.com/closure/utilities/)
* [Compass](http://compass-style.org/), preferably [Compass.app](http://compass.handlino.com/)
* The ability to run a localhost HTTP server (Compass.app have that built-in, with Livereload)

### Install

1. Clone the code base
2. Run `git submodule init && git submodule update` to pull the required libraries
3. Run your localhost httpd on the root of the cloned directory
4. Go to `http://localhost.timc.idv.tw/`

### API Keys

You may set your own API Keys/IDs in `./assets/var.js` (`./assets/var-sample.js` provide the example).
However, you could save some trouble set them up simply by using the `timc.idv.tw` keys.
**You must use the key correspond to the correct hostname/domain to test these functions.**
To test your local code with keys associated with `timc.idv.tw`, you must connect to your working copy via `http://localhost.timc.idv.tw/`.

## Coding style

* You must agree to submit your contribution under [MIT License](./MIT-LICENSE.txt).
* Javascript must pass `gjslint --nojsdoc`.
* Unique function names for each functions is strongly recommended for future profiling/stack tracing.
* Early return is encouraged over indent.
* Please do take care of possible race condition when working with async operations.

All pull requests must go through review process before being accepted.

## Contact & Ask for help

The author is very responsive to personal e-mail;
you may also simply open up an issue or pull request on Github.
Thanks!
