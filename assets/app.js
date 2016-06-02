'use strict';

/* global WordCloud, FilePanelView, WordFreq, WordFreqSync,
          FACEBOOK_APP_ID, FB, FACEBOOK_APP_ID */

var WordCloudApp = function WordCloudApp() {
  // Special code here to handle non-supported browser case.
  if (!((window.WordFreq && window.WordFreq.isSupported) ||
        (window.WordFreqSync && window.WordFreqSync.isSupported)) ||
      !WordCloud.isSupported ||
      !Object.keys ||
      !Array.prototype.map ||
      !Array.prototype.forEach ||
      !Array.prototype.indexOf ||
      !Function.prototype.bind ||
      !('onhashchange' in window)) {
    window.onload = function wca_browserDisabled() {
      var view = document.getElementById('wc-browser-support');
      try {
        delete view.hidden;
      } catch (e) {}
      if (view.removeAttribute) {
        view.removeAttribute('hidden');
      }
    };
    this.isSupported = false;
    this.logAction('WordCloudApp::isSupported::false');

    return;
  }
  this.isSupported = true;
  this.logAction('WordCloudApp::isSupported::true');

  this.isFullySupported = (function checkFullySupport() {
    if (!FilePanelView.prototype.isSupported) {
      return false;
    }

    // Check for real canvas.toBlob() method.
    if (window.HTMLCanvasElement.prototype.toBlob) {
      return true;
    }

    // If not, see if we should shim it.
    var hasBlobConstructor = window.Blob && (function tryBlob() {
      try {
        return Boolean(new Blob());
      } catch (e) {
        return false;
      }
    }());
    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
      window.MozBlobBuilder || window.MSBlobBuilder;

    return !!((hasBlobConstructor || BlobBuilder) && window.atob &&
      window.ArrayBuffer && window.Uint8Array);
  })();

  this.logAction('WordCloudApp::isFullySupported::' + this.isFullySupported);

  window.addEventListener('load', this);

  this.fetchers = {};
  this.views = {};
  this.currentUIState = this.UI_STATE_LOADING;

  // This array decides which view to show() when the UI state changes.
  this.UIStateViewMap = [
    ['loading'],
    ['canvas', 'source-dialog'],
    ['loading', 'dashboard'],
    ['canvas', 'dashboard'],
    ['canvas', 'dashboard', 'list-dialog'],
    ['loading', 'dashboard'],
    ['canvas', 'dashboard', 'sharer-dialog'],
    ['canvas', 'about-dialog']
  ];

  this.wordfreqOption = {
    workerUrl: './assets/wordfreq/src/wordfreq.worker.js?_=@@timestamp'
  };

  this.shapes = [
    { shape: 'circle' },
    {
      shape: function shapeSquare(theta) {
        var thetaPrime = (theta + Math.PI / 4) % (2 * Math.PI / 4);
        return 1 / (Math.cos(thetaPrime) + Math.sin(thetaPrime));
      }
    },
    { shape: 'triangle-forward',
      ellipticity: 1 },
    { shape: 'star',
      ellipticity: 1 }
  ];

  var sansSerifFonts = '"Trebuchet MS", "Heiti TC", "微軟正黑體", ' +
    '"Arial Unicode MS", "Droid Fallback Sans", sans-serif';

  // http://ethantw.net/projects/lab/css-reset/
  var serifFonts = 'Baskerville, "Times New Roman", "華康儷金黑 Std", ' +
    '"華康儷宋 Std",  DFLiKingHeiStd-W8, DFLiSongStd-W5, ' +
    '"Hiragino Mincho Pro", "LiSong Pro Light", "新細明體", serif';

  var randomColorGenerator = function randomColorGenerator(colors) {
    return (function getRandomColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    });
  };

  this.themes = [
    {
      fontFamily: serifFonts,
      // Sublime Text 2 colors
      color: randomColorGenerator(['#66d9ef', '#a6e22d', '#fd9720', '#a6e22a',
                                   '#a581ff', '#f92772']),
      backgroundColor: '#272822'
    },
    {
      fontFamily: sansSerifFonts,
      // http://colorschemedesigner.com/#3o51Ay9OG-dM6
      color: randomColorGenerator(['#07ABDA', '#63D6F6', '#0F7BDC', '#69B4F7',
                                  '#00DBB6', '#376F65', '#004438', '#5FF7DD']),
      backgroundColor: '#AAF7EA'
    },
    {
      fontFamily: serifFonts,
      // http://colorschemedesigner.com/#3P12ps0JkrdYC
      color: randomColorGenerator(['#2F55D1', '#4058A5', '#133193', '#98AFFD']),
      backgroundColor: '#e3e9fd'
    },
    {
      fontFamily: sansSerifFonts,
      // http://colorschemedesigner.com/#0052fMBoqHVtk
      color: randomColorGenerator(['#c30000', '#c37a00', '#650281',
                                   '#de3333', '#de5c5c', '#7e602c',
                                   '#633e00', '#481e53']),
      backgroundColor: '#edd1a4'
    },
    {
      fontFamily: sansSerifFonts,
      color: function getRandomDarkColor() {
        return 'rgb(' +
          Math.floor(Math.random() * 128 + 48).toString(10) + ',' +
          Math.floor(Math.random() * 128 + 48).toString(10) + ',' +
          Math.floor(Math.random() * 128 + 48).toString(10) + ')';
      },
      backgroundColor: '#eee'
    },
    {
      fontFamily: serifFonts,
      color: 'random-light',
      backgroundColor: '#000'
    },
    {
      fontFamily: serifFonts,
      // http://colorschemedesigner.com/#0c31R3Wd1wyfM
      color: randomColorGenerator(['#3a3f42', '#575d51', '#42361d']),
      backgroundColor: '#8d8380'
    },
    {
      fontFamily: serifFonts,
      // http://colorschemedesigner.com/#3M42q7muY.l1e
      color: randomColorGenerator(['#f7e4be', '#f0f4bc', '#9a80a4', '#848da6']),
      backgroundColor: '#223564'
    },
    {
      fontFamily: serifFonts,
      color: '#d0d0d0',
      backgroundColor: '#999'
    },
    {
      fontFamily: sansSerifFonts,
      color: 'rgba(255,255,255,0.8)',
      backgroundColor: '#353130'
    },
    {
      fontFamily: sansSerifFonts,
      color: 'rgba(0,0,0,0.7)',
      backgroundColor: 'rgba(255, 255, 255, 1)' //opaque white
    }
  ];

  this.data = {
    theme: 0,
    shape: 0,
    gridSize: undefined,
    weightFactor: undefined,
    drawOutOfBound: true
  };
};
WordCloudApp.prototype.addView = function wca_addView(view) {
  this.views[view.name] = view;
  view.app = this;
};
WordCloudApp.prototype.addFetcher = function wca_addFetcher(fetcher) {
  fetcher.types.forEach((function(type) {
    this.fetchers[type] = fetcher;
  }).bind(this));
  fetcher.app = this;
};
WordCloudApp.prototype.pushUrlHash = function wca_pushUrlHash(hash) {
  if (hash === window.location.hash) {
    // Simply ask to re-reute the same hash we have here
    // without creating a new history stack.
    this.route();

    return true;
  }

  // This two flags are introduced so that when [Back] button
  // of the dashboard is pressed, reset() can actually go back one step
  // in the browser history instead of always pushing a new url hash.
  // This is not bullet-proof, unfortunately.
  this.backToReset = !window.location.hash.substr(1);
  this.lastUrlHashChangePushedByScript = true;

  // If the hash exceeds URL length limit set by IE,
  // we will catch an error here.
  try {
    window.location.hash = hash;
  } catch (e) {
    return false;
  }
  return true;
};
WordCloudApp.prototype.reset = function wca_reset() {
  if (!window.location.hash.substr(1)) {
    return;
  }

  if (this.backToReset) {
    // Go back
    window.history.back();
  } else {
    // Stack a new entry into history stack
    this.pushUrlHash('');
  }
};
WordCloudApp.prototype.UI_STATE_LOADING = 0;
WordCloudApp.prototype.UI_STATE_SOURCE_DIALOG = 1;
WordCloudApp.prototype.UI_STATE_WORKING = 2;
WordCloudApp.prototype.UI_STATE_DASHBOARD = 3;
WordCloudApp.prototype.UI_STATE_LIST_DIALOG = 4;
WordCloudApp.prototype.UI_STATE_ERROR_WITH_DASHBOARD = 5;
WordCloudApp.prototype.UI_STATE_SHARER_DIALOG = 6;
WordCloudApp.prototype.UI_STATE_ABOUT_DIALOG = 7;
WordCloudApp.prototype.switchUIState = function wca_switchUIState(state) {
  if (!this.UIStateViewMap[state]) {
    throw 'Undefined state ' + state;
  }

  if (document.activeElement &&
      document.activeElement !== document.body) {
    document.activeElement.blur();
  }

  var UIs = Object.keys(this.views);
  var currentUIState = this.currentUIState;
  UIs.forEach((function showOrHide(viewName) {
    this.views[viewName][
      (this.UIStateViewMap[state].indexOf(viewName) !== -1) ?
      'show' : 'hide'](currentUIState, state);
  }).bind(this));

  this.currentUIState = state;
};
WordCloudApp.prototype.handleData = function wca_handleData(text, title) {
  this.logAction('WordCloudApp::handleData', title + ' (' + text.length + ')');

  if (!text.length) {
    this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
    this.views.loading.updateLabel(
      this.views.loading.LABEL_ERROR_DATA);
    return;
  }

  this.currentFetcher = undefined;
  this.views.loading.updateLabel(
    this.views.loading.LABEL_ANALYZING);

  this.data.title = title;

  var volume;
  if (WordFreq) {
    this.wordfreq =
      WordFreq(this.wordfreqOption).process(text)
      .getVolume(function gotVolume(vol) {
        volume = vol;
      }).getList((function gotList(list) {
        this.wordfreq = undefined;
        this.handleList(list, volume);
      }).bind(this));
  } else {
    // Use WordFreqSync.
    // Use setTimeout to leave this function loop first.
    this.wordfreq = setTimeout((function runWordFreqSync() {
      var wordfreqsync = WordFreqSync(this.wordfreqOption);
      var list = wordfreqsync.process(text);
      var volume = wordfreqsync.getVolume();

      this.wordfreq = undefined;
      this.handleList(list, volume);
    }).bind(this));
  }
};
WordCloudApp.prototype.stopHandleData = function wca_stopHandleData() {
  if (!this.wordfreq) {
    return;
  }

  // Stop any current WordFreq async operation,
  // or the timer that would invoke WordFreqSync.
  if (typeof this.wordfreq === 'object') {
    this.wordfreq.stop(false);
  } else {
    clearTimeout(this.wordfreq);
  }
  this.wordfreq = undefined;
};
WordCloudApp.prototype.handleList = function wca_handleList(list, vol) {
  this.logAction('WordCloudApp::handleList', list.length);

  if (!list.length) {
    this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
    this.views.loading.updateLabel(
      this.views.loading.LABEL_ERROR_LIST);
    return;
  }

  this.switchUIState(this.UI_STATE_DASHBOARD);

  this.data.list = list;
  this.data.gridSize = 4;
  this.data.theme = Math.floor(Math.random() * this.themes.length);
  this.calculateWeightFactor(vol);

  this.draw();
};
WordCloudApp.prototype.draw = function wca_draw() {
  var canvasView = this.views.canvas;
  canvasView.setDimension();
  canvasView.draw(this.getWordCloudOption());

  var parsedHash = this.parseHash();
  this.logAction('WordCloudApp::draw::' + parsedHash[0],
                  parsedHash[1].substr(0, 128));
};
WordCloudApp.prototype.getCanvasElement = function wcp_getCanvasElement() {
  return this.views.canvas.canvasElement;
};
WordCloudApp.prototype.calculateWeightFactor =
  function wca_calculateWeightFactor(vol) {
    var width = this.views.canvas.documentWidth;
    var height = this.views.canvas.documentHeight;
    this.data.weightFactor = Math.sqrt(width * height / vol);
  };
