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

module('JSONPFetcher');

test('requestData(url)', function() {
  var fetcher = new JSONPFetcher();
  fetcher.handleResponse = function handleResponse(res) {
    ok(res && res.ip === '127.0.0.1', 'got data.');

    start();
  };
  stop();
  fetcher.requestData('http://freegeoip.net/json/127.0.0.1');
});

test('requestData(non-exist API)', function() {
  var fetcher = new JSONPFetcher();
  fetcher.handleResponse = function handleResponse(res) {
    ok(!res, 'got empty response.');

    start();
  };
  stop();
  /* example.com:443 should refuse the connection. */
  fetcher.requestData('https://example.com/');
});

module('FeedFetcher');

test('getData(\'feed\')', function() {
  var fetcher = new FeedFetcher();
  var data = 'http://blog.timc.idv.tw/feed/';
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      ok(!!data, 'Received data, length: ' + data.length);

      start();
    }
  };
  fetcher.getData('feed', data);
});

test('stop()', function() {
  var fetcher = new FeedFetcher();
  var data = 'http://blog.timc.idv.tw/feed/';
  var timer;
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      ok(false, 'handleData being called.');
      clearTimeout(timer);

      start();
    }
  };
  timer = setTimeout(function() {
    ok(true, 'stop() works.');

    start();
  }, 100);
  fetcher.getData('feed', data);
  fetcher.stop();
});

module('WikipediaFetcher');

test('getData(\'wikipedia\')', function() {
  var fetcher = new WikipediaFetcher();
  var data = 'Happiness';
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      ok(!!data, 'Received data, length: ' + data.length);

      start();
    }
  };
  fetcher.getData('wikipedia', data);
});

test('stop()', function() {
  var fetcher = new WikipediaFetcher();
  var data = 'Happiness';
  var timer;
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      ok(false, 'Received data, length: ' + data.length);
      clearTimeout(timer);

      start();
    }
  };
  timer = setTimeout(function() {
    ok(true, 'stop() works.');

    start();
  }, 100);
  fetcher.getData('wikipedia', data);
  fetcher.stop();
});
