if (!window.Worker || window.forceIframeWorker) {
	if (window.Worker) window.nativeWorker = window.Worker;
	window.Worker = function (script) {
		var worker = this;

		// prepare and inject iframe
		worker._iframeEl = document.createElement('iframe');
		worker._iframeEl.style.visibility = 'hidden';
		worker._iframeEl.style.width = '1px';
		worker._iframeEl.style.height = '1px';
		worker._iframeEl.onload = worker._iframeEl.onreadystatechange = function () {
			if (this.readyState && this.readyState !== "loaded" && this.readyState !== "complete") return;
			worker._iframeEl.onload = worker._iframeEl.onreadystatechange = null;
			var w = this.contentWindow,
			doc = this.contentWindow.document;
			
			// Some interfaces within the Worker scope.
			
			w.Worker = window.Worker; // yes, worker could spawn another worker!
			w.onmessage = function (ev) {}; // placeholder function
			var postMessage = function (data) {
				if (typeof worker.onmessage === 'function') {
					worker.onmessage.call(
						worker,
						{
							currentTarget: worker,
							timeStamp: (new Date()).getTime(),
							srcElement: worker,
							target: worker,
							data: data
						}
					);
				}
			};
			w.postMessage = w.workerPostMessage = postMessage;
			if (w.postMessage !== postMessage) {
				// IE doesn't allow overwriting postMessage
			}
			w.close = function () {
				worker.terminate();
			};
			w.importScripts = function () {
				for (var i = 0; i < arguments.length; i++) {
					var scriptEl = doc.createElement('script');
					scriptEl.src = window.Worker.baseURI + script;
					scriptEl.type = 'text/javascript';
					doc.body.appendChild(scriptEl);
				}
			}

			// inject worker script into iframe			
			var scriptEl = doc.createElement('script');
			scriptEl.src = window.Worker.baseURI + script;
			scriptEl.type = 'text/javascript';
			scriptEl.onload = function () {
				worker._quere.push = function (callback) {
					if (!worker._unloaded) {
						callback();
					}
				};
				if (!worker._unloaded) {
					while (worker._quere.length) {
						(worker._quere.shift())();
					}
				}
			};
			doc.body.appendChild(scriptEl);
		};
		this._iframeEl.src = window.Worker.iframeURI;
		(document.getElementsByTagName('head')[0] || document.body).appendChild(this._iframeEl);
		
		worker._quere = [];
		worker._unloaded = false;
	};
	window.Worker.prototype.postMessage = function (obj) {
		var worker = this;
		setTimeout(
			function () {
				worker._quere.push(
					function () {
						worker._iframeEl.contentWindow.onmessage({data:obj});
					}
				);
			},
			0
		);
	};
	window.Worker.prototype.terminate = function () {
		if (!this._unloaded) {
			(document.getElementsByTagName('head')[0] || document.body).removeChild(this._iframeEl);
		}
		this._iframeEl = null;
		this._unloaded = true;
	};
	window.Worker.prototype.addEventListener = function () {
	};
	window.Worker.prototype.removeEventListener = function () {
	};
	
	window.Worker.notNative = true;
	window.Worker.iframeURI = './worker.iframe.html';
	window.Worker.baseURI = '';
}