WordCloudApp.prototype.getWordCloudOption = function wca_getWordCloudOption() {
  var option = { };

  var dataKeys = Object.keys(this.data);
  dataKeys.forEach((function copyThemeValues(key) {
    option[key] = this.data[key];
  }).bind(this));

  var themeKeys = Object.keys(this.themes[this.data.theme]);
  themeKeys.forEach((function copyThemeValues(key) {
    option[key] = this.themes[this.data.theme][key];
  }).bind(this));

  var shapeKeys = Object.keys(this.shapes[this.data.shape]);
  shapeKeys.forEach((function copyThemeValues(key) {
    option[key] = this.shapes[this.data.shape][key];
  }).bind(this));

  return option;
};
WordCloudApp.prototype.showSharer = function wca_showSharer() {
  this.switchUIState(this.UI_STATE_SHARER_DIALOG);
};
WordCloudApp.prototype.route = function wca_route() {
  var hash = window.location.hash.substr(1);

  if (this.backToReset && !this.lastUrlHashChangePushedByScript) {
    this.backToReset = false;
  }

  this.lastUrlHashChangePushedByScript = false;

  // Stop any current fetcher async operation
  if (this.currentFetcher) {
    this.currentFetcher.stop();
    this.currentFetcher = undefined;
  }

  this.stopHandleData();

  if (!hash) {
    this.switchUIState(this.UI_STATE_SOURCE_DIALOG);
    this.logAction('WordCloudApp::route::source-dialog');

    return;
  }

  var parsedHash = this.parseHash();
  var dataType = parsedHash[0];
  var data = parsedHash[1];
  parsedHash = undefined;

  this.logAction('WordCloudApp::route::' + dataType, data.substr(0, 128));

  var fetcherType = (dataType.indexOf('.') === -1) ?
    dataType : dataType.split('.')[0];

  if (fetcherType in this.fetchers) {
    this.switchUIState(this.UI_STATE_WORKING);
    var fetcher = this.currentFetcher = this.fetchers[fetcherType];
    this.views.loading.updateLabel(fetcher.LABEL_VERB);
    fetcher.getData(dataType, data);
  } else {
    // Can't handle such data. Reset the URL hash.
    this.reset();
  }
};
WordCloudApp.prototype.logAction = function wca_logAction(action, label, val) {
  if (!window._gaq) {
    return;
  }

  var msgs = ['_trackEvent', 'Word Cloud'];
  if (action !== undefined) {
    msgs.push(action.toString());
    if (label !== undefined) {
      msgs.push(label.toString());
      if (val !== undefined) {
        msgs.push(parseFloat(val, 10));
      }
    }
  }
  window._gaq.push(msgs);
};
WordCloudApp.prototype.parseHash = function wca_parseHash() {
  var hash = window.location.hash.substr(1);
  var dataType, data;
  hash.match(/^([^:]+):?(.*)$/).forEach(function matchHash(str, i) {
    switch (i) {
      case 1:
        dataType = str;
        break;

      case 2:
        data = str;
        break;
    }
  });

  return [dataType, data];
};
WordCloudApp.prototype.handleEvent = function wca_handleEvent(evt) {
  switch (evt.type) {
    case 'load':
      // Remove the load listener
      window.removeEventListener('load', this);

      // Start listening to hashchange
      window.addEventListener('hashchange', this);
      // Process the current hash
      this.route();
      break;

    case 'hashchange':
      this.route();
      break;
  }
};
WordCloudApp.prototype.uninit = function wca_uninit() {
  window.removeEventListener('load', this);
  window.removeEventListener('hashchange', this);
};


