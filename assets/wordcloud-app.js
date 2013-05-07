'use strict';

var WordCloudApp = function WordCloudApp() {
  // Special code here to handle non-supported browser case.
  if (!WordFreq.isSupported ||
      !WordCloud.isSupported ||
      !Object.keys ||
      !Array.prototype.map ||
      !Array.prototype.forEach ||
      !Array.prototype.indexOf ||
      !Function.prototype.bind ||
      !('onhashchange' in window)) {
    window.onload = function wca_browserDisabled() {
      var view = document.getElementById('wc-browser-support');
      delete view.hidden;
      view.removeAttribute('hidden');
    };
    this.isSupported = false;

    return;
  }
  this.isSupported = true;

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
    ['loading', 'dashboard']
  ];

  this.wordfreqOption = {
    workerUrl: './assets/wordfreq/src/wordfreq.worker.js'
  };

  this.themes = [
    {
      fontFamily: '"Trebuchet MS", "Heiti TC", "微軟正黑體", ' +
                  '"Arial Unicode MS", "Droid Fallback Sans", sans-serif',
      color: 'random-dark',
      backgroundColor: '#eee'  //opaque white
    },
    {
      // http://ethantw.net/projects/lab/css-reset/
      fontFamily: 'Baskerville, "Times New Roman", "華康儷金黑 Std", ' +
                  '"華康儷宋 Std",  DFLiKingHeiStd-W8, DFLiSongStd-W5, ' +
                  '"Hiragino Mincho Pro", "LiSong Pro Light", "新細明體", serif',
      color: 'random-light',
      backgroundColor: '#000'
    },
    {
      // http://ethantw.net/projects/lab/css-reset/
      fontFamily: 'Baskerville, "Times New Roman", "華康儷金黑 Std", ' +
                  '"華康儷宋 Std",  DFLiKingHeiStd-W8, DFLiSongStd-W5, ' +
                  '"Hiragino Mincho Pro", "LiSong Pro Light", "新細明體", serif',
      color: '#fff',
      backgroundColor: '#000'
    },
    {
      fontFamily: '"Myriad Pro", "Lucida Grande", Helvetica, "Heiti TC", ' +
                  '"微軟正黑體", "Arial Unicode MS", "Droid Fallback Sans", ' +
                  'sans-serif',
      color: 'rgba(255,255,255,0.8)',
      backgroundColor: '#353130'
    },
    {
      fontFamily: '"Trebuchet MS", "Heiti TC", "微軟正黑體", ' +
                  '"Arial Unicode MS", "Droid Fallback Sans", sans-serif',
      color: 'rgba(0,0,0,0.7)',
      backgroundColor: 'rgba(255, 255, 255, 1)' //opaque white
    }
  ];

  this.data = {
    theme: 0,
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
  // This two flags are introduced so that when [Back] button
  // of the dashboard is pressed, reset() can actually go back one step
  // in the browser history instead of always pushing a new url hash.
  // This is not bullet-proof, unfortunately.
  this.backToReset = (window.location.hash === '');
  this.lastUrlHashChangePushedByScript = true;

  window.location.hash = hash;
};
WordCloudApp.prototype.reset = function wca_reset() {
  if (!window.location.hash)
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
WordCloudApp.prototype.switchUIState = function wca_switchUIState(state) {
  if (!this.UIStateViewMap[state])
    throw 'Undefined state ' + state;

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
  this.wordfreq =
    WordFreq(this.wordfreqOption).process(text)
    .getVolume(function gotVolume(vol) {
      volume = vol;
    }).getList((function gotList(list) {
      this.wordfreq = undefined;
      this.handleList(list, volume);
    }).bind(this));
};
WordCloudApp.prototype.handleList = function wca_handleList(list, vol) {
  if (!list.length) {
    this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
    this.views.loading.updateLabel(
      this.views.loading.LABEL_ERROR_LIST);
    return;
  }

  this.switchUIState(this.UI_STATE_DASHBOARD);

  this.data.list = list;
  this.data.gridSize = 4;
  this.calculateWeightFactor(vol);

  this.draw();
};
WordCloudApp.prototype.draw = function wca_draw() {
  var canvasView = this.views.canvas;
  canvasView.setDimension();
  canvasView.draw(this.getWordCloudOption());
};
WordCloudApp.prototype.calculateWeightFactor =
  function wca_calculateWeightFactor(vol) {
    var width = document.documentElement.offsetWidth;
    var height = document.documentElement.offsetHeight;
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

  return option;
};
WordCloudApp.prototype.route = function wca_route() {
  var hash = window.location.hash;

  if (this.backToReset && !this.lastUrlHashChangePushedByScript)
    this.backToReset = false;

  this.lastUrlHashChangePushedByScript = false;

  // Stop any current fetcher async operation
  if (this.currentFetcher) {
    this.currentFetcher.stop();
    this.currentFetcher = undefined;
  }

  // Stop any current WordFreq async operation
  if (this.wordfreq) {
    this.wordfreq.stop(false);
    this.wordfreq = undefined;
  }

  if (!hash) {
    this.switchUIState(this.UI_STATE_SOURCE_DIALOG);
    this.views.canvas.drawIdleCloud();
    return;
  }

  var dataType, data;
  hash.substr(1).match(/^([^:]+):?(.*)$/).forEach(function matchHash(str, i) {
    switch (i) {
      case 1:
        dataType = str;
        break;

      case 2:
        data = str;
        break;
    }
  });

  if (dataType in this.fetchers) {
    this.switchUIState(this.UI_STATE_WORKING);
    this.views.loading.updateLabel(
      this.fetchers[dataType].LABEL_VERB);
    this.currentFetcher = this.fetchers[dataType];
    this.fetchers[dataType].getData(dataType, data);
  } else {
    // Can't handle such data. Reset the URL hash.
    this.reset();
  }
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

  this.element.hidden = false;

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

  this.element.hidden = true;

  if ('afterHide' in this) {
    this.afterHide.apply(this, arguments);
  }
  return true;
};

var CanvasView = function CanvasView(opts) {
  this.load(opts, {
    name: 'canvas',
    element: 'wc-canvas'
  });

  this.idleOption = {
    fontFamily: 'serif',
    color: 'rgba(255, 255, 255, 0.8)',
    rotateRatio: 0.5,
    backgroundColor: 'transparent',
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
CanvasView.prototype.beforeShow =
CanvasView.prototype.beforeHide = function cv_beforeShowHide(state, nextState) {
  switch (nextState) {
    case this.app.UI_STATE_SOURCE_DIALOG:
      this.drawIdleCloud();
      break;

    case this.app.UI_STATE_LOADING:
    case this.app.UI_STATE_WORKING:
      this.empty();
      break;
  }
};
CanvasView.prototype.setDimension = function cv_setDimension(width, height) {
  var el = this.element;
  width = width ? width : document.documentElement.offsetWidth;
  height = height ? height : document.documentElement.offsetHeight;
  el.setAttribute('width', width);
  el.setAttribute('height', height);
  el.style.marginLeft = (- width / 2) + 'px';
  el.style.marginTop = (- height / 2) + 'px';
};
CanvasView.prototype.draw = function cv_draw(option) {
  WordCloud(this.element, option);
};
CanvasView.prototype.drawIdleCloud = function cv_drawIdleCloud() {
  var el = this.element;
  var width = document.documentElement.offsetWidth;
  var height = document.documentElement.offsetHeight;

  this.setDimension(width, height);
  this.idleOption.gridSize = Math.round(16 * width / 1024);
  this.idleOption.weightFactor = function weightFactor(size) {
    return Math.pow(size, 2.3) * width / 1024;
  };

  WordCloud(this.element, this.idleOption);
};
CanvasView.prototype.empty = function cv_empty() {
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
    this.element.classList.add('error');
  } else {
    this.element.classList.remove('error');
  }
};
LoadingView.prototype.updateLabel = function l_updateLabel(stringId) {
  if (!this.stringIds[stringId])
    throw 'Undefined stringId ' + stringId;

  // XXX: replace this with l10n library calls
  this.labelElement.textContent = this.stringIds[stringId];
};

var SourceDialogView = function SourceDialogView(opts) {
  this.load(opts, {
    name: 'source-dialog',
    element: 'wc-source-dialog',
    menuElement: 'wc-source-menu',
    startBtnElement: 'wc-source-start-btn',
    panelContainerElement: 'wc-source-panels'
  });

  this.currentPanel = null;
  this.panels = {};

  this.menuElement.addEventListener('click', this);
  this.startBtnElement.addEventListener('click', this);
};
SourceDialogView.prototype = new View();
SourceDialogView.prototype.handleEvent = function sd_handleEvent(evt) {
  evt.preventDefault();
  switch (evt.currentTarget) {
    case this.menuElement:
      var panelName = evt.target.dataset.panel;
      if (!panelName || !this.panels[panelName])
        return;

      this.showPanel(this.panels[panelName]);
      break;

    case this.startBtnElement:
      this.currentPanel.submit();
      break;
  }
};
SourceDialogView.prototype.submit = function sd_submit(hash) {
  this.app.pushUrlHash(hash);
};
SourceDialogView.prototype.showPanel = function sd_showPanel(panel) {
  if (this.currentPanel)
    this.currentPanel.hide();

  panel.show();
  this.currentPanel = panel;
};
SourceDialogView.prototype.addPanel = function sd_addPanel(panel) {
  this.panels[panel.name] = panel;
  panel.menuItemElement =
    this.menuElement.querySelector('[data-panel="' + panel.name + '"]');

  if (!panel.menuItemElement)
    throw 'menuItemElement not found.';

  panel.menuItemElement.parentNode.hidden = false;
  panel.dialog = this;

  if ('isSupported' in panel && !panel.isSupported) {
    panel.menuItemElement.parentNode.classList.add('disabled');
    panel.menuItemElement.dataset.panel = undefined;
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
        el.classList.remove('disabled');
      }
    } else {
      var i = ctlBtns.length;
      while (i--) {
        var el = ctlBtns[i];
        el.classList.add('disabled');
      }
    }
  };
DashboardView.prototype.handleEvent = function dv_handleEvent(evt) {
  var el = evt.currentTarget;
  if (el.classList.contains('disabled'))
    return;

  var app = this.app;
  var action = el.dataset.action;

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
        // XXX: l10n
        alert('Please right click and choose "Save As..."' +
              ' to save the generated image.');
        window.open(url, '_blank', 'width=500,height=300,menubar=yes');
      }

      break;

    case 'facebook':
      // XXX: to be implemented
      break;

    case 'plurk':
      // XXX: to be implemented
      break;

    case 'twitter':
      // XXX: to be implemented
      break;
  }
};

