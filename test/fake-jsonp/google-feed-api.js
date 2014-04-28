'use strict';

(function() {
  var FakeGoogleFeedAPIPScript = function() {
  };

  FakeGoogleFeedAPIPScript.prototype.FILENAME = 'google-feed-api.js';

  FakeGoogleFeedAPIPScript.prototype.RESPONSE = {
    'feed': {
     'feedUrl': 'http://foo.bar/feed/',
     'title': 'foobar',
      'link': 'http://foo.bar/',
      'author': '',
      'description': '',
      'type': 'rss20',
      'entries': [
        {
          'title': 'title1',
          'link': 'http://foo.bar/1/',
          'author': 'author1',
          'publishedDate': 'Sun, 16 Mar 2014 18:31:19 +0700',
          'contentSnippet': 'snippet1\nsnippet1 line 2',
          'content': '<p>content1</p>\n<p>content1 line 2</p>',
          'categories': ['foo', 'bar']
        },
        {
          'title': 'title2',
          'link': 'http://foo.bar/2/',
          'author': 'author2',
          'publishedDate': 'Sun, 16 Mar 2014 18:31:19 +0700',
          'contentSnippet': 'snippet2\nsnippet2 line 2',
          'content': '<p>content2</p>\n<p>content2 line 2</p>',
          'categories': ['foo2', 'bar2']
        }
      ]
    }
  };

  FakeGoogleFeedAPIPScript.prototype.getJSONScript = function() {
    var scriptEls = document.getElementsByTagName('script');
    for (var i = 0; i < scriptEls.length; i++) {
      if (scriptEls[i].src.indexOf(this.FILENAME) === -1) {
        continue;
      }

      return scriptEls[i];
    }
  };

  FakeGoogleFeedAPIPScript.prototype.getSearchString = function(scriptEl) {
    var urlUtil;
    if (typeof window.URL === 'function') {
      urlUtil = new window.URL(scriptEl.src, window.location);
    } else {
      urlUtil = document.createElement('a');
      urlUtil.href = scriptEl.src;
    }

    return urlUtil.search.substr(1);
  };

  FakeGoogleFeedAPIPScript.prototype.getSearchParams = function(searchString) {
    var searchParams = {};

    searchString.split('&').forEach(function(keyValue) {
      var arr = keyValue.split('=');
      searchParams[decodeURIComponent(arr[0])] = decodeURIComponent(arr[1]);
    });

    return searchParams;
  };

  FakeGoogleFeedAPIPScript.prototype.getCallbackName = function(searchParams) {
    return searchParams.callback;
  };

  FakeGoogleFeedAPIPScript.prototype.respond = function() {
    var callbackName = this.getCallbackName(
      this.getSearchParams(this.getSearchString(this.getJSONScript())));

    window[callbackName]('ctx', this.RESPONSE, 200, null, 200);
  };

  var fakeJSONPScript = new FakeGoogleFeedAPIPScript();
  fakeJSONPScript.respond();
})();
