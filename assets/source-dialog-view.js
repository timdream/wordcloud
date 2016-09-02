'use strict';

/* global View */

var SourceDialogView = function SourceDialogView(opts) {
  this.load(opts, {
    name: 'source-dialog',
    element: 'wc-source-dialog',
    menuElement: 'wc-source-menu',
    selectionElement: 'wc-source-selection',
    startBtnElement: 'wc-source-start-btn',
    loginFacebookBtnElement: 'wc-source-login-facebook-btn',
    panelContainerElement: 'wc-source-panels',
    aboutBtnElement: 'wc-source-about-btn'
  });

  this.currentPanel = null;
  this.panels = {};

  var selectionElement = this.selectionElement;
  var menuLinks = this.menuElement.getElementsByTagName('a');
  Array.prototype.forEach.call(menuLinks, function item(el) {
    var option = document.createElement('option');
    option.value = el.getAttribute('data-panel');
    option.setAttribute('data-l10n-id', el.getAttribute('data-l10n-id'));
    option.appendChild(document.createTextNode(el.textContent));
    selectionElement.appendChild(option);
  });

  this.menuElement.addEventListener('click', this);
  this.selectionElement.addEventListener('change', this);
  this.startBtnElement.addEventListener('click', this);
  this.loginFacebookBtnElement.addEventListener('click', this);
  this.panelContainerElement.addEventListener('submit', this);
  this.aboutBtnElement.addEventListener('click', this);
};
SourceDialogView.prototype = new View();
SourceDialogView.prototype.afterShow = function sdv_afterShow() {
  if (this.currentPanel) {
    this.currentPanel.show();
  }
};
SourceDialogView.prototype.handleEvent = function sd_handleEvent(evt) {
  var panelName;

  evt.preventDefault();
  if (evt.type == 'submit') {
    this.currentPanel.submit();
    return;
  }

  switch (evt.currentTarget) {
    case this.menuElement:
      panelName = evt.target.getAttribute('data-panel');
      if (!panelName || !this.panels[panelName]) {
        return;
      }

      this.showPanel(this.panels[panelName]);
      break;

    case this.selectionElement:
      panelName = evt.target.value;
      if (!panelName || !this.panels[panelName]) {
        return;
      }

      this.showPanel(this.panels[panelName]);
      break;

    case this.aboutBtnElement:
      this.app.switchUIState(this.app.UI_STATE_ABOUT_DIALOG);
      break;

    case this.startBtnElement:
    case this.loginFacebookBtnElement:
      this.currentPanel.submit();
      break;
  }
};
SourceDialogView.prototype.submit = function sd_submit(hash) {
  return this.app.pushUrlHash(hash);
};
SourceDialogView.prototype.showPanel = function sd_showPanel(panel) {
  if (this.currentPanel) {
    this.currentPanel.hide();
  }

  // XXX special handling for Facebook.
  // TODO: Update the button rendering when the permission status changes
  if (panel.name === 'facebook' && !panel.hasPermission) {
    this.startBtnElement.hidden = true;
    this.loginFacebookBtnElement.hidden = false;
  } else {
    this.startBtnElement.hidden = false;
    this.loginFacebookBtnElement.hidden = true;
  }

  panel.show();
  this.currentPanel = panel;
  if (this.app) {
    this.app.logAction('SourceDialogView::showPanel', panel.name);
  }
};
SourceDialogView.prototype.addPanel = function sd_addPanel(panel) {
  this.panels[panel.name] = panel;
  panel.menuItemElement =
    this.menuElement.querySelector('[data-panel="' + panel.name + '"]');
  panel.selectionIndex = Array.prototype.indexOf.call(
      this.menuElement.children, panel.menuItemElement.parentNode);

  if (!panel.menuItemElement) {
    throw 'menuItemElement not found.';
  }

  panel.menuItemElement.parentNode.removeAttribute('hidden');
  panel.dialog = this;

  if ('isSupported' in panel && !panel.isSupported) {
    panel.menuItemElement.parentNode.className += ' disabled';
    panel.menuItemElement.removeAttribute('data-panel');
    return;
  }

  if (!this.currentPanel) {
    this.showPanel(panel);
  }
};
