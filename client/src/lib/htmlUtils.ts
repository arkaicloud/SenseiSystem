/**
 * Utility functions for HTML content manipulation and rendering
 */

/**
 * Extracts clean text from HTML content, removing all HTML tags
 * Used for previews in lists where we want plain text only
 */
export function extractTextFromHTML(html: string): string {
  if (!html) return '';
  
  // Use DOMParser for safe HTML parsing without script execution
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Get text content and clean up whitespace
  const text = doc.body.textContent || doc.body.innerText || '';
  
  // Replace multiple whitespace with single spaces and trim
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Truncates text to a specified length with ellipsis
 * Used for preview text in communication lists
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) return text;
  
  // Find the last space before maxLength to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}

/**
 * Creates a preview text from HTML content
 * Combines text extraction and truncation
 */
export function createPreviewText(html: string, maxLength: number = 150): string {
  const cleanText = extractTextFromHTML(html);
  return truncateText(cleanText, maxLength);
}

/**
 * List of allowed HTML tags for rich text content
 * Using allowlist approach for maximum security
 */
const ALLOWED_TAGS = [
  'p', 'div', 'span', 'br',
  'b', 'i', 'u', 'strong', 'em',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
];

/**
 * List of allowed attributes per tag
 * Only safe attributes are permitted
 */
const ALLOWED_ATTRIBUTES: { [key: string]: string[] } = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'p': ['class'],
  'div': ['class'],
  'span': ['class'],
  'h1': ['class'], 'h2': ['class'], 'h3': ['class'],
  'h4': ['class'], 'h5': ['class'], 'h6': ['class'],
  'ul': ['class'], 'ol': ['class'], 'li': ['class'],
  'blockquote': ['class'], 'code': ['class'], 'pre': ['class'],
  'table': ['class'], 'thead': ['class'], 'tbody': ['class'],
  'tr': ['class'], 'th': ['class'], 'td': ['class']
};

/**
 * List of safe URL protocols
 * Blocks javascript:, data:, vbscript: and other dangerous protocols
 */
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Validates if a URL has a safe protocol
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Handle relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    
    // Check absolute URLs
    const urlObj = new URL(url);
    return SAFE_PROTOCOLS.includes(urlObj.protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Sanitizes HTML content using robust allowlist-based approach
 * Provides maximum security against XSS attacks while preserving formatting
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // Use DOMParser for safe HTML parsing without script execution
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tempDiv = doc.body;
  
  // Process all elements recursively
  function sanitizeElement(element: Element): Element | null {
    const tagName = element.tagName.toLowerCase();
    
    // Remove disallowed tags entirely
    if (!ALLOWED_TAGS.includes(tagName)) {
      return null;
    }
    
    // Create new clean element
    const cleanElement = document.createElement(tagName);
    
    // Handle allowed attributes
    const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];
    Array.from(element.attributes).forEach(attr => {
      if (allowedAttrs.includes(attr.name.toLowerCase())) {
        let attrValue = attr.value;
        
        // Special handling for URLs
        if (attr.name === 'href' || attr.name === 'src') {
          if (!isValidURL(attrValue)) {
            return; // Skip invalid URLs
          }
          
          // Force secure attributes for links
          if (attr.name === 'href' && tagName === 'a') {
            cleanElement.setAttribute('target', '_blank');
            cleanElement.setAttribute('rel', 'noopener noreferrer');
          }
        }
        
        // Set the attribute
        cleanElement.setAttribute(attr.name, attrValue);
      }
    });
    
    // Process child nodes
    Array.from(element.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        // Keep text nodes as-is
        cleanElement.appendChild(child.cloneNode(true));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // Recursively sanitize child elements
        const sanitizedChild = sanitizeElement(child as Element);
        if (sanitizedChild) {
          cleanElement.appendChild(sanitizedChild);
        }
      }
    });
    
    return cleanElement;
  }
  
  // Create container for sanitized content
  const sanitizedDiv = document.createElement('div');
  
  // Process all child elements
  Array.from(tempDiv.childNodes).forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      sanitizedDiv.appendChild(child.cloneNode(true));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const sanitizedChild = sanitizeElement(child as Element);
      if (sanitizedChild) {
        sanitizedDiv.appendChild(sanitizedChild);
      }
    }
  });
  
  return sanitizedDiv.innerHTML;
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use sanitizeHTML instead
 */
