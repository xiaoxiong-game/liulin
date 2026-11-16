(function () {
  'use strict';
  if (BM.needLaptop()) return;
  const D = BM_DATA;
  const app = document.getElementById('app');
  const esc = BM.esc;
  const BASE = 'https://qc.wenyuan-digital.com/wyqc/';
  const ROLE_KEY = 'beimian.qc.role';
  const USERS = {
    xu: { id: 'WY0907', name: '许禾', title: '扫描员', vols: [4] },
    gao: { id: 'WY0103', name: '高峰', title: '项目经理', vols: [3, 4, 5] }
  };
  const SCANNER = { 1: 'WY0712 周晓', 2: 'WY0712 周晓', 3: 'WY0533 王芳', 4: 'WY0907 许禾', 5: 'WY0533 王芳', 6: 'WY0533 王芳' };
  // 单入口版：从钉钉置顶公告进来先到登录页（Edge 只记得许禾的工号）；高峰的号只看限制查阅的第3、5卷，第4卷只在许禾的“我的任务”里
  const SE = !!D.singleEntry;
  if (SE) USERS.gao.vols = [3, 5];
  const loggedIn = () => !!sessionStorage.getItem(ROLE_KEY);
  const role = () => (sessionStorage.getItem(ROLE_KEY) === 'gao' && BM.flag('qcAdmin') ? 'gao' : 'xu');
  const me = () => USERS[role()];
  let dropdown = false;

  function shell(on, path, crumb, html) {
    const u = me();
    const msgs = role() === 'gao' ? 1 : 2;
    const menu = SE
      ? [['', '工作台', '#/', 'home'], ['卷宗', role() === 'gao' ? '限制查阅卷' : '我的任务', '#/vols', 'vols']]
      : [['', '工作台', '#/', 'home'], ['卷宗', role() === 'gao' ? '全部卷宗' : '我的任务', '#/vols', 'vols'], ['系统', '消息通知', '#/msg', 'msg']].concat(role() === 'gao' ? [['', '操作日志', '#/log', 'log']] : []);
    document.title = '文渊档案数字化加工管理系统';
    app.innerHTML = BM.chrome({ title: '文渊档案数字化加工管理系统', url: BASE + path, fav: 'g' })
      + '<div class="br-page site-qc"><div class="qc-top"><b>文渊</b><span class="qc-sys">档案数字化加工管理系统 V3.2</span><span class="qc-proj">项目：澜城市公安局刑事档案数字化（2026） ▾</span>'
      + '<span class="qc-user">' + (SE ? '<span class="qc-bell">🔔<i>' + msgs + '</i></span>' : '<a class="qc-bell" href="#/msg">🔔<i>' + msgs + '</i></a>') + '<span class="qc-whowrap"><a class="qc-who" id="who">' + esc(u.name) + '（' + u.id + '）· ' + u.title + ' ▾</a>' + (dropdown ? '<span class="qc-drop"><a href="#/login">切换账号</a><a id="logout">退出登录</a></span>' : '') + '</span>　<i class="vpn">VPN 已连接</i>'
      + '</span></div>'
      + '<div class="qc-wrap"><nav class="qc-menu">' + menu.map(m => (m[0] ? '<div class="qc-grp">' + m[0] + '</div>' : '') + '<a href="' + m[2] + '"' + (m[3] === on ? ' class="on"' : '') + '>' + m[1] + '</a>').join('') + '</nav>'
      + '<main class="qc-main"><div class="qc-crumb">' + esc(crumb) + '</div>' + html + '<div class="qc-foot">委托方：澜城市公安局　承建：文渊数字科技有限公司　客服 400-818-0103</div></main></div></div>';
    BM.bindChrome();
    document.getElementById('who').addEventListener('click', e => { e.preventDefault(); dropdown = !dropdown; run(); });
    const lo = document.getElementById('logout');
    if (lo) lo.addEventListener('click', () => { dropdown = false; if (SE) { sessionStorage.setItem('beimian.qc.switch', '1'); sessionStorage.removeItem(ROLE_KEY); } location.hash = '#/login'; });
    if (SE) { const sw = app.querySelector('.qc-drop a[href="#/login"]'); if (sw) sw.addEventListener('click', () => { sessionStorage.setItem('beimian.qc.switch', '1'); sessionStorage.removeItem(ROLE_KEY); }); }
  }

  // ===== 工作台 =====
  function home() {
    if (role() === 'gao') {
      shell('home', 'index', '工作台', '<div class="qc-cards"><div class="qc-card"><b>项目进度</b><p class="qc-big">6 卷 · 748 页</p><p>加工完成 100%　质检完成 100%</p></div><div class="qc-card warn"><b>验收</b><p class="qc-big">今天 17:30 封箱</p><p>第3、4卷待封箱</p></div><div class="qc-card"><b>项目成员</b><p class="qc-big">5 人</p><p>扫描 3　质检 1　项目经理 1</p></div></div>'
        + '<div class="qc-panel"><h3>待办</h3><table class="qc-tbl"><tr><th>时间</th><th>事项</th><th>状态</th></tr><tr><td>07-22 21:40</td><td>异地登录提醒：本账号在终端 XH-LAPTOP 登录</td><td><span class="qc-tag">待确认</span></td></tr><tr><td>07-22 10:20</td><td>验收方提出：第2卷 p61 扫描歪斜</td><td><span class="qc-tag ok">已返工</span></td></tr><tr><td>07-20 09:00</td><td>周报（第30周）</td><td><span class="qc-tag ok">已提交</span></td></tr></table></div>');
      return;
    }
    shell('home', 'index', '工作台', '<div class="qc-cards"><div class="qc-card"><b>我的加工任务</b><p class="qc-big">1 卷 · 146 页</p><p>第4卷　已完成</p></div><div class="qc-card warn"><b>待封箱</b><p class="qc-big">今天 17:30</p><p>封条写你的工号</p></div><div class="qc-card"><b>本周产量</b><p class="qc-big">1,032 页</p><p>组内第 2</p></div></div>'
      + '<div class="qc-panel"><h3>项目公告</h3><p>1. 项目已进入验收阶段，请勿再修改已提交的图像。</p><p>2. 原图下载须经项目经理审批。验收方可以调阅全部操作日志。</p><p>3. 本周五（07-24）17:30 第3、4卷封箱，请扫描员到场确认。</p></div>');
  }

  // ===== 卷宗 =====
  function vols() {
    const u = me();
    const shown = v => (SE ? (role() === 'gao' ? [3, 5, 6] : [4]).includes(v.no) : (u.vols.includes(v.no) || role() === 'gao'));
    const rows = D.vols.filter(shown).map(v => !u.vols.includes(v.no) ? '<tr><td>第' + v.no + '卷</td><td>' + esc(v.name) + '</td><td>' + v.pages + '</td><td>——</td><td><span class="qc-tag">' + (v.no === 6 ? '侦查工作卷不对加工方开放，由市局档案处数字化后放在内网门户' : '已于 2026-07-19 封箱入库，加工方不可调阅') + '</span></td></tr>' : (0, '<tr><td><a href="#/vol/' + v.no + '">第' + v.no + '卷</a></td><td>' + esc(v.name) + '</td><td>' + v.pages + '</td><td>' + esc(SCANNER[v.no]) + '</td><td><span class="qc-tag ok">已完成</span></td></tr>')).join('');
    const gaoTitle = SE ? '限制查阅卷' : '全部卷宗';
    shell('vols', role() === 'gao' ? 'volume/list' : 'task/mine', role() === 'gao' ? '卷宗 › ' + gaoTitle : '卷宗 › 我的任务',
      '<p class="small">澜公刑档〔2006〕108 号　周建明故意杀人、抢劫案</p>' + (SE && role() === 'gao' ? '<p class="small">第3、5卷及侦查工作卷为限制查阅卷，加工方只开放到项目经理一级账号。</p>' : '') + '<table class="qc-tbl"><tr><th>卷号</th><th>卷名</th><th>页数</th><th>扫描</th><th>状态</th></tr>' + rows + '</table>'
      + (role() === 'xu' ? '<p class="small">其他卷由项目组其他成员加工，如需查看请联系项目经理。</p>' : '')
      + (role() === 'gao' && !SE ? '<h3 style="margin:18px 0 6px;font-size:14px">库房扫描仪暂存（未归档）</h3><table class="qc-tbl"><tr><th>文件</th><th>设备</th><th>操作人</th><th>时间</th><th></th></tr><tr><td>散件扫描.zip（已加密）</td><td>库房 2 号扫描仪</td><td>WY0907 许禾</td><td>' + (SE ? '2026-07-19 07:30（扫描仪夜间同步）' : '2026-07-18 15:42') + '</td><td>' + (BM.flag('scanDl') ? '已下载' : '<a href="#" id="qcDl">下载</a>') + '</td></tr></table><p class="small">暂存文件不进卷宗，只有项目经理能看到，30 天后自动清理。</p>' : ''));
    const dl = document.getElementById('qcDl'); if (dl) dl.addEventListener('click', e => { e.preventDefault(); if (SE && !BM.ans('zipAt')) BM.setAns('zipAt', BM.clock()); BM.set('scanDl'); if (BM.toast) BM.toast('散件扫描.zip 已下载到“下载”文件夹'); vols(); });
  }
  function denied() {
    shell('vols', 'denied', '卷宗', '<div class="qc-lock"><div class="qc-lock-i">🔒</div><b>无权限</b><p>当前账号只能查看分配给自己的卷宗。如需查看，请联系项目经理。</p></div>');
  }
  // 一卷一页：卷内目录下面依次排出整卷文件；打开这一卷，整卷都算看过（单份文件的地址仍然能用，打开后滚到那一份）
  function docImg(d) {
    if (d.cam) return BM_SVG.svg('cam', 'color', false, false) + '<p class="small">' + esc(d.caption) + '</p>';
    if (d.photo) return '<div class="photo"><img src="img/watch7.jpg" alt="" style="width:100%;display:block"></div><p class="small">照片 7：死者左腕手表（06-114，表蒙破裂）　2006.7.15 物证室补拍</p>';
    return '<div class="paper">' + BM.marks(d.html) + '</div>';
  }
  function dlBtn() { return role() === 'gao' ? '<span class="dim" title="项目已进入验收阶段，原图下载已关闭">⬇ 下载原图</span>' : '<span class="dim" title="原图下载须经项目经理审批">⬇ 下载原图</span>'; }
  // 文书是否开放：合并层最后注入 D.activeCaseDocs（开放的文书编号）；没有这份清单时全部开放
  const docOn = id => !!D.docs[id] && (!Array.isArray(D.activeCaseDocs) || D.activeCaseDocs.includes(id));
  // 卷内目录：只列目录，开放的文书才能点开；每份文书单独一页
  function vol(no) {
    no = Number(no);
    if (!me().vols.includes(no)) return denied();
    const v = D.vols.find(x => x.no === no);
    const cat = (D.catalog[no] || []).filter(r => docOn(r[3]) && D.docs[r[3]].vol === no);  // 只列开放的文书（保留原页号）
    const rows = cat.map(r => '<tr><td>' + esc(r[0]) + '</td><td><a href="#/doc/' + r[3] + '">' + esc(r[1]) + '</a></td><td>' + esc(r[2]) + '</td></tr>').join('');
    shell('vols', 'volume/' + no, '卷宗 › 第' + no + '卷', '<h3 class="qc-h">第' + no + '卷　' + esc(v.name) + '</h3><table class="qc-tbl"><tr><th>页号</th><th>题名</th><th>日期</th></tr>' + rows + '</table><div class="qc-pager">共 ' + v.pages + ' 页　扫描：' + esc(SCANNER[no]) + '</div>');
  }
  function doc(id) {
    const d = D.docs[id];
    if (!d || !docOn(id)) return vols();
    if (!me().vols.includes(d.vol)) return denied();
    BM.markRead(id);
    // 读完第 4 卷 8-21 讯问笔录：妈妈正好发来微信寒暄（只弹一次）
    if (D.singleEntry && BM.momNotify) BM.momNotify();
    shell('vols', 'volume/' + d.vol + '/' + id, '卷宗 › 第' + d.vol + '卷 › ' + d.pg, '<p class="small"><a href="#/vol/' + d.vol + '">‹ 返回第' + d.vol + '卷卷内目录</a></p><div class="qc-doc" id="doc-' + id + '"><div class="qc-vbar"><b>' + esc(d.pg) + '　' + esc(d.title) + '</b>' + (d.photo ? dlBtn() : '') + '</div><div class="qc-view"><div class="qc-img">' + docImg(d) + '</div></div></div>');
    if (D.kwUp && D.kwUp[id]) document.querySelectorAll('#doc-' + id + ' .kw').forEach(b => { if (D.kwUp[id].includes(b.textContent.trim())) b.classList.add('up'); });  // 指定的词加粗再大一号（2026-11-14）
  }

  // ===== 消息、日志 =====
  function msg() {
    const html = role() === 'gao'
      ? '<div class="qc-msg new"><b>异地登录提醒</b><span>07-22 21:40</span><p>您的账号在终端 XH-LAPTOP 登录。如非本人操作，请及时修改密码。</p></div><div class="qc-msg"><b>验收通知</b><span>07-22 09:00</span><p>澜公刑档〔2006〕108 号六卷，07-24 17:30 封箱移交。</p></div>'
      : '<div class="qc-msg new"><b>封箱提醒</b><span>今天 08:00</span><p>第3、4卷今天 17:30 封箱，请扫描员到场确认封条。</p></div><div class="qc-msg new"><b>验收方访问提醒</b><span>昨天 16:05</span><p>项目验收方（市公安局档案处）调阅了您账号的操作日志。</p></div>';
    shell('msg', 'message', '系统 › 消息通知', '<div class="qc-msgs">' + html + '</div>');
  }
  function log() {
    if (role() !== 'gao') return denied();
    BM.markRead('qc_log');
    const rows = [
      ['今天 ' + BM.clock(), 'WY0103 高峰', '登录（终端 XH-LAPTOP）'],
      ['07-23 18:02', 'WY0907 许禾', '退出登录'],
      ['07-23 16:05', '项目分管领导 林建平', '查看：第3、4卷封箱清单'],
      ['07-23 09:40', 'WY0533 王芳', '质检：第5卷 p1—88 合格'],
      ['07-23 08:52', '项目分管领导 林建平', '查看：WY0103 的下载记录（第3卷 p207 原图，终端 XH-LAPTOP）'],
      ['07-22 22:31', 'WY0103 高峰', '下载原图：第3卷 p207 照片 7（终端 XH-LAPTOP）'],
      ['07-22 22:18', 'WY0103 高峰', '浏览：第3卷 p180、p201（终端 XH-LAPTOP）'],
      ['07-22 22:14', 'WY0103 高峰', '浏览：第5卷 p66（终端 XH-LAPTOP）'],
      ['07-22 21:46', 'WY0103 高峰', '浏览：第5卷 p20（终端 XH-LAPTOP）'],
      ['07-22 21:40', 'WY0103 高峰', '登录（终端 XH-LAPTOP）'],
      ['07-22 14:52', 'WY0103 高峰', '查看：第3、4、5卷扫描进度（终端 XH-LAPTOP）'],
      ['07-22 14:31', 'WY0103 高峰', '登录（终端 XH-LAPTOP）']
    ].map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('');
    shell('log', 'log?project=LCZY2026', '系统 › 操作日志', '<p class="small">项目全部成员的操作。日志对项目验收方（市公安局档案处）可见。</p><table class="qc-tbl"><tr><th>时间</th><th>账号</th><th>操作</th></tr>' + rows + '</table>');
  }

  // ===== 切换账号 =====
  function login(err, lastU) {
    dropdown = false;
    const gaoHint = err && BM.norm(lastU || '') === BM.norm('WY0103');
    const form = '<div class="qc-login"><h3>登录文渊加工管理系统</h3>'
      + '<form id="lf"><label>工号<input id="lu" autocomplete="off" placeholder="WY 开头的工号" value="' + esc(lastU || '') + '"></label><label>密码<input id="lp" type="password" autocomplete="off"></label>'
      + (err ? '<p class="qc-err">工号或密码错误。</p>' + (gaoHint ? '<p class="small qc-hint">密码提示：闺女生日</p>' : '') : '') + '<button type="submit">登录</button></form>'
      + '<div class="qc-saved"><p class="small">Microsoft Edge 记住的工号：</p><a data-acc="xu">WY0907　许禾</a></div></div>';
    if (SE) {
      // 单入口版：登录页不显示任何人的菜单（还没登录）。从钉钉公告第一次进来是“登录已过期”；自己点切换账号、退出登录就不提示
      const switched = sessionStorage.getItem('beimian.qc.switch') === '1';
      document.title = '登录 - 文渊档案数字化加工管理系统';
      app.innerHTML = BM.chrome({ title: '登录 - 文渊档案数字化加工管理系统', url: BASE + 'login', fav: 'g' })
        + '<div class="br-page site-qc"><div class="qc-top"><b>文渊</b><span class="qc-sys">档案数字化加工管理系统 V3.2</span><span class="qc-user"><i class="vpn">VPN 已连接</i></span></div>'
        + '<div class="qc-wrap"><main class="qc-main" style="margin:0 auto">' + (loggedIn() || switched ? '' : '<p class="small">登录已过期，请重新登录。</p>') + form + '<div class="qc-foot">委托方：澜城市公安局　承建：文渊数字科技有限公司　客服 400-818-0103</div></main></div></div>';
      BM.bindChrome();
    } else shell('home', 'login', '切换账号', form);
    const enter = r => { sessionStorage.setItem(ROLE_KEY, r); if (location.hash === '#/') run(); else location.hash = '#/'; };
    document.getElementById('lf').addEventListener('submit', e => {
      e.preventDefault();
      const uRaw = document.getElementById('lu').value, u = BM.norm(uRaw), p = document.getElementById('lp').value.replace(/\D/g, '');
      if (u === BM.norm('WY0103') && GAO_PASS.includes(p)) { BM.set('qcAdmin'); enter('gao'); return; }
      if (u === BM.norm('WY0907')) { enter('xu'); return; }
      login(true, uRaw.trim());
    });
    document.querySelector('[data-acc="xu"]').addEventListener('click', () => enter('xu'));
    (lastU ? document.getElementById('lp') : document.getElementById('lu')).focus();
  }
  // 高峰的密码：女儿糖糖的生日（钉钉名片“2019.11.6 起持证上岗”；登录页密码提示“闺女生日”）。照名片写法不补零也算对。
  const GAO_PASS = ['20191106', '2019116'];

  const guard = fn => (...a) => (SE && !loggedIn() ? login(false) : fn(...a));
  const run = BM.route([
    [/^\/?$/, guard(home)],
    [/^\/vols$/, guard(vols)],
    [/^\/vol\/(\d)$/, guard(vol)],
    [/^\/doc\/(\w+)$/, guard(doc)],
    [/^\/msg$/, guard(SE ? home : msg)],
    [/^\/log$/, guard(SE ? home : log)],
    [/^\/login$/, () => login(false)]
  ], guard(home));
})();
