import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
  Box, Stack, Tooltip, IconButton, Divider, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, FormControl,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ChecklistIcon from '@mui/icons-material/Checklist';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import BorderHorizontalIcon from '@mui/icons-material/BorderHorizontal';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import HighlightIcon from '@mui/icons-material/Highlight';
import type { TextBlock, BlockSettings } from '../../types';

// ── Link dialog ───────────────────────────────────────────────────────────────

const LinkDialog: React.FC<{
  open: boolean;
  initial: string;
  onClose: () => void;
  onConfirm: (url: string) => void;
}> = ({ open, initial, onClose, onConfirm }) => {
  const [url, setUrl] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setUrl(initial); setTimeout(() => inputRef.current?.select(), 80); }
  }, [open, initial]);

  const commit = () => { if (url.trim()) { onConfirm(url.trim()); onClose(); } };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock>
      <DialogTitle sx={{ pb: 1 }}>Insert link</DialogTitle>
      <DialogContent>
        <TextField
          inputRef={inputRef}
          fullWidth size="small" label="URL"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose(); }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={commit} variant="contained" size="small" disabled={!url.trim()}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Toolbar button ────────────────────────────────────────────────────────────

const Btn: React.FC<{
  title: string; active?: boolean; disabled?: boolean;
  onClick: () => void; children: React.ReactNode;
}> = ({ title, active, disabled, onClick, children }) => {
  const theme = useTheme();
  return (
    <Tooltip title={title} placement="top">
      <span>
        <IconButton
          size="small" disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          sx={{
            p: 0.4, borderRadius: 0.75,
            color: active ? 'primary.main' : 'text.secondary',
            bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
};

// ── Toolbar ───────────────────────────────────────────────────────────────────

const HEADING_OPTIONS = [
  { value: 0, label: 'Paragraph' },
  { value: 1, label: 'Heading 1' },
  { value: 2, label: 'Heading 2' },
  { value: 3, label: 'Heading 3' },
];

const Toolbar: React.FC<{
  editor: ReturnType<typeof useEditor>;
  onOpenLinkDialog: () => void;
}> = ({ editor, onOpenLinkDialog }) => {
  if (!editor) return null;

  const currentHeading = HEADING_OPTIONS.find(
    (h) => h.value > 0 && editor.isActive('heading', { level: h.value })
  )?.value ?? 0;

  return (
    <Stack
      direction="row" spacing={0.25} flexWrap="wrap" alignItems="center"
      sx={{ mb: 0.75, p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', gap: 0.25 }}
    >
      {/* Heading selector */}
      <FormControl size="small" sx={{ minWidth: 110 }}>
        <Select
          value={currentHeading}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v === 0) editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: v as 1|2|3 }).run();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{ fontSize: '0.75rem', height: 28, '& .MuiSelect-select': { py: 0.25 } }}
          MenuProps={{ disableScrollLock: true }}
        >
          {HEADING_OPTIONS.map((h) => (
            <MenuItem key={h.value} value={h.value} sx={{ fontSize: '0.8rem' }}>{h.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Inline marks */}
      <Btn title="Bold (Ctrl+B)"      active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}><FormatBoldIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Italic (Ctrl+I)"    active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}><FormatItalicIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><FormatUnderlinedIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Strikethrough"      active={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()}><StrikethroughSIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Highlight"          active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><HighlightIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Subscript"          active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}><Box component="span" sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>x₂</Box></Btn>
      <Btn title="Superscript"        active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}><Box component="span" sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>x²</Box></Btn>
      <Btn title="Inline code"        active={editor.isActive('code')}      onClick={() => editor.chain().focus().toggleCode().run()}><CodeIcon sx={{ fontSize: 16 }} /></Btn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Blocks */}
      <Btn title="Code block"   active={editor.isActive('codeBlock')}  onClick={() => editor.chain().focus().toggleCodeBlock().run()}><DataObjectIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Blockquote"   active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><FormatQuoteIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Divider line" onClick={() => editor.chain().focus().setHorizontalRule().run()}><BorderHorizontalIcon sx={{ fontSize: 16 }} /></Btn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Lists */}
      <Btn title="Bullet list"   active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}><FormatListBulletedIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><FormatListNumberedIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Task list"     active={editor.isActive('taskList')}    onClick={() => editor.chain().focus().toggleTaskList().run()}><ChecklistIcon sx={{ fontSize: 16 }} /></Btn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Alignment */}
      <Btn title="Align left"    active={editor.isActive({ textAlign: 'left' })}    onClick={() => editor.chain().focus().setTextAlign('left').run()}><FormatAlignLeftIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Align center"  active={editor.isActive({ textAlign: 'center' })}  onClick={() => editor.chain().focus().setTextAlign('center').run()}><FormatAlignCenterIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Align right"   active={editor.isActive({ textAlign: 'right' })}   onClick={() => editor.chain().focus().setTextAlign('right').run()}><FormatAlignRightIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Justify"       active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><FormatAlignJustifyIcon sx={{ fontSize: 16 }} /></Btn>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Link */}
      <Btn title="Add / edit link" active={editor.isActive('link')} onClick={onOpenLinkDialog}><LinkIcon sx={{ fontSize: 16 }} /></Btn>
      {editor.isActive('link') && (
        <Btn title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}><LinkOffIcon sx={{ fontSize: 16 }} /></Btn>
      )}

      {/* Text color */}
      <Tooltip title="Text color" placement="top">
        <Box component="label" onMouseDown={(e) => e.preventDefault()} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', px: 0.5 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 0.5, border: '1px solid', borderColor: 'divider', bgcolor: editor.getAttributes('textStyle').color || 'transparent', overflow: 'hidden', position: 'relative' }}>
            <input
              type="color"
              style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }}
              value={editor.getAttributes('textStyle').color || '#000000'}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </Box>
        </Box>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* History */}
      <Btn title="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><UndoIcon sx={{ fontSize: 16 }} /></Btn>
      <Btn title="Redo (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><RedoIcon sx={{ fontSize: 16 }} /></Btn>
    </Stack>
  );
};

