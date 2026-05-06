const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body keys: ${Object.keys(req.body || {}).join(', ') || 'empty'}`);
  next();
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const GITHUB_REPO = 'indraASF/ppr-deliverables';
const SLACK_CHANNEL = 'portfolio-reviews';

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.send('PPR Pipeline is running.');
});

// ── MAIN ENDPOINT ──
app.post('/generate', async (req, res) => {
  console.log('Generate endpoint hit');
  const data = req.body;

  const artistName = data.name || 'Unknown Artist';
  const websiteUrl = data.website || '';
  const instagramHandle = data.instagram || '';
  const otherPlatforms = data.other_platforms || 'None';
  const artPractice = data.art_practice || '';
  const personalMotivation = data.personal_motivation || '';
  const careerLength = data.career_length || '';
  const representation = data.representation || '';
  const exhibitionHistory = data.exhibition_history || 'None provided';
  const education = data.education || 'None provided';
  const press = data.press || 'None provided';
  const priceOriginals = data.price_originals || '';
  const pricePrints = data.price_prints || 'N/A';
  const collectorVision = data.collector_vision || '';
  const additionalNotes = data.additional_notes || 'None';

  console.log('Artist name:', artistName);
  console.log('Website:', websiteUrl);
  console.log('Instagram:', instagramHandle);

  // Acknowledge immediately so Make doesn't time out
  res.status(200).json({ status: 'processing', artist: artistName });

  try {
    // ── CALL CLAUDE ──
    const prompt = `You are generating a Professional Portfolio Review on behalf of Reilly Thomson, an art consultant currently at David Zwirner gallery in New York as Project Coordinator and Sales Support. He manages multi-phase exhibitions for blue-chip artists at venues including The British Museum, Musee National Picasso, Deste Foundation, Art Basel, Frieze, and Unlimited. He builds visual presentations for the Top 200 Collectors worldwide driving seven-figure sales. Previously Communications Director at M+B Gallery LA where he grew Instagram 54% and engagement 121%, securing placements in American Vogue and Architectural Digest. BA English Summa Cum Laude UCLA GPA 3.95.

ARTIST NAME: ${artistName}
WEBSITE: ${websiteUrl}
INSTAGRAM: ${instagramHandle}
OTHER PLATFORMS: ${otherPlatforms}
ART PRACTICE: ${artPractice}
PERSONAL MOTIVATION: ${personalMotivation}
CAREER LENGTH: ${careerLength}
REPRESENTATION: ${representation}
EXHIBITION HISTORY: ${exhibitionHistory}
EDUCATION: ${education}
PRESS: ${press}
PRICE ORIGINALS: ${priceOriginals}
PRICE PRINTS: ${pricePrints}
COLLECTOR VISION: ${collectorVision}
ADDITIONAL NOTES: ${additionalNotes}

VOICE RULES: Write as Reilly Thomson. Clear, thoughtful, intelligent. Open with a specific sensory or visual observation. Use his signature move: describe what could go wrong then explain why it does not. Deliver hard truths plain and work-first. Always close with the why. No em dashes in generated text. No exclamation points except the greeting. Never use: breakthrough year, lets get started, awesome, stunning, incredible, synergy, leverage, content as a noun for artwork, transformative, journey, tapestry, vibrant, delve, standalone declarations like That is not an accident.

REILLY REAL WRITING SAMPLE FOR CALIBRATION: What initially struck me about this work is the color. Purple, yellow, and green at this intensity could easily overwhelm each other, and yet here they create a harmonious camouflage across the surface. That balance speaks to your strong understanding of printmaking and large-scale composition. The black line work underneath holds the abstract color composition together nicely. The single plant in the foreground against the dense foliage behind it creates an interesting tension between planes. Due to the minimal negative space in the work, the viewer is pulled deeper into the work rather than allowed to observe it from a distance. While a lack of negative space can be overwhelming for a viewer, I think it works nicely here and lends an interesting pattern effect. The abundance of pattern across the surface moves the work away from photo-realism in an interesting direction. Rather than describing the subject, the patterns generate a vibrating energy that I think is worth exploring further. One idea: continue playing with the contrast between simple forms in the foreground and hyper-detailed backdrops, and see how far that vibration can be pushed. This work would appeal strongly to interior designers. It has the kind of energy and vibrancy that contributes something to a room rather than simply hanging in it.

