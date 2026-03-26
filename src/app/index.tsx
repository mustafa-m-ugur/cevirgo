import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchWheelCategories, type WheelCategoryDto, type WheelItemDto } from '@/api/wheel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { deleteCustomWheel, getCustomWheels } from '@/state/custom-wheels';
import { BannerAd, BannerAdSize, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

type WheelItem = {
  id: string;
  label: string;
  image?: string | null;
};

type WheelCategory = {
  id: string;
  name: string;
  items: WheelItem[];
  isCustom?: boolean;
};

const BANNER_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-6291745711858744/1139059210',
  android: 'ca-app-pub-6291745711858744/4439680406',
  default: 'ca-app-pub-6291745711858744/4439680406',
});

const REWARDED_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-6291745711858744/2260569195',
  android: 'ca-app-pub-6291745711858744/5308929009',
  default: 'ca-app-pub-6291745711858744/5308929009',
});

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = React.useState<WheelCategory[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isRewardedReady, setIsRewardedReady] = React.useState(false);

  const rewardedAdRef = React.useRef(
    RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    }),
  );

  React.useEffect(() => {
    const rewarded = rewardedAdRef.current;

    const loadedListener = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsRewardedReady(true);
    });

    const earnedListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        navigation.navigate('CreateWheel');
      },
    );

    rewarded.load();

    return () => {
      loadedListener();
      earnedListener();
    };
  }, [navigation]);

  const handleCreateWheelPress = React.useCallback(() => {
    const rewarded = rewardedAdRef.current;

    if (isRewardedReady) {
      rewarded.show();
      setIsRewardedReady(false);
    } else {
      Alert.alert(
        'Reklam hazırlanıyor',
        'Lütfen bir saniye sonra tekrar dene.',
      );
      rewarded.load();
    }
  }, [isRewardedReady]);

  const totalCategories = categories.length;
  const totalItems = React.useMemo(
    () => categories.reduce((sum, c) => sum + c.items.length, 0),
    [categories],
  );
  const customCount = React.useMemo(
    () => categories.filter((c) => c.isCustom).length,
    [categories],
  );

  const handleDeleteCustomCategory = React.useCallback(
    (category: WheelCategory) => {
      Alert.alert(
        'Çarkı sil',
        `"${category.name}" çarkını silmek istediğine emin misin?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: () => {
              deleteCustomWheel(category.id);
              setCategories((prev) => prev.filter((c) => c.id !== category.id));
            },
          },
        ],
      );
    },
    [],
  );

  const loadCategories = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: WheelCategoryDto[] = await fetchWheelCategories();

      const apiCategories: WheelCategory[] = data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: cat.items.map((item: WheelItemDto, index) => ({
          id: item.id ?? `${cat.id}-${index}`,
          label: item.name,
          image: item.image ?? null,
        })),
      }));

      const custom = getCustomWheels().map((c) => ({
        id: c.id,
        name: c.name,
        items: c.items.map((label, index) => ({
          id: `${c.id}-${index}`,
          label,
          image: null,
        })),
        isCustom: true,
      }));

      setCategories([...apiCategories, ...custom]);
    } catch (e) {
      console.error(e);
      setError('Kategoriler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [loadCategories]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.LARGE_BANNER}
      />
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.headerTitle}>
            Bugün Ne Yapsak?
          </ThemedText>
          <Pressable
            onPress={handleCreateWheelPress}
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
            ]}>
            <ThemedText type="smallBold" style={styles.createButtonText}>
              Çark Oluştur
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
          Kategorini seç, çarkı çevir ve bugünün sürprizini öğren.
        </ThemedText>

        <View style={styles.statsRow}>
          <ThemedView type="backgroundElement" style={styles.statPill}>
            <ThemedText type="smallBold">🎯 {totalCategories}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              kategori
            </ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statPill}>
            <ThemedText type="smallBold">🎲 {totalItems}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              toplam seçenek
            </ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statPill}>
            <ThemedText type="smallBold">⭐ {customCount}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              özel çark
            </ThemedText>
          </ThemedView>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled">
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            {/* <ThemedText type="subtitle" style={styles.sectionTitle}>
              🎮 Oyun Alanı
            </ThemedText> */}

            {isLoading && (
              <View style={styles.centerRow}>
                <ActivityIndicator />
                <ThemedText style={styles.loadingText}>Kategoriler yükleniyor...</ThemedText>
              </View>
            )}

            {error && !isLoading && (
              <ThemedText themeColor="textSecondary" style={styles.errorText}>
                {error}
              </ThemedText>
            )}

            {!isLoading && categories.length === 0 && !error && (
              <ThemedText themeColor="textSecondary">
                Henüz gösterilecek kategori yok. İlk çarkını oluşturmak için yukarıdaki butonu
                kullanabilirsin.
              </ThemedText>
            )}

            {categories.length > 0 && (
              <View style={styles.categoryList}>
                {categories.map((category, index) => {
                  const icons = ['🍕', '🎬', '🎉', '🧩', '🏖️', '🎮', '☕️', '📚'];
                  const icon = icons[index % icons.length];
                  return (
                    <Pressable
                      key={category.id}
                      onLongPress={
                        category.isCustom
                          ? () => {
                              handleDeleteCustomCategory(category);
                            }
                          : undefined
                      }
                      onPress={() =>
                        navigation.navigate('Wheel', {
                          name: category.name,
                          items: JSON.stringify(category.items),
                        })
                      }
                      style={({ pressed }) => [
                        styles.categoryItem,
                        pressed && styles.categoryItemPressed,
                        category.isCustom && styles.categoryItemCustom,
                      ]}>
                      <View style={styles.categoryRow}>
                        <View style={styles.categoryIconWrapper}>
                          <ThemedText style={styles.categoryIcon}>{icon}</ThemedText>
                        </View>
                        <View style={styles.categoryTextWrapper}>
                          <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                          <ThemedText
                            type="small"
                            themeColor="textSecondary"
                            style={styles.categoryMeta}>
                            {category.items.length} seçenek
                            {category.isCustom ? ' · Senin çarkın' : ''}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.categoryRight}>
                        <View style={styles.miniWheelOuter}>
                          <View style={styles.miniWheelSliceOne} />
                          <View style={styles.miniWheelSliceTwo} />
                          <View style={styles.miniWheelSliceThree} />
                        </View>
                        <ThemedText style={styles.categoryChevron}>{'›'}</ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ThemedView>

          <View style={{ marginTop: Spacing.three, alignItems: 'center' }}>
            <BannerAd
              unitId={BANNER_UNIT_ID}
              size={BannerAdSize.LARGE_BANNER}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#a148f0',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'stretch',
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  headerTitle: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerSubtitle: {
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
    color: '#F0F0F3',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  statPill: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  contentContainer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  sectionCard: {
    gap: Spacing.three,
    //paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    backgroundColor: '#a148f0',
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    color: '#F0F0F3',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    marginLeft: Spacing.one,
  },
  errorText: {
    marginTop: Spacing.one,
  },
  categoryList: {
    flexDirection: 'column',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  categoryItem: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    //backgroundColor: '#F0F0F3',
    backgroundColor: '#f5880c',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  categoryItemCustom: {
    borderWidth: 1,
    borderColor: '#facc15',
  },
  categoryItemPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  categoryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
    backgroundColor: '#a148f0',
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryTextWrapper: {
    flexShrink: 1,
  },
  categoryName: {
    marginBottom: Spacing.one,
    //color: '#60646C',
    color: '#fff',
    fontSize: 15,
  },
  categoryMeta: {
    marginBottom: 0,
    color: '#ddd',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  miniWheelOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#a148f0',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  miniWheelSliceOne: {
    flex: 1,
    backgroundColor: '#f97316',
  },
  miniWheelSliceTwo: {
    flex: 1,
    backgroundColor: '#22c55e',
  },
  miniWheelSliceThree: {
    flex: 1,
    backgroundColor: '#0ea5e9',
  },
  createButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    backgroundColor: '#f5880c',
  },
  createButtonPressed: {
    opacity: 0.9,
  },
  createButtonText: {
    color: '#ffffff',
  },
  categoryChevron: {
    fontSize: 20,
    //color: '#60646C',
    color: '#fff',
    marginLeft: Spacing.two,
  },
});

