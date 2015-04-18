# Smushers

A collection of un-embiggeners in a gzip wrapper.

## Features
* CSS/HTML/JS files are automatically minified and gzipped
* JSON/SVG/TXT/XML files are automatically gzipped
* GIF/JPG/PNG files are optimised

## Quick usage
Automagical recursive minification of static CSS, JS, HTML and image files

    require('smushers').smush('./public');

## Gzip a file

    require('smushers').gzip(pathToFileName, pathToOutputFileName);


## Filetype usage

    var minifiedJS = require('smushers').js(jsString);

    var minifiedCSS = require('smushers').css(cssString);

    var minifiedHTML = require('smushers').html(htmlString);

    var minifiedIMG = require('smushers').img('img-large.jpg');

Specify and output filename and a callback:

    var minifiedIMG = require('smushers').img('img-large.jpg', 'img-smaller.jpg', function (err, filename) {});


## Installation

    npm install smushers