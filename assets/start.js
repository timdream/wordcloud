'use strict';

// start.js start the world. It is not be covered in the tests.

(function start() {
  var app = new WordCloudApp();
  if (!app.isSupported)
    return;

  var sourceDialogView = new SourceDialogView();
  sourceDialogView.addPanel(new ExamplePanelView());
  sourceDialogView.addPanel(new CPPanelView());
  sourceDialogView.addPanel(new FilePanelView());

  app.addView(new CanvasView());
  app.addView(new LoadingView());
  app.addView(new DashboardView());
  app.addView(sourceDialogView);

  app.addFetcher(new TextFetcher());
  app.addFetcher(new Base64Fetcher());
  app.addFetcher(new FileFetcher());
})();
