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


const txtCompress = ['css', 'html', 'htm', 'js', 'json', 'svg', 'txt', 'xml'],
    imgCompress = ['gif', 'jpeg', 'jpg', 'png'],
    zlib = require('zlib'),
    fs = require('fs');


// Minify <HTML>
const minifyHTML = (markup) => {
    let minify = require('html-minifier').minify,
        minified;

    try {
        minified = minify(markup, {
            collapseWhitespace  : true,
            removeComments      : true
        });
    } catch (err) {
        console.log('Smushers failed to minify HTML:\n' + markup);
        console.log(err);
        minified = markup;
    }

    minify = undefined;

    return minified;
};


// Minify CSS
const minifyCSS = (css) => {
    let CleanCSS = require('clean-css'),
        minified;

    try {
        minified = new CleanCSS().minify(css).styles;
    } catch (err) {
        console.log('Smushers failed to minify CSS\n' + css);
        console.log(err);
        minified = css;
    }

    CleanCSS = undefined;

    return minified;
};


// Minify JS
const minifyJS = (js) => {
    let uglify = require('uglify-js'),
        minified;

    try {
        minified = uglify.minify(js).code;
    } catch (err) {
        console.log('Smushers failed to minify JS\n' + js);
        console.log(err);
        minified = js;
    }

    uglify = undefined;

    return minified;
};


// gZip a file
const compressAsset = (fileName, outputFileName) => {
    let input = fs.createReadStream(fileName),
        output = fs.createWriteStream((outputFileName || fileName) + '.gz');

    input.pipe(zlib.createGzip()).pipe(output);
};


// Optimise an image
const optimiseImage = (fileName, outputFileDir, callback) => {
    let options = {
            inputFile   : fileName,
            outputFile  : outputFileDir
        },
        optimise;

    optimise = require('./optimiseimage');

    try {
        optimise(options, (err, result) => {
            if (err) {
                console.log('Smushers could not optimise ' + fileName);
                console.log(err);
            }

            if (callback) {
                callback(err, fileName);
            }
        });
    } catch (err) {
        if (callback) {
            callback(true, err);
        }
    }

    optimise = undefined;
};


// Find and gzip static contents
const gzipStaticContents = (path) => {
    let compressStaticAssets,
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
        let files = fs.readdirSync(currentPath);

        files.forEach((file) => {
            let currentFile = currentPath + '/' + file;

            fs.stat(currentFile, (err, stat) => {
                if (err) {
                    return console.log(err);
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
        fs.unlink(fileName, (err) => {
            if (err) {
                return console.log(err);
            }

            if (callback) {
                callback(err, fileName);
            }
        });
    };


    // Find, minify and compress suitable files
    compressStaticAssets = (folder) => {
        traverseFileSystem(folder, (currentFile) => {
            let fName = currentFile.split('.'),
                extension = fName[fName.length - 1].toLowerCase(),
                outputFileName = currentFile,
                deleteTemp = false,
                minSource,
                source;

            if (fName && fName.length > 0 && extension) {
                if (txtCompress.indexOf(extension) > -1) {

                    // Minify HTML, CSS,  JS
                    if (extension === 'css' || extension === 'js' || extension.indexOf('htm') > -1) {
                        source = readFileSync(currentFile);

                        if (extension === 'js') {
                            minSource = minifyJS(source);

                            if (typeof minSource === 'undefined') {
                                minSource = source;
                                console.error('Error smushing ' + currentFile);
                            }
                        } else if (extension === 'css') {
                            minSource = minifyCSS(source);
                        } else {
                            minSource = minifyHTML(source);
                        }

                        outputFileName = currentFile + '-mini';
                        writeFileSync(outputFileName, minSource);
                        deleteTemp = true;
                    }

                    // gZip asset
                    setTimeout(() => {
                        compressAsset(outputFileName, currentFile);
                    }, 99);

                    // Eventually clean up tmp files
                    if (deleteTemp) {
                        setTimeout(() => {
                            deleteFile(outputFileName);
                        }, 9999);
                    }
                } else if (imgCompress.indexOf(extension) > -1) {
                    // Optimise an image
                    fName.pop();

                    if (fName[fName.length - 1].toString() !== 'opt') {
                        //outputFileName = fName.join('.') + '.opt.' + extension;
                        outputFileName = currentFile.split('/');
                        outputFileName.pop();
                        outputFileName = outputFileName.join('/') + '/';

                        console.log(outputFileName);

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