/* ============ 陪读小喵 · quiz: 刷题赚小鱼干 ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const core = PDM.core, ui = PDM.ui;
  const $ = id => document.getElementById(id);

const DOMAINS = [
  {
    id:'ai', name:'AI 科技', icon:'✦', color:'linear-gradient(135deg,#5b5bf6 0%,#7c4dff 55%,#8b5cf6 100%)',
    lessons:[
      {
        id:'ai_embodied', title:'具身智能：给 AI 一副身体', tag:'具身智能',
        cards:[
          {h:'从屏幕里走出来', p:'过去十年，AI 大多活在屏幕里：识图、写文案、生成视频。而<span class="hl">具身智能</span>（Embodied AI）要让 AI 拥有物理身体——机器人、机械臂、自动驾驶车——用身体去感知世界、执行动作。'},
          {h:'为什么难？', p:'大模型擅长处理文本这种「干净信号」，但现实世界是连续的、带噪声的：摩擦力、光照、物体打滑。机器人需要在毫秒级把「看到」变成「动作」，容错率极低。'},
          {h:'关键三件套', p:'<span class="hl">感知</span>（视觉 / 触觉）、<span class="hl">决策</span>（大模型做任务规划）、<span class="hl">执行</span>（运动控制）。2023 年后，行业把 VLA——视觉-语言-动作模型——当成了主线。'}
        ],
        quiz:[
          {q:'具身智能与传统大模型最核心的区别是？', opts:['可以联网搜索','拥有物理身体并与环境交互','参数量更大','能生成图片'], a:1, exp:'「具身」的关键在于有身体、能感知并作用于物理世界，而不只是处理文字。'},
          {q:'现实世界对机器人的最大挑战是？', opts:['数据总量太少','信号连续有噪声、动作容错率低','算力太贵','用户不爱用'], a:1, exp:'真实环境是连续、带噪声的流，且动作必须在毫秒级完成，出错代价高。'},
          {q:'VLA 模型里的 A 指的是？', opts:['Action 动作','Attention 注意力','API 接口','Agent 智能体'], a:0, exp:'VLA = Vision-Language-Action，把视觉、语言直接映射到动作。'}
        ]
      },
      {
        id:'ai_hallucination', title:'大模型的「幻觉」从哪来', tag:'大模型',
        cards:[
          {h:'本质是「猜下一个词」', p:'大语言模型的核心目标只有一个：预测下一个词。它在海量文本上学会了语言的统计规律，但<span class="hl">并不知道事实真假</span>。当它没把握时，也会顺着「通顺」的方向继续编下去——这就是幻觉。'},
          {h:'两类幻觉', p:'<span class="hl">事实性幻觉</span>：说了与事实不符的内容；<span class="hl">忠实性幻觉</span>：回答偏离了用户的问题或提供的资料。前者是「编错了」，后者是「跑题了」。'},
          {h:'常见压制手段', p:'RAG（先检索再回答）、要求引用来源、提示模型「不确定就说不确定」、以及后训练阶段的偏好对齐。注意：压低幻觉往往会牺牲一部分「发挥空间」。'}
        ],
        quiz:[
          {q:'幻觉产生的根本原因更接近？', opts:['训练数据全都是错的','模型目标是预测下一个词，并不校验真伪','网络延迟','用户提问不清楚'], a:1, exp:'模型优化的是「像人话」，不是「是事实」，这是幻觉的结构性来源。'},
          {q:'下列哪一项不是缓解幻觉的常见手段？', opts:['RAG 检索增强','要求给出引用来源','把生成温度调高','提示「不确定就说不确定」'], a:2, exp:'调高温度会让输出更随机，通常更容易产生幻觉。'},
          {q:'「忠实性幻觉」指的是？', opts:['事实层面的错误','回答偏离了给定资料或问题本身','输出太短','出现乱码'], a:1, exp:'忠实性看的是「是否忠于给定上下文」，而非内容本身真假。'}
        ]
      },
      {
        id:'ai_rag', title:'RAG：给模型配个开卷图书馆', tag:'RAG',
        cards:[
          {h:'先查资料，再回答', p:'RAG = 检索增强生成。模型回答前，先去你的知识库里检索相关片段，把片段塞进提示词，再让模型<span class="hl">基于这些片段作答</span>，相当于开卷考试。'},
          {h:'为什么好用', p:'知识可更新（不用重训）、可溯源（能给出处）、显著减少幻觉、还能回答企业内部私有数据。这是目前最主流的「让大模型懂你的数据」的方式。'},
          {h:'真正的难点', p:'关键不只是「检索」，而是<span class="hl">切分与排序</span>：文档怎么切块、块怎么向量化、召回后怎么重排，直接决定效果上限。'}
        ],
        quiz:[
          {q:'RAG 的核心流程是？', opts:['先检索，再生成','先生成，再检索','只做模型微调','只建向量数据库'], a:0, exp:'检索在前、生成在后，用检索到的资料约束回答。'},
          {q:'相比微调，RAG 的主要优势是？', opts:['一定更便宜','知识可更新且答案可溯源','保证完全不幻觉','完全不需要数据'], a:1, exp:'无需重训即可更新知识，并能给出来源，是 RAG 的核心价值。'},
          {q:'决定 RAG 效果上限的关键环节是？', opts:['显卡型号','切分、向量化与重排','网页字体','用户网速'], a:1, exp:'检索质量决定生成质量，切分/嵌入/重排是效果天花板。'}
        ]
      },
      {
        id:'ai_agent', title:'Agent：会自己用工具的 AI', tag:'Agent',
        cards:[
          {h:'从「回答」到「做事」', p:'聊天机器人只会回答；Agent 会做事：它拆解目标、调用工具（搜索、计算、代码、浏览器）、观察结果、再决定下一步，<span class="hl">循环直到完成</span>。'},
          {h:'核心范式 ReAct', p:'Reason（推理）+ Act（行动）。每一步先生成思考，再选一个工具调用，拿到结果后继续循环。这个「想—做—看」的闭环，是 Agent 的基本骨架。'},
          {h:'落地难点', p:'长任务容易跑偏、工具调用失败要能重试、还要在「自主性」与「可控性」之间取舍。企业落地通常先做<span class="hl">流程固定的单 Agent</span>。'}
        ],
        quiz:[
          {q:'Agent 与聊天机器人最关键的区别？', opts:['参数更多','能拆解目标并循环调用工具','更会聊天','成本更低'], a:1, exp:'Agent 的「循环 + 工具」让它能执行任务，而不只是生成文本。'},
          {q:'ReAct 的含义是？', opts:['只推理','只行动','推理与行动交替进行','随机采样'], a:2, exp:'Reason 与 Act 交替，看结果再决定下一步。'},
          {q:'企业落地 Agent 更稳妥的起点是？', opts:['直接上全自动多智能体','从流程固定的单 Agent 做起','完全不用工具','关掉所有日志'], a:1, exp:'先限制范围、保证可控，再逐步放开自主性。'}
        ]
      },
      {
        id:'ai_multimodal', title:'多模态：一个模型看懂图文音视频', tag:'多模态',
        cards:[
          {h:'图像变成「视觉 token」', p:'多模态模型能同时处理文字、图像、音频、视频。常见做法是把图像切成 patch，编码成<span class="hl">视觉 token</span>，再和文字 token 拼在一起，喂给同一个 Transformer。'},
          {h:'能力外溢', p:'截图直接问、语音直接聊、视频直接总结都成了现实。更重要的是，它让「看屏幕操作电脑」这类 Agent 成为可能——界面本身就是一种多模态输入。'},
          {h:'难点在对齐与成本', p:'视觉与语言要在语义空间里对齐；长视频、高分辨率会带来巨大的 token 开销。所以工程上常有降采样、分帧、压缩等取舍。'}
        ],
        quiz:[
          {q:'图像通常如何进入多模态模型？', opts:['转成一段文字描述','切成 patch 编码为视觉 token','存成 JSON','只做人脸识别'], a:1, exp:'patch → 视觉 token → 与文本 token 拼接，是主流做法。'},
          {q:'多模态带来的典型能力是？', opts:['截图问答与视频总结','更快的网速','更小的显存','更低的电费'], a:0, exp:'统一处理多种模态后，截图问答、视频理解成为基础能力。'},
          {q:'多模态的主要难点是？', opts:['视觉与语言语义对齐、长视频 token 开销大','屏幕太亮','键盘布局','电池容量'], a:0, exp:'对齐质量决定效果，而长视频/高清输入会迅速推高计算成本。'}
        ]
      },
      {
        id:'ai_worldmodel', title:'世界模型：让 AI 在脑内预演', tag:'世界模型',
        cards:[
          {h:'预测「动作之后世界什么样」', p:'世界模型让 AI 学会：如果我做一个动作，世界会变成什么样。有了它，机器人可以先在虚拟里演练，再在真实世界执行，<span class="hl">大幅降低试错成本</span>。'},
          {h:'与视频生成很近', p:'生成未来几帧画面，本质上就是在预测世界演化。区别在于世界模型更强调<span class="hl">动作条件</span>——动作会改变结果，而不只是延续画面。'},
          {h:'用在哪', p:'自动驾驶与机器人常用它做仿真训练和规划：在脑内想象几条未来轨迹，评估后选最优的那条再执行。'}
        ],
        quiz:[
          {q:'世界模型的核心能力是？', opts:['预测动作导致的世界变化','生成 PPT','压缩文件','翻译字幕'], a:0, exp:'「动作 → 世界状态变化」的预测能力，是它与普通视频生成的分水岭。'},
          {q:'世界模型与视频生成的关系是？', opts:['完全无关','很接近，但更强调动作条件','本质完全一样','只是一种滤镜'], a:1, exp:'两者都预测未来画面，但世界模型必须以动作为条件。'},
          {q:'世界模型的典型应用是？', opts:['仿真训练与轨迹规划','修图','记账','打字'], a:0, exp:'在仿真中预演、为真实执行做规划，是主要场景。'}
        ]
      },
      {
        id:'ai_rlhf', title:'RLHF：把模型调教得更像人想听的', tag:'对齐',
        cards:[
          {h:'预训练只是「会接话」', p:'预训练后的模型只学会了接话，不一定会「好好接话」。RLHF（基于人类反馈的强化学习）用<span class="hl">人类偏好</span>给它打分，再据此优化。'},
          {h:'三步走', p:'① 收集人类对回答的排序；② 训练一个奖励模型；③ 用强化学习让模型最大化这个奖励。如今也常用更简单的 <span class="hl">DPO</span>，直接优化偏好、跳过奖励模型。'},
          {h:'副作用', p:'它让模型更听话、更安全，但也可能变得「讨好」、过度谨慎，甚至牺牲一部分真实能力。所以对齐与能力，需要一起权衡。'}
        ],
        quiz:[
          {q:'RLHF 的关键信号来源是？', opts:['人类偏好排序','随机数','代码报错','网络日志'], a:0, exp:'RLHF 用人类对回答的偏好作为优化信号。'},
          {q:'DPO 相比 RLHF？', opts:['更复杂','更简单，直接优化偏好','需要更多人工打分','完全不需要数据'], a:1, exp:'DPO 跳过奖励模型，直接基于偏好对优化，实现更简单。'},
          {q:'RLHF 的潜在副作用是？', opts:['模型更会讨好、过度谨慎','模型参数变大','显卡变贵','网速变慢'], a:0, exp:'过度优化人类偏好会导致「讨好」与过度保守。'}
        ]
      }
    ]
  },
  {
    id:'gk', name:'考公常识', icon:'🏛', color:'linear-gradient(135deg,#dc2626 0%,#ef4444 55%,#f97316 100%)',
    lessons:[
      {
        id:'gk_constitution', title:'宪法：国家机构一次记牢', tag:'法律常识',
        cards:[
          {h:'全国人大：最高权力机关', p:'全国人民代表大会行使立法权、决定权、任免权、监督权。记住两个专属职权：<span class="hl">修改宪法</span>、制定和修改<span class="hl">基本法律</span>。'},
          {h:'常委会：常设机关', p:'全国人大常委会在全国人大闭会期间行使部分职权：<span class="hl">解释宪法和法律</span>、制定基本法律以外的其他法律、决定特赦等。易错点：修改宪法归人大，解释宪法归常委会。'},
          {h:'一图记住四机关', p:'国务院是最高国家行政机关（中央人民政府）；国家监察委员会是最高监察机关；最高人民法院行使审判权；最高人民检察院行使检察权。口诀：人大立法、国务院行政、监委监察、两高司法。'}
        ],
        quiz:[
          {q:'修改宪法的职权属于？', opts:['全国人大常委会','全国人民代表大会','国务院','最高人民法院'], a:1, exp:'修改宪法是全国人大的专属职权，常委会只能解释宪法。'},
          {q:'解释宪法和法律的职权属于？', opts:['全国人民代表大会','全国人大常委会','国务院','国家监察委员会'], a:1, exp:'这是最经典的易错点：修改归人大，解释归常委会。'},
          {q:'我国最高国家行政机关是？', opts:['全国人民代表大会','国务院','中央军事委员会','国家监察委员会'], a:1, exp:'国务院即中央人民政府，是最高国家行政机关。'}
        ]
      },
      {
        id:'gk_economy', title:'经济常识：GDP、CPI 与两大政策', tag:'经济常识',
        cards:[
          {h:'GDP 与 GNP', p:'GDP 是国内生产总值，衡量一国<span class="hl">境内</span>一定时期生产的最终产品和服务的市场价值；GNP 是国民生产总值，按<span class="hl">国民</span>口径统计。区别就在「境内」与「国民」。'},
          {h:'CPI 是什么', p:'CPI 是居民消费价格指数，衡量居民消费品价格的变动，常被当作通胀的观测指标。CPI 持续上涨通常意味着通胀压力，而不是股市涨跌。'},
          {h:'财政政策 vs 货币政策', p:'财政政策由政府主导：税收、政府支出、国债；货币政策由央行主导：利率、<span class="hl">存款准备金率</span>、公开市场操作。经济过热用紧缩，经济下行用扩张。'}
        ],
        quiz:[
          {q:'衡量一国境内生产总值的指标是？', opts:['GNP','GDP','CPI','PPI'], a:1, exp:'GDP 按「境内」统计，GNP 按「国民」统计。'},
          {q:'CPI 主要反映？', opts:['股市涨跌','居民消费品价格变动','失业率','汇率变化'], a:1, exp:'CPI 是居民消费价格指数，核心是消费品价格变动。'},
          {q:'下列属于货币政策工具的是？', opts:['政府支出','税率调整','存款准备金率','发行国债'], a:2, exp:'存款准备金率由央行操作，属于货币政策；前几项多为财政政策。'}
        ]
      },
      {
        id:'gk_science', title:'科技常识：航天与大科学装置', tag:'科技常识',
        cards:[
          {h:'中国空间站', p:'中国空间站（天宫）由<span class="hl">天和核心舱</span>、问天实验舱、梦天实验舱组成。载人飞船是「神舟」，货运飞船是「天舟」，别记混。'},
          {h:'探月探火与导航', p:'探月工程叫「嫦娥」，火星探测叫「天问」，卫星导航是「北斗」。这些命名是常识判断的高频考点。'},
          {h:'大科学装置', p:'FAST 是 500 米口径<span class="hl">球面射电望远镜</span>，位于贵州平塘；EAST 是全超导托卡马克装置，被称为「人造太阳」；还有散裂中子源、LHAASO 等。'}
        ],
        quiz:[
          {q:'中国空间站的核心舱名为？', opts:['天宫','天和','天舟','天问'], a:1, exp:'天和是核心舱；天宫是空间站整体名称；天舟是货运飞船。'},
          {q:'FAST 指的是？', opts:['空间望远镜','球面射电望远镜','火星车','导航系统'], a:1, exp:'FAST 是位于贵州平塘的 500 米口径球面射电望远镜。'},
          {q:'被称为「人造太阳」的是？', opts:['FAST','EAST 全超导托卡马克','北斗系统','嫦娥工程'], a:1, exp:'EAST 通过核聚变模拟太阳，故称「人造太阳」。'}
        ]
      }
    ]
  },
  {
    id:'fin', name:'职场理财', icon:'💼', color:'linear-gradient(135deg,#0f766e 0%,#10b981 55%,#22d3ee 100%)',
    lessons:[
      {
        id:'fin_statements', title:'财报三张表：十分钟看懂一家公司', tag:'财报',
        cards:[
          {h:'利润表：赚不赚钱', p:'利润表反映一段时期的经营成果：营业收入减去成本费用，得到净利润。它回答的是「这段时间赚了多少」。'},
          {h:'资产负债表：家底如何', p:'资产负债表是某一时点的快照，核心恒等式：<span class="hl">资产 = 负债 + 所有者权益</span>。负债率过高要警惕偿债风险。'},
          {h:'现金流量表：钱去哪了', p:'分经营、投资、筹资三类现金流。很多公司利润为正，却因<span class="hl">经营现金流为负</span>而暴雷——利润是观点，现金是事实。'}
        ],
        quiz:[
          {q:'反映某一时点财务状况的报表是？', opts:['利润表','资产负债表','现金流量表','报表附注'], a:1, exp:'资产负债表是「快照」，利润表和现金流量表是「一段时期」。'},
          {q:'会计恒等式是？', opts:['资产 = 负债 + 所有者权益','收入 = 成本','利润 = 现金','资产 = 收入'], a:0, exp:'这是资产负债表成立的基础。'},
          {q:'「利润是观点，现金是事实」强调的是？', opts:['只看利润表','重视经营现金流','不看负债','只看营收'], a:1, exp:'利润可被会计手段调节，经营现金流更难造假。'}
        ]
      },
      {
        id:'fin_compound', title:'复利与年化：7% 十年翻倍', tag:'理财基础',
        cards:[
          {h:'复利是「利滚利」', p:'公式 A = P(1+r)^n。当 r=7% 时约 10 年翻倍，这就是 <span class="hl">72 法则</span>：72 ÷ 7 ≈ 10.3 年。它用来快速估算资金翻倍所需年数。'},
          {h:'年化收益率', p:'年化收益率把不同期限的收益换算成一年口径，方便比较。但「年化」不等于「保本」，也不等于「保证收益」，看到高年化先问风险。'},
          {h:'复利的两大敌人', p:'一是费用，每年 1-2% 的费率长期会吃掉大量收益；二是<span class="hl">频繁申赎</span>，中途打断复利。少折腾、低成本，才是复利的朋友。'}
        ],
        quiz:[
          {q:'72 法则用于估算？', opts:['通胀率','资金翻倍所需年数','税率','汇率'], a:1, exp:'72 除以年化收益率，约等于资金翻倍所需年数。'},
          {q:'复利的计算公式是？', opts:['P(1+r)^n','P + r·n','P/(1+r)^n','P·r'], a:0, exp:'复利按「本金+利息」整体再计息，指数增长。'},
          {q:'复利的主要敌人是？', opts:['长期持有','高费率与频繁交易','分散投资','定期定额'], a:1, exp:'费用和频繁交易会持续侵蚀长期复利效果。'}
        ]
      },
      {
        id:'fin_labor', title:'劳动法避坑：试用期、加班费、N+1', tag:'劳动法',
        cards:[
          {h:'试用期上限', p:'与合同期限挂钩：3 个月以上不满 1 年→不超过 1 个月；1 至 3 年→不超过 2 个月；<span class="hl">3 年以上或无固定期限→不超过 6 个月</span>。同一单位只能约定一次试用期。'},
          {h:'加班费怎么算', p:'工作日延长工时不低于 150%；休息日不低于 <span class="hl">200%</span>；法定节假日不低于 <span class="hl">300%</span>。这是高频考点，也是维权依据。'},
          {h:'N、N+1 与 2N', p:'经济补偿 N 按工作年限，每满一年支付一个月工资；「N+1」里的 +1 是<span class="hl">代通知金</span>（未提前 30 天书面通知）；违法解除则是 2N 赔偿金。'}
        ],
        quiz:[
          {q:'3 年以上固定期限合同的试用期最长？', opts:['1 个月','2 个月','6 个月','1 年'], a:2, exp:'3 年以上或无固定期限，试用期不得超过 6 个月。'},
          {q:'法定节假日加班工资不低于？', opts:['150%','200%','300%','100%'], a:2, exp:'工作日 150%、休息日 200%、法定节假日 300%。'},
          {q:'「N+1」中的「1」指？', opts:['一个月年终奖','代通知金','加班费','试用期工资'], a:1, exp:'未提前 30 天书面通知时，需额外支付一个月工资作为代通知金。'}
        ]
      }
    ]
  },
  {
    id:'art', name:'艺术人文', icon:'🎨', color:'linear-gradient(135deg,#be123c 0%,#f43f5e 55%,#fb923c 100%)',
    lessons:[
      {
        id:'art_renaissance', title:'文艺复兴三杰与透视法', tag:'西方美术',
        cards:[
          {h:'回到「人」', p:'文艺复兴的核心是人文主义：以人为中心，重新发现古希腊罗马的比例与理性。艺术从「神的装饰」转向「人的世界」。'},
          {h:'三杰各有所长', p:'达·芬奇（《蒙娜丽莎》《最后的晚餐》）、米开朗基罗（《大卫》、西斯廷天顶画）、拉斐尔（《雅典学院》）。前两位重「力与理」，拉斐尔重「和谐」。'},
          {h:'透视法：看得进去的窗口', p:'布鲁内莱斯基推动<span class="hl">线性透视法</span>，让画面有了纵深感。从此绘画不再只是平面装饰，而是一个「可以走进去」的空间。'}
        ],
        quiz:[
          {q:'下列不属于文艺复兴三杰的是？', opts:['达·芬奇','米开朗基罗','拉斐尔','莫奈'], a:3, exp:'莫奈是 19 世纪印象派，与文艺复兴相隔数百年。'},
          {q:'线性透视法的重要推动者是？', opts:['布鲁内莱斯基','梵高','毕加索','莫奈'], a:0, exp:'布鲁内莱斯基把透视的几何规律引入绘画。'},
          {q:'文艺复兴的核心精神是？', opts:['神权至上','以人为中心','抽象表现','极简主义'], a:1, exp:'人文主义是文艺复兴的底色。'}
        ]
      },
      {
        id:'art_impressionism', title:'印象派：为什么被骂「印象」', tag:'西方美术',
        cards:[
          {h:'一个骂名成了流派', p:'1874 年莫奈《印象·日出》展出，被评论家讥讽为「印象派」。这个原本带贬义的名字，后来反而成了流派的正式名称。'},
          {h:'走出画室，追光逐色', p:'他们主张对景写生，捕捉<span class="hl">光与色的瞬间变化</span>，而不是精确轮廓与历史题材。代表：莫奈、雷诺阿、德加、毕沙罗。'},
          {h:'后印象派接棒', p:'梵高、塞尚、高更更强调主观情感与结构，不再满足于「看见什么画什么」，为现代艺术打开了大门。'}
        ],
        quiz:[
          {q:'「印象派」这个名字来自？', opts:['展览的宣传语','评论家的讥讽','画家自取','拍卖行命名'], a:1, exp:'它源自评论家对《印象·日出》的嘲讽。'},
          {q:'印象派最强调的是？', opts:['精确的素描','光与色的瞬间变化','宗教题材','严格透视'], a:1, exp:'捕捉转瞬即逝的光色，是印象派的标志。'},
          {q:'下列属于后印象派的是？', opts:['莫奈','雷诺阿','梵高','德加'], a:2, exp:'梵高、塞尚、高更属于后印象派。'}
        ]
      },
      {
        id:'art_shanshui', title:'中国山水：散点透视与留白', tag:'中国美术',
        cards:[
          {h:'散点透视，移步换景', p:'中国山水画不追求西方式的单点透视，而是<span class="hl">散点透视</span>：视线随画卷移动，一步一景，所以在长卷里能同时看到远近多处山水。'},
          {h:'留白是「计白当黑」', p:'空白不是没画完，而是被当成实景经营：可以是云、是水、是气。留白让画面有呼吸，也给观者留出想象空间。'},
          {h:'重意境，不重写实', p:'讲究「外师造化，中得心源」。代表作品：范宽《溪山行旅图》、王希孟《千里江山图》、黄公望《富春山居图》。'}
        ],
        quiz:[
          {q:'中国山水画常用的透视方式是？', opts:['单点透视','散点透视','鱼眼透视','不用透视'], a:1, exp:'视线在长卷中移动，形成移步换景的散点透视。'},
          {q:'「计白当黑」指的是？', opts:['只用黑白两色','把留白当作实景来经营','画完再涂白','完全不用颜色'], a:1, exp:'留白被视为画面的一部分，甚至是主体。'},
          {q:'《千里江山图》的作者是？', opts:['范宽','王希孟','黄公望','张择端'], a:1, exp:'北宋王希孟的《千里江山图》是青绿山水的代表。'}
        ]
      }
    ]
  }
];

  const ALL = [];
  DOMAINS.forEach(d => d.lessons.forEach(l => { l.domainId = d.id; l.domainName = d.name; ALL.push(l); }));
  const findLesson = id => ALL.find(l => l.id === id);
  const domainOf = id => DOMAINS.find(d => d.id === id);

  const QKEY = 'peiduxiaomiao.quiz.v1';
  const CAP = 20;
  function defQ(){ return { done:{}, wrong:[], coinDay:{date:'',earned:0}, paperDay:{date:'',earned:0} }; }
  let Q = defQ();
  try { const raw = JSON.parse(localStorage.getItem(QKEY)); if (raw) Q = Object.assign(defQ(), raw); } catch (e) {}
  // 兼容旧版 "lessonId-qIdx" 字符串，同时保留题目快照，避免每日论文换日后错题失效
  Q.wrong = (Array.isArray(Q.wrong) ? Q.wrong : []).map(item => {
    if (item && typeof item === 'object') return item;
    const key = String(item || '');
    const cut = key.lastIndexOf('-');
    return { lessonId: cut > 0 ? key.slice(0, cut) : key, qIdx: cut > 0 ? Number(key.slice(cut + 1)) : 0 };
  }).filter(item => item && item.lessonId && Number.isFinite(Number(item.qIdx)));
  function saveQ(){ try { localStorage.setItem(QKEY, JSON.stringify(Q)); } catch (e) {} }

  const st = { mode:'map', domain:'ai', lessonId:null, card:0, q:0, answers:[], res:null };

  const domainDone = did => domainOf(did).lessons.filter(l => Q.done[l.id] !== undefined).length;

  function award(n){
    const t = core.dateKey();
    if (Q.coinDay.date !== t) Q.coinDay = { date:t, earned:0 };
    const room = Math.max(0, CAP - Q.coinDay.earned);
    const give = Math.min(n, room);
    if (give > 0) { core.addBonusFish(give, 'quiz'); Q.coinDay.earned += give; }
    return give;
  }

  /* ---------------- views ---------------- */
  function renderMap(){
    const d = domainOf(st.domain);
    const dc = domainDone(st.domain);
    const chips = DOMAINS.map(x =>
      '<button class="qz-chip ' + (x.id === st.domain ? 'on' : '') + '" data-act="domain" data-id="' + x.id + '">' + x.icon + ' ' + x.name + '</button>'
    ).join('');
    const items = d.lessons.map((L, i) => {
      const done = Q.done[L.id] !== undefined;
      const unlocked = i === 0 || Q.done[d.lessons[i - 1].id] !== undefined;
      const cls = (done ? 'done ' : '') + (unlocked ? '' : 'locked');
      return '<button class="qz-item ' + cls + '" ' + (unlocked ? 'data-act="open" data-id="' + L.id + '"' : '') + '>' +
        '<span class="qz-idx">' + (done ? '✓' : i + 1) + '</span>' +
        '<span class="qz-body"><b>' + L.title + '</b><i>' + L.tag + ' · 3 卡 · 3 题</i></span>' +
        '<span class="qz-tag">' + (done ? Q.done[L.id] + ' 分' : (unlocked ? '最多 +11 🐟' : '🔒')) + '</span>' +
      '</button>';
    }).join('');
    const earned = Q.coinDay.date === core.dateKey() ? Q.coinDay.earned : 0;
    return '<div class="qz-head">' +
        '<div><h1>刷题赚小鱼干</h1><p>答对题，小喵的杂货铺就有着落了</p></div>' +
        '<div class="qz-fish"><svg><use href="#i-fish"/></svg><b>' + core.state().fish + '</b></div>' +
      '</div>' +
      (PDM.paper && PDM.paper.cardHTML ? PDM.paper.cardHTML() : '') +
      '<div class="qz-chips">' + chips + '</div>' +
      '<div class="qz-progress"><span>今日已赚 ' + earned + '/' + CAP + ' 🐟</span><span>' + dc + '/' + d.lessons.length + ' 关</span></div>' +
      items +
      '<button class="qz-wrong" data-act="wrong">错题本' + (Q.wrong.length ? ' · ' + Q.wrong.length + ' 题' : '') + '</button>';
  }

  function renderCard(){
    const L = findLesson(st.lessonId), c = L.cards[st.card];
    const last = st.card === L.cards.length - 1;
    const dots = L.cards.map((_, i) => '<i class="' + (i === st.card ? 'on' : '') + '"></i>').join('');
    return '<div class="qz-dots">' + dots + '</div>' +
      '<div class="qz-card">' +
        '<div class="qz-k">' + L.domainName + ' · ' + L.tag + ' · 微课 ' + (st.card + 1) + '/' + L.cards.length + '</div>' +
        '<h3>' + c.h + '</h3><p>' + c.p + '</p>' +
      '</div>' +
      '<div class="qz-foot">' +
        '<button class="btn ghost" data-act="back">返回</button>' +
        (st.card > 0 ? '<button class="btn ghost" data-act="prev">上一张</button>' : '') +
        '<button class="btn primary" data-act="next">' + (last ? '开始闯关' : '下一张') + '</button>' +
      '</div>';
  }

  function renderQ(){
    const L = findLesson(st.lessonId), q = L.quiz[st.q];
    const picked = st.answers[st.q];
    const answered = picked !== undefined;
    const opts = q.opts.map((o, i) => {
      let cls = '';
      if (answered) cls = (i === q.a) ? 'correct' : (i === picked ? 'wrong' : 'dim');
      return '<button class="qz-opt ' + cls + '" ' + (answered ? 'disabled' : 'data-act="pick" data-i="' + i + '"') + '>' +
        '<span class="k">' + 'ABCD'[i] + '</span><span>' + o + '</span></button>';
    }).join('');
    const exp = answered
      ? '<div class="qz-exp"><b>' + (picked === q.a ? '答对了 ✓' : '正确答案：' + 'ABCD'[q.a]) + '</b>' + q.exp + '</div>'
      : '';
    return '<div class="qz-met">第 ' + (st.q + 1) + ' / ' + L.quiz.length + ' 题</div>' +
      '<div class="qz-card"><h3>' + q.q + '</h3>' + opts + exp + '</div>' +
      '<div class="qz-foot"><button class="btn primary" ' + (answered ? 'data-act="nextq"' : 'disabled') + '>' +
        (st.q === L.quiz.length - 1 ? '查看成绩' : '下一题') + '</button></div>';
  }

  function renderResult(){
    const r = st.res;
    const pass = r.score >= 67;
    return '<div class="qz-result">' +
      '<div class="qz-score" style="--p:' + r.score + '"><span>' + r.score + '<i>分</i></span></div>' +
      '<h2>' + (pass ? '通关成功' : '再试一次') + '</h2>' +
      '<p class="qz-sub">答对 ' + r.correct + ' / ' + r.total + ' 题</p>' +
      (pass ? (r.give > 0 ? '<div class="qz-win">+' + r.give + ' 🐟</div>' : '<div class="qz-win">复习完成</div>') : '<p class="qz-note">得分未达 67，本关未通过，下一关暂未解锁</p>') +
      (pass && r.give < r.want ? '<p class="qz-note">今日小鱼干已达上限，超出部分未发放</p>' : '') +
      (r.isPaper && pass && r.want === 0 ? '<p class="qz-note">今天的论文奖励已经领过了</p>' : '') +
      (!r.first && !r.isPaper ? '<p class="qz-note">复习模式：不再发放小鱼干，答错仍会进错题本</p>' : '') +
      '<div class="qz-foot col">' +
        '<button class="btn primary" data-act="map">继续刷题</button>' +
        '<button class="btn ghost" data-act="shop">去小铺花掉</button>' +
      '</div></div>';
  }

  function render(){
    const body = $('quizBody');
    if (!body) return;
    const map = { map:renderMap, card:renderCard, quiz:renderQ, result:renderResult };
    body.innerHTML = (map[st.mode] || renderMap)();
    body.scrollTop = 0;
  }

  /* ---------------- actions ---------------- */
  function finish(){
    const L = findLesson(st.lessonId);
    let correct = 0;
    L.quiz.forEach((q, i) => { if (st.answers[i] === q.a) correct++; });
    const score = Math.round(correct / L.quiz.length * 100);
    const first = Q.done[L.id] === undefined;
    const pass = score >= 67;
    const isPaper = !!L.isPaper;
    let want = 0;
    if (pass) {
      if (isPaper) {
        const today = core.dateKey();
        if (!Q.paperDay || Q.paperDay.date !== today) {
          want = 8;
          Q.paperDay = { date: today, earned: 0 };
        }
      } else if (first) {
        want = Math.min(11, 5 + correct * 2);
      }
    }
    const give = want > 0 ? award(want) : 0;
    if (isPaper && want > 0) Q.paperDay.earned += give;
    if (pass && (first || score > Q.done[L.id])) Q.done[L.id] = score;
    saveQ();
    st.res = { score: score, correct: correct, total: L.quiz.length, give: give, want: want, first: first, isPaper: isPaper };
    st.mode = 'result';
    ui.refreshHeader();
    render();
    if (give > 0) {
      ui.toast('小喵叼走了 ' + give + ' 条小鱼干 🐟');
      try { PDM.app.state.celebrateUntil = performance.now() + 2600; } catch (e) {}
    }
  }

  function openWrong(){
    if (!Q.wrong.length) { ui.openSheet('错题本', '<p class="tiny" style="line-height:1.8">还没有错题。去刷两关，答错的题会自动收进这里。</p>'); return; }
    const html = Q.wrong.map(item => {
      const L = findLesson(item.lessonId);
      const q = L && L.quiz[Number(item.qIdx)];
      const title = (L && L.title) || item.title || '每日论文';
      const domainName = (L && L.domainName) || item.domainName || '论文精读';
      const data = q || item;
      if (!data || !data.q) return '';
      return '<div class="qz-wcard"><div class="wtag">' + domainName + ' · ' + title + '</div>' +
        '<div class="wq">' + data.q + '</div>' +
        '<div class="wa">正确答案：' + 'ABCD'[data.a] + '. ' + data.opts[data.a] + '</div>' +
        '<div class="we">' + data.exp + '</div></div>';
    }).join('');
    ui.openSheet('错题本', html);
  }

  function onClick(e){
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'domain') { st.domain = el.dataset.id; st.mode = 'map'; render(); }
    else if (act === 'open') { st.lessonId = el.dataset.id; st.card = 0; st.q = 0; st.answers = []; st.mode = 'card'; render(); }
    else if (act === 'next') {
      const L = findLesson(st.lessonId);
      if (st.card < L.cards.length - 1) { st.card++; render(); }
      else { st.q = 0; st.answers = []; st.mode = 'quiz'; render(); }
    }
    else if (act === 'prev') { st.card = Math.max(0, st.card - 1); render(); }
    else if (act === 'back') { st.mode = 'map'; render(); }
    else if (act === 'pick') {
      const i = +el.dataset.i; st.answers[st.q] = i;
      const L = findLesson(st.lessonId);
      if (i !== L.quiz[st.q].a) {
        const q = L.quiz[st.q];
        const exists = Q.wrong.some(item => item.lessonId === L.id && Number(item.qIdx) === st.q);
        if (!exists) {
          Q.wrong.push({ lessonId: L.id, qIdx: st.q, title: L.title, domainName: L.domainName, q: q.q, opts: q.opts, a: q.a, exp: q.exp });
          saveQ();
        }
      } else {
        const before = Q.wrong.length;
        Q.wrong = Q.wrong.filter(item => !(item.lessonId === L.id && Number(item.qIdx) === st.q));
        if (Q.wrong.length !== before) saveQ();
      }
      render();
    }
    else if (act === 'nextq') {
      const L = findLesson(st.lessonId);
      if (st.q < L.quiz.length - 1) { st.q++; render(); } else finish();
    }
    else if (act === 'map') { st.mode = 'map'; render(); }
    else if (act === 'shop') { ui.switchScreen('shop'); }
    else if (act === 'wrong') { openWrong(); }
    else if (act === 'paper') { PDM.paper.open(); }
  }

  /* ---------------- init ---------------- */
  function init(){
    const screen = $('screen-quiz');
    if (!screen) return;
    screen.addEventListener('click', e => {
      if (e.target.closest('button')) e.preventDefault();
      onClick(e);
    });
    const orig = PDM.ui.switchScreen;
    PDM.ui.switchScreen = function (name) {
      orig(name);
      if (name === 'quiz') { if (st.mode === 'result' || st.mode === 'quiz' || st.mode === 'card') st.mode = 'map'; render(); }
    };
    render();
  }

  PDM.quiz = {
    render: render,
    state: st,
    data: DOMAINS,
    all: ALL,
    addLesson: function (l) {
      const i = ALL.findIndex(x => x.id === l.id);
      if (i >= 0) ALL[i] = l; else ALL.push(l);
    },
    reset: function () { Q = defQ(); saveQ(); st.mode = 'map'; st.lessonId = null; st.answers = []; st.res = null; render(); },
    open: function (id) { st.lessonId = id; st.card = 0; st.q = 0; st.answers = []; st.mode = 'card'; render(); },
    paperClaimed: function () { return !!(Q.paperDay && Q.paperDay.date === core.dateKey()); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.PDM);
