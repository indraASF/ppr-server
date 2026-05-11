const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT;
const GITHUB_REPO = 'indraASF/ppr-deliverables';
const SLACK_CHANNEL = 'portfolio-reviews';
const GDRIVE_FOLDER_ID = '120HCA9vLsS7iQkPWdm7X6xyib480uRtq';

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.send('PPR Pipeline v2.0 is running.');
});

// ── CHECKLIST PARSER ──
// Checked = "Present" in Make checkbox, unchecked = empty/null
function parseChecklist(value) {
  if (!value || value === '' || value === 'null' || value === 'undefined') return 'FAIL';
  if (value.toString().toLowerCase().includes('present')) return 'PASS';
  return 'FAIL';
}

function buildChecklistLine(item, value, note) {
  const status = parseChecklist(value);
  const noteLine = (status === 'FAIL' && note) ? `\n   Note: ${note}` : '';
  return `${status}  ${item}${noteLine}`;
}

// ── MAIN ENDPOINT ──
app.post('/generate', async (req, res) => {
  console.log('Generate endpoint hit');
  const data = req.body;

  // ── ARTIST FORM DATA ──
  const artistName = data.name || 'Unknown Artist';
  const firstName = artistName.split(' ')[0];
  const websiteUrl = data.website || '';
  const instagramUrl = data.instagram || '';
  const otherPlatforms = data.other_platforms || 'None';
  const artPractice = data.art_practice || '';
  const artistInspirations = data.artist_inspirations || 'None provided';
  const personalMotivation = data.personal_motivation || '';
  const careerLength = data.career_length || '';
  const exhibitionHistory = data.exhibition_history || '';
  const educationCredentials = data.education_credentials || '';
  const pressRecognition = data.press_recognition || '';
  const priceOriginals = data.price_originals || '';
  const pricePrints = data.price_prints || 'N/A';
  const collectorVision = data.collector_vision || '';
  const additionalNotes = data.additional_notes || 'None';

  // ── CHECKLIST DATA ──
  const wcAbout = parseChecklist(data.wc_about);
  const wcFaq = parseChecklist(data.wc_faq);
  const wcContact = parseChecklist(data.wc_contact);
  const wcNewsletter = parseChecklist(data.wc_newsletter);
  const wcCommission = parseChecklist(data.wc_commission);
  const wcSeo = parseChecklist(data.wc_seo);
  const wcDesign = parseChecklist(data.wc_design);
  const wcSocial = parseChecklist(data.wc_social);
  const wcPortrait = parseChecklist(data.wc_portrait);
  const wcStudio = parseChecklist(data.wc_studio);
  const spWorks = parseChecklist(data.sp_works);
  const spOrganized = parseChecklist(data.sp_organized);
  const spFeatured = parseChecklist(data.sp_featured);
  const spThumbnails = parseChecklist(data.sp_thumbnails);
  const spDetails = parseChecklist(data.sp_details);
  const spMockups = parseChecklist(data.sp_mockups);
  const spCheckout = parseChecklist(data.sp_checkout);
  const spPrints = parseChecklist(data.sp_prints);
  const spLinked = parseChecklist(data.sp_linked);
  const prPricing = parseChecklist(data.pr_pricing);
  const prLeadCapture = parseChecklist(data.pr_leadcapture);
  const prAnnouncement = parseChecklist(data.pr_announcement);
  const igBio = parseChecklist(data.ig_bio);
  const igProfile = parseChecklist(data.ig_profile);
  const igCadence = parseChecklist(data.ig_cadence);
  const igProcess = parseChecklist(data.ig_process);
  const igCaptions = parseChecklist(data.ig_captions);
  const igEngagement = parseChecklist(data.ig_engagement);
  const igStudio = parseChecklist(data.ig_studio);
  const wcNotes = data.wc_notes || '';
  const spNotes = data.sp_notes || '';
  const prNotes = data.pr_notes || '';
  const igNotes = data.ig_notes || '';
  const overallNotes = data.overall_notes || '';

  console.log('Artist:', artistName);
  console.log('Website:', websiteUrl);
  console.log('Instagram:', instagramUrl);

  // Acknowledge immediately so Make doesn't time out
  res.status(200).json({ status: 'processing', artist: artistName });

  try {
    // ── BUILD CHECKLIST STRINGS ──
    const websiteContentChecklist = `
WEBSITE & CONTENT:
${wcAbout === 'PASS' ? 'PASS' : 'FAIL'}  About / Artist Bio page visible in navigation
${wcFaq === 'PASS' ? 'PASS' : 'FAIL'}  FAQ page present
${wcContact === 'PASS' ? 'PASS' : 'FAIL'}  Contact page or visible email address
${wcNewsletter === 'PASS' ? 'PASS' : 'FAIL'}  Email newsletter sign-up present
${wcCommission === 'PASS' ? 'PASS' : 'FAIL'}  Commission inquiry option present
${wcSeo === 'PASS' ? 'PASS' : 'FAIL'}  SEO title and meta description configured
${wcDesign === 'PASS' ? 'PASS' : 'FAIL'}  Cohesive visual design
${wcSocial === 'PASS' ? 'PASS' : 'FAIL'}  Social media icons visible and linked correctly
${wcPortrait === 'PASS' ? 'PASS' : 'FAIL'}  Artist portrait present
${wcStudio === 'PASS' ? 'PASS' : 'FAIL'}  Photo of artist working or studio environment
${wcNotes ? 'Additional notes: ' + wcNotes : ''}`.trim();

    const shopChecklist = `
SHOP & PRODUCT:
${spWorks === 'PASS' ? 'PASS' : 'FAIL'}  Minimum 10 works listed and available to view
${spOrganized === 'PASS' ? 'PASS' : 'FAIL'}  Originals and/or limited editions clearly organized
${spFeatured === 'PASS' ? 'PASS' : 'FAIL'}  Best Sellers or Featured Works category present
${spThumbnails === 'PASS' ? 'PASS' : 'FAIL'}  Clean thumbnail images with consistent cropping
${spDetails === 'PASS' ? 'PASS' : 'FAIL'}  Each product page includes title, medium, dimensions
${spMockups === 'PASS' ? 'PASS' : 'FAIL'}  Wall preview or room mockup images present
${spCheckout === 'PASS' ? 'PASS' : 'FAIL'}  Checkout button clearly visible
${spPrints === 'PASS' ? 'PASS' : 'FAIL'}  Print size options present
${spLinked === 'PASS' ? 'PASS' : 'FAIL'}  Original artwork linked to available prints
${spNotes ? 'Additional notes: ' + spNotes : ''}`.trim();

    const pricingChecklist = `
PRICING:
${prPricing === 'PASS' ? 'PASS' : 'FAIL'}  Pricing structure appropriate for current market stage
${prLeadCapture === 'PASS' ? 'PASS' : 'FAIL'}  Lead Capture tool active
${prAnnouncement === 'PASS' ? 'PASS' : 'FAIL'}  Announcement bar present
${prNotes ? 'Additional notes: ' + prNotes : ''}`.trim();

    const instagramChecklist = `
INSTAGRAM:
${igBio === 'PASS' ? 'PASS' : 'FAIL'}  Bio includes medium, location, and link to website
${igProfile === 'PASS' ? 'PASS' : 'FAIL'}  Profile image is professional
${igCadence === 'PASS' ? 'PASS' : 'FAIL'}  Consistent posting cadence evident from grid
${igProcess === 'PASS' ? 'PASS' : 'FAIL'}  Process and in-progress content present (Reels, video clips)
${igCaptions === 'PASS' ? 'PASS' : 'FAIL'}  Finished work featured with thoughtful captions
${igEngagement === 'PASS' ? 'PASS' : 'FAIL'}  Community engagement visible
${igStudio === 'PASS' ? 'PASS' : 'FAIL'}  Studio or behind-the-scenes content present
${igNotes ? 'Additional notes: ' + igNotes : ''}`.trim();

    // ── BUILD CREDENTIALS STRING ──
    let credentials = '';
    if (exhibitionHistory && exhibitionHistory.toLowerCase() !== 'none' && exhibitionHistory.toLowerCase() !== 'no' && exhibitionHistory.trim() !== '') {
      credentials += `Exhibition history: ${exhibitionHistory}\n`;
    }
    if (educationCredentials && educationCredentials.toLowerCase() !== 'none' && educationCredentials.toLowerCase() !== 'no' && educationCredentials.trim() !== '') {
      credentials += `Education and residencies: ${educationCredentials}\n`;
    }
    if (pressRecognition && pressRecognition.toLowerCase() !== 'none' && pressRecognition.toLowerCase() !== 'no' && pressRecognition.trim() !== '') {
      credentials += `Press and recognition: ${pressRecognition}\n`;
    }
    if (credentials === '') credentials = 'No credentials provided — do not mention in the artist statement.';

    // ── MEGA PROMPT v2.0 ──
    const prompt = `You are generating a Professional Portfolio Review on behalf of Reilly Thomson, an art consultant currently at David Zwirner gallery in New York as Project Coordinator and Sales Support. He manages multi-phase exhibitions for blue-chip artists at venues including The British Museum, Musee National Picasso, Deste Foundation, Art Basel, Frieze, and Unlimited. He builds visual presentations for the Top 200 Collectors worldwide driving seven-figure sales. Previously Communications Director at M+B Gallery LA where he grew Instagram 54% and engagement 121%, securing placements in American Vogue and Architectural Digest. BA English Summa Cum Laude UCLA GPA 3.95.

ARTIST INFORMATION:
Name: ${artistName}
Website: ${websiteUrl}
Instagram: ${instagramUrl}
Other platforms: ${otherPlatforms}
Art practice: ${artPractice}
Artist inspirations: ${artistInspirations}
Personal motivation: ${personalMotivation}
Career length (selling): ${careerLength}
Credentials: ${credentials}
Price of originals: ${priceOriginals}
Price of prints: ${pricePrints}
Collector vision: ${collectorVision}
Additional notes: ${additionalNotes}
${overallNotes ? 'Reviewer notes: ' + overallNotes : ''}

CHECKLIST RESULTS (completed by internal reviewer):
${websiteContentChecklist}

${shopChecklist}

${pricingChecklist}

${instagramChecklist}

VOICE RULES — REILLY THOMSON v2.0:
Write as Reilly Thomson. Clear, thoughtful, intelligent. Open with a specific sensory or visual observation. Use his signature move: describe what could go wrong then explain why it does not. Build arguments incrementally — context first, implication second, specific detail last. Deliver hard truths plain and work-first. Always close with the why. The market observation arrives last after the analysis earns it.

BANNED — NEVER USE: em dashes in generated text, standalone declarative sentences for effect, rhetorical questions, lists of three with parallel structure, tapestry, nuanced, compelling, captivating, striking, solid, solid foundation, awesome, another level, sick, you have built something genuine here, speaks to, resonates with, invites the viewer to, navigates (as in navigates themes), unpacks, interrogates, grapples with, liminal, visceral, evocative, at its core, breakthrough year, lets get started, synergy, leverage, content as a noun for artwork, transformative, journey, vibrant, delve, exclamation points except in the greeting.

TONE RULES: No definitive affirmations about gallery readiness or blue-chip status. No over-acknowledging trajectory or talent. No overpromising outcomes. No press release language. No hollow affirmations before critique. Praise must be earned by the analysis that precedes it. Do not declare what a work is about — suggest, do not define. If a sentence could have been written without actually looking at the work, cut it.

CREDENTIALS RULE: If any credentials field says none, no, or none yet — DO NOT mention it anywhere in the document especially not the artist statement. Only reference credentials that actually exist.

NAME RULES: In the greeting use first name only. In the artist statement the first instance uses full name, every subsequent reference uses last name only.

REILLY REAL WRITING SAMPLE — calibrate every segment against this:
"What initially struck me about this work is the color. Purple, yellow, and green at this intensity could easily overwhelm each other, and yet here they create a harmonious camouflage across the surface. That balance speaks to your strong understanding of printmaking and large-scale composition. The black line work underneath holds the abstract color composition together nicely. The single plant in the foreground against the dense foliage behind it creates an interesting tension between planes. Due to the minimal negative space in the work, the viewer is pulled deeper into the work rather than allowed to observe it from a distance. While a lack of negative space can be overwhelming for a viewer, I think it works nicely here and lends an interesting pattern effect. The abundance of pattern across the surface moves the work away from photo-realism in an interesting direction. Rather than describing the subject, the patterns generate a vibrating energy that I think is worth exploring further. One idea: continue playing with the contrast between simple forms in the foreground and hyper-detailed backdrops, and see how far that vibration can be pushed. This work would appeal strongly to interior designers. It has the kind of energy and vibrancy that contributes something to a room rather than simply hanging in it."

NOW GENERATE THE FULL DOCUMENT using this exact structure. Output clean text only — no marker labels, no commentary outside the document:

---

Professional Portfolio Review with Reilly Thomson
Prepared by Reilly Thomson · Art Storefronts
Your practice, evaluated at gallery standard.

Hi ${firstName}! It was a pleasure to learn more about your work in our consultation. I've spent time looking further into your artworks and online presence since we spoke, and put together this full audit with my honest assessment of where your art business stands today.

Having worked at David Zwirner, I've seen firsthand what separates the artists who get taken seriously from those who don't. This audit embodies my process for making an artist's business gallery standard. I evaluated your business across four crucial areas: website and public presence, artist statement, niche and positioning, and social media strategy.

Every player in the art world, from collectors and advisors to gallerists and curators, will encounter your work through these same touchpoints. The quality of these materials will greatly influence the first impressions you make, and whether the right doors open.

---

## Part 1: YOUR WEBSITE

Let's start with your website and public presence. Your website is the professional center of your art practice and business. It is where collectors acquire your work, gallerists evaluate your body of work, and every serious conversation eventually leads. It's imperative that it operates at the highest level, leaving no question about who you are, what you make, and how to buy it.

### Website & Content

Output each item from the Website & Content checklist above with PASS or FAIL. For every FAIL item write one sentence in Reilly's voice explaining what is missing and why it matters. Format each item on its own line starting with PASS or FAIL.

### Shop & Product

Output each item from the Shop & Product checklist above with PASS or FAIL. For every FAIL item write one sentence in Reilly's voice.

### Pricing

Output each item from the Pricing checklist above with PASS or FAIL. For every FAIL item write one sentence in Reilly's voice.

### My Observations & Next Steps

Write exactly 8 sentences in Reilly's voice synthesizing the overall state of the website. This is the expert read — the so what behind the data. What is the single most important thing to address, what is working, what impression does a gallerist or collector walk away with. Do not re-list checklist items. Draw from the checklist results and notes above.

---

## Part 2: GALLERY TIER ARTIST STATEMENT

Your artist statement is the most important piece of writing associated with your practice. Gallerists read dozens of them a week and the ones that land are specific, confident, and free of superfluous art-jargon. A strong statement speaks simultaneously to every audience that matters: collectors considering an acquisition, gallerists considering representation, curators researching your work, and press contacts deciding whether to cover you.

A strong artist statement should include:
- Description of medium and artistic process
- Articulation of recurring themes, subject matter, or conceptual focus
- Art historical references relevant to the practice (if applicable)
- Personal narrative (why you make what you make)
- Exhibition history, residencies, grants, and accolades (if applicable)

### ${artistName}'s Artist Statement

Write the artist statement: exactly 7 to 10 sentences in Reilly's voice. Open with a declaration about the work itself not the biography. Include one earned art historical or cultural reference only if it is defensible — omit if not. Contain the personal narrative in a way that feels discovered not stated. End positioning the practice as part of a larger conversation. First instance of name uses full name, subsequent references use last name only. CREDENTIALS RULE: only include exhibition history, education, or press if they were provided and are not blank or none.

---

## Part 3: NICHE & POSITIONING

Your niche is not a permanent label, but a flexible tool that should be adapted and honed throughout your career. The most successful artists on the primary market have developed a clear, recognizable body of work that speaks directly to a specific collector sensibility, cultural interest, or subject matter community. This section evaluates how well your current work and positioning connect with the buyers most likely to respond to it.

### My Observations & Next Steps

Write exactly 3 to 4 sentences in Reilly's voice. Name the niche precisely and specifically — never vague descriptors like nature lovers or art enthusiasts. Evaluate how well current positioning serves that niche.

### Suggested Communities

#### 5 Subreddits
List 5 active relevant subreddits. For each include the name and one sentence on why it is relevant. Verify each exists and is active.

#### 5 Facebook Groups
List 5 active Facebook Groups. For each include the name and one sentence on why it is relevant.

#### 5 Instagram Accounts
List 5 accounts the ideal collector likely follows. For each include the handle and one sentence on why it is strategically relevant.

---

## Part 4: SOCIAL MEDIA STRATEGY

Social media is often the first place a gallerist, advisor, or collector will encounter your work — or look you up after hearing your name. Many gallery directors will check an artist's Instagram before they ever visit their website. At this stage in your career, social media is less about getting immediate sales (though those are always welcome!). The point is to build momentum: attracting your first serious collectors, growing a community around your work, and getting on the radar of the people who matter. That momentum in engagement will eventually return in sales and continue to grow.

### Instagram

Output each item from the Instagram checklist above with PASS or FAIL. For every FAIL item write one sentence in Reilly's voice.

### My Observations & Next Steps

Write exactly 3 to 4 sentences in Reilly's voice. What impression does the profile make on a gallerist or collector encountering it for the first time. What is working. What is the single most important shift. Include a recommendation about creating Reels and putting the artist's face and voice in front of their work — adapted specifically to this artist, not copied verbatim.

---

My recommendations are a starting point, not a final destination. The strongest art businesses are built incrementally and consistent effort over time yields results that no single change can produce alone.

Spend as much time as you can in the studio, leaning into what about your practice excites you the most, and see where it takes you. And don't forget to tell your fans about your discoveries — we all want to know!

I'm genuinely excited about what's ahead for you!

— Reilly

---

## Appendix: Useful Resources from Art Storefronts

🎓 Dominating Your Niche
Instagram Best Practices (Before + After 1,000 Followers)
1000 followers strategy for FACEBOOK!
How to Invite Your Facebook Friends to Like your Business Page (+ sharing!)
Social Media Security: Protecting Your Instagram and Facebook Accounts 🔒📱
Become an Instagram Pro | 30-Day Bootcamp 📸
Summer School ☀️🌴 | Breaking Down Successful Social Media Content
🍂 Fall Content Academy | Level Up your Social Media Game
Reddit 101
Ultimate Guide for Successful Art Shows and Fairs
The Pivot Playbook
Regular Giveaway Playbook
The Custom Artwork Strategy
Best Practices for Selling Limited Editions
The Live Art Show Playbook (3.0)
Niche Master Course Workflow | Find Your True Audience 🚀`;

    // ── CALL CLAUDE ──
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const claudeData = await claudeRes.json();
    if (!claudeData.content || !claudeData.content[0]) {
      console.error('Claude error:', JSON.stringify(claudeData));
      return;
    }
    const reviewText = claudeData.content[0].text;
    console.log('Claude generated review successfully');

    // ── CREATE GOOGLE DOC ──
    let docUrl = null;
    try {
      // Get access token using service account
      const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: await createJWT(serviceAccount)
        })
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Create the Google Doc
      const docRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `${artistName} — Portfolio Review`
        })
      });
      const docData = await docRes.json();
      const docId = docData.documentId;

      // Insert the review text
      await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            insertText: {
              location: { index: 1 },
              text: reviewText
            }
          }]
        })
      });

      // Move to PPR Reviews In Progress folder
      await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?addParents=${GDRIVE_FOLDER_ID}&removeParents=root`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      docUrl = `https://docs.google.com/document/d/${docId}/edit`;
      console.log('Google Doc created:', docUrl);

    } catch (docErr) {
      console.error('Google Doc creation error:', docErr);
      docUrl = null;
    }

    // ── POST TO SLACK ──
    const slackText = docUrl
      ? `*[${artistName.toUpperCase()} — PORTFOLIO REVIEW]*\n\nReilly's review is ready for editing.\n\n*Google Doc:* ${docUrl}\n\n_Once edits are complete, move the Doc to the "Ready to Publish" folder to trigger the HTML build._`
      : `*[${artistName.toUpperCase()} — PORTFOLIO REVIEW]*\n\nReilly's review was generated but the Google Doc could not be created. Check Render logs.\n\nArtist: ${artistName}\nWebsite: ${websiteUrl}`;

    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        text: slackText
      })
    });
    const slackData = await slackRes.json();
    console.log('Slack response:', JSON.stringify(slackData));
    console.log(`PPR generated and delivered for ${artistName}`);

  } catch (err) {
    console.error('PPR generation error:', err);
  }
});

// ── JWT HELPER FOR GOOGLE AUTH ──
async function createJWT(serviceAccount) {
  const crypto = require('crypto');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  return `${signingInput}.${signature}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PPR server v2.0 running on port ${PORT}`));