OUTPUT STRUCTURE - generate the full document with these exact sections:

COVER:
Professional Portfolio Review
Prepared by Reilly Thomson - Art Storefronts
Your practice, evaluated at gallery standard.

INTRODUCTION (output exactly):
Hi ${artistName}! It was a pleasure to learn more about your work in our consultation, and I have spent time with your artworks and online presence since we spoke. This audit was prepared following our consultation and reflects my honest assessment of where your art business stands today. Having worked at David Zwirner, I have seen firsthand what separates the artists who get taken seriously from those who do not. I evaluated your business across four crucial areas: website and public presence, artist statement, niche and positioning, and social media strategy.

Every player in the art world, from collectors and advisors to gallerists and curators, will encounter your work through these same touchpoints. The quality of these materials will greatly influence the first impressions you make, and whether the right doors open.

PART I: WEBSITE AND PUBLIC PRESENCE

Output exactly: Let's start with your website and public presence. Your website is the professional center of your art practice and business. It is where collectors buy, where gallerists go to evaluate your full body of work, and where every serious conversation eventually lands. It should be operating at gallery standard.

VISIT THE WEBSITE at ${websiteUrl} and evaluate each checklist item. Mark each PASS, FAIL, or PARTIAL. For every FAIL or PARTIAL write one sentence in Reilly voice explaining what is missing and why it matters.

WEBSITE AND CONTENT CHECKLIST:
- About / Artist Bio page visible in navigation
- FAQ page present
- Contact page or visible email address
- Email newsletter sign-up present
- Commission inquiry option present
- SEO title and page meta description configured
- Cohesive visual design
- Social media icons visible and linked correctly
- Artist portrait present
- Photo of artist working or studio environment

SHOP AND PRODUCT CHECKLIST:
- Minimum 10 works listed
- Originals and/or limited editions clearly organized
- Best Sellers or Featured Works category present
- Clean thumbnail images with consistent cropping
- Each product page includes title, medium, dimensions
- Wall preview or room mockup images present
- Checkout button clearly visible
- Print size options present
- Original artwork linked to available prints

PRICING CHECKLIST:
- Pricing structure appropriate for current market stage
- Lead Capture tool active
- Announcement bar present

REILLY WEBSITE ANALYSIS: Write 8 sentences in Reilly voice synthesizing what you observed. Do not re-list checklist items. What is the single most important thing to address, what is working, what impression does a gallerist or collector walk away with.

PART II: GALLERY TIER ARTIST STATEMENT

Output exactly: Your artist statement is the most important piece of writing associated with your practice. Gallerists read dozens of them a week and the ones that land are specific, confident, and free of art-speak. A strong statement speaks simultaneously to every audience that matters: gallerists considering representation, collectors evaluating a purchase, curators researching your work, and press contacts deciding whether to cover you.

A strong artist statement should include:
- Description of medium and artistic process
- Articulation of recurring themes, subject matter, or conceptual focus
- Art historical references relevant to the practice
- Personal narrative
- Exhibition history, residencies, grants, and accolades where applicable
- Written to speak equally to collectors, gallerists, and institutions

ARTIST STATEMENT: Write 7 to 10 sentences in Reilly voice. Open with a declaration about the work itself not the biography. Include one earned art historical or cultural reference. Contain the personal narrative in a way that feels discovered not stated. End positioning the practice as part of a larger conversation. Draw from art practice description, personal motivation, exhibition history, credentials, and website observations.

PART III: NICHE AND POSITIONING

Output exactly: Niche is not a permanent label, it is a tool. The most successful artists on the primary market have developed a clear, recognizable body of work that speaks directly to a specific collector sensibility, cultural interest, or subject matter community. This section evaluates how well your current work and positioning connect with the buyers most likely to respond to it.

NICHE ANALYSIS: Write 3 to 4 sentences. Name the niche precisely and specifically. Never use vague descriptors. Evaluate how well current positioning serves that niche.

5 SUBREDDITS: List 5 active relevant subreddits. For each include the name and one sentence on why it is relevant. Verify each exists and is active.

