import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const FormInput: React.FC<FormInputProps> = ({ style, ...props }) => (
  <TextInput
    style={[styles.input, style]}
    {...props}
  />
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
});