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

  sourceDialogView.addPanel(new FeedPanelView());
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'blogger',
    element: 'wc-panel-blogger',
    inputElement: 'wc-panel-blogger-id',
    template: 'http://%s.blogspot.com/feeds/posts/default'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'tumblr',
    element: 'wc-panel-tumblr',
    inputElement: 'wc-panel-tumblr-id',
    template: 'http://%s.tumblr.com/rss'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'wordpresscom',
    element: 'wc-panel-wordpresscom',
    inputElement: 'wc-panel-wordpresscom-id',
    template: 'https://%s.wordpress.com/feed/'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'pixnet',
    element: 'wc-panel-pixnet',
    inputElement: 'wc-panel-pixnet-id',
    template: 'http://%s.pixnet.net/blog/feed/rss'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'wretchcc',
    element: 'wc-panel-wretchcc',
    inputElement: 'wc-panel-wretchcc-id',
    template: 'http://www.wretch.cc/blog/%s&rss20=1'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'plurk',
    element: 'wc-panel-plurk',
    inputElement: 'wc-panel-plurk-id',
    template: 'http://www.plurk.com/%s.xml'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'twitter',
    element: 'wc-panel-twitter',
    inputElement: 'wc-panel-twitter-id',
    template: 'http://twitter.com/statuses/user_timeline/%s.rss'
  }));

  app.addView(new CanvasView());
  app.addView(new LoadingView());
  app.addView(new DashboardView());
  app.addView(new ListDialogView());
  app.addView(sourceDialogView);

  app.addFetcher(new TextFetcher());
  app.addFetcher(new FileFetcher());
  app.addFetcher(new ListFetcher());
  app.addFetcher(new FeedFetcher());
})();
