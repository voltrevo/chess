#!/bin/bash -e

rm -rf ./build/web
mkdir ./build/web

./node_modules/.bin/browserify build/js/basicDemo.js >./build/web/index.js
ln -s $(pwd)/node_modules/chessboardjs/www/img ./build/web/img
ln -s $(pwd)/node_modules/chessboardjs/www/css ./build/web/css

cp ./web/static/index.html ./build/web/.

./node_modules/.bin/static ./build/web
