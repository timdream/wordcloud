Thank you for your interests about contributing HTML5 Word Cloud!

## Setup development environment

### Skill/tools

You'll need the following skill/tools

* [`git`](http://git-scm.com/)
* [`jshint`](http://www.jshint.com/) for JavaScript linting
* [Compass](http://compass-style.org/), preferably [Compass.app](http://compass.handlino.com/)
* The ability to run a localhost HTTP server (Compass.app have that built-in, with Livereload)

Additionally, would need to install the following for running tests

* [`node`](http://nodejs.org/) (comes with [`npm`](http://npmjs.org/) built-in)
* [`grunt`](http://gruntjs.com/)
* [QUnit](http://qunitjs.com/)

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

## Running tests

With `node` and `npm`, set up the environment by running

    npm install

To run tests, do

    npm test # run |grunt test| with one keystroke less

Tests require Internet access.

## Coding style

* You must agree to submit your contribution under [MIT License](./MIT-LICENSE.txt).
* Javascript must pass `jshint`; `grunt test` will verify that.
* Unique function names for each functions is strongly recommended for future profiling/stack tracing.
* Early return is encouraged over indent.
* Please do take care of possible race condition when working with async operations.

All pull requests must go through review process before being accepted.

### Browsers to support and test

HTML5 Word Cloud intend to support all modern browsers (inc. IE10), with degraded experience for IE9.
That means these APIs can **not** be taken for granted:

* classList
* dataset property
* CSS 3D transfrom
* ...

Proper feature detection should be put in place for IE9. Quirks in IE10 needs to be tested if possible.

## Contact & Ask for help

The author is very responsive to personal e-mail;
you may also simply open up an issue or pull request on Github.
Thanks!
