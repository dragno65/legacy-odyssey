const { supabaseAdmin } = require('../config/supabase');
const seedData = require('../utils/seedData');

// --- Read operations ---

async function getBookByFamilyId(familyId) {
  const { data } = await supabaseAdmin
    .from('books')
    .select('*')
    .eq('family_id', familyId)
    .single();
  return data;
}

async function getFullBook(familyId) {
  const book = await getBookByFamilyId(familyId);
  if (!book) return null;

  const [
    { data: beforeCards },
    { data: checklist },
    { data: birthStory },
    { data: comingHomeCards },
    { data: months },
    { data: familyMembers },
    { data: firsts },
    { data: celebrations },
    { data: letters },
    { data: recipes },
    { data: vaultItems },
  ] = await Promise.all([
    supabaseAdmin.from('before_arrived_cards').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('before_arrived_checklist').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('birth_stories').select('*').eq('book_id', book.id).maybeSingle(),
    supabaseAdmin.from('coming_home_cards').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('months').select('*').eq('book_id', book.id).order('month_number'),
    supabaseAdmin.from('family_members').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('firsts').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('celebrations').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('letters').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('recipes').select('*').eq('book_id', book.id).order('sort_order'),
    supabaseAdmin.from('vault_items').select('*').eq('book_id', book.id).order('created_at'),
  ]);

  return {
    book,
    beforeCards: beforeCards || [],
    checklist: checklist || [],
    birthStory: birthStory || {},
    comingHomeCards: comingHomeCards || [],
    months: months || [],
    familyMembers: familyMembers || [],
    firsts: firsts || [],
    celebrations: celebrations || [],
    letters: letters || [],
    recipes: recipes || [],
    vaultItems: vaultItems || [],
  };
}

// --- Write operations ---

async function updateBook(bookId, fields) {
  const { data, error } = await supabaseAdmin
    .from('books')
    .update(fields)
    .eq('id', bookId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertMonth(bookId, monthNumber, fields) {
  // Whitelist allowed fields to prevent DB errors from unknown columns
  const allowed = ['label', 'highlight', 'weight', 'length', 'photo_path', 'note'];
  const safe = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) safe[key] = fields[key];
  }

  // Check if month row exists (months are seeded at book creation)
  const { data: existing } = await supabaseAdmin
    .from('months')
    .select('id')
    .eq('book_id', bookId)
    .eq('month_number', monthNumber)
    .maybeSingle();

  if (existing) {
    // Update existing row (avoids NOT NULL constraint issues with upsert)
    const { data, error } = await supabaseAdmin
      .from('months')
      .update(safe)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Insert new row with default label if not provided
    if (!safe.label) safe.label = 'Month ' + monthNumber;
    const { data, error } = await supabaseAdmin
      .from('months')
      .insert({ book_id: bookId, month_number: monthNumber, ...safe })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

async function upsertFamilyMember(bookId, memberKey, fields) {
  const { data, error } = await supabaseAdmin
    .from('family_members')
    .upsert({ book_id: bookId, member_key: memberKey, ...fields }, { onConflict: 'book_id,member_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertBirthStory(bookId, fields) {
  // Whitelist allowed fields to prevent DB errors from unknown columns
  const allowed = ['first_held_by', 'mom_narrative', 'dad_narrative', 'mom_photo_1', 'mom_photo_2', 'dad_photo_1', 'dad_photo_2'];
  const safe = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) safe[key] = fields[key];
  }

  // Check if exists
  const { data: existing } = await supabaseAdmin
    .from('birth_stories')
    .select('id')
    .eq('book_id', bookId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('birth_stories')
      .update(safe)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabaseAdmin
      .from('birth_stories')
      .insert({ book_id: bookId, ...safe })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

async function updateSectionCards(table, bookId, cards) {
  // NOT NULL defaults for each table (PostgreSQL rejects NULL but allows empty string)
  const NOT_NULL_DEFAULTS = {
    before_arrived_cards: { title: '(untitled)' },
    coming_home_cards: { title: '(untitled)' },
    firsts: { title: '(untitled)', emoji: '⭐' },
    celebrations: { title: '(untitled)' },
    letters: { from_label: '(anonymous)' },
    recipes: { title: '(untitled)' },
    before_arrived_checklist: { label: '(item)' },
  };

  const defaults = NOT_NULL_DEFAULTS[table] || {};

  // Filter out completely empty cards (no meaningful user content)
  const meaningful = cards.filter((card) => {
    const { photo_path, sort_order, book_id, id, created_at, updated_at, ...fields } = card;
    return Object.values(fields).some((v) => v !== undefined && v !== null && v !== '' && v !== false);
  });

  // Apply NOT NULL defaults for required fields
  const cleaned = meaningful.map((card) => {
    const row = { ...card };
    for (const [key, defaultVal] of Object.entries(defaults)) {
      if (row[key] === undefined || row[key] === null || (typeof row[key] === 'string' && !row[key].trim())) {
        row[key] = defaultVal;
      }
    }
    // Strip any fields that Supabase won't recognize (e.g., 'id' from client)
    delete row.id;
    delete row.created_at;
    delete row.updated_at;
    delete row.book_id;
    return row;
  });

  // Delete existing, then insert new
  await supabaseAdmin.from(table).delete().eq('book_id', bookId);
  if (cleaned.length > 0) {
    const rows = cleaned.map((card, i) => ({ book_id: bookId, sort_order: i, ...card }));
    const { data, error } = await supabaseAdmin.from(table).insert(rows).select();
    if (error) throw error;
    return data;
  }
  return [];
}

// --- Seed a new book with default content ---

async function createBookWithDefaults(familyId) {
  // Create the book
  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .insert({
      family_id: familyId,
      child_first_name: '',
      child_middle_name: '',
      child_last_name: '',
      parent_quote: 'From the moment we first saw your face, our world was never the same. This is your story \u2014 every moment, every milestone, every memory \u2014 written just for you.',
      parent_quote_attribution: 'Mom & Dad',
    })
    .select()
    .single();
  if (bookError) throw bookError;

  // Seed all default content in parallel
  await Promise.all([
    supabaseAdmin.from('before_arrived_cards').insert(
      seedData.defaultBeforeCards.map((c) => ({ book_id: book.id, ...c }))
    ),
    supabaseAdmin.from('coming_home_cards').insert(
      seedData.defaultComingHomeCards.map((c) => ({ book_id: book.id, ...c }))
    ),
    supabaseAdmin.from('months').insert(
      seedData.defaultMonths.map((m) => ({ book_id: book.id, ...m }))
    ),
    supabaseAdmin.from('family_members').insert(
      seedData.defaultFamilyMembers.map((fm) => ({ book_id: book.id, ...fm }))
    ),
    supabaseAdmin.from('firsts').insert(
      seedData.defaultFirsts.map((f) => ({ book_id: book.id, ...f }))
    ),
    supabaseAdmin.from('celebrations').insert(
      seedData.defaultCelebrations.map((c) => ({ book_id: book.id, ...c }))
    ),
    supabaseAdmin.from('letters').insert(
      seedData.defaultLetters.map((l) => ({ book_id: book.id, ...l }))
    ),
    supabaseAdmin.from('recipes').insert(
      seedData.defaultRecipes.map((r) => ({ book_id: book.id, ...r }))
    ),
    supabaseAdmin.from('birth_stories').insert({ book_id: book.id, first_held_by: 'Mom / Dad' }),
  ]);

  return book;
}

module.exports = {
  getBookByFamilyId,
  getFullBook,
  updateBook,
  upsertMonth,
  upsertFamilyMember,
  upsertBirthStory,
  updateSectionCards,
  createBookWithDefaults,
};

