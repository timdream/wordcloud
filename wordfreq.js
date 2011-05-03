/*!

	WordFreq text analyzer
	run articles through N-gram and Porter Stemmer in Web Workers,
	retrive list of words, or phrases.

	Currently supports Chinese (using N-gram) and English (using Porter Stemmer)

	usage:
		var wordfreq = WordFreq(options); // init
		wordfreq.processText(text, callback); // run text with WordFreq, save the result, then execute callback() when complete
		wordfreq.terminate // stop the Web Worker
		wordfreq.empty // empty results saved
		wordfreq.getList // get a list of words from results
		wordfreq.getSortedList // get a list of words, sorted by the number of appearance.
		wordfreq.analyizeVolume // (experimental) return a number that indicate the volume of words

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
	words = {},
	reps = {},
	processText = function (text, callback) {
		worker.onmessage = function (ev) {
			for (var word in ev.data.words) if (ev.data.words.hasOwnProperty(word)) {
				if (typeof words[word] !== 'number') words[word] = ev.data.words[word];
				else words[word] += ev.data.words[word];
				if (ev.data.reps[word]) {
					if (!reps[word]) reps[word] = ev.data.reps[word];
					// else TBD
				}
			};
			callback.apply(this, [ev.data.words]);
		};
		worker.postMessage(
			{
				settings: settings,
				text: text
			}
		);
	},
	terminate = function () {
		worker.terminate();
	},
	empty = function () {
		words = {};
		reps = {};
	},
	getList = function () {
		var list = [];
		for (var word in words) if (words.hasOwnProperty(word)) {
			if (words[word] < settings.mincount) continue;
			var maxRep;
			if (typeof reps[word] === 'object') {
				var c = 0;
				// https://gist.github.com/878204 by monoceroi, thanks!
				for (var rep in reps[word]) if (Object.hasOwnProperty.call(reps[word], rep)) {
					if (typeof reps[word][rep] === 'number' && reps[word][rep] > c) {
						maxRep = rep;
						c = reps[word][rep];
					}
				}
			}
			list.push([maxRep || word, words[word]]);
			maxRep = false;
		}
		return list;
	},
	getSortedList = function () {
		return getList().sort(
			function (a, b) {
				if (a[1] > b[1]) return -1;
				if (a[1] < b[1]) return 1;
				var t = [a[0], b[0]];
				t = t.sort();
				if (t[0] !== a[0]) return 1;
				return 0;
			}
		);
	},
	analyizeVolume = function () {
		var v = 0;
		for (var word in words) if (words.hasOwnProperty(word)) {
			if (words[word] < settings.mincount) continue;
			v += word.length*words[word]*words[word];
		}
		return v;
	};

	if (!settings) settings = {};
	for (var opt in options) if (options.hasOwnProperty(opt)) {
		if (typeof settings[opt] === 'undefined') settings[opt] = options[opt];
	}

	worker = new Worker(settings.worker);

	return {
		processText: processText,
		terminate: terminate,
		empty: empty,
		getList: getList,
		getSortedList: getSortedList,
		analyizeVolume: analyizeVolume
	};
};

WordFreq.supported = (window.Worker && Array.prototype.push && Array.prototype.indexOf && Array.prototype.forEach);