const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const srcHtmlPath = path.join(rootDir, 'index.html');
const srcInputCss = path.join(rootDir, 'src', 'input.css');
const distCssPath = path.join(distDir, 'css', 'style.css');
const distJsPath = path.join(distDir, 'js', 'main.js');

function ensureHeadTag(html, regex, tag) {
  return regex.test(html) ? html : html.replace('</head>', `    ${tag}\n</head>`);
}

function toDistAssetPath(localPath) {
  if (localPath.startsWith('img/')) return `assets/${localPath}`;
  if (localPath === 'favicon.ico') return 'assets/favicon.ico';
  return localPath;
}

async function run() {
  if (!fs.existsSync(srcHtmlPath)) {
    throw new Error('Arquivo index.html não encontrado na raiz.');
  }

  await fs.remove(distDir);
  await fs.ensureDir(path.join(distDir, 'css'));
  await fs.ensureDir(path.join(distDir, 'js'));
  await fs.ensureDir(path.join(distDir, 'assets'));

  if (fs.existsSync(path.join(rootDir, 'img'))) {
    await fs.copy(path.join(rootDir, 'img'), path.join(distDir, 'assets', 'img'));
  }
  if (fs.existsSync(path.join(rootDir, 'favicon.ico'))) {
    await fs.copy(path.join(rootDir, 'favicon.ico'), path.join(distDir, 'assets', 'favicon.ico'));
  }

  execSync(`npx tailwindcss -i "${srcInputCss}" -o "${distCssPath}" --minify`, {
    stdio: 'inherit',
    cwd: rootDir,
  });

  const cssRaw = await fs.readFile(distCssPath, 'utf8');
  const cssMin = new CleanCSS({ level: 2 }).minify(cssRaw).styles;
  await fs.writeFile(distCssPath, cssMin, 'utf8');

  let html = await fs.readFile(srcHtmlPath, 'utf8');

  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, '<link rel="canonical" href="https://pos.personaltraineracademy.com.br/">');
  html = ensureHeadTag(html, /<link\s+rel="canonical"/i, '<link rel="canonical" href="https://pos.personaltraineracademy.com.br/">');

  html = ensureHeadTag(html, /<meta\s+name="description"/i, '<meta name="description" content="Pós-graduação em Musculação e Periodização Avançada reconhecida pelo MEC. 18 meses, 100% online. Desenvolva programas de periodização científicos e eleve sua renda. Matrículas abertas.">');
  html = ensureHeadTag(html, /<meta\s+property="og:title"/i, '<meta property="og:title" content="Pós-Graduação em Musculação e Periodização Avançada | PTA">');
  html = ensureHeadTag(html, /<meta\s+property="og:description"/i, '<meta property="og:description" content="Pós-graduação reconhecida pelo MEC. 18 meses, 100% online. Periodização científica para hipertrofia, força e desempenho. Personal Trainer Academy.">');
  html = ensureHeadTag(html, /<meta\s+property="og:image"/i, '<meta property="og:image" content="https://pos.personaltraineracademy.com.br/assets/img/og-banner.webp">');
  html = ensureHeadTag(html, /<meta\s+property="og:url"/i, '<meta property="og:url" content="https://pos.personaltraineracademy.com.br/">');
  html = ensureHeadTag(html, /<meta\s+name="twitter:card"/i, '<meta name="twitter:card" content="summary_large_image">');
  html = ensureHeadTag(html, /<meta\s+name="twitter:title"/i, '<meta name="twitter:title" content="Pós-Graduação em Musculação e Periodização Avançada | PTA">');
  html = ensureHeadTag(html, /<meta\s+name="twitter:description"/i, '<meta name="twitter:description" content="Pós-graduação reconhecida pelo MEC. 18 meses, 100% online. Periodização científica. Matrículas abertas.">');
  html = ensureHeadTag(html, /<meta\s+name="twitter:image"/i, '<meta name="twitter:image" content="https://pos.personaltraineracademy.com.br/assets/img/og-banner.webp">');
  html = ensureHeadTag(html, /fonts\.googleapis\.com/i, '<link rel="preconnect" href="https://fonts.googleapis.com">');
  html = ensureHeadTag(html, /fonts\.gstatic\.com/i, '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  html = ensureHeadTag(html, /cdnjs\.cloudflare\.com/i, '<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>');
  html = ensureHeadTag(html, /unpkg\.com/i, '<link rel="preconnect" href="https://unpkg.com" crossorigin>');

  html = html.replace(/<img([^>]*?)alt=""([^>]*?)>/gi, '<img$1alt="Imagem da página da Pós-graduação em Musculação e Periodização Avançada"$2>');

  html = html.replace(/<link[^>]+href=["']\.?\/?output\.css["'][^>]*>/i, '<link href="css/style.css" rel="stylesheet">');
  html = html.replace(/<link[^>]+href=["']css\/style\.css["'][^>]*>/i, '<link href="css/style.css" rel="stylesheet">');

  html = html.replace(/(src|href)=["']([^"']+)["']/g, (full, attr, url) => {
    if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(url)) return full;
    const clean = url.replace(/^\.\//, '');
    return `${attr}="${toDistAssetPath(clean)}"`;
  });

  let bundledCode = '';
  html = html.replace(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, code) => {
    if (/googletagmanager\.com|gtm\.start/i.test(code)) return full;
    if (!code.trim()) return '';
    bundledCode += `\n${code.trim()}\n`;
    return '';
  });

  if (bundledCode.trim()) {
    const minJsResult = await minifyJs(bundledCode, {
      compress: true,
      mangle: true,
      format: { comments: false },
    });
    await fs.writeFile(distJsPath, minJsResult.code || '', 'utf8');
    html = html.replace('</body>', '<script src="js/main.js"></script>\n</body>');
  }

  const htmlMin = await minifyHtml(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: false,
  });

  await fs.writeFile(path.join(distDir, 'index.html'), htmlMin, 'utf8');
  console.log('Build finalizado com sucesso em dist/.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
