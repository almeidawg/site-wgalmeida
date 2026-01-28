const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dkkj9mpqv',
  api_key: '233356754886313',
  api_secret: 'N8aYoC7iPMRfUwGPqWOMWnwu9uM'
});

const videos = [
  { file: './public/videos/hero/HORIZONTAL.mp4', publicId: 'wgalmeida/hero-horizontal' },
  { file: './public/videos/hero/VERTICAL.mp4', publicId: 'wgalmeida/hero-vertical' },
  { file: './public/videos/videosobrenos.mp4', publicId: 'wgalmeida/sobre-nos' }
];

async function uploadVideos() {
  for (const video of videos) {
    console.log('\nUploading ' + video.file + '...');
    try {
      const result = await cloudinary.uploader.upload_large(video.file, {
        resource_type: 'video',
        public_id: video.publicId,
        overwrite: true,
        chunk_size: 20000000,
        timeout: 600000
      });
      console.log('OK: ' + result.secure_url);
    } catch (err) {
      console.error('Erro: ' + err.message);
    }
  }
  console.log('\nUpload completo!');
}

uploadVideos();
