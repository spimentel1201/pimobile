import React from 'react';
import { View, Modal as RNModal, StyleSheet } from 'react-native';

interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
  onRequestClose?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  children,
  onRequestClose
}) => {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {children}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
});