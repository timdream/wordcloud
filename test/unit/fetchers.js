'use strict';

module('TextFetcher');

test('getData(\'text\')', function() {
  var fetcher = new TextFetcher();
  var data = 'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla';
  stop();
  fetcher.app = {
    handleData: function gotData(d) {
      equal(d, data);
      start();
    }
  };
  fetcher.getData('text', data);
});

test('getData(\'base64\')', function() {
  var fetcher = new TextFetcher();
  var text = 'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla';
  var data = window.btoa(unescape(encodeURIComponent(text)));
  stop();
  fetcher.app = {
    handleData: function gotData(d) {
      equal(d, text);
      start();
    }
  };
  fetcher.getData('base64', data);
});

test('stop()', function() {
  var fetcher = new TextFetcher();
  var data = 'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla';
  var timer;
  stop();
  fetcher.app = {
    handleData: function gotData(d) {
      ok(false, 'handleData being called.');
      clearTimeout(timer);

      start();
    }
  };
  timer = setTimeout(function() {
    ok(true, 'stop() works.');
    start();
  }, 50);
  fetcher.getData('text', data);
  fetcher.stop();
});

module('FileFetcher');

test('getData(\'file\')', function() {
  var fetcher = new FileFetcher();
  var data = 'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla';
  stop();
  fetcher.app = {
    views: {
      'source-dialog': {
        panels: {
          file: {
            fileElement: { files: [ getFakeFile(data) ] },
            encodingElement: { value: 'UTF-8' } }
        }
      }
    },
    handleData: function gotData(d) {
      equal(d, data);
      start();
    }
  };
  fetcher.getData('file', '');
});

test('getData(\'file\'): empty input', function() {
  var fetcher = new FileFetcher();
  stop();
  expect(2);
  var filePanelView = {
    fileElement: { files: [] },
    encodingElement: { value: 'UTF-8' }
  };
  fetcher.app = {
    reset: function() {
      ok(true, 'reset()');
    },
    views: {
      'source-dialog': {
        panels: {
          file: filePanelView
        },
        showPanel: function showPanel(panel) {
          equal(panel, filePanelView);
          start();
        }
      }
    },
    handleData: function gotData(d) {
      ok(false, 'handleData being called.');
      start();
    }
  };
  fetcher.getData('file', '');
});

test('stop()', function() {
  var fetcher = new FileFetcher();
  var data = 'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla';
  var timer;
  stop();
  fetcher.app = {
    views: {
      'source-dialog': {
        panels: {
          file: {
            fileElement: { files: [ getFakeFile(data) ] },
            encodingElement: { value: 'UTF-8' } }
        }
      }
    },
    handleData: function gotData(d) {
      ok(false, 'handleData being called.');
      clearTimeout(timer);

      start();
    }
  };
  timer = setTimeout(function() {
    ok(true, 'stop() works.');
    start();
  }, 50);
  fetcher.getData('text', data);
  fetcher.stop();
});

module('ListFetcher');

test('getData(\'list\')', function() {
  var fetcher = new ListFetcher();
  var data = '2\tNubes\n200\tNubia\n30\tNubo';
  stop();
  fetcher.app = {
    handleList: function gotData(d) {
      deepEqual(d, [['Nubes', 2], ['Nubia', 200], ['Nubo', 30]]);
      start();
    }
  };
  fetcher.getData('text', data);
});

test('getData(\'list\') with malform data', function() {
  var fetcher = new ListFetcher();
  var data = '2\tNubes\nXXX==XXX==\n200\tNubia\n30\tNubo\n\n';
  stop();
  fetcher.app = {
    handleList: function gotData(d) {
      deepEqual(d, [['Nubes', 2], ['Nubia', 200], ['Nubo', 30]]);
      start();
    }
  };
  fetcher.getData('text', data);
});

test('getData(\'base64-list\')', function() {
  var fetcher = new ListFetcher();
  var text = '2\tNubes\n200\tNubia\n30\tNubo';
  var data = window.btoa(unescape(encodeURIComponent(text)));
  stop();
  fetcher.app = {
    handleList: function gotData(d) {
      deepEqual(d, [['Nubes', 2], ['Nubia', 200], ['Nubo', 30]]);
      start();
    }
  };
  fetcher.getData('base64-list', data);
});

