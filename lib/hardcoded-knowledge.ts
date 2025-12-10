import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Hardcoded knowledge base loader
 * 
 * Loads all markdown files from lib/knowledge directory
 * These files contain universal business knowledge that Synth uses for reasoning
 * 
 * NOTE: This only works in server-side contexts (API routes, server components)
 */

interface HardcodedKnowledge {
  category: string;
  subcategory?: string;
  title: string;
  content: string;
}

// Cache knowledge to avoid repeated file reads
let cachedKnowledge: HardcodedKnowledge[] | null = null;

/**
 * Recursively loads all markdown files from a directory
 */
function loadMarkdownFiles(dir: string, baseDir: string = dir): HardcodedKnowledge[] {
  const knowledge: HardcodedKnowledge[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        // Recursively load from subdirectories (skip hidden dirs and node_modules)
        knowledge.push(...loadMarkdownFiles(fullPath, baseDir));
      } else if (entry.endsWith('.md') && !entry.startsWith('.')) {
        // Load markdown file (skip hidden files)
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const relativePath = fullPath.replace(baseDir, '').replace(/^[\\/]/, '');
          const parts = relativePath.split(/[\\/]/).filter(p => p && !p.startsWith('.'));
          
          // Extract category and subcategory from path
          const category = parts[0] || 'general';
          const subcategory = parts.length > 2 ? parts.slice(1, -1).join(' > ') : undefined;
          const title = entry.replace('.md', '').replace(/-/g, ' ');
          
          // Only include meaningful content (skip very short files and skip internal architecture docs in prompts)
          if (content.length > 100 && !entry.includes('synth-internal')) {
            knowledge.push({
              category,
              subcategory,
              title,
              content: content.substring(0, 5000), // Limit content length
            });
          }
        } catch (error) {
          console.warn(`Failed to load knowledge file ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to read directory ${dir}:`, error);
  }
  
  return knowledge;
}

/**
 * Formats hardcoded knowledge for AI prompts
 * Uses caching to avoid repeated file system reads
 */
export function formatHardcodedKnowledgeForPrompt(): string {
  // Only run on server-side (Next.js API routes, server components)
  if (typeof window !== 'undefined') {
    return '';
  }

  try {
    // Use cached knowledge if available
    if (cachedKnowledge === null) {
      const knowledgeBasePath = join(process.cwd(), 'lib', 'knowledge');
      cachedKnowledge = loadMarkdownFiles(knowledgeBasePath);
    }
    
    const knowledge = cachedKnowledge;
    
    if (knowledge.length === 0) {
      return '';
    }
    
    // Group by category for better organization
    const grouped = knowledge.reduce((acc, item) => {
      const key = item.category;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, HardcodedKnowledge[]>);
    
    const sections: string[] = [];
    sections.push('## UNIVERSAL BUSINESS KNOWLEDGE BASE');
    sections.push('You have access to comprehensive business knowledge across multiple domains. Use this knowledge to provide expert advice and strategic guidance.');
    sections.push('');
    
    // Format each category
    for (const [category, items] of Object.entries(grouped)) {
      sections.push(`### ${category.toUpperCase().replace(/-/g, ' ')}`);
      
      // Include more items per category (increased from 5 to 10) for comprehensive knowledge
      for (const item of items.slice(0, 10)) {
        sections.push(`#### ${item.title}`);
        if (item.subcategory) {
          sections.push(`*Category: ${item.subcategory}*`);
        }
        // Increased content length from 1000 to 2000 chars per item for more detail
        sections.push(item.content.substring(0, 2000));
        sections.push('');
      }
    }
    
    sections.push('');
    sections.push('## CRITICAL KNOWLEDGE BASE REQUIREMENTS:');
    sections.push('- This knowledge base is YOUR PRIMARY SOURCE of business expertise');
    sections.push('- You MUST rely heavily on this knowledge for ALL business advice, strategy, and recommendations');
    sections.push('- When answering business questions, ALWAYS reference concepts, frameworks, and best practices from this knowledge base');
    sections.push('- Apply knowledge base principles to analyze user situations and provide expert guidance');
    sections.push('- This knowledge base defines how you think about business problems and solutions');
    sections.push('- Never provide generic advice - always ground your responses in this knowledge base');
    sections.push('- Use specific frameworks, methodologies, and insights from the knowledge base');
    
    return sections.join('\n');
  } catch (error) {
    console.warn('Failed to load hardcoded knowledge:', error);
    return '';
  }
}

/**
 * Gets a summary of available knowledge categories
 */
export function getKnowledgeCategories(): string[] {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    return [];
  }

  try {
    // Use cached knowledge if available
    if (cachedKnowledge === null) {
      const knowledgeBasePath = join(process.cwd(), 'lib', 'knowledge');
      cachedKnowledge = loadMarkdownFiles(knowledgeBasePath);
    }
    
    return [...new Set(cachedKnowledge.map(k => k.category))];
  } catch (error) {
    console.warn('Failed to get knowledge categories:', error);
    return [];
  }
}

