import { useRef, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, FormControl, InputLabel, Select,
  MenuItem, FormControlLabel, Checkbox, Switch, Radio, RadioGroup,
  FormLabel, FormHelperText, Slider, Typography, Chip, Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useForm, Controller } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodSchema } from "zod";
import LoadingButton from "../buttons/AppButton";
import MySelect from "../inputs/AppSelect";
import AppTextField from "../inputs/AppTextField";
import { getPickerDateFormat } from "../../../stores/tenantStore";

export interface SelectOption {
  value: string | number | boolean;
  label: string;
}

export interface FormField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: "text" | "multiline" | "select" | "customSelect" | "multiSelect" | "datepicker" | "checkbox" | "switch" | "radio" | "number" | "email" | "password" | "date" | "datetime-local" | "slider";
  required?: boolean;
  rows?: number;
  autoFocus?: boolean;
  options?: SelectOption[]; // For select/radio/customSelect/multiSelect fields
  width?: 1 | 2 | 3; // Fields per row: 1=full, 2=half, 3=third
  min?: number; // For number/slider fields
  max?: number; // For number/slider fields
  step?: number; // For number/slider fields
  dependsOn?: Path<T>; // Field this depends on (for dynamic behavior)
  disabled?: (values: T) => boolean; // Dynamic disabled state
  filterOptions?: (options: SelectOption[], values: T) => SelectOption[]; // Filter options based on form values
  onClear?: () => void; // For customSelect clear button
  dateFormat?: string; // For datepicker format
  renderChip?: (value: string | number, options: SelectOption[]) => string; // For multiSelect chip labels
  maxLength?: number; // For text fields — shows counter chip, blocks input at limit
}

