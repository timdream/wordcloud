/*!

	WordFreq text analyzer
	run articles through N-gram and Porter Stemmer in Web Workers,
	retrive list of words, or phrases.

	Currently supports Chinese (using N-gram) and English (using Porter Stemmer)

	usage:
		var wordfreq = WordFreq(options); // init
		wordfreq.processText(text, callback); // run text with WordFreq, save the result, then execute callback() when complete
		wordfreq.terminate(); // stop the Web Worker
		wordfreq.empty(callback); // empty results saved
		wordfreq.getList(callback); // get a list of words from results
		wordfreq.getSortedList(callback); // get a list of words, sorted by the number of appearance.
		wordfreq.analyizeVolume(callback); // (experimental) return a number that indicate the volume of words

	options: 
		worker:  // path to worker.js relative to the document (not JS), subject to same origin policy.
		processCJK: // process Chinese or not
		processEnglish: // process English or not
		de_commword: // exclude stop words
		de_repetition: // for Chinese, remove phrases with smaller number of words that has same count of a longer phrase encapsulate it.
		unigram: // run Chiese with uni-gram.
		bigram: // run Chiese with bi-gram.
		trigram:
		four_gram:
		five_gram:
		six_gram:
		mincount: // minimal count for a word to be included in the list
*/

"use strict";

var WordFreq = function (settings) {

	if (!WordFreq.supported) return false;

	var worker,
	options = {
		worker: 'wordfreq.worker.js',
		processCJK: true,
		processEnglish: true,
		de_commword: true,
		de_repetition: true,
		unigram: false,
		bigram: true,
		trigram: true,
		four_gram: true,
		five_gram: true,
		six_gram: true,
		mincount: 3
	},
	callbacks = [],
	runTask = function (task) {
		return function (callback) {
			var callbackId = callbacks.length;
			callbacks[callbackId] = callback;
			worker.postMessage(
				{
					task: task,
					callbackId: callbackId
				}
			);
		};
	};

	worker = new Worker(settings.worker);

	worker.onmessage = function (ev) {
		if (typeof callbacks[ev.data.callbackId] === 'function') callbacks[ev.data.callbackId].call(this, ev.data.returnData);
		delete callbacks[ev.data.callbackId];
	};

	if (!settings) settings = {};
	for (var opt in options) if (options.hasOwnProperty(opt)) {
		if (typeof settings[opt] === 'undefined') settings[opt] = options[opt];
	}

	worker.postMessage(
		{
			task: 'init',
			settings: settings
		}
	);

	return {
		processText: function (text, callback) {
			var callbackId = callbacks.length;
			callbacks[callbackId] = callback;
			worker.postMessage(
				{
					task: 'processText',
					callbackId: callbackId,
					text: text
				}
			);
		},
		terminate: function () {
			worker.terminate();
		},
		empty: runTask('empty'),
		getList: runTask('getList'),
		getSortedList: runTask('getSortedList'),
		analyizeVolume: runTask('analyizeVolume')
	};
};

WordFreq.supported = (window.Worker && Array.prototype.push && Array.prototype.indexOf && Array.prototype.forEach);