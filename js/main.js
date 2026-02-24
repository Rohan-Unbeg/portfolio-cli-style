// ── State ───────────────────────────────────────────────────────────────────
const body = document.getElementById("terminal-body");
const input = document.getElementById("cmd-input");
const suggestionEl = document.getElementById("cmd-suggestion");
const promptCwdEl = document.getElementById("prompt-cwd");
let cmdHistory = [];
let histIdx = -1;
let currentView = null;
let previousView = null;
let bootDone = false;
let cwd = "~";

// ── TMDB Config ─────────────────────────────────────────────────────────────
const _cfg = window.PORTFOLIO_CONFIG || {};
const TMDB_KEY = _cfg.TMDB_KEY || "";
const TMDB_TOKEN = _cfg.TMDB_TOKEN || "";
const TMDB_IMG = "https://image.tmdb.org/t/p/w300";
const TMDB_IMG_BIG = "https://image.tmdb.org/t/p/w500";
const tmdbCache = {}; // title -> tmdb result

// Restore last view and theme
try {
    const saved = localStorage.getItem("pf_view");
    if (saved) previousView = saved;
    const savedTheme = localStorage.getItem("pf_theme");
    if (savedTheme)
        document.documentElement.setAttribute("data-theme", savedTheme);
} catch (e) {}

// ── Helpers ─────────────────────────────────────────────────────────────────
function line(html, cls = "") {
    const d = document.createElement("div");
    d.className = "line " + cls;
    d.innerHTML = html;
    body.appendChild(d);
    return d;
}

function blank() {
    line("&nbsp;");
}

function scrollBot() {
    body.scrollTop = body.scrollHeight;
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function toast(msg = "✓ Copied!") {
    const t = document.getElementById("copy-toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
}

function copyEmail() {
    navigator.clipboard
        .writeText("rohanunbeg0918@gmail.com")
        .then(() => toast("✓ Email copied!"))
        .catch(() => toast("rohanunbeg0918@gmail.com"));
}

function copyText(txt) {
    navigator.clipboard
        .writeText(txt)
        .then(() => toast("✓ Copied!"))
        .catch(() => {});
}

// ── Clock ────────────────────────────────────────────────────────────────────
function updateClock() {
    const el = document.getElementById("status-time");
    if (el)
        el.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
}
setInterval(updateClock, 1000);
updateClock();

// ── Render engine ────────────────────────────────────────────────────────────
function render(viewName) {
    // Clear body
    body.innerHTML = "";

    // Update tab active state
    document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.view === viewName);
    });

    // Update header buttons active state
    document
        .getElementById("btn-help")
        .classList.toggle("active", viewName === "help");
    document.getElementById("btn-hire").classList.remove("active");

    // Persist view
    previousView = currentView;
    currentView = viewName;
    try {
        localStorage.setItem("pf_view", viewName);
    } catch (e) {}

    // Dispatch to view function
    const views = {
        menu,
        about,
        skills,
        experience,
        projects,
        stats,
        contact,
        watchlist,
        help,
    };
    const fn = views[viewName];
    if (fn) fn();
    scrollBot();
}

// ── Tab click navigation ────────────────────────────────────────────────────
function tabNav(viewName) {
    if (!bootDone) return;
    if (viewName === "hire") {
        body.innerHTML = "";
        promptLine("hire");
        blank();
        hireCmd();
    } else {
        runCmd(viewName);
    }
    input.focus();
}

// ── Prompt line for typed commands ──────────────────────────────────────────
function promptLine(cmd) {
    promptCwdEl.textContent = cwd;
    line(
        `<span class="prompt-user">rohan</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">${cwd}</span><span class="prompt-sym">$ </span><span class="c-white">${escHtml(cmd)}</span>`,
    );
}

function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Hire command ─────────────────────────────────────────────────────────────
function hireCmd() {
    body.innerHTML = "";
    // Active state
    document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
    document.getElementById("btn-help").classList.remove("active");
    document.getElementById("btn-hire").classList.add("active");
    blank();
    line(`  <span class="c-orange bold">Hire Rohan</span>`);
    blank();
    line(
        `  <span class="c-dim">Email:</span>    <span class="c-blue">rohanunbeg0918@gmail.com</span> <button onclick="copyEmail()" class="btn-sm" style="margin-left:6px;font-size:10px">copy</button>`,
    );
    line(
        `  <span class="c-dim">LinkedIn:</span> <a href="https://www.linkedin.com/in/rohanunbeg/" target="_blank" rel="noopener" class="c-blue">linkedin.com/in/rohanunbeg/</a>`,
    );
    line(
        `  <span class="c-dim">GitHub:</span>   <a href="https://github.com/rohan-unbeg" target="_blank" rel="noopener" class="c-blue">github.com/rohan-unbeg</a>`,
    );
    blank();
    line(
        `  <span class="c-green">● Open to internships, collaborations, and freelance work.</span>`,
    );
    blank();
    line(
        `  <span class="c-dim">Type <span class="c-orange">back</span> to return.</span>`,
    );
    previousView = currentView;
    currentView = "__hire__";
    scrollBot();
}

// ── View: MENU ───────────────────────────────────────────────────────────────
function menu() {
    blank();
    line(`  <span class="c-orange bold">Welcome to Rohan's portfolio.</span>`);
    line(
        `  <span class="c-dim">Select a section or type a command below.</span>`,
    );
    blank();

    const opts = [
        ["1", "about", "Who I am · timeline · achievements"],
        ["2", "skills", "Tech stack & proficiency tiers"],
        ["3", "experience", "Open source contributions & awards"],
        ["4", "projects", "Personal & open source projects"],
        ["5", "stats", "GitHub activity & metrics"],
        ["6", "contact", "Get in touch + resume"],
        ["7", "watchlist", "My movie/anime/TV recommendations"],
    ];

    opts.forEach(([num, cmd, desc]) => {
        const row = document.createElement("div");
        row.className = "menu-opt";
        row.innerHTML = `<span class="menu-num">[${num}]</span> <span class="menu-label" onclick="tabNav('${cmd}')" style="cursor:pointer">${cmd}</span>  <span class="c-dim">— ${desc}</span>`;
        body.appendChild(row);
    });

    blank();
    line(
        `  <span class="c-dim">Other commands: <span class="c-orange">help</span>  <span class="c-orange">clear</span>  <span class="c-orange">back</span>  <span class="c-orange">hire</span></span>`,
    );
    blank();
}

// ── View: ABOUT ──────────────────────────────────────────────────────────────
function about() {
    blank();

    // ASCII banner — desktop only
    if (window.innerWidth >= 640) {
        const art = document.createElement("pre");
        art.className = "banner fade-in";
        art.style.marginLeft = "8px";
        art.textContent = [
            " ██████╗  ██████╗ ██╗  ██╗ █████╗ ███╗   ██╗",
            " ██╔══██╗██╔═══██╗██║  ██║██╔══██╗████╗  ██║",
            " ██████╔╝██║   ██║███████║███████║██╔██╗ ██║",
            " ██╔══██╗██║   ██║██╔══██║██╔══██║██║╚████║",
            " ██║  ██║╚██████╔╝██║  ██║██║  ██║██║ ╚███║",
            " ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚══╝",
        ].join("\n");
        body.appendChild(art);
        blank();
    }

    // Header
    line(`  <span class="section-header">Rohan Unbeg</span>`);
    line(
        `  <span class="c-orange" style="font-size:13px">Backend Developer · Open Source Contributor @ Oppia Foundation</span>`,
    );
    blank();

    // Bio
    line(
        `  <span class="c-dim">── Who I Am ──────────────────────────────</span>`,
    );
    blank();
    line(
        `  <span class="c-text" style="line-height:1.8">CS undergraduate passionate about resilient infrastructure,</span>`,
    );
    line(
        `  <span class="c-text" style="line-height:1.8">fixing technical debt, and scaling tools for global learners.</span>`,
    );
    line(
        `  <span class="c-text" style="line-height:1.8">I build things that don't break at 3 AM.</span>`,
    );
    blank();

    // Details
    line(
        `  <span class="c-dim">── Details ───────────────────────────────</span>`,
    );
    blank();
    const details = [
        [
            "Education",
            "B.Tech CS · <span class='c-blue'>Vishwakarma University</span> · 2023–2027",
        ],
        [
            "Current",
            "Open Source Contributor · <span class='c-green'>Oppia Foundation</span>",
        ],
        ["Focus", "Backend infra · Data integrity · CI/CD pipelines"],
        ["Learning", "System Design · Apache Beam · GCP · Distributed Systems"],
        ["Location", "Pune, India"],
        [
            "Status",
            "<span class='c-green'>● Open to internships & collaborations</span>",
        ],
    ];
    details.forEach(([label, val]) => {
        line(
            `  <span class="c-yellow" style="display:inline-block;width:110px">${label}</span> ${val}`,
        );
    });
    blank();

    // Achievements
    line(
        `  <span class="c-dim">── Achievements ──────────────────────────</span>`,
    );
    blank();
    line(
        `  <span class="c-green">🏆</span> <span class="c-white bold">SugarSync — Hackathon Winner</span>`,
    );
    line(
        `  <span class="c-dim" style="margin-left:24px">Built a gamified health tracking app. Won at competitive hackathon.</span>`,
    );
    blank();
    line(
        `  <span class="c-green">🏛</span> <span class="c-white bold">Oppia Foundation — Merged PRs to production</span>`,
    );
    line(
        `  <span class="c-dim" style="margin-left:24px">Backend contributions impacting millions of learners globally.</span>`,
    );
    blank();
    line(
        `  <span class="c-green">🤖</span> <span class="c-white bold">AI Maintainer — Featured Project</span>`,
    );
    line(
        `  <span class="c-dim" style="margin-left:24px">Autonomous codebase upkeep tool powered by Gemini & Groq.</span>`,
    );
    blank();

    // Resume download
    line(
        `  <span class="c-dim">── Resume ────────────────────────────────</span>`,
    );
    blank();
    line(
        `  <span class="c-dim">▸</span> <a href="resume.pdf" target="_blank" class="c-blue" style="cursor:pointer">📄 View Resume (PDF)</a>  <button onclick="window.open('resume.pdf','_blank')" class="btn-sm" style="font-size:10px;margin-left:6px">open</button>`,
    );
    blank();
    line(
        `  <span class="c-dim">Run <span class="c-orange" onclick="tabNav('experience')" style="cursor:pointer">experience</span> to see my work, or <span class="c-orange" onclick="tabNav('contact')" style="cursor:pointer">contact</span> to reach out.</span>`,
    );
    blank();
}

// ── View: SKILLS ─────────────────────────────────────────────────────────────
function skills() {
    blank();
    line(`  <span class="section-header">Tech Stack</span>`);
    line(
        `  <span class="c-dim" style="font-size:11px">Proficiency: ████ Daily driver · ███░ Proficient · ██░░ Familiar · █░░░ Learning</span>`,
    );
    blank();

    line(
        `  <span class="c-dim">── Languages ──────────────────────────────</span>`,
    );
    renderSkillTier([
        [
            "Python",
            "████",
            "#4ac94a",
            "Daily driver — backend, scripting, data pipelines",
        ],
        [
            "TypeScript",
            "████",
            "#729fcf",
            "Daily driver — Angular, Node.js, full-stack",
        ],
        [
            "JavaScript",
            "███░",
            "#e9b96e",
            "Proficient — DOM, vanilla JS, this portfolio",
        ],
    ]);
    blank();

    line(
        `  <span class="c-dim">── Backend & Infrastructure ────────────────</span>`,
    );
    renderSkillTier([
        ["Node.js", "███░", "#6da55f", "REST APIs, Express, server-side logic"],
        ["GCP", "██░░", "#4285f4", "App Engine, Cloud Functions, Datastore"],
        [
            "Apache Beam",
            "██░░",
            "#e67e22",
            "Batch pipelines, data processing jobs",
        ],
        ["Docker", "██░░", "#0db7ed", "Containerization, dev environments"],
        [
            "CI/CD",
            "███░",
            "#4ac94a",
            "GitHub Actions, CircleCI, automated testing",
        ],
    ]);
    blank();

    line(
        `  <span class="c-dim">── Frontend ───────────────────────────────</span>`,
    );
    renderSkillTier([
        [
            "Angular",
            "███░",
            "#dd0031",
            "Oppia's frontend stack, components, RxJS",
        ],
        [
            "React",
            "██░░",
            "#61dafb",
            "Personal projects, hooks, state management",
        ],
        [
            "Tailwind CSS",
            "███░",
            "#38bdf8",
            "Utility-first styling, responsive design",
        ],
    ]);
    blank();

    line(
        `  <span class="c-dim">── Databases ──────────────────────────────</span>`,
    );
    renderSkillTier([
        ["PostgreSQL", "██░░", "#336791", "Relational queries, schema design"],
        [
            "MongoDB",
            "██░░",
            "#4ea94b",
            "Document stores, aggregation pipelines",
        ],
    ]);
    blank();

    line(`  <span class="c-dim">── Also worked with</span>`);
    const div = document.createElement("div");
    div.innerHTML = `<div class="badges">
    <span class="badge badge-yellow">AWS</span>
    <span class="badge badge-green">Git</span>
    <span class="badge badge-blue">Next.js</span>
    <span class="badge badge-purple">Redis</span>
    <span class="badge badge-cyan">Linux</span>
    <span class="badge badge-orange">Nginx</span>
    <span class="badge badge-green">Jest</span>
    <span class="badge badge-blue">Webpack</span>
  </div>`;
    body.appendChild(div);
    blank();
}

function renderSkillTier(items) {
    items.forEach(([name, tier, color, desc]) => {
        const row = document.createElement("div");
        row.className = "skill-tier-row";
        row.innerHTML = `
      <span class="skill-tier-name">${name}</span>
      <span class="skill-tier-bar" style="color:${color}">${tier}</span>
      <span class="skill-tier-desc">${desc}</span>`;
        body.appendChild(row);
    });
}

function renderBars(items) {
    items.forEach(([name, pct, color]) => {
        const row = document.createElement("div");
        row.className = "skill-row";
        row.innerHTML = `
      <span class="skill-name">${name}</span>
      <div class="skill-bar"><div class="skill-fill" style="width:0%;background:${color}"></div></div>
      <span class="skill-pct">${pct}%</span>`;
        body.appendChild(row);
        requestAnimationFrame(() => {
            setTimeout(() => {
                const fill = row.querySelector(".skill-fill");
                if (fill) fill.style.width = pct + "%";
            }, 60);
        });
    });
}

// ── View: EXPERIENCE ─────────────────────────────────────────────────────────
function experience() {
    blank();
    line(`  <span class="section-header">Experience</span>`);
    line(
        `  <span class="c-dim">$ git log --author="Rohan Unbeg" --oneline</span>`,
    );
    blank();
    line(
        `  <span class="c-green bold">Oppia Foundation</span>  <span class="c-dim">— Open Source Contributor · 2024–present</span>`,
    );
    line(
        `  <span class="c-dim">  <a href="https://github.com/oppia/oppia" target="_blank" rel="noopener" class="c-blue">github.com/oppia/oppia</a></span>`,
    );
    blank();

    const commits = [
        {
            hash: "a8f2c91",
            label: "feat(backend)",
            title: "Translation Count Validation",
            pr: "#24589",
            url: "https://github.com/oppia/oppia/pull/24589",
            desc: "Validation mechanism to keep translation counts in sync across data models. Prevented silent data corruption in multi-language lessons used by millions of students.",
            tags: ["+backend", "+data-integrity", "+python"],
            tag_colors: ["badge-green", "badge-blue", "badge-green"],
        },
        {
            hash: "7d4b1e5",
            label: "refactor(core)",
            title: "Translation Versioning System",
            pr: "#24401",
            url: "https://github.com/oppia/oppia/pull/24401",
            desc: "Refactored storage layer to support robust versioning of translations — enabling seamless rollbacks and full change history for community contributors.",
            tags: ["+refactor", "+storage", "+versioning"],
            tag_colors: ["badge-yellow", "badge-purple", "badge-cyan"],
        },
    ];

    commits.forEach((c) => {
        const entry = document.createElement("div");
        entry.className = "commit-entry fade-in";
        const tagHTML = c.tags
            .map((t, i) => `<span class="badge ${c.tag_colors[i]}">${t}</span>`)
            .join("");
        entry.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="c-yellow" style="font-size:12px">commit ${c.hash}</span>
        <span class="c-cyan" style="font-size:11px">${c.label}</span>
        <a href="${c.url}" target="_blank" rel="noopener" class="c-blue" style="font-size:11px">PR ${c.pr} ↗</a>
      </div>
      <div class="c-white bold" style="margin:4px 0 3px">${c.title}</div>
      <div class="c-dim" style="font-size:12px;line-height:1.7">${c.desc}</div>
      <div class="badges" style="margin-left:0;margin-top:6px">${tagHTML}</div>`;
        body.appendChild(entry);
    });

    blank();
    line(
        `  <span class="c-dim">2 PRs shown · <a href="https://github.com/oppia/oppia/commits?author=rohan-unbeg" target="_blank" class="c-blue">view all on GitHub ↗</a></span>`,
    );
    blank();

    // Achievements section
    line(
        `  <span class="c-dim">── Achievements & Awards ──────────────────</span>`,
    );
    blank();

    const achievements = [
        {
            icon: "🏆",
            title: "Hackathon Winner — SugarSync",
            desc: "Built a gamified health tracking app. Real-time glucose data integration with gamification layer.",
            color: "c-yellow",
        },
        {
            icon: "🏛",
            title: "Open Source — Oppia Foundation",
            desc: "Multiple PRs merged to production codebase used by millions of students worldwide.",
            color: "c-green",
        },
        {
            icon: "🤖",
            title: "Featured — Autonomous AI Maintainer",
            desc: "Dual-engine automated codebase upkeep tool. Scans repos, generates fixes, opens PRs autonomously.",
            color: "c-purple",
        },
    ];

    achievements.forEach((a) => {
        line(`  ${a.icon} <span class="${a.color} bold">${a.title}</span>`);
        line(
            `     <span class="c-dim" style="font-size:12px;line-height:1.7">${a.desc}</span>`,
        );
        blank();
    });
}

// ── View: PROJECTS ───────────────────────────────────────────────────────────
async function projects() {
    blank();
    line(
        `  <span class="c-purple bold">$ fetching latest projects from GitHub...</span>`,
    );
    blank();

    // Show pinned/featured projects first
    const featured = [
        {
            name: "oppia/oppia",
            badge: "🏛 Open Source Contributor",
            url: "https://github.com/oppia/oppia",
            desc: "Educational platform used by millions. Contributed backend validation systems, translation versioning, and data integrity checks.",
            tags: ["Python", "Oppia Foundation", "Merged PRs"],
            tag_colors: ["badge-green", "badge-purple", "badge-cyan"],
        },
    ];
    featured.forEach((p) => {
        const entry = document.createElement("div");
        entry.className = "project-entry fade-in";
        const tagHTML = p.tags
            .map((t, i) => `<span class="badge ${p.tag_colors[i]}">${t}</span>`)
            .join("");
        entry.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
        <a href="${p.url}" target="_blank" rel="noopener" class="c-blue bold">${p.name} ↗</a>
        <span class="c-green" style="font-size:11px">${p.badge}</span>
      </div>
      <div class="c-text" style="font-size:12px;line-height:1.7">${p.desc}</div>
      <div class="badges" style="margin-left:0;margin-top:6px">${tagHTML}</div>`;
        body.appendChild(entry);
    });
    blank();

    try {
        const res = await fetch(
            "https://api.github.com/users/rohan-unbeg/repos?sort=updated&per_page=6",
        );
        if (!res.ok) throw new Error("Network response was not ok");
        const repos = await res.json();

        line(
            `  <span class="c-dim">── Personal Projects ──────────────────────</span>`,
        );
        blank();

        repos.forEach((p) => {
            if (p.fork) return;
            const entry = document.createElement("div");
            entry.className = "project-entry fade-in";
            const langBadge = p.language
                ? `<span class="badge badge-blue">${p.language}</span>`
                : "";
            entry.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
        <a href="${p.html_url}" target="_blank" rel="noopener" class="c-blue bold">${p.name} ↗</a>
        <span class="c-dim" style="font-size:11px">⭐ ${p.stargazers_count}</span>
      </div>
      <div class="c-text" style="font-size:12px;line-height:1.7">${p.description || "No description provided."}</div>
      <div class="badges" style="margin-left:0;margin-top:6px">${langBadge}</div>`;
            body.appendChild(entry);
        });
    } catch (e) {
        line(
            `  <span class="c-red">Failed to fetch from GitHub. Showing fallback data.</span>`,
        );
        const projs = [
            {
                name: "autonomous-ai-maintainer",
                lang: "Python",
                badge: "⭐ featured",
                url: "https://github.com/rohan-unbeg/autonomous-ai-maintainer",
                desc: "Dual-engine automated codebase upkeep tool powered by Gemini & Groq. Scans repos for stale issues, generates fixes, and opens PRs autonomously.",
                tags: ["AI/ML", "Python", "Automation"],
                tag_colors: ["badge-purple", "badge-green", "badge-yellow"],
            },
            {
                name: "sugarsync-mcode",
                lang: "TypeScript",
                badge: "🏆 hackathon winner",
                url: "https://github.com/rohan-unbeg/sugarsync-mcode",
                desc: "Gamified health tracking sync app. Real-time glucose data integration with gamification layer to improve patient engagement.",
                tags: ["TypeScript", "Health Tech", "Gamification"],
                tag_colors: ["badge-blue", "badge-red", "badge-orange"],
            },
        ];

        projs.forEach((p) => {
            const entry = document.createElement("div");
            entry.className = "project-entry fade-in";
            const tagHTML = p.tags
                .map(
                    (t, i) =>
                        `<span class="badge ${p.tag_colors[i]}">${t}</span>`,
                )
                .join("");
            entry.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
        <a href="${p.url}" target="_blank" rel="noopener" class="c-blue bold">${p.name} ↗</a>
        <span class="c-dim" style="font-size:11px">${p.badge}</span>
      </div>
      <div class="c-dim" style="font-size:11px;margin-bottom:4px">lang: ${p.lang}</div>
      <div class="c-text" style="font-size:12px;line-height:1.7">${p.desc}</div>
      <div class="badges" style="margin-left:0;margin-top:6px">${tagHTML}</div>`;
            body.appendChild(entry);
        });
    }

    blank();
    line(
        `  <span class="c-dim"><a href="https://github.com/rohan-unbeg?tab=repositories" target="_blank" rel="noopener" class="c-blue">→ All repos on GitHub ↗</a></span>`,
    );
    blank();
}

