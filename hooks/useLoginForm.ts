import { authService } from '@/services/authService';
import { authStore } from '@/store/authStore';
import { LoginFormData, LoginStep, ModalState } from '@/types/auth';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

interface UseLoginFormReturn {
  step: LoginStep;
  formData: LoginFormData;
  showPassword: boolean;
  isLoading: boolean;
  modal: ModalState;
  setShowPassword: (show: boolean) => void;
  handleContinue: () => Promise<void>;
  handleBack: () => void;
  updateFormData: (field: keyof LoginFormData, value: string) => void;
  hideModal: () => void;
}

export function useLoginForm(): UseLoginFormReturn {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('nip');
  const [formData, setFormData] = useState<LoginFormData>({ nip: '', password: '' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<ModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = useCallback(
    (
      type: 'success' | 'error' | 'info',
      title: string,
      message: string,
      onClose?: () => void
    ): void => {
      setModal({ visible: true, type, title, message, onClose });
    },
    []
  );

  const hideModal = useCallback((): void => {
    setModal((prev) => ({ ...prev, visible: false }));
    if (modal.onClose) {
      modal.onClose();
    }
  }, [modal.onClose]);

  const handleContinue = useCallback(async (): Promise<void> => {
    // Step 1: NIP validation
    if (step === 'nip' && formData.nip.trim()) {
      setStep('password');
      return;
    }

    // Step 2: Password validation and login
    if (step === 'password' && formData.password.trim()) {
      setIsLoading(true);

      try {
        const response = await authService.login({
          nip: formData.nip.trim(),
          password: formData.password.trim(),
        });

        if (response.success && response.data) {
          await authStore.login(response.data.token, response.data.user);
          showModal(
            'success',
            'Login Berhasil',
            `Selamat datang, ${response.data.user.name} 👋`,
            () => router.replace('/(tabs)')
          );
        } else {
          showModal('error', 'Login Gagal', response.message || 'NIP atau password salah');
        }
      } catch (error) {
        showModal('error', 'Kesalahan Sistem', 'Tidak dapat terhubung ke server');
      } finally {
        setIsLoading(false);
      }
    }
  }, [step, formData, showModal, router]);

  const handleBack = useCallback((): void => {
    if (step === 'password') {
      setStep('nip');
      setFormData((prev) => ({ ...prev, password: '' }));
    }
  }, [step]);

  const updateFormData = useCallback((field: keyof LoginFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
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
  };
}