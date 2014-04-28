'use strict';

(function() {
  var FakeJSONPScript = function() {
  };

  FakeJSONPScript.prototype.FILENAME = 'hello.js';

  FakeJSONPScript.prototype.RESPONSE = {
    'hello': 'world'
  };

  FakeJSONPScript.prototype.getJSONScript = function() {
    var scriptEls = document.getElementsByTagName('script');
    for (var i = 0; i < scriptEls.length; i++) {
      if (scriptEls[i].src.indexOf(this.FILENAME) === -1) {
        continue;
      }

      return scriptEls[i];
    }
  };

  FakeJSONPScript.prototype.getSearchString = function(scriptEl) {
    var urlUtil;
    if (typeof window.URL === 'function') {
      urlUtil = new window.URL(scriptEl.src, window.location);
    } else {
      urlUtil = document.createElement('a');
      urlUtil.href = scriptEl.src;
    }

    return urlUtil.search.substr(1);
  };

  FakeJSONPScript.prototype.getSearchParams = function(searchString) {
    var searchParams = {};

    searchString.split('&').forEach(function(keyValue) {
      var arr = keyValue.split('=');
      searchParams[decodeURIComponent(arr[0])] = decodeURIComponent(arr[1]);
    });

    return searchParams;
  };

  FakeJSONPScript.prototype.getCallbackName = function(searchParams) {
    return searchParams.callback;
  };

  FakeJSONPScript.prototype.respond = function() {
    var callbackName = this.getCallbackName(
      this.getSearchParams(this.getSearchString(this.getJSONScript())));

    window[callbackName](this.RESPONSE);
  };

  var fakeJSONPScript = new FakeJSONPScript();
  fakeJSONPScript.respond();
})();
