import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomModalProps {
  visible: boolean;
  type?: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

const ICONS = {
  success: { name: 'checkmark-circle', color: '#10B981' },
  error: { name: 'close-circle', color: '#EF4444' },
  info: { name: 'information-circle', color: '#2D8A61' },
};

export default function CustomModal({
  visible,
  type = 'info',
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
}: CustomModalProps) {
  const icon = ICONS[type];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Ionicons name={icon.name as any} size={48} color={icon.color} style={{ marginBottom: 12 }} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onConfirm || onClose}>
            <Text style={styles.buttonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 320,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2D8A61',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