// ── View: STATS ──────────────────────────────────────────────────────────────
function stats() {
    blank();
    line(`  <span class="section-header">GitHub Stats</span>`);
    line(`  <span class="c-dim">$ gh api /users/rohan-unbeg --stats</span>`);
    blank();

    line(
        `  <span class="c-dim">── Overview ──────────────────────────────</span>`,
    );
    blank();

    const statsData = [
        ["Primary Language", "Python", "c-green"],
        ["Secondary", "TypeScript", "c-blue"],
        ["Org Contributions", "Oppia Foundation (oppia/oppia)", "c-yellow"],
        ["Notable PRs", "#24589 · #24401 (merged)", "c-purple"],
        ["Focus Areas", "Backend · Data Integrity · Automation", "c-cyan"],
        ["Open Source Since", "2024", "c-orange"],
    ];

    statsData.forEach(([label, val, cls]) => {
        line(
            `  <span class="c-dim" style="display:inline-block;width:170px">${label}</span> <span class="${cls}">${val}</span>`,
        );
    });

    blank();
    line(
        `  <span class="c-dim">── Language Breakdown ─────────────────────</span>`,
    );
    blank();

    // Visual language breakdown bars
    const langs = [
        ["Python", 40, "#4ac94a"],
        ["TypeScript", 25, "#729fcf"],
        ["JavaScript", 15, "#e9b96e"],
        ["HTML/CSS", 12, "#ad7fa8"],
        ["Other", 8, "#6a5572"],
    ];
    const langBar = document.createElement("div");
    langBar.style.cssText =
        "display:flex;height:8px;border-radius:4px;overflow:hidden;margin:0 14px 8px;";
    langs.forEach(([, pct, color]) => {
        const seg = document.createElement("div");
        seg.style.cssText = `width:${pct}%;background:${color};transition:width 0.5s;`;
        langBar.appendChild(seg);
    });
    body.appendChild(langBar);

    const langLabels = document.createElement("div");
    langLabels.style.cssText =
        "display:flex;flex-wrap:wrap;gap:12px;padding-left:14px;margin-bottom:4px;";
    langs.forEach(([name, pct, color]) => {
        langLabels.innerHTML += `<span style="font-size:11px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px"></span>${name} <span class="c-dim">${pct}%</span></span>`;
    });
    body.appendChild(langLabels);

    blank();
    line(
        `  <span class="c-dim">── Contribution Graph ─────────────────────</span>`,
    );
    blank();

    const graphWrap = document.createElement("div");
    graphWrap.style.cssText = "padding-left:14px;";
    graphWrap.innerHTML = `<img src="https://ghchart.rshah.org/e95420/rohan-unbeg" alt="GitHub Contribution Graph" loading="lazy" style="max-width:100%;border-radius:4px;border:1px solid #3a1a40;display:block" />`;
    body.appendChild(graphWrap);

    blank();
    line(
        `  <span class="c-dim">── Streak ─────────────────────────────────</span>`,
    );
    blank();

    const streakWrap = document.createElement("div");
    streakWrap.style.cssText = "padding-left:14px;";
    streakWrap.innerHTML = `<img src="https://streak-stats.demolab.com?user=rohan-unbeg&theme=dark&hide_border=true&background=160e1e&ring=e95420&fire=e95420&currStreakLabel=eeeeec" alt="GitHub Streak" loading="lazy" style="max-width:100%;border-radius:4px;border:1px solid #3a1a40;display:block" />`;
    body.appendChild(streakWrap);

    blank();
    line(
        `  <a href="https://github.com/rohan-unbeg" target="_blank" class="c-blue" style="margin-left:14px">→ Full profile on GitHub ↗</a>`,
    );
    blank();
}

// ── View: CONTACT ────────────────────────────────────────────────────────────
function contact() {
    blank();
    line(`  <span class="c-orange bold">$ ./connect.sh</span>`);
    blank();

    const links = [
        {
            label: "GitHub",
            val: "github.com/rohan-unbeg",
            url: "https://github.com/rohan-unbeg",
            copy: null,
        },
        {
            label: "LinkedIn",
            val: "linkedin.com/in/rohanunbeg/",
            url: "https://www.linkedin.com/in/rohanunbeg/",
            copy: null,
        },
        {
            label: "Email",
            val: "rohanunbeg0918@gmail.com",
            url: "mailto:rohanunbeg0918@gmail.com",
            copy: "rohanunbeg0918@gmail.com",
        },
        {
            label: "Twitter/X",
            val: "@rohanunbeg",
            url: "https://twitter.com/rohanunbeg",
            copy: null,
        },
    ];

    links.forEach((l) => {
        const row = document.createElement("div");
        row.className = "contact-row";
        row.innerHTML = `
      <span class="contact-lbl">${l.label}</span>
      <a href="${l.url}" target="_blank" rel="noopener" class="contact-val">${l.val}</a>
      ${l.copy ? `<button onclick="copyText('${l.copy}')" class="btn-sm" style="font-size:10px;flex-shrink:0">copy</button>` : ""}`;
        body.appendChild(row);
    });

    blank();
    line(
        `  <span class="c-dim">── Resume ─────────────────────────────────</span>`,
    );
    blank();
    line(
        `  <span class="c-dim">▸</span> <a href="resume.pdf" target="_blank" class="c-blue">📄 View Resume (PDF)</a>  <button onclick="window.open('resume.pdf','_blank')" class="btn-sm" style="font-size:10px;margin-left:6px">open</button>`,
    );
    blank();
    line(
        `  <span class="c-dim"># Response time: usually within 24 hours</span>`,
    );
    line(
        `  <span class="c-dim"># Open to: Internships · Collaborations · Freelance</span>`,
    );
    blank();
}

// ── View: HELP ───────────────────────────────────────────────────────────────
function help() {
    blank();
    line(`  <span class="section-header">Available Commands</span>`);
    blank();

    line(
        `  <span class="c-dim">── Portfolio ──────────────────────────────</span>`,
    );
    blank();
    const cmds = [
        ["menu", "c-orange", "Numbered navigation menu"],
        ["about", "c-green", "Who I am, timeline, achievements"],
        ["skills", "c-blue", "Tech stack & proficiency tiers"],
        ["experience", "c-yellow", "Open source contributions & awards"],
        ["projects", "c-purple", "Personal & open source projects"],
        ["stats", "c-cyan", "GitHub activity & metrics"],
        ["contact", "c-orange", "Get in touch + resume"],
        ["watchlist", "c-purple", "My movie/anime/TV recommendations"],
        ["hire", "c-orange", "Quick contact card"],
        ["theme", "c-purple", "Change theme (ubuntu, dracula, matrix)"],
        ["ls / cd / pwd", "c-blue", "Navigate virtual file system"],
        ["cat", "c-blue", "Read a file"],
        ["neofetch", "c-cyan", "System info (try it!)"],
        ["snake", "c-green", "Play Snake game"],
        ["matrix", "c-green", "Matrix rain animation"],
        ["tour", "c-orange", "Replay the guided OS tour"],
        ["drawer", "c-orange", "Open app drawer (all apps)"],
        ["back", "c-dim", "Return to previous view"],
        ["clear", "c-dim", "Clear terminal"],
    ];

    cmds.forEach(([cmd, cls, desc]) => {
        line(
            `  <span class="${cls} bold" style="display:inline-block;width:130px;cursor:pointer" onclick="runCmd('${cmd.split(" ")[0]}')">${cmd}</span>  <span class="c-dim">${desc}</span>`,
        );
    });

    blank();
    line(
        `  <span class="c-dim">Tip: ↑↓ history · Double-Tab autocomplete · 1-6 for quick nav</span>`,
    );
    blank();
}

// ── Command runner ───────────────────────────────────────────────────────────
const VIEWS = [
    "menu",
    "about",
    "skills",
    "experience",
    "projects",
    "stats",
    "contact",
    "watchlist",
    "help",
];
const NUM_MAP = {
    1: "about",
    2: "skills",
    3: "experience",
    4: "projects",
    5: "stats",
    6: "contact",
    7: "watchlist",
};

const COMPLETIONS = [
    ...VIEWS,
    "hire",
    "back",
    "clear",
    "theme",
    "ls",
    "cd",
    "pwd",
    "cat",
    "sudo",
    "echo",
    "date",
    "whoami",
    "history",
    "matrix",
    "snake",
    "neofetch",
    "tour",
    "exit",
];
const THEMES = ["ubuntu", "dracula", "matrix"];
const FILES = ["about.txt", "skills.txt", "experience.txt", "contact.txt"];
const DIRS = ["projects", "stats"];

// ── ZSH-like Autosuggestion ──────────────────────────────────────────────────
function getSuggestion(val) {
    if (!val) return "";
    const parts = val.toLowerCase().split(" ");
    const cmd = parts[0];

    if (parts.length === 1) {
        const match = COMPLETIONS.find((c) => c.startsWith(cmd));
        return match ? val + match.slice(cmd.length) : "";
    }

    if (parts.length === 2) {
        const arg = parts[1];
        if (cmd === "theme") {
            const match = THEMES.find((t) => t.startsWith(arg));
            return match ? val + match.slice(arg.length) : "";
        }
        if (cmd === "cat" && cwd === "~") {
            const match = FILES.find((f) => f.startsWith(arg));
            return match ? val + match.slice(arg.length) : "";
        }
        if (cmd === "cd" && cwd === "~") {
            const match = DIRS.find((d) => d.startsWith(arg));
            return match ? val + match.slice(arg.length) : "";
        }
    }
    return "";
}

input.addEventListener("input", () => {
    suggestionEl.textContent = getSuggestion(input.value);
});

function runCmd(raw) {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return;

    // History
    if (cmdHistory[cmdHistory.length - 1] !== raw.trim()) {
        cmdHistory.push(raw.trim());
    }
    histIdx = -1;

    // Clear first, then echo prompt
    body.innerHTML = "";
    promptLine(raw.trim());
    blank();

    // Numeric shortcut
    if (NUM_MAP[trimmed]) {
        render(NUM_MAP[trimmed]);
        return;
    }

    const args = trimmed.split(" ").filter(Boolean);
    const command = args[0];

    if (command === "sudo") {
        if (trimmed === "sudo rm -rf /" || trimmed === "sudo rm -rf /*") {
            line(
                `  <span class="c-red">Nice try. This incident will be reported.</span>`,
            );
            return;
        }
        if (args[1] === "hire") {
            hireCmd();
            return;
        }
        line(
            `  <span class="c-red">rohan is not in the sudoers file. This incident will be reported.</span>`,
        );
        return;
    }

    if (command === "theme") {
        const t = args[1];
        if (["ubuntu", "dracula", "matrix"].includes(t)) {
            document.documentElement.setAttribute("data-theme", t);
            localStorage.setItem("pf_theme", t);
            line(`  <span class="c-green">Theme set to ${t}</span>`);
        } else {
            line(
                `  <span class="c-dim">Available themes: ubuntu, dracula, matrix</span>`,
            );
            line(`  <span class="c-dim">Usage: theme &lt;name&gt;</span>`);
        }
        return;
    }

    if (command === "pwd") {
        line(
            `  <span class="c-white">/home/rohan${cwd.replace("~", "")}</span>`,
        );
        return;
    }

    if (command === "cd") {
        let dir = args[1] || "~";
        if (dir.endsWith("/") && dir.length > 1) dir = dir.slice(0, -1); // strip trailing slash

        if (dir === "~" || dir === "/") {
            cwd = "~";
        } else if (dir === "projects" && cwd === "~") {
            cwd = "~/projects";
        } else if (dir === "stats" && cwd === "~") {
            cwd = "~/stats";
        } else if (dir === "..") {
            cwd = "~";
        } else {
            line(
                `  <span class="c-red">cd: ${escHtml(dir)}: No such file or directory</span>`,
            );
        }
        promptCwdEl.textContent = cwd;
        return;
    }

    if (command === "ls") {
        if (cwd === "~") {
            line(
                `  <span class="c-blue bold">projects/</span>  <span class="c-blue bold">stats/</span>  <span class="c-white">about.txt</span>  <span class="c-white">skills.txt</span>  <span class="c-white">experience.txt</span>  <span class="c-white">contact.txt</span>`,
            );
        } else if (cwd === "~/projects") {
            line(
                `  <span class="c-white">autonomous-ai-maintainer.md</span>  <span class="c-white">sugarsync-mcode.md</span>`,
            );
        } else if (cwd === "~/stats") {
            line(`  <span class="c-white">github-stats.json</span>`);
        }
        return;
    }

    if (command === "cat") {
        const file = args[1];
        if (!file) {
            line(`  <span class="c-red">cat: missing file operand</span>`);
            return;
        }
        const map = {
            "about.txt": about,
            "skills.txt": skills,
            "experience.txt": experience,
            "contact.txt": contact,
        };
        if (cwd === "~" && map[file]) {
            map[file]();
        } else if (
            cwd === "~/projects" &&
            (file === "autonomous-ai-maintainer.md" ||
                file === "sugarsync-mcode.md")
        ) {
            line(
                `  <span class="c-dim"># Run <span class="c-orange">projects</span> to view formatted project details.</span>`,
            );
        } else if (cwd === "~/stats" && file === "github-stats.json") {
            line(
                `  <span class="c-dim"># Run <span class="c-orange">stats</span> to view formatted GitHub statistics.</span>`,
            );
        } else {
            line(
                `  <span class="c-red">cat: ${escHtml(file)}: No such file or directory</span>`,
            );
        }
        return;
    }

    if (command === "echo") {
        const text = args.slice(1).join(" ");
        line(`  <span class="c-white">${escHtml(text)}</span>`);
        return;
    }

    if (command === "date") {
        line(`  <span class="c-white">${new Date().toString()}</span>`);
        return;
    }

    if (command === "whoami") {
        line(`  <span class="c-white">rohan</span>`);
        return;
    }

    if (command === "history") {
        cmdHistory.forEach((cmd, i) => {
            line(
                `  <span class="c-dim">${(i + 1).toString().padStart(4, " ")}</span>  <span class="c-white">${escHtml(cmd)}</span>`,
            );
        });
        return;
    }

    switch (command) {
        case "menu":
        case "about":
        case "skills":
        case "experience":
        case "projects":
        case "stats":
        case "contact":
        case "watchlist":
        case "help":
            render(command);
            break;

        case "hire":
            hireCmd();
            break;

        case "back":
            if (previousView && previousView !== currentView) {
                render(previousView);
            } else {
                render("menu");
            }
            break;

        case "clear":
            doClear();
            break;

        case "neofetch":
            neofetch();
            break;

        case "secret":
        case "easteregg":
            easterEgg();
            break;

        case "matrix":
            startMatrix();
            break;
        case "tour":
            startTour();
            break;

        case "drawer":
        case "apps":
            toggleAppDrawer();
            line(`  <span class="c-dim">Opening app drawer…</span>`);
            break;

        case "snake":
            openApp("snake");
            break;

        case "exit":
            line(
                `  <span class="c-dim">Terminal closed. Click the Terminal icon in the dock to reopen.</span>`,
            );
            setTimeout(() => closeApp("terminal"), 800);
            break;

        default:
            line(
                `  <span class="c-red">command not found: <span class="c-white">${escHtml(trimmed)}</span></span>`,
            );
            line(
                `  <span class="c-dim">Type <span class="c-orange">help</span> for available commands or <span class="c-orange">menu</span> to navigate.</span>`,
            );
            blank();
    }

    scrollBot();
}

function doClear() {
    if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
        window.removeEventListener("resize", resizeMatrix);
    }
    if (snakeInterval) {
        clearInterval(snakeInterval);
        snakeInterval = null;
        document.removeEventListener("keydown", snakeKeyHandler);
    }
    body.innerHTML = "";
    line(
        `  <span class="c-dim">Terminal cleared. Type <span class="c-orange">menu</span> to navigate.</span>`,
    );
    blank();
    currentView = null;
    document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
    document.getElementById("btn-help").classList.remove("active");
    document.getElementById("btn-hire").classList.remove("active");
    promptCwdEl.textContent = cwd;
}

// ── Neofetch ─────────────────────────────────────────────────────────────────
function neofetch() {
    const logo = [
        "         .--.",
        "        /    \\",
        "       |  () |",
        "        \\    /",
        "     ____\\  /____",
        "    /            \\",
        "   /   Ubuntu OS  \\",
    ];
    const info = [
        `<span class="c-green bold">rohan</span><span class="c-dim">@</span><span class="c-orange bold">portfolio</span>`,
        `<span class="c-dim">────────────────────</span>`,
        `<span class="c-purple">OS:</span>       Ubuntu 24.04 LTS`,
        `<span class="c-purple">Shell:</span>    bash 5.2`,
        `<span class="c-purple">Host:</span>     portfolio.rohan-unbeg`,
        `<span class="c-purple">Role:</span>     <span class="c-orange">Backend Developer</span>`,
        `<span class="c-purple">Org:</span>      <span class="c-blue">Oppia Foundation</span>`,
        `<span class="c-purple">Uni:</span>      Vishwakarma University`,
        `<span class="c-purple">Status:</span>   <span class="c-green">● Open to Work</span>`,
        `<span class="c-purple">GitHub:</span>   <a href="https://github.com/rohan-unbeg" target="_blank" class="c-blue">rohan-unbeg</a>`,
        ``,
        `<span style="background:#e95420;padding:0 7px">&nbsp;</span><span style="background:#4ac94a;padding:0 7px">&nbsp;</span><span style="background:#729fcf;padding:0 7px">&nbsp;</span><span style="background:#ad7fa8;padding:0 7px">&nbsp;</span><span style="background:#34e2e2;padding:0 7px">&nbsp;</span>`,
    ];

    const maxLines = Math.max(logo.length, info.length);
    for (let i = 0; i < maxLines; i++) {
        const l = document.createElement("div");
        l.className = "line";
        l.style.cssText = "display:flex;gap:18px;padding-left:14px;";
        const logoSpan = document.createElement("span");
        logoSpan.className = "c-orange";
        logoSpan.style.cssText =
            "width:130px;flex-shrink:0;white-space:pre;font-size:11px;";
        logoSpan.textContent = logo[i] || "";
        const infoSpan = document.createElement("span");
        infoSpan.style.fontSize = "12px";
        infoSpan.innerHTML = info[i] !== undefined ? info[i] : "";
        l.appendChild(logoSpan);
        l.appendChild(infoSpan);
        body.appendChild(l);
    }
    blank();
}

// ── Easter egg ───────────────────────────────────────────────────────────────
function easterEgg() {
    blank();
    line(`  <span class="c-purple bold">🔮 You found a secret.</span>`);
    blank();
    line(
        `  <span class="c-dim">"The best code is code that doesn't need to exist."</span>`,
    );
    line(
        `  <span class="c-dim">"Second best: code so clean it explains itself."</span>`,
    );
    blank();
    line(`  <span class="c-green">Keep shipping. 🚀</span>`);
    blank();
}