export interface ReusableFormDialogProps<T extends FieldValues> {
  open: boolean;
  title: string;
  editing?: boolean;
  schema: ZodSchema<T>;
  fields: FormField<T>[];
  initialValues?: T;
  onClose: () => void;
  onSubmit: (values: T) => void;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

function ReusableFormDialog<T extends FieldValues>({
  open,
  title,
  editing = false,
  schema,
  fields,
  initialValues,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  cancelLabel = "Cancel",
}: ReusableFormDialogProps<T>) {
  const autoFocusRef = useRef<HTMLInputElement>(null);
  const autoFocusField = fields.find(f => f.autoFocus);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    mode: "onChange",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: initialValues as any,
  });

  const formValues = watch();

  useEffect(() => {
    if (open) {
      reset(initialValues);
      if (autoFocusField) {
        const timer = setTimeout(() => {
          autoFocusRef.current?.focus();
          autoFocusRef.current?.select();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [open, initialValues, reset, autoFocusField]);

  const submit = handleSubmit(onSubmit);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableScrollLock>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {fields.map((field) => {
            const gridSize = field.width === 3 ? 4 : field.width === 2 ? 6 : 12;

            let fieldComponent;

            switch (field.type) {
              case "select":
                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl fullWidth error={!!errors[field.name]} disabled={submitting}>
                        <InputLabel required={field.required}>{field.label}</InputLabel>
                        <Select
                          {...controllerField}
                          label={field.label}
                          autoFocus={field.autoFocus}
                        >
                          {field.options?.map((option) => (
                            <MenuItem key={String(option.value)} value={String(option.value)}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors[field.name] && (
                          <FormHelperText>{errors[field.name]?.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
                break;

              case "customSelect":
                const filteredOptions = field.filterOptions
                  ? field.filterOptions(field.options || [], formValues)
                  : field.options || [];
                const isDisabled = field.disabled ? field.disabled(formValues) : false;

                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl fullWidth required={field.required} disabled={isDisabled || submitting}>
                        <InputLabel>{field.label}</InputLabel>
                        <MySelect
                          label={field.label}
                          value={controllerField.value || ""}
                          onChange={controllerField.onChange}
                          onClear={field.onClear}
                        >
                          {filteredOptions.map((option) => (
                            <MenuItem key={String(option.value)} value={String(option.value)}>
                              {option.label}
                            </MenuItem>
                          ))}
                          {filteredOptions.length === 0 && (
                            <MenuItem disabled value="">
                              No options available
                            </MenuItem>
                          )}
                        </MySelect>
                        {errors[field.name] && (
                          <FormHelperText error>{errors[field.name]?.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
                break;

              case "datepicker":
                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <DatePicker
                        label={field.label}
                        format={getPickerDateFormat()}
                        value={controllerField.value || null}
                        onChange={controllerField.onChange}
                        disabled={submitting}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors[field.name],
                            helperText: errors[field.name]?.message as string,
                          },
                        }}
                      />
                    )}
                  />
                );
                break;

              case "multiSelect":
                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl fullWidth error={!!errors[field.name]} disabled={submitting}>
                        <InputLabel required={field.required}>{field.label}</InputLabel>
                        <MySelect
                          label={field.label}
                          multiple
                          value={controllerField.value || []}
                          onChange={controllerField.onChange}
                          renderValue={(selected) => (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {(selected as (string | number)[]).map((value) => {
                                const label = field.renderChip
                                  ? field.renderChip(value, field.options || [])
                                  : field.options?.find((opt) => opt.value === value)?.label || String(value);
                                return (
                                  <Chip
                                    key={String(value)}
                                    label={label}
                                    size="small"
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {field.options?.map((option) => (
                            <MenuItem key={String(option.value)} value={String(option.value)}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </MySelect>
                        {errors[field.name] && (
                          <FormHelperText>{errors[field.name]?.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
                break;

              case "checkbox":
                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl error={!!errors[field.name]} disabled={submitting}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              {...controllerField}
                              checked={controllerField.value || false}
                              autoFocus={field.autoFocus}
                            />
                          }
                          label={field.label}
                          required={field.required}
                        />
                        {errors[field.name] && (
                          <FormHelperText>{errors[field.name]?.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
                break;

              case "switch":
                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl error={!!errors[field.name]} disabled={submitting}>
                        <FormControlLabel
                          control={
                            <Switch
                              {...controllerField}
                              checked={controllerField.value || false}
                              autoFocus={field.autoFocus}
                            />
                          }
                          label={field.label}
                          required={field.required}
                        />
                        {errors[field.name] && (
                          <FormHelperText>{errors[field.name]?.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
                break;

              case "radio":
                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl error={!!errors[field.name]} disabled={submitting}>
                        <FormLabel required={field.required}>{field.label}</FormLabel>
                        <RadioGroup {...controllerField}>
                          {field.options?.map((option) => (
                            <FormControlLabel
                              key={String(option.value)}
                              value={String(option.value)}
                              control={<Radio />}
                              label={option.label}
                            />
                          ))}
                        </RadioGroup>
                        {errors[field.name] && (
                          <FormHelperText>{errors[field.name]?.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
                break;

              case "slider":
                fieldComponent = (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl fullWidth error={!!errors[field.name]} disabled={submitting}>
                        <Typography gutterBottom>{field.label}</Typography>
                        <Slider
                          {...controllerField}
                          min={field.min || 0}
                          max={field.max || 100}
                          step={field.step || 1}
                          valueLabelDisplay="auto"
                          disabled={submitting}
                        />
                        {errors[field.name] && (
                          <FormHelperText>{errors[field.name]?.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
                break;

              default:
                // Text, multiline, number, email, password, date, datetime-local
                fieldComponent = (
                  <AppTextField
                    label={field.label}
                    {...register(field.name)}
                    fieldType={
                      field.type === 'password' ? 'password' :
                      field.type === 'number'   ? 'number'   :
                      field.type === 'email'    ? 'text'     : 'text'
                    }
                    required={field.required}
                    multiline={field.type === "multiline"}
                    rows={field.type === "multiline" ? field.rows || 3 : undefined}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    maxLength={field.maxLength}
                    fullWidth
                    inputRef={field.autoFocus ? autoFocusRef : undefined}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]?.message as string}
                    disabled={submitting}
                    showClearButton={false}
                  />
                );
            }

            return (
              <Grid size={{ xs: 12, sm: gridSize }} key={field.name}>
                {fieldComponent}
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {cancelLabel}
        </Button>
        <LoadingButton
          onClick={submit}
          variant="contained"
          disabled={!isValid}
          loading={submitting}
        >
          {submitLabel || (editing ? "Update" : "Create")}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

export default ReusableFormDialog;