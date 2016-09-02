'use strict';

/* global View, _, __, FacebookSDKLoader, FB,
          GOOGLE_CLIENT_ID, GO2 */

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

var FeedPanelView = function FeedPanelView(opts) {
  this.load(opts, {
    name: 'feed',
    element: 'wc-panel-feed',
    inputElement: 'wc-panel-feed-url',
    template: '%s'
  });
};
FeedPanelView.prototype = new PanelView();
FeedPanelView.prototype.submit = function fepv_submit() {
  var el = this.inputElement;

  if (!el.value) {
    return;
  }

  this.dialog.submit(
    '#feed:' + this.template.replace(/%s/g, el.value));
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

var FacebookPanelView = function FacebookPanelView(opts) {
  this.load(opts, {
    name: 'facebook',
    element: 'wc-panel-facebook',
    statusElement: 'wc-panel-facebook-status'
  });

  this.stringIds = [
    'facebook-ready',
    'facebook-start-to-login'
  ];

  this.loaded = false;
};
FacebookPanelView.prototype = new PanelView();
FacebookPanelView.prototype.LABEL_LOGGED_IN = 0;
FacebookPanelView.prototype.LABEL_NOT_LOGGED_IN = 1;

FacebookPanelView.prototype.beforeShow = function fbpv_beforeShow() {
  PanelView.prototype.beforeShow.apply(this, arguments);

  if (this.loaded) {
    return;
  }

  this.loaded = true;
  this.hasPermission = false;

  // Load Facebook SDK at this point;
  // We won't wrap other FB.xxx calls in other functions
  // because this is the only entry point for FacebookPanelView.
  (new FacebookSDKLoader()).load((function fbpv_bindFacebookSDK() {
    FB.getLoginStatus(this.updateStatus.bind(this));
    FB.Event.subscribe(
      'auth.authResponseChange', this.updateStatus.bind(this));
  }).bind(this));
};
FacebookPanelView.prototype.isReadyForFetch = function fbpv_isReadyForFetch() {
  return (this.facebookResponse &&
    this.facebookResponse.status === 'connected' &&
    this.hasPermission);
};
FacebookPanelView.prototype.updateStatus = function fbpv_updateStatus(res) {
  this.facebookResponse = res;
  if (this.facebookResponse.status === 'connected') {
    FB.api('/me?fields=permissions,username', (function checkPermissions(res) {
      this.hasPermission = res && res.permissions &&
        res.permissions.data && res.permissions.data[0] &&
        (res.permissions.data[0].read_stream == 1);

      this.facebookUsername = (res && res.username) || '';

      this.updateUI();

      if (!this.submitted) {
        return;
      }

      this.submitted = false;
      this.submit();

    }).bind(this));
  } else {
    this.hasPermission = false;
    this.facebookUsername = '';
    this.updateUI();
  }
};
FacebookPanelView.prototype.updateUI = function fbpv_updateUI() {
  if (this.isReadyForFetch()) {
    this.statusElement.setAttribute(
      'data-l10n-id', this.stringIds[this.LABEL_LOGGED_IN]);
  } else {
    this.statusElement.setAttribute(
      'data-l10n-id', this.stringIds[this.LABEL_NOT_LOGGED_IN]);
  }
  __(this.statusElement);
};
FacebookPanelView.prototype.submit = function fbpv_submit() {
  // Return if the status is never updated.
  if (!this.facebookResponse) {
    return;
  }

  // XXX: There is no way to cancel the login pop-up midway if
  // the user navigates away from the panel (or the source dialog).
  // We shall do some checking here to avoid accidently switches the UI.
  if (this.element.hasAttribute('hidden') ||
      this.dialog.element.hasAttribute('hidden')) {
    return;
  }


  // Show the login dialog if not logged in
  if (!this.isReadyForFetch()) {
    // Mark the status submitted
    this.submitted = true;

    FB.login((function fbpv_loggedIn(res) {
      this.facebookResponse = res;

      if (!res) {
        this.dialog.app.logAction('FacebookPanelView::login::error');
        return;
      }

      if (res.status !== 'connected') {
        this.dialog.app.logAction('FacebookPanelView::login::cancelled');
        return;
      }

      this.dialog.app.logAction('FacebookPanelView::login::success');

      // Stop here, the submitted flag will carry on

    }).bind(this), { scope: 'read_stream' });

    return;
  }

  var id = this.facebookUsername || this.facebookResponse.authResponse.userID;
  this.dialog.submit('#facebook:' + id);
};

var GooglePlusPanelView = function GooglePlusPanelView(opts) {
  this.load(opts, {
    name: 'googleplus',
    element: 'wc-panel-googleplus',
    statusElement: 'wc-panel-googleplus-status',
    idElement: 'wc-panel-googleplus-id'
  });

  this.stringIds = [
    'google-ready',
    'google-start-to-login'
  ];

  this.loaded = false;
};
GooglePlusPanelView.prototype = new PanelView();
GooglePlusPanelView.prototype.LABEL_LOGGED_IN = 0;
GooglePlusPanelView.prototype.LABEL_NOT_LOGGED_IN = 1;
GooglePlusPanelView.prototype.beforeShow = function gppv_beforeShow() {
  PanelView.prototype.beforeShow.apply(this, arguments);

  if (!GOOGLE_CLIENT_ID) {
    throw 'No GOOGLE_CLIENT_ID defined.';
  }

  if (this.loaded) {
    return;
  }

  this.loaded = true;

  var el = document.createElement('script');
  el.src = './assets/go2/src/google-oauth2.js?_=@@timestamp';
  el.onload = el.onerror = (function go2load() {
    el.onload = el.onerror = null;

    if (!window.GO2) {
      this.loaded = false;
      return;
    }

    var redirectUri = window.GO2_REDIRECT_URI ||
      document.location.href.replace(/\/(index.html)?(#.*)?$/i,
                                     '/go2-redirect.html');

    var go2 = this.go2 = new GO2({
      clientId: GOOGLE_CLIENT_ID,
      scope: this.GOOGLE_API_SCOPE || '',
      redirectUri: redirectUri
    });

    go2.login(false, true);

    // Update UI for the first time, as we might not
    // be able to log-in quietly.
    this.updateUI();

    go2.onlogin = (function go2_onlogin(token) {
      this.accessToken = token;
      this.updateUI();

      if (this.submitted) {
        this.submitted = false;

        // XXX: There is no way to cancel the login pop-up midway if
        // the user navigates away from the panel (or the source dialog).
        // We shall do some checking here to avoid accidently switches the UI.
        if (this.element.hasAttribute('hidden') ||
            this.dialog.element.hasAttribute('hidden')) {
          return;
        }

        this.realSubmit();
      }
    }).bind(this);

    go2.onlogout = (function go2_onlogout() {
      this.accessToken = '';
      this.updateUI();
    }).bind(this);
  }).bind(this);

  document.documentElement.firstElementChild.appendChild(el);
};
GooglePlusPanelView.prototype.isReadyForFetch =
  function gppv_isReadyForFetch() {
    return !!this.accessToken;
  };
GooglePlusPanelView.prototype.updateUI = function gppv_updateUI() {
  if (this.isReadyForFetch()) {
    this.statusElement.setAttribute(
      'data-l10n-id', this.stringIds[this.LABEL_LOGGED_IN]);
  } else {
    this.statusElement.setAttribute(
      'data-l10n-id', this.stringIds[this.LABEL_NOT_LOGGED_IN]);
  }
  __(this.statusElement);
};
GooglePlusPanelView.prototype.submit = function gppv_submit() {
  if (!window.GO2 || !this.loaded) {
    return;
  }

  if (!this.isReadyForFetch()) {
    this.submitted = true;
    this.go2.login(true, false);

    return;
  }

  this.realSubmit();
};
GooglePlusPanelView.prototype.realSubmit = function gppv_realSubmit() {
  var id = this.idElement.value;
  if (!id) {
    id = 'me';
  }

  // Remove everything after the first slash.
  id = id.replace(/\/.*$/, '');

  this.dialog.submit('#googleplus:' + id);
};
