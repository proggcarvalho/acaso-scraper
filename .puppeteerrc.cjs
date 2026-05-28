const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Obriga o Puppeteer a descarregar o Chrome para dentro da pasta do projeto
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};