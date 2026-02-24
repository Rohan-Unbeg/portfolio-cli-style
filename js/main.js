// ── State ───────────────────────────────────────────────────────────────────
        const body = document.getElementById('terminal-body');
        const input = document.getElementById('cmd-input');
        const suggestionEl = document.getElementById('cmd-suggestion');
        const promptCwdEl = document.getElementById('prompt-cwd');
        let cmdHistory = [];
        let histIdx = -1;
        let currentView = null;
        let previousView = null;
        let bootDone = false;
        let cwd = '~';

        // Restore last view and theme
        try {
            const saved = localStorage.getItem('pf_view');
            if (saved) previousView = saved;
            const savedTheme = localStorage.getItem('pf_theme');
            if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
        } catch (e) { }

        // ── Helpers ─────────────────────────────────────────────────────────────────
        function line(html, cls = '') {
            const d = document.createElement('div');
            d.className = 'line ' + cls;
            d.innerHTML = html;
            body.appendChild(d);
            return d;
        }

        function blank() { line('&nbsp;'); }

        function scrollBot() { body.scrollTop = body.scrollHeight; }

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        function toast(msg = '✓ Copied!') {
            const t = document.getElementById('copy-toast');
            t.textContent = msg;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2000);
        }

        function copyEmail() {
            navigator.clipboard.writeText('rohanunbeg0918@gmail.com')
                .then(() => toast('✓ Email copied!'))
                .catch(() => toast('rohanunbeg0918@gmail.com'));
        }

        function copyText(txt) {
            navigator.clipboard.writeText(txt).then(() => toast('✓ Copied!')).catch(() => { });
        }

        // ── Clock ────────────────────────────────────────────────────────────────────
        function updateClock() {
            const el = document.getElementById('status-time');
            if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        setInterval(updateClock, 1000);
        updateClock();

        // ── Render engine ────────────────────────────────────────────────────────────
        function render(viewName) {
            // Clear body
            body.innerHTML = '';

            // Update tab active state
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.toggle('active', t.dataset.view === viewName);
            });
            
            // Update header buttons active state
            document.getElementById('btn-help').classList.toggle('active', viewName === 'help');
            document.getElementById('btn-hire').classList.remove('active');

            // Persist view
            previousView = currentView;
            currentView = viewName;
            try { localStorage.setItem('pf_view', viewName); } catch (e) { }

            // Dispatch to view function
            const views = {
                menu, about, skills, experience, projects, stats, contact, help
            };
            const fn = views[viewName];
            if (fn) fn();
            scrollBot();
        }

        // ── Tab click navigation ────────────────────────────────────────────────────
        function tabNav(viewName) {
            if (!bootDone) return;
            if (viewName === 'hire') {
                body.innerHTML = '';
                promptLine('hire');
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
                `<span class="prompt-user">rohan</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">${cwd}</span><span class="prompt-sym">$ </span><span class="c-white">${escHtml(cmd)}</span>`
            );
        }

        function escHtml(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // ── Hire command ─────────────────────────────────────────────────────────────
        function hireCmd() {
            body.innerHTML = '';
            // Active state
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById('btn-help').classList.remove('active');
            document.getElementById('btn-hire').classList.add('active');
            blank();
            line(`  <span class="c-orange bold">Hire Rohan</span>`);
            blank();
            line(`  <span class="c-dim">Email:</span>    <span class="c-blue">rohanunbeg0918@gmail.com</span> <button onclick="copyEmail()" class="btn-sm" style="margin-left:6px;font-size:10px">copy</button>`);
            line(`  <span class="c-dim">LinkedIn:</span> <a href="https://www.linkedin.com/in/rohanunbeg/" target="_blank" rel="noopener" class="c-blue">linkedin.com/in/rohanunbeg/</a>`);
            line(`  <span class="c-dim">GitHub:</span>   <a href="https://github.com/rohan-unbeg" target="_blank" rel="noopener" class="c-blue">github.com/rohan-unbeg</a>`);
            blank();
            line(`  <span class="c-green">● Open to internships, collaborations, and freelance work.</span>`);
            blank();
            line(`  <span class="c-dim">Type <span class="c-orange">back</span> to return.</span>`);
            previousView = currentView;
            currentView = '__hire__';
            scrollBot();
        }

        // ── View: MENU ───────────────────────────────────────────────────────────────
        function menu() {
            blank();
            line(`  <span class="c-orange bold">Welcome to Rohan's portfolio.</span>`);
            line(`  <span class="c-dim">Select a section or type a command below.</span>`);
            blank();

            const opts = [
                ['1', 'about', 'Who I am'],
                ['2', 'skills', 'Tech stack & proficiency'],
                ['3', 'experience', 'Open source contributions'],
                ['4', 'projects', 'Personal projects'],
                ['5', 'stats', 'GitHub activity'],
                ['6', 'contact', 'Get in touch'],
            ];

            opts.forEach(([num, cmd, desc]) => {
                const row = document.createElement('div');
                row.className = 'menu-opt';
                row.innerHTML = `<span class="menu-num">[${num}]</span> <span class="menu-label" onclick="tabNav('${cmd}')" style="cursor:pointer">${cmd}</span>  <span class="c-dim">— ${desc}</span>`;
                body.appendChild(row);
            });

            blank();
            line(`  <span class="c-dim">Other commands: <span class="c-orange">help</span>  <span class="c-orange">clear</span>  <span class="c-orange">back</span>  <span class="c-orange">hire</span></span>`);
            blank();
        }

        // ── View: ABOUT ──────────────────────────────────────────────────────────────
        function about() {
            blank();
            const art = document.createElement('pre');
            art.className = 'banner fade-in';
            art.style.marginLeft = '8px';
            art.textContent = [
                ' ██████╗  ██████╗ ██╗  ██╗ █████╗ ███╗   ██╗',
                ' ██╔══██╗██╔═══██╗██║  ██║██╔══██╗████╗  ██║',
                ' ██████╔╝██║   ██║███████║███████║██╔██╗ ██║',
                ' ██╔══██╗██║   ██║██╔══██║██╔══██║██║╚████║',
                ' ██║  ██║╚██████╔╝██║  ██║██║  ██║██║ ╚███║',
                ' ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚══╝',
            ].join('\n');
            body.appendChild(art);
            blank();

            line(`  <span class="c-white bold" style="font-size:14px">Rohan Unbeg</span>`);
            line(`  <span class="c-orange">Backend Developer · Open Source Contributor</span>`);
            blank();
            line(`  <span class="c-dim">▸</span> <span class="c-yellow">Education :</span>  CS @ <span class="c-blue">Vishwakarma University</span>`);
            line(`  <span class="c-dim">▸</span> <span class="c-yellow">Current   :</span>  Contributor @ <span class="c-green">Oppia Foundation</span>`);
            line(`  <span class="c-dim">▸</span> <span class="c-yellow">Focus     :</span>  Backend infra · Data integrity · CI workflows`);
            line(`  <span class="c-dim">▸</span> <span class="c-yellow">Learning  :</span>  System Design · Apache Beam · GCP`);
            line(`  <span class="c-dim">▸</span> <span class="c-yellow">Status    :</span>  <span class="c-green">● Open to opportunities</span>`);
            blank();
            line(`  <span class="c-dim"># Passionate about resilient infrastructure, fixing</span>`);
            line(`  <span class="c-dim"># technical debt, and scaling tools for global learners.</span>`);
            blank();
            line(`  <span class="c-dim">Run <span class="c-orange" onclick="tabNav('contact')" style="cursor:pointer">contact</span> to get in touch.</span>`);
            blank();
        }

        // ── View: SKILLS ─────────────────────────────────────────────────────────────
        function skills() {
            blank();
            line(`  <span class="c-blue bold">// tech stack</span>`);
            blank();

            line(`  <span class="c-dim">── Languages ──────────────────</span>`);
            renderBars([
                ['Python', 92, '#4ac94a'],
                ['TypeScript', 84, '#729fcf'],
                ['JavaScript', 80, '#e9b96e'],
            ]);
            blank();

            line(`  <span class="c-dim">── Backend & Infra ─────────────</span>`);
            renderBars([
                ['Node.js', 72, '#6da55f'],
                ['GCP', 68, '#4285f4'],
                ['Apache Beam', 60, '#e67e22'],
                ['Docker', 62, '#0db7ed'],
                ['CI/CD', 78, '#4ac94a'],
                ['AWS', 55, '#ff9900'],
            ]);
            blank();

            line(`  <span class="c-dim">── Frontend ────────────────────</span>`);
            renderBars([
                ['Angular', 78, '#dd0031'],
                ['React', 65, '#61dafb'],
                ['Tailwind CSS', 70, '#38bdf8'],
                ['Next.js', 60, '#eeeeec'],
            ]);
            blank();

            line(`  <span class="c-dim">── Databases ───────────────────</span>`);
            renderBars([
                ['PostgreSQL', 70, '#336791'],
                ['MongoDB', 65, '#4ea94b'],
            ]);
            blank();

            line(`  <span class="c-dim">── All skills</span>`);
            const div = document.createElement('div');
            div.innerHTML = `<div class="badges">
    <span class="badge badge-green">Python</span>
    <span class="badge badge-blue">TypeScript</span>
    <span class="badge badge-yellow">JavaScript</span>
    <span class="badge badge-red">Angular</span>
    <span class="badge badge-cyan">React</span>
    <span class="badge badge-orange">Node.js</span>
    <span class="badge badge-blue">GCP</span>
    <span class="badge badge-orange">Apache Beam</span>
    <span class="badge badge-cyan">Docker</span>
    <span class="badge badge-purple">PostgreSQL</span>
    <span class="badge badge-green">MongoDB</span>
    <span class="badge badge-yellow">AWS</span>
    <span class="badge badge-green">Git</span>
    <span class="badge badge-blue">Next.js</span>
  </div>`;
            body.appendChild(div);
            blank();
        }

        function renderBars(items) {
            items.forEach(([name, pct, color]) => {
                const row = document.createElement('div');
                row.className = 'skill-row';
                row.innerHTML = `
      <span class="skill-name">${name}</span>
      <div class="skill-bar"><div class="skill-fill" style="width:0%;background:${color}"></div></div>
      <span class="skill-pct">${pct}%</span>`;
                body.appendChild(row);
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        const fill = row.querySelector('.skill-fill');
                        if (fill) fill.style.width = pct + '%';
                    }, 60);
                });
            });
        }

        // ── View: EXPERIENCE ─────────────────────────────────────────────────────────
        function experience() {
            blank();
            line(`  <span class="c-yellow bold">$ git log --author="Rohan Unbeg" --oneline</span>`);
            blank();
            line(`  <span class="c-green bold">Oppia Foundation</span>  <span class="c-dim">— Open Source Contributor · 2024–present</span>`);
            line(`  <span class="c-dim">  <a href="https://github.com/oppia/oppia" target="_blank" rel="noopener" class="c-blue">github.com/oppia/oppia</a></span>`);
            blank();

            const commits = [
                {
                    hash: 'a8f2c91',
                    label: 'feat(backend)',
                    title: 'Translation Count Validation',
                    pr: '#24589',
                    url: 'https://github.com/oppia/oppia/pull/24589',
                    desc: 'Validation mechanism to keep translation counts in sync across data models. Prevented silent data corruption in multi-language lessons used by millions of students.',
                    tags: ['+backend', '+data-integrity', '+python'],
                    tag_colors: ['badge-green', 'badge-blue', 'badge-green'],
                },
                {
                    hash: '7d4b1e5',
                    label: 'refactor(core)',
                    title: 'Translation Versioning System',
                    pr: '#24401',
                    url: 'https://github.com/oppia/oppia/pull/24401',
                    desc: 'Refactored storage layer to support robust versioning of translations — enabling seamless rollbacks and full change history for community contributors.',
                    tags: ['+refactor', '+storage', '+versioning'],
                    tag_colors: ['badge-yellow', 'badge-purple', 'badge-cyan'],
                },
            ];

            commits.forEach(c => {
                const entry = document.createElement('div');
                entry.className = 'commit-entry fade-in';
                const tagHTML = c.tags.map((t, i) => `<span class="badge ${c.tag_colors[i]}">${t}</span>`).join('');
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
            line(`  <span class="c-dim">2 PRs shown · <a href="https://github.com/oppia/oppia/commits?author=rohan-unbeg" target="_blank" class="c-blue">view all on GitHub ↗</a></span>`);
            blank();
        }

        // ── View: PROJECTS ───────────────────────────────────────────────────────────
        async function projects() {
            blank();
            line(`  <span class="c-purple bold">$ fetching latest projects from GitHub...</span>`);
            blank();

            try {
                const res = await fetch('https://api.github.com/users/rohan-unbeg/repos?sort=updated&per_page=5');
                if (!res.ok) throw new Error('Network response was not ok');
                const repos = await res.json();

                repos.forEach(p => {
                    if (p.fork) return;
                    const entry = document.createElement('div');
                    entry.className = 'project-entry fade-in';
                    const langBadge = p.language ? `<span class="badge badge-blue">${p.language}</span>` : '';
                    entry.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
        <a href="${p.html_url}" target="_blank" rel="noopener" class="c-blue bold">${p.name} ↗</a>
        <span class="c-dim" style="font-size:11px">⭐ ${p.stargazers_count}</span>
      </div>
      <div class="c-text" style="font-size:12px;line-height:1.7">${p.description || 'No description provided.'}</div>
      <div class="badges" style="margin-left:0;margin-top:6px">${langBadge}</div>`;
                    body.appendChild(entry);
                });
            } catch (e) {
                line(`  <span class="c-red">Failed to fetch from GitHub. Showing fallback data.</span>`);
                const projs = [
                    {
                        name: 'autonomous-ai-maintainer',
                        lang: 'Python',
                        badge: '⭐ featured',
                        url: 'https://github.com/rohan-unbeg/autonomous-ai-maintainer',
                        desc: 'Dual-engine automated codebase upkeep tool powered by Gemini & Groq. Scans repos for stale issues, generates fixes, and opens PRs autonomously.',
                        tags: ['AI/ML', 'Python', 'Automation'],
                        tag_colors: ['badge-purple', 'badge-green', 'badge-yellow'],
                    },
                    {
                        name: 'sugarsync-mcode',
                        lang: 'TypeScript',
                        badge: '🏆 hackathon winner',
                        url: 'https://github.com/rohan-unbeg/sugarsync-mcode',
                        desc: 'Gamified health tracking sync app. Real-time glucose data integration with gamification layer to improve patient engagement.',
                        tags: ['TypeScript', 'Health Tech', 'Gamification'],
                        tag_colors: ['badge-blue', 'badge-red', 'badge-orange'],
                    },
                ];

                projs.forEach(p => {
                    const entry = document.createElement('div');
                    entry.className = 'project-entry fade-in';
                    const tagHTML = p.tags.map((t, i) => `<span class="badge ${p.tag_colors[i]}">${t}</span>`).join('');
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
            line(`  <span class="c-dim"><a href="https://github.com/rohan-unbeg?tab=repositories" target="_blank" rel="noopener" class="c-blue">→ All repos on GitHub ↗</a></span>`);
            blank();
        }

        // ── View: STATS ──────────────────────────────────────────────────────────────
        function stats() {
            blank();
            line(`  <span class="c-cyan bold">$ gh api /users/rohan-unbeg --stats</span>`);
            blank();

            line(`  <span class="c-dim">──────────────────────────────────────────</span>`);
            line(`  <span class="c-green bold">rohan-unbeg</span>  <span class="c-dim">@</span>  <a href="https://github.com/rohan-unbeg" target="_blank" class="c-blue">github.com/rohan-unbeg</a>`);
            line(`  <span class="c-dim">──────────────────────────────────────────</span>`);
            blank();

            const statsData = [
                ['Primary Language', 'Python', 'c-green'],
                ['Secondary', 'TypeScript', 'c-blue'],
                ['Org Contributions', 'Oppia Foundation (oppia/oppia)', 'c-yellow'],
                ['Notable PRs', '#24589 · #24401 (merged)', 'c-purple'],
                ['Focus Areas', 'Backend · Data Integrity · Automation', 'c-cyan'],
                ['Open Source Since', '2024', 'c-orange'],
            ];

            statsData.forEach(([label, val, cls]) => {
                line(`  <span class="c-dim" style="display:inline-block;width:170px">${label}</span> <span class="${cls}">${val}</span>`);
            });

            blank();
            line(`  <span class="c-dim">── Contribution Graph ─────────────────────</span>`);
            blank();

            const graphWrap = document.createElement('div');
            graphWrap.style.cssText = 'padding-left:14px;';
            graphWrap.innerHTML = `<img src="https://ghchart.rshah.org/e95420/rohan-unbeg" alt="GitHub Contribution Graph" loading="lazy" style="max-width:100%;border-radius:4px;border:1px solid #3a1a40;display:block" />`;
            body.appendChild(graphWrap);

            blank();
            line(`  <span class="c-dim">── Streak ─────────────────────────────────</span>`);
            blank();

            const streakWrap = document.createElement('div');
            streakWrap.style.cssText = 'padding-left:14px;';
            streakWrap.innerHTML = `<img src="https://streak-stats.demolab.com?user=rohan-unbeg&theme=dark&hide_border=true&background=160e1e&ring=e95420&fire=e95420&currStreakLabel=eeeeec" alt="GitHub Streak" loading="lazy" style="max-width:100%;border-radius:4px;border:1px solid #3a1a40;display:block" />`;
            body.appendChild(streakWrap);

            blank();
        }

        // ── View: CONTACT ────────────────────────────────────────────────────────────
        function contact() {
            blank();
            line(`  <span class="c-orange bold">$ ./connect.sh</span>`);
            blank();

            const links = [
                { label: 'GitHub', val: 'github.com/rohan-unbeg', url: 'https://github.com/rohan-unbeg', copy: null },
                { label: 'LinkedIn', val: 'linkedin.com/in/rohanunbeg/', url: 'https://www.linkedin.com/in/rohanunbeg/', copy: null },
                { label: 'Email', val: 'rohanunbeg0918@gmail.com', url: 'mailto:rohanunbeg0918@gmail.com', copy: 'rohanunbeg0918@gmail.com' },
                { label: 'Twitter/X', val: '@rohanunbeg', url: 'https://twitter.com/rohanunbeg', copy: null },
            ];

            links.forEach(l => {
                const row = document.createElement('div');
                row.className = 'contact-row';
                row.innerHTML = `
      <span class="contact-lbl">${l.label}</span>
      <a href="${l.url}" target="_blank" rel="noopener" class="contact-val">${l.val}</a>
      ${l.copy ? `<button onclick="copyText('${l.copy}')" class="btn-sm" style="font-size:10px;flex-shrink:0">copy</button>` : ''}`;
                body.appendChild(row);
            });

            blank();
            line(`  <span class="c-dim"># Response time: usually within 24 hours</span>`);
            line(`  <span class="c-dim"># Open to: Internships · Collaborations · Freelance</span>`);
            blank();
        }

        // ── View: HELP ───────────────────────────────────────────────────────────────
        function help() {
            blank();
            line(`  <span class="c-orange bold">Available commands</span>`);
            blank();

            const cmds = [
                ['menu', 'c-orange', 'Numbered navigation menu'],
                ['about', 'c-green', 'Who I am'],
                ['skills', 'c-blue', 'Tech stack & proficiency'],
                ['experience', 'c-yellow', 'Open source contributions'],
                ['projects', 'c-purple', 'Personal projects'],
                ['stats', 'c-cyan', 'GitHub activity'],
                ['contact', 'c-orange', 'Get in touch'],
                ['hire', 'c-orange', 'Hire me (quick contact)'],
                ['theme', 'c-purple', 'Change theme (ubuntu, dracula, matrix)'],
                ['ls / cd / pwd', 'c-blue', 'Navigate virtual file system'],
                ['cat', 'c-blue', 'Read a file'],
                ['back', 'c-dim', 'Return to previous view'],
                ['clear', 'c-dim', 'Clear terminal'],
                ['help', 'c-dim', 'Show this message'],
            ];

            cmds.forEach(([cmd, cls, desc]) => {
                line(`  <span class="${cls} bold" style="display:inline-block;width:130px;cursor:pointer" onclick="runCmd('${cmd.split(' ')[0]}')">${cmd}</span>  <span class="c-dim">${desc}</span>`);
            });

            blank();
            line(`  <span class="c-dim">Tip: ↑↓ history · Double-Tab autocomplete · 1-6 for quick nav</span>`);
            blank();
        }

        // ── Command runner ───────────────────────────────────────────────────────────
        const VIEWS = ['menu', 'about', 'skills', 'experience', 'projects', 'stats', 'contact', 'help'];
        const NUM_MAP = { '1': 'about', '2': 'skills', '3': 'experience', '4': 'projects', '5': 'stats', '6': 'contact' };

        const COMPLETIONS = [...VIEWS, 'hire', 'back', 'clear', 'theme', 'ls', 'cd', 'pwd', 'cat', 'sudo', 'echo', 'date', 'whoami', 'history', 'matrix', 'snake', 'exit'];
        const THEMES = ['ubuntu', 'dracula', 'matrix'];
        const FILES = ['about.txt', 'skills.txt', 'experience.txt', 'contact.txt'];
        const DIRS = ['projects', 'stats'];

        // ── ZSH-like Autosuggestion ──────────────────────────────────────────────────
        function getSuggestion(val) {
            if (!val) return '';
            const parts = val.toLowerCase().split(' ');
            const cmd = parts[0];
            
            if (parts.length === 1) {
                const match = COMPLETIONS.find(c => c.startsWith(cmd));
                return match ? val + match.slice(cmd.length) : '';
            }
            
            if (parts.length === 2) {
                const arg = parts[1];
                if (cmd === 'theme') {
                    const match = THEMES.find(t => t.startsWith(arg));
                    return match ? val + match.slice(arg.length) : '';
                }
                if (cmd === 'cat' && cwd === '~') {
                    const match = FILES.find(f => f.startsWith(arg));
                    return match ? val + match.slice(arg.length) : '';
                }
                if (cmd === 'cd' && cwd === '~') {
                    const match = DIRS.find(d => d.startsWith(arg));
                    return match ? val + match.slice(arg.length) : '';
                }
            }
            return '';
        }

        input.addEventListener('input', () => {
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
            body.innerHTML = '';
            promptLine(raw.trim());
            blank();

            // Numeric shortcut
            if (NUM_MAP[trimmed]) {
                render(NUM_MAP[trimmed]);
                return;
            }

            const args = trimmed.split(' ').filter(Boolean);
            const command = args[0];

            if (command === 'sudo') {
                if (trimmed === 'sudo rm -rf /' || trimmed === 'sudo rm -rf /*') {
                    line(`  <span class="c-red">Nice try. This incident will be reported.</span>`);
                    return;
                }
                if (args[1] === 'hire') {
                    hireCmd();
                    return;
                }
                line(`  <span class="c-red">rohan is not in the sudoers file. This incident will be reported.</span>`);
                return;
            }

            if (command === 'theme') {
                const t = args[1];
                if (['ubuntu', 'dracula', 'matrix'].includes(t)) {
                    document.documentElement.setAttribute('data-theme', t);
                    localStorage.setItem('pf_theme', t);
                    line(`  <span class="c-green">Theme set to ${t}</span>`);
                } else {
                    line(`  <span class="c-dim">Available themes: ubuntu, dracula, matrix</span>`);
                    line(`  <span class="c-dim">Usage: theme &lt;name&gt;</span>`);
                }
                return;
            }

            if (command === 'pwd') {
                line(`  <span class="c-white">/home/rohan${cwd.replace('~', '')}</span>`);
                return;
            }

            if (command === 'cd') {
                let dir = args[1] || '~';
                if (dir.endsWith('/') && dir.length > 1) dir = dir.slice(0, -1); // strip trailing slash
                
                if (dir === '~' || dir === '/') {
                    cwd = '~';
                } else if (dir === 'projects' && cwd === '~') {
                    cwd = '~/projects';
                } else if (dir === 'stats' && cwd === '~') {
                    cwd = '~/stats';
                } else if (dir === '..') {
                    cwd = '~';
                } else {
                    line(`  <span class="c-red">cd: ${escHtml(dir)}: No such file or directory</span>`);
                }
                promptCwdEl.textContent = cwd;
                return;
            }

            if (command === 'ls') {
                if (cwd === '~') {
                    line(`  <span class="c-blue bold">projects/</span>  <span class="c-blue bold">stats/</span>  <span class="c-white">about.txt</span>  <span class="c-white">skills.txt</span>  <span class="c-white">experience.txt</span>  <span class="c-white">contact.txt</span>`);
                } else if (cwd === '~/projects') {
                    line(`  <span class="c-white">autonomous-ai-maintainer.md</span>  <span class="c-white">sugarsync-mcode.md</span>`);
                } else if (cwd === '~/stats') {
                    line(`  <span class="c-white">github-stats.json</span>`);
                }
                return;
            }

            if (command === 'cat') {
                const file = args[1];
                if (!file) {
                    line(`  <span class="c-red">cat: missing file operand</span>`);
                    return;
                }
                const map = {
                    'about.txt': about,
                    'skills.txt': skills,
                    'experience.txt': experience,
                    'contact.txt': contact
                };
                if (cwd === '~' && map[file]) {
                    map[file]();
                } else if (cwd === '~/projects' && (file === 'autonomous-ai-maintainer.md' || file === 'sugarsync-mcode.md')) {
                    line(`  <span class="c-dim"># Run <span class="c-orange">projects</span> to view formatted project details.</span>`);
                } else if (cwd === '~/stats' && file === 'github-stats.json') {
                    line(`  <span class="c-dim"># Run <span class="c-orange">stats</span> to view formatted GitHub statistics.</span>`);
                } else {
                    line(`  <span class="c-red">cat: ${escHtml(file)}: No such file or directory</span>`);
                }
                return;
            }

            if (command === 'echo') {
                const text = args.slice(1).join(' ');
                line(`  <span class="c-white">${escHtml(text)}</span>`);
                return;
            }

            if (command === 'date') {
                line(`  <span class="c-white">${new Date().toString()}</span>`);
                return;
            }

            if (command === 'whoami') {
                line(`  <span class="c-white">rohan</span>`);
                return;
            }

            if (command === 'history') {
                cmdHistory.forEach((cmd, i) => {
                    line(`  <span class="c-dim">${(i + 1).toString().padStart(4, ' ')}</span>  <span class="c-white">${escHtml(cmd)}</span>`);
                });
                return;
            }

            switch (command) {
                case 'menu':
                case 'about':
                case 'skills':
                case 'experience':
                case 'projects':
                case 'stats':
                case 'contact':
                case 'help':
                    render(command);
                    break;

                case 'hire':
                    hireCmd();
                    break;

                case 'back':
                    if (previousView && previousView !== currentView) {
                        render(previousView);
                    } else {
                        render('menu');
                    }
                    break;

                case 'clear':
                    doClear();
                    break;

                case 'neofetch':
                    neofetch();
                    break;

                case 'secret':
                case 'easteregg':
                    easterEgg();
                    break;

                case 'matrix':
                    startMatrix();
                    break;

                case 'snake':
                    openApp('snake');
                    break;

                case 'exit':
                    line(`  <span class="c-dim">Terminal closed. Click the Terminal icon in the dock to reopen.</span>`);
                    setTimeout(() => closeApp('terminal'), 800);
                    break;

                default:
                    line(`  <span class="c-red">command not found: <span class="c-white">${escHtml(trimmed)}</span></span>`);
                    line(`  <span class="c-dim">Type <span class="c-orange">help</span> for available commands or <span class="c-orange">menu</span> to navigate.</span>`);
                    blank();
            }

            scrollBot();
        }

        function doClear() {
            if (matrixInterval) {
                clearInterval(matrixInterval);
                matrixInterval = null;
                window.removeEventListener('resize', resizeMatrix);
            }
            if (snakeInterval) {
                clearInterval(snakeInterval);
                snakeInterval = null;
                document.removeEventListener('keydown', snakeKeyHandler);
            }
            body.innerHTML = '';
            line(`  <span class="c-dim">Terminal cleared. Type <span class="c-orange">menu</span> to navigate.</span>`);
            blank();
            currentView = null;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById('btn-help').classList.remove('active');
            document.getElementById('btn-hire').classList.remove('active');
            promptCwdEl.textContent = cwd;
        }

        // ── Neofetch ─────────────────────────────────────────────────────────────────
        function neofetch() {
            const logo = [
                '         .--.',
                '        /    \\',
                '       |  () |',
                '        \\    /',
                '     ____\\  /____',
                '    /            \\',
                '   /   Ubuntu OS  \\',
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
                const l = document.createElement('div');
                l.className = 'line';
                l.style.cssText = 'display:flex;gap:18px;padding-left:14px;';
                const logoSpan = document.createElement('span');
                logoSpan.className = 'c-orange';
                logoSpan.style.cssText = 'width:130px;flex-shrink:0;white-space:pre;font-size:11px;';
                logoSpan.textContent = logo[i] || '';
                const infoSpan = document.createElement('span');
                infoSpan.style.fontSize = '12px';
                infoSpan.innerHTML = info[i] !== undefined ? info[i] : '';
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
            line(`  <span class="c-dim">"The best code is code that doesn't need to exist."</span>`);
            line(`  <span class="c-dim">"Second best: code so clean it explains itself."</span>`);
            blank();
            line(`  <span class="c-green">Keep shipping. 🚀</span>`);
            blank();
        }

        // ── Matrix Rain ──────────────────────────────────────────────────────────────
        let matrixInterval;
        let resizeMatrix;
        function startMatrix() {
            if (matrixInterval) return;
            
            body.innerHTML = '';
            const canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '10';
            canvas.style.background = '#000';
            body.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            
            // Resize canvas
            resizeMatrix = function() {
                canvas.width = body.clientWidth;
                canvas.height = body.clientHeight;
            };
            resizeMatrix();
            window.addEventListener('resize', resizeMatrix);

            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
            const fontSize = 14;
            const columns = canvas.width / fontSize;
            const drops = [];
            for (let x = 0; x < columns; x++) drops[x] = 1;

            function draw() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#0F0';
                ctx.font = fontSize + 'px monospace';
                
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
            
            const stopBtn = document.createElement('button');
            stopBtn.textContent = 'Stop Matrix (Ctrl+C)';
            stopBtn.className = 'btn-sm';
            stopBtn.style.position = 'absolute';
            stopBtn.style.top = '10px';
            stopBtn.style.right = '20px';
            stopBtn.style.zIndex = '11';
            stopBtn.onclick = () => {
                clearInterval(matrixInterval);
                matrixInterval = null;
                window.removeEventListener('resize', resizeMatrix);
                doClear();
            };
            body.appendChild(stopBtn);
        }

        // ── Snake Game (Terminal version removed, now an App) ────────────────────────
        let snakeInterval;
        let snakeKeyHandler;
        function startSnake() {
            line(`  <span class="c-dim">Snake is now a standalone app. Opening...</span>`);
            setTimeout(() => openApp('snake'), 500);
        }

        // ── Input handling ───────────────────────────────────────────────────────────
        let lastTabTime = 0;

        input.addEventListener('keydown', (e) => {
            if (!bootDone) {
                e.preventDefault();
                return;
            }

            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val) runCmd(val);
                input.value = '';
                suggestionEl.textContent = '';
                return;
            }

            if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
                if (suggestionEl.textContent) {
                    input.value = suggestionEl.textContent;
                    suggestionEl.textContent = '';
                    e.preventDefault();
                }
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!cmdHistory.length) return;
                histIdx = histIdx < cmdHistory.length - 1 ? histIdx + 1 : histIdx;
                input.value = cmdHistory[cmdHistory.length - 1 - histIdx] || '';
                setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
                suggestionEl.textContent = '';
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                histIdx = histIdx > 0 ? histIdx - 1 : -1;
                input.value = histIdx === -1 ? '' : (cmdHistory[cmdHistory.length - 1 - histIdx] || '');
                suggestionEl.textContent = '';
                return;
            }

            if (e.key === 'Escape') { 
                input.value = ''; 
                histIdx = -1; 
                suggestionEl.textContent = '';
                return; 
            }

            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                body.innerHTML += `<div class="line"><span class="prompt-user">rohan</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">${cwd}</span><span class="prompt-sym">$ </span><span class="c-white">${escHtml(input.value)}</span><span class="c-dim">^C</span></div>`;
                input.value = '';
                suggestionEl.textContent = '';
                scrollBot();
                
                // Stop games if running
                if (matrixInterval) {
                    clearInterval(matrixInterval);
                    matrixInterval = null;
                    window.removeEventListener('resize', resizeMatrix);
                    doClear();
                }
                if (snakeInterval) {
                    clearInterval(snakeInterval);
                    snakeInterval = null;
                    document.removeEventListener('keydown', snakeKeyHandler);
                    doClear();
                }
                return;
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                const now = Date.now();
                const val = input.value.toLowerCase();
                const parts = val.split(' ');
                
                if (now - lastTabTime < 500) {
                    // Double tab
                    let matches = [];
                    if (parts.length === 1) {
                        matches = COMPLETIONS.filter(c => c.startsWith(val));
                    } else if (parts.length === 2) {
                        if (parts[0] === 'theme') matches = THEMES.filter(t => t.startsWith(parts[1]));
                        if (parts[0] === 'cat' && cwd === '~') matches = FILES.filter(f => f.startsWith(parts[1]));
                        if (parts[0] === 'cd' && cwd === '~') matches = DIRS.filter(d => d.startsWith(parts[1]));
                    }
                    
                    if (matches.length > 0) {
                        body.innerHTML += `<div class="line"><span class="prompt-user">rohan</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">${cwd}</span><span class="prompt-sym">$ </span><span class="c-white">${escHtml(input.value)}</span></div>`;
                        line(`  <span class="c-dim">${matches.join('  ')}</span>`);
                        scrollBot();
                    }
                } else {
                    // Single tab
                    const suggestion = getSuggestion(input.value);
                    if (suggestion) {
                        input.value = suggestion;
                        suggestionEl.textContent = '';
                    }
                }
                lastTabTime = now;
            }
        });

        // Keep input focused
        document.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) {
                input.focus();
            }
        });

        // ── OS Window Manager ────────────────────────────────────────────────────────
        const apps = {
            terminal: { id: 'terminal', el: document.querySelector('.terminal'), running: true, minimized: false, isMaximized: false },
            explorer: { id: 'explorer', el: null, running: false, minimized: false, isMaximized: false },
            pdf: { id: 'pdf', el: null, running: false, minimized: false, isMaximized: false },
            snake: { id: 'snake', el: null, running: false, minimized: false, isMaximized: false },
            sugarsync: { id: 'sugarsync', el: null, running: false, minimized: false, isMaximized: false }
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
                app.el.classList.remove('closed');
                app.el.style.transformOrigin = 'center bottom';
                app.el.classList.add('anim-scale-in');
                function onScaleIn() {
                    app.el.removeEventListener('animationend', onScaleIn);
                    app.el.classList.remove('anim-scale-in');
                }
                app.el.addEventListener('animationend', onScaleIn);
                app.running = true;
                updateDock();
            }
            
            if (app.minimized) {
                const el = app.el;
                el.classList.remove('minimized', 'anim-genie-out');
                el.style.transformOrigin = 'center bottom';
                el.classList.add('anim-genie-in');
                function onGenieIn() {
                    el.removeEventListener('animationend', onGenieIn);
                    el.classList.remove('anim-genie-in');
                }
                el.addEventListener('animationend', onGenieIn);
                app.minimized = false;
            }
            
            focusApp(id);
            if (id === 'terminal') input.focus();
        }

        function closeApp(id) {
            const app = apps[id];
            if (!app || !app.running) return;
            app.el.classList.add('closed');
            app.running = false;
            app.minimized = false;
            updateDock();
            if (id === 'snake') stopSnakeGame();
        }

        function minimizeApp(id) {
            const app = apps[id];
            if (!app || !app.running) return;
            const el = app.el;
            // Snap transform-origin toward dock (bottom-center)
            el.style.transformOrigin = 'center bottom';
            el.classList.remove('anim-genie-in', 'anim-scale-in');
            el.classList.add('anim-genie-out');
            // After animation completes, actually hide
            function onGenieOut() {
                el.removeEventListener('animationend', onGenieOut);
                el.classList.remove('anim-genie-out');
                el.classList.add('minimized');
            }
            el.addEventListener('animationend', onGenieOut);
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
                winEl.style.position = 'fixed';
                winEl.style.left = '0';
                winEl.style.top = '28px';
                winEl.style.width = '100vw';
                winEl.style.maxWidth = '100vw';
                winEl.style.height = 'calc(100vh - 28px)';
                winEl.style.maxHeight = 'calc(100vh - 28px)';
                winEl.style.borderRadius = '0';
                winEl.style.margin = '0';
                app.isMaximized = true;
                document.getElementById('os-desktop').classList.add('dock-hidden');
            } else {
                winEl.style.position = 'absolute';
                winEl.style.left = winEl.dataset.prevLeft || '50px';
                winEl.style.top = winEl.dataset.prevTop || '50px';
                winEl.style.width = winEl.dataset.prevW || '';
                winEl.style.maxWidth = '';
                winEl.style.height = winEl.dataset.prevH || '';
                winEl.style.maxHeight = '';
                winEl.style.borderRadius = '';
                winEl.style.margin = '';
                app.isMaximized = false;
                document.getElementById('os-desktop').classList.remove('dock-hidden');
            }
            focusApp(id);
        }

        function makeResizable(winEl) {
            const handles = [
                { cls: 'rsz-e',  cursor: 'ew-resize' },
                { cls: 'rsz-s',  cursor: 'ns-resize' },
                { cls: 'rsz-se', cursor: 'nwse-resize' },
                { cls: 'rsz-w',  cursor: 'ew-resize' },
                { cls: 'rsz-n',  cursor: 'ns-resize' },
                { cls: 'rsz-sw', cursor: 'nesw-resize' },
                { cls: 'rsz-ne', cursor: 'nesw-resize' },
                { cls: 'rsz-nw', cursor: 'nwse-resize' },
            ];
            handles.forEach(function(h) {
                const el = document.createElement('div');
                el.className = 'rsz-handle ' + h.cls;
                el.style.cursor = h.cursor;
                winEl.appendChild(el);
                let startX, startY, startW, startH, startLeft, startTop;
                el.addEventListener('mousedown', function(e) {
                    e.preventDefault(); e.stopPropagation();
                    startX = e.clientX; startY = e.clientY;
                    const rect = winEl.getBoundingClientRect();
                    startW = rect.width; startH = rect.height;
                    startLeft = parseFloat(winEl.style.left) || rect.left;
                    startTop = parseFloat(winEl.style.top) || rect.top;
                    const onMove = function(ev) {
                        const dx = ev.clientX - startX, dy = ev.clientY - startY;
                        if (h.cls.includes('e'))  winEl.style.width  = Math.max(280, startW + dx) + 'px';
                        if (h.cls.includes('s'))  winEl.style.height = Math.max(180, startH + dy) + 'px';
                        if (h.cls.includes('w'))  { winEl.style.width = Math.max(280, startW - dx) + 'px'; winEl.style.left = (startLeft + dx) + 'px'; }
                        if (h.cls.includes('n'))  { winEl.style.height = Math.max(180, startH - dy) + 'px'; winEl.style.top = (startTop + dy) + 'px'; }
                    };
                    const onUp = function() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });
            });
        }

        function makeDraggable(winEl, headerEl) {
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            headerEl.addEventListener('mousedown', (e) => {
                if (window.innerWidth < 640) return;
                if (e.target.classList.contains('w-dot')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = winEl.getBoundingClientRect();
                if (winEl.style.position !== 'absolute' && winEl.style.position !== 'fixed') {
                    winEl.style.position = 'absolute';
                    winEl.style.left = rect.left + 'px';
                    winEl.style.top = rect.top + 'px';
                    winEl.style.margin = '0';
                    winEl.style.transform = 'none';
                }
                
                initialLeft = parseFloat(winEl.style.left) || rect.left;
                initialTop = parseFloat(winEl.style.top) || rect.top;
                
                focusApp(winEl.dataset.appId);
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                const termW = winEl.offsetWidth;
                const clampedLeft = Math.max(-termW + 60, Math.min(window.innerWidth - 60, initialLeft + dx));
                const clampedTop = Math.max(28, Math.min(window.innerHeight - 80, initialTop + dy));
                
                winEl.style.left = clampedLeft + 'px';
                winEl.style.top = clampedTop + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            winEl.addEventListener('mousedown', () => focusApp(winEl.dataset.appId));
        }

        // Initialize Terminal as an app
        apps.terminal.el.dataset.appId = 'terminal';
        apps.terminal.el.classList.add('os-window');
        makeDraggable(apps.terminal.el, apps.terminal.el.querySelector('.t-header'));
        makeResizable(apps.terminal.el);
        focusApp('terminal');

        function updateDock() {
            Object.keys(apps).forEach(id => {
                const dockItem = document.getElementById(`dock-${id}`);
                if (dockItem) {
                    if (apps[id].running) dockItem.classList.add('running');
                    else dockItem.classList.remove('running');
                }
            });
        }

        function createAppWindow(id) {
            const win = document.createElement('div');
            win.className = 'os-window';
            win.dataset.appId = id;
            
            let width = '600px';
            let height = '400px';
            let title = 'App';
            let content = '';
            
            if (id === 'explorer') {
                title = 'File Explorer';
                width = '700px'; height = '450px';
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
            } else if (id === 'pdf') {
                title = 'resume.pdf - PDF Viewer';
                width = '800px'; height = '85vh';
                content = `<iframe src="resume.pdf" style="width:100%;height:100%;border:none;background:#fff;"></iframe>`;
            } else if (id === 'snake') {
                title = 'Snake Game';
                width = '420px'; height = '480px';
                content = `<div id="snake-app-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#000;"></div>`;
            } else if (id === 'sugarsync') {
                title = 'SugarSync - Mobile App';
                width = '375px'; height = '667px';
                content = `<iframe src="https://beat-the-sugar-spike.vercel.app/" style="width:100%;height:100%;border:none;background:#fff;"></iframe>`;
            }
            
            win.style.width = width;
            win.style.height = height;
            win.style.left = Math.max(50, Math.random() * 100) + 'px';
            win.style.top = Math.max(50, Math.random() * 100) + 'px';
            
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
            
            document.querySelector('.wrapper').appendChild(win);
            apps[id].el = win;
            
            makeDraggable(win, win.querySelector('.os-window-header'));
            if (id !== 'sugarsync') makeResizable(win);
            
            if (id === 'snake') {
                initSnakeApp();
            } else if (id === 'explorer') {
                renderExplorer('~');
            }
        }

        // Explorer rendering logic
        const EXPLORER_ICONS = {
            folder: '<svg viewBox="0 0 24 24" width="36" height="36" fill="#e9b96e" stroke="#c8980a" stroke-width="0.5"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" fill="#e9b96e"/></svg>',
            about: '<svg viewBox="0 0 24 24" width="36" height="36"><circle cx="12" cy="8" r="4" fill="#729fcf"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#4a7ab5"/></svg>',
            skills: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="2" y="14" width="4" height="8" rx="1" fill="#4ac94a"/><rect x="8" y="9" width="4" height="13" rx="1" fill="#34e2e2"/><rect x="14" y="4" width="4" height="18" rx="1" fill="#e95420"/><rect x="20" y="11" width="2" height="11" rx="1" fill="#ad7fa8"/></svg>',
            exp: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="2" y="7" width="20" height="14" rx="2" fill="#4a2a55" stroke="#ad7fa8" stroke-width="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" fill="none" stroke="#ad7fa8" stroke-width="1.5"/><line x1="12" y1="12" x2="12" y2="16" stroke="#ad7fa8" stroke-width="1.5"/><line x1="10" y1="14" x2="14" y2="14" stroke="#ad7fa8" stroke-width="1.5"/></svg>',
            contact: '<svg viewBox="0 0 24 24" width="36" height="36"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7A2 2 0 0 1 22 16.9z" fill="#34e2e2" opacity="0.9"/></svg>',
            pdf: '<svg viewBox="0 0 24 24" width="36" height="36"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#c0392b"/><polyline points="14 2 14 8 20 8" fill="#e74c3c" stroke="#fff" stroke-width="0.5"/><text x="5" y="17" font-size="6" fill="white" font-weight="bold" font-family="monospace">PDF</text></svg>',
            phone: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="5" y="2" width="14" height="20" rx="3" fill="#2c2c2e" stroke="#4ac94a" stroke-width="1.5"/><rect x="7" y="5" width="10" height="13" rx="1" fill="#1a1a2e"/><circle cx="12" cy="20" r="1" fill="#4ac94a"/></svg>',
            robot: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="4" y="8" width="16" height="12" rx="2" fill="#ad7fa8"/><rect x="8" y="3" width="8" height="5" rx="1" fill="#9b59b6"/><circle cx="9" cy="13" r="2" fill="#fff"/><circle cx="15" cy="13" r="2" fill="#fff"/><circle cx="9" cy="13" r="1" fill="#2c1654"/><circle cx="15" cy="13" r="1" fill="#2c1654"/><rect x="9" y="17" width="6" height="1.5" rx="0.75" fill="#fff"/><line x1="2" y1="11" x2="4" y2="11" stroke="#ad7fa8" stroke-width="2"/><line x1="20" y1="11" x2="22" y2="11" stroke="#ad7fa8" stroke-width="2"/></svg>',
            stats: '<svg viewBox="0 0 24 24" width="36" height="36"><rect x="2" y="12" width="3" height="10" rx="1" fill="#e95420"/><rect x="7" y="8" width="3" height="14" rx="1" fill="#e9b96e"/><rect x="12" y="4" width="3" height="18" rx="1" fill="#4ac94a"/><rect x="17" y="6" width="3" height="16" rx="1" fill="#729fcf"/></svg>',
            back: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#6a5572" stroke-width="2"><circle cx="12" cy="12" r="10" fill="rgba(106,85,114,0.15)"/><line x1="16" y1="12" x2="8" y2="12"></line><polyline points="11 9 8 12 11 15"></polyline></svg>'
        };

        window.renderExplorer = function(path) {
            const contentEl = document.getElementById('explorer-content');
            if (!contentEl) return;
            
            const I = EXPLORER_ICONS;
            let items = [];
            if (path === '~') {
                items = [
                    { name: 'projects', icon: I.folder, type: 'dir', path: '~/projects' },
                    { name: 'About Me', icon: I.about, type: 'file', cmd: "openGuiViewer('about')" },
                    { name: 'Skills', icon: I.skills, type: 'file', cmd: "openGuiViewer('skills')" },
                    { name: 'Experience', icon: I.exp, type: 'file', cmd: "openGuiViewer('experience')" },
                    { name: 'Contact', icon: I.contact, type: 'file', cmd: "openGuiViewer('contact')" },
                    { name: 'Resume.pdf', icon: I.pdf, type: 'file', cmd: "openApp('pdf')" }
                ];
            } else if (path === '~/projects') {
                items = [
                    { name: '..', icon: I.back, type: 'dir', path: '~' },
                    { name: 'SugarSync', icon: I.phone, type: 'file', cmd: "openApp('sugarsync')" },
                    { name: 'AI Maintainer', icon: I.robot, type: 'file', cmd: "openGuiViewer('ai-maintainer')" },
                    { name: 'GitHub Stats', icon: I.stats, type: 'file', cmd: "openGuiViewer('stats')" }
                ];
            }
            
            let html = '';
            items.forEach(function(i) {
                const action = i.type === 'dir' ? 'renderExplorer(\'' + i.path + '\')' : i.cmd;
                html += '<div class="explorer-icon" onclick="' + action + '">' +
                    '<div class="explorer-icon-img">' + i.icon + '</div>' +
                    '<div class="explorer-icon-name">' + i.name + '</div>' +
                    '</div>';
            });
            contentEl.innerHTML = html;
            
            // Update breadcrumb title
            const explorerWin = apps.explorer.el;
            if (explorerWin) {
                const titleEl = explorerWin.querySelector('.t-title');
                if (titleEl) titleEl.textContent = 'File Explorer — ' + path;
            }
        };

        // ── GUI Viewer ────────────────────────────────────────────────────────────────
        const guiViewers = {};
        window.openGuiViewer = function(view) {
            const viewId = 'viewer-' + view;
            if (guiViewers[viewId] && guiViewers[viewId].running) {
                openApp(viewId);
                return;
            }
            const titles = {
                'about': 'About Me', 'skills': 'Skills', 'experience': 'Experience',
                'contact': 'Contact', 'ai-maintainer': 'AI Maintainer Project', 'stats': 'GitHub Stats'
            };
            const win = document.createElement('div');
            win.className = 'os-window gui-viewer-win';
            win.dataset.appId = viewId;
            win.style.width = '680px';
            win.style.height = '520px';
            win.style.left = (80 + Math.random() * 80) + 'px';
            win.style.top = (50 + Math.random() * 60) + 'px';
            const title = titles[view] || view;
            win.innerHTML = '<div class="os-window-header"><div class="window-controls"><div class="w-dot close" onclick="closeGuiViewer(\'' + viewId + '\')" title="Close"></div><div class="w-dot min" onclick="minimizeGuiViewer(\'' + viewId + '\')" title="Minimize"></div><div class="w-dot max" onclick="maximizeGuiViewer(\'' + viewId + '\')" title="Maximize"></div></div><div class="t-title">' + title + '</div></div><div class="os-window-body gui-viewer-body" id="gvbody-' + viewId + '"></div>';
            document.querySelector('.wrapper').appendChild(win);
            guiViewers[viewId] = { el: win, running: true, minimized: false, isMaximized: false };
            makeDraggable(win, win.querySelector('.os-window-header'));
            makeResizable(win);
            zIndexCounter++; win.style.zIndex = zIndexCounter;
            // Render content
            const body = document.getElementById('gvbody-' + viewId);
            renderGuiContent(view, body);
        };

        window.closeGuiViewer = function(id) {
            const v = guiViewers[id];
            if (v) { v.el.classList.add('closed'); v.running = false; }
        };
        window.minimizeGuiViewer = function(id) {
            const v = guiViewers[id];
            if (v) { v.el.classList.add('minimized'); v.minimized = true; }
        };
        window.maximizeGuiViewer = function(id) {
            const v = guiViewers[id];
            if (!v) return;
            const winEl = v.el;
            if (!v.isMaximized) {
                winEl.dataset.prevLeft = winEl.style.left; winEl.dataset.prevTop = winEl.style.top;
                winEl.dataset.prevW = winEl.style.width; winEl.dataset.prevH = winEl.style.height;
                winEl.style.cssText += ';position:fixed;left:0;top:28px;width:100vw;max-width:100vw;height:calc(100vh - 28px);max-height:calc(100vh - 28px);border-radius:0;margin:0;';
                document.getElementById('os-desktop').classList.add('dock-hidden');
                v.isMaximized = true;
            } else {
                winEl.style.position = 'absolute'; winEl.style.left = winEl.dataset.prevLeft || '80px';
                winEl.style.top = winEl.dataset.prevTop || '50px'; winEl.style.width = winEl.dataset.prevW || '680px';
                winEl.style.height = winEl.dataset.prevH || '520px'; winEl.style.maxWidth = ''; winEl.style.maxHeight = '';
                winEl.style.borderRadius = ''; winEl.style.margin = '';
                document.getElementById('os-desktop').classList.remove('dock-hidden');
                v.isMaximized = false;
            }
        };

        function renderGuiContent(view, container) {
            container.style.cssText = 'padding:24px 28px;overflow-y:auto;height:100%;font-family:"Ubuntu Mono",monospace;background:var(--bg);color:var(--text);';
            if (view === 'about') {
                container.innerHTML = '<h2 style="color:var(--prompt);margin-bottom:6px">Rohan Unbeg</h2><p style="color:var(--dim);margin-bottom:16px">Backend Developer · Open Source Contributor</p><div style="display:grid;gap:10px">' +
                    guiRow('Education', 'CS @ Vishwakarma University', '#729fcf') +
                    guiRow('Current', 'Contributor @ Oppia Foundation', '#4ac94a') +
                    guiRow('Focus', 'Backend infra · Data integrity · CI workflows', '#e9b96e') +
                    guiRow('Learning', 'System Design · Apache Beam · GCP', '#ad7fa8') +
                    guiRow('Status', '<span style="color:#4ac94a">● Open to opportunities</span>', '#34e2e2') +
                    '</div><p style="margin-top:20px;color:var(--dim);font-size:12px;line-height:1.8">Passionate about resilient infrastructure, fixing technical debt, and scaling tools for global learners.</p>';
            } else if (view === 'skills') {
                const skills = [['Python','#4ac94a',92],['TypeScript','#729fcf',84],['JavaScript','#e9b96e',80],['Angular','#dd0031',78],['React','#61dafb',65],['Node.js','#6da55f',72],['GCP','#4285f4',68],['Docker','#0db7ed',62],['PostgreSQL','#336791',70],['MongoDB','#4ea94b',65]];
                container.innerHTML = '<h2 style="color:var(--prompt);margin-bottom:16px">Tech Stack</h2>' +
                    skills.map(function(s){ return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>' + s[0] + '</span><span style="color:' + s[1] + '">' + s[2] + '%</span></div><div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px"><div style="width:' + s[2] + '%;height:100%;background:' + s[1] + ';border-radius:4px;transition:width 0.6s"></div></div></div>'; }).join('');
            } else if (view === 'experience') {
                container.innerHTML = '<h2 style="color:var(--prompt);margin-bottom:6px">Open Source Contributions</h2><p style="color:var(--dim);margin-bottom:20px">Oppia Foundation — 2024–present</p>' +
                    guiCommit('a8f2c91','Translation Count Validation','PR #24589','Validation mechanism to keep translation counts in sync across data models. Prevented silent data corruption in multi-language lessons.','https://github.com/oppia/oppia/pull/24589','#4ac94a') +
                    guiCommit('7d4b1e5','Translation Versioning System','PR #24401','Refactored storage layer to support robust versioning of translations — enabling seamless rollbacks and full change history.','https://github.com/oppia/oppia/pull/24401','#729fcf') +
                    '<p style="margin-top:16px"><a href="https://github.com/oppia/oppia/commits?author=rohan-unbeg" target="_blank" style="color:#729fcf">→ View all PRs on GitHub ↗</a></p>';
            } else if (view === 'contact') {
                container.innerHTML = '<h2 style="color:var(--prompt);margin-bottom:16px">Get in Touch</h2>' +
                    guiContact('GitHub','https://github.com/rohan-unbeg','github.com/rohan-unbeg','#ad7fa8') +
                    guiContact('LinkedIn','https://linkedin.com/in/rohanunbeg/','linkedin.com/in/rohanunbeg/','#729fcf') +
                    guiContact('Email','mailto:rohanunbeg0918@gmail.com','rohanunbeg0918@gmail.com','#e9b96e') +
                    guiContact('Twitter/X','https://twitter.com/rohanunbeg','@rohanunbeg','#34e2e2') +
                    '<p style="margin-top:20px;color:var(--dim);font-size:12px">● Open to internships, collaborations, and freelance work.</p>';
            } else if (view === 'ai-maintainer') {
                container.innerHTML = '<h2 style="color:var(--prompt);margin-bottom:6px">Autonomous AI Maintainer</h2><p style="color:#4ac94a;margin-bottom:12px">⭐ Featured Project</p><p style="color:var(--dim);font-size:13px;line-height:1.8;margin-bottom:16px">Dual-engine automated codebase upkeep tool powered by Gemini &amp; Groq. Scans repos for stale issues, generates fixes, and opens PRs autonomously.</p>' +
                    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">' + guiBadge('Python','#4ac94a') + guiBadge('AI/ML','#ad7fa8') + guiBadge('Automation','#e9b96e') + '</div>' +
                    '<a href="https://github.com/rohan-unbeg/autonomous-ai-maintainer" target="_blank" style="color:#729fcf">→ View on GitHub ↗</a>';
            } else if (view === 'stats') {
                container.innerHTML = '<h2 style="color:var(--prompt);margin-bottom:16px">GitHub Stats</h2>' +
                    '<img src="https://ghchart.rshah.org/e95420/rohan-unbeg" style="max-width:100%;border-radius:4px;border:1px solid var(--border);margin-bottom:12px;display:block" />' +
                    '<img src="https://streak-stats.demolab.com?user=rohan-unbeg&theme=dark&hide_border=true&background=160e1e&ring=e95420&fire=e95420&currStreakLabel=eeeeec" style="max-width:100%;border-radius:4px;border:1px solid var(--border);display:block" />';
            }
        }

        function guiRow(label, val, color) {
            return '<div style="display:flex;gap:12px;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:6px;border-left:3px solid ' + color + '"><span style="color:var(--dim);width:100px;flex-shrink:0;font-size:12px">' + label + '</span><span style="font-size:13px">' + val + '</span></div>';
        }
        function guiCommit(hash, title, pr, desc, url, color) {
            return '<div style="border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px"><div style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><code style="color:#e9b96e;font-size:11px">' + hash + '</code><a href="' + url + '" target="_blank" style="color:' + color + ';font-size:11px">' + pr + ' ↗</a></div><div style="font-weight:bold;margin-bottom:6px">' + title + '</div><p style="color:var(--dim);font-size:12px;line-height:1.7">' + desc + '</p></div>';
        }
        function guiContact(label, url, display, color) {
            return '<a href="' + url + '" target="_blank" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:8px;text-decoration:none;border:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background=\'rgba(255,255,255,0.08)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.04)\'"><span style="color:var(--dim);width:80px;font-size:12px">' + label + '</span><span style="color:' + color + '">' + display + '</span><span style="margin-left:auto;color:var(--dim)">↗</span></a>';
        }
        function guiBadge(label, color) {
            return '<span style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;padding:3px 10px;border-radius:12px;font-size:11px">' + label + '</span>';
        }

        // ── Boot sequence ────────────────────────────────────────────────────────────
        async function boot() {
            const bootLines = [
                { txt: 'Ubuntu portfolio OS 24.04 LTS — initializing...', cls: 'c-dim' },
                { txt: 'Loading: [python] [typescript] [gcp] [apache-beam]', cls: 'c-dim', delay: 180 },
                { txt: 'Mounting: ./projects ./experience ./contact', cls: 'c-dim', delay: 360 },
                { txt: '✓ Ready. Welcome to Rohan\'s portfolio.', cls: 'c-green bold', delay: 540 },
            ];

            for (const l of bootLines) {
                if (l.delay) await sleep(l.delay);
                line(`  <span class="${l.cls}">${l.txt}</span>`);
            }

            await sleep(700);
            render('menu');
            bootDone = true;
            input.focus();
            renderDesktopIcons();
        }

        function renderDesktopIcons() {
            const container = document.getElementById('desktop-icons');
            if (!container) return;
            const items = [
                {
                    name: 'About Me',
                    cmd: "openGuiViewer('about')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><circle cx="18" cy="11" r="7" fill="#5eafff"/><ellipse cx="18" cy="28" rx="11" ry="7" fill="#3a7bd5"/></svg>'
                },
                {
                    name: 'Projects',
                    cmd: "openApp('explorer')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><path d="M3 9 Q3 5 7 5 L14 5 L16 8 L30 8 Q33 8 33 12 L33 28 Q33 31 30 31 L6 31 Q3 31 3 28 Z" fill="#f5c518"/><path d="M3 12 L33 12 L33 28 Q33 31 30 31 L6 31 Q3 31 3 28 Z" fill="#ffd740"/></svg>'
                },
                {
                    name: 'Skills',
                    cmd: "openGuiViewer('skills')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="4" y="20" width="6" height="12" rx="1" fill="#e95420"/><rect x="13" y="13" width="6" height="19" rx="1" fill="#7c3aed"/><rect x="22" y="8" width="6" height="24" rx="1" fill="#059669"/><rect x="31" y="16" width="4" height="16" rx="1" fill="#f59e0b"/></svg>'
                },
                {
                    name: 'Experience',
                    cmd: "openGuiViewer('experience')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="4" y="14" width="28" height="18" rx="3" fill="#7c3aed"/><rect x="12" y="10" width="12" height="6" rx="2" fill="#a78bfa" stroke="#7c3aed" stroke-width="1.5"/><rect x="14" y="21" width="8" height="2" rx="1" fill="#fff" opacity="0.5"/></svg>'
                },
                {
                    name: 'Contact',
                    cmd: "openGuiViewer('contact')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="3" y="8" width="30" height="20" rx="4" fill="#0ea5e9"/><path d="M3 12 L18 21 L33 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
                },
                {
                    name: 'Resume.pdf',
                    cmd: "openApp('pdf')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><path d="M6 2 L24 2 L30 8 L30 34 L6 34 Z" fill="#ef4444"/><path d="M24 2 L24 8 L30 8 Z" fill="#fca5a5"/><text x="18" y="23" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff" font-family="monospace">PDF</text></svg>'
                },
                {
                    name: 'SugarSync',
                    cmd: "openApp('sugarsync')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="4" y="4" width="28" height="28" rx="6" fill="#22c55e"/><rect x="8" y="8" width="20" height="20" rx="4" fill="#16a34a"/><circle cx="18" cy="18" r="5" fill="#86efac"/><circle cx="18" cy="18" r="2" fill="#fff"/></svg>'
                },
                {
                    name: 'GitHub',
                    cmd: "window.open('https://github.com/rohan-unbeg','_blank')",
                    icon: '<svg viewBox="0 0 36 36" width="36" height="36"><circle cx="18" cy="18" r="16" fill="#24292e"/><path d="M18 6C11.37 6 6 11.37 6 18c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C26.565 27.795 30 23.295 30 18c0-6.63-5.37-12-12-12Z" fill="#fff"/></svg>'
                }
            ];
            let html = '';
            items.forEach(i => {
                html += '<div class="desktop-icon" onclick="' + i.cmd + '" title="' + i.name + '">' +
                    '<div class="desktop-icon-img">' + i.icon + '</div>' +
                    '<div class="desktop-icon-name">' + i.name + '</div>' +
                    '</div>';
            });
            container.innerHTML = html;
        }

        // ── OS Desktop functions ─────────────────────────────────────────────────────
        function osUpdateClock() {
            const el = document.getElementById('os-clock');
            if (el) {
                const now = new Date();
                const str = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
                            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                el.textContent = str;
            }
        }
        setInterval(osUpdateClock, 1000);
        osUpdateClock();

        // ── Real Battery & Network ────────────────────────────────────────────────
        function updateBattery(battery) {
            const pct = Math.round(battery.level * 100);
            const charging = battery.charging;
            const textEl = document.getElementById('os-battery-text');
            const fillEl = document.getElementById('os-battery-fill');
            const indicator = document.getElementById('os-battery-indicator');
            if (textEl) textEl.textContent = (charging ? '⚡ ' : '') + pct + '%';
            if (fillEl) {
                const w = Math.round((pct / 100) * 14);
                fillEl.setAttribute('width', w);
                fillEl.setAttribute('fill', pct <= 20 ? '#ef2929' : pct <= 40 ? '#e9b96e' : '#4ac94a');
            }
            if (indicator) indicator.title = (charging ? 'Charging: ' : 'Battery: ') + pct + '%';
            battery.addEventListener('levelchange', function() { updateBattery(battery); });
            battery.addEventListener('chargingchange', function() { updateBattery(battery); });
        }

        if (navigator.getBattery) {
            navigator.getBattery().then(updateBattery).catch(function() {});
        }

        function updateNetworkStatus() {
            const textEl = document.getElementById('os-network-text');
            const indicator = document.getElementById('os-network-indicator');
            if (!textEl) return;
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!navigator.onLine) {
                textEl.textContent = 'Offline';
                if (indicator) indicator.style.opacity = '0.4';
            } else if (conn) {
                const type = conn.effectiveType || conn.type || 'Wi-Fi';
                const map = { 'wifi': 'Wi-Fi', '4g': '4G', '3g': '3G', '2g': '2G', 'ethernet': 'LAN', 'slow-2g': '2G' };
                textEl.textContent = map[type.toLowerCase()] || type;
                if (indicator) indicator.style.opacity = '1';
            } else {
                textEl.textContent = 'Wi-Fi';
            }
        }
        updateNetworkStatus();
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

        // ── Dock hover-reveal when hidden (maximized window) ────────────────────────
        (function() {
            var dockRevealTimeout;
            document.addEventListener('mousemove', function(e) {
                var desktop = document.getElementById('os-desktop');
                if (!desktop || !desktop.classList.contains('dock-hidden')) return;
                var dock = desktop.querySelector('.os-dock');
                if (!dock) return;
                // Reveal dock when mouse is within 60px of bottom edge
                if (e.clientY >= window.innerHeight - 60) {
                    dock.style.transform = 'translateX(-50%) translateY(0)';
                    dock.style.opacity = '1';
                    dock.style.pointerEvents = 'all';
                    clearTimeout(dockRevealTimeout);
                } else {
                    clearTimeout(dockRevealTimeout);
                    dockRevealTimeout = setTimeout(function() {
                        if (desktop.classList.contains('dock-hidden')) {
                            dock.style.transform = '';
                            dock.style.opacity = '';
                            dock.style.pointerEvents = '';
                        }
                    }, 600);
                }
            });
        })();

        function osToggleMenu() {
            const menu = document.getElementById('os-power-menu');
            if (menu) menu.classList.toggle('open');
            // Close calendar if open
            const cal = document.getElementById('os-calendar');
            if (cal) cal.classList.remove('open');
        }

        function toggleCalendar() {
            const cal = document.getElementById('os-calendar');
            if (!cal) return;
            cal.classList.toggle('open');
            // Always keep calendar above all windows
            cal.style.zIndex = 999999;
            // Close other menus
            const menu = document.getElementById('os-power-menu');
            if (menu) menu.classList.remove('open');
            
            if (cal.classList.contains('open')) {
                renderCalendar();
            }
        }

        function renderCalendar() {
            const cal = document.getElementById('os-calendar');
            const now = new Date();
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
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
                const isToday = (i === now.getDate()) ? 'today' : '';
                html += `<div class="cal-day ${isToday}">${i}</div>`;
            }
            
            html += `</div>`;
            cal.innerHTML = html;
        }

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('os-power-menu');
            const btn = document.getElementById('os-menu-btn');
            const cal = document.getElementById('os-calendar');
            const clock = document.getElementById('os-clock');
            
            if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.remove('open');
            }
            if (cal && clock && !cal.contains(e.target) && !clock.contains(e.target)) {
                cal.classList.remove('open');
            }
        });

        // ── Snake App Logic ──────────────────────────────────────────────────────────
        let snakeAppInterval;
        let snakeAppKeyHandler;
        function initSnakeApp() {
            const container = document.getElementById('snake-app-container');
            if (!container) return;
            container.innerHTML = '';

            const scoreEl = document.createElement('div');
            scoreEl.style.cssText = 'text-align:center;color:#4ac94a;font-family:monospace;font-size:13px;margin-bottom:12px;';
            scoreEl.innerHTML = 'Score: <b id="app-snk-score">0</b> | Speed: <b id="app-snk-speed">1x</b><br><span style="color:#6a5572;font-size:10px;">Arrow Keys to play</span>';
            container.appendChild(scoreEl);

            const canvas = document.createElement('canvas');
            const SIZE = 360;
            const box = 20;
            const cols = Math.floor(SIZE / box);
            const rows = Math.floor(SIZE / box);
            canvas.width = cols * box;
            canvas.height = rows * box;
            canvas.style.cssText = 'display:block;background:#000;border:2px solid #3a1a40;border-radius:4px;';
            container.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            let snake = [{x: Math.floor(cols/2) * box, y: Math.floor(rows/2) * box}];
            let food = randomFood(cols, rows, box, snake);
            let score = 0;
            let d = 'RIGHT';
            let nextD = 'RIGHT';
            let speed = 300;

            function randomFood(cols, rows, box, snake) {
                let pos;
                do {
                    pos = {
                        x: Math.floor(Math.random() * cols) * box,
                        y: Math.floor(Math.random() * rows) * box
                    };
                } while (snake.some(s => s.x === pos.x && s.y === pos.y));
                return pos;
            }

            snakeAppKeyHandler = function(e) {
                const map = { ArrowLeft: 'LEFT', ArrowUp: 'UP', ArrowRight: 'RIGHT', ArrowDown: 'DOWN' };
                if (!map[e.key]) return;
                e.preventDefault();
                const opp = { LEFT: 'RIGHT', RIGHT: 'LEFT', UP: 'DOWN', DOWN: 'UP' };
                if (map[e.key] !== opp[d]) nextD = map[e.key];
            };
            document.addEventListener('keydown', snakeAppKeyHandler);

            function draw() {
                d = nextD;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                for (let gx = 0; gx < cols; gx++) {
                    for (let gy = 0; gy < rows; gy++) {
                        ctx.fillStyle = 'rgba(255,255,255,0.03)';
                        ctx.fillRect(gx * box + box/2 - 1, gy * box + box/2 - 1, 2, 2);
                    }
                }

                ctx.fillStyle = '#ef2929';
                ctx.beginPath();
                ctx.roundRect(food.x + 3, food.y + 3, box - 6, box - 6, 3);
                ctx.fill();

                for (let i = 0; i < snake.length; i++) {
                    ctx.fillStyle = (i === 0) ? '#e95420' : (i % 2 === 0 ? '#4ac94a' : '#3da83d');
                    ctx.beginPath();
                    ctx.roundRect(snake[i].x + 1, snake[i].y + 1, box - 2, box - 2, i === 0 ? 4 : 2);
                    ctx.fill();
                }

                let nx = snake[0].x;
                let ny = snake[0].y;
                if (d === 'LEFT')  nx -= box;
                if (d === 'UP')    ny -= box;
                if (d === 'RIGHT') nx += box;
                if (d === 'DOWN')  ny += box;

                if (nx < 0 || nx >= canvas.width || ny < 0 || ny >= canvas.height ||
                    snake.slice(1).some(s => s.x === nx && s.y === ny)) {
                    clearInterval(snakeAppInterval);
                    snakeAppInterval = null;
                    document.removeEventListener('keydown', snakeAppKeyHandler);
                    
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ef2929';
                    ctx.font = 'bold 24px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px monospace';
                    ctx.fillText('Click to restart', canvas.width/2, canvas.height/2 + 20);
                    
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
                    document.getElementById('app-snk-score').textContent = score;
                    document.getElementById('app-snk-speed').textContent = lvl + 'x';
                } else {
                    snake.pop();
                }

                snake.unshift({x: nx, y: ny});
            }

            snakeAppInterval = setInterval(draw, speed);
        }

        function stopSnakeGame() {
            if (snakeAppInterval) {
                clearInterval(snakeAppInterval);
                snakeAppInterval = null;
            }
            if (snakeAppKeyHandler) {
                document.removeEventListener('keydown', snakeAppKeyHandler);
                snakeAppKeyHandler = null;
            }
        }

        boot();
