import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { createCustomWheel } from '@/state/custom-wheels';

export default function CreateWheelScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = React.useState('');
  const [items, setItems] = React.useState<string[]>(['', '']);
  const filledItemCount = React.useMemo(() => items.map((i) => i.trim()).filter(Boolean).length, [items]);

  const handleAddItemField = () => {
    setItems((prev) => [...prev, '']);
  };

  const handleChangeItem = (index: number, value: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleCreate = () => {
    const trimmedName = name.trim();
    const trimmedItems = items.map((i) => i.trim()).filter(Boolean);

    if (!trimmedName) {
      Alert.alert('Eksik bilgi', 'Lütfen bir çark adı gir.');
      return;
    }

    if (trimmedItems.length < 2) {
      Alert.alert('Eksik eleman', 'Çarkın en az 2 elemanı olmalı.');
      return;
    }

    const created = createCustomWheel(trimmedName, trimmedItems);

    Alert.alert('Çark oluşturuldu', `"${created.name}" kategorilere eklendi.`, [
      {
        text: 'Tamam',
        onPress: () => {
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <ThemedText type="title" style={styles.headerTitle}>
              Çarkını Tasarla
            </ThemedText>
            <ThemedText type="small" style={styles.headerSubtitle}>
              Kategori listesinde görünecek kendi özel çarkını oluştur.
            </ThemedText>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <ThemedText type="smallBold" style={styles.statValue}>
                  {filledItemCount}
                </ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  Dolu eleman
                </ThemedText>
              </View>
              <View style={styles.statPill}>
                <ThemedText type="smallBold" style={styles.statValue}>
                  {Math.max(0, 2 - filledItemCount)}
                </ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  Gerekli minimum
                </ThemedText>
              </View>
            </View>
          </View>

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Çark Bilgileri
            </ThemedText>

            <ThemedText type="smallBold" style={styles.fieldLabel}>
              Çark adı
            </ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Orn: Arkadaslarla Ne Yapsak?"
              placeholderTextColor="#7b7f87"
              style={styles.textInput}
            />

            <View style={styles.itemsHeaderRow}>
              <ThemedText type="smallBold" style={[styles.fieldLabel, styles.fieldLabelSpacing]}>
                Çark elemanları
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Min. 2 adet
              </ThemedText>
            </View>

            {items.map((value, index) => (
              <View key={index} style={styles.inputRow}>
                <View style={styles.inputIndexPill}>
                  <ThemedText type="smallBold" style={styles.inputIndexText}>
                    {index + 1}
                  </ThemedText>
                </View>
                <TextInput
                  value={value}
                  onChangeText={(text) => handleChangeItem(index, text)}
                  placeholder={`Eleman ${index + 1}`}
                  placeholderTextColor="#7b7f87"
                  style={styles.itemInput}
                />
              </View>
            ))}

            <Pressable style={({ pressed }) => [styles.addItemButton, pressed && styles.pressed]} onPress={handleAddItemField}>
              <ThemedText type="smallBold" style={styles.addItemButtonText}>
                + Yeni eleman ekle
              </ThemedText>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.createButton, pressed && styles.pressed]} onPress={handleCreate}>
              <ThemedText type="smallBold" style={styles.createButtonText}>
                Çarkı Oluştur
              </ThemedText>
            </Pressable>

            <ThemedText type="small" themeColor="textSecondary" style={styles.footerHint}>
              Oluşturduğun çark ana ekrandaki kategori listesine otomatik eklenir.
            </ThemedText>
          </ThemedView>
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
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  heroCard: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: '#7b36b8',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: Spacing.two,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 38,
  },
  headerSubtitle: {
    color: '#f1e9ff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  statPill: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
  },
  statLabel: {
    color: '#f1e9ff',
  },
  formCard: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionTitle: {
    fontSize: 16,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
  },
  fieldLabelSpacing: {
    marginTop: Spacing.two,
    marginBottom: 0,
  },
  textInput: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#d7d9df',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.two,
    paddingVertical: Platform.select({ ios: Spacing.two, default: Spacing.one }),
    color: '#141414',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inputIndexPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ebe0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIndexText: {
    color: '#6c2ea8',
  },
  itemInput: {
    flex: 1,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#d7d9df',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.two,
    paddingVertical: Platform.select({ ios: Spacing.two, default: Spacing.one }),
    color: '#141414',
  },
  addItemButton: {
    marginTop: Spacing.one,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#d9c2f8',
    backgroundColor: '#ffffff',
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  addItemButtonText: {
    color: '#7b36b8',
  },
  createButton: {
    marginTop: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: '#f5880c',
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
  },
  footerHint: {
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

