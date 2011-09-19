// Simple Google API OAuth 2.0 Client flow lib
// Get access token and pass to callback

"use strict";

(function (w) {

	if (window.opener && window.opener.GO2) {
		if (window.location.hash.indexOf('access_token') !== -1) {
			window.opener.GO2.receiveToken(
				window.location.hash.replace(/^.*access_token=([^&]+).*$/, '$1'),
				parseInt(window.location.hash.replace(/^.*expires_in=([^&]+).*$/, '$1'))
			);		
			window.close();
		}

		if (window.location.search.indexOf('error=')) {
			window.opener.GO2.receiveToken('ERROR');
			window.close();
		}
	}

	var client_id,
	scope = 'https://www.googleapis.com/auth/plus.me',
	redirect_uri = window.location.href.substr(0, window.location.href.length - window.location.hash.length).replace(/#$/, ''),
	access_token,
	callbackWaitForToken;

	w.GO2 = {
		// init
		init: function (f_client_id, f_scope, f_redirect_uri) {
			if (!f_client_id) return false;
			if (f_scope) scope = f_scope;
			client_id = f_client_id;
		},
		// receive token from popup
		receiveToken: function (token, expires_in) {
			if (token !== 'ERROR') {
				access_token = token;
				if (callbackWaitForToken) callbackWaitForToken(access_token);
				setTimeout(
					function () {
						access_token = undefined;
					},
					expires_in * 1000
				);
			} else if (token === false) {
				callbackWaitForToken = undefined;
			}
		},
		// boolean, indicate logged in or not
		isLoggedIn: function () {
			return !!access_token;
		},
		// pass the access token to callback
		// if not logged in this triggers login popup; 
		// use isLoggedIn to check login first to prevent popup blocker
		getToken: function (callback) {
			if (!client_id || !redirect_uri || !scope) {
				alert('You need init() first. Check the program flow.');
				return false;
			}
			if (!access_token) {
				callbackWaitForToken = callback;
				window.open(
					'https://accounts.google.com/o/oauth2/auth'
					+ '?response_type=token'
					+ '&redirect_uri=' + encodeURIComponent(redirect_uri)
					+ '&scope=' + encodeURIComponent(scope)
					+ '&client_id=' + encodeURIComponent(client_id),
					'Google OAuth 2.0 Login window',
					'width=400,height=360'
				);
			} else {
				return callback(access_token);
			}
		}
	};
})(this);