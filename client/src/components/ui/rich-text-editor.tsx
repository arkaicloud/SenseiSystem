import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { isValidURL } from '@/lib/htmlUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image,
  Link,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState('');
  const { toast } = useToast();

  // Execute command and update content
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  }, []);

  // Update content and notify parent
  const updateContent = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  // Handle input changes
  const handleInput = useCallback(() => {
    updateContent();
  }, [updateContent]);

  // Format text with specific styles
  const formatText = (command: string, value?: string) => {
    executeCommand(command, value);
    editorRef.current?.focus();
  };

  // Handle font size change
  const handleFontSizeChange = (size: string) => {
    executeCommand('fontSize', size);
    editorRef.current?.focus();
  };

  // Handle text color change
  const handleTextColor = (color: string) => {
    executeCommand('foreColor', color);
    editorRef.current?.focus();
  };

  // Handle background color change
  const handleBackgroundColor = (color: string) => {
    executeCommand('hiliteColor', color);
    editorRef.current?.focus();
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        executeCommand('insertImage', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle link insertion with URL validation
  const handleLinkInsert = () => {
    if (!linkUrl) {
      setLinkError('Por favor, insira uma URL válida');
      return;
    }

    // Clear previous errors
    setLinkError('');

    // Validate URL for security
    if (!isValidURL(linkUrl)) {
      setLinkError('URL inválida. Use apenas http://, https://, mailto: ou tel:');
      toast({
        title: "URL Inválida",
        description: "Por segurança, apenas URLs com protocolos seguros são permitidas.",
        variant: "destructive"
      });
      return;
    }

    // Normalize URL - add https:// if no protocol specified
    let normalizedUrl = linkUrl.trim();
    if (!normalizedUrl.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      normalizedUrl = 'https://' + normalizedUrl;
      
      // Re-validate normalized URL
      if (!isValidURL(normalizedUrl)) {
        setLinkError('Não foi possível normalizar a URL. Verifique o formato.');
        return;
      }
    }

    try {
      if (linkText) {
        // Use manual HTML construction with escaping
        const escapedText = linkText.replace(/[<>&"']/g, (match) => {
          const escapeMap: { [key: string]: string } = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#39;'
          };
          return escapeMap[match];
        });
        
        const linkHtml = `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${escapedText}</a>`;
        executeCommand('insertHTML', linkHtml);
      } else {
        executeCommand('createLink', normalizedUrl);
        
        // Ensure created link has security attributes
        setTimeout(() => {
          const links = editorRef.current?.querySelectorAll('a[href]:not([target])');
          links?.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          });
        }, 100);
      }
      
      // Success - clear form and close dialog
      setLinkUrl('');
      setLinkText('');
      setLinkError('');
      setIsLinkDialogOpen(false);
      editorRef.current?.focus();
      
      toast({
        title: "Link inserido",
        description: "Link seguro foi adicionado com sucesso.",
      });
      
    } catch (error) {
      setLinkError('Erro ao inserir link. Tente novamente.');
      toast({
        title: "Erro",
        description: "Não foi possível inserir o link. Verifique a URL e tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Handle URL input change with real-time validation
  const handleUrlChange = (value: string) => {
    setLinkUrl(value);
    
    // Clear error when user starts typing
    if (linkError) {
      setLinkError('');
    }
    
    // Real-time validation feedback (non-blocking)
    if (value && !isValidURL(value) && !value.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
      // Try with https:// prefix
      const testUrl = 'https://' + value;
      if (!isValidURL(testUrl)) {
        setLinkError('URL pode não ser válida - verifique o formato');
      }
    }
  };

  // Initialize content when component mounts
  React.useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Color options for quick selection
  const textColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#008000', '#ffc0cb', '#a52a2a', '#808080', '#000080'
  ];

  const backgroundColors = [
    'transparent', '#ffff99', '#ffcc99', '#ff99cc', '#cc99ff',
    '#99ccff', '#99ffcc', '#ccffcc', '#ffcccc', '#ccccff',
    '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0', '#b0b0b0'
  ];

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        {/* Undo/Redo */}
        <div className="flex gap-1 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('undo')}
            data-testid="button-undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('redo')}
            data-testid="button-redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mr-2" />

        {/* Font Size */}
        <Select onValueChange={handleFontSizeChange}>
          <SelectTrigger className="w-16 h-8" data-testid="select-fontsize">
            <SelectValue placeholder="T" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">10px</SelectItem>
            <SelectItem value="2">13px</SelectItem>
            <SelectItem value="3">16px</SelectItem>
            <SelectItem value="4">18px</SelectItem>
            <SelectItem value="5">24px</SelectItem>
            <SelectItem value="6">32px</SelectItem>
            <SelectItem value="7">48px</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Basic Formatting */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            data-testid="button-italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            data-testid="button-underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Text Color */}
        <div className="flex gap-1">
          <Select onValueChange={handleTextColor}>
            <SelectTrigger className="w-10 h-8 p-1" data-testid="select-textcolor">
              <Type className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <div className="grid grid-cols-5 gap-1 p-2">
                {textColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>

          {/* Background Color */}
          <Select onValueChange={handleBackgroundColor}>
            <SelectTrigger className="w-10 h-8 p-1" data-testid="select-bgcolor">
              <Palette className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <div className="grid grid-cols-5 gap-1 p-2">
                {backgroundColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-300"
                      style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                    />
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Alignment */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyLeft')}
            data-testid="button-align-left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyCenter')}
            data-testid="button-align-center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyRight')}
            data-testid="button-align-right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Lists */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertUnorderedList')}
            data-testid="button-list-bullet"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertOrderedList')}
            data-testid="button-list-ordered"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Media & Links */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-image"
          >
            <Image className="h-4 w-4" />
          </Button>

          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="button-link"
              >
                <Link className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inserir Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="linkUrl">URL do Link</Label>
                  <Input
                    id="linkUrl"
                    value={linkUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://exemplo.com ou exemplo.com"
                    data-testid="input-link-url"
                    className={linkError ? 'border-red-500' : ''}
                  />
                  {linkError && (
                    <p className="text-sm text-red-500 mt-1">{linkError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Protocolos permitidos: http, https, mailto, tel
                  </p>
                </div>
                <div>
                  <Label htmlFor="linkText">Texto do Link (opcional)</Label>
                  <Input
                    id="linkText"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Clique aqui"
                    data-testid="input-link-text"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLinkDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleLinkInsert}
                    data-testid="button-insert-link"
                  >
                    Inserir Link
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
          data-testid="input-image"
        />
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[200px] p-4 prose prose-sm max-w-none focus:outline-none"
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
        data-testid="editor-content"
      />

      {/* CSS for placeholder styling */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 2em;
        }
        [contenteditable] li {
          margin-bottom: 0.25em;
        }
      `}</style>
    </div>
  );
}