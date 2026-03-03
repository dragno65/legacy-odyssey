/**
 * migrate-website-content.js
 *
 * Migrates the hardcoded content from www.eowynhoperagno.com into the
 * Supabase database so the mobile app and website share the same data source.
 *
 * Steps:
 *   1. Download images from the static website
 *   2. Upload them to Supabase Storage (photos bucket)
 *   3. Update/insert database records with real content
 *
 * Usage:  node scripts/migrate-website-content.js
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FAMILY_ID = 'fb16691d-7ea4-4c93-9827-ffe8904ced6b';
const BOOK_ID = '501e0807-d950-4004-8b4c-9b0f0ce0c910';
const BUCKET = 'photos';
const WEBSITE_BASE = 'https://www.eowynhoperagno.com';

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'LegacyOdyssey-Migration/1.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function guessMimeType(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/**
 * Download an image from the website and upload it to Supabase Storage.
 * Returns the storage path (e.g., "familyId/section/filename.jpg").
 */
async function migrateImage(relativePath, section, customName) {
  const url = `${WEBSITE_BASE}/${encodeURI(relativePath)}`;
  const ext = relativePath.match(/\.\w+$/)?.[0] || '.jpg';
  const storageName = customName
    ? `${customName}${ext}`
    : relativePath.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${FAMILY_ID}/${section}/${storageName}`;
  const mime = guessMimeType(relativePath);

  console.log(`  Downloading: ${url}`);
  let buffer;
  try {
    buffer = await fetchBuffer(url);
  } catch (err) {
    console.error(`  ✗ Failed to download ${url}: ${err.message}`);
    return null;
  }

  console.log(`  Uploading:   ${storagePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mime, upsert: true });
  if (error) {
    console.error(`  ✗ Upload failed for ${storagePath}: ${error.message}`);
    return null;
  }
  console.log(`  ✓ Uploaded:  ${storagePath}`);
  return storagePath;
}

// ──────────────────────────────────────────────────
// 1. Update Book Record (child info / birth details)
// ──────────────────────────────────────────────────

async function updateBookRecord() {
  console.log('\n═══ Updating Book Record ═══');

  // Upload hero image
  const heroPath = await migrateImage('images/slider/1.jpg', 'hero', 'hero');

  const { error } = await supabase
    .from('books')
    .update({
      child_first_name: 'Eowyn',
      child_middle_name: 'Hope',
      child_last_name: 'Ragno',
      birth_date: '2014-03-07',
      birth_time: '18:08:00',
      birth_weight_lbs: 6,
      birth_weight_oz: 9,
      birth_length_inches: 19.75,
      birth_city: 'Scottsdale',
      birth_state: 'AZ',
      birth_hospital: 'Scottsdale Shea',
      name_meaning: 'Brave & Beautiful',
      hero_image_path: heroPath,
      parent_quote:
        'Eowyn, I call you my miracle baby, because Mommy was told she could never have a baby. I thank God for you every day.',
      parent_quote_attribution: 'Mom',
    })
    .eq('id', BOOK_ID);

  if (error) throw error;
  console.log('✓ Book record updated');
}

// ──────────────────────────────────────────────────
// 2. Migrate Birth Story
// ──────────────────────────────────────────────────

