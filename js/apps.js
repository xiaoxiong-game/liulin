// 《雨夜》各个软件页面（微信、钉钉、文件资源管理器、记事本、照片、打电话）。每个软件一个独立页面、一个网址。
(function () {
  'use strict';
  const APP = document.body.getAttribute('data-app');
  if (BM.needLaptop()) return;
  const D = BM_DATA;
  const root = document.getElementById('app');
  const esc = BM.esc, rich = BM.rich;
  const DING = Object.keys(D.dingChats);

  // ===== 打开别的页面：同一个软件始终在同一个标签页里 =====
  const TAB = { 'web.html': 'bm_edge', 'qc.html': 'bm_qc', 'viewer.html': 'bm_ps', 'wechat.html': 'bm_wechat', 'ding.html': 'bm_ding', 'folder.html': 'bm_folder', 'notes.html': 'bm_notes', 'photo.html': 'bm_photo', 'call.html': 'bm_call', 'index.html': 'bm_desk' };
  function openPage(url) {
    const file = url.split('#')[0];
    const w = window.open(url, '_blank');
    if (w) w.focus(); else location.href = url;
  }
  window.BM_openPage = openPage;

  // ===== 标题栏：回桌面、关闭 =====
  function titlebar(ic, title) {
    return '<div class="app-tb"><i class="appic sm ic-' + ic + '"></i><span class="app-title">' + esc(title) + '</span><button type="button" data-tb="desk" title="回到桌面">⌂ 桌面</button><button type="button" data-tb="close" class="x" title="关闭">✕</button></div>';
  }
  function bindTitlebar() {
    const d = root.querySelector('[data-tb="desk"]');
    if (d) d.addEventListener('click', () => openPage('index.html'));
    const c = root.querySelector('[data-tb="close"]');
    if (c) c.addEventListener('click', () => { window.close(); setTimeout(() => { location.href = 'index.html'; }, 150); });
  }
  function page(ic, title, body) {
    document.title = title;
    root.innerHTML = '<div class="app-page">' + titlebar(ic, title) + '<div class="app-main">' + body + '</div></div>';
    bindTitlebar();
  }

  // ===== 小工具 =====
  function avEl(name, cls, attrs) {
    const a = D.avatars[name] || (D.wxAvatars && D.wxAvatars[name]) || [String(name).slice(0, 1), '#888'];
    if (a[2]) return '<div class="av av-pic ' + (cls || '') + '" style="background:' + a[1] + ' url(' + a[2] + ') center/cover"' + (attrs || '') + '></div>';
    return '<div class="av ' + (cls || '') + '" style="background:' + a[1] + '"' + (attrs || '') + '>' + esc(a[0]) + '</div>';
  }
  const cardKey = name => Object.keys(D.dingCards || {}).find(k => D.dingCards[k].name === name);
  const cardAttr = name => { const k = cardKey(name); return k ? ' data-card="' + k + '" title="查看名片"' : ''; };
  const visible = list => list.filter(m => !m.req || BM.cond(m.req));
  const isToday = st => /^\d{1,2}:\d{2}$/.test(st);
  function countNew(list) {
    let today = false, n = 0;
    list.forEach(m => { if (m.stamp) today = today || isToday(m.stamp); else if (today && !m.me) n++; });
    return n;
  }
  function stampVal(st) {
    if (!st) return 0;
    const hm = (st.match(/(\d{1,2}):(\d{2})/) || [0, 0, 0]);
    const m = +hm[1] * 60 + +hm[2];
    if (isToday(st)) return 5e6 + m;
    if (/^昨天/.test(st)) return 4e6 + m;
    const wd = { '星期一': 16, '星期二': 17, '星期三': 18, '星期四': 19, '星期五': 20, '星期六': 14, '星期日': 15 };
    const w = Object.keys(wd).find(k => st.startsWith(k));
    if (w) return 3e6 + wd[w] * 2000 + m;
    const md = st.match(/(\d{1,2})月(\d{1,2})日/);
    return md ? (+md[1]) * 50000 + (+md[2]) * 2000 + m : 0;
  }
  function listTime(st) {
    if (!st) return '';
    if (isToday(st)) return st;
    if (/^昨天/.test(st)) return '昨天';
    const w = st.match(/^(星期.)/); if (w) return w[1];
    const md = st.match(/(\d{1,2})月(\d{1,2})日/); return md ? '26/' + md[1] + '/' + md[2] : '';
  }
  function momMsgs() {
    const list = D.wxChats.mom.msgs.filter(m => !m.req || BM.cond(m.req));  // 带 req 的消息（读完 8-21 笔录后妈妈的寒暄）条件满足才出现
    D.momQ.forEach(q => {
      if (D.singleEntry && D.dadTalk && q.id === 'mom3') return;
      if (q.open && BM.cond(q.req)) q.open.forEach(m => list.push(Object.assign({ who: '妈妈' }, m)));
      if (!BM.flag(q.id)) return;
      list.push({ me: true, text: q.ask });
      if (q.check) {  // 妈妈先反问（车费、凭什么说有关），答对才往下讲
        if (q.check.pre) q.check.pre.forEach(r => list.push(Object.assign({ who: '妈妈' }, r))); list.push({ who: '妈妈', text: q.check.prompt });
        const okA = BM.ans('momOk_' + q.id);
        if (!okA) { const tr = BM.ans('momTry_' + q.id); if (tr) { list.push({ me: true, text: tr }); list.push({ who: '妈妈', text: q.check.wrong }); } return; }
        list.push({ me: true, text: okA }); if (q.check.ok) list.push({ who: '妈妈', text: q.check.ok });
      }
      q.reply.forEach(r => list.push(Object.assign({ who: '妈妈' }, r)));
    });
    if (D.singleEntry && D.dadTalk && BM.cond('dadTalk')) D.dadTalk.forEach(m => list.push(Object.assign({ who: '妈妈' }, m)));
    return list;
  }
  const wxMsgs = id => (id === 'mom' ? momMsgs() : visible(D.wxChats[id].msgs));
  const dingMsgs = id => visible(D.dingChats[id].msgs);
  const wxUnread = id => Math.max(0, countNew(wxMsgs(id)) - BM.seen('w:' + id));
  const dingUnread = id => Math.max(0, countNew(dingMsgs(id)) - BM.seen('d:' + id));
  const lastStamp = list => { let s = ''; list.forEach(m => { if (m.stamp) s = m.stamp; }); return s; };
  const plainText = t => String(t || '').replace(/\[\[|\]\]|\{\{|\}\}/g, '');
  const lastPreview = m => !m ? '' : m.news ? '[链接] ' + plainText(m.news[0].title) : m.link ? '[链接] ' + plainText(m.link.title) : m.pic ? '[图片]' : plainText(m.text);
  const picHTML = id => (id === 'banquet' ? D.banquetSVG : D.photos[id].html);
  const picTitle = id => (id === 'banquet' ? '图片' : D.photos[id].title);
  // 朋友圈的图：纪念盒和墓碑是剧情照片，其余是日常照片
  const thumbSrc = id => (id === 'keepsake' ? 'img/keepsake.jpg' : id === 'tomb' ? 'img/tomb.jpg' : 'img/d/' + id + '.jpg');
  const fullPic = id => (id === 'keepsake' ? picHTML('keepsake') : '<img src="' + thumbSrc(id) + '" alt="" style="width:100%;display:block">');
  // 放大看图：点一下放大，再点一下还原
  function zoomShow(html, cap) {
    BM.show('<div class="zoomwrap"><div class="zoomin">' + html + '</div></div><p class="zoomtip">点图片放大 / 还原</p>', cap);
    const z = document.querySelector('.bm-box .zoomin');
    // 点哪儿就朝哪儿放大：放大后把点到的位置滚到中间
    if (z) z.addEventListener('click', e => {
      const r = z.getBoundingClientRect(); const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      z.classList.toggle('on');
      const w = z.parentElement;
      if (z.classList.contains('on') && w) setTimeout(() => { w.scrollLeft = fx * w.scrollWidth - w.clientWidth / 2; w.scrollTop = fy * w.scrollHeight - w.clientHeight / 2; }, 230); // 等宽度过渡（.2s）走完
    });
  }
  function msgHTML(m, meName, ding) {
    if (m.stamp) return '<div class="stamp">' + esc(m.stamp) + '</div>';
    const who = m.me ? meName : m.who;
    let body;
    if (m.news) body = '<div class="bubble news">' + m.news.map((n, i) => i === 0 ? '<a class="nw-main" href="' + esc(n.href) + '" data-url="' + esc(n.href) + '"><img src="' + esc(n.cover) + '" alt=""><b>' + esc(n.title) + '</b></a>' : '<a class="nw-sub" href="' + esc(n.href) + '" data-url="' + esc(n.href) + '"><span>' + esc(n.title) + '</span><img src="' + esc(n.cover) + '" alt=""></a>').join('') + '</div>';  // 公众号一主一副
    else if (m.link) body = '<a class="bubble link' + (m.link.thumb ? ' has-thumb' : '') + '" href="' + esc(m.link.href) + '" data-url="' + esc(m.link.href) + '"><span class="lt">' + BM.kw(esc(m.link.title)) + '</span><span>' + esc(m.link.sub) + '</span>' + (m.link.thumb ? '<img class="lk-thumb" src="' + esc(m.link.thumb) + '" alt="">' : '') + '<small>' + esc(m.link.src) + '</small></a>';  // 带 thumb 的卡片右侧有缩略图（2026-11-15）
    else if (m.pic) body = '<div class="bubble pic" data-photo="' + esc(m.pic) + '"><div class="thumb"><div class="shrink">' + BM.marks(picHTML(m.pic)) + '</div></div></div>';
    else body = '<div class="bubble">' + rich(m.text) + '</div>';
    const read = ding && m.me ? '<div class="readmark">已读</div>' : '';
    const ca = ding ? cardAttr(who) : '';
    return '<div class="msg' + (m.me ? ' me' : '') + '">' + avEl(who, '', ca) + '<div class="body">' + (m.me ? '' : '<div class="who"' + ca + '>' + esc(who) + '</div>') + body + read + '</div></div>';
  }
  function bindCommon() {
    root.querySelectorAll('[data-photo]').forEach(el => el.addEventListener('click', () => { const id = el.getAttribute('data-photo'); if (id === 'keepsake') { BM.markRead('mo0714'); openPage('photo.html#receipt'); return; } if (id === 'dadphoto') { BM.markRead('dad_photo'); BM.mpReadyCheck(); } zoomShow(picHTML(id), picTitle(id)); }));
    root.querySelectorAll('[data-url]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); const u = el.getAttribute('data-url'); if (u.charAt(0) === '#') { location.hash = u; return; } openPage(u); }));
  }
  const showing = () => document.visibilityState === 'visible';  // 别的标签页引起的重画由 BM.remote 拦住，不标已看过（2026-11-14）
  const route = () => decodeURIComponent(location.hash.replace(/^#/, '')) || '/';

  // ===== 微信 =====
  let wxQr = false, pop = false;
  function qrSVG() {
    let s = '', seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const finder = (x, y) => '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#111"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#111"/>';
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if (rnd() > 0.52) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#111"/>';
    }
    return '<rect width="21" height="21" fill="#fff"/>' + s + finder(0, 0) + finder(14, 0) + finder(0, 14);
  }
  function replyOptions(id) {
    if (id === 'mom') { const pendQ = D.momQ.find(q => q.check && BM.flag(q.id) && !BM.ans('momOk_' + q.id)); if (pendQ) return pendQ.check.choices ? pendQ.check.choices.map(c => ({ text: c, act: () => BM.setAns(new RegExp(pendQ.check.re).test(BM.norm(c)) ? 'momOk_' + pendQ.id : 'momTry_' + pendQ.id, c) })) : [];  // 妈妈在等你回答
      return D.momQ.filter(q => !BM.flag(q.id) && BM.cond(q.req)).map(q => ({ text: q.ask, act: () => BM.set(q.id) })); }
    if (id === 'xu' && BM.cond('sms')) return D.xuReplies.filter(r => !(r.once && BM.flag(r.id))).map(r => ({ text: r.text, act: () => {
      if (r.bad) { BM.show('<div class="bm-dlg"><h3>现在出发去找许禾？</h3><p>五点半，市局后门。带上她的电脑，别告诉别人。</p><div class="dlg-btns"><button type="button" class="go" id="dlgGo">立刻动身</button><button type="button" id="dlgWait">再等等</button></div></div>'); const dg = document.getElementById('dlgGo'), dw = document.getElementById('dlgWait'); if (dg) dg.addEventListener('click', () => { BM.set('choice'); BM.setEnding('bad'); location.href = 'ending.html#bad'; }); if (dw) dw.addEventListener('click', () => document.querySelectorAll('.bm-box').forEach(b => b.remove())); return; }  // 2026-11-14：不用浏览器自带的 confirm
      BM.set(r.id);
    } }));
    return [];
  }
  // 单入口版（2026-11-14）：公众号文章在微信里打开——12309 那篇带【用手机拨打】，结局后的普法文章提醒去看浏览器“其他设备的标签页”
  function wxArticle(aid) {
    const isMp = aid === 'mpnotice';
    const ok = isMp ? BM.cond('jcyPush') : (aid === 'law' || aid === 'oldsys') && BM.cond('jcyLaw');
    const head = '<div class="wx-head"><a class="wx-back" href="#/chat/jcy">‹</a> 澜江检察<b>···</b></div>';
    if (!ok) return '<div class="wx-chat">' + head + '<div class="wx-art"><p class="small" style="text-align:center;margin-top:60px">该内容暂时无法查看</p></div></div>';
    const a = isMp ? D.webPages.mpnotice : D.jcy[aid];
    BM.markRead(isMp ? 'mpnotice' : 'jcy_' + aid);
    return '<div class="wx-chat">' + head + '<div class="wx-art mp"><h1>' + esc(a.title) + '</h1><div class="mp-meta"><b>澜江检察</b>　' + esc(a.date || '') + '</div><div class="mp-body">' + a.html + '</div>' + (isMp ? '<button type="button" class="mp-call" id="dial">用手机拨打</button>' : '') + '</div></div>';
  }
  // 微信左上“搜索”“＋”：添加公众号（搜名称或微信号），关注后会话列表里多出“澜江检察”
  function wxAddAccount(q) {
    const J = D.jcy; if (!J) return;
    document.querySelectorAll('.bm-box').forEach(b => b.remove());
    const nq = BM.norm(q || '');
    const hit = !!nq && [J.name, J.wxid].some(k => BM.norm(k).toLowerCase() === nq.toLowerCase());  // 只认千寻那页名片上的名称或微信号（2026-11-14）
    const followed = BM.read('jcy_follow');
    const card = '<div class="wx-acct">' + avEl(J.name, 'big') + '<div><b>' + esc(J.name) + '</b><span>微信号：' + esc(J.wxid) + '</span><p>' + esc(J.intro) + '</p></div>' + (followed ? '<button type="button" class="wx-follow on" id="wxFollow">已关注 · 进入公众号</button>' : '<button type="button" class="wx-follow" id="wxFollow">关注</button>') + '</div>';
    BM.show('<div class="wx-add"><form id="wxAddF"><input id="wxAddQ" placeholder="搜索公众号名称或微信号" autocomplete="off" value="' + esc(q || '') + '"><button type="submit">搜索</button></form>' + (q ? (hit ? card : '<p class="small">没有找到相关公众号。</p>') : '') + '</div>', '添加公众号');
    const fm = document.getElementById('wxAddF'); if (fm) fm.addEventListener('submit', e => { e.preventDefault(); wxAddAccount(document.getElementById('wxAddQ').value.trim()); });
    const fb = document.getElementById('wxFollow'); if (fb) fb.addEventListener('click', () => { BM.markRead('jcy_follow'); BM.jcyCheck(); document.querySelectorAll('.bm-box').forEach(b => b.remove()); if (location.hash === '#/chat/jcy') wechat(); else location.hash = '#/chat/jcy'; });
    setTimeout(() => { const i = document.getElementById('wxAddQ'); if (i) i.focus(); }, 30);
  }
  function wechat() {
    if (!BM.flag('wx')) {
      page('wx', '微信', '<div class="wxlogin2"><div class="wl-av">' + avEl('许禾') + '</div><b>许禾</b><p class="small">你已在手机上退出电脑微信（今天 03:12）</p>'
        + (wxQr ? '<div class="qr"><svg viewBox="0 0 21 21" width="160" height="160" shape-rendering="crispEdges">' + qrSVG() + '</svg></div><p>请用手机微信扫码登录</p><button type="button" class="wl-btn" id="wxScan">点击进入陶雨的微信</button>'
          : '<button type="button" class="wl-btn" id="wxSwitch">切换账号</button>') + '</div>');
      const sw = document.getElementById('wxSwitch'); if (sw) sw.addEventListener('click', () => { wxQr = true; wechat(); });
      const sc = document.getElementById('wxScan'); if (sc) sc.addEventListener('click', () => { BM.set('wx'); location.hash = '#/chat/tutor'; });
      return;
    }
    const r = route();
    const albumM = r.match(/^\/album\/(.+)$/);
    const albumWho = albumM ? decodeURIComponent(albumM[1]) : '';
    const moments = r === '/moments' || !!albumWho;
    const m = r.match(/^\/chat\/(\w+)$/);
    const artM = D.singleEntry && D.jcy && BM.cond('jcyFollow') ? r.match(/^\/article\/(\w+)$/) : null;
    const pinned = k => (D.wxPinned || []).includes(k);  // 置顶（澜江检察关注后就置顶，2026-11-14）
    const order = Object.keys(D.wxChats).filter(k => wxMsgs(k).some(x => !x.stamp)).sort((a, b) => (pinned(b) - pinned(a)) || (stampVal(lastStamp(wxMsgs(b))) - stampVal(lastStamp(wxMsgs(a)))));
    const id = moments ? '' : artM ? 'jcy' : (m && D.wxChats[m[1]] ? m[1] : order[0]);
    const list = order.map(k => {
      const c = D.wxChats[k];
      const ms = wxMsgs(k);
      const last = ms.filter(x => !x.stamp).slice(-1)[0];
      const u = wxUnread(k);
      return '<a class="wx-row' + (k === id ? ' on' : '') + (pinned(k) ? ' pinned' : '') + '" href="#/chat/' + k + '">' + avEl(c.av) + (u ? '<span class="dot">' + u + '</span>' : '') + '<div class="mid"><div class="name"><span class="nm">' + esc(c.name) + '</span><i>' + esc(listTime(lastStamp(ms))) + '</i></div><div class="last">' + esc((last && last.who && !last.me && k === 'dorm' ? last.who + '：' : '') + lastPreview(last)) + '</div></div></a>';
    }).join('');
    let right;
    if (artM) { BM.markRead('wx_jcy'); right = wxArticle(artM[1]); }
    else if (moments) {
      BM.markRead('selfMoments');
      const posts = albumWho && D.atmoOff ? [] : D.feed.map((p, i) => [p, i]).filter(([p]) => !albumWho || p.who === albumWho);  // 气氛页关闭：朋友相册只显示“最近三天”
      const coverWho = albumWho || '陶雨';
      right = '<div class="mo"><div class="mo-cover"><span>' + esc(coverWho) + '</span>' + avEl(coverWho, 'big') + '</div>' + (albumWho ? '<div class="mo-back"><a href="#/moments">‹ 朋友圈</a>　' + esc(albumWho) + '的相册</div>' + (D.atmoOff ? '<p class="small" style="text-align:center;color:#999;padding:40px 0">朋友仅展示最近三天的朋友圈</p>' : '') : '') + '<div class="mo-list">' + posts.map(([p, i]) => '<div class="moment">' + avEl(p.who) + '<div style="flex:1;min-width:0"><a class="name" href="#/album/' + encodeURIComponent(p.who) + '">' + esc(p.who) + '</a><div class="text">' + rich(p.text) + '</div>'
        + (p.pics ? '<div class="mo-grid n' + p.pics.length + '">' + p.pics.map((id, k) => '<img src="' + thumbSrc(id) + '" alt="" data-fp="' + i + ':' + k + '">').join('') + '</div>' : '') + '<div class="meta">' + esc(p.when) + '</div>'
        + (p.likes || p.comments.length ? '<div class="likes">' + (p.likes ? '♡ ' + esc(p.likes) : '') + p.comments.map(c => '<p><b>' + esc(c[0]) + '</b>：' + rich(c[1]) + '</p>').join('') + '</div>' : '') + '</div></div>').join('') + (posts.length ? '' : '<p class="small" style="padding:20px">朋友仅展示最近半年的朋友圈</p>') + '</div></div>';
    } else {
      const c = D.wxChats[id];
      BM.markRead('wx_' + id); if (id === 'tutor' && BM.cond('sms')) BM.markRead('wx_tutor2');  // 看过这段对话（周老师 16:50 那条另记）
      const msgs = wxMsgs(id);
      const opts = replyOptions(id);
      const momPend = id === 'mom' ? D.momQ.find(q => q.check && BM.flag(q.id) && !BM.ans('momOk_' + q.id)) : null;
      right = '<div class="wx-chat"><div class="wx-head">' + esc(c.name) + '<b>···</b></div><div class="wx-thread" id="wxThread">' + msgs.map(x => msgHTML(x, '陶雨')).join('') + '</div>'
        + '<div class="wx-input"><div class="wx-tools">😊　📁　✂　💬</div>' + (momPend && !momPend.check.choices ? '<input class="wx-box has" id="wxIn" placeholder="回复妈妈……" autocomplete="off" style="border:0;outline:0;width:100%;font:inherit;background:transparent">' : '<div class="wx-box' + (opts.length ? ' has' : '') + '" id="wxBox">' + (opts.length ? '点这里输入…' : '') + '</div>')
        + (pop && opts.length ? '<div class="wx-pop">' + opts.map((o, i) => '<a data-opt="' + i + '">' + esc(o.text) + '</a>').join('') + '</div>' : '')
        + '<button type="button" class="wx-send"' + (opts.length || momPend ? '' : ' disabled') + ' id="wxSend">发送(S)</button></div></div>';
    }
    page('wx', '微信 — 陶雨', '<div class="wxpc"><div class="wx-nav">' + avEl('陶雨', 'me') + '<a href="#/chat/' + (id || order[0]) + '" class="' + (moments ? '' : 'on') + '" title="聊天">💬</a><i title="通讯录">👤</i><i title="收藏">☆</i>' + (D.momentsOff ? '' : '<a href="#/moments" class="' + (moments ? 'on' : '') + '" title="朋友圈">◎</a>') + '<i class="bot" title="更多">≡</i></div>'
      + '<div class="wx-list"><div class="wx-search"><span' + (D.singleEntry && D.jcy ? ' data-wxadd="1" title="搜索公众号"' : '') + '>🔍 搜索</span><b' + (D.singleEntry && D.jcy ? ' data-wxadd="1" title="添加公众号"' : '') + '>＋</b></div><div class="wx-rows">' + list + '</div></div>' + right + '</div>');
    bindCommon();
    root.querySelectorAll('[data-wxadd]').forEach(el => { el.style.cursor = 'pointer'; el.addEventListener('click', () => wxAddAccount('')); });
    { const dl = document.getElementById('dial'); if (dl) dl.addEventListener('click', () => openPage('call.html#/dial')); }
    root.querySelectorAll('.wx-art img').forEach(im => im.addEventListener('click', () => BM.show('<img src="' + im.getAttribute('src') + '" alt="" style="max-width:88vw;max-height:84vh;background:#fff">')));  // 文章里的图点了放大
    root.querySelectorAll('[data-fp]').forEach(el => el.addEventListener('click', () => { const [i, k] = el.getAttribute('data-fp').split(':').map(Number); const p = D.feed[i]; const id = p.pics[k]; if (id === 'keepsake') BM.markRead('mo0714'); zoomShow(fullPic(id), p.text); }));
    if (!moments) {
      const th = document.getElementById('wxThread'); if (th) th.scrollTop = th.scrollHeight;
      const toggle = () => { if (replyOptions(id).length) { pop = !pop; wechat(); } };
      const box = document.getElementById('wxBox'); if (box) box.addEventListener('click', toggle);
      const mp = id === 'mom' ? D.momQ.find(q => q.check && BM.flag(q.id) && !BM.ans('momOk_' + q.id)) : null;
      const send = document.getElementById('wxSend');
      if (mp && !mp.check.choices) { const inp = document.getElementById('wxIn'); const go = () => { const v = inp.value.trim(); if (!v) return; BM.setAns(new RegExp(mp.check.re).test(BM.norm(v)) ? 'momOk_' + mp.id : 'momTry_' + mp.id, v); BM.dadCheck(); BM.momNotify(); wechat(); }; inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); if (send) send.addEventListener('click', go); inp.focus(); }
      else if (send) send.addEventListener('click', () => { pop = true; wechat(); });
      root.querySelectorAll('[data-opt]').forEach(a => a.addEventListener('click', () => { const o = replyOptions(id)[+a.getAttribute('data-opt')]; pop = false; if (o) o.act(); wechat(); }));
      if (showing() && !BM.remote) BM.markSeen('w:' + id, countNew(wxMsgs(id)));
    }
  }

  // ===== 钉钉 =====
  let dtQuery = '', dtTopic = null;
  // 搜索钉钉历史消息和当前聊天：至少两个字
  function dtResults() {
    const q = dtQuery.replace(/\s+/g, '');
    dtTopic = q.length < 2 ? null : (D.dingTopics || []).find(t => t.words.some(w => w.includes(q) || q.includes(w))) || null;
      if (dtTopic && dtTopic.match) dtTopic = Object.assign({}, dtTopic, { ids: D.dingHistory.map((h, i) => [h, i]).filter(([h]) => dtTopic.match.some(s => String(h.text || '').includes(s))).map(x => x[1]) });  // 按内容现找，删消息不会错位
    if (dtTopic) {
      const hl = s => dtTopic.words.reduce((acc, w) => acc.split(w).join('<mark>' + w + '</mark>'), s);
      let day = '';
      const body = dtTopic.ids.map(i => { const h = D.dingHistory[i]; const d = h.when.slice(0, 10); const sep = d !== day ? '<div class="dt-day">' + esc(D.dingChats[h.chat].name) + '　' + d + '</div>' : ''; day = d; return sep + '<div class="dt-tmsg"><div><b>' + esc(h.who) + '</b><span>' + esc(h.when.slice(11)) + '</span></div><p>' + hl(esc(h.text)) + '</p>' + (h.pic ? '<div class="dt-tpic" data-photo="' + h.pic + '" style="cursor:zoom-in" title="点开放大">' + picHTML(h.pic) + '</div>' : '') + '</div>'; }).join('');
      return '<div class="dt-res"><div class="dt-res-h">“' + esc(dtQuery) + '”的相关聊天记录　' + dtTopic.ids.length + ' 条　<a id="dtBack">返回</a></div>' + body + '</div>';
    }
    const hits = q.length < 2 ? [] : D.dingHistory.map((h, i) => [h, i]).filter(([h]) => (h.text + h.who).replace(/\s+/g, '').includes(q));
    return '<div class="dt-res"><div class="dt-res-h">搜索“' + esc(dtQuery) + '”　聊天记录 ' + hits.length + ' 条　<a id="dtBack">返回</a></div>' + (hits.length ? hits.map(([h, i]) => '<a class="dt-hit" data-hist="' + i + '"><b>' + esc(h.who) + '</b><span>' + esc(D.dingChats[h.chat].name) + '　' + esc(h.when) + '</span><p>' + esc(h.text).split(esc(dtQuery)).join('<mark>' + esc(dtQuery) + '</mark>') + (h.pic ? ' [图片]' : '') + '</p></a>').join('') : '<p class="small">没有找到相关聊天记录。</p>') + '</div>';
  }
  function ding() {
    const shown = DING.filter(k => dingMsgs(k).some(x => !x.stamp));
    const m = route().match(/^\/chat\/(\w+)$/);
    const id = m && shown.includes(m[1]) ? m[1] : 'work';
    const list = shown.map(k => {
      const c = D.dingChats[k];
      const ms = dingMsgs(k).filter(x => !x.old);
      const last = ms.filter(x => !x.stamp).slice(-1)[0];
      const u = dingUnread(k);
      return '<a class="dt-row' + (k === id ? ' on' : '') + '" href="#/chat/' + k + '">' + avEl(c.av, '', cardAttr(c.av)) + (u ? '<span class="dot">' + u + '</span>' : '') + '<div class="mid"><div class="name"><span class="nm">' + esc(c.name) + '</span>' + (c.ext ? '<em>外部</em>' : '') + '<i>' + esc(listTime(lastStamp(ms))) + '</i></div><div class="last">' + esc((last && last.who && !last.me && k === 'work' ? last.who + '：' : '') + lastPreview(last)) + '</div></div></a>';
    }).join('');
    const c = D.dingChats[id];
    BM.markRead('ding_' + id);
    const all = dingMsgs(id);
    const msgs = all;
    page('dt', '钉钉 — 许禾（文渊数字）', '<div class="dtpc"><div class="dt-nav">' + (D.dingCards.me ? '<span data-card="me" title="我的名片" style="cursor:pointer">' + avEl('许禾', 'me') + '</span>' : avEl('许禾', 'me')) + '<i class="on">消息</i><i>文档</i><i>工作台</i><i>通讯录</i><i>日历</i></div>'
      + '<div class="dt-list"><form class="dt-search" id="dtF"><input id="dtQ" placeholder="🔍 搜索联系人、聊天记录" autocomplete="off" value="' + esc(dtQuery) + '"></form><div>' + list + '</div></div>'
      + '<div class="dt-chat"><div class="dt-head"><b' + (D.dingCards[id] ? ' class="dt-name" data-card="' + id + '" title="查看名片"' : '') + '>' + esc(c.name) + '</b>' + (c.ext ? '<em>外部</em>' : '') + (c.sub ? '<span>' + esc(c.sub) + '</span>' : '') + '</div>'
      + (c.notice ? '<div class="dt-notice" data-url="qc.html">📌 ' + esc(c.notice) + '<span class="dt-nlink">文渊加工管理系统 ›</span></div>' : '')
      + '<div class="dt-thread" id="dtThread">' + (dtQuery ? dtResults() : msgs.map(x => msgHTML(x, '许禾', true)).join('')) + '</div>'
      + '<div class="dt-input">这是许禾的工作号，你没有替她回复。</div></div></div>');
    bindCommon();
    const th = document.getElementById('dtThread'); if (th) th.scrollTop = dtQuery ? 0 : th.scrollHeight;
    const f = document.getElementById('dtF');
    if (f) f.addEventListener('submit', e => { e.preventDefault(); dtQuery = document.getElementById('dtQ').value.trim(); ding(); });
    root.querySelectorAll('[data-hist]').forEach(el => el.addEventListener('click', () => { const h = D.dingHistory[+el.getAttribute('data-hist')]; BM.markRead('dh:' + el.getAttribute('data-hist')); BM.show('<div class="dt-hist"><div class="small">' + esc(D.dingChats[h.chat].name) + '　' + esc(h.when) + '</div><p><b>' + esc(h.who) + '</b>：' + esc(h.text) + '</p>' + (h.pic ? picHTML(h.pic) : '') + '</div>', '聊天记录'); }));
    const back = document.getElementById('dtBack'); if (back) back.addEventListener('click', () => { dtQuery = ''; ding(); }); root.querySelectorAll('.dt-tpic[data-photo]').forEach(el => el.addEventListener('click', () => { const id = el.getAttribute('data-photo'); zoomShow(picHTML(id), picTitle(id)); }));
    if (dtQuery && dtTopic) { dtTopic.ids.forEach(i => BM.markRead('dh:' + i)); BM.markRead('dt_' + ((dtTopic.match || [])[0] || '')); }
    root.querySelectorAll('[data-card]').forEach(el => el.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const k = D.dingCards[el.getAttribute('data-card')];
      if (!k) return;
      BM.show('<div class="dt-card"><div class="dt-card-top">' + avEl(k.name, 'big') + '<div><b>' + esc(k.name) + '</b>' + (k.ext ? '<em>外部</em>' : '') + '<div class="small">' + esc(k.org) + '</div></div></div><table>' + (k.intro ? '<tr><th>个人介绍</th><td>' + esc(k.intro) + '</td></tr>' : '') + '<tr><th>部门</th><td>' + esc(k.dept) + '</td></tr><tr><th>职位</th><td>' + esc(k.title) + '</td></tr>' + (k.jobno ? '<tr><th>工号</th><td>' + esc(k.jobno) + '</td></tr>' : '') + (k.dtid ? '<tr><th>钉钉号</th><td>' + esc(k.dtid) + '</td></tr>' : '') + '<tr><th>手机</th><td>' + esc(k.phone) + '</td></tr><tr><th>邮箱</th><td>' + esc(k.mail) + '</td></tr></table><div class="dt-card-btns"><span>发消息</span><span>语音通话</span></div></div>', '钉钉名片');
    }));
    if (showing() && !BM.remote) BM.markSeen('d:' + id, countNew(dingMsgs(id)));
  }

  // ===== 文件资源管理器：文档、下载、扫描、回收站 =====
  let zipAsk = false, zipErr = '';
  function folder() {
    const r = route();
    const SE = !!D.singleEntry;  // 单入口版：桌面“下载”快捷方式直接打开下载文件夹；文档、扫描、回收站都是空的，不做成可点的页面
    const dir = /^\/down/.test(r) ? 'down' : SE ? 'down' : /^\/recycle/.test(r) ? 'recycle' : /^\/scan/.test(r) ? 'scan' : 'gei';
    const nav = SE
      ? '<div class="ex-nav"><p>⭐ 快速访问</p><p>🖥 桌面</p><a href="#/down" class="on">⬇ 下载</a><p>📄 文档</p><p>🖼 图片</p><p>💻 此电脑</p><p>🗑 回收站</p></div>'
      : '<div class="ex-nav"><p>⭐ 快速访问</p><p>🖥 桌面</p><a href="#/down"' + (dir === 'down' ? ' class="on"' : '') + '>⬇ 下载</a><a href="#/gei"' + (dir === 'gei' ? ' class="on"' : '') + '>📄 文档</a><a href="#/scan"' + (dir === 'scan' ? ' class="on"' : '') + '>🖨 扫描</a><p>🖼 图片</p><p>💻 此电脑</p><a href="#/recycle"' + (dir === 'recycle' ? ' class="on"' : '') + '>🗑 回收站</a></div>';
    const path = { gei: '› 此电脑 › 文档', down: '› 此电脑 › 下载', scan: '› 此电脑 › 文档 › 扫描', recycle: '› 回收站' }[dir];
    const title = { gei: '文档', down: '下载', scan: '扫描', recycle: '回收站' }[dir];
    let list;
    if (dir === 'recycle') list = '<div class="ex-empty">此文件夹为空。</div>';
    else {
      const files = dir === 'down' ? D.downloads.concat(D.singleEntry || BM.flag('scanDl') ? D.scanFiles : []) : dir === 'scan' ? [] : D.folder;  // 单入口版：压缩包本来就在下载文件夹里（许禾 7-18 下午存的）
      list = '<div class="ex-h"><span>名称</span><span>修改日期</span><span>类型</span><span>大小</span></div>' + files.map(f => '<a class="ex-f" href="#" data-file="' + f.id + '"><span><i class="fi-' + (dir === 'scan' || /\.zip$/.test(f.name) ? 'zip' : dir === 'down' ? (/exe$/.test(f.name) ? 'exe' : /\.(jpg|png)$/.test(f.name) ? 'img' : 'pdf') : f.id.replace(/\d+/, '')) + '"></i>' + esc(f.name) + '</span><span>' + esc(f.date) + '</span><span>' + esc(f.type) + '</span><span>' + esc(f.size) + '</span></a>').join('');
      list += '<div class="ex-status">' + files.length + ' 个项目</div>';
      if (dir === 'down' && zipAsk && !BM.flag('zipOK')) list += '<div class="ex-zip"><b>散件扫描.zip 已加密</b><p class="small">压缩包注释：' + (D.singleEntry ? '宋晴电话' : '密码是那天的日期') + '</p><form id="zf"><input id="zp" type="password" placeholder="输入密码" autocomplete="off"><button type="submit">确定</button></form>' + (zipErr ? '<p class="ex-err">' + esc(zipErr) + '</p>' : '') + '</div>';
    }
    page('fo', title + ' - 文件资源管理器', '<div class="ex"><div class="ex-ribbon"><span>＋ 新建</span><span>✂</span><span>⧉</span><span>📋</span><span>✎</span><span>🗑</span><span>⇅ 排序</span><span>☰ 查看</span></div>'
      + '<div class="ex-addr"><span>← → ↑</span><div class="ex-path">' + path + '</div><div class="ex-find">在 ' + title + ' 中搜索</div></div>'
      + '<div class="ex-main">' + nav + '<div class="ex-list">' + list + '</div></div></div>');
    root.querySelectorAll('[data-file]').forEach(el => el.addEventListener('click', e => {
      e.preventDefault();
      const fid = el.getAttribute('data-file');
      if (fid === 'zip') { if (BM.flag('zipOK')) openPage('photo.html#scanset'); else { zipAsk = true; zipErr = ''; folder(); } return; }
      if (dir === 'down') { const d = D.downloads.find(x => x.id === fid); if (d && d.url) openPage(d.url); else BM.toast('此电脑已安装钉钉。'); return; }
      if (dir === 'scan') { if (BM.flag('zipOK')) openPage('photo.html#scanset'); else { zipAsk = true; zipErr = ''; folder(); } return; }
      const f = D.folder.find(x => x.id === fid); if (!f) return;
      if (f.app === 'studio') openPage('viewer.html#' + f.id);
      else if (f.app === 'notepad') openPage('notes.html');
      else openPage('photo.html#' + f.id);
    }));
    const zf = document.getElementById('zf');
    if (zf) zf.addEventListener('submit', e => { e.preventDefault(); const v = document.getElementById('zp').value.replace(/\D/g, ''); if (D.singleEntry ? v === String(D.zipPass) : (v === '0718' || v === '718' || v === '20260718')) { BM.set('zipOK'); BM.markRead('scan_zip'); BM.jcyCheck(); zipAsk = false; folder(); openPage('photo.html#scanset'); } else { zipErr = '密码不正确。'; folder(); } });
  }

  // ===== 记事本、照片 =====
  function notes() {
    BM.markRead('notes');
    page('np', '笔记.txt - 记事本', '<div class="np"><div class="np-menu"><span>文件</span><span>编辑</span><span>查看</span></div><pre class="np-text">' + rich(D.notesTXT).replace(/<br>/g, '\n') + '</pre><div class="np-status">第 1 行，第 1 列　　100%　　Windows (CRLF)　　UTF-8</div></div>');
  }
  // 照片：放大；“雨的生日.jpg”可以在“编辑”里调亮度、对比度
  let phZoom = false, phEdit = false, phB = 0, phC = 0, phInv = false;
  function photo() {
    const id = route().replace(/^\//, '') || 'keepsake';
    if (id === 'scanset' && D.singleEntry && !BM.flag('zipOK')) { page('ph', '散件扫描 - 照片', '<div class="ph"><div class="ph-body"><p class="small" style="padding:48px;text-align:center">压缩包还没解开。</p></div></div>'); return; }
    BM.markRead('ph_' + id);
    if (id === 'scanset' && D.singleEntry) { BM.dadCheck(); BM.jcyCheck(); }
    if (id === 'letter') BM.markRead('letter');
    const isReceipt = id === 'receipt';
    if (isReceipt) BM.markRead('mo0714');
    const clear = isReceipt;  // 车票打开就看得清（金额被水渍洇了，要按当年的价自己算）
    if (clear) BM.markRead('rc_clear');
    const html = id === 'letter' ? D.letterHTML : isReceipt ? BM_SVG.keepsake(clear) : (D.photos[id] ? D.photos[id].html : '');
    const name = id === 'letter' ? '宋母的信.jpg' : isReceipt ? '雨的生日.jpg' : (D.photos[id] ? D.photos[id].title : '图片');
    const filter = isReceipt && !clear ? 'filter:' + (phInv ? 'invert(1) ' : '') + 'brightness(' + (1 + phB / 200) + ') contrast(' + (1 + phC / 150) + ')' : '';
    const edit = isReceipt && phEdit ? '<div class="ph-edit"><h4>调整</h4><label>亮度<input type="range" min="-50" max="80" value="' + phB + '" data-adj="b"><b>' + phB + '</b></label><label>对比度<input type="range" min="-50" max="80" value="' + phC + '" data-adj="c"><b>' + phC + '</b></label><label><input type="checkbox" data-adj="inv"' + (phInv ? ' checked' : '') + '> 反相</label><label class="dim">曝光<input type="range" disabled></label><label class="dim">高光<input type="range" disabled></label><label class="dim">阴影<input type="range" disabled></label><button type="button" data-ph="reset">重置</button></div>' : '';
    page('ph', name + ' - 照片', '<div class="ph"><div class="ph-bar"><span data-ph="zoom" title="放大">🔍' + (phZoom ? '－' : '＋') + '</span><span title="旋转">⟳</span><span title="删除">🗑</span>' + '' + '<span>⋯</span></div><div class="ph-body"><div class="ph-stage' + (phZoom ? ' big' : '') + '"><div class="ph-img" style="' + filter + '">' + BM.marks(html) + '</div>' + (isReceipt ? '<p class="small" style="text-align:center;margin:8px 0 0">' + '盒子里压着一张出租车票，金额那一行被一块水渍洇了，看不清。' + '</p>' : '') + '</div>' + edit + '</div></div>');
    root.querySelectorAll('[data-ph]').forEach(el => el.addEventListener('click', () => {
      const k = el.getAttribute('data-ph');
      if (k === 'zoom') phZoom = !phZoom;
      if (k === 'edit') phEdit = !phEdit;
      if (k === 'reset') { phB = 0; phC = 0; phInv = false; }
      photo();
    }));
    root.querySelectorAll('[data-adj]').forEach(el => el.addEventListener('change', () => { const k = el.getAttribute('data-adj'); if (k === 'b') phB = Number(el.value); else if (k === 'c') phC = Number(el.value); else if (k === 'inv') phInv = el.checked; photo(); }));
  }

  // ===== 打电话、询问笔录、17:30、救人 =====
  function scene(top, sub, inner, ctl) {
    document.title = top + ' — ' + sub;
    root.innerHTML = '<div class="call-page"><div class="call"><div class="call-top"><b>' + esc(top) + '</b><span>' + esc(sub) + '</span></div><div class="call-log" id="clog">' + inner + '</div><div class="call-ctl">' + ctl + '</div></div></div>';
    const cl = document.getElementById('clog'); if (cl) cl.scrollTop = cl.scrollHeight;
  }
  function dial() {
    if (!BM.cond('notice')) { scene('通话', '还没有号码', '<p class="ev">你还不知道该打给谁。</p>', '<a class="primary btnlink" href="index.html">回到许禾的电脑</a>'); return; }
    if (D.singleEntry && BM.flag('endingSeen')) BM.clearInterview();  // 打过结局，再从公众号点【用手机拨打】：询问笔录从头来
    if (BM.flag('called')) return interview();
    if (!BM.flag('dialed')) {  // 单入口版（用户 2026-11-13）：不用输号码，点【用手机拨打】直接接通
      if (!BM.cond('callOk')) { refuse(); return; }
      BM.set('dialed'); BM.markRead('call_ever');
    }
    const CQ = [];  // 不再考问：车费、死亡时间都挪到流程中间（妈妈那里）
    function refuse() {  // 单入口版：没进过宋晴的 QQ 空间，唐越不出车，挂了以后补齐再打
      scene('0671-8216 6688', '你用自己的手机拨了过去', '<p class="ev">嘟……嘟……</p><p class="q">“喂，省检察院控告申诉值班室，我是唐越。”</p><p class="a">“您好，我叫陶雨。我室友许禾在市公安局扫那本卷宗，她不见了。我手里有她的电脑，还有一张打车票，能证明周建明不是第四起的凶手。”</p><p class="q">“' + esc(D.callRefuse || '我们没法出车。') + '”</p><p class="ev">电话挂了。</p>', '<button class="primary" type="button" id="dback">挂断</button>');
      document.getElementById('dback').addEventListener('click', () => dial());
    }
    const cq = BM.ans('callQ') || 0;
    let lines = '<p class="ev">嘟……嘟……</p><p class="q">“喂，省检察院控告申诉值班室，我是唐越。”</p><p class="a">“您好，我叫陶雨。我室友许禾在市公安局扫那本卷宗，她不见了。我手里有她的电脑，还有一张打车票，能证明周建明不是第四起的凶手。”</p>';
    for (let i = 0; i < cq; i++) lines += '<p class="q">' + CQ[i][0] + '</p><p class="a">“' + esc(BM.ans('callA' + i) || '') + '。”</p>';
    if (cq < CQ.length) {
      const tip = BM.ans('callTip');
      scene('0671-8216 6688', '你用自己的手机拨了过去', lines + '<p class="q">' + CQ[cq][0] + '</p>', (tip ? '<div class="tip">' + esc(tip) + '</div>' : '') + '<input id="cqv" class="dial-in iv-in" autocomplete="off"><button class="primary" type="button" id="cqok">回答</button>');
      const go = () => { const raw = document.getElementById('cqv').value.trim(); const v = BM.norm(raw); if (!v) return; if (CQ[cq][1](v)) { BM.setAns('callA' + cq, raw); BM.setAns('callTip', ''); BM.setAns('callQ', cq + 1); } else BM.setAns('callTip', '唐越：' + CQ[cq][2]); dial(); };
      document.getElementById('cqok').addEventListener('click', go);
      document.getElementById('cqv').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      return;
    }
    scene('0671-8216 6688', '你用自己的手机拨了过去', lines + '<p class="q">' + (BM.read('dad_photo') ? '“车票、你爸拍的那张照片，我们都要核。你现在在哪？别挂电话，我们过去接你。”' : '“车票我们要核。你现在在哪？别挂电话，我们过去接你。”') + '</p>', '<button class="primary" type="button" id="board">17:10　上检察院的车</button>');
    document.getElementById('board').addEventListener('click', () => { BM.set('called'); location.hash = '#/call'; });
  }
  const log = () => BM.ans('log') || [];
  const addLog = items => BM.setAns('log', log().concat(items));
  const ivQs = () => (D.singleEntry && D.interviewSE) ? D.interviewSE : D.interview;
  function interview() {
    if (!BM.flag('called')) return dial();
    const step = BM.ans('step') || 0;
    const qs = ivQs();
    let lines = '<p class="ev">17:10　检察院的车停在宿舍楼下。你抱着许禾的电脑坐上后座。</p><p class="q">唐越：许禾的事我们已经在问了。你看到了什么、想到了什么，如实说。记录下来以后你要看一遍、签字。</p>';
    lines += log().map(l => '<p class="' + l[0] + '">' + esc(l[1]) + '</p>').join('');
    let ctl = '';
    if (BM.ans('sign')) ctl = '<button class="primary" type="button" id="sign">签名</button>';
    else if (step < qs.length) {
      const q = qs[step];
      lines += '<p class="q">问：' + esc(q.q) + '</p>';
      ctl = q.type === 'who' ? whoOpts(q).map((o, i) => '<button type="button" data-w="' + i + '">' + esc(o) + '</button>').join('') : q.type === 'multi'
        ? q.options.map((o, i) => '<button type="button" data-m="' + i + '">' + esc(o[0]) + '</button>').join('') + '<button class="primary" type="button" id="ok">就这些</button>'
        : q.type === 'text' ? '<input id="ivt" class="dial-in iv-in" autocomplete="off" placeholder="' + esc(q.placeholder || '') + '"><button class="primary" type="button" id="ivok">回答</button>'
        : q.options.map((o, i) => '<button type="button" data-i="' + i + '">' + esc(o) + '</button>').join('');
      const tip = BM.ans('tip');
      if (tip) ctl = '<div class="tip">' + esc(tip) + '</div>' + ctl;
    }
    scene('检察院的车上', '询问笔录', lines, ctl);
    const sign = document.getElementById('sign');
    if (sign) sign.addEventListener('click', () => {
      BM.set('signed');
      // 单入口版：写魏东就直接是普通结局（撤掉“留车／去后门”那一页，坏结局只从回复假消息进）
      if (D.singleEntry && BM.ans('final') !== 'ok') { BM.setEnding('normal'); location.href = 'ending.html#normal'; return; }
      location.hash = BM.ans('final') === 'ok' ? '#/rescue' : '#/choice';
    });
    const q = qs[step];
    if (!q || BM.ans('sign')) return;
    if (q.type === 'who') {
      root.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => answerWho(q, whoOpts(q)[Number(b.getAttribute('data-w'))])));
    } else if (q.type === 'multi') {
      root.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => b.classList.toggle('on')));
      document.getElementById('ok').addEventListener('click', () => answerMulti(q, Array.from(root.querySelectorAll('[data-m].on')).map(b => Number(b.getAttribute('data-m')))));
    } else if (q.type === 'text') {
      const go = () => answerText(q, document.getElementById('ivt').value);
      document.getElementById('ivok').addEventListener('click', go);
      document.getElementById('ivt').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    } else root.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => answerChoice(q, Number(b.getAttribute('data-i')))));
  }
  function advance(q, said) {
    let step = (BM.ans('step') || 0) + 1;
    const qsAll = ivQs();
    while (step < qsAll.length && qsAll[step].onlyIf && qsAll[step].onlyIf !== BM.ans('accused')) step++;
    addLog([['q', '问：' + q.q], ['a', '答：' + said]]);
    BM.setAns('tip', '');
    BM.setAns('step', step);
    if (q.last || step >= ivQs().length) { BM.setAns('final', (D.singleEntry && D.interviewSE) ? (BM.ans('accused') === 'lin' ? 'ok' : 'wei') : 'ok'); BM.setAns('sign', true); }
    interview();
  }
  // 看过出处才认：need 里每一项是“看过”的标记，F: 开头是 flag，数组表示任一即可
  function needHas(x) { return /^F:/.test(x) ? BM.flag(x.slice(2)) : BM.read(x); }
  function needBlock(list, hint) { const miss = (list || []).filter(x => Array.isArray(x) ? !x.some(needHas) : !needHas(x)); if (!miss.length) return false; BM.setAns('tip', '唐越：' + (hint || '这一条，你得给我看到出处。')); interview(); return true; }
  function whoOpts(q) { const o = q.base.slice(); if (BM.cond('ivLin')) o.splice(q.linAt, 0, q.lin); return o; }
  function answerWho(q, name) {
    if (!name) return;
    if (name === q.lin || name === '魏东') { BM.setAns('accused', name === q.lin ? 'lin' : 'wei'); return advance(q, name + '。'); }
    BM.setAns('tip', '唐越：' + ((q.wrongs && q.wrongs[name]) || '你再想想。'));
    interview();
  }
  function answerChoice(q, i) {
    if (q.normal !== undefined && i === q.normal) {
      addLog([['q', '问：' + q.q], ['a', '答：' + q.options[i] + '。']]);
      BM.setAns('accused', 'wei'); BM.setAns('tip', ''); BM.setAns('sign', true);
      return interview();
    }
    if (i === q.answer) { if (needBlock(q.need, q.needHint)) return; return advance(q, q.say); }
    BM.setAns('tip', '唐越：' + ((q.wrongs && q.wrongs[i]) || '你再想想。'));
    interview();
  }
  function answerText(q, raw) {
    const v = BM.norm(raw);
    if (!v) return;
    if (q.accept(v)) {
      if (q.normalEnd) { addLog([['q', '问：' + q.q], ['a', '答：' + q.say]]); BM.setAns('accused', 'wei'); BM.setAns('tip', ''); BM.setAns('sign', true); return interview(); }
      return advance(q, q.say);
    }
    if (q.normalAccept && q.normalAccept(v)) {
      addLog([['q', '问：' + q.q], ['a', '答：' + raw.trim() + '。']]);
      BM.setAns('tip', '');
      const j = q.normalNext ? ivQs().findIndex(x => x.id === q.normalNext) : -1;
      if (j >= 0) { BM.setAns('step', j); return interview(); }
      BM.setAns('accused', 'wei'); BM.setAns('sign', true);
      return interview();
    }
    const h = (q.hints || []).find(x => x[0].test(v));
    BM.setAns('tip', '唐越：' + (h ? h[1] : q.wrongText));
    interview();
  }
  function answerMulti(q, picked) {
    if (!picked.length) return;
    const kinds = picked.map(i => q.options[i][1]);
    if (kinds.includes('no')) BM.setAns('tip', '唐越：' + q.wrongNo);
    else if (!kinds.includes('act')) BM.setAns('tip', '唐越：' + q.wrongAct);
    else if (!kinds.includes('w')) BM.setAns('tip', '唐越：' + q.wrongW);
    else { if (needBlock(q.need, q.needHint)) return; return advance(q, q.say); }
    interview();
  }
  function choice() {
    if (!BM.flag('signed')) return interview();
    BM.set('choice');
    scene('17:30', '检察院的车上', '<p class="ev">以上笔录我看过，和我说的一样。　陶雨</p><p class="a" style="text-align:left;color:#ddd">许禾的微信又跳出来一条：“到了吗？我在后门等你。”</p><p class="q">唐越：我们的人去魏东家了。你就在车上待着，哪儿也别去。</p>',
      '<button type="button" id="go">下车，去市局后门</button><button class="primary" type="button" id="stay">留在检察官身边</button>');
    document.getElementById('go').addEventListener('click', () => { BM.setEnding('bad'); location.href = 'ending.html#bad'; });
    document.getElementById('stay').addEventListener('click', () => { BM.setEnding('normal'); location.href = 'ending.html#normal'; });
  }
  function rescue() {
    if (BM.ans('final') !== 'ok' || !BM.flag('signed')) return interview();
    BM.set('rescueGo');
    const stage = BM.ans('rescue') || 0;
    const lines = [['ev', '17:41　柳林路 2 号。雨下起来了。'], ['q', '老所的大门锁着。唐越带着两个民警从侧面翻了进去，你跟在后面。'], ['q', '后院最里面那间平房，窗户糊着黑纸，门上挂着一把新锁。']];
    if (stage >= 1) lines.push(['a', '民警剪开了锁。'], ['q', '屋里亮着一盏红灯。许禾被绑在水池边，脚边是她的帆布包。她看见你，哭出了声：“雨……”'], ['ev', '18:06　院门外有车停下。'], ['q', '林建平撑着伞走进后院，手里拿着一卷红色尼龙绳。他看见了你们。']);
    const ctl = stage === 0 ? '<button class="primary" type="button" id="cut">让民警把锁剪开</button>' : '<button class="primary" type="button" id="fin">……</button>';
    scene('柳林路 2 号', '老所后院', lines.map(l => '<p class="' + l[0] + '">' + esc(l[1]) + '</p>').join(''), ctl);
    const cut = document.getElementById('cut');
    if (cut) cut.addEventListener('click', () => { BM.setAns('rescue', 1); rescue(); });
    const fin = document.getElementById('fin');
    if (fin) fin.addEventListener('click', () => { BM.setEnding('true'); location.href = 'ending.html#true'; });
  }
  function call() {
    const r = route();
    if (/^\/dial/.test(r)) dial();
    else if (r === '/choice' && !D.singleEntry) choice();
    else if (r === '/rescue') rescue();
    else interview();
  }


  // ===== QQ（电脑版）：账号密码没人知道，只能“找回密码”回答密保 =====
  // 宋晴的号是主线（密保答案在第 5 卷物证清单的工作牌上）；W 的号是暗线（林建平，密保答案是他自己说过的“暗房”）
  const QQ_CUR = 'beimian.qq.cur';
  let qqView = 'login', qqAcc = '', qqMsg = '';
  const qqAccounts = () => ({
    [D.qzone.qq]: { flag: 'qqSong', read: 'qq_in', nick: D.qzone.name, sign: D.qzone.sign, av: '晴', q: D.qzone.question, ok: v => D.qzone.answer.some(a => BM.norm(a) === v), space: 'web.html#/qzone/home', idle: '7433',
      groups: [['我的好友', [['敏敏', '2005-06-28', '一个人的时候就听歌'], ['阿萍', '2006-07-02', '高考加油！！'], ['小刘', '2006-07-12', ''], ['X', '2006-07-14', '红灯一开，人的脸都是红的。']]], ['同事', [['信用社 王会计', '2006-06-30', ''], ['小周', '2006-07-11', '周末谁替我个班']]], ['家人', [['表姐', '2006-05-20', '']]]] },
    [D.qzwOff ? '__qzw_off__' : D.qzoneW.qq]: { flag: 'qqLin', read: 'qzw_in', nick: 'X', sign: D.qzoneW.sign, av: 'X', q: D.qzoneW.question, ok: v => !!v && D.qzoneW.answers.some(a => v.includes(BM.norm(a))), q2: D.qzoneW.question2, ok2: v => !!v && (D.qzoneW.answers2 || []).some(a => v.includes(BM.norm(a))), space: 'web.html#/qzw', idle: '6074',
      groups: [['我的好友', [['晴天娃娃', '2006-07-14', D.qzone.sign]]], ['同事', [['小周', '2007-11-02', ''], ['老张', '2008-01-20', '下雨天别找我']]]] }
  });
  function qq() {
    const A = qqAccounts();
    const cur = sessionStorage.getItem(QQ_CUR);
    if (cur && A[cur] && BM.flag(A[cur].flag)) return qqMain(cur, A[cur]);
    if (qqView === 'forgot') return qqForgot(A);
    page('qq', 'QQ', '<div class="qq-win"><div class="qq-logo">QQ</div><form id="qqf" class="qq-form"><input id="qqa" placeholder="QQ号码/手机/邮箱" autocomplete="off" value="' + esc(qqAcc) + '"><input id="qqp" type="password" placeholder="密码" autocomplete="off"><p class="qq-err">' + esc(qqMsg) + '</p><label class="small"><input type="checkbox"> 记住密码</label>　<label class="small"><input type="checkbox"> 自动登录</label><button type="submit">登 录</button></form><div class="qq-links"><span>注册账号</span><a href="#" id="qqfg">找回密码</a></div><p class="qq-hint">不知道密码？可以尝试找回密码</p></div>');
    document.getElementById('qqf').addEventListener('submit', e => {
      e.preventDefault();
      qqAcc = document.getElementById('qqa').value.trim();
      qqMsg = !qqAcc ? '请输入账号。' : A[qqAcc] ? '密码错误，请重新输入。忘了密码可以找回。' : '账号或密码错误。';
      qq();
    });
    document.getElementById('qqfg').addEventListener('click', e => { e.preventDefault(); qqView = 'forgot'; qqMsg = ''; qq(); });
  }
  function qqForgot(A) {
    const acc = A[qqAcc] && qqView === 'forgot' ? qqAcc : '';
    const asking = acc && qqMsg !== '__acc';
    page('qq', '找回密码 - QQ 安全中心', '<div class="qq-win"><h3>找回密码</h3><form id="qqr" class="qq-form"><label class="small">QQ 号码</label><input id="qra" autocomplete="off" value="' + esc(qqAcc) + '">'
      + (A[qqAcc] ? '<p class="small">密保问题：' + esc(A[qqAcc].q) + '</p><input id="qrq" placeholder="答案" autocomplete="off">' + (A[qqAcc].q2 ? '<p class="small">密保问题：' + esc(A[qqAcc].q2) + '</p><input id="qrq2" placeholder="答案" autocomplete="off">' : '') : '')
      + '<p class="qq-err">' + esc(qqMsg === '__acc' ? '' : qqMsg) + '</p><button type="submit">' + (A[qqAcc] ? '验 证' : '下一步') + '</button></form><div class="qq-links"><a href="#" id="qqbk">返回登录</a></div></div>');
    document.getElementById('qqr').addEventListener('submit', e => {
      e.preventDefault();
      const v = document.getElementById('qra').value.trim();
      if (v !== qqAcc || !A[v]) { qqAcc = v; qqMsg = A[v] ? '' : (v ? '该号码没有设置密保问题，或号码不存在。' : '请输入 QQ 号码。'); return qq(); }
      const ans = BM.norm(document.getElementById('qrq').value);
      if (!A[v].ok(ans) || (A[v].q2 && !A[v].ok2(BM.norm((document.getElementById('qrq2') || {}).value || '')))) { qqMsg = '答案不正确。'; return qq(); }
      BM.set(A[v].flag); BM.markRead(A[v].read); sessionStorage.setItem(QQ_CUR, v); qqView = 'login'; qqMsg = ''; qq();
    });
    document.getElementById('qqbk').addEventListener('click', e => { e.preventDefault(); qqView = 'login'; qqMsg = ''; qq(); });
    void asking;
  }
  function qqMain(num, a) {
    page('qq', 'QQ', '<div class="qq-main"><div class="qq-me"><div class="av big" style="background:' + (a.av === 'X' ? '#4a4f58' : '#e891a8') + '">' + esc(a.av) + '</div><div><b>' + esc(a.nick) + '</b><div class="small">' + esc(a.sign) + '</div><div class="small">' + esc(num) + '</div></div></div>'
      + '<div class="qq-sys">QQ 安全中心：密码已重置。这个号已经 ' + a.idle + ' 天没有登录了。</div>'
      + '<div class="qq-tabs"><b>联系人</b><span>群聊</span></div>'
      + a.groups.map(g => '<div class="qq-grp"><div class="qq-gh">▾ ' + esc(g[0]) + '　<span class="small">0/' + g[1].length + '</span></div>' + g[1].map(f => '<a href="#" class="qq-fr" data-fr="' + esc(f[0]) + '"><div class="av" style="background:#8fa3b8">' + esc(f[0].slice(0, 1)) + '</div><div><b>' + esc(f[0]) + '</b><div class="small">' + esc(f[2] || '') + '</div></div><em class="small">最后在线 ' + esc(f[1]) + '</em></a>').join('') + '</div>').join('')
      + '<div class="qq-foot"><button type="button" id="qqzone">★ QQ 空间</button><a href="#" id="qqout" class="small">退出登录</a></div></div>');
    document.getElementById('qqzone').addEventListener('click', () => openPage(a.space));
    document.getElementById('qqout').addEventListener('click', e => { e.preventDefault(); sessionStorage.removeItem(QQ_CUR); qqAcc = ''; qq(); });
    root.querySelectorAll('[data-fr]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); const name = el.getAttribute('data-fr'); const f = a.groups.flatMap(g => g[1]).find(x => x[0] === name); const nm = String(f[0]).split('　'); BM.show('<div class="qq-card"><div class="qq-card-top"><div class="av">' + esc(nm[0].slice(0, 1)) + '</div><div><b>' + esc(nm[0]) + '</b>' + (nm[1] ? '<div class="small">QQ ' + esc(nm[1]) + '</div>' : '') + '</div></div><div class="qq-card-body"><p><span>个性签名</span>' + esc(f[2] || '这个人很懒，什么都没写') + '</p><p><span>最后在线</span>' + esc(f[1]) + '</p><p class="small">没有可以漫游的聊天记录。</p></div></div>'); }));
  }

  // ===== 启动 =====
  const RENDER = { wechat, ding, folder, notes, photo, call, qq };
  const run = RENDER[APP] || (() => {});
  window.addEventListener('hashchange', () => { pop = false; run(); });
  BM.onChange(() => {
    const a = document.activeElement;
    if (a && (a.id === 'ansIn' || a.id === 'lockIn')) return;
    if (APP === 'call') return;
    run();
  });
  document.addEventListener('visibilitychange', () => { if (showing() && (APP === 'wechat' || APP === 'ding')) run(); });
  window.addEventListener('focus', () => { if (showing() && (APP === 'wechat' || APP === 'ding')) run(); });  // 切到这个标签页时再标已看过
  run();
})();
