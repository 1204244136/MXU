/**
 * 富文本（Markdown / HTML）标记判定与清理。
 *
 * 本文件集中管理"这段文本要不要按富文本渲染"的规则，避免各处各写一套正则导致
 * 行为漂移（历史上 label、focus 日志各有一套判定）：
 *
 * - {@link hasInlineRichText}：label 等短文本，只认行内语法（图片 / 链接 / 行内代码 /
 *   加粗 / 白名单行内 HTML 标签）。纯文本里出现的 `<xxx>`（例如 `模拟器 <MuMu>`）
 *   不会被误判成富文本。
 * - {@link hasRichTextFeatures}：focus 日志等长文本，语法面更宽（含多行、裸 URL）。
 * - {@link stripInlineRichText}：去掉行内标记取纯文本，用于 title / 搜索匹配 / 截断预览。
 *
 * 纯函数、无任何依赖，便于单测和跨环境复用。
 */

/** 图片 `![alt](path)` 或链接 `[text](url)` */
const INLINE_IMAGE_OR_LINK = /!?\[[^\]]*\]\([^)]*\)/;

/** 行内代码 `` `code` `` */
const INLINE_CODE = /`[^`]+`/;

/** 加粗 `**bold**` */
const INLINE_STRONG = /\*\*[^*]+\*\*/;

/**
 * 白名单行内 HTML 标签。
 * 只认常见的行内标签名，避免把 `使用 <空格> 键` 这类纯文本当成 HTML。
 */
const INLINE_HTML_TAG = /<(?:img|br|b|strong|i|em|code|span|a|small|sub|sup)\b[^>]*>/i;

/**
 * 文本是否包含行内富文本标记（用于 label、输入项标题等短文本）。
 *
 * @param text 已解析过国际化的文本
 */
export function hasInlineRichText(text: string | undefined | null): boolean {
  if (!text) return false;
  return (
    INLINE_IMAGE_OR_LINK.test(text) ||
    INLINE_CODE.test(text) ||
    INLINE_STRONG.test(text) ||
    INLINE_HTML_TAG.test(text)
  );
}

/**
 * 去除行内富文本标记，得到用于 title / 搜索 / 截断预览的纯文本。
 *
 * - 图片：保留 alt 文本（`![三星](x.png)` → `三星`），无 alt 时整体去掉；
 * - 链接：保留链接文字；
 * - 行内代码 / 加粗：保留内容，去掉定界符；
 * - HTML 标签：整体去掉。
 */
export function stripInlineRichText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 文本是否包含富文本特征（用于 focus 日志等长文本，语法面比 label 宽）。
 *
 * 与 {@link hasInlineRichText} 的区别：这里额外认多行内容与裸 URL，
 * 因为日志正文经常是整段 Markdown 或直接给一个链接。
 */
export function hasRichTextFeatures(text: string): boolean {
  return (
    /[*_`#\[\]!]/.test(text) || // Markdown 语法
    text.includes('\n') || // 多行内容
    /<[a-z][\s\S]*?>/i.test(text) || // HTML 标签
    /https?:\/\/\S+/.test(text) // URL
  );
}
