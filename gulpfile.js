/**
 * Project Name: html-stater-kit
 * Description: Stater kit for html project
 * Creator: Tran Ngoc Anh
 * Email: tran.ngoc.anh@infogram.co.jp
 */
const path = require("path");
const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const runSequence = require("run-sequence");
const gulpIf = require("gulp-if");
const concat = require("gulp-concat");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const headerComment = require("gulp-header-comment");
const uglify = require("gulp-uglify");
const cssnano = require("gulp-cssnano");
const useref = require("gulp-useref");
const fileinclude = require("gulp-file-include");
const del = require("del");
const inject = require('gulp-inject');
const settings = {
	outputDir: "./dist",
	debounceDelay: 1000,
	plugins: {
		css: [
			"node_modules/sweetalert2/dist/sweetalert2.min.css",
			"./src/plugins/**/*.css"
		],
		js: [
			"node_modules/jquery/dist/jquery.min.js",
			"node_modules/popper.js/dist/umd/popper.min.js",
			"node_modules/bootstrap/dist/js/bootstrap.min.js",
			"node_modules/sweetalert2/dist/sweetalert2.min.js",
			"./src/plugins/**/*.js"
		],
		fonts: [],
		images: []
	},
	autoprefixer: {
		browsers: ["last 5 version"]
	},
	sass: {
		outputStyle: "compressed"
	},
	fileHeaderComment: `
		Project Name: <%= pkg.name %>
		Description: <%= pkg.description %>
		Creator: <%= pkg.author %>
		Email: <%= pkg.email %>
	`,
	fileinclude: {
		prefix: "@@",
		basepath: "@file"
	},
};

/**
 * Inject resource to html file
 */
let injectContentToHtml = [
	path.join(settings.outputDir, 'plugins/css/bootstrap.min.css')
];
settings.plugins.js.forEach(item => {
	if (item.indexOf("node_modules/") > -1) {
		let file = path.parse(item);
		injectContentToHtml.push(path.join(settings.outputDir, `plugins/js/${file.name}${file.ext}`));
	}
});
settings.plugins.css.forEach(item => {
	if (item.indexOf("node_modules/") > -1) {
		let file = path.parse(item);
		injectContentToHtml.push(path.join(settings.outputDir, `plugins/css/${file.name}${file.ext}`));
	}
});

fs.readdirSync("./src/plugins").forEach(file => {
	let fileInfo = path.parse(path.join("./src/plugins", file));
	if (fileInfo.ext == ".js") injectContentToHtml.push(path.join(settings.outputDir, "plugins/js/" + file));
});

injectContentToHtml = injectContentToHtml.concat([
	path.join(settings.outputDir, 'assets/js/*.js'),
	path.join(settings.outputDir, 'assets/css/*.css')
]);


/**
 * Desploy file to folder
 * @param {Folder to dest} dir 
 */
const destToDir = (dir) => {
	return gulp.dest(path.join(settings.outputDir, dir))
}

/**
 * Copy required plugin file
 */
gulp.task("copy-plugin-file", () => {
	// Copying CSS
	gulp.src(settings.plugins.css).pipe(destToDir("plugins/css"));

	// Copying Fonts
	gulp.src(settings.plugins.fonts).pipe(destToDir("plugins/fonts"));

	// Copying image
	gulp.src(settings.plugins.images).pipe(destToDir("plugins/images"));

	// Copying javascript
	gulp.src(settings.plugins.js).pipe(destToDir("plugins/js"));
});

// Compile Bootstrap SCSS into CSS
gulp.task("bootstrap", () => {
	return gulp
		.src(["./src/scss/bootstrap.scss"])
		.pipe(sass(settings.sass))
		.pipe(postcss([autoprefixer(settings.autoprefixer)]))
		.pipe(concat("bootstrap.min.css"))
		.pipe(destToDir("plugins/css"))
		.pipe(browserSync.stream());
});

// Compile SCSS into CSS
gulp.task("scss", () => {
	return gulp
		.src(["./src/scss/styles.scss"])
		.pipe(sass())
		.pipe(postcss([autoprefixer(settings.autoprefixer)]))
		.pipe(concat("styles.css"))
		.pipe(destToDir("assets/css"))
		.pipe(browserSync.stream());
});

// Copying images
gulp.task("images", () => {
	return gulp
		.src("./src/images/**/*")
		.pipe(destToDir("assets/images"))
		.pipe(browserSync.stream());
});

// Copying javascript
gulp.task("javascript", () => {
	return gulp
		.src("./src/js/**/*")
		.pipe(destToDir("assets/js"))
		.pipe(browserSync.stream());
});

// Compile Html file
gulp.task("html", () => {
	let source = gulp.src(injectContentToHtml, {
		read: false
	});

	return gulp
		.src(["./src/*.html"])
		.pipe(fileinclude(settings.fileinclude))
		.pipe(inject(source))
		.pipe(gulp.dest(settings.outputDir))
		.pipe(browserSync.stream());
});

// Clean build folder
gulp.task("clean", () => {
	return del.sync(settings.outputDir);
});

// Compress CSS and JS
gulp.task("compress", () => {
	return gulp
		.src(path.join(settings.outputDir, "/*.html"))
		.pipe(useref())
		.pipe(gulpIf("*.js", uglify()))
		.pipe(gulpIf("*.css", cssnano()))
		.pipe(gulp.dest(settings.outputDir));
});

// Add header file comment
gulp.task("comments", () => {
	gulp
		.src(path.join(settings.outputDir, "/**/*"))
		.pipe(gulpIf("*.js", headerComment(settings.fileHeaderComment)))
		.pipe(gulpIf("*.css", headerComment(settings.fileHeaderComment)))
		.pipe(gulpIf("*.html", headerComment(settings.fileHeaderComment)))
		.pipe(gulp.dest(settings.outputDir));
});

gulp.task("watch", () => {
	gulp.watch("src/scss/**/*.scss", ["scss"]);
	gulp.watch(["src/scss/_variable.scss", "src/scss/bootstrap.scss"], ["bootstrap"]);
	gulp.watch("src/images/**/*", ["images"]);
	gulp.watch("src/js/**/*.js", ["javascript"]);
	gulp.watch("src/**/*.html", ["html"]);
});

// browserSync
gulp.task("browserSync", (callback) => {
	// Init server
	browserSync.init({
		server: settings.outputDir,
		open: false
	});

	// Push event reload to browser
	gulp.on("change", browserSync.reload);

	callback();
});

// Static Server + watching scss/html/assets
gulp.task("default", ["clean"], (callback) => {
	// Run task
	runSequence(
		"copy-plugin-file",
		"images",
		"javascript",
		"bootstrap",
		"scss",
		"html",
		"watch",
		"browserSync",
		callback
	);
});

// Build project
gulp.task("build", (callback) => {
	runSequence(
		"clean",
		["copy-plugin-file", "images", "javascript", "bootstrap", "scss", "html"],
		"compress",
		"comments",
		callback
	);
});