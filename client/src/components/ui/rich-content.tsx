import React, { useMemo, useEffect, useRef, useState } from 'react';
import { sanitizeHTML, richContentStyles } from '@/lib/htmlUtils';
import { ImageViewer } from './image-viewer';

interface RichContentProps {
  content: string;
  className?: string;
  maxLength?: number;
  showLoadingState?: boolean;
}

// Global flag to track if styles have been injected
let stylesInjected = false;

/**
 * Inject rich content styles only once to prevent duplication
 */
function injectStylesOnce() {
  if (stylesInjected) return;
  
  const styleId = 'rich-content-styles';
  
  // Check if styles already exist
  if (document.getElementById(styleId)) {
    stylesInjected = true;
    return;
  }
  
  // Create and inject style element
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = richContentStyles;
  document.head.appendChild(styleElement);
  
  stylesInjected = true;
}

/**
 * Component for safely rendering HTML content with proper styling
 * Used in student notices to display rich text content from admin
 * 
 * SECURITY FEATURES:
 * - Uses robust allowlist-based HTML sanitization
 * - Blocks dangerous protocols (javascript:, data:, vbscript:)
 * - Forces secure link attributes (rel="noopener noreferrer", target="_blank")
 * - Removes potentially dangerous tags and attributes
 */
export function RichContent({ 
  content, 
  className = '', 
  maxLength,
  showLoadingState = false 
}: RichContentProps) {
  // Inject styles once on mount
  useEffect(() => {
    injectStylesOnce();
  }, []);

  // Memoize sanitization for performance
  const sanitizedContent = useMemo(() => {
    if (!content) return '';
    
    let processedContent = content;
    
    // Apply length limit if specified
    if (maxLength && content.length > maxLength) {
      // Truncate while trying to preserve HTML structure
      processedContent = content.substring(0, maxLength);
      
      // Add ellipsis if content was truncated
      if (content.length > maxLength) {
        processedContent += '...';
      }
    }
    
    // Apply security sanitization
    return sanitizeHTML(processedContent);
  }, [content, maxLength]);

  // Show loading state if requested
  if (showLoadingState && !content) {
    return (
      <div className={`rich-content-loading ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Handle empty content
  if (!sanitizedContent.trim()) {
    return (
      <div 
        className={`rich-content-empty text-muted-foreground italic ${className}`}
        data-testid="rich-content-empty"
      >
        Nenhum conteúdo disponível
      </div>
    );
  }

  const contentRef = useRef<HTMLDivElement>(null);
  const [imageModal, setImageModal] = useState<{ src: string; alt: string } | null>(null);

  // Add click handlers to images after content is rendered
  useEffect(() => {
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      images.forEach((img) => {
        img.classList.add('image-zoomable');
        img.addEventListener('click', () => {
          setImageModal({
            src: img.src,
            alt: img.alt || 'Imagem'
          });
        });
      });
      
      return () => {
        images.forEach((img) => {
          img.removeEventListener('click', () => {});
        });
      };
    }
  }, [sanitizedContent]);

  return (
    <>
      <div 
        ref={contentRef}
        className={`rich-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        data-testid="rich-content"
        // Add security headers as data attributes for debugging
        data-sanitized="true"
        data-content-length={content?.length || 0}
      />
      
      {/* Image Modal */}
      {imageModal && (
        <ImageViewer
          src={imageModal.src}
          alt={imageModal.alt}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClose={() => setImageModal(null)}
        />
      )}
    </>
  );
}

/**
 * Hook for rich content utilities
 * Provides helper functions for working with rich content
 */
export function useRichContent() {
  return {
    sanitizeHTML,
    injectStyles: injectStylesOnce,
    // Helper to check if content has rich formatting
    hasRichFormatting: (content: string): boolean => {
      if (!content) return false;
      const htmlTags = /<\/?[a-z][\s\S]*>/i;
      return htmlTags.test(content);
    },
    // Helper to get plain text from rich content
    getPlainText: (content: string): string => {
      if (!content) return '';
      // Use DOMParser for safe HTML parsing without innerHTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizeHTML(content), 'text/html');
      return doc.body.textContent || doc.body.innerText || '';
    }
  };
}