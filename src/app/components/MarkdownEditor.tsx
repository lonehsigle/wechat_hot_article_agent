'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const safeSanitize = (html: string): string => {
  if (typeof window === 'undefined') return html;
  try { return DOMPurify.sanitize(html); } catch { return html; }
};

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
}

const toolbarButtons = [
  { icon: 'B', title: '粗体', prefix: '**', suffix: '**' },
  { icon: 'I', title: '斜体', prefix: '*', suffix: '*' },
  { icon: 'H', title: '标题', prefix: '## ', suffix: '' },
  { icon: '•', title: '列表', prefix: '- ', suffix: '' },
  { icon: '1.', title: '有序列表', prefix: '1. ', suffix: '' },
  { icon: '❝', title: '引用', prefix: '> ', suffix: '' },
  { icon: '🔗', title: '链接', prefix: '[', suffix: '](url)' },
  { icon: '🖼', title: '图片', prefix: '![', suffix: '](url)' },
  { icon: '—', title: '分割线', prefix: '\n---\n', suffix: '' },
  { icon: '`', title: '代码', prefix: '`', suffix: '`' },
];

export default function MarkdownEditor({ 
  value, 
  onChange, 
  height = '400px',
  placeholder = '请输入内容...'
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const insertText = useCallback((prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    const newText = localValue.substring(0, start) + prefix + selectedText + suffix + localValue.substring(end);
    
    handleChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  }, [localValue, handleChange]);

  const renderPreview = useCallback((markdown: string) => {
    try {
      return marked.parse(markdown, {
        gfm: true,
        breaks: true,
      }) as string;
    } catch {
      return markdown;
    }
  }, []);

  return (
    <div style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      overflow: 'hidden',
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: height,
    }}>
      {/* 工具栏 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        gap: '4px',
        flexWrap: 'wrap',
      }}>
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => insertText(btn.prefix, btn.suffix)}
            title={btn.title}
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: btn.icon === 'B' ? 'bold' : btn.icon === 'I' ? 'normal' : 'normal',
              fontStyle: btn.icon === 'I' ? 'italic' : 'normal',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {btn.icon}
          </button>
        ))}
        
        <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb', margin: '0 8px' }} />
        
        {/* 模式切换 */}
        <button
          onClick={() => setMode('edit')}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: mode === 'edit' ? '#E8652D' : '#e5e7eb',
            color: mode === 'edit' ? '#fff' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          编辑
        </button>
        <button
          onClick={() => setMode('preview')}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: mode === 'preview' ? '#E8652D' : '#e5e7eb',
            color: mode === 'preview' ? '#fff' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          预览
        </button>
        <button
          onClick={() => setMode('split')}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: mode === 'split' ? '#E8652D' : '#e5e7eb',
            color: mode === 'split' ? '#fff' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          分屏
        </button>
      </div>

      {/* 编辑区域 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
      }}>
        {/* 编辑框 */}
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: mode === 'split' ? 1 : 1,
              width: '100%',
              padding: '16px',
              border: mode === 'split' ? 'right: 1px solid #e5e7eb' : 'none',
              fontSize: '14px',
              lineHeight: '1.8',
              resize: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              outline: 'none',
              backgroundColor: '#fafafa',
            }}
          />
        )}

        {/* 预览框 */}
        {(mode === 'preview' || mode === 'split') && (
          <div 
            style={{ 
              flex: mode === 'split' ? 1 : 1,
              padding: '16px',
              overflow: 'auto',
              backgroundColor: '#fff',
            }}
          >
            {localValue ? (
              <div 
                dangerouslySetInnerHTML={{ __html: safeSanitize(renderPreview(localValue)) }}
                className="markdown-preview"
              />
            ) : (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>
                预览区域
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .markdown-preview h1 { font-size: 24px; font-weight: 700; margin: 16px 0 12px; color: #1f2937; }
        .markdown-preview h2 { font-size: 20px; font-weight: 600; margin: 14px 0 10px; color: #1f2937; }
        .markdown-preview h3 { font-size: 18px; font-weight: 600; margin: 12px 0 8px; color: #374151; }
        .markdown-preview p { margin: 8px 0; line-height: 1.8; color: #374151; }
        .markdown-preview ul, .markdown-preview ol { margin: 8px 0; padding-left: 24px; }
        .markdown-preview li { margin: 4px 0; line-height: 1.6; }
        .markdown-preview blockquote { 
          margin: 12px 0; 
          padding: 8px 16px; 
          border-left: 4px solid #E8652D; 
          background-color: #f3f4f6; 
          color: #4b5563;
        }
        .markdown-preview code { 
          background-color: #f3f4f6; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-family: Monaco, monospace;
          font-size: 13px;
        }
        .markdown-preview pre { 
          background-color: #1f2937; 
          color: #e5e7eb; 
          padding: 12px 16px; 
          border-radius: 6px; 
          overflow-x: auto;
          margin: 12px 0;
        }
        .markdown-preview pre code { 
          background-color: transparent; 
          padding: 0; 
          color: inherit;
        }
        .markdown-preview a { color: #E8652D; text-decoration: none; }
        .markdown-preview a:hover { text-decoration: underline; }
        .markdown-preview img { 
          max-width: 100%; 
          height: auto; 
          border-radius: 8px; 
          margin: 12px 0; 
          display: block;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          background-color: #f9fafb;
        }
        .markdown-preview hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
        .markdown-preview strong { font-weight: 600; color: #1f2937; }
        .markdown-preview em { font-style: italic; }
        .markdown-preview table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .markdown-preview th, .markdown-preview td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
        .markdown-preview th { background-color: #f9fafb; font-weight: 600; }
      `}</style>
    </div>
  );
}
