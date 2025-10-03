# Universal Block CLI - Theme Integration Guide

This guide shows how to integrate the Universal Block CLI into your WordPress block theme for streamlined development.

## Installation in Theme

### 1. Install as Dev Dependency

Add to your theme's development dependencies:

```bash
cd wp-content/themes/your-theme
npm install --save-dev @universal-block/cli
```

Or install from GitHub (before npm publish):

```bash
npm install --save-dev git+https://github.com/DanielRSnell/universal-block-cli.git
```

### 2. Add NPM Scripts

Add these scripts to your theme's `package.json`:

```json
{
  "scripts": {
    "blocks:convert": "universal-block html-to-blocks templates/html -o templates/blocks",
    "blocks:convert-json": "universal-block html-to-blocks templates/html -o templates/blocks --format json",
    "blocks:to-html": "universal-block blocks-to-html templates/blocks -o templates/html --pretty",
    "blocks:watch": "universal-block watch templates/html -o templates/blocks"
  }
}
```

### 3. Create Directory Structure

```bash
mkdir -p templates/html
mkdir -p templates/blocks
```

**Directory structure:**
```
your-theme/
├── templates/
│   ├── html/           # Your HTML templates (source)
│   │   ├── header.html
│   │   ├── footer.html
│   │   └── sections/
│   │       ├── hero.html
│   │       └── team.html
│   └── blocks/         # Generated block markup
│       ├── header.html
│       ├── footer.html
│       └── sections/
│           ├── hero.html
│           └── team.html
└── package.json
```

## Development Workflow

### 1. Create HTML Templates

Create your templates in `templates/html/`:

**templates/html/sections/hero.html:**
```html
<section class="hero bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
  <div class="container mx-auto px-4">
    <h1 class="text-5xl font-bold mb-4">{{ post.title }}</h1>
    <p class="text-xl mb-8">{{ post.meta('subtitle') }}</p>
    <a href="{{ post.meta('cta_link') }}" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100">
      {{ post.meta('cta_text') }}
    </a>
  </div>
</section>
```

### 2. Convert to Block Markup

Run the conversion:

```bash
npm run blocks:convert
```

This generates `templates/blocks/sections/hero.html` with WordPress block markup:

```html
<!-- wp:universal/element {"tagName":"section",...} -->
    <!-- wp:universal/element {"tagName":"div",...} -->
        <!-- wp:universal/element {"tagName":"h1","content":"{{ post.title }}",...} /-->
        <!-- wp:universal/element {"tagName":"p","content":"{{ post.meta('subtitle') }}",...} /-->
        <!-- wp:universal/element {"tagName":"a",...} /-->
    <!-- /wp:universal/element -->
<!-- /wp:universal/element -->
```

### 3. Use in WordPress

The generated block markup can be:
- **Copy/pasted** directly into the WordPress block editor
- **Programmatically inserted** via `parse_blocks()` and `serialize_blocks()`
- **Used in block patterns** for reusable components

## Advanced Integration

### Creating Block Patterns from Templates

**functions.php:**
```php
<?php
/**
 * Register block pattern from CLI-generated markup
 */
function register_hero_pattern() {
    $markup_file = get_template_directory() . '/templates/blocks/sections/hero.html';

    if ( file_exists( $markup_file ) ) {
        $content = file_get_contents( $markup_file );

        register_block_pattern(
            'mytheme/hero-section',
            array(
                'title'       => __( 'Hero Section', 'mytheme' ),
                'description' => __( 'Hero section with title, subtitle, and CTA', 'mytheme' ),
                'content'     => $content,
                'categories'  => array( 'featured' ),
            )
        );
    }
}
add_action( 'init', 'register_hero_pattern' );
```

### Automated Pattern Registration

**includes/block-patterns.php:**
```php
<?php
/**
 * Auto-register all block patterns from templates/blocks/
 */
function auto_register_block_patterns() {
    $blocks_dir = get_template_directory() . '/templates/blocks';

    if ( ! is_dir( $blocks_dir ) ) {
        return;
    }

    // Recursively find all .html files
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator( $blocks_dir )
    );

    foreach ( $files as $file ) {
        if ( $file->getExtension() === 'html' ) {
            $content = file_get_contents( $file->getPathname() );
            $relative_path = str_replace( $blocks_dir . '/', '', $file->getPathname() );
            $pattern_name = str_replace( array( '/', '.html' ), array( '-', '' ), $relative_path );

            register_block_pattern(
                'mytheme/' . $pattern_name,
                array(
                    'title'       => ucwords( str_replace( '-', ' ', $pattern_name ) ),
                    'content'     => $content,
                    'categories'  => array( 'mytheme' ),
                )
            );
        }
    }
}
add_action( 'init', 'auto_register_block_patterns' );
```

### Dynamic Template Parts

**template-parts/hero.php:**
```php
<?php
/**
 * Hero template part - loads from block markup
 */
$markup_file = get_template_directory() . '/templates/blocks/sections/hero.html';

if ( file_exists( $markup_file ) ) {
    $content = file_get_contents( $markup_file );

    // Parse and render blocks
    $blocks = parse_blocks( $content );
    echo render_block( $blocks[0] );
}
```

## Build Process Integration

### Option 1: NPM Scripts (Simple)

Add to `package.json`:

```json
{
  "scripts": {
    "build": "npm run build:css && npm run build:js && npm run blocks:convert",
    "watch": "concurrently \"npm run watch:css\" \"npm run watch:js\" \"npm run blocks:watch\""
  }
}
```

### Option 2: Webpack Integration

