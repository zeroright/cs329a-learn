#!/usr/bin/env node
/**
 * build_search_index.mjs — 重建站内全文搜索索引 data/search_index.js
 *
 * 用法（在仓库根目录）：
 *   node tools/build_search_index.mjs            # 生成并覆盖 data/search_index.js
 *   node tools/build_search_index.mjs --check    # 只生成到内存并与现有文件对比，不写文件
 *
 * 索引格式（由 search.html 的消费方式与旧索引反推，2026-11-10 复原）：
 *   window.SEARCH_INDEX = [ {id, title, text, url}, ... ]
 *   search.html 对每条 doc.text 做小写子串匹配并截取片段，doc.url 直接作链接。
 *
 * 条目构成（顺序与旧索引一致）：
 *   1. 讲次条目（主线顺序 L01–L09、L13–L20）：text = data/lectures/Lxx.js 中
 *      window.LECTURE_MD["Lxx"] 的 Markdown 原文（不做清洗，旧索引即如此）；
 *      title = "Lxx · " + data/meta.js 中 SITE_META.lectures[Lxx].title；
 *      url   = SITE_META.lectures[Lxx].page（如 lectures/L02.html）。
 *   2. 站点条目：INDEX = data/index_md.js 的 INDEX_MD + "\n" + data/capstones_md.js
 *      的 CAPSTONES_MD；learning-path / homework-repro / homework-license 三条为
 *      旧索引中遗留的手写关键词条目（无对应数据源），原样保留在下方 LEGACY_STUBS。
 *   3. 期中讲次 L10–L12（旧索引中排在站点条目之后）。
 *   4. 论文精读条目：对每讲 Markdown 中以 <h2 id="close-…"> 开头的精读章节单独
 *      成条，url = lectures/Lxx.html#<anchor>。仅收录 data/meta.js SITE_META.papers
 *      中带 anchor 的精读（与 papers.html 的「中文精读」条目一致）。
 *      text 的切分与旧索引逐字节一致：从该 <h2 的结束位置（"<h2 " 之后）起，
 *      到下一个 <h2 的结束位置止（即段末会带上一个 "<h2 "）；若为最后一节则到文末。
 *      标题默认由章节标题派生（"Lxx 论文精读 · A：B" → "Lxx · A B"）；
 *      旧索引中人工润色的 4 条标题/ id 用下方 LEGACY_CLOSE_OVERRIDES 原样保留。
 *      L03 的对照小结节（<h2 id="l03-compare">）不是论文精读，不单独成条；
 *      其全文包含在 L03 讲次条目的 text 中，可被搜索命中。
 *
 * 序列化与旧文件逐字节同构：Python json.dumps(ensure_ascii=False) 风格，
 * 即 {"id": "…", "title": "…", "text": "…", "url": "…"}，条目以 ", " 连接，
 * 全文为 window.SEARCH_INDEX=[…];\n。Node 的 JSON.stringify 转义规则与之等价。
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 在隔离的 window 对象上执行一个 data/*.js 文件并返回该 window。 */
function loadDataFile(relPath) {
  const src = readFileSync(join(ROOT, relPath), 'utf8');
  const win = {};
  new Function('window', src)(win);
  return win;
}

// 旧索引中 4 条精读的人工标题 / id（按 anchor 索引），保持搜索结果文案不变。
const LEGACY_CLOSE_OVERRIDES = {
  'close-snell': { id: 'L02-snell', title: 'L02 · Snell 2024 测试时算力最优缩放' },
  'close-laws': { id: 'L02-laws', title: 'L02 · Large Language Monkeys 幂律从何而来' },
  'close-adapt': { id: 'L05-adapt', title: 'L05 · ADaPT 按需分解与规划' },
  'close-abmcts': { id: 'L05-adaptive-branching', title: 'L05 · Adaptive Branching / AB-MCTS' },
};

// 旧索引遗留的手写关键词条目（无数据源文件），原样保留。
const LEGACY_STUBS = [
  {
    id: 'learning-path',
    title: '详细学习路径 · 分阶段路线图',
    text: '六阶段 foundations TTC verification agents RL frontier 2周 8周 PM B2B checklist milestone HW1 HW2 HW3 mermaid',
    url: 'learning-path.html',
  },
  {
    id: 'homework-repro',
    title: '作业复现指南 HW1 HW2 HW3',
    text: 'majority best-of-N pass@k sandbox deep research MIT Apache LICENSE repro 自编 官方镜像 陷阱',
    url: 'homework.html',
  },
  {
    id: 'homework-license',
    title: '官方作业源码镜像与许可证',
    text: 'HW1 MIT HW2 无许可证 HW3 Apache-2.0 vendor attribution',
    url: 'homework/README.md',
  },
];

