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
        destination = options.outputFile;

    imagemin([image], destination, {
            plugins: [
                imageminMozjpeg({quality: 65, progressive: true}),
                imageminPngquant([0.3, 0.5]),
                imageminGifsicle({interlaced: true})
            ]
        }).then(files => {
            callback(null, `./${files[0].path}`);
        }).catch(err => {
            console.error(`Error smushing ${image}`, err);
            callback(err);
        });
};


// Public API
module.exports = optimise;