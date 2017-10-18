import del from 'del';
import path from 'path';

import {mainDirectories, settings} from '../config';
import {isProdBuild} from '../command-line-args';
import {clientCacheFile} from './client-scripts';
import {vendorCacheFile} from './vendor-scripts';

const browserifyCache = [
	path.join(__dirname, `/../../${clientCacheFile}`),
	path.join(__dirname, `/../../${vendorCacheFile}`)
];
/**
 * Delete output directories
 */
function clean() {
	if (isProdBuild()) {
		return del([
			...browserifyCache,
			mainDirectories.dist,
			settings.destinations.handlebars
		]);
	}
	return del([
		...browserifyCache,
		mainDirectories.dev,
		settings.destinations.handlebars
	]);
}

export default clean;
