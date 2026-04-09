export function extractFundAProjectStory(
  content: Record<string, unknown> | undefined,
): string {
  if (!content) return ''
  const story = content.story
  if (typeof story === 'string') return story
  if (story !== null && typeof story === 'object') {
    try {
      return JSON.stringify(story)
    } catch {
      return ''
    }
  }
  return ''
}
