const { supabaseAdmin } = require('../config/supabase');

const BUCKET = 'photos';

function getPublicUrl(storagePath) {
  if (!storagePath) return null;
  // If it's already a full URL, return as-is
  if (storagePath.startsWith('http')) return storagePath;
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

function getStoragePath(familyId, section, identifier, ext = '.jpg') {
  return `${familyId}/${section}/${identifier}${ext}`;
}

module.exports = { getPublicUrl, getStoragePath, BUCKET };
