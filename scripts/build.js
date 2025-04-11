const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function createBrowserBuild(browser) {
    console.log(`Building for ${browser}...`);

    const outputDir = path.join(distDir, "to-annas-archive-" + browser);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const entries = fs.readdirSync(rootDir);
    for (const entry of entries) {
        const srcPath = path.join(rootDir, entry);

        if (entry.startsWith('manifest.') || entry === 'dist' || entry === 'scripts' || entry === '.git' || entry === 'resources' || entry === 'notes.txt') {
            continue;
        }
        if (browser === 'firefox' && (entry === 'background-wrapper.js' || entry === 'browser-polyfill.js')) {
            continue;
        }

        const destPath = path.join(outputDir, entry);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }

    if (browser === 'firefox') {
        // delete line 129 from options.html (browser-polyfill.js script tag)
        const optionsHtmlPath = path.join(outputDir, 'options', 'options.html');
        if (fs.existsSync(optionsHtmlPath)) {
            let optionsContent = fs.readFileSync(optionsHtmlPath, 'utf8');
            const lines = optionsContent.split('\n');

            // Remove line 129 (index 128 in zero-based array)
            if (lines.length > 128) {
                lines.splice(128, 1);
                optionsContent = lines.join('\n');
                fs.writeFileSync(optionsHtmlPath, optionsContent);
                console.log('Removed browser-polyfill.js script tag from options.html for Firefox build');
            }
        }
    }

    const manifestSrc = path.join(rootDir, `manifest.${browser.toLowerCase()}.json`);
    const manifestDest = path.join(outputDir, 'manifest.json');
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log(`Build for ${browser} completed!`);
    return outputDir;
}

// Create builds for each browser
const firefoxDir = createBrowserBuild('firefox');
const chromiumDir = createBrowserBuild('chromium');

console.log('\nBuild Summary:');
console.log('=============');
console.log(`Firefox build: ${firefoxDir}`);
console.log(`Chromium build: ${chromiumDir}`);
