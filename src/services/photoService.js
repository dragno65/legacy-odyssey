const { supabaseAdmin } = require('../config/supabase');
const { BUCKET } = require('../utils/imageUrl');

async function upload(familyId, section, identifier, fileBuffer, mimeType) {
  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  const storagePath = `${familyId}/${section}/${identifier}${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return { path: storagePath, url: urlData.publicUrl };
}

async function remove(storagePath) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([storagePath]);
  if (error) throw error;
}

async function list(familyId, section) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(`${familyId}/${section}`);
  if (error) throw error;
  return data || [];
}

module.exports = { upload, remove, list };
