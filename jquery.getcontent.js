"use strict";

(function ($) {
$.getContent = function (source, options) {
	var settings = {
		type: 'auto',
		beforeComplete: $.noop,
		complete: $.noop,
		googleOAuthKey: '',
		googleAPIKey: '',
		encoding: 'UTF-8', // Text encoding
		num: -1, // feed num
		timeout: 25 * 1000
	},
	timer,
	canceled = false,
	processFeedByDomain = {
		'pixnet.net': function (str, strType) {
			return str.replace(/\(.+?\.\.\.\)/g, '');
		},
		'wretch.cc': function (str, strType) {
			return str.replace(/本篇文章引用自此/g, '');
		}
	},
	pass = function (str, strType) {
		return str;
	},
	beforeComplete = function (str) {
		if (canceled) return;
		settings.beforeComplete(str);
	},
	complete = function (str) {
		if (canceled) return;
		clearTimeout(timer);
		settings.complete(str);
	},
	getFeedText = function () {
		return $.getJSON(
			'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&scoring=h&num=' + settings.num.toString(10) + '&q=' + encodeURIComponent(source),
			function (data, status) {
				if (!data.responseData) {
					complete('');
					return;
				}

				beforeComplete(data.responseData.feed.title);
				var text = [],
				process = processFeedByDomain[source.match(/(\w+.\w+)\//)[1].toLowerCase()] || pass;

				data.responseData.feed.entries.forEach(
					function (entry) {
						text.push(process(entry.title, 'title'));
						text.push(process(entry.content, 'content').replace(/<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig, ''));
					}
				);
				text = text.join('\n');
				setTimeout(
					function () {
						complete(text);
					},
					0
				);
			}
		);
	},
	getHTMLText = function () {
		$.getJSON(
			'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22' + encodeURIComponent(source) + '%22&format=json&diagnostics=true&callback=?',
			function (data, status) {
				if (!data.query.results) {
					complete('');
					return;
				}
				beforeComplete('');
				var text = [];
				
				parseYQLElementObject(text, data.query.results);
				text = text.join('\n');
				setTimeout(
					function () {
						complete(text);
					},
					0
				);
			}
		);
	},
	getFbText = function () {
		var text = [],
		statusQuery = FB.Data.query('select message from status where uid = {0}', source),
		noteQuery = FB.Data.query('select content,title from note where uid = {0}', source),
		linkQuery = FB.Data.query('select owner_comment from link where owner = {0}', source);

		FB.Data.waitOn(
			[statusQuery, noteQuery, linkQuery],
			function() {
				beforeComplete('');
				statusQuery.value.forEach(
					function (row) {
						text.push(row.message);
					}
				);
				noteQuery.value.forEach(
					function (row) {
						text.push(row.content.replace(/<[^>]+?>|<script.+?\/script\>/ig, ''));
						text.push(row.title);
					}
				);
				linkQuery.value.forEach(
					function (row) {
						text.push(row.owner_comment);
					}
				);
				text = text.join('\n');
				setTimeout(
					function () {
						complete(text);
					},
					0
				);
			}
		);
	},
	getGooglePlusText = function () {
		if (source === 'me' && settings.googleOAuthKey === '') complete(''); // 'me' need key
		var url = 'https://www.googleapis.com/plus/v1/people/' + source + '/activities/public?maxResults=100&alt=json&pp=1&callback=?';
		if (settings.googleAPIKey) url += '&key=' + settings.googleAPIKey;
		if (settings.googleOAuthKey) url += '&access_token=' + settings.googleOAuthKey;

		$.getJSON(
			url,
			function (data, status) {
				if (data.error || !data.title) {
					complete('');
					return;
				}

				beforeComplete(data.title);
				var text = [];
				data.items.forEach(
					function (item) {
						text.push(item.object.content.replace(/<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig, ''));
					}
				);

				text = text.join('\n');
				setTimeout(
					function () {
						complete(text);
					},
					0
				);
			}
		);
	},
	parseYQLElementObject = function (text, obj) {
		// TBD, properly exclude script
		for (var key in obj) if (obj.hasOwnProperty(key)) {
			if (key === 'script' || key === 'style') continue;
			else if (key === 'content') text.push(obj[key]);
			else if (typeof obj[key] === 'object' && key !== 'script' && key !== 'style') parseYQLElementObject(text, obj[key]);
		}
	},
	getFileText = function (stripHTML) {
		// we read and process file one at a time, no place to fire beforeComplete()
		beforeComplete();
		var text = [], i = source.length - 1;
		handleFile(text, i, stripHTML);
	},
	handleFile = function (text, i, stripHTML) {
		var reader = new FileReader(),
		file = source[i];
		reader.onloadend = function (ev) {
			if (!i--) {
				text = text.join('\n');
				setTimeout(
					function () {
						complete(text);
					},
					0
				);
			} else {
				handleFile(text, i, stripHTML);
			}
		};
		reader.onload = function (ev) {
			if (stripHTML) {
				text.push(ev.target.result.replace(/<[^>]+?>|<script.+?\/script\>/ig, ''));
			} else {
				text.push(ev.target.result);
			}
		};
		reader.readAsText(file, settings.encoding);
	};

	if (options) { 
		$.extend(settings, options);
	}

	if (settings.type === 'auto') {
		if (typeof source !== 'string') {
			settings.type = 'file.text';
		} else if (/(feed|rss|xml)/.test(source)) {
			settings.type = 'feed';
		} else {
			settings.type = 'html';
		}
	}
		
	// replace Safari/Webkit style feed: URL
	if (settings.type === 'feed') {
		source = source.replace(/^feed:/i, 'http:');
	}

	if (settings.timeout > 0) {
		timer = setTimeout(
			function () {
				canceled = true;
				settings.complete('');
			},
			settings.timeout
		);
	}

	switch (settings.type) {
		case 'feed':
		return getFeedText();
		break;
		case 'html':
		return getHTMLText();
		break;
		case 'file':
		case 'file.text':
		return getFileText(false);
		break;
		case 'file.html':
		return getFileText(true);
		break;
        case 'facebook':
        return getFbText();
        break;
        case 'googleplus':
        return getGooglePlusText(); 
        break;
        default:
        complete('');
        break;
	}
};

$.getContent.feedSupported = !!Array.prototype.forEach;
$.getContent.htmlSupported = true;
$.getContent.fbSupported = !!Array.prototype.forEach;
$.getContent.fileSupported = !!window.FileReader;
$.getContentSupported = (
	$.getContent.feedSupported
	&& $.getContent.htmlSupported
	&& $.getContent.fileSupported
	&& $.getContent.fbSupported
);

})(jQuery);
