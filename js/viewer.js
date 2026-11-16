(function () {
  'use strict';
  if (BM.needLaptop()) return;
  const app = document.getElementById('app');
  const FILES = { receipt: '雨的生日.jpg' };
  const cur = 'receipt';
  const st = { mode: 'color', bright: false, zoom: false };
  let menu = '';
  const CH = [['color', 'RGB', 'Ctrl+2'], ['r', '红', 'Ctrl+3'], ['g', '绿', 'Ctrl+4'], ['b', '蓝', 'Ctrl+5']];
  const MENUS = {
    file: ['文件', [['open', '打开 雨的生日.jpg'], ['-', ''], ['x', '存储（无写入权限）']]],
    image: ['图像', [['bright', '调整 › 亮度/对比度'], ['zoom', '视图 › 放大'], ['-', ''], ['reset', '恢复原样']]]
  };
  function render() {
    if (st.bright) BM.markRead('rc_clear');
    document.title = 'PixStudio - ' + FILES[cur];
    const mb = ['file', '编辑', 'image', '图层', '选择', '滤镜', '视图', '窗口', '帮助'].map(k => MENUS[k]
      ? '<span class="ps-m' + (menu === k ? ' on' : '') + '" data-menu="' + k + '">' + MENUS[k][0] + (menu === k ? '<div class="ps-drop">' + MENUS[k][1].map(it => it[0] === '-' ? '<hr>' : '<a data-act="' + it[0] + '"' + ((it[0] === 'bright' && st.bright) || (it[0] === 'zoom' && st.zoom) ? ' class="chk"' : '') + '>' + it[1] + '</a>').join('') + '</div>' : '') + '</span>'
      : '<span class="ps-m dim">' + k + '</span>').join('');
    const zoom = st.zoom ? '200%' : '100%';
    app.innerHTML = '<div class="ps"><div class="ps-menubar"><b class="ps-logo">Px</b>' + mb + '</div>'
      + '<div class="ps-opts">缩放：' + zoom + '　<span class="small">' + (st.bright ? '亮度 +80　对比度 +40' : '') + '</span></div>'
      + '<div class="ps-body"><div class="ps-tools">' + ['✥', '⬚', '⌖', '✂', '✎', '⌫', 'T', '✋', '🔍'].map(x => '<i' + (x === '🔍' ? ' data-act="zoom" title="放大"' : '') + '>' + x + '</i>').join('') + '</div>'
      + '<div class="ps-center"><div class="ps-tabs"><span class="ps-tab on">' + FILES[cur] + ' @ ' + zoom + ' (' + (st.mode === 'color' ? 'RGB' : { r: '红', g: '绿', b: '蓝' }[st.mode]) + '/8)</span></div>'
      + '<div class="ps-canvas' + (st.zoom ? ' zoom' : '') + '"><div class="pg m-' + st.mode + '">' + BM_SVG.keepsake(st.bright) + '</div></div></div>'
      + '<div class="ps-panels"><div class="ps-panel"><div class="ps-ph">通道</div>' + CH.map(c => '<div class="ps-ch' + (st.mode === c[0] ? ' on' : '') + '" data-ch="' + c[0] + '"><i>👁</i><span class="sw sw-' + c[0] + '"></span>' + c[1] + '<em>' + c[2] + '</em></div>').join('') + '</div>'
      + '<div class="ps-panel"><div class="ps-ph">属性</div><p>文档：' + FILES[cur] + '</p><p>尺寸：1080 × 748 像素，72 ppi</p><p>模式：RGB 颜色，8 位</p><p>来源：微信图片（2026-07-14）</p></div></div></div>'
      + '<div class="ps-status">' + zoom + '　　文档：2.3M/2.3M</div></div>';
    app.querySelectorAll('[data-ch]').forEach(el => el.addEventListener('click', () => { st.mode = el.getAttribute('data-ch'); render(); }));
    app.querySelectorAll('[data-menu]').forEach(el => el.addEventListener('click', e => { if (e.target.closest('[data-act]')) return; menu = menu === el.getAttribute('data-menu') ? '' : el.getAttribute('data-menu'); render(); }));
    app.querySelectorAll('[data-act]').forEach(el => el.addEventListener('click', () => {
      const a = el.getAttribute('data-act');
      menu = '';
      if (a === 'bright') st.bright = !st.bright;
      else if (a === 'zoom') st.zoom = !st.zoom;
      else if (a === 'reset') { st.mode = 'color'; st.bright = false; st.zoom = false; }
      else if (a === 'x') BM.toast('没有写入权限。');
      render();
    }));
  }
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey) return;
    const k = { '2': 'color', '3': 'r', '4': 'g', '5': 'b' }[e.key];
    if (k) { e.preventDefault(); st.mode = k; render(); }
  });
  document.addEventListener('click', e => { if (menu && !e.target.closest('[data-menu]')) { menu = ''; render(); } });
  render();
})();
