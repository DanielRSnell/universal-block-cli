#!/usr/bin/env node

/**
 * Universal Block CLI
 * Convert HTML templates to WordPress block markup and vice versa
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { glob } = require('glob');
const { parseHTMLToBlocks, parseBlocksToHTML, parseBlocksToWPMarkup } = require('../src/index');

const program = new Command();

program
	.name('universal-block')
	.description('CLI tool to convert HTML templates to WordPress Universal Block markup and vice versa')
	.version('1.0.0');

/**
 * HTML to Blocks Command
 */
program
	.command('html-to-blocks')
	.description('Convert HTML files to WordPress block markup')
	.argument('<input>', 'Input directory or file path')
	.option('-o, --output <path>', 'Output directory (default: ./blocks)')
	.option('-p, --pattern <pattern>', 'Glob pattern for HTML files (default: **/*.html)', '**/*.html')
	.option('--format <format>', 'Output format: wp (WordPress markup) or json (default: wp)', 'wp')
	.option('--pretty', 'Pretty print output', false)
	.action(async (input, options) => {
		try {
			const outputDir = options.output || './blocks';
			const stats = fs.statSync(input);

			console.log(chalk.blue('🔄 Converting HTML to Blocks...'));
			console.log(chalk.gray(`Input: ${input}`));
			console.log(chalk.gray(`Output: ${outputDir}\n`));

			// Ensure output directory exists
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			let files = [];

			if (stats.isDirectory()) {
				// Find all HTML files in directory
				const pattern = path.join(input, options.pattern);
				files = await glob(pattern, { nodir: true });
			} else {
				// Single file
				files = [input];
			}

			if (files.length === 0) {
				console.log(chalk.yellow('⚠️  No HTML files found'));
				return;
			}

			let successCount = 0;
			let errorCount = 0;

			for (const file of files) {
				try {
					// Read HTML file
					const html = fs.readFileSync(file, 'utf-8');

					// Convert to blocks
					const blocks = parseHTMLToBlocks(html);

					// Generate output filename
					const relativePath = stats.isDirectory()
						? path.relative(input, file)
						: path.basename(file);

					const outputExt = options.format === 'json' ? '.json' : '.html';
					const outputFile = path.join(
						outputDir,
						relativePath.replace(/\.html$/, outputExt)
					);

					// Ensure output subdirectory exists
					const outputSubdir = path.dirname(outputFile);
					if (!fs.existsSync(outputSubdir)) {
						fs.mkdirSync(outputSubdir, { recursive: true });
					}

					// Generate output based on format
					let output;
					if (options.format === 'json') {
						// JSON format
						output = options.pretty
							? JSON.stringify(blocks, null, 2)
							: JSON.stringify(blocks);
					} else {
						// WordPress markup format (default)
						output = parseBlocksToWPMarkup(blocks);
					}

					fs.writeFileSync(outputFile, output, 'utf-8');

					console.log(chalk.green('✓'), chalk.gray(relativePath), '→', chalk.cyan(path.basename(outputFile)));
					successCount++;
				} catch (error) {
					console.log(chalk.red('✗'), chalk.gray(path.basename(file)), chalk.red(error.message));
					errorCount++;
				}
			}

			console.log();
			console.log(chalk.green(`✅ Converted ${successCount} file(s)`));
			if (errorCount > 0) {
				console.log(chalk.red(`❌ ${errorCount} error(s)`));
			}
		} catch (error) {
			console.error(chalk.red('Error:'), error.message);
			process.exit(1);
		}
	});

/**
 * Blocks to HTML Command
 */
program
	.command('blocks-to-html')
	.description('Convert WordPress block markup (JSON) back to HTML')
	.argument('<input>', 'Input directory or file path')
	.option('-o, --output <path>', 'Output directory (default: ./html)')
	.option('-p, --pattern <pattern>', 'Glob pattern for JSON files (default: **/*.json)', '**/*.json')
	.option('--pretty', 'Pretty print HTML output with indentation', false)
	.action(async (input, options) => {
		try {
			const outputDir = options.output || './html';
			const stats = fs.statSync(input);

			console.log(chalk.blue('🔄 Converting Blocks to HTML...'));
			console.log(chalk.gray(`Input: ${input}`));
			console.log(chalk.gray(`Output: ${outputDir}\n`));

			// Ensure output directory exists
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}

			let files = [];

			if (stats.isDirectory()) {
				// Find all JSON files in directory
				const pattern = path.join(input, options.pattern);
				files = await glob(pattern, { nodir: true });
			} else {
				// Single file
				files = [input];
			}

			if (files.length === 0) {
				console.log(chalk.yellow('⚠️  No JSON files found'));
				return;
			}

			let successCount = 0;
			let errorCount = 0;

			for (const file of files) {
				try {
					// Read JSON file
					const json = fs.readFileSync(file, 'utf-8');
					const blocks = JSON.parse(json);

					// Convert to HTML
					const html = parseBlocksToHTML(blocks, { pretty: options.pretty });

					// Generate output filename
					const relativePath = stats.isDirectory()
						? path.relative(input, file)
						: path.basename(file);
					const outputFile = path.join(
						outputDir,
						relativePath.replace(/\.json$/, '.html')
					);

					// Ensure output subdirectory exists
					const outputSubdir = path.dirname(outputFile);
					if (!fs.existsSync(outputSubdir)) {
						fs.mkdirSync(outputSubdir, { recursive: true });
					}

					// Write HTML file
					fs.writeFileSync(outputFile, html, 'utf-8');

					console.log(chalk.green('✓'), chalk.gray(relativePath), '→', chalk.cyan(path.basename(outputFile)));
					successCount++;
				} catch (error) {
					console.log(chalk.red('✗'), chalk.gray(path.basename(file)), chalk.red(error.message));
					errorCount++;
				}
			}

			console.log();
			console.log(chalk.green(`✅ Converted ${successCount} file(s)`));
			if (errorCount > 0) {
				console.log(chalk.red(`❌ ${errorCount} error(s)`));
			}
		} catch (error) {
			console.error(chalk.red('Error:'), error.message);
			process.exit(1);
		}
	});

/**
 * Watch Command (bonus feature)
 */
program
	.command('watch')
	.description('Watch directory for changes and auto-convert')
	.argument('<input>', 'Input directory to watch')
	.option('-o, --output <path>', 'Output directory')
	.option('--mode <mode>', 'Conversion mode: html-to-blocks or blocks-to-html', 'html-to-blocks')
	.action((input, options) => {
		console.log(chalk.yellow('Watch mode not yet implemented'));
		console.log(chalk.gray('Coming soon in v1.1.0'));
	});

program.parse();
