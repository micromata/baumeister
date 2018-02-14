/**
 * @file  JavaScript entry point of the project
 */

// Import the whole Bootstrap JS bundle
import 'bootstrap';

// Or just what you need to keep your vendor bundle small
// import 'bootstrap/js/dist/util';
// import 'bootstrap/js/dist/dropdown';

import './polyfills';

// Import methods from the base module
import {consoleErrorFix, ieViewportFix} from './base';

// Import our Sass entrypoint to create the CSS app bundle
import '../assets/scss/index.scss';

$(() => {
	consoleErrorFix();
	ieViewportFix();
	console.log('YaY, my first ES6-Module !!!!');
});