// ── Editor ────────────────────────────────────────────────────────────────────

const TextBlockEditor: React.FC<{
  block: TextBlock;
  onChange: (patch: Partial<TextBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange }) => {
  const theme = useTheme();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start typing…' }),
    ],
    content: block.html || '',
    onUpdate: ({ editor }) => onChange({ html: editor.getHTML() }),
  });

  return (
    <Box>
      <Toolbar editor={editor} onOpenLinkDialog={() => setLinkDialogOpen(true)} />

      <Box sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 1,
        '&:focus-within': { borderColor: 'primary.main', boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}` },
        '& .tiptap': {
          p: 1.5, outline: 'none', minHeight: 100,
          fontSize: '0.9rem', lineHeight: 1.7,
          // Headings
          '& h1': { fontSize: '1.6rem', fontWeight: 700, mt: 1, mb: 0.5 },
          '& h2': { fontSize: '1.3rem', fontWeight: 700, mt: 1, mb: 0.5 },
          '& h3': { fontSize: '1.1rem', fontWeight: 700, mt: 1, mb: 0.5 },
          // Lists
          '& ul, & ol': { pl: 3, my: 0.5 },
          '& li': { mb: 0.25 },
          // Task list
          '& ul[data-type="taskList"]': { listStyle: 'none', pl: 1 },
          '& ul[data-type="taskList"] li': { display: 'flex', alignItems: 'flex-start', gap: 1 },
          '& ul[data-type="taskList"] li > label': { mt: 0.25 },
          // Blockquote
          '& blockquote': {
            borderLeft: `3px solid ${theme.palette.primary.main}`,
            pl: 1.5, ml: 0, my: 1,
            color: 'text.secondary', fontStyle: 'italic',
          },
          // Code
          '& code': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main', borderRadius: 0.5,
            px: 0.5, fontFamily: 'monospace', fontSize: '0.85em',
          },
          '& pre': {
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
            borderRadius: 1, p: 1.5, my: 1, overflowX: 'auto',
            '& code': { bgcolor: 'transparent', color: 'inherit', p: 0 },
          },
          // Highlight
          '& mark': { bgcolor: '#fef08a', color: 'inherit', borderRadius: 0.25, px: 0.25 },
          // Links
          '& a': { color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' },
          // HR
          '& hr': { border: 'none', borderTop: `1px solid ${theme.palette.divider}`, my: 1.5 },
          // Placeholder
          '& p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            color: theme.palette.text.disabled,
            pointerEvents: 'none', float: 'left', height: 0,
          },
        },
      }}>
        <EditorContent editor={editor} />
      </Box>

      <LinkDialog
        open={linkDialogOpen}
        initial={editor?.getAttributes('link').href ?? ''}
        onClose={() => setLinkDialogOpen(false)}
        onConfirm={(url) => editor?.chain().focus().setLink({ href: url, target: '_blank' }).run()}
      />
    </Box>
  );
};

export default TextBlockEditor;
