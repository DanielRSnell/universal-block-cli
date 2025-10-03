/**
 * Universal Block CLI - Main Module
 * Exports parsers and utilities
 */

const { parseHTMLToBlocks } = require('./htmlToBlocks');
const { parseBlocksToHTML } = require('./blocksToHtml');
const { parseBlocksToWPMarkup } = require('./blocksToWpMarkup');
const { getTagConfig, tagConfigs } = require('./tagConfig');

module.exports = {
	parseHTMLToBlocks,
	parseBlocksToHTML,
	parseBlocksToWPMarkup,
	getTagConfig,
	tagConfigs
};
