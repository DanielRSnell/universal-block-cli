# Universal Block CLI - Quick Start

## Installation

```bash
cd package
npm install
npm link
```

## Basic Usage

### 1. Convert HTML to Blocks

```bash
universal-block html-to-blocks templates/ -o blocks/ --pretty
```

### 2. Convert Blocks to HTML

```bash
universal-block blocks-to-html blocks/ -o html/ --pretty
```

## Example Workflow

### Create an HTML Template

Create `my-template.html`:

```html
<section class="hero bg-blue-600 text-white py-20">
  <div class="container mx-auto">
    <h1>{{ post.title }}</h1>
    <p>{{ post.meta('subtitle') }}</p>
  </div>
</section>
```

### Convert to Blocks

```bash
universal-block html-to-blocks my-template.html --pretty
```

This creates `blocks/my-template.json` with WordPress block structure.

### Use in WordPress

Copy the JSON and import into WordPress:

1. Open WordPress block editor
2. Use Universal Block's import feature
3. Paste the JSON content
4. Blocks are created automatically!

### Convert Back to HTML (Optional)

```bash
universal-block blocks-to-html blocks/my-template.json
```

Creates `html/my-template.html` - useful for documentation or sharing.

## Dynamic Tags

The CLI supports all Universal Block dynamic tags:

### Variable Assignment

```html
<set variable="site_name" value="site.name" />
<h1>{{ site_name }}</h1>
```

### Loops

```html
<loop source="post.meta('team_members')">
  <div class="member">
    <h3>{{ item.name }}</h3>
    <p>{{ item.title }}</p>
  </div>
</loop>
```

### Conditionals

```html
<if source="user.ID > 0">
  <p>Welcome, {{ user.display_name }}!</p>
</if>
```

## Tips

1. **Use `--pretty`** for readable output
2. **Organize templates** in directories (e.g., `templates/sections/`, `templates/components/`)
3. **Version control** - Commit both HTML and JSON for team collaboration
4. **Test templates** in WordPress before sharing

## Common Commands

```bash
# Convert all templates
universal-block html-to-blocks templates/ -o blocks/ --pretty

# Convert specific pattern
universal-block html-to-blocks templates/ -p "**/hero-*.html"

# Export blocks for documentation
universal-block blocks-to-html blocks/ -o docs/html/ --pretty

# Single file conversion
universal-block html-to-blocks hero.html
```

## Next Steps

- Read [full documentation](./README.md)
- Check [LLM instructions](../llm-instructions.md) for template creation
- View [example templates](./templates/examples/)

## Support

For issues or questions, see the main [Universal Block documentation](../README.md).
