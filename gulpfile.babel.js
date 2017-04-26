import fs from 'fs';
import gulp from 'gulp';
import less from 'gulp-less';
import cleanCss from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import Autoprefix from 'less-plugin-autoprefix';
import eslint from 'gulp-eslint';
import imagemin from 'gulp-imagemin';
import rollup from 'gulp-rollup';
import uglify from 'gulp-uglify';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import del from 'del';
import nsp from 'gulp-nsp';
import path from 'path';
import changed from 'gulp-changed';
import concat from 'gulp-concat';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import browserifyInc from 'browserify-incremental';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import processhtml from 'gulp-processhtml';
import uncss from 'gulp-uncss';
import bootlint from 'gulp-bootlint';
import htmlmin from 'gulp-htmlmin';
import bump from 'gulp-bump';
import changelog from 'gulp-conventional-changelog';
import git from 'gulp-git';
import {settings, mainDirectories, pkgJson} from './gulp.config';

const server = browserSync.create();

function hasFlag(name) {
	return process.argv.filter(val => val.toLowerCase().indexOf(name.toLowerCase()) !== -1).length > 0;
}

function isProdBuild() {
	return hasFlag('-prod') || hasFlag('-major') || hasFlag('-minor') || hasFlag('-patch');
}

function onError(err) {
	notify({
		title: 'Gulp Task Error',
		subtitle: 'Plugin: <%= error.plugin %>',
		message: 'Check the console.'
	}).write(err);

	console.error(err.toString());

	this.emit('end');
}

export function clean() {
	if (isProdBuild()) {
		return del(mainDirectories.dist);
	}
	return del(mainDirectories.dev);
}

