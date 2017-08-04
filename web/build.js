'use strict';

const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
const { exec } = require('mz/child_process');

module.exports = async ({
  addStaticDir,
  outputDir,
  // projectRoot,
}) => {
  await addStaticDir(path.join(__dirname, 'static'), outputDir);

  const chessboardJsWww = (
    path.join(__dirname, '..', 'node_modules', 'chessboardjs', 'www')
  );

  await Promise.all([
    addStaticDir(
      path.join(chessboardJsWww, 'css'),
      path.join(outputDir, 'css'),
    ),
    addStaticDir(
      path.join(chessboardJsWww, 'img'),
      path.join(outputDir, 'img'),
    ),
  ]);

  const nodeBin = path.join(__dirname, '..', 'node_modules', '.bin');

  await exec(`${path.join(nodeBin, 'tsc')} -p ${path.join(__dirname, '..')}`);

  const browserify = path.join(nodeBin, 'browserify');

  const basicDemoJs = path.join(
    __dirname,
    '..',
    'build',
    'js',
    'basicDemo.js',
  );

  const dst = path.join(outputDir, 'basicDemo.js');

  // Using browserify via exec so that it happens in a separate process
  await exec(`${browserify} ${basicDemoJs} >${dst}`);
};
