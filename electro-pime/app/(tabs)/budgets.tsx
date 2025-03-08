import React from 'react';
import { View } from 'react-native';
import BudgetsScreen from '../screens/BudgetsScreen';

export default function BudgetsPage() {
  return (
    <View style={{ flex: 1 }}>
      <BudgetsScreen />
    </View>
  );
}