/***************************************************
*                       SMUSHERS
****************************************************
*
*   About:  Makes files as small as possible for
*           transport <strike>by avian carriers
*           </strike> over the wire.
*
****************************************************/
'use strict';


// Minify <HTML>
var minifyHTML = function (markup) {
    var minify = require('html-minifier').minify,
        minified = minify(markup, {
            collapseWhitespace  : true,
            removeComments      : true
        });

    minify = null;

    return minified;
};


// Minify CSS
var minifyCSS = function (css) {
    var cleanCSS = require('clean-css'),
        minified = new cleanCSS().minify(css).styles;

    cleanCSS = null;

    return minified;
};


// Minify JS
var minifyJS = function (js) {
    var uglify = require('uglify-js'),
        minified = uglify.minify(js, {fromString: true}).code;

    uglify = null;

    return minified;
};


// gZip a file
var compressAsset = function (fileName, outputFileName) {
    var input = fs.createReadStream(fileName),
        output = fs.createWriteStream((outputFileName || fileName) + '.gz');

    input.pipe(zlib.createGzip()).pipe(output);
};


// Find and gzip static contents
var gzipStaticContents = function (path) {
    var zlib,
        fs;

    if (!path) {
        console.log('Smushers wasn\'t give a directory to smush :(');
        return;
    }

    zlib = require('zlib');
    fs = require('fs');

    // Sync file read
    var readFileSync = function (fileName) {
        return fs.readFileSync(fileName).toString();
    };

    // Sync file write
    var writeFileSync = function (fileName, contents) {
        fs.writeFileSync(fileName, contents);
    };

    // Delete file
    var deleteFile = function (fileName, callback) {
        fs.unlink(fileName, function (err) {
            if (err) {
                console.log(err);
                return;
            }

            if (callback) {
                callback(err, fileName);
            }
        });
    };

    // Find, minify and compress suitable files
    var compressStaticAssets = function (folder) {
        var canCompress = ['css', 'html', 'htm', 'js', 'json', 'svg', 'txt'];

        traverseFileSystem(folder, function (currentFile, currentPath) {
            var fName = currentFile.split('.'),
                extension = fName[fName.length - 1].toLowerCase(),
                outputFileName = currentFile,
                deleteTemp = false,
                source;

            if (fName && fName.length > 0 && extension) {
                if (canCompress.indexOf(extension) > -1) {

                    // Minify HTML, CSS,  JS
                    if (extension === 'css' || extension === 'js' || extension.indexOf('htm') > -1) {
                        source = readFileSync(currentFile);

                        if (extension === 'js') {
                            source = minifyJS(source);
                        } else if (extension === 'css') {
                            source = minifyCSS(source);
                        } else {
                            source = minifyHTML(source);
                        }

                        outputFileName = currentFile + '-mini';
                        writeFileSync(outputFileName, source);
                        deleteTemp = true;
                    }

                    // gZip asset
                    setTimeout(function () {
                        compressAsset(outputFileName, currentFile);
                    }, 99);

                    // Eventually clean up tmp files
                    if (deleteTemp) {
                        setTimeout(function () {
                            deleteFile(outputFileName);
                        }, 9999);
                    }
                }
            }
        });
    };

    // Recursive file / folder dance, do stuff
    var traverseFileSystem = function (currentPath, func) {
        var files = fs.readdirSync(currentPath);

        files.forEach(function (file) {
            var currentFile = currentPath + '/' + file;

            fs.stat(currentFile, function(err, stat) {
                if (err) {
                    return;
                }

                if (stat.isFile()) {
                    if (func) {
                        func(currentFile, currentPath)
                    }
                } else if (stat.isDirectory()) {
                    traverseFileSystem(currentFile, func);
                }
            });
        });
    };

    try {
        compressStaticAssets(path);
    } catch(ignore) {}
};


// Public API
module.exports = {
    'crush' : gzipStaticContents,
    'css'   : minifyCSS,
    'gzip'  : compressAsset,
    'html'  : minifyHTML,
    'js'    : minifyJS,
    'smush' : gzipStaticContents
};