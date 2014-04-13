'use strict';

/* global View, _ */

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
    var i = ctlBtns.length;
    var el;

    if (nextState === this.app.UI_STATE_DASHBOARD) {
      while (i--) {
        el = ctlBtns[i];
        el.className = el.className.replace(/ disabled/g, '');
      }
    } else {
      while (i--) {
        el = ctlBtns[i];
        // We might add extra disabled here, but all of them will be removed,
        // so don't worry.
        el.className += ' disabled';
      }
    }
  };
DashboardView.prototype.handleEvent = function dv_handleEvent(evt) {
  var el = evt.currentTarget;
  if (el.className.indexOf('disabled') !== -1) {
    return;
  }

  var app = this.app;
  var action = el.getAttribute('data-action');

  this.app.logAction('DashboardView::action', action);

  switch (action) {
    case 'back':
      app.reset();
      break;

    case 'refresh':
      app.draw();
      break;

    case 'theme':
      app.data.theme++;
      if (app.data.theme >= app.themes.length) {
        app.data.theme = 0;
      }

      app.draw();
      break;

    case 'shape':
      app.data.shape++;
      if (app.data.shape >= app.shapes.length) {
        app.data.shape = 0;
      }

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
      if (app.data.weightFactor <= 0.1) {
        break;
      }

      app.data.weightFactor -= 0.1;

      app.draw();
      break;

    case 'gap+':
      app.data.gridSize++;

      app.draw();
      break;

    case 'gap-':
      if (app.data.gridSize <= 2) {
        break;
      }

      app.data.gridSize--;

      app.draw();
      break;

    case 'save':
      // We could use canvasElement.toBlob(callback) here,
      // but we will miss the default action (download).
      var url = app.getCanvasElement().toDataURL();
      if ('download' in document.createElement('a')) {
        el.href = url;

        // Let's not keep this in the DOM forever.
        setTimeout(function cleanUrl() {
          el.href = '#';
        }, 0);
      } else {
        evt.preventDefault();
        var win = window.open('blank.html', '_blank',
                              'width=500,height=300,resizable=yes,menubar=yes');
        var loadImage = function loadImage() {
          win.removeEventListener('load', loadImage);
          if (win.detachEvent) {
            win.detachEvent('onload', loadImage);
          }

          var doc = win.document;

          while (doc.body.firstElementChild) {
            doc.body.removeChild(doc.body.firstElementChild);
          }
          var img = doc.createElement('img');
          img.id = 'popup-image';
          img.src = url;
          doc.getElementsByTagName('title')[0].textContent =
            _('image-popup-title');
          doc.body.appendChild(img);
        };

        // XXX IE9 won't attach the standard addEventListener interface
        // until the document is loaded.
        // It would also refuse to fire the onload event if the document is
        // considered ready.
        if (win.attachEvent) {
          if (win.document.readyState === 'complete') {
            loadImage();
          } else {
            win.attachEvent('onload', loadImage);
          }
        } else {
          // Simple syntax for the rest of us.
          win.addEventListener('load', loadImage);
        }
      }

      break;

    case 'share':
      app.showSharer();

      break;
  }
};
