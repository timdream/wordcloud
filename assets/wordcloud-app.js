'use strict';

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
    this.logAction('WordCloudApp::isSupported', false);

    return;
  }
  this.isSupported = true;
  this.logAction('WordCloudApp::isSupported', true);

  this.isFullySupported = (function checkFullySupport() {
    if (!FilePanelView.prototype.isSupported)
      return false;

    // Check for real canvas.toBlob() method.
    if (window.HTMLCanvasElement.prototype.toBlob)
      return true;

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

  this.logAction('WordCloudApp::isFullySupported', this.isFullySupported);

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
    workerUrl: './assets/wordfreq/src/wordfreq.worker.js'
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
    weightFactor: undefined
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
  if (!window.location.hash.substr(1))
    return;

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
  if (!this.UIStateViewMap[state])
    throw 'Undefined state ' + state;

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
WordCloudApp.prototype.handleData = function wca_handleData(text) {
  this.logAction('WordCloudApp::handleData', text.length);

  if (!text.length) {
    this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
    this.views.loading.updateLabel(
      this.views.loading.LABEL_ERROR_DATA);
    return;
  }

  this.currentFetcher = undefined;
  this.views.loading.updateLabel(
    this.views.loading.LABEL_ANALYZING);

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
  if (!this.wordfreq)
    return;

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

  var hash = window.location.hash;
  this.logAction('WordCloudApp::draw', hash.substr(0, 128));
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

  this.logAction('WordCloudApp::route', hash.substr(0, 128));

  if (this.backToReset && !this.lastUrlHashChangePushedByScript)
    this.backToReset = false;

  this.lastUrlHashChangePushedByScript = false;

  // Stop any current fetcher async operation
  if (this.currentFetcher) {
    this.currentFetcher.stop();
    this.currentFetcher = undefined;
  }

  this.stopHandleData();

  if (!hash) {
    this.switchUIState(this.UI_STATE_SOURCE_DIALOG);
    return;
  }

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
  if (!window._gaq)
    return;

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

// Super light-weight prototype-based objects and inherences
var View = function View() { };
View.prototype.load = function v_load(properties, defaultProperties) {
  properties = properties || {};
  for (var name in defaultProperties) {
    if (name in this)
      break;

    this[name] = (name in properties) ?
      properties[name] : defaultProperties[name];

    if (name === 'element' || /Element$/.test(name)) {
      this[name] = (typeof this[name] === 'string') ?
        document.getElementById(this[name]) : this[name];
    }
  }
};
View.prototype.show = function v_show(currentState, nextState) {
  if (('beforeShow' in this) &&
      this.beforeShow.apply(this, arguments) === false) {
    return false;
  }

  this.element.removeAttribute('hidden');

  if ('afterShow' in this) {
    this.afterShow.apply(this, arguments);
  }
  return true;
};
View.prototype.hide = function v_hide(currentState, nextState) {
  if (('beforeHide' in this) &&
      this.beforeHide.apply(this, arguments) === false) {
    return false;
  }

  this.element.setAttribute('hidden', true);

  if ('afterHide' in this) {
    this.afterHide.apply(this, arguments);
  }
  return true;
};

var LanguageSwitcherView = function LanguageSwitcher(opts) {
  this.load(opts, {
    element: 'wc-language'
  });

  var defaultLanguage = navigator.language || navigator.userLanguage;
  defaultLanguage = defaultLanguage.replace(/-[a-z]{2}$/i, function(str) {
    return str.toUpperCase();
  });

  // Collect the information about available languages from HTML.
  var langs = this.langs = [];
  Array.prototype.forEach.call(this.element.children, function lang(el) {
    langs.push(el.value);
    if (el.value === defaultLanguage)
      el.selected = true;
  });

  if (langs.indexOf(defaultLanguage) === -1) {
    // Default to the first one.
    this.element.selectedIndex = 0;
  }

  // 'localized' is a CustomEvent dispatched by l10n.js
  document.addEventListener('localized', this);
  this.element.addEventListener('change', this);
};
LanguageSwitcherView.prototype = new View();
LanguageSwitcherView.prototype.handleEvent = function lsv_handleEvent(evt) {
  switch (evt.type) {
    case 'change':
      document.webL10n.setLanguage(this.element.value);
      this.app.logAction('LanguageSwitcherView::change', this.element.value);
      break;

    case 'localized':
      this.app.logAction('LanguageSwitcherView::localized',
                          document.documentElement.lang);
      break;
  }
};

var CanvasView = function CanvasView(opts) {
  this.load(opts, {
    name: 'canvas',
    element: 'wc-canvas'
  });

  window.addEventListener('resize', this);
  this.element.addEventListener('wordcloudstop', this);

  this.documentWidth = window.innerWidth;
  this.documentHeight = window.innerHeight;

  var style = this.element.style;
  ['transform',
   'webkitTransform',
   'msTransform',
   'oTransform'].some((function findTransformProperty(prop) {
    if (!(prop in style))
      return false;

    this.cssTransformProperty = prop;
    return true;
  }).bind(this));

  this.idleOption = {
    fontFamily: 'Times, serif',
    color: 'rgba(255, 255, 255, 0.8)',
    rotateRatio: 0.5,
    backgroundColor: 'transparent',
    wait: 75,
    list: (function generateLoveList() {
      var list = [];
      var nums = [5, 4, 3, 2, 2];
      // This list of the word "Love" in language of the world was taken from
      // the Language links of entry "Cloud" in English Wikipedia,
      // with duplicate spelling removed.
      var words = ('Arai,Awan,Bodjal,Boira,Bulud,Bulut,Caad,Chmura,Clood,' +
        'Cloud,Cwmwl,Dampog,Debesis,Ewr,Felhő,Hodei,Hûn,Koumoul,Leru,Lipata,' +
        'Mixtli,Moln,Mây,Méga,Mākoņi,Neul,Niula,Nivulu,Nor,Nouage,Nuage,Nube,' +
        'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla,Nùvoła,' +
        'Nùvula,Núvol,Nûl,Nûlêye,Oblaci,Oblak,Phuyu,Pil\'v,Pilv,Pilvi,Qinaya,' +
        'Rahona,Rakun,Retë,Scamall,Sky,Ský,Swarken,Ulap,Vo\'e,Wingu,Wolcen,' +
        'Wolk,Wolke,Wollek,Wulke,dilnu,Νέφος,Абр,Болот,Болытлар,Булут,' +
        'Бұлттар,Воблакі,Облак,Облака,Хмара,Үүл,Ամպ,וואלקן,ענן,' +
        'ابر,بادل,بدل,سحاب,ورېځ,ھەور,ܥܢܢܐ,' +
        'ढग,बादल,सुपाँय्,মেঘ,ਬੱਦਲ,વાદળ,முகில்,' +
        'మేఘం,മേഘം,เมฆ,སྤྲིན།,ღრუბელი,ᎤᎶᎩᎸ,ᓄᕗᔭᖅ,云,雲,구름').split(',');

      nums.forEach(function(n) {
        words.forEach(function(w) {
          list.push([w, n]);
        });
      });

      return list;
    })()
  };
};
CanvasView.prototype = new View();
CanvasView.prototype.TILT_DEPTH = 10;
CanvasView.prototype.beforeShow =
CanvasView.prototype.beforeHide = function cv_beforeShowHide(state, nextState) {
  switch (nextState) {
    case this.app.UI_STATE_SOURCE_DIALOG:
      if (state == this.app.UI_STATE_ABOUT_DIALOG)
        break;
      this.drawIdleCloud();
      break;

    case this.app.UI_STATE_LOADING:
    case this.app.UI_STATE_WORKING:
      this.empty();
      break;
  }
};
CanvasView.prototype.handleEvent = function cv_handleEvent(evt) {
  switch (evt.type) {
    case 'resize':
      this.documentWidth = window.innerWidth;
      this.documentHeight = window.innerHeight;

      break;

    case 'wordclouddrawn':
      if (evt.detail.drawn)
        break;

      // Stop the draw.
      evt.preventDefault();

      break;

    case 'wordcloudstop':
      this.element.removeEventListener('wordclouddrawn', this);

      break;

    case 'mousemove':
      var hw = this.documentWidth / 2;
      var hh = this.documentHeight / 2;
      var x = - (hw - evt.pageX) / hw * this.TILT_DEPTH;
      var y = (hh - evt.pageY) / hh * this.TILT_DEPTH;

      this.element.style[this.cssTransformProperty] =
        'scale(1.2) translateZ(0) rotateX(' + y + 'deg) rotateY(' + x + 'deg)';

      break;
  }
};
CanvasView.prototype.setDimension = function cv_setDimension(width, height) {
  var el = this.element;
  width = width ? width : this.documentWidth;
  height = height ? height : this.documentHeight;
  el.setAttribute('width', width);
  el.setAttribute('height', height);
  el.style.marginLeft = (- width / 2) + 'px';
  el.style.marginTop = (- height / 2) + 'px';
};
CanvasView.prototype.draw = function cv_draw(option) {
  // Have generic font selected based on UI language
  this.element.lang = '';

  WordCloud(this.element, option);
};
CanvasView.prototype.drawIdleCloud = function cv_drawIdleCloud() {
  var el = this.element;
  var width = this.documentWidth;
  var height = this.documentHeight;

  // Only enable the rotation effect on non-touch capable browser.
  if (!('ontouchstart' in window))
    document.addEventListener('mousemove', this);

  this.element.style[this.cssTransformProperty] = 'scale(1.2)';

  this.setDimension(width, height);
  this.idleOption.gridSize = Math.round(16 * width / 1024);
  this.idleOption.weightFactor = function weightFactor(size) {
    return Math.pow(size, 2.3) * width / 1024;
  };

  // Make sure Latin characters looks correct for non-English the UI language
  el.lang = 'en';

  // As soon as there is one word cannot be fit,
  // stop the draw entirely.
  el.addEventListener('wordclouddrawn', this);

  WordCloud(el, this.idleOption);
};
CanvasView.prototype.empty = function cv_empty() {
  document.removeEventListener('mousemove', this);
  this.element.style[this.cssTransformProperty] = '';

  WordCloud(this.element, {
    backgroundColor: 'transparent'
  });
};

var LoadingView = function LoadingView(opts) {
  this.load(opts, {
    name: 'loading',
    element: 'wc-loading',
    labelElement: 'wc-loading-label'
  });

  this.stringIds = [
    'downloading',
    'loading',
    'analyzing',
    'no_data',
    'no_list_output'
  ];
};
LoadingView.prototype = new View();
LoadingView.prototype.LABEL_DOWNLOADING = 0;
LoadingView.prototype.LABEL_LOADING = 1;
LoadingView.prototype.LABEL_ANALYZING = 2;
LoadingView.prototype.LABEL_ERROR_DATA = 3;
LoadingView.prototype.LABEL_ERROR_LIST = 4;
LoadingView.prototype.beforeShow = function l_beforeShow(state, nextState) {
  if (nextState === this.app.UI_STATE_ERROR_WITH_DASHBOARD) {
    this.element.className = 'error';
  } else {
    this.element.className = '';
  }
};
LoadingView.prototype.updateLabel = function l_updateLabel(stringId) {
  if (!this.stringIds[stringId])
    throw 'Undefined stringId ' + stringId;

  this.labelElement.setAttribute('data-l10n-id', this.stringIds[stringId]);
  __(this.labelElement);
};

var SourceDialogView = function SourceDialogView(opts) {
  this.load(opts, {
    name: 'source-dialog',
    element: 'wc-source-dialog',
    menuElement: 'wc-source-menu',
    selectionElement: 'wc-source-selection',
    startBtnElement: 'wc-source-start-btn',
    panelContainerElement: 'wc-source-panels',
    aboutBtnElement: 'wc-source-about-btn'
  });

  this.currentPanel = null;
  this.panels = {};

  var selectionElement = this.selectionElement;
  var menuLinks = this.menuElement.getElementsByTagName('a');
  Array.prototype.forEach.call(menuLinks, function item(el) {
    var option = document.createElement('option');
    option.value = el.getAttribute('data-panel');
    option.setAttribute('data-l10n-id', el.getAttribute('data-l10n-id'));
    option.appendChild(document.createTextNode(el.textContent));
    selectionElement.appendChild(option);
  });

  this.menuElement.addEventListener('click', this);
  this.selectionElement.addEventListener('change', this);
  this.startBtnElement.addEventListener('click', this);
  this.panelContainerElement.addEventListener('submit', this);
  this.aboutBtnElement.addEventListener('click', this);
};
SourceDialogView.prototype = new View();
SourceDialogView.prototype.afterShow = function sdv_afterShow() {
  if (this.currentPanel)
    this.currentPanel.show();
};
SourceDialogView.prototype.handleEvent = function sd_handleEvent(evt) {
  evt.preventDefault();
  if (evt.type == 'submit') {
    this.currentPanel.submit();
    return;
  }

  switch (evt.currentTarget) {
    case this.menuElement:
      var panelName = evt.target.getAttribute('data-panel');
      if (!panelName || !this.panels[panelName])
        return;

      this.showPanel(this.panels[panelName]);
      break;

    case this.selectionElement:
      var panelName = evt.target.value;
      if (!panelName || !this.panels[panelName])
        return;

      this.showPanel(this.panels[panelName]);
      break;

    case this.aboutBtnElement:
      this.app.switchUIState(this.app.UI_STATE_ABOUT_DIALOG);
      break;

    case this.startBtnElement:
      this.currentPanel.submit();
      break;
  }
};
SourceDialogView.prototype.submit = function sd_submit(hash) {
  return this.app.pushUrlHash(hash);
};
SourceDialogView.prototype.showPanel = function sd_showPanel(panel) {
  if (this.currentPanel)
    this.currentPanel.hide();

  panel.show();
  this.currentPanel = panel;
  if (this.app)
    this.app.logAction('SourceDialogView::showPanel', panel.name);
};
SourceDialogView.prototype.addPanel = function sd_addPanel(panel) {
  this.panels[panel.name] = panel;
  panel.menuItemElement =
    this.menuElement.querySelector('[data-panel="' + panel.name + '"]');
  panel.selectionIndex = Array.prototype.indexOf.call(
      this.menuElement.children, panel.menuItemElement.parentNode);

  if (!panel.menuItemElement)
    throw 'menuItemElement not found.';

  panel.menuItemElement.parentNode.removeAttribute('hidden');
  panel.dialog = this;

  if ('isSupported' in panel && !panel.isSupported) {
    panel.menuItemElement.parentNode.className += ' disabled';
    panel.menuItemElement.removeAttribute('data-panel');
    return;
  }

  if (!this.currentPanel)
    this.showPanel(panel);
};

var DashboardView = function DashboardView(opts) {
  this.load(opts, {
    name: 'dashboard',
    element: 'wc-dashboard'
  });

  var buttons = this.element.querySelectorAll('[data-action]');
  var i = buttons.length;
  while (i--) {
    buttons[i].addEventListener('click', this);
  }
};
DashboardView.prototype = new View();
DashboardView.prototype.beforeShow =
DashboardView.prototype.beforeHide =
  function dv_beforeShowHide(state, nextState) {
    var ctlBtns = this.element.querySelectorAll('[data-canvas-ctl]');

    if (nextState === this.app.UI_STATE_DASHBOARD) {
      var i = ctlBtns.length;
      while (i--) {
        var el = ctlBtns[i];
        el.className = el.className.replace(/ disabled/g, '');
      }
    } else {
      var i = ctlBtns.length;
      while (i--) {
        var el = ctlBtns[i];
        // We might add extra disabled here, but all of them will be removed,
        // so don't worry.
        el.className += ' disabled';
      }
    }
  };
DashboardView.prototype.handleEvent = function dv_handleEvent(evt) {
  var el = evt.currentTarget;
  if (el.className.indexOf('disabled') !== -1)
    return;

  var app = this.app;
  var action = el.getAttribute('data-action');

  this.app.logAction('DashboardView::action', action);

  switch (action) {
    case 'back':
      app.reset();
      break;

    case 'refresh':
      app.draw();
      break;

    case 'theme':
      app.data.theme++;
      if (app.data.theme >= app.themes.length)
        app.data.theme = 0;

      app.draw();
      break;

    case 'shape':
      app.data.shape++;
      if (app.data.shape >= app.shapes.length)
        app.data.shape = 0;

      app.draw();
      break;

    case 'edit':
      app.switchUIState(app.UI_STATE_LIST_DIALOG);
      break;

    case 'size+':
      app.data.weightFactor += 0.1;

      app.draw();
      break;

    case 'size-':
      if (app.data.weightFactor <= 0.1)
        break;

      app.data.weightFactor -= 0.1;

      app.draw();
      break;

    case 'gap+':
      app.data.gridSize++;

      app.draw();
      break;

    case 'gap-':
      if (app.data.gridSize <= 2)
        break;

      app.data.gridSize--;

      app.draw();
      break;

    case 'save':
      // We could use canvasElement.toBlob(callback) here,
      // but we will miss the default action (download).
      var url = app.views.canvas.element.toDataURL();
      if ('download' in document.createElement('a')) {
        el.href = url;

        // Let's not keep this in the DOM forever.
        setTimeout(function cleanUrl() {
          el.href = '#';
        }, 0);
      } else {
        evt.preventDefault();
        var win = window.open('blank.html', '_blank',
                              'width=500,height=300,resizable=yes,menubar=yes');
        var loadImage = function loadImage() {
          win.removeEventListener('load', loadImage);
          if (win.detachEvent)
            win.detachEvent('onload', loadImage);

          var doc = win.document;

          while (doc.body.firstElementChild) {
            doc.body.removeChild(doc.body.firstElementChild);
          }
          var img = doc.createElement('img');
          img.id = 'popup-image';
          img.src = url;
          doc.getElementsByTagName('title')[0].textContent =
            _('image-popup-title');
          doc.body.appendChild(img);
        };

        // XXX IE9 won't attach the standard addEventListener interface
        // until the document is loaded.
        // It would also refuse to fire the onload event if the document is
        // considered ready.
        if (win.attachEvent) {
          if (win.document.readyState === 'complete') {
            loadImage();
          } else {
            win.attachEvent('onload', loadImage);
          }
        } else {
          // Simple syntax for the rest of us.
          win.addEventListener('load', loadImage);
        }
      }

      break;

    case 'share':
      app.showSharer();

      break;
  }
};

var ListDialogView = function ListDialogView(opts) {
  this.load(opts, {
    name: 'list-dialog',
    element: 'wc-list-dialog',
    textElement: 'wc-list-edit',
    cancelBtnElement: 'wc-list-cancel-btn',
    confirmBtnElement: 'wc-list-confirm-btn'
  });

  this.cancelBtnElement.addEventListener('click', this);
  this.confirmBtnElement.addEventListener('click', this);
};
ListDialogView.prototype = new View();
ListDialogView.prototype.beforeShow = function ldv_beforeShow() {
  this.textElement.value = this.app.data.list.map(function mapItem(item) {
    return item[1] + '\t' + item[0];
  }).join('\n');
};
ListDialogView.prototype.afterShow = function ldv_afterShow() {
  this.textElement.focus();
};
ListDialogView.prototype.handleEvent = function ldv_handleEvent(evt) {
  switch (evt.target) {
    case this.confirmBtnElement:
      this.submit();

      break;

    case this.cancelBtnElement:
      this.close();

      break;
  }
};
ListDialogView.prototype.submit = function ldv_submit() {
  var el = this.textElement;
  var hash;
  if (window.btoa) {
    // Protect the encoded string with base64 to workaround Safari bug,
    // which improve sharability of the URL.
    hash = '#base64-list:' +
      window.btoa(unescape(encodeURIComponent(el.value)));
  } else {
    hash = '#list:' + encodeURIComponent(el.value);
  }

  var hashPushed = this.app.pushUrlHash(hash);
  if (!hashPushed) {
    // The hash is too long and is being rejected in IE.
    // let's use the short hash instead.
    this.app.pushUrlHash('#list');
  }
};
ListDialogView.prototype.close = function ldv_close() {
  this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
};

var SharerDialogView = function SharerDialogView(opts) {
  this.load(opts, {
    name: 'sharer-dialog',
    element: 'wc-sharer-dialog',
    titleElement: 'wc-sharer-title',
    imgElement: 'wc-sharer-img',
    imgLinkElement: 'wc-sharer-img-link',
    progressElement: 'wc-sharer-progress',
    titleInputElement: 'wc-sharer-title-input',
    captionInputElement: 'wc-sharer-caption',

    imgurStatusElement: 'wc-sharer-imgur-status',
    facebookStatusElement: 'wc-sharer-facebook-status',
    tumblrStatusElement: 'wc-sharer-tumblr-status',
    twitterStatusElement: 'wc-sharer-twitter-status',
    plurkStatusElement: 'wc-sharer-plurk-status',

    reUploadBtnElement: 'wc-sharer-reupload-btn',
    doneBtnElement: 'wc-sharer-done-btn'
  });

  this.imgLinkElement.addEventListener('click', this);

  this.imgurStatusElement.addEventListener('click', this);
  this.facebookStatusElement.addEventListener('click', this);
  this.tumblrStatusElement.addEventListener('click', this);
  this.twitterStatusElement.addEventListener('click', this);
  this.plurkStatusElement.addEventListener('click', this);

  this.doneBtnElement.addEventListener('click', this);
  this.reUploadBtnElement.addEventListener('click', this);

  this.imgElement.addEventListener('load', function sdv_imgLoaded(evt) {
    window.URL.revokeObjectURL(this.src);
  });

  if (!window.HTMLCanvasElement.prototype.toBlob) {
    // Load canvas-to-blob library to see if we could shim it.
    var el = document.createElement('script');
    el.src = './assets/canvas-to-blob/canvas-to-blob.min.js';
    document.documentElement.firstElementChild.appendChild(el);
  }

  this.stringIds = [
    'image-upload-not-supported',
    'share-text-only',
    'image-uploading',
    'waiting',
    'image-uploaded',
    'click-to-share',
    'image-upload-failed',
    'facebook-loading'
  ];
};
SharerDialogView.prototype = new View();
SharerDialogView.prototype.HASHTAG = '#HTML5WordCloud';
SharerDialogView.prototype.TWITTER_SHARE_URL =
  'https://twitter.com/home/?status=';
SharerDialogView.prototype.PLURK_SHARE_URL =
  'http://plurk.com/?status=';
SharerDialogView.prototype.FACEBOOK_PHOTO_URL =
  'https://www.facebook.com/photo.php?fbid=';
SharerDialogView.prototype.IMGUR_URL =
  'http://imgur.com/';
SharerDialogView.prototype.IMGUR_API_URL =
  'https://api.imgur.com/3/upload.json';
SharerDialogView.prototype.SHARED_ITEM_LIMIT = 10;
SharerDialogView.prototype.LABEL_IMAGE_UPLOAD_NOT_SUPPORTED = 0;
SharerDialogView.prototype.LABEL_SHARE_TEXT_ONLY = 1;
SharerDialogView.prototype.LABEL_IMAGE_UPLOADING = 2;
SharerDialogView.prototype.LABEL_WAITING = 3;
SharerDialogView.prototype.LABEL_IMAGE_UPLOADED = 4;
SharerDialogView.prototype.LABEL_CLICK_TO_SHARE = 5;
SharerDialogView.prototype.LABEL_IMAGE_UPLOAD_FAILED = 6;
SharerDialogView.prototype.LABEL_FACEBOOK_LOADING = 7;
SharerDialogView.prototype.beforeShow = function sdv_beforeShow() {
  (new FacebookSDKLoader()).load((function sdv_bindFacebookSDK() {
    if (this.facebookLoaded)
      return;

    this.facebookLoaded = true;

    FB.getLoginStatus(this.updateFacebookStatus.bind(this));
    FB.Event.subscribe(
      'auth.authResponseChange', this.updateFacebookStatus.bind(this));
  }).bind(this));

  this.uploadSupported = !!(window.HTMLCanvasElement.prototype.toBlob &&
    window.XMLHttpRequest && window.FormData);

  // XXX: To be replaced with text from fetcher
  this.titleInputElement.value = _('app-title');

  this.captionInputElement.value = (function getCloudList(list) {
    var list = this.app.data.list;
    var i = 0;
    var sharedItems = [];
    do {
      sharedItems[i] = list[i][0];
    } while (++i < this.SHARED_ITEM_LIMIT);

    return sharedItems.join(_('sep').replace(/"/g, '')) +
      ((list.length > this.SHARED_ITEM_LIMIT) ? _('frequent-terms-more') : '');
  }).call(this) + '\n\n' + this.HASHTAG;

  if (this.uploadSupported && !this.imgurData) {
    this.uploadImage();
  } else {
    this.updateUI();
  }
};
SharerDialogView.prototype.updateStatusElement =
  function sdv_updateStatusElement(el, stringId, href) {
    if (!href) {
      el.className = 'disabled';
      el.href = '';
    } else {
      el.className = '';
      el.href = href;
    }

    el.setAttribute('data-l10n-id', this.stringIds[stringId]);
    __(el);
  };
SharerDialogView.prototype.updateUI = function sdv_updateUI() {
  if (this.xhr) { // Uploading
    this.reUploadBtnElement.disabled = true;
    this.updateStatusElement(
      this.imgurStatusElement, this.LABEL_IMAGE_UPLOADING);
    this.updateStatusElement(
      this.facebookStatusElement, this.LABEL_WAITING);
    this.updateStatusElement(
      this.tumblrStatusElement, this.LABEL_WAITING);
    this.updateStatusElement(
      this.twitterStatusElement, this.LABEL_WAITING);
    this.updateStatusElement(
      this.plurkStatusElement, this.LABEL_WAITING);

  } else if (this.imgurData) { // Uploaded
    var imageUrl = this.imgurData.link;
    var imgurPageUrl = this.IMGUR_URL + this.imgurData.id;


    this.reUploadBtnElement.disabled = false;

    this.updateStatusElement(
      this.imgurStatusElement, this.LABEL_IMAGE_UPLOADED, imgurPageUrl);
    if (this.facebookPhotoUrl) {
      this.updateStatusElement(
        this.facebookStatusElement,
        this.LABEL_IMAGE_UPLOADED, this.facebookPhotoUrl);
    } else if (this.facebookLoading) {
      this.updateStatusElement(
        this.facebookStatusElement, this.LABEL_FACEBOOK_LOADING);
    } else {
      this.updateStatusElement(
        this.facebookStatusElement, this.LABEL_CLICK_TO_SHARE, '#');
    }
    this.updateStatusElement(
      this.tumblrStatusElement, this.LABEL_CLICK_TO_SHARE, '#');
    this.updateStatusElement(
      this.twitterStatusElement, this.LABEL_CLICK_TO_SHARE, '#');
    this.updateStatusElement(
      this.plurkStatusElement, this.LABEL_CLICK_TO_SHARE, '#');

  } else { // text upload only
    this.reUploadBtnElement.disabled = true;
    if (this.uploadSupported) {
      this.updateStatusElement(
        this.imgurStatusElement, this.LABEL_IMAGE_UPLOAD_FAILED);
    } else {
      this.updateStatusElement(
        this.imgurStatusElement, this.LABEL_IMAGE_UPLOAD_NOT_SUPPORTED);
    }

    this.updateStatusElement(
      this.facebookStatusElement, this.LABEL_SHARE_TEXT_ONLY, '#');
    this.updateStatusElement(
      this.tumblrStatusElement, this.LABEL_SHARE_TEXT_ONLY, '#');
    this.updateStatusElement(
      this.twitterStatusElement, this.LABEL_SHARE_TEXT_ONLY, '#');
    this.updateStatusElement(
      this.plurkStatusElement, this.LABEL_SHARE_TEXT_ONLY, '#');
  }
};
SharerDialogView.prototype.afterHide = function sdv_afterHide() {
  if (this.xhr) {
    this.xhr.abort();
    this.xhr = null;
  }
};
SharerDialogView.prototype.handleEvent = function sdv_handleEvent(evt) {
  if (evt.target.disabled || evt.target.className === 'disabled') {
    evt.preventDefault();
    return;
  }

  switch (evt.currentTarget) {
    case this.imgLinkElement:
      if (this.imgurData)
        break;

      evt.preventDefault();

      break;

    case this.facebookStatusElement:
      if (this.facebookPhotoUrl)
        break;

      this.share('facebook');
      evt.preventDefault();

      break;

    case this.tumblrStatusElement:
      this.share('tumblr');
      evt.preventDefault();

      break;

    case this.twitterStatusElement:
      this.share('twitter');
      evt.preventDefault();

      break;

    case this.plurkStatusElement:
      this.share('plurk');
      evt.preventDefault();

      break;

    case this.reUploadBtnElement:
      this.uploadImage();

      break;

    case this.doneBtnElement:
      this.close();
      break;
  }
};
SharerDialogView.prototype.close = function sdv_close() {
  this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
};
SharerDialogView.prototype.getCanvasBlob = function sdv_getCanvasBlob(cb) {
  this.app.views['canvas'].element.toBlob(cb.bind(this));
};
SharerDialogView.prototype.updateProgress =
  function sdv_updateProgress(progress, active) {
    this.progressElement.style.width = Math.floor(progress * 100) + '%';
    this.progressElement.parentNode.className =
      'progress progress-striped' + (active ? ' active' : '');
  };
SharerDialogView.prototype.share = function sdv_share(type) {
  if (this.imgurData) {
    this.shareImage(type);
  } else {
    this.shareText(type);
  }
};
SharerDialogView.prototype.shareText = function sdv_shareText(type) {
  this.app.logAction('SharerDialogView::shareText', type);

  var url = window.location.href;
  switch (type) {
    case 'facebook':
      // Load Facebook SDK at this point;
      // We won't wrap other FB.xxx calls in other functions
      // because this is the only entry point for FacebookPanelView.
      (new FacebookSDKLoader()).load((function sdv_bindFacebookSDK() {
        // XXX This will be blocked by pop-up blocker.
        FB.ui({
          method: 'feed',
          link: url,
          name: this.titleInputElement.value,
          description: this.captionInputElement.value,
          display: 'iframe'
        });
      }).bind(this));
      break;

    case 'plurk':
      window.open(this.PLURK_SHARE_URL +
        encodeURIComponent(
          url + ' (' +
          this.titleInputElement.value + ') ' +
          this.captionInputElement.value + ' ' +
          this.HASHTAG));
      break;

    case 'twitter':
      window.open(this.TWITTER_SHARE_URL +
        encodeURIComponent(
          url + ' ' +
          this.titleInputElement.value + ' ' +
          this.captionInputElement.value + ' ' +
          this.HASHTAG));
      break;

    case 'tumblr':
      window.open('http://www.tumblr.com/share/link?=description=' +
         encodeURIComponent(this.captionInputElement.value) +
         '&name=' + encodeURIComponent(this.titleInputElement.value) +
         '&url=' + encodeURIComponent(url));
      this.close();

    default:
      throw 'Unknown shareDialogView type ' + type;
  }
};
SharerDialogView.prototype.updateFacebookStatus =
  function sdv_updateFacebookStatus(res) {
    if (res.status === 'connected') {
      FB.api('/me/permissions', (function checkPermissions(res) {
        this.hasFacebookPermission = (res.data[0]['publish_stream'] == 1);
        this.updateUI();
      }).bind(this));
    } else {
      this.hasFacebookPermission = false;
    }
    this.updateUI();
  };
SharerDialogView.prototype.uploadImage = function sdv_uploadImage() {
  if (!window.IMGUR_CLIENT_ID)
    throw 'IMGUR_CLIENT_ID is not set.';

  this.imgurData = undefined;
  this.facebookPhotoUrl = undefined;
  this.imgLinkElement.href = '#';
  this.updateProgress(0.05, true);

  var formdata = new FormData();
  formdata.append('title', this.titleInputElement.value);
  formdata.append('name', 'wordcloud.png');
  formdata.append('description',
    this.captionInputElement.value + '\n\n' + window.location.href);

  var xhr = this.xhr = new XMLHttpRequest();
  xhr.open('POST', this.IMGUR_API_URL);
  xhr.setRequestHeader('Authorization', 'Client-ID ' + IMGUR_CLIENT_ID);

  if (xhr.upload) {
    xhr.upload.onprogress = (function sdv_xhrProgress(evt) {
      this.updateProgress(evt.loaded / evt.total, true);
    }).bind(this);
  } else {
    this.updateProgress(1, true);
  }

  xhr.onreadystatechange = (function sdv_xhrFinish(evt) {
    if (xhr.readyState !== XMLHttpRequest.DONE || this.xhr !== xhr)
      return;

    this.checkImgurCredits();

    this.xhr = null;
    var response;
    try {
      response = JSON.parse(xhr.responseText);
    } catch (e) {}

    var success = response ? response.success : false;
    if (!success) {
      // Upload failed

      if (response && response.status === 429) {
        // Additional message on rate limiting
        alert(_('imgur-limit-msg'));
      }

      this.updateProgress(0.05, false);
      this.updateUI();
      return;
    }

    // Upload succeed
    this.imgurData = response.data;
    this.imgLinkElement.href = this.IMGUR_URL + this.imgurData.id;

    this.updateProgress(1, false);
    this.updateUI();
  }).bind(this);

  this.updateUI();
  this.getCanvasBlob(function sdv_gotBlob(blob) {
    if (this.xhr !== xhr)
      return;

    this.imgElement.src = window.URL.createObjectURL(blob);
    this.imgLinkElement.removeAttribute('hidden');

    formdata.append('image', blob);
    xhr.send(formdata);
  });
};
SharerDialogView.prototype.shareImage = function sdv_shareImage(type) {
  this.app.logAction('SharerDialogView::shareImage2', type);

  var url = window.location.href;
  if (url.length > 128)
    url = url.replace(/#.*$/, '');

  switch (type) {
    case 'facebook':
      if (!this.hasFacebookPermission) {
        FB.login((function sdv_loggedIn(res) {
          // XXX: There is no way to cancel the login pop-up midway if
          // the user navigates away from the panel (or the source dialog).
          // We shall do some checking here to avoid accidently switches the UI.
          if (this.element.hasAttribute('hidden'))
            return;

          if (res.status !== 'connected')
            return;

          // Note that we assume we have the permission already
          // if the user logged in through here.
          // We have to overwrite this here so FacebookFetcher
          // could confirm the permission.
          this.hasFacebookPermission = true;

          // Call ourselves again
          this.shareImage(type);

        }).bind(this), { scope: 'publish_stream' });

        return;
      }

      // XXX This is sad. We couldn't make a CORS XHR request
      // to Facebook Graph API to send our image directly,
      // so we ask Facebook to pull the image uploaded to Imgur.
      this.facebookLoading = true;
      this.updateUI();
      FB.api('/me/photos', 'post', {
        url: this.imgurData.link,
        message: this.titleInputElement.value + '\n\n' +
          this.captionInputElement.value + '\n\n' + url
      }, (function sdv_facebookImageUploaded(res) {
        this.facebookLoading = false;

        if (!res || !res.id)
          return;

        this.facebookPhotoUrl = this.FACEBOOK_PHOTO_URL + res.id;
        this.updateUI();
      }).bind(this));

      break;

    case 'plurk':
      window.open(this.PLURK_SHARE_URL +
        encodeURIComponent(
          this.imgurData.link + ' ' +
          url + ' (' + this.titleInputElement.value + ') ' +
          this.captionInputElement.value + ' ' +
          this.HASHTAG));

      break;

    case 'twitter':
      window.open(this.TWITTER_SHARE_URL +
        encodeURIComponent(
          url + ' ' +
          this.titleInputElement.value + ' ' +
          this.captionInputElement.value + ' ' +
          this.imgurData.link + ' ' +
          this.HASHTAG));

      break;

    case 'tumblr':
      window.open('http://www.tumblr.com/share/photo?source=' +
         encodeURIComponent(this.imgurData.link) +
         '&caption=' + encodeURIComponent(
            this.titleInputElement.value + '\n' +
            this.captionInputElement.value) +
         '&clickthru=' + encodeURIComponent(url));

      break;

    default:
      throw 'Unknown shareDialogView type ' + type;
  }
};
SharerDialogView.prototype.checkImgurCredits =
  function sdv_checkImgurCredits() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.imgur.com/3/credits');
    xhr.setRequestHeader('Authorization', 'Client-ID ' + IMGUR_CLIENT_ID);
    xhr.onreadystatechange = (function sdv_xhrFinish(evt) {
      if (xhr.readyState !== XMLHttpRequest.DONE)
        return;

      var response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch (e) {}

      if (!response || !response.success)
        return;

      this.imgurCreditsData = response.data;

      this.app.logAction(
        'SharerDialogView::checkImgurCredits::ClientRemaining',
        response.data.ClientRemaining);

    }).bind(this);

    xhr.send();
  };


var PanelView = function PanelView() {
};
PanelView.prototype = new View();
PanelView.prototype.beforeShow = function pv_beforeShow() {
  this.menuItemElement.parentNode.className = 'active';
  this.dialog.selectionElement.selectedIndex = this.selectionIndex;
};
PanelView.prototype.afterShow = function pv_afterShow() {
  var el = this.element.querySelector('input, button, select, textarea');
  if (el)
    el.focus();
};
PanelView.prototype.beforeHide = function pv_beforeHide() {
  this.menuItemElement.parentNode.className = '';
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

  if (this.checked)
    return;

  if (!this.dialog.app.isFullySupported)
    this.supportMsgElement.removeAttribute('hidden');

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

  if (!this.isSupported)
    return;

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

  if (!el.value)
    return;

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

  if (!el.value)
    return;

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

  if (this.loaded)
    return;

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
    FB.api('/me/permissions', (function checkPermissions(res) {
      this.hasPermission = (res.data[0]['read_stream'] == 1);
      this.updateUI();
    }).bind(this));
  } else {
    this.hasPermission = false;
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
  if (!this.facebookResponse)
    return;

  // Show the login dialog if not logged in
  if (!this.isReadyForFetch()) {
    FB.login((function fbpv_loggedIn(res) {
      // XXX: There is no way to cancel the login pop-up midway if
      // the user navigates away from the panel (or the source dialog).
      // We shall do some checking here to avoid accidently switches the UI.
      if (this.element.hasAttribute('hidden') ||
          this.dialog.element.hasAttribute('hidden'))
        return;

      this.facebookResponse = res;

      if (res.status !== 'connected') {
        this.dialog.app.
          logAction('FacebookPanelView::login', 'cancelled');
        return;
      }

      this.dialog.app.
        logAction('FacebookPanelView::login', 'success');

      // Note that we assume we have the permission already
      // if the user logged in through here.
      // We have to overwrite this here so FacebookFetcher
      // could confirm the permission.
      this.hasPermission = true;

      this.dialog.submit(
        '#facebook:' + this.facebookResponse.authResponse.userID);
    }).bind(this), { scope: 'read_stream' });

    return;
  }

  this.dialog.submit(
    '#facebook:' + this.facebookResponse.authResponse.userID);
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

  if (!GOOGLE_CLIENT_ID)
    throw 'No GOOGLE_CLIENT_ID defined.';

  if (this.loaded)
    return;

  this.loaded = true;

  var el = document.createElement('script');
  el.src = './assets/go2/src/google-oauth2.js';
  el.onload = el.onerror = (function go2load() {
    el.onload = el.onerror = null;

    if (!window.GO2) {
      this.loaded = false;
      return;
    }

    var redirectUri = window.GO2_REDIRECT_URI ||
      document.location.href.replace(/\/(index.html)?(#.*)?$/i,
                                     '/go2-redirect.html');

    GO2.init({
      client_id: GOOGLE_CLIENT_ID,
      scope: this.GOOGLE_API_SCOPE || '',
      redirect_uri: redirectUri
    });

    GO2.login(false, true);

    // Update UI for the first time, as we might not
    // be able to log-in quietly.
    this.updateUI();

    GO2.onlogin = (function go2_onlogin(token) {
      this.accessToken = token;
      this.updateUI();

      if (this.submitted) {
        this.submitted = false;

        // XXX: There is no way to cancel the login pop-up midway if
        // the user navigates away from the panel (or the source dialog).
        // We shall do some checking here to avoid accidently switches the UI.
        if (this.element.hasAttribute('hidden') ||
            this.dialog.element.hasAttribute('hidden'))
          return;

        this.realSubmit();
      }
    }).bind(this);

    GO2.onlogout = (function go2_onlogout() {
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
  if (!window.GO2 || !this.loaded)
    return;

  if (!this.isReadyForFetch()) {
    this.submitted = true;
    GO2.login(true, false);

    return;
  }

  this.realSubmit();
};
GooglePlusPanelView.prototype.realSubmit = function gppv_realSubmit() {
  var id = this.idElement.value;
  if (!id)
    id = 'me';

  // Remove everything after the first slash.
  id = id.replace(/\/.*$/, '');

  this.dialog.submit('#googleplus:' + id);
};

var AboutDialogView = function AboutDialogView(opts) {
  this.load(opts, {
    name: 'about-dialog',
    element: 'wc-about-dialog',
    contentElement: 'wc-about-content',
    closeBtnElement: 'wc-about-close-btn'
  });

  this.loaded = false;

  this.closeBtnElement.addEventListener('click', this);
  this.contentElement.addEventListener('click', this);
  document.addEventListener('localized', this);
};
AboutDialogView.prototype = new View();
AboutDialogView.prototype.beforeShow = function adv_beforeShow() {
  this.app.logAction('AboutDialogView::view');

  this.loaded = true;
  var lang = document.webL10n.getLanguage();
  this.loadContent(lang, true);
};
AboutDialogView.prototype.loadContent = function adv_loadContent(lang, first) {
  // Everything would be a *lot* easier
  // if we could have seamless iframe here...
  var iframe = document.createElement('iframe');
  iframe.src = 'about.' + lang + '.html';
  this.contentElement.appendChild(iframe);

  iframe.onload = (function contentLoaded() {
    // Import nodes to this document
    var content = document.importNode(
      iframe.contentWindow.document.body, true);

    // Create a document fragment; move all the children to it.
    var docFrag = document.createDocumentFragment();
    while (content.firstElementChild) {
      docFrag.appendChild(content.firstElementChild);
    }

    // Append the children to the container.
    var container = this.contentElement;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(docFrag);
  }).bind(this);
  if (first) {
    iframe.onerror = (function contentLoadError() {
      this.loaded = false;
      if (!this.element.hasAttribute('hidden')) {
        this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
      }
    }).bind(this);
  }
};
AboutDialogView.prototype.handleEvent = function adv_handleEvent(evt) {
  if (evt.type === 'localized') {
    this.loaded = false;

    return;
  }

  switch (evt.currentTarget) {
    case this.contentElement:
      if (evt.target.tagName !== 'A')
        break;

      evt.preventDefault();
      window.open(evt.target.href);
      this.app.logAction('AboutDialogView::externalLink', evt.target.href);

      break;

    case this.closeBtnElement:
      this.close();

      break;
  }
};
AboutDialogView.prototype.close = function adv_close() {
  this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
};

var SNSPushView = function SNSPushView(opts) {
  this.load(opts, {
    name: 'sns-push',
    element: 'wc-sns-push',
    facebookElement: 'wc-sns-facebook',
    googlePlusElement: 'wc-sns-google-plus'
  });

  if (document.webL10n.getReadyState() === 'complete') {
    this.loadButtons();
  }
  window.addEventListener('localized', this);
};
SNSPushView.prototype = new View();
SNSPushView.prototype.FACEBOOK_BUTTON_URL =
  'https://www.facebook.com/plugins/like.php?href=%url&' +
  'layout=box_count&show_faces=false&width=55&' +
  'action=like&font=trebuchet+ms&colorscheme=light&height=65&locale=%lang';
SNSPushView.prototype.GOOGLEPLUS_BUTTON_URL =
  'https://plusone.google.com/u/0/_/+1/fastbutton?url=%url&' +
  'size=tall&count=true&annotation=bubble&lang=%lang';
SNSPushView.prototype.loadButtons = function spv_loadButtons() {
  var url = window.location.href;
  if (url.indexOf('#') !== -1) {
    url = url.replace(/#.*$/, '').replace(/\?.*$/, '');
  }
  var lang = document.documentElement.lang;

  this.updateFrame(this.facebookElement,
    this.FACEBOOK_BUTTON_URL
    .replace(/%url/, encodeURIComponent(url))
    .replace(/%lang/, lang.replace(/-/, '_')));

  this.updateFrame(this.googlePlusElement,
    this.GOOGLEPLUS_BUTTON_URL
    .replace(/%url/, encodeURIComponent(url))
    .replace(/%lang/, lang));
};
SNSPushView.prototype.updateFrame = function spv_updateFrame(container, url) {
  while (container.firstElementChild) {
    container.removeChild(container.firstElementChild);
  }

  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allowTransparency', 'true');
  container.appendChild(iframe);
};
SNSPushView.prototype.handleEvent = function spv_handleEvent(evt) {
  switch (evt.type) {
    case 'localized':
      this.loadButtons();

      break;
  }

};

var Fetcher = function Fetcher() { };
Fetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_LOADING;

var TextFetcher = function TextFetcher() {
  this.types = ['text', 'base64'];
};
TextFetcher.prototype = new Fetcher();
TextFetcher.prototype.stop = function tf_stop() {
  clearTimeout(this.timer);
};
TextFetcher.prototype.getData = function tf_getData(dataType, data) {
  if (dataType === 'text' && !data) {
    data = this.app.views['source-dialog'].panels['cp'].textareaElement.value;
  } else if (dataType === 'base64') {
    data = decodeURIComponent(escape(window.atob(data)));
  } else {
    data = decodeURIComponent(data);
  }

  // Make sure we call the handler methods as async callback.
  this.timer = setTimeout((function tf_gotData() {
    this.app.handleData(data);
  }).bind(this), 0);
};

var FileFetcher = function FileFetcher() {
  this.types = ['file'];
};
FileFetcher.prototype = new Fetcher();
FileFetcher.prototype.stop = function ff_stop() {
  if (!this.reader || this.reader.readyState !== this.reader.LOADING)
    return;

  this.reader.abort();
  this.reader = null;
};
FileFetcher.prototype.getData = function ff_getData(dataType, data) {
  var filePanelView = this.app.views['source-dialog'].panels['file'];
  var fileElement = filePanelView.fileElement;
  if (!fileElement.files.length) {
    this.app.reset();
    this.app.views['source-dialog'].showPanel(filePanelView);
    return;
  }

  var file = fileElement.files[0];
  var reader = this.reader = new FileReader();
  reader.onloadend = (function fr_loadend(evt) {
    if (reader !== this.reader)
      return; // aborted

    var text = reader.result;
    this.app.handleData(text);
  }).bind(this);
  reader.readAsText(file, filePanelView.encodingElement.value || 'UTF-8');
};

var ListFetcher = function ListFetcher() {
  this.types = ['list', 'base64-list'];
};
ListFetcher.prototype = new Fetcher();
ListFetcher.prototype.stop = function lf_stop() {
  clearTimeout(this.timer);
};
ListFetcher.prototype.getData = function lf_getData(dataType, data) {
  var text;
  if (dataType === 'list' && !data) {
    text = this.app.views['list-dialog'].textElement.value;
  } else if (dataType === 'base64-list') {
    text = decodeURIComponent(escape(window.atob(data)));
  } else {
    text = decodeURIComponent(data);
  }

  var vol = 0;
  var list = [];
  text.split('\n').forEach(function eachItem(line) {
    var item = line.split('\t').reverse();
    if (!line || !item[0] || !item[1])
      return;

    item[1] = parseInt(item[1], 10);
    if (isNaN(item[1]))
      return;

    vol += item[0].length * item[1] * item[1];
    list.push(item);
  });

  // Make sure we call the handler methods as async callback.
  this.timer = setTimeout((function bf_gotData() {
    this.app.handleList(list, vol);
  }).bind(this), 0);
};

var JSONPFetcher = function JSONPFetcher() {};
JSONPFetcher.prototype = new Fetcher();
JSONPFetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_DOWNLOADING;
JSONPFetcher.prototype.CALLBACK_PREFIX = 'JSONPCallbackX';
JSONPFetcher.prototype.TIMEOUT = 30 * 1000;
JSONPFetcher.prototype.reset =
JSONPFetcher.prototype.stop = function jpf_stop() {
  this.currentRequest = undefined;
  clearTimeout(this.timer);
};
JSONPFetcher.prototype.handleEvent = function jpf_handleEvent(evt) {
  var el = evt.target;
  window[el.getAttribute('data-callback-name')] = undefined;
  this.currentRequest = undefined;
  clearTimeout(this.timer);

  el.parentNode.removeChild(el);
};
JSONPFetcher.prototype.getNewCallback = function jpf_getNewCallback() {
  // Create a unique callback name for this request.
  var callbackName = this.CALLBACK_PREFIX +
    Math.random().toString(36).substr(2, 8).toUpperCase();

  // Install the callback
  window[callbackName] = (function jpf_callback() {
    // Ignore any response that is not coming from the currentRequest.
    if (this.currentRequest !== callbackName)
      return;
    this.currentRequest = undefined;
    clearTimeout(this.timer);

    // send the callback name and the data back
    this.handleResponse.apply(this, arguments);
  }).bind(this);

  return callbackName;
};
JSONPFetcher.prototype.requestData = function jpf_requestJSONData(url) {
  var callbackName = this.currentRequest = this.getNewCallback();

  url += (url.indexOf('?') === -1) ? '?' : '&';
  url += 'callback=' + callbackName;

  var el = this.scriptElement = document.createElement('script');
  el.src = url;
  el.setAttribute('data-callback-name', callbackName);
  el.addEventListener('load', this);
  el.addEventListener('error', this);

  document.documentElement.firstElementChild.appendChild(el);

  clearTimeout(this.timer);
  this.timer = setTimeout(function jpf_timeout() {
    window[callbackName]();
  }, this.TIMEOUT);
};

var FeedFetcher = function FeedFetcher() {
  this.types = ['rss', 'feed'];

  this.params = [
    ['v', '1.0'],
    ['scoring', this.FEED_API_SCORING],
    ['num', this.FEED_API_NUM]
  ];
};
FeedFetcher.prototype = new JSONPFetcher();
FeedFetcher.prototype.FEED_API_LOAD_URL =
  'https://ajax.googleapis.com/ajax/services/feed/load';
FeedFetcher.prototype.FEED_API_CALLBACK_PREFIX = 'FeedFetcherCallback';
FeedFetcher.prototype.FEED_API_NUM = '-1';
FeedFetcher.prototype.FEED_API_SCORING = 'h';
FeedFetcher.prototype.ENTRY_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
FeedFetcher.prototype.getData = function rf_getData(dataType, data) {
  var params = [].concat(this.params);

  params.push(['q', data]);
  params.push(['context', 'ctx']);

  var url = this.FEED_API_LOAD_URL + '?' + params.map(function kv(param) {
    return param[0] + '=' + encodeURIComponent(param[1]);
  }).join('&');

  this.requestData(url);

};
FeedFetcher.prototype.handleResponse = function rf_handleResponse(contextValue,
                                                                 responseObject,
                                                                 responseStatus,
                                                                 errorDetails) {
  // Return empty text if we couldn't get the data.
  if (!contextValue || responseStatus !== 200) {
    this.app.handleData('');
    return;
  }

  var text = [];
  responseObject.feed.entries.forEach((function process(entry) {
    text.push(entry.title);
    text.push(entry.content.replace(this.ENTRY_REGEXP, ''));
    text.push('');
  }).bind(this));
  this.app.handleData(text.join('\n'));
};

var WikipediaFetcher = function WikipediaFetcher(opts) {
  this.types = ['wiki', 'wikipedia'];

  this.params = [
    ['action', 'query'],
    ['prop', 'revisions'],
    ['rvprop', 'content'],
    ['redirects', '1'],
    ['format', 'json'],
    ['rvparse', '1']
  ];
};
WikipediaFetcher.prototype = new JSONPFetcher();
WikipediaFetcher.prototype.WIKIPEDIA_API_URL =
  'https://%lang.wikipedia.org/w/api.php';
WikipediaFetcher.prototype.DEFAULT_LANG = 'en';
WikipediaFetcher.prototype.PARSED_WIKITEXT_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
WikipediaFetcher.prototype.getData = function wf_getData(dataType, data) {
  var params = [].concat(this.params);

  var dataTypeArr = dataType.split('.');
  var lang = (dataTypeArr[1]) ? dataTypeArr[1] : this.DEFAULT_LANG;

  if (dataTypeArr[2]) {
    params.push(['converttitles', dataTypeArr[2]]);
  }

  params.push(['titles', data]);

  var url = this.WIKIPEDIA_API_URL.replace(/%lang/, lang) + '?' +
  params.map(function kv(param) {
    return param[0] + '=' + encodeURIComponent(param[1]);
  }).join('&');

  this.requestData(url);
};
WikipediaFetcher.prototype.handleResponse = function wf_handleResponse(res) {
  if (!res) {
    this.app.handleData('');
    return;
  }

  var pageId = Object.keys(res.query.pages)[0];
  var page = res.query.pages[pageId];
  if (!('revisions' in page)) {
    this.app.handleData('');
    return;
  }

  var text = page.revisions[0]['*'].replace(this.PARSED_WIKITEXT_REGEXP, '');
  this.app.handleData(text);
};

var GooglePlusFetcher = function GooglePlusFetcher(opts) {
  this.types = ['googleplus'];

  this.params = [
    ['maxResults', '100'],
    ['alt', 'json'],
    ['pp', '1']
  ];
};
GooglePlusFetcher.prototype = new JSONPFetcher();
GooglePlusFetcher.prototype.GOOGLE_PLUS_API_URL =
  'https://www.googleapis.com/plus/v1/people/%source/activities/public';
GooglePlusFetcher.prototype.POST_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
GooglePlusFetcher.prototype.getData = function gpf_getData(dataType, data) {
  var googlePlusPanelView =
    this.app.views['source-dialog'].panels['googleplus'];
  var accessToken = googlePlusPanelView.accessToken;

  if (!accessToken) {
    // XXX: can we login user from here?
    // User would lost the id kept in hash here.
    this.app.logAction('GooglePlusFetcher::getData', 'reset');
    this.app.reset();
    this.app.views['source-dialog'].showPanel(googlePlusPanelView);
    return;
  }

  var params = [].concat(this.params);
  params.push(['access_token', accessToken]);

  var url = this.GOOGLE_PLUS_API_URL.replace(/%source/, data) + '?' +
  params.map(function kv(param) {
    return param[0] + '=' + encodeURIComponent(param[1]);
  }).join('&');

  this.requestData(url);
};
GooglePlusFetcher.prototype.handleResponse = function gpf_handleResponse(res) {
  if (!res || res.error || !res.items) {
    this.app.handleData('');
    return;
  }

  var text = res.items.map((function gpf_map(item) {
    return item.object.content.replace(this.POST_REGEXP, '');
  }).bind(this)).join('');

  this.app.handleData(text);
};

var FacebookFetcher = function FacebookFetcher() {
  this.types = ['facebook'];
};
FacebookFetcher.prototype = new Fetcher();
FacebookFetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_DOWNLOADING;
FacebookFetcher.prototype.FACEBOOK_GRAPH_FIELDS =
  'notes.limit(500).fields(subject,message),' +
  'feed.limit(2500).fields(from.fields(id),message)';
FacebookFetcher.prototype.NOTE_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
FacebookFetcher.prototype.stop = function fbf_stop() {
  // FB.api doesn't comes with a method to cancel the request.
  this.currentPath = undefined;
};
FacebookFetcher.prototype.getData = function fbf_getData(dataType, data) {
  var facebookPanelView = this.app.views['source-dialog'].panels['facebook'];

  // If we are not ready, bring user back to the facebook panel.
  if (!facebookPanelView.isReadyForFetch()) {

    // XXX: can we login user from here?
    // User would lost the id kept in hash here.
    this.app.logAction('FacebookFetcher::getData', 'reset');
    this.app.reset();
    this.app.views['source-dialog'].showPanel(facebookPanelView);
    return;
  }

  var path = this.currentPath = '/' + encodeURIComponent(data) +
    '?fields=' + this.FACEBOOK_GRAPH_FIELDS;

  FB.api(path, (function gotFacebookAPIData(res) {
    // Ignore any response that does not match currentPath.
    if (this.currentPath !== path)
      return;
    this.currentPath = undefined;

    this.handleResponse(res);
  }).bind(this));
};
FacebookFetcher.prototype.handleResponse = function fbf_handleResponse(res) {
  if (res.error) {
    this.app.handleData('');
    return;
  }

  var text = [];

  if (res.notes) {
    var NOTE_REGEXP = this.NOTE_REGEXP;
    res.notes.data.forEach(function forEachNote(note) {
      if (note.subject)
        text.push(note.subject);
      if (note.message)
        text.push(note.message.replace(NOTE_REGEXP, ''));
    });
  }

  res.feed.data.forEach(function forEachData(entry) {
    // Get rid of birthday messages on the wall.
    if (entry.from.id !== res.id)
      return;

    if (entry.message)
      text.push(entry.message);
  });

  this.app.handleData(text.join('\n'));
};

var FacebookSDKLoader = function FacebookSDKLoader() {
  if (!FACEBOOK_APP_ID)
    throw 'No FACEBOOK_APP_ID defined.';

  this.loaded = false;
};
FacebookSDKLoader.prototype.load = function fsl_load(callback) {
  if (this.loaded)
    throw 'FacebookSDKLoader shouldn\'t be reused.';
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
