// 《雨夜》许禾的电脑：开场、锁屏、桌面。点桌面图标，在各自的标签页打开对应的软件页面。
(function () {
  'use strict';
  const D = BM_DATA;
  const root = document.getElementById('app');
  const esc = BM.esc;
  const DING = Object.keys(D.dingChats);
  window.name = 'bm_desk';
  const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // 旧网址（窗口版）转到新页面
  (function redirectOld() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    let m, to = '';
    if ((m = h.match(/^\/wechat(?:\/(\w+))?$/))) to = 'wechat.html' + (m[1] ? '#/chat/' + m[1] : '');
    else if (h === '/moments') to = 'wechat.html#/moments';
    else if ((m = h.match(/^\/ding(?:\/(\w+))?$/))) to = 'ding.html' + (m[1] ? '#/chat/' + m[1] : '');
    else if (h === '/folder') to = 'folder.html';
    else if (h === '/notes') to = 'notes.html';
    else if (/^\/dial/.test(h)) to = 'call.html#/dial';
    else if (/^\/(call|interview)$/.test(h)) to = 'call.html#/call';
    else if (h === '/choice') to = 'call.html#/choice';
    else if (h === '/rescue') to = 'call.html#/rescue';
    if (to) location.replace(to);
  })();

  const TAB = { 'web.html': 'bm_edge', 'qc.html': 'bm_qc', 'viewer.html': 'bm_ps', 'wechat.html': 'bm_wechat', 'ding.html': 'bm_ding', 'folder.html': 'bm_folder', 'notes.html': 'bm_notes', 'photo.html': 'bm_photo', 'call.html': 'bm_call' };
  function openPage(url) {
    const w = window.open(url, '_blank');
    if (w) w.focus(); else location.href = url;
  }

  // ===== 未读 =====
  const visible = list => list.filter(m => !m.req || BM.cond(m.req));
  const isToday = st => /^\d{1,2}:\d{2}$/.test(st);
  function countNew(list) {
    let today = false, n = 0;
    list.forEach(m => { if (m.stamp) today = today || isToday(m.stamp); else if (today && !m.me) n++; });
    return n;
  }
  function momMsgs() {  // 和微信里（apps.js）一致：带 req 的消息条件满足才算，第 2 问前妈妈开头的话、爸爸那段也算
    const list = D.wxChats.mom.msgs.filter(m => !m.req || BM.cond(m.req));
    D.momQ.forEach(q => { if (D.singleEntry && D.dadTalk && q.id === 'mom3') return; if (q.open && BM.cond(q.req)) q.open.forEach(m => list.push(Object.assign({ who: '妈妈' }, m))); if (!BM.flag(q.id)) return; list.push({ me: true, text: q.ask }); if (q.check) { if (q.check.pre) q.check.pre.forEach(r => list.push(Object.assign({ who: '妈妈' }, r))); list.push({ who: '妈妈', text: q.check.prompt }); const okA = BM.ans('momOk_' + q.id); if (!okA) { const tr = BM.ans('momTry_' + q.id); if (tr) { list.push({ me: true, text: tr }); list.push({ who: '妈妈', text: q.check.wrong }); } return; } list.push({ me: true, text: okA }); if (q.check.ok) list.push({ who: '妈妈', text: q.check.ok }); } q.reply.forEach(r => list.push(Object.assign({ who: '妈妈' }, r))); });
    if (D.singleEntry && D.dadTalk && BM.cond('dadTalk')) D.dadTalk.forEach(m => list.push(Object.assign({ who: '妈妈' }, m)));
    return list;
  }
  const wxMsgs = id => (id === 'mom' ? momMsgs() : visible(D.wxChats[id].msgs));
  const dingMsgs = id => visible(D.dingChats[id].msgs);
  const wxUnread = id => Math.max(0, countNew(wxMsgs(id)) - BM.seen('w:' + id));
  const dingUnread = id => Math.max(0, countNew(dingMsgs(id)) - BM.seen('d:' + id));
  const wxTotal = () => (BM.flag('wx') ? Object.keys(D.wxChats).reduce((n, id) => n + wxUnread(id), 0) : 0);
  const dingTotal = () => DING.reduce((n, id) => n + dingUnread(id), 0);
  const plainText = t => String(t || '').replace(/\[\[|\]\]|\{\{|\}\}/g, '');
  const lastPreview = m => !m ? '' : m.news ? '[链接] ' + plainText(m.news[0].title) : m.link ? '[链接] ' + plainText(m.link.title) : m.pic ? '[图片]' : plainText(m.text);

  // ===== 开场 =====
  // 游戏主页：每个标签页第一次打开 index.html 都先显示这一页；有存档时可以继续或重新开始
  const INTRO_KEY = 'beimian.introShown';
  function intro() {
    const hasSave = BM.flag('intro') || BM.flag('laptop');
    root.innerHTML = '<div class="intro"><div class="in">'
      + '<p class="maker"><img src="img/author-avatar.jpg" alt="">小熊饼干 出品</p>'  // 2026-11-15：开场页照 next.html（页头、小红书关注卡片、页脚声明）
      + '<h1>重勘：柳林雨夜旧案</h1><p class="sub">一款以卷宗调查为核心的本格推理网页游戏</p>'
      + '<div class="intro-clip"><div class="clip-src">〔澜城晚报·2008〕</div><b class="clip-h">柳林江堤连环杀人案罪犯周建明昨日伏法</b><p>二〇〇四年到二〇〇六年，柳林江堤先后有四名女子在雨夜遇害。警方侦查两年，锁定出租车司机周建明，并于二〇〇六年八月将其抓捕归案。昨日，周建明被依法执行死刑。这起困扰柳林镇多年的系列命案，至此画上句号。</p></div>'
      + '<p class="intro-gap">十八年后。</p>'
      + '<p>你叫陶雨，二十岁，是一名会计专业大三学生。</p>'
      + '<p>你的室友许禾在文渊数字科技实习，参与了市公安局的旧卷宗数字化项目。昨晚，她说她要去档案室加班，然后就再没回来。电话关机，消息不回。</p>'
      + '<p>你不知道她这些天查了什么，也不知道她去了哪里。</p>'
      + '<p>你唯一能找到的，就是这台她留在宿舍的电脑。她说过，开机密码是你的生日：0714。</p>'
      + (hasSave ? '<button type="button" id="begin">继续</button><button type="button" id="restart" class="ghost">重新开始</button>' : '<button type="button" id="begin">打开电脑</button>')
      + '<p class="notes">没有声音 · 电脑上的每个软件都会在新的标签页打开 · 进度自动保存在本机浏览器</p>'
      + '<section class="follow"><img class="qr" src="img/author-xhs-qr.png" alt="小熊饼干的小红书二维码"><div class="who"><p class="by">关注小熊饼干 不迷路</p><p>扫码或搜索小红书号关注作者小熊饼干，上线新作第一时间开玩</p><p class="id">小红书号 <span id="xhsId">5290696522</span><button type="button" id="xhsCopy">复制</button></p></div></section>'
      + '<p class="links"><a href="https://miyeji.cn/games/he-deng-mi-shi" target="_blank" rel="noopener">上一部作品：《河灯秘事》 ↗</a></p>'
      + '<p class="fine">故事纯属虚构 · 创作者/开发者：小熊饼干，游戏中的地名、人物、机构和案件均为虚构，与现实无关，如有雷同，切勿当真。</p>'
      + '</div></div>';
    document.getElementById('begin').addEventListener('click', () => { sessionStorage.setItem(INTRO_KEY, '1'); BM.set('intro'); if (BM.flag('laptop')) desktop(); else lock(); });
    const rs = document.getElementById('restart');
    { const cp = document.getElementById('xhsCopy'); let tm = 0; if (cp) cp.addEventListener('click', async () => { const id = document.getElementById('xhsId').textContent.trim(); let ok = false; try { await navigator.clipboard.writeText(id); ok = true; } catch (e) { const t = document.createElement('textarea'); t.value = id; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(t); t.select(); try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } t.remove(); } cp.textContent = ok ? '已复制' : '长按号码复制'; clearTimeout(tm); tm = setTimeout(() => { cp.textContent = '复制'; }, 2400); }); }  // 小红书号一键复制（局域网 http 没有 clipboard API 时退回 execCommand）
    if (rs) rs.addEventListener('click', () => { if (confirm('清除全部进度，从头开始？')) { BM.reset(); sessionStorage.clear(); sessionStorage.setItem(INTRO_KEY, '1'); location.hash = ''; location.reload(); } });
  }

  // ===== 锁屏 =====
  let lockStage = 0, pwTries = 0;
  function lock() {
    // 锁屏用系统默认壁纸：不放合照，不贴便利贴（密码在开场里就告诉玩家了）
    const wall = '<div class="wall wall-sys"></div>';
    const note = '';
    if (lockStage === 0) {
      root.innerHTML = '<div class="lockscreen lk11">' + wall + note + '<div class="lk-time"><b>8:03</b><span>7月24日 星期五</span></div><div class="lk-tip">点击屏幕或按任意键解锁</div></div>';
      const go = () => { lockStage = 1; document.removeEventListener('keydown', go); lock(); };
      root.querySelector('.lockscreen').addEventListener('click', go);
      document.addEventListener('keydown', go);
      return;
    }
    const err = lockStage === 2;
    root.innerHTML = '<div class="lockscreen lk11 blur">' + wall + note
      + '<div class="lk-login"><div class="lk-av">禾</div><div class="lk-name">许禾</div>'
      + (err ? '<div class="lk-err">密码不正确。请再试一次。</div><div class="lk-hint">密码提示：生日</div><button type="button" class="lk-ok" id="lkok">确定</button>'
        : '<div class="lk-pw"><input id="pw" type="password" inputmode="numeric" maxlength="16" placeholder="密码" autocomplete="off"><button type="button" id="go">→</button></div>' + (pwTries ? '<div class="lk-hint">密码提示：雨</div>' : '') + '<div class="lk-opt">登录选项</div>')
      + '</div><div class="lk-corner">中　📶　🔋</div></div>';
    if (err) {
      const back = () => { document.removeEventListener('keydown', onKey); if (lockStage !== 2) return; lockStage = 1; lock(); };
      const onKey = e => { if (lockStage !== 2) { document.removeEventListener('keydown', onKey); return; } if (e.key === 'Enter' || e.key === 'Escape') back(); };
      document.getElementById('lkok').addEventListener('click', back);
      setTimeout(() => { if (lockStage === 2) document.addEventListener('keydown', onKey); }, 300);
      return;
    }
    const pw = document.getElementById('pw');
    const esc0 = e => { if (e.key === 'Escape' && lockStage === 1 && document.getElementById('pw')) { document.removeEventListener('keydown', esc0); lockStage = 0; lock(); } };
    const go = () => {
      if (BM.norm(pw.value) === '0714') { document.removeEventListener('keydown', esc0); BM.set('laptop'); desktop(); return; }
      pwTries++; lockStage = 2; document.removeEventListener('keydown', esc0); lock();
    };
    document.addEventListener('keydown', esc0);
    root.querySelector('.lockscreen').addEventListener('click', e => { if (!e.target.closest('.lk-login')) { document.removeEventListener('keydown', esc0); lockStage = 0; lock(); } });
    document.getElementById('go').addEventListener('click', go);
    pw.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    pw.focus();
  }

  // ===== 桌面 =====
  const SE = !!D.singleEntry;  // 单入口版：回收站是空的，只弹一句提示；“文档”换成“下载”快捷方式（散件压缩包下载后在这里）
  const ICONS = SE
    ? [['rb', '回收站', ''], ['fo', '下载', 'folder.html#/down'], ['pdf', '项目须知.pdf', 'web.html#/pdf/xz'], ['wx', '微信', 'wechat.html'], ['dt', '钉钉', 'ding.html'], ['qq', 'QQ', 'qq.html'], ['ed', 'Microsoft Edge', 'web.html#/search']]
    : [['rb', '回收站', 'folder.html#/recycle'], ['fo', '文档', 'folder.html#/gei'], ['pdf', '项目须知.pdf', 'web.html#/pdf/xz'], ['wx', '微信', 'wechat.html'], ['dt', '钉钉', 'ding.html'], ['qq', 'QQ', 'qq.html'], ['ed', 'Microsoft Edge', 'web.html#/search']];
  const PINS = [['fo', '文件资源管理器', SE ? 'folder.html#/down' : 'folder.html#/gei'], ['ed', 'Microsoft Edge', 'web.html#/search'], ['wx', '微信', 'wechat.html'], ['dt', '钉钉', 'ding.html']];
  const badge = ic => { const n = ic === 'wx' ? wxTotal() : ic === 'dt' ? dingTotal() : 0; return n ? '<span class="ibadge">' + n + '</span>' : ''; };
  function desktop() {
    root.innerHTML = '<div class="os"><div class="os-wall"></div><div class="os-icons" id="dicons"></div><div id="notify"></div><div class="os-taskbar" id="tb"></div>'
      + '<div class="gm"><button type="button" id="gmBtn" title="游戏菜单">≡</button><div class="gm-menu" id="gmMenu" hidden><b>重勘：柳林雨夜旧案</b><button type="button" id="gmRestart">重新开始</button><button type="button" id="gmClose">关闭菜单</button></div></div></div>';
    document.getElementById('gmBtn').addEventListener('click', () => { const m = document.getElementById('gmMenu'); m.hidden = !m.hidden; });
    document.getElementById('gmClose').addEventListener('click', () => { document.getElementById('gmMenu').hidden = true; });
    document.getElementById('gmRestart').addEventListener('click', () => { if (confirm('清除全部进度，从头开始？')) { BM.reset(); sessionStorage.clear(); location.hash = ''; location.reload(); } });
    renderIcons(); renderTaskbar(); notifyNew();
  }
  function renderIcons() {
    const box = document.getElementById('dicons');
    if (!box) return;
    box.innerHTML = ICONS.map(([ic, label, url]) => url ? '<a class="dicon2" href="' + url + '" data-open="' + url + '"><i class="appic ic-' + ic + '"></i><span>' + esc(label) + '</span>' + badge(ic) + '</a>' : '<a class="dicon2" href="#" data-empty="1"><i class="appic ic-' + ic + '"></i><span>' + esc(label) + '</span></a>').join('');
    box.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openPage(a.getAttribute('data-open')); }));
    box.querySelectorAll('[data-empty]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); BM.toast('回收站是空的。'); }));
  }
  function renderTaskbar() {
    const tb = document.getElementById('tb');
    if (!tb) return;
    tb.innerHTML = '<div class="tb-mid"><button type="button" class="tb-start" title="开始">⊞</button>'
      + PINS.map(([ic, label, url]) => '<a class="tb-app" href="' + url + '" data-open="' + url + '" title="' + esc(label) + '"><i class="appic ic-' + ic + '"></i>' + badge(ic) + '</a>').join('') + '</div>'
      + '<div class="tb-tray"><span class="vpn" title="文渊 VPN：已连接">🛡</span><span>中</span><span title="Wi-Fi：XAU-412">📶</span><span>🔊</span><span title="电量 63%">🔋</span><span class="tb-clock"><b>' + BM.clock().replace(/^0/, '') + '</b><i>2026/7/24</i></span></div>';
    tb.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openPage(a.getAttribute('data-open')); }));
    tb.querySelector('.tb-start').addEventListener('click', () => BM.toast('这是许禾的电脑。开始菜单里没有什么特别的。'));
    /* 任务栏“搜索”已去掉（和 Edge 重复，2026-11-14） */
  }

  // ===== 新消息通知（只在桌面弹） =====
  // 2026-11-14 修：提醒过的记录改存 localStorage，所有标签页共用（以前存 sessionStorage：从微信→拨号一路新开标签页回到桌面时带着很早的旧记录，
  // 钉钉的旧消息全算“新”，一次只弹两条，把澜江检察的推送挤掉了）。只在正看着的桌面标签页弹，切回来时补弹；钉钉排前、微信排后，只留最后两条时微信优先。
  const NKEY = 'beimian.notified.v2';  // v2：记每个会话一共有几条（不是未读几条）——条数变多且有未读才算新消息；在别处读掉了也不会把下一条吞掉
  function notifyNew() {
    if (!BM.flag('laptop')) return;
    if (document.visibilityState && document.visibilityState !== 'visible') return;  // 后台标签页不弹（别的标签页引起的变化由 BM.remote 拦在 onChange 里；不用 hasFocus：桌面刚加载那一刻焦点还没到，会把该弹的拦掉）
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem(NKEY)) || {}; } catch (e) { seen = {}; }
    const fresh = [];
    DING.forEach(k => { const n = dingUnread(k), all = countNew(dingMsgs(k)), key = 'd:' + k; if (all > (seen[key] || 0) && n > 0) fresh.push([SE ? 'ding.html' : 'ding.html#/chat/' + k, 'dt', '钉钉', D.dingChats[k].name, dingMsgs(k).filter(m => !m.stamp && !m.me).slice(-1)[0], k === 'work']); seen[key] = all; });
    if (BM.flag('wx')) Object.keys(D.wxChats).forEach(k => { const n = wxUnread(k), all = countNew(wxMsgs(k)), key = 'w:' + k; if (all > (seen[key] || 0) && n > 0) fresh.push([SE ? 'wechat.html' : 'wechat.html#/chat/' + k, 'wx', '微信', D.wxChats[k].name, wxMsgs(k).filter(m => !m.stamp && !m.me).slice(-1)[0], k === 'dorm']); seen[key] = all; });
    localStorage.setItem(NKEY, JSON.stringify(seen));
    const box = document.getElementById('notify');
    if (!box) return;
    fresh.slice(-2).forEach(([url, ic, app, name, last, group]) => {
      const el = document.createElement('div');
      el.className = 'toast11';
      el.innerHTML = '<div class="t-app"><i class="appic sm ic-' + ic + '"></i>' + app + '<span>现在</span></div><b>' + esc(name) + '</b><p>' + esc((last && last.who && group ? last.who + '：' : '') + lastPreview(last)) + '</p>';
      el.addEventListener('click', () => { openPage(url); el.remove(); });
      box.appendChild(el);
      setTimeout(() => el.remove(), 7000);
    });
  }

  function boot() {
    if (BM.dev) sessionStorage.setItem(INTRO_KEY, '1');
    if (!sessionStorage.getItem(INTRO_KEY)) return intro();
    if (!BM.flag('intro') && !BM.flag('laptop')) return intro();
    if (!BM.flag('laptop')) return lock();
    desktop();
  }
  BM.onChange(() => { if (BM.flag('laptop') && document.getElementById('dicons')) { renderIcons(); renderTaskbar(); if (!BM.remote) notifyNew(); } });  // 别的标签页引起的变化只更新角标，提示交给你打开的桌面
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && BM.flag('laptop') && document.getElementById('dicons')) notifyNew(); });  // 切回桌面标签页时补弹
  window.addEventListener('focus', () => { if (BM.flag('laptop') && document.getElementById('dicons')) notifyNew(); });
  setInterval(() => { if (document.getElementById('tb')) renderTaskbar(); }, 30000);
  boot();
})();
