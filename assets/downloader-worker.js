/*! wordcloud-app  2020-06-06 */

"use strict";self.callback=function(){var a=Array.prototype.slice.call(arguments);self.postMessage(a)},self.onmessage=function(a){var l=a.data;l+=-1===l.indexOf("?")?"?":"&",l+="callback=callback",self.importScripts(l)};