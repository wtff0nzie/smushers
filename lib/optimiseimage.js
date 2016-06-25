/***************************************************
*                   Optimise images
****************************************************
*
*   About:  Squash images as much as possible
*
****************************************************/
/*jslint browser: false, node: true */

'use strict';


const execFile = require('child_process').execFile,
    path = require('path'),
    fs = require('fs');


// Optimise ...
let optimise = (options, callback) => {
    let originalSize = fs.statSync(options.inputFile).size,
        args = [],
        binary;

    switch (path.extname(options.inputFile).toLowerCase()) {
        case '.png':
            binary = require('optipng-bin');
            args.push('-out', options.outputFile, options.inputFile);
            break;

        case '.jpg':
        case '.jpeg':
            binary = require('jpegtran-bin');
            args.push('-outfile', options.outputFile, options.inputFile);
            break;

        case '.gif':
            binary = require('gifsicle');
            args.push('-o', options.outputFile, options.inputFile);
            break;

        default:
            return callback(true, options);
    }

    execFile(binary, args, (err, stdout, stderr) => {
        if (options.verbose) {
            stdout && console.log(stdout);
            stderr && console.log(stderr);
        }

        options.stdout = stdout;
        options.stderr = stderr;

        if (!err) {
            options.saved = originalSize - fs.statSync(options.outputFile).size;
        }

        callback(err, options);
    });
};


// Public API
module.exports = optimise;