if (typeof window !== "undefined") window.global = window.global || window;
(function() {
	var __emptyPromise = [function() {}, function() {}];

	////////////////////////////////////////////////////////////////////
	// Global universal require()

	function requireFactory() {
		function require(request) {
			var requiredModule = require.cache[request];
			if (
				typeof requiredModule === "object" &&
				requiredModule.__webpackPromise
			) {
				throw new Error("Module is still loading");
			}
			if (typeof requiredModule === "undefined") {
				throw new Error("Cannot find module '" + request + "'");
			}
			return requiredModule;
		}
		require.cache = {};
		require.load = function load(request) {
			var requiredModule = require.cache[request];
			// a Promise means "currently loading".
			if (
				typeof requiredModule === "object" &&
				requiredModule.__webpackPromise
			) {
				return requiredModule;
			}
			if (typeof requiredModule === "undefined") {
				// setup Promise in requests cache
				var __webpackPromise = [];
				var promise = new Promise(function(resolve, reject) {
					__webpackPromise.push(resolve);
					__webpackPromise.push(reject);
				});
				__webpackPromise.push(promise);
				promise.__webpackPromise = __webpackPromise;
				require.cache[request] = promise;

				// start request loading
				var head = document.getElementsByTagName("head")[0];
				var script = document.createElement("script");
				script.charset = "utf-8";
				script.timeout = 120;
				if (require.nonce) {
					script.setAttribute("nonce", require.nonce);
				}
				script.src = "/" + request;
				var timeout = setTimeout(function() {
					onScriptError({ type: "timeout", target: script });
				}, 120000);
				script.onload = onScriptLoad;
				script.onerror = onScriptError;
				// eslint-disable-next-line no-inner-declarations
				function onScriptLoad(event) {
					// avoid mem leaks in IE.
					script.onerror = script.onload = null;
					clearTimeout(timeout);
				}
				// eslint-disable-next-line no-inner-declarations
				function onScriptError(event) {
					// avoid mem leaks in IE.
					script.onerror = script.onload = null;
					clearTimeout(timeout);
					var requiredModule = require.cache[request];
					if (
						typeof requiredModule === "object" &&
						requiredModule.__webpackPromise
					) {
						var errorType =
							event && (event.type === "load" ? "missing" : event.type);
						var realSrc = event && event.target && event.target.src;
						var error = new Error(
							"Loading module '" +
								request +
								"' failed.\n(" +
								errorType +
								": " +
								realSrc +
								")"
						);
						error.type = errorType;
						error.request = realSrc;
						requiredModule.__webpackPromise[1](error);
						require.cache[request] = undefined;
					}
				}
				head.appendChild(script);
				return promise;
			}
			promise = Promise.resolve();
			promise.__webpackPromise = __emptyPromise;
			return promise;
		};
		return require;
	}

	/**
	 * webpackUniversal factory
	 *
	 * @param {Object} options Receives options
	 *     options.u  -> __webpackUniversal__
	 *     options.r  -> __webpack_require__
	 *     options.m  -> modules
	 *     options.s  -> scriptSrc
	 *     options.i  -> installedChunks
	 *     options.e  -> deferredModules
	 *     options.pl -> chunkPreloadMap
	 *     options.pf -> chunkPrefetchMap
	 *     options.d  -> dependencies
	 * @returns {Promise} Promise for signaling load
	 */
	function webpackUniversalFactory(options) {
		// install a JSONP callback for chunk loading
		function webpackJsonpCallback(data) {
			var chunkIds = data[0];
			var moreModules = data[1];
			var executeModules = data[2];
			// add "moreModules" to the modules object,
			// then flag all "chunkIds" as loaded and fire callback
			var moduleId,
				chunkId,
				resolves = [];
			for (var i = 0; i < chunkIds.length; i++) {
				chunkId = chunkIds[i];
				if (options.i[chunkId]) {
					resolves.push(options.i[chunkId][0]);
				}
				options.i[chunkId] = 0;
			}
			for (moduleId in moreModules) {
				if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
					options.m[moduleId] = moreModules[moduleId];
				}
			}
			if (parentJsonpFunction) parentJsonpFunction(data);
			while (resolves.length) {
				resolves.shift()();
			}

			// add entry modules from loaded chunk to deferred list
			options.e.push.apply(options.e, executeModules || []);

			// run deferred modules when all chunks ready
			return checkDeferredModules();
		}

		function checkDeferredModules() {
			var result;
			for (var i = 0; i < options.e.length; i++) {
				var deferredModule = options.e[i];
				var fulfilled = true;
				for (var j = 1; j < deferredModule.length; j++) {
					var depId = deferredModule[j];
					if (options.i[depId] !== 0) fulfilled = false;
				}
				if (fulfilled) {
					options.e.splice(i--, 1);
					result = options.r((options.r.s = deferredModule[0]));
				}
			}
			return result;
		}

		function loadDependencies() {
			/**
			 * This function returns a promise which is resolved once the module
			 * with all it's dependencies is loaded.
			 * It also adds the final module to the require() cache.
			 */
			var promises = [];
			for (i = 0; i < options.d.length; i++) {
				promises.push(global.require.load(options.d[i]));
			}
			var request = options.r.cp;
			var promise = Promise.all(promises);
			var requiredModule = global.require.cache[request];
			if (
				typeof requiredModule === "object" &&
				requiredModule.__webpackPromise
			) {
				promise.__webpackPromise = requiredModule.__webpackPromise;
			} else {
				promise.__webpackPromise = __emptyPromise;
			}
			global.require.cache[request] = promise;
			promise.then(function() {
				var requiredModule = global.require.cache[request];
				try {
					global.require.cache[request] = checkDeferredModules();
					if (
						typeof requiredModule === "object" &&
						requiredModule.__webpackPromise
					) {
						requiredModule.__webpackPromise[0]();
					}
				} catch (error) {
					global.require.cache[request] = undefined;
					if (
						typeof requiredModule === "object" &&
						requiredModule.__webpackPromise
					) {
						requiredModule.__webpackPromise[1](error);
					}
				}
			});
			return global.require.cache[request];
		}

		// script path function
		function requireScriptSrc(chunkId) {
			return "./" + options.r.p + "" + options.s(chunkId);
		}

		function jsonpScriptSrc(chunkId) {
			return "/" + options.r.p + "" + options.s(chunkId);
		}

		// This file contains only the entry chunk.
		// The chunk loading function for additional chunks
		options.r.e = function requireEnsure(chunkId) {
			var promises = [];

			var installedChunkData = options.i[chunkId];
			// 0 means "already installed".
			// a Promise means "currently loading".

			// require() chunk loading for javascript
			if (typeof window === "undefined") {
				if (installedChunkData !== 0) {
					var chunk = require(requireScriptSrc(chunkId));
					options.u.jsonp = options.u.jsonp || [];
					options.u.jsonp.push(chunk);
				}
				return Promise.all(promises);
			}

			// JSONP chunk loading for javascript
			if (installedChunkData !== 0) {
				if (installedChunkData) {
					promises.push(installedChunkData[2]);
				} else {
					// setup Promise in chunk cache
					var promise = new Promise(function(resolve, reject) {
						installedChunkData = options.i[chunkId] = [resolve, reject];
					});
					promises.push((installedChunkData[2] = promise));

					// start chunk loading
					var head = document.getElementsByTagName("head")[0];
					var script = document.createElement("script");

					script.charset = "utf-8";
					script.timeout = 120;

					if (options.r.nc) {
						script.setAttribute("nonce", options.r.nc);
					}
					script.src = jsonpScriptSrc(chunkId);
					var timeout = setTimeout(function() {
						onScriptComplete({ type: "timeout", target: script });
					}, 120000);
					script.onerror = script.onload = onScriptComplete;
					// eslint-disable-next-line no-inner-declarations
					function onScriptComplete(event) {
						// avoid mem leaks in IE.
						script.onerror = script.onload = null;
						clearTimeout(timeout);
						var chunk = options.i[chunkId];
						if (chunk !== 0) {
							if (chunk) {
								var errorType =
									event && (event.type === "load" ? "missing" : event.type);
								var realSrc = event && event.target && event.target.src;
								var error = new Error(
									"Loading chunk " +
										chunkId +
										" failed.\n(" +
										errorType +
										": " +
										realSrc +
										")"
								);
								error.type = errorType;
								error.request = realSrc;
								chunk[1](error);
							}
							options.i[chunkId] = undefined;
						}
					}
					head.appendChild(script);
				}

				// chunk preloading for javascript
				var chunkPreloadData = options.pl[chunkId];
				if (chunkPreloadData) {
					head = document.getElementsByTagName("head")[0];
					chunkPreloadData.forEach(function(chunkId) {
						if (options.i[chunkId] === undefined) {
							options.i[chunkId] = null;
							var link = document.createElement("link");

							link.charset = "utf-8";

							if (options.r.nc) {
								link.setAttribute("nonce", options.r.nc);
							}
							link.rel = "preload";
							link.as = "script";
							link.href = jsonpScriptSrc(chunkId);
							head.appendChild(link);
						}
					});
				}

				// chunk prefetching for javascript

				var chunkPrefetchData = options.pf[chunkId];
				if (chunkPrefetchData) {
					Promise.all(promises).then(function() {
						var head = document.getElementsByTagName("head")[0];
						chunkPrefetchData.forEach(function(chunkId) {
							if (options.i[chunkId] === undefined) {
								options.i[chunkId] = null;
								var link = document.createElement("link");
								link.rel = "prefetch";
								link.href = jsonpScriptSrc(chunkId);
								head.appendChild(link);
							}
						});
					});
				}
			}

			return Promise.all(promises);
		};

		// on error function for async loading
		options.r.oe = function onError(err) {
			if (process && process.nextTick) {
				process.nextTick(function() {
					throw err; // catch this error by using import().catch()
				});
			} else {
				console.error(err);
				throw err; // catch this error by using import().catch()
			}
		};

		options.u.jsonp = options.u.jsonp || [];
		var oldJsonpFunction = options.u.jsonp.push.bind(options.u.jsonp);
		options.u.jsonp.push = webpackJsonpCallback;
		var jsonpArray = options.u.jsonp.slice();
		for (var i = 0; i < jsonpArray.length; i++) {
			webpackJsonpCallback(jsonpArray[i]);
		}
		var parentJsonpFunction = oldJsonpFunction;

		if (parentUniversalFunction) parentUniversalFunction(options);

		// run deferred modules when all chunks ready
		return loadDependencies();
	}

	// install a global require()
	global.require = global.require || requireFactory();

	// install a callback for universal modules loading
	global.webpackUniversal = global.webpackUniversal || [];
	var oldUniversalFunction = global.webpackUniversal.push.bind(
		global.webpackUniversal
	);
	global.webpackUniversal.push = webpackUniversalFactory;
	var universalArray = global.webpackUniversal.slice();
	for (var i = 0; i < universalArray.length; i++) {
		webpackUniversalFactory(universalArray[i]);
	}
	var parentUniversalFunction = oldUniversalFunction;

	if (typeof module !== "undefined") module.exports = global.webpackUniversal;
})();