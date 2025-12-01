import type { OpenAIResponsePayload } from '../types/ai.types';

export function extractReplyFromResponse(
  response: OpenAIResponsePayload,
): string {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const variants = response.output ?? response.choices ?? [];
  if (!Array.isArray(variants) || variants.length === 0) {
    return '';
  }

  const firstVariant = variants[0];

  if (Array.isArray(firstVariant.content) && firstVariant.content.length > 0) {
    const firstContent = firstVariant.content[0];

    if (firstContent.type === 'output_text') {
      if (typeof firstContent.text === 'string') {
        return firstContent.text;
      }

      if (
        firstContent.text &&
        typeof firstContent.text === 'object' &&
        'value' in firstContent.text
      ) {
        return String(firstContent.text.value);
      }
    }
  }

  if (firstVariant.message?.content) {
    return String(firstVariant.message.content);
  }

  return '';
}

export function postprocessReply(rawReply: string): string {
  const noMarkdownLinks = rawReply.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const noUrls = noMarkdownLinks
    .replace(/https?:\/\/\S+/g, '')
    .replace(/www\.\S+/g, '');
  const normalized = noUrls.replace(/\s+/g, ' ').trim();

  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] ?? normalized;

  return firstSentence.trim();
}