// ── Matrix Rain ──────────────────────────────────────────────────────────────
let matrixInterval;
let resizeMatrix;
function startMatrix() {
    if (matrixInterval) return;

    body.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "10";
    canvas.style.background = "#000";
    body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // Resize canvas
    resizeMatrix = function () {
        canvas.width = body.clientWidth;
        canvas.height = body.clientHeight;
    };
    resizeMatrix();
    window.addEventListener("resize", resizeMatrix);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#0F0";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    matrixInterval = setInterval(draw, 33);

    const stopBtn = document.createElement("button");
    stopBtn.textContent = "Stop Matrix (Ctrl+C)";
    stopBtn.className = "btn-sm";
    stopBtn.style.position = "absolute";
    stopBtn.style.top = "10px";
    stopBtn.style.right = "20px";
    stopBtn.style.zIndex = "11";
    stopBtn.onclick = () => {
        clearInterval(matrixInterval);
        matrixInterval = null;
        window.removeEventListener("resize", resizeMatrix);
        doClear();
    };
    body.appendChild(stopBtn);
}

// ── Snake Game (Terminal version removed, now an App) ────────────────────────
let snakeInterval;
let snakeKeyHandler;
function startSnake() {
    line(
        `  <span class="c-dim">Snake is now a standalone app. Opening...</span>`,
    );
    setTimeout(() => openApp("snake"), 500);
}

// ── Input handling ───────────────────────────────────────────────────────────
let lastTabTime = 0;

input.addEventListener("keydown", (e) => {
    if (!bootDone) {
        e.preventDefault();
        return;
    }

    if (e.key === "Enter") {
        const val = input.value.trim();
        if (val) runCmd(val);
        input.value = "";
        suggestionEl.textContent = "";
        return;
    }

    if (e.key === "ArrowRight" && input.selectionStart === input.value.length) {
        if (suggestionEl.textContent) {
            input.value = suggestionEl.textContent;
            suggestionEl.textContent = "";
            e.preventDefault();
        }
        return;
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!cmdHistory.length) return;
        histIdx = histIdx < cmdHistory.length - 1 ? histIdx + 1 : histIdx;
        input.value = cmdHistory[cmdHistory.length - 1 - histIdx] || "";
        setTimeout(
            () =>
                input.setSelectionRange(input.value.length, input.value.length),
            0,
        );
        suggestionEl.textContent = "";
        return;
    }

    if (e.key === "ArrowDown") {
        e.preventDefault();
        histIdx = histIdx > 0 ? histIdx - 1 : -1;
        input.value =
            histIdx === -1
                ? ""
                : cmdHistory[cmdHistory.length - 1 - histIdx] || "";
        suggestionEl.textContent = "";
        return;
    }

    if (e.key === "Escape") {
        input.value = "";
        histIdx = -1;
        suggestionEl.textContent = "";
        return;
    }

    if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        body.innerHTML += `<div class="line"><span class="prompt-user">rohan</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">${cwd}</span><span class="prompt-sym">$ </span><span class="c-white">${escHtml(input.value)}</span><span class="c-dim">^C</span></div>`;
        input.value = "";
        suggestionEl.textContent = "";
        scrollBot();

        // Stop games if running
        if (matrixInterval) {
            clearInterval(matrixInterval);
            matrixInterval = null;
            window.removeEventListener("resize", resizeMatrix);
            doClear();
        }
        if (snakeInterval) {
            clearInterval(snakeInterval);
            snakeInterval = null;
            document.removeEventListener("keydown", snakeKeyHandler);
            doClear();
        }
        return;
    }

    if (e.key === "Tab") {
        e.preventDefault();
        const now = Date.now();
        const val = input.value.toLowerCase();
        const parts = val.split(" ");

        if (now - lastTabTime < 500) {
            // Double tab
            let matches = [];
            if (parts.length === 1) {
                matches = COMPLETIONS.filter((c) => c.startsWith(val));
            } else if (parts.length === 2) {
                if (parts[0] === "theme")
                    matches = THEMES.filter((t) => t.startsWith(parts[1]));
                if (parts[0] === "cat" && cwd === "~")
                    matches = FILES.filter((f) => f.startsWith(parts[1]));
                if (parts[0] === "cd" && cwd === "~")
                    matches = DIRS.filter((d) => d.startsWith(parts[1]));
            }

            if (matches.length > 0) {
                body.innerHTML += `<div class="line"><span class="prompt-user">rohan</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">${cwd}</span><span class="prompt-sym">$ </span><span class="c-white">${escHtml(input.value)}</span></div>`;
                line(`  <span class="c-dim">${matches.join("  ")}</span>`);
                scrollBot();
            }
        } else {
            // Single tab
            const suggestion = getSuggestion(input.value);
            if (suggestion) {
                input.value = suggestion;
                suggestionEl.textContent = "";
            }
        }
        lastTabTime = now;
    }
});

// Keep input focused
document.addEventListener("click", (e) => {
    if (!e.target.closest("a") && !e.target.closest("button")) {
        input.focus();
    }
});

// ── OS Window Manager ────────────────────────────────────────────────────────
const apps = {
    terminal: {
        id: "terminal",
        el: document.querySelector(".terminal"),
        running: true,
        minimized: false,
        isMaximized: false,
    },
    explorer: {
        id: "explorer",
        el: null,
        running: false,
        minimized: false,
        isMaximized: false,
    },
    pdf: {
        id: "pdf",
        el: null,
        running: false,
        minimized: false,
        isMaximized: false,
    },
    snake: {
        id: "snake",
        el: null,
        running: false,
        minimized: false,
        isMaximized: false,
    },
    sugarsync: {
        id: "sugarsync",
        el: null,
        running: false,
        minimized: false,
        isMaximized: false,
    },
    watchlist: {
        id: "watchlist",
        el: null,
        running: false,
        minimized: false,
        isMaximized: false,
    },
};

let zIndexCounter = 100;

function focusApp(id) {
    const app = apps[id];
    if (app && app.el) {
        zIndexCounter++;
        app.el.style.zIndex = zIndexCounter;
    }
}

function openApp(id) {
    const app = apps[id];
    if (!app) return;

    if (!app.running) {
        if (!app.el) {
            createAppWindow(id);
        }
        app.el.classList.remove("closed");
        app.el.style.transformOrigin = "center bottom";
        app.el.classList.add("anim-scale-in");
        function onScaleIn() {
            app.el.removeEventListener("animationend", onScaleIn);
            app.el.classList.remove("anim-scale-in");
        }
        app.el.addEventListener("animationend", onScaleIn);
        app.running = true;
        updateDock();
    }

    if (app.minimized) {
        const el = app.el;
        el.classList.remove("minimized", "anim-genie-out");
        el.style.transformOrigin = "center bottom";
        el.classList.add("anim-genie-in");
        function onGenieIn() {
            el.removeEventListener("animationend", onGenieIn);
            el.classList.remove("anim-genie-in");
        }
        el.addEventListener("animationend", onGenieIn);
        app.minimized = false;
    }

    focusApp(id);
    if (id === "terminal") input.focus();
}

function closeApp(id) {
    const app = apps[id];
    if (!app || !app.running) return;
    app.el.classList.add("closed");
    app.running = false;
    app.minimized = false;
    updateDock();
    if (id === "snake") stopSnakeGame();
}

function minimizeApp(id) {
    const app = apps[id];
    if (!app || !app.running) return;
    const el = app.el;
    // Snap transform-origin toward dock (bottom-center)
    el.style.transformOrigin = "center bottom";
    el.classList.remove("anim-genie-in", "anim-scale-in");
    el.classList.add("anim-genie-out");
    // After animation completes, actually hide
    function onGenieOut() {
        el.removeEventListener("animationend", onGenieOut);
        el.classList.remove("anim-genie-out");
        el.classList.add("minimized");
    }
    el.addEventListener("animationend", onGenieOut);
    app.minimized = true;
}

function toggleApp(id) {
    const app = apps[id];
    if (!app.running) {
        openApp(id);
    } else if (app.minimized) {
        openApp(id);
    } else {
        if (app.el.style.zIndex == zIndexCounter) {
            minimizeApp(id);
        } else {
            focusApp(id);
        }
    }
}

function maximizeApp(id) {
    const app = apps[id];
    if (!app || !app.el) return;
    const winEl = app.el;

    if (!app.isMaximized) {
        winEl.dataset.prevLeft = winEl.style.left;
        winEl.dataset.prevTop = winEl.style.top;
        winEl.dataset.prevW = winEl.style.width;
        winEl.dataset.prevH = winEl.style.height;
        winEl.style.position = "fixed";
        winEl.style.left = "0";
        winEl.style.top = "28px";
        winEl.style.width = "100vw";
        winEl.style.maxWidth = "100vw";
        winEl.style.height = "calc(100vh - 28px)";
        winEl.style.maxHeight = "calc(100vh - 28px)";
        winEl.style.borderRadius = "0";
        winEl.style.margin = "0";
        app.isMaximized = true;
        document.getElementById("os-desktop").classList.add("dock-hidden");
    } else {
        winEl.style.position = "absolute";
        winEl.style.left = winEl.dataset.prevLeft || "50px";
        winEl.style.top = winEl.dataset.prevTop || "50px";
        winEl.style.width = winEl.dataset.prevW || "";
        winEl.style.maxWidth = "";
        winEl.style.height = winEl.dataset.prevH || "";
        winEl.style.maxHeight = "";
        winEl.style.borderRadius = "";
        winEl.style.margin = "";
        app.isMaximized = false;
        document.getElementById("os-desktop").classList.remove("dock-hidden");
    }
    focusApp(id);
}

