const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'dkkj9mpqv',
  api_key: '233356754886313',
  api_secret: 'N8aYoC7iPMRfUwGPqWOMWnwu9uM'
});

function getAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllImages(filePath, fileList);
    } else if (/\.(webp|jpg|jpeg|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

async function uploadImages() {
  const images = getAllImages('./public/images');
  console.log('Total images:', images.length);
  
  let uploaded = 0;
  let errors = 0;
  
  for (const img of images) {
    const relativePath = img.replace('public\images\', '').replace('public/images/', '');
    const publicId = 'wgalmeida/' + relativePath.replace(/\.[^.]+$/, '').split('\').join('/').split('/').join('/');
    
    try {
      await cloudinary.uploader.upload(img, {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image'
      });
      uploaded++;
      if (uploaded % 50 === 0) {
        console.log('Uploaded:', uploaded + '/' + images.length);
      }
    } catch (err) {
      errors++;
    }
  }
  
  console.log('\nCompleto! Uploaded:', uploaded, 'Errors:', errors);
}

uploadImages();
