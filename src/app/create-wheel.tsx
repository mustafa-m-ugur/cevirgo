import * as React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { createCustomWheel } from '@/state/custom-wheels';

export default function CreateWheelScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = React.useState('');
  const [items, setItems] = React.useState<string[]>(['', '']);

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
        <ThemedText type="title" style={styles.headerTitle}>
          Çark Oluştur
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
          En az 2 eleman girerek kendi çarkını oluştur. Bu çark kategori listesinde görünecek.
        </ThemedText>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled">
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={styles.fieldLabel}>
              Çark adı
            </ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Örn: Arkadaşlarla Ne Yapsak?"
              placeholderTextColor="#999999"
              style={styles.textInput}
            />

            <ThemedText type="smallBold" style={[styles.fieldLabel, styles.fieldLabelSpacing]}>
              Çark elemanları (min. 2)
            </ThemedText>
            {items.map((value, index) => (
              <TextInput
                key={index}
                value={value}
                onChangeText={(text) => handleChangeItem(index, text)}
                placeholder={`Eleman ${index + 1}`}
                placeholderTextColor="#999999"
                style={styles.textInput}
              />
            ))}

            <ThemedText
              type="linkPrimary"
              style={styles.addItemLink}
              onPress={handleAddItemField}>
              Yeni eleman alanı ekle
            </ThemedText>

            <ThemedText
              type="smallBold"
              style={styles.createButton}
              onPress={handleCreate}>
              Çarkı Oluştur
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
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.three,
  },
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
  },
  fieldLabelSpacing: {
    marginTop: Spacing.two,
  },
  textInput: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#dddddd',
    paddingHorizontal: Spacing.two,
    paddingVertical: Platform.select({ ios: Spacing.two, default: Spacing.one }),
    marginBottom: Spacing.one,
    color: '#000000',
  },
  addItemLink: {
    marginTop: Spacing.one,
  },
  createButton: {
    marginTop: Spacing.three,
    textAlign: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    backgroundColor: '#3c87f7',
    color: '#ffffff',
  },
});

