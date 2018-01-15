import path from 'path';
import webpack from 'webpack';
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';

import {settings} from './config';
const configFile = require('../baumeister.json');

module.exports = require('./webpack.base.babel')({
	output: {
		path: path.join(__dirname, settings.destinations.prod.app),
		filename: '[name].bundle.min.js'
	},
	plugins: [
		new UglifyJSPlugin({
			uglifyOptions: {
				compress: {
					drop_console: true, // eslint-disable-line camelcase
					drop_debugger: true // eslint-disable-line camelcase
				}
			}
		}),
		new webpack.DefinePlugin({...configFile.webpack.DefinePlugin.production})
	]
});
