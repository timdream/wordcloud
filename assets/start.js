'use strict';

/* global WordFreq:true, WordFreqSync:true, WordCloudApp,
          LanguageSwitcherView, SNSPushView, CanvasView,
          LoadingView, DashboardView, ListDialogView,
          SharerDialogView, AboutDialogView, SourceDialogView,
          ExamplePanelView, CPPanelView, FilePanelView,
          WikipediaPanelView,
          TextFetcher, FileFetcher,
          ListFetcher, WikipediaFetcher,
          PSMView */

if (window.location.hostname === 'timdream.org') {
  window.location.href =
    'https://wordcloud.timdream.org/' + window.location.hash;
}

// Matomo
var _paq = window._paq || [];
if (navigator.doNotTrack !== '1') {
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="//stats.timdream.org/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '7']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
} else if (window.console) {
  _paq.push = function pushWithLog() {
    // console.log.apply() does not exist on IE9
    Function.prototype.apply.call(console.log, console, arguments);
    Array.prototype.push.apply(this, arguments);
  };
}

window.onerror = function onerror(message, url, line) {
  _paq.push(['trackEvent',
            'JavaScript Exceptions', message, (url + ' (' + line + ')')]);
};

(function checkOgImages() {
  if (!document.querySelectorAll || !window.console) {
    return;
  }

  var ogImage = document.querySelector('meta[property="og:image"]').content;
  var ogUrl = document.querySelector('meta[property="og:url"]').content;
  var fbAppId = document.querySelector('meta[property="fb:app_id"]').content;

  var matchingUrl = window.location.href
                    .replace(/#.*$/, '').replace(/\?.*$/, '');

  if (ogImage.substr(0, matchingUrl.length) !== matchingUrl ||
      ogUrl.substr(0, matchingUrl.length) !== matchingUrl ||
      (window.FACEBOOK_APP_ID && fbAppId !== window.FACEBOOK_APP_ID)) {
    console.warn('Remember to change the content of <meta> tags in HTML.');
  }
})();

// start.js start the world. It is not be covered in the tests.

(function start() {
  // shortcut for document.webL10n.translate
  if (window.__ === undefined) {
    window.__ = document.webL10n.translate;
  }

  // Depend on the browser support, one of these shouldn't exist,
  // at least on the main event loop.
  if (WordFreq.isSupported) {
    WordFreqSync = null;
  } else {
    WordFreq = null;
  }

  // Start the app.
  var app = new WordCloudApp();
  if (!app.isSupported) {
    return;
  }

  var langSwitcherView = new LanguageSwitcherView();
  langSwitcherView.app = app;

  var snsPushView = new SNSPushView();
  snsPushView.show();

  var psmView = new PSMView();
  psmView.show();

  app.addView(new CanvasView());
  app.addView(new LoadingView());
  app.addView(new DashboardView());
  app.addView(new ListDialogView());
  app.addView(new SharerDialogView());
  app.addView(new AboutDialogView());

  var sourceDialogView = new SourceDialogView();
  app.addView(sourceDialogView);

  sourceDialogView.addPanel(new ExamplePanelView());
  sourceDialogView.addPanel(new CPPanelView());
  sourceDialogView.addPanel(new FilePanelView());
  sourceDialogView.addPanel(new WikipediaPanelView());

  app.addFetcher(new TextFetcher());
  app.addFetcher(new FileFetcher());
  app.addFetcher(new ListFetcher());
  app.addFetcher(new WikipediaFetcher());
})();
