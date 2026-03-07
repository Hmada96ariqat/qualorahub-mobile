import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { Icon } from 'react-native-paper';
import { useAppI18n } from '../../hooks/useAppI18n';
import { useAppLocalization } from '../../hooks/useAppLocalization';
import { palette, radius, spacing, typography } from '../../theme/tokens';
import { ActionSheet } from '../overlays/ActionSheet';

type HeaderLanguageSwitcherProps = {
  displayMode?: 'auto' | 'compact' | 'full';
  testID?: string;
};

export function HeaderLanguageSwitcher({
  displayMode = 'auto',
  testID = 'header-language-switcher',
}: HeaderLanguageSwitcherProps) {
  const { width } = useWindowDimensions();
  const { t } = useAppI18n();
  const { language, getLanguageOption, setLanguage, supportedLanguages } = useAppLocalization();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);

  const currentLanguage = getLanguageOption(language);
  const showLabel =
    displayMode === 'full' || (displayMode === 'auto' && width >= 390);

  const buttonLabel = useMemo(() => {
    if (displayMode === 'compact' || !showLabel) {
      return currentLanguage.flag;
    }

    return `${currentLanguage.flag} ${currentLanguage.label}`;
  }, [currentLanguage.flag, currentLanguage.label, displayMode, showLabel]);

  async function handleLanguageChange(nextLanguage: string) {
    if (nextLanguage === language || pendingLanguage) {
      return;
    }

    setSheetVisible(false);
    setPendingLanguage(nextLanguage);

    try {
      await setLanguage(nextLanguage as typeof language);
    } catch (error) {
      Alert.alert(
        t('system', 'language.title', 'Display language'),
        error instanceof Error
          ? error.message
          : t(
              'system',
              'language.changeFailed',
              'Language preference could not be updated. Please try again.',
            ),
      );
    } finally {
      setPendingLanguage(null);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setSheetVisible(true)}
        disabled={Boolean(pendingLanguage)}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          pendingLanguage && styles.buttonDisabled,
        ]}
        testID={testID}
      >
        <Icon source="translate" size={18} color={palette.foreground} />
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            displayMode === 'compact' || !showLabel ? styles.compactLabel : null,
          ]}
        >
          {buttonLabel}
        </Text>
      </Pressable>

      <ActionSheet
        visible={sheetVisible}
        title={t('system', 'language.title', 'Display language')}
        message={t(
          'system',
          'language.directionChangeHint',
          'The app reloads automatically when the layout direction changes.',
        )}
        actions={supportedLanguages.map((option) => ({
          key: option.code,
          label: `${option.flag} ${option.label}`,
          onPress: () => {
            void handleLanguageChange(option.code);
          },
          disabled: Boolean(pendingLanguage) || option.code === language,
          testID: `${testID}.${option.code}`,
        }))}
        onDismiss={() => setSheetVisible(false)}
        cancelLabel={t('common', 'cancel', 'Cancel')}
        testID={`${testID}.sheet`}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 56,
    maxWidth: 154,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    backgroundColor: palette.muted,
  },
  label: {
    ...typography.button,
    color: palette.foreground,
    flexShrink: 1,
  },
  compactLabel: {
    minWidth: 20,
    textAlign: 'center',
  },
});
