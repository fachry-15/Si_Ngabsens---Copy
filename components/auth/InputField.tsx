import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface InputFieldProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}

export function InputField({
  icon,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
  ...textInputProps
}: InputFieldProps): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <Ionicons name={icon} size={22} color="#9CA3AF" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#9CA3AF"
        selectionColor="#2b5597"
        {...textInputProps}
      />
      {showPasswordToggle && (
        <TouchableOpacity onPress={onTogglePassword} style={styles.eyeButton}>
          <Ionicons
            name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Fredoka-Regular',
  },
  eyeButton: {
    padding: 4,
  },
});