var FacebookSDKLoader = function FacebookSDKLoader() {
  if (!FACEBOOK_APP_ID) {
    throw 'No FACEBOOK_APP_ID defined.';
  }

  this.loaded = false;
};
FacebookSDKLoader.prototype.load = function fsl_load(callback) {
  if (this.loaded) {
    throw 'FacebookSDKLoader shouldn\'t be reused.';
  }
  this.loaded = true;

  // If API is already available, run the callback synchronizely.
  if (window.FB) {
    callback();
    return;
  }

  // If there is already a fbAsyncInit(), we should wrap it.
  if (window.fbAsyncInit) {
    var originalFbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = (function fbpv_fbAsyncInit() {
      window.fbAsyncInit = null;

      originalFbAsyncInit();
      callback();
    }).bind(this);

    return;
  }

  // Insert fb-root
  var el = document.createElement('div');
  el.id = 'fb-root';
  document.body.insertBefore(el, document.body.firstChild);

  // Load the SDK Asynchronously
  (function loadFacebookSDK(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = '//connect.facebook.net/en_US/all.js';
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
  var channelUrl = window.FACEBOOK_CHANNEL_URL ||
    document.location.href.replace(/\/(index.html)?(#.*)?$/i,
                                   '/facebook-channel.html');

  window.fbAsyncInit = function fbpv_fbAsyncInit() {
    window.fbAsyncInit = null;

    FB.init({
      appId: FACEBOOK_APP_ID,
      channelUrl: channelUrl
    });

    callback();
  };
};