**webpack.config.js:**
```javascript
const { execSync } = require('child_process');

module.exports = {
  // Your webpack config...
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('ConvertBlocksPlugin', () => {
          console.log('Converting HTML templates to blocks...');
          execSync('npm run blocks:convert', { stdio: 'inherit' });
        });
      },
    },
  ],
};
```

### Option 3: Gulp Integration

**gulpfile.js:**
```javascript
const { exec } = require('child_process');
const gulp = require('gulp');

gulp.task('blocks:convert', (cb) => {
  exec('npm run blocks:convert', (err, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);
    cb(err);
  });
});

gulp.task('watch:blocks', () => {
  return gulp.watch('templates/html/**/*.html', gulp.series('blocks:convert'));
});

gulp.task('build', gulp.series('blocks:convert', /* other tasks */));
gulp.task('watch', gulp.parallel('watch:blocks', /* other watches */));
```

## Working with ACF and Dynamic Content

### ACF Field Integration

**templates/html/sections/team.html:**
```html
<section class="team py-16">
  <div class="container mx-auto">
    <h2 class="text-3xl font-bold mb-8">{{ post.meta('team_heading') }}</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <loop source="post.meta('team_members')">
        <div class="team-card">
          <img src="{{ item.photo.url }}" alt="{{ item.name }}" class="w-full h-64 object-cover rounded-lg">
          <h3 class="text-xl font-bold mt-4">{{ item.name }}</h3>
          <p class="text-gray-600">{{ item.title }}</p>
          <p class="mt-2">{{ item.bio }}</p>
        </div>
      </loop>
    </div>
  </div>
</section>
```

### Conditional Sections

**templates/html/sections/banner.html:**
```html
<set variable="show_banner" value="post.meta('show_promo_banner')" />
<set variable="banner_text" value="post.meta('promo_text')" />
<set variable="banner_link" value="post.meta('promo_link')" />

<if source="show_banner">
  <div class="promo-banner bg-yellow-400 text-black py-4 px-6 text-center">
    <a href="{{ banner_link }}" class="font-bold hover:underline">
      {{ banner_text }}
    </a>
  </div>
</if>
```

## Version Control Best Practices

### What to Commit

**Recommended:**
```
✅ templates/html/       # Source HTML templates
✅ templates/blocks/     # Generated block markup (for review)
✅ package.json          # CLI scripts
✅ .gitignore            # Ignore node_modules
```

**.gitignore:**
```
node_modules/
*.log
.DS_Store
```

### Team Workflow

1. **Developer 1:** Creates/updates HTML template in `templates/html/`
2. **Developer 1:** Runs `npm run blocks:convert`
3. **Developer 1:** Commits both HTML and generated blocks
4. **Developer 2:** Pulls changes and has both formats ready to use
5. **Designer:** Reviews readable HTML templates
6. **WordPress User:** Uses generated block markup

## Style Attribute Handling

The CLI automatically converts `style=""` to `data-style=""` to prevent Gutenberg preview issues:

```html
<!-- Your HTML template -->
<div class="hero" style="background-image: url('{{ post.meta('bg_image') }}');">
  Content
</div>

<!-- Generated block markup -->
<!-- wp:universal/element {"globalAttrs":{"data-style":"background-image: url('{{ post.meta('bg_image') }}');"},...} -->
```

The Universal Block plugin automatically applies `data-style` on the frontend.

## Troubleshooting

### Blocks Not Converting

Check that source files are in the correct directory:
```bash
ls -la templates/html/
```

Verify NPM script paths in `package.json` match your structure.

### Dynamic Tags Not Working

Ensure Universal Block plugin is active:
```bash
wp plugin is-active universal-block
```

Test dynamic tags on frontend with `?debug=true` to see available context.

### Build Process Failing

Test CLI independently:
```bash
npx universal-block html-to-blocks templates/html/test.html
```

Check for syntax errors in HTML templates.

## Example Theme Structure

Complete example of a block theme using the CLI:

```
my-block-theme/
├── functions.php
├── style.css
├── theme.json
├── package.json
├── templates/
│   ├── html/                    # Source templates
│   │   ├── index.html
│   │   ├── single.html
│   │   ├── parts/
│   │   │   ├── header.html
│   │   │   └── footer.html
│   │   └── sections/
│   │       ├── hero.html
│   │       ├── team.html
│   │       └── cta.html
│   └── blocks/                  # Generated markup
│       ├── index.html
│       ├── single.html
│       ├── parts/
│       │   ├── header.html
│       │   └── footer.html
│       └── sections/
│           ├── hero.html
│           ├── team.html
│           └── cta.html
├── includes/
│   └── block-patterns.php       # Auto-register patterns
└── assets/
    ├── css/
    └── js/
```

## NPM Scripts Reference

```json
{
  "scripts": {
    "blocks:convert": "universal-block html-to-blocks templates/html -o templates/blocks",
    "blocks:convert-json": "universal-block html-to-blocks templates/html -o templates/blocks --format json --pretty",
    "blocks:to-html": "universal-block blocks-to-html templates/blocks -o templates/html --pretty",
    "blocks:watch": "universal-block watch templates/html -o templates/blocks",
    "build": "npm run build:css && npm run build:js && npm run blocks:convert",
    "dev": "npm run watch:css & npm run watch:js & npm run blocks:watch"
  }
}
```

## Resources

- [Universal Block CLI Documentation](https://github.com/DanielRSnell/universal-block-cli)
- [LLM Instructions for Template Creation](../llm-instructions.md)
- [Universal Block Plugin](../README.md)

## Support

For CLI issues: https://github.com/DanielRSnell/universal-block-cli/issues
For plugin issues: See main Universal Block documentation
