/**
 * Blocks to HTML Parser (Node.js version)
 * Converts Universal Block structures back to HTML
 */

const { getTagConfig } = require('./tagConfig');

/**
 * Convert an array of blocks to HTML string
 * @param {Array} blocks - Array of block objects
 * @param {Object} options - Formatting options
 * @returns {string} HTML string
 */
function parseBlocksToHTML(blocks, options = {}) {
	const { pretty = false, indent = 0 } = options;

	if (!blocks || !Array.isArray(blocks)) {
		return '';
	}

	const html = blocks.map(block => blockToHTML(block, { pretty, indent })).join(pretty ? '\n' : '');
	return html;
}

/**
 * Convert a single block to HTML
 * @param {Object} block - Block object
 * @param {Object} options - Formatting options
 * @returns {string} HTML string
 */
function blockToHTML(block, options = {}) {
	const { pretty = false, indent = 0 } = options;

	if (!block || block.name !== 'universal/element') {
		return '';
	}

	const { attributes, innerBlocks } = block;
	const {
		tagName = 'div',
		contentType = 'text',
		content = '',
		selfClosing = false,
		globalAttrs = {},
		className = ''
	} = attributes;

	// Build attributes string
	let attributesString = '';

	// Add className if present
	if (className) {
		attributesString += ` class="${escapeAttribute(className)}"`;
	}

	// Add global attributes
	Object.entries(globalAttrs).forEach(([name, value]) => {
		if (name && value !== undefined && value !== '') {
			attributesString += ` ${escapeAttributeName(name)}="${escapeAttribute(value)}"`;
		}
	});

	// Handle different content types
	let innerContent = '';

	switch (contentType) {
		case 'text':
		case 'html':
			innerContent = content || '';
			break;

		case 'blocks':
			// Recursively convert inner blocks to HTML
			if (innerBlocks && innerBlocks.length > 0) {
				const childOptions = { pretty, indent: indent + 1 };
				const childHtml = parseBlocksToHTML(innerBlocks, childOptions);

				if (pretty && childHtml) {
					const indentStr = '  '.repeat(indent + 1);
					innerContent = '\n' + indentStr + childHtml.split('\n').join('\n' + indentStr) + '\n' + '  '.repeat(indent);
				} else {
					innerContent = childHtml;
				}
			}
			break;

		case 'empty':
		default:
			innerContent = '';
			break;
	}

	// Determine if self-closing
	const config = getTagConfig(tagName);
	const shouldBeSelfClosing = config?.selfClosing !== undefined
		? config.selfClosing
		: (selfClosing || isVoidElement(tagName));

	// Generate HTML with optional formatting
	const indentStr = pretty ? '  '.repeat(indent) : '';

	if (shouldBeSelfClosing) {
		return `${indentStr}<${tagName}${attributesString} />`;
	} else {
		return `${indentStr}<${tagName}${attributesString}>${innerContent}</${tagName}>`;
	}
}

/**
 * Check if a tag name is a void element
 * @param {string} tagName - HTML tag name
 * @returns {boolean}
 */
function isVoidElement(tagName) {
	const voidElements = [
		'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base',
		'col', 'embed', 'source', 'track', 'wbr'
	];
	return voidElements.includes(tagName.toLowerCase());
}

/**
 * Escape HTML attribute value
 * @param {string} value - Attribute value
 * @returns {string} Escaped value
 */
function escapeAttribute(value) {
	if (typeof value !== 'string') {
		value = String(value);
	}
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Escape HTML attribute name
 * @param {string} name - Attribute name
 * @returns {string} Escaped name
 */
function escapeAttributeName(name) {
	// Only allow letters, numbers, hyphens, and underscores
	return name.replace(/[^a-zA-Z0-9\-_]/g, '');
}

module.exports = {
	parseBlocksToHTML
};
