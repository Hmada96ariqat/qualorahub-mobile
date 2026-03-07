import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  I18nManager,
  useWindowDimensions,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme/tokens';
import { HeaderIconButton } from '../primitives/HeaderIconButton';

type DrawerSheetProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onDismiss: () => void;
  widthRatio?: number;
  maxWidth?: number;
  testID?: string;
};

const ANIMATION_DURATION_MS = 180;

export function DrawerSheet({
  visible,
  title,
  subtitle,
  children,
  footer,
  onDismiss,
  widthRatio = 0.82,
  maxWidth = 360,
  testID,
}: DrawerSheetProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isRTL = I18nManager.isRTL;
  const drawerWidth = useMemo(
    () => Math.min(screenWidth * widthRatio, maxWidth),
    [maxWidth, screenWidth, widthRatio],
  );
  const translateX = useRef(new Animated.Value(isRTL ? drawerWidth : -drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (!mounted) {
      translateX.setValue(isRTL ? drawerWidth : -drawerWidth);
      backdropOpacity.setValue(0);
    }
  }, [backdropOpacity, drawerWidth, isRTL, mounted, translateX]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.setValue(isRTL ? drawerWidth : -drawerWidth);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isRTL ? drawerWidth : -drawerWidth,
        duration: ANIMATION_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, drawerWidth, isRTL, mounted, translateX, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      transparent
      visible
      onRequestClose={onDismiss}
      animationType="none"
      statusBarTranslucent
    >
      <View style={[styles.modalRoot, isRTL ? styles.modalRootRtl : null]}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
            testID={testID ? `${testID}.backdrop` : 'drawer-sheet.backdrop'}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            isRTL ? styles.panelRtl : null,
            {
              width: drawerWidth,
              transform: [{ translateX }],
            },
          ]}
          testID={testID}
        >
          <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={[styles.header, isRTL ? styles.headerRtl : null]}>
              <View style={styles.copy}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <HeaderIconButton icon="close" onPress={onDismiss} testID={testID ? `${testID}.close` : undefined} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  modalRootRtl: {
    flexDirection: 'row-reverse',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 38, 31, 0.32)',
  },
  panel: {
    height: '100%',
    backgroundColor: palette.surface,
    borderRightWidth: 1,
    borderRightColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  panelRtl: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: palette.border,
    shadowOffset: { width: -6, height: 0 },
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerRtl: {
    flexDirection: 'row-reverse',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  subtitle: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
});