function makeResizable(winEl) {
    const handles = [
        { cls: "rsz-e", cursor: "ew-resize" },
        { cls: "rsz-s", cursor: "ns-resize" },
        { cls: "rsz-se", cursor: "nwse-resize" },
        { cls: "rsz-w", cursor: "ew-resize" },
        { cls: "rsz-n", cursor: "ns-resize" },
        { cls: "rsz-sw", cursor: "nesw-resize" },
        { cls: "rsz-ne", cursor: "nesw-resize" },
        { cls: "rsz-nw", cursor: "nwse-resize" },
    ];
    handles.forEach(function (h) {
        const el = document.createElement("div");
        el.className = "rsz-handle " + h.cls;
        el.style.cursor = h.cursor;
        winEl.appendChild(el);
        let startX, startY, startW, startH, startLeft, startTop;
        el.addEventListener("mousedown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            const rect = winEl.getBoundingClientRect();
            startW = rect.width;
            startH = rect.height;
            startLeft = parseFloat(winEl.style.left) || rect.left;
            startTop = parseFloat(winEl.style.top) || rect.top;
            const onMove = function (ev) {
                const dx = ev.clientX - startX,
                    dy = ev.clientY - startY;
                if (h.cls.includes("e"))
                    winEl.style.width = Math.max(280, startW + dx) + "px";
                if (h.cls.includes("s"))
                    winEl.style.height = Math.max(180, startH + dy) + "px";
                if (h.cls.includes("w")) {
                    winEl.style.width = Math.max(280, startW - dx) + "px";
                    winEl.style.left = startLeft + dx + "px";
                }
                if (h.cls.includes("n")) {
                    winEl.style.height = Math.max(180, startH - dy) + "px";
                    winEl.style.top = startTop + dy + "px";
                }
            };
            const onUp = function () {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    });
}

function makeDraggable(winEl, headerEl) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    headerEl.addEventListener("mousedown", (e) => {
        if (window.innerWidth < 640) return;
        if (e.target.classList.contains("w-dot")) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = winEl.getBoundingClientRect();
        if (
            winEl.style.position !== "absolute" &&
            winEl.style.position !== "fixed"
        ) {
            winEl.style.position = "absolute";
            winEl.style.left = rect.left + "px";
            winEl.style.top = rect.top + "px";
            winEl.style.margin = "0";
            winEl.style.transform = "none";
        }

        initialLeft = parseFloat(winEl.style.left) || rect.left;
        initialTop = parseFloat(winEl.style.top) || rect.top;

        focusApp(winEl.dataset.appId);
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const termW = winEl.offsetWidth;
        const clampedLeft = Math.max(
            -termW + 60,
            Math.min(window.innerWidth - 60, initialLeft + dx),
        );
        const clampedTop = Math.max(
            28,
            Math.min(window.innerHeight - 80, initialTop + dy),
        );

        winEl.style.left = clampedLeft + "px";
        winEl.style.top = clampedTop + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

    winEl.addEventListener("mousedown", () => focusApp(winEl.dataset.appId));
}

// Initialize Terminal as an app
apps.terminal.el.dataset.appId = "terminal";
apps.terminal.el.classList.add("os-window");
makeDraggable(apps.terminal.el, apps.terminal.el.querySelector(".t-header"));
makeResizable(apps.terminal.el);
focusApp("terminal");

function updateDock() {
    Object.keys(apps).forEach((id) => {
        const dockItem = document.getElementById(`dock-${id}`);
        if (dockItem) {
            if (apps[id].running) dockItem.classList.add("running");
            else dockItem.classList.remove("running");
        }
    });
}

function createAppWindow(id) {
    const win = document.createElement("div");
    win.className = "os-window";
    win.dataset.appId = id;

    let width = "600px";
    let height = "400px";
    let title = "App";
    let content = "";

    if (id === "explorer") {
        title = "File Explorer";
        width = "700px";
        height = "450px";
        content = `
                    <div style="display:flex;height:100%;" id="explorer-container">
                        <div style="width:160px;background:rgba(0,0,0,0.25);border-right:1px solid var(--border);padding:10px;display:flex;flex-direction:column;gap:2px;">
                            <div class="explorer-sidebar-item" onclick="renderExplorer('~')">
                                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                Home
                            </div>
                            <div class="explorer-sidebar-item" onclick="renderExplorer('~/projects')">
                                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                Projects
                            </div>
                            <div class="explorer-sidebar-item" onclick="renderExplorer('~/stats')">
                                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                Stats
                            </div>
                            <div style="flex:1;"></div>
                            <div class="explorer-sidebar-item" onclick="openApp('pdf')">
                                <svg viewBox="0 0 24 24" width="15" height="15" stroke="#ef2929" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                <span style="color:#ef2929">Resume.pdf</span>
                            </div>
                        </div>
                        <div id="explorer-content" style="flex:1;padding:15px;display:flex;gap:8px;flex-wrap:wrap;align-content:flex-start;overflow-y:auto;">
                            <!-- JS Generated -->
                        </div>
                    </div>
                `;
    } else if (id === "pdf") {
        title = "resume.pdf - PDF Viewer";
        width = "800px";
        height = "85vh";
        content = `<iframe src="resume.pdf" style="width:100%;height:100%;border:none;background:#fff;"></iframe>`;
    } else if (id === "snake") {
        title = "Snake Game";
        width = "420px";
        height = "480px";
        content = `<div id="snake-app-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#000;"></div>`;
    } else if (id === "sugarsync") {
        title = "SugarSync - Mobile App";
        width = "375px";
        height = "667px";
        content = `<div id="sugarsync-container" style="width:100%;height:100%;position:relative;">
            <iframe src="https://beat-the-sugar-spike.vercel.app/" style="width:100%;height:100%;border:none;background:#fff;" onload="this.parentElement.querySelector('.ss-fallback')?.remove()" onerror="this.style.display='none'"></iframe>
            <div class="ss-fallback" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);color:var(--text);padding:24px;text-align:center;z-index:-1">
                <div style="font-size:48px;margin-bottom:16px">🏆</div>
                <h3 style="color:var(--prompt);margin-bottom:8px">SugarSync</h3>
                <p style="color:var(--dim);font-size:12px;line-height:1.7;margin-bottom:20px">Hackathon-winning gamified health tracking app.<br>Real-time glucose data integration with gamification layer.</p>
                <a href="https://beat-the-sugar-spike.vercel.app/" target="_blank" class="btn-sm" style="padding:8px 20px;font-size:12px">Open in New Tab ↗</a>
                <a href="https://github.com/rohan-unbeg/sugarsync-mcode" target="_blank" style="color:var(--blue);font-size:11px;margin-top:10px">View Source on GitHub ↗</a>
            </div>
        </div>`;
    } else if (id === "watchlist") {
        title = "Rohan's Watched List";
        width = "860px";
        height = "600px";
        content = `
        <div id="wl-root" style="display:flex;flex-direction:column;height:100%;background:var(--bg);font-family:'Ubuntu Mono',monospace;overflow:hidden;position:relative;">
          <!-- Detail modal (hidden by default) -->
          <div id="wl-modal"></div>
          <!-- Header -->
          <div style="padding:14px 18px 10px;border-bottom:1px solid var(--border);flex-shrink:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <div>
                <span style="font-size:16px;font-weight:700;color:var(--prompt)">🍿 Rohan's Watched List</span>
                <span id="wl-total-badge" style="margin-left:10px;background:rgba(233,84,32,0.15);color:var(--prompt);font-size:10px;padding:2px 8px;border-radius:10px;"></span>
              </div>
              <input id="wl-search" placeholder="Search..." style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text);font-family:'Ubuntu Mono',monospace;font-size:12px;padding:5px 10px;border-radius:6px;outline:none;width:180px;" />
            </div>
            <!-- Tabs -->
            <div id="wl-tabs" style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;"></div>
          </div>
          <!-- Grid -->
          <div id="wl-grid" style="flex:1;min-height:0;overflow-y:auto;padding:14px 16px 20px;"></div>
        </div>`;
    }

    win.style.width = width;
    win.style.height = height;
    win.style.left = Math.max(50, Math.random() * 100) + "px";
    win.style.top = Math.max(50, Math.random() * 100) + "px";

    win.innerHTML = `
                <div class="os-window-header">
                    <div class="window-controls">
                        <div class="w-dot close" onclick="closeApp('${id}')" title="Close"></div>
                        <div class="w-dot min" onclick="minimizeApp('${id}')" title="Minimize"></div>
                        <div class="w-dot max" onclick="maximizeApp('${id}')" title="Maximize"></div>
                    </div>
                    <div class="t-title">${title}</div>
                </div>
                <div class="os-window-body">${content}</div>
            `;

    document.querySelector(".wrapper").appendChild(win);
    apps[id].el = win;

    makeDraggable(win, win.querySelector(".os-window-header"));
    if (id !== "sugarsync") makeResizable(win);

    if (id === "snake") {
        initSnakeApp();
    } else if (id === "explorer") {
        renderExplorer("~");
    } else if (id === "watchlist") {
        renderWatchlistApp();
    }
}

// Explorer rendering logic
const EXPLORER_ICONS = {
    folder: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#e9b96e" stroke="#c8980a" stroke-width="0.5"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" fill="#e9b96e"/></svg>',
    about: '<svg viewBox="0 0 24 24" width="36" height="36"><circle cx="12" cy="8" r="4" fill="#729fcf"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#4a7ab5"/></svg>',
    skills: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="2" y="14" width="4" height="8" rx="1" fill="#4ac94a"/><rect x="8" y="9" width="4" height="13" rx="1" fill="#34e2e2"/><rect x="14" y="4" width="4" height="18" rx="1" fill="#e95420"/><rect x="20" y="11" width="2" height="11" rx="1" fill="#ad7fa8"/></svg>',
    exp: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="2" y="7" width="20" height="14" rx="2" fill="#4a2a55" stroke="#ad7fa8" stroke-width="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" fill="none" stroke="#ad7fa8" stroke-width="1.5"/><line x1="12" y1="12" x2="12" y2="16" stroke="#ad7fa8" stroke-width="1.5"/><line x1="10" y1="14" x2="14" y2="14" stroke="#ad7fa8" stroke-width="1.5"/></svg>',
    contact:
        '<svg viewBox="0 0 24 24" width="36" height="36"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7A2 2 0 0 1 22 16.9z" fill="#34e2e2" opacity="0.9"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" width="36" height="36"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#c0392b"/><polyline points="14 2 14 8 20 8" fill="#e74c3c" stroke="#fff" stroke-width="0.5"/><text x="5" y="17" font-size="6" fill="white" font-weight="bold" font-family="monospace">PDF</text></svg>',
    phone: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="5" y="2" width="14" height="20" rx="3" fill="#2c2c2e" stroke="#4ac94a" stroke-width="1.5"/><rect x="7" y="5" width="10" height="13" rx="1" fill="#1a1a2e"/><circle cx="12" cy="20" r="1" fill="#4ac94a"/></svg>',
    robot: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="4" y="8" width="16" height="12" rx="2" fill="#ad7fa8"/><rect x="8" y="3" width="8" height="5" rx="1" fill="#9b59b6"/><circle cx="9" cy="13" r="2" fill="#fff"/><circle cx="15" cy="13" r="2" fill="#fff"/><circle cx="9" cy="13" r="1" fill="#2c1654"/><circle cx="15" cy="13" r="1" fill="#2c1654"/><rect x="9" y="17" width="6" height="1.5" rx="0.75" fill="#fff"/><line x1="2" y1="11" x2="4" y2="11" stroke="#ad7fa8" stroke-width="2"/><line x1="20" y1="11" x2="22" y2="11" stroke="#ad7fa8" stroke-width="2"/></svg>',
    stats: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="2" y="12" width="3" height="10" rx="1" fill="#e95420"/><rect x="7" y="8" width="3" height="14" rx="1" fill="#e9b96e"/><rect x="12" y="4" width="3" height="18" rx="1" fill="#4ac94a"/><rect x="17" y="6" width="3" height="16" rx="1" fill="#729fcf"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#6a5572" stroke-width="2"><circle cx="12" cy="12" r="10" fill="rgba(106,85,114,0.15)"/><line x1="16" y1="12" x2="8" y2="12"></line><polyline points="11 9 8 12 11 15"></polyline></svg>',
};

// ── GitHub Pinned Repos for Explorer ─────────────────────────────────────────
const GITHUB_PINNED_REPOS = [
    { name: "autonomous-ai-maintainer", desc: "Dual-engine AI codebase maintainer (Gemini & Groq). Auto-scans repos, generates fixes, opens PRs.", lang: "Python",     color: "#3572A5", url: "https://github.com/rohan-unbeg/autonomous-ai-maintainer", badge: "⭐ Featured" },
    { name: "sugarsync-mcode",          desc: "Hackathon-winning gamified glucose health tracker. Real-time data + gamification layer.",           lang: "TypeScript", color: "#3178c6", url: "https://github.com/rohan-unbeg/sugarsync-mcode",          badge: "🏆 Winner"   },
    { name: "portfolio-cli-style",      desc: "This very portfolio — Ubuntu OS simulation in vanilla JS. Terminal, GUI windows, TMDB watchlist.",  lang: "JavaScript", color: "#f1e05a", url: "https://github.com/rohan-unbeg/portfolio-cli-style",      badge: "🖥️ Live"     },
    { name: "oppia",                    desc: "Open-source interactive learning platform. Contributed frontend accessibility & UX improvements.",  lang: "TypeScript", color: "#3178c6", url: "https://github.com/oppia/oppia",                          badge: "🤝 OSS"      },
];

// ── Text Editor Window ────────────────────────────────────────────────────────
window.openTextEditor = function(filename, content, lang) {
    const winId = "texteditor-" + filename.replace(/[^a-z0-9]/gi, "-");
    // If already open, bring to front
    const existing = document.querySelector('[data-app-id="' + winId + '"]');
    if (existing && !existing.classList.contains("closed")) {
        zIndexCounter++;
        existing.style.zIndex = zIndexCounter;
        existing.classList.remove("minimized");
        existing.style.transform = "";
        existing.style.opacity = "1";
        existing.style.pointerEvents = "all";
        return;
    }
    const ext = filename.split(".").pop().toLowerCase();
    const langColors = { py:"#3572A5", js:"#f1e05a", ts:"#3178c6", md:"#0ea5e9", json:"#e9b96e", txt:"#aaa", html:"#e44d26", css:"#264de4", sh:"#4ac94a" };
    const langColor = langColors[ext] || "#aaa";
    // Line numbers + syntax highlight (basic)
    const lines = (content || "").split("\n");
    const numbered = lines.map((l, i) =>
        `<span class="te-line"><span class="te-ln">${i+1}</span><span class="te-code">${escHtml(l) || " "}</span></span>`
    ).join("\n");
    const win = document.createElement("div");
    win.className = "os-window";
    win.dataset.appId = winId;
    win.style.cssText = "width:640px;height:480px;left:" + (100 + Math.random()*80) + "px;top:" + (60 + Math.random()*60) + "px;";
    win.innerHTML = `
        <div class="os-window-header">
            <div class="window-controls">
                <div class="w-dot close" onclick="this.closest('.os-window').classList.add('closed')" title="Close"></div>
                <div class="w-dot min" title="Minimize"></div>
                <div class="w-dot max" title="Maximize"></div>
            </div>
            <div class="t-title">
                <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${langColor};margin-right:6px;vertical-align:middle;"></span>
                ${escHtml(filename)}
            </div>
        </div>
        <div class="os-window-body" style="overflow:auto;padding:0;background:#0d1117;font-family:'Ubuntu Mono',monospace;font-size:12px;line-height:1.6;cursor:text;user-select:text;">
            <pre class="te-pre">${numbered}</pre>
        </div>`;
    document.querySelector(".wrapper").appendChild(win);
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
    makeDraggable(win, win.querySelector(".os-window-header"));
    makeResizable(win);
    // Minimize/Maximize wiring
    win.querySelector(".w-dot.min").onclick = () => {
        win.style.opacity = "0.2";
        win.style.pointerEvents = "none";
        win.style.transform = "scale(0.05) translateY(200px)";
        win.classList.add("minimized");
    };
    win.querySelector(".w-dot.max").onclick = () => {
        if (win.dataset.maxed === "1") {
            win.style.cssText = win.dataset.prevCss || win.style.cssText;
            delete win.dataset.maxed;
        } else {
            win.dataset.prevCss = win.style.cssText;
            win.style.cssText = "position:absolute;left:0;top:0;width:100%;height:calc(100% - 32px);z-index:" + (++zIndexCounter) + ";";
            win.dataset.maxed = "1";
        }
    };
};

// ── GitHub Tree Visualizer ────────────────────────────────────────────────────
const _ghTreeCache = {};
window._ghfcCounter = 0; // counter for file content cache keys

window.openGithubTree = function(owner, repo) {
    const repoKey = owner + "/" + repo;
    const winId = "ghtree-" + repo;
    const existing = document.querySelector('[data-app-id="' + winId + '"]');
    if (existing && !existing.classList.contains("closed")) {
        zIndexCounter++;
        existing.style.zIndex = zIndexCounter;
        existing.classList.remove("minimized");
        existing.style.transform = "";
        existing.style.opacity = "1";
        existing.style.pointerEvents = "all";
        return;
    }
    const win = document.createElement("div");
    win.className = "os-window";
    win.dataset.appId = winId;
    win.style.cssText = "width:720px;height:500px;left:" + (80 + Math.random()*80) + "px;top:" + (50 + Math.random()*60) + "px;";
    win.innerHTML = `
        <div class="os-window-header">
            <div class="window-controls">
                <div class="w-dot close" onclick="this.closest('.os-window').classList.add('closed')" title="Close"></div>
                <div class="w-dot min" title="Minimize"></div>
                <div class="w-dot max" title="Maximize"></div>
            </div>
            <div class="t-title">
                <svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align:middle;margin-right:6px;fill:#aaa"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                ${escHtml(owner)}/<strong>${escHtml(repo)}</strong>
            </div>
        </div>
        <div class="os-window-body" id="ghtree-body-${winId}" style="display:flex;overflow:hidden;padding:0;background:#0d1117;">
            <div class="ghtree-loading" style="padding:24px;color:var(--dim);font-family:'Ubuntu Mono',monospace;font-size:13px;">⏳ Fetching repository tree…</div>
        </div>`;
    document.querySelector(".wrapper").appendChild(win);
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
    makeDraggable(win, win.querySelector(".os-window-header"));
    makeResizable(win);
    win.querySelector(".w-dot.min").onclick = () => {
        win.style.opacity = "0.2"; win.style.pointerEvents = "none";
        win.style.transform = "scale(0.05) translateY(200px)"; win.classList.add("minimized");
    };
    win.querySelector(".w-dot.max").onclick = () => {
        if (win.dataset.maxed === "1") { win.style.cssText = win.dataset.prevCss; delete win.dataset.maxed; }
        else { win.dataset.prevCss = win.style.cssText; win.style.cssText = "position:absolute;left:0;top:0;width:100%;height:calc(100% - 32px);z-index:" + (++zIndexCounter) + ";"; win.dataset.maxed = "1"; }
    };
    // Fetch tree
    _fetchGHTree(owner, repo, winId);
};

async function _fetchGHTree(owner, repo, winId) {
    const bodyEl = document.getElementById("ghtree-body-" + winId);
    if (!bodyEl) return;
    const cacheKey = owner + "/" + repo;
    try {
        let treeData;
        if (_ghTreeCache[cacheKey]) {
            treeData = _ghTreeCache[cacheKey];
        } else {
            // First get default branch
            const repoRes = await fetch("https://api.github.com/repos/" + owner + "/" + repo);
            if (!repoRes.ok) throw new Error("Repo not found");
            const repoJson = await repoRes.json();
            const branch = repoJson.default_branch || "main";
            const treeRes = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/git/trees/" + branch + "?recursive=1");
            if (!treeRes.ok) throw new Error("Tree fetch failed");
            const treeJson = await treeRes.json();
            treeData = treeJson.tree || [];
            _ghTreeCache[cacheKey] = treeData;
        }
        _renderGHTree(owner, repo, treeData, bodyEl, winId);
    } catch(err) {
        bodyEl.innerHTML = '<div style="padding:24px;color:#ef4444;font-family:\'Ubuntu Mono\',monospace;font-size:13px;">❌ ' + escHtml(err.message) + '<br><br><a href="https://github.com/' + owner + '/' + repo + '" target="_blank" style="color:#729fcf">Open on GitHub ↗</a></div>';
    }
}

function _renderGHTree(owner, repo, tree, bodyEl, winId) {
    // Build tree structure
    const root = { name: repo, type: "tree", children: {}, path: "" };
    tree.forEach(node => {
        const parts = node.path.split("/");
        let cur = root;
        parts.forEach((part, idx) => {
            if (!cur.children[part]) {
                cur.children[part] = { name: part, type: idx === parts.length - 1 ? node.type : "tree", children: {}, path: node.path, sha: node.sha, size: node.size, fullPath: node.path };
            }
            cur = cur.children[part];
        });
    });

    let selectedFile = null;

    function treeNode(node, depth) {
        const sortedKeys = Object.keys(node.children).sort((a, b) => {
            const aDir = node.children[a].type === "tree";
            const bDir = node.children[b].type === "tree";
            if (aDir && !bDir) return -1;
            if (!aDir && bDir) return 1;
            return a.localeCompare(b);
        });
        return sortedKeys.map(key => {
            const child = node.children[key];
            const isDir = child.type === "tree";
            const indent = depth * 16;
            const ext = key.split(".").pop().toLowerCase();
            const fileIconColor = { py:"#3572A5", js:"#f1e05a", ts:"#3178c6", md:"#0ea5e9", json:"#e9b96e", html:"#e44d26", css:"#264de4", sh:"#4ac94a" }[ext] || "#8b949e";
            const icon = isDir
                ? `<svg viewBox="0 0 16 16" width="14" height="14" style="fill:#e9b96e;flex-shrink:0"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5L6.13 1.561A1.75 1.75 0 0 0 4.87 1H1.75z"/></svg>`
                : `<svg viewBox="0 0 16 16" width="14" height="14" style="fill:${fileIconColor};flex-shrink:0"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25V1.75z"/></svg>`;
            const nodeId = "ghn-" + winId + "-" + (child.fullPath || key).replace(/[^a-z0-9]/gi, "_");
            if (isDir) {
                const childrenHtml = treeNode(child, depth + 1);
                return `<details class="ghtree-dir" id="${nodeId}">
                    <summary class="ghtree-item" style="padding-left:${8 + indent}px">${icon}<span>${escHtml(key)}</span></summary>
                    ${childrenHtml}
                </details>`;
            } else {
                return `<div class="ghtree-item ghtree-file" id="${nodeId}" style="padding-left:${8 + indent}px" onclick="ghTreeOpenFile('${escHtml(owner)}','${escHtml(repo)}','${escHtml(child.fullPath)}','${escHtml(key)}')">${icon}<span>${escHtml(key)}</span></div>`;
            }
        }).join("");
    }

    const treeHtml = treeNode(root, 0);
    bodyEl.innerHTML = `
        <div class="ghtree-sidebar">
            <div class="ghtree-repo-header">
                <span style="color:var(--dim);font-size:11px">📁 ${escHtml(repo)}</span>
                <a href="https://github.com/${escHtml(owner)}/${escHtml(repo)}" target="_blank" class="ghtree-gh-link">↗</a>
            </div>
            <div class="ghtree-list">${treeHtml}</div>
        </div>
        <div class="ghtree-preview" id="ghtree-preview-${winId}">
            <div style="padding:24px;color:var(--dim);font-size:12px;font-family:'Ubuntu Mono',monospace;">Click a file to preview its contents</div>
        </div>`;
}

window.ghTreeOpenFile = async function(owner, repo, filePath, filename) {
    // Find the preview panel in the most recently focused ghtree window
    const allPreviews = document.querySelectorAll('[id^="ghtree-preview-"]');
    const previewEl = allPreviews[allPreviews.length - 1];
    if (!previewEl) return;
    previewEl.innerHTML = '<div style="padding:24px;color:var(--dim);font-size:12px;font-family:\'Ubuntu Mono\',monospace;">⏳ Loading ' + escHtml(filename) + '…</div>';
    try {
        const res = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + filePath.split("/").map(encodeURIComponent).join("/"));
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        if (json.encoding === "base64") {
            // Decode UTF-8 safe
            const raw = json.content.replace(/\n/g, "");
            let content;
            try { content = decodeURIComponent(escape(atob(raw))); }
            catch(e) { content = atob(raw); }
            // Store in global cache with unique key
            const cacheKey = "_ghfc_" + (++window._ghfcCounter);
            window[cacheKey] = content;
            const ext = filename.split(".").pop().toLowerCase();
            const lines = content.split("\n");
            const numbered = lines.map((l, i) =>
                `<span class="te-line"><span class="te-ln">${i+1}</span><span class="te-code">${escHtml(l) || " "}</span></span>`
            ).join("\n");
            const langColors = { py:"#3572A5", js:"#f1e05a", ts:"#3178c6", md:"#0ea5e9", json:"#e9b96e", txt:"#aaa", html:"#e44d26", css:"#264de4", sh:"#4ac94a" };
            const langColor = langColors[ext] || "#aaa";
            previewEl.innerHTML = `
                <div class="ghtree-file-header">
                    <span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${langColor};margin-right:6px;"></span>
                    <span>${escHtml(filename)}</span>
                    <span style="color:var(--dim);font-size:11px;margin-left:auto;">${lines.length} lines</span>
                    <button class="ghtree-open-editor" onclick="openTextEditor(${JSON.stringify(filename)}, window[${JSON.stringify(cacheKey)}], ${JSON.stringify(ext)})">Open in Editor</button>
                </div>
                <pre class="te-pre" style="overflow:auto;max-height:calc(100% - 42px);margin:0;">${numbered}</pre>`;
        } else if (json.download_url) {
            previewEl.innerHTML = `<div style="padding:24px;font-family:'Ubuntu Mono',monospace;font-size:12px;color:var(--dim);">Binary file — <a href="${escHtml(json.download_url)}" target="_blank" style="color:#729fcf">Download ↗</a></div>`;
        }
    } catch(err) {
        previewEl.innerHTML = '<div style="padding:24px;color:#ef4444;font-size:12px;font-family:\'Ubuntu Mono\',monospace;">❌ ' + escHtml(err.message) + '</div>';
    }
};

window.renderExplorer = function (path) {
    const contentEl = document.getElementById("explorer-content");
    if (!contentEl) return;

    const I = EXPLORER_ICONS;
    let items = [];
    if (path === "~") {
        items = [
            { name: "projects",    icon: I.folder,  type: "dir",  path: "~/projects" },
            { name: "About Me",    icon: I.about,   type: "file", cmd: "openGuiViewer('about')" },
            { name: "Skills",      icon: I.skills,  type: "file", cmd: "openGuiViewer('skills')" },
            { name: "Experience",  icon: I.exp,     type: "file", cmd: "openGuiViewer('experience')" },
            { name: "Contact",     icon: I.contact, type: "file", cmd: "openGuiViewer('contact')" },
            { name: "Resume.pdf",  icon: I.pdf,     type: "file", cmd: "openApp('pdf')" },
        ];
    } else if (path === "~/projects") {
        // Render GitHub pinned project cards instead of icon grid
        const backBtn = `<div class="explorer-icon" onclick="renderExplorer('~')"><div class="explorer-icon-img">${I.back}</div><div class="explorer-icon-name">..</div></div>`;
        const cards = GITHUB_PINNED_REPOS.map(r => {
            const isExternal = r.url.includes("github.com/oppia");
            const treeAction = isExternal ? "window.open('" + r.url + "','_blank')" : "openGithubTree('rohan-unbeg','" + r.name + "')";
            const langDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${r.color};margin-right:5px;vertical-align:middle;"></span>`;
            return `<div class="explorer-repo-card">
                <div class="explorer-repo-header">
                    <svg viewBox="0 0 16 16" width="14" height="14" style="fill:#8b949e;flex-shrink:0;margin-right:6px"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8V1.5Z"/></svg>
                    <span class="explorer-repo-name" onclick="${treeAction}">${escHtml(r.name)}</span>
                    <span class="explorer-repo-badge">${r.badge}</span>
                    <a href="${r.url}" target="_blank" class="explorer-repo-gh-link" title="Open on GitHub">↗</a>
                </div>
                <div class="explorer-repo-desc">${escHtml(r.desc)}</div>
                <div class="explorer-repo-footer">
                    ${langDot}<span style="font-size:11px;color:var(--dim)">${escHtml(r.lang)}</span>
                    ${isExternal ? '' : '<button class="explorer-repo-tree-btn" onclick="' + treeAction + '">🌲 Browse Files</button>'}
                </div>
            </div>`;
        }).join("");
        contentEl.style.flexWrap = "wrap";
        contentEl.style.flexDirection = "column";
        contentEl.innerHTML = `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${backBtn}</div><div class="explorer-repo-grid">${cards}</div>`;
        // Update breadcrumb
        const explorerWin = apps.explorer && apps.explorer.el;
        if (explorerWin) {
            const titleEl = explorerWin.querySelector(".t-title");
            if (titleEl) titleEl.textContent = "File Explorer — ~/projects";
        }
        return;
    } else if (path === "~/stats") {
        contentEl.style.flexWrap = "wrap";
        contentEl.style.flexDirection = "row";
        contentEl.innerHTML = `
            <div style="width:100%;padding:4px 0 12px;color:var(--prompt);font-family:'Ubuntu Mono',monospace;font-size:13px;font-weight:bold;">GitHub Stats</div>
            <div style="width:100%;display:flex;flex-direction:column;gap:10px;">
                <img src="https://ghchart.rshah.org/e95420/rohan-unbeg" style="max-width:100%;border-radius:6px;border:1px solid var(--border);" />
                <img src="https://streak-stats.demolab.com?user=rohan-unbeg&theme=dark&hide_border=true&background=160e1e&ring=e95420&fire=e95420&currStreakLabel=eeeeec" style="max-width:100%;border-radius:6px;border:1px solid var(--border);" />
                <img src="https://github-readme-stats.vercel.app/api?username=rohan-unbeg&show_icons=true&theme=dark&hide_border=true&bg_color=160e1e&title_color=e95420&icon_color=e9b96e" style="max-width:100%;border-radius:6px;border:1px solid var(--border);" />
            </div>`;
        const explorerWin = apps.explorer && apps.explorer.el;
        if (explorerWin) {
            const titleEl = explorerWin.querySelector(".t-title");
            if (titleEl) titleEl.textContent = "File Explorer — ~/stats";
        }
        return;
    }

    let html = "";
    items.forEach(function (i) {
        const action =
            i.type === "dir" ? "renderExplorer('" + i.path + "')" : i.cmd;
        html +=
            '<div class="explorer-icon" onclick="' +
            action +
            '">' +
            '<div class="explorer-icon-img">' +
            i.icon +
            "</div>" +
            '<div class="explorer-icon-name">' +
            i.name +
            "</div>" +
            "</div>";
    });
    contentEl.style.flexWrap = "wrap";
    contentEl.style.flexDirection = "row";
    contentEl.innerHTML = html;

    // Update breadcrumb title
    const explorerWin = apps.explorer && apps.explorer.el;
    if (explorerWin) {
        const titleEl = explorerWin.querySelector(".t-title");
        if (titleEl) titleEl.textContent = "File Explorer — " + path;
    }
};

// ── GUI Viewer ────────────────────────────────────────────────────────────────
const guiViewers = {};
window.openGuiViewer = function (view) {
    const viewId = "viewer-" + view;
    if (guiViewers[viewId] && guiViewers[viewId].running) {
        openApp(viewId);
        return;
    }
    const titles = {
        about: "About Me",
        skills: "Skills",
        experience: "Experience",
        contact: "Contact",
        "ai-maintainer": "AI Maintainer Project",
        stats: "GitHub Stats",
    };
    const win = document.createElement("div");
    win.className = "os-window gui-viewer-win";
    win.dataset.appId = viewId;
    win.style.width = "680px";
    win.style.height = "520px";
    win.style.left = 80 + Math.random() * 80 + "px";
    win.style.top = 50 + Math.random() * 60 + "px";
    const title = titles[view] || view;
    win.innerHTML =
        '<div class="os-window-header"><div class="window-controls"><div class="w-dot close" onclick="closeGuiViewer(\'' +
        viewId +
        '\')" title="Close"></div><div class="w-dot min" onclick="minimizeGuiViewer(\'' +
        viewId +
        '\')" title="Minimize"></div><div class="w-dot max" onclick="maximizeGuiViewer(\'' +
        viewId +
        '\')" title="Maximize"></div></div><div class="t-title">' +
        title +
        '</div></div><div class="os-window-body gui-viewer-body" id="gvbody-' +
        viewId +
        '"></div>';
    document.querySelector(".wrapper").appendChild(win);
    guiViewers[viewId] = {
        el: win,
        running: true,
        minimized: false,
        isMaximized: false,
    };
    makeDraggable(win, win.querySelector(".os-window-header"));
    makeResizable(win);
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
    // Render content
    const body = document.getElementById("gvbody-" + viewId);
    renderGuiContent(view, body);
};

window.closeGuiViewer = function (id) {
    const v = guiViewers[id];
    if (v) {
        v.el.classList.add("closed");
        v.running = false;
        v.minimized = false;
    }
};
window.minimizeGuiViewer = function (id) {
    const v = guiViewers[id];
    if (!v || !v.running) return;
    const el = v.el;
    el.style.transformOrigin = "center bottom";
    el.classList.remove("anim-genie-in", "anim-scale-in");
    el.classList.add("anim-genie-out");
    function onGenieOut() {
        el.removeEventListener("animationend", onGenieOut);
        el.classList.remove("anim-genie-out");
        el.classList.add("minimized");
    }
    el.addEventListener("animationend", onGenieOut);
    v.minimized = true;
};
window.maximizeGuiViewer = function (id) {
    const v = guiViewers[id];
    if (!v) return;
    const winEl = v.el;
    if (!v.isMaximized) {
        winEl.dataset.prevLeft = winEl.style.left;
        winEl.dataset.prevTop = winEl.style.top;
        winEl.dataset.prevW = winEl.style.width;
        winEl.dataset.prevH = winEl.style.height;
        winEl.style.cssText +=
            ";position:fixed;left:0;top:28px;width:100vw;max-width:100vw;height:calc(100vh - 28px);max-height:calc(100vh - 28px);border-radius:0;margin:0;";
        document.getElementById("os-desktop").classList.add("dock-hidden");
        v.isMaximized = true;
    } else {
        winEl.style.position = "absolute";
        winEl.style.left = winEl.dataset.prevLeft || "80px";
        winEl.style.top = winEl.dataset.prevTop || "50px";
        winEl.style.width = winEl.dataset.prevW || "680px";
        winEl.style.height = winEl.dataset.prevH || "520px";
        winEl.style.maxWidth = "";
        winEl.style.maxHeight = "";
        winEl.style.borderRadius = "";
        winEl.style.margin = "";
        document.getElementById("os-desktop").classList.remove("dock-hidden");
        v.isMaximized = false;
    }
};

function renderGuiContent(view, container) {
    container.style.cssText =
        'padding:24px 28px;overflow-y:auto;height:100%;font-family:"Ubuntu Mono",monospace;background:var(--bg);color:var(--text);';
    if (view === "about") {
        container.innerHTML =
            '<h2 style="color:var(--prompt);margin-bottom:6px">Rohan Unbeg</h2><p style="color:var(--dim);margin-bottom:16px">Backend Developer · Open Source Contributor</p><div style="display:grid;gap:10px">' +
            guiRow("Education", "CS @ Vishwakarma University", "#729fcf") +
            guiRow("Current", "Contributor @ Oppia Foundation", "#4ac94a") +
            guiRow(
                "Focus",
                "Backend infra · Data integrity · CI workflows",
                "#e9b96e",
            ) +
            guiRow("Learning", "System Design · Apache Beam · GCP", "#ad7fa8") +
            guiRow(
                "Status",
                '<span style="color:#4ac94a">● Open to opportunities</span>',
                "#34e2e2",
            ) +
            '</div><p style="margin-top:20px;color:var(--dim);font-size:12px;line-height:1.8">Passionate about resilient infrastructure, fixing technical debt, and scaling tools for global learners.</p>';
    } else if (view === "skills") {
        // tier: 4=daily driver, 3=proficient, 2=familiar, 1=learning
        const skills = [
            [
                "Python",
                "#4ac94a",
                4,
                "Daily driver — backend, scripting, pipelines",
            ],
            [
                "TypeScript",
                "#729fcf",
                4,
                "Daily driver — Angular, Node.js, full-stack",
            ],
            [
                "JavaScript",
                "#e9b96e",
                3,
                "Proficient — DOM, vanilla JS, this portfolio",
            ],
            [
                "Angular",
                "#dd0031",
                3,
                "Proficient — Oppia's frontend stack, RxJS",
            ],
            ["Node.js", "#6da55f", 3, "Proficient — REST APIs, Express"],
            ["CI/CD", "#4ac94a", 3, "Proficient — GitHub Actions, CircleCI"],
            ["React", "#61dafb", 2, "Familiar — personal projects, hooks"],
            ["GCP", "#4285f4", 2, "Familiar — App Engine, Cloud Functions"],
            [
                "Apache Beam",
                "#e67e22",
                2,
                "Familiar — batch data processing jobs",
            ],
            ["Docker", "#0db7ed", 2, "Familiar — containerization, dev envs"],
            [
                "PostgreSQL",
                "#336791",
                2,
                "Familiar — relational queries, schema design",
            ],
            [
                "MongoDB",
                "#4ea94b",
                2,
                "Familiar — document stores, aggregation",
            ],
        ];
        const tierLabel = [
            "",
            "Learning",
            "Familiar",
            "Proficient",
            "Daily driver",
        ];
        const tierColor = ["", "#6a5572", "#729fcf", "#4ac94a", "#e95420"];
        const tierBar = ["", "█░░░", "██░░", "███░", "████"];
        container.innerHTML =
            '<h2 style="color:var(--prompt);margin-bottom:4px">Tech Stack</h2>' +
            '<p style="color:var(--dim);font-size:11px;margin-bottom:16px">████ Daily driver · ███░ Proficient · ██░░ Familiar · █░░░ Learning</p>' +
            skills
                .map(function (s) {
                    return (
                        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:6px 10px;background:rgba(255,255,255,0.03);border-radius:6px">' +
                        '<span style="width:110px;font-size:12px;flex-shrink:0">' +
                        s[0] +
                        "</span>" +
                        '<span style="color:' +
                        s[1] +
                        ';font-family:monospace;letter-spacing:2px;font-size:13px;width:50px;flex-shrink:0">' +
                        tierBar[s[2]] +
                        "</span>" +
                        '<span style="color:' +
                        tierColor[s[2]] +
                        ';font-size:10px;width:90px;flex-shrink:0">' +
                        tierLabel[s[2]] +
                        "</span>" +
                        '<span style="color:var(--dim);font-size:10px">' +
                        s[3] +
                        "</span>" +
                        "</div>"
                    );
                })
                .join("");
    } else if (view === "experience") {
        container.innerHTML =
            '<h2 style="color:var(--prompt);margin-bottom:6px">Open Source Contributions</h2><p style="color:var(--dim);margin-bottom:20px">Oppia Foundation — 2024–present</p>' +
            guiCommit(
                "a8f2c91",
                "Translation Count Validation",
                "PR #24589",
                "Validation mechanism to keep translation counts in sync across data models. Prevented silent data corruption in multi-language lessons.",
                "https://github.com/oppia/oppia/pull/24589",
                "#4ac94a",
            ) +
            guiCommit(
                "7d4b1e5",
                "Translation Versioning System",
                "PR #24401",
                "Refactored storage layer to support robust versioning of translations — enabling seamless rollbacks and full change history.",
                "https://github.com/oppia/oppia/pull/24401",
                "#729fcf",
            ) +
            '<p style="margin-top:16px"><a href="https://github.com/oppia/oppia/commits?author=rohan-unbeg" target="_blank" style="color:#729fcf">→ View all PRs on GitHub ↗</a></p>';
    } else if (view === "contact") {
        container.innerHTML =
            '<h2 style="color:var(--prompt);margin-bottom:16px">Get in Touch</h2>' +
            guiContact(
                "GitHub",
                "https://github.com/rohan-unbeg",
                "github.com/rohan-unbeg",
                "#ad7fa8",
            ) +
            guiContact(
                "LinkedIn",
                "https://linkedin.com/in/rohanunbeg/",
                "linkedin.com/in/rohanunbeg/",
                "#729fcf",
            ) +
            guiContact(
                "Email",
                "mailto:rohanunbeg0918@gmail.com",
                "rohanunbeg0918@gmail.com",
                "#e9b96e",
            ) +
            guiContact(
                "Twitter/X",
                "https://twitter.com/rohanunbeg",
                "@rohanunbeg",
                "#34e2e2",
            ) +
            '<p style="margin-top:20px;color:var(--dim);font-size:12px">● Open to internships, collaborations, and freelance work.</p>';
    } else if (view === "ai-maintainer") {
        container.innerHTML =
            '<h2 style="color:var(--prompt);margin-bottom:6px">Autonomous AI Maintainer</h2><p style="color:#4ac94a;margin-bottom:12px">⭐ Featured Project</p><p style="color:var(--dim);font-size:13px;line-height:1.8;margin-bottom:16px">Dual-engine automated codebase upkeep tool powered by Gemini &amp; Groq. Scans repos for stale issues, generates fixes, and opens PRs autonomously.</p>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">' +
            guiBadge("Python", "#4ac94a") +
            guiBadge("AI/ML", "#ad7fa8") +
            guiBadge("Automation", "#e9b96e") +
            "</div>" +
            '<a href="https://github.com/rohan-unbeg/autonomous-ai-maintainer" target="_blank" style="color:#729fcf">→ View on GitHub ↗</a>';
    } else if (view === "stats") {
        container.innerHTML =
            '<h2 style="color:var(--prompt);margin-bottom:16px">GitHub Stats</h2>' +
            '<img src="https://ghchart.rshah.org/e95420/rohan-unbeg" style="max-width:100%;border-radius:4px;border:1px solid var(--border);margin-bottom:12px;display:block" />' +
            '<img src="https://streak-stats.demolab.com?user=rohan-unbeg&theme=dark&hide_border=true&background=160e1e&ring=e95420&fire=e95420&currStreakLabel=eeeeec" style="max-width:100%;border-radius:4px;border:1px solid var(--border);display:block" />';
    }
}

function guiRow(label, val, color) {
    return (
        '<div style="display:flex;gap:12px;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:6px;border-left:3px solid ' +
        color +
        '"><span style="color:var(--dim);width:100px;flex-shrink:0;font-size:12px">' +
        label +
        '</span><span style="font-size:13px">' +
        val +
        "</span></div>"
    );
}
function guiCommit(hash, title, pr, desc, url, color) {
    return (
        '<div style="border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px"><div style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><code style="color:#e9b96e;font-size:11px">' +
        hash +
        '</code><a href="' +
        url +
        '" target="_blank" style="color:' +
        color +
        ';font-size:11px">' +
        pr +
        ' ↗</a></div><div style="font-weight:bold;margin-bottom:6px">' +
        title +
        '</div><p style="color:var(--dim);font-size:12px;line-height:1.7">' +
        desc +
        "</p></div>"
    );
}
function guiContact(label, url, display, color) {
    return (
        '<a href="' +
        url +
        '" target="_blank" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:8px;text-decoration:none;border:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background=\'rgba(255,255,255,0.08)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.04)\'"><span style="color:var(--dim);width:80px;font-size:12px">' +
        label +
        '</span><span style="color:' +
        color +
        '">' +
        display +
        '</span><span style="margin-left:auto;color:var(--dim)">↗</span></a>'
    );
}
function guiBadge(label, color) {
    return (
        '<span style="background:' +
        color +
        "22;color:" +
        color +
        ";border:1px solid " +
        color +
        '55;padding:3px 10px;border-radius:12px;font-size:11px">' +
        label +
        "</span>"
    );
}

// ── View: WATCHLIST ───────────────────────────────────────────────────────────
// ── Watchlist Data ──────────────────────────────────────────────────────────
// Each entry: { t: "TMDB search title", y: year_hint, genre: "...", tmdbType: "movie"|"tv" }
// Grouped entries (bollywood actor lists) use { group: true, label, items: [] }
const WATCHLIST_DATA = {
    hollywood: [
        { t: "Nocturnal Animals", y: 2016, genre: "Thriller" },
        { t: "Jarhead", y: 2005, genre: "War/Drama" },
        { t: "Goodfellas", y: 1990, genre: "Crime/Drama" },
        { t: "The Machinist", y: 2004, genre: "Psychological Thriller" },
        { t: "Taxi Driver", y: 1976, genre: "Crime/Drama" },
        { t: "The Basketball Diaries", y: 1995, genre: "Drama" },
        { t: "The Prestige", y: 2006, genre: "Mystery/Thriller" },
        { t: "Brothers", y: 2009, genre: "Drama/War" },
        { t: "Nightcrawler", y: 2014, genre: "Thriller" },
        { t: "Interstellar", y: 2014, genre: "Sci-Fi/Drama" },
        { t: "Black Swan", y: 2010, genre: "Psychological Thriller" },
        { t: "Whiplash", y: 2014, genre: "Drama/Music" },
        {
            t: "Eternal Sunshine of the Spotless Mind",
            y: 2004,
            genre: "Romance/Sci-Fi",
        },
        { t: "Oldboy", y: 2003, genre: "Mystery/Thriller" },
        { t: "The Kissing Booth", y: 2018, genre: "Romance/Comedy" },
        { t: "Rocky", y: 1976, genre: "Sports/Drama" },
        { t: "The Butterfly Effect", y: 2004, genre: "Sci-Fi/Thriller" },
        { t: "Stuart Little", y: 1999, genre: "Family/Comedy" },
        { t: "Crazy Stupid Love", y: 2011, genre: "Romance/Comedy" },
        { t: "Detachment", y: 2011, genre: "Drama" },
        { t: "Jumanji", y: 1995, genre: "Adventure/Fantasy" },
        { t: "Jurassic Park", y: 1993, genre: "Sci-Fi/Adventure" },
        { t: "The Matrix", y: 1999, genre: "Sci-Fi/Action" },
        { t: "American Psycho", y: 2000, genre: "Thriller" },
        { t: "The Social Network", y: 2010, genre: "Drama/Biography" },
        { t: "The Man Who Knew Infinity", y: 2015, genre: "Drama/Biography" },
        { t: "The Wolf of Wall Street", y: 2013, genre: "Crime/Drama" },
        { t: "Man of Steel", y: 2013, genre: "Action/Superhero" },
        { t: "Spider-Man", y: 2002, genre: "Superhero" },
        {
            t: "Spider-Man Into the Spider-Verse",
            y: 2018,
            genre: "Animation/Superhero",
        },
        { t: "Spider-Man No Way Home", y: 2021, genre: "Superhero" },
        { t: "Iron Man", y: 2008, genre: "Superhero" },
        { t: "Thor Ragnarok", y: 2017, genre: "Superhero" },
        { t: "Avengers Infinity War", y: 2018, genre: "Superhero" },
        { t: "Avengers Endgame", y: 2019, genre: "Superhero" },
        { t: "Shazam", y: 2019, genre: "Superhero" },
        { t: "Nobody", y: 2021, genre: "Action/Thriller" },
        { t: "Catch Me If You Can", y: 2002, genre: "Crime/Drama" },
        { t: "Titanic", y: 1997, genre: "Romance/Drama" },
        { t: "Predestination", y: 2014, genre: "Sci-Fi/Thriller" },
        { t: "The Martian", y: 2015, genre: "Sci-Fi/Drama" },
        { t: "Hachi A Dog's Tale", y: 2009, genre: "Drama" },
        { t: "The Time Traveler's Wife", y: 2009, genre: "Romance/Sci-Fi" },
        { t: "The Imitation Game", y: 2014, genre: "Drama/Biography" },
        { t: "The Theory of Everything", y: 2014, genre: "Drama/Biography" },
        { t: "The Truman Show", y: 1998, genre: "Drama/Sci-Fi" },
        { t: "Yes Man", y: 2008, genre: "Comedy" },
        { t: "Liar Liar", y: 1997, genre: "Comedy" },
        { t: "Bruce Almighty", y: 2003, genre: "Comedy" },
        { t: "The Pursuit of Happyness", y: 2006, genre: "Drama/Biography" },
        { t: "Lucy", y: 2014, genre: "Sci-Fi/Action" },
        { t: "The 40-Year-Old Virgin", y: 2005, genre: "Comedy" },
        { t: "American Pie", y: 1999, genre: "Comedy" },
        { t: "Ted", y: 2012, genre: "Comedy" },
        { t: "Toy Story", y: 1995, genre: "Animation" },
        { t: "Kung Fu Panda", y: 2008, genre: "Animation/Action" },
        { t: "The Notebook", y: 2004, genre: "Romance/Drama" },
        { t: "Jerry Maguire", y: 1996, genre: "Drama/Romance" },
        { t: "No Strings Attached", y: 2011, genre: "Romance/Comedy" },
        { t: "Meet Joe Black", y: 1998, genre: "Romance/Drama" },
        { t: "Friends with Benefits", y: 2011, genre: "Romance/Comedy" },
        { t: "Notting Hill", y: 1999, genre: "Romance/Comedy" },
        { t: "8 Mile", y: 2002, genre: "Drama/Music" },
        { t: "The Big Sick", y: 2017, genre: "Romance/Comedy" },
        { t: "Forrest Gump", y: 1994, genre: "Drama" },
        { t: "Joker", y: 2019, genre: "Psychological Thriller" },
        { t: "Batman Begins", y: 2005, genre: "Superhero" },
        { t: "The Dark Knight Rises", y: 2012, genre: "Superhero" },
        { t: "John Wick", y: 2014, genre: "Action/Thriller" },
        { t: "Venom", y: 2018, genre: "Superhero" },
        { t: "Train to Busan", y: 2016, genre: "Horror/Action" },
        { t: "Revolutionary Road", y: 2008, genre: "Drama/Romance" },
        { t: "Life of Pi", y: 2012, genre: "Adventure/Drama" },
        { t: "The Station Agent", y: 2003, genre: "Drama/Indie" },
        { t: "Fight Club", y: 1999, genre: "Drama/Thriller" },
        { t: "The Shawshank Redemption", y: 1994, genre: "Drama" },
        { t: "The Founder", y: 2016, genre: "Drama/Biography" },
        { t: "Steve Jobs", y: 2015, genre: "Drama/Biography" },
        { t: "Crawl", y: 2019, genre: "Thriller/Horror" },
        { t: "In Time", y: 2011, genre: "Sci-Fi/Thriller" },
        { t: "The Dictator", y: 2012, genre: "Comedy" },
        { t: "17 Again", y: 2009, genre: "Comedy/Romance" },
        { t: "The Girl Next Door", y: 2004, genre: "Comedy/Romance" },
        { t: "Her", y: 2013, genre: "Sci-Fi/Romance" },
        { t: "Deadpool", y: 2016, genre: "Action/Comedy" },
        { t: "The Karate Kid", y: 2010, genre: "Action/Drama" },
        { t: "Kung Fu Hustle", y: 2004, genre: "Action/Comedy" },
        { t: "Aladdin", y: 2019, genre: "Animation/Fantasy" },
        { t: "Enter the Dragon", y: 1973, genre: "Martial Arts" },
        { t: "Ip Man", y: 2008, genre: "Martial Arts" },
        { t: "Ip Man 4 The Finale", y: 2019, genre: "Martial Arts" },
        { t: "Master Z Ip Man Legacy", y: 2018, genre: "Martial Arts" },
        { t: "Kung Fu Yoga", y: 2017, genre: "Martial Arts/Comedy" },
        {
            t: "Undisputed II Last Man Standing",
            y: 2006,
            genre: "Martial Arts",
        },
        { t: "Drunken Master", y: 1978, genre: "Martial Arts" },
        { t: "Snake in the Eagle's Shadow", y: 1978, genre: "Martial Arts" },
        { t: "Ong Bak", y: 2003, genre: "Martial Arts/Action" },
        { t: "Tarzan", y: 1999, genre: "Animation/Adventure" },
        { t: "The Jungle Book", y: 2016, genre: "Animation/Adventure" },
        { t: "Moana", y: 2016, genre: "Animation/Adventure" },
        { t: "The Good Dinosaur", y: 2015, genre: "Animation" },
        { t: "The Lion King", y: 1994, genre: "Animation" },
        { t: "Madagascar", y: 2005, genre: "Animation/Comedy" },
        { t: "Wreck-It Ralph", y: 2012, genre: "Animation/Comedy" },
        { t: "Despicable Me", y: 2010, genre: "Animation/Comedy" },
        { t: "Up", y: 2009, genre: "Animation/Drama" },
        { t: "Penguins of Madagascar", y: 2014, genre: "Animation/Comedy" },
        { t: "WALL-E", y: 2008, genre: "Animation/Sci-Fi" },
        { t: "Shrek", y: 2001, genre: "Animation/Comedy" },
        { t: "Hotel Transylvania", y: 2012, genre: "Animation/Comedy" },
        { t: "October Sky", y: 1999, genre: "Drama/Biography" },
    ],
    bollywood: [
        { t: "3 Idiots", y: 2009, genre: "Comedy/Drama" },
        { t: "Taare Zameen Par", y: 2007, genre: "Drama" },
        { t: "PK", y: 2014, genre: "Comedy/Drama" },
        { t: "Ghajini", y: 2008, genre: "Action/Thriller" },
        { t: "Dangal", y: 2016, genre: "Sports/Drama" },
        { t: "Lagaan", y: 2001, genre: "Sports/Drama" },
        { t: "Secret Superstar", y: 2017, genre: "Drama/Music" },
        { t: "Dhoom 3", y: 2013, genre: "Action/Thriller" },
        { t: "Dunki", y: 2023, genre: "Drama/Comedy" },
        { t: "Jawan", y: 2023, genre: "Action/Thriller" },
        { t: "Zero", y: 2018, genre: "Drama/Romance" },
        { t: "Jab Tak Hai Jaan", y: 2012, genre: "Romance/Drama" },
        { t: "Om Shanti Om", y: 2007, genre: "Drama/Romance" },
        { t: "Swades", y: 2004, genre: "Drama" },
        { t: "Veer-Zaara", y: 2004, genre: "Romance/Drama" },
        { t: "Main Hoon Na", y: 2004, genre: "Action/Romance" },
        { t: "Devdas", y: 2002, genre: "Romance/Drama" },
        { t: "Raees", y: 2017, genre: "Crime/Drama" },
        { t: "Fan", y: 2016, genre: "Thriller" },
        { t: "Darr", y: 1993, genre: "Thriller/Romance" },
        { t: "Baazigar", y: 1993, genre: "Thriller" },
        { t: "Koyla", y: 1997, genre: "Action/Drama" },
        { t: "Chennai Express", y: 2013, genre: "Action/Comedy" },
        { t: "My Name Is Khan", y: 2010, genre: "Drama" },
        { t: "Kick", y: 2014, genre: "Action/Comedy" },
        { t: "Bodyguard", y: 2011, genre: "Action/Romance" },
        { t: "Dabangg", y: 2010, genre: "Action/Comedy" },
        { t: "Tere Naam", y: 2003, genre: "Romance/Drama" },
        { t: "Bajrangi Bhaijaan", y: 2015, genre: "Drama/Adventure" },
        { t: "Sultan", y: 2016, genre: "Sports/Drama" },
        { t: "Hera Pheri", y: 2000, genre: "Comedy" },
        { t: "Phir Hera Pheri", y: 2006, genre: "Comedy" },
        { t: "Kesari", y: 2019, genre: "War/Drama" },
        { t: "Pad Man", y: 2018, genre: "Drama/Biography" },
        { t: "Rustom", y: 2016, genre: "Drama/Thriller" },
        { t: "OMG Oh My God", y: 2012, genre: "Comedy/Drama" },
        { t: "2.0", y: 2018, genre: "Sci-Fi/Action" },
        { t: "Laxmii", y: 2020, genre: "Horror/Comedy" },
        { t: "Jolly LLB", y: 2013, genre: "Drama/Comedy" },
        { t: "Drishyam", y: 2015, genre: "Thriller/Drama" },
        { t: "Drishyam 2", y: 2022, genre: "Thriller/Drama" },
        { t: "RRR", y: 2022, genre: "Action/Drama" },
        { t: "Singham", y: 2011, genre: "Action/Drama" },
        { t: "Simmba", y: 2018, genre: "Action/Drama" },
        { t: "Golmaal Fun Unlimited", y: 2006, genre: "Comedy" },
        { t: "Vaastav", y: 1999, genre: "Crime/Drama" },
        { t: "Munna Bhai MBBS", y: 2003, genre: "Comedy/Drama" },
        { t: "Sanju", y: 2018, genre: "Biography/Drama" },
        { t: "Shootout at Wadala", y: 2013, genre: "Crime/Action" },
        { t: "Koi Mil Gaya", y: 2003, genre: "Sci-Fi/Drama" },
        { t: "Krrish", y: 2006, genre: "Action/Superhero" },
        { t: "Krrish 3", y: 2013, genre: "Action/Superhero" },
        { t: "Kaabil", y: 2017, genre: "Thriller" },
        { t: "Super 30", y: 2019, genre: "Drama/Biography" },
        { t: "War", y: 2019, genre: "Action/Thriller" },
        { t: "Zindagi Na Milegi Dobara", y: 2011, genre: "Drama/Comedy" },
        { t: "Bhaag Milkha Bhaag", y: 2013, genre: "Sports/Biography" },
        { t: "Agnipath", y: 2012, genre: "Action/Crime" },
        { t: "DDLJ", y: 1995, genre: "Romance/Drama" },
        { t: "Sholay", y: 1975, genre: "Action/Drama" },
        { t: "Rajneeti", y: 2010, genre: "Political/Drama" },
        { t: "Robot Enthiran", y: 2010, genre: "Sci-Fi/Action" },
        { t: "Jailer", y: 2023, genre: "Action/Thriller" },
        { t: "Pushpa The Rise", y: 2021, genre: "Action/Crime" },
        { t: "Pushpa The Rule", y: 2024, genre: "Action/Crime" },
        { t: "Animal", y: 2023, genre: "Action/Drama" },
        { t: "Geetha Govindam", y: 2018, genre: "Romance/Comedy" },
        { t: "Kabir Singh", y: 2019, genre: "Romance/Drama" },
        { t: "Baahubali The Beginning", y: 2015, genre: "Action/Epic" },
        { t: "Baahubali The Conclusion", y: 2017, genre: "Action/Epic" },
        { t: "Magadheera", y: 2009, genre: "Action/Fantasy" },
        { t: "Baghi", y: 2016, genre: "Action" },
        { t: "Brahmastra", y: 2022, genre: "Fantasy/Action" },
        { t: "Mr. India", y: 1987, genre: "Sci-Fi/Action" },
        { t: "Stree", y: 2018, genre: "Horror/Comedy" },
        { t: "Andhadhun", y: 2018, genre: "Thriller" },
        { t: "Dream Girl", y: 2019, genre: "Comedy" },
        { t: "Vicky Donor", y: 2012, genre: "Comedy/Drama" },
        { t: "URI The Surgical Strike", y: 2019, genre: "War/Action" },
        { t: "Sam Bahadur", y: 2023, genre: "War/Biography" },
        { t: "Sardar Udham", y: 2021, genre: "Historical/Drama" },
        {
            t: "Scam 1992 Harshad Mehta",
            y: 2020,
            genre: "Biographical/Drama",
            tmdbType: "tv",
        },
        { t: "Gully Boy", y: 2019, genre: "Drama/Music" },
        { t: "Barfi", y: 2012, genre: "Romance/Comedy" },
        { t: "Rockstar", y: 2011, genre: "Drama/Music" },
        { t: "Bajirao Mastani", y: 2015, genre: "Historical/Romance" },
        { t: "Natsamrat", y: 2016, genre: "Drama" },
        { t: "Raanjhanaa", y: 2013, genre: "Romance/Drama" },
        { t: "Sita Ramam", y: 2022, genre: "Romance/Drama" },
        { t: "Thiruchitrambalam", y: 2022, genre: "Romance/Drama" },
        { t: "Aparichit Anniyan", y: 2005, genre: "Thriller/Action" },
        { t: "Lucky Bhaskar", y: 2024, genre: "Crime/Thriller" },
        { t: "777 Charlie", y: 2022, genre: "Drama/Adventure" },
        { t: "Luka Chuppi", y: 2019, genre: "Romance/Comedy" },
        { t: "Badrinath Ki Dulhania", y: 2017, genre: "Romance/Comedy" },
        { t: "Sui Dhaaga", y: 2018, genre: "Drama" },
        { t: "Rab Ne Bana Di Jodi", y: 2008, genre: "Romance/Comedy" },
        { t: "Raazi", y: 2018, genre: "Thriller/Drama" },
        { t: "English Vinglish", y: 2012, genre: "Drama/Comedy" },
        { t: "Bareilly Ki Barfi", y: 2017, genre: "Romance/Comedy" },
        { t: "Badhaai Do", y: 2022, genre: "Comedy/Drama" },
        { t: "Shaadi Mein Zaroor Aana", y: 2017, genre: "Romance/Drama" },
        { t: "Rocket Singh", y: 2009, genre: "Drama/Comedy" },
        { t: "Chandu Champion", y: 2024, genre: "Sports/Biography" },
        { t: "Soorma", y: 2018, genre: "Sports/Biography" },
        { t: "Student of the Year", y: 2012, genre: "Romance/Drama" },
        { t: "Chandigarh Kare Aashiqui", y: 2021, genre: "Romance/Drama" },
        { t: "Mission Majnu", y: 2023, genre: "Spy/Thriller" },
        { t: "Bhagat Singh The Legend", y: 2002, genre: "Historical/Drama" },
        { t: "Satyameva Jayate", y: 2018, genre: "Action" },
        { t: "Ek Villain", y: 2014, genre: "Action/Thriller" },
        { t: "Dishoom", y: 2016, genre: "Action/Comedy" },
        { t: "ABCD Any Body Can Dance", y: 2013, genre: "Dance/Drama" },
        { t: "Shiddat", y: 2021, genre: "Romance/Drama" },
        { t: "Table No. 21", y: 2013, genre: "Thriller" },
        {
            t: "Psycho Raman Raman Raghav 2.0",
            y: 2016,
            genre: "Crime/Thriller",
        },
        { t: "Blackmail", y: 2018, genre: "Dark Comedy/Thriller" },
        { t: "Freddy", y: 2022, genre: "Thriller" },
        { t: "Thackeray", y: 2019, genre: "Biography/Drama" },
        { t: "Munna Michael", y: 2017, genre: "Dance/Action" },
        {
            t: "Teri Baaton Mein Aisa Uljha Jiya",
            y: 2024,
            genre: "Romance/Sci-Fi",
        },
        {
            t: "Kartik Calling Kartik",
            y: 2010,
            genre: "Psychological Thriller",
        },
        { t: "Zero Bollywood", y: 2018, genre: "Romance/Drama" },
        { t: "Ra.One", y: 2011, genre: "Sci-Fi/Action" },
        { t: "Bhavesh Joshi Superhero", y: 2018, genre: "Superhero/Action" },
        { t: "A Flying Jatt", y: 2016, genre: "Superhero/Action" },
        { t: "Mela", y: 2000, genre: "Action/Drama" },
        { t: "Rowdy Rathore", y: 2012, genre: "Action/Comedy" },
        {
            t: "Holiday A Soldier Is Never Off Duty",
            y: 2014,
            genre: "Action/Thriller",
        },
        { t: "Kesari", y: 2019, genre: "War/Drama" },
        { t: "Boss", y: 2013, genre: "Action/Drama" },
        { t: "Khiladi 786", y: 2012, genre: "Action/Comedy" },
        { t: "Desi Boyz", y: 2011, genre: "Comedy/Drama" },
    ],
    tvshows: [
        {
            t: "Game of Thrones",
            y: 2011,
            genre: "Fantasy/Drama",
            tmdbType: "tv",
        },
        { t: "Breaking Bad", y: 2008, genre: "Crime/Drama", tmdbType: "tv" },
        { t: "Sex Education", y: 2019, genre: "Comedy/Drama", tmdbType: "tv" },
        { t: "Money Heist", y: 2017, genre: "Crime/Thriller", tmdbType: "tv" },
        { t: "Barry", y: 2018, genre: "Dark Comedy", tmdbType: "tv" },
        {
            t: "The Boys",
            y: 2019,
            genre: "Superhero/Dark Comedy",
            tmdbType: "tv",
        },
        {
            t: "Squid Game",
            y: 2021,
            genre: "Thriller/Survival",
            tmdbType: "tv",
        },
        {
            t: "Alice in Borderland",
            y: 2020,
            genre: "Sci-Fi/Thriller",
            tmdbType: "tv",
        },
        { t: "The Queen's Gambit", y: 2020, genre: "Drama", tmdbType: "tv" },
        { t: "13 Reasons Why", y: 2017, genre: "Drama", tmdbType: "tv" },
        { t: "You", y: 2018, genre: "Psychological Thriller", tmdbType: "tv" },
        { t: "Dexter", y: 2006, genre: "Crime/Thriller", tmdbType: "tv" },
        {
            t: "Moon Knight",
            y: 2022,
            genre: "Marvel/Superhero",
            tmdbType: "tv",
        },
        { t: "Loki", y: 2021, genre: "Marvel/Superhero", tmdbType: "tv" },
        { t: "Mirzapur", y: 2018, genre: "Crime/Drama", tmdbType: "tv" },
        { t: "Bandish Bandits", y: 2020, genre: "Music/Drama", tmdbType: "tv" },
        { t: "The Penguin", y: 2024, genre: "Crime/Drama", tmdbType: "tv" },
        { t: "Taza Khabar", y: 2023, genre: "Comedy/Drama", tmdbType: "tv" },
        {
            t: "Prison Break",
            y: 2005,
            genre: "Action/Thriller",
            tmdbType: "tv",
        },
        { t: "Kota Factory", y: 2019, genre: "Drama", tmdbType: "tv" },
        { t: "The Pitchers", y: 2015, genre: "Startup/Drama", tmdbType: "tv" },
        {
            t: "Scam 1992",
            y: 2020,
            genre: "Biographical/Drama",
            tmdbType: "tv",
        },
        { t: "Farzi", y: 2023, genre: "Crime/Thriller", tmdbType: "tv" },
        { t: "TVF Aspirants", y: 2021, genre: "Slice of Life", tmdbType: "tv" },
        { t: "Lupin", y: 2021, genre: "Crime/Mystery", tmdbType: "tv" },
        {
            t: "Black Mirror",
            y: 2011,
            genre: "Sci-Fi/Anthology",
            tmdbType: "tv",
        },
        {
            t: "A Knight of the Seven Kingdoms",
            y: 2024,
            genre: "Fantasy/Drama",
            tmdbType: "tv",
        },
        { t: "12 Angry Men", y: 1957, genre: "Drama/Classic" },
        { t: "Supersex", y: 2024, genre: "Drama", tmdbType: "tv" },
        { t: "CA Topper", y: 2023, genre: "Drama", tmdbType: "tv" },
    ],
    anime: [
        {
            t: "Death Note",
            y: 2006,
            genre: "Thriller/Psychological",
            tmdbType: "tv",
        },
        { t: "Dororo", y: 2019, genre: "Action/Historical", tmdbType: "tv" },
        { t: "One Punch Man", y: 2015, genre: "Action/Comedy", tmdbType: "tv" },
        { t: "Monster", y: 2004, genre: "Thriller/Mystery", tmdbType: "tv" },
        {
            t: "My Dress-Up Darling",
            y: 2022,
            genre: "Romance/Slice of Life",
            tmdbType: "tv",
        },
        {
            t: "Tomodachi Game",
            y: 2022,
            genre: "Psychological Thriller",
            tmdbType: "tv",
        },
        { t: "Naruto", y: 2002, genre: "Action/Adventure", tmdbType: "tv" },
        {
            t: "Naruto Shippuden",
            y: 2007,
            genre: "Action/Adventure",
            tmdbType: "tv",
        },
        {
            t: "Chainsaw Man",
            y: 2022,
            genre: "Action/Dark Fantasy",
            tmdbType: "tv",
        },
        { t: "Lookism", y: 2022, genre: "Action/Drama", tmdbType: "tv" },
        {
            t: "Komi Can't Communicate",
            y: 2021,
            genre: "Romance/Comedy",
            tmdbType: "tv",
        },
        {
            t: "ReLIFE",
            y: 2016,
            genre: "Romance/Slice of Life",
            tmdbType: "tv",
        },
        {
            t: "Jujutsu Kaisen",
            y: 2020,
            genre: "Action/Dark Fantasy",
            tmdbType: "tv",
        },
        {
            t: "Solo Leveling",
            y: 2024,
            genre: "Action/Fantasy",
            tmdbType: "tv",
        },
        {
            t: "Devilman Crybaby",
            y: 2018,
            genre: "Dark Fantasy/Horror",
            tmdbType: "tv",
        },
        {
            t: "Classroom of the Elite",
            y: 2017,
            genre: "Drama · dropped",
            tmdbType: "tv",
        },
        {
            t: "Fullmetal Alchemist Brotherhood",
            y: 2009,
            genre: "Action/Adventure · dropped",
            tmdbType: "tv",
        },
        { t: "Your Name", y: 2016, genre: "Romance/Fantasy" },
        { t: "A Silent Voice", y: 2016, genre: "Drama/Romance" },
        {
            t: "Attack on Titan",
            y: 2013,
            genre: "Action/Dark Fantasy",
            tmdbType: "tv",
        },
        {
            t: "Tokyo Revengers",
            y: 2021,
            genre: "Action/Drama",
            tmdbType: "tv",
        },
        { t: "Erased", y: 2016, genre: "Mystery/Thriller", tmdbType: "tv" },
        {
            t: "Summertime Rendering",
            y: 2022,
            genre: "Mystery/Thriller",
            tmdbType: "tv",
        },
        {
            t: "Baki Hanma",
            y: 2021,
            genre: "Action/Martial Arts",
            tmdbType: "tv",
        },
        { t: "I Want to Eat Your Pancreas", y: 2018, genre: "Drama/Romance" },
        {
            t: "Yamada-kun and the Seven Witches",
            y: 2015,
            genre: "Romance/Comedy",
            tmdbType: "tv",
        },
    ],
};

// ── TMDB fetch helper ────────────────────────────────────────────────────────
async function tmdbSearch(item) {
    const key = item.t + (item.y || "");
    if (tmdbCache[key] !== undefined) return tmdbCache[key];

    const type = item.tmdbType || "movie";
    const query = encodeURIComponent(item.t);
    const yearParam = item.y
        ? `&${type === "movie" ? "year" : "first_air_date_year"}=${item.y}`
        : "";
    const url = `https://api.themoviedb.org/3/search/${type}?query=${query}${yearParam}&page=1`;

    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${TMDB_TOKEN}`,
                accept: "application/json",
            },
        });
        if (!res.ok) {
            tmdbCache[key] = null;
            return null;
        }
        const data = await res.json();
        const result = data.results && data.results[0] ? data.results[0] : null;
        tmdbCache[key] = result;
        return result;
    } catch (e) {
        tmdbCache[key] = null;
        return null;
    }
}

// ── Watchlist terminal view ──────────────────────────────────────────────────
function watchlist() {
    blank();
    line(`  <span class="section-header">Rohan's Watched List</span>`);
    line(
        `  <span class="c-dim">Everything I've actually watched. Not a recommendation list — a done list.</span>`,
    );
    blank();

    const categories = [
        ["hollywood", "🎬 Hollywood", "c-yellow"],
        ["bollywood", "🎥 Bollywood", "c-orange"],
        ["tvshows", "📺 TV Shows / Series", "c-blue"],
        ["anime", "🎌 Anime", "c-red"],
    ];

    categories.forEach(([key, label, cls]) => {
        const count = WATCHLIST_DATA[key].length;
        line(
            `  <span class="c-dim">── ${label} <span class="c-dim">(${count})</span> ───────────────────────────────</span>`,
        );
        blank();
        WATCHLIST_DATA[key].forEach((item) => {
            const row = document.createElement("div");
            row.className = "watchlist-item fade-in";
            row.innerHTML = `
                <div class="watchlist-title"><span class="${cls}">▸</span> <span class="c-white">${item.t}</span> <span class="c-dim" style="font-size:10px">${item.y || ""}</span></div>
                <div class="watchlist-meta">${item.genre}</div>`;
            body.appendChild(row);
        });
        blank();
    });

    const total = Object.values(WATCHLIST_DATA).reduce(
        (s, a) => s + a.length,
        0,
    );
    line(
        `  <span class="c-dim">── Total: <span class="c-green">${total} titles</span> ─────── <span class="c-blue">Open dock Watchlist for poster view 🎬</span></span>`,
    );
    blank();
    line(
        `  <span class="c-dim"># Type <span class="c-orange">menu</span> to go back.</span>`,
    );
    blank();
}

// ── Watchlist GUI App (TMDB poster grid) ────────────────────────────────────
function renderWatchlistApp() {
    const root = document.getElementById("wl-root");
    if (!root) return;

    const total = Object.values(WATCHLIST_DATA).reduce(
        (s, a) => s + a.length,
        0,
    );
    const badge = document.getElementById("wl-total-badge");
    if (badge) badge.textContent = total + " titles";

    const tabDefs = [
        ["hollywood", "🎬 Hollywood"],
        ["bollywood", "🎥 Bollywood"],
        ["tvshows", "📺 TV Shows"],
        ["anime", "🎌 Anime"],
        ["all", "✦ All"],
    ];

    let activeTab = "hollywood";
    let searchQ = "";

    const tabsEl = document.getElementById("wl-tabs");
    const gridEl = document.getElementById("wl-grid");
    const searchEl = document.getElementById("wl-search");

    // Build tabs
    function buildTabs() {
        tabsEl.innerHTML = "";
        tabDefs.forEach(([key, label]) => {
            const count =
                key === "all"
                    ? Object.values(WATCHLIST_DATA).reduce(
                          (s, a) => s + a.length,
                          0,
                      )
                    : WATCHLIST_DATA[key].length;
            const btn = document.createElement("button");
            btn.className =
                "wl-tab" + (key === activeTab ? " wl-tab-active" : "");
            btn.innerHTML = `${label} <span style="opacity:0.5;font-size:9px">${count}</span>`;
            btn.onclick = () => {
                activeTab = key;
                searchEl.value = "";
                searchQ = "";
                buildTabs();
                renderGrid();
            };
            tabsEl.appendChild(btn);
        });
    }

    // Get filtered items
    function getItems() {
        const items =
            activeTab === "all"
                ? Object.values(WATCHLIST_DATA).flat()
                : WATCHLIST_DATA[activeTab];
        if (!searchQ) return items;
        const q = searchQ.toLowerCase();
        return items.filter(
            (i) =>
                i.t.toLowerCase().includes(q) ||
                (i.genre || "").toLowerCase().includes(q),
        );
    }

    // Render the grid with TMDB posters
    async function renderGrid() {
        const items = getItems();
        gridEl.innerHTML = "";

        if (items.length === 0) {
            gridEl.innerHTML = `<div style="color:var(--dim);text-align:center;padding:40px;font-size:12px">No results for "${escHtml(searchQ)}"</div>`;
            return;
        }

        // Create skeleton cards first
        const cardEls = items.map((item, i) => {
            const card = document.createElement("div");
            card.className = "wl-card wl-skeleton";
            card.dataset.idx = i;
            gridEl.appendChild(card);
            return card;
        });

        // Fetch TMDB data in batches of 6 to avoid rate-limiting
        const BATCH = 6;
        for (let i = 0; i < items.length; i += BATCH) {
            const batch = items.slice(i, i + BATCH);
            const results = await Promise.all(
                batch.map((item) => tmdbSearch(item)),
            );
            results.forEach((result, j) => {
                const item = batch[j];
                const card = cardEls[i + j];
                if (!card) return;
                card.classList.remove("wl-skeleton");
                populateCard(card, item, result);
            });
        }
    }

    function populateCard(card, item, tmdb) {
        const poster =
            tmdb && tmdb.poster_path ? TMDB_IMG + tmdb.poster_path : null;
        const title = tmdb ? tmdb.title || tmdb.name : item.t;
        const year = tmdb
            ? (tmdb.release_date || tmdb.first_air_date || "").slice(0, 4)
            : item.y || "";
        const rating =
            tmdb && tmdb.vote_average ? tmdb.vote_average.toFixed(1) : null;
        const overview =
            tmdb && tmdb.overview
                ? tmdb.overview.slice(0, 100) +
                  (tmdb.overview.length > 100 ? "..." : "")
                : "";
        const dropped = item.genre && item.genre.includes("dropped");

        card.innerHTML = `
            <div class="wl-poster-wrap">
                ${
                    poster
                        ? `<img class="wl-poster" src="${poster}" alt="${escHtml(title)}" loading="lazy" />`
                        : `<div class="wl-poster-placeholder"><span>${escHtml(item.t.slice(0, 2).toUpperCase())}</span></div>`
                }
                ${rating ? `<div class="wl-rating">⭐ ${rating}</div>` : ""}
                ${dropped ? `<div class="wl-dropped">dropped</div>` : ""}
                <div class="wl-card-info">
                    <div class="wl-card-title" title="${escHtml(title)}">${escHtml(title)}</div>
                    <div class="wl-card-meta">${escHtml(item.genre.replace(" · dropped", ""))} ${year ? `· ${year}` : ""}</div>
                </div>
            </div>`;

        // Click to open detail modal
        if (tmdb && tmdb.id) {
            card.style.cursor = "pointer";
            card.onclick = () => openWlModal(item, tmdb);
        }
    }

    // ── Detail modal ──────────────────────────────────────────────────────────
    async function openWlModal(item, tmdb) {
        const modal = document.getElementById("wl-modal");
        if (!modal) return;

        const type = item.tmdbType || "movie";
        const title = tmdb.title || tmdb.name || item.t;
        const year = (tmdb.release_date || tmdb.first_air_date || "").slice(
            0,
            4,
        );
        const poster = tmdb.poster_path ? TMDB_IMG + tmdb.poster_path : null;
        const backdrop = tmdb.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${tmdb.backdrop_path}`
            : null;
        const rating = tmdb.vote_average ? tmdb.vote_average.toFixed(1) : null;
        const voteCount = tmdb.vote_count
            ? tmdb.vote_count.toLocaleString()
            : null;
        const overview = tmdb.overview || "No overview available.";
        const dropped = item.genre && item.genre.includes("dropped");
        const genreLabel = item.genre
            ? item.genre.replace(" · dropped", "")
            : "";

        // Show modal with loading state first
        modal.className = "open";
        modal.innerHTML = `
            ${
                backdrop
                    ? `<img class="wl-modal-backdrop" src="${backdrop}" alt="" />`
                    : `<div class="wl-modal-backdrop-placeholder"></div>`
            }
            <div class="wl-modal-hero">
                ${
                    poster
                        ? `<img class="wl-modal-poster" src="${poster}" alt="${escHtml(title)}" />`
                        : `<div class="wl-modal-poster-placeholder">${escHtml(item.t.slice(0, 2).toUpperCase())}</div>`
                }
                <div class="wl-modal-titles">
                    <div class="wl-modal-title">${escHtml(title)}</div>
                    <div class="wl-modal-tagline" id="wl-modal-tagline" style="color:var(--dim);font-size:11px;font-style:italic;margin-bottom:6px"></div>
                    <div class="wl-modal-chips">
                        ${year ? `<span class="wl-modal-chip">${year}</span>` : ""}
                        ${rating ? `<span class="wl-modal-chip orange">⭐ ${rating}</span>` : ""}
                        ${dropped ? `<span class="wl-modal-chip" style="border-color:#ef2929;color:#ef2929;background:rgba(239,41,41,0.1)">dropped</span>` : ""}
                        <span class="wl-modal-chip">${type === "tv" ? "TV Show" : "Movie"}</span>
                        ${genreLabel ? `<span class="wl-modal-chip">${escHtml(genreLabel)}</span>` : ""}
                    </div>
                </div>
            </div>
            <div class="wl-modal-body">
                <div class="wl-modal-stats">
                    ${rating ? `<div class="wl-modal-stat"><span class="wl-modal-stat-label">Rating</span><span class="wl-modal-stat-value">⭐ ${rating} / 10</span></div>` : ""}
                    ${voteCount ? `<div class="wl-modal-stat"><span class="wl-modal-stat-label">Votes</span><span class="wl-modal-stat-value">${voteCount}</span></div>` : ""}
                    ${year ? `<div class="wl-modal-stat"><span class="wl-modal-stat-label">Year</span><span class="wl-modal-stat-value">${year}</span></div>` : ""}
                    <div class="wl-modal-stat" id="wl-modal-runtime"><span class="wl-modal-stat-label">Runtime</span><span class="wl-modal-stat-value">—</span></div>
                    <div class="wl-modal-stat" id="wl-modal-status"><span class="wl-modal-stat-label">Status</span><span class="wl-modal-stat-value">—</span></div>
                </div>
                <p class="wl-modal-overview">${escHtml(overview)}</p>
                <div class="wl-modal-actions">
                    <button class="wl-modal-back" onclick="document.getElementById('wl-modal').className=''">← Back to list</button>
                    <a class="wl-modal-tmdb" href="https://www.themoviedb.org/${type}/${tmdb.id}" target="_blank" rel="noopener">TMDB ↗</a>
                </div>
            </div>`;

        // Fetch full detail for runtime, tagline, status
        try {
            const res = await fetch(
                `https://api.themoviedb.org/3/${type}/${tmdb.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${TMDB_TOKEN}`,
                        accept: "application/json",
                    },
                },
            );
            if (res.ok) {
                const d = await res.json();
                const taglineEl = document.getElementById("wl-modal-tagline");
                const runtimeEl = document.getElementById("wl-modal-runtime");
                const statusEl = document.getElementById("wl-modal-status");
                if (taglineEl && d.tagline)
                    taglineEl.textContent = `"${d.tagline}"`;
                if (runtimeEl) {
                    const mins =
                        d.runtime ||
                        (d.episode_run_time && d.episode_run_time[0]);
                    runtimeEl.innerHTML = `<span class="wl-modal-stat-label">Runtime</span><span class="wl-modal-stat-value">${mins ? `${mins} min` : "—"}</span>`;
                }
                if (statusEl && d.status) {
                    statusEl.innerHTML = `<span class="wl-modal-stat-label">Status</span><span class="wl-modal-stat-value">${escHtml(d.status)}</span>`;
                }
                // Update genre chips if TMDB has them
                if (d.genres && d.genres.length) {
                    const chipsEl = modal.querySelector(".wl-modal-chips");
                    if (chipsEl) {
                        const existing = chipsEl.innerHTML;
                        const genreChips = d.genres
                            .slice(0, 3)
                            .map(
                                (g) =>
                                    `<span class="wl-modal-chip">${escHtml(g.name)}</span>`,
                            )
                            .join("");
                        // Replace the plain genre chip with real TMDB genres
                        chipsEl.innerHTML = existing.replace(
                            genreLabel
                                ? `<span class="wl-modal-chip">${escHtml(genreLabel)}</span>`
                                : "",
                            genreChips,
                        );
                    }
                }
            }
        } catch (_) {}
    }

    // Search handler
    if (searchEl) {
        searchEl.addEventListener("input", () => {
            searchQ = searchEl.value.trim();
            renderGrid();
        });
        searchEl.addEventListener("keydown", (e) => e.stopPropagation());
    }

    buildTabs();
    renderGrid();
}