export function styles() {
	if (isProdBuild()) {
		return gulp.src(settings.sources.stylesEntryPoint)
			.pipe(plumber({errorHandler: onError}))
			.pipe(less({
				plugins: [new Autoprefix(settings.autoPrefix)]
			}))
			.pipe(cleanCss())
			.pipe(rename({
				baseName: 'index',
				suffix: '.min'
			}))
			.pipe(gulp.dest(settings.destinations.prod.styles))
			.pipe(rename('index.uncss.min.css'))
			.pipe(uncss({
				html: settings.sources.markup
			}))
			.pipe(gulp.dest(settings.destinations.prod.styles));
	}
	return gulp.src(settings.sources.stylesEntryPoint)
		.pipe(plumber({errorHandler: onError}))
		.pipe(sourcemaps.init())
		.pipe(less({
			plugins: [new Autoprefix(settings.autoPrefix)]
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(settings.destinations.dev.styles));
}

export function images() {
	if (isProdBuild()) {
		return gulp.src(settings.sources.images)
			.pipe(imagemin())
			.pipe(gulp.dest(settings.destinations.prod.images));
	}
	return gulp.src(settings.sources.images)
		.pipe(gulp.dest(settings.destinations.dev.images));
}

export function clientScripts() {
	if (isProdBuild()) {
		return gulp.src(settings.sources.scripts)
			.pipe(rollup({
				entry: './src/app/index.js'
			}))
			.pipe(babel())
			.pipe(uglify())
			.pipe(rename({
				baseName: 'client',
				suffix: '.min'
			}))
			.pipe(gulp.dest(settings.destinations.prod.scripts));
	}
	return gulp.src(settings.sources.scripts)
		.pipe(rollup({
			entry: './src/app/index.js'
		}))
		.pipe(babel())
		.pipe(gulp.dest(settings.destinations.dev.scripts));
}

export function vendorScripts() {
	const b = browserify({...browserifyInc.args});
	settings.sources.externalJs.forEach(dep => b.require(dep));
	browserifyInc(b, {cacheFile: './.browserify-cache.json'});

	if (isProdBuild()) {
		return b.bundle()
			.pipe(source('vendor.min.js'))
			.pipe(buffer())
			.pipe(uglify())
			.pipe(gulp.dest(settings.destinations.prod.libs));
	}
	return b.bundle()
		.pipe(source('vendor.js'))
		.pipe(buffer())
		.pipe(gulp.dest(settings.destinations.dev.libs));
}

export function bundleExternalCSS(done) {
	const files = pkgJson.bootstrapKickstart.bundleCSS.map(sourcePath => path.join('node_modules/', sourcePath));
	if (!files.length) return done();
	if (isProdBuild()) {

		return gulp.src(files)
			.pipe(cleanCss())
			.pipe(concat('libs.min.css'))
			.pipe(gulp.dest(settings.destinations.prod.libs));
	}
	return gulp.src(files)
		.pipe(concat('libs.css'))
		.pipe(gulp.dest(settings.destinations.dev.libs));
}

export function copyStaticFiles() {
	return gulp.src(settings.sources.staticFiles.map(sourcePath => path.join('node_modules/', sourcePath)), {base: 'node_modules/'})
		.pipe(gulp.dest(isProdBuild() ? settings.destinations.prod.libs : settings.destinations.dev.libs));
}

export function lint() {
	if (isProdBuild()) {
		return gulp.src([...settings.sources.scripts, './*.js'])
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(eslint.failAfterError());
	}
	return gulp.src([...settings.sources.scripts, './*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError())
		.on('error', onError);
}

export function security(done) {
	if (isProdBuild()) {
		nsp({package: path.join(__dirname, '/package.json')}, done);
	} else {
		done();
	}
}

export function processHtml() {
	if (isProdBuild()) {
		return gulp.src(settings.sources.markup)
			.pipe(processhtml())
			.pipe(htmlmin({removeComments: true, preserveLineBreaks: true, collapseWhitespace: true}))
			.pipe(gulp.dest(settings.destinations.prod.markup));
	}
	return gulp.src(settings.sources.markup)
		.pipe(changed(settings.destinations.dev.markup))
		.pipe(gulp.dest(settings.destinations.dev.markup));
}

export function lintBootstrap() {
	return gulp.src(settings.sources.markup)
		.pipe(bootlint({
			stoponerror: isProdBuild(),
			disabledIds: ['W005']
		}));
}

export function serve(done) {
	let baseDir = mainDirectories.dev;
	if (isProdBuild()) {
		baseDir = mainDirectories.dist;
	}
	server.init({
		server: {
			baseDir
		}
	});
	done();
}

function reload(done) {
	server.reload();
	done();
}

export function watch() {
	gulp.watch(settings.sources.scripts, gulp.series(clientScripts, reload));
	gulp.watch([...settings.sources.scripts, './*.js'], lint);
	gulp.watch(settings.sources.styles, gulp.series(styles, reload));
	gulp.watch(settings.sources.markup, gulp.parallel(lintBootstrap, gulp.series(processHtml, reload)));
}

export const build = gulp.series(
	clean,
	gulp.parallel(processHtml, lint, images, clientScripts, vendorScripts, styles, bundleExternalCSS, copyStaticFiles, lintBootstrap, security)
);

function bumpVersion() {
	let type;
	if (hasFlag('-major')) {
		type = 'major';
	} else if (hasFlag('-minor')) {
		type = 'minor';
	} else if (hasFlag('-patch')) {
		type = 'patch';
	} else {
		onError('Please specify release type -(major|minor|patch)');
	}
	return gulp.src('./package.json')
		.pipe(bump({type}))
		.on('error', onError)
		.pipe(gulp.dest('.'));
}

function createChangelog() {
	return gulp.src('./CHANGELOG.md', {buffer: false})
		.pipe(changelog({preset: 'angular'}))
		.pipe(gulp.dest('./'));
}

function commitChanges() {
	return gulp.src('.')
		.pipe(git.add())
		.pipe(git.commit('[Pre-Release] Bumped version number'));
}

function createTag(done) {
	const version = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
	git.tag(`${version}`, 'Created tag for version: ' + version, error => {
		if (error) return onError(error);
		done();
	});
}

export const release = gulp.series(bumpVersion, createChangelog, gulp.parallel(build, commitChanges, createTag));

const dev = gulp.series(build, serve, watch);
export default dev;