export function sanitizeHTMLSecure(html: string): string {
  return sanitizeHTML(html);
}

/**
 * Enhanced HTML content component for rendering rich text
 * Provides proper styling and responsive behavior
 */
export interface RichContentProps {
  content: string;
  className?: string;
}

/**
 * CSS classes for rendering HTML content with proper styling
 */
export const richContentStyles = `
  /* Base prose styling */
  .rich-content {
    line-height: 1.7;
    color: inherit;
  }

  /* Headings */
  .rich-content h1, .rich-content h2, .rich-content h3, 
  .rich-content h4, .rich-content h5, .rich-content h6 {
    font-weight: 600;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    line-height: 1.25;
  }

  .rich-content h1 { font-size: 2em; }
  .rich-content h2 { font-size: 1.5em; }
  .rich-content h3 { font-size: 1.25em; }
  .rich-content h4 { font-size: 1.1em; }

  /* Paragraphs */
  .rich-content p {
    margin-bottom: 1em;
  }

  /* Lists */
  .rich-content ul, .rich-content ol {
    margin-bottom: 1em;
    padding-left: 2em;
  }

  .rich-content li {
    margin-bottom: 0.5em;
  }

  .rich-content ul li {
    list-style-type: disc;
  }

  .rich-content ol li {
    list-style-type: decimal;
  }

  /* Links */
  .rich-content a {
    color: #3b82f6;
    text-decoration: underline;
    transition: color 0.2s;
  }

  .rich-content a:hover {
    color: #1d4ed8;
  }

  /* Images */
  .rich-content img {
    max-width: 100%;
    height: auto;
    border-radius: 0.75rem;
    margin: 2em auto;
    display: block;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .rich-content img:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .rich-content img.image-zoomable::after {
    content: "🔍";
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .rich-content img.image-zoomable:hover::after {
    opacity: 1;
  }

  /* Custom scrollbar styles */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(107, 114, 128, 0.7);
  }

  .custom-scrollbar-sm {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
  }

  .custom-scrollbar-sm::-webkit-scrollbar {
    width: 4px;
  }

  .custom-scrollbar-sm::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar-sm::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 2px;
  }

  .custom-scrollbar-sm::-webkit-scrollbar-thumb:hover {
    background-color: rgba(107, 114, 128, 0.5);
  }

  /* Mobile optimization */
  @media (max-width: 640px) {
    .rich-content img {
      border-radius: 0.5rem;
      margin: 1em auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    .rich-content img:hover {
      transform: scale(1.01);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
  }

  /* Text formatting */
  .rich-content strong, .rich-content b {
    font-weight: 600;
  }

  .rich-content em, .rich-content i {
    font-style: italic;
  }

  .rich-content u {
    text-decoration: underline;
  }

  /* Block quotes */
  .rich-content blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1em;
    margin: 1em 0;
    font-style: italic;
    color: #6b7280;
  }

  /* Code */
  .rich-content code {
    background-color: #f3f4f6;
    padding: 0.125em 0.25em;
    border-radius: 0.25rem;
    font-size: 0.875em;
    font-family: ui-monospace, SFMono-Regular, Monaco, Consolas, monospace;
  }

  .rich-content pre {
    background-color: #f3f4f6;
    padding: 1em;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1em 0;
  }

  .rich-content pre code {
    background: none;
    padding: 0;
  }

  /* Tables */
  .rich-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
  }

  .rich-content th, .rich-content td {
    border: 1px solid #e5e7eb;
    padding: 0.5em;
    text-align: left;
  }

  .rich-content th {
    background-color: #f9fafb;
    font-weight: 600;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .rich-content {
      font-size: 0.9em;
    }

    .rich-content ul, .rich-content ol {
      padding-left: 1.5em;
    }

    .rich-content img {
      margin: 0.75em 0;
    }
  }

  /* Dark mode support */
  .dark .rich-content blockquote {
    border-left-color: #374151;
    color: #9ca3af;
  }

  .dark .rich-content code {
    background-color: #1f2937;
  }

  .dark .rich-content pre {
    background-color: #1f2937;
  }

  .dark .rich-content th {
    background-color: #1f2937;
  }

  .dark .rich-content th, .dark .rich-content td {
    border-color: #374151;
  }
`;