import { Injectable } from '@angular/core';
import { marked } from 'marked';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  constructor() {
    
    marked.setOptions({
      breaks: true, 
      gfm: true, 
      silent: true 
    });
  }

  
  parseMarkdown(markdownText: string): string {
    if (!markdownText) {
      return '';
    }

    try {
      
      let processedText = this.preprocessMarkdown(markdownText);
      
      const html = marked.parse(processedText) as string;
      
      return this.sanitizeHtml(html);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      
      return markdownText;
    }
  }

   
  private preprocessMarkdown(text: string): string {
   
    let processed = text;
    
  
    
   
    processed = processed.replace(/(^|\n)(#{1,6}\s[^\n]*)/g, '\n\n$2\n');
    
   
    processed = processed.replace(/(^|\n)([-*+]\s[^\n]*)/g, '\n$2');
    processed = processed.replace(/(^|\n)(\d+\.\s[^\n]*)/g, '\n$2');
    
   
    processed = processed.replace(/(^|\n)(>\s[^\n]*)/g, '\n\n$2\n');
    
   
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
   
    processed = processed.trim();
    
    return processed;
  }

 
  private sanitizeHtml(html: string): string {
  
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
 
    html = html.replace(/\s*(on\w+|javascript:|data:)\s*=\s*["'][^"']*["']/gi, '');
    
 
    const dangerousTags = ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
      html = html.replace(regex, '');
    });

    return html;
  }

 
  hasMarkdownSyntax(text: string): boolean {
    if (!text) return false;

    const markdownPatterns = [
      /\*\*.*?\*\*/, 
      /(?<!\*)\*(?!\*).*?(?<!\*)\*(?!\*)/, 
      /`[^`]+`/, 
      /(^|\n)#{1,6}\s+.+/m, 
      /(^|\n)\s*[-*+]\s+.+/m, 
      /(^|\n)\s*\d+\.\s+.+/m, 
      /\[([^\]]+)\]\(([^)]+)\)/, 
      /!\[([^\]]*)\]\(([^)]+)\)/, 
      /(^|\n)\s*>\s+.+/m, 
      /(^|\n)\s*---+\s*$/m, 
      /```[\s\S]*?```/, 
      /(^|\n)\s*\|.+\|/m,
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  }
} 