test('stop()', function() {
  var fetcher = new ListFetcher();
  var data = '2\tNubes\n200\tNubia\n30\tNubo';
  var timer;
  stop();
  fetcher.app = {
    handleList: function gotData(d) {
      ok(false, 'handleData being called.');
      clearTimeout(timer);

      start();
    }
  };
  timer = setTimeout(function() {
    ok(true, 'stop() works.');
    start();
  }, 50);
  fetcher.getData('text', data);
  fetcher.stop();
});

module('JSONPFetcher (<script>)');

test('requestData(url)', function() {
  var fetcher = new JSONPFetcher();
  fetcher.USE_WORKER_WHEN_AVAILABLE = false;
  fetcher.handleResponse = function handleResponse(res) {
    deepEqual(res, { 'hello': 'world' }, 'got data.');

    start();
  };
  stop();
  fetcher.requestData('../test/fake-jsonp/hello.js');
});

test('stop()', function() {
  var fetcher = new JSONPFetcher();
  var timer;
  fetcher.USE_WORKER_WHEN_AVAILABLE = false;
  fetcher.handleResponse = function handleResponse(res) {
    ok(false, 'handleData being called.');
    clearTimeout(timer);

    start();
  };
  stop();
  fetcher.requestData('../test/fake-jsonp/hello.js');
  timer = setTimeout(function() {
    ok(true, 'stop() works.');

    start();
  }, 100);
  fetcher.stop();
});

test('requestData(non-exist API)', function() {
  var fetcher = new JSONPFetcher();
  fetcher.USE_WORKER_WHEN_AVAILABLE = false;
  fetcher.handleResponse = function handleResponse(res) {
    ok(!res, 'got empty response.');

    start();
  };
  stop();
  fetcher.requestData('./404');
});

module('JSONPFetcher (Worker)');

test('requestData(url)', function() {
  var fetcher = new JSONPFetcher();
  JSONPWorkerDownloader.prototype.PATH = '../assets/';
  fetcher.handleResponse = function handleResponse(res) {
    deepEqual(res, { 'hello': 'world' }, 'got data.');

    start();
  };
  stop();
  fetcher.requestData('../test/fake-jsonp/hello-worker.js');
});

test('stop()', function() {
  var fetcher = new JSONPFetcher();
  var timer;
  JSONPWorkerDownloader.prototype.PATH = '../assets/';
  fetcher.handleResponse = function handleResponse(res) {
    ok(false, 'handleData being called.');
    clearTimeout(timer);

    start();
  };
  stop();
  fetcher.requestData('../test/fake-jsonp/hello-worker.js');
  timer = setTimeout(function() {
    ok(true, 'stop() works.');

    start();
  }, 100);
  fetcher.stop();
});

test('requestData(non-exist API)', function() {
  var fetcher = new JSONPFetcher();
  JSONPWorkerDownloader.prototype.PATH = '../assets/';
  fetcher.handleResponse = function handleResponse(res) {
    ok(!res, 'got empty response.');

    start();
  };
  stop();
  fetcher.requestData('./404');
});

module('FeedFetcher');

test('getData(\'feed\')', function() {
  var fetcher = new FeedFetcher();
  fetcher.USE_WORKER_WHEN_AVAILABLE = false;
  fetcher.FEED_API_LOAD_URL = './fake-jsonp/google-feed-api.js';
  var data = 'http://foo.bar/feed/';
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      equal(data, 'title1\ncontent1\ncontent1 line 2\n\ntitle2\ncontent2\ncontent2 line 2\n');

      start();
    }
  };
  fetcher.getData('feed', data);
});

module('WikipediaFetcher');

test('getData(\'wikipedia\')', function() {
  var fetcher = new WikipediaFetcher();
  fetcher.USE_WORKER_WHEN_AVAILABLE = false;
  fetcher.WIKIPEDIA_API_URL = './fake-jsonp/wikipedia-api.js';
  var data = 'Happiness';
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      equal(data, 'Several terms redirect here.  For other uses, see Happiness (disambiguation), Happy (disambiguation), and Jolly (disambiguation).');

      start();
    }
  };
  fetcher.getData('wikipedia', data);
});