var ListDialogView = function ListDialogView(opts) {
  this.load(opts, {
    name: 'list-dialog',
    element: 'wc-list-dialog',
    textElement: 'wc-list-edit',
    doneBtnElement: 'wc-list-done-btn'
  });

  this.doneBtnElement.addEventListener('click', this);
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
ListDialogView.prototype.afterHide = function ldv_afterHide() {
  this.textElement.value = '';
};
ListDialogView.prototype.handleEvent = function ldv_handleEvent(evt) {
  this.submit();
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

  if (hash !== window.location.hash) {
    this.app.pushUrlHash(hash);
  } else {
    // It's useless to push the same hash here;
    // Let's close ourselves.
    this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
  }
};

var PanelView = function PanelView() {
};
PanelView.prototype = new View();
PanelView.prototype.beforeShow = function pv_beforeShow() {
  this.menuItemElement.parentNode.className = 'active';
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
    element: 'wc-panel-example'
  });
};
ExamplePanelView.prototype = new PanelView();
ExamplePanelView.prototype.submit = function epv_submit() {
  var els = this.element.example;
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

  if (window.btoa) {
    // Protect the encoded string with base64 to workaround Safari bug,
    // which improve sharability of the URL.
    this.dialog.submit(
      '#base64:' + window.btoa(unescape(encodeURIComponent(el.value))));
  } else {
    this.dialog.submit('#text:' + encodeURIComponent(el.value));
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
  // XXX: l10n
  this.fileLabelElement.textContent =
    count ? (count + 'file-selected') : 'no-file-selected';
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
    // XXX: l10n
    alert('Please select a plain text file.');
    return;
  }

  this.dialog.submit('#file');
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
  if (dataType === 'base64')
    data = decodeURIComponent(escape(window.atob(data)));

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
  var text = (dataType === 'base64-list') ?
    decodeURIComponent(escape(window.atob(data))) : data;

  var vol = 0;
  var list = text.split('\n').map(function mapItem(line) {
    var item = line.split('\t').reverse();
    item[1] = parseInt(item[1], 10);

    vol += item[0].length * item[1] * item[1];
    return item;
  });

  // Make sure we call the handler methods as async callback.
  this.timer = setTimeout((function bf_gotData() {
    this.app.handleList(list, vol);
  }).bind(this), 0);
};