async function migrateBirthStory() {
  console.log('\n═══ Migrating Birth Story ═══');

  const dadPhoto = await migrateImage('images/dadybaby1.png', 'birth', 'dad-with-baby');

  const dadNarrative = `Your mom was in labor for more than 24 hours with you! We were nervous wrecks! The entire hospital staff was great. We started in one big room at the hospital, and your mom kept pushing, but you weren't coming out. When they finally decided to take you out with a C-section, we were wheeled into a different room, and it was a little scary looking! Your mom was laid down on a weird table, and I sat near her head, and there was a curtain that was blocking us from seeing anything below her waist. The nurse there was really nice, and talked to us to calm us down. He asked if I wanted to see. I said "no", because I really didn't want to see any blood or anything! But, he was adamant, and he told me he would tell me the exact time to look up. As soon as they pulled you out, he said "stand up." I did, and my eyes immediately focused entirely on you. Everything else went blank, and I could only see you. I was in love completely and deeply, and always will be. It was such an incredible moment, and I'll never forget it.`;

  const momNarrative = `The day you were born was the happiest day of my life. I was excited, and scared at the same time as we were driving to the hospital. (Mommy is kind of a wimp when it comes to pain!) I thought you would be delivered normally, but the cord was wrapped around your neck, and you could not come out safely. Dr. Francois decided that I would need a C-section to deliver you. As the doctors laid me down, I was so anxious! I wanted to meet my baby girl, and I wanted everything to run smoothly! Daddy was there with me, which made me feel so much better. When they took you out, I wanted to hear you cry, but heard nothing. I yelled, "Why isn't she crying? Is she ok???" The doctor said, "She is just fine, and she's beautiful!" I was so relieved! You were born, finally! I was so excited to meet you that I felt as if I was bursting with joy. Eowyn, I call you my miracle baby, because Mommy was told she could never have a baby. I thank God for you every day. I could not love someone more than I love you.`;

  // Check if birth story exists
  const { data: existing } = await supabase
    .from('birth_stories')
    .select('id')
    .eq('book_id', BOOK_ID)
    .maybeSingle();

  const fields = {
    first_held_by: 'Mom & Dad',
    dad_narrative: dadNarrative,
    mom_narrative: momNarrative,
    dad_photo_1: dadPhoto,
  };

  if (existing) {
    const { error } = await supabase
      .from('birth_stories')
      .update(fields)
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('birth_stories')
      .insert({ book_id: BOOK_ID, ...fields });
    if (error) throw error;
  }

  console.log('✓ Birth story updated');
}

// ──────────────────────────────────────────────────
// 3. Migrate Months
// ──────────────────────────────────────────────────

