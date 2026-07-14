/** Generate a downloadable Debut Author certificate (HTML scaffold). */

export function downloadDebutCertificate(opts: {
  storyTitle: string;
  awardLabel: string;
  authorName?: string;
  locale: 'te' | 'en';
}): void {
  const { storyTitle, awardLabel, authorName = 'Katha Author', locale } = opts;
  const isTe = locale === 'te';
  const title = isTe ? 'కథా అవతరణ ప్రమాణపత్రం' : 'Katha Debut Author Certificate';
  const body = isTe
    ? `ఈ ప్రమాణపత్రం ${authorName} గారికి "${storyTitle}" నవల పూర్తి చేసినందుకు ${awardLabel} గుర్తింపుతో బహూకరించబడుతుంది.`
    : `This certifies that ${authorName} completed "${storyTitle}" and earned the ${awardLabel} recognition in Katha Debut Season.`;
  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Georgia, serif; margin: 48px; color: #3d1515; background: #faf8f4; }
    .frame { border: 3px double #c9a227; padding: 48px; max-width: 640px; margin: 0 auto; text-align: center; }
    h1 { font-size: 1.75rem; margin: 0 0 8px; }
    .award { font-size: 1.125rem; color: #8b6914; margin: 24px 0; }
    p { line-height: 1.6; font-size: 1rem; }
    .seal { margin-top: 32px; font-size: 2rem; }
  </style>
</head>
<body>
  <div class="frame">
    <h1>${title}</h1>
    <p class="award">${awardLabel}</p>
    <p>${body}</p>
    <p class="seal" aria-hidden>క</p>
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `katha-debut-certificate-${storyTitle.replace(/\s+/g, '-').slice(0, 40)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}