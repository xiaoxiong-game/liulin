// 陶雨的出生纪念盒：真实照片（img/keepsake.jpg 褪色版；img/keepsake_clear.jpg 是在 PixStudio 里调过亮度、对比度的样子）。
// 照片底图由 FLUX.1-schnell 生成；现在用 img/_gen/make_keepsake2.py 合成：抹掉平铺的长车票，桌上加住院收据、红包、接种证、胎发信封、满月照，车票对折后压在红包底下（第一版脚本 make_keepsake.py 保留）。
(function () {
  'use strict';
  function keepsake(clear) {
    void clear;  // 车票不用再调亮、反相：车号、时间、里程看得清，金额那一行被水渍洇了（img/keepsake_clear.jpg）
    return '<img src="img/keepsake_clear.jpg" alt="" style="width:100%;display:block">';
  }
  window.BM_SVG = { keepsake };
})();
