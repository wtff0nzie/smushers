/***************************************************
*                   Optimise images
****************************************************
*
*   About:  Squash images as much as possible
*
****************************************************/
/*jslint browser: false, node: true */

'use strict';

const imageminPngquant = require('imagemin-pngquant'),
    imageminGifsicle = require('imagemin-gifsicle'),
    imageminMozjpeg = require('imagemin-mozjpeg'),
    imagemin = require('imagemin');


// Optimise ...
let optimise = (options, callback) => {
    let image = options.inputFile,
        destination = options.outputFile || image;

    imagemin([image], destination, {
        plugins: [
            imageminMozjpeg(),
            imageminPngquant({quality: '65-80'}),
            imageminGifsicle()
        ]
    }).then(files => {
        callback(null, `./${files[0].path}`);
    });
};


// Public API
module.exports = optimise;