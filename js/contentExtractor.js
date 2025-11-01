/**
 * Content Extractor Module
 * Extracts clean, readable content from web pages
 */

class ContentExtractor {
  constructor() {
    this.minTextLength = 100; // Minimum text length to consider
  }

  /**
   * Extract main content from the current page
   * @returns {Object} Extracted content with metadata
   */
  extractFromCurrentPage() {
    const document = window.document;

    return {
      title: this.extractTitle(document),
      url: window.location.href,
      text: this.extractText(document),
      author: this.extractAuthor(document),
      publishDate: this.extractPublishDate(document),
      excerpt: this.extractExcerpt(document)
    };
  }

  /**
   * Extract title from page
   * @param {Document} doc - Document object
   * @returns {string} Page title
   */
  extractTitle(doc) {
    // Try various meta tags first
    const metaSelectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[name="title"]'
    ];

    for (const selector of metaSelectors) {
      const meta = doc.querySelector(selector);
      if (meta && meta.content) {
        return meta.content.trim();
      }
    }

    // Try article heading
    const h1 = doc.querySelector('article h1, .article h1, main h1, h1');
    if (h1 && h1.textContent) {
      return h1.textContent.trim();
    }

    // Fall back to document title
    return doc.title.trim();
  }

  /**
   * Extract author information
   * @param {Document} doc - Document object
   * @returns {string|null} Author name
   */
  extractAuthor(doc) {
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '[rel="author"]',
      '.author',
      '.byline'
    ];

    for (const selector of authorSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.content || element.textContent;
        if (content) {
          return content.trim();
        }
      }
    }

    return null;
  }

  /**
   * Extract publish date
   * @param {Document} doc - Document object
   * @returns {string|null} Publish date
   */
  extractPublishDate(doc) {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="publish-date"]',
      'time[datetime]',
      '.publish-date',
      '.post-date'
    ];

    for (const selector of dateSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const date = element.content || element.getAttribute('datetime') || element.textContent;
        if (date) {
          return date.trim();
        }
      }
    }

    return null;
  }

  /**
   * Extract excerpt/description
   * @param {Document} doc - Document object
   * @returns {string|null} Excerpt
   */
  extractExcerpt(doc) {
    const excerptSelectors = [
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]'
    ];

    for (const selector of excerptSelectors) {
      const meta = doc.querySelector(selector);
      if (meta && meta.content) {
        return meta.content.trim();
      }
    }

    return null;
  }

  /**
   * Extract main text content from page
   * @param {Document} doc - Document object
   * @returns {string} Extracted text
   */
  extractText(doc) {
    // Try to find main content container
    const contentContainers = [
      'article',
      'main',
      '[role="main"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      '#content'
    ];

    let contentElement = null;

    for (const selector of contentContainers) {
      const element = doc.querySelector(selector);
      if (element && this.getTextLength(element) >= this.minTextLength) {
        contentElement = element;
        break;
      }
    }

    // If no content container found, use body
    if (!contentElement) {
      contentElement = doc.body;
    }

    // Clone element to avoid modifying the page
    const clone = contentElement.cloneNode(true);

    // Clean the content
    this.removeUnwantedElements(clone);

    // Extract text with basic structure
    return this.extractStructuredText(clone);
  }

  /**
   * Remove unwanted elements from content
   * @param {Element} element - Element to clean
   */
  removeUnwantedElements(element) {
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      'iframe',
      'form',
      'button',
      '.advertisement',
      '.ad',
      '.social-share',
      '.comments',
      '.related-posts',
      '.sidebar',
      '[role="navigation"]',
      '[role="complementary"]',
      '[aria-hidden="true"]'
    ];

    unwantedSelectors.forEach(selector => {
      element.querySelectorAll(selector).forEach(el => el.remove());
    });
  }

  /**
   * Extract text while preserving basic structure
   * @param {Element} element - Element to extract from
   * @returns {string} Structured text
   */
  extractStructuredText(element) {
    const lines = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    let currentParagraph = '';

    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          currentParagraph += (currentParagraph ? ' ' : '') + text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // Block elements - finish current paragraph
        if (['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
          if (currentParagraph.trim()) {
            lines.push(currentParagraph.trim());
            currentParagraph = '';
          }

          // Add extra spacing for headings
          if (tagName.startsWith('h')) {
            lines.push(''); // Empty line before heading
          }
        }
      }
    }

    // Add any remaining text
    if (currentParagraph.trim()) {
      lines.push(currentParagraph.trim());
    }

    // Join lines and clean up
    let text = lines.join('\n');

    // Remove excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
    text = text.replace(/  +/g, ' '); // Multiple spaces to single space

    return text.trim();
  }

  /**
   * Get text length of element
   * @param {Element} element - Element to measure
   * @returns {number} Text length
   */
  getTextLength(element) {
    return element.textContent.trim().length;
  }

  /**
   * Estimate reading time
   * @param {string} text - Text to analyze
   * @param {number} wpm - Words per minute (default 150)
   * @returns {number} Reading time in minutes
   */
  estimateReadingTime(text, wpm = 150) {
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wpm);
  }

  /**
   * Get word count
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  getWordCount(text) {
    return text.split(/\s+/).length;
  }

  /**
   * Validate extracted content
   * @param {Object} content - Extracted content
   * @returns {Object} Validation result
   */
  validateContent(content) {
    const issues = [];

    if (!content.text || content.text.length < this.minTextLength) {
      issues.push('Content too short or empty');
    }

    if (!content.title) {
      issues.push('Title not found');
    }

    const wordCount = this.getWordCount(content.text);
    if (wordCount < 50) {
      issues.push('Word count too low');
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      wordCount: wordCount,
      readingTime: this.estimateReadingTime(content.text)
    };
  }

  /**
   * Extract content with validation
   * @returns {Object} Extracted and validated content
   */
  extract() {
    const content = this.extractFromCurrentPage();
    const validation = this.validateContent(content);

    return {
      ...content,
      validation: validation,
      wordCount: validation.wordCount,
      readingTime: validation.readingTime
    };
  }

  /**
   * Check if current page is suitable for conversion
   * @returns {Object} Suitability check result
   */
  checkPageSuitability() {
    const content = this.extract();

    if (!content.validation.valid) {
      return {
        suitable: false,
        reason: content.validation.issues.join(', '),
        content: null
      };
    }

    if (content.wordCount < 100) {
      return {
        suitable: false,
        reason: 'Content too short for meaningful conversion',
        content: content
      };
    }

    if (content.wordCount > 10000) {
      return {
        suitable: true,
        warning: 'Content is very long and may take time to process',
        content: content
      };
    }

    return {
      suitable: true,
      content: content
    };
  }
}

// Export singleton instance (use window to avoid redeclaration)
if (typeof window !== 'undefined') {
  window.contentExtractor = window.contentExtractor || new ContentExtractor();
}
