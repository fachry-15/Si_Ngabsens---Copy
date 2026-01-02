import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface LocationSuccessModalProps {
  visible: boolean;
  areaName: string;
  onClose: () => void;
}

export function LocationSuccessModal({
  visible,
  areaName,
  onClose,
}: LocationSuccessModalProps): React.JSX.Element {
  const scaleAnim = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      scaleAnim.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        2,
        false
      );
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.iconCircle, animatedIconStyle]}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </Animated.View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Lokasi Terverifikasi</Text>
            <Text style={styles.subtitle}>
              Anda berada di area yang benar
            </Text>

            {/* Location Info Card */}
            <View style={styles.locationCard}>
              <View style={styles.locationIconWrapper}>
                <Ionicons name="location" size={24} color="#2D8A61" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Lokasi Saat Ini</Text>
                <Text style={styles.locationName}>{areaName}</Text>
              </View>
            </View>

            {/* Info Items */}
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
                <Text style={styles.infoText}>Lokasi Valid</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={18} color="#059669" />
                <Text style={styles.infoText}>Siap Absen</Text>
              </View>
            </View>
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Lanjutkan</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    backgroundColor: '#ECFDF5',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#A7F3D0',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Fredoka-Bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Fredoka-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: 'Fredoka-Medium',
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  locationName: {
    fontSize: 16,
    fontFamily: 'Fredoka-Bold',
    color: '#1E293B',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Fredoka-Medium',
    color: '#059669',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2D8A61',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2D8A61',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Fredoka-Bold',
    color: '#FFFFFF',
  },
});