// 旧索引的讲次排列：主线在前，期中展示 L10–L12 殿后。
const MAIN_ORDER = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09',
  'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20'];
const MIDTERM_ORDER = ['L10', 'L11', 'L12'];

function buildIndex() {
  const meta = loadDataFile('data/meta.js').SITE_META;
  const indexMd = loadDataFile('data/index_md.js').INDEX_MD;
  const capstonesMd = loadDataFile('data/capstones_md.js').CAPSTONES_MD;

  // 讲次 Markdown：data/lectures/Lxx.js
  const lectureFiles = readdirSync(join(ROOT, 'data', 'lectures'))
    .filter((f) => /^L\d{2}\.js$/.test(f))
    .sort();
  const lectureMd = {};
  for (const f of lectureFiles) {
    const id = f.replace(/\.js$/, '');
    lectureMd[id] = loadDataFile(join('data', 'lectures', f)).LECTURE_MD[id];
    if (typeof lectureMd[id] !== 'string') {
      throw new Error(`${f} 中未找到 LECTURE_MD["${id}"]`);
    }
  }

  const lectureEntry = (id) => ({
    id,
    title: `${id} · ${meta.lectures[id].title}`,
    text: lectureMd[id],
    url: meta.lectures[id].page,
  });

  const entries = [];
  for (const id of MAIN_ORDER) entries.push(lectureEntry(id));
  entries.push({ id: 'INDEX', title: '课程索引', text: indexMd + '\n' + capstonesMd, url: 'index.html' });
  entries.push(...LEGACY_STUBS);
  for (const id of MIDTERM_ORDER) entries.push(lectureEntry(id));

  // 论文精读条目：按讲次编号、章节在文中的出现顺序。
  const anchoredPapers = new Map(); // `${lecture}|${anchor}` -> paper
  for (const p of meta.papers || []) {
    if (p.anchor) anchoredPapers.set(`${p.lecture}|${p.anchor}`, p);
  }
  for (const id of Object.keys(lectureMd).sort()) {
    const md = lectureMd[id];
    const h2Starts = [];
    for (let i = md.indexOf('<h2 '); i !== -1; i = md.indexOf('<h2 ', i + 1)) h2Starts.push(i);
    h2Starts.forEach((start, k) => {
      const segStart = start + '<h2 '.length;
      const m = md.slice(segStart).match(/^id="(close-[a-z0-9-]+)"/);
      if (!m) return;
      const anchor = m[1];
      if (!anchoredPapers.has(`${id}|${anchor}`)) return;
      const segEnd = k + 1 < h2Starts.length ? h2Starts[k + 1] + '<h2 '.length : md.length;
      const text = md.slice(segStart, segEnd);
      const headingMatch = md.slice(segStart).match(/^id="[^"]+"[^>]*>([^<]*)<\/h2>/);
      const heading = headingMatch ? headingMatch[1] : '';
      const derivedTitle = heading
        .replace(/^[A-Z]\d{2} 论文精读 · /, `${id} · `)
        .replace(/：/g, ' ');
      const override = LEGACY_CLOSE_OVERRIDES[anchor];
      entries.push({
        id: override ? override.id : `${id}-${anchor.slice('close-'.length)}`,
        title: override ? override.title : derivedTitle,
        text,
        url: `${meta.lectures[id].page}#${anchor}`,
      });
    });
  }
  return entries;
}

function serialize(entries) {
  const esc = (s) => JSON.stringify(s);
  const body = entries
    .map((e) => `{"id": ${esc(e.id)}, "title": ${esc(e.title)}, "text": ${esc(e.text)}, "url": ${esc(e.url)}}`)
    .join(', ');
  return `window.SEARCH_INDEX=[${body}];\n`;
}

const entries = buildIndex();
const output = serialize(entries);
const target = join(ROOT, 'data', 'search_index.js');

if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8');
  console.log(`生成条目 ${entries.length} 条，与现有 data/search_index.js ${current === output ? '完全一致' : '存在差异（见 git diff）'}`);
} else {
  writeFileSync(target, output);
  const lectures = entries.filter((e) => /^L\d{2}$/.test(e.id)).length;
  const closes = entries.filter((e) => e.url.includes('#')).length;
  console.log(`已写入 data/search_index.js：共 ${entries.length} 条（讲次 ${lectures}、站点 ${entries.length - lectures - closes}、精读 ${closes}），${output.length} 字符`);
}
