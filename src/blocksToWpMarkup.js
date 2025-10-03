/**
 * Blocks to WordPress Block Markup
 * Converts Universal Block structures to WordPress block comment format
 */

/**
 * Convert an array of blocks to WordPress block markup
 * @param {Array} blocks - Array of block objects
 * @param {Object} options - Formatting options
 * @returns {string} WordPress block markup
 */
function parseBlocksToWPMarkup(blocks, options = {}) {
	const { indent = 0 } = options;

	if (!blocks || !Array.isArray(blocks)) {
		return '';
	}

	return blocks.map(block => blockToWPMarkup(block, { indent })).join('\n');
}

/**
 * Convert a single block to WordPress block markup
 * @param {Object} block - Block object
 * @param {Object} options - Formatting options
 * @returns {string} WordPress block markup
 */
function blockToWPMarkup(block, options = {}) {
	const { indent = 0 } = options;

	if (!block || block.name !== 'universal/element') {
		return '';
	}

	const { attributes, innerBlocks } = block;
	const indentStr = '    '.repeat(indent);

	// Create attributes object for the block comment
	// Remove clientId and isValid as they're not needed in the markup
	const blockAttrs = {
		...attributes
	};

	// Add isDynamic flag (default false)
	if (!blockAttrs.isDynamic) {
		blockAttrs.isDynamic = false;
	}

	// Add elementType if not present (legacy attribute)
	if (!blockAttrs.elementType) {
		blockAttrs.elementType = 'text';
	}

	// Serialize attributes to JSON
	const attrsJson = JSON.stringify(blockAttrs);

	// Check if block is self-closing (no inner blocks and empty content type)
	const isSelfClosing = (!innerBlocks || innerBlocks.length === 0) &&
		(attributes.contentType === 'empty' ||
		 (attributes.contentType === 'text' && !attributes.content) ||
		 (attributes.contentType === 'html' && !attributes.content));

	if (isSelfClosing) {
		// Self-closing block format
		return `${indentStr}<!-- wp:universal/element ${attrsJson} /-->`;
	} else {
		// Block with content/children
		let output = `${indentStr}<!-- wp:universal/element ${attrsJson} -->`;

		// Add inner blocks if present
		if (innerBlocks && innerBlocks.length > 0) {
			output += '\n';
			output += parseBlocksToWPMarkup(innerBlocks, { indent: indent + 1 });
			output += '\n';
			output += `${indentStr}<!-- /wp:universal/element -->`;
		} else {
			// Self-closing but with content attribute (shouldn't happen but handle it)
			output += `<!-- /wp:universal/element -->`;
		}

		return output;
	}
}

module.exports = {
	parseBlocksToWPMarkup
};
