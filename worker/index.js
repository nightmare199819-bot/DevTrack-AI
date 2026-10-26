const APP_ORIGIN = "https://nightmare199819-bot.github.io";
const MODEL = "gemini-3.5-flash-lite";
const rateBuckets = new Map();

const RESOURCES = [
  { id: "mdn-js", title: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", topics: ["javascript", "web", "programming"] },
  { id: "javascript-info", title: "The Modern JavaScript Tutorial", url: "https://javascript.info/", topics: ["javascript", "web", "programming"] },
  { id: "codewithharry-js", title: "CodeWithHarry JavaScript Tutorials in Hindi playlist", url: "https://www.youtube.com/playlist?list=PLu0W_9lII9ahR1blWXxgSlL4y9iQBnLpR", topics: ["javascript", "web", "hindi", "programming"] },
  { id: "fcc-js", title: "freeCodeCamp JavaScript Algorithms and Data Structures", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/", topics: ["javascript", "programming"] },
  { id: "mdn-html", title: "MDN Learn web development", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development", topics: ["html", "css", "javascript", "web"] },
  { id: "fcc-web", title: "freeCodeCamp Responsive Web Design", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", topics: ["html", "css", "web"] },
  { id: "react-learn", title: "React official Learn tutorial", url: "https://react.dev/learn", topics: ["react", "javascript", "web"] },
  { id: "node-learn", title: "Node.js Learn", url: "https://nodejs.org/en/learn", topics: ["node", "javascript", "backend", "web"] },
  { id: "python-tutorial", title: "Python official tutorial", url: "https://docs.python.org/3/tutorial/", topics: ["python", "programming"] },
  { id: "cs50x", title: "Harvard CS50x", url: "https://cs50.harvard.edu/x/", topics: ["computer science", "programming", "beginner"] },
  { id: "git-book", title: "Pro Git book", url: "https://git-scm.com/book/en/v2", topics: ["git", "github", "developer tools"] },
  { id: "sqlbolt", title: "SQLBolt interactive SQL lessons", url: "https://sqlbolt.com/", topics: ["sql", "database"] },
  { id: "google-ml", title: "Google Machine Learning Crash Course", url: "https://developers.google.com/machine-learning/crash-course", topics: ["machine learning", "ai", "python"] },
  { id: "kaggle-ml", title: "Kaggle Intro to Machine Learning", url: "https://www.kaggle.com/learn/intro-to-machine-learning", topics: ["machine learning", "ai", "python"] },
  { id: "pytorch", title: "PyTorch Learn the Basics", url: "https://pytorch.org/tutorials/beginner/basics/intro.html", topics: ["machine learning", "ai", "python", "deep learning"] },
  { id: "leetcode-plan", title: "LeetCode Top Interview 150 study plan", url: "https://leetcode.com/studyplan/top-interview-150/", topics: ["algorithms", "data structures", "leetcode"] }
];

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders }
  });
}

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.start > 60000) {
    rateBuckets.set(ip, { start: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 8;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== APP_ORIGIN) return new Response("Forbidden", { status: 403 });
    const corsHeaders = cors(origin);
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    const route = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
    if (request.method !== "POST" || !["/roadmap", "/chat"].includes(route)) {
      return json({ error: "Use POST /roadmap from DevTrack AI." }, 405, corsHeaders);
    }
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (isRateLimited(ip)) return json({ error: "Free connection limit reached. Try again in a minute." }, 429, corsHeaders);
    if (!env.GEMINI_API_KEY) return json({ error: "The free AI key has not been added to this Worker yet." }, 503, corsHeaders);
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 40000) return json({ error: "Request is too large." }, 413, corsHeaders);

    let input;
    try {
      const rawBody = await request.text();
      if (new TextEncoder().encode(rawBody).length > 40000) return json({ error: "Request is too large." }, 413, corsHeaders);
      input = JSON.parse(rawBody);
    } catch { return json({ error: "Request body must be valid JSON." }, 400, corsHeaders); }

    if (route === "/chat") {
      const messages = (Array.isArray(input.messages) ? input.messages : [])
        .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
        .slice(-14)
        .map(m => ({ role: m.role, content: m.content.trim().slice(0, 2000) }))
        .filter(m => m.content);
      while (messages.length && messages[0].role !== "user") messages.shift();
      if (!messages.length || messages[messages.length - 1].role !== "user") {
        return json({ error: "Send a message to start the conversation." }, 400, corsHeaders);
      }
      if (messages.reduce((sum, m) => sum + m.content.length, 0) > 12000) {
        return json({ error: "This conversation is too long. Start a new chat and try again." }, 413, corsHeaders);
      }

      const catalogue = RESOURCES.map(r => ({ id: r.id, title: r.title, url: r.url, topics: r.topics }));
      const system = [
        "You are DevTrack AI, a patient, practical study coach. Chat naturally and answer follow-up questions using the conversation.",
        "Explain concepts clearly at the learner's level. Help with course planning, study sessions, debugging concepts, practice questions, and learning roadmaps.",
        "When asked for a roadmap, give an ordered, realistic plan that fits the learner's available time if supplied. Do not claim that a plan is saved or tasks are checked off.",
        "Use only free learning resources from the supplied catalogue. Select resource IDs that are genuinely useful; never invent or output URLs. A resource link is provided separately by the app.",
        "For requests outside learning, briefly explain your focus and offer a related way to help. Keep answers friendly and easy to scan.",
        "Return JSON with exactly: answer (string), resourceIds (array of catalogue IDs, at most 4), and roadmap (object or null).",
        "For a direct request to make a course plan or roadmap, set roadmap to {title,steps}. Include 4 to 10 ordered steps, each with title, summary, week, estimatedHours, and resourceIds (1 to 3 IDs). For ordinary questions set roadmap to null.",
        "The answer should be useful and conversational; when you create a roadmap, briefly explain that the checkable plan is also saved below the chat.",
        "Resource catalogue: " + JSON.stringify(catalogue)
      ].join("\n");

      try {
        const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
            generationConfig: { responseMimeType: "application/json", temperature: 0.45, maxOutputTokens: 1800 }
          })
        });
        const result = await upstream.json();
        if (!upstream.ok) {
          return json({ error: upstream.status === 429 ? "The free AI quota is temporarily busy. Try again in a minute." : "The AI service could not answer this message." }, upstream.status === 429 ? 429 : 502, corsHeaders);
        }
        const text = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";
        const generated = JSON.parse(text);
        const byId = new Map(RESOURCES.map(resource => [resource.id, resource]));
        const answer = String(generated.answer || "").trim().slice(0, 6000);
        const resources = (Array.isArray(generated.resourceIds) ? generated.resourceIds : []).slice(0, 4)
          .map(id => byId.get(String(id))).filter(Boolean)
          .map(r => ({ title: r.title, url: r.url }));
        let roadmap = null;
        if (generated.roadmap && Array.isArray(generated.roadmap.steps) && generated.roadmap.steps.length >= 4) {
          roadmap = {
            title: String(generated.roadmap.title || "Learning roadmap").slice(0, 120),
            steps: generated.roadmap.steps.slice(0, 10).map(step => ({
              title: String(step.title || "Learning step").slice(0, 140),
              summary: String(step.summary || "").slice(0, 500),
              week: String(step.week || "").slice(0, 40),
              estimatedHours: Math.max(0, Math.min(80, Number(step.estimatedHours) || 0)),
              resources: (Array.isArray(step.resourceIds) ? step.resourceIds : []).slice(0, 3)
                .map(id => byId.get(String(id))).filter(Boolean)
                .map(r => ({ title: r.title, url: r.url }))
            }))
          };
        }
        if (!answer) return json({ error: "The AI returned an empty answer. Try asking another way." }, 502, corsHeaders);
        return json({ answer, resources, roadmap }, 200, corsHeaders);
      } catch {
        return json({ error: "The AI service is unavailable or returned an invalid reply. Try again later." }, 502, corsHeaders);
      }
    }

    const goal = String(input.goal || "").trim().slice(0, 160);
    const level = String(input.level || "Beginner").slice(0, 40);
    const language = String(input.language || "Hindi or English").trim().slice(0, 50);
    const hours = Math.max(1, Math.min(40, Number(input.hoursPerWeek) || 5));
    if (!goal) return json({ error: "Enter a learning goal." }, 400, corsHeaders);

    const catalogue = RESOURCES.map(r => ({ id: r.id, title: r.title, url: r.url, topics: r.topics }));
    const prompt = [
      "Create a practical beginner-friendly learning roadmap using only the supplied resource catalogue.",
      "Return JSON with title and steps. Each step has title, summary, week, estimatedHours, and resourceIds.",
      "Create 6 to 10 ordered steps. Each step should be small enough to complete and include 1 to 3 matching resource IDs.",
      "Choose the best resources for the goal and the learner's preferred language. For Hindi JavaScript, use the CodeWithHarry playlist when relevant.",
      "Never invent or return URLs. Select resource IDs exactly from the catalogue. Do not require a paid course.",
      "Learner goal: " + goal,
      "Current level: " + level,
      "Available hours each week: " + hours,
      "Preferred teaching language: " + language,
      "Resource catalogue: " + JSON.stringify(catalogue)
    ].join("\n");

    try {
      const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 3500 }
        })
      });
      const result = await upstream.json();
      if (!upstream.ok) {
        const status = upstream.status === 429 ? 429 : 502;
        return json({ error: upstream.status === 429 ? "The free AI quota is temporarily busy. Try later." : "The free AI service could not create a roadmap." }, status, corsHeaders);
      }
      const text = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";
      const generated = JSON.parse(text);
      const byId = new Map(RESOURCES.map(resource => [resource.id, resource]));
      const steps = (Array.isArray(generated.steps) ? generated.steps : []).slice(0, 10).map(step => ({
        title: String(step.title || "Learning step").slice(0, 140),
        summary: String(step.summary || "").slice(0, 500),
        week: String(step.week || "").slice(0, 40),
        estimatedHours: Math.max(0, Math.min(80, Number(step.estimatedHours) || 0)),
        resources: (Array.isArray(step.resourceIds) ? step.resourceIds : []).slice(0, 3).map(id => byId.get(String(id))).filter(Boolean).map(r => ({ title: r.title, url: r.url, kind: r.url.includes("youtube.com") ? "playlist" : "lesson" }))
      }));
      if (steps.length < 4) return json({ error: "The AI response was incomplete. Try generating the roadmap again." }, 502, corsHeaders);
      return json({ title: String(generated.title || goal).slice(0, 120), steps }, 200, corsHeaders);
    } catch {
      return json({ error: "The free AI service is unavailable or returned an invalid response. Try again later." }, 502, corsHeaders);
    }
  }
};
