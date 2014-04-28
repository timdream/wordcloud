'use strict';

self.callback = function() {
  var argsArray = Array.prototype.slice.call(arguments);
  self.postMessage(argsArray);
};

self.onmessage = function(evt) {
  var url = evt.data;
  url += (url.indexOf('?') === -1) ? '?' : '&';
  url += 'callback=callback';

  self.importScripts(url);
};
