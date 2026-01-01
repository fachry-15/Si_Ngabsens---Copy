import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomModal from '@/components/CustomModal';
import { InputField } from '@/components/auth/InputField';
import { LoginFooter } from '@/components/auth/LoginFooter';
import { LoginHeader } from '@/components/auth/LoginHeader';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useLoginForm } from '@/hooks/useLoginForm';

export default function LoginScreen(): React.JSX.Element {
  const [showApiSettings, setShowApiSettings] = useState<boolean>(false);
  const {
    step,
    formData,
    showPassword,
    isLoading,
    modal,
    setShowPassword,
    handleContinue,
    handleBack,
    updateFormData,
    hideModal,
  } = useLoginForm();

  return (
    <>
      <CustomModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={hideModal}
      />
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <LoginHeader step={step} nip={formData.nip} />

            <View style={styles.loginCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                {step === 'password' ? (
                  <TouchableOpacity 
                    onPress={handleBack} 
                    style={styles.backButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.backButton} />
                )}

                <Text style={styles.loginTitle}>
                  {step === 'nip' ? 'Masuk Akun' : 'Masukkan Kata Sandi'}
                </Text>
                <View style={styles.backButton} />
              </View>

              <Text style={styles.inputPrompt}>
                {step === 'nip'
                  ? 'Langkah 1/2: Masukkan NIP Anda'
                  : 'Langkah 2/2: Verifikasi Password Anda'}
              </Text>

              {/* Form Input */}
              <View style={styles.inputContainer}>
                {step === 'nip' ? (
                  <>
                    <InputField
                      icon="person-outline"
                      placeholder="Nomor Induk Pegawai (NIP)"
                      value={formData.nip}
                      onChangeText={(text) => updateFormData('nip', text)}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoFocus
                      onSubmitEditing={handleContinue}
                      returnKeyType="next"
                    />
                    <PrimaryButton
                      text="Lanjutkan"
                      icon="arrow-forward"
                      onPress={handleContinue}
                      disabled={!formData.nip.trim()}
                    />
                  </>
                ) : (
                  <>
                    <InputField
                      icon="lock-closed-outline"
                      placeholder="Password Akun"
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      secureTextEntry={!showPassword}
                      autoFocus
                      onSubmitEditing={handleContinue}
                      returnKeyType="done"
                      showPasswordToggle
                      isPasswordVisible={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />
                    <TouchableOpacity 
                      style={styles.forgotPassword}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                    </TouchableOpacity>
                    <PrimaryButton
                      text="Login"
                      icon="log-in-outline"
                      onPress={handleContinue}
                      disabled={!formData.password.trim()}
                      loading={isLoading}
                    />
                  </>
                )}
              </View>

              <LoginFooter onSettingsPress={() => setShowApiSettings(true)} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  keyboardView: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1 
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  loginTitle: { 
    fontSize: 24, 
    fontFamily: 'Fredoka-Bold', 
    color: '#1F2937' 
  },
  backButton: { 
    padding: 8, 
    width: 40 
  },
  inputPrompt: { 
    fontSize: 15, 
    fontFamily: 'Fredoka-Medium', 
    color: '#6B7280', 
    marginBottom: 24 
  },
  inputContainer: { 
    marginBottom: 24 
  },
  forgotPassword: { 
    alignSelf: 'flex-end', 
    marginBottom: 30,
    paddingVertical: 4,
  },
  forgotPasswordText: { 
    fontSize: 14, 
    color: '#2b5597', 
    fontFamily: 'Fredoka-Medium' 
  },
});