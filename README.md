# Universal Block CLI

CLI tool to convert HTML templates to WordPress Universal Block markup and vice versa.

## Installation

### Local Installation (for testing)

```bash
cd package
npm install
npm link
```

### Global Installation (when published to npm)

```bash
npm install -g @universal-block/cli
```

## Usage

### Convert HTML to Block Markup

Convert HTML files to WordPress block markup format:

```bash
# Convert a single file (WordPress markup format - default)
universal-block html-to-blocks templates/hero.html

# Convert entire directory
universal-block html-to-blocks templates/ -o blocks/

# Output as JSON format instead
universal-block html-to-blocks templates/ --format json --pretty

# Custom file pattern
universal-block html-to-blocks templates/ -p "**/*.html" -o blocks/
```

**Options:**
- `-o, --output <path>` - Output directory (default: `./blocks`)
- `-p, --pattern <pattern>` - Glob pattern for HTML files (default: `**/*.html`)
- `--format <format>` - Output format: `wp` (WordPress markup) or `json` (default: `wp`)
- `--pretty` - Pretty print output

### Convert Block Markup to HTML

Convert WordPress block JSON back to HTML:

```bash
# Convert a single file
universal-block blocks-to-html blocks/hero.json

# Convert entire directory
universal-block blocks-to-html blocks/ -o html/

# With pretty HTML formatting
universal-block blocks-to-html blocks/ --pretty

# Custom file pattern
universal-block blocks-to-html blocks/ -p "**/*.json" -o html/
```

**Options:**
- `-o, --output <path>` - Output directory (default: `./html`)
- `-p, --pattern <pattern>` - Glob pattern for JSON files (default: `**/*.json`)
- `--pretty` - Pretty print HTML output with indentation

## Features

### ✅ Structure Preservation

- Exact DOM hierarchy maintained
- All attributes preserved (classes, IDs, data attributes)
- Text and HTML content preserved
- 100% roundtrip consistency (HTML → Blocks → HTML)

### ✅ Dynamic Tags Support

The CLI fully supports Universal Block's dynamic tags:

- `<set>` - Variable assignment
- `<loop>` - Iteration over data
- `<if>` - Conditional rendering

### ✅ Twig/Timber Integration

- Twig syntax preserved (`{{ }}`, `{% %}`)
- Works with Timber context variables
- ACF field support via `post.meta()`

### ✅ Automatic Content Type Detection

The parser automatically detects:
- `text` - Elements with only text content
- `blocks` - Container elements with nested elements
- `html` - Mixed content or complex markup
- `empty` - Self-closing/void elements

## Examples

### Example 1: Hero Section

**Input** (`templates/hero.html`):
```html
<section class="hero bg-blue-600 text-white py-20">
  <div class="container mx-auto">
    <h1 class="text-4xl font-bold">{{ post.title }}</h1>
    <p class="text-xl">{{ post.meta('subtitle') }}</p>
  </div>
</section>
```

**Command:**
```bash
universal-block html-to-blocks templates/hero.html --pretty
```

**Output** (`blocks/hero.json`):
```json
[
  {
    "clientId": "abc-123",
    "name": "universal/element",
    "attributes": {
      "tagName": "section",
      "className": "hero bg-blue-600 text-white py-20",
      "contentType": "blocks",
      ...
    },
    "innerBlocks": [...]
  }
]
```

### Example 2: Dynamic Loop

**Input** (`templates/team.html`):
```html
<div class="grid grid-cols-3 gap-4">
  <loop source="post.meta('team_members')">
    <div class="team-card">
      <h3>{{ item.name }}</h3>
      <p>{{ item.title }}</p>
    </div>
  </loop>
</div>
```

**Command:**
```bash
universal-block html-to-blocks templates/team.html
```

The `<loop>` tag is automatically recognized and converted with `contentType: 'blocks'` and `selfClosing: false`.

### Example 3: Conditional Content

**Input** (`templates/banner.html`):
```html
<set variable="show_banner" value="post.meta('show_banner')" />

<if source="show_banner">
  <div class="banner">{{ post.meta('banner_text') }}</div>
</if>
```

Both `<set>` (self-closing) and `<if>` (container) tags are properly converted.

## Use Cases

### Block Theme Development

Convert HTML mockups to WordPress blocks for block theme development:

```bash
# Convert all page templates
universal-block html-to-blocks theme-mockups/ -o theme/blocks/

# Later, export back to HTML for reference
universal-block blocks-to-html theme/blocks/ -o docs/html/
```

### Component Library

Maintain a library of reusable HTML components:

```bash
# Convert component library
universal-block html-to-blocks components/ -o blocks/components/

# Import blocks into WordPress
# Copy JSON files to theme/blocks/
```

### Template Sharing

Share templates as HTML (easier to read) and convert to blocks when needed:

```bash
# Developer 1: Export blocks as HTML
universal-block blocks-to-html my-blocks/ --pretty

# Developer 2: Import HTML as blocks
universal-block html-to-blocks shared-templates/
```

## Development Workflow

Recommended workflow for block theme projects:

1. **Design in HTML** - Create templates using familiar HTML/Tailwind
2. **Convert to Blocks** - Use CLI to generate block JSON
3. **Test in WordPress** - Import blocks into WordPress editor
4. **Refine** - Make adjustments in editor or HTML
5. **Export if needed** - Convert blocks back to HTML for documentation

```bash
# Step 1 & 2: HTML → Blocks
universal-block html-to-blocks templates/ -o blocks/ --pretty

# Step 5: Blocks → HTML (for docs)
universal-block blocks-to-html blocks/ -o docs/templates/ --pretty
```

## API Usage

You can also use the parsers programmatically in Node.js:

```javascript
const { parseHTMLToBlocks, parseBlocksToHTML } = require('@universal-block/cli');

// HTML to Blocks
const html = '<div class="container"><p>Hello World</p></div>';
const blocks = parseHTMLToBlocks(html);

// Blocks to HTML
const html = parseBlocksToHTML(blocks, { pretty: true });
```

## Files Generated

### HTML to Blocks

- **Input:** `.html` files
- **Output:** `.json` files containing WordPress block structure
- **Format:** Array of block objects with attributes and innerBlocks

### Blocks to HTML

- **Input:** `.json` files containing block arrays
- **Output:** `.html` files with clean HTML markup
- **Format:** Standard HTML with preserved structure and attributes

## Supported HTML Features

- ✅ All HTML5 elements
- ✅ Custom elements and web components
- ✅ Classes (including Tailwind CSS)
- ✅ All standard attributes (id, data-*, aria-*, etc.)
- ✅ Nested structures
- ✅ SVG elements
- ✅ Self-closing tags
- ✅ Dynamic tags (`<set>`, `<loop>`, `<if>`)
- ✅ Twig syntax (`{{ }}`, `{% %}`)

## Limitations

- Inline `<script>` tags are preserved but not executed
- Inline `<style>` tags are preserved as HTML content
- PHP code not supported (use Twig instead)
- Comments are not currently preserved (will be added in future version)

## Examples Directory

The package includes example templates in `templates/examples/`:

- `hero-section.html` - Hero section with Twig variables
- `team-members.html` - Team grid with ACF loop
- `conditional-banner.html` - Conditional content with set/if tags

Test the CLI with these examples:

```bash
cd package
npm install
npm link

# Convert examples
universal-block html-to-blocks templates/examples/ --pretty
```

## Troubleshooting

### "Command not found" Error

Make sure the package is installed and linked:

```bash
npm link
# or
npm install -g @universal-block/cli
```

### Self-Closing Tags Not Converting

Make sure dynamic tags (`<set>`, `<loop>`, `<if>`) are properly closed:

```html
<!-- Correct -->
<set variable="x" value="y" />

<!-- Also works -->
<set variable="x" value="y"></set>
```

### JSON Parse Errors

Ensure JSON files contain valid block arrays. Use `--pretty` flag when generating to make debugging easier.

## Contributing

This tool is part of the Universal Block WordPress plugin. Contributions welcome!

## License

GPL-2.0-or-later

## Resources

- [Universal Block Plugin Documentation](../README.md)
- [LLM Instructions for Template Creation](../llm-instructions.md)
- [HTML to Blocks Parser Docs](../docs/parsers/html-to-blocks.md)
- [Blocks to HTML Parser Docs](../docs/parsers/blocks-to-html.md)
