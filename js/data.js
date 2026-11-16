// 《雨夜》游戏内容（第一段：条件、时钟、微信、朋友圈、钉钉、文件夹）
(function () {
  'use strict';
  const F = (s, n) => !!s.flags[n];
  const R = (s, id) => !!s.read[id];
  const C = (n, s) => !!conds[n](s);
  // 单入口重构（2026-11-12）：合并层把 BM_DATA.singleEntry 设成 true 时用新门槛；设回 false 即恢复旧版
  const SE = () => !!(window.BM_DATA && window.BM_DATA.singleEntry);

  // ===== 推送和门槛 =====
  const conds = {
    momQ1: s => SE() ? R(s, 'bbs_t5') : R(s, 'V4_p12'),  // 第 4 卷：案发是 2006 年 7 月 14 日晚——正是我的生日。读完右下角弹出妈妈的微信寒暄（说起生日照片里的饼干盒），顺着问
    momQ2: s => !!((s.ans || {}).momOk_mom1) && R(s, 'V4_p59'),  // 车费答对、妈妈讲完那晚以后  // 卷宗里认出证人陶勇军就是爸爸（单入口版：妈妈还要反问“你爸跟他们说了什么”）
    momQ3: s => SE() ? false : (R(s, 'mo0714') && F(s, 'mom2')),  // 单入口版（用户 2026-11-12 卡在“雨，你是不是遇到什么事了？”）：答完第 2 问紧接着就能问，不再暗中要求先读第四起勘验笔录——妈妈反问“你凭什么说跟那个案子有关”，答案才在那份笔录里  // 饼干盒里那张夜里拍的照片；先问过爸爸那年的事（单入口版：要答出“十点多过去一个人”，并读过第四起勘验笔录）
    lin1: s => F(s, 'qcAdmin'),
    lin2: s => F(s, 'qcAdmin') && (SE() ? R(s, 'V5_p1') : R(s, 'V5_p20')),
    // 必须流程（2026-11-11）：关键证据页是硬条件，知道密码也省不掉
    mp: s => R(s, 'wb_song'),
    callOk: s => !SE() || R(s, 'qq_diary'),  // 单入口版（2026-11-14）：读过宋晴 QQ 空间里的日志，唐越才肯出车
    endSeen: s => R(s, 'end_seen'),
    jcyFollow: s => R(s, 'jcy_follow'),  // 关注了澜江检察公众号
    jcyPush: s => R(s, 'jcy_follow') && R(s, 'qq_diary') && R(s, 'scan_zip'),  // 推送 12309 那篇：关注了、点开过宋晴 QQ 空间的日志、解开过散件
    tangAdd: s => R(s, 'end_back_normal'),  // 2026-11-14：普通结局回到电脑，唐越在微信里（两人在车上互加了微信）
    jcyLaw: s => R(s, 'jcy_follow') && R(s, 'end_back_normal'),  // 普通结局页点了“回到许禾的电脑”：推普法文章
    dadTalk: s => SE() && !!((s.ans || {}).momOk_mom2) && R(s, 'scan_zip'),  // 只认真的输密码解开压缩包（scan_zip）；“打开过散件页面”不算——旧标签页刷新也会记上
    ivLin: s => R(s, 'oa_memo'),  // 2026-11-14：读过魏东的备忘（“我发现是建平”）就出现；前面的 X 空间、旧版警务通已是必经，不再另外卡  // 唐越肯出车（用户 2026-11-12）：进过宋晴的 QQ 空间、点开看过爸爸那张照片  // 搜“检察院”、看 12309 公告：周小燕微博下有人提了 12309
    notice: s => R(s, 'mpnotice'),  // 拨号：看过公告才知道号码
    evid: s => R(s, 'rc_clear') && R(s, 'V3_p201') && R(s, 'past_2006-07-16') && R(s, 'V5_p20') && R(s, 'wb_song') && R(s, 'jwt_hist'),  // 唐越肯出车：车票、表、7-16 晚报、补查、周小燕、魏东的历史消息
    sms: s => SE() ? R(s, 'oa_in') : R(s, 'oa_memo'),  // 单入口版（2026-11-14）：用魏东的号登进旧版警务通 → 迁移期间的登录通知分管领导（林建平）→ 许禾的号发来假消息  // 单入口版：用林建平的号登进新版警务通（只有许禾知道那个密码）→ 他收到登录提醒，许禾的号发来假消息；旧版：打开魏东的旧版备忘
    dark: s => R(s, 'oa_memo') && R(s, 'V6_p15') && R(s, 'jwt_lin') && R(s, 'bbs_t4'),
    // 搜索词是硬门槛：这个词在哪一页出现过，看过那一页才搜得到
    kw_song: s => R(s, 'V4_p31') || R(s, 'V4_p12'),  // 宋晴、柳林江堤：第 4 卷
    kw_zhou: s => (SE() || R(s, 'mo0714') || R(s, 'rc_clear')) && R(s, 'V4_p12'),  // 单入口版：8-21 笔录里车号是加粗的，读过就能搜  // 老王帖：车票上的车号就是第 4 卷周建明开的车（搜 0716）  // 周建明：第 4 卷讯问笔录
    kw_wei: s => R(s, 'V4_p31') || R(s, 'V4_p59') || R(s, 'V3_p201') || R(s, 'V5_p20'),  // 魏东：卷宗
    kw_wu: s => SE() ? R(s, 'V5_p1') : R(s, 'scan_zip') && (R(s, 'V5_p1') || R(s, 'V5_p20')),  // 单入口版：搜查证上“吴振华”加粗，读过搜查笔录就能搜；散件不再是门槛  // 吴振华：散件签名只剩“吴”＋第 5 卷侦查员名单  // 吴振华：散件、第 5 卷
    kw_old: s => R(s, 'wbu_清溪老吴') && (SE() || R(s, 'pt_p2')),  // 单入口版：“老所”只出自清溪老吴的微博  // 柳林老所：清溪老吴“在所里备勤”＋门户新闻“柳林派出所旧址”  // 柳林老所：清溪老吴的微博“那年雨夜我在柳林老所备勤”
    kw_addr: s => R(s, 'V6_p15') || R(s, 'pt_p2'),  // 柳林路 2 号：值班记录表头、门户新闻
    kw_xy: s => R(s, 'bbs_t2') && (SE() || R(s, 'V4_p12')),  // 周小燕：老王说他侄女在外地打工＋第 4 卷侄女周小燕  // 周小燕：老王那帖（单入口版：网名“柳林小燕”只在老王帖里）
    kw_t6: s => (SE() || R(s, 'bbs_t6')) && R(s, 'news1'),  // 退休稿：7-16 晚报里魏东那句话（单入口版加粗了，看过晚报就能搜；提拔帖是气氛页，不再是门槛）
    kw_old_was: s => R(s, 'pt_p2') || R(s, 'V6_p15'),  // 柳林老所、柳林路 2 号：门户新闻“老所旧址月底拆除”、值班记录表头  // 柳林老所、柳林路 2 号：门户新闻“老所旧址月底拆除”、查找设备的定位
    kw_find: s => F(s, 'xuVoice'),  // 查找手机：假消息那边不肯发语音
    kw_shop: s => SE() ? R(s, 'qzw_2005-09-10') : (R(s, 'jwt_lin') && R(s, 'ding_lin')),  // 单入口版：“我妈开照相馆”“回北街吃饭”只在 X 的日志里  // 照相馆：资料“在柳林北街开店”＋钉钉“我妈以前开照相馆”  // 林记照相馆：林建平资料的家庭成员
    kw_lxy: s => R(s, 'k01') || (!SE() && R(s, 'jwt_lin')),
    kw_y: s => R(s, 'V5_p40'),  // Y 染色体：第 5 卷物证清单 06-117 的备注（单入口版，搜到的是气氛页《DNA 鉴定这二十年》）  // 林秀云（单入口版：名字只出自老店报道“店主林秀云”）
    kw_hist: s => R(s, 'edge_history'),
    kw_rcpt: s => R(s, 'mo0714'),  // 热敏纸：车票照片底下的说明
    kw_crown: s => R(s, 'V3_p201'),  // 表冠：第 3 卷勘验笔录
    never: () => false,  // 关掉的入口（论坛首页等）  // 热敏纸、表冠：Edge 历史记录  // 第 5 问写林建平：备忘、值班记录、他的警务通、后门那件雨衣
    xuVoice: s => F(s, 'xuVoice')
  };
  // 电脑右下角的时间跟着进度走
  const clock = [
    [s => F(s, 'called'), '17:10'],
    [s => F(s, 'xuVoice'), '16:31'],
    [s => C('sms', s), '16:28'],
    [s => R(s, 'jwt_in') || R(s, 'jwt_lin'), '16:20'],  // 魏东的新版账号已停用，登林建平的号时钟也走到 16:20
    [s => R(s, 'qq_in'), '15:30'],
    [s => R(s, 'wb_song'), '14:10'],
    [s => C('lin2', s), '13:05'],
    [s => C('lin1', s), '11:25'],
    [s => SE() && C('momQ2', s), '10:40'],
    [s => R(s, 'rc_clear'), '10:30'],
    [s => F(s, 'mom1'), '10:05'],
    [s => R(s, 'mo0714'), '09:40'],
    [s => SE() && C('momQ1', s), '09:20'],
    [s => R(s, 'V4_p12'), '09:05'],
    [s => R(s, 'V4_p31'), '08:30'],
    [s => F(s, 'wx'), '08:10']
  ];

  const avatars = {
    '陶雨': ['雨', '#5b8def'], '许禾': ['禾', '#e0a458'], '妈妈': ['妈', '#d17a6b'], '周老师': ['周', '#4f7cc4'],
    '高峰': ['高', '#4c6a8a', 'img/av_gao.jpg'], '林建平': ['林', '#4a4f58', 'img/av_lin.jpg'], '王姐': ['王', '#9c8b6a'], '小陈': ['陈', '#7aa36b'], '项目组': ['组', '#1677ff']
  };

  // ===== 陶雨的微信 =====
  const wxChats = {
    tutor: {
      name: '周老师（辅导员）', av: '周老师', msgs: [
        { stamp: '11月11日 09:02' },
        { who: '周老师', text: '同学们，本周五前把实习协议的扫描件交到学院邮箱，命名：学号+姓名。' },
        { stamp: '08:00' },
        { who: '周老师', text: '陶雨，许禾昨晚是不是没回宿舍？' },
        { who: '周老师', text: '昨晚九点多柳林派出所来电话，说是许禾涉嫌违规拷贝涉密档案，被带走协助调查了。那边让学校先别声张。' },
        { who: '周老师', text: '他们下午五点半来宿舍取她的电脑，她的东西你先别动。' },
        { me: true, text: '啊？？她昨天下午还好好的' },
        { who: '周老师', text: '我这边也不清楚，有消息再告诉你。这事别往外说。' },
        { stamp: '16:50', req: 'sms' },
        { who: '周老师', req: 'sms', text: '陶雨，我刚给柳林派出所打电话核实，他们说昨晚根本没带走过许禾，也没给学校打过电话。' },
        { who: '周老师', req: 'sms', text: '我已经报警了。你在哪？有情况马上告诉我。' }
      ]
    },
    xu: {
      name: '许禾', av: '许禾', msgs: [
        { stamp: '11月10日 22:31' },
        { who: '许禾', text: '雨，明早帮我带个早饭，豆浆不要糖' },
        { me: true, text: '行，再给你带个烧麦' },
        { stamp: '11月14日 18:02' },
        { who: '许禾', text: '今天在档案室帮林老师理了一下午老照片' },
        { who: '许禾', text: '他拿一支毛笔刷灰，手比我稳多了' }, { who: '许禾', text: '他右手背上有一道疤，挺长的。我问他，他说年轻时候洗照片，被相纸划的' }, { me: true, text: '相纸还能划成那样？' }, { who: '许禾', text: '我也这么说，他就笑了一下' }, { who: '许禾', text: '对了，库房最底下翻出一个牛皮纸袋，上面贴着条子。我偷偷扫了几页，回头跟你说' }, { me: true, text: '你胆子挺大' },
        { me: true, text: '你一个扫描的怎么还理上照片了' },
        { who: '许禾', text: '他说以后让我去他那儿打下手哈哈' },
        { stamp: '星期二 23:48' },
        { who: '许禾', text: '扫卷宗扫得脑子有点乱。' },
        { who: '许禾', text: '周末跟你说个事。' },
        { who: '许禾', text: '对了，你周末回家，能把阿姨饼干盒里那张晚上拍的照片带回来吗？我想看看原片' },
        { me: true, text: '？？什么事这么神秘' },
        { who: '许禾', text: '先睡了，明天还要早起' },
        { stamp: '昨天 13:20' },
        { who: '许禾', text: '雨，你生日那条朋友圈的图，我存了一张哈' },
        { me: true, text: '存我丑照干嘛' },
        { who: '许禾', text: '不是你，是那个盒子' },
        { me: true, text: '？' },
        { who: '许禾', text: '回头说' },
        { stamp: '昨天 17:06' },
        { who: '许禾', text: '晚上我去档案室一趟，加会儿班。回来给你带烤红薯' },
        { me: true, text: '要大的！' },
        { stamp: '16:55', req: 'sms' },
        { who: '许禾', req: 'sms', text: '雨宝，我出来了！五点半到市局后门，把我电脑带上，别告诉别人。' },
        { me: true, req: 'xuVoice', text: '你在哪？发个语音给我' },
        { who: '许禾', req: 'xuVoice', text: '不方便说话，快点来，五点半，别告诉别人。' }
      ]
    },
    mom: {
      name: '妈妈', av: '妈妈', msgs: [
        { stamp: '11月16日 20:31' },
        { who: '妈妈', text: '下周降温，被子拿出去晒晒' },
        { me: true, text: '知道啦' },
        { stamp: '星期三 21:05' },
        { who: '妈妈', text: '考试准备得怎么样了' },
        { me: true, text: '还行，在刷题' },
        { who: '妈妈', text: '别熬夜。店里来了个改婚纱的，忙到现在' },
        { stamp: '07:45' },
        { who: '妈妈', text: '降温了，穿秋裤。' }
      ]
    }
  };
  const xuReplies = [
    { id: 'xuVoice', text: '你在哪？发个语音给我', once: true },
    { id: 'go', text: '好，我这就带电脑过去', bad: true }
  ];
  const momQ = [
    { id: 'mom1', req: 'momQ1', ask: '对了妈，我出生那天晚上的事，你再跟我说说？', reply: [
      { text: '怎么突然问这个。' },
      { text: '那天下大雨，晚上九点多肚子疼，打了个车就去了县医院，到了没一个钟头你就出来了。' },
      { text: '司机是个话不多的师傅，一路开得飞快，到了还帮我把包拎上台阶。车钱八十多，你爸心疼了好几天。' }
    ] },
    { id: 'mom2', req: 'momQ2', ask: '那年秋天，有没有警察来家里问过那天晚上的事？', reply: [
      { text: '来家里没有。泵站那边倒是来过。' },
      { text: '你爸那晚在泵站值班，第二天一早交了班就去医院陪我。过了几天，有个领导去泵站补问他，问十一点前后看见什么没有。' },
      { text: '你爸说十点多倒是过去一个人，没打伞，手里拎个白的，往南走了。那领导说尸检出来了，是十一点，十点多的不相干。' },
      { text: '出事的是信用社的小宋，常来铺子改制服，嘴甜，叫我桂芝姐。那几天我心里一直不是滋味。' },
      { text: '雨，你是不是遇到什么事了？' }
    ] },
    { id: 'mom3', req: 'momQ3', ask: '妈，饼干盒里那张晚上拍的照片，是谁拍的？', reply: [
      { text: '那是你爸拍的。' },
      { text: '那天晚上发大水，他在柳林泵站防汛值班，走不开，我是自己打车去的医院。' },
      { text: '泵站门口有盏大灯照着水位尺，他们值班一个钟头要隔着窗户拍一回。那张是十点多拍的，那会儿我刚到医院。他说留着，等你长大了给你看。' },
      { text: '他说拍那张的时候，门口正好过去一个人。' },
      { text: '我给你拍一张发过去，有点反光，你凑合看。' },
      { pic: 'dadphoto' }
    ] }
  ];

  // ===== 朋友圈 =====
  const tombHTML = '<img src="img/tomb.jpg" alt="" style="width:100%;display:block;max-width:440px;margin:0 auto">';
  const selfMoments = [
    { who: '陶雨', text: '期末周……图书馆三楼又没座了😭', when: '11月12日', likes: '许禾、阿琳', comments: [['许禾', '明天我六点去给你占']] },
    { who: '陶雨', text: '二十岁。妈妈说这些她留了二十年。', pic: 'keepsake', when: '7月14日', likes: '许禾、妈妈、阿琳 等 31 人', comments: [['许禾', '生日快乐雨！这个饼干盒我奶奶家也有一个'], ['妈妈', '手环是护士给你系的，那时候你才这么一点点'], ['阿琳', '好有年代感！']] },
    { who: '陶雨', text: '清明。爸，又一年了，我挺好的。', html: tombHTML, when: '4月5日', likes: '妈妈、许禾', comments: [['妈妈', '你爸在泵站守了一辈子水，今年汛期又快到了。']] }
  ];

  // ===== 照片（纪念盒的图在 pagesvg.js 里，页面打开时再取） =====
  const hand = 'font-family:KaiTi,STKaiti,楷体,serif;';
  const photos = {
    keepsake: { title: '图片', get html() { return window.BM_SVG ? BM_SVG.keepsake(false) : ''; } },
    dadphoto: { title: '照片', html: '<img src="img/dadphoto.jpg" alt="" style="width:100%;display:block">' },
    p207full: { title: '第3卷_p207_原图.jpg', html: '<img src="img/watch7_full.jpg" alt="" style="width:100%;display:block">' },
    sig1009: { title: '转正审批表.jpg', html: '<div class="scanset"><p>转正审批表.jpg</p><img src="img/sig_1009.jpg" alt=""></div>' },
    scanset: { title: '散件扫描（1 页）', html: '<div class="scanset"><p>散件_001.jpg</p><img src="img/scan_p1.jpg" alt=""></div>' },
    p207crop: { title: 'p207_局部.png', html: '<img src="img/p207_crop.jpg" alt="" style="width:100%;display:block">' }
  };

  // ===== 许禾的钉钉 =====
  const dingChats = {
    work: {
      name: '澜城中院档案数字化项目组（12）', av: '项目组', notice: '第3、4卷今天 17:30 封箱，请相关同事准时到场。', msgs: [
        { stamp: '11月10日 17:42' }, { who: '王姐', text: '高经理下午又请假了？' }, { who: '小陈', text: '说是陪他舅舅去医院复查' }, { who: '王姐', text: '他舅舅上个月过寿不还挺精神的嘛' },
        { stamp: '08:30' },
        { who: '高峰', text: '许禾今天请假，第3、4卷王姐先盯着，五点半照常封箱。' },
        { who: '王姐', text: '收到' },
        { who: '小陈', text: '今天食堂有红烧肉，去晚了就没了' }
      ]
    },
    gao: {
      name: '高峰', sub: '文渊数字 · 项目经理', av: '高峰', msgs: [
        { stamp: '11月18日 13:50' },
        { who: '高峰', text: '下午我去档案室看看第3、4、5卷的进度。本子没带，借你电脑登一下我的号。' },
        { me: true, text: '好的高经理，电脑在扫描台旁边，开着的' },
        { stamp: '昨天 09:02' },
        { who: '高峰', text: '第3、4卷周五封箱前我再过一遍，有问题直接找我。' },
        { me: true, text: '好的高经理' },
        { stamp: '昨天 17:50' },
        { who: '高峰', text: '登录提醒都发我这儿来了，说我的号前天晚上又在你电脑上登过。你帮我把浏览器里存的号删了。' },
        { who: '高峰', text: '还下了一张原图？下原图要走审批的，下回跟我说一声' }
      ]
    },
    lin: {
      name: '林建平', sub: '澜城市中级人民法院 · 档案室', ext: true, av: '林建平', msgs: [
        { stamp: '10月09日 16:20' },
        { who: '林建平', text: '第4卷的卷内目录收到了，抽检改到明天上午，你在加工室等我。' },
        { me: true, text: '好的林老师' },
        { stamp: '11月12日 17:05' },
        { who: '林建平', text: '前两百页的验收单我在 ys 上点过了，你们那边刷新一下就能看到。' },
        { me: true, text: '收到，谢谢林老师' },
        { stamp: '11月14日 10:02' },
        { who: '林建平', text: '下午有空来档案室一趟，老库房里有一批照片要除尘。你手稳，帮我打个下手。' },
        { me: true, text: '好呀！林老师您以前学过冲洗照片？' },
        { who: '林建平', text: '我是在暗房里长大的。我妈以前开照相馆。' },
        { stamp: '11月17日 18:40' },
        { who: '林建平', text: '小许，明早帮我把 108 号案的验收点一下，我在库房走不开。系统还是那个账号。' },
        { me: true, text: '收到，明早九点前点完' },
        { stamp: '昨天 13:58' },
        { me: true, text: '林老师，下午想去档案室请教您一件事，您在吗？' },
        { who: '林建平', text: '在库房，来吧。' },
        { stamp: '07:58' },
        { who: '林建平', text: '小许，今天第3、4卷封箱，封条要你签字，五点半前过来。' },
        { stamp: '11:25', req: 'lin1' },
        { who: '林建平', req: 'lin1', text: '听王姐说你今天请假了。封条我先找王姐签，你歇着吧。' }
      ]
    }
  };

  // 钉钉的历史消息：不在聊天窗口里直接显示，要在搜索框里搜到
  const dingHistory = [
    { chat: 'work', when: '2026-06-29 09:10', who: '高峰', text: '澜城中院刑事档案数字化项目下周一进场，扫描组三个人，质检一个人。工牌找王姐领。' },
    { chat: 'work', when: '2026-07-01 08:52', who: '王姐', text: '档案楼三楼东头那间是我们的加工室，空调遥控器在门口抽屉里。' },
    { chat: 'work', when: '2026-07-06 17:40', who: '小陈', text: '今天扫了 412 页，手腕要断了' },
    { chat: 'work', when: '2026-07-14 08:31', who: '高峰', text: '今天上午请半天假，陪我舅舅去趟柳林，有事打我电话。' },
    { chat: 'work', when: '2026-07-14 08:33', who: '王姐', text: '收到，高经理路上慢点' },
    { chat: 'work', when: '2026-08-03 10:05', who: '高峰', text: '法院档案室林老师是验收方，有问题先问他，别直接找院里。' },
    { chat: 'work', when: '2026-09-30 16:20', who: '王姐', text: '国庆加工室锁门，钥匙交林老师。' },
    { chat: 'work', when: '2026-10-18 21:12', who: '高峰', text: '今天给我舅舅过七十大寿，明天请大家喝奶茶！', pic: 'banquet' },
    { chat: 'work', when: '2026-09-02 12:10', who: '王姐', text: '听说咱们这个项目，是高经理舅舅牵的线？' },
    { chat: 'work', when: '2026-09-02 12:12', who: '高峰', text: '别瞎说，正规招标。' },
    { chat: 'work', when: '2026-10-18 21:15', who: '王姐', text: '高经理舅舅好精神！是不是以前市局的魏局？' },
    { chat: 'work', when: '2026-10-18 21:16', who: '高峰', text: '对，我舅舅魏东，退休好些年了。' },
    { chat: 'work', when: '2026-10-18 21:18', who: '王姐', text: '主桌那几位都是老同事吧？' },
    { chat: 'work', when: '2026-10-18 21:19', who: '高峰', text: '嗯，我舅舅把以前所里的老人请了一桌。名单是他自己列的。' },
    { chat: 'work', when: '2026-10-18 21:20', who: '小陈', text: '奶茶要少糖！' },
    { chat: 'work', when: '2026-11-02 09:30', who: '高峰', text: '省检来调卷函了，108 号案数字化完成后要交电子件，大家抓紧。' },
    { chat: 'work', when: '2026-11-10 18:05', who: '王姐', text: '第 5 卷返工 37 页，明天上午补扫。' },
    { chat: 'gao', when: '2026-09-12 14:02', who: '高峰', text: '小许，周记写完发我看一眼，学校那边要盖章。' },
    { chat: 'gao', when: '2026-10-09 10:11', who: '高峰', text: '下午林老师来抽检，你把第4卷的目录打一份。' }
  ];
  // 聊天记录搜索的话题：搜到其中任一个词，直接打开一页“相关聊天记录”（下标对应 dingHistory，按时间排）
  const dingTopics = [{ words: ['舅舅', '高经理舅舅'], ids: [3, 4, 8, 9, 7, 10, 11, 12, 13, 14] }];
  const banquetSVG = '<img src="img/banquet.jpg" alt="" style="width:100%;display:block">';
  const dingCards = {
    lin: { name: '林建平', org: '澜城市公安局', dept: '局领导', title: '副局长（分管档案数字化项目）', phone: '（对方已隐藏）', mail: 'linjp@lcga.gov.cn', ext: true },
    gao: { name: '高峰', org: '文渊数字科技有限公司', dept: '项目交付部', title: '项目经理', phone: '138****6612', mail: 'gaofeng@wenyuan-digital.com', intro: '糖糖她爸 · 2019.11.6 起持证上岗' }
  };

  // ===== 华信云空间：只显示最后一次定位 =====
  const cloudXu = [
    { t: '昨天 18:47', loc: '澜城市中级人民法院档案楼附近' },
    { t: '今天 03:12', loc: '柳林镇柳林路附近' },
    { t: '今天 16:55', loc: '柳林镇{{柳林路 2 号}}附近', req: 'sms' }
  ];

  // ===== 文件夹“文档” =====
  const folder = [
    { id: 'zhouji', name: '实习周记-第11周.txt', date: '2026/11/14 22:10', type: '文本文档', size: '2 KB', app: 'notepad' }
  ];
  const letterHTML = '<img src="img/letter.jpg" alt="" style="width:100%;display:block;max-width:620px;margin:0 auto;box-shadow:0 6px 18px rgba(0,0,0,.35)">';
  const notesTXT = '实习周记　第 11 周（11.10—11.14）\n\n本周完成第 4 卷扫描和自检，返工 3 页（黑白件重扫）。\n周五下午在档案室老库房帮林老师给老照片除尘：羊毛刷，从中间往外刷，不能来回蹭。\n\n下周：第 3、4 卷交接前复核，配合封箱。';
  const scanFiles = [
    { id: 'zip', name: '散件扫描.zip', date: '2026/11/14 17:52', type: '压缩(zipped)文件夹', size: '1,206 KB' }
  ];
  const downloads = [
    { id: 'p207full', name: '第3卷_p207_原图.jpg', date: '2026/11/18 22:31', type: 'JPG 图片文件', size: '3,412 KB', url: 'photo.html#p207full' },
    { id: 'setup', name: 'DingTalk_v7.6.15.exe', date: '2026/07/01 09:12', type: '应用程序', size: '286,532 KB' }
  ];

  window.BM_DATA = Object.assign(window.BM_DATA || {}, {
    conds, clock, avatars, wxChats, xuReplies, momQ, selfMoments, photos, dingChats, dingHistory, dingTopics, banquetSVG, dingCards, cloudXu, folder, letterHTML, notesTXT, downloads, scanFiles
  });
})();
