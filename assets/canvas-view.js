'use strict';

/* global View, WordCloud, __ */

var CanvasView = function CanvasView(opts) {
  this.load(opts, {
    name: 'canvas',
    element: 'wc-canvas',
    canvasElement: 'wc-canvas-canvas',
    hoverElement: 'wc-canvas-hover',
    hoverLabelElement: 'wc-canvas-hover-label'
  });

  window.addEventListener('resize', this);
  this.canvasElement.addEventListener('wordcloudstop', this);

  this.documentWidth = window.innerWidth;
  this.documentHeight = window.innerHeight;

  var style = this.canvasElement.style;
  ['transform',
   'webkitTransform',
   'msTransform',
   'oTransform'].some((function findTransformProperty(prop) {
    if (!(prop in style)) {
      return false;
    }

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
      if (state == this.app.UI_STATE_ABOUT_DIALOG) {
        break;
      }
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
      if (evt.detail.drawn) {
        break;
      }

      // Stop the draw.
      evt.preventDefault();

      break;

    case 'wordcloudstop':
      this.canvasElement.removeEventListener('wordclouddrawn', this);

      break;

    case 'mousemove':
      var hw = this.documentWidth / 2;
      var hh = this.documentHeight / 2;
      var x = - (hw - evt.pageX) / hw * this.TILT_DEPTH;
      var y = (hh - evt.pageY) / hh * this.TILT_DEPTH;

      this.canvasElement.style[this.cssTransformProperty] =
        'scale(1.2) translateZ(0) rotateX(' + y + 'deg) rotateY(' + x + 'deg)';

      break;
  }
};
CanvasView.prototype.setDimension = function cv_setDimension(width, height) {
  var el = this.canvasElement;
  width = width ? width : this.documentWidth;
  height = height ? height : this.documentHeight;
  el.setAttribute('width', width);
  el.setAttribute('height', height);
  this.element.style.marginLeft = (- width / 2) + 'px';
  this.element.style.marginTop = (- height / 2) + 'px';
};
CanvasView.prototype.draw = function cv_draw(option) {
  // Have generic font selected based on UI language
  this.canvasElement.lang = '';

  this.hoverElement.setAttribute('hidden', true);
  option.hover = this.handleHover.bind(this);

  WordCloud(this.canvasElement, option);
};
CanvasView.prototype.handleHover = function cv_handleHover(item,
                                                           dimension, evt) {
  var el = this.hoverElement;
  if (!item) {
    el.setAttribute('hidden', true);

    return;
  }

  el.removeAttribute('hidden');
  el.style.left = dimension.x + 'px';
  el.style.top = dimension.y + 'px';
  el.style.width = dimension.w + 'px';
  el.style.height = dimension.h + 'px';

  this.hoverDimension = dimension;

  this.hoverLabelElement.setAttribute(
    'data-l10n-args', JSON.stringify({ word: item[0], count: item[1] }));
  __(this.hoverLabelElement);
};
CanvasView.prototype.drawIdleCloud = function cv_drawIdleCloud() {
  var el = this.canvasElement;
  var width = this.documentWidth;
  var height = this.documentHeight;

  // Only enable the rotation effect on non-touch capable browser.
  if (!('ontouchstart' in window)) {
    document.addEventListener('mousemove', this);
  }

  this.canvasElement.style[this.cssTransformProperty] = 'scale(1.2)';

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
  this.hoverElement.setAttribute('hidden', true);
};
CanvasView.prototype.empty = function cv_empty() {
  document.removeEventListener('mousemove', this);
  this.canvasElement.style[this.cssTransformProperty] = '';

  WordCloud(this.canvasElement, {
    backgroundColor: 'transparent'
  });
};