async function boot() {
    const bootLines = [
        {
            txt: "Rohan Unbeg — Backend Developer & Open Source Contributor",
            cls: "c-orange bold",
        },
        {
            txt: "Ubuntu portfolio OS 24.04 LTS — initializing...",
            cls: "c-dim",
            delay: 120,
        },
        {
            txt: "Loading: [python] [typescript] [gcp] [apache-beam]",
            cls: "c-dim",
            delay: 250,
        },
        {
            txt: "Mounting: ./projects ./experience ./contact",
            cls: "c-dim",
            delay: 380,
        },
        {
            txt: "✓ Ready. Type 'menu' to navigate or click the tabs above.",
            cls: "c-green bold",
            delay: 500,
        },
    ];

    for (const l of bootLines) {
        if (l.delay) await sleep(l.delay);
        line(`  <span class="${l.cls}">${l.txt}</span>`);
    }

    await sleep(700);
    render("menu");
    bootDone = true;
    input.focus();
    renderDesktopIcons();

    // Start guided tour for first-time visitors
    try {
        if (!localStorage.getItem("pf_toured")) {
            await sleep(600);
            startTour();
        }
    } catch (e) {}
}

function renderDesktopIcons() {
    const container = document.getElementById("desktop-icons");
    if (!container) return;
    // Consistent icon style: rx=8 rounded square, same as dock
    const items = [
        {
            name: "About Me",
            cmd: "openGuiViewer('about')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#1e3a5f"/><circle cx="18" cy="13" r="5" fill="#60a5fa"/><path d="M8 28 Q8 21 18 21 Q28 21 28 28" fill="#3b82f6"/></svg>',
        },
        {
            name: "Projects",
            cmd: "toggleApp('explorer')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#92400e"/><path d="M6 14 Q6 10 10 10 L15 10 L17 13 L28 13 Q30 13 30 15 L30 28 Q30 30 28 30 L8 30 Q6 30 6 28 Z" fill="#fbbf24"/><path d="M6 17 L30 17 L30 28 Q30 30 28 30 L8 30 Q6 30 6 28 Z" fill="#fde68a"/></svg>',
        },
        {
            name: "Skills",
            cmd: "openGuiViewer('skills')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#1e1b4b"/><rect x="5" y="22" width="5" height="10" rx="2" fill="#e95420"/><rect x="13" y="16" width="5" height="16" rx="2" fill="#7c3aed"/><rect x="21" y="11" width="5" height="21" rx="2" fill="#059669"/><rect x="29" y="18" width="4" height="14" rx="2" fill="#f59e0b"/></svg>',
        },
        {
            name: "Experience",
            cmd: "openGuiViewer('experience')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#2e1065"/><rect x="5" y="15" width="26" height="16" rx="3" fill="#7c3aed"/><rect x="12" y="11" width="12" height="6" rx="2" fill="#a78bfa" stroke="#7c3aed" stroke-width="1.5"/><line x1="12" y1="22" x2="24" y2="22" stroke="#fff" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/></svg>',
        },
        {
            name: "Contact",
            cmd: "openGuiViewer('contact')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#0c4a6e"/><rect x="4" y="10" width="28" height="18" rx="3" fill="#0ea5e9"/><path d="M4 14 L18 22 L32 14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
        },
        {
            name: "Resume.pdf",
            cmd: "openApp('pdf')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#7f1d1d"/><path d="M9 5 L23 5 L27 9 L27 31 L9 31 Z" fill="#fff" opacity="0.95"/><path d="M23 5 L23 9 L27 9 Z" fill="#fca5a5"/><text x="18" y="22" text-anchor="middle" font-size="6.5" font-weight="900" fill="#991b1b" font-family="monospace">PDF</text></svg>',
        },
        {
            name: "SugarSync",
            cmd: "openApp('sugarsync')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#14532d"/><circle cx="18" cy="18" r="10" fill="#16a34a"/><path d="M13 18 Q13 12 18 12 Q22 12 23 16" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M23 18 Q23 24 18 24 Q14 24 13 20" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><polyline points="22,13 22,16 25,16" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        },
        {
            name: "Watchlist",
            cmd: "openApp('watchlist')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#4c1d95"/><rect x="9" y="18" width="18" height="12" rx="3" fill="#fbbf24"/><circle cx="13" cy="15" r="3.5" fill="#f87171"/><circle cx="23" cy="15" r="3.5" fill="#f87171"/><circle cx="18" cy="11" r="3.5" fill="#f87171"/></svg>',
        },
        {
            name: "GitHub",
            cmd: "window.open('https://github.com/rohan-unbeg','_blank')",
            icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="8" fill="#161b22"/><path d="M18 6C11.37 6 6 11.37 6 18c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.17c-3.34.73-4.04-1.44-4.04-1.44-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.3 3.49.99.1-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C26.56 27.8 30 23.3 30 18c0-6.63-5.37-12-12-12Z" fill="#fff"/></svg>',
        },
    ];
    let html = "";
    items.forEach((i) => {
        html +=
            '<div class="desktop-icon" ondblclick="' + i.cmd + '" onclick="selectDesktopIcon(this)" title="' + i.name + '">' +
            '<div class="desktop-icon-img">' + i.icon + "</div>" +
            '<div class="desktop-icon-name">' + i.name + "</div>" +
            "</div>";
    });
    container.innerHTML = html;
}

function selectDesktopIcon(el) {
    document.querySelectorAll(".desktop-icon").forEach(e => e.classList.remove("selected"));
    el.classList.add("selected");
}

// ── App Drawer (Ubuntu Activities) ────────────────────────────────────────────
const APP_DRAWER_ITEMS = [
    { name: "Terminal",   icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#1c1c2e"/><polyline points="8,24 15,18 8,12" fill="none" stroke="#4ac94a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="17" y1="24" x2="28" y2="24" stroke="#4ac94a" stroke-width="2.5" stroke-linecap="round"/></svg>',   action: () => toggleApp("terminal") },
    { name: "Explorer",   icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#92400e"/><path d="M6 14 Q6 10 10 10 L15 10 L17 13 L28 13 Q30 13 30 15 L30 28 Q30 30 28 30 L8 30 Q6 30 6 28 Z" fill="#fbbf24"/><path d="M6 17 L30 17 L30 28 Q30 30 28 30 L8 30 Q6 30 6 28 Z" fill="#fde68a"/></svg>',   action: () => toggleApp("explorer") },
    { name: "Resume",     icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#7f1d1d"/><path d="M9 5 L23 5 L27 9 L27 31 L9 31 Z" fill="#fff" opacity="0.95"/><path d="M23 5 L23 9 L27 9 Z" fill="#fca5a5"/><text x="18" y="22" text-anchor="middle" font-size="6.5" font-weight="900" fill="#991b1b" font-family="monospace">PDF</text></svg>',   action: () => toggleApp("pdf") },
    { name: "SugarSync",  icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#14532d"/><circle cx="18" cy="18" r="10" fill="#16a34a"/><path d="M13 18 Q13 12 18 12 Q22 12 23 16" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M23 18 Q23 24 18 24 Q14 24 13 20" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><polyline points="22,13 22,16 25,16" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',  action: () => toggleApp("sugarsync") },
    { name: "Snake",      icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#14532d"/><path d="M8 22 Q8 28 13 28 L20 28 Q24 28 24 24 L24 20 Q24 16 20 16 L14 16 Q10 16 10 12 Q10 8 14 8 L24 8" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="8" r="2.5" fill="#4ade80"/></svg>',      action: () => toggleApp("snake") },
    { name: "Watchlist",  icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#4c1d95"/><rect x="9" y="18" width="18" height="12" rx="3" fill="#fbbf24"/><circle cx="13" cy="15" r="3.5" fill="#f87171"/><circle cx="23" cy="15" r="3.5" fill="#f87171"/><circle cx="18" cy="11" r="3.5" fill="#f87171"/></svg>',  action: () => toggleApp("watchlist") },
    { name: "About Me",   icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#1e3a5f"/><circle cx="18" cy="13" r="5" fill="#60a5fa"/><path d="M8 28 Q8 21 18 21 Q28 21 28 28" fill="#3b82f6"/></svg>',   action: () => openGuiViewer("about") },
    { name: "Skills",     icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#1e1b4b"/><rect x="5" y="22" width="5" height="10" rx="2" fill="#e95420"/><rect x="13" y="16" width="5" height="16" rx="2" fill="#7c3aed"/><rect x="21" y="11" width="5" height="21" rx="2" fill="#059669"/><rect x="29" y="18" width="4" height="14" rx="2" fill="#f59e0b"/></svg>',     action: () => openGuiViewer("skills") },
    { name: "Experience", icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#2e1065"/><rect x="5" y="15" width="26" height="16" rx="3" fill="#7c3aed"/><rect x="12" y="11" width="12" height="6" rx="2" fill="#a78bfa" stroke="#7c3aed" stroke-width="1.5"/></svg>', action: () => openGuiViewer("experience") },
    { name: "Contact",    icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#0c4a6e"/><rect x="4" y="10" width="28" height="18" rx="3" fill="#0ea5e9"/><path d="M4 14 L18 22 L32 14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',    action: () => openGuiViewer("contact") },
    { name: "GitHub",     icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#161b22"/><path d="M18 6C11.37 6 6 11.37 6 18c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.17c-3.34.73-4.04-1.44-4.04-1.44-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.3 3.49.99.1-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C26.56 27.8 30 23.3 30 18c0-6.63-5.37-12-12-12Z" fill="#fff"/></svg>',     action: () => window.open("https://github.com/rohan-unbeg","_blank") },
    { name: "LinkedIn",   icon: '<svg viewBox="0 0 36 36" width="48" height="48"><rect width="36" height="36" rx="8" fill="#0a66c2"/><rect x="7" y="14" width="5" height="15" rx="1" fill="#fff"/><circle cx="9.5" cy="9.5" r="2.8" fill="#fff"/><path d="M15 14 L15 29 L20 29 L20 21 Q20 18 23 18 Q26 18 26 21 L26 29 L31 29 L31 20 Q31 14 25 14 Q22 14 20 17 L20 14 Z" fill="#fff"/></svg>',   action: () => window.open("https://linkedin.com/in/rohanunbeg/","_blank") },
];

window.toggleAppDrawer = function() {
    const el = document.getElementById("app-drawer-overlay");
    if (!el) return;
    if (el.classList.contains("open")) {
        closeAppDrawer();
    } else {
        el.classList.add("open");
        buildAppDrawer("");
        setTimeout(() => {
            const s = document.getElementById("app-drawer-search");
            if (s) s.focus();
        }, 80);
    }
};

window.closeAppDrawer = function() {
    const el = document.getElementById("app-drawer-overlay");
    if (el) el.classList.remove("open");
};

function buildAppDrawer(query) {
    const grid = document.getElementById("app-drawer-grid");
    if (!grid) return;
    const q = (query || "").toLowerCase().trim();
    const items = q ? APP_DRAWER_ITEMS.filter(i => i.name.toLowerCase().includes(q)) : APP_DRAWER_ITEMS;
    grid.innerHTML = items.map(i =>
        `<div class="app-drawer-item" onclick="appDrawerLaunch(${APP_DRAWER_ITEMS.indexOf(i)})">
            <div class="app-drawer-item-icon">${i.icon}</div>
            <div class="app-drawer-item-name">${escHtml(i.name)}</div>
        </div>`
    ).join("");
}

window.appDrawerLaunch = function(idx) {
    closeAppDrawer();
    setTimeout(() => APP_DRAWER_ITEMS[idx].action(), 80);
};

// Wire up app drawer search
document.addEventListener("DOMContentLoaded", () => {
    const s = document.getElementById("app-drawer-search");
    if (s) {
        s.addEventListener("input", () => buildAppDrawer(s.value));
        s.addEventListener("keydown", e => {
            if (e.key === "Escape") closeAppDrawer();
            e.stopPropagation();
        });
    }
});

// Close app drawer when clicking backdrop
document.addEventListener("click", e => {
    const drawer = document.getElementById("app-drawer-overlay");
    if (drawer && drawer.classList.contains("open")) {
        if (e.target === drawer) closeAppDrawer();
    }
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        const drawer = document.getElementById("app-drawer-overlay");
        if (drawer && drawer.classList.contains("open")) { closeAppDrawer(); e.stopPropagation(); }
    }
});

function osUpdateClock() {
    const el = document.getElementById("os-clock");
    if (el) {
        const now = new Date();
        const str =
            now.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }) +
            " " +
            now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
        el.textContent = str;
    }
}
setInterval(osUpdateClock, 1000);
osUpdateClock();

// Initialize OS clock immediately (prevent stale hardcoded value flash)
try {
    const clockEl = document.getElementById("os-clock");
    if (clockEl && !clockEl.textContent) {
        const now = new Date();
        clockEl.textContent =
            now.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }) +
            " " +
            now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
    }
} catch (e) {}

// ── Real Battery & Network ────────────────────────────────────────────────
function updateBattery(battery) {
    const pct = Math.round(battery.level * 100);
    const charging = battery.charging;
    const textEl = document.getElementById("os-battery-text");
    const fillEl = document.getElementById("os-battery-fill");
    const indicator = document.getElementById("os-battery-indicator");
    if (textEl) textEl.textContent = (charging ? "⚡ " : "") + pct + "%";
    if (fillEl) {
        const w = Math.round((pct / 100) * 14);
        fillEl.setAttribute("width", w);
        fillEl.setAttribute(
            "fill",
            pct <= 20 ? "#ef2929" : pct <= 40 ? "#e9b96e" : "#4ac94a",
        );
    }
    if (indicator)
        indicator.title = (charging ? "Charging: " : "Battery: ") + pct + "%";
    battery.addEventListener("levelchange", function () {
        updateBattery(battery);
    });
    battery.addEventListener("chargingchange", function () {
        updateBattery(battery);
    });
}

if (navigator.getBattery) {
    navigator
        .getBattery()
        .then(updateBattery)
        .catch(function () {});
}

function updateNetworkStatus() {
    const textEl = document.getElementById("os-network-text");
    const indicator = document.getElementById("os-network-indicator");
    if (!textEl) return;
    const conn =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
    if (!navigator.onLine) {
        textEl.textContent = "Offline";
        if (indicator) indicator.style.opacity = "0.4";
    } else if (conn) {
        const type = conn.effectiveType || conn.type || "Wi-Fi";
        const map = {
            wifi: "Wi-Fi",
            "4g": "4G",
            "3g": "3G",
            "2g": "2G",
            ethernet: "LAN",
            "slow-2g": "2G",
        };
        textEl.textContent = map[type.toLowerCase()] || type;
        if (indicator) indicator.style.opacity = "1";
    } else {
        textEl.textContent = "Wi-Fi";
    }
}
updateNetworkStatus();
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

// ── Dock hover-reveal when hidden (maximized window) ────────────────────────
(function () {
    var dockRevealTimeout;
    document.addEventListener("mousemove", function (e) {
        var desktop = document.getElementById("os-desktop");
        if (!desktop || !desktop.classList.contains("dock-hidden")) return;
        var dock = desktop.querySelector(".os-dock");
        if (!dock) return;
        // Reveal dock when mouse is within 60px of bottom edge
        if (e.clientY >= window.innerHeight - 60) {
            dock.style.transform = "translateX(-50%) translateY(0)";
            dock.style.opacity = "1";
            dock.style.pointerEvents = "all";
            clearTimeout(dockRevealTimeout);
        } else {
            clearTimeout(dockRevealTimeout);
            dockRevealTimeout = setTimeout(function () {
                if (desktop.classList.contains("dock-hidden")) {
                    dock.style.transform = "";
                    dock.style.opacity = "";
                    dock.style.pointerEvents = "";
                }
            }, 600);
        }
    });
})();

function osToggleMenu() {
    const menu = document.getElementById("os-power-menu");
    if (menu) menu.classList.toggle("open");
    // Close calendar if open
    const cal = document.getElementById("os-calendar");
    if (cal) cal.classList.remove("open");
}

function toggleCalendar() {
    const cal = document.getElementById("os-calendar");
    if (!cal) return;
    cal.classList.toggle("open");
    // Always keep calendar above all windows
    cal.style.zIndex = 999999;
    // Close other menus
    const menu = document.getElementById("os-power-menu");
    if (menu) menu.classList.remove("open");

    if (cal.classList.contains("open")) {
        renderCalendar();
    }
}

function renderCalendar() {
    const cal = document.getElementById("os-calendar");
    const now = new Date();
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
    ).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay(); // 0=Sun

    let html = `
                <div class="cal-header">
                    <span>${monthNames[now.getMonth()]} ${now.getFullYear()}</span>
                </div>
                <div class="cal-grid">
                    <div class="cal-day-name">Su</div><div class="cal-day-name">Mo</div><div class="cal-day-name">Tu</div>
                    <div class="cal-day-name">We</div><div class="cal-day-name">Th</div><div class="cal-day-name">Fr</div><div class="cal-day-name">Sa</div>
            `;

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="cal-day empty"></div>`;
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === now.getDate() ? "today" : "";
        html += `<div class="cal-day ${isToday}">${i}</div>`;
    }

    html += `</div>`;
    cal.innerHTML = html;
}

// Close menus when clicking outside
document.addEventListener("click", (e) => {
    const menu = document.getElementById("os-power-menu");
    const btn = document.getElementById("os-menu-btn");
    const cal = document.getElementById("os-calendar");
    const clock = document.getElementById("os-clock");

    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("open");
    }
    if (cal && clock && !cal.contains(e.target) && !clock.contains(e.target)) {
        cal.classList.remove("open");
    }
});

// ── Snake App Logic ──────────────────────────────────────────────────────────
let snakeAppInterval;
let snakeAppKeyHandler;
function initSnakeApp() {
    const container = document.getElementById("snake-app-container");
    if (!container) return;
    container.innerHTML = "";

    const scoreEl = document.createElement("div");
    scoreEl.style.cssText =
        "text-align:center;color:#4ac94a;font-family:monospace;font-size:13px;margin-bottom:12px;";
    let highScore = 0;
    try {
        highScore = parseInt(localStorage.getItem("pf_snake_hi")) || 0;
    } catch (e) {}
    scoreEl.innerHTML =
        'Score: <b id="app-snk-score">0</b> | Speed: <b id="app-snk-speed">1x</b> | Best: <b id="app-snk-high">' +
        highScore +
        '</b><br><span style="color:#6a5572;font-size:10px;">Arrow Keys to play</span>';
    container.appendChild(scoreEl);

    const canvas = document.createElement("canvas");
    const SIZE = 360;
    const box = 20;
    const cols = Math.floor(SIZE / box);
    const rows = Math.floor(SIZE / box);
    canvas.width = cols * box;
    canvas.height = rows * box;
    canvas.style.cssText =
        "display:block;background:#000;border:2px solid #3a1a40;border-radius:4px;";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let snake = [
        { x: Math.floor(cols / 2) * box, y: Math.floor(rows / 2) * box },
    ];
    let food = randomFood(cols, rows, box, snake);
    let score = 0;
    let d = "RIGHT";
    let nextD = "RIGHT";
    let speed = 300;

    function randomFood(cols, rows, box, snake) {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * cols) * box,
                y: Math.floor(Math.random() * rows) * box,
            };
        } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
        return pos;
    }

    snakeAppKeyHandler = function (e) {
        const map = {
            ArrowLeft: "LEFT",
            ArrowUp: "UP",
            ArrowRight: "RIGHT",
            ArrowDown: "DOWN",
        };
        if (!map[e.key]) return;
        e.preventDefault();
        const opp = { LEFT: "RIGHT", RIGHT: "LEFT", UP: "DOWN", DOWN: "UP" };
        if (map[e.key] !== opp[d]) nextD = map[e.key];
    };
    document.addEventListener("keydown", snakeAppKeyHandler);

    function draw() {
        d = nextD;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let gx = 0; gx < cols; gx++) {
            for (let gy = 0; gy < rows; gy++) {
                ctx.fillStyle = "rgba(255,255,255,0.03)";
                ctx.fillRect(
                    gx * box + box / 2 - 1,
                    gy * box + box / 2 - 1,
                    2,
                    2,
                );
            }
        }

        ctx.fillStyle = "#ef2929";
        ctx.beginPath();
        ctx.roundRect(food.x + 3, food.y + 3, box - 6, box - 6, 3);
        ctx.fill();

        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle =
                i === 0 ? "#e95420" : i % 2 === 0 ? "#4ac94a" : "#3da83d";
            ctx.beginPath();
            ctx.roundRect(
                snake[i].x + 1,
                snake[i].y + 1,
                box - 2,
                box - 2,
                i === 0 ? 4 : 2,
            );
            ctx.fill();
        }

        let nx = snake[0].x;
        let ny = snake[0].y;
        if (d === "LEFT") nx -= box;
        if (d === "UP") ny -= box;
        if (d === "RIGHT") nx += box;
        if (d === "DOWN") ny += box;

        if (
            nx < 0 ||
            nx >= canvas.width ||
            ny < 0 ||
            ny >= canvas.height ||
            snake.slice(1).some((s) => s.x === nx && s.y === ny)
        ) {
            clearInterval(snakeAppInterval);
            snakeAppInterval = null;
            document.removeEventListener("keydown", snakeAppKeyHandler);

            // Save high score
            try {
                const prev = parseInt(localStorage.getItem("pf_snake_hi")) || 0;
                if (score > prev) {
                    localStorage.setItem("pf_snake_hi", score);
                    const hiEl = document.getElementById("app-snk-high");
                    if (hiEl) hiEl.textContent = score;
                }
            } catch (e) {}

            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ef2929";
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillStyle = "#fff";
            ctx.font = "14px monospace";
            ctx.fillText(
                "Score: " + score,
                canvas.width / 2,
                canvas.height / 2 + 20,
            );
            ctx.fillStyle = "#6a5572";
            ctx.font = "12px monospace";
            ctx.fillText(
                "Click to restart",
                canvas.width / 2,
                canvas.height / 2 + 42,
            );

            canvas.onclick = () => {
                canvas.onclick = null;
                initSnakeApp();
            };
            return;
        }

        if (nx === food.x && ny === food.y) {
            score++;
            food = randomFood(cols, rows, box, snake);
            if (speed > 60) speed -= 10;
            clearInterval(snakeAppInterval);
            snakeAppInterval = setInterval(draw, speed);
            const lvl = Math.round((300 - speed) / 10 + 1);
            document.getElementById("app-snk-score").textContent = score;
            document.getElementById("app-snk-speed").textContent = lvl + "x";
        } else {
            snake.pop();
        }

        snake.unshift({ x: nx, y: ny });
    }

    snakeAppInterval = setInterval(draw, speed);
}

function stopSnakeGame() {
    if (snakeAppInterval) {
        clearInterval(snakeAppInterval);
        snakeAppInterval = null;
    }
    if (snakeAppKeyHandler) {
        document.removeEventListener("keydown", snakeAppKeyHandler);
        snakeAppKeyHandler = null;
    }
}

// ── Guided Tour ───────────────────────────────────────────────────────────────
const TOUR_STEPS = [
    {
        msg: `Hey! 👋 I'm <span class="tour-hi">Rohan</span> — welcome to my portfolio.<br><br>This isn't your average CV. It's a fully working <span class="tour-hi">Ubuntu OS simulation</span> built from scratch in vanilla JS. Let me show you around!`,
        target: null, // no spotlight — center screen intro
        position: "center",
    },
    {
        msg: `This is the <span class="tour-hi">terminal</span> — the heart of the portfolio. You can type real commands here, just like a Linux shell.<br><br>Try typing <span class="tour-key">about</span> or <span class="tour-key">skills</span> to explore.`,
        target: ".terminal",
        position: "top",
    },
    {
        msg: `These are the <span class="tour-hi">quick-nav tabs</span>. Click any tab to instantly jump to that section — no typing needed.<br><br>Works great on mobile too! 📱`,
        target: ".t-tabs",
        position: "bottom",
    },
    {
        msg: `This is the <span class="tour-hi">dock</span> — just like macOS or Ubuntu GNOME. Click any icon to open it as a real draggable window.<br><br>Try <span class="tour-key">🍿 Watchlist</span> — it fetches live posters from TMDB!`,
        target: ".os-dock",
        position: "top",
        desktopOnly: true,
    },
    {
        msg: `These are <span class="tour-hi">desktop icons</span>. Double-click any of them to open a GUI window — fully draggable, resizable, and minimizable with a genie animation! 🪄`,
        target: ".desktop-icons",
        position: "right",
        desktopOnly: true,
    },
    {
        msg: `The <span class="tour-hi">top bar</span> shows a live clock, Wi-Fi, and battery — all pulled from your real browser. Click the ⚙ gear for a menu with GitHub & LinkedIn shortcuts.`,
        target: ".os-topbar",
        position: "bottom",
        desktopOnly: true,
    },
    {
        msg: `There's also a <span class="tour-hi">Snake game</span> hidden in the dock, <span class="tour-key">matrix</span> rain in the terminal, and 3 themes you can switch with <span class="tour-key">theme dracula</span> or <span class="tour-key">theme matrix</span>.`,
        target: "#dock-snake",
        position: "top",
        desktopOnly: true,
    },
    {
        msg: `That's everything! You can always type <span class="tour-key">help</span> to see all commands, or <span class="tour-key">menu</span> for a numbered list.<br><br>Enjoy exploring — and feel free to reach out! 🚀`,
        target: null,
        position: "center",
    },
];

let tourStep = 0;
let tourActive = false;

function startTour() {
    tourActive = true;
    tourStep = 0;
    document.getElementById("tour-overlay").classList.add("active");
    renderTourStep();

    document.getElementById("tour-next").addEventListener("click", tourNext);
    document.getElementById("tour-prev").addEventListener("click", tourPrev);
    document.getElementById("tour-skip").addEventListener("click", endTour);
    document.getElementById("tour-backdrop").addEventListener("click", () => {
        // clicking backdrop advances — friendly behaviour
        tourNext();
    });
}

function tourNext() {
    if (tourStep < TOUR_STEPS.length - 1) {
        tourStep++;
        renderTourStep();
    } else {
        endTour();
    }
}

function tourPrev() {
    if (tourStep > 0) {
        tourStep--;
        renderTourStep();
    }
}

function endTour() {
    tourActive = false;
    const overlay = document.getElementById("tour-overlay");
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.35s";
    setTimeout(() => {
        overlay.classList.remove("active");
        overlay.style.opacity = "";
        overlay.style.transition = "";
        try {
            localStorage.setItem("pf_toured", "1");
        } catch (e) {}
    }, 350);
}

function renderTourStep() {
    const step = TOUR_STEPS[tourStep];
    const isDesktop = window.innerWidth >= 640;

    // Skip desktop-only steps on mobile
    if (step.desktopOnly && !isDesktop) {
        tourStep < TOUR_STEPS.length - 1 ? tourStep++ : tourStep--;
        renderTourStep();
        return;
    }

    // Update message
    document.getElementById("tour-msg").innerHTML = step.msg;

    // Update dots
    const dotsEl = document.getElementById("tour-dots");
    const visibleSteps = isDesktop
        ? TOUR_STEPS.length
        : TOUR_STEPS.filter((s) => !s.desktopOnly).length;
    dotsEl.innerHTML = Array.from({ length: visibleSteps }, (_, i) => {
        // Map visible index to actual index (skip desktop-only on mobile)
        const cls = i === tourStep ? "tour-dot active" : "tour-dot";
        return `<div class="${cls}"></div>`;
    }).join("");

    // Update buttons
    const prevBtn = document.getElementById("tour-prev");
    const nextBtn = document.getElementById("tour-next");
    prevBtn.style.display = tourStep === 0 ? "none" : "";
    nextBtn.textContent =
        tourStep === TOUR_STEPS.length - 1 ? "Done ✓" : "Next →";

    // Position spotlight + bubble
    const spotlight = document.getElementById("tour-spotlight");
    const bubble = document.getElementById("tour-bubble");

    if (!step.target || step.position === "center") {
        // No spotlight — hide it, center bubble
        spotlight.style.opacity = "0";
        spotlight.style.width = "0";
        spotlight.style.height = "0";

        bubble.className = ""; // reset
        const bw = 320, bh = 220;
        // On mobile, use bottom-center fixed position (CSS handles this)
        if (window.innerWidth < 640) {
            bubble.style.left = "";
            bubble.style.top = "";
        } else {
            bubble.style.left = window.innerWidth / 2 - bw / 2 + "px";
            bubble.style.top = window.innerHeight / 2 - bh / 2 + "px";
        }
        return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
        spotlight.style.opacity = "0";
        return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;

    // Position spotlight
    spotlight.style.opacity = "1";
    spotlight.style.left = rect.left - pad + "px";
    spotlight.style.top = rect.top - pad + "px";
    spotlight.style.width = rect.width + pad * 2 + "px";
    spotlight.style.height = rect.height + pad * 2 + "px";

    // On mobile, let CSS handle fixed positioning
    if (window.innerWidth < 640) {
        bubble.className = "";
        bubble.style.left = "";
        bubble.style.top = "";
        return;
    }

    // Position bubble relative to target — desktop only
    const bubbleW = 320;
    const bubbleH = 200; // generous estimate
    const margin = 18;
    const TOPBAR_H = 34; // stay below topbar
    const VIEWPORT_PAD = 10;
    let bx, by;
    let arrowClass = "";

    // Helper: try a position and return whether it fits on screen
    function tryPos(pos) {
        switch (pos) {
            case "bottom": return { x: rect.left, y: rect.bottom + margin, arrow: "bubble-bottom" };
            case "top":    return { x: rect.left, y: rect.top - bubbleH - margin, arrow: "bubble-top" };
            case "right":  return { x: rect.right + margin, y: rect.top, arrow: "bubble-right" };
            case "left":   return { x: rect.left - bubbleW - margin, y: rect.top, arrow: "bubble-left" };
            default:       return { x: rect.left, y: rect.bottom + margin, arrow: "" };
        }
    }

    // Try preferred position, then fallback order
    const fallbacks = [step.position, "bottom", "top", "right", "left"];
    let chosen;
    for (const pos of fallbacks) {
        const candidate = tryPos(pos);
        const fitH = candidate.y >= TOPBAR_H && candidate.y + bubbleH <= window.innerHeight - VIEWPORT_PAD;
        const fitW = candidate.x >= VIEWPORT_PAD && candidate.x + bubbleW <= window.innerWidth - VIEWPORT_PAD;
        if (fitH && fitW) { chosen = candidate; break; }
    }
    if (!chosen) chosen = tryPos(step.position);

    bx = chosen.x;
    by = chosen.y;
    arrowClass = chosen.arrow;

    // Keep bubble on screen with clamping
    bx = Math.max(VIEWPORT_PAD, Math.min(bx, window.innerWidth - bubbleW - VIEWPORT_PAD));
    by = Math.max(TOPBAR_H + 4, Math.min(by, window.innerHeight - bubbleH - VIEWPORT_PAD));

    bubble.className = arrowClass;
    bubble.style.left = bx + "px";
    bubble.style.top = by + "px";
}

// ── Onboarding Logic ──────────────────────────────────────────────────────
function initOnboarding() {
    const overlay = document.getElementById("onboarding-overlay");
    if (!overlay) return boot();

    // Check if user has dismissed it before
    try {
        if (localStorage.getItem("pf_onboarded") === "1") {
            overlay.remove();
            return boot();
        }
    } catch (e) {}

    // Show overlay
    overlay.classList.add("visible");

    document
        .getElementById("onboarding-enter")
        .addEventListener("click", () => {
            const noShow = document.getElementById("onboarding-noshow");
            if (noShow && noShow.checked) {
                try {
                    localStorage.setItem("pf_onboarded", "1");
                } catch (e) {}
                // If skipping tutorial, also mark tour as done
                try {
                    localStorage.setItem("pf_toured", "1");
                } catch (e) {}
            }
            overlay.classList.add("fade-out");
            setTimeout(() => {
                overlay.remove();
                boot();
            }, 400);
        });
}

initOnboarding();
