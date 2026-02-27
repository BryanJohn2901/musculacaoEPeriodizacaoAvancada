# Deploy - Pós Musculação e Periodização Avançada

## Conteúdo da pasta `dist`

- **index.html** – Página principal (SEO, meta tags, semântica, performance)
- **css/style.css** – CSS compilado (Tailwind) para produção
- **img/** – Coloque aqui as imagens:
  - **logo.svg** – Logo (já usado no projeto)
  - **bgHero.webp** e **bgHeroMobile.webp** – Heróis (converta de jpg/png para webp)
  - **professores/** – Fotos em **.webp**: `1.webp`, `2-3.webp`, … `18-3.webp`
  - **og-banner.webp** – Banner para redes sociais (1200×630 px) para Open Graph / Twitter
  - **favicon.ico**, **favicon-16x16.png**, **favicon-32x32.png**, **apple-touch-icon.png** (opcional)

## Antes de subir

1. Troque **https://URL_DO_SEU_SITE.com.br** no `index.html` pela URL real (canonical, og:url, og:image, twitter:image).
2. Converta todas as imagens para **WebP** (ex.: com Node/Sharp ou ferramentas online). Os nomes no HTML já estão como `.webp`.
3. Gere o **og-banner.webp** em 1200×630 px e salve em `img/og-banner.webp`.
4. Se quiser favicons, gere e coloque em `img/` ou na raiz (`favicon.ico`).

## Servidor

- Suba todo o conteúdo da pasta **dist** para a raiz do seu domínio (ou para o diretório configurado no servidor).
- Em **Apache**, o `.htaccess` já está em `dist/`: copie para a raiz do site para ativar HTTPS, Gzip e cache.
- Em **Nginx**, configure redirecionamento HTTPS, Gzip e Cache-Control conforme sua hospedagem.

## Build do CSS (opcional)

Na raiz do projeto (fora de `dist`):

```bash
npm install
npm run build
```

Isso gera/atualiza `dist/css/style.css`. Se você já tiver esse arquivo em `dist`, pode apenas enviar a pasta para o servidor.
