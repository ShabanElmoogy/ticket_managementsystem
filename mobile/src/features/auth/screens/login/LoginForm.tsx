import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import { AppTextInput, AppButton } from '@/src/shared/components';

export interface LoginFormProps {
  email:          string;
  onEmailChange:  (v: string) => void;
  password:       string;
  onPasswordChange: (v: string) => void;
  error?:         string;
  loading:        boolean;
  onSubmit:       () => void;
}

/**
 * LoginForm — email + password fields, error banner, and submit button.
 */
const LoginForm: React.FC<LoginFormProps> = ({
  email, onEmailChange,
  password, onPasswordChange,
  error, loading, onSubmit,
}) => {
  const c     = useThemeColors();
  const { t } = useTranslation();

  return (
    <View>
      {/* Email */}
      <AppTextInput
        label={t('auth.emailLabel')}
        fieldType="email"
        value={email}
        onChangeText={onEmailChange}
        placeholder={t('auth.emailPlaceholder')}
        autoCapitalize="none"
        editable={!loading}
      />

      {/* Password */}
      <AppTextInput
        label={t('auth.passwordLabel')}
        fieldType="password"
        value={password}
        onChangeText={onPasswordChange}
        placeholder="••••••••"
        editable={!loading}
      />

      {/* Error */}
      {!!error && (
        <View style={[styles.errorBox, { backgroundColor: c.intent.errorSurface, borderColor: c.intent.error }]}>
          <Text style={[styles.errorText, { color: c.intent.error }]}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      <AppButton
        variant="contained"
        size="large"
        fullWidth
        loading={loading}
        loadingText={t('auth.signingIn')}
        onPress={onSubmit}
        style={styles.submitBtn}
      >
        {t('auth.signInButton')}
      </AppButton>
    </View>
  );
};

const styles = StyleSheet.create({
  eyebrow: {
    fontSize:      11,
    fontWeight:    '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign:     'center',
    marginBottom:  4,
  },
  title: {
    fontSize:     22,
    fontWeight:   'bold',
    textAlign:    'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize:     13,
    textAlign:    'center',
    marginBottom: 18,
  },
  errorBox: {
    borderWidth:       1,
    borderRadius:      8,
    paddingHorizontal: 12,
    paddingVertical:   10,
    marginBottom:      12,
  },
  errorText: { fontSize: 14 },
  submitBtn: { marginTop: 4 },
});

export default LoginForm;
