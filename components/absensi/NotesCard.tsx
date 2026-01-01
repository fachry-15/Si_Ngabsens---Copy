import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InfoRow } from './InfoRow';

interface NotesCardProps {
  notes: string;
}

export const NotesCard: React.FC<NotesCardProps> = ({ notes }) => {
  if (!notes || notes === 'null') return null;
  
  return (
    <View style={styles.container}>
      <InfoRow 
        iconName="document-text-outline" 
        label="Catatan" 
        value={notes} 
        isNotes 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
});