const express = require('express');
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');
const app = express();

// Keep-alive agents to prevent premature connection close on long Claude responses
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = 'portfolio-reviews';

app.get('/', (req, res) => {
  res.send('PPR Pipeline v2.1 is running.');
});

function parseChecklist(value) {
  if (!value || value === '' || value === 'null' || value === 'undefined') return 'FAIL';
  if (value.toString().toLowerCase().includes('present')) return 'PASS';
  return 'FAIL';
}

async function callClaudeWithRetry(prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Claude attempt ${attempt + 1}...`);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }]
        }),
        agent: httpsAgent
      });
      const data = await response.json();
      const text = data?.content?.[0]?.text;
      if (!text) throw new Error('Empty Claude response: ' + JSON.stringify(data));
      return text;
    } catch (err) {
      console.error(`Claude attempt ${attempt + 1} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

app.post('/generate', async (req, res) => {
  console.log('Generate endpoint hit');
  const data = req.body;

  const artistName = data.name || 'Unknown Artist';
  const firstName = artistName.split(' ')[0];
  const websiteUrl = data.website || '';
  const instagramUrl = data.instagram || '';
  const otherPlatforms = data.other_platforms || 'None';
  const artPractice = data.art_practice || '';
  const medium = data.medium || '';
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

  res.status(200).json({ status: 'processing', artist: artistName });

  try {
    const websiteContentChecklist = `WEBSITE & CONTENT:
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
${wcNotes ? `WEBSITE & CONTENT REVIEWER NOTES — MANDATORY. Every specific recommendation in these notes must appear as an action item in the Website Observations section. Do not omit, summarize, or generalize any item. These are Indra's direct observations from reviewing the artist's actual website: ${wcNotes}` : ''}`.trim();

    const shopChecklist = `SHOP & PRODUCT:
${spWorks === 'PASS' ? 'PASS' : 'FAIL'}  Minimum 10 works listed and available to view
${spOrganized === 'PASS' ? 'PASS' : 'FAIL'}  Originals and/or limited editions clearly organized
${spFeatured === 'PASS' ? 'PASS' : 'FAIL'}  Best Sellers or Featured Works category present
${spThumbnails === 'PASS' ? 'PASS' : 'FAIL'}  Clean thumbnail images with consistent cropping
${spDetails === 'PASS' ? 'PASS' : 'FAIL'}  Each product page includes title, medium, dimensions
${spMockups === 'PASS' ? 'PASS' : 'FAIL'}  Wall preview or room mockup images present
${spCheckout === 'PASS' ? 'PASS' : 'FAIL'}  Checkout button clearly visible
${spPrints === 'PASS' ? 'PASS' : 'FAIL'}  Print size options present
${spLinked === 'PASS' ? 'PASS' : 'FAIL'}  Original artwork linked to available prints
${spNotes ? `SHOP & PRODUCT REVIEWER NOTES — MANDATORY. Every specific recommendation in these notes must appear as an action item in the Website Observations section. Do not omit, summarize, or generalize any item: ${spNotes}` : ''}`.trim();

    const pricingChecklist = `PRICING:
${prPricing === 'PASS' ? 'PASS' : 'FAIL'}  Pricing structure appropriate for current market stage
${prLeadCapture === 'PASS' ? 'PASS' : 'FAIL'}  Lead Capture tool active
${prAnnouncement === 'PASS' ? 'PASS' : 'FAIL'}  Announcement bar present
${prNotes ? `PRICING REVIEWER NOTES — MANDATORY. Every specific recommendation in these notes must appear as an action item in the Website Observations section. Do not omit, summarize, or generalize any item: ${prNotes}` : ''}`.trim();

    const instagramChecklist = `INSTAGRAM:
${igBio === 'PASS' ? 'PASS' : 'FAIL'}  Bio includes medium, location, and link to website
${igProfile === 'PASS' ? 'PASS' : 'FAIL'}  Profile image is professional
${igCadence === 'PASS' ? 'PASS' : 'FAIL'}  Consistent posting cadence evident from grid
${igProcess === 'PASS' ? 'PASS' : 'FAIL'}  Process and in-progress content present (Reels, video clips)
${igCaptions === 'PASS' ? 'PASS' : 'FAIL'}  Finished work featured with thoughtful captions
${igEngagement === 'PASS' ? 'PASS' : 'FAIL'}  Community engagement visible
${igStudio === 'PASS' ? 'PASS' : 'FAIL'}  Studio or behind-the-scenes content present
${igNotes ? `INSTAGRAM REVIEWER NOTES — MANDATORY. Every specific recommendation in these notes must appear as an action item in the Instagram Observations section. Do not omit, summarize, or generalize any item. These are Indra's direct observations from reviewing the artist's actual Instagram: ${igNotes}` : ''}`.trim();

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

    const prompt = `You are generating a Professional Portfolio Review on behalf of Reilly Thomson, an art consultant currently at David Zwirner gallery in New York as Project Coordinator and Sales Support. He manages multi-phase exhibitions for blue-chip artists at venues including The British Museum, Musee National Picasso, Deste Foundation, Art Basel, Frieze, and Unlimited. He builds visual presentations for the Top 200 Collectors worldwide driving seven-figure sales. Previously Communications Director at M+B Gallery LA where he grew Instagram 54% and engagement 121%, securing placements in American Vogue and Architectural Digest. BA English Summa Cum Laude UCLA GPA 3.95.

ARTIST INFORMATION:
Name: ${artistName}
Website: ${websiteUrl}
Instagram: ${instagramUrl}
Other platforms: ${otherPlatforms}
Art practice: ${artPractice}
Primary medium: ${medium || 'Not specified'}
Artist inspirations: ${artistInspirations}
Personal motivation: ${personalMotivation}
Career length (selling): ${careerLength}
Credentials: ${credentials}
Price of originals: ${priceOriginals}
Price of prints: ${pricePrints}
Collector vision: ${collectorVision}
Additional notes: ${additionalNotes}
${overallNotes ? `
REVIEWER NOTES — MANDATORY SOURCE MATERIAL. These notes were taken during the live consultation call with this artist. Every specific detail, story, goal, timeline, number, and personal reference in these notes MUST appear somewhere in the output — in the intro, the conclusion, or the relevant section observations. Do not summarize, do not omit, do not generalize. If the notes mention a specific artwork, name it. If they mention a sales target, use it. If they mention a personal story, reference it. Treating these notes as optional or background context is a failure. They are the primary input for everything personal in this document.

REVIEWER NOTES CONTENT:
${overallNotes}

END OF REVIEWER NOTES — now use every specific detail above in your output.
` : 'No reviewer notes provided — draw from the artist form fields to write personal observations.'}

CHECKLIST RESULTS (completed by internal reviewer):
${websiteContentChecklist}

${shopChecklist}

${pricingChecklist}

${instagramChecklist}

VOICE RULES — REILLY THOMSON v3.0:
TWO-TONE APPROACH: The artist statement and checklist PASS/FAIL notes use Reilly's formal analytical voice — precise, earned, culturally literate. The Observations & Next Steps paragraphs use his warm, collegial, direct voice — like a knowledgeable friend giving honest feedback, not a consultant delivering a report. The test for the observations paragraphs: would this sound natural if Reilly said it out loud to the artist over coffee? If it sounds like a written report, rewrite it. Contractions, "I" statements, "you" address, practical specifics. See his real writing samples below.

Write as Reilly Thomson. Clear, thoughtful, intelligent. Open with a specific sensory or visual observation. Use his signature move: describe what could go wrong then explain why it does not. Build arguments incrementally — context first, implication second, specific detail last. Deliver hard truths plain and work-first. Always close with the why. The market observation arrives last after the analysis earns it.

BANNED WORDS AND PHRASES — HARD RULE. Treat this as an absolute filter. Before finalizing any sentence, check it against this list. If any banned word or phrase appears anywhere in your output, rewrite that sentence before continuing. There are no exceptions.

BANNED PUNCTUATION & STRUCTURE:
- Em dashes — ABOLISH ENTIRELY. The em dash character (—) must never appear anywhere in your output. Not in observations, not in the artist statement, not in bullet points, not in subheadings, not anywhere. If you feel the urge to use an em dash, use a comma, a period, or rewrite the sentence. Before submitting your output, do a dedicated scan for the — character and remove every instance. This is a zero-tolerance rule.
- Short standalone sentences for dramatic effect ("That's not an accident." / "That matters.")
- Rhetorical questions of any kind
- Lists of three with parallel structure ("bold, confident, and unapologetic")

BANNED WORDS — do a mental scan for each of these before finishing any paragraph:
solid / solid foundation / solid base / solid start / strong foundation / good foundation / great foundation / great bones
tapestry / nuanced / compelling / captivating / striking
awesome / another level / sick / incredible / amazing
"you have built something genuine here"
"speaks to" / "resonates with" / "invites the viewer to"
"navigates" (as in navigates themes of...)
unpacks / interrogates / grapples with / grapple
liminal / visceral / evocative
"at its core" / "at its heart"
"breakthrough year" / "let's get started"
synergy / leverage / content (as noun for artwork)
transformative / journey / vibrant / delve
exclamation points anywhere except the greeting line and the final closing line

BANNED TONE:
- No definitive affirmations: "gallery-ready", "blue-chip worthy", "collector-ready"
- No overpromising: "collectors will respond to this immediately"
- No press release language
- No hollow affirmations before critique ("This is really exciting work, but...")
- No hollow flattery or generic encouragement of any kind — every compliment must be specific and earned by the analysis preceding it
- Never overflatter or oversell the artist's work as if they were the next Monet deserving the world's attention
- Never imply the artist is already in a position that takes most artists decades to reach — they may not be, and setting false expectations after the service ends is harmful
- Never generate enthusiasm — report observations. If it feels like a sales pitch, rewrite it

BANNED PHRASES — add these to the hard scan before output:
- "Most artists spend years trying to..."
- "You're in a unique position that..."
- "That kind of X is something most artists never..."
- "You have all the tools needed to..."
- "Building from a position of genuine strength"
- "Genuinely unique to offer"
- "That intuition is right"
- "Meaningful, lasting career"
- "Rewards close examination"
- "You are quietly building"
- "Honestly..." (as a sentence opener)
- "Biggest opportunity" (use specific language instead)
- "Transforms followers into collectors"
- "Real and growing market"
- "Compelling personal narrative" (avoid entirely)
- Any phrase that compares this artist favorably to "most artists"
- Any phrase that feels like it is generating enthusiasm rather than reporting an observation
- "I was struck by..." (use a specific observation instead)
- "I couldn't help but notice..." (too performative — state the observation directly)
- "It's clear that..." (too declarative — show, don't tell)

BANNED FRAMING:
- Never compare to a famous artist unless precise and fully defensible
- Never declare what a work "is about" — suggest, don't define
- Never write anything that could appear unedited on a Wikipedia page
- If a sentence could have been written without actually looking at this artist's work, cut it

SENSITIVE TOPICS — MENTAL HEALTH, GRIEF, ADDICTION:
If the artist's form responses or reviewer notes mention that the artist is personally struggling with mental health, addiction, grief, or a death in the family, apply these rules strictly:
- In the Introduction, Observations & Next Steps, and Looking Ahead sections: never name the specific struggle. Refer to it only vaguely as "challenges you've been navigating" or "a difficult period" or similar — nothing more specific.
- In the Suggested Communities sections (Subreddits, Facebook Groups, Instagram Accounts): never recommend mental health, grief, addiction, or rehabilitation communities. Do not suggest therapy groups, recovery groups, or support groups of any kind.
- Exception: if the artist explicitly states that their artwork itself deals with grief, healing, or mental health as its subject matter, it is acceptable to recommend art therapy groups or communities centered on healing through art — but only if the art practice itself is explicitly framed this way by the artist.

FORMAT RULES:
- Never use bullet points in the intro or Looking Ahead sections — these must be written in natural prose only
- Never end sentences with exclamation marks in professional sections — reserve only for casual moments in the intro if genuinely appropriate, never in observations, statements, or conclusions

SELF-CHECK BEFORE OUTPUTTING — mandatory three-pass review:
Pass 1: Scan for the em dash character (—). If you find even one, remove it and rewrite that sentence. Zero tolerance.
Pass 2: Scan for every word and phrase on the banned lists above. If you find any, rewrite before delivering.
Pass 3: Scan the intro and Looking Ahead sections — confirm they contain zero bullet points and are written entirely in prose. Confirm no sentence ends with an exclamation mark in any professional section.
Do not skip any pass. Do not deliver output until all three passes are complete.

CREDENTIALS RULE: If any credentials field says none, no, or none yet — DO NOT mention it anywhere in the document. Only reference credentials that actually exist.

NAME AND PRONOUN RULES: In the greeting use first name only. In the artist statement the first instance uses full name, every subsequent reference uses last name only. Never use "his/her" pronouns in the artist statement.

REILLY REAL WRITING SAMPLES — calibrate the Observations & Next Steps sections against these:

Sample 1 (encouraging, grounded in specifics):
"I would not be discouraged at all by where you currently are. Selling work in both of the exhibitions you participated in is actually a very positive sign, especially this early on. I'd focus primarily on Instagram rather than spreading yourself too thin across every platform. I'd post video reels of your process, and talk about the work directly to camera, letting people connect with you as the artist behind the paintings."

Sample 2 (practical, direct, warm):
"I'd focus heavily on developing your website and social media presence, sharing the work regularly, showing your process and personality, and building an audience that becomes just as invested in the work as you are. The more consistently you show up and develop a recognizable body of work around your strongest ideas and interests, the easier it becomes for collectors to connect with what you're doing."

Sample 3 (honest, specific, not preachy):
"Frames are indeed very personal, and sometimes buyers fully love the artwork but simply want it to fit their own space or aesthetic more closely. One option could be offering originals unframed going forward, with framing available as an add-on at an additional cost. If you start noticing that multiple buyers consistently want different framing choices, I'd take that as a sign to offer the works unframed and treat framing as optional rather than standard."

REILLY FORMAL WRITING SAMPLE — calibrate the artist statement and checklist notes against this:
"What initially struck me about this work is the color. Purple, yellow, and green at this intensity could easily overwhelm each other, and yet here they create a harmonious camouflage across the surface. That balance speaks to your strong understanding of printmaking and large-scale composition. The black line work underneath holds the abstract color composition together nicely. The single plant in the foreground against the dense foliage behind it creates an interesting tension between planes. Due to the minimal negative space in the work, the viewer is pulled deeper into the work rather than allowed to observe it from a distance. While a lack of negative space can be overwhelming for a viewer, I think it works nicely here and lends an interesting pattern effect. The abundance of pattern across the surface moves the work away from photo-realism in an interesting direction. Rather than describing the subject, the patterns generate a vibrating energy that I think is worth exploring further."

NOW GENERATE THE FULL DOCUMENT using this exact structure. Output clean text only — no marker labels, no commentary outside the document:

---

Professional Portfolio Review with Reilly Thomson
Prepared by Reilly Thomson · Art Storefronts
Your practice, evaluated at gallery standard.

## INTRODUCTION — WRITE THIS ENTIRE SECTION FROM SCRATCH

There is no static template text for this section. You must write the full introduction yourself, 6 to 8 short paragraphs total (2-3 sentences each), following this structure:

PARAGRAPH 1 — REQUIRED, PERSONAL OPENING: Re-read the REVIEWER NOTES above right now before writing anything. Open with "Hi ${firstName}, it was really great speaking with you..." — no exclamation point, just a comma and warmth. Reference something specific from the REVIEWER NOTES immediately.

PARAGRAPHS 2-4 — REQUIRED, MORE PERSONAL CONTENT: Continue drawing from REVIEWER NOTES. Treat every detail in overall_notes as gold — specific artworks mentioned, personal stories shared, goals stated, career milestones, life context. Reference them by name and with specificity. Use "I" constantly and naturally: "I especially enjoyed...", "I also really admire...", "I kept thinking about...", "I loved hearing that...". The test: would these paragraphs only make sense for this specific artist? If they could apply to anyone, rewrite them. If overall_notes is sparse, draw from art_practice, personal_motivation, and career_length instead — never write something generic.

PARAGRAPH 5 — REQUIRED, CREDENTIAL CONTEXT: Include Reilly's professional framing — something like "Having worked at David Zwirner, I've seen firsthand what separates the artists who get taken seriously from those who don't. This audit covers four crucial areas: website and public presence, artist statement, niche and positioning, and social media strategy." Adapt the wording so it flows naturally from the personal paragraphs before it.

PARAGRAPH 6 — REQUIRED, STAKES: One short paragraph on why these materials matter — something like "Every player in the art world, from collectors and advisors to gallerists and curators, will encounter your work through these same touchpoints." Adapt naturally.

FINAL PARAGRAPH — REQUIRED, TRANSITION: End with a simple practical line: "I've laid everything out below in a clear, structured way so you can see exactly where things stand."

OVERALL STYLE: This reads like a personal letter from someone who genuinely listened during the consultation. Short paragraphs throughout, never dense blocks. No bullet points anywhere in this section.

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

MANDATORY: Before writing, re-read all REVIEWER NOTES above — WEBSITE & CONTENT, SHOP & PRODUCT, and PRICING notes. Every specific item in those notes must appear as an action item in the bullet list below. Write 2 to 3 short focused paragraphs in Reilly's warm, collegial voice. Speak directly to the artist as "you", use "I" and contractions naturally. Paragraph 1: what is working and the overall impression the site makes. Paragraph 2: the areas that need improvement, with specific observations tied to this artist's actual situation. Paragraph 3: the single most important change. Each paragraph 2 to 3 sentences maximum. Avoid any sentence that could have been written without actually looking at their website. Then write a bulleted list organized under subheadings prefixed with "Action Items —": "Action Items — Branding & Positioning", "Action Items — Navigation & Site Organization", "Action Items — Collection Presentation", "Action Items — Typography & Readability", "Action Items — Hero Images & Visual Hierarchy" — only include subheadings relevant to this artist. If reviewer notes (wc_notes, sp_notes, pr_notes) are present, preserve every single item as a bullet. Each bullet starts with a verb: "Update...", "Add...", "Move...", "Change...", "Bold...", "Reorganize...", "Reduce...".

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

Write the artist statement in Reilly's formal analytical voice. Structure it as 4 to 5 short paragraphs of 2 to 3 sentences each — never one long block. Each paragraph has a single focus: (1) the work itself and medium, (2) recurring motifs and visual language, (3) a specific formal or art historical observation, (4) the personal narrative and driving question, (5) credentials and mission if they exist. Open with a declaration about the work itself, not the biography. Include one earned art historical or cultural reference only if defensible — omit if not. Contain the personal narrative in a way that feels discovered not stated. End positioning the practice as part of a larger conversation. Write in third person throughout. First instance uses full name, every subsequent reference uses last name only. Never use "his/her" pronouns. Never use first person ("I", "my", "me") in the artist statement. CREDENTIALS RULE: only include exhibition history, education, or press if they were actually provided and are not blank or none.

---

## Part 3: NICHE & POSITIONING

Your niche is not a permanent label, but a flexible tool that should be adapted and honed throughout your career. The most successful artists on the primary market have developed a clear, recognizable body of work that speaks directly to a specific collector sensibility, cultural interest, or subject matter community. This section evaluates how well your current work and positioning connect with the buyers most likely to respond to it.

### My Observations & Next Steps

CHECK REVIEWER NOTES before writing this section — if the notes mention anything about the artist's target audience, professional network, mission, or positioning, use it here. Write 3 to 4 sentences that sound like Reilly talking directly to the artist — warm, honest, collegial. Use "I", contractions, and speak to the artist as "you". Name the niche precisely — never vague descriptors like "nature lovers" or "art enthusiasts" — and be concrete about who the ideal collector actually is and why this work connects with them. Within the paragraph include at least one practical actionable suggestion the artist could act on immediately. Then write a bulleted list under "Action Items — Niche". If overall_notes contains relevant positioning intel, clean it up and include every item. Each bullet starts with a verb.

### Suggested Communities

#### 5 Subreddits
List 5 active relevant subreddits. For each include the name and one sentence on why it is relevant. Only suggest subreddits that are well-known, large, and almost certainly still active — r/photography, r/Art, r/watercolor etc. Do not invent niche subreddits that may not exist.

#### 5 Facebook Groups
List 5 Facebook Groups relevant to this artist's niche and collector audience. For each include the name and one sentence on why it is relevant. Prefer large well-known groups over niche ones that may not exist.

#### 5 Instagram Accounts
List 5 Instagram accounts the ideal collector likely follows. For each include the handle and one sentence on why it is strategically relevant. IMPORTANT: Only suggest accounts you are highly confident exist and are active — major publications, well-known organizations, established institutions. Do not suggest individual artist accounts or small community accounts that may be inactive or non-existent. If unsure whether an account exists, describe the type of account to look for instead of naming a specific handle.

---

## Part 4: SOCIAL MEDIA STRATEGY

Social media is often the first place a gallerist, advisor, or collector will encounter your work — or look you up after hearing your name. Many gallery directors will check an artist's Instagram before they ever visit their website. At this stage in your career, social media is less about getting immediate sales (though those are always welcome!). The point is to build momentum: attracting your first serious collectors, growing a community around your work, and getting on the radar of the people who matter. That momentum in engagement will eventually return in sales and continue to grow.

### Instagram

Output each item from the Instagram checklist above with PASS or FAIL. For every FAIL item write one sentence in Reilly's voice.

### My Observations & Next Steps

MANDATORY: Before writing, re-read the INSTAGRAM REVIEWER NOTES above. Every specific item in those notes must appear as an action item in the bullet list. Write 3 to 4 sentences that sound like Reilly talking directly to the artist — warm, honest, collegial, like a real person who actually looked at the profile. Use "I", contractions, and speak to the artist as "you". Be specific about what the profile currently communicates and what impression it makes on someone encountering it for the first time. Avoid any sentence that could have been written without actually looking at their Instagram. Then write a bulleted list under "Action Items — Instagram". If ig_notes contains reviewer recommendations, preserve every single item as a bullet. Always include a Reels recommendation adapted to this artist's specific practice. Each bullet starts with a verb.

---

## Looking Ahead

CONCLUSION — REVIEWER NOTES ARE YOUR SCRIPT. Re-read the REVIEWER NOTES above right now before writing a single word. Every paragraph must reference something specific from those notes. Write 3 paragraphs of 3 to 4 sentences each in Reilly's warm conversational voice. This is the most personal section of the document after the intro. Draw from overall_notes: "${overallNotes}" for specific details — goals stated, timelines mentioned, sales targets, life plans, personal stories. Reference them directly.

Paragraph 1: Frame what makes this artist's situation worth paying attention to — what existing assets, credibility, or context they have that is relevant to their goals. Be specific. Do not compare them to other artists.

Paragraph 2: Name one concrete opportunity in specific terms. Give a specific example of what executing on it actually looks like — name a specific artwork, a specific story, a specific action. Make it vivid enough that the artist can picture doing it.

Paragraph 3: Close with something personal and forward-looking that only applies to this artist — reference a specific goal, timeline, or life detail from overall_notes if present. End on momentum without overpromising outcomes.

The test: every sentence should only make sense for this specific artist. If it could apply to anyone, rewrite it. No bullet points — prose only.

---

My recommendations are a starting point, not a final destination. The strongest art businesses are built incrementally and consistent effort over time yields results that no single change can produce alone.

Spend as much time as you can in the studio, leaning into what about your practice excites you the most, and see where it takes you. And don't forget to tell your fans about your discoveries — we all want to know!

I'm genuinely excited about what's ahead for you!

— Reilly

---

## Appendix: Useful Resources from Art Storefronts

Dominating Your Niche
Instagram Best Practices (Before + After 1,000 Followers)
1000 followers strategy for FACEBOOK!
How to Invite Your Facebook Friends to Like your Business Page (+ sharing!)
Social Media Security: Protecting Your Instagram and Facebook Accounts
Become an Instagram Pro | 30-Day Bootcamp
Summer School | Breaking Down Successful Social Media Content
Fall Content Academy | Level Up your Social Media Game
Reddit 101
Ultimate Guide for Successful Art Shows and Fairs
The Pivot Playbook
Regular Giveaway Playbook
The Custom Artwork Strategy
Best Practices for Selling Limited Editions
The Live Art Show Playbook (3.0)
Niche Master Course Workflow | Find Your True Audience`;

    const reviewText = await callClaudeWithRetry(prompt);
    console.log('Claude generated review successfully');

    const notifyRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        text: `*[${artistName.toUpperCase()} — PORTFOLIO REVIEW]*\n\nReilly's review is ready. The full text is attached as a file below.\n\n_Download, paste into a Google Doc, have Reilly review and edit, then trigger the HTML build when ready._`
      })
    });
    const notifyData = await notifyRes.json();
    console.log('Slack notification posted, channel:', notifyData.channel);

    const fileName = `${artistName.replace(/\s+/g, '_')}_Portfolio_Review.txt`;
    const fileBytes = Buffer.byteLength(reviewText, 'utf8');

    const uploadUrlRes = await fetch('https://slack.com/api/files.getUploadURLExternal', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        filename: fileName,
        length: fileBytes.toString()
      })
    });
    const uploadUrlData = await uploadUrlRes.json();
    console.log('Upload URL response:', JSON.stringify(uploadUrlData));

    if (uploadUrlData.ok) {
      await fetch(uploadUrlData.upload_url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: reviewText
      });
      console.log('File content uploaded');

      const completeRes = await fetch('https://slack.com/api/files.completeUploadExternal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: [{ id: uploadUrlData.file_id, title: `${artistName} — Portfolio Review` }],
          channel_id: notifyData.channel,
          initial_comment: `Full review text for ${artistName}`
        })
      });
      const completeData = await completeRes.json();
      console.log('File complete response:', JSON.stringify(completeData));
    } else {
      console.log('File upload failed, falling back to message chunks');
      const chunks = reviewText.match(/.{1,3000}/gs) || [];
      for (const chunk of chunks) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ channel: SLACK_CHANNEL, text: chunk })
        });
      }
    }

    console.log(`PPR generated and delivered for ${artistName}`);

  } catch (err) {
    console.error('PPR generation error:', err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PPR server v2.1 running on port ${PORT}`));
