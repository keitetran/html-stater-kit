/**
 * Project Name: html-stater-kit
 * Description: Stater kit for html project
 * Creator: Tran Ngoc Anh
 * Email: tran.ngoc.anh@infogram.co.jp
 */

var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var gulpIf = require('gulp-if');

// Copy required plugin file
gulp.task('copy-required-file', ['images', 'javascript'], function () {
	// Copying CSS to /dist
	gulp.src([
		'node_modules/bootstrap/dist/css/bootstrap.min.css'
	]).pipe(gulp.dest("dist/plugins/css"));

	// Copying Fonts to /dist
	gulp.src([
		//'node_modules/font-awesome/fonts/*',
	]).pipe(gulp.dest("dist/plugins/fonts"));

	// Copying image to /dist
	gulp.src([
		//'node_modules/font-awesome/fonts/*',
	]).pipe(gulp.dest("dist/plugins/images"));

	// Copying javascript to /dist
	gulp.src([
		'node_modules/jquery/dist/jquery.min.js',
		'node_modules/popper.js/dist/umd/popper.min.js',
		'node_modules/bootstrap/dist/js/bootstrap.min.js'
	]).pipe(gulp.dest("dist/plugins/js"));
});

// Compile SCSS into CSS
gulp.task('scss', function () {
	var sass = require('gulp-sass');
	var postcss = require('gulp-postcss');
	var autoprefixer = require('autoprefixer');

	var postcss_opts = [
		autoprefixer({
			browsers: ['last 5 version']
		})
	];

	return gulp.src(['src/scss/app.scss'])
		.pipe(sass())
		.pipe(postcss(postcss_opts)) // Parse CSS and add vendor prefixes to rules
		.pipe(gulp.dest('dist/assets/css'))
		.pipe(browserSync.stream());
});

// Copying images to /dist
gulp.task('images', function () {
	return gulp.src('src/images/**/*').pipe(gulp.dest("dist/assets/images"));
});

// Copying javascript to /dist
gulp.task('javascript', function () {
	return gulp.src('src/js/**/*').pipe(gulp.dest("dist/assets/js"));
});

// Compile Html file to /dist
gulp.task('html', function () {
	var fileinclude = require('gulp-file-include');
	return gulp.src(['src/*.html'])
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		})).pipe(gulp.dest('dist'))
		.pipe(browserSync.stream());
});

// Clean /dist folder
gulp.task('clean', function () {
	var del = require('del');
	return del.sync('dist');
});

// Static Server + watching scss/html/assets
gulp.task('default', function (callback) {
	// Run task
	runSequence('copy-required-file', 'scss', 'html', callback);

	// Init server 
	browserSync.init({
		server: "./dist"
	});

	// watch file state change
	gulp.watch(['src/scss/*'], ['scss']);
	gulp.watch(['src/images/**/*', 'src/js/**/*'], ['images', 'javascript']);
	gulp.watch(['src/*.html', 'src/shared/*.html'], ['html']);

	// Push event reload to browser
	gulp.on('change', browserSync.reload);
});

// Build project
gulp.task('build', function () {
	runSequence('clean', ['copy-required-file', 'scss', 'html'], 'compress', 'comments');
});


// Compress CSS and JS
gulp.task('compress', function () {
	var uglify = require('gulp-uglify');
	var cssnano = require('gulp-cssnano');
	var useref = require('gulp-useref');

	return gulp.src('dist/*.html')
		.pipe(useref())
		.pipe(gulpIf('*.js', uglify()))
		.pipe(gulpIf('*.css', cssnano()))
		.pipe(gulp.dest('dist'));
});

// Add header file comment
gulp.task('comments', function () {
	var headerComment = require('gulp-header-comment');
	var headerCommentTemp = `
		Project Name: <%= pkg.name %>
		Description: <%= pkg.description %>
		Creator: <%= pkg.author %>
		Email: <%= pkg.email %>
	`;
	gulp.src('dist/**/*')
		.pipe(gulpIf('*.js', headerComment(headerCommentTemp)))
		.pipe(gulpIf('*.css', headerComment(headerCommentTemp)))
		.pipe(gulpIf('*.html', headerComment(headerCommentTemp)))
		.pipe(gulp.dest('dist/'))
});