import React from "react";
import { View, StyleSheet, Pressable, Modal, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { languages, Language } from "@/constants/mockData";

interface LanguageSelectorProps {
  label: string;
  selectedCode: string;
  onSelect: (code: string) => void;
}

export function LanguageSelector({ label, selectedCode, onSelect }: LanguageSelectorProps) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = React.useState(false);
  
  const selectedLanguage = languages.find((l) => l.code === selectedCode);

  const handleSelect = (code: string) => {
    onSelect(code);
    setModalVisible(false);
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <Pressable
      style={({ pressed }) => [
        styles.languageItem,
        { 
          backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault,
          borderBottomColor: theme.border,
        },
        item.code === selectedCode && { backgroundColor: theme.backgroundSecondary },
      ]}
      onPress={() => handleSelect(item.code)}
    >
      <ThemedText style={styles.languageName}>{item.nameEn}</ThemedText>
      <ThemedText style={[styles.languageNative, { color: theme.textSecondary }]}>
        {item.name}
      </ThemedText>
      {item.code === selectedCode ? (
        <Feather name="check" size={20} color={theme.primary} style={styles.checkIcon} />
      ) : null}
    </Pressable>
  );

  return (
    <>
      <View style={styles.container}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.selector,
            {
              backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <ThemedText style={styles.selectedText}>
            {selectedLanguage?.nameEn || "Select"}
          </ThemedText>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <ThemedText type="h4">Select Language</ThemedText>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            renderItem={renderLanguageItem}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: Spacing.inputHeight,
  },
  selectedText: {
    ...Typography.bodyMedium,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  listContent: {
    paddingBottom: Spacing["4xl"],
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  languageName: {
    flex: 1,
    ...Typography.body,
  },
  languageNative: {
    ...Typography.small,
    marginRight: Spacing.md,
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
});
