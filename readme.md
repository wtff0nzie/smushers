# Smushers

A collection of un-embiggeners in a gzip wrapper.

## Features
* CSS/HTML/JS files are automatically minified and gzipped
* JSON/TXT/XML file are automatically gzipped

## Quick usage
Recursive minification of static CSS, JS and HTML files

    require('smushers').smush('./public');

## Gzip a file

    require('smushers').gzip(pathToFileName, pathToOutputFileName);


## Filetype usage

    var minifiedJS = require('smushers').js(jsString);

    var minifiedCSS = require('smushers').css(cssString);

    var minifiedHTML = require('smushers').html(htmlString);


## Installation

    npm install smushers