/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/web/JsonpChunkTemplatePlugin.js
	and partially from webpack/lib/node/NodeNodeTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";

const { ConcatSource } = require("webpack-sources");

class UniversalChunkTemplatePlugin {
	constructor(universal) {
		this.universal = universal;
	}

	apply(chunkTemplate) {
		chunkTemplate.hooks.render.tap(
			"UniversalChunkTemplatePlugin",
			(modules, chunk) => {
				const source = new ConcatSource();
				source.add(
					`__webpackUniversal__.jsonp.push([${JSON.stringify(chunk.ids)},`
				);
				source.add(modules);
				const entries = [chunk.entryModule].filter(Boolean).map(m =>
					[m.id].concat(
						Array.from(chunk.groupsIterable)[0]
							.chunks.filter(c => c !== chunk)
							.map(c => c.id)
					)
				);
				if (entries.length > 0) {
					source.add(`,${JSON.stringify(entries)}`);
				}
				source.add("])");
				return new ConcatSource(
					'if (typeof window !== "undefined") window.global = window.global || window;\n',
					"(function(__webpackUniversal__) {\n",
					"__webpackUniversal__.jsonp = __webpackUniversal__.jsonp || [];\n",
					source,
					';\nif (typeof module !== "undefined") module.exports = __webpackUniversal__.jsonp',
					`;\n})(global.${this.universal} = global.${this.universal} || {})`,
				);
			}
		);
		chunkTemplate.hooks.hash.tap("UniversalChunkTemplatePlugin", hash => {
			hash.update("UniversalChunkTemplatePlugin");
			hash.update("1");
			hash.update(this.universal);
		});
	}
}
module.exports = UniversalChunkTemplatePlugin;