async function migrateMonths() {
  console.log('\n═══ Migrating Month-by-Month Photos ═══');

  const monthsData = [
    { num: 1, label: 'One Month', highlight: 'Your very first month!', photo: 'images/firstYear/1month.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ. Your first month of life!' },
    { num: 2, label: 'Two Months', highlight: 'Growing so fast!', photo: 'images/firstYear/2months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 3, label: 'Three Months', highlight: 'Starting to smile!', photo: 'images/firstYear/3months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 4, label: 'Four Months', highlight: 'Discovering the world', photo: 'images/firstYear/4months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 5, label: 'Five Months', highlight: 'Getting stronger every day', photo: 'images/firstYear/5months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 6, label: 'Six Months', highlight: 'Half a year already!', photo: 'images/firstYear/6months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 7, label: 'Seven Months', highlight: 'Sitting up and curious', photo: 'images/firstYear/7months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 8, label: 'Eight Months', highlight: 'On the move!', photo: 'images/firstYear/8months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 9, label: 'Nine Months', highlight: 'Almost crawling', photo: 'images/firstYear/9_Months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 10, label: 'Ten Months', highlight: 'Getting into everything!', photo: 'images/firstYear/Custom 10.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
    { num: 11, label: 'Eleven Months', highlight: 'Almost one year old!', photo: 'images/firstYear/11 months.jpg', note: 'Taken at 1427 N Spencer, Mesa, AZ' },
  ];

  for (const m of monthsData) {
    const photoPath = await migrateImage(m.photo, 'months', `month-${m.num}`);

    const { data: existing } = await supabase
      .from('months')
      .select('id')
      .eq('book_id', BOOK_ID)
      .eq('month_number', m.num)
      .maybeSingle();

    const fields = {
      label: m.label,
      highlight: m.highlight,
      note: m.note,
      photo_path: photoPath,
    };

    if (existing) {
      const { error } = await supabase
        .from('months')
        .update(fields)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('months')
        .insert({ book_id: BOOK_ID, month_number: m.num, ...fields });
      if (error) throw error;
    }
    console.log(`  ✓ Month ${m.num} updated`);
  }

  console.log('✓ All months migrated');
}

// ──────────────────────────────────────────────────
// 4. Migrate Family Members
// ──────────────────────────────────────────────────

async function migrateFamilyMembers() {
  console.log('\n═══ Migrating Family Members ═══');

  // First, delete the existing test family members
  const { error: delError } = await supabase
    .from('family_members')
    .delete()
    .eq('book_id', BOOK_ID);
  if (delError) throw delError;
  console.log('  Deleted existing test family members');

  const members = [
    {
      member_key: 'paparoni',
      name: 'Ronald Ragno',
      relation: 'Papa Roni',
      emoji: '',
      photo: 'images/yourfamily/ZOE_0032.jpg',
      meta_1_label: 'Full Name', meta_1_value: 'Ronald Charles Ragno',
      meta_2_label: 'Born', meta_2_value: '1951, Smithfield, RI',
      meta_3_label: 'Nickname', meta_3_value: 'Papa Roni',
      story: `Papa Roni was born Ronald Charles Ragno in 1951 to Frank and Theresa Ragno, your great grandparents. He was raised in Smithfield, Rhode Island where he spent his youth playing baseball, fishing, and picking on his younger brother, Russell. After marrying Nan, they moved to Woonsocket, Rhode Island (where your Dad was born), before moving to Glocester, Rhode Island when your Dad was in 3rd grade. Later in life, he followed your Dad and Aunt Julia to Arizona, where he met and married Lola. He was living in Phoenix, AZ when you were born. He was still playing softball twice a week, and would visit you every time he could!`,
      sort_order: 0,
    },
    {
      member_key: 'nan',
      name: 'Janet Cullen Ragno',
      relation: 'Nan',
      emoji: '',
      photo: 'images/yourfamily/ZOE_0103.jpg',
      meta_1_label: 'Full Name', meta_1_value: 'Janet Cullen Ragno',
      meta_2_label: 'Born', meta_2_value: 'Smithfield, Rhode Island',
      meta_3_label: 'Living In', meta_3_value: 'Hope, Rhode Island',
      story: `Nan (Janet Cullen), was born in Smithfield, Rhode Island to Ralph and Jeanine Cullen. She had kids young, and spent a good portion of her life raising your father (who was an angel child), and his bratty brother and sisters. When your father, uncle, and aunts were teenagers, she went to college, finishing quickly and with honors, and became a teacher in the same middle and high school your mom and dad went to, Ponaganset. The first time your Mom met your Nan was when your Mom was in middle school. Your mom was throwing m&m's and being fresh, so Nan had to take them and yell at her! Later, Nan became the vice principal of the same school. She was living in Hope, Rhode Island when you were born.`,
      sort_order: 1,
    },
    {
      member_key: 'memere',
      name: 'Michele Lamirande',
      relation: 'Memere',
      emoji: '',
      photo: 'images/yourfamily/20150106_120818_1.jpg',
      meta_1_label: 'Full Name', meta_1_value: 'Michele La Marre Lamirande',
      meta_2_label: 'Born', meta_2_value: 'Rhode Island',
      meta_3_label: 'Nickname for you', meta_3_value: 'Boo Boo Bear',
      story: `Memere (Michele La Marre Lamirande), was born in Rhode Island to Joseph La Marre and Irene LaMarre. She grew up in Smithfield, Rhode Island, and met Pepere in high school. After she had Mommy and Uncle Mark, she went back to school to become a nurse. She retired the year you were born and moved to Arizona to be with you. She loves you so much, and calls you "Boo Boo Bear". She babysits you at least twice a week, and Mommy and Daddy are so glad she is here to help!`,
      sort_order: 2,
    },
    {
      member_key: 'pepere',
      name: 'Maurice Lamirande',
      relation: 'Pepere',
      emoji: '',
      photo: 'images/yourfamily/DSC02287a.jpg',
      meta_1_label: 'Full Name', meta_1_value: 'Maurice Leo Lamirande',
      meta_2_label: 'Born', meta_2_value: 'Providence, Rhode Island',
      meta_3_label: 'Nickname for you', meta_3_value: 'Spanky',
      story: `Pepere (Maurice Leo Lamirande) was born in Providence, Rhode Island. He started working at the Providence Journal when he was 18. He married Memere, and moved to Glocester, Rhode Island, where Mommy and Uncle Mark grew up. Pepere moved to AZ to be close to you, and to watch you grow up. He loves you to pieces, and he calls you "Spanky".`,
      sort_order: 3,
    },
  ];

  for (const member of members) {
    const photoPath = await migrateImage(member.photo, 'family', member.member_key);

    const row = {
      book_id: BOOK_ID,
      member_key: member.member_key,
      name: member.name,
      relation: member.relation,
      emoji: member.emoji || '',
      photo_path: photoPath,
      meta_1_label: member.meta_1_label || null,
      meta_1_value: member.meta_1_value || null,
      meta_2_label: member.meta_2_label || null,
      meta_2_value: member.meta_2_value || null,
      meta_3_label: member.meta_3_label || null,
      meta_3_value: member.meta_3_value || null,
      meta_4_label: null,
      meta_4_value: null,
      story: member.story,
      story2: null,
      quote_text: null,
      quote_cite: null,
      sort_order: member.sort_order,
    };

    const { error } = await supabase.from('family_members').insert(row);
    if (error) throw error;
    console.log(`  ✓ ${member.name} (${member.relation}) inserted`);
  }

  console.log('✓ All family members migrated');
}

// ──────────────────────────────────────────────────
// 5. Migrate Celebrations
// ──────────────────────────────────────────────────

async function migrateCelebrations() {
  console.log('\n═══ Migrating Celebrations ═══');

  // Delete existing test celebrations
  const { error: delError } = await supabase
    .from('celebrations')
    .delete()
    .eq('book_id', BOOK_ID);
  if (delError) throw delError;
  console.log('  Deleted existing test celebrations');

  const celebrations = [
    {
      eyebrow: 'March 2014',
      title: "First St. Patrick's Day",
      body: `Your Great Grandfather, Ralph Cullen, was Irish, and we always celebrate St. Patrick's Day right! Irish Eowyn was only days old for her very first celebration.`,
      photo: 'images/easter/baby7.png',
      sort_order: 0,
    },
    {
      eyebrow: 'April 2014',
      title: 'First Easter',
      body: `Daddy picked out all those flowers for you. You with Lamby! (Indy ate him later...) You hated that bow after awhile! Exactly what we wanted for Easter — our little Easter munchkin!`,
      photo: 'images/easter/baby1.png',
      sort_order: 1,
    },
    {
      eyebrow: 'October 2014',
      title: 'First Halloween',
      body: `From around your first month and through your entire first year, your favorite movie was Annie. You loved it! You could be screaming your head off, but as soon as Annie came on, you immediately calmed down. Annie got your mom and dad through some rough times! Daddy must have bought a dozen copies of that movie to hand out to anyone who was going to babysit you. Of course, your first Halloween we had to dress you up as your favorite character. Your Aunt Julia made you that costume, and we spent that Halloween trick or treating at your Uncle Mark and Aunt Kathy's house. You weren't happy, and this was about the best picture we could get of you all night! You refused to wear your wig, too!`,
      photo: 'images/halloween/IMAG1603.jpg',
      sort_order: 2,
    },
    {
      eyebrow: 'December 2014',
      title: 'First Christmas',
      body: `Your very first Christmas was a magical time. The whole family came together to celebrate the season and our newest little blessing.`,
      photo: 'images/christmas/011.JPG',
      sort_order: 3,
    },
  ];

  for (const cel of celebrations) {
    const photoPath = await migrateImage(
      cel.photo,
      'celebrations',
      cel.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    );

    const { error } = await supabase.from('celebrations').insert({
      book_id: BOOK_ID,
      sort_order: cel.sort_order,
      eyebrow: cel.eyebrow,
      title: cel.title,
      body: cel.body,
      photo_path: photoPath,
    });
    if (error) throw error;
    console.log(`  ✓ ${cel.title} inserted`);
  }

  console.log('✓ All celebrations migrated');
}

// ──────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Legacy Odyssey — Website Content Migration  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\nBook ID:   ${BOOK_ID}`);
  console.log(`Family ID: ${FAMILY_ID}`);
  console.log(`Source:    ${WEBSITE_BASE}\n`);

  try {
    await updateBookRecord();
    await migrateBirthStory();
    await migrateMonths();
    await migrateFamilyMembers();
    await migrateCelebrations();

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║         Migration Complete!                   ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('\nAll website content has been migrated to the database.');
    console.log('Both the website and mobile app will now show the same content.');
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
