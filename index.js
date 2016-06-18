/***************************************************
*                       SMUSHERS
****************************************************
*
*   About:  Makes files as small as possible for
*           transport <strike>by avian carriers
*           </strike> over the wire.
*
****************************************************/
/*jslint browser: false, node: true */

'use strict';


var txtCompress = ['css', 'html', 'htm', 'js', 'json', 'svg', 'txt', 'xml'],
    imgCompress = ['gif', 'jpeg', 'jpg', 'png'],
    zlib = require('zlib'),
    fs = require('fs');


// Minify <HTML>
var minifyHTML = (markup) => {
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

    minify = undefined;

    return minified;
};


// Minify CSS
var minifyCSS = (css) => {
    var CleanCSS = require('clean-css'),
        minified;

    try {
        minified = new CleanCSS().minify(css).styles;
    } catch (e) {
        console.log('Smushers failed to minify CSS\n' + css);
        minified = css;
    }

    CleanCSS = undefined;

    return minified;
};


// Minify JS
var minifyJS = (js) => {
    var uglify = require('uglify-js'),
        minified;

    try {
        minified = uglify.minify(js, {fromString: true}).code;
    } catch (e) {
        console.log('Smushers failed to minify JS\n' + js);
        minified = js;
    }

    uglify = undefined;

    return minified;
};


// gZip a file
var compressAsset = (fileName, outputFileName) => {
    var input = fs.createReadStream(fileName),
        output = fs.createWriteStream((outputFileName || fileName) + '.gz');

    input.pipe(zlib.createGzip()).pipe(output);
};


// Optimise an image
var optimiseImage = (fileName, outputFileName, callback) => {
    var options = {
            inputFile   : fileName,
            outputFile  : outputFileName || fileName
        },
        optimise;

    // Does an optimised file already exist?
    fs.readFile(outputFileName, function (err) {
        if (!err) {
            return;
        }

        optimise = require('./optimiseimage');

        try {
            optimise(options, (err, result) => {
                if (err) {
                    console.log('Smushers could not optimise ' + fileName);
                }

                if (callback) {
                    callback(err, outputFileName);
                }

                optimise = undefined;
            });
        } catch (err) {
            console.log(err);

            if (callback) {
                callback(true, err);
            }

            optimise = undefined;
        }
    });
};


// Find and gzip static contents
var gzipStaticContents = (path) => {
    var compressStaticAssets,
        traverseFileSystem,
        writeFileSync,
        readFileSync,
        deleteFile;

    if (!path) {
        console.log('Smushers wasn\'t give a directory to smush :(');
        return;
    }


    // Recursive file / folder dance, do stuff (blocking)
    traverseFileSystem = (currentPath, func) => {
        var files = fs.readdirSync(currentPath);

        files.forEach((file) => {
            var currentFile = currentPath + '/' + file;

            fs.stat(currentFile, (err, stat) => {
                if (err) {
                    return;
                }

                if (stat.isFile()) {
                    if (func) {
                        func(currentFile, currentPath);
                    }
                } else if (stat.isDirectory()) {
                    traverseFileSystem(currentFile, func);
                }
            });
        });
    };


    // Sync file read
    readFileSync = (fileName) => {
        return fs.readFileSync(fileName).toString();
    };


    // Sync file write
    writeFileSync = (fileName, contents) => {
        fs.writeFileSync(fileName, contents);
    };


    // Delete file
    deleteFile = (fileName, callback) => {
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
    compressStaticAssets = (folder) => {
        traverseFileSystem(folder, (currentFile) => {
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

                    if (fName[fName.length - 1].toString() !== 'opt') {
                        outputFileName = fName.join('.') + '.opt.' + extension;
                        optimiseImage(currentFile, outputFileName);
                    }
                }
            }
        });
    };

    try {
        compressStaticAssets(path);
    } catch (ignore) {}
};


// Public API
module.exports = {
    'crush' : gzipStaticContents,
    'css'   : minifyCSS,
    'img'   : optimiseImage,
    'gzip'  : compressAsset,
    'html'  : minifyHTML,
    'js'    : minifyJS,
    'smush' : gzipStaticContents
};