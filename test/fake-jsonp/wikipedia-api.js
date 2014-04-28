'use strict';

(function() {
  var FakeJSONPScript = function() {
  };

  FakeJSONPScript.prototype.FILENAME = 'wikipedia-api.js';

  FakeJSONPScript.prototype.RESPONSE = {
     'query':{
        'pages':{
           '169409':{
              'pageid':169409,
              'ns':0,
              'title':'Happiness',
              'revisions':[
                 {
                    '*':'<div class="dablink">Several terms redirect here.  ' +
                        'For other uses, see <a href="/wiki/Happiness_' +
                        '(disambiguation)" title="Happiness (disambiguation)' +
                        '">Happiness (disambiguation)</a>, <a href="/wiki/' +
                        'Happy_(disambiguation)" title="Happy' +
                        ' (disambiguation)">Happy (disambiguation)</a>' +
                        ', and <a href="/wiki/Jolly_(disambiguation)"' +
                        ' title="Jolly (disambiguation)">Jolly' +
                        ' (disambiguation)</a>.</div>'
                 }
              ]
           }
        }
     }
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
