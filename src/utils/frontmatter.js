/**
 * Simple frontmatter parser for browser use
 * Replaces gray-matter which has Node.js dependencies
 */

export function parseFrontmatter(content) {
  const result = { data: {}, content: '' };

  if (!content || typeof content !== 'string') {
    return result;
  }

  // Check if content starts with frontmatter delimiter
  const trimmed = content.trim();
  if (!trimmed.startsWith('---')) {
    result.content = content;
    return result;
  }

  // Find the closing delimiter
  const endIndex = trimmed.indexOf('---', 3);
  if (endIndex === -1) {
    result.content = content;
    return result;
  }

  // Extract frontmatter and content
  const frontmatterStr = trimmed.slice(3, endIndex).trim();
  result.content = trimmed.slice(endIndex + 3).trim();

  // Parse YAML-like frontmatter
  const lines = frontmatterStr.split('\n');
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Check for array item
    if (trimmedLine.startsWith('- ')) {
      if (currentArray !== null && currentKey) {
        const value = trimmedLine.slice(2).trim().replace(/^["']|["']$/g, '');
        currentArray.push(value);
      }
      continue;
    }

    // Check for key: value pair
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > 0) {
      // Save previous array if exists
      if (currentArray !== null && currentKey) {
        result.data[currentKey] = currentArray;
      }

      const key = trimmedLine.slice(0, colonIndex).trim();
      let value = trimmedLine.slice(colonIndex + 1).trim();

      // Check if value is empty (might be an array)
      if (!value) {
        currentKey = key;
        currentArray = [];
        continue;
      }

      // Remove quotes from value
      value = value.replace(/^["']|["']$/g, '');

      // Convert boolean strings
      if (value === 'true') value = true;
      else if (value === 'false') value = false;

      result.data[key] = value;
      currentKey = null;
      currentArray = null;
    }
  }

  // Save last array if exists
  if (currentArray !== null && currentKey) {
    result.data[currentKey] = currentArray;
  }

  return result;
}

export default parseFrontmatter;
