import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, MenuItem, CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantFormSchema } from '../schemas/tenantSchema';
import type { TenantFormDialogProps, TenantFormValues } from '../types/types';

const PLANS = ['FREE', 'PRO', 'ENTERPRISE'];
const STATUSES = ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'];

const DEFAULT: TenantFormValues = {
  name: '', slug: '', subscriptionPlan: 'FREE',
  subscriptionStatus: 'ACTIVE', subscriptionSeats: 0,
  subscriptionStart: '', subscriptionEnd: '',
};

const TenantFormDialog: React.FC<TenantFormDialogProps> = ({
  open, editing = false, initialValues, onClose, onSubmit, submitting = false,
}) => {
  const { register, handleSubmit, reset, control, formState: { errors, isValid } } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    mode: 'onChange',
    defaultValues: initialValues ?? DEFAULT,
  });

  useEffect(() => {
    if (open) reset(initialValues ?? DEFAULT);
  }, [open, initialValues, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Tenant' : 'Create Tenant'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            {...register('name')}
            required
            fullWidth
            autoFocus
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Slug (auto-generated if empty)"
            {...register('slug')}
            fullWidth
            error={!!errors.slug}
            helperText={errors.slug?.message ?? 'Lowercase letters, numbers and hyphens only'}
          />

          <Controller
            name="subscriptionPlan"
            control={control}
            render={({ field }) => (
              <TextField select label="Subscription Plan" {...field} fullWidth>
                {PLANS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            )}
          />

          <Controller
            name="subscriptionStatus"
            control={control}
            render={({ field }) => (
              <TextField select label="Subscription Status" {...field} fullWidth>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            )}
          />

          <TextField
            label="Seats"
            type="number"
            {...register('subscriptionSeats')}
            fullWidth
            inputProps={{ min: 0 }}
            error={!!errors.subscriptionSeats}
            helperText={errors.subscriptionSeats?.message}
          />

          <TextField
            label="Subscription Start"
            type="date"
            {...register('subscriptionStart')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Subscription End"
            type="date"
            {...register('subscriptionEnd')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : undefined}
        >
          {editing ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TenantFormDialog;
