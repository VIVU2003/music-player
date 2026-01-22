import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type SortOrder = 'Ascending' | 'Descending';
type SortBy = 'Artist' | 'Album' | 'Year' | 'Date Added' | 'Date Modified' | 'Composer';

type SortModalProps = {
  visible: boolean;
  onClose: () => void;
  sortOrder: SortOrder;
  sortBy: SortBy;
  onSortOrderChange: (order: SortOrder) => void;
  onSortByChange: (by: SortBy) => void;
};

export function SortModal({
  visible,
  onClose,
  sortOrder,
  sortBy,
  onSortOrderChange,
  onSortByChange,
}: SortModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort Order</Text>
            <Pressable
              style={styles.option}
              onPress={() => onSortOrderChange('Ascending')}
            >
              <View style={styles.radio}>
                {sortOrder === 'Ascending' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.optionText}>Ascending</Text>
            </Pressable>
            <Pressable
              style={styles.option}
              onPress={() => onSortOrderChange('Descending')}
            >
              <View style={styles.radio}>
                {sortOrder === 'Descending' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.optionText}>Descending</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {(['Artist', 'Album', 'Year', 'Date Added', 'Date Modified', 'Composer'] as SortBy[]).map((option) => (
              <Pressable
                key={option}
                style={styles.option}
                onPress={() => onSortByChange(option)}
              >
                <View style={styles.radio}>
                  {sortBy === option && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  close: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
