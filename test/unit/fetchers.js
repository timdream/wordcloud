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
  stop();
  fetcher.app = {
    handleData: function gotData(d) {
      ok(false, 'handleData being called.');
      start();
    }
  };
  setTimeout(function() {
    ok(true, 'stop() works.');
    start();
  }, 50);
  fetcher.getData('text', data);
  fetcher.stop();
});

module('FileFetcher');
/* XXX: We cannot create a File object in web content,
   so we will use the next best thing here -- a Blob. */

test('getData(\'file\')', function() {
  var fetcher = new FileFetcher();
  var data = 'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla';
  stop();
  fetcher.app = {
    views: {
      'source-dialog': {
        panels: {
          file: {
            fileElement: { files: [new Blob([data], { type: 'text/xml' })] },
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
  stop();
  fetcher.app = {
    views: {
      'source-dialog': {
        panels: {
          file: {
            fileElement: { files: [new Blob([data], { type: 'text/xml' })] },
            encodingElement: { value: 'UTF-8' } }
        }
      }
    },
    handleData: function gotData(d) {
      ok(false, 'handleData being called.');
      start();
    }
  };
  setTimeout(function() {
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
  stop();
  fetcher.app = {
    handleList: function gotData(d) {
      ok(false, 'handleData being called.');
      start();
    }
  };
  setTimeout(function() {
    ok(true, 'stop() works.');
    start();
  }, 50);
  fetcher.getData('text', data);
  fetcher.stop();
});


module('FeedFetcher');

test('getData(\'feed\')', function() {
  var fetcher = new FeedFetcher();
  var data = 'http://blog.timc.idv.tw/feed/';
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      ok(!!data, 'Received data, length: ' + data.length);

      // Manually remove the callback reference.
      window[fetcher.callbackName] = undefined;
      start();
    }
  };
  fetcher.getData('feed', data);
});

test('stop()', function() {
  var fetcher = new FeedFetcher();
  var data = 'http://blog.timc.idv.tw/feed/';
  stop();
  fetcher.app = {
    handleData: function gotData(data) {
      ok(false, 'handleData being called.');

      // Manually remove the callback reference.
      window[fetcher.callbackName] = undefined;
      start();
    }
  };
  setTimeout(function() {
    ok(true, 'stop() works.');

    // Manually remove the callback reference.
    // XXX: we don't do that here because the json-p script will
    // later generate a runtime error.
    // window[fetcher.callbackName] = undefined;
    start();
  }, 10);
  fetcher.getData('feed', data);
  fetcher.stop();
});

