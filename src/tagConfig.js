/**
 * Tag configuration for Universal Block
 * Node.js compatible version
 */

const tagConfigs = {
	// Dynamic tags
	'set': {
		label: 'Set',
		category: 'dynamic',
		description: 'Sets variables using raw Twig expressions',
		contentType: 'empty',
		selfClosing: true
	},
	'loop': {
		label: 'Loop',
		category: 'dynamic',
		description: 'Repeats content based on dynamic data',
		contentType: 'blocks',
		selfClosing: false
	},
	'if': {
		label: 'If',
		category: 'dynamic',
		description: 'Conditionally displays content',
		contentType: 'blocks',
		selfClosing: false
	}
};

/**
 * Get tag configuration
 * @param {string} tagName - Tag name
 * @returns {Object|null} Tag config or null
 */
function getTagConfig(tagName) {
	return tagConfigs[tagName.toLowerCase()] || null;
}

module.exports = {
	getTagConfig,
	tagConfigs
};
