import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Pastikan komponen dan service ini tersedia di project Anda
import ApiSettingsModal from '@/components/ApiSettingsModal';
import { authService } from '@/services/authService';
import { authStore } from '@/store/authStore';

const FONT = {
  REGULAR: 'Fredoka-Regular',
  MEDIUM: 'Fredoka-Medium',
  SEMIBOLD: 'Fredoka-SemiBold',
  BOLD: 'Fredoka-Bold',
};

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'nip' | 'password'>('nip');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  const handleContinue = async () => {
    if (step === 'nip' && nip.trim()) {
      setStep('password');
    } else if (step === 'password' && password.trim()) {
      setIsLoading(true);

      try {
        const response = await authService.login({
          nip: nip.trim(),
          password: password.trim(),
        });

        if (response.success && response.data) {
          await authStore.login(response.data.token, response.data.user);
          router.replace('/(tabs)');
        } else {
          Alert.alert('Login Gagal', response.message || 'NIP atau password salah');
        }
      } catch (error) {
        console.error("Login Error:", error);
        Alert.alert('Error', 'Terjadi kesalahan saat login');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'password') {
      setStep('nip');
      setPassword('');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Illustration */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationBg}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop' }}
                  style={styles.illustration}
                />
                <View style={styles.overlay} />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Selamat Datang</Text>
                  <Text style={styles.headerSubtitle}>
                    {step === 'nip' ? 'Sistem Absensi Karyawan' : `Masuk sebagai ${nip}`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              <View style={styles.cardHeader}>
                {step === 'password' ? (
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                  </TouchableOpacity>
                ) : <View style={styles.backButton} />}
                
                <Text style={styles.loginTitle}>
                  {step === 'nip' ? 'Masuk Akun' : 'Masukkan Kata Sandi'}
                </Text>
                <View style={styles.backButton} />
              </View>

              <Text style={styles.inputPrompt}>
                {step === 'nip' ? 'Langkah 1/2: Masukkan NIP Anda' : 'Langkah 2/2: Verifikasi Password Anda'}
              </Text>

              {/* Input Step Logic */}
              {step === 'nip' ? (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={22} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nomor Induk Pegawai (NIP)"
                      value={nip}
                      onChangeText={setNip}
                      // --- PERUBAHAN DISINI: keyboardType diubah ke default & autoCapitalize ditambahkan ---
                      keyboardType="default" 
                      autoCapitalize="none"
                      // ----------------------------------------------------------------------------------
                      placeholderTextColor="#9CA3AF"
                      autoFocus
                      selectionColor="#2b5597"
                      onSubmitEditing={handleContinue}
                      returnKeyType="next"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.continueButton, !nip.trim() && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={!nip.trim()}
                  >
                    <Text style={styles.continueButtonText}>Lanjutkan</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password Akun"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#9CA3AF"
                      autoFocus
                      selectionColor="#2b5597"
                      onSubmitEditing={handleContinue}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.continueButton, (!password.trim() || isLoading) && styles.continueButtonDisabled]}
                    onPress={handleContinue}
                    disabled={!password.trim() || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.continueButtonText}>Login</Text>
                        <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <Image
                  source={require('@/assets/images/logo-pal.png')}
                  style={styles.footerLogo}
                  resizeMode="contain"
                />
                <Text style={styles.footerText}>PT PAL Indonesia</Text>
                <Text style={styles.footerSubtext}>Sistem Absensi Karyawan</Text>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => setShowApiSettings(true)}
                >
                  <Ionicons name="settings-outline" size={16} color="#2b5597" />
                  <Text style={styles.settingsButtonText}>Pengaturan API</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <ApiSettingsModal
          visible={showApiSettings}
          onClose={() => setShowApiSettings(false)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  illustrationContainer: {
    height: 260,
    backgroundColor: '#F5F7FA',
  },
  illustrationBg: {
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43, 85, 151, 0.88)',
  },
  headerTextContainer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: FONT.BOLD,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: FONT.MEDIUM,
    color: '#E0E7FF',
    lineHeight: 22,
  },
  loginCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontFamily: FONT.BOLD,
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  inputPrompt: {
    fontSize: 15,
    fontFamily: FONT.MEDIUM,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: FONT.REGULAR,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#2b5597',
    fontFamily: FONT.MEDIUM,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 17,
    fontFamily: FONT.BOLD,
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerLogo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 15,
    fontFamily: FONT.BOLD,
    color: '#2b5597',
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 13,
    fontFamily: FONT.REGULAR,
    color: '#6B7280',
    marginBottom: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  settingsButtonText: {
    fontSize: 12,
    color: '#2b5597',
    fontFamily: FONT.MEDIUM,
  },
});