const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const requireAuth = require('../../middleware/requireAuth');

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/families/mine — List all families for the current user
router.get('/mine', async (req, res, next) => {
  try {
    const { data: families, error } = await supabaseAdmin
      .from('families')
      .select('id, email, subdomain, display_name, custom_domain, plan, subscription_status, created_at')
      .eq('auth_user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // For each family, check if a book exists and get child name
    const enriched = await Promise.all(
      (families || []).map(async (fam) => {
        const { data: book } = await supabaseAdmin
          .from('books')
          .select('id, child_first_name, child_last_name, hero_image_path')
          .eq('family_id', fam.id)
          .single();

        return {
          ...fam,
          childName: book
            ? `${book.child_first_name || ''} ${book.child_last_name || ''}`.trim()
            : '',
          heroImage: book?.hero_image_path || null,
          hasBook: !!book,
        };
      })
    );

    res.json({
      families: enriched,
      activeFamilyId: req.family.id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
