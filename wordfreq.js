

//"use strict";

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
				if (!words[word]) words[word] = ev.data.words[word];
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
			if (reps[word]) {
				var maxRep, c = 0;
				if (typeof reps[word].hasOwnProperty !== 'function') {
					maxRep = 'hasOwnProperty'; // this happened to a JS blog ...
				} else {
					for (var rep in reps[word]) if (reps[word].hasOwnProperty(rep)) {
						if (reps[word][rep] > c) maxRep = rep;
					}
				}
			}
			list.push([maxRep || word, words[word]]);
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

WordFreq.supported = (window.Worker && Array.prototype.push && Array.prototype.indexOf);