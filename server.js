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

  const artistName = data['What is your full name?'] || 'Unknown Artist';
  const websiteUrl = data['What is the URL of your website?'] || '';
  const instagramHandle = data['What is your Instagram handle?'] || '';
  const otherPlatforms = data['Do you have a presence on any other platforms? If yes, please share your handle or profile URL for each.'] || 'None';
  const artPractice = data['In as many words as you\'d like, describe your art practice — including your subject matter, medium, recurring themes or ideas, and any artists whose work has influenced yours.'] || '';
  const personalMotivation = data['What is the personal motivation or driving question behind your work? Why do you make what you make?'] || '';
  const careerLength = data['How long have you been working as a professional artist?'] || '';
  const representation = data['How would you describe your current representation situation?'] || '';
  const exhibitionHistory = data['Exhibition history: Have you had any solo or group exhibitions, special presentations, art fairs, or murals? Please list them with venue and year if possible.'] || 'None provided';
  const education = data['Education, residencies, grants & fellowships: Have you received a formal art education, participated in any residency, or received any grants, fellowships, or awards?'] || 'None provided';
  const press = data['Press & recognition: Has your work been featured in any publications, blogs, podcasts, or media? Do any notable collectors or institutions own your work?'] || 'None provided';
  const priceOriginals = data['What is the current price range of your original artworks?'] || '';
  const pricePrints = data['What is the current price range of your prints or editions, if applicable?'] || 'N/A';
  const collectorVision = data['Who do you imagine buys your work, or who would you most like to buy it?'] || '';
  const additionalNotes = data['Is there anything about your practice, your goals, or your current situation that you\'d like Reilly to know before your consultation?'] || 'None';

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
  const paragraphs = reviewText
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      if (line.startsWith('PART ') || line.startsWith('APPENDIX')) {
        return `<h2>${line}</h2>`;
      } else if (line.startsWith('Professional Portfolio Review')) {
        return `<h1>${line}</h1>`;
      } else if (line.startsWith('Prepared by') || line.startsWith('Your practice')) {
        return `<p class="subtitle">${line}</p>`;
      } else if (line.match(/^(PASS|FAIL|PARTIAL)/i) || line.startsWith('- ')) {
        return `<p class="checklist-item">${line}</p>`;
      } else {
        return `<p>${line}</p>`;
      }
    }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Portfolio Review — ${artistName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --black: #0A0A0A;
      --dark: #1A1A1A;
      --mid: #6B6B6B;
      --light: #F5F5F3;
      --rule: #E2E2E2;
      --accent: #B8A082;
      --white: #FFFFFF;
    }

    body {
      font-family: 'EB Garamond', Georgia, serif;
      background: var(--white);
      color: var(--dark);
      font-size: 18px;
      line-height: 1.75;
    }

    .cover {
      background: var(--black);
      color: var(--white);
      padding: 120px 80px;
      min-height: 320px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .cover-eyebrow {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 400;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 24px;
    }

    .cover h1 {
      font-family: 'EB Garamond', serif;
      font-size: 48px;
      font-weight: 400;
      line-height: 1.1;
      color: var(--white);
      margin-bottom: 16px;
      max-width: 700px;
    }

    .cover .cover-sub {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 300;
      color: rgba(255,255,255,0.5);
      letter-spacing: 0.06em;
    }

    .container {
      max-width: 780px;
      margin: 0 auto;
      padding: 80px 40px 120px;
    }

    .intro {
      border-bottom: 1px solid var(--rule);
      padding-bottom: 60px;
      margin-bottom: 60px;
    }

    .intro p {
      font-size: 19px;
      line-height: 1.8;
      color: var(--dark);
      margin-bottom: 20px;
    }

    h2 {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-top: 72px;
      margin-bottom: 8px;
    }

    h3 {
      font-family: 'EB Garamond', serif;
      font-size: 28px;
      font-weight: 400;
      color: var(--dark);
      margin-bottom: 24px;
      border-bottom: 1px solid var(--dark);
      padding-bottom: 12px;
    }

    p {
      margin-bottom: 20px;
      color: var(--dark);
    }

    .subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 300;
      color: var(--mid);
      letter-spacing: 0.04em;
    }

    .checklist-item {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      padding: 10px 16px;
      border-left: 3px solid var(--rule);
      margin-bottom: 8px;
      line-height: 1.5;
      color: var(--dark);
    }

    .checklist-item.pass { border-left-color: #4A7C59; }
    .checklist-item.fail { border-left-color: #C0392B; }
    .checklist-item.partial { border-left-color: #B8860B; }

    .analysis {
      background: var(--light);
      border-left: 3px solid var(--accent);
      padding: 32px 36px;
      margin: 32px 0;
    }

    .analysis p {
      font-size: 17px;
      line-height: 1.8;
    }

    .community-list {
      margin: 24px 0;
    }

    .community-item {
      padding: 16px 0;
      border-bottom: 1px solid var(--rule);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
    }

    .community-item strong {
      display: block;
      color: var(--dark);
      margin-bottom: 4px;
    }

    .community-item span {
      color: var(--mid);
    }

    .closing {
      margin-top: 72px;
      padding-top: 48px;
      border-top: 1px solid var(--rule);
    }

    .signature {
      font-family: 'EB Garamond', serif;
      font-size: 22px;
      font-style: italic;
      color: var(--dark);
      margin-top: 32px;
    }

    .appendix {
      margin-top: 72px;
      padding: 48px;
      background: var(--light);
    }

    .appendix h2 {
      margin-top: 0;
      margin-bottom: 24px;
    }

    .appendix p {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: var(--mid);
      margin-bottom: 8px;
    }

    .footer {
      background: var(--black);
      color: rgba(255,255,255,0.3);
      text-align: center;
      padding: 40px;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    @media (max-width: 600px) {
      .cover { padding: 60px 32px; }
      .cover h1 { font-size: 32px; }
      .container { padding: 48px 24px 80px; }
    }
  </style>
</head>
<body>

  <div class="cover">
    <div class="cover-eyebrow">Art Storefronts × Reilly Thomson</div>
    <h1>Professional Portfolio Review</h1>
    <p class="cover-sub">Prepared for ${artistName} &nbsp;·&nbsp; Evaluated at gallery standard</p>
  </div>

  <div class="container">
    ${paragraphs}
  </div>

  <div class="footer">
    Art Storefronts × Reilly Thomson &nbsp;·&nbsp; Professional Portfolio Review &nbsp;·&nbsp; Confidential
  </div>

</body>
</html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PPR server running on port ${PORT}`));