5 FACEBOOK GROUPS: List 5 active Facebook Groups. For each include the name and one sentence on why it is relevant.

5 INSTAGRAM ACCOUNTS: List 5 accounts the ideal collector likely follows. For each include the handle and one sentence on why it is strategically relevant.

PART IV: SOCIAL MEDIA STRATEGY

Output exactly: Social media is often the first place a gallerist, advisor, or collector encounters your work, or looks you up after hearing your name. Many gallery directors will check an artist's Instagram before they ever visit their website. Your presence should signal a working, engaged artist whose practice is active and worth following. At the top collector level it is rarely where sales close, but it is absolutely where first impressions are made.

VISIT THE INSTAGRAM at ${instagramHandle} and evaluate each item. Mark each PASS, FAIL, or PARTIAL. For every FAIL or PARTIAL write one sentence in Reilly voice.

INSTAGRAM CHECKLIST:
- Bio includes medium, location, and link to website
- Profile image is professional
- Consistent posting cadence evident from grid
- Process and in-progress content present
- Finished work featured with thoughtful captions
- Community engagement visible
- Studio or behind-the-scenes content present

INSTAGRAM ANALYSIS: Write 3 to 4 sentences in Reilly voice. What impression does the profile make on a gallerist or collector encountering it for the first time. What is working. What is the single most important shift.

CLOSING (output exactly):
This audit reflects the state of your business at the time of our consultation. My recommendations are a starting point, not a final destination. The strongest art businesses are built incrementally, and consistent effort over time yields results that no single change can produce alone.

As you work through these, do not hesitate to reach out to our team in our weekly webinars with any questions.

I am genuinely excited about what is ahead for you.

- Reilly

APPENDIX (output exactly):
Useful Resources from Art Storefronts

Dominating Your Niche
Instagram Best Practices Before and After 1000 Followers
1000 Followers Strategy for Facebook
How to Invite Your Facebook Friends to Like Your Business Page
Social Media Security Protecting Your Instagram and Facebook Accounts
Become an Instagram Pro 30-Day Bootcamp
Summer School Breaking Down Successful Social Media Content
Fall Content Academy Level Up Your Social Media Game
Reddit 101
Ultimate Guide for Successful Art Shows and Fairs
The Pivot Playbook
Regular Giveaway Playbook
The Custom Artwork Strategy
Best Practices for Selling Limited Editions
The Live Art Show Playbook
Niche Master Course Workflow Find Your True Audience`;

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
    const reviewText = claudeData.content[0].text;

    // ── BUILD HTML ──
    const html = buildHTML(artistName, reviewText);

    // ── PUSH TO GITHUB ──
    const slug = artistName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const filename = `${slug}-${Date.now()}.html`;
    const encoded = Buffer.from(html).toString('base64');

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add PPR for ${artistName}`,
        content: encoded
      })
    });

    const liveUrl = `https://indraasf.github.io/ppr-deliverables/${filename}`;

    // ── POST TO SLACK ──
    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        text: `*[${artistName.toUpperCase()} — PORTFOLIO REVIEW]*\n\nReilly's review is ready. Click to open:\n${liveUrl}`
      })
    });
    const slackData = await slackRes.json();
    console.log('Slack response:', JSON.stringify(slackData));

    console.log(`PPR generated and delivered for ${artistName}`);

  } catch (err) {
    console.error('PPR generation error:', err);
  }
});

