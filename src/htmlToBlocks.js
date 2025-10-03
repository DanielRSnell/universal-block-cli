/**
 * HTML to Universal Blocks Parser (Node.js version)
 * Converts HTML into universal/element block structures
 */

const { JSDOM } = require('jsdom');
const { getTagConfig } = require('./tagConfig');

/**
 * Parse HTML string and convert to Universal Block structures
 * @param {string} html - HTML string to parse
 * @returns {Array} Array of block objects
 */
function parseHTMLToBlocks(html) {
	if (!html || typeof html !== 'string') {
		return [];
	}

	// CRITICAL FIX: DOMParser doesn't handle self-closing custom tags correctly
	// Convert self-closing custom tags to proper empty tags: <set /> → <set></set>
	const processedHtml = html.replace(/<(\w+)([^>]*?)\/>/g, (match, tagName, attrs) => {
		const config = getTagConfig(tagName.toLowerCase());
		if (config?.selfClosing === true) {
			return `<${tagName}${attrs}></${tagName}>`;
		}
		return match; // Keep void HTML elements as self-closing
	});

	// Create a DOM using JSDOM
	const dom = new JSDOM(`<div>${processedHtml}</div>`);
	const container = dom.window.document.body.firstChild;

	// Convert child nodes to blocks
	const blocks = [];
	if (container) {
		for (const node of container.childNodes) {
			const block = nodeToBlock(node);
			if (block) {
				blocks.push(block);
			}
		}
	}

	return blocks;
}

/**
 * Convert a DOM node to a Universal Block
 * @param {Node} node - DOM node to convert
 * @returns {Object|null} Block object or null
 */
function nodeToBlock(node) {
	// Handle text nodes
	if (node.nodeType === 3) { // Node.TEXT_NODE
		const text = node.textContent.trim();
		if (!text) return null;

		// Create a paragraph block for standalone text
		return createBlock('universal/element', {
			blockName: 'P',
			tagName: 'p',
			category: 'custom',
			contentType: 'text',
			content: text,
			selfClosing: false,
			uiState: {
				tagCategory: 'custom',
				selectedTagName: 'p',
				selectedContentType: 'text'
			}
		});
	}

	// Handle element nodes
	if (node.nodeType === 1) { // Node.ELEMENT_NODE
		const tagName = node.tagName.toLowerCase();

		// Check config for dynamic tags
		const config = getTagConfig(tagName);
		const isDynamicTag = config?.selfClosing === true;

		// Extract attributes
		const globalAttrs = {};
		let className = '';

		for (const attr of node.attributes) {
			if (attr.name === 'class') {
				className = attr.value;
			} else if (attr.name === 'style') {
				globalAttrs['data-style'] = attr.value;
			} else {
				globalAttrs[attr.name] = attr.value;
			}
		}

		// Determine content type and content
		let contentType;
		let content = '';
		let innerBlocks = [];

		// Void elements
		const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
		const isVoidElement = voidElements.includes(tagName);

		// Content type detection
		if (isDynamicTag) {
			contentType = config.contentType || 'empty';
		} else if (isVoidElement) {
			contentType = 'empty';
		} else if (tagName === 'svg') {
			contentType = 'html';
			content = node.innerHTML;
		} else {
			// Universal content type detection
			const hasElements = hasChildElements(node);
			const hasText = hasTextContent(node);

			// Container elements
			const containerElements = ['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside', 'ul', 'ol', 'li', 'form', 'fieldset', 'blockquote', 'figure', 'button'];
			const isContainer = containerElements.includes(tagName);

			if (hasElements && isContainer) {
				contentType = 'blocks';
				for (const childNode of node.childNodes) {
					const childBlock = nodeToBlock(childNode);
					if (childBlock) {
						innerBlocks.push(childBlock);
					}
				}
			} else if (hasElements) {
				contentType = 'html';
				content = node.innerHTML;
			} else if (hasText) {
				contentType = 'text';
				content = node.textContent;
			} else {
				contentType = 'empty';
			}
		}

		// Determine if self-closing
		const finalSelfClosing = config?.selfClosing !== undefined ? config.selfClosing : isVoidElement;

		// Create the block
		const blockAttributes = {
			blockName: tagName.charAt(0).toUpperCase() + tagName.slice(1),
			tagName,
			category: 'custom',
			contentType,
			selfClosing: finalSelfClosing,
			globalAttrs,
			uiState: {
				tagCategory: 'custom',
				selectedTagName: tagName,
				selectedContentType: contentType
			}
		};

		if (className) {
			blockAttributes.className = className;
		}

		if (contentType === 'text' || contentType === 'html') {
			blockAttributes.content = content;
		}

		return createBlock('universal/element', blockAttributes, innerBlocks);
	}

	return null;
}

/**
 * Create a block object (WordPress-compatible structure)
 * @param {string} name - Block name
 * @param {Object} attributes - Block attributes
 * @param {Array} innerBlocks - Inner blocks
 * @returns {Object} Block object
 */
function createBlock(name, attributes = {}, innerBlocks = []) {
	return {
		clientId: generateClientId(),
		name,
		isValid: true,
		attributes,
		innerBlocks
	};
}

/**
 * Generate a unique client ID for blocks
 * @returns {string} Client ID
 */
function generateClientId() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

/**
 * Check if element has any child elements
 * @param {Element} element - DOM element
 * @returns {boolean}
 */
function hasChildElements(element) {
	for (const child of element.childNodes) {
		if (child.nodeType === 1) { // ELEMENT_NODE
			return true;
		}
	}
	return false;
}

/**
 * Check if element has any text content (excluding pure whitespace)
 * @param {Element} element - DOM element
 * @returns {boolean}
 */
function hasTextContent(element) {
	for (const child of element.childNodes) {
		if (child.nodeType === 3 && child.textContent.trim()) { // TEXT_NODE
			return true;
		}
	}
	return false;
}

module.exports = {
	parseHTMLToBlocks
};
