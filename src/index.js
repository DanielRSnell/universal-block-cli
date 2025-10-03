/**
 * Universal Block CLI - Main Module
 * Exports parsers and utilities
 */

const { parseHTMLToBlocks } = require('./htmlToBlocks');
const { parseBlocksToHTML } = require('./blocksToHtml');
const { getTagConfig, tagConfigs } = require('./tagConfig');

module.exports = {
	parseHTMLToBlocks,
	parseBlocksToHTML,
	getTagConfig,
	tagConfigs
};
