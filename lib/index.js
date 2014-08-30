'use strict';

var debug = require('debug')('metalsmith-publish');

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Metalsmith plugin that adds support for draft, private, and future-dated posts.
 *
 * In metadata:
 *     publish: draft
 *     publish: private
 *     publish: 2021-12-21
 *
 * @param {Object} opts (optional)
 * @option {Boolean} draft whether to publish draft posts (default: false)
 * @option {Boolean} private whether to publish private posts (default: false)
 * @option {Boolean} future whether to publish future-dated posts (default: false)
 * @option {Function} alert callback (futureFiles, metalsmith, done) so you can future-pace rebuild via cron job or whatever
 * @return {Function}
 */

function plugin(opts) {
	if (typeof opts !== 'object') {
		opts = {};
	}

	return function (files, metalsmith, done) {
		var futureFiles = {};

		Object.keys(files).forEach(function (file) {
			debug('analyzing publish state for %s', file);
			var data = files[file];
			var pub = data.publish;

			if (!pub) {
				return;
			}

			if ((pub == 'draft' && !opts.draft) || (pub == 'private' && !opts.private)) {
				return delete files[file];
			}

			if (new Date(pub).getTime() > Date.now() && !opts.future) {
				futureFiles[file] = data;
				return delete files[file]
			}
		});

		if (typeof opts.alert == 'string') {
			opts.alert = new Function(opts.alert);
		}

		if (typeof opts.alert == 'function') {
			debug('calling alert callback for %s files', futureFiles.length);
			opts.alert(futureFiles, metalsmith, done);
		} else {
			done();
		}
	};
}