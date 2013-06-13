'use strict';

// mock functions of l10n.js
document.webL10n = {
  translate: function () { },
  getLanguage: function () { },
  setLanguage: function () { },
  get: function () { }
};
var _ = document.webL10n.get;
var __ = document.webL10n.translate;
