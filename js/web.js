(function () {
  'use strict';
  const D = BM_DATA;
  const app = document.getElementById('app');
  const esc = BM.esc;

  function page(o, html) {
    document.title = o.title;
    app.innerHTML = BM.chrome(o) + '<div class="br-page site-' + o.site + '">' + html + '</div>';
    BM.bindChrome();
    window.scrollTo(0, 0);
  }
  const plain = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\[\[|\]\]|\{\{|\}\}/g, '');
  const dImg = id => (id === 'darkroom' ? 'img/darkroom.jpg' : 'img/d/' + id + '.jpg');
  // 用整个编号算一个稳定的数（W10 和 W11、x1 和 x12 不会撞）
  const hid = s => String(s).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 99991, 7);
  // W 的日志按日期排序（数组编号保持不变，跳转树和推导引用的是编号）
  const wOrder = W => W.diaries.map((x, k) => k).sort((a, b) => String(W.diaries[a].d).localeCompare(String(W.diaries[b].d)) || a - b);
  function bindZoom() {
    app.querySelectorAll('[data-zimg]').forEach(el => el.addEventListener('click', () => BM.show('<img src="' + el.getAttribute('data-zimg') + '" alt="" style="max-width:90vw;max-height:80vh;display:block">', el.getAttribute('data-cap') || '')));
  }

  // ===== 千寻搜索 =====
  const hot = [['高温黄色预警，本周最高 38℃', 'f01'], ['澜城地铁 4 号线年底通车', 'f02'], ['夏季腹泻高发，医生提醒', 'f03'], ['老旧小区改造进度', 'f04'], ['大学生实习权益保障新规', 'f05']];
  function findGroup(q) {
    const v = BM.norm(q);
    if (!v) return null;
    return D.webSearch.find(g => g.words.some(w => BM.norm(w) === v) && (!g.req || BM.cond(g.req))) || null;
  }
  function snippet(r) {
    if (r === 'wbprofile') return D.weiboUser.bio;
    if (r === 'archive') return '档案室负责我院诉讼档案的接收、保管、利用和数字化验收。负责人：林建平。';
    if (r === 'qzone') return 'QQ 空间：分享生活，留住感动。';
    if (r === 'cloud') return '华信云空间：云盘、图库、备忘录、查找设备。手机丢了？登录后可以查看设备最后的位置。';
    if (r === 'bbs_home') return '柳林论坛 2003 年开站，2016 年停止发帖，现为只读存档。';
    if (/^bbs_/.test(r)) { const t = D.forum[r.slice(4)]; return t ? plain(t.posts[0][1]) : ''; }
    const p = D.webPages[r];
    return p ? plain(p.html).slice(0, 70) + '……' : '';
  }
  const searchBox = (q, big) => '<form class="qx-form' + (big ? ' big' : '') + '" id="qf"><input id="qq" value="' + esc(q || '') + '" autocomplete="off"><button type="submit">千寻一下</button></form>';
  function bindSearch() {
    const f = document.getElementById('qf');
    if (f) f.addEventListener('submit', e => { e.preventDefault(); const v = document.getElementById('qq').value.trim(); if (v) location.hash = '#/search/' + encodeURIComponent(v); });
  }
  // ===== 千寻全文检索：标题或正文里确实含有搜索词，才算结果；摘要截取搜索词前后的原文并标红 =====
  // 入口页面（登录页、个人主页、官网）也当作网页收录，各有自己的标题和简介
  const svcDocs = () => [
    { id: 'wbprofile', kind: 'svc', title: D.weiboUser.name + '的微博', text: plain(D.weiboUser.bio) + '　' + D.weiboPosts.map(p => plain(p.text)).join('　'), url: 'weibo.com', href: '#/weibo/u/songmama' },
    { id: 'cloud', kind: 'svc', title: '查找设备 - 华信云空间', text: '华信云空间：云盘、图库、备忘录、查找设备。手机丢了，登录华信云空间就能查找手机，查看手机定位、播放铃声、锁定设备。', url: 'cloud.huaxin.com', href: '#/cloud' },
    ...Object.keys(D.weiboUsers || {}).filter(u => u !== '刘佳').map(u => ({ id: 'wbu_' + u, kind: 'svc', title: u + '的微博', text: plain(D.weiboUsers[u].bio) + '　' + D.weiboUsers[u].posts.map(x => plain(x[1])).join('　'), url: 'weibo.com', href: '#/weibo/u2/' + encodeURIComponent(u) })),
    ...(D.mapPlaces || []).map((m, i) => ({ id: 'map_' + (m.id || i), kind: 'svc', title: m.name + ' - 千寻地图', text: m.addr + '　' + m.desc, url: 'map.qianxun.com', href: '#/map/' + encodeURIComponent(m.keys[0]) })),
    { id: 'bbs_home', kind: 'svc', title: '柳林论坛 - 柳林人自己的论坛', text: '柳林论坛 2003 年开站，2016 年停止发帖，现为只读存档。', url: 'bbs.liulin.net', href: '#/bbs' }
  ];
  let corpusCache = null;
  function corpus() {
    if (corpusCache) return corpusCache;
    const docs = svcDocs();
    Object.keys(D.webPages).forEach(id => {
      const p = D.webPages[id], c = D.resultCards[id];
      if (!c) return;
      docs.push({ id, kind: 'page', full: !!p.full, title: c[1], text: plain(p.html), url: c[0], href: c[2].replace(/^web\.html/, ''), old: /^news/.test(id) && +p.date.slice(0, 4) <= 2015, req: id === 'mpnotice' ? 'mp' : null });
    });
    Object.keys(D.forum).concat(Object.keys(D.forumX || {})).forEach(tid => { const t = D.forum[tid] || D.forumX[tid]; docs.push({ id: 'bbs_' + tid, kind: 'bbs', title: t.title, text: t.posts.map(x => plain(x[1])).join('　'), url: '柳林论坛（只读存档）　' + String(t.when || '').slice(0, 10), href: '#/bbs/' + tid }); });
    Object.keys(D.filler).forEach(fid => { const f = D.filler[fid]; docs.push({ id: fid, kind: 'filler', title: f.title, text: plain(f.html), url: f.src + '　' + f.date, href: '#/a/' + fid, only: f.only }); });
    return (corpusCache = docs);
  }
  // 在原文里找规范化后的搜索词，返回原文里的起止位置
  function locate(text, nq) {
    let ns = '';
    const at = [];
    for (let i = 0; i < text.length; i++) { const c = BM.norm(text[i]); for (let k = 0; k < c.length; k++) { ns += c[k]; at.push(i); } }
    const j = nq ? ns.indexOf(nq) : -1;
    return j < 0 ? null : [at[j], at[j + nq.length - 1] + 1];
  }
  function hl(text, nq, before, after) {
    const m = locate(text, nq);
    if (!m) return esc(text.slice(0, before + after)) + (text.length > before + after ? '……' : '');
    const s = Math.max(0, m[0] - before), e = Math.min(text.length, m[1] + after);
    return (s > 0 ? '……' : '') + esc(text.slice(s, m[0])) + '<em class="qx-hl">' + esc(text.slice(m[0], m[1])) + '</em>' + esc(text.slice(m[1], e)) + (e < text.length ? '……' : '');
  }
  function search(q) {
    q = q || '';
    if (!q) {
      page({ site: 'qx', title: '千寻一下，你就知道', url: 'https://www.qianxun.com/', fav: 'q' },
        '<div class="qx-home"><div class="qx-logo">千<span>寻</span></div>' + searchBox('', true)
        + '<div class="qx-links">' + (D.singleEntry ? '<span>千寻资讯</span>' : '<a href="#/feed">千寻资讯</a>') + '<span>天气　澜城 9℃ 小雨</span>' + (D.mapOff ? '' : '<a href="#/map">地图</a>') + '<span>翻译</span><span>网盘</span></div></div>');
      bindSearch(); document.getElementById('qq').focus(); return;
    }
    const toks = q.split(/\s+/).map(t => BM.norm(t)).filter(Boolean);
    // 搜索词是硬门槛：这个词在哪一页出现过，看过那一页才搜得到
    const kwg = (D.kwGates || []).find(x => x.words.some(w => toks.some(t => t.includes(BM.norm(w)))));
    const kwBlocked = !D.singleEntry && !!(kwg && !BM.cond(kwg.cond));  // 单入口版（用户 2026-11-12）：关键词只要搜就能出，不设“看过某页才搜得到”的门槛
    const g = kwBlocked ? null : findGroup(q);
    if (g) BM.set('k:web:' + g.key);
    const dg = d => !D.docGates || !D.docGates[d.id] || BM.cond(D.docGates[d.id]);  // 关键页面本身也带门槛，换个词也绕不过去
    const hits = toks.length && !kwBlocked ? corpus().filter(d => (!d.req || BM.cond(d.req)) && dg(d) && (!d.only || d.only.some(k => toks.some(t => t.includes(BM.norm(k))))) && toks.every(t => BM.norm(d.title + d.text + (d.kind === 'svc' ? d.url : '')).includes(t))) : [];
    const rank = d => (toks.every(t => BM.norm(d.title).includes(t)) ? 0 : 10) + ({ svc: 0, page: 1, bbs: 2, filler: 3 }[d.kind] || 4);
    hits.sort((a, b) => rank(a) - rank(b));
    // 每个搜索词只给 1—2 条有用的结果（按设计的计划），再附最多 3 条日常稿件
    const KEYU = ['周小燕', '清溪老吴'];
    const isKey = d => d.kind === 'page' || (d.kind === 'svc' && (!/^wbu_/.test(d.id) || KEYU.includes(d.id.slice(4)))) || (d.kind === 'bbs' && D.forum[d.id.slice(4)]) || (d.kind === 'filler' && /^k\d/.test(d.id));
    const planKey = Object.keys(D.searchPlan || {}).find(k => BM.norm(k) === BM.norm(q));
    let keys = hits.filter(isKey);
    if (D.singleEntry) {
      // 单入口版：只按搜索计划出结果。每个页面只挂在一个搜索主题下（同义词算同一个主题），计划之外的词一律搜不到
      keys = planKey && !kwBlocked ? D.searchPlan[planKey].map(id => corpus().find(d => d.id === id)).filter(Boolean) : [];  // 单入口版：计划里的页面不再另设门槛
      if (keys.some(d => d.id === 'mpnotice')) { BM.markRead('mp_found'); if (BM.cond('callOk')) BM.markRead('n_mpReady'); }  // 12309 那篇搜到过（条件齐了以后才弹“可以查看了”）
    } else if (planKey) { const want = D.searchPlan[planKey]; keys = want.map(id => keys.find(d => d.id === id)).filter(Boolean); }
    else keys = keys.slice(0, 2);
    const atmo = D.singleEntry ? [] : hits.filter(d => !isKey(d)).slice(0, 3);
    hits.length = 0; keys.concat(atmo).forEach(d => hits.push(d));
    const nq = toks[0];
    let body;
    if (!hits.length) body = '<div class="qx-none"><p>很抱歉，没有找到与“<b>' + esc(q) + '</b>”相关的网页。</p><p class="small">请检查输入的字词是否有误，或者换一个更常见的词试试。</p></div>';
    else {
      body = '<div class="qx-count">千寻为您找到相关结果约 ' + hits.length + ' 个</div>' + hits.map(d => {
        // 2015 年以前的报纸只能按日期检索：只给过刊入口，不给日期和细节
        if (d.old && !D.singleEntry) return '<div class="qx-item"><a class="qx-t" href="#/past">澜城晚报数字报 · 过刊检索（2005—2015）</a><div class="qx-s">' + esc(d.title) + '……　本报 2015 年以前的版面请按出版日期检索。</div><div class="qx-u">epaper.lcwb.com.cn/past</div></div>';
        const tm = locate(d.title, nq);
        const title = tm ? esc(d.title.slice(0, tm[0])) + '<em class="qx-hl">' + esc(d.title.slice(tm[0], tm[1])) + '</em>' + esc(d.title.slice(tm[1])) : esc(d.title);
        return '<div class="qx-item"><a class="qx-t" href="' + d.href + '"' + (/^https?:/.test(d.href) ? ' target="_blank" rel="noopener"' : '') + '>' + title + '</a><div class="qx-s">' + (d.full ? (m => m ? esc(d.text.slice(0, m[0])) + '<em class="qx-hl">' + esc(d.text.slice(m[0], m[1])) + '</em>' + esc(d.text.slice(m[1])) : esc(d.text))(locate(d.text, nq)) : hl(d.text, nq, 14, 30)) + '</div><div class="qx-u">' + (d.kind === 'svc' && locate(d.url, nq) ? (m => esc(d.url.slice(0, m[0])) + '<em class="qx-hl">' + esc(d.url.slice(m[0], m[1])) + '</em>' + esc(d.url.slice(m[1])))(locate(d.url, nq)) : esc(d.url)) + '</div></div>';
      }).join('');
    }
    page({ site: 'qx', title: q + '_千寻搜索', url: 'https://www.qianxun.com/s?wd=' + encodeURIComponent(q), fav: 'q' },
      '<div class="qx-head"><a class="qx-logo sm" href="#/search">千<span>寻</span></a>' + searchBox(q) + '</div><div class="qx-tabs"><b>网页</b><span>资讯</span><span>图片</span><span>视频</span><span>地图</span></div><div class="qx-body">' + body + '</div>');
    bindSearch();
  }
  // 千寻资讯频道：热搜和推荐文章从首页挪到这里
  function feed() {
    if (D.atmoOff) { location.replace('#/search'); return; }  // 气氛页关闭：资讯频道（热搜、推荐）不开
    page({ site: 'qx', title: '千寻资讯', url: 'https://news.qianxun.com/', fav: 'q' },
      '<div class="qx-head"><a class="qx-logo sm" href="#/search">千<span>寻</span></a>' + searchBox('') + '</div><div class="qx-tabs"><span>网页</span><b>资讯</b><span>图片</span><span>视频</span><span>地图</span></div><div class="qx-body">'
      + '<div class="qx-hot"><b>千寻热搜</b>' + hot.map((h, i) => '<a href="#/a/' + h[1] + '"><i>' + (i + 1) + '</i>' + esc(h[0]) + '</a>').join('') + '</div>'
      + '<div class="qx-feed"><b>为你推荐</b>' + D.qxFeed.map(id => { const f = D.filler[id]; return '<a class="qx-card" href="#/a/' + id + '"><span>' + esc(f.title) + '</span><em>' + esc(f.src) + '　' + esc(f.date) + '</em></a>'; }).join('') + '</div></div>');
    bindSearch();
  }
  function article(id) {
    const f = D.filler[id];
    if (!f) return search('');
    BM.markRead(id);  // 千寻资讯：看过的标记（k01 照相馆、k02 讣告、k06 刑侦小知识）
    page({ site: 'news', title: f.title + ' - ' + f.src, url: f.url || 'https://news.qianxun.com/a/' + id + '.html', fav: 'n' },  // 文章可以带自己的网址（如纪委网站）
      '<div class="np"><div class="np-mast"><div class="np-name">' + esc(f.src) + '</div><div class="np-meta">' + esc(f.date) + '</div></div>' + npNav() + '<div class="np-art"><h1>' + esc(f.title) + '</h1><div class="np-body">' + BM.kw(f.html) + '</div><div class="np-ed">责任编辑：王瑶</div>' + npMore(id) + '</div></div>');
    bindZoom();
  }

  // ===== 澜城晚报（数字报） =====
  const newsUrl = { news11: '2005-07/29/content_A3_0729002', news12: '2005-10/13/content_A5_1013004', news7: '2005-11/02/content_A5_1102007', news1: '2006-07/16/content_A3_0716004', news4: '2006-08/26/content_A2_0826003', news3: '2016-03/18/content_A2_0318006', news5: '2026-07/12/content_A4_0712009' };
  const npNav = () => D.atmoOff ? '' : '<div class="np-nav">' + Object.keys(D.npSections).map(s => '<a href="#/np/' + encodeURIComponent(s) + '">' + s + '</a>').join('') + '</div>';
  const npTitle = id => (D.webPages[id] ? D.webPages[id].title : D.filler[id] ? D.filler[id].title : '');
  const npHref = id => (D.webPages[id] ? '#/news/' + id : '#/a/' + id);
  function npMore(id) {
    if (D.singleEntry) return '';  // 单入口版：不留“本版其他文章”这种第二入口
    const sec = Object.keys(D.npSections).find(s => D.npSections[s].includes(id)) || '要闻';
    const others = D.npSections[sec].filter(x => x !== id).slice(0, 3);
    return others.length ? '<div class="np-more"><b>本版其他文章</b>' + others.map(x => '<a href="' + npHref(x) + '">' + esc(npTitle(x)) + '</a>').join('') + '</div>' : '';
  }
  function news(id) {
    const p = D.webPages[id];
    if (p && (D.pagesOff || []).includes(id)) return unknown('epaper.lcwb.com.cn/html/' + (newsUrl[id] || id) + '.htm');  // 单入口版已删的页面（退休稿）
    if (!p || p.site !== '澜城晚报') return search('');
    BM.markRead(id);
    const [date, ban] = p.date.split(/\s+/);
    page({ site: 'news', title: p.title + ' - 澜城晚报数字报', url: 'https://epaper.lcwb.com.cn/html/' + newsUrl[id] + '.htm', fav: 'n' },
      '<div class="np"><div class="np-mast"><div class="np-name">澜城晚报</div><div class="np-meta">' + esc(date) + '　' + esc(ban || '') + '　数字报　<span>上一版</span>　<span>下一版</span></div></div>' + npNav()
      + '<div class="np-art"><h1>' + esc(p.title) + '</h1><div class="np-by">本报记者　' + ({ news1: '孙敏', news4: '孙敏' }[id] || '何嘉') + '</div><div class="np-body">' + BM.kw(p.html) + '</div><div class="np-ed">责任编辑：王瑶</div>' + npMore(id) + (D.singleEntry && id === 'news1' ? '<p class="np-src" style="margin-top:14px;padding-top:8px;border-top:1px solid #ddd;font-size:13px">本文刊于《澜城晚报》' + esc(date) + '　' + esc(ban || '') + '　｜　<a href="#/past">数字报 · 过刊检索（2005—2015）</a></p>' : '') + '</div></div>');
    bindZoom();  // 报道配图点开放大（2005-10-13 那篇要看清便签）
  }
  function npSection(sec) {
    if (D.atmoOff) { location.replace('#/past'); return; }  // 气氛页关闭：晚报版面不开
    const list = D.npSections[sec];
    if (!list) return search('');
    page({ site: 'news', title: sec + ' - 澜城晚报数字报', url: 'https://epaper.lcwb.com.cn/node/' + encodeURIComponent(sec) + '.htm', fav: 'n' },
      '<div class="np"><div class="np-mast"><div class="np-name">澜城晚报</div><div class="np-meta">' + esc(sec) + '版</div></div>' + npNav() + '<div class="np-art"><h1>' + esc(sec) + '</h1>' + list.map(x => '<a class="np-li" href="' + npHref(x) + '">' + esc(npTitle(x)) + '<em>' + esc(D.webPages[x] ? D.webPages[x].date.split(/\s+/)[0] : D.filler[x].date) + '</em></a>').join('') + '</div></div>');
  }
  // 过刊检索：输入出版日期，列出当天的报道
  let pastMsg = '', pastList = [];
  function past() {
    page({ site: 'news', title: '过刊检索 - 澜城晚报数字报', url: 'https://epaper.lcwb.com.cn/past', fav: 'n' },
      '<div class="np"><div class="np-mast"><div class="np-name">澜城晚报</div><div class="np-meta">数字报 · 过刊检索（2005—2015）</div></div>' + npNav() + '<div class="np-art"><h1>过刊检索</h1>' + (D.singleEntry ? '<p class="small" style="margin:0 0 10px">提示：一般新闻都会隔天见报。要找某天发生的事，请查第二天的版面。</p>' : '') + '<form id="pf" class="past-f"><label>出版日期 <input id="pd" placeholder="' + (D.singleEntry ? '年-月-日，例如 2010-05-01' : '例如 2006-07-16') + '" autocomplete="off"></label><button type="submit">查看当日版面</button></form><p class="small">2015 年以前的报纸只提供按日期检索。</p>' + (pastMsg ? '<p>' + pastMsg + '</p>' : '') + pastList.map(id => '<a class="np-li" href="#/news/' + id + '">' + esc(D.webPages[id].title) + '<em>' + esc(D.webPages[id].date) + '</em></a>').join('') + '</div></div>');
    document.getElementById('pf').addEventListener('submit', e => {
      e.preventDefault();
      const m = document.getElementById('pd').value.match(/(\d{4})\D*(\d{1,2})\D*(\d{1,2})/);
      pastList = []; pastMsg = '';
      if (!m) { pastMsg = '请输入完整的出版日期。'; return past(); }
      const d = m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
      pastList = Object.keys(D.webPages).filter(k => /^news/.test(k) && !(D.singleEntry && k === 'news1') && D.webPages[k].date.slice(0, 10) === d && +d.slice(0, 4) <= 2015 && (!D.docGates || !D.docGates[k] || BM.cond(D.docGates[k])));  // 过刊只收 2005—2015；页面门槛照样算
      if (pastList.length) { BM.markRead('past_' + d); pastMsg = d + ' 版面中与检索相关的报道：'; }
      else if (D.singleEntry && d === '2006-07-16') pastMsg = '2006-07-16　A3 版《柳林江堤又一女子遇害》，全文见本报网站。';
      else if (d === '2006-07-15') pastMsg = '2006-07-15　A3 版简讯：今晨柳林江堤发现一具女尸，警方已介入调查，详见本报明日报道。';
      else if (+m[1] > 2015) pastMsg = '2016 年以后的报道请直接在首页搜索。';
      else pastMsg = d + ' 当日版面没有找到相关报道。';
      past();
    });
  }
  function baike() {
    const p = D.webPages.baike;
    BM.markRead('baike');
    page({ site: 'bk', title: '柳林雨夜案 - 千寻百科', url: 'https://baike.qianxun.com/item/柳林雨夜案', fav: 'q' },
      '<div class="bk"><div class="bk-top"><b>千寻百科</b><span>' + esc(p.date) + '</span></div><h1>柳林雨夜案</h1><div class="bk-body">' + p.html + '</div><div class="bk-foot">本词条由网友共同编辑。参考资料：澜城晚报 2006 年 7 月、8 月相关报道。</div></div>');
  }

  // ===== 柳林论坛（只读存档） =====
  const thread = id => D.forum[id] || D.forumX[id];
  const boardOf = tid => Object.keys(D.forumBoards).find(b => D.forumBoards[b].includes(tid));
  function bbs(tid, user, board) {
    if (D.forumHubOff && !tid) { page({ site: 'bbs', title: '柳林论坛', url: 'http://bbs.liulin.net/', fav: 'b' }, '<div class="bbs-top"><b>柳林论坛</b><span>柳林人自己的论坛</span><em>本站 2016 年起停止发帖，现为只读存档</em></div><p class="small" style="padding:24px">版块列表和用户空间已关闭，存档帖子请用搜索引擎查找。</p>'); return; }
    const top = D.singleEntry ? '<div class="bbs-top"><b>柳林论坛</b><span>柳林人自己的论坛</span><em>本站 2016 年起停止发帖，现为只读存档</em></div>' : '<div class="bbs-top"><a href="#/bbs"><b>柳林论坛</b></a><span>柳林人自己的论坛</span><em>本站 2016 年起停止发帖，现为只读存档</em></div>';
    const row = k => { const t = thread(k); return '<a class="bbs-row" href="#/bbs/' + k + '"><span>' + esc(t.title) + '</span><span>' + esc(t.author) + '<i>' + esc(t.when.slice(0, 10)) + '</i></span><span>' + (t.posts.length - 1) + '</span></a>'; };
    if (user) {
      const posts = [];
      Object.keys(D.forum).concat(Object.keys(D.forumX)).forEach(k => thread(k).posts.forEach(p => { if (p[0] === user) posts.push([k, p[1]]); }));
      page({ site: 'bbs', title: user + ' 的帖子 - 柳林论坛', url: 'http://bbs.liulin.net/space-username-' + encodeURIComponent(user) + '.html', fav: 'b' },
        top + '<div class="bbs-thread"><h2>' + esc(user) + '</h2><p class="small" style="padding:0 14px">发帖 ' + posts.length + '　·　柳林</p>' + posts.map(p => '<a class="bbs-row one" href="#/bbs/' + p[0] + '"><span>' + esc(p[1].slice(0, 40)) + '</span><span>' + esc(thread(p[0]).title) + '</span></a>').join('') + '</div>');
      return;
    }
    if (board && D.forumBoards[board]) {
      page({ site: 'bbs', title: board + ' - 柳林论坛', url: 'http://bbs.liulin.net/forum-' + (Object.keys(D.forumBoards).indexOf(board) + 2) + '-1.html', fav: 'b' },
        top + '<div class="bbs-list"><div class="bbs-bh"><a href="#/bbs">柳林论坛</a> › ' + esc(board) + '</div><div class="bbs-h"><span>主题</span><span>作者</span><span>回复</span></div>' + D.forumBoards[board].map(row).join('') + '</div>');
      return;
    }
    if (!tid) {
      const intro = { '柳林生活': '镇上的大事小情', '二手市场': '闲置转让、收购', '招聘求职': '本地招工、找活', '情感天地': '心里话、寻人' };
      page({ site: 'bbs', title: '柳林论坛 - 柳林人自己的论坛', url: 'http://bbs.liulin.net/forum.php', fav: 'b' },
        top + '<div class="bbs-list"><div class="bbs-h"><span>版块</span><span>主题</span><span></span></div>' + Object.keys(D.forumBoards).map(b => '<a class="bbs-row" href="#/bbs/b/' + encodeURIComponent(b) + '"><span><b>' + esc(b) + '</b><i class="small">　' + esc(intro[b] || '') + '</i></span><span>' + D.forumBoards[b].length + '</span><span></span></a>').join('') + '</div>');
      return;
    }
    const t = thread(tid);
    if (!t) return bbs('');
    BM.markRead('bbs_' + tid); BM.momNotify();
    page({ site: 'bbs', title: t.title + ' - 柳林论坛', url: 'http://bbs.liulin.net/thread-' + (1000 + hid(tid) % 9000) + '-1-1.html', fav: 'b' },
      top + '<div class="bbs-thread"><h2>' + esc(t.title) + '</h2>' + t.posts.map((p, i) => '<div class="bbs-post"><div class="bbs-au">' + (D.singleEntry ? '<div class="unm">' + esc(p[0]) + '</div>' : '<a href="#/bbs/u/' + encodeURIComponent(p[0]) + '"><b>' + esc(p[0]) + '</b></a>') + '<span>' + (i ? '#' + (i + 1) : '楼主') + '</span></div><div class="bbs-tx">' + (D.singleEntry ? BM.kw(esc(p[1])).replace(/\[link:(#\/[\w\/%-]+)\|([^\]]+)\]/g, '<a href="$1">$2</a>') : BM.kw(esc(p[1]))) + '</div></div>').join('') + (D.singleEntry ? '' : '<a class="bbs-back" href="' + (boardOf(tid) ? '#/bbs/b/' + encodeURIComponent(boardOf(tid)) : '#/bbs') + '">返回列表</a>') + '</div>');
  }

  // ===== 澜城市中级人民法院 =====
  const courtHead = () => '<div class="gov-top"><div class="gov-emb"></div><div><div class="gov-name">澜城市中级人民法院</div><div class="gov-en">LANCHENG INTERMEDIATE PEOPLE\'S COURT</div></div></div><div class="gov-nav"><a href="#/court">首页</a><a href="#/court/gk">法院概况</a><a href="#/court/dt">审判动态</a><a href="#/court/gg">公告公示</a><a href="#/court/fw">诉讼服务</a><a href="#/court/jg">机构设置</a></div>';
  const courtFoot = '<div class="gov-foot">主办：澜城市中级人民法院　地址：澜城市人民路 1 号　数字化验收系统（院内网访问）</div>';
  const courtLi = id => '<p><a href="#/court/a/' + id + '">· ' + esc(D.filler[id].title) + '</a><i>' + esc(D.filler[id].date.slice(5)) + '</i></p>';
  function courtPage(sub, id) {
    const wrap = (title, url, html) => page({ site: 'gov', title, url, fav: 'c' }, courtHead() + '<div class="gov-main">' + html + '</div>' + courtFoot);
    if (sub === 'archive') {
      BM.markRead('archive');
      wrap('档案室 - 澜城市中级人民法院', 'https://www.lczy.gov.cn/jgsz/daj.html', '<div class="gov-crumb">当前位置：首页 > 机构设置 > 档案室</div><h2>档案室</h2><div class="gov-staff"><img src="img/linjp.jpg" alt="" width="110" style="border-radius:4px;display:block"><div><p>档案室负责我院诉讼档案的接收、保管、利用和数字化验收。</p><p>负责人：林建平（工号 LC0158）。1980 年生，柳林人，随母姓；2008 年起在档案室工作。</p><p>工作人员：王琳（工号 LC0211，2012 年起）、陈晓雯（工号 LC0236，2015 年起）。</p><p class="small">联系电话：0671-8216 0158</p></div></div>');
      return;
    }
    if (sub === 'a') { const f = D.filler[id]; wrap(f.title + ' - 澜城市中级人民法院', 'https://www.lczy.gov.cn/art/' + id + '.html', '<div class="gov-crumb">当前位置：首页 > 正文</div><h2>' + esc(f.title) + '</h2><p class="small">发布时间：' + esc(f.date) + '</p>' + f.html); return; }
    if (sub === 'jg') { wrap('机构设置 - 澜城市中级人民法院', 'https://www.lczy.gov.cn/jgsz/', '<div class="gov-crumb">当前位置：首页 > 机构设置</div><h2>机构设置</h2><div class="gov-depts">' + D.courtDepts.map(n => n === '档案室' ? '<a href="#/court/archive">' + n + '</a>' : '<span>' + n + '</span>').join('') + '</div>'); return; }
    const nav = D.courtNav[sub];
    if (nav) { wrap(nav.name + ' - 澜城市中级人民法院', 'https://www.lczy.gov.cn/' + sub + '/', '<div class="gov-crumb">当前位置：首页 > ' + nav.name + '</div><h2>' + nav.name + '</h2>' + (nav.list ? '<div class="gov-box wide">' + nav.list.map(courtLi).join('') + '</div>' : nav.html)); return; }
    wrap('澜城市中级人民法院', 'https://www.lczy.gov.cn/', '<div class="gov-cols"><div class="gov-box"><h3><a href="#/court/dt">审判动态</a></h3>' + D.courtNav.dt.list.map(courtLi).join('') + '</div><div class="gov-box"><h3><a href="#/court/gg">公告公示</a></h3>' + D.courtNav.gg.list.map(courtLi).join('') + '</div></div>');
  }

  // ===== 数字化验收系统（林建平的账号） =====
  const YS_KEY = 'beimian.ys';
  function ys(tab) {
    const shellYs = (body, t) => page({ site: 'ys', title: '诉讼档案数字化验收系统', url: 'http://ys.lczy.gov.cn/' + (t || 'login') + '.html', fav: 'c' }, '<div class="ys"><div class="ys-top"><b>澜城中院 · 诉讼档案数字化验收系统</b>' + (sessionStorage.getItem(YS_KEY) ? '<span>' + esc(D.yanshou.name) + '（' + D.yanshou.user + '）　<a id="ysOut">退出</a></span>' : '') + '</div>' + body + '</div>');
    if (!sessionStorage.getItem(YS_KEY)) {
      shellYs('<form class="ys-login" id="yf"><h3>院内用户登录</h3><label>工号<input id="yu" autocomplete="off"></label><label>密码<input id="yp" type="password" autocomplete="off"></label><p class="ys-err" id="ye"></p><button type="submit">登录</button><p class="small">仅限院内及合作单位使用。初始密码为 lczy@ 加工号后四位，首次登录后请及时修改。</p></form>');
      document.getElementById('yf').addEventListener('submit', e => {
        e.preventDefault();
        if (BM.norm(document.getElementById('yu').value) === BM.norm(D.yanshou.user) && document.getElementById('yp').value.trim() === D.yanshou.pass) { sessionStorage.setItem(YS_KEY, '1'); BM.markRead('ys_in'); location.hash = '#/ys/tasks'; }
        else document.getElementById('ye').textContent = '工号或密码错误。';
      });
      return;
    }
    tab = tab || 'tasks';
    const Y = D.yanshou;
    const tabs = [['tasks', '验收任务'], ['fj', '副卷调阅'], ['logs', '访问记录'], ['rooms', '场地与钥匙'], ['me', '个人信息'], ['msg', '系统消息']];
    let body = '';
    if (tab === 'tasks') body = '<table class="tbl"><tr><th>案号</th><th>规模</th><th>状态</th></tr>' + Y.tasks.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</table>';
    if (tab === 'fj' && !sessionStorage.getItem('beimian.fj')) body = '<form class="ys-login" id="fjf" style="margin:0"><h3>副卷调阅申请</h3><label>案号<input id="fjn" autocomplete="off" placeholder="（年份）澜中刑初字第 号"></label><label>调阅事由<input value="数字化验收抽查" disabled></label><p class="ys-err" id="fje"></p><button type="submit">提交</button><p class="small">副卷仅限本院档案室在验收期间调阅，系统记录调阅人和时间。</p></form>';
    else if (tab === 'fj') body = '<p class="small">（2007）澜中刑初字第108号　第6卷　副卷　仅限本院档案室调阅</p><table class="tbl"><tr><th>页号</th><th>题名</th><th>日期</th></tr>' + (D.catalog[6] || []).map(r => '<tr><td>' + esc(r[0]) + '</td><td><a href="#/ys/doc/' + r[3] + '">' + esc(r[1]) + '</a></td><td>' + esc(r[2]) + '</td></tr>').join('') + '</table>';
    if (tab === 'logs') { BM.markRead('ys_logs'); body = '<p class="small">验收方查看加工方账号的记录。</p><table class="tbl"><tr><th>时间</th><th>操作</th></tr>' + Y.logs.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>'; }
    if (tab === 'rooms') { BM.markRead('ys_rooms'); body = '<table class="tbl"><tr><th>日期</th><th>场地</th><th>用途</th><th>钥匙</th></tr>' + Y.rooms.map(r => '<tr><td>' + r.map(esc).join('</td><td>') + '</td></tr>').join('') + '</table>'; }
    if (tab === 'me') { BM.markRead('ys_me'); body = '<table class="tbl">' + Y.profile.map(r => '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>'; }
    if (tab === 'msg') body = Y.msgs.map(r => '<div class="ys-msg"><b>' + esc(r[0]) + '</b>　' + esc(r[1]) + '</div>').join('');
    shellYs('<div class="ys-tabs">' + tabs.map(t => '<a href="#/ys/' + t[0] + '"' + (t[0] === tab ? ' class="on"' : '') + '>' + t[1] + '</a>').join('') + '</div><div class="ys-body">' + body + '</div>', tab);
    const out = document.getElementById('ysOut');
    if (out) out.addEventListener('click', () => { sessionStorage.removeItem(YS_KEY); location.hash = '#/ys'; });
    const fjf = document.getElementById('fjf');
    if (fjf) fjf.addEventListener('submit', e => {
      e.preventDefault();
      const v = document.getElementById('fjn').value.replace(/[\s（）()〔〕\[\]第号字-]/g, '');
      if (/108/.test(v) && /(2007|澜中|刑初)/.test(v)) { sessionStorage.setItem('beimian.fj', '1'); BM.markRead('fj_ok'); ys('fj'); }
      else document.getElementById('fje').textContent = /108/.test(v) ? '请填写完整案号，格式：（年份）澜中刑初字第 X 号。' : '未找到该案号的副卷。';
    });
  }
  function ysDoc(id) {
    if (!sessionStorage.getItem(YS_KEY)) return ys('');
    const doc = D.docs[id];
    if (!doc || doc.vol !== 6 || !sessionStorage.getItem('beimian.fj')) return ys('fj');
    BM.markRead(id);
    page({ site: 'ys', title: doc.title + ' - 副卷调阅', url: 'http://ys.lczy.gov.cn/fj/view.html?id=' + id, fav: 'c' }, '<div class="ys"><div class="ys-top"><b>澜城中院 · 诉讼档案数字化验收系统</b><span>' + esc(D.yanshou.name) + '（' + D.yanshou.user + '）</span></div><div class="ys-tabs"><a href="#/ys/fj" class="on">‹ 副卷调阅</a></div><div class="ys-body"><div class="paper">' + BM.marks(doc.html) + '</div><p class="small">第6卷　' + esc(doc.pg) + '　' + esc(doc.title) + '</p></div></div>');
  }

  // ===== 警务通（2006，停用，只读） =====
  const JWT_KEY = 'beimian.jwt';
  // 警务通顶栏的“数字化档案 ↗”（2026-11-14）：用 window.open 开新标签页——同源新窗口会带上本页的 sessionStorage，警务通登录状态跟着过去
  document.addEventListener('click', e => { const a = e.target && e.target.closest ? e.target.closest('#jwtDag') : null; if (!a) return; e.preventDefault(); window.open('web.html#/portal/dag', '_blank'); });
  function jwt(sub) {
    const J = D.jwt;
    const wrap = body => page({ site: 'jwt', title: '警务通 - 澜城市公安局内网门户', url: 'http://portal.lcga.gov.cn/jwt/' + ({ in: 'msg', me: 'me', ry: 'contacts' }[sub] || 'index') + '.do', fav: 'j' }, '<div class="jwt"><div class="jwt-top">澜城市公安局　警务通 3.0<span>2004—2015 年的历史消息正在从旧版迁移　<a href="#/portal">返回门户</a>' + (sessionStorage.getItem(JWT_KEY) ? '　｜　<a href="web.html#/portal/dag" id="jwtDag">数字化档案 ↗</a>' : '') + '</span></div>' + body + '</div>');
    const jLogged = !!sessionStorage.getItem(JWT_KEY);
    // 单入口版：#/jwt 永远是登录页（登着也能换号重登）；站内消息、个人资料、通讯录各有自己的地址，没登录就回登录页
    const jLoginPage = D.singleEntry ? (!sub || sub === 'index' || sub === 'login') : !jLogged;
    if (D.singleEntry && !jLogged && !jLoginPage) { location.replace('#/jwt'); return; }
    if (jLoginPage) {
      const jNow = jLogged ? (sessionStorage.getItem(JWT_KEY) === 'lin' && J.lin ? J.lin.name : J.name) : '';
      wrap((jNow ? '<p class="small" style="text-align:center;margin:10px 0 0">当前已登录：' + esc(jNow) + '。用其他账号登录会先退出当前账号。</p>' : '') + '<form class="jwt-login" id="jf"><table><tr><td>用户名</td><td><input id="ju" autocomplete="off"></td></tr><tr><td>密　码</td><td><input id="jp" type="password" autocomplete="off"></td></tr></table><p class="jwt-err" id="je"></p><button type="submit">登 录</button><p class="small">用户名为本人警号。初始密码与警号相同，请首次登录后修改。离退休人员账号已停用。</p></form>' + (D.singleEntry ? '<div class="jwt-notice" style="margin:14px auto 0;max-width:460px;border:1px solid #c9b16a;background:#fffbe9;padding:8px 12px;font-size:13px;line-height:1.7"><b>系统公告</b>　旧版警务通（V2.1，2004—2015）已停用，新版不再提供旧版入口链接。历史数据迁移完成前，旧版网址保持不变。<div class="small" style="text-align:right">信息通信处　2026-06-15</div></div>' : ''));  // 单入口版：旧版警务通没有任何链接，只能照这条公告去改地址栏（网址在第 5 卷通话记录的页眉上）
      document.getElementById('jf').addEventListener('submit', e => {
        e.preventDefault();
        const u = document.getElementById('ju').value.trim(), p = document.getElementById('jp').value.trim();
        if (u === J.user) document.getElementById('je').textContent = '该账号已停用（离退休人员）。';
        else if (J.lin && J.lin.pass && u === J.lin.user && p === J.lin.user) document.getElementById('je').textContent = '该账号已修改初始密码。';
      else if (J.lin && u === J.lin.user && p.toLowerCase() === String(J.lin.pass || J.lin.user).toLowerCase()) { sessionStorage.setItem(JWT_KEY, 'lin'); BM.markRead('jwt_lin'); location.hash = '#/jwt/in'; }
        else document.getElementById('je').textContent = '用户名或密码错误！';
      });
      return;
    }
    const A = sessionStorage.getItem(JWT_KEY) === 'lin' && J.lin ? J.lin : J;
    const bar = '<div class="jwt-bar">当前用户：' + esc(A.name) + '（' + esc(A.title) + '）　｜　<a href="#/jwt/in">站内消息</a>　｜　公文　｜　' + (D.singleEntry && J.staff ? '<a href="#/jwt/ry">通讯录</a>' : '通讯录') + '　｜　' + (A.profile ? '<a href="#/jwt/me">个人资料</a>　｜　' : '') + '<a id="jOut">注销</a></div>';
    const staffPage = (st, title) => '<h3 style="margin:12px 10px 4px;font-size:15px">' + esc(title) + '</h3><p class="small" style="margin:0 10px 8px">' + esc(st.note) + '</p>' + st.groups.map(g => '<h4 style="margin:12px 10px 4px">' + esc(g[0]) + '</h4><table class="jwt-tbl">' + g[1].map(r => '<tr><th style="width:150px">' + esc(r[0]) + '</th><td style="width:90px">' + esc(r[1]) + '</td><td>' + esc(r[2] || '') + '</td></tr>').join('') + '</table>').join('');
    if (sub === 'me' && A.profile) BM.markRead('jwt_me_' + (A === D.jwt.lin ? 'lin' : 'wei'));
    if (sub === 'ry' && D.singleEntry && J.staff) { BM.markRead('jwt_ry'); wrap(bar + staffPage(J.staff, '通讯录 · 局内人员')); }
    else if (sub === 'me' && A.profile) wrap(bar + '<table class="jwt-tbl">' + A.profile.map(r => '<tr><th style="width:120px">' + esc(r[0]) + '</th><td>' + BM.kw(esc(r[1])) + '</td></tr>').join('') + '</table>');
    else wrap(bar + '<p class="small" style="padding:6px 10px;margin:0">2004—2015 年的历史消息正在从旧版迁移，迁移完成前可登录旧版系统只读查询。</p><table class="jwt-tbl"><tr><th>时间</th><th>发件人</th><th>收件人</th><th>内容</th></tr>' + A.inbox.filter(r => r[0] >= '2015-07').reverse().map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td></tr>').join('') + '</table>');
    document.getElementById('jOut').addEventListener('click', () => { sessionStorage.removeItem(JWT_KEY); location.hash = '#/jwt'; });
  }

  // ===== 澜城市公安局内网门户（新版，2015 年 7 月启用） =====
  const portalHead = () => '<div class="gov-top"><div class="gov-emb"></div><div><div class="gov-name">澜城市公安局</div><div class="gov-en">内网门户</div></div></div><div class="gov-nav"><a href="#/portal">首页</a>' + (D.singleEntry ? '<span>通知公告</span>' : '<a href="#/portal/tz">通知公告</a>') + (D.ldOff ? '' : '<a href="#/portal/ld">领导分工</a>') + (D.singleEntry && D.portal && D.portal.jg ? '<a href="#/portal/jg">机构沿革</a>' : '') + '<a href="#/portal/dag">数字化档案（试运行）</a>' + (D.rainOff ? '' : '<a href="#/portal/sw">雨情查询</a>') + '<a href="#/jwt">警务通</a></div>';
  const portalFoot = '<div class="gov-foot">澜城市公安局信息通信处　内部网站，请勿外传</div>';
  function portal(sub, id) {
    if ((sub === 'dag' || sub === 'doc') && !sessionStorage.getItem(JWT_KEY)) { page({ site: 'portal', title: '数字化档案 - 澜城市公安局内网门户', url: 'http://portal.lcga.gov.cn/dag/index.do', fav: 'j' }, portalHead() + '<div class="gov-box" style="margin:20px;padding:30px;text-align:center"><p>数字化档案（试运行）仅限局内账号访问。</p><p class="small">请先登录<a href="#/jwt">警务通</a>，再从门户进入。</p></div>'); return; }  // 数字化档案仅限局内账号
    const P = D.portal;
    BM.markRead('portal');
    const wrap = (title, url, html) => page({ site: 'portal', title: title + ' - 澜城市公安局内网门户', url: 'http://portal.lcga.gov.cn/' + url, fav: 'p' }, portalHead() + '<div class="gov-main">' + html + '</div>' + portalFoot);
    const li = a => '<p><a href="#/portal/a/' + a.id + '">· ' + esc(a.title) + '</a><i>' + esc(a.date.slice(5)) + '</i></p>';
    if (D.singleEntry && (sub === 'a' || sub === 'tz')) { location.replace('#/portal'); return; }  // 单入口版：通知新闻全文都在首页，不另开单篇页面
    if (sub === 'a') { const a = P.news.concat(P.notices).find(x => x.id === id); if (!a) return unknown('portal.lcga.gov.cn/a/' + id); BM.markRead('pt_' + id); wrap(a.title, 'art/' + id + '.do', '<div class="gov-crumb">当前位置：首页 > 正文</div><h2>' + esc(a.title) + '</h2><p class="small">发布时间：' + esc(a.date) + '　来源：' + esc(a.src || '市局') + '</p>' + a.html); return; }
    if (sub === 'sw' && D.rainOff) { wrap('页面不存在', 'sw.do', '<p class="small">该栏目已撤销。</p>'); return; }
    if (sub === 'sw') {
      const R = P.rain || {}; const q = id || '';
      const d = (q.match(/(\d{4})\D*(\d{1,2})\D*(\d{1,2})/) || []).slice(1); const day = d.length ? d[0] + '-' + d[1].padStart(2, '0') + '-' + d[2].padStart(2, '0') : '';
      let res = '';
      if (day) { const next = new Date(day + 'T00:00:00'); next.setDate(next.getDate() + 1); const nd = next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0') + '-' + String(next.getDate()).padStart(2, '0');
        const rows = (R[day] || []).map(r => [day, r[0], r[1]]).concat((R[nd] || []).filter(r => /^[0-5]—/.test(r[0])).map(r => [nd, r[0], r[1]]));
        if (rows.length) { BM.markRead('rain_' + day); res = '<table class="tbl"><tr><th>日期</th><th>时段</th><th>雨量（毫米）</th></tr>' + rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + r[2].toFixed(1) + '</td></tr>').join('') + '</table><p class="small">柳林站。小时雨量 16 毫米以上为短时强降雨。</p>'; }
        else res = '<p>' + esc(day) + '　柳林站无短时强降雨记录。</p>'; }
      wrap('雨情查询', 'sw.do', '<div class="gov-crumb">当前位置：首页 > 雨情查询</div><h2>雨情查询</h2><form id="swf" class="past-f"><label>日期 <input id="swd" placeholder="例如 2010-07-08" value="' + esc(q) + '" autocomplete="off"></label><button type="submit">查询逐时雨量</button></form>' + res);
      document.getElementById('swf').addEventListener('submit', e => { e.preventDefault(); location.hash = '#/portal/sw/' + encodeURIComponent(document.getElementById('swd').value.trim()); });
      return;
    }
    if (sub === 'tz') { wrap('通知公告', 'tz.do', '<div class="gov-crumb">当前位置：首页 > 通知公告</div><h2>通知公告</h2><div class="gov-box wide">' + P.notices.map(li).join('') + '</div>'); return; }
    if (sub === 'jg' && D.singleEntry && P.jg) { BM.markRead('pt_jg'); wrap(P.jg.title, 'jg.do', '<div class="gov-crumb">当前位置：首页 > 机构沿革</div><h2>' + esc(P.jg.title) + '</h2><div class="gov-box wide">' + P.jg.html + '</div>'); return; }  // 气氛页：市局、分局、派出所的关系，所长／局长，从柳林所走出来的人
    if (sub === 'ld' && D.ldOff) { wrap('页面不存在', 'ld.do', '<p class="small">该栏目已撤销。</p>'); return; }
    if (sub === 'ld') { BM.markRead('pt_ld'); wrap('领导分工', 'ld.do', '<div class="gov-crumb">当前位置：首页 > 领导分工</div><h2>领导分工</h2><table class="tbl">' + P.leaders.map(r => '<tr><th style="width:150px">' + esc(r[0]) + '</th><td>' + BM.kw(esc(r[1])) + '</td></tr>').join('') + '</table>'); return; }
    if (sub === 'dag') {
      BM.markRead('pt_dag');
      const q = String(id || '').trim(); const qq = q.replace(/\s/g, '');
      const dm = qq.match(/(\d{4})\D*(\d{1,2})\D*(\d{1,2})/); const ymd = dm ? dm[1] + '-' + dm[2].padStart(2, '0') + '-' + dm[3].padStart(2, '0') : '';
      const hit = ymd === '2006-07-14' ? 'V6_p15' : (/T0716/i.test(qq) || ymd === '2006-08-23') ? 'V6_k8' : '';  // 钥匙登记：清溪老吴说的那个礼拜三（搜车 8-21 以后、补查 8-24 以前）
      const available = hit && (!Array.isArray(D.activeCaseDocs) || D.activeCaseDocs.includes(hit));
      if (available) BM.markRead('dagq_' + hit);
      const res = available ? '<div class="gov-box" style="margin-top:18px"><a class="dag-result" href="#/portal/doc/' + hit + '">' + esc(D.docs[hit].title) + '</a><p class="small">' + esc(D.docs[hit].pg || '') + '　查看文书</p></div>' : (q ? '<p class="small">没有检索到“' + esc(q) + '”的相关档案。</p>' : '');
      wrap('数字化档案（试运行）', 'dag/search.do', '<div class="gov-crumb">当前位置：首页 > 数字化档案（试运行）</div><h2>数字化档案（试运行）</h2><p class="small">' + esc(P.dagNote) + '</p><form id="dgf" class="past-f"><label>检索 <input id="dgq" placeholder="' + (D.singleEntry ? '日期，如 2010-05-01' : '日期或车号，如 2006-07-14') + '" value="' + esc(q) + '" autocomplete="off"></label><button type="submit">检索</button></form>' + res);
      document.getElementById('dgf').addEventListener('submit', ev => { ev.preventDefault(); const v = document.getElementById('dgq').value.trim(); if (v) location.hash = '#/portal/dag/' + encodeURIComponent(v); });
      return;
    }
    if (sub === 'doc') { const doc = D.docs[id]; if (!doc || !P.dag.some(r => r[0] === id) || (Array.isArray(D.activeCaseDocs) && !D.activeCaseDocs.includes(id))) return unknown('portal.lcga.gov.cn/dag/' + id); if (!BM.read('dagq_' + id)) { location.hash = '#/portal/dag'; return; } BM.markRead(id); wrap(doc.title, 'dag/view.do?id=' + id, '<div class="gov-crumb">当前位置：首页 > 数字化档案 > 正文</div><div class="paper">' + BM.marks(doc.html) + '</div>'); return; }
    P.news.concat(P.notices).forEach(x => BM.markRead('pt_' + x.id));  // 门户首页一页：通知、新闻全文都在这里
    const full = x => '<div class="gov-art" style="margin-bottom:14px"><p><b>' + esc(x.title) + '</b>　<i>' + esc(x.date) + '</i></p>' + (x.html || ('<p>' + esc(x.text || '') + '</p>')) + '</div>';
    wrap('首页', 'index.do', '<div class="gov-cols"><div class="gov-box"><h3>工作动态</h3>' + P.news.map(full).join('') + '</div><div class="gov-box"><h3>' + (D.singleEntry ? '通知公告' : '<a href="#/portal/tz">通知公告</a>') + '</h3>' + P.notices.map(full).join('') + '<h3 style="margin-top:14px">常用系统</h3><p><a href="#/jwt">· 警务通</a></p><p><a href="#/portal/dag">· 数字化档案（试运行）</a></p><p><span>· 综合查询（需数字证书）</span></p></div></div>');
  }
  // ===== 旧版门户（2015 年 6 月停止维护）：只剩一句话 =====
  function oaPortal() {
    if (D.atmoOff) { page({ site: 'oa', title: '无法访问此页面', url: 'http://oa.lcga.gov.cn/', fav: 'j' }, '<div style="padding:80px 40px;color:#444"><h2 style="font-weight:normal">无法访问此页面</h2><p>oa.lcga.gov.cn 拒绝了我们的连接请求。</p></div>'); return; }
    BM.markRead('oa');
    page({ site: 'oa', title: '澜城市公安局内网门户（旧版）', url: 'http://oa.lcga.gov.cn/', fav: 'j' }, '<div class="jwt"><div class="jwt-top">澜城市公安局　内网门户（旧版）</div><div style="padding:40px;text-align:center"><p>本门户已于 2015 年 6 月 30 日停止维护。</p><p class="small">旧版警务通历史数据正在迁移，计划于 2026 年 12 月 31 日下线。请访问新版门户。</p></div></div>');
  }
  // ===== 旧版警务通（V2.1，2015 年停用，只读）：收发消息已迁到新版，备忘录和草稿箱没迁 =====
  const OA_KEY = 'beimian.oajwt';
  function oaJwt(sub) {
    const O = D.oajwt;
    const wrap = body => page({ site: 'oajwt', title: '警务通 V2.1', url: 'http://oa.lcga.gov.cn/jwt/' + ({ hist: 'msg' }[sub] || sub || 'index') + '.do', fav: 'j' }, '<div class="jwt"><div class="jwt-top">澜城市公安局　警务通 V2.1<span>本系统已于 2015 年停用，数据只读</span></div>' + body + '</div>');
    if (sub === 'hist') {
      if (D.singleEntry) { location.replace('#/oajwt/memo'); return; }  // 单入口版：收发消息已迁到新版，旧版只剩备忘和草稿
      const who = sessionStorage.getItem(OA_KEY) ? '1' : null;  // 旧版只能登录后看；入口是地址栏输入旧版网址（印在 2006 年通话记录的打印页眉上）
      const banner = '<p style="padding:8px 12px;margin:0;background:#fff7e0;color:#7a5200;font-size:13px">' + "本系统数据正在迁移至新版警务通，计划于 2026 年 12 月 31 日下线。收发消息迁移期间只读；个人备忘、草稿箱不在迁移范围，请本人登录后自行导出。" + '</p>';
      if (!who) { location.hash = '#/oajwt'; return; }
      const A = D.jwt;  // 魏东旧账号的收发消息
      BM.markRead('jwt_hist');
      wrap(banner + '<div class="jwt-bar">当前用户：' + esc(A.name) + '（历史消息，只读）　｜　<b>收发消息</b>　｜　<a href="#/oajwt/memo">个人备忘</a>　｜　<a href="#/oajwt/draft">草稿箱</a></div><table class="jwt-tbl"><tr><th>时间</th><th>发件人</th><th>收件人</th><th>内容</th></tr>' + A.inbox.filter(r => r[0] < '2015-07').reverse().map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + (r[4] ? (BM.markRead('ph_' + r[4]), '　<a href="photo.html#' + r[4] + '">📎 审批表.jpg' + (D.photos[r[4]] ? '<div style="max-width:280px;margin-top:6px">' + D.photos[r[4]].html + '</div>' : '') + '</a>') : '') + '</td></tr>').join('') + '</table>');
      return;
    }
    const oLogged = !!sessionStorage.getItem(OA_KEY);
    // 单入口版：#/oajwt 永远是登录页，找回密码照常；备忘、通讯录要登录，没登录回登录页
    if (D.singleEntry && !oLogged && ['memo', 'draft', 'ry'].includes(sub)) { location.replace('#/oajwt'); return; }
    if (D.singleEntry ? (!sub || sub === 'index' || sub === 'login' || sub === 'reset' || !oLogged) : !oLogged) {
      if (sub === 'reset') {
        const st = sessionStorage.getItem('beimian.oareset');
        if (!st) {
          wrap('<form class="jwt-login" id="orf"><h3>找回密码</h3><table><tr><td>警　号</td><td><input id="oru" autocomplete="off"></td></tr></table><p class="jwt-err" id="ore"></p><button type="submit">下一步</button></form>');
          document.getElementById('orf').addEventListener('submit', e => { e.preventDefault(); const u = document.getElementById('oru').value.trim(); if (u === O.user) { sessionStorage.setItem('beimian.oareset', u); oaJwt('reset'); } else document.getElementById('ore').textContent = u ? '该账号已迁移至新版警务通，请到新版登录。' : '请输入警号。'; });
          return;
        }
        wrap('<form class="jwt-login" id="oqf"><h3>找回密码</h3><p>警号 ' + esc(st) + '　密保问题：' + esc(O.q) + '</p><table><tr><td>答　案</td><td><input id="oqa" autocomplete="off" placeholder="8 位数字"></td></tr></table><p class="jwt-err" id="oqe"></p><button type="submit">提 交</button><p class="small"><a id="oqb">换一个警号</a></p></form>');
        document.getElementById('oqb').addEventListener('click', () => { sessionStorage.removeItem('beimian.oareset'); oaJwt('reset'); });
        document.getElementById('oqf').addEventListener('submit', e => { e.preventDefault(); const v = document.getElementById('oqa').value.replace(/\D/g, ''); if (v === O.a) { sessionStorage.setItem(OA_KEY, '1'); BM.markRead('oa_in'); BM.dadCheck(); if (D.singleEntry && !BM.read('n_fake')) { BM.markRead('n_fake'); const fm = (D.wxChats.xu.msgs || []).find(m => m.req === 'sms' && m.text); if (fm) setTimeout(() => BM.notify({ icon: 'wx', app: '微信', title: '许禾', text: fm.text, url: 'wechat.html', ms: 12000 }), 900); } location.hash = '#/oajwt/memo'; } else document.getElementById('oqe').textContent = '密保答案错误。'; });
        return;
      }
      wrap((D.singleEntry && O.notice ? '<p class="small jwt-notice">' + esc(O.notice) + '</p>' : '') + (D.singleEntry && oLogged ? '<p class="small" style="text-align:center;margin:10px 0 0">当前已登录：' + esc(O.name) + '。</p>' : '') + '<form class="jwt-login" id="of"><table><tr><td>用户名</td><td><input id="ou" autocomplete="off"></td></tr><tr><td>密　码</td><td><input id="op" type="password" autocomplete="off"></td></tr></table><p class="jwt-err" id="oe"></p><button type="submit">登 录</button><p class="small"><a href="#/oajwt/reset">忘记密码？</a></p><p class="small">本系统数据正在迁移至新版警务通，计划于 2026 年 12 月 31 日下线。收发消息迁移期间只读；个人备忘、草稿箱不在迁移范围，请本人登录后自行导出。</p></form>');
      document.getElementById('of').addEventListener('submit', e => { e.preventDefault(); document.getElementById('oe').textContent = '用户名或密码错误！'; });
      return;
    }
    const bar = D.singleEntry
      ? '<div class="jwt-bar">当前用户：' + esc(O.name) + '（' + esc(O.title) + '）　｜　<span>收发消息（已迁移至新版）</span>　｜　' + (sub === 'ry' ? '<a href="#/oajwt/memo">个人备忘</a>' : '<b>个人备忘</b>') + '　｜　<span>草稿箱（见下方）</span>　｜　' + (O.staff ? (sub === 'ry' ? '<b>通讯录</b>' : '<a href="#/oajwt/ry">通讯录</a>') + '　｜　' : '') + '<a id="oOut">注销</a></div>'
      : '<div class="jwt-bar">当前用户：' + esc(O.name) + '（' + esc(O.title) + '）　｜　<a href="#/oajwt/hist">收发消息（只读）</a>　｜　<a href="#/oajwt/memo">个人备忘</a>　｜　<a href="#/oajwt/draft">草稿箱</a>　｜　<a id="oOut">注销</a></div>';
    if (sub === 'ry' && D.singleEntry && O.staff) { BM.markRead('oa_ry'); wrap(bar + '<h3 style="margin:12px 10px 4px;font-size:15px">通讯录 · 局内人员</h3><p class="small" style="margin:0 10px 8px">' + esc(O.staff.note) + '</p>' + O.staff.groups.map(g => '<h4 style="margin:12px 10px 4px">' + esc(g[0]) + '</h4><table class="jwt-tbl">' + g[1].map(r => '<tr><th style="width:150px">' + esc(r[0]) + '</th><td style="width:90px">' + esc(r[1]) + '</td><td>' + esc(r[2] || '') + '</td></tr>').join('') + '</table>').join('')); }
    else if (sub === 'draft' && !D.singleEntry) { BM.markRead('oa_draft'); wrap(bar + '<table class="jwt-tbl"><tr><th>保存时间</th><th>收件人</th><th>内容（未发送）</th></tr>' + O.drafts.slice().reverse().map(r => '<tr><td style="white-space:nowrap">' + esc(r[0]) + '</td><td style="white-space:nowrap">' + esc(r[1]) + '</td><td>' + esc(r[2]).replace(/\n/g, '<br>') + '</td></tr>').join('') + '</table>'); }
    else { BM.markRead('oa_memo'); BM.dadCheck(); BM.markRead('oa_draft'); wrap(bar + '<table class="jwt-tbl"><tr><th>时间</th><th>个人备忘</th></tr>' + O.memos.map(r => '<tr><td style="white-space:nowrap">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table><h4 style="margin:18px 0 6px">草稿箱</h4><table class="jwt-tbl"><tr><th>保存时间</th><th>收件人</th><th>内容（未发送）</th></tr>' + O.drafts.slice().reverse().map(r => '<tr><td style="white-space:nowrap">' + esc(r[0]) + '</td><td style="white-space:nowrap">' + esc(r[1]) + '</td><td>' + esc(r[2]).replace(/\n/g, '<br>') + '</td></tr>').join('') + '</table>'); }  // 备忘和草稿箱一页
    document.getElementById('oOut').addEventListener('click', () => { sessionStorage.removeItem(OA_KEY); sessionStorage.removeItem('beimian.oareset'); location.hash = '#/oajwt'; });
  }

  // ===== 宋晴的 QQ 空间 =====
  const QZ_KEY = 'beimian.qzone';

  // ===== Edge 历史记录：许禾这几天看过的页面（只有标题和时间） =====
  function historyPage(view) {
    BM.markRead('edge_history');
    const O = D.singleEntry && D.edgeOther;
    const other = view === 'other' && O;
    const side = '<div class="eh-side"><b>历史记录</b><a href="#/history"' + (other ? '' : ' class="on"') + '>全部</a><span>最近关闭</span>' + (O ? '<a href="#/history/other"' + (other ? ' class="on"' : '') + '>其他设备的标签页</a>' : '<span>其他设备的标签页</span>') + '</div>';
    if (other) {  // 许禾的手机同步过来的页面（2026-11-14）：只有标题和时间，旧版警务通的内网网址没同步
      BM.markRead('edge_other');
      page({ site: 'edge', title: '历史记录', url: 'edge://history/syncedTabs', fav: 'e' }, '<div class="eh">' + side + '<div class="eh-main"><h4>' + esc(O.device) + '　<span class="small">上次同步：' + esc(O.synced) + '</span></h4>'
        + O.rows.map(r => r[2] ? '<a class="eh-row" href="' + esc(r[2]) + '"><span class="eh-t">' + esc(r[0]) + '</span><span class="eh-title">' + esc(r[1]) + '</span></a>' : '<div class="eh-row dim"><span class="eh-t">' + esc(r[0]) + '</span><span class="eh-title">' + esc(r[1]) + '</span><span class="eh-note">' + esc(r[3]) + '</span></div>').join('') + '</div></div>');
      return;
    }
    const by = {};
    (D.edgeHistory || []).forEach(h => { (by[h[0]] = by[h[0]] || []).push(h); });
    page({ site: 'edge', title: '历史记录', url: 'edge://history/all', fav: 'e' }, '<div class="eh">' + side + '<div class="eh-main"><input class="eh-q" placeholder="搜索历史记录" disabled>'
      + Object.keys(by).map(d => '<h4>' + esc(d) + '</h4>' + by[d].map(h => '<a class="eh-row" href="' + esc(h[3]) + '"><span class="eh-t">' + esc(h[1]) + '</span><span class="eh-title">' + esc(h[2]) + '</span></a>').join('')).join('') + '</div></div>');
  }
  const MAPXY = { ll: [380, 290], llbj: [330, 255], lsg: [430, 330], lpcs: [250, 380], jd: [540, 390], xys: [318, 238], qx: [770, 70], zy: [30, 560] };
  function mapSVG(pts) {
    const lab = (x, y, t, s, c) => '<text x="' + x + '" y="' + y + '" font-size="' + (s || 13) + '" fill="' + (c || '#555') + '">' + t + '</text>';
    let s = '<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#eef1e6"/>'
      + '<path d="M470 0 C520 160 560 300 640 420 S760 560 800 600 L800 0 Z" fill="#cfe3f3"/>' + lab(650, 230, '柳林江', 16, '#5c8fb8')
      + '<path d="M455 0 C505 160 545 300 625 420 S745 560 785 600" stroke="#c9b98a" stroke-width="7" fill="none"/>' + lab(560, 470, '江堤路')
      + '<path d="M120 300 L640 330" stroke="#fff" stroke-width="9"/>' + lab(150, 292, '柳林路')
      + '<path d="M300 120 L345 470" stroke="#fff" stroke-width="9"/>' + lab(262, 150, '柳林北街')
      + '<path d="M0 400 L560 420" stroke="#fde7b0" stroke-width="12"/>' + lab(40, 392, '柳林大道')
      + '<path d="M345 470 L330 600 M640 330 L800 40" stroke="#fde7b0" stroke-width="10" fill="none"/>' + lab(700, 160, 'S203 往清溪', 12, '#a07a1a') + lab(20, 590, '← 澜城市区', 12, '#a07a1a');
    const ps = pts.filter(Boolean).map(m => MAPXY[m.id]).filter(Boolean);
    if (ps.length === 2) s += '<polyline points="' + ps.map(p => p.join(',')).join(' ') + '" stroke="#e8590c" stroke-width="4" stroke-dasharray="10 6" fill="none"/>';
    ps.forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#e03131" stroke="#fff" stroke-width="3"/>'; });
    return s + '</svg>';
  }
  // ===== 千寻地图：地点、驾车路线 =====
  function mapFind(q) { const v = BM.norm(q); return (D.mapPlaces || []).find(m => m.keys.some(k => BM.norm(k) === v || (v.length > 2 && BM.norm(m.name).includes(v)))) || null; }
  function mapPage(arg) {
    if (D.mapOff) return search('');  // 千寻地图已删
    const raw = decodeURIComponent(arg || '');
    const [a, b, mode] = raw.split('>>');
    const walk = mode === '步行';
    let body = '';
    if (b !== undefined) {
      const A = mapFind(a), Bp = mapFind(b);
      const r = A && Bp ? (D.mapRoutes || []).find(x => (x[0] === A.id && x[1] === Bp.id) || (x[0] === Bp.id && x[1] === A.id)) : null;
      BM.markRead('map_route_' + (A ? A.id : '') + '_' + (Bp ? Bp.id : ''));
      const tabs = A && Bp ? '<div class="qmap-mode"><a href="#/map/' + encodeURIComponent(a + '>>' + b) + '"' + (walk ? '' : ' class="on"') + '>驾车</a><a href="#/map/' + encodeURIComponent(a + '>>' + b + '>>步行') + '"' + (walk ? ' class="on"' : '') + '>步行</a></div>' : '';
      if (walk) BM.markRead('map_walk_' + (A ? A.id : '') + '_' + (Bp ? Bp.id : ''));
      body = r ? tabs + '<div class="qmap-card"><b>' + esc(A.name) + ' → ' + esc(Bp.name) + '</b><p class="qmap-big">' + esc(r[2]) + ' 公里　' + (walk ? '步行约 ' + esc(r[5] || '—') : '驾车约 ' + esc(r[3])) + ' 分钟</p><p class="small">' + esc(r[4]) + '</p></div>' : '<div class="qmap-card"><p>' + (A && Bp ? '没有找到合适的路线。' : '没有找到“' + esc(A ? b : a) + '”，换个说法试试。') + '</p></div>';
    } else if (raw) {
      const m = mapFind(raw);
      if (m) BM.markRead('map_' + m.id);
      body = m ? '<div class="qmap-card"><b>' + esc(m.name) + '</b><p class="small">' + esc(m.addr) + '</p><p>' + esc(m.desc) + '</p>' + (m.img ? '<div class="qmap-sv"><img src="img/' + m.img + '.jpg" alt="" data-zimg="img/' + m.img + '.jpg"><span>街景　' + esc(m.svDate || '') + '</span></div>' : '') + '</div>' : '<div class="qmap-card"><p>没有找到“' + esc(raw) + '”。</p></div>';
    }
    page({ site: 'map', title: (raw ? raw.replace('>>', ' → ') + ' - ' : '') + '千寻地图', url: 'https://map.qianxun.com/' + (raw ? '?q=' + encodeURIComponent(raw) : ''), fav: 'q' },
      '<div class="qmap"><div class="qmap-side"><div class="qx-logo sm">千<span>寻</span>地图</div><form id="mpf" class="qmap-f"><input id="mpq" placeholder="搜地点" value="' + esc(b === undefined ? raw : '') + '" autocomplete="off"><button type="submit">搜索</button></form><form id="mpr" class="qmap-f"><input id="mpa" placeholder="起点" value="' + esc(b !== undefined ? a : '') + '" autocomplete="off"><input id="mpb" placeholder="终点" value="' + esc(b !== undefined ? b : '') + '" autocomplete="off"><button type="submit">驾车路线</button></form>' + body + '</div><div class="qmap-map">' + mapSVG(b !== undefined ? [mapFind(a), mapFind(b)] : [raw ? mapFind(raw) : null]) + '</div></div>');
    document.getElementById('mpf').addEventListener('submit', e => { e.preventDefault(); const v = document.getElementById('mpq').value.trim(); if (v) location.hash = '#/map/' + encodeURIComponent(v); });
    document.getElementById('mpr').addEventListener('submit', e => { e.preventDefault(); const x = document.getElementById('mpa').value.trim(), y = document.getElementById('mpb').value.trim(); if (x && y) location.hash = '#/map/' + encodeURIComponent(x + '>>' + y); });
    bindZoom();
  }
  // ===== 本地 PDF（Edge 打开桌面上的《项目须知.pdf》） =====
  function pdfView() {
    const P = D.projectDoc;
    BM.markRead('pdf_xz');
    page({ site: 'pdf', title: P.file, url: 'file:///C:/Users/许禾/Desktop/' + P.file, fav: 'p' }, '<div class="pdfv"><div class="pdf-bar"><span>☰</span><span>' + esc(P.file) + '</span><span class="pdf-pg">1 / 2</span><span>−　100%　＋</span><span>⟲　⤓　🖶</span></div><div class="pdf-paper">' + BM.kw(P.html) + '</div><div class="pdf-paper pdf-end"><p class="small">（第 2 页：附件 文渊加工管理系统操作截图，略）</p></div></div>');
  }
  // ===== W 的 QQ 空间（暗线：林建平）。访问问题：我是在哪儿长大的？ =====
  const QZW_KEY = 'beimian.qzw';
  function qzoneW(sub, arg) {
    if (D.qzwOff) { page({ site: 'qz', title: 'QQ空间', url: 'https://user.qzone.qq.com/', fav: 'z' }, '<div style="padding:80px 40px;text-align:center;color:#666">该空间不存在或已关闭。</div>'); return; }
    const W = D.qzoneW;
    const shell = (body, t) => page({ site: 'qz', title: 'X 的空间', url: 'https://user.qzone.qq.com/' + W.qq + (t ? '/' + t : ''), fav: 'z' }, '<div class="qz">' + body + '</div>');
    const head = '<div class="qz-head"><div class="qz-av">X</div><div><b>X</b><div class="small">' + (sessionStorage.getItem(QZW_KEY) ? esc(W.sign) : '性别：男　所在地：柳林') + '</div></div></div>';
    // 只有用这个号在 QQ 客户端登录过，才能看（访问权限：仅本人和好友）
    if (!(BM.flag('qqLin') || sessionStorage.getItem(QZW_KEY))) {
      shell(head + '<div class="qz-body"><p>🔒 主人设置了访问权限，仅好友可见。</p></div>');
      return;
    }
    const nav = head + '<div class="qz-nav"><a href="#/qzw">日志</a>' + (D.qzAlbumOff ? '' : '<a href="#/qzw/album/暗房">相册</a>') + '</div>';
    if (sub === 'blog') {
      const i = Math.max(0, Math.min(W.diaries.length - 1, Number(arg) || 0)); const d = W.diaries[i];
      const ord = wOrder(W), pos = ord.indexOf(i), prev = ord[pos - 1], next = ord[pos + 1];
      BM.markRead('qzw_' + d.d);
      shell(nav + '<div class="qz-body"><div class="qz-diary"><h3>' + (d.ht ? '<b class="kw">' + esc(d.t) + '</b>' : esc(d.t)) + '</h3><div class="small">' + (d.hl ? '<b class="kw">' + esc(d.d) + '</b>' : esc(d.d)) + '　仅好友可见</div>' + String(d.text).split('\n').map(x => '<p>' + BM.kw(esc(x)) + '</p>').join('') + (d.pic ? '<div class="qz-pic" data-zimg="img/' + esc(d.pic) + '.jpg"><img src="img/' + esc(d.pic) + '.jpg" alt=""></div>' : '') + '' + (d.comments ? '<div class="qz-cms"><span class="unm-lab">评论</span>' + d.comments.map(c => '<div class="qz-cm"><span class="unm">' + esc(c[0]) + '</span>：' + esc(c[1]) + '</div>').join('') + '</div>' : '') + '</div><div class="qz-pn">' + (prev !== undefined ? '<a href="#/qzw/blog/' + prev + '">‹ 上一篇</a>' : '<span></span>') + '<a href="#/qzw">返回列表</a>' + (next !== undefined ? '<a href="#/qzw/blog/' + next + '">下一篇 ›</a>' : '<span></span>') + '</div></div>', 'blog/' + i);
      return;
    }
    if (sub === 'album' && D.qzAlbumOff) { shellQz(nav + '<div class="qz-body"><p class="small" style="padding:30px;text-align:center">主人设置了访问权限</p></div>', 'album'); return; }
    if (sub === 'album') {
      const name = W.albums[arg] ? arg : Object.keys(W.albums)[0];
      BM.markRead('qzw_album');
      shell(nav + '<div class="qz-body"><h3>' + esc(name) + '</h3><div class="qz-photos">' + W.albums[name].map(p => '<img src="' + dImg(p) + '" alt="" data-zimg="' + dImg(p) + '" data-cap="' + esc(name) + '">').join('') + '</div></div>', 'photo');
      return;
    }
    // 日志一页：全文都在列表里（和宋晴的日志一样）
    shell(nav + '<div class="qz-body"><h3>日志（' + W.diaries.length + '）</h3>' + wOrder(W).map(i => { const d = W.diaries[i]; BM.markRead('qzw_' + d.d); return '<div class="qz-diary" style="margin-bottom:18px"><h3>' + (d.ht ? '<b class="kw">' + esc(d.t) + '</b>' : esc(d.t)) + '</h3><div class="small">' + (d.hl ? '<b class="kw">' + esc(d.d) + '</b>' : esc(d.d)) + '　仅好友可见</div>' + String(d.text).split('\n').map(x => '<p>' + BM.kw(esc(x)) + '</p>').join('') + (d.pic ? '<div class="qz-pic" data-zimg="img/' + esc(d.pic) + '.jpg"><img src="img/' + esc(d.pic) + '.jpg" alt=""></div>' : '') + '</div>'; }).join('') + '</div>', 'blog');
  }
  function qzone(sub, arg) {
    const Q = D.qzone, X = D.qzoneExtra;
    const shellQz = (body, t) => page({ site: 'qz', title: 'QQ 空间', url: 'https://user.qzone.qq.com/' + (sessionStorage.getItem(QZ_KEY) ? Q.qq + (t ? '/' + t : '') : ''), fav: 'z' }, '<div class="qz">' + body + '</div>');
    // 只能从电脑上的 QQ 客户端登录后进入（QQ 面板上的“QQ 空间”）
    if (!(BM.flag('qqSong') || sessionStorage.getItem(QZ_KEY))) {
      shellQz('<div class="qz-login"><h3>QQ 空间</h3><p>登录状态已失效。</p><p class="small">请在电脑上的 QQ 客户端登录后，从面板上的“QQ 空间”进入。</p></div>');
      return;
    }
    BM.markRead('qz_song'); BM.mpReadyCheck();  // 进过宋晴的 QQ 空间（12309 那篇能打开、检察院肯出车的条件之一）
    const nav = '<div class="qz-head"><div class="qz-av">晴</div><div><b>' + esc(Q.name) + '</b><div class="small">' + esc(Q.sign) + '</div></div></div>' + (D.singleEntry
      ? '<div class="qz-nav"><a href="#/qzone/home">主页</a><a href="#/qzone/diary">日志</a><span>说说</span><span>留言板</span><span>个人档</span></div>'  // 单入口版：说说放在主页上，留言板、个人档不开，单篇日志不另开页面
      : '<div class="qz-nav"><a href="#/qzone/home">主页</a><a href="#/qzone/diary">日志</a>' + (D.qzAlbumOff ? '' : '<a href="#/qzone/album">相册</a>') + '<a href="#/qzone/says">说说</a><a href="#/qzone/msg">留言板</a><a href="#/qzone/profile">个人档</a></div>');
    const list = Q.diaries.slice().sort((a, b) => String(b.d).localeCompare(String(a.d)));  // 按日期新的在前（新加的日志放在数组末尾，不挪用户改过的下标）
    if (D.singleEntry && ['blog', 'says', 'msg', 'profile', 'album'].includes(sub)) { location.replace(sub === 'blog' ? '#/qzone/diary' : '#/qzone/home'); return; }
    if (sub === 'diary') {
      BM.markRead('qq_diary'); list.forEach(d => BM.markRead('qq_blog_' + d.d)); BM.jcyCheck(); setTimeout(bindZoom, 0);  // 日志一页：全文都在这里；点开日志以后澜江检察才推送 12309
      shellQz(nav + '<div class="qz-body"><h3>日志（' + list.length + '）</h3>' + list.map((d, i) => '<div class="qz-diary" id="blog-' + i + '" style="margin-bottom:18px"><h3>' + esc(d.t) + '</h3><div class="small">' + (d.hl ? '<b class="kw">' + esc(d.d) + '</b>' : esc(d.d)) + '　仅自己可见</div>' + String(d.text).split('\n').map(x => '<p>' + BM.kw(esc(x)) + '</p>').join('') + (d.pic ? '<div class="qz-pic" data-zimg="img/' + esc(d.pic) + '.jpg"><img src="img/' + esc(d.pic) + '.jpg" alt=""></div>' : '') + '' + (d.comments ? '<div class="qz-cms"><span class="unm-lab">评论</span>' + d.comments.map(c => '<div class="qz-cm"><span class="unm">' + esc(c[0]) + '</span>：' + esc(c[1]) + '</div>').join('') + '</div>' : '') + '</div>').join('') + '</div>', 'blog');
      return;
    }
    if (sub === 'blog') {
      const i = Math.max(0, Math.min(list.length - 1, Number(arg) || 0));
      const d = list[i];
      BM.markRead('qq_diary'); BM.markRead('qq_blog_' + d.d);
      shellQz(nav + '<div class="qz-body"><div class="qz-diary"><h3>' + esc(d.t) + '</h3><div class="small">' + (d.hl ? '<b class="kw">' + esc(d.d) + '</b>' : esc(d.d)) + '　仅自己可见　阅读(1)</div>' + String(d.text).split('\n').map(x => '<p>' + BM.kw(esc(x)) + '</p>').join('') + (d.pic ? '<div class="qz-pic" data-zimg="img/' + esc(d.pic) + '.jpg"><img src="img/' + esc(d.pic) + '.jpg" alt=""></div>' : '') + '' + (d.comments ? '<div class="qz-cms"><span class="unm-lab">评论</span>' + d.comments.map(c => '<div class="qz-cm">' + (c[0] === 'X' || c[0] === 'W' ? '<a href="#/qzw"><span class="unm">X</span></a>' : '<span class="unm">' + esc(c[0]) + '</span>') + '：' + esc(c[1]) + '</div>').join('') + '</div>' : '') + '</div><div class="qz-pn">' + (i > 0 ? '<a href="#/qzone/blog/' + (i - 1) + '">‹ 上一篇</a>' : '<span></span>') + '<a href="#/qzone/diary">返回列表</a>' + (i < list.length - 1 ? '<a href="#/qzone/blog/' + (i + 1) + '">下一篇 ›</a>' : '<span></span>') + '</div></div>', 'blog/' + i);
      return;
    }
    if (sub === 'album' && D.qzAlbumOff) { shellQz(nav + '<div class="qz-body"><p class="small" style="padding:30px;text-align:center">主人设置了访问权限</p></div>', 'album'); return; }
    if (sub === 'album') {
      if (arg === '江堤' && !sessionStorage.getItem('beimian.qzalb')) {
        shellQz(nav + '<div class="qz-body"><h3>江堤</h3><form class="qz-login" id="qaf" style="margin:0"><p>🔒 该相册已设置访问权限</p><p>问题：我们是在哪儿认识的？</p><label>答案<input id="qaa" autocomplete="off"></label><p class="qz-err" id="qae"></p><button type="submit">确定</button></form><a href="#/qzone/album">‹ 返回相册</a></div>', 'photo');
        document.getElementById('qaf').addEventListener('submit', e => { e.preventDefault(); const v = BM.norm(document.getElementById('qaa').value); if (['网点', '信用社', '柳林信用社', '信用社网点', '柳林网点', '柳林信用社网点'].some(a => BM.norm(a) === v)) { sessionStorage.setItem('beimian.qzalb', '1'); BM.markRead('qq_alb'); qzone('album', '江堤'); } else document.getElementById('qae').textContent = '答案错误。'; });
        return;
      }
      if (arg && X.albums[arg]) {
        BM.markRead('qq_album');
        shellQz(nav + '<div class="qz-body"><h3>' + esc(arg) + '</h3><div class="qz-photos">' + X.albums[arg].map(p => '<img src="' + dImg(p) + '" alt="" data-zimg="' + dImg(p) + '" data-cap="' + esc(arg) + '">').join('') + '</div><p class="small">部分照片因空间容量不足已被清理。</p><a href="#/qzone/album">‹ 返回相册</a></div>', 'photo');
        bindZoom();
        return;
      }
      shellQz(nav + '<div class="qz-body"><div class="qz-albums">' + Object.keys(X.albums).map(a => '<a class="qz-alb" href="#/qzone/album/' + encodeURIComponent(a) + '"><div class="qz-cover">' + (a === '江堤' && !sessionStorage.getItem('beimian.qzalb') ? '<div class="qz-lock">🔒</div>' : '<img src="' + dImg(X.albums[a][0]) + '" alt="">') + '</div><b>' + esc(a) + '</b><span class="small">' + X.albums[a].length + ' 张</span></a>').join('') + '</div></div>', 'photo');
      return;
    }
    if (sub === 'says') { shellQz(nav + '<div class="qz-body"><h3>说说</h3>' + Q.says.map(s => '<div class="qz-say"><span class="small">' + esc(s[0]) + '</span>　' + esc(s[1]) + (s[2] ? '<div class="qz-pic" data-zimg="img/' + esc(s[2]) + '.jpg"><img src="img/' + esc(s[2]) + '.jpg" alt=""></div>' : '') + '</div>').join('') + '</div>', 'mood'); bindZoom(); return; }
    if ((sub === 'msg' || sub === 'profile') && D.atmoOff) { shellQz(nav + '<div class="qz-body"><p class="small" style="padding:40px 0;text-align:center">主人设置了访问权限，暂时无法查看。</p></div>'); return; }
    if (sub === 'msg') { BM.markRead('qq_msg'); shellQz(nav + '<div class="qz-body"><h3>留言板（' + X.guestbook.length + '）</h3>' + X.guestbook.slice().reverse().map(m => '<div class="qz-gb"><b>' + esc(m[1]) + '</b><span class="small">' + esc(m[0]) + '</span><p>' + esc(m[2]) + '</p></div>').join('') + '</div>', 'msgboard'); return; }
    if (sub === 'profile') { shellQz(nav + '<div class="qz-body"><h3>个人档</h3><table class="tbl">' + X.profile.map(r => '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</table></div>', 'profile'); return; }
    shellQz(nav + '<div class="qz-body"><h3>最近日志</h3>' + list.slice(0, 3).map((d, i) => '<a class="qz-li" href="' + (D.singleEntry ? '#/qzone/diary' : '#/qzone/blog/' + i) + '"><span>' + esc(d.t) + '</span><em>' + esc(d.d) + '</em></a>').join('') + '<h3>说说</h3>' + Q.says.map(s => '<div class="qz-say"><span class="small">' + esc(s[0]) + '</span>　' + esc(s[1]) + (s[2] ? '<div class="qz-pic" data-zimg="img/' + esc(s[2]) + '.jpg"><img src="img/' + esc(s[2]) + '.jpg" alt=""></div>' : '') + '</div>').join('') + '<h3>最近访客</h3><p class="small">刘佳（2006-07-12）　高中同学阿萍（2006-07-02）</p></div>', 'main'); bindZoom();
  }

  // ===== 华信云空间 =====
  function cloud(tab) {
    if (!sessionStorage.getItem('beimian.cloud')) {
      const reset = tab === 'reset';
      page({ site: 'cl', title: (reset ? '找回密码' : '登录') + ' - 华信云空间', url: 'https://id.huaxin.com/' + (reset ? 'reset' : 'login'), fav: 'y' }, '<div class="cl-top"><b>华信云空间</b></div><form class="ys-login cl-login" id="clf">' + (reset ? '<h3>找回密码</h3><p class="small">帐号 138****0907</p><p>安全问题：你最好的朋友叫什么名字？</p><label>答案<input id="cla" autocomplete="off"></label><p class="ys-err" id="cle"></p><button type="submit">下一步</button>' : '<h3>华信帐号登录</h3><p class="small">登录已过期，请重新登录。</p><label>帐号<input value="138****0907" disabled></label><label>密码<input type="password" id="clp" autocomplete="off"></label><p class="ys-err" id="cle"></p><button type="submit">登录</button><p><a href="#/cloud/reset">忘记密码？</a></p>') + '</form>');
      document.getElementById('clf').addEventListener('submit', e => {
        e.preventDefault();
        if (!reset) { document.getElementById('cle').textContent = '密码错误。'; return; }
        const v = BM.norm(document.getElementById('cla').value);
        if (['陶雨', '雨', '小雨', '陶陶'].map(BM.norm).includes(v)) { sessionStorage.setItem('beimian.cloud', '1'); BM.markRead('cloud_in'); location.hash = '#/cloud'; }
        else document.getElementById('cle').textContent = '答案不正确。';
      });
      return;
    }
    if (tab === 'reset') tab = 'find';
    tab = tab || 'find';
    if (tab === 'pics' && D.rcptLocal) tab = 'find';  // 车票改在下载文件夹（许禾 7-15 存的）
    if (tab === 'find') BM.markRead('cloud');
    const tabs = [['pan', '云盘'], ['pics', '图库'], ['memo', '备忘录'], ['find', '查找设备']].filter(x => !D.atmoOff || x[0] === 'find' || (x[0] === 'pics' && !D.rcptLocal));  // 气氛页关闭：云盘、备忘录不开
    const top = '<div class="cl-top"><b>华信云空间</b>' + tabs.map(t => '<a href="#/cloud/' + t[0] + '"' + (t[0] === tab ? ' class="on"' : '') + '>' + t[1] + '</a>').join('') + '<span class="cl-user">许禾 138****0907</span></div>';
    let body;
    if (tab === 'pan') body = '<div class="cl-pan"><table class="tbl"><tr><th>名称</th><th>修改时间</th><th>大小</th></tr>' + D.cloudFiles.map(f => '<tr><td>' + esc(f[0]) + '</td><td>' + esc(f[1]) + '</td><td>' + esc(f[2]) + '</td></tr>').join('') + '</table><p class="small">网页版仅支持查看列表，打开文件请使用华信云空间 App。</p></div>';
    else if (tab === 'pics') {
      // 许禾 7-15 08:10 在手机上存的“雨的生日.jpg”，同步到了云空间；点开用“照片”打开，可以调亮度
      body = '<div class="cl-pics"><a class="cl-rcpt" href="#" id="clRcpt"><img src="img/keepsake.jpg" alt=""><span>雨的生日.jpg<i>7月15日 08:10 · 来自 许禾的 nova 11</i></span></a>' + D.cloudPhotos.map(p => '<img src="img/d/' + p + '.jpg" alt="" data-zimg="img/d/' + p + '.jpg">').join('') + '</div>';
    }
    else if (tab === 'memo') body = '<div class="cl-memo">' + D.cloudMemos.map(m => '<div class="cl-note"><b>' + esc(m[0]) + '</b><pre>' + esc(m[1]) + '</pre></div>').join('') + '</div>';
    else {
      const list = D.cloudXu.filter(x => !x.req || BM.cond(x.req));
      const last = list[list.length - 1];
      body = '<div class="cl-wrap"><div class="cl-side"><div class="cl-dev on"><i>📱</i><div><b>许禾的 nova 11</b><div class="small">离线</div></div></div><div class="cl-dev"><i>⌚</i><div><b>华信手环 7</b><div class="small">离线 · 5 天前</div></div></div></div>'
        + '<div class="cl-map"><div class="cl-roads"></div><div class="cl-pin">📍</div><div class="cl-card"><b>许禾的 nova 11</b><div>设备离线</div><div>最后定位：' + esc(last.t) + '</div><div>' + BM.kw(esc(last.loc)) + '</div><div class="cl-btns"><button disabled>播放铃声</button><button disabled>锁定设备</button><button disabled>擦除数据</button></div><div class="small">设备离线，开机联网后才会更新位置。</div></div></div></div>';
    }
    page({ site: 'cl', title: tabs.find(t => t[0] === tab)[1] + ' - 华信云空间', url: 'https://cloud.huaxin.com/' + tab, fav: 'y' }, top + body);
    bindZoom();
    const rc = document.getElementById('clRcpt');
    if (rc) rc.addEventListener('click', e => { e.preventDefault(); BM.markRead('cloud_rcpt'); const win = window.open('photo.html#receipt', '_blank'); if (win) win.focus(); else location.href = 'photo.html#receipt'; });
  }

  // ===== 澜江检察（公众号文章） =====
  function mpWxOnly() {  // 单入口版：公众号文章只能在微信里看，浏览器打开只提示，附公众号名片
    const J = D.jcy || {};
    page({ site: 'mp', title: '微信公众平台', url: 'https://mp.weixin.qq.com/s/Lj8Xq2fZ0nB', fav: 'm' }, '<div class="mp mp-wxonly"><p class="mp-wxtip">请在微信客户端打开链接</p><div class="mp-card"><b>' + esc(J.name || '') + '</b><span>微信号：' + esc(J.wxid || '') + '</span><p>' + esc(J.intro || '') + '</p></div><p class="small">关注公众号后，可在微信中查看全文。</p></div>');
  }
  function mp() {
    if (D.singleEntry && D.jcy) { BM.markRead('mp_found'); return mpWxOnly(); }
    if (D.singleEntry) BM.markRead('mp_found');
    // 单入口版：进过宋晴的 QQ 空间、点开看过爸爸那张照片以前，打开显示“该内容暂时无法查看”
    if (D.singleEntry ? !BM.cond('callOk') : !BM.cond('mp')) { page({ site: 'mp', title: '微信公众平台', url: 'https://mp.weixin.qq.com/s/Lj8Xq2fZ0nB', fav: 'm' }, '<div class="mp"><p class="small" style="text-align:center;margin-top:80px">该内容暂时无法查看</p></div>'); return; }
    if (D.singleEntry) BM.markRead('n_mpReady');  // 已经能看了，之后不必再弹提示
    BM.markRead('mpnotice');
    const p = D.webPages.mpnotice;
    page({ site: 'mp', title: p.title, url: 'https://mp.weixin.qq.com/s/Lj8Xq2fZ0nB', fav: 'm' },
      '<div class="mp"><h1>' + esc(p.title) + '</h1><div class="mp-meta"><b>' + esc(p.site) + '</b>　' + esc(p.date) + '　澜江</div><div class="mp-body">' + p.html + '</div><button type="button" class="mp-call" id="dial">用手机拨打</button><div class="mp-foot">阅读 1.2万　　👍 386　　在看 97</div></div>');
    document.getElementById('dial').addEventListener('click', () => { const w = window.open('call.html#/dial', '_blank'); if (w) w.focus(); else location.href = 'call.html#/dial'; });
  }

  // ===== 微博 =====
  const wbHead = q => D.singleEntry
    ? '<div class="wb-top"><span class="wb-logo">微博</span><form id="wf"><input id="wq" value="" placeholder="登录后才能搜索" autocomplete="off" disabled><button type="button" disabled>🔍</button></form><span>热搜</span><span>消息</span></div>'
    : '<div class="wb-top"><a class="wb-logo" href="#/weibo/hot">微博</a><form id="wf"><input id="wq" value="' + esc(q || '') + '" placeholder="搜索微博" autocomplete="off"><button type="submit">🔍</button></form><a href="#/weibo/hot">热搜</a><span>消息</span></div>';
  let openCm = '';
  function wbPost(p) {
    const seed = hid(p.id) % 97;
    const cms = D.weiboComments[p.id] || [];
    return '<div class="wb-card"><div class="wb-who"><span class="wb-av">燕</span><div><a href="#/weibo/u/songmama"><span class="unm">' + esc(D.weiboUser.name) + '</span></a><div class="small">' + esc(p.when) + '</div></div></div><div class="wb-txt">' + BM.kw(esc(p.text)) + '</div>'
      + (p.pic === 'flowers' ? '<div class="wb-pic" data-zimg="img/flowers.jpg">' + D.flowersSVG + '</div>' : p.pic ? '<div class="wb-pic" data-zimg="img/' + p.pic + '.jpg"><img src="img/' + p.pic + '.jpg" alt=""></div>' : '')
      + (p.link ? '<a class="wb-link" href="' + p.link[2] + '"><b>' + esc(p.link[0]) + '</b><span>' + esc(p.link[1]) + '</span></a>' : '')
      + '<div class="wb-act"><span>↗ ' + (seed * 7 % 40 + 3) + '</span><a data-cm="' + p.id + '">💬 ' + cms.length + '</a><span>👍 ' + (seed * 29 % 300 + 41) + '</span></div>'
      + (cms.length ? '<div class="wb-cms">' + cms.map(c => '<p>' + (D.weiboUsers[c[0]] ? '<a href="#/weibo/u2/' + encodeURIComponent(c[0]) + '">' + esc(c[0]) + '</a>' : '<span class="unm">' + esc(c[0]) + '</span>') + '：' + BM.kw(esc(c[1])) + '</p>').join('') + '</div>' : '') + '</div>';
  }
  function bindWb() {
    const f = document.getElementById('wf');
    if (f) f.addEventListener('submit', e => { e.preventDefault(); const v = document.getElementById('wq').value.trim(); if (v) location.hash = '#/weibo/search/' + encodeURIComponent(v); });
    app.querySelectorAll('[data-cm]').forEach(el => el.addEventListener('click', () => { openCm = openCm === el.getAttribute('data-cm') ? '' : el.getAttribute('data-cm'); BM.markRead('wbc_' + openCm); wbProfile(); }));
    bindZoom();
  }
  function weibo(q) {
    if (q && D.wbSearchOff) { page({ site: 'wb', title: q + ' - 微博搜索', url: 'https://s.weibo.com/weibo?q=' + encodeURIComponent(q), fav: 'w' }, wbHead('') + '<div class="wb-main"><div class="wb-card"><p class="small">抱歉，未找到“' + esc(q) + '”相关结果。</p></div></div>'); bindWb(); return; }
    q = q || '';
    const U = D.weiboUser;
    let body;
    if (!q) body = '<div class="wb-empty">输入关键词，搜索微博内容和用户</div>';
    else if (['周小燕', '小燕', '周建明'].some(w => BM.norm(w) === BM.norm(q))) body = '<a class="wb-card wb-user" href="#/weibo/u/songmama"><span class="wb-av">燕</span><div><span class="unm unm-big">' + esc(U.name) + '</span><div class="small">' + esc(U.bio) + '</div><div class="small">粉丝 ' + U.fans + ' · 关注 ' + U.follow + '</div></div></a>';
    else if (D.weiboUsers[q]) body = '<a class="wb-card wb-user" href="#/weibo/u2/' + encodeURIComponent(q) + '"><span class="wb-av">' + esc(q[0]) + '</span><div><b>' + esc(q) + '</b><div class="small">' + esc(D.weiboUsers[q].bio) + '</div></div></a>';
    else body = '<div class="wb-empty">抱歉，未找到“' + esc(q) + '”相关结果。</div>';
    page({ site: 'wb', title: q ? q + ' - 微博搜索' : '微博搜索', url: q ? 'https://s.weibo.com/weibo?q=' + encodeURIComponent(q) : 'https://s.weibo.com/', fav: 'w' },
      wbHead(q) + '<div class="wb-main"><div class="wb-tabs"><b>综合</b><span>实时</span><span>用户</span><span>视频</span><span>图片</span></div>' + body + '</div>');
    bindWb();
    if (!q) document.getElementById('wq').focus();
  }
  function wbHot() {
    page({ site: 'wb', title: '微博热搜', url: 'https://s.weibo.com/top/summary', fav: 'w' }, wbHead('') + '<div class="wb-main"><div class="wb-card"><b>微博热搜</b>' + D.weiboHot.map((h, i) => '<a class="wb-hot" href="#/weibo/search/' + encodeURIComponent(h) + '"><i>' + (i + 1) + '</i>' + esc(h) + '</a>').join('') + '</div></div>');
    bindWb();
  }
  function wbUser(name) {
    const u = D.weiboUsers[name];
    if (!u) return weibo(name);
    BM.markRead('wbu_' + name); BM.dadCheck();
    page({ site: 'wb', title: name + '的微博_微博', url: 'https://weibo.com/n/' + encodeURIComponent(name), fav: 'w' }, wbHead('') + '<div class="wb-main"><div class="wb-profile"><span class="wb-av big">' + esc(name[0]) + '</span><div><span class="unm unm-big">' + esc(name) + '</span><div class="small">' + esc(u.bio) + '</div></div></div>' + u.posts.map(p => '<div class="wb-card"><div class="small">' + esc(p[0]) + '</div><div class="wb-txt">' + BM.kw(esc(p[1])) + '</div>' + (p[2] ? '<div class="wb-pic" data-zimg="img/' + p[2] + '.jpg"><img src="img/' + p[2] + '.jpg" alt=""></div>' : '') + '</div>').join('') + '</div>');
    bindWb();
  }
  function wbProfile(tab) {
    BM.markRead('wb_song');
    const U = D.weiboUser;
    const names = Object.keys(D.weiboUsers).filter(n => !['刘佳', '清溪老吴'].includes(n));  // 刘佳只从评论进，清溪老吴只从搜索进
    const lists = tab === 'follow' || tab === 'fans' ? '<div class="wb-card"><b>' + (tab === 'follow' ? '关注' : '粉丝') + '</b>' + names.map(n => '<a class="wb-hot" href="#/weibo/u2/' + encodeURIComponent(n) + '">' + esc(n) + '</a>').join('') + '<p class="small">仅显示部分用户</p></div>' : D.weiboPosts.map(wbPost).join('');
    page({ site: 'wb', title: U.name + '的微博_微博', url: 'https://weibo.com/u/5823019476', fav: 'w' },
      wbHead('') + '<div class="wb-main"><div class="wb-profile"><span class="wb-av big">燕</span><div><span class="unm unm-big">' + esc(U.name) + '</span><div class="small">' + esc(U.bio) + '</div><div class="small">' + (D.singleEntry ? '<span>粉丝 ' + U.fans + '</span> · <span>关注 ' + U.follow + '</span> · <span>微博 ' + D.weiboPosts.length + '</span>' : '<a href="#/weibo/u/songmama/fans">粉丝 ' + U.fans + '</a> · <a href="#/weibo/u/songmama/follow">关注 ' + U.follow + '</a> · <a href="#/weibo/u/songmama">微博 ' + D.weiboPosts.length + '</a>') + '</div></div></div>' + lists + '</div>');
    bindWb();
  }

  function unknown(u) {
    page({ site: 'err', title: '无法访问此页面', url: u, fav: 'q' }, '<div class="err"><h2>嗯……无法访问此页面</h2><p>' + esc(u) + ' 的服务器 IP 地址无法找到。</p><p class="small">ERR_NAME_NOT_RESOLVED</p></div>');
  }

  BM.route([
    [/^\/?$/, () => search('')],
    [/^\/search(?:\/(.*))?$/, q => search(q || '')],
    [/^\/feed$/, feed],
    [/^\/a\/(\w+)$/, article],
    [/^\/news\/(\w+)$/, news],
    [/^\/np\/(.+)$/, npSection],
    [/^\/past$/, past],
    [/^\/baike$/, baike],
    [/^\/bbs\/u\/(.+)$/, u => bbs('', u)],
    [/^\/bbs\/b\/(.+)$/, b => bbs('', null, b)],
    [/^\/bbs(?:\/(\w+))?$/, t => bbs(t || '')],
    [/^\/portal\/(a|doc)\/(\w+)$/, (s, id) => portal(s, id)],
    [/^\/portal\/dag\/(.+)$/, q => portal('dag', decodeURIComponent(q))],
    [/^\/portal\/sw(?:\/(.+))?$/, d => portal('sw', d ? decodeURIComponent(d) : '')],
    [/^\/portal(?:\/(\w+))?$/, s => portal(s || '')],
    [/^\/oajwt(?:\/(\w+))?$/, s => oaJwt(s)],
    [/^\/oa(?:\/.*)?$/, () => oaPortal()],
    [/^\/jwt(?:\/(\w+))?$/, s => jwt(s)],
    [/^\/pdf\/\w+$/, () => pdfView()],
    [/^\/history$/, () => historyPage()], [/^\/history\/other$/, () => historyPage('other')],
    [/^\/map(?:\/(.+))?$/, a => mapPage(a)],
    [/^\/qzw(?:\/(blog|album)\/(.+))?$/, (s, a) => qzoneW(s, a)],
    [/^\/qzone\/(blog|album)\/(.+)$/, (s, a) => qzone(s, a)],
    [/^\/qzone(?:\/(\w+))?$/, s => qzone(s)],
    [/^\/cloud(?:\/(\w+))?$/, t => cloud(t)],
    [/^\/mp\/notice$/, mp],
    [/^\/weibo\/hot$/, wbHot],
    [/^\/weibo\/u2\/(.+)$/, wbUser],
    [/^\/weibo\/u\/songmama(?:\/(\w+))?$/, t => wbProfile(t)],
    [/^\/weibo(?:\/search\/(.*))?$/, q => weibo(q || '')],
    [/^\/err\/(.*)$/, unknown]
  ], () => search(''));
})();
