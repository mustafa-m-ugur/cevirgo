import { useRoute } from '@react-navigation/native';
import * as React from 'react';
import { Alert, Animated, Easing, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Wheel } from '@/components/wheel';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
// @ts-ignore - paket yüklenince tipi gelecektir
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

type WheelItem = {
  id: string;
  label: string;
  image?: string | null;
};

type Params = {
  name?: string;
  items?: string;
};

type SpinState = {
  windowStart: number;
  freeSpinsUsed: number;
  bonusSpins: number;
};

const SPIN_STATE_KEY = 'wheel_spin_state_v1';
const WINDOW_MS = 5 * 60 * 60 * 1000; // 5 saat

const REWARDED_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-6291745711858744/2260569195',
  android: 'ca-app-pub-6291745711858744/5308929009',
  default: 'ca-app-pub-6291745711858744/5308929009',
});

const rewardedAd = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});

type RewardMode = 'pay' | 'bonus1' | 'bonus2';

export default function WheelScreen() {
  const route = useRoute<any>();
  const { name, items } = (route.params as Params) ?? {};

  const [isSpinning, setIsSpinning] = React.useState(false);
  const [resultItem, setResultItem] = React.useState<WheelItem | null>(null);
  const [isResultModalVisible, setIsResultModalVisible] = React.useState(false);
  const [spinRange, setSpinRange] = React.useState<{ from: number; to: number }>({
    from: 0,
    to: 0,
  });
  const [remainingSpins, setRemainingSpins] = React.useState<number | null>(null);
  const [isLoadingSpins, setIsLoadingSpins] = React.useState(true);
  const [rewardMode, setRewardMode] = React.useState<RewardMode | null>(null);
  const [isRewardedReady, setIsRewardedReady] = React.useState(false);

  const parsedItems: any[] = React.useMemo(() => {
    if (!items) return [];
    try {
      const arr = JSON.parse(items);
      if (Array.isArray(arr)) {
        return arr;
      }
      return [];
    } catch (e) {
      console.warn('items parse error', e);
      return [];
    }
  }, [items]);

  const wheelItems: WheelItem[] = React.useMemo(
    () =>
      parsedItems.map((item, index) => {
        if (typeof item === 'string') {
          return { id: `item-${index}`, label: item };
        }
        return {
          id: item.id ?? `item-${index}`,
          label: item.label ?? item.name ?? `Seçenek ${index + 1}`,
          image: item.image ?? null,
        } as WheelItem;
      }),
    [parsedItems],
  );

  const spinAnim = React.useRef(new Animated.Value(0)).current;

  const loadSpinState = React.useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SPIN_STATE_KEY);
      const now = Date.now();

      let state: SpinState;
      if (!raw) {
        state = { windowStart: now, freeSpinsUsed: 0, bonusSpins: 0 };
      } else {
        state = JSON.parse(raw) as SpinState;
      }

      if (now - state.windowStart >= WINDOW_MS) {
        state = { ...state, windowStart: now, freeSpinsUsed: 0 };
      }

      const remaining = 2 - state.freeSpinsUsed + state.bonusSpins;
      setRemainingSpins(remaining < 0 ? 0 : remaining);
      setIsLoadingSpins(false);
      await AsyncStorage.setItem(SPIN_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('spin state load error', e);
      setIsLoadingSpins(false);
    }
  }, []);

  const updateSpinState = React.useCallback(
    async (updater: (prev: SpinState) => SpinState) => {
      const now = Date.now();
      const raw = await AsyncStorage.getItem(SPIN_STATE_KEY);
      let current: SpinState;
      if (!raw) {
        current = { windowStart: now, freeSpinsUsed: 0, bonusSpins: 0 };
      } else {
        current = JSON.parse(raw) as SpinState;
      }

      if (now - current.windowStart >= WINDOW_MS) {
        current = { ...current, windowStart: now, freeSpinsUsed: 0 };
      }

      const next = updater(current);
      const remaining = 2 - next.freeSpinsUsed + next.bonusSpins;
      setRemainingSpins(remaining < 0 ? 0 : remaining);
      await AsyncStorage.setItem(SPIN_STATE_KEY, JSON.stringify(next));
    },
    [],
  );

  const consumeOneSpin = React.useCallback(async () => {
    await updateSpinState((state) => {
      if (state.bonusSpins > 0) {
        return { ...state, bonusSpins: state.bonusSpins - 1 };
      }
      const used = Math.min(2, state.freeSpinsUsed + 1);
      return { ...state, freeSpinsUsed: used };
    });
  }, [updateSpinState]);

  const addBonusSpins = React.useCallback(
    async (count: number) => {
      await updateSpinState((state) => ({
        ...state,
        bonusSpins: state.bonusSpins + count,
      }));
    },
    [updateSpinState],
  );

  React.useEffect(() => {
    loadSpinState();
  }, [loadSpinState]);

  const startSpinAnimation = React.useCallback(() => {
    if (!wheelItems || wheelItems.length < 2) {
      Alert.alert('Yetersiz eleman', 'Çarkın en az 2 elemanı olmalı.');
      return;
    }

    if (isSpinning) return;

    const baseSpins = 4;
    const randomExtra = Math.random() * 360;
    const from = spinRange.to;
    const to = from + baseSpins * 360 + randomExtra;

    setSpinRange({ from, to });
    spinAnim.setValue(0);
    setIsSpinning(true);

    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);

      const totalRotationDeg = to;
      let normalized = ((totalRotationDeg % 360) + 360) % 360;
      const sliceDeg = 360 / wheelItems.length;

      // Pointer üstte sabit, tekerlek sağa (clockwise) döndüğü için
      // efektif açı, başlangıca göre -rotation.
      const effective = ((-normalized % 360) + 360) % 360;
      let index = Math.floor(effective / sliceDeg);
      if (index < 0) index = 0;
      if (index >= wheelItems.length) index = wheelItems.length - 1;

      const winner = wheelItems[index];
      setResultItem(winner);
      setIsResultModalVisible(true);
    });
  }, [isSpinning, spinRange.to, spinAnim, wheelItems]);

  React.useEffect(() => {
    const loadedListener = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      // Eğer kullanıcı bir mod seçmişse ve reklam yeni yüklendiyse direkt göster
      if (rewardMode) {
        rewardedAd.show();
        setIsRewardedReady(false);
      } else {
        setIsRewardedReady(true);
      }
    });

    const earnedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        if (rewardMode === 'bonus1') {
          await addBonusSpins(1);
        } else if (rewardMode === 'bonus2') {
          await addBonusSpins(2);
        } else if (rewardMode === 'pay') {
          startSpinAnimation();
        }
        setRewardMode(null);
      },
    );

    const closedListener = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setIsRewardedReady(false);
      rewardedAd.load();
    });

    rewardedAd.load();

    return () => {
      loadedListener();
      earnedListener();
      closedListener();
    };
  }, [addBonusSpins, rewardMode, startSpinAnimation]);

  const startRewardedFlow = React.useCallback(
    (mode: RewardMode) => {
      setRewardMode(mode);
      if (isRewardedReady) {
        rewardedAd.show();
        setIsRewardedReady(false);
      } else {
        Alert.alert('Reklam hazırlanıyor', 'Lütfen bir saniye sonra tekrar dene.');
        // henüz hazır değilse yükle; yüklendiğinde LOADED event'inde otomatik gösterilecek
        rewardedAd.load();
      }
    },
    [isRewardedReady],
  );

  const handleSpin = React.useCallback(async () => {
    if (isSpinning) return;

    if (isLoadingSpins) {
      Alert.alert('Lütfen bekle', 'Hakların yükleniyor, birazdan tekrar dene.');
      return;
    }

    if (remainingSpins !== null && remainingSpins > 0) {
      await consumeOneSpin();
      startSpinAnimation();
      return;
    }

    Alert.alert(
      'Hakların bitti',
      'Devam etmek için bir reklam izlemen gerekiyor.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reklam izle',
          onPress: () => startRewardedFlow('pay'),
        },
      ],
      { cancelable: true },
    );
  }, [consumeOneSpin, isLoadingSpins, isSpinning, remainingSpins, startRewardedFlow, startSpinAnimation]);

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${spinRange.from}deg`, `${spinRange.to}deg`],
  });

  const title = name ?? 'Çark';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.headerTitle}>
            {title}
          </ThemedText>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
          Ortadaki butona basarak çarkı çevir.
        </ThemedText>

        <View style={styles.content}>
          <View style={styles.wheelWrapper}>
            <Wheel
              items={wheelItems}
              rotation={spinRotate}
              onPress={handleSpin}
              disabled={isSpinning}
            />
          </View>
          <View style={styles.infoBox}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
              {isLoadingSpins
                ? 'Hakların yükleniyor...'
                : `Kalan çevirme hakkın: ${remainingSpins ?? 0}`}
            </ThemedText>
            {remainingSpins !== null && remainingSpins > 0 && (
              <Pressable
                style={styles.adButton}
                onPress={() => startRewardedFlow('bonus1')}>
                <ThemedText type="smallBold" style={styles.adButtonText}>
                  Reklam izle (+1 hak)
                </ThemedText>
              </Pressable>
            )}
            {remainingSpins !== null && remainingSpins === 0 && (
              <Pressable
                style={styles.adButtonSecondary}
                onPress={() => startRewardedFlow('bonus2')}>
                <ThemedText type="smallBold" style={styles.adButtonSecondaryText}>
                  Reklam izle (2 hak kazan)
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={isResultModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsResultModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView type="background" style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Çark Sonucu
            </ThemedText>
            {resultItem && (
              <>
                {resultItem.image && (
                  <Image
                    source={{ uri: resultItem.image }}
                    style={styles.modalImage}
                    contentFit="cover"
                  />
                )}
                <ThemedText type="title" style={styles.modalResultText}>
                  {resultItem.label}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.modalHint}>
                  İstersen tekrar çevirerek yeni bir sonuç alabilirsin.
                </ThemedText>
              </>
            )}
            <View style={styles.modalButtonsRow}>
              <ThemedText
                type="linkPrimary"
                onPress={() => {
                  setIsResultModalVisible(false);
                }}>
                Kapat
              </ThemedText>
              <ThemedText
                type="linkPrimary"
                onPress={() => {
                  setIsResultModalVisible(false);
                  handleSpin();
                }}>
                Tekrar Çevir
              </ThemedText>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    // backgroundColor: 'green',
    backgroundColor: '#a148f0',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.six,
  },
  headerTitle: {
    fontSize: 40,
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: Spacing.one,
    // marginBottom: Spacing.one,
    color: '#F0F0F3',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    marginTop: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoText: {
    textAlign: 'center',
    color: '#fff',
  },
  adButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    backgroundColor: '#f97316',
  },
  adButtonText: {
    color: '#ffffff',
  },
  adButtonSecondary: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    backgroundColor: '#22c55e',
  },
  adButtonSecondaryText: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    maxWidth: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  modalResultText: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  modalHint: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.two,
  },
});

