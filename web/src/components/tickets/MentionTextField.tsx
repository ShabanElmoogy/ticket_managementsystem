import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, TextField, Paper, List, ListItemButton,
  ListItemAvatar, Avatar, ListItemText, Typography,
} from '@mui/material';

export interface MentionUser {
  id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  users: MentionUser[];
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
}

const MentionTextField: React.FC<Props> = ({
  value, onChange, onKeyDown, users, placeholder, minRows = 2, maxRows = 6, disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);

  // Keep valueRef in sync so handlePick always has latest value
  useEffect(() => { valueRef.current = value; }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\S*)$/);
    if (match) {
      const q = match[1].toLowerCase();
      setSuggestions(q === '' ? users.slice(0, 6) : users.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6));
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handlePick = useCallback((user: MentionUser) => {
    const el = textareaRef.current;
    const current = valueRef.current;
    const cursor = el?.selectionStart ?? current.length;
    const textBefore = current.slice(0, cursor);
    const textAfter = current.slice(cursor);
    const replaced = textBefore.replace(/@\S*$/, `@${user.name} `);
    const newVal = replaced + textAfter;
    onChange(newVal);
    setOpen(false);
    setTimeout(() => {
      if (el) {
        el.focus();
        const pos = replaced.length;
        el.setSelectionRange(pos, pos);
      }
    }, 0);
  }, [onChange]);

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        multiline
        minRows={minRows}
        maxRows={maxRows}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        inputRef={textareaRef}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />

      {open && suggestions.length > 0 && (
        <Paper
          elevation={4}
          sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1300, mt: 0.5, borderRadius: 2, overflow: 'hidden' }}
        >
          <List dense disablePadding>
            {suggestions.map((u) => (
              <ListItemButton
                key={u.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handlePick(u);
                }}
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={u.name}
                  slotProps={{ primary: { variant: 'body2', fontWeight: 600 } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export const renderWithMentions = (content: string, knownUsers: MentionUser[]) => {
  const parts = content.split(/(@\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const name = part.slice(1);
      const matched = knownUsers.some((u) => u.name.toLowerCase() === name.toLowerCase());
      if (matched) {
        return (
          <Typography key={i} component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {part}
          </Typography>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
};

/** Returns the list of MentionUser objects found in the content string. */
export const extractMentionedUsers = (content: string, knownUsers: MentionUser[]): MentionUser[] => {
  const matches = content.match(/@(\S+)/g) ?? [];
  const result: MentionUser[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const name = m.slice(1);
    const user = knownUsers.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (user && !seen.has(user.id)) {
      seen.add(user.id);
      result.push(user);
    }
  }
  return result;
};

export default MentionTextField;
