'use strict';

module('WordCloudApp');

test('isSupported', function() {
  var app = new WordCloudApp();
  ok(app.isSupported, 'Passed!');
  app.uninit();
});

test('isFullySupported', function() {
  var app = new WordCloudApp();
  ok(app.isFullySupported, 'Passed!');
  app.uninit();
});

test('handleData(\'text\')', function() {
  var app = new WordCloudApp();
  app.addView(new LoadingView({
    element: document.createElement('div'),
    labelElement: document.createElement('div')
  }));
  app.wordfreqOption = {
    workerUrl: '../assets/wordfreq/src/wordfreq.worker.js'
  };
  app.handleList = function wcaOverWritten_handleList(list, vol) {
    deepEqual(list, [['English', 3]], 'Passed!');
    equal(vol, 63, 'Passed!');

    app.uninit();
    start();
  };

  stop();
  var str = 'English\nEnglish\nEnglish';
  app.handleData(str);
});

test('stopHandleData()', function() {
  var timer;

  var app = new WordCloudApp();
  app.addView(new LoadingView({
    element: document.createElement('div'),
    labelElement: document.createElement('div')
  }));
  app.wordfreqOption = {
    workerUrl: '../assets/wordfreq/src/wordfreq.worker.js'
  };
  app.handleList = function wcaOverWritten_handleList(list, vol) {
    ok(false, 'Not stopped.');

    clearTimeout(timer);
    app.uninit();
    start();
  };

  timer = setTimeout(function() {
    ok(true, 'Stopped.');

    app.uninit();
    start();
  }, 200);

  stop();
  var str = 'English\nEnglish\nEnglish';
  app.handleData(str);
  app.stopHandleData(str);
});
