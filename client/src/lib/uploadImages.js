function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({
        data: base64,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function filesToPayload(personFile, clothFiles) {
  const personImage = await fileToBase64(personFile);
  const clothImages = await Promise.all(clothFiles.map(fileToBase64));
  return { personImage, clothImages };
}
