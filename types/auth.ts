export type LoginStep = 'nip' | 'password';

export interface ModalState {
  visible: boolean;
  type?: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose?: () => void;
}

export interface LoginFormData {
  nip: string;
  password: string;
}