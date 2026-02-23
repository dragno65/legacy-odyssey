const { Router } = require('express');
const requireAuth = require('../../middleware/requireAuth');
const bookService = require('../../services/bookService');

const router = Router();

router.use(requireAuth);

router.get('/mine', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'No book found' });
    const child = {
      first_name: book.child_first_name || '',
      middle_name: book.child_middle_name || '',
      last_name: book.child_last_name || '',
      birth_date: book.birth_date || '',
      birth_time: book.birth_time || '',
      weight_lbs: book.birth_weight_lbs || '',
      weight_oz: book.birth_weight_oz || '',
      length_inches: book.birth_length_inches || '',
      city: book.birth_city || '',
      state: book.birth_state || '',
      hospital: book.birth_hospital || '',
      name_meaning: book.name_meaning || '',
    };
    res.json({ ...book, child });
  } catch (err) { next(err); }
});

router.get('/mine/full', async (req, res, next) => {
  try {
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.status(404).json({ error: 'No book found' });
    res.json(data);
  } catch (err) { next(err); }
});

router.put('/mine', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'No book found' });
    const updates = {};
    const child = req.body.child;
    if (child && typeof child === 'object') {
      const childMap = {
        first_name: 'child_first_name', middle_name: 'child_middle_name',
        last_name: 'child_last_name', birth_date: 'birth_date', birth_time: 'birth_time',
        weight_lbs: 'birth_weight_lbs', weight_oz: 'birth_weight_oz',
        length_inches: 'birth_length_inches', city: 'birth_city',
        state: 'birth_state', hospital: 'birth_hospital', name_meaning: 'name_meaning',
      };
      for (const [mobileKey, dbKey] of Object.entries(childMap)) {
        if (child[mobileKey] !== undefined) updates[dbKey] = child[mobileKey];
      }
    }
    const allowed = [
      'child_first_name', 'child_middle_name', 'child_last_name', 'birth_date', 'birth_time',
      'birth_weight_lbs', 'birth_weight_oz', 'birth_length_inches',
      'birth_city', 'birth_state', 'birth_hospital', 'name_meaning',
      'hero_image_path', 'parent_quote', 'parent_quote_attribution', 'vault_unlock_date',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const typedColumns = ['birth_date', 'birth_time', 'birth_weight_lbs', 'birth_weight_oz', 'birth_length_inches', 'vault_unlock_date'];
    for (const col of typedColumns) {
      if (col in updates && (updates[col] === '' || updates[col] === undefined)) updates[col] = null;
    }
    if (Object.keys(updates).length === 0) return res.json(book);
    const updated = await bookService.updateBook(book.id, updates);
    res.json(updated);
  } catch (err) { next(err); }
});

router.get('/mine/before', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data: cards } = await supabaseAdmin.from('before_arrived_cards').select('*').eq('book_id', book.id).order('sort_order');
    const { data: checklist } = await supabaseAdmin.from('before_arrived_checklist').select('*').eq('book_id', book.id).order('sort_order');
    res.json({ cards: cards || [], checklist: checklist || [] });
  } catch (err) { next(err); }
});

router.put('/mine/before', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { cards, checklist } = req.body;
    if (cards) await bookService.updateSectionCards('before_arrived_cards', book.id, cards);
    if (checklist) await bookService.updateSectionCards('before_arrived_checklist', book.id, checklist);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/mine/birth', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('birth_stories').select('*').eq('book_id', book.id).maybeSingle();
    res.json(data || {});
  } catch (err) { next(err); }
});

router.put('/mine/birth', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const data = await bookService.upsertBirthStory(book.id, req.body);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/mine/coming-home', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('coming_home_cards').select('*').eq('book_id', book.id).order('sort_order');
    res.json(data || []);
  } catch (err) { next(err); }
});

router.put('/mine/coming-home', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    await bookService.updateSectionCards('coming_home_cards', book.id, req.body.cards || req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/mine/months', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('months').select('*').eq('book_id', book.id).order('month_number');
    res.json(data || []);
  } catch (err) { next(err); }
});

router.get('/mine/months/:num', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const num = parseInt(req.params.num);
    if (num < 1 || num > 12) return res.status(400).json({ error: 'Month must be 1-12' });
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('months').select('*').eq('book_id', book.id).eq('month_number', num).maybeSingle();
    if (!data) return res.status(404).json({ error: 'Month not found' });
    res.json(data);
  } catch (err) { next(err); }
});

router.put('/mine/months/:num', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const num = parseInt(req.params.num);
    if (num < 1 || num > 12) return res.status(400).json({ error: 'Month must be 1-12' });
    const data = await bookService.upsertMonth(book.id, num, req.body);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/mine/family', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('family_members').select('*').eq('book_id', book.id).order('sort_order');
    res.json(data || []);
  } catch (err) { next(err); }
});

router.put('/mine/family/:key', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const data = await bookService.upsertFamilyMember(book.id, req.params.key, req.body);
    res.json(data);
  } catch (err) { next(err); }
});

const sectionTables = { firsts: 'firsts', celebrations: 'celebrations', letters: 'letters', recipes: 'recipes' };

for (const [route, table] of Object.entries(sectionTables)) {
  router.get(`/mine/${route}`, async (req, res, next) => {
    try {
      const book = await bookService.getBookByFamilyId(req.family.id);
      const { supabaseAdmin } = require('../../config/supabase');
      const { data } = await supabaseAdmin.from(table).select('*').eq('book_id', book.id).order('sort_order');
      res.json(data || []);
    } catch (err) { next(err); }
  });
  router.put(`/mine/${route}`, async (req, res, next) => {
    try {
      const book = await bookService.getBookByFamilyId(req.family.id);
      await bookService.updateSectionCards(table, book.id, req.body.items || req.body);
      res.json({ success: true });
    } catch (err) { next(err); }
  });
}

router.get('/mine/vault', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('vault_items').select('*').eq('book_id', book.id).order('created_at');
    res.json(data || []);
  } catch (err) { next(err); }
});

router.post('/mine/vault', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('vault_items').insert({ book_id: book.id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.put('/mine/settings', async (req, res, next) => {
  try {
    const { book_password, custom_domain } = req.body;
    const updates = {};
    if (book_password) updates.book_password = book_password;
    if (custom_domain !== undefined) updates.custom_domain = custom_domain;
    const familyService = require('../../services/familyService');
    const family = await familyService.update(req.family.id, updates);
    res.json(family);
  } catch (err) { next(err); }
});

module.exports = router;
