import fs from 'node:fs/promises';
import path from 'node:path';

const posts = [
  'DQq6gjlkX2R',
  'DQq6XsPEUa1',
  'DQq6WXFkf0h',
  'DQn0C2bjLWn',
  'DQn0BU8DLdd',
  'DQnz_PRDFcB',
  'DQnz7IODL8m',
  'DQnz41OjMvx',
  'DQnz1hTDM6Y',
  'C_Ovy8PCcQ-',
  'Cthl8uZsiip',
  'Ct-LaJdLgHH',
];

const outputDir = path.resolve('public/images/instagram');

const decodeHtml = (value) => value.replaceAll('&amp;', '&');

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao acessar ${url}: ${response.status}`);
  }

  return response.text();
};

const fetchBuffer = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      referer: 'https://www.instagram.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url}: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

await fs.mkdir(outputDir, { recursive: true });

for (const code of posts) {
  const html = await fetchText(`https://www.instagram.com/p/${code}/`);
  const match = html.match(/<meta property="og:image" content="([^"]+)"/i);

  if (!match) {
    throw new Error(`og:image não encontrado para ${code}`);
  }

  const imageUrl = decodeHtml(match[1]);
  const imageBuffer = await fetchBuffer(imageUrl);
  const destination = path.join(outputDir, `${code}.jpg`);

  await fs.writeFile(destination, imageBuffer);
  console.log(`thumb salva: ${destination}`);
}
