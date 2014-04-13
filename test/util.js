'use strict';

// mock functions of l10n.js
document.webL10n = {
  translate: function () { },
  getLanguage: function () { },
  setLanguage: function () { },
  get: function () { }
};
window._ = document.webL10n.get;
window.__ = document.webL10n.translate;

// For PhantomJS
// https://github.com/ariya/phantomjs/issues/10522
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError('Function.prototype.bind - ' +
        'what is trying to be bound is not callable');
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                                aArgs.concat(
                                  Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

/* XXX: We cannot create a File object in web content,
   so we will use the next best thing here -- a Blob. */
window.getFakeFile = function getBlob(data) {
  if (typeof Blob === 'function') {
    return new Blob([data], { type: 'text/plain' });
  }

  // Use the old BlobBuilder (specifically for PhantomJS v1.9)
  var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder;

  // This is a poor man's byte string converter
  var byteString = unescape(encodeURIComponent(data));

  // Create an array buffer and copy characters into it.
  var arrayBuffer = new ArrayBuffer(byteString.length);
  var intArray = new Uint8Array(arrayBuffer);
  var i = byteString.length;
  while (i--) {
    intArray[i] = byteString.charCodeAt(i);
  }

  // finally, Blob building time!
  var bb = new BlobBuilder();
  bb.append(arrayBuffer);

  return bb.getBlob('text/plain');
};
