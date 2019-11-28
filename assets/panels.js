'use strict';

/* global View, _, __ */

var PanelView = function PanelView() {
};
PanelView.prototype = new View();
PanelView.prototype.beforeShow = function pv_beforeShow() {
  this.menuItemElement.parentNode.className += ' active';
  this.dialog.selectionElement.selectedIndex = this.selectionIndex;
};
PanelView.prototype.afterShow = function pv_afterShow() {
  var el = this.element.querySelector('input, button, select, textarea');
  if (el) {
    el.focus();
  }
};
PanelView.prototype.beforeHide = function pv_beforeHide() {
  this.menuItemElement.parentNode.className =
    this.menuItemElement.parentNode.className.replace(/ active/g, '');
};

var ExamplePanelView = function ExamplePanelView(opts) {
  this.load(opts, {
    name: 'example',
    element: 'wc-panel-example',
    supportMsgElement: 'wc-panel-example-support-msg'
  });

  this.checked = false;
};
ExamplePanelView.prototype = new PanelView();
ExamplePanelView.prototype.beforeShow = function epv_beforeShow() {
  PanelView.prototype.beforeShow.apply(this, arguments);

  if (this.checked) {
    return;
  }

  if (!this.dialog.app.isFullySupported) {
    this.supportMsgElement.removeAttribute('hidden');
  }

  var els = this.element.querySelectorAll('[name="example"]');
  els[0].checked = true;

  this.checked = true;
};
ExamplePanelView.prototype.submit = function epv_submit() {
  var els = this.element.querySelectorAll('[name="example"]');
  for (var el in els) {
    if (els[el].checked) {
      this.dialog.submit('#' + els[el].value);
      break;
    }
  }
};

var CPPanelView = function CPPanelView(opts) {
  this.load(opts, {
    name: 'cp',
    element: 'wc-panel-cp',
    textareaElement: 'wc-panel-cp-textarea'
  });
};
CPPanelView.prototype = new PanelView();
CPPanelView.prototype.submit = function cpv_submit() {
  var el = this.textareaElement;

  if (!el.value.length) {
    // maybe a warning here?
    return;
  }

  var submitted;

  if (window.btoa) {
    // Protect the encoded string with base64 to workaround Safari bug,
    // which improve sharability of the URL.
    submitted = this.dialog.submit(
      '#base64:' + window.btoa(unescape(encodeURIComponent(el.value))));
  } else {
    submitted = this.dialog.submit('#text:' + encodeURIComponent(el.value));
  }

  if (!submitted) {
    // The hash is too long and is being rejected in IE.
    // let's use the short hash instead.
    this.dialog.submit('#text');
  }
};

var FilePanelView = function FilePanelView(opts) {
  this.load(opts, {
    name: 'file',
    element: 'wc-panel-file',
    fileElement: 'wc-panel-file-file',
    fileLabelElement: 'wc-panel-file-file-label',
    encodingElement: 'wc-panel-file-encoding'
  });

  if (!this.isSupported) {
    return;
  }

  var count = this.fileElement.files.length;
  this.updateLabel(count);
  this.fileElement.addEventListener('change', this);
};
FilePanelView.prototype = new PanelView();
FilePanelView.prototype.handleEvent = function fpv_handleEvent(evt) {
  var count = this.fileElement.files.length;
  this.updateLabel(count);
};
FilePanelView.prototype.updateLabel = function fpv_updateLabel(count) {
  this.fileLabelElement.setAttribute('data-l10n-args', '{ "n": ' + count + '}');
  __(this.fileLabelElement);
};
FilePanelView.prototype.isSupported = !!window.FileReader;
FilePanelView.prototype.submit = function fpv_submit() {
  var el = this.fileElement;

  if (!el.files.length) {
    // maybe a warning here?
    return;
  }

  var file = el.files[0];
  if (file.type !== 'text/plain') {
    alert(_('plain-text-file-please'));
    return;
  }

  this.dialog.submit('#file');
};

var WikipediaPanelView = function WikipediaPanelView(opts) {
  this.load(opts, {
    name: 'wikipedia',
    element: 'wc-panel-wikipedia',
    inputElement: 'wc-panel-wikipedia-title'
  });
};
WikipediaPanelView.prototype = new PanelView();
WikipediaPanelView.prototype.submit = function wpv_submit() {
  var el = this.inputElement;

  if (!el.value) {
    return;
  }

  // XXX maybe provide a <select> of largest Wikipedias here.
  // (automatically from this table or manually)
  // https://meta.wikimedia.org/wiki/List_of_Wikipedias/Table
  var lang = document.webL10n.getLanguage().substr(0, 2);

  this.dialog.submit('#wikipedia.' + lang + ':' + el.value);
};
