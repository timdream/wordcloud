'use strict';

/* global LoadingView, _ */

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
    data = this.app.views['source-dialog'].panels.cp.textareaElement.value;
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
  if (!this.reader) {
    return;
  }

  this.reader.abort();
  this.reader = null;
};
FileFetcher.prototype.getData = function ff_getData(dataType, data) {
  var filePanelView = this.app.views['source-dialog'].panels.file;
  var fileElement = filePanelView.fileElement;
  if (!fileElement.files.length) {
    this.app.reset();
    this.app.views['source-dialog'].showPanel(filePanelView);
    return;
  }

  var file = fileElement.files[0];
  var reader = this.reader = new FileReader();
  reader.onloadend = (function fr_loadend(evt) {
    if (reader !== this.reader || reader.result === null) {
      return; // aborted
    }

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
    if (!line || !item[0] || !item[1]) {
      return;
    }

    item[1] = parseInt(item[1], 10);
    if (isNaN(item[1])) {
      return;
    }

    vol += item[0].length * item[1] * item[1];
    list.push(item);
  });

  // Make sure we call the handler methods as async callback.
  this.timer = setTimeout((function bf_gotData() {
    this.app.handleList(list, vol);
  }).bind(this), 0);
};

var JSONPScriptDownloader = function JSONPScriptDownloader() {};
JSONPScriptDownloader.prototype.CALLBACK_PREFIX = 'JSONPCallbackX';
JSONPScriptDownloader.prototype.reset =
JSONPScriptDownloader.prototype.stop = function jpf_stop() {
  this.currentRequest = undefined;
  clearTimeout(this.timer);
};
JSONPScriptDownloader.prototype.handleEvent = function(evt) {
  var el = evt.target;
  window[el.getAttribute('data-callback-name')] = undefined;
  this.currentRequest = undefined;
  clearTimeout(this.timer);

  el.parentNode.removeChild(el);

  if (evt.type === 'error') {
    this.fetcher.handleResponse();
  }
};
JSONPScriptDownloader.prototype.getNewCallbackName = function() {
  // Create a unique callback name for this request.
  var callbackName = this.CALLBACK_PREFIX +
    Math.random().toString(36).substr(2, 8).toUpperCase();

  // Install the callback
  window[callbackName] = (function() {
    // Ignore any response that is not coming from the currentRequest.
    if (this.currentRequest !== callbackName) {
      return;
    }
    this.currentRequest = undefined;
    clearTimeout(this.timer);

    // send the callback name and the data back
    this.fetcher.handleResponse.apply(this.fetcher, arguments);
  }).bind(this);

    return callbackName;
  };
JSONPScriptDownloader.prototype.requestData = function(url) {
  var callbackName = this.currentRequest = this.getNewCallbackName();

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
  }, this.fetcher.TIMEOUT);
};

var JSONPWorkerDownloader = function JSONPWorkerDownloader() {};
JSONPWorkerDownloader.prototype.PATH = './assets/';
JSONPWorkerDownloader.prototype.reset =
JSONPWorkerDownloader.prototype.stop = function jpf_stop() {
  if (!this.worker) {
    return;
  }

  clearTimeout(this.timer);
  this.worker.terminate();
  this.worker = null;
};
JSONPWorkerDownloader.prototype.requestData = function(url) {
  if (this.worker) {
    this.stop();
  }

  this.worker = new Worker(this.PATH + 'downloader-worker.js');
  this.worker.addEventListener('message', this);
  this.worker.addEventListener('error', this);
  this.worker.postMessage(url);

  clearTimeout(this.timer);
  this.timer = setTimeout((function() {
    this.stop();
    this.fetcher.handleResponse();
  }).bind(this), this.fetcher.TIMEOUT);
};
JSONPWorkerDownloader.prototype.handleEvent = function(evt) {
  var data;
  switch (evt.type) {
    case 'message':
      data = evt.data;

      break;

    case 'error':
      data = [];
      // Stop error event on window.
      evt.preventDefault();

      break;
  }
  this.stop();
  this.fetcher.handleResponse.apply(this.fetcher, data);
};

var JSONPFetcher = function JSONPFetcher() {};
JSONPFetcher.prototype = new Fetcher();
JSONPFetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_DOWNLOADING;
JSONPFetcher.prototype.USE_WORKER_WHEN_AVAILABLE = true;
JSONPFetcher.prototype.TIMEOUT = 30 * 1000;
JSONPFetcher.prototype.reset = function jpf_reset() {
  if (this.downloader) {
    this.downloader.reset();
  }
};
JSONPFetcher.prototype.stop = function jpf_stop() {
  if (this.downloader) {
    this.downloader.stop();
  }
  this.downloader = null;
};
JSONPFetcher.prototype.requestData = function jpf_requestJSONData(url) {
  if (this.USE_WORKER_WHEN_AVAILABLE && window.Worker) {
    this.downloader = new JSONPWorkerDownloader();
  } else {
    this.downloader = new JSONPScriptDownloader();
  }

  this.downloader.fetcher = this;
  this.downloader.requestData(url);
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
  this.app.handleData(text, _('wikipedia-title', { title: page.title }));
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
    this.app.views['source-dialog'].panels.googleplus;
  var accessToken = googlePlusPanelView.accessToken;

  if (!accessToken) {
    // XXX: can we login user from here?
    // User would lost the id kept in hash here.
    this.app.logAction('GooglePlusFetcher::getData::reset');
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

  // XXX: we cannot get the user's name from this request
  this.app.handleData(text, _('google-plus-title'));
};

var COSCUPFetcher = function COSCUPFetcher(opts) {
  this.types = ['coscup'];
  this.fields = ['name', 'speaker', 'bio', 'abstract'];
};
COSCUPFetcher.prototype = new JSONPFetcher();
COSCUPFetcher.prototype.API_URL = 'http://coscup.org/%year/api/program';
COSCUPFetcher.prototype.HTML_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
COSCUPFetcher.prototype.getData = function cf_getData(dataType, data) {
  var year = this.year = data;
  this.requestData(this.API_URL.replace(/%year/, year));
};
COSCUPFetcher.prototype.handleResponse = function cf_handleResponse(res) {
  if (!res) {
    this.app.handleData('');
    return;
  }

  var text = [];
  var fields = this.fields;
  var HTML_REGEXP = this.HTML_REGEXP;
  var programs = (Array.isArray(res)) ? res : res.program;

  programs.forEach(function cf_handleProgram(program) {
    fields.forEach(function cf_fields_forEach(field) {
      if (program[field]) {
        text.push(program[field].replace(HTML_REGEXP, ''));
      }
    });
  });

  this.app.handleData(text.join('\n'), _('coscup-title', { year: this.year }));
};