// ── HTML BUILDER ──
function buildHTML(artistName, reviewText) {
  // Convert markdown to clean HTML
  let content = reviewText
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Checklist items with PASS
    .replace(/^- (.+): \*\*PASS\*\*(.*)$/gm, '<div class="checklist-item pass"><span class="status pass">PASS</span> $1</div>')
    // Checklist items with FAIL
    .replace(/^- (.+): \*\*FAIL\*\*(.*)$/gm, (match, item, note) => `<div class="checklist-item fail"><span class="status fail">FAIL</span> ${item}${note ? `<span class="checklist-note">${note}</span>` : ''}</div>`)
    // Checklist items with PARTIAL
    .replace(/^- (.+): \*\*PARTIAL\*\*(.*)$/gm, (match, item, note) => `<div class="checklist-item partial"><span class="status partial">PARTIAL</span> ${item}${note ? `<span class="checklist-note">${note}</span>` : ''}</div>`)
    // Regular bullet points
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive li items in ul
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Paragraphs - wrap lines that aren't already HTML tags
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .filter(line => line !== '')
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Portfolio Review — ${artistName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --black: #0A0A0A;
      --dark: #1A1A1A;
      --mid: #6B6B6B;
      --light: #F7F7F5;
      --rule: #E2E2E2;
      --accent: #B8A082;
      --white: #FFFFFF;
      --pass: #3D7A5A;
      --fail: #B03A2E;
      --partial: #9A7B2E;
    }

    body {
      font-family: 'EB Garamond', Georgia, serif;
      background: var(--white);
      color: var(--dark);
      font-size: 19px;
      line-height: 1.8;
    }

    /* ── COVER ── */
    .cover {
      background: var(--black);
      color: var(--white);
      padding: 100px 80px 80px;
      min-height: 340px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .cover-eyebrow {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 28px;
    }

    .cover-title {
      font-family: 'EB Garamond', serif;
      font-size: 52px;
      font-weight: 400;
      line-height: 1.05;
      color: var(--white);
      margin-bottom: 20px;
    }

    .cover-sub {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 300;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.05em;
    }

    /* ── CONTAINER ── */
    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 80px 40px 120px;
    }

    /* ── TYPOGRAPHY ── */
    h1 { display: none; } /* covered by cover block */

    h2 {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--accent);
      margin-top: 80px;
      margin-bottom: 6px;
    }

    h3 {
      font-family: 'EB Garamond', serif;
      font-size: 30px;
      font-weight: 400;
      color: var(--dark);
      margin-top: 8px;
      margin-bottom: 28px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--dark);
    }

    h4 {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--mid);
      margin-top: 40px;
      margin-bottom: 12px;
    }

    p {
      margin-bottom: 20px;
      color: var(--dark);
    }

    strong {
      font-weight: 500;
    }

    hr {
      border: none;
      border-top: 1px solid var(--rule);
      margin: 48px 0;
    }

    ul {
      margin: 16px 0 24px 0;
      padding: 0;
      list-style: none;
    }

    li {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: var(--mid);
      padding: 8px 0 8px 20px;
      border-bottom: 1px solid var(--rule);
      position: relative;
    }

    li::before {
      content: '—';
      position: absolute;
      left: 0;
      color: var(--accent);
    }

    /* ── CHECKLIST ── */
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--rule);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: var(--dark);
      line-height: 1.5;
    }

    .status {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      padding: 3px 8px;
      border-radius: 2px;
      white-space: nowrap;
      margin-top: 1px;
    }

    .status.pass { background: #EAF4EE; color: var(--pass); }
    .status.fail { background: #FBEAEA; color: var(--fail); }
    .status.partial { background: #FBF5E6; color: var(--partial); }

    .checklist-note {
      display: block;
      color: var(--mid);
      font-size: 13px;
      margin-top: 4px;
      font-style: italic;
    }

    /* ── ANALYSIS BLOCKS ── */
    .container > p:not(:first-child) {
      line-height: 1.85;
    }

    /* ── FOOTER ── */
    .footer {
      background: var(--black);
      color: rgba(255,255,255,0.25);
      text-align: center;
      padding: 36px 40px;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    @media (max-width: 600px) {
      .cover { padding: 60px 28px 48px; }
      .cover-title { font-size: 36px; }
      .container { padding: 48px 24px 80px; }
    }
  </style>
</head>
<body>

  <div class="cover">
    <div class="cover-eyebrow">Art Storefronts × Reilly Thomson</div>
    <div class="cover-title">Professional Portfolio Review</div>
    <div class="cover-sub">Prepared for ${artistName}&nbsp;&nbsp;·&nbsp;&nbsp;Evaluated at gallery standard</div>
  </div>

  <div class="container">
    ${content}
  </div>

  <div class="footer">
    Art Storefronts × Reilly Thomson &nbsp;·&nbsp; Professional Portfolio Review &nbsp;·&nbsp; Confidential
  </div>

</body>
</html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PPR server running on port ${PORT}`));
