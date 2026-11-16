(function () {
  'use strict';
  // 开发者查看模式：链接带 ?dev=1 时，所有门视为已过、所有剧情标记视为已达成，进度存在单独的 beimian.state.dev，不碰正常存档。
  // 同一标签页里继续点链接也保持这个模式（记在 sessionStorage）。设计稿 metrics.html 的页面链接都带这个参数。
  const DEV = /[?&]dev=1\b/.test(location.search) || sessionStorage.getItem('beimian.dev') === '1';
  const PROGRESS = ['called', 'dialed', 'signed', 'choice', 'rescueGo', 'endingSeen'];
  if (DEV) {
    sessionStorage.setItem('beimian.dev', '1');
    [['beimian.qzone', '1'], ['beimian.ys', '1'], ['beimian.pin', '1'], ['beimian.fj', '1'], ['beimian.qzalb', '1'], ['beimian.cloud', '1'], ['beimian.jwt', 'lin'], ['beimian.qzw', '1'], ['beimian.oajwt', '1'], ['beimian.qc.role', 'gao']].forEach(([k, v]) => sessionStorage.setItem(k, v));
    document.addEventListener('DOMContentLoaded', () => { const b = document.createElement('div'); b.textContent = '开发者查看模式（所有门已开，不影响正常存档）'; b.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99999;background:#c92a2a;color:#fff;font:12px sans-serif;padding:3px 8px;border-radius:4px;opacity:.85;pointer-events:none'; document.body.appendChild(b); });
  }
  const KEY = DEV ? 'beimian.state.dev' : 'beimian.state.v1';

  function blank() { return { flags: {}, read: {}, seen: {}, ans: {}, ending: null }; }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { flags: raw.flags || {}, read: raw.read || {}, seen: raw.seen || {}, ans: raw.ans || {}, ending: raw.ending || null };
    } catch (e) {
      return blank();
    }
  }
  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('bm-change'));
  }

  const listeners = [];
  window.addEventListener('storage', e => { if (e.key === KEY) { window.BM.remote = true; try { listeners.forEach(fn => fn()); } finally { window.BM.remote = false; } } });  // 2026-11-14：别的标签页改的存档——BM.remote 为真，页面跟着重画但不把新消息标成已看过、桌面不弹提示
  window.addEventListener('bm-change', () => listeners.forEach(fn => fn()));

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // 数据里用 [[...]] 标线索（给设计稿统计用）。游戏里不加粗、不标注：线索要混在细节里，由玩家自己发现。
  function rich(value) { return kw(esc(value).replace(/\[\[([\s\S]+?)\]\]/g, '<span class="k">$1</span>')).replace(/\n/g, '<br>'); }
  // 数据里本来就是 HTML 的内容（证件、名片、信），同样只去掉 [[...]] 标记。
  function marks(html) { return kw(String(html || '').replace(/\[\[([\s\S]+?)\]\]/g, '<span class="k">$1</span>')); }
  // 只有要搜索的词加粗，而且只加粗一个词：数据里写成 {{词}}
  function kw(s) { return String(s).replace(/(?<!\*)\*\*(?!\*)([^*<>\n]+?)(?<!\*)\*\*(?!\*)/g, '<b class="em">$1</b>').replace(/\{\{([^{}]+?)\}\}/g, '<b class="kw">$1</b>'); }
  // 比对答案和关键词前，统一全角、空格、标点。
  function norm(value) {
    return String(value || '')
      .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/[\s\u3000·•.,，。、:：\-—_/“”"'‘’！!？?《》〈〉「」『』【】()（）]+/g, '')
      .toLowerCase();
  }

  const BM = {
    esc, rich, norm, marks, kw,
    get state() { return load(); },
    dev: DEV,
    flag(name) { if (DEV && !PROGRESS.includes(name)) return true; return !!load().flags[name]; },
    set(name, value) {
      const state = load();
      const next = value === undefined ? true : value;
      if (state.flags[name] === next) return;
      state.flags[name] = next;
      save(state);
    },
    read(id) { return DEV ? true : !!load().read[id]; },
    markRead(id) {
      const state = load();
      if (state.read[id]) return;
      state.read[id] = true;
      save(state);
    },
    seen(id) { return load().seen[id] || 0; },
    markSeen(id, n) {
      const state = load();
      if ((state.seen[id] || 0) >= n) return;
      state.seen[id] = n;
      save(state);
    },
    ans(key) { return load().ans[key]; },
    setAns(key, value) { const state = load(); state.ans[key] = value; save(state); },
    clearInterview() {
      const state = load();
      Object.keys(state.ans || {}).forEach(k => { if (/^(step|tip|log|accused|sign|final|rescue|call.*|ivFail_.*)$/.test(k)) delete state.ans[k]; });  // 只清询问笔录和电话；妈妈的反问等别处的记录留着
      state.ending = null;
      ['called', 'dialed', 'signed', 'choice', 'rescueGo', 'endingSeen'].forEach(k => { delete state.flags[k]; });
      save(state);
    },
    setEnding(kind) { const state = load(); state.ending = kind; state.flags.endingSeen = true; save(state); },
    reset() { localStorage.removeItem(KEY); localStorage.removeItem('beimian.notified'); localStorage.removeItem('beimian.notified.v2'); window.dispatchEvent(new CustomEvent('bm-change')); },
    onChange(fn) { listeners.push(fn); },
    // 推送和门槛：条件写在 data.js 的 BM_DATA.conds 里。
    cond(name) {
      if (DEV) return true;
      const fn = window.BM_DATA && BM_DATA.conds[name];
      return fn ? !!fn(load()) : true;
    },
    clock() {
      const s = load();
      for (const [test, time] of BM_DATA.clock) if (test(s)) return time;
      return '08:00';
    },
    route(handlers, fallback) {
      function run() {
        const hash = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
        for (const [pattern, handler] of handlers) {
          const m = hash.match(pattern);
          if (m) { handler(...m.slice(1)); return; }
        }
        (fallback || (() => {}))(hash);
      }
      window.addEventListener('hashchange', () => { run(); window.scrollTo(0, 0); });
      run();
      return run;
    },
    // 右下角弹一条像 Windows 那样的消息通知，点了打开对应软件的标签页
    // 单入口版（用户 2026-11-12）：12309 那篇一开始打不开；搜到过它、又进过宋晴的 QQ 空间、点开看过爸爸那张照片，右下角弹一次“可以查看了”
    // 单入口版（用户 2026-11-12）：第 2 问答完，又进过清溪老吴的微博或旧版警务通，妈妈主动来说爸爸那张照片（只弹一次）
    // 单入口版（用户 2026-11-13）：妈妈两段话都由她开头。第一段：读到计价帖（momQ1）；第二段：车费答对、读过陶勇军询问笔录（momQ2）。各弹一次
    momNotify() {
      const D = window.BM_DATA; if (!D || !D.singleEntry) return;
      const go = text => setTimeout(() => BM.notify({ icon: 'wx', app: '微信', title: '妈妈', text, url: 'wechat.html', ms: 12000 }), 900);
      if (BM.cond('momQ1') && !BM.read('n_momHi')) { BM.markRead('n_momHi'); const m = (D.wxChats.mom.msgs || []).filter(x => x.req === 'momQ1' && x.text).slice(-1)[0]; if (m) go(m.text); }
      else if (BM.cond('momQ2') && !BM.read('n_momQ2')) { BM.markRead('n_momQ2'); const q = (D.momQ || []).find(x => x.id === 'mom2'); const m = q && (q.open || []).find(x => x.text); if (m) go(m.text); }
    },
    dadCheck() {
      const D = window.BM_DATA;
      if (!D || !D.singleEntry || !D.dadTalk || BM.read('n_dad_zip') || !BM.cond('dadTalk')) return;
      BM.markRead('n_dad_zip');
      setTimeout(() => BM.notify({ icon: 'wx', app: '微信', title: '妈妈', text: D.dadNotify || '', url: 'wechat.html', ms: 12000 }), 900);
    },
    // 单入口版（2026-11-14）：澜江检察公众号的两次推送，各弹一次右下角提示
    jcyCheck() {
      const D = window.BM_DATA; if (!D || !D.singleEntry || !D.jcy) return;
      const push = (key, text) => { if (BM.read(key)) return; BM.markRead(key); setTimeout(() => BM.notify({ icon: 'wx', app: '微信', title: '澜江检察', text, url: 'wechat.html#/chat/jcy', ms: 12000 }), 900); };
      if (BM.cond('jcyPush')) push('n_jcyPush', '推送了一篇文章：澜江检察 12309 检察服务中心');
      if (BM.cond('jcyLaw')) push('n_jcyLaw', '推送了一篇文章：【以案释法】申诉人如何保全电子证据');
    },
    mpReadyCheck() {
      const D = window.BM_DATA;
      if (D && D.singleEntry && D.jcy) return BM.jcyCheck();
      if (!D || !D.singleEntry || !BM.read('mp_found') || BM.read('n_mpReady') || !BM.cond('callOk')) return;
      BM.markRead('n_mpReady');
      setTimeout(() => BM.notify({ icon: 'wx', app: '微信', title: '澜江检察', text: D.mpReadyText || '文章已恢复，可以查看了。', url: 'web.html#/mp/notice', tab: 'bm_edge', ms: 12000 }), 900);
    },
    notify(o) {
      let box = document.getElementById('notify') || document.querySelector('.bm-notify');
      if (!box) { box = document.createElement('div'); box.className = 'bm-notify'; box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:995;display:flex;flex-direction:column;gap:8px'; document.body.appendChild(box); }
      const el = document.createElement('div');
      el.className = 'toast11';
      el.innerHTML = '<div class="t-app"><i class="appic sm ic-' + esc(o.icon || 'wx') + '"></i>' + esc(o.app || '') + '<span>现在</span></div><b>' + esc(o.title || '') + '</b><p>' + esc(o.text || '') + '</p>';
      el.addEventListener('click', () => { const w = window.open(o.url, '_blank'); if (w) w.focus(); el.remove(); });
      box.appendChild(el);
      setTimeout(() => el.remove(), o.ms || 9000);
    },
    toast(message) {
      let box = document.querySelector('.bm-toast');
      if (!box) { box = document.createElement('div'); box.className = 'bm-toast'; document.body.appendChild(box); }
      box.textContent = message;
      box.classList.add('show');
      clearTimeout(box._t);
      box._t = setTimeout(() => box.classList.remove('show'), 2600);
    },
    // 把一段 HTML（证件、名片、照片）放大显示。
    show(html, caption) {
      const box = document.createElement('div');
      box.className = 'bm-box';
      box.innerHTML = '<button class="x" type="button" aria-label="关闭">×</button><div class="in">' + marks(html) + (caption ? '<div class="cap">' + esc(caption) + '</div>' : '') + '</div>';
      box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('x')) box.remove(); });
      window.addEventListener('hashchange', () => box.remove(), { once: true });
      document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { box.remove(); document.removeEventListener('keydown', onKey); } });
      document.body.appendChild(box);
    },
    needLaptop() {
      if (DEV || load().flags.laptop) return false;
      document.body.innerHTML = '<div class="locked"><b>请在许禾的电脑上打开</b>这个页面要从许禾电脑的桌面进入。<br><a href="index.html">打开许禾的电脑</a></div>';
      return true;
    },
    // 是否嵌在许禾电脑的窗口里（浏览器、图像处理）
    embedded: window.self !== window.top,
    // 内嵌页面请电脑做事（例如“用手机拨打”）。file:// 下页面之间不能直接调用脚本，所以走本地存储。
    request(type, payload) {
      if (BM.embedded) localStorage.setItem(REQ, JSON.stringify({ type, payload: payload || null, t: Date.now() }));
      else window.open('index.html#/' + (type === 'dial' ? 'dial' : ''), '_blank');
    },
    onRequest(fn) {
      window.addEventListener('storage', e => { if (e.key === REQ && e.newValue) { try { fn(JSON.parse(e.newValue)); } catch (err) { /* 忽略坏数据 */ } } });
    },
    // 浏览器外壳：标签页、前进后退刷新、地址栏、收藏夹
    chrome(o) {
      // 收藏栏不放加工系统：它唯一的入口是钉钉项目组群的置顶公告
      const marks = [];
      return '<div class="br-chrome"><div class="br-tabs"><div class="br-tab"><i class="fav fav-' + esc(o.fav || 'q') + '"></i><span>' + esc(o.title || '新标签页') + '</span><b>×</b></div><div class="br-plus">＋</div></div>'
        + '<div class="br-bar"><button type="button" class="br-btn" data-br="back" title="后退">←</button><button type="button" class="br-btn" data-br="fwd" title="前进">→</button><button type="button" class="br-btn" data-br="reload" title="刷新">⟳</button>'
        + '<div class="br-addr"><i class="br-lock">' + (/^https/.test(o.url) ? '🔒' : 'ⓘ') + '</i><input id="brAddr" value="' + esc(o.url) + '" spellcheck="false" autocomplete="off"></div><button type="button" class="br-btn" title="收藏">☆</button><button type="button" class="br-btn" data-br="menu" title="设置及其他">⋯</button><div class="br-menu" id="brMenu" hidden><a href="web.html#/history">历史记录<span>Ctrl+H</span></a><span class="off">下载<span>Ctrl+J</span></span><span class="off">收藏夹<span>Ctrl+Shift+O</span></span><span class="off">新建 InPrivate 窗口</span></div></div>'
        + (marks.length ? '<div class="br-marks">' + marks.map(m => '<a href="' + m[1] + '"><i class="fav fav-' + m[2] + '"></i>' + m[0] + '</a>').join('') + '</div>' : '') + '</div>';
    },
    bindChrome() {
      document.querySelectorAll('[data-br]').forEach(b => b.addEventListener('click', () => {
        const k = b.getAttribute('data-br');
        if (k === 'back') history.back();
        if (k === 'fwd') history.forward();
        if (k === 'reload') location.reload();
        if (k === 'menu') { const m = document.getElementById('brMenu'); if (m) m.hidden = !m.hidden; }
      }));
      const addr = document.getElementById('brAddr');
      if (addr) addr.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const v = addr.value.trim();
        if (!v) return;
        const s = v.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
        const go = h => { location.href = 'web.html#' + h; };
        if (/^oa\.lcga\.gov\.cn\/jwt(\/|$)/i.test(s)) return go('/oajwt');
        if (window.BM_DATA && window.BM_DATA.singleEntry) {
          // 单入口版：地址栏只认通话记录页眉上那个旧版网址；输当前页的网址等于刷新；其余网址都打不开，不能当第二个入口
          const here = String(addr.defaultValue || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
          if (s.toLowerCase() === here.toLowerCase()) return location.reload();
          if (/^(www\.)?qianxun\.com/i.test(s)) return go('/search');
          if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(s)) return go('/err/' + encodeURIComponent(v));
          return go('/search/' + encodeURIComponent(v));
        }
        if (/^oa\.lcga\.gov\.cn(\/|$)/i.test(s)) return go('/oa');
        if (/^portal\.lcga\.gov\.cn\/jwt(\/|$)/i.test(s)) return go('/jwt');
        if (/^portal\.lcga\.gov\.cn(\/|$)/i.test(s)) return go('/portal');
        if (!(window.BM_DATA && window.BM_DATA.qzwOff) && /6630172/.test(s)) return go('/qzw');
        if (/qzone\.qq\.com|^qzone$/i.test(s)) return go('/qzone');
        if (/^bbs\.liulin\.net/i.test(s)) return go('/bbs');
        if (/^(s\.)?weibo\.com/i.test(s)) return go('/weibo');
        if (/^(www\.)?qianxun\.com/i.test(s)) return go('/search');
        if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(s)) return go('/err/' + encodeURIComponent(v));
        go('/search/' + encodeURIComponent(v));
      });
    }
  };
  const REQ = 'beimian.req';
  window.BM = BM;
})();
