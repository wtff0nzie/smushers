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

var txtCompress = ['css', 'html', 'htm', 'js', 'json', 'svg', 'txt', 'xml'],
    imgCompress = ['gif', 'jpeg', 'jpg', 'png'],
    zlib = require('zlib'),
    fs = require('fs');


// Minify <HTML>
var minifyHTML = function (markup) {
    var minify = require('html-minifier').minify,
        minified;

    try {
        minified = minify(markup, {
            collapseWhitespace  : true,
            removeComments      : true
        });
    } catch (e) {
        console.log('Smushers failed to minify HTML:\n' + markup);
        minified = markup;
    }

    minify = null;

    return minified;
};


// Minify CSS
var minifyCSS = function (css) {
    var cleanCSS = require('clean-css'),
        minified;

    try {
        minified = new cleanCSS().minify(css).styles;
    } catch (e) {
        console.log('Smushers failed to minify CSS\n' + css);
        minified = css;
    }

    cleanCSS = null;

    return minified;
};


// Minify JS
var minifyJS = function (js) {
    var uglify = require('uglify-js'),
        minified;

    try {
        minified = uglify.minify(js, {fromString: true}).code;
    } catch (e) {
        console.log('Smushers failed to minify JS\n'+ js);
        minified = js;
    }

    uglify = null;

    return minified;
};


// gZip a file
var compressAsset = function (fileName, outputFileName) {
    var input = fs.createReadStream(fileName),
        output = fs.createWriteStream((outputFileName || fileName) + '.gz');

    input.pipe(zlib.createGzip()).pipe(output);
};


// Optimise an image
var optimiseImage = function (fileName, outputFileName) {
    var options = {
            inputFile   : fileName,
            outputFile  : outputFileName || fileName
        },
        optimise;


    fs.readFile(outputFileName, function(err) {
        if (!err) {
            return;
        }

        optimise = require('optimage');

        try {
            optimise(options, function (err) {
                if (err) {
                    console.log('Smushers could not optimise ' + fileName);
                }
            });
        } catch (e) {
            console.log(e);
        }

        optimise = null;
    });
};


// Find and gzip static contents
var gzipStaticContents = function (path) {
    if (!path) {
        console.log('Smushers wasn\'t give a directory to smush :(');
        return;
    }

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
        traverseFileSystem(folder, function (currentFile, currentPath) {
            var fName = currentFile.split('.'),
                extension = fName[fName.length - 1].toLowerCase(),
                outputFileName = currentFile,
                deleteTemp = false,
                source;

            if (fName && fName.length > 0 && extension) {
                if (txtCompress.indexOf(extension) > -1) {

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
                } else if (imgCompress.indexOf(extension) > -1) {

                    // Optimise an image
                    fName.pop();

                    if (fName[fName.length - 1] != 'opt') {
                        outputFileName = fName.join('.') + '.opt.' + extension;
                        optimiseImage(currentFile, outputFileName